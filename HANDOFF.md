# Project Handoff

> Updated 2026-10-01 (end of session 6), code through `4eb8f00`. The code wins over this file. Product truth: `PRODUCT.md`. Plans: `docs/ROADMAP.md` (phases 0–9), `docs/COMMERCIAL-ROADMAP.md` (phases 10–16), `docs/PHASE-10-PLAN.md` (current phase). Security: `docs/SECURITY.md`.

## Project Summary

**Sonnet** is a student hub: Canvas sync, calendar, courses, materials, grades, a focus timer, a customizable Home of widgets, flashcards, and an AI (also named **Sonnet**) that knows every course down to the syllabus. It's built by one college student and is live and multi-user at `https://www.ericwei.me` (Supabase RLS). Stack: Next.js 16, Supabase, Vercel, OpenRouter (free models first), `motion`, GSAP (landing only).

Direction: commercialization. **Phase 10 (launch readiness) is in progress: steps 1–4 of 9 are done.**
- Done: rate limits and Free/Pro limits, the security pass, account deletion and export, and the legal pages (drafts).
- Left: monitoring, analytics, Resend email, Google sign-in, hosting upgrade.
- Pro can't be bought yet: there's no Stripe and the price is hidden.

## Current State

- Live; every commit is pushed to `main` (latest `4eb8f00`). The working tree is clean apart from the auto-regenerated `graphify-out/`.
- The user ran migrations 0001–0017 and granted their own account Pro. This session needed no migration (every table already cascades from `auth.users`).
- **Nothing from sessions 2–6 has been tested signed in**, including the new export and delete. Everything was checked on the untracked mock preview pages (`src/app/login/*-preview/`) and the public pages.

## Completed This Session

- **Account deletion** (`deleteAccount` in `app/actions.ts`):
  - Settings → Data → "Delete my account…" asks for the email plus `DELETE`, both checked on the server against the verified session.
  - It removes the storage files with the admin client, then `auth.admin.deleteUser`, then signs out and redirects to `/`.
  - The file removal is a shared helper, `removeFiles`, also used by `resetAllData`. It paginates and fails loudly on any list error.
- **Data export:** `GET /api/export` (`app/api/export/route.ts`) returns one JSON download through the per-user client (RLS).
  - Tables: settings, courses, items, class_meetings, materials, chats, decks, focus_sessions, grade_history, ai_usage.
  - `feed_token` and `canvas_ics_url` are stripped. The Canvas token table isn't readable by students. Uploaded files are listed, not bundled.
  - A "Download my data" link sits in the Data tab.
- **Legal pages:** `/privacy` and `/terms` (`app/privacy`, `app/terms`, shared frame `app/legal.tsx`).
  - They're public: the `proxy.ts` allowlist, sitemap and robots allow them. They're linked from the landing footer and under the sign-up form.
  - Both are written from what the code stores and sends and carry a visible "draft, not reviewed by a lawyer" note.
  - The contact email is a placeholder (`CONTACT` in `legal.tsx`).
