# Project Handoff

> Updated 2026-10-02 (end of session 9), code through `0d70976` on `origin/main`. The code wins over this file. Product truth: `PRODUCT.md`. **Desktop architecture (authoritative): `DESKTOP_ARCHITECTURE_SPEC.md`** (milestone facts live there: M1–M4, "Focus Sense F1", "Focus Sense M6B"). Plans: `docs/ROADMAP.md` (phases 0–9), `docs/COMMERCIAL-ROADMAP.md` (phases 10–16), `docs/PHASE-10-PLAN.md` (current phase). Security: `docs/SECURITY.md`. Benchmark: `bench/focus-sense/` (`README.md`, `RESULTS.md`).

## Project Summary

**Sonnet** is a student hub: Canvas sync, calendar, courses, materials, grades, a focus timer, a customizable Home of widgets, flashcards, and an AI (also named **Sonnet**) that knows every course down to the syllabus. It's built by one college student and is live and multi-user at `https://www.ericwei.me` (Supabase RLS). Stack: Next.js 16, Supabase, Vercel, OpenRouter (free models first), `motion`, GSAP (landing only).

Two tracks:
- **Commercialization, Phase 10 (launch readiness): steps 1–4 of 9 done** (rate limits and Free/Pro limits, security pass, account deletion and export, draft legal pages). Left: monitoring, analytics, Resend email, Google sign-in, hosting upgrade. Pro can't be bought yet (no Stripe, price hidden).
- **Desktop app** (Tauri 2 shell over the live site, Windows/macOS). Foundation M0–M4 done on Windows, CSP enforced. **Focus Sense** (the first native feature): **F1 sensing** (`59ee619`) and **M6B classification + focus metrics** (`dd64985`) are built, tested on Windows and pushed. Not started: intervention/product experience (notices, overlay, Strict Mode, blocking, Focus Report), macOS (M5).

## Current State

- `main` = `origin/main` = `0d70976`. Session 9 pushed F1 and M6B, so Vercel is deploying the timer's Focus Sense hook, the desktop-only "Working on" picker and the Settings rows (all inert in browsers). **Not checked:** that the Vercel deploys finished, and that the live site works under the enforced CSP (pushed in session 8, never verified on Vercel).
- The working tree is clean apart from `graphify-out/*`, which the post-commit graphify hook rewrites in the background (commit it with the next change, as before).
- Migrations 0001–0017 applied by the user. Sessions 7–9 needed none.
- Signed-in screens were seen working in the desktop app in session 8 (Home, Courses, Calendar, Chat streaming, Flashcards, Settings, Sync, uploads, export, focus save path, sign-in/out, email link, file drops). **Never tested signed in:** delete account, reset data, a real Canvas import, Focus Sense (F1 + M6B), anything on Vercel.
- This machine: Focus Sense is turned off and its data cleared; no test windows or dev servers left running.

## Completed This Session (9)

- **Focus Sense F1, sensing foundation** (spec "Focus Sense F1"). Rust `src-tauri/src/focus_sense/` polls the foreground window once a second (raw Win32 FFI, no new crates), applies privacy rules, and writes change-only JSONL per session under `<LocalAppData>/me.ericwei.sonnet/focus-sense/`. Six path-gated commands `focus_sense_{status,configure,start,stop,events,clear}`. Web bridge `src/lib/desktop/focus-sense.ts` (ordered calls, null in browsers), additive timer hook, Settings → Data rows (opt-in, never-record list, pause for this session, clear). Reviewed; fixes applied (call ordering + Rust control lock, pause survives reload, events only for the latest session, digit-only session ids, fail-closed titles).
- **Focus Sense M6B, classification + metrics** (spec "Focus Sense M6B"). Run as lead + workers: classifier, independent benchmark, scoring, reviewer.
  - Classifier `src/lib/desktop/sense/` (abstain gates → rules → heuristics with a ~830-term subject lexicon → optional semantic provider, offline in the app). `isEnforceable` = DISTRACTING ≥ 0.9 from rule/heuristic.
  - Scoring `score.ts`: timeline, missing-stop/silent-gap rule (90 s grace), smoothing, metrics, verified minutes, auditable focus score.
  - Session context `context.ts` + the timer's desktop-only "Working on" picker (course, assignment, goal; localStorage). Debug view: Settings → Data → Latest session.
  - Native: `idle` flag (`GetLastInputInfo`, 120 s), 60 s heartbeats, `status.latest`.
  - Benchmark: v1 failed its held-out gate (77.5% vs 79.0%) and is spent; fresh v2 (189 examples), tuned once on dev, held-out run once: **77.9% exact (gate 73.6%), 93.8% decisive, 37.7% abstain, 0 enforceable false positives**, 20.8% would need the semantic layer. Baselines: keyword 63.6%, blocklist 54.5%.
  - Reviewer fixes: sleep/silent gaps unmonitored, UNCERTAIN never credited, slip budget, idle distraction stays distraction, enforceability caps (streaming sites, game-design sessions, Minecraft Education, media-study courses), cloud provider kept out of client imports, bench report written only by held-out runs. A leakage concern (four held-out-only terms) was checked: the tuning worker never opened the held-out file; details in `RESULTS.md`.

