// Focus Sense scoring: a session's classified events -> timeline -> smoothing -> metrics, score and verified minutes.
// Deterministic and local: no AI, never reads the clock (window.now), same input -> same output.
//
// TIMELINE
// - A `start` opens a run and a `stop` closes it. A context event sets the state until the next context event or the
//   run's end; heartbeats only prove the monitor was alive. Before a run's first context the state is UNCERTAIN.
// - idle=true makes an ON_TASK/UNCERTAIN context IDLE (neutral). It is backdated IDLE_AFTER_MS (the student was
//   already idle by then), but never before the previous segment's start. A DISTRACTING context stays DISTRACTING
//   while idle: hands-off Netflix is still distraction.
// - Missing stop (hard kill, sleep): a run without a stop ends at min(next run's start, last event +
//   MISSING_STOP_GRACE_MS). A silent gap longer than the grace inside a run (no event at all, not even a heartbeat:
//   the PC slept or the app hung) is unmonitored too: the run closes at the last event + grace and reopens, in the same
//   context, at the next event. The final run without a stop is "in-progress" (ends at now) while now - last event
//   <= the grace and now is before the timer's end; otherwise it is "missing-stop" and ends at last event + grace.
//   Nothing is extrapolated further.
// - Effective window [start, end]: end = the final run's end (its stop, the grace above, or now), capped at
//   intendedEnd; "timer-end" when its stop reaches intendedEnd. Everything is clipped to it. Time in it outside every
//   run (paused, before the first start, between a kill and a relaunch, a silent gap) is UNMONITORED: no credit, no
//   penalty.
//
// SMOOTHING (shapes blocks and episodes; never turns UNCERTAIN into credit)
// 1. Adjacent segments of the same kind form one stretch.
// 2. ON_TASK or UNCERTAIN stretches under TRANSIENT_MS (passing through apps) take their neighbours' kind when both
//    agree, else the previous one's (else the next one's). Only ON_TASK/DISTRACTING/UNCERTAIN neighbours at least
//    TRANSIENT_MS long count, so a short stretch between short ones keeps its kind. DISTRACTING is never absorbed: a
//    brief one is a slip (rule 4) instead, so it is never credited as focus.
// 3. DISTRACTING stretches less than WINDOW_GAP_MS of other monitored time apart form one distraction window.
// 4. A window with under SLIP_MS of DISTRACTING time is a slip: forgiven up to a free budget (below), not credited,
//    doesn't break a focused block. Otherwise it is one episode, "recovered" if ON_TASK follows before the next one.
//
// METRICS
// - focusedMs: raw ON_TASK that stayed ON_TASK, not idle, monitored, inside the window. UNCERTAIN absorbed into
//   ON_TASK counts as uncertainMs; ON_TASK absorbed into DISTRACTING counts as distraction. distractionMs / slipMs:
//   DISTRACTING time in episodes / slips. The six buckets (focused, distraction, slip, uncertain, idle, unmonitored)
//   add up to sessionMs.
// - longestFocusedBlockMs: focused time in the longest stretch not broken by an episode, an UNMONITORED gap or
//   BLOCK_GAP_MS of UNCERTAIN/IDLE time in a row. Slips and shorter gaps don't break it and aren't counted in it.
// - medianRecoveryMs: median span (first to last DISTRACTING moment) of recovered episodes.
// - evidence = (focusedMs + distractionMs + slipMs) / sessionMs.
// - verifiedMinutes = floor(focusedMs / 1 min), capped at the timer length. Nothing else is credited.
//
// SCORE (null when evidence < MIN_EVIDENCE or focusedMs + distractionMs = 0)
//   D          = sum over episodes of d * (1 + k * min(d, SUSTAINED_MS) / SUSTAINED_MS)
//                d = the episode's DISTRACTING time, k = RECOVERED_FACTOR if recovered, else 1
//   idleExcess = max(0, idleMs - max(FREE_IDLE_MS, FREE_IDLE_SHARE * sessionMs))
//   slipExcess = max(0, slipMs - max(FREE_SLIP_MS, FREE_SLIP_SHARE * sessionMs))
//   score      = round(100 * F / (F + D + idleExcess + slipExcess)), F = focusedMs
// Sustained distraction weighs up to 2x (1.5x if the student came back). D >= the distraction time itself, so the
// score never beats the plain on-task share. Switching apps, UNCERTAIN time, a few slips and normal breaks don't lower
// it; a stream of slips or a long absence does.
import { HEARTBEAT_MS, IDLE_AFTER_MS } from "../focus-sense";
import { plural } from "../../utils";
import type { ClassifiedEvent, FocusClassification, ScoredSegment, SegmentKind, SessionReport, SessionWindow } from "./types";

