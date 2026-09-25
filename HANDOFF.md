# Project Handoff

> Updated 2026-09-24, through commit `2d591e8`. The code wins over this file if they disagree. Phase status lives in `docs/ROADMAP.md`. Code structure: ask Graphify (`graphify-out/`), not this file.

## Project Summary

**Sonnet** is a student hub: courses, deadlines, calendar, materials, grades, a focus timer and an AI assistant in one **minimal** app. Built by one college student (vibecoding on Windows). Live at `https://www.ericwei.me`.

- **Stack:** Next.js 16 App Router, Supabase (Postgres + RLS, Auth, Storage), Vercel (Hobby plan), OpenRouter for AI.
- **Direction:** Phases 0–8 done. Phase 9 (polish + real-use pass) in progress. Sign-up now exists, so the app is effectively multi-user (RLS already scopes everything per user). The SaaS extras (Stripe, landing page, etc.) come later, only when the user asks.

## Current State

Works (see `docs/ROADMAP.md` for phases 0–8): login, courses, work items, class times, calendar, Google Calendar feed, Canvas sync, materials + syllabus import, assistant with confirm cards and web search, grades + what-if, global focus timer + heatmap.

New this session (all verified only in the signed-out preview):
- **Home** = a fixed 12×6 grid of square cells that fits the screen, 25 widgets, edit mode (drag anywhere, resize from the bottom-right corner, remove, widget library with live previews).
- **Course page**: What-if opens from a header button (popover); gear button opens **Course settings** (code, name, color, class times, delete). The page itself is just Work + Materials, full width.
- **Login page**: two panels, sign-up mode (`/login?mode=signup`), Continue with Google.
- **Onboarding**: floating 4-step window (Name, Term, Canvas, Done), then a one-time 5-slide feature **tour**.
- **Canvas catch-up sync** when the app opens and the last sync is > 1 hour old.

## Completed This Session

- **Home widget grid** (`src/lib/home.ts`, `src/components/snap-grid.tsx`, `dashboard.tsx`, `widgets.tsx`, `chart-widgets.tsx`, `fit.tsx`).
  - Layout = `{ id, x, y, w, h }` in cells on a 12×6 grid; cells stay square and size to the available space (no page scroll on desktop). Moves/resizes that overlap or leave the grid show red and spring back. New widgets take the first free spot (`freeSpot`), or toast "No room".
  - Saved to `settings.home_layout` (jsonb). `readLayout` validates and falls back to the default; it also accepts `{ widgets }` objects and maps the old `week` id to `calendar`. Older formats (two-column `{id,size}`, `{id,x,y,w}`) fall back to the default.
  - Phones (< 760px container): stacked list, remove only (arrange on a bigger screen).
  - **Zero dead space rule:** charts/heatmaps stretch (`flex-1`), lists spread (`justify-evenly`), fixed designs (exam ring, carousel, timer dial, streak, countdown, next class, calendar day view) are wrapped in `<Fit>`, which scales them to the space left. Grid widgets get tighter padding (`*:p-4!`).
  - **Calendar** widget is size-aware: 1 column wide = today, 1 row tall = this week (the old WeekStrip), bigger = month.
  - Up next scrolls only its list; header and footer stay visible.
  - New widgets: Focus timer (shares the global timer via `FocusDial`), Today's classes, Calendar, Due today, Streak (pulses while a session runs), Recent materials, Ask about…, Grade trend, Grade bars, Recent scores, Grade gaps, Exam countdowns, Course spotlight, Study hours, Workload, On-time rate, Time by course, Next deadline (live rolling digits), Week clear.
