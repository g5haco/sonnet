// Files attached in the chat, prepared in the browser before sending: photos are shrunk to a JPEG the vision
// model reads well (and the request stays small); PDFs and text files become text, which stays in the
// conversation so follow-up questions still see it.

export type ChatFile = { name: string; image?: string; text?: string };

export const MAX_FILES = 3;
const MAX_SIDE = 1600; // px; plenty for handwriting and slides
const MAX_TEXT = 40_000; // characters per file

async function shrink(file: File) {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) throw new Error(`${file.name}: this image type can't be read. Try a JPG or PNG.`);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.85);
}

export async function readAttachment(file: File): Promise<ChatFile> {
  if (file.size > 20 * 1024 * 1024) throw new Error(`${file.name} is over 20 MB.`);
  if (file.type.startsWith("image/")) return { name: file.name, image: await shrink(file) };
  let text: string;
  if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
    const { extractText, getDocumentProxy } = await import("unpdf"); // only loaded when a PDF is attached
    const pdf = await getDocumentProxy(new Uint8Array(await file.arrayBuffer()));
    text = (await extractText(pdf, { mergePages: true })).text;
  } else if (file.type.startsWith("text/") || /\.(md|txt)$/i.test(file.name)) {
    text = await file.text();
  } else throw new Error(`${file.name}: attach a photo, a PDF or a text file.`);
  text = text
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!text) throw new Error(`${file.name} has no text to read (a scanned PDF?). Attach photos of the pages instead.`);
  return { name: file.name, text: text.slice(0, MAX_TEXT) };
}

// What the model sees for a user turn: the question, then each file's text (images travel separately).
export const withFiles = (text: string, files: ChatFile[] = []) =>
  [text, ...files.map((f) => (f.text ? `[Attached file: ${f.name}]\n${f.text}` : `[Attached image: ${f.name}]`))]
    .filter(Boolean)
    .join("\n\n");
