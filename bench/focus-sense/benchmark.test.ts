// Focus Sense benchmark entry: `npx vitest run bench/focus-sense`. Prints the report and writes last-report.md.
// v2 is the gated set. v1 is spent (its held-out split was used once) and is only reported, never gated.
// The classifier runs on v2 held-out (and its gates) only with FOCUS_SENSE_HELDOUT=1.
// Optional semantic run: FOCUS_SENSE_SEMANTIC=1 (reads AI_API_KEY / AI_BASE_URL from .env.local, free models only).
import { readFileSync, writeFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import type {
  ActivityInput,
  FocusClassification,
  FocusSessionContext,
  SemanticProvider,
} from "../../src/lib/desktop/sense/types";
import { blocklistBaseline, fitKeywordThreshold, keywordBaseline, tokens, type Baseline } from "./baselines";
import {
  LABELS,
  enforceableRates,
  evaluate,
  formatMetrics,
  pct,
  percentile,
  summaryTable,
  toContext,
  type Example,
  type Metrics,
  type Prediction,
  type Row,
} from "./harness";

const here = (f: string) => new URL(f, import.meta.url);
const load = (f: string) => JSON.parse(readFileSync(here(f), "utf8")) as Example[];
const v1 = [...load("dataset.dev.json"), ...load("dataset.heldout.json")];
const v2 = { dev: load("dataset2.dev.json"), heldout: load("dataset2.heldout.json") };
const v2all = [...v2.dev, ...v2.heldout];
const V1 = "v1 (spent)", DEV = "v2 dev", HELDOUT = "v2 heldout";

const CATEGORIES_V2 = [
  "youtube", "discord", "reddit", "ide", "lms", "pdf", "calculator", "trap", "idle-playback", "switching",
  "multipurpose", "research", "social", "gaming", "music", "private-missing",
];

// The classifier's public API (src/lib/desktop/sense/classify.ts). Loaded by a non-literal path so the benchmark
// still type-checks and runs its baselines while that module doesn't exist.
type SemanticCache = { readonly hits: number; readonly misses: number; readonly size: number };
type ClassifyOpts = { provider?: SemanticProvider; cache?: SemanticCache; timeoutMs?: number };
type ClassifierModule = {
  classifyLocal(input: ActivityInput, ctx: FocusSessionContext): FocusClassification & { needsSemantic: boolean };
  classify(inputs: ActivityInput[], ctx: FocusSessionContext, opts?: ClassifyOpts): Promise<FocusClassification[]>;
  offlineProvider: SemanticProvider;
  createSemanticCache(max?: number): SemanticCache;
};
const CLASSIFY_PATH = "../../src/lib/desktop/sense/classify";
// The cloud provider lives in semantic.ts only (never re-exported to client code); loaded just for the semantic run.
const SEMANTIC_PATH = "../../src/lib/desktop/sense/semantic";
type SemanticModule = {
  openRouterProvider(opts: { apiKey: string; baseUrl?: string; models: string[]; fetch?: typeof fetch; timeoutMs?: number }): SemanticProvider;
};
let loadError = "";
const classifier = (await import(/* @vite-ignore */ CLASSIFY_PATH).catch((e: unknown) => {
  loadError = e instanceof Error ? e.message : String(e);
  return null;
})) as ClassifierModule | null;

const FREE_MODELS = ["nvidia/nemotron-3-ultra-550b-a55b:free", "qwen/qwen3.8-27b:free"];
const semanticOn = process.env.FOCUS_SENSE_SEMANTIC === "1";
const heldoutOn = process.env.FOCUS_SENSE_HELDOUT === "1";

const runBaseline = (b: Baseline, xs: Example[]): Prediction[] => xs.map((e) => b(e.activity, toContext(e)));

// One classify call per example: examples are independent contexts, so none may see another as a neighbour.
async function runClassifier(c: ClassifierModule, xs: Example[], opts: ClassifyOpts, concurrency = 1): Promise<Prediction[]> {
  const out: Prediction[] = [];
  let next = 0;
  const worker = async () => {
    while (next < xs.length) {
      const i = next++;
      const ctx = toContext(xs[i]);
      const [p] = await c.classify([xs[i].activity], ctx, opts);
      out[i] = { ...p, needsSemantic: c.classifyLocal(xs[i].activity, ctx).needsSemantic };
    }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));
  return out;
}

const rows: Row[] = [];
const sections: string[] = [];
const results = new Map<string, Metrics>(); // `${system}/${split}`
const record = (system: string, split: string, m: Metrics) => {
  rows.push({ system, split, m });
  results.set(`${system}/${split}`, m);
  sections.push(formatMetrics(system, split, m));
};