- **Grade history** (migration 0009): Canvas sync upserts one grade per course per day into `grade_history` (errors ignored, so sync works before the migration). Grade trend reads it; before 0009 the widget says so.
- **Course page** (`courses.tsx`): What-if popover, Course settings dialog incl. `ClassTimes`.
- **Login** (`src/app/login/*`): `google()` server action (Supabase OAuth → `/auth/confirm`, which already exchanges `code`), `signUp` action (name in user_metadata, confirmation email), pitch panel with honest copy (no fake stats).
- **Onboarding** (`onboarding.tsx`, replaced `TermSetup`): Name → Term (Quarter 11 weeks default / Semester 16, editable) → Canvas (address + token and/or ICS) → Done. Nothing saves until "Go to Home": name, then term (this is what swaps onboarding for Home), then Canvas connect + first sync reported via toasts. Not dismissible. Sets `localStorage["sonnet-tour"]`.
- **Tour** (`tour.tsx`): plays once on Home when that flag exists, then clears it. Drawn scenes, not screenshots.
- **Canvas catch-up** (`app-shell.tsx`): on app load, `syncCanvasNow()` if Canvas is configured, last sync > 1h and not `syncing`. Vercel cron stays daily (`vercel.json`, region `pdx1`).
- **Removed at the user's request:** customizable sidebar action buttons (and its Alt+T timer shortcut). Reverted in `37244f2`; don't bring back.

## Important Decisions

Do not reverse these casually.