const MIN = 60_000;
/** A run with no stop counts this long past its last event (a heartbeat comes every HEARTBEAT_MS, plus slack). */
export const MISSING_STOP_GRACE_MS = HEARTBEAT_MS + 30_000;
/** ON_TASK/UNCERTAIN stretches shorter than this are passing through and take their neighbours' kind. */
export const TRANSIENT_MS = 15_000;
/** DISTRACTING stretches closer than this (other monitored time between them) are one distraction window. */
export const WINDOW_GAP_MS = MIN;
/** A distraction window with less DISTRACTING time than this is a forgiven slip. */
export const SLIP_MS = MIN;
/** This much UNCERTAIN/IDLE time in a row ends a focused block. */
export const BLOCK_GAP_MS = 2 * MIN;
/** An episode's weight grows from 1x to its maximum as it lasts up to this long. */
export const SUSTAINED_MS = 20 * MIN;
/** Share of the extra weight kept when the student came back to work after the episode. */
export const RECOVERED_FACTOR = 0.5;
/** Idle time up to max(FREE_IDLE_MS, FREE_IDLE_SHARE of the session) is a normal break and free. */
export const FREE_IDLE_MS = 5 * MIN;
export const FREE_IDLE_SHARE = 0.2;
/** Slip time up to max(FREE_SLIP_MS, FREE_SLIP_SHARE of the session) is forgiven; beyond it, it costs like focus lost. */
export const FREE_SLIP_MS = 2 * MIN;
export const FREE_SLIP_SHARE = 0.1;
/** No score below this share of the window with a decisive label (ON_TASK or DISTRACTING). */
export const MIN_EVIDENCE = 0.25;

type EndRule = SessionReport["window"]["endRule"];
type Run = { start: number; end: number; rule: EndRule; first: ScoredSegment; contexts: ClassifiedEvent[] };
type Stretch = { kind: SegmentKind; start: number; end: number; segs: ScoredSegment[] };
export type Episode = { start: number; end: number; ms: number; recovered: boolean };

const seg = (start: number, end: number, kind: SegmentKind, classification: FocusClassification | null): ScoredSegment => ({
  start,
  end,
  kind,
  rawKind: kind,
  classification,
});
const kindOf = (e: ClassifiedEvent): SegmentKind => {
  const label = e.classification?.label ?? "UNCERTAIN";
  return e.idle && label !== "DISTRACTING" ? "IDLE" : label;
};
const len = (x: { start: number; end: number }) => x.end - x.start;