- One reviewer sub-agent checked the diff: no auth or secret issues. Fixed its findings: pagination, the shared-deck note on the privacy page, and deck wording (there's no unshare, so the text says the link works until you delete the deck or your account).
- Earlier sessions are in the git log. Session 5 shipped the Sync and Settings redesign, the Geist and Phosphor swap, the GSAP scrub, the report-only CSP and the security pass.

## Important Decisions

- **Delete is immediate, not a grace period.** A 30-day restore flow would need a migration and a cron job; not worth it before real users exist.
- **Export is JSON only.** A ZIP of the uploaded files was declined (a dependency, and heavy on Vercel's time limits).
- **Legal text claims only what the code does.** Re-verify `privacy/page.tsx` whenever data flows change: a new AI provider, analytics, email, sharing or storage.
- **Honest landing page:** real screenshots stay above the fold.
- **Keep the nature imagery** (dusk and night meadow). Don't swap it for stock or generated photos.
- **The taste skill applies to the landing page only.** The app follows PRODUCT.md (sentence case, mono readouts, course colors).
- **Icons go through `@/components/icons` only.** Map new names there; never import Phosphor directly.
- **The CSP stays report-only** until a week of real use shows no violations; then rename the header to `Content-Security-Policy`. A report endpoint (a new API route) needs the user's OK.
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
  - OK for a CSP report endpoint.
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
- The Canvas free cap follows Canvas order: deleting a course just re-imports it.
- Weeks reset Monday 00:00 UTC. `visionText` isn't metered. On a retry, only the last attempt's cost is logged.
- If account delete errors with a database error, suspect Supabase refusing to delete a user who still owns storage objects. Files are removed first, so it shouldn't happen.
- **Dev only:**
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

1. **A signed-in check** of sessions 2–6 on the live site, including export and delete with a throwaway account.
2. **Phase 10 step 5: monitoring.** It needs the user's choice of Sentry or no-dependency logging, plus an uptime account. Add `/api/health`.
3. **Contact email and legal review**, which block charging.
4. Steps 6–8: analytics, Resend, Google sign-in. Each needs a user account or choice first.
5. Watch the CSP for violations, then enforce it.
6. After 1–2 weeks: read the `ai_usage` costs, set `PRO` in `pricing.tsx`, then Stripe (Phase 11/12). Vercel and Supabase Pro are needed before charging.

## Testing / Validation Status

- `npm test` passes 53/53. `tsc` is clean. `eslint` is clean on this session's files (the known error in the untracked `login/dash-preview` is the only one repo-wide). The new code has no unit tests.
- **Browser checks this session:** `/privacy` and `/terms` load and render with no console errors; the footer and sign-up links, sitemap and robots output are correct; `/api/export` redirects when signed out. Mobile emulation didn't apply because the pane was hidden, so the 375px layout is unmeasured.
- **Not tested:** the export download, the delete flow, anything signed in, the real database, Safari/Firefox/phones.
- One reviewer sub-agent checked the delete/export diff (findings fixed).

## Relevant Architecture / Graphify Context

- **Account data:** `app/actions.ts` (`deleteAccount`, `resetAllData`, `removeFiles`), `app/api/export/route.ts`, and `components/settings-forms.tsx` (`DeleteAccount`, `ResetData`, the Data tab). `lib/supabase/admin.ts` is the service-role client (server only).
- **Legal:** `app/legal.tsx` (`LegalPage`, `Section`, `CONTACT`, `UPDATED`), `app/privacy/page.tsx`, `app/terms/page.tsx`. Public routes are listed in `proxy.ts`.
- **Cascade:** every user table references `auth.users on delete cascade`. `decks` and `focus_sessions` use `on delete set null` for `course_id` only.
- **Icons:** `components/icons.tsx`.
- **Sync/Settings:** `components/sync-window.tsx` and `components/settings-forms.tsx`.
- **Home:** `dashboard.tsx`, `up-next.tsx`, `chart-widgets.tsx`, `lib/progress.ts` (`byDue`).
- **Landing:** `app/landing/page.tsx` plus `hero.tsx`, `ai.tsx`, `showcase.tsx`, `features.tsx`, `pricing.tsx`, `kit.tsx`.
- **Security:** CSP in `next.config.ts`, route allowlist in `proxy.ts`, the full review in `docs/SECURITY.md`.
- **Rate limits and AI metering:** `lib/limit.ts` (migrations 0014, 0015, 0017).

## Important Constraints

- **Ask before:** adding a dependency, writing a migration, removing a feature, or changing focus-timer behavior, chat storage, Supabase/env/API routes/auth or billing.
- **Migrations:** give the SQL to paste, **plus a `create or replace` / delta version**.
- Never write to Supabase or enter passwords. Spending Higgsfield credits needs the user's OK.
- **Commits:** commit and push every important change to `main`; run tsc, lint and tests first; say "untested" when true.
- **Preview pages:** `src/app/login/*-preview/` are untracked (`.git/info/exclude`) and must never be committed.
- **Communication:** terse; give copy-paste commands.

## Next Recommended Task

**Phase 10 step 5: monitoring.**
- **Goal:** errors and downtime reach the user's email.
- **First step:** ask the user to choose Sentry (`@sentry/nextjs`, a dependency) or the no-dependency fallback (`instrumentation.ts` `onRequestError` plus Vercel logs), and to make an uptime account.
- **Then build:** `/api/health` that pings Supabase, add it to the `proxy.ts` allowlist, and wire the error hook.
- **Before it:** a quick signed-in test of export and delete by the user, because those touch auth and data and are untested live.

## Tomorrow / New-Session Startup Prompt

"do resume protocol"