## Important Decisions

- **Focus Sense (sessions 9):**
  - Raw activity is stored locally per session and the page may read the **latest** session's events (user-changed decision, spec §16). Nothing goes to Supabase or any server.
  - **The semantic/AI layer stays offline in the app.** `openRouterProvider` exists only in `semantic.ts` for measurement. Wiring it needs a server route, a privacy-page change and the user's OK; it was never run on benchmark data (user's instruction).
  - **Benchmark discipline:** a held-out split runs once and is then spent; tune on dev only; gates are fixed (exact ≥ strongest baseline + 10 points; enforceable FP ≤ 1% of legit study). v1 and v2 held-out are both spent: the next tuning round needs a fresh set.
  - Enforcement is future work and may act only on `isEnforceable` (never on a semantic verdict alone). M6B enforces nothing.
  - Scoring is deterministic and conservative: verified minutes count only time ON_TASK before and after smoothing, active and monitored; idle and UNCERTAIN are neutral; hands-off lecture watching is not credited (accepted to keep timer farming failing).
  - The web timer stays the single source of truth; its rules, `logFocus` and focus history are untouched.
- **Desktop (locked in spec §16):** every native command gates on the page path in Rust (`bridge_path_allowed`); capabilities scope by origin only, so origin + enforced CSP is the real boundary (a same-origin script can rewrite `history`). Never list a root `/` capability URL. The `opener` plugin is Rust-only. Don't log full URLs. The sign-in handoff passes a PKCE `code` only. A debug exe registers `sonnet://` only with `SONNET_DESKTOP_REGISTER_SCHEME`.
- **CSP is enforced** (`ENFORCE = true` in `lib/csp.ts`). Never regress auth, Server Actions or public pages to satisfy it; static public pages stay static (no-nonce CSP). Google sign-in will need a `form-action 'self'` check. A report endpoint needs the user's OK.
- **Product/legal:** delete is immediate; export is JSON only; legal text claims only what the code does (re-verify `privacy/page.tsx` on any data-flow change, including any Focus Sense data leaving the device); honest landing (real screenshots); keep the nature imagery; taste skill on the landing only; icons only via `@/components/icons`.
- **Pricing/limits:** price hidden until `ai_usage` shows real costs (~$7/user/month estimate); limits live in the database; Canvas imports the first 2 courses; Quick note and Today's three are per device.
- **Held from earlier sessions:** ask before adding a dependency; honest copy; metering fails open; error tracking waits until charging starts.

## Current Design System

- **Palette:** Midnight Study (tokens in `globals.css`): monochrome shell, off-white primary; the landing is always dark (`.landing dark`).
- **Type:** Geist (headings `font-heading` = Geist 600, tight tracking) and Geist Mono for readouts, labels and numbers.
- **Icons:** Phosphor, regular weight, via `components/icons.tsx`.
- **Color carries meaning:** course hues, status (`--done`, `--warning`, `--destructive`) and data. The Focus Sense debug view uses `text-done` / `text-destructive` / muted for ON_TASK / DISTRACTING / UNCERTAIN.
- **Motion:** ease-out `[0.23,1,0.32,1]`, low-bounce springs via `motion`; GSAP only in landing leaves (`scrub-text.tsx`); reduced motion respected; on SVG children use motion's `scale`/`rotate`/`y` props.
- **Landing backdrop:** dusk meadow → night meadow → solid, scroll-timeline CSS (`.sky-*`).
- **Must not regress:** 44px tap targets on phones (`hit` for small text links), no overflow at 375px, no hydration mismatches (desktop-only UI renders after mount via `useSyncExternalStore(..., () => false)`).
- **Button:** no `asChild`; for a link styled as a button use `buttonVariants` on an `<a>`. Form fields use the `field` style (`h-11 rounded-full bg-secondary`).

