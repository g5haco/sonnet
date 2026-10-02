import { describe, expect, it } from "vitest";
import { MISSING_STOP_GRACE_MS, scoreSession } from "./score";
import type { ClassifiedEvent, Label, SessionReport, SessionWindow } from "./types";

const T0 = 1_700_000_000_000;
const S = 1000;
const M = 60 * S;
const at = (min: number) => T0 + Math.round(min * M);
const W: SessionWindow = { start: T0, intendedEnd: at(60), now: at(180) };

const base = (kind: ClassifiedEvent["kind"], timestamp: number): ClassifiedEvent => ({
  seq: 0,
  timestamp,
  sessionId: String(T0),
  platform: "windows",
  kind,
  source: kind === "context" ? "foreground-window" : "monitor",
  idle: false,
  appName: null,
  processName: null,
  windowTitle: null,
  redacted: null,
  confidence: "none",
  classification: null,
});
type Opts = { idle?: boolean; redacted?: "private" | "excluded" };
const ctx = (ts: number, label: Label, title: string | null, o: Opts = {}): ClassifiedEvent => ({
  ...base("context", ts),
  idle: o.idle ?? false,
  appName: "App",
  processName: "app.exe",
  windowTitle: o.redacted ? null : title,
  redacted: o.redacted ?? null,
  confidence: o.redacted ? "partial" : "full",
  classification: {
    label,
    confidence: label === "UNCERTAIN" ? 0 : 0.95,
    reason: o.redacted ? "Redacted window." : `${label}: ${title}`,
    method: label === "UNCERTAIN" ? "abstain" : "rule",
  },
});
const start = (ts: number) => base("start", ts);
const stop = (ts: number) => base("stop", ts);
const numbered = (evs: ClassifiedEvent[]) => evs.map((e, i) => ({ ...e, seq: i + 1 }));

// [label, title, seconds, opts]; a context event at each step's start, heartbeats every 60 s without another event.
type Step = [Label, string | null, number, Opts?];
const steps = (from: number, list: Step[]) => {
  const events: ClassifiedEvent[] = [];
  let t = from;
  for (const [label, title, sec, o] of list) {
    events.push(ctx(t, label, title, o));
    for (let h = t + M; h < t + sec * S; h += M) events.push(base("heartbeat", h));
    t += sec * S;
  }
  return { events, end: t };
};
const session = (list: Step[], o: { from?: number; stop?: boolean } = {}) => {
  const from = o.from ?? T0;
  const { events, end } = steps(from, list);
  return numbered([start(from), ...events, ...(o.stop === false ? [] : [stop(end)])]);
};
const m = (x: number) => x * 60; // minutes -> step seconds
const repeat = <T>(n: number, xs: T[]): T[] => Array.from({ length: n }, () => xs).flat();
const ON = (title: string, sec: number, o?: Opts): Step => ["ON_TASK", title, sec, o];
const DIS = (title: string, sec: number): Step => ["DISTRACTING", title, sec];
const UNC = (title: string | null, sec: number, o?: Opts): Step => ["UNCERTAIN", title, sec, o];