const keywordThreshold = fitKeywordThreshold(v2.dev);
const KEYWORD = `keyword(t=${keywordThreshold})`;
const BASELINES: [string, Baseline][] = [
  ["blocklist", blocklistBaseline],
  [KEYWORD, keywordBaseline(keywordThreshold)],
];

function datasetSummary(): string {
  const line = (name: string, xs: Example[]) =>
    `| ${name} | ${xs.length} | ${LABELS.map((l) => xs.filter((e) => e.expected === l).length).join(" | ")} | ` +
    `${xs.filter((e) => e.hard).length} (${pct(xs.filter((e) => e.hard).length / xs.length)}) |`;
  const perCat = CATEGORIES_V2.map(
    (c) => `${c} ${v2.dev.filter((e) => e.category === c).length}/${v2.heldout.filter((e) => e.category === c).length}`,
  ).join(", ");
  return [
    "| split | n | ON_TASK | DISTRACTING | UNCERTAIN | hard |",
    "|---|---|---|---|---|---|",
    line(DEV, v2.dev),
    line(HELDOUT, v2.heldout),
    line("v2 all", v2all),
    line(V1, v1),
    "",
    `v2 per category (dev/heldout): ${perCat}`,
    "",
  ].join("\n");
}

const jaccard = (a: Set<string>, b: Set<string>) => {
  const inter = [...a].filter((t) => b.has(t)).length;
  return a.size + b.size ? inter / (a.size + b.size - inter) : 0;
};
const titled = (xs: Example[]) =>
  xs.flatMap((e) => (e.activity.windowTitle ? [{ id: e.id, title: e.activity.windowTitle, toks: new Set(tokens(e.activity.windowTitle)) }] : []));

describe("dataset", () => {
  test("v2 is well-formed, split cleanly, disjoint from v1 and covers every category", () => {
    const ids = [...v1, ...v2all].map((e) => e.id);
    expect(new Set(ids).size, "duplicate ids across v1 and v2").toBe(ids.length);

    for (const e of v2all) {
      expect(LABELS, e.id).toContain(e.expected);
      expect(CATEGORIES_V2, e.id).toContain(e.category);
      expect(e.rationale.trim().length, e.id).toBeGreaterThan(0);
      expect(typeof e.activity.hasWindow, e.id).toBe("boolean");
      expect([null, "excluded", "private"], e.id).toContain(e.activity.redacted);
      // Contract: a redacted context has no title; redacted and window-less contexts are never judged.
      if (e.activity.redacted) expect(e.activity.windowTitle, e.id).toBeNull();
      if (e.activity.redacted || !e.activity.hasWindow) expect(e.expected, e.id).toBe("UNCERTAIN");
    }

    // No exact or near-duplicate titles between v2 splits or against v1 (token Jaccard >= 0.6).
    const near = (a: ReturnType<typeof titled>, b: ReturnType<typeof titled>) =>
      a.flatMap((x) => b.filter((y) => x.title === y.title || jaccard(x.toks, y.toks) >= 0.6).map((y) => `${x.id} ~ ${y.id}`));
    expect(near(titled(v2.heldout), titled(v2.dev)), "v2 titles shared across splits").toEqual([]);
    expect(near(titled(v2all), titled(v1)), "v2 titles near v1 titles").toEqual([]);

    for (const [name, xs] of Object.entries(v2))
      expect(CATEGORIES_V2.filter((c) => !xs.some((e) => e.category === c)), `${name}: missing categories`).toEqual([]);

    const devShare = v2.dev.length / v2all.length;
    expect(v2all.length).toBeGreaterThanOrEqual(180);
    expect(devShare).toBeGreaterThan(0.55);
    expect(devShare).toBeLessThan(0.65);
    const uncertainShare = v2all.filter((e) => e.expected === "UNCERTAIN").length / v2all.length;
    expect(uncertainShare).toBeGreaterThanOrEqual(0.15);
    expect(uncertainShare).toBeLessThanOrEqual(0.25);
    expect(v2all.filter((e) => e.hard).length / v2all.length).toBeGreaterThanOrEqual(0.3);
  });
});

describe("baselines", () => {
  test("blocklist and keyword on v2 (both splits) and v1 (spent)", () => {
    for (const [split, xs] of [[DEV, v2.dev], [HELDOUT, v2.heldout], [V1, v1]] as const)
      for (const [name, b] of BASELINES) record(name, split, evaluate(xs, runBaseline(b, xs)));
  });
});

describe.skipIf(!classifier)("classifier (offline): v2 dev and v1 (spent)", () => {
  test("runs", async () => {
    for (const [split, xs] of [[DEV, v2.dev], [V1, v1]] as const)
      record("classifier", split, evaluate(xs, await runClassifier(classifier!, xs, { provider: classifier!.offlineProvider }, 8)));
  });
});