/** Raw segments (no smoothing) covering the effective window exactly, in order. */
export function buildTimeline(events: ClassifiedEvent[], w: SessionWindow): { end: number; endRule: EndRule; segments: ScoredSegment[] } {
  const runs: Run[] = [];
  let cur: Omit<Run, "end" | "rule"> | null = null;
  let last = 0;
  for (const e of [...events].sort((a, b) => a.seq - b.seq)) {
    if (e.kind === "start") {
      if (cur) runs.push({ ...cur, end: Math.max(cur.start, Math.min(e.timestamp, last + MISSING_STOP_GRACE_MS)), rule: "missing-stop" });
      cur = { start: e.timestamp, first: seg(e.timestamp, e.timestamp, kindOf(e), e.classification), contexts: [] };
      last = e.timestamp;
      continue;
    }
    if (!cur) {
      if (e.kind === "stop") continue; // nothing open to stop
      cur = { start: e.timestamp, first: seg(e.timestamp, e.timestamp, "UNCERTAIN", null), contexts: [] };
    } else if (e.timestamp - last > MISSING_STOP_GRACE_MS) {
      // A silent gap (sleep, hang): close at the grace, reopen in the same context at this event.
      const ctx: ClassifiedEvent | undefined = cur.contexts.at(-1);
      const open: ScoredSegment = ctx ?seg(0, 0, kindOf(ctx), ctx.classification) : cur.first;
      runs.push({ ...cur, end: last + MISSING_STOP_GRACE_MS, rule: "missing-stop" });
      cur = { start: e.timestamp, first: { ...open, start: e.timestamp, end: e.timestamp }, contexts: [] };
    }
    last = Math.max(last, e.timestamp);
    if (e.kind === "context") cur.contexts.push(e);
    if (e.kind === "stop") {
      runs.push({ ...cur, end: Math.max(cur.start, e.timestamp), rule: "stop" });
      cur = null;
    }
  }
  if (cur) {
    const live = w.now - last <= MISSING_STOP_GRACE_MS && w.now < w.intendedEnd;
    runs.push({ ...cur, end: live ? Math.max(w.now, last) : last + MISSING_STOP_GRACE_MS, rule: live ? "in-progress" : "missing-stop" });
  }

  const clamp = (t: number) => Math.min(Math.max(t, w.start), w.intendedEnd);
  const final = runs.filter((r) => r.start < w.intendedEnd).at(-1);
  const end = clamp(final ? final.end : w.now);
  const endRule: EndRule = !final
    ? w.now >= w.intendedEnd ? "timer-end" : "in-progress"
    : final.rule === "stop" && final.end >= w.intendedEnd ? "timer-end" : final.rule;

  const pieces: ScoredSegment[] = [];
  for (const r of runs) {
    const ps: ScoredSegment[] = [];
    let open = r.first;
    for (const e of r.contexts) {
      const at = Math.min(Math.max(e.timestamp, open.start), r.end);
      ps.push({ ...open, end: at });
      open = seg(at, at, kindOf(e), e.classification);
    }
    ps.push({ ...open, end: r.end });
    const live = ps.filter((p) => len(p) > 0);
    for (let i = 1; i < live.length; i++) {
      if (live[i].rawKind !== "IDLE" || live[i - 1].rawKind === "IDLE") continue;
      const at = Math.max(live[i - 1].start, live[i].start - IDLE_AFTER_MS);
      live[i - 1].end = live[i].start = at;
    }
    pieces.push(...live.filter((p) => len(p) > 0));
  }

  const segments: ScoredSegment[] = [];
  let t = w.start;
  for (const p of pieces) {
    const s = Math.max(p.start, t);
    const e = Math.min(p.end, end);
    if (e <= s) continue;
    if (s > t) segments.push(seg(t, s, "UNMONITORED", null));
    segments.push({ ...p, start: s, end: e });
    t = e;
  }
  if (t < end) segments.push(seg(t, end, "UNMONITORED", null));
  return { end, endRule, segments };
}

const stretches = (segs: ScoredSegment[]) => {
  const out: Stretch[] = [];
  for (const s of segs) {
    const g = out.at(-1);
    if (g && g.kind === s.kind) {
      g.end = s.end;
      g.segs.push(s);
    } else out.push({ kind: s.kind, start: s.start, end: s.end, segs: [s] });
  }
  return out;
};
const addNote = (s: ScoredSegment, note: string) => {
  s.note = s.note ? `${s.note}; ${note}` : note;
};
// A neighbour that can absorb a short stretch: labelled and not short itself.
const labelOf = (g?: Stretch) =>
  g && g.kind !== "IDLE" && g.kind !== "UNMONITORED" && len(g) >= TRANSIENT_MS ? g.kind : undefined;
// Credited time: ON_TASK before and after smoothing.
const isFocused = (s: ScoredSegment) => s.kind === "ON_TASK" && s.rawKind === "ON_TASK";
const focusedIn = (segs: ScoredSegment[]) => segs.reduce((a, s) => a + (isFocused(s) ? len(s) : 0), 0);

