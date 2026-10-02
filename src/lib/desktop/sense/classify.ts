// Focus Sense classifier: labels each foreground context ON_TASK, DISTRACTING or UNCERTAIN against the session.
// Cheapest signal first: rules (rules.ts), then title heuristics (heuristics.ts), then, only for ambiguous titles, a
// SemanticProvider (semantic.ts). Pure: nothing is stored or changed, and the classifier itself never throws.
import type { FocusActivityEvent } from "../focus-sense";
import { toActivity, type ActivityInput, type ClassifiedEvent, type FocusClassification, type FocusSessionContext, type SemanticProvider, type SemanticRequest, type SemanticVerdict } from "./types";
import { readContext } from "./lexicon";
import { abstain, gate, rule, surface } from "./rules";
import { judge } from "./heuristics";
import { cacheKey, offlineProvider, semanticRequest, verdict, type SemanticCache } from "./semantic";

// openRouterProvider needs an API key and stays out of the client bundle: import it from ./semantic where it's used.
export { createSemanticCache, offlineProvider, semanticRequest, type SemanticCache } from "./semantic";
export type { ActivityInput, FocusClassification, FocusSessionContext, SemanticProvider, SemanticRequest, SemanticVerdict } from "./types";

export type LocalResult = FocusClassification & { needsSemantic: boolean };

const BATCH = 20;
const MIN_CONFIDENCE = 0.6; // below this a semantic verdict is only a lean
const MAX_CONFIDENCE = 0.85; // a semantic verdict alone is never enforceable

// Layers 1-2: sync, no network.
export function classifyLocal(input: ActivityInput, ctx: FocusSessionContext): LocalResult {
  const gated = gate(input);
  if (gated) return { ...gated, needsSemantic: false };
  const c = readContext(ctx);
  const s = surface(input);
  const r = rule(s, c) ?? judge(s, c);
  return { ...r, needsSemantic: r.label === "UNCERTAIN" && c.any && semanticRequest(input, ctx) !== null };
}

type Opts = { provider?: SemanticProvider; cache?: SemanticCache; timeoutMs?: number };

// A provider call bounded by a timeout; a string says why there's no answer.
async function ask(p: SemanticProvider, requests: SemanticRequest[], ms: number): Promise<unknown[] | string> {
  const ac = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const late = new Promise<string>((resolve) => {
    timer = setTimeout(() => {
      ac.abort();
      resolve("The semantic check timed out.");
    }, ms);
  });
  try {
    const res = await Promise.race([p.classify(requests, ac.signal), late]);
    return Array.isArray(res) || typeof res === "string" ? res : "The semantic check didn't answer.";
  } catch {
    return "The semantic check failed.";
  } finally {
    clearTimeout(timer);
  }
}

// Full pipeline: local first; only needsSemantic items go to the provider, deduped, cached and batched.
export async function classify(inputs: ActivityInput[], ctx: FocusSessionContext, opts: Opts = {}): Promise<FocusClassification[]> {
  const local = inputs.map((input): LocalResult => {
    try {
      return classifyLocal(input, ctx);
    } catch {
      return { ...abstain("This window couldn't be read."), needsSemantic: false };
    }
  });
  const out = local.map((l): FocusClassification => {
    const r: FocusClassification & { needsSemantic?: boolean } = { ...l };
    delete r.needsSemantic;
    return r;
  });
  const todo = local.flatMap((l, i) => (l.needsSemantic ? [i] : []));
  if (!todo.length) return out;

  const { provider, cache, timeoutMs = 8000 } = opts;
  const unsure = (i: number, why: string, lean = local[i].lean) =>
    (out[i] = { ...abstain(`${local[i].reason} ${why}`), ...(lean ? { lean } : {}) });
  if (!provider || provider === offlineProvider) {
    todo.forEach((i) => unsure(i, "No semantic check is available."));
    return out;
  }

  try {
    const keys = new Map<number, string>();
    const pending = new Map<string, SemanticRequest>();
    const answers = new Map<string, SemanticVerdict | string>();
    for (const i of todo) {
      const req = semanticRequest(inputs[i], ctx);
      if (!req) continue;
      const k = cacheKey(req);
      keys.set(i, k);
      if (answers.has(k) || pending.has(k)) continue;
      const hit = cache?.get(k);
      if (hit) answers.set(k, hit);
      else pending.set(k, req);
    }
    const batches: [string, SemanticRequest][][] = [];
    const queue = [...pending];
    while (queue.length) batches.push(queue.splice(0, BATCH));
    await Promise.all(
      batches.map(async (batch) => {
        const res = await ask(provider, batch.map(([, r]) => r), timeoutMs);
        batch.forEach(([k], j) => {
          const v = typeof res === "string" ? null : verdict(res[j]);
          if (v) cache?.set(k, v);
          answers.set(k, v ?? (typeof res === "string" ? res : "The semantic check didn't answer."));
        });
      }),
    );
    for (const i of todo) {
      const a = answers.get(keys.get(i) ?? "") ?? "No semantic check could be made.";
      if (typeof a === "string") unsure(i, a);
      else if (a.label === "UNCERTAIN") unsure(i, "The semantic check couldn't tell either.");
      else if (a.confidence < MIN_CONFIDENCE) unsure(i, "The semantic check wasn't sure.", a.label);
      else out[i] = { label: a.label, confidence: Math.min(a.confidence, MAX_CONFIDENCE), reason: a.reason, method: "semantic" };
    }
  } catch {
    todo.forEach((i) => unsure(i, "The semantic check failed."));
  }
  return out;
}

// For the UI: classifies `context` events (identical contexts once); start, stop and heartbeat markers get null.
export async function classifyEvents(events: FocusActivityEvent[], ctx: FocusSessionContext, opts?: Opts): Promise<ClassifiedEvent[]> {
  const index = new Map<string, number>();
  const inputs: ActivityInput[] = [];
  const at = events.map((e) => {
    if (e.kind !== "context") return -1;
    const a = toActivity(e);
    const k = JSON.stringify(a);
    if (!index.has(k)) index.set(k, inputs.push(a) - 1);
    return index.get(k)!;
  });
  const results = await classify(inputs, ctx, opts);
  return events.map((e, i) => ({ ...e, classification: at[i] < 0 ? null : { ...results[at[i]] } }));
}
