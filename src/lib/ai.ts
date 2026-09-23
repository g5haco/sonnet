import type { SupabaseClient } from "@supabase/supabase-js";

// Any OpenAI-compatible provider works; switching is config, not code.
// Default: OpenRouter free models, tried in order when one is rate-limited (decided 2026-09-23).
const BASE = process.env.AI_BASE_URL ?? "https://openrouter.ai/api/v1";
const MODELS = (
  process.env.AI_MODEL ?? "nvidia/nemotron-3-ultra-550b-a55b:free,qwen/qwen3.8-27b:free,google/gemma-4-31b-it:free"
).split(",");

export type Turn = { role: "user" | "assistant"; content: string };

// Everything the assistant knows, rendered as plain text in the student's timezone.
export async function studentContext(supabase: SupabaseClient, timeZone: string) {
  const [settings, courses, items] = await Promise.all([
    supabase.from("settings").select("term_start, term_weeks").maybeSingle(),
    supabase.from("courses").select("id, code, name").order("created_at"),
    supabase.from("items").select("title, kind, due, done_at, course_id").order("due").limit(300),
  ]);
  const now = Date.now();
  const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) =>
    new Date(iso).toLocaleString("en-US", { timeZone, ...opts });
  const code = new Map((courses.data ?? []).map((c) => [c.id, c.code]));
  const recent = now - 14 * 864e5; // done work older than two weeks is noise

  const work = (items.data ?? [])
    .filter((i) => !i.done_at || Date.parse(i.due) > recent)
    .map((i) => {
      const status = i.done_at ? "done" : Date.parse(i.due) < now ? "OVERDUE" : "open";
      const due = fmt(i.due, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
      return `- [${status}] ${code.get(i.course_id) ?? "?"} · ${i.kind} · "${i.title}" · due ${due}`;
    });

  const term = settings.data;
  const week = term && Math.floor((now - Date.parse(`${term.term_start}T00:00:00`)) / (7 * 864e5)) + 1;

  return [
    `Now: ${fmt(new Date(now).toISOString(), { dateStyle: "full", timeStyle: "short" })} (${timeZone}).`,
    term ? `Semester: started ${term.term_start}, week ${week} of ${term.term_weeks}.` : "Semester dates: not set.",
    `Courses: ${(courses.data ?? []).map((c) => (c.name ? `${c.code} (${c.name})` : c.code)).join("; ") || "none yet"}.`,
    "Class times: not added yet.",
    "Work (due dates in the student's local time):",
    work.join("\n") || "- nothing added yet",
  ].join("\n");
}

const RULES = `You are Sonnet, the assistant inside a college student's planner. Precise, warm, a little cheeky; never preachy.
Rules:
- Use only the courses and work listed. If something isn't there, say you don't see it and suggest adding it with the + in the sidebar.
- Never invent due dates, grades, exam content or class times.
- Plans: name concrete days and short time blocks; overdue first, then the soonest and heaviest.
- Plain text only: no markdown (no asterisks, no #). Short lines, "•" for bullets. Under 180 words unless asked for more.`;

// Streams the reply as newline-delimited JSON events the chat panel understands:
// {"t":"think"} while the model reasons, {"t":"text","v":"..."} for answer text, {"t":"error","v":"..."}.
export async function streamReply(context: string, turns: Turn[]) {
  const key = process.env.AI_API_KEY;
  const encode = (e: object) => new TextEncoder().encode(JSON.stringify(e) + "\n");
  const fail = (message: string) => new Response(encode({ t: "error", v: message }), { status: 200 });
  if (!key) return fail("The assistant isn't set up yet: AI_API_KEY is missing.");

  // One upstream call. The timeout covers the whole answer, so a stalled free model can't hang the chat.
  const open = () =>
    fetch(`${BASE}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(55_000), // route maxDuration is 60s
      body: JSON.stringify({
        ...(MODELS.length > 1 ? { models: MODELS } : { model: MODELS[0] }), // `models` = OpenRouter fallbacks
        reasoning: { effort: "low" },
        stream: true,
        max_tokens: 900,
        messages: [{ role: "system", content: `${RULES}\n\n${context}` }, ...turns],
      }),
    }).catch(() => null);

  const upstream = await open();
  if (!upstream?.ok || !upstream.body) {
    const status = upstream?.status;
    console.error("[ai] upstream", status, await upstream?.text().catch(() => ""));
    return fail(
      status === 429
        ? "The free AI is busy or out of requests for today. Try again in a minute."
        : status === 401
          ? "The AI key was rejected. Check AI_API_KEY."
          : "Couldn't reach the AI. Try again in a moment.",
    );
  }

  // Provider SSE → our NDJSON, in one read loop. (A pull()-based stream stalls when a chunk holds only
  // keep-alive comments, because pull isn't called again unless it delivered something.)
  return new Response(
    new ReadableStream({
      async start(out) {
        let reader = upstream.body!.pipeThrough(new TextDecoderStream()).getReader();
        let buffer = "";
        let thinking = false;
        let sent = false; // any answer text yet?
        let retried = false;
        try {
          for (;;) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += value;
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";
            for (const raw of lines) {
              const line = raw.trimEnd();
              if (!line.startsWith("data: ") || line === "data: [DONE]") continue; // skips ": OPENROUTER PROCESSING"
              let chunk;
              try {
                chunk = JSON.parse(line.slice(6));
              } catch {
                continue; // a malformed line shouldn't end the whole answer
              }
              if (chunk.error) {
                console.error("[ai] stream error", chunk.error);
                // Free models fail now and then before saying anything: quietly try once more.
                const again = !sent && !retried ? await open() : null;
                if (again?.ok && again.body) {
                  retried = true;
                  reader = again.body.pipeThrough(new TextDecoderStream()).getReader();
                  buffer = "";
                  break;
                }
                out.enqueue(encode({ t: "error", v: "The AI stopped mid-answer. Try again." }));
                return out.close();
              }
              const delta = chunk.choices?.[0]?.delta ?? {};
              if (delta.reasoning && !thinking) {
                thinking = true;
                out.enqueue(encode({ t: "think" }));
              }
              if (delta.content) {
                sent = true;
                out.enqueue(encode({ t: "text", v: delta.content }));
              }
            }
          }
        } catch {
          out.enqueue(encode({ t: "error", v: "The AI took too long. Try again, or ask something shorter." }));
        }
        out.close();
      },
    }),
    { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" } },
  );
}
