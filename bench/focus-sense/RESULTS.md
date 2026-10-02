# Focus Sense classifier: recorded results (M6B, 2026-10-02)

The held-out runs below happened once each and are copied here verbatim from the run's printed summary. A held-out
split, once run, is spent: it must not guide tuning again. `last-report.md` is rewritten only by a gated held-out run.

## v1 (180 examples; spent)

Run once after tuning round 2 (dev only). Gate: exact ≥ keyword baseline + 10 = 79.0%. **Failed.**

| system | split | n | exact | decisive | coverage | abstain | ON FP | DIS FP | enforceable | enf FP (ON) | enf FP (¬DIS) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| blocklist | heldout | 71 | 56.3% | 54.4% | 95.8% | 4.2% | 20 | 11 | 27 | 30.0% | 23.9% |
| keyword(t=1) | heldout | 71 | 69.0% | 67.2% | 94.4% | 5.6% | 2 | 20 | 0 | 0.0% | 0.0% |
| classifier | dev | 109 | 98.2% | 100.0% | 72.5% | 27.5% | 0 | 0 | 5 | 0.0% | 0.0% |
| classifier | heldout | 71 | 77.5% | 90.9% | 62.0% | 38.0% | 2 | 2 | 3 | 0.0% | 0.0% |

Dev 98% vs held-out 77.5% was read as overfitting; v1 was declared spent and a fresh set built.

## v2 (189 examples; gated; held-out now spent)

Built by an isolated worker that never read the classifier. The classifier was tuned once on v2 dev only, then v2
held-out was run exactly once (`FOCUS_SENSE_HELDOUT=1`). Gate: exact ≥ strongest baseline + 10 = 73.6%, enforceable
false positives ≤ 1% of expected-ON_TASK and ≤ 2% of expected-not-DISTRACTING. **Passed.**

| system | split | n | exact | decisive | coverage | abstain | ON FP | DIS FP | FN DIS→ON | FN ON→DIS | enforceable | enf FP (ON) | enf FP (¬DIS) | needsSemantic |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| blocklist | v2 dev | 112 | 52.7% | 51.4% | 97.3% | 2.7% | 30 | 23 | 15 | 17 | 46 | 34.0% | 31.1% | — |
| keyword(t=1) | v2 dev | 112 | 61.6% | 60.2% | 96.4% | 3.6% | 5 | 38 | 4 | 19 | 0 | 0.0% | 0.0% | — |
| blocklist | v2 heldout | 77 | 54.5% | 52.7% | 96.1% | 3.9% | 19 | 16 | 8 | 15 | 34 | 41.7% | 31.4% | — |
| keyword(t=1) | v2 heldout | 77 | 63.6% | 62.2% | 96.1% | 3.9% | 4 | 24 | 3 | 13 | 0 | 0.0% | 0.0% | — |
| classifier | v2 dev | 112 | 90.2% | 100.0% | 68.8% | 31.3% | 0 | 0 | 0 | 0 | 6 | 0.0% | 0.0% | 19.6% |
| classifier | v2 heldout | 77 | 77.9% | 93.8% | 62.3% | 37.7% | 1 | 2 | 1 | 2 | 6 | 0.0% | 0.0% | 20.8% |

### Review notes on this run

- **Leakage check.** The reviewer found four terms in the classifier that occur only in v2 held-out titles (funniest,
  GeoGuessr, dijkstra, qalculate) and decide four held-out examples. The tuning worker's transcript shows it never
  opened `dataset2.heldout.json` (its only mention is the instruction not to). "GeoGuessr" and "funniest" were added in
  tuning round 1 and "dijkstra" in round 2, before v2 existed. "qalculate" was added in the v2-dev round, next to
  SpeedCrunch (in dev), as another known calculator app. Discounting that one example: 59/77 = 76.6%, still above the gate.
- **Post-run safety changes.** After this run, review probes (not benchmark data) narrowed some paths that could reach
  enforceable DISTRACTING (streaming sites without leisure wording, game-design sessions, Minecraft Education,
  leisure-media courses). They only lower confidence or turn a label UNCERTAIN; the held-out split was not re-run.
- The semantic (AI) layer was not run on any held-out data.
