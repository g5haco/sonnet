// Focus Sense benchmark: dataset types and pure metric/report functions. No I/O here.
import { isEnforceable } from "../../src/lib/desktop/sense/types";
import type { ActivityInput, FocusClassification, FocusSessionContext, Label } from "../../src/lib/desktop/sense/types";

export type Example = {
  id: string;
  category: string;
  hard?: boolean;
  idle?: boolean; // note only: the student was idle; the label is still about the context
  context: Omit<FocusSessionContext, "sessionId"> & { sessionId?: string };
  activity: ActivityInput;
  expected: Label;
  rationale: string;
};

export type Prediction = FocusClassification & { needsSemantic?: boolean };

export const LABELS: Label[] = ["ON_TASK", "DISTRACTING", "UNCERTAIN"];

export const toContext = (e: Example): FocusSessionContext => ({ sessionId: `bench-${e.id}`, ...e.context });

const BINS: [string, number, number][] = [
  ["<0.5", 0, 0.5],
  ["0.5-0.7", 0.5, 0.7],
  ["0.7-0.9", 0.7, 0.9],
  ["0.9-1.0", 0.9, Infinity],
];

export type Metrics = {
  n: number;
  confusion: Record<Label, Record<Label, number>>; // [expected][predicted]
  exact: number;
  decisiveAccuracy: number;
  coverage: number;
  abstention: number;
  onTaskFP: number; // pred ON_TASK, expected != ON_TASK
  distractingFP: number; // pred DISTRACTING, expected != DISTRACTING
  missedDistracting: number; // expected DISTRACTING -> pred ON_TASK
  wrongDistracting: number; // expected ON_TASK -> pred DISTRACTING
  calibration: { bin: string; n: number; accuracy: number }[];
  needsSemantic: number | null; // share; null when the system doesn't report it
  enforceable: { count: number; fpOnTask: number; onTaskN: number; fpNotDistracting: number; notDistractingN: number; fpIds: string[] };
  hard: { n: number; exact: number };
};

const ratio = (a: number, b: number) => (b ? a / b : 0);

export function evaluate(examples: Example[], preds: Prediction[]): Metrics {
  if (examples.length !== preds.length) throw new Error("examples and predictions differ in length");
  const confusion = Object.fromEntries(LABELS.map((e) => [e, Object.fromEntries(LABELS.map((p) => [p, 0]))])) as Metrics["confusion"];
  const cal = BINS.map(() => ({ n: 0, ok: 0 }));
  let decisive = 0, decisiveOk = 0, ns = 0, nsKnown = false, hardN = 0, hardOk = 0;
  const enf = { count: 0, fpOnTask: 0, onTaskN: 0, fpNotDistracting: 0, notDistractingN: 0, fpIds: [] as string[] };

  examples.forEach((ex, i) => {
    const p = preds[i];
    const ok = p.label === ex.expected;
    confusion[ex.expected][p.label]++;
    if (ex.hard) {
      hardN++;
      if (ok) hardOk++;
    }
    if (p.needsSemantic !== undefined) {
      nsKnown = true;
      if (p.needsSemantic) ns++;
    }
    if (p.label !== "UNCERTAIN") {
      decisive++;
      if (ok) decisiveOk++;
      // A NaN or negative confidence lands in the lowest bin.
      const b = Math.max(0, BINS.findIndex(([, lo, hi]) => p.confidence >= lo && p.confidence < hi));
      cal[b].n++;
      if (ok) cal[b].ok++;
    }
    if (ex.expected === "ON_TASK") enf.onTaskN++;
    if (ex.expected !== "DISTRACTING") enf.notDistractingN++;
    if (isEnforceable(p)) {
      enf.count++;
      if (ex.expected === "ON_TASK") enf.fpOnTask++;
      if (ex.expected !== "DISTRACTING") {
        enf.fpNotDistracting++;
        enf.fpIds.push(ex.id);
      }
    }
  });

  const n = examples.length;
  const sumPred = (l: Label) => LABELS.reduce((s, e) => s + confusion[e][l], 0);
  return {
    n,
    confusion,
    exact: ratio(LABELS.reduce((s, l) => s + confusion[l][l], 0), n),
    decisiveAccuracy: ratio(decisiveOk, decisive),
    coverage: ratio(decisive, n),
    abstention: ratio(sumPred("UNCERTAIN"), n),
    onTaskFP: sumPred("ON_TASK") - confusion.ON_TASK.ON_TASK,
    distractingFP: sumPred("DISTRACTING") - confusion.DISTRACTING.DISTRACTING,
    missedDistracting: confusion.DISTRACTING.ON_TASK,
    wrongDistracting: confusion.ON_TASK.DISTRACTING,
    calibration: BINS.map(([bin], i) => ({ bin, n: cal[i].n, accuracy: ratio(cal[i].ok, cal[i].n) })),
    needsSemantic: nsKnown ? ratio(ns, n) : null,
    enforceable: enf,
    hard: { n: hardN, exact: ratio(hardOk, hardN) },
  };
}

