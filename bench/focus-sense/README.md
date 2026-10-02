# Focus Sense benchmark

An independent benchmark for the Focus Sense classifier (`src/lib/desktop/sense/classify.ts`): does a foreground
context serve the session's study (ON_TASK), pull away from it (DISTRACTING), or can't the evidence settle it
(UNCERTAIN)?

Run: `npx vitest run bench/focus-sense`. It prints the report; only a gated held-out run (`FOCUS_SENSE_HELDOUT=1`) writes `last-report.md`. Recorded runs: `RESULTS.md`. The classifier runs on
v2 held-out, and its gates apply, only with `FOCUS_SENSE_HELDOUT=1`. Add `FOCUS_SENSE_SEMANTIC=1` to include the OpenRouter semantic layer (reads `AI_API_KEY` and an optional `AI_BASE_URL`
from `.env.local`; free models only; about one provider call per example that needs it, so OpenRouter's free-tier
daily cap applies).

## Datasets

**v2 (gated)**: `dataset2.dev.json` (112) and `dataset2.heldout.json` (77), 189 contexts in 16 categories, about 60/40
within each, 21% UNCERTAIN, 43% hard. New courses, goals and titles; no title equals or nearly matches (token Jaccard
>= 0.6) a v1 title. It leans on ambiguity: keyword traps both ways, idle playback (`"idle": true`, the content is
labelled), launcher/system flicker, partial or missing session context, and multi-purpose apps (Drive, Notion, Gmail,
ChatGPT/Claude, Teams, Slack, Discord) used for both study and leisure.

**v1 (spent)**: `dataset.dev.json` (109) and `dataset.heldout.json` (71), 180 contexts in 20 categories. Its held-out
split was used once, so v1 is reported as a single "v1 (spent)" set and never gated.

Each example carries a session context (course, goal, assignment; some only a goal or course, some nothing), an
`ActivityInput` with realistic Windows process names and window titles, the expected label and a one-line rationale.
`hard: true` marks misleading keywords ("Stellar Blade" during a stellar-evolution exam), subtle relevance
("Markovnikov's rule" for alkene reactions), "distracting" apps used legitimately (Instagram for a brand audit, Minecraft
Education in an ed-tech course) and study apps used for leisure (a Claude chat about a fantasy novel).

Labelled by one reviewer (an AI agent labelling as a careful human would, without access to the classifier's code), all
before any system was run, to this standard:

- **ON_TASK**: a reasonable observer would agree it serves this session's study. With no context at all, any
  coursework counts.
- **DISTRACTING**: clearly unrelated leisure or social activity (entertainment, games, feeds, social chat, shopping,
  personal planning).
- **UNCERTAIN**: the given information can't settle it: transitions (Alt-Tab, Start, new tab), unnamed files, bare
  messaging apps that hide the chat, another course's coursework, and every redacted, title-less-browser or no-window
  context. Idleness is scored elsewhere, so a context left open is labelled by what it is.

The keyword baseline's threshold is fit on v2 dev only; v2 held-out is for the gates.

## Systems

- `blocklistBaseline`: a common blocker list (video, social, games, music, messaging) means DISTRACTING at confidence
  1, anything else ON_TASK at 1; redacted or no window means UNCERTAIN.
- `keywordBaseline(t)`: ON_TASK when at least `t` distinct title tokens (stopwords dropped) appear in the session's
  goal, course or assignment, else DISTRACTING; no title means UNCERTAIN.
- `classifier`: `classify` with `offlineProvider`, one call per example so no example sees another as a neighbour;
  `needsSemantic` comes from `classifyLocal`.
- `classifier+semantic` (optional): `classify` with `openRouterProvider`, a shared `createSemanticCache()` and a
  wrapper that counts and times provider calls.

## Metrics (per system and split)

Confusion matrix (expected × predicted); exact accuracy; decisive accuracy (predicted UNCERTAIN excluded) and coverage;
abstention rate; ON_TASK and DISTRACTING false positives; false negatives (DISTRACTING→ON_TASK, ON_TASK→DISTRACTING);
calibration bins for decisive predictions; accuracy on hard examples; `needsSemantic` share; and enforceable
DISTRACTING (`isEnforceable`): count and false-positive rate among expected ON_TASK and among expected
not-DISTRACTING, with the ids of every enforceable false positive.

## Gates (v2 held-out, vitest assertions)

- The classifier's exact accuracy is at least the strongest baseline's plus 10 points.
- Enforceable false positives: at most 1% among expected ON_TASK and at most 2% among expected not-DISTRACTING.
- v2 sanity: unique ids across v1 and v2, no shared or near-duplicate titles (between v2 splits or with v1), every
  category in both splits, a 55–65% dev share, 15–25% UNCERTAIN, at least 30% hard, and every redacted or window-less
  example labelled UNCERTAIN.

The classifier tests skip, and say why in the report, when `classify.ts` can't be loaded.
