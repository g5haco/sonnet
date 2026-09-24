import { extractText as pdfText, getDocumentProxy } from "unpdf";
import { BASE, VISION_MODEL } from "./ai";

const PHOTO = /^image\/(jpeg|png|webp|gif)$/;

// Plain text from an uploaded material, so the assistant can read it. PDFs go through pdf.js
// (pure JS, no native code); text/markdown as-is. Photos, and PDFs with no text layer (scans), are
// transcribed by the vision model. Word/PowerPoint return null for now. Capped to fit materials.body.
export async function extractText(bytes: Uint8Array, mime: string): Promise<string | null> {
  let text: string | null;
  if (mime === "application/pdf") {
    const { text: pages } = await pdfText(await getDocumentProxy(bytes.slice()), { mergePages: true });
    // A scan has at most stray characters; ask the vision model, keeping what pdf.js found if it fails.
    text = pages.replace(/\s/g, "").length >= 50 ? pages : ((await transcribe(bytes, mime)) ?? pages);
  } else if (mime === "text/plain" || mime === "text/markdown") {
    text = new TextDecoder().decode(bytes);
  } else if (PHOTO.test(mime)) {
    text = await transcribe(bytes, mime);
  } else return null;
  text =
    text
      ?.replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim() ?? null;
  return text ? text.slice(0, 100_000) : null;
}

// One vision call: an exact transcription, nothing else. Null when there's no key, it fails, or it finds no text.
async function transcribe(bytes: Uint8Array, mime: string): Promise<string | null> {
  const key = process.env.AI_API_KEY;
  if (!key) return null;
  const data = `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`;
  const file =
    mime === "application/pdf"
      ? { type: "file", file: { filename: "upload.pdf", file_data: data } }
      : { type: "image_url", image_url: { url: data } };
  const res = await fetch(`${BASE}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    signal: AbortSignal.timeout(50_000),
    body: JSON.stringify({
      model: VISION_MODEL,
      reasoning: { effort: "minimal" }, // Gemini requires some reasoning
      max_tokens: 16_000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "Transcribe all text in this document exactly, in reading order, as plain text. Keep dates, " +
                "numbers and headings; write tables as lines. Describe diagrams in one short line in [brackets]. " +
                "Output only the transcription. If there is no text, output nothing.",
            },
            file,
          ],
        },
      ],
    }),
  }).catch(() => null);
  if (!res?.ok) {
    console.error("[extract] vision", res?.status, await res?.text().catch(() => ""));
    return null;
  }
  const json = await res.json().catch(() => null);
  const out = json?.choices?.[0]?.message?.content;
  return typeof out === "string" ? out : null;
}
