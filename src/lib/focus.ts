import { dayKey } from "./course";

export type FocusSession = { started_at: string; minutes: number; course_id?: string | null };

// A finished session waiting to be saved. It stays queued (in localStorage) until the server confirms, so a
// failed save (offline, a stale deploy, a server error) can be retried instead of losing the session.
export type PendingLog = { startedAt: string; minutes: number };
// final: the server refused the session itself (bad time or length), so retrying can't help.
type Send = (log: PendingLog) => Promise<{ error?: string; final?: boolean }>;

const KEEP = 2 * 864e5; // logFocus refuses sessions older than two days, so retrying past that is pointless

// The same start time is the same session: queueing it twice keeps one.
export function enqueue(queue: PendingLog[], log: PendingLog) {
  return queue.some((q) => q.startedAt === log.startedAt) ? queue : [...queue, log];
}

// Tries each queued session once. Sent and dropped (too old to save) leave the queue; failed ones stay for
// later unless final.
export async function flush(queue: PendingLog[], send: Send, now = Date.now()) {
  const sent: PendingLog[] = [];
  const dropped: PendingLog[] = [];
  const failed: { log: PendingLog; error: string; final: boolean }[] = [];
  for (const log of queue) {
    if (!(now - Date.parse(log.startedAt) < KEEP)) {
      dropped.push(log);
      continue;
    }
    try {
      const res = await send(log);
      if (res?.error) failed.push({ log, error: res.error, final: !!res.final });
      else sent.push(log);
    } catch {
      failed.push({ log, error: "Couldn't reach Sonnet.", final: false }); // offline, or this tab predates a deploy
    }
  }
  return { sent, dropped, failed };
}

// Minutes studied per local day ("YYYY-MM-DD").
export function studyDays(sessions: FocusSession[]) {
  const days = new Map<string, number>();
  for (const s of sessions) {
    const key = dayKey(new Date(s.started_at));
    days.set(key, (days.get(key) ?? 0) + s.minutes);
  }
  return days;
}

// Days in a row with focus time, ending today (or yesterday, so the streak survives until tonight).
export function streak(days: Map<string, number>, today: Date) {
  const d = new Date(today);
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (days.has(dayKey(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}