## In Progress / Unfinished Work

- **Needs the user:**
  - **Supabase redirect for the desktop email link** (I never change production Supabase): Authentication → URL Configuration → Redirect URLs, add `https://www.ericwei.me/auth/desktop`. Keep the default email template;
  - a signed-in check of **delete account and reset data** (throwaway account), and of **Focus Sense on the live site with the installed app**;
  - **scope for the next Focus Sense milestone** (intervention/product experience), and a decision on wiring the semantic layer (server route + privacy text);
  - **a clean Windows 10/11 machine or VM** for the installer (SmartScreen, WebView2 bootstrapper, antivirus), and OK for a GitHub Actions `desktop.yml` installer build;
  - a Mac for M5 (macOS configured, untested; Focus Sense has no macOS sensor);
  - a contact email for the legal pages, and a legal review (minimum age, governing law, liability cap, student-data wording, free AI providers possibly keeping prompts, on-device observation by the desktop app);
  - accounts for Resend, uptime monitoring and Google OAuth; a choice of error tracking (Sentry or no-dependency) and analytics (Plausible or PostHog); rotating secrets per `docs/SECURITY.md`; OK for a CSP report endpoint;
  - Skew Protection (Vercel Pro/Enterprise only; not active). Until then the desktop reload fallback (spec §11) applies;
  - a real Safari/WebKit pass on a Mac or iPhone.
