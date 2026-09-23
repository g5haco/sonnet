import type { SupabaseClient } from "@supabase/supabase-js";

// Any OpenAI-compatible provider works; switching is config, not code.
// Default: OpenRouter free models, tried in order when one is rate-limited (decided 2026-09-23).
// Reasoning is off: first words in ~0.5-2s instead of ~15s, and answers stayed correct in testing.
const BASE = process.env.AI_BASE_URL ?? "https://openrouter.ai/api/v1";
const MODELS = (
  process.env.AI_MODEL ??
  "nvidia/nemotron-3-super-120b-a12b:free,qwen/qwen3.8-27b:free,nvidia/nemotron-3-ultra-550b-a55b:free"
).split(",");

export type Turn = { role: "user" | "assistant"; content: string };

// What the model may ask for. Nothing is saved until the student confirms in the chat panel.
export type Proposal =
  | { type: "add"; course: string; title: string; kind: "assignment" | "exam" | "quiz" | "reading"; due: string }
  | { type: "update"; id: string; was: string; title?: string; due?: string; done?: boolean };
type Ref = { id: string; title: string; course: string };

const TOOLS = [
  {
    type: "function",
    function: {
      name: "add_item",
      description: "Propose adding an assignment, exam, quiz or reading. The student confirms before it is saved.",
      parameters: {
        type: "object",
        properties: {
          course: { type: "string", description: "Course code exactly as listed, e.g. CHEM 1210" },
          title: { type: "string" },
          kind: { type: "string", enum: ["assignment", "exam", "quiz", "reading"] },
          due: { type: "string", description: "Local date-time YYYY-MM-DDTHH:mm. Use 23:59 when no time is given." },
        },
        required: ["course", "title", "kind", "due"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_item",
      description: "Propose renaming, re-dating or checking off an existing item. The student confirms first.",
      parameters: {
        type: "object",
        properties: {
          ref: { type: "string", description: "The item's ref from the work list" },
          title: { type: "string" },
          due: { type: "string", description: "New local date-time YYYY-MM-DDTHH:mm" },
          done: { type: "boolean" },
        },
        required: ["ref"],
      },
    },
  },
];

// The model doesn't count days reliably (it put "next Friday" on this Friday), so it gets an explicit calendar.
export function calendarLines(now: number, timeZone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "numeric", day: "numeric" })
      .formatToParts(new Date(now))
      .map((p) => [p.type, p.value]),
  );
  const today = Date.UTC(+parts.year, +parts.month - 1, +parts.day, 12); // the local date, at noon UTC
  const day = (i: number) =>
    new Date(today + i * 864e5).toLocaleDateString("en-US", {
      timeZone: "UTC",
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  const monday = -((new Date(today).getUTCDay() + 6) % 7); // days back to this week's Monday
  return [
    `This week: ${day(monday)} to ${day(monday + 6)} (today is ${day(0)}). Next week: ${day(monday + 7)} to ${day(monday + 13)}.`,
    `Next 14 days: ${Array.from({ length: 14 }, (_, i) => day(i) + (i === 0 ? " (today)" : "")).join(", ")}.`,
    `Dates: "this Friday" = Friday of this week; "next Friday" = Friday of next week; a bare "Friday" = the next Friday to come. Always take dates from these lines.`,
  ];
}

// Everything the assistant knows, rendered as plain text in the student's timezone.
export async function studentContext(supabase: SupabaseClient, timeZone: string) {
  const [settings, courses, items] = await Promise.all([
    supabase.from("settings").select("term_start, term_weeks").maybeSingle(),
    supabase.from("courses").select("id, code, name").order("created_at"),
    supabase.from("items").select("id, title, kind, due, done_at, course_id").order("due").limit(300),
  ]);
  const now = Date.now();
  const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) =>
    new Date(iso).toLocaleString("en-US", { timeZone, ...opts });
  const code = new Map((courses.data ?? []).map((c) => [c.id, c.code]));
  const recent = now - 14 * 864e5; // done work older than two weeks is noise

  // Short refs (first 6 chars of the id) let the model point at an item without long UUIDs.
  const refs = new Map<string, Ref>();
  const work = (items.data ?? [])
    .filter((i) => !i.done_at || Date.parse(i.due) > recent)
    .map((i) => {
      const status = i.done_at ? "done" : Date.parse(i.due) < now ? "OVERDUE" : "open";
      const due = fmt(i.due, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
      const ref = i.id.slice(0, 6);
      refs.set(ref, { id: i.id, title: i.title, course: code.get(i.course_id) ?? "?" });
      return `- [${status}] ${code.get(i.course_id) ?? "?"} · ${i.kind} · "${i.title}" · due ${due} · ref ${ref}`;
    });

  const term = settings.data;
  const week = term && Math.floor((now - Date.parse(`${term.term_start}T00:00:00`)) / (7 * 864e5)) + 1;

  const text = [
    `Now: ${fmt(new Date(now).toISOString(), { dateStyle: "full", timeStyle: "short" })} (${timeZone}).`,
    ...calendarLines(now, timeZone),
    term ? `Semester: started ${term.term_start}, week ${week} of ${term.term_weeks}.` : "Semester dates: not set.",
    `Courses: ${(courses.data ?? []).map((c) => (c.name ? `${c.code} (${c.name})` : c.code)).join("; ") || "none yet"}.`,
    "Class times: not added yet.",
    "Work (due dates in the student's local time):",
    work.join("\n") || "- nothing added yet",
  ].join("\n");
  return { text, refs };
}

const RULES = `You are Sonnet, the assistant inside a college student's planner. Precise, warm, a little cheeky; never preachy.
Rules:
- Use only the courses and work listed. If something isn't there, say you don't see it and suggest adding it with the + in the sidebar.
- Never invent due dates, grades, exam content or class times.
- Plans: name concrete days and short time blocks; overdue first, then the soonest and heaviest.
- To add or change work, call add_item or update_item right away. The student confirms each change in the app, so don't ask "shall I?"; just add one short line saying what you proposed.
- Talk like a person: never copy the raw list format above (no "[open]", no "·" field separators). Say "Essay 1 draft for WRTG 1150, due Friday".
- Plain text only: no markdown (no asterisks, no #). Short lines, "•" for bullets. Under 180 words unless asked for more.`;

// Reasoning costs ~10s before the first word, so it's only on when the question needs it:
// tutoring-style asks (explain, solve, study, quiz…) or long messages. The Think toggle forces it.
export const needsThinking = (question: string) =>
  // Changing the planner ("add…", "move…") is quick tool work, even when it mentions an essay.
  !/^\s*(please \s+)?(add|put|move|change|mark|rename|reschedule|schedule|remind|delete|check off)\b/i.test(question) &&
  (question.length > 280 ||
    /\b(explain|why|how (do|does|did|would|should|can|is|are)|solve|prove|derive|calculate|study|quiz|teach|understand|practice|compare|outline|brainstorm|help me (with|study|understand))\b/i.test(
      question,
    ));

// Streams the reply as newline-delimited JSON events the chat panel understands:
// {"t":"think"} while the model reasons, {"t":"text","v":"..."} for answer text, {"t":"error","v":"..."}.
export async function streamReply(
  { text: context, refs }: { text: string; refs: Map<string, Ref> },
  turns: Turn[],
  think = false,
) {
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
        reasoning: think ? { effort: "low" } : { enabled: false },
        stream: true,
        max_tokens: think ? 2000 : 900, // reasoning tokens count against the budget
        tools: TOOLS,
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
        const calls: { name: string; args: string }[] = []; // tool calls arrive in pieces
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
              for (const tc of delta.tool_calls ?? []) {
                const call = (calls[tc.index ?? 0] ??= { name: "", args: "" });
                call.name += tc.function?.name ?? "";
                call.args += tc.function?.arguments ?? "";
              }
            }
          }
          const proposals = calls.map((c) => toProposal(c, refs)).filter((p) => p !== null);
          if (proposals.length) out.enqueue(encode({ t: "propose", v: proposals }));
        } catch {
          out.enqueue(encode({ t: "error", v: "The AI took too long. Try again, or ask something shorter." }));
        }
        out.close();
      },
    }),
    { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" } },
  );
}

// A tool call becomes a proposal only if it's well-formed; refs resolve to real ids here, server-side.
function toProposal(call: { name: string; args: string }, refs: Map<string, Ref>): Proposal | null {
  let a: Record<string, unknown>;
  try {
    a = JSON.parse(call.args || "{}");
  } catch {
    return null;
  }
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 200) : undefined);
  if (call.name === "add_item") {
    const kind = (["assignment", "exam", "quiz", "reading"] as const).find((k) => k === a.kind) ?? "assignment";
    const [course, title, due] = [str(a.course), str(a.title), str(a.due)];
    return course && title && due && !Number.isNaN(Date.parse(due)) ? { type: "add", course, title, kind, due } : null;
  }
  if (call.name === "update_item") {
    const item = refs.get(String(a.ref ?? ""));
    if (!item) return null;
    const due = str(a.due);
    return {
      type: "update",
      id: item.id,
      was: `${item.title} (${item.course})`,
      title: str(a.title),
      due: due && !Number.isNaN(Date.parse(due)) ? due : undefined,
      done: typeof a.done === "boolean" ? a.done : undefined,
    };
  }
  return null;
}
