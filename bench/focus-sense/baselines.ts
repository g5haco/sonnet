// Two naive baselines the classifier must clearly beat. Both are context-blind in different ways on purpose.
import type { ActivityInput, FocusClassification, FocusSessionContext } from "../../src/lib/desktop/sense/types";
import { evaluate, toContext, type Example } from "./harness";

export type Baseline = (a: ActivityInput, ctx: FocusSessionContext) => FocusClassification;

const abstain = (reason: string): FocusClassification => ({ label: "UNCERTAIN", confidence: 0, reason, method: "abstain" });

// A typical "block distracting sites/apps" list, matched as substrings of process, app and title (lowercased).
// Written from common blocker defaults, not from the dataset.
const BLOCKLIST = [
  // video / streaming
  "youtube", "twitch", "netflix", "hulu", "disney+", "prime video",
  // forums / social
  "reddit", "instagram", "tiktok", "facebook", "twitter", "/ x -", "snapchat", "pinterest", "tumblr",
  // games
  "steam", "epic games", "battle.net", "riot client", "valorant", "league of legends", "minecraft", "roblox", "fortnite",
  "overwatch", "counter-strike", "genshin",
  // music
  "spotify", "apple music",
  // messaging
  "discord", "whatsapp", "telegram", "messenger", "signal", "slack", "teams",
];

export const blocklistBaseline: Baseline = (a) => {
  if (!a.hasWindow || a.redacted) return abstain("No window or redacted.");
  const hay = [a.processName, a.appName, a.windowTitle].filter(Boolean).join(" ").toLowerCase();
  const hit = BLOCKLIST.find((b) => hay.includes(b));
  return hit
    ? { label: "DISTRACTING", confidence: 1, reason: `Blocklisted (${hit}).`, method: "rule" }
    : { label: "ON_TASK", confidence: 1, reason: "Not on the blocklist.", method: "rule" };
};

const STOPWORDS = new Set(
  (
    "the and for with from into that this what how why when who are was were you your our its not but all can will has have had " +
    "does did about after before over under out off any some more most very just than then also only one two use using via " +
    // window chrome
    "google chrome microsoft edge mozilla firefox personal visual studio code adobe acrobat reader bit word excel " +
    // course-name filler
    "intro introduction general principles fundamentals"
  ).split(" "),
);

export const tokens = (s: string) =>
  s.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 2 && !STOPWORDS.has(t));

// ON_TASK when at least `threshold` distinct title tokens appear in the session context, else DISTRACTING.
export const keywordBaseline =
  (threshold: number): Baseline =>
  (a, ctx) => {
    if (!a.hasWindow || a.redacted || !a.windowTitle) return abstain("No title.");
    const ctxTokens = new Set(tokens([ctx.goal, ctx.courseName, ctx.assignmentTitle].filter(Boolean).join(" ")));
    const overlap = new Set(tokens(a.windowTitle).filter((t) => ctxTokens.has(t))).size;
    return overlap >= threshold
      ? { label: "ON_TASK", confidence: Math.min(0.95, 0.6 + 0.1 * overlap), reason: `${overlap} shared keywords.`, method: "heuristic" }
      : { label: "DISTRACTING", confidence: 0.6, reason: `Only ${overlap} shared keywords.`, method: "heuristic" };
  };

// Picks the threshold with the best exact accuracy on the given (dev) examples; ties go to the lower threshold.
export function fitKeywordThreshold(dev: Example[], candidates = [1, 2, 3]): number {
  let best = candidates[0], bestAcc = -1;
  for (const t of candidates) {
    const b = keywordBaseline(t);
    const acc = evaluate(dev, dev.map((e) => b(e.activity, toContext(e)))).exact;
    if (acc > bestAcc) [best, bestAcc] = [t, acc];
  }
  return best;
}
