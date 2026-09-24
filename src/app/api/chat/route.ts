import { needsThinking, streamReply, studentContext, type Turn } from "@/lib/ai";
import { typedPart } from "@/lib/attach";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60; // free models can reason for a while before answering

// POST { messages: Turn[], timeZone, think?, focus? } → NDJSON stream (see streamReply).
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) return Response.json({ error: "Sign in first." }, { status: 401 });

  // Validate at the trust boundary: the client decides what history to send, not what shape it has.
  const body = await request.json().catch(() => null);
  // A student turn can carry attached files' text (up to 3 × 40k); photos travel as data: URLs, at most 3 in
  // all (newest first), each a JPEG/PNG/WebP/GIF under ~3 MB, which the browser already shrank.
  let photos = 3;
  const turns: Turn[] = Array.isArray(body?.messages)
    ? body.messages
        .filter(
          (m: Turn) =>
            (m?.role === "user" || m?.role === "assistant") && typeof m.content === "string" && m.content.trim(),
        )
        .slice(-12)
        .reverse()
        .map((m: Turn) => {
          const images = (Array.isArray(m.images) ? m.images : [])
            .filter(
              (u) =>
                typeof u === "string" &&
                u.length < 4_000_000 &&
                /^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(u),
            )
            .slice(0, m.role === "user" ? Math.max(photos, 0) : 0);
          photos -= images.length;
          return {
            role: m.role,
            content: m.content.slice(0, m.role === "user" ? 125_000 : 8_000),
            ...(images.length ? { images } : {}),
          };
        })
        .reverse()
    : [];
  if (turns.at(-1)?.role !== "user") return Response.json({ error: "Send a question." }, { status: 400 });

  let timeZone = typeof body?.timeZone === "string" ? body.timeZone : "UTC";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
  } catch {
    timeZone = "UTC";
  }

  // Think toggle forces careful mode; otherwise the question decides.
  const think = body?.think === true || needsThinking(typedPart(turns.at(-1)!.content));
  // Optional course focus from the chat page (a course code); studentContext ignores unknown codes.
  const focus = typeof body?.focus === "string" ? body.focus.slice(0, 40) : undefined;
  return streamReply(await studentContext(supabase, timeZone, focus), turns, think);
}
