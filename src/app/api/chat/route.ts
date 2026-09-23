import { needsThinking, streamReply, studentContext, type Turn } from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60; // free models can reason for a while before answering

// POST { messages: Turn[], timeZone, think?, focus? } → NDJSON stream (see streamReply).
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) return Response.json({ error: "Sign in first." }, { status: 401 });

  // Validate at the trust boundary: the client decides what history to send, not what shape it has.
  const body = await request.json().catch(() => null);
  const turns: Turn[] = Array.isArray(body?.messages)
    ? body.messages
        .filter(
          (m: Turn) =>
            (m?.role === "user" || m?.role === "assistant") && typeof m.content === "string" && m.content.trim(),
        )
        .slice(-12)
        .map((m: Turn) => ({ role: m.role, content: m.content.slice(0, 4000) }))
    : [];
  if (turns.at(-1)?.role !== "user") return Response.json({ error: "Send a question." }, { status: 400 });

  let timeZone = typeof body?.timeZone === "string" ? body.timeZone : "UTC";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
  } catch {
    timeZone = "UTC";
  }

  // Think toggle forces careful mode; otherwise the question decides.
  const think = body?.think === true || needsThinking(turns.at(-1)!.content);
  // Optional course focus from the chat page (a course code); studentContext ignores unknown codes.
  const focus = typeof body?.focus === "string" ? body.focus.slice(0, 40) : undefined;
  return streamReply(await studentContext(supabase, timeZone, focus), turns, think);
}