- **Offered, not decided:** Reset all data also clearing decks and focus history; letting Free students pick their 2 Canvas courses; syncing Quick note / Today's three (migration); fixing the duplicate deck from re-saving an old chat's deck; an unshare option for decks; grouping Up next by day; a "Resume" control after "Pause for this session" (today pause lasts the rest of the session).
- **Audit leftovers:** `ash-burst-button.tsx` (391 lines + `matter-js`) serves only the reset confetti (removal needs the user's OK); `ui/*.tsx` import `cn` from the package (vendored, left alone).

## Known Bugs / Issues

- **Focus Sense** (full lists in the spec):
  - M6B: hands-off lecture watching turns IDLE after 2 min and isn't credited; ~38% of contexts stay UNCERTAIN offline; titles can't tell a TV show from a topic or name unknown games; lexicon is English/US-centric; rapid alternation credits the on-task blips; semantic request rate/latency unmeasured.
  - F1: 1 s polling, not event-driven (§12 item 4 unmet); setting and data are per computer, not per account; UWP apps report `ApplicationFrameHost.exe`; private windows caught only by title marker; pause forgotten on app restart; a sign-out mid-session leaves the monitor running until the timer's end + 2 min; turning it on mid-session waits for the next session.
- **Desktop:** a load failing after the server answers shows WebView2's own error page; no reload after system wake; icons upscaled from 512 px (regenerate from 1024 px); the mic button shows in WebView2 though dictation can't work; downloads save silently; no signing or updater; tray right-click menu and a real installer run on a clean machine not exercised.
- **Web:** React #418 hydration mismatch in the `MetalFx` send button on signed-in production pages (pre-existing); with `SUPABASE_SECRET_KEY` missing locally a chat answer dies mid-stream (use a placeholder key); Canvas sync on page loads shares the hourly Sync limit; Supabase sends ~2 email links/hour/address; duplicate deck from re-saving an old chat's deck; prerendered 404 and `/_global-error` get the nonce policy; `logFocus` check-then-insert could double-log under a race (unique index would need a migration); `/login?expired=1` while signed in lands on `/` without the note; Canvas free cap follows Canvas order; weeks reset Monday 00:00 UTC; `visionText` not metered; retries log only the last attempt's cost.
- **Dev only:**
  - `tauri dev` starts Next on port 3000 itself (stop other dev servers first). Stopping a backgrounded `next dev`/`tauri dev` can leave a node process holding 3000: find it with `netstat -ano | grep :3000` and stop that pid.
  - Before `npm run build`: delete `.next/dev`, and hide the untracked `login/*-preview` pages (rename each to `_name`, then back).
  - `next dev` reports one CSP violation (unminified theme script); judge the CSP on a production build. Hydration warnings from `VoiceBeam`/`MetalFx`. The browser pane can't screenshot while hidden.
  - Free AI models are flaky; `graphify update .` sometimes segfaults (the git hook rebuilds anyway).
- **Windows editing:** most source files are CRLF, some mixed (`globals.css`, `app-shell.tsx`); new files are LF. Use the Edit tool, or Python with `newline=''` and `encoding='utf-8'` written to a scratch file (heredocs mangle backslashes and some quoting). `sed -i` can strip or add CRs; check with `cat -A`/`od -c`.

## Current Priorities

1. **Verify the deploys:** Vercel finished, the live site works under the enforced CSP, then set the Supabase redirect and check an email link from the installed app. Then the throwaway-account delete check.
2. **Focus Sense signed-in validation** with the installed app on the live site (enable, pick a course, run a session, read Settings → Data → Latest session). Then the next milestone once the user scopes it.
3. **Desktop chores:** clean-machine install, CI installer workflow (needs OK), M5 (macOS).
4. **Phase 10 step 5: monitoring** (needs the user's Sentry/no-dependency choice and an uptime account).
5. **Contact email and legal review** (block charging; include the desktop app's on-device observation).
6. Steps 6–8: analytics, Resend, Google sign-in. After 1–2 weeks of `ai_usage`: set `PRO`, then Stripe (needs Vercel and Supabase Pro).

## Testing / Validation Status

- **At `0d70976` (Windows 11):** `npm test` 143 passed, 3 skipped by design (benchmark held-out gate and semantic run); `tsc` clean; eslint clean on tracked and new files; `npm run build` passes with the CSP hash check; `cargo test` 38/38; clippy `-D warnings` clean; `npm run desktop:build` built the release exe and a 1.49 MiB NSIS installer.
- **Focus Sense, live in `desktop:dev`** (signed out, on `/login/*-preview`, driven over the WebView2 debug port):
  - F1: path gate refuses every command on `/login`; malformed/unknown/traversal inputs refused; monitoring follows the timer, continues while hidden in the tray, survives reloads, stops promptly (thread gone), pause survives reload, no orphan monitor after a hard kill + relaunch; clear removes session files. Shell CPU ~31 ms/min while monitoring (≈0.05% of a core, debug build), 0 idle.
  - M6B: a 12-minute session with the picker set to CHEM 1210 classified VALORANT DISTRACTING 0.95, a stoichiometry Wikipedia page ON_TASK 0.85, a YouTube let's-play search DISTRACTING 0.92, Task Switching/Notepad/Claude UNCERTAIN; the off/on gap was UNMONITORED; heartbeats present. The user's real game session was interleaved with the scripted switches (score 2 reflects it); data cleared afterwards.
  - Plain browser: timer unchanged, no picker or Focus Sense rows, no bridge calls, no Focus Sense storage.
- **Earlier milestones (facts in the spec):** M1–M4 validated on this machine (shell, offline page, tray, single instance, window state, navigation lock, email-link sign-in with a real link, CSP sweeps signed in and out, installer lifecycle, real Explorer drops).
- **Not tested anywhere:** anything on Vercel; Focus Sense signed in or against the live site; a hands-off idle stretch with input truly stopped; an elevated foreground window; the semantic layer; a clean machine or antivirus; macOS, Safari/WebKit, phones; sign-up confirmation and Google sign-in.

## Relevant Architecture / Graphify Context

Use `graphify query` first (it doesn't index `src-tauri/`).
- **Focus Sense, native:** `src-tauri/src/focus_sense/` — `mod.rs` (event types, validation, the six commands, `page_allowed`, control lock), `sensor.rs` (Win32 foreground/idle), `privacy.rs` (exclusions, redaction, fail-closed), `monitor.rs` (one thread, heartbeats, expiry), `store.rs` (JSONL, caps, retention). Wired in `src-tauri/src/lib.rs`; permissions in `build.rs` + `capabilities/main.json`.
- **Focus Sense, web:** `src/lib/desktop/focus-sense.ts` (bridge, event/status types, `IDLE_AFTER_MS`, `HEARTBEAT_MS`), `src/lib/desktop/sense/` (`types.ts` contract, `classify.ts` + `rules.ts` + `heuristics.ts` + `lexicon.ts`, `semantic.ts`, `score.ts`, `context.ts`), `src/components/desktop/` (`focus-sense-settings.tsx`, `focus-context-picker.tsx`, `focus-session-debug.tsx`), hooks in `components/focus-timer.tsx` (`bindContext`, start/stop) and `components/app-shell.tsx` (passes courses/items to `FocusProvider`).
- **Benchmark:** `bench/focus-sense/` — `dataset*.json` (v1, v2), `baselines.ts`, `harness.ts`, `benchmark.test.ts` (`FOCUS_SENSE_HELDOUT=1` runs the gated held-out; `FOCUS_SENSE_SEMANTIC=1` the AI run), `RESULTS.md`.
- **Desktop shell:** `src-tauri/src/lib.rs` (navigation lock `classify`, offline page/`refresh`, tray/lifecycle, `app_info`, `bridge_path_allowed`), `auth.rs` (email-link handoff), `offline/offline.html`, `tauri.conf.json`. Auth handoff web side: `src/lib/desktop/index.ts`, `src/app/auth/desktop/`.
- **Testing the shell signed out:** `/login/*-preview` pages render the app shell (timer included) and pass the bridge gate. Launch with `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=9222 npm run desktop:dev`, drive the page over CDP (Node's global `WebSocket`); in Git Bash set `MSYS_NO_PATHCONV=1`. Afterwards remove any test entry from `sonnet-focus-pending` (or it logs to the next signed-in account), clear Focus Sense data and turn it off. Don't script window switches while the user is actively using the machine.
- **Focus timer:** `components/focus-timer.tsx` (`finish`, `save`, pending queue), `lib/focus.ts`, `logFocus` in `app/actions.ts`.
- **Account data:** `app/actions.ts` (`deleteAccount`, `resetAllData`, `removeFiles`), `app/api/export/route.ts`, `components/settings-forms.tsx` (Data tab, exported `Row`); `lib/supabase/admin.ts` (service role, server only).
- **Security:** CSP in `lib/csp.ts` + `proxy.ts`, build check `scripts/check-csp-hash.mjs`; review in `docs/SECURITY.md`. Rate limits/metering: `lib/limit.ts`.
- **Other:** legal (`app/legal.tsx`, `privacy/`, `terms/`), Home (`dashboard.tsx`, `up-next.tsx`, `chart-widgets.tsx`, `lib/progress.ts`), landing (`app/landing/*`), icons (`components/icons.tsx`), Sync/Settings (`sync-window.tsx`, `settings-forms.tsx`). Cascade: every user table references `auth.users on delete cascade`; `decks` and `focus_sessions` set `course_id` null.

## Important Constraints

- **Ask before:** adding a dependency, writing a migration, removing a feature, changing focus-timer behavior, chat storage, Supabase/env/API routes/auth or billing, or sending Focus Sense data off the device.
- **Migrations:** give the SQL to paste, plus a `create or replace` / delta version.
- Never write to production Supabase or enter passwords. Spending Higgsfield credits needs the user's OK.
- **Commits:** commit every important change; run tsc, lint and tests first; say "untested" when true. Push to `main` for normal work; **desktop milestones wait for the user's word** (F1 and M6B were pushed on request).
- **Benchmark:** never tune on a held-out split; a run held-out is spent.
- **Preview pages:** `src/app/login/*-preview/` are untracked (`.git/info/exclude`) and must never be committed.
- **Communication:** terse; give copy-paste commands.

## Next Recommended Task

**Wait for the user's word.** Everything is pushed (`0d70976`).
- First, cheap and unblocking: verify the Vercel deploy and the live CSP, then a signed-in Focus Sense session with the installed app.
- **Next Focus Sense milestone** (needs the user's scope): the intervention/product experience on top of `isEnforceable` and the session metrics (notice-level first). Before any enforcement: wire and measure the semantic layer (with the user's OK) and validate on real signed-in sessions. Keep native work in `src-tauri/`, path-gate every new command, keep the CSP enforced; no screenshots, OCR, Accessibility, blocking, overlay or Strict Mode before the user's go-ahead.

## Tomorrow / New-Session Startup Prompt

"do resume protocol"
