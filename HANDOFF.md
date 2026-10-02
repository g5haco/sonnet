# Project Handoff

> Updated 2026-10-02 (session 8), code through the M1 commit. The code wins over this file. Product truth: `PRODUCT.md`. **Desktop architecture (authoritative): `DESKTOP_ARCHITECTURE_SPEC.md`.** Plans: `docs/ROADMAP.md` (phases 0–9), `docs/COMMERCIAL-ROADMAP.md` (phases 10–16), `docs/PHASE-10-PLAN.md` (current phase). Security: `docs/SECURITY.md`.

## Project Summary

**Sonnet** is a student hub: Canvas sync, calendar, courses, materials, grades, a focus timer, a customizable Home of widgets, flashcards, and an AI (also named **Sonnet**) that knows every course down to the syllabus. It's built by one college student and is live and multi-user at `https://www.ericwei.me` (Supabase RLS). Stack: Next.js 16, Supabase, Vercel, OpenRouter (free models first), `motion`, GSAP (landing only).

Direction: commercialization. **Phase 10 (launch readiness) is in progress: steps 1–4 of 9 are done.**
- Done: rate limits and Free/Pro limits, the security pass, account deletion and export, and the legal pages (drafts).
- Left: monitoring, analytics, Resend email, Google sign-in, hosting upgrade.
- Pro can't be bought yet: there's no Stripe and the price is hidden.

Second track: **a Windows/macOS desktop app** (Tauri 2 shell over the live site; Focus Guardian is the first native feature). The architecture is approved in `DESKTOP_ARCHITECTURE_SPEC.md`. **M0, P1 and M1 are done. M2 (shared app boot) is next and not started.** Focus Guardian has not started.

## Current State

- Live at `4eb8f00` plus three local commits: `ccf9aa0` (spec), `53956db` (M0/P1) and the M1 shell commit. **Not pushed:** the user said desktop milestones wait for their word. Nothing is deployed, so the new CSP and timer aren't live yet. The web app is unchanged by M1.
- The user ran migrations 0001–0017. Sessions 7 and 8 needed none.
- **Nothing from sessions 2–8 has been tested signed in.** That includes export and delete, the nonce CSP on signed-in pages, the focus-timer save success path, and now **password sign-in inside the desktop shell** (the shell was only checked up to the login page; the rules forbid typing a password).

## Completed This Session

- **M1: the Tauri 2 desktop shell** (`src-tauri/`; facts and the dependency table are in `DESKTOP_ARCHITECTURE_SPEC.md` under M1).
  - A window that loads the site: `localhost:3000/login` in debug, `https://www.ericwei.me/login` in release.
  - Navigation lock, external links to the system browser, an offline page, single instance, window state, a tray, close-to-tray, reload-on-show (hidden 15 minutes or more), logging, and one command, `app_info`.
  - `npm run desktop:dev` and `npm run desktop:build`. Ignore entries for git, Vercel (`.vercelignore`), ESLint and Graphify.
  - Dependencies approved and added: `@tauri-apps/cli` (dev) plus the Rust crates `tauri`, `tauri-build`, and the single-instance, window-state, log and opener plugins, `log` and `serde`. All Apache-2.0/MIT.
- **Two spec corrections found by testing.**
  - Tauri matches `remote.urls` against the request `Origin` only. Path-scoped capabilities don't work, and a root `/` is a wildcard. Capabilities are origin-wide, and each command must check `webview.url().path()` itself (`bridge_path_allowed`).
  - The opener plugin injects a click handler that swallows `target=_blank` clicks. It is turned off.
