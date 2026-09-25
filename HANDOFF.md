# Project Handoff

> Updated 2026-09-25, through commit `5841c8b`. The code wins over this file if they disagree. Phase status lives in `docs/ROADMAP.md`. Code structure: ask Graphify (`graphify-out/`), not this file.

## Project Summary

**Sonnet** is a student hub: courses, deadlines, calendar, materials, grades, a focus timer and an AI assistant in one **minimal** app. Built by one college student (vibecoding on Windows). Live at `https://www.ericwei.me`. Multi-user (RLS scopes everything per user).

- **Stack:** Next.js 16 App Router, Supabase (Postgres + RLS, Auth, Storage), Vercel (Hobby), OpenRouter (free models by default), Recharts (via EvilCharts) for some Home widgets.
- **Direction:** Phases 0–8 done; Phase 9 (polish + real use) in progress. SaaS extras (Stripe, landing page) only when the user asks.

## Current State

Works: login/sign-up, onboarding + tour, Home widget grid (32 widgets), courses, work items + work view, class times (incl. single-day removal), calendar, Google Calendar feed, Canvas sync (token and/or ICS), materials + syllabus summary/date import, grades + what-if, focus timer, assistant (confirm cards, web search, Ask about this, general help), background task toasts via `/api/tasks`.

**Migrations 0001–0013 all applied**; no pre-migration fallbacks remain. The user ran a signed-in real-use pass of all earlier features on the live site (2026-09-25): everything works.

## Completed This Session

- **Paper & Ink palette + IBM Plex (2026-09-25):** tokens in `globals.css` (warm paper / ink-navy surfaces, ink-blue `--primary` = `--brand`, new `--warning`, `--warning-fill`, `--highlight`); course hues `75,125,185,215,290,320,350,45`; selected nav = ink icon on `primary/12` pill; focus rings get a 2px background gap (base rule on `[class*="focus-visible:ring"]`); `link` utility for text links; status colors done=green, today/tmrw=marigold, late=vermilion, else muted; charts flat (no gradients). Fonts: IBM Plex Sans (body), Plex Serif (`--font-heading`, dialog titles), Plex Mono (readouts). Impeccable findings fixed: cyan palette, overused Geist, cramped padding (magic-link button `py-3`), sidebar height transition → `grid-template-rows`.
- **Audit batch:** Home stacks below 960px, overdue leads the header, 44px phone targets, Ask-button lane, honest course summary; chat toasts lifted above the composer.

