# Project Handoff

> Updated 2026-09-26 (end of session 4), code through `31373e7`. The code wins over this file. Product truth: `PRODUCT.md`. Plans: `docs/ROADMAP.md` (phases 0–9), `docs/COMMERCIAL-ROADMAP.md` (phases 10–16), `docs/PHASE-10-PLAN.md` (current phase).

## Project Summary

**Sonnet** is a student hub: Canvas sync, calendar, courses, materials, grades, a focus timer, a customizable Home of widgets, flashcards, and an AI (also named **Sonnet**) that knows every course down to the syllabus. It's built by one college student and is live and multi-user at `https://www.ericwei.me` (Supabase RLS). Stack: Next.js 16, Supabase, Vercel, OpenRouter (free models first), `motion`.

Direction: commercialization. **Phase 10 (launch readiness) is in progress.** The Free/Pro split now exists in the code, but Pro can't be bought yet: there's no Stripe and the price is hidden.

## Current State

- Live; every commit is pushed to `main`.
- **Migrations:**
  - The user ran 0001–0015.
  - **0016 (decks) and 0017 (free limits) were written this session. Ask whether they were run.** Until 0016 runs, Flashcards and chat deck auto-save fail with a toast. Until 0017 runs, the course and deck limits don't apply.
- The user was given SQL to make their own account Pro (`insert into plans … where email = '2008ericwei@gmail.com'`). Unconfirmed whether they ran it.
- Nothing from sessions 2–4 has been tested signed in.

## Completed This Session

- **Flashcards** (0016):
  - A `decks` table and a `/flashcards` sidebar tab: list with a course filter, an editor (rename, animated course picker, add/delete/reorder cards, save bar), full-screen study mode (Again/Got it, shuffle), and "New deck".
  - Every deck made in chat is auto-saved and the chat links to it.
  - Share links at `/f/<code>`: the public page is read-only and works signed out. Security-definer `shared_deck(code)`; `/f` is in the `proxy.ts` allowlist; not indexed.
- **Free vs Pro** (0017 + `src/lib/plan.ts`):
  - Free: 2 courses, 1 deck, 10 widgets. Pro: unlimited, plus the 20 Pro widgets.
  - A BEFORE INSERT trigger enforces the course and deck counts, including service-role inserts from Canvas sync.
  - Canvas sync imports the first 2 Canvas courses and skips the rest along with their work; the sync note reports how many were skipped.
  - `isPaid()` reads the user's `plans` row.
- **Home widgets:**
  - Removed 10 redundant widgets and deleted their dead chart code.
  - New Pro widgets: Today's three, Soundscape (Web Audio), Breathe, Quick note, Study buddy, Roll for it (now a card plus a rolling die), Study plant, Week glass. The total is 30.
  - Pro widgets on a Free Home show blurred behind a lock.
  - The library shows sample data for every preview, at each widget's default proportions, with All / Study tools / Fun filters.
  - The Grades widget now shows letter grades (`letterGrade` in `lib/course.ts`).
  - The edit ×/resize icons have no background.
- **Landing:**
  - "And the rest" is a plain two-column list.
  - The FAQ was updated: no mention of free models, and it covers the allowance, flashcards and limits.
  - The pricing section has two cards, Free and Sonnet Pro, with the Pro price hidden (`PRO = null` in `landing/pricing.tsx`). Setting a price reveals a Monthly/Annual switch and a strike-through discount animation.
- **Chat:** the + menu only attaches files. Web search and Think harder stay as their own toggles.

## Important Decisions

- **Price:** the user believes AI costs about $7/user/month, so a $7 price would lose money. The price stays hidden until `ai_usage` gives real numbers. Options discussed: a higher price, a lower Pro fair-use cap, or keeping heavy tasks on cheaper models.
- **Pro is "coming soon":** Pro-locked UI says so honestly. Nobody can buy Pro yet.
- **Limits live in the database**, with rows created before a limit kept. The Canvas cap takes Canvas order; students can't choose which courses yet.
- **Widget tiers:**
  - Free: progress, next, grades, exam, courses, focus, timer, calendar, today, streak.
  - Fun (`fun: true`): streak, buddy, roll, plant, glass.
- Quick note and Today's three are saved in localStorage, on that device only (a `ponytail` note marks it). Moving them to the database needs a migration.
- Held from earlier sessions:
  - no new dependencies without asking;
  - honest landing page;
  - rate limiting and metering fail open;
  - error tracking deferred until charging starts.

## Current Design System

- **Palette:** Midnight Study (tokens in `globals.css`). A monochrome shell with an off-white primary and brand; the landing is always dark.
- **Type:** Archivo for text, Abril Fatface for `font-heading`, IBM Plex Mono for mono.
- **Color carries meaning:** course hues, status (`--done`, `--warning`, `--destructive`) and data. The letter-grade badges use the course hue at 22%.
- **Motion:**
  - ease-out `[0.23,1,0.32,1]` with low-bounce springs; reduced motion is respected.
  - **On SVG children, use motion's `scale`/`rotate`/`y` props, not `transform` strings**, which cause console errors on `<g>`.
- **Must not regress:** 44px tap targets on phones, no overflow at 375px, no hydration mismatches (round SVG trig values).