- **Changes need approval:** the AI never saves without a confirm card.
- **Model choice is config** (`AI_MODEL`, `AI_VISION_MODEL`); free models by default, cost is the user's main concern.
- **Grades:** Canvas's computed score is the source of truth. What-if uses a single final weight.
- **Focus timer is global** (lives in `FocusProvider` in AppShell). Any timer UI must read that state; never a second timer. No course picker (so Time by course stays empty; that's honest).
- **Home grid:** fixed 12×6, square cells, bounded to the screen, snap both axes, corner resize, no overlaps, no page scroll. The user rejected: natural-height free placement, size chips, −/+ buttons, one-size-fits-all tiles with dead space. Widgets must fill their box at any size.
- **Honest UI:** real data or a clear empty state; no fake stats/testimonials (login pitch panel follows this).
- **Visual language:** metal only on AI elements, gooey only for menus/pickers, no gradient text/glassmorphism/bouncy easing (springs are critically damped), respect reduced motion, no course hues near red/green/cyan.
- **Onboarding & tour are floating windows** (user preference). Courses aren't asked in onboarding (Canvas brings them in).
- **Vercel Hobby:** crons are daily only; hourly freshness comes from the on-open catch-up sync.
- **Kept on purpose despite audits:** `evil-buttons/` Reset-all-data animation (`matter-js`), custom spring in `src/lib/spring.ts`.

## In Progress / Unfinished Work

Nothing is half-built. Follow-ups:
- **Migrations 0008 and 0009** exist in `supabase/migrations/`; the user applies them by pasting SQL. Until 0008, layout saves fail with a clear toast; until 0009, Grade trend shows its migration message.
- **Google sign-in** needs the Google provider enabled in Supabase + Google Cloud OAuth client + redirect URLs (`https://www.ericwei.me/auth/confirm`, `http://localhost:3000/auth/confirm`). Without it, the button lands on Supabase's "provider is not enabled" page.
- **"Semester" wording** remains in Settings and Home's semester-length nudge; onboarding says "term".
- Unscheduled ideas: after-class check-in, "start by" planning, crunch forecast, Sunday reset (see ROADMAP).

## Known Bugs / Issues

Confirmed:
- Free AI models are unreliable (429/503) and Nemotron is slow on long answers (mitigated by fallbacks).
- Magic-link sign-in only works in the same browser (PKCE); password/Google are primary.
- Dev-only next-themes "script tag" console warning. Harmless.
- `graphify update .` can segfault; the git hook's background rebuild still runs.
- Grid: widgets never auto-shrink when the screen gets small; content scrolls inside its widget instead.
- Tour flag is per browser (finishing onboarding on one device won't show the tour on another).
- If a layout save fails, the UI keeps the unsaved layout until reload.

Possible, not confirmed:
- Daily Canvas cron run hasn't been separately observed. Supabase Site URL/redirect config never verified.

## Current Priorities

1. **Production polish** (next task below).
2. **Real-use pass signed in**: run 0008/0009, test Home layout save, Canvas grades/scores, Grade trend after two syncs, sign-up → onboarding → tour, Google sign-in, focus sessions, web search, photo transcription, study-guide chips.
3. "Term" wording in Settings and Home's nudge.
4. Polish Calendar and Courses list pages.

## Important Constraints / User Intent

- **Workflow:** commit and push every important change straight to `main` (no branches); say "needs migration N" / "untested" in messages. Keep `docs/ROADMAP.md` current. Per `CLAUDE.md`: Graphify first, minimal reads, caveman-terse chat, one fresh reviewer sub-agent after normal feature work (skip for tiny changes). Ponytail/Chisle: reuse code and deps, no speculative abstractions, one small test for non-trivial logic.
- **Ask before:** adding a dependency, writing a migration, removing an existing feature, changing focus-timer behavior.
- **Migrations:** the user pastes SQL into Supabase; code must keep working before a migration runs.
- **Secrets:** `.env.local` and Vercel only; never print them or ask for keys in chat.
- **Next 16:** `src/proxy.ts` replaces middleware; every page calls `requireUser()`. Read `node_modules/next/dist/docs/` for unfamiliar APIs.
- **Local preview pages** `src/app/login/*-preview/` (incl. `onboard-preview`) are untracked via `.git/info/exclude`; never commit them. `cal-preview` has a known type error.
- **Windows gotchas:** heredocs in Git Bash sometimes fail to parse (write Python edit scripts to the scratchpad and run them); keep each file's line endings (`src/app/(app)/page.tsx` is CRLF); never run Prettier on whole files (~120-column style).
- **The user wants** visible, smooth, not busy animation; minimal UI; widgets that scale with no dead space.

## Testing / Validation Status

- **Automated:** `npm test` 42 passing (incl. `src/lib/home.test.ts` for layout read/fallback, `fits`, `freeSpot`). `npx tsc --noEmit` clean apart from local `cal-preview`. `npm run lint` clean.
- **Preview-verified (signed out):** grid move/resize/spring-back, all 26 widgets without overlap or overflow at 1600×1000, calendar size modes, Up next sticky header, library add, login + sign-up render, Google button reaching Supabase, onboarding steps, tour slides, course settings with class times.
- **Not tested signed in:** everything from this session (see priority 2). Canvas catch-up sync never observed live.
- **Preview gotcha:** when the pane is hidden, animations freeze (AnimatePresence steps look stuck, screenshots show stale frames). Screenshot again or read DOM values.

## Relevant Architecture Context

- **Home:** `(app)/page.tsx` loads settings (`select("*")`), materials, focus sessions, grade_history → `Dashboard` builds a `view` map of widget id → element → `SnapGrid` (layout math in `lib/home.ts`). `Fit` scales fixed designs.
- **Shell:** `AppShell` holds the assistant, dialogs, `FocusProvider`, and the Canvas catch-up effect; widgets reach the assistant via `useAssistant()` (incl. `show()`).
- **Auth/onboarding:** `login/actions.ts` (signIn, signUp, google) → `/auth/confirm`; `Dashboard` renders `Onboarding` when no term; `Tour` on Home.
- **Useful queries:**
  - `graphify query "How does the Home widget grid place, save and load widgets?"`
  - `graphify query "Where does Canvas sync write grades and grade history?"`
  - `graphify query "What renders the login, onboarding and tour flow?"`
  - `graphify explain "SnapGrid"`

## Next Recommended Task

**Production polish pass.**
- **Goal:** ship-ready basics for a public site: per-page titles and descriptions (Next Metadata API), Open Graph/Twitter image, favicon/app icons check, custom `not-found.tsx`, `robots.ts` and `sitemap.ts` (public pages only: `/login`), canonical URL, alt text audit, fix console errors, check bundle size and that production source maps / debug flags aren't exposed.
- **Why next:** sign-up made the site public; it's small, independent of the signed-in testing, and the user listed it as a goal. Use the `fixing-metadata` UI skill.
- **Done when:** metadata, OG image, 404, robots and sitemap are live; no console errors on public pages; typecheck/lint/tests pass; committed and pushed; ROADMAP updated.

## Suggested New-Session Prompt

"Read `CLAUDE.md` and `HANDOFF.md`. Use Graphify before broad source exploration and read only the minimum relevant files. If the handoff conflicts with the code, trust the code and note what's stale. Then continue with the Next Recommended Task: the production polish pass."