export const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
const SHORT: Record<Label, string> = { ON_TASK: "ON", DISTRACTING: "DIS", UNCERTAIN: "UNC" };

export function formatMetrics(system: string, split: string, m: Metrics): string {
  const e = m.enforceable;
  const row = (l: Label) => `| ${l} | ${LABELS.map((p) => m.confusion[l][p]).join(" | ")} |`;
  return [
    `### ${system} / ${split} (n=${m.n})`,
    "",
    `exact ${pct(m.exact)} · decisive ${pct(m.decisiveAccuracy)} at coverage ${pct(m.coverage)} · abstain ${pct(m.abstention)} · hard ${pct(m.hard.exact)} (n=${m.hard.n})` +
      (m.needsSemantic === null ? "" : ` · needsSemantic ${pct(m.needsSemantic)}`),
    "",
    `| expected \\ predicted | ${LABELS.map((l) => SHORT[l]).join(" | ")} |`,
    "|---|---|---|---|",
    ...LABELS.map(row),
    "",
    `FP: ON_TASK ${m.onTaskFP}, DISTRACTING ${m.distractingFP} · FN: DIS→ON ${m.missedDistracting}, ON→DIS ${m.wrongDistracting}`,
    `calibration (decisive): ${m.calibration.map((c) => `${c.bin} n=${c.n}${c.n ? ` acc ${pct(c.accuracy)}` : ""}`).join(" · ")}`,
    `enforceable: ${e.count} · FP among expected ON_TASK ${e.fpOnTask}/${e.onTaskN} (${pct(ratio(e.fpOnTask, e.onTaskN))})` +
      ` · among expected not-DISTRACTING ${e.fpNotDistracting}/${e.notDistractingN} (${pct(ratio(e.fpNotDistracting, e.notDistractingN))})` +
      (e.fpIds.length ? ` · ids: ${e.fpIds.join(", ")}` : ""),
    "",
  ].join("\n");
}

export type Row = { system: string; split: string; m: Metrics };

export function summaryTable(rows: Row[]): string {
  return [
    "| system | split | n | exact | decisive | coverage | abstain | hard | ON FP | DIS FP | FN DIS→ON | FN ON→DIS | enforceable | enf FP (ON) | enf FP (¬DIS) | needsSemantic |",
    "|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|",
    ...rows.map(({ system, split, m }) => {
      const e = m.enforceable;
      return `| ${system} | ${split} | ${m.n} | ${pct(m.exact)} | ${pct(m.decisiveAccuracy)} | ${pct(m.coverage)} | ${pct(m.abstention)} | ${pct(m.hard.exact)} | ${m.onTaskFP} | ${m.distractingFP} | ${m.missedDistracting} | ${m.wrongDistracting} | ${e.count} | ${pct(ratio(e.fpOnTask, e.onTaskN))} | ${pct(ratio(e.fpNotDistracting, e.notDistractingN))} | ${m.needsSemantic === null ? "—" : pct(m.needsSemantic)} |`;
    }),
    "",
  ].join("\n");
}

export const enforceableRates = (m: Metrics) => ({
  onTask: ratio(m.enforceable.fpOnTask, m.enforceable.onTaskN),
  notDistracting: ratio(m.enforceable.fpNotDistracting, m.enforceable.notDistractingN),
});

export function percentile(xs: number[], q: number): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.ceil(q * s.length) - 1)];
}