/** Smooths raw segments (copies them): sets `kind`/`note`, finds episodes, slips and the longest focused block. */
export function smooth(raw: ScoredSegment[]) {
  const segs = raw.map((s) => ({ ...s }));

  // 2. Transients, decided on the unsmoothed stretches so a run of them can't cascade.
  const before = stretches(segs);
  const moves = before.map((g, i) => {
    if (len(g) >= TRANSIENT_MS || (g.kind !== "ON_TASK" && g.kind !== "UNCERTAIN")) return undefined;
    const prev = labelOf(before[i - 1]);
    const next = labelOf(before[i + 1]);
    const to = prev === next ? prev : (prev ?? next);
    return to === g.kind ? undefined : to;
  });
  before.forEach((g, i) => {
    const to = moves[i];
    if (to)
      for (const s of g.segs) {
        s.kind = to;
        addNote(s, `absorbed: under ${TRANSIENT_MS / 1000} s`);
      }
  });

  // 3. Distraction windows.
  const gs = stretches(segs);
  const windows: { first: number; last: number; ms: number }[] = [];
  let open: (typeof windows)[number] | null = null;
  let gap = 0;
  gs.forEach((g, i) => {
    if (g.kind === "DISTRACTING") {
      if (open && gap < WINDOW_GAP_MS) {
        open.last = i;
        open.ms += len(g);
      } else windows.push((open = { first: i, last: i, ms: len(g) }));
      gap = 0;
    } else if (g.kind === "UNMONITORED") open = null;
    else gap += len(g);
  });

  // 4. Slips and episodes.
  const slips = windows.filter((x) => x.ms < SLIP_MS);
  const eps = windows.filter((x) => x.ms >= SLIP_MS);
  const episodeAt = new Set<number>(); // DISTRACTING stretches inside an episode
  for (const x of windows)
    for (let i = x.first; i <= x.last; i++) {
      if (gs[i].kind !== "DISTRACTING") continue;
      if (x.ms < SLIP_MS) gs[i].segs.forEach((s) => addNote(s, "brief slip, forgiven"));
      else episodeAt.add(i);
    }
  const episodes: Episode[] = eps.map((x, k) => ({
    start: gs[x.first].start,
    end: gs[x.last].end,
    ms: x.ms,
    recovered: gs.slice(x.last + 1, eps[k + 1]?.first ?? gs.length).some((g) => g.kind === "ON_TASK"),
  }));

  let longestFocusedBlockMs = 0;
  let block = 0;
  let quiet = 0;
  gs.forEach((g, i) => {
    if (g.kind === "ON_TASK") {
      block += focusedIn(g.segs);
      quiet = 0;
      longestFocusedBlockMs = Math.max(longestFocusedBlockMs, block);
    } else if (g.kind === "UNMONITORED" || episodeAt.has(i)) block = quiet = 0;
    else if (g.kind !== "DISTRACTING") {
      quiet += len(g);
      if (quiet >= BLOCK_GAP_MS) block = 0;
    }
  });

  // Merge neighbours that look identical in the debug view.
  const segments: ScoredSegment[] = [];
  for (const s of segs) {
    const p = segments.at(-1);
    const same =
      p &&
      p.kind === s.kind &&
      p.rawKind === s.rawKind &&
      p.note === s.note &&
      p.classification?.label === s.classification?.label &&
      p.classification?.reason === s.classification?.reason;
    if (same) p.end = s.end;
    else segments.push(s);
  }

  return { segments, episodes, slips: slips.map((x) => x.ms), longestFocusedBlockMs };
}

const mins = (ms: number) => String(Math.round(ms / 6000) / 10);

