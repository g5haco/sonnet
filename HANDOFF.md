# Project Handoff

> Updated 2026-10-02 (session 7), code through the M0/P1 commit. The code wins over this file. Product truth: `PRODUCT.md`. **Desktop architecture (authoritative): `DESKTOP_ARCHITECTURE_SPEC.md`.** Plans: `docs/ROADMAP.md` (phases 0–9), `docs/COMMERCIAL-ROADMAP.md` (phases 10–16), `docs/PHASE-10-PLAN.md` (current phase). Security: `docs/SECURITY.md`.

## Project Summary

**Sonnet** is a student hub: Canvas sync, calendar, courses, materials, grades, a focus timer, a customizable Home of widgets, flashcards, and an AI (also named **Sonnet**) that knows every course down to the syllabus. It's built by one college student and is live and multi-user at `https://www.ericwei.me` (Supabase RLS). Stack: Next.js 16, Supabase, Vercel, OpenRouter (free models first), `motion`, GSAP (landing only).

Direction: commercialization. **Phase 10 (launch readiness) is in progress: steps 1–4 of 9 are done.**
- Done: rate limits and Free/Pro limits, the security pass, account deletion and export, and the legal pages (drafts).
- Left: monitoring, analytics, Resend email, Google sign-in, hosting upgrade.
- Pro can't be bought yet: there's no Stripe and the price is hidden.

Second track: **a Windows/macOS desktop app** (Tauri 2 shell over the live site; Focus Guardian is the first native feature). The architecture is approved in `DESKTOP_ARCHITECTURE_SPEC.md`. **M0 and P1 are done; M1 (the Tauri shell) is next and not started.**

## Current State

- Live at `4eb8f00` plus session 7's local commits: `ccf9aa0` (spec) and the M0/P1 commit. **Not pushed:** the user said don't push this milestone. Nothing is deployed, so the new CSP and timer aren't live yet.
- The user ran migrations 0001–0017. Session 7 needed none.
- **Nothing from sessions 2–7 has been tested signed in.** That includes export and delete, and now the nonce CSP on signed-in pages and the focus-timer save success path.

## Completed This Session

- **Desktop architecture decided.**
  - A 32-agent Arena run was stopped in round 1. The user accepted candidate `a016` after its claims were checked against the repo.
  - The result is `DESKTOP_ARCHITECTURE_SPEC.md`, approved and committed (`ccf9aa0`): Tauri 2 thin shell over the live site, a typed bridge, a small Rust layer, no static export, direct download, GitHub Releases for updates, Electron only as a macOS fallback. Lecture Listener is deferred.
  - `.arena/` holds the run record. It's excluded locally in `.git/info/exclude`.
- **M0: nonce CSP and the `/login` redirect.**
  - `src/lib/csp.ts` builds the policy and `src/proxy.ts` sets it per request.
    - Dynamic pages get `script-src 'self' 'nonce-…' '<theme hash>' 'strict-dynamic'`.
    - The prerendered `/landing` (and signed-out `/`), `/privacy` and `/terms` keep a no-nonce `'unsafe-inline'` policy, so they stay static.
    - `connect-src` adds `ipc: http://ipc.localhost` for the future desktop bridge.
    - Still **report-only** (`ENFORCE = false`). The static CSP header was removed from `next.config.ts`.
  - `next-themes`' inline script is allowed by hash. `npm run build` now runs `scripts/check-csp-hash.mjs`, which fails the build if that hash drifts.
  - The proxy sends signed-in users from `/login` to `/`, carrying refreshed cookies.
- **P1: focus sessions no longer get lost.**
  - `finish()` now queues the session in `localStorage` (`sonnet-focus-pending`) before clearing the run.
  - `flush()`/`enqueue()` in `lib/focus.ts` retry on mount and on `online`, serialized across tabs with a Web Lock. There's an in-memory fallback when storage is blocked.
  - `logFocus` skips rows that already exist (same `started_at`) and marks invalid sessions `final`, so they're dropped instead of retried.
  - 5 new tests.
- One reviewer sub-agent checked the diff. Fixed its findings: cross-tab duplicates (Web Lock), blocked storage (memory fallback), permanent errors retrying forever (`final`). The static-404 note is recorded as a known gap.

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
  - approval for M1's dependencies (the Rust toolchain, `@tauri-apps/cli`).
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
2. **Desktop M1: the Tauri shell** (spec §13). It needs dependency approval. M1, M2, M4 and M5 can proceed while the CSP is report-only. M3 and M6 wait for the enforced CSP.
3. **Phase 10 step 5: monitoring.** It needs the user's choice of Sentry or no-dependency logging, plus an uptime account.
4. **Contact email and legal review**, which block charging.
5. Steps 6–8: analytics, Resend, Google sign-in.
6. After 1–2 weeks: read the `ai_usage` costs, set `PRO`, then Stripe. Vercel and Supabase Pro are needed before charging.

## Testing / Validation Status

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
- **Desktop:** `DESKTOP_ARCHITECTURE_SPEC.md` is authoritative. There is no desktop code yet.
- **Rate limits and AI metering:** `lib/limit.ts` (migrations 0014, 0015, 0017).

## Important Constraints

- **Ask before:** adding a dependency, writing a migration, removing a feature, or changing focus-timer behavior, chat storage, Supabase/env/API routes/auth or billing.
- **Migrations:** give the SQL to paste, **plus a `create or replace` / delta version**.
- Never write to Supabase or enter passwords. Spending Higgsfield credits needs the user's OK.
- **Commits:** commit every important change; run tsc, lint and tests first; say "untested" when true. Push to `main` as before, **except** desktop milestones, which wait for the user's word (session 7: M0/P1 committed, not pushed).
- **Preview pages:** `src/app/login/*-preview/` are untracked (`.git/info/exclude`) and must never be committed.
- **Communication:** terse; give copy-paste commands.

## Next Recommended Task

**Stop here until the user decides.** The user asked to stop before M1.
- **Option A:** the user pushes or deploys M0/P1 and runs the signed-in CSP console check (DevTools console, look for `[Report Only]`). If it's clean, set `ENFORCE = true` in `lib/csp.ts`.
- **Option B: desktop M1, the Tauri shell** (spec §13). Ask first for the Rust toolchain and the `@tauri-apps/cli` dev dependency. Build `src-tauri/` with a main window at `/login`, a navigation lock, an offline page, single instance, a tray and reload-on-show. No native commands beyond `app_info`.

## Tomorrow / New-Session Startup Prompt

"do resume protocol"