## In Progress / Unfinished Work

- **Needs the user:**
  - Confirm that 0016, 0017 and the Pro grant were run.
  - The About text.
  - Legal review of privacy/terms (once drafted).
  - Accounts for Resend, uptime monitoring and Google OAuth.
  - Secret rotation.
- **Offered, not yet decided:**
  - Let Free students pick which 2 Canvas courses to keep.
  - Sync Quick note and Today's three across devices (a migration).
  - Fix a duplicate deck when an old chat's deck is saved again after a reload.
- Phase 10 steps 2–9 are not started. Step 2 is the security pass.

## Known Bugs / Issues

- Saving a deck from an old chat twice (after a reload) creates a duplicate.
- The Canvas free cap follows Canvas order: deleting a course just re-imports it.
- Weeks reset Monday 00:00 UTC. `visionText` isn't metered. On a retry, only the last attempt's cost is logged.
- Dev-only hydration warnings from `VoiceBeam`/`MetalFx`. Free AI models are flaky. `graphify update .` can segfault.
- **Windows editing:**
  - Some files use CRLF (`actions.ts`, `dashboard.tsx`, `globals.css`).
  - Bash heredocs mangle `\n` and apostrophes in this environment. Use the Write/Edit tools for TS content.

## Current Priorities

1. The user runs 0016/0017 and the Pro grant, then a signed-in check of Flashcards, the limits, the Pro widgets and the credits pill.
2. **Phase 10 step 2: security pass.** RLS review (now including `decks` and `shared_deck`), CSP in report-only mode, `npm audit` plus the supply-chain audit, a secret-rotation checklist.
3. Phase 10 step 3: account deletion and data export. This touches auth, so ask first.
4. After 1–2 weeks: read the `ai_usage` costs, then set `PRO` in `pricing.tsx` (Phase 11/12, then Stripe).

## Testing / Validation Status

- `npm test` passes 52/52 (two tests went with removed chart helpers). `tsc` and `eslint` are clean. The only lint error is in the untracked `login/dash-preview`.
- **Browser:** Flashcards, the editor/study/share pages, the pricing animation, the new widgets, the locked view, the library filters, roll and grades were checked on mock preview pages at desktop width; Flashcards was also checked at 375px. Checking off a task in Today's three reverts on the mock page because the items are fake.
- **Not tested:** anything signed in; any SQL against the real database; the Soundscape audio output; Safari, Firefox, phones.
- One review sub-agent pass ran on Flashcards and on the limits. Its fixes are in (the `shared_deck` column ambiguity, the Canvas skip-code bugs, and trigger errors now skip instead of failing the sync).

## Relevant Architecture / Graphify Context

- **Plan:** `lib/plan.ts` (`FREE`, `isPaid`, `limitError`) plus `migrations/0017`. Used in `canvas.ts` `syncCanvasUser` (`room`, `skipped`), `actions.ts` (createCourse, createDeck, syncCanvasNow), `(app)/page.tsx`, `flashcards/page.tsx`.
- **Flashcards:** `components/flashcards.tsx` (FlipCard, FlashDeck, Study, DeckList, DeckEditor, SharedDeck), `app/(app)/flashcards/*`, `app/f/[code]`. The chat auto-save is in the `app-shell.tsx` "cards" event handler.
- **Widgets:**
  - Registry: `lib/home.ts` (`WIDGETS` with `pro`/`fun`, `isProWidget`, `isFunWidget`).
  - Rendering: the `render` map in `components/dashboard.tsx`, the `Locked` wrapper, and the library (`CELL`, `FRAME`, `demo` presets).
  - New widgets: `pro-widgets.tsx` (roll, plant, glass) and `study-widgets.tsx` (three, sounds, breathe, note, buddy, `useStored`).
- **Pricing:** `app/landing/pricing.tsx` (`PRO`, `FREE_LIST`/`PAID` built from `WIDGETS` and `FREE`).
- **Making a user Pro by hand:** `insert into plans (user_id) values ('<uuid>');`

## Important Constraints

- **Ask before:** adding a dependency, writing a migration, removing a feature, or changing focus-timer behavior, chat storage, Supabase/env/API routes/auth or billing.
- **Migrations:** give the SQL to paste, and **always also a `create or replace` / delta version**.
- Never write to Supabase or enter passwords.
- **Commits:** commit and push every important change to `main`; run tsc, lint and tests first; say "untested" when true.
- **Preview pages:** `src/app/login/*-preview/` are untracked and must never be committed. `dash-preview` has `?v=pro` and `?v=free` variants.
- **Communication:** terse; give copy-paste commands.

## Next Recommended Task

**Confirm the migrations, then Phase 10 step 2: security pass.**
- **Goal:** every table (including `decks`, `plans` and the new functions) has correct RLS; CSP ships in report-only mode; dependency-audit findings are triaged; the user has a secret-rotation checklist.
- **Done when:** an RLS report exists (fixes proposed as a migration, with approval), CSP is live in report-only with no violations on landing, chat, settings and `/f`, and the audit is clean or documented.

## Tomorrow / New-Session Startup Prompt

"do resume protocol"