- **"Term" wording:** every user-visible "semester" → "term" (Settings section/toasts, Home nudge, calendar rail, sync window, action errors, proposal card). Code identifiers (`"semester"` settings section, `set_semester` tool), model-facing prompt text, and onboarding's Semester/Quarter choice deliberately unchanged.
- **Four EvilCharts widgets** (user-approved new dep `recharts`): Workload radar (open work ahead per course, needs ≥3 courses), Grade rings (radial per graded course, capped at 100%, own legend list), Done vs due (per term week so far, DST-safe bucketing), Work mix (open work by kind). Code: `components/evil-widgets.tsx`, data helpers `lib/charts.ts` (+ test). Vendored registry code in `components/evilcharts/` (registry `@evilcharts` in `components.json`); two local edits there: legend `flex-wrap`, removed unused import. Loaded with `next/dynamic` so Recharts only ships when one is on the grid.
- **Widget library previews** (Edit → Add widget): previews get a fixed-height frame so charts draw; if a widget's real render hits its empty state, a second render from `lib/sample.ts` shows instead with a "sample" badge. Mechanism: the widget map is now `render(data)` in `dashboard.tsx`; empty states carry a `data-empty` attribute; CSS `peer-has-data-empty` swaps. Sample data has its own term (5 weeks in) so week charts work even in a real first week. Never shown on Home itself.
- **Courses widget resizable to 2×2** (was 3×3 min). Root fix in `components/fit.tsx`: its grid track is now `minmax(0,1fr)` so oversized content is centered and scaled down instead of hanging from the top and clipping. Applies to every `Fit` user.
- **Polish:** Courses list is 2 columns on phones (smaller padding/number in `CourseFace`, also affects Home's carousel cards on phones); calendar toolbar's view switch + Add span the row when it wraps on phones.
- **Small fixes:** Ask-about chips keyed by index (two same-titled exams collided); untracked `cal-preview` fixed (added `canvas` field, `?show=calendar` renders the calendar) so local `next build` no longer fails.

## Important Decisions

Do not reverse these casually.

- **Palette is "Paper & Ink"** (user-approved; spec in this session). Color may only mean you/now, a course, a status, or the one primary action. Aliases (`--brand`, `--chart-1/2`, `--sidebar-*`, `--warning-fill`) live in `:root` only (`.dark` is on `<html>`). Existing courses keep their old stored hues; only new courses/the picker use the new list.
- **Build path:** code-first (`.impeccable/config.json`). `PRODUCT.md` refreshed (platform, positioning, SaaS planned-undecided).

- **Changes need approval:** the AI never saves without a confirm card. Model choice is config (`AI_MODEL`, `AI_VISION_MODEL`); free models by default.
- **Slow work uses `/api/tasks`, not Server Actions** (Server Actions run one at a time per tab and would block check-offs). New slow calls go in the `TASKS` map in `app/api/tasks/route.ts`, called with `slow()`, wrapped in `useTasks()`. Task cards are Sonner toasts, bottom middle.
- **Canvas HTML is never injected:** `canvas-html.tsx` copies allowlisted tags only. No `dangerouslySetInnerHTML`.
- **Assignment context is fenced** as untrusted data with a 6k cap (free models choke on long prompts).
- **Chips:** assignment chip = persisted `chats.item_id`; syllabus chip = visible course focus (not persisted).
- **Honest UI:** real data or a clear empty state; no fake numbers. The **only** exception is the widget library's labeled "sample" previews.
- **Empty states must carry `data-empty`** or the library preview won't fall back to sample data.
- **EvilCharts config keys become CSS variable names:** keep them CSS-safe (course codes have spaces → Grade rings keys `c0…`, label from config). Keying by course code broke colors and caused duplicate-key warnings.
- **Chart widgets stay lazy** (`next/dynamic` in `dashboard.tsx`); existing hand-drawn SVG widgets in `chart-widgets.tsx` were deliberately left as-is (user choice).
- **Kept-on-purpose code:** `evil-buttons/`, `spring.ts`; `cn` package stays (clsx + tailwind-merge).

## In Progress / Unfinished Work

Nothing half-built. Follow-ups:
- **Grade goals** don't exist; Grade rings shows current grade only. A goal per course needs a migration (ask first).
- **Google sign-in** needs the Google provider in Supabase + OAuth client + redirect URLs (`https://www.ericwei.me/auth/confirm`, `http://localhost:3000/auth/confirm`).
- **Syllabus chip isn't saved** with the chat (needs a migration; user hasn't asked).
- Unscheduled ideas: after-class check-in, "start by" planning, crunch forecast, Sunday reset (ROADMAP).

## Known Bugs / Issues

Confirmed:
- Impeccable still flags `layout-transition` from Sonner's own toast CSS (`[data-sonner-toast]` transitions height); left alone (library behavior).
- Contrast: `widgets.tsx:105-106` class blocks (`text-black/80` and `/60` on course color) fall below 4.5:1 in light mode on some hues (pre-existing); light `--warning-fill` is 2.28:1 on card (unused so far). Work mix exam/quiz colors are hard-coded kind colors with no approved token.
- Local `next build` fails on the untracked `login/course-preview` (useSearchParams without Suspense); tracked code builds.
- Free AI models are unreliable (429/503); Nemotron slow on long answers.
- Canvas URL checks are https-only; an https URL to a private IP isn't blocked (low risk on Vercel).
- Home stacks into one column below 960px of content width; on short laptops (≈750px tall) grid cells get small; tour flag is per browser; a failed layout save keeps the unsaved layout until reload; magic link works only in the same browser.
- Courses widget at 2×2 works but cards are very small (the carousel stage 360×340 includes air); acceptable per request.
- Dev-only console warning from `next-themes` ("script tag while rendering") — pre-existing, harmless.
- `graphify update .` can segfault; the git hook's background rebuild still runs.

