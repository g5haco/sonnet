import { extractText as pdfText, getDocumentProxy } from "unpdf";

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
