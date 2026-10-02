// Focus Sense M6B contract: what the classifier, the scorer and the benchmark agree on. Lead-owned.
// Raw events come from the desktop app (src-tauri/src/focus_sense, read through ../focus-sense.ts). Everything here
// runs locally in the page; nothing is stored on a server and nothing changes study history.
import type { FocusActivityEvent } from "../focus-sense";

export type Label = "ON_TASK" | "DISTRACTING" | "UNCERTAIN";

// rule: a deterministic, high-confidence rule (no context needed, or an exact context match).
// heuristic: contextual evidence from the title (site, channel, subreddit, project, keywords vs the session's context).
// semantic: a SemanticProvider decided. abstain: nothing decided it (no evidence, redacted, or no provider).
export type Method = "rule" | "heuristic" | "semantic" | "abstain";

export type FocusClassification = {
  label: Label;
  // 0..1, how likely `label` is right. UNCERTAIN always has 0 (see `lean`).
  confidence: number;
  // One short sentence a student could read, e.g. "YouTube video matches your course (biology)." Never quotes a
  // redacted title.
  reason: string;
  method: Method;
  // For UNCERTAIN only: which way the weak evidence pointed, if any. Never counted as that label.
  lean?: "ON_TASK" | "DISTRACTING";
};

// Future Strict Mode may act only on DISTRACTING at or above this, and never on a semantic verdict alone.
// M6B enforces nothing; the benchmark measures false positives at this threshold.
export const ENFORCEMENT_CONFIDENCE = 0.9;
export const isEnforceable = (c: FocusClassification) =>
  c.label === "DISTRACTING" && c.confidence >= ENFORCEMENT_CONFIDENCE && (c.method === "rule" || c.method === "heuristic");

// One foreground context, as the classifier sees it. Built from an event with `toActivity`.
export type ActivityInput = {
  processName: string | null; // e.g. "chrome.exe"
  appName: string | null; // e.g. "Google Chrome"
  windowTitle: string | null; // e.g. "Mitosis explained - YouTube - Google Chrome"; null when redacted or unreadable
  redacted: "excluded" | "private" | null;
  hasWindow: boolean; // false: no foreground window (lock screen, switching)
};

// What the student said they're working on. Every field optional: a session may have none.
// Reuses Sonnet's own data: courseName is the course code as shown in Sonnet (often includes the name, e.g.
// "BIOL 1610 Intro Biology"); assignment fields come from the schedule's items.
export type FocusSessionContext = {
  sessionId: string;
  goal?: string; // free text, e.g. "study for the mitosis quiz"
  courseId?: string;
  courseName?: string;
  assignmentId?: string;
  assignmentTitle?: string;
  assignmentKind?: "assignment" | "exam" | "quiz" | "reading";
};

// The semantic layer's only view of a session: no ids, no history, no redacted or excluded contexts.
export type SemanticRequest = {
  context: { goal?: string; courseName?: string; assignmentTitle?: string };
  app: string | null; // app or process name
  title: string; // the window title, already cleaned of the browser suffix
};
export type SemanticVerdict = { label: Label; confidence: number; reason: string };

// A pluggable semantic classifier (local model, cloud model, ...). Results line up with requests; null = no answer.
// Callers treat a throw, a timeout or a null as UNCERTAIN.
export interface SemanticProvider {
  readonly name: string;
  readonly local: boolean; // true if nothing leaves the machine
  classify(requests: SemanticRequest[], signal?: AbortSignal): Promise<(SemanticVerdict | null)[]>;
}

export const toActivity = (e: FocusActivityEvent): ActivityInput => ({
  processName: e.processName,
  appName: e.appName,
  windowTitle: e.windowTitle,
  redacted: e.redacted,
  hasWindow: e.confidence !== "none",
});

// ---------------------------------------------------------------- scoring (Worker C implements score.ts)

// An event with its classification. Markers and heartbeats (kind start/stop/heartbeat) carry null.
export type ClassifiedEvent = FocusActivityEvent & { classification: FocusClassification | null };

export type SessionWindow = {
  start: number; // the timer's run.start (ms)
  intendedEnd: number; // run.start + the timer length
  now: number; // for a session still running
};

export type SegmentKind = Label | "IDLE" | "UNMONITORED";

export type ScoredSegment = {
  start: number;
  end: number;
  kind: SegmentKind; // after smoothing
  rawKind: SegmentKind; // before smoothing
  classification: FocusClassification | null;
  note?: string; // e.g. "brief slip, forgiven", "absorbed: under 15 s"
};

export type SessionMetrics = {
  sessionMs: number; // effective window length
  monitoredMs: number;
  focusedMs: number; // ON_TASK, not idle
  distractionMs: number; // DISTRACTING time in distraction episodes (slips excluded)
  slipMs: number; // DISTRACTING time in forgiven brief slips
  uncertainMs: number;
  idleMs: number;
  unmonitoredMs: number; // paused, gaps, or after a missing stop
  longestFocusedBlockMs: number;
  distractionEvents: number; // sustained episodes, not every switch
  slips: number;
  recoveries: number; // episodes followed by a return to ON_TASK
  medianRecoveryMs: number | null; // episode length before that return
  verifiedMinutes: number;
  focusScore: number | null; // 0..100, null when there isn't enough evidence
  evidence: number; // 0..1, share of the window with a decisive label (ON_TASK or DISTRACTING)
};

export type SessionReport = {
  window: { start: number; end: number; endRule: "stop" | "timer-end" | "missing-stop" | "in-progress" };
  segments: ScoredSegment[];
  metrics: SessionMetrics;
  explain: string[]; // the score and verified minutes, step by step, in plain words
};