## Current Priorities

1. Pick from ROADMAP's unscheduled ideas with the user.

## Important Constraints / User Intent

- **Workflow:** commit and push every important change straight to `main`; say "needs migration N" / "untested" in messages. Per `CLAUDE.md`: Graphify first, minimal reads, terse chat, one fresh reviewer sub-agent after normal feature work (skip for tiny ones). Ponytail/Chisle: reuse code/deps, no speculative abstractions, one small test for non-trivial logic. **Run tests before committing** (don't chain commit after tests with `;`).
- **Ask before:** adding a dependency, writing a migration, removing a feature, changing focus-timer behavior, changing how chats are stored.
- **Migrations:** the user pastes SQL into Supabase; new code must work before its migration runs.
- **Secrets** only in `.env.local`/Vercel. **Next 16:** `src/proxy.ts` is middleware; pages call `requireUser()`; read `node_modules/next/dist/docs/` for unfamiliar APIs.
- **Local preview pages** `src/app/login/*-preview/` are untracked (`.git/info/exclude`); never commit. `dash-preview` (`?s=`, `&t=<week>`, `?v=courses` for the Courses grid; its `layout=` prop is edited ad hoc for testing), `cal-preview?show=calendar`.
- **Windows gotchas:** Python edit scripts must preserve line endings (bytes) and use raw strings; `src/app/(app)/page.tsx` is CRLF; never Prettier whole existing files; vitest doesn't resolve `@/` in `lib/*` — use relative imports there.
- **User wants:** minimal UI, visible but calm animation, big readable views, widgets that explain themselves before being added, chat that answers anything, nothing claimed that didn't happen.

## Testing / Validation Status

- **Automated:** `npm test` 48 passing (incl. `charts.test.ts`, `sample.test.ts`, updated `home.test.ts`). `npx tsc --noEmit` clean (incl. previews). `npm run lint` clean.
- **Preview-verified (signed out, local, sample data):** four EvilCharts widgets render (no console errors); library previews show real vs sample correctly (incl. week-1 term); Courses widget at 3×2 and 2×2 fits; Courses list on phone; calendar toolbar on phone; month/week views.
- **Reviewer sub-agents:** widgets + polish (findings fixed: DST bucketing, ring overflow); sample previews (no issues).
- **Signed-in check (user, live site, 2026-09-25):** new chart widgets on real data, light/dark, widget library previews, Courses at small sizes: all work.
- **Preview gotcha:** a hidden pane freezes animations (e.g. the view-switch pill looks stuck); page intro animation needs ~8s before measuring.

## Relevant Architecture Context

- **Home:** `dashboard.tsx` builds every widget via `render(data)` → `view` (real) and `sample` (library only); layout/sizes in `lib/home.ts` (`WIDGETS`, `readLayout`, `freeSpot`), grid in `snap-grid.tsx`. Widgets live in `widgets.tsx`, `chart-widgets.tsx`, `evil-widgets.tsx`, plus `progress-block`, `exam-ring`, `up-next`, `focus`. `Fit` scales fixed designs to their cell.
- **Chat / slow tasks / work view:** unchanged; see Graphify.
- **Useful queries:**
  - `graphify query "How does the Home widget library render previews and fall back to sample data?"`
  - `graphify explain "Fit"`
  - `graphify query "How do slow tasks run through /api/tasks and show status toasts?"`
  - `graphify query "How does Ask about this attach an assignment to the chat and reach the model?"`

## Next Recommended Task

**Pick the next feature with the user** from ROADMAP's unscheduled ideas (after-class check-in, "start by" planning, crunch forecast, Sunday reset) or the follow-ups above (grade goals needs a migration; ask first).

## Suggested New-Session Prompt

"Read `CLAUDE.md` and `HANDOFF.md`. Use Graphify before broad source exploration and read only the minimum relevant files. If the handoff conflicts with the code, trust the code and note what's stale. Then continue with the Next Recommended Task."