describe.skipIf(!classifier || !heldoutOn)("classifier (offline): v2 held-out gates", () => {
  beforeAll(async () => {
    record("classifier", HELDOUT, evaluate(v2.heldout, await runClassifier(classifier!, v2.heldout, { provider: classifier!.offlineProvider }, 8)));
  });

  test("beats the strongest baseline by at least 10 points of exact accuracy", () => {
    const strongest = Math.max(...BASELINES.map(([name]) => results.get(`${name}/${HELDOUT}`)!.exact));
    expect(results.get(`classifier/${HELDOUT}`)!.exact).toBeGreaterThanOrEqual(strongest + 0.1);
  });

  test("enforceable false positives stay within budget", () => {
    const r = enforceableRates(results.get(`classifier/${HELDOUT}`)!);
    expect(r.onTask, "among expected ON_TASK").toBeLessThanOrEqual(0.01);
    expect(r.notDistracting, "among expected not-DISTRACTING").toBeLessThanOrEqual(0.02);
  });
});

describe.skipIf(!semanticOn || !classifier)("classifier + semantic (OpenRouter, free models)", () => {
  test("runs and reports", { timeout: 600_000 }, async () => {
    const env = Object.fromEntries(
      readFileSync(here("../../.env.local"), "utf8")
        .split(/\r?\n/)
        .map((l) => /^\s*([A-Za-z_][\w.]*)\s*=\s*(.*?)\s*$/.exec(l))
        .filter((m): m is RegExpExecArray => !!m)
        .map((m) => [m[1], m[2].replace(/^(['"])(.*)\1$/, "$2")]),
    );
    expect(env.AI_API_KEY, "AI_API_KEY missing from .env.local").toBeTruthy();
    const { openRouterProvider } = (await import(/* @vite-ignore */ SEMANTIC_PATH)) as SemanticModule;
    const inner = openRouterProvider({
      apiKey: env.AI_API_KEY,
      ...(env.AI_BASE_URL ? { baseUrl: env.AI_BASE_URL } : {}),
      models: FREE_MODELS,
    });
    const latencies: number[] = [];
    let requests = 0;
    const provider: SemanticProvider = {
      name: inner.name,
      local: inner.local,
      async classify(reqs, signal) {
        requests += reqs.length;
        const t = performance.now();
        try {
          return await inner.classify(reqs, signal);
        } finally {
          latencies.push(performance.now() - t);
        }
      },
    };
    const cache = classifier!.createSemanticCache();
    const notes: string[] = [];
    const splits: [string, Example[]][] = heldoutOn ? [[DEV, v2.dev], [HELDOUT, v2.heldout]] : [[DEV, v2.dev]];
    for (const [split, xs] of splits) {
      const calls0 = latencies.length;
      const preds = await runClassifier(classifier!, xs, { provider, cache, timeoutMs: 20_000 }, 4);
      record("classifier+semantic", split, evaluate(xs, preds));
      notes.push(
        `${split}: needsSemantic ${pct(preds.filter((p) => p.needsSemantic).length / xs.length)}, ` +
          `decided by semantic ${pct(preds.filter((p) => p.method === "semantic").length / xs.length)}, ` +
          `provider calls ${latencies.length - calls0}`,
      );
    }
    sections.push(
      [
        "### semantic run",
        "",
        `models: ${FREE_MODELS.join(", ")}`,
        `provider calls ${latencies.length} (${requests} requests) · latency/call p50 ${percentile(latencies, 0.5).toFixed(0)} ms, ` +
          `p95 ${percentile(latencies, 0.95).toFixed(0)} ms · cache hits ${cache.hits}, misses ${cache.misses}, size ${cache.size}`,
        ...notes,
        "",
      ].join("\n"),
    );
  });
});

afterAll(() => {
  const report = [
    "# Focus Sense benchmark report",
    "",
    `Generated ${new Date().toISOString()} · gated set: v2 held-out · keyword threshold ${keywordThreshold} (fit on v2 dev) · ` +
      (classifier ? "classifier loaded" : `classifier not loaded (${loadError})`) +
      (heldoutOn ? " · v2 held-out classifier run ON" : " · v2 held-out classifier run off (FOCUS_SENSE_HELDOUT=1)") +
      (semanticOn ? " · semantic run on" : " · semantic run off"),
    "",
    "## Dataset",
    "",
    datasetSummary(),
    "## Summary",
    "",
    summaryTable(rows),
    "## Detail",
    "",
    ...sections,
  ].join("\n");
  // Not console.log: Vitest's agent reporter hides console output of passing tests; a direct write always shows.
  process.stdout.write(`${report}\n`);
  // Only the gated held-out run replaces the saved report; dev-only runs just print.
  if (heldoutOn) writeFileSync(here("last-report.md"), report);
});