const scenarios: Record<string, { events: ClassifiedEvent[]; window?: SessionWindow }> = {
  "1 near-perfect": {
    events: session([ON("lab3.py - VS Code", m(25)), UNC("File Explorer", 5), ON("Python docs - Chrome", m(20) - 5), ON("lab3.py - VS Code", m(15))]),
  },
  "2 58 work + 2 distracted": {
    events: session([ON("Essay - Google Docs", m(30)), DIS("Funny cats - YouTube", m(2)), ON("Essay - Google Docs", m(28))]),
  },
  "3 brief slip, fast back": {
    events: session([ON("Essay - Google Docs", m(20)), DIS("Instagram", 40), ON("Essay - Google Docs", m(40) - 40)]),
  },
  "4 repeated drifting": {
    events: session([ON("Problem set - Canvas", m(5)), ...repeat(5, [DIS("Home / X", m(4)), ON("Problem set - Canvas", m(7))])]),
  },
  "5 timer farming": {
    events: session([ON("Homework - Canvas", m(10)), ...repeat(5, [DIS("Minecraft", m(10) - 10), ON("Homework - Canvas", 10)])]),
  },
  "6 research multi-app": {
    events: session(
      repeat(12, [ON("Article - Chrome", 90), UNC("New Tab", 8), ON("Notes - Docs", 60), UNC("File Explorer", 25), ON("paper.pdf - Acrobat", 117)]),
    ),
  },
  "7 one long distraction": {
    events: session([ON("Lab report - Word", m(20)), DIS("Netflix", m(20)), ON("Lab report - Word", m(20))]),
  },
  "8a idle break 10 min": {
    events: session([ON("Notes - Docs", m(32)), ON("Notes - Docs", m(8), { idle: true }), ON("Notes - Docs", m(20))]),
  },
  "8b walked away 45 min": {
    events: session([ON("Notes - Docs", m(17)), ON("Notes - Docs", m(43), { idle: true })]),
  },
  "9 relevant Discord": {
    events: session([ON("Lab - Docs", m(20)), ON("#bio-study-group | Discord", m(10)), ON("Lab - Docs", m(30))]),
  },
  "10 irrelevant Discord": {
    events: session([ON("Lab - Docs", m(40)), DIS("#memes | Discord", m(12)), ON("Lab - Docs", m(8))]),
  },
  "11 biology YouTube": {
    events: session([
      ON("Mitosis lecture - YouTube", m(15)),
      ON("Bio notes - OneNote", m(2)),
      ON("Mitosis lecture - YouTube", m(12)),
      ON("Mitosis lecture - YouTube", m(3), { idle: true }), // watched without touching anything
      ON("Bio notes - OneNote", m(3)),
      ON("Mitosis lecture - YouTube", m(25)),
    ]),
  },
  "12 gaming YouTube": {
    events: session([ON("Lab - Docs", m(15)), DIS("Minecraft speedrun - YouTube", m(30)), ON("Lab - Docs", m(15))]),
  },
  "13 useful Reddit": {
    events: session([ON("Bio - Docs", m(20)), ON("Meiosis vs mitosis : r/biology", m(8)), ON("Bio - Docs", m(32))]),
  },
  "14 unrelated Reddit": {
    events: session([
      ...repeat(3, [ON("Bio - Docs", m(12)), DIS("r/funny - Reddit", m(5))]),
      ON("Bio - Docs", m(9)),
    ]),
  },
  "15 relevant IDE": {
    events: session([ON("lab3.py - cs1410 - VS Code", m(45)), ON("Terminal - pytest", m(3)), ON("lab3.py - cs1410 - VS Code", m(12))]),
  },
  "16 unrelated IDE": {
    events: session([UNC("minecraft-mod - VS Code", m(30)), ON("lab3.py - cs1410 - VS Code", m(8)), UNC("minecraft-mod - VS Code", m(22))]),
  },
  "17 LMS/PDF study": {
    events: session(repeat(6, [ON("Quiz 4 - Canvas", m(4)), UNC("Downloads", 10), ON("ch7.pdf - Edge", m(6) - 10)])),
  },
  "18 calculator math": {
    events: session(repeat(20, [ON("hw5.pdf - Edge", m(3) - 10), ON("Calculator", 10)])),
  },
  "19a hard kill": {
    events: session([ON("Essay - Google Docs", m(29.5))], { stop: false }),
  },
  "19b kill + relaunch": {
    events: numbered([
      ...session([ON("Essay - Google Docs", m(20.5))], { stop: false }),
      ...session([ON("Essay - Google Docs", m(35))], { from: at(25) }),
    ]),
  },
  "20 redacted/uncertain": {
    events: session([
      ON("Essay - Docs", m(25)),
      UNC(null, m(20), { redacted: "private" }),
      DIS("TikTok", m(3)),
      ON("Essay - Docs", m(12)),
    ]),
  },
};
const run = (name: string) => scoreSession(scenarios[name].events, scenarios[name].window ?? W);
const mins = (ms: number) => Math.round(ms / 6000) / 10;

