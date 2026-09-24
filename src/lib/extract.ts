import { extractText as pdfText, getDocumentProxy } from "unpdf";
import { complete, VISION_MODEL } from "./ai";

// Plain text from an uploaded material, so the assistant can read it. PDFs go through pdf.js
// (pure JS, no native code); text/markdown as-is. Other types (Word, PowerPoint, images) return
// null for now. Capped to fit materials.body.
export async function extractText(bytes: Uint8Array, mime: string): Promise<string | null> {
  let text: string;
  if (mime === "application/pdf") {
    const { text: pages } = await pdfText(await getDocumentProxy(bytes), { mergePages: true });
    text = pages;
  } else if (mime === "text/plain" || mime === "text/markdown") {
    text = new TextDecoder().decode(bytes);
  } else return null;
  text = text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  return text ? text.slice(0, 100_000) : null;
}

// Photos and scanned PDFs have no text layer: the vision model transcribes them instead.
// ponytail: one call on the whole file (<= 10 MB); page-by-page if long scans come back truncated.
export async function visionText(bytes: Uint8Array, mime: string, name: string): Promise<string | null> {
  const pdf = mime === "application/pdf";
  if (bytes.length > 10_000_000 || !(pdf || /^image\/(jpeg|png|webp|gif)$/.test(mime))) return null;
  const data = `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`;
  const text = await complete({
    model: VISION_MODEL,
    temperature: 0,
    max_tokens: 8000,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Transcribe all the text in this course material, in reading order, as plain text. Keep headings, lists and table rows on their own lines. Describe diagrams in one short line. Output only the transcription.",
          },
          pdf ? { type: "file", file: { filename: name, file_data: data } } : { type: "image_url", image_url: { url: data } },
        ],
      },
    ],
  });
  return text ? text.slice(0, 100_000) : null;
}
