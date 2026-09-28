# Project Handoff

> Updated 2026-09-27 (end of session 5), code through the photo revert after `c069f99`. The code wins over this file. Product truth: `PRODUCT.md`. Plans: `docs/ROADMAP.md` (phases 0–9), `docs/COMMERCIAL-ROADMAP.md` (phases 10–16), `docs/PHASE-10-PLAN.md` (current phase). Security: `docs/SECURITY.md`.

## Project Summary

**Sonnet** is a student hub: Canvas sync, calendar, courses, materials, grades, a focus timer, a customizable Home of widgets, flashcards, and an AI (also named **Sonnet**) that knows every course down to the syllabus. It's built by one college student and is live and multi-user at `https://www.ericwei.me` (Supabase RLS). Stack: Next.js 16, Supabase, Vercel, OpenRouter (free models first), `motion`, GSAP (landing only).

Direction: commercialization. **Phase 10 (launch readiness) is in progress.**
- Steps 1–2 are done: Free/Pro limits, and the security pass.
- Pro can't be bought yet: there's no Stripe and the price is hidden.

## Current State

- Live; every commit is pushed to `main`. The working tree is clean apart from the auto-regenerated `graphify-out/`.
- The user ran migrations 0001–0017 and granted their own account Pro (confirmed this session).
- **Nothing from sessions 2–5 has been tested signed in.** Everything was checked on the untracked mock preview pages (`src/app/login/*-preview/`) and the public landing page.

## Completed This Session

- **Sync and Settings redesign** (`sync-window.tsx`, `settings-forms.tsx`):
  - **Sync** is drawn as a signal path: canvas → sonnet → google.
    - The wire shows the state: a moving dot while data flows, a racing dot while syncing, a break with × on error, a dashed line when not set up.
    - Below it are channel strips ("in · 01", "out · 01"), a square status light plus a word, and a mono readout table.
    - Canvas state now comes from a `useCanvas` hook in `SyncWindow`.
  - **Settings** has a numbered index (01 Account / 02 Term / 03 Data) with a sliding `layoutId` highlight, and spec-sheet `Row`s (label and hint on the left, control on the right).
    - Term shows one cell per week.
    - The content no longer blanks while the dialog closes (`shown` state).
- **UI fixes:**
  - A `hit` utility in `globals.css` gives small mono links a 44px tap area.
  - Landing footer links, the Home search input and the volume slider meet tap-target size.
  - Material rows stack the name and meta on phones.
- **Charts:** evilcharts (about 2,900 lines) and `recharts` are removed. The Done vs due (`PaceWidget`) chart is plain SVG in `chart-widgets.tsx`.
- **Home Up next / Due today:**
  - Rows open `WorkView`, the same item view as the course page; the checkbox still just checks off.
  - Ordering uses `byDue` in `lib/progress.ts`: soonest first, and work due at the *same moment* is grouped by class, busiest class that day first. It has a test.
- **Security pass (Phase 10 step 2)**, written up in `docs/SECURITY.md`:
  - The RLS and function-permission review found nothing to fix.
  - The app review found nothing to fix. Server actions rely on RLS through the per-user client; the cron endpoint compares its secret in constant time; URLs are filtered.
  - `npm audit` found 0 vulnerabilities.
  - **A report-only CSP** is in `next.config.ts`.
  - A secret-rotation checklist is included.
- **Design pass** (Web Interface Guidelines plus the taste skill):
  - **Landing hero:** label, headline, a 19-word subtext and the buttons.
  - **Landing sections:** labels only on the hero and How it works; one signup label ("Get started free"); no 01/02/03 step numerals; the Canvas demo reads as a sync log, not a shell prompt; the widget count comes from `WIDGETS`.
  - **App:** `touch-action: manipulation` and no tap highlight on controls.
  - **Fonts:** Geist (text and headings; headings are semibold with -0.03em tracking via a base-layer `:where(.font-heading)` rule) and Geist Mono. Archivo, Abril Fatface and IBM Plex Mono are gone.
  - **Icons:** `lucide-react` is replaced by `@phosphor-icons/react` through `src/components/icons.tsx`, which keeps the old names, defaults to 24px and uses the SSR build. `components.json` `iconLibrary` is `phosphor`.
  - **GSAP:** `landing/scrub-text.tsx` (ScrollTrigger) brightens the About paragraphs word by word; it's static under reduced motion.
  - **Photos:** generated night photos (library, campus, desk) were tried and **reverted at the user's request**. The user likes the nature vibe, so the landing keeps the dusk meadow (`/login/meadow.webp`) and the night meadow (`/landing/night.webp`).