const invariants = (r: SessionReport, w: SessionWindow) => {
  const x = r.metrics;
  expect(x.focusedMs + x.distractionMs + x.slipMs + x.uncertainMs + x.idleMs + x.unmonitoredMs).toBe(x.sessionMs);
  expect(x.sessionMs).toBe(r.window.end - w.start);
  let t = w.start;
  for (const s of r.segments) {
    expect(s.start).toBe(t);
    expect(s.end).toBeGreaterThan(s.start);
    t = s.end;
  }
  expect(t).toBe(r.window.end);
  expect(r.window.end).toBeLessThanOrEqual(w.intendedEnd);
  if (x.focusScore !== null) expect(x.focusScore).toBeGreaterThanOrEqual(0);
  expect(x.focusScore ?? 0).toBeLessThanOrEqual(100);
  expect(r.explain.length).toBeGreaterThanOrEqual(4);
  expect(r.explain.length).toBeLessThanOrEqual(8);
  expect(r.explain.every((l) => l.length > 0)).toBe(true);
};

describe("scoreSession scenarios", () => {
  it("holds the invariants for every scenario and prints the table", () => {
    const rows = Object.keys(scenarios).map((name) => {
      const r = run(name);
      invariants(r, scenarios[name].window ?? W);
      const x = r.metrics;
      return [name.padEnd(26), String(x.focusScore ?? "null").padStart(5), String(x.verifiedMinutes).padStart(4), ...[x.focusedMs, x.distractionMs, x.idleMs, x.uncertainMs, x.unmonitoredMs].map((v) => String(mins(v)).padStart(5)), String(x.distractionEvents).padStart(3), String(x.slips).padStart(3), r.window.endRule].join(" ");
    });
    console.log(["scenario".padEnd(26), "score", "ver", "focus", " dist", " idle", "  unc", "unmon", " ep", "slp", "end"].join(" ") + "\n" + rows.join("\n"));
  });

  it("1 near-perfect session scores 100 and verifies only on-task minutes", () => {
    const { metrics: x, segments } = run("1 near-perfect");
    expect(x.focusScore).toBe(100);
    expect(x.verifiedMinutes).toBe(59); // the 5 s absorbed UNCERTAIN shapes the block but isn't credited
    expect(x.uncertainMs).toBe(5 * S);
    expect(x.longestFocusedBlockMs).toBe(60 * M - 5 * S);
    expect(segments.some((s) => s.rawKind === "UNCERTAIN" && s.kind === "ON_TASK" && s.note?.startsWith("absorbed"))).toBe(true);
  });

  it("2 two minutes of distraction cost a few points", () => {
    const x = run("2 58 work + 2 distracted").metrics;
    expect(x.focusScore).toBeGreaterThanOrEqual(95);
    expect(x.focusScore).toBeLessThan(100);
    expect(x.verifiedMinutes).toBe(58);
    expect([x.distractionEvents, x.recoveries, x.medianRecoveryMs]).toEqual([1, 1, 2 * M]);
  });

  it("3 a brief slip with a fast return is forgiven, not credited", () => {
    const r = run("3 brief slip, fast back");
    expect(r.metrics.focusScore).toBe(100);
    expect([r.metrics.slips, r.metrics.distractionEvents, r.metrics.slipMs]).toEqual([1, 0, 40 * S]);
    expect(r.metrics.verifiedMinutes).toBe(59);
    expect(r.metrics.longestFocusedBlockMs).toBe(60 * M - 40 * S); // the slip doesn't break the block
    expect(r.segments.find((s) => s.kind === "DISTRACTING")?.note).toBe("brief slip, forgiven");
  });

  it("4 repeated drifting scores no better than its on-task share", () => {
    const x = run("4 repeated drifting").metrics;
    expect([x.distractionEvents, x.recoveries, x.medianRecoveryMs]).toEqual([5, 5, 4 * M]);
    expect(x.verifiedMinutes).toBe(40);
    expect(x.focusScore).toBeLessThanOrEqual(Math.round((100 * 40) / 60));
    expect(x.focusScore).toBeGreaterThanOrEqual(50);
  });

  it("5 timer farming gets a low score and low verified minutes", () => {
    const x = run("5 timer farming").metrics;
    expect(x.focusScore).toBeLessThanOrEqual(15);
    expect(x.verifiedMinutes).toBe(10); // the 10 s check-ins are absorbed into the game
    expect(x.distractionEvents).toBe(1);
    expect(x.recoveries).toBe(0);
  });

  it("6 research across many apps isn't fragmented or penalised", () => {
    const x = run("6 research multi-app").metrics;
    expect(x.focusScore).toBe(100);
    expect(x.verifiedMinutes).toBe(53);
    expect(x.uncertainMs).toBe(5 * M + 12 * 8 * S); // 8 s new tabs are absorbed, still not credited
    expect(x.longestFocusedBlockMs).toBe(55 * M - 12 * 8 * S);
  });

  it("7 one long distraction hurts more than several short ones or many tiny ones", () => {
    const long = run("7 one long distraction").metrics;
    const several = scoreSession(session([ON("Lab report - Word", m(2)), ...repeat(10, [DIS("Netflix", m(2)), ON("Lab report - Word", m(3.8))])]), W).metrics;
    const tiny = scoreSession(session(repeat(20, [ON("Lab report - Word", m(2.5)), DIS("Instagram", 30)])), W).metrics;
    expect(long.distractionMs).toBe(several.distractionMs);
    expect(long.focusScore!).toBeLessThan(several.focusScore!);
    expect(several.focusScore!).toBeLessThan(tiny.focusScore!);
    expect(tiny.focusScore).toBeGreaterThanOrEqual(90); // 10 min of slips: 6 min free, 4 min cost
    expect([tiny.slips, tiny.distractionEvents]).toEqual([20, 0]);
    expect(long.focusScore).toBeLessThanOrEqual(60);
  });

  it("8 a normal idle break is free; walking away is not", () => {
    const brk = run("8a idle break 10 min").metrics;
    expect(brk.idleMs).toBe(10 * M); // backdated 2 min to the last input
    expect(brk.focusScore).toBe(100);
    expect(brk.verifiedMinutes).toBe(50);
    expect(brk.longestFocusedBlockMs).toBe(30 * M);
    const away = run("8b walked away 45 min").metrics;
    expect(away.idleMs).toBe(45 * M);
    expect(away.focusScore).toBeLessThanOrEqual(40);
    expect(away.verifiedMinutes).toBe(15);
  });

  it("9-18 context-dependent apps follow their labels", () => {
    for (const name of ["9 relevant Discord", "13 useful Reddit", "15 relevant IDE"]) {
      expect(run(name).metrics.focusScore).toBe(100);
      expect(run(name).metrics.verifiedMinutes).toBe(60);
    }
    const discord = run("10 irrelevant Discord").metrics;
    expect(discord.focusScore).toBeGreaterThanOrEqual(65);
    expect(discord.focusScore).toBeLessThanOrEqual(85);
    expect(discord.verifiedMinutes).toBe(48);

    const lecture = run("11 biology YouTube").metrics;
    expect(lecture.focusScore).toBe(100);
    expect(lecture.idleMs).toBe(5 * M); // passive watching becomes IDLE: not credited, not penalised
    expect(lecture.verifiedMinutes).toBe(55);

    const gaming = run("12 gaming YouTube").metrics;
    expect(gaming.focusScore).toBeLessThanOrEqual(45);
    expect(gaming.verifiedMinutes).toBe(30);

    const reddit = run("14 unrelated Reddit").metrics;
    expect(reddit.distractionEvents).toBe(3);
    expect(reddit.focusScore).toBeGreaterThanOrEqual(60);
    expect(reddit.focusScore).toBeLessThanOrEqual(80);

    const ide = run("16 unrelated IDE").metrics;
    expect(ide.focusScore).toBeNull();
    expect(ide.verifiedMinutes).toBe(8);
    expect(ide.distractionMs).toBe(0); // UNCERTAIN is never distraction

    expect(run("17 LMS/PDF study").metrics.focusScore).toBe(100);
    expect(run("17 LMS/PDF study").metrics.verifiedMinutes).toBe(59);

    const calc = run("18 calculator math").metrics;
    expect(calc.longestFocusedBlockMs).toBe(60 * M);
    expect(calc.verifiedMinutes).toBe(60);
  });

  it("19 a missing stop counts only up to the grace after the last sign of the monitor", () => {
    const kill = run("19a hard kill");
    expect(kill.window.endRule).toBe("missing-stop");
    expect(kill.window.end).toBe(at(29) + MISSING_STOP_GRACE_MS); // last heartbeat at 29 min
    expect(kill.metrics.verifiedMinutes).toBe(30);
    expect(kill.explain[0]).toMatch(/no stop was recorded/);

    const relaunch = run("19b kill + relaunch");
    expect(relaunch.window.endRule).toBe("timer-end");
    expect(relaunch.metrics.unmonitoredMs).toBe(at(25) - (at(20) + MISSING_STOP_GRACE_MS));
    expect(relaunch.metrics.verifiedMinutes).toBe(56);
    expect(relaunch.segments.find((s) => s.kind === "UNMONITORED")).toMatchObject({ start: at(21.5), end: at(25) });
  });

  it("20 redacted and uncertain time is neutral", () => {
    const x = run("20 redacted/uncertain").metrics;
    expect(x.uncertainMs).toBe(20 * M);
    expect(x.verifiedMinutes).toBe(37);
    expect(x.focusScore).toBeGreaterThanOrEqual(88);
    expect(x.evidence).toBeCloseTo(40 / 60);
  });
});