export function scoreSession(events: ClassifiedEvent[], window: SessionWindow): SessionReport {
  const { end, endRule, segments: raw } = buildTimeline(events, window);
  const { segments, episodes, slips, longestFocusedBlockMs } = smooth(raw);
  const total = (k: SegmentKind) => segments.reduce((a, s) => a + (s.kind === k ? len(s) : 0), 0);

  const sessionMs = end - window.start;
  const focusedMs = focusedIn(segments);
  const distractionMs = episodes.reduce((a, e) => a + e.ms, 0);
  const slipMs = slips.reduce((a, b) => a + b, 0);
  const uncertainMs = total("UNCERTAIN") + total("ON_TASK") - focusedMs; // incl. UNCERTAIN absorbed into ON_TASK
  const idleMs = total("IDLE");
  const unmonitoredMs = total("UNMONITORED");
  const evidence = sessionMs > 0 ? (focusedMs + distractionMs + slipMs) / sessionMs : 0;

  const weighted = episodes.reduce(
    (a, e) => a + e.ms * (1 + (e.recovered ? RECOVERED_FACTOR : 1) * (Math.min(e.ms, SUSTAINED_MS) / SUSTAINED_MS)),
    0,
  );
  const freeIdle = Math.max(FREE_IDLE_MS, FREE_IDLE_SHARE * sessionMs);
  const idleExcess = Math.max(0, idleMs - freeIdle);
  const freeSlip = Math.max(FREE_SLIP_MS, FREE_SLIP_SHARE * sessionMs);
  const slipExcess = Math.max(0, slipMs - freeSlip);
  const noTime = focusedMs + distractionMs === 0;
  const focusScore =
    noTime || evidence < MIN_EVIDENCE
      ? null
      : Math.round((100 * focusedMs) / (focusedMs + weighted + idleExcess + slipExcess));

  const back = episodes.filter((e) => e.recovered).map((e) => e.end - e.start).sort((a, b) => a - b);
  const mid = back.length >> 1;
  const medianRecoveryMs = !back.length ? null : back.length % 2 ? back[mid] : Math.round((back[mid - 1] + back[mid]) / 2);
  const verifiedMinutes = Math.max(0, Math.min(Math.floor(focusedMs / MIN), Math.floor((window.intendedEnd - window.start) / MIN)));

  const n = episodes.length;
  const ended: Record<EndRule, string> = {
    "timer-end": `Session ${mins(sessionMs)} min, to the timer's end.`,
    stop: `Session ${mins(sessionMs)} min: monitoring stopped before the timer's end.`,
    "missing-stop": `Session ${mins(sessionMs)} min: no stop was recorded, so it counts to ${mins(MISSING_STOP_GRACE_MS)} min after the last sign of the monitor.`,
    "in-progress": `Session ${mins(sessionMs)} min so far (still running).`,
  };
  const explain = [
    ended[endRule],
    `Focused ${mins(focusedMs)} min, distracted ${mins(distractionMs)} min in ${n} episode${plural(n)} (weighted ${mins(weighted)} min), idle ${mins(idleMs)} min (free up to ${mins(freeIdle)} min).`,
    `${slips.length} brief slip${plural(slips.length)}: ${mins(slipMs)} min (free up to ${mins(freeSlip)} min). Counted neither way: ${mins(uncertainMs)} min uncertain, ${mins(unmonitoredMs)} min not monitored.`,
    ...(n ? [`Back on task after ${back.length} of ${n} episode${plural(n)}${back.length ? ` (median ${mins(medianRecoveryMs ?? 0)} min away)` : ""}.`] : []),
    focusScore !== null
      ? `Score = focused / (focused + weighted distraction + idle over free + slips over free) = ${mins(focusedMs)} / (${mins(focusedMs)} + ${mins(weighted)} + ${mins(idleExcess)} + ${mins(slipExcess)}) = ${focusScore}.`
      : noTime
        ? "No score: no on-task time and no distraction episode."
        : `No score: only ${Math.round(evidence * 100)}% of the session is clearly on-task or distracting (needs ${MIN_EVIDENCE * 100}%).`,
    `Verified: ${verifiedMinutes} min (on-task, active, inside the session).`,
  ];

  return {
    window: { start: window.start, end, endRule },
    segments,
    metrics: {
      sessionMs,
      monitoredMs: sessionMs - unmonitoredMs,
      focusedMs,
      distractionMs,
      slipMs,
      uncertainMs,
      idleMs,
      unmonitoredMs,
      longestFocusedBlockMs,
      distractionEvents: n,
      slips: slips.length,
      recoveries: back.length,
      medianRecoveryMs,
      verifiedMinutes,
      focusScore,
      evidence,
    },
    explain,
  };
}