## Important Decisions

- **Honest landing page:** real screenshots stay above the fold.
- **Keep the nature imagery** (meadow at dusk and at night). The user rejected the campus/library stock look; don't swap it for stock or generated photos.
- **The taste skill applies to the landing page only.** The app follows PRODUCT.md, and the skill itself says dashboards are out of scope. The app keeps sentence case (no Title Case), mono readouts and course colors.
- **Icons go through `@/components/icons` only.** Add new icons by mapping a name there; never import Phosphor directly.
- **The CSP stays report-only** until a week of real use shows no violations; then rename the header to `Content-Security-Policy`. A report endpoint (a new API route) was offered and needs the user's OK.
- **Price:** it stays hidden until `ai_usage` shows real costs (AI is about $7/user/month by the user's estimate).
- **Limits live in the database**, and Canvas imports the first 2 courses. Quick note and Today's three are stored per device, in localStorage.
- **Held from earlier sessions:**
  - ask before adding a dependency (this session the user approved GSAP, Phosphor and the Higgsfield credits);
  - honest copy;
  - metering fails open;
  - error tracking waits until charging starts.

## Current Design System

- **Palette:** Midnight Study (tokens in `globals.css`). A monochrome shell with an off-white primary; the landing is always dark (`.landing dark`).
- **Type:** Geist for text and headings (`font-heading` = Geist 600, tight tracking) and Geist Mono for readouts, labels and numbers.
- **Icons:** Phosphor, regular weight, through `components/icons.tsx`.
- **Color carries meaning:** course hues, status (`--done`, `--warning`, `--destructive`) and data. Letter-grade badges use the course hue at 22%.
- **Motion:**
  - ease-out `[0.23,1,0.32,1]` with low-bounce springs, using `motion`.
  - GSAP only in isolated landing leaves (`scrub-text.tsx`).
  - Reduced motion is respected everywhere.
  - On SVG children, use motion's `scale`/`rotate`/`y` props, not `transform` strings.
- **Landing backdrop:** the dusk meadow, then the night meadow, then solid, driven by scroll-timeline CSS (`.sky-*` in `globals.css`). The nature vibe is part of the brand.
- **Must not regress:** 44px tap targets on phones (use `hit` for small text links), no overflow at 375px, no hydration mismatches.

## In Progress / Unfinished Work

- **Needs the user:**
  - a signed-in check of everything since session 2 (Sync/Settings redesign, Up next item view and order, the Pace chart, the new fonts and icons in the app);
  - the About text;
  - legal review of privacy/terms;
  - accounts for Resend, uptime monitoring and Google OAuth;
  - rotating secrets per `docs/SECURITY.md`;
  - OK for a CSP report endpoint.
- **Offered, not yet decided:**
  - let Free students pick which 2 Canvas courses to keep;
  - sync Quick note and Today's three across devices (a migration);
  - fix the duplicate deck from re-saving an old chat's deck;
  - group Up next by day instead of the exact due time.
- **Audit leftovers (not done):**
  - `ash-burst-button.tsx` (391 lines + `matter-js`) serves only the reset confetti;
  - `ui/*.tsx` imports `cn` from the package instead of `@/lib/utils`;
  - the plural-"s" expression is repeated 7 times;
  - some exports are only used in their own file.

## Known Bugs / Issues

- Saving a deck from an old chat twice (after a reload) creates a duplicate.
- The Canvas free cap follows Canvas order: deleting a course just re-imports it.
- Weeks reset Monday 00:00 UTC. `visionText` isn't metered. On a retry, only the last attempt's cost is logged.
- **Dev only:**
  - hydration warnings from `VoiceBeam`/`MetalFx`;
  - the Next dev-tools badge sits over the phone menu button in previews;
  - the browser pane can't screenshot while it's hidden (use DOM measurements).
- Free AI models are flaky. `graphify update .` sometimes segfaults; the git hook rebuilds in the background anyway.
- **Windows editing:**
  - Some files use CRLF, and `globals.css` has *mixed* endings.
  - Edit with Python keeping `newline=''`, or with the Edit tool; `sed -i` has stripped CRs before.
  - Bash heredocs mangle backslashes, so write Python to a scratch file.

## Current Priorities

1. **A signed-in check** of this session's changes on the live site, including the fonts and icons in every app page.
2. **Phase 10 step 3: account deletion and data export.** It touches auth, so plan it with the user first.
3. Watch the CSP for violations, then enforce it.
4. After 1–2 weeks: read the `ai_usage` costs, set `PRO` in `pricing.tsx`, then Stripe (Phase 11/12).

## Testing / Validation Status

- `npm test` passes 53/53. `tsc` is clean. `eslint` shows only the known error in the untracked `login/dash-preview`.
- **Browser checks** (mock previews and landing, desktop and 375px): Sync and Settings in every state, tap targets, materials rows, the Pace chart, the Up next item view, no CSP violations, the hero measured at 2 lines with the CTA above the fold, Geist and Phosphor rendering, and the GSAP scrub.
- **Not tested:** anything signed in, the real database, Safari/Firefox/phones, and the visual quality of Phosphor at every icon spot (the pane was hidden for most screenshots).
- One reviewer sub-agent reviewed the Sync/Settings diff and found no bugs.

## Relevant Architecture / Graphify Context

- **Icons:** `components/icons.tsx` (name → Phosphor map, `IconType`).
- **Sync/Settings:** `components/sync-window.tsx` (`useCanvas`, `Wire`, `Node`, `Channel`, `CanvasForm`, `FeedLink`, which is also used by `calendar-rail.tsx`) and `components/settings-forms.tsx` (`SettingsWindow`, `Row`, `SemesterSettings`, `ResetData`).
- **Home:**
  - `components/dashboard.tsx` renders `WorkView` and owns `openId`;
  - `components/up-next.tsx` uses `byDue`;
  - `components/chart-widgets.tsx` holds `PaceWidget` and the other SVG charts;
  - `lib/progress.ts` holds `byDue`.
- **Landing:** `app/landing/page.tsx` (backdrop, About with `ScrubText`), `hero.tsx`, `ai.tsx`, `showcase.tsx`, `features.tsx`, `pricing.tsx`, `kit.tsx` (`SectionHead` label optional).
- **Security:** CSP in `next.config.ts`, route allowlist in `proxy.ts`, the full review in `docs/SECURITY.md`.
- **Plan and flashcards:** unchanged from session 4 (`lib/plan.ts`, migrations 0016/0017, `components/flashcards.tsx`).

## Important Constraints

- **Ask before:** adding a dependency, writing a migration, removing a feature, or changing focus-timer behavior, chat storage, Supabase/env/API routes/auth or billing.
- **Migrations:** give the SQL to paste, **plus a `create or replace` / delta version**.
- Never write to Supabase or enter passwords. Spending Higgsfield credits needs the user's OK; the free plan can't use Soul models, so use `z_image`.
- **Commits:** commit and push every important change to `main`; run tsc, lint and tests first; say "untested" when true.
- **Preview pages:** `src/app/login/*-preview/` are untracked (`.git/info/exclude`) and must never be committed.
- **Communication:** terse; give copy-paste commands.

## Next Recommended Task

**A signed-in check, then Phase 10 step 3: account deletion and data export.**
- **Goal:** a signed-in student can export all their data (JSON, plus material files) and permanently delete their account from Settings → Data, with the Canvas token, storage files, chats, decks and the auth user all removed.
- **Done when:** export downloads a complete archive and delete leaves no rows or files for the user (verified with a test account), with a slow, confirm-heavy UI like Reset all data.
- **First step:** propose the design (server action vs API route, service-role deletion order, Supabase auth admin delete) and get the user's OK, because it touches auth.

## Tomorrow / New-Session Startup Prompt

"do resume protocol"