describe("scoreSession edge cases", () => {
  it("no events: all unmonitored, no score", () => {
    const r = scoreSession([], W);
    invariants(r, W);
    expect(r.window).toEqual({ start: T0, end: at(60), endRule: "timer-end" });
    expect(r.metrics.unmonitoredMs).toBe(60 * M);
    expect([r.metrics.focusScore, r.metrics.verifiedMinutes]).toEqual([null, 0]);
    expect(scoreSession([], { ...W, now: at(10) }).window).toEqual({ start: T0, end: at(10), endRule: "in-progress" });
  });

  it("only start and stop: monitored but undecided", () => {
    const beats = Array.from({ length: 59 }, (_, i) => base("heartbeat", at(i + 1)));
    const r = scoreSession(numbered([start(T0), ...beats, stop(at(60))]), W);
    invariants(r, W);
    expect(r.metrics.uncertainMs).toBe(60 * M);
    // Without heartbeats the hour is a silent gap: only the grace after the start counts as monitored.
    expect(scoreSession(numbered([start(T0), stop(at(60))]), W).metrics.monitoredMs).toBe(MISSING_STOP_GRACE_MS);
    expect([r.metrics.focusScore, r.metrics.verifiedMinutes, r.metrics.evidence]).toEqual([null, 0, 0]);
  });

  it("clips events before the start and after the timer's end", () => {
    const r = scoreSession(session([ON("Docs", m(75))], { from: at(-5) }), W);
    invariants(r, W);
    expect(r.window).toEqual({ start: T0, end: at(60), endRule: "timer-end" });
    expect(r.metrics.focusedMs).toBe(60 * M);
    expect(r.metrics.verifiedMinutes).toBe(60);
  });

  it("a stop before the timer's end ends the window there", () => {
    const r = scoreSession(session([ON("Docs", m(30))]), W);
    expect(r.window).toEqual({ start: T0, end: at(30), endRule: "stop" });
    expect(r.metrics.verifiedMinutes).toBe(30);
  });

  it("a pause is unmonitored: no credit, no penalty", () => {
    const evs = numbered([...session([ON("Docs", m(20))]), ...session([ON("Docs", m(30))], { from: at(30) })]);
    const r = scoreSession(evs, W);
    invariants(r, W);
    expect(r.segments.find((s) => s.kind === "UNMONITORED")).toMatchObject({ start: at(20), end: at(30) });
    expect(r.metrics.unmonitoredMs).toBe(10 * M);
    expect(r.metrics.focusScore).toBe(100);
    expect(r.metrics.verifiedMinutes).toBe(50);
    expect(r.metrics.longestFocusedBlockMs).toBe(30 * M); // a pause ends a focused block
  });

  it("heartbeats extend liveness for the missing-stop rule", () => {
    const evs = session([ON("Docs", m(40.5))], { stop: false });
    expect(scoreSession(evs, W).window.end).toBe(at(40) + MISSING_STOP_GRACE_MS);
    const noBeats = numbered(evs.filter((e) => e.kind !== "heartbeat"));
    const r = scoreSession(noBeats, W);
    expect(r.window).toEqual({ start: T0, end: T0 + MISSING_STOP_GRACE_MS, endRule: "missing-stop" });
    expect(r.metrics.verifiedMinutes).toBe(1);
  });

  it("rapid 5-second alternation is one episode, not dozens", () => {
    const evs = session([ON("Essay", m(20)), ...repeat(60, [ON("Essay", 5), DIS("YouTube", 5)]), ON("Essay", m(30))]);
    const r = scoreSession(evs, W);
    invariants(r, W);
    expect([r.metrics.distractionEvents, r.metrics.slips, r.metrics.recoveries]).toEqual([1, 0, 1]);
    expect(r.metrics.distractionMs).toBe(5 * M);
    expect(r.metrics.focusScore).toBeLessThan(95);
    expect(r.metrics.verifiedMinutes).toBe(55);
  });

  it("an in-progress session counts up to now", () => {
    const evs = session([ON("Docs", m(20.25))], { stop: false });
    const r = scoreSession(evs, { ...W, now: at(20.5) });
    expect(r.window).toEqual({ start: T0, end: at(20.5), endRule: "in-progress" });
    expect(r.metrics.verifiedMinutes).toBe(20);
    expect(r.explain[0]).toMatch(/still running/);
  });

  it("idle is backdated, but never before the previous segment's start", () => {
    const evs = session([ON("Docs", m(10)), DIS("YouTube", 30), ON("Docs", m(5), { idle: true }), ON("Docs", m(15))]);
    const idle = scoreSession(evs, W).segments.find((s) => s.kind === "IDLE");
    expect(idle).toMatchObject({ start: at(10), end: at(15.5) });
  });

  it("a silent gap inside a run (sleep) is unmonitored, not credited", () => {
    const evs = numbered([start(T0), ctx(at(1), "ON_TASK", "Docs"), base("heartbeat", at(24)), stop(at(25))]);
    const r = scoreSession(evs, W);
    invariants(r, W);
    expect(r.window).toEqual({ start: T0, end: at(25), endRule: "stop" });
    expect(r.segments.find((s) => s.kind === "UNMONITORED")).toMatchObject({ start: at(1) + MISSING_STOP_GRACE_MS, end: at(24) });
    expect(r.metrics.focusedMs).toBe(MISSING_STOP_GRACE_MS + M); // 1 to 2.5 min, then 24 to 25 in the same context
    expect(r.metrics.verifiedMinutes).toBe(2);
  });

  it("short stretches only absorb into long neighbours, and UNCERTAIN is never credited", () => {
    const w25 = { ...W, intendedEnd: at(25) };
    const a = scoreSession(session(repeat(100, [ON("Docs", 1), UNC("Search", 14)])), w25);
    invariants(a, w25);
    expect(a.metrics.focusedMs).toBe(100 * S);
    expect(a.metrics.verifiedMinutes).toBe(1);
    expect(a.metrics.focusScore).toBeNull();
    const g = scoreSession(session(repeat(100, [ON("Docs", 14), UNC("Search", 1)])), w25);
    invariants(g, w25);
    expect(g.metrics.focusedMs).toBe(1400 * S);
    expect(g.metrics.verifiedMinutes).toBe(23);
  });

  it("a stream of slips costs beyond its free budget", () => {
    const r = scoreSession(session(repeat(30, [DIS("YouTube", 59), ON("Essay", 61)])), W);
    invariants(r, W);
    expect([r.metrics.slips, r.metrics.distractionEvents]).toEqual([30, 0]);
    expect(r.metrics.focusScore).toBeLessThanOrEqual(60);
    expect(r.metrics.verifiedMinutes).toBe(30);
    expect(r.explain.join(" ")).toMatch(/free up to 6 min/);
  });

  it("idle on a DISTRACTING context stays distraction", () => {
    const r = scoreSession(session([ON("Essay", m(15)), DIS("Netflix", m(2)), ["DISTRACTING", "Netflix", m(43), { idle: true }]]), W);
    invariants(r, W);
    expect(r.metrics.idleMs).toBe(0);
    expect(r.metrics.distractionMs).toBe(45 * M);
    expect(r.metrics.focusScore).toBeLessThanOrEqual(20);
    expect(r.metrics.verifiedMinutes).toBe(15);
  });

  it("is deterministic and independent of input order", () => {
    const evs = scenarios["4 repeated drifting"].events;
    const copy = structuredClone(evs);
    const a = scoreSession(evs, W);
    expect(scoreSession(evs, W)).toEqual(a);
    expect(scoreSession([...evs].reverse(), W)).toEqual(a);
    expect(evs).toEqual(copy); // input untouched
  });
});
