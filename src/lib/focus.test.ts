import { expect, test } from "vitest";
import { enqueue, flush, streak, studyDays, type PendingLog } from "./focus";

test("study days add up per local day; the streak counts back from today or yesterday", () => {
  const at = (d: number, h = 10) => new Date(2026, 8, d, h).toISOString();
  const days = studyDays([
    { started_at: at(20), minutes: 25 },
    { started_at: at(21), minutes: 25 },
    { started_at: at(21, 15), minutes: 10 },
    { started_at: at(22), minutes: 25 },
  ]);
  expect(days.get("2026-09-21")).toBe(35);
  expect(streak(days, new Date(2026, 8, 22, 20))).toBe(3); // studied today
  expect(streak(days, new Date(2026, 8, 23, 9))).toBe(3); // not yet today: still alive
  expect(streak(days, new Date(2026, 8, 24, 9))).toBe(0); // missed yesterday
});

const now = Date.parse("2026-10-02T12:00:00Z");
const log = (h: number, minutes = 25): PendingLog => ({ startedAt: new Date(now - h * 36e5).toISOString(), minutes });

test("success: a queued session is sent once and leaves the queue", async () => {
  const calls: PendingLog[] = [];
  const res = await flush([log(1)], async (l) => (calls.push(l), {}), now);
  expect(calls).toEqual([log(1)]);
  expect(res.sent).toEqual([log(1)]);
  expect(res.failed).toEqual([]);
});

test("failure: an error result or a thrown request keeps the session for a retry", async () => {
  const errored = await flush([log(1)], async () => ({ error: "Couldn't save the session." }), now);
  expect(errored.sent).toEqual([]);
  expect(errored.failed).toEqual([{ log: log(1), error: "Couldn't save the session.", final: false }]);
  const thrown = await flush([log(2)], async () => Promise.reject(new Error("Server action not found")), now);
  expect(thrown.failed).toEqual([{ log: log(2), error: "Couldn't reach Sonnet.", final: false }]);
  // A session the server refuses outright (clock skew, bad length) is marked final, so the queue drops it.
  const refused = await flush([log(3)], async () => ({ error: "That session's time is off.", final: true }), now);
  expect(refused.failed[0].final).toBe(true);
});

test("retry: a session that failed is sent on the next pass, and only once", async () => {
  let up = false;
  const saved: PendingLog[] = [];
  const send = async (l: PendingLog) => (up ? (saved.push(l), {}) : { error: "offline" });
  let queue = enqueue([], log(1));
  const first = await flush(queue, send, now);
  queue = queue.filter((q) => !first.sent.includes(q));
  expect(queue).toEqual([log(1)]);
  up = true;
  const second = await flush(queue, send, now);
  queue = queue.filter((q) => !second.sent.includes(q));
  expect(queue).toEqual([]);
  expect(saved).toEqual([log(1)]);
});

test("no duplicates: the same session queues once; sessions too old to save are dropped, not sent", async () => {
  expect(enqueue(enqueue([], log(1)), log(1))).toEqual([log(1)]);
  expect(enqueue([log(1)], log(2))).toEqual([log(1), log(2)]);
  const sent: PendingLog[] = [];
  const res = await flush([log(49), log(1)], async (l) => (sent.push(l), {}), now);
  expect(res.dropped).toEqual([log(49)]);
  expect(sent).toEqual([log(1)]);
});
