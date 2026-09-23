---
target: dashboard
total_score: 23
p0_count: 0
p1_count: 3
timestamp: 2026-09-23T02-01-55Z
slug: src-components-dashboard-tsx
---
⚠️ DEGRADED: single-context (sub-agents are not permitted in this session unless the user asks; A was completed before B's detector output was read)

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Nothing says the data is sample data; no sync/last-updated status |
| 2 | Match System / Real World | 3 | "-7" floats away from its label "vs last week" |
| 3 | User Control and Freedom | 3 | Checked items stay visible for undo; good |
| 4 | Consistency and Standards | 2 | Course hues collide with semantic colors (CHEM red = overdue red, CSCI green = done green) |
| 5 | Error Prevention | 3 | Few risky actions yet |
| 6 | Recognition Rather Than Recall | 3 | Up next rows not openable; no "+N more" |
| 7 | Flexibility and Efficiency | 1 | No keyboard shortcuts (no ⌘K for Ask, no key to check off) |
| 8 | Aesthetic and Minimalist Design | 3 | Heatmap is 70% empty future grid |
| 9 | Error Recovery | 2 | No error states exist yet |
| 10 | Help and Documentation | 1 | No help or first-run guidance |
| **Total** | | **23/40** | **Acceptable** |

## Anti-Patterns Verdict
LLM: does not read as AI-made. Instrument-style readouts, mono numerals, cheeky copy and asymmetric block sizes avoid the template look. Weakest spot: the heatmap block reads as a stock widget.
Detector: 1 CLI finding (bounce-easing, globals.css:15 `cubic-bezier(0.22, 1.2, 0.36, 1)`), confirmed in-browser on the 5 filled progress bars (6 overlay hits). Not a false positive.
Contrast (measured): light brand text 3.93:1 and light done text 4.1:1 on card fail AA for small text; unlit ring ticks and future bars 1.13:1 are near-invisible in both themes.

## Priority Issues
- [P1] Ask field has no visible focus state (outline-none, no ring). Fix: focus-within ring on the pill. /impeccable harden
- [P1] Course colors collide with semantic colors: CHEM 1210 (hue 25) looks like overdue red, so the exam ring reads as an alarm under "plenty of runway"; CSCI 1300 (hue 160) looks like done green. Fix: course hues that avoid 25/150/205. /impeccable colorize
- [P1] Light-theme contrast: "now" label (brand, 11px) 3.93:1 and "+N" delta (done) 4.1:1 fail AA. Fix: darker light-mode brand/done for text. /impeccable polish
- [P2] Delta is ambiguous: "-7" sits next to %, its meaning is in a separate right-aligned label. Fix: one unit "−7 vs last week". /impeccable clarify
- [P2] Overshooting ease on progress bars (detector). Fix: ease-out-quint; keep springiness in Motion springs with no overshoot. /impeccable animate
- [P2] Nothing marks the data as sample. Violates "Never lose trust". Fix: small "sample data" pill until Phase 1. /impeccable clarify

## Persona Red Flags
Alex (power user): no ⌘K to focus Ask; no keyboard shortcut to check off; Create needs a click.
Sam (accessibility): Ask field focus invisible; exam ring's meaning (time left) only in the digits, ring is aria-hidden (ok); light-mode small cyan/green text under 4.5:1.
Student at 11pm (project persona): sees a red ring + red dot on the next exam and panics, though it is 7 days out.

## Minor Observations
- Future bars and unlit ticks at 1.13:1 barely show the upcoming workload.
- Up next leaves a tall empty area on desktop; "+N more" or item details would use it.
- "weighted" label on Grades is vague.
- Heatmap month labels crowd at 11px.

## Questions to Consider
- Should the ring use the accent (it is your countdown) instead of the course color?
- Would the heatmap earn its space showing only the last 8 weeks, streak-first?