- **One reviewer pass fixed 4 defects:** the opener click handler, a hostile `sonnet-offline` URL that site content could use (now only the shell's own offline URL is accepted, with a site-page `to`), `window.open('')` blanking the app (`about:blank` no longer navigates), and the macOS sleep clock (`SystemTime` instead of `Instant`).
- Earlier (session 7): the desktop architecture (Arena run, spec `ccf9aa0`), M0 (nonce CSP, report-only) and P1 (durable focus-session logging), commit `53956db`.

## Important Decisions

- **Delete is immediate, not a grace period.** A 30-day restore flow would need a migration and a cron job; not worth it before real users exist.
- **Export is JSON only.** A ZIP of the uploaded files was declined (a dependency, and heavy on Vercel's time limits).
- **Legal text claims only what the code does.** Re-verify `privacy/page.tsx` whenever data flows change: a new AI provider, analytics, email, sharing or storage.
- **Honest landing page:** real screenshots stay above the fold.
- **Keep the nature imagery** (dusk and night meadow). Don't swap it for stock or generated photos.
- **The taste skill applies to the landing page only.** The app follows PRODUCT.md (sentence case, mono readouts, course colors).
- **Icons go through `@/components/icons` only.** Map new names there; never import Phosphor directly.
- **The CSP stays report-only** (`ENFORCE` in `lib/csp.ts`) until the user's signed-in checks show no violations: sign in and out, email links, Server Actions, chat streaming, Canvas, uploads. Then set `ENFORCE = true`. Never regress auth, Server Actions or public pages to satisfy the CSP. A report endpoint (a new API route) needs the user's OK.
- **Desktop decisions are locked in `DESKTOP_ARCHITECTURE_SPEC.md` §16.** Native bridge privileges beyond `app_info`/notify wait for the enforced, validated CSP.
- **Every future native command must gate on the page path in Rust** (`bridge_path_allowed`), because capabilities can't. Never list a root `/` capability URL.
- **The `opener` plugin is Rust-only.** Keep `open_js_links_on_click(false)` and grant no opener permission to pages.
- **Don't log full URLs in the shell.** They can carry sign-in tokens. Log the origin.
- **Static public pages stay static.** They get a no-nonce CSP rather than becoming dynamic. A dynamic `not-found` was tried and rejected, because it made every static page dynamic.
- **Price:** stays hidden until `ai_usage` shows real costs (AI is about $7/user/month by the user's estimate).
- **Limits live in the database**, and Canvas imports the first 2 courses. Quick note and Today's three are stored per device, in localStorage.
- **Held from earlier sessions:**
  - ask before adding a dependency;
  - honest copy;
  - metering fails open;
  - error tracking waits until charging starts.

## Current Design System

- **Palette:** Midnight Study (tokens in `globals.css`). A monochrome shell with an off-white primary; the landing is always dark (`.landing dark`).
- **Type:** Geist for text and headings (`font-heading` = Geist 600, tight tracking) and Geist Mono for readouts, labels and numbers.
- **Icons:** Phosphor, regular weight, through `components/icons.tsx`.
- **Color carries meaning:** course hues, status (`--done`, `--warning`, `--destructive`) and data.
- **Motion:**
  - ease-out `[0.23,1,0.32,1]` with low-bounce springs, using `motion`.
  - GSAP only in isolated landing leaves (`scrub-text.tsx`).
  - Reduced motion is respected everywhere.
  - On SVG children, use motion's `scale`/`rotate`/`y` props, not `transform` strings.
- **Landing backdrop:** the dusk meadow, then the night meadow, then solid, driven by scroll-timeline CSS (`.sky-*`).
- **Must not regress:** 44px tap targets on phones (use `hit` for small text links), no overflow at 375px, no hydration mismatches.
- **Button:** there is no `asChild`. For a link styled as a button, use `buttonVariants` on an `<a>`.

## In Progress / Unfinished Work

- **Needs the user:**
  - a signed-in check of everything since session 2: Sync/Settings, Up next, the Pace chart, fonts and icons, and **export and delete**. Use a throwaway account for delete;
  - a contact email to publish on the legal pages;
  - a legal review of privacy/terms (open questions: minimum age, governing law, liability cap, student-data wording, free AI providers possibly keeping prompts);
  - accounts for Resend, uptime monitoring and Google OAuth;
  - a choice of error tracking (Sentry or no-dependency) and analytics (Plausible or PostHog);
  - rotating secrets per `docs/SECURITY.md`;
  - OK for a CSP report endpoint;
  - **a signed-in check on a preview or production deploy with the nonce CSP**, watching the console for `[Report Only]` violations. That gates `ENFORCE = true`;
  - Skew Protection: Vercel's docs limit it to Pro/Enterprise, and it isn't active on production. If the plan is upgraded later: Project → Settings → Advanced → Skew Protection. Until then the desktop reload fallback (spec §11) applies;
  - a real Safari/WebKit pass on a Mac or iPhone (not done; the Playwright browsers aren't installed);
  - **a password sign-in check inside the desktop shell** (`npm run desktop:dev`, or the built `sonnet-desktop.exe`): sign in, confirm it lands on `/`, then close to the tray and reopen;
  - a Mac to build and run the shell (M5); macOS is configured but untested;
  - approval to push the desktop commits.
- **Offered, not yet decided:**
  - make Reset all data also clear decks and focus history. It currently deletes `courses`, `chats` and `settings`; decks and focus sessions only have their course unlinked, and `ai_usage` stays;
  - let Free students pick which 2 Canvas courses to keep;
  - sync Quick note and Today's three across devices (a migration);
  - fix the duplicate deck from re-saving an old chat's deck;
  - an unshare option for flashcard decks (there is none today);
  - group Up next by day instead of the exact due time.
- **Audit leftovers (not done):**
  - `ash-burst-button.tsx` (391 lines + `matter-js`) serves only the reset confetti;
  - `ui/*.tsx` imports `cn` from the package instead of `@/lib/utils`;
  - the plural-"s" expression is repeated 7 times.

## Known Bugs / Issues

- **Desktop shell gaps (M1):**
  - A load that fails after the server answers (HTTP 5xx, a mid-load drop) shows WebView2's own error page, not the offline page. The offline page covers an unreachable server only.
  - There's no reload after system wake, only after a long hide.
  - Icons are upscaled from the 512 px web mark. Regenerate from 1024 px before release.
  - Not exercised: the tray's right-click menu (Open/Quit), a physical tray click, real Ctrl+click on a link, installing the NSIS installer.
  - No signing, no updater.
- **Desktop dev:** `tauri dev` starts Next on port 3000 itself, so stop any other dev server first. After running it, delete `.next/dev` before `npm run build`, or the build fails on stale type stubs for the preview pages.

- Saving a deck from an old chat twice (after a reload) creates a duplicate.
- **CSP known gap:** the prerendered 404 (an unknown URL while signed in) gets the nonce policy. Once enforced it shows without JavaScript, but its Home link still works. `/_global-error` is the same.
- **Focus log:** two requests racing past `logFocus`'s check-then-insert could still double-log. The Web Lock covers the realistic case; a unique index would need a migration.
- A signed-in user following an expired link to `/login?expired=1` now lands on `/` and doesn't see the note.
- The Canvas free cap follows Canvas order: deleting a course just re-imports it.
- Weeks reset Monday 00:00 UTC. `visionText` isn't metered. On a retry, only the last attempt's cost is logged.
- If account delete errors with a database error, suspect Supabase refusing to delete a user who still owns storage objects. Files are removed first, so it shouldn't happen.
- **Dev only:**
  - `next dev` reports one CSP violation (the unminified theme script). Judge the CSP on a production build;
  - a local `next build` fails on the untracked `login/*-preview` pages. Hide them first: rename each to `_name` (an App Router private folder), then rename back;
  - hydration warnings from `VoiceBeam`/`MetalFx`;
  - the Next dev-tools badge sits over the phone menu button in previews;
  - the browser pane can't screenshot or emulate mobile while it's hidden (use DOM measurements).
- Free AI models are flaky. `graphify update .` sometimes segfaults; the git hook rebuilds in the background anyway.
- **Windows editing:**
  - Most source files use CRLF, and `globals.css` has *mixed* endings. New files this session are LF.
  - Edit with the Edit tool, or with Python reading and writing `newline=''` **and `encoding='utf-8'`**. `open(p, 'w')` truncates the file before an encoding error, so always pass utf-8. `sed -i` has stripped CRs before.
  - In Bash, `grep -c $'\r'` doesn't count CRs reliably; use `od -c`.
  - Write Python to a scratch file; heredocs mangle backslashes.

## Current Priorities

1. **The user's signed-in check of sessions 2–7** on a deploy: export and delete (throwaway account), plus the nonce CSP console check. Then enforce the CSP.
2. **Desktop M2: shared app boot** (spec §13). M2, M4 and M5 can proceed while the CSP is report-only. M3 and M6 wait for the enforced CSP.
3. **Phase 10 step 5: monitoring.** It needs the user's choice of Sentry or no-dependency logging, plus an uptime account.
4. **Contact email and legal review**, which block charging.
5. Steps 6–8: analytics, Resend, Google sign-in.
6. After 1–2 weeks: read the `ai_usage` costs, set `PRO`, then Stripe. Vercel and Supabase Pro are needed before charging.

## Testing / Validation Status

- **M1 (Windows, run for real):**
  - `cargo test`: 9 pass (navigation lock, hostile offline URLs, path gate, capability shape). `cargo clippy`: clean.
  - `npm run desktop:dev`: the window opened `/login`; same-site links stayed inside; a `target=_blank` link, `window.open` and a top-level navigation to another site opened the default browser (Brave), logging the origin only.
  - Close hid the window and kept the process; a second launch showed it; a short hide kept the page, a long hide reloaded it.
  - With the server down the offline page appeared, kept the return page, and recovered by itself when the server came back. Window state restored across a kill and relaunch. The tray toggle worked (driven with the tray's window message).
  - IPC: `app_info` allowed on the site, refused on `/f`, `/landing`, `/auth`, `/privacy`, `/terms`. Opener and window-state commands denied.
  - `npm run desktop:build`: the release exe (about 4.4 MB) and the NSIS per-user installer (about 1.4 MiB) built. The release exe loaded the live site's `/login` and `app_info` worked. The installer was not installed.
  - **Not done:** a password sign-in, a literal Wi-Fi-off test (the offline page was tested by pointing a debug build at a dead local origin), anything on macOS.
- **Web after M1:** `npm test` 60/60, `tsc` clean, `npm run build` passes with the CSP hash check and the same static routes. `npm run lint` reports one error, in the untracked `login/dash-preview` page (never committed); tracked code is clean.

- `npm test` passes 60/60, including the new csp and focus tests. `tsc` is clean. `eslint` is clean on the changed files. `npm run build` passes, and the hash check matches. Static routes are unchanged: `/landing`, `/privacy`, `/terms` and `/_not-found` are still prerendered.
- **CSP checks on a local production build** (`next start`):
  - The headers are correct per route.
  - On `/login`, `/login?mode=signup`, `/login?expired=1` and `/f/<bad>`, every executable script carries the nonce or matches the hash, and there are no inline handlers.
  - The bundles contain no `eval` or `new Function`. Client requests are same-origin or Supabase only.
  - Client navigation `/login` → `/privacy` → `/terms` → `/login`, plus a sign-in Server Action round-trip (a validation error, with no Supabase call), produced **zero violations**. An inline-handler control was reported, so reporting works.
  - `/auth/confirm` with a bogus `code` or `token_hash` still redirects to `/login?expired=1`.
- **P1 live check** (dev, mock dashboard preview, signed out so RLS rejects the insert):
  - Stopping a session showed "…It's kept and will save later."
  - The run was cleared and the session stayed queued.
  - A reload and an `online` event each retried once, silently, keeping one queued copy.
  - The success path is covered by unit tests only.
- **Not tested:**
  - anything signed in: the signed-in pages under the nonce CSP, chat streaming, uploads, a real magic link, the timer's success path;
  - Safari/WebKit;
  - phones;
  - Vercel itself (nothing deployed).

## Relevant Architecture / Graphify Context

- **Account data:** `app/actions.ts` (`deleteAccount`, `resetAllData`, `removeFiles`), `app/api/export/route.ts`, and `components/settings-forms.tsx` (`DeleteAccount`, `ResetData`, the Data tab). `lib/supabase/admin.ts` is the service-role client (server only).
- **Legal:** `app/legal.tsx` (`LegalPage`, `Section`, `CONTACT`, `UPDATED`), `app/privacy/page.tsx`, `app/terms/page.tsx`. Public routes are listed in `proxy.ts`.
- **Cascade:** every user table references `auth.users on delete cascade`. `decks` and `focus_sessions` use `on delete set null` for `course_id` only.
- **Icons:** `components/icons.tsx`.
- **Sync/Settings:** `components/sync-window.tsx` and `components/settings-forms.tsx`.
- **Home:** `dashboard.tsx`, `up-next.tsx`, `chart-widgets.tsx`, `lib/progress.ts` (`byDue`).
- **Landing:** `app/landing/page.tsx` plus `hero.tsx`, `ai.tsx`, `showcase.tsx`, `features.tsx`, `pricing.tsx`, `kit.tsx`.
- **Security:** the CSP is built in `lib/csp.ts` (`ENFORCE`, `STATIC`, `THEME_SCRIPT_HASH`) and set in `proxy.ts`, with the build check in `scripts/check-csp-hash.mjs`. The route allowlist and the `/login` redirect are in `proxy.ts`. The full review is in `docs/SECURITY.md`.
- **Focus timer:** `components/focus-timer.tsx` (`finish`, `save`, the pending queue), `lib/focus.ts` (`enqueue`, `flush`), and `logFocus` in `app/actions.ts`.
- **Desktop:** `DESKTOP_ARCHITECTURE_SPEC.md` is authoritative. The shell is `src-tauri/` (`src/lib.rs`: the navigation lock `classify`, the offline page and `refresh`, tray and lifecycle, `app_info` and `bridge_path_allowed`; `offline/offline.html`; `capabilities/main.json`; `tauri.conf.json`). Graphify ignores it. There is no web-side desktop code yet (`src/lib/desktop/` starts in M6).
- **Rate limits and AI metering:** `lib/limit.ts` (migrations 0014, 0015, 0017).

## Important Constraints

- **Ask before:** adding a dependency, writing a migration, removing a feature, or changing focus-timer behavior, chat storage, Supabase/env/API routes/auth or billing.
- **Migrations:** give the SQL to paste, **plus a `create or replace` / delta version**.
- Never write to Supabase or enter passwords. Spending Higgsfield credits needs the user's OK.
- **Commits:** commit every important change; run tsc, lint and tests first; say "untested" when true. Push to `main` as before, **except** desktop milestones, which wait for the user's word (sessions 7 and 8: M0/P1 and M1 committed, not pushed).
- **Preview pages:** `src/app/login/*-preview/` are untracked (`.git/info/exclude`) and must never be committed.
- **Communication:** terse; give copy-paste commands.

## Next Recommended Task

**Wait for the user's word on M2.** M1 is committed locally and not pushed.
- **First, the user's password sign-in check in the shell** (see "Needs the user"). It's the one M1 criterion that couldn't be run.
- **M2: shared app boot** (spec §13). Run the 7 signed-in pages, chat streaming, Canvas sync, file upload, the export download and the focus timer inside WebView2. Check the mic button (hide it where `SpeechRecognition` is missing) and focus-noise `AudioContext` in a hidden window. Expect a few webview-specific fixes. Note that materials open in the system browser (`target=_blank` to a signed URL).
- Do not start Focus Guardian or M3/M6 before the CSP is enforced.

## Tomorrow / New-Session Startup Prompt

"do resume protocol"
