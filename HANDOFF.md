# Project Handoff

> Updated 2026-09-25, through commit `e2a430e`. The code wins over this file if they disagree. Phase status: `docs/ROADMAP.md` (its Phase 9 "term" line is stale: that's done). Product truth: `PRODUCT.md`. Code structure: ask Graphify (`graphify-out/`).

## Project Summary

**Sonnet** is a student hub: courses, deadlines, calendar, materials, grades, a focus timer and an AI assistant in one **minimal** app. Built by one college student (vibecoding on Windows). Live at `https://www.ericwei.me`, multi-user (RLS per user).

- **Stack:** Next.js 16 App Router, Supabase (Postgres + RLS, Auth, Storage), Vercel (Hobby), OpenRouter (free models), Recharts via vendored EvilCharts.
- **Direction:** Phases 0–8 done; **Phase 9 = polish and real use** (in progress). The user does **not** want new features right now; they explicitly pushed back on feature ideas. SaaS (paid plans, landing page) is planned but undecided; don't build it unasked.

## Current State

Everything works on the live site (user's signed-in check, 2026-09-25): auth, onboarding + tour, Home widget grid (32 widgets, library with real/sample previews), courses, work items, class times, calendar, Google Calendar feed, Canvas sync, materials + syllabus import, grades + what-if, focus timer, assistant (confirm cards, web search, Ask about this), task toasts via `/api/tasks`. Migrations 0001–0013 applied.

**New visual identity shipped this session:** "Paper & Ink" palette + IBM Plex type (live on `main`). User confirmed signed in on the live site (2026-09-25): everything works.

## Completed This Session

- **Audit fixes (Impeccable audit + critique, dual sub-agent):** Home stacks to one column when content width < 960px (`snap-grid.tsx` `STACK`), because the 12-col grid shrank widgets unreadably at ~800px. Home header shows "● N overdue" first, heavier, in red. Phone targets ≥44px (sidebar/focus buttons, calendar arrows, "← courses", "Create an account"). Home `main` has `md:pb-20` so the floating Ask button doesn't cover the bottom-right widget. Course page: percent only shows once something is due by Sunday (0 of 0 isn't "100%"); a course with only done work says "All done for X. Nice."
- **Chat toasts:** on `/chat`, Sonner toasts sit 10rem up (CSS `body:has(main[data-chat])` in `globals.css`) so they no longer cover the composer.
- **`PRODUCT.md` refreshed** (Impeccable init): platform web, positioning, shipped capabilities, SaaS = planned/undecided, no fabricated evidence. `.impeccable/config.json` = `buildPath: code`.
- **Paper & Ink palette** (user-approved spec, applied exactly; fixes Impeccable "AI cyan" finding):
  - Tokens in `globals.css`: warm paper light / ink-navy dark surfaces; ink-blue `--primary` (= `--brand`, "you, now" + the one primary action); new `--warning` (marigold text), `--warning-fill`, `--highlight` (selection); `--done`, `--destructive` retuned; `--chart-1` = primary, `--chart-2` = done.
  - Status mapping: done → green, today/tmrw → marigold (`when()` in `up-next.tsx` got a `soon` flag), late → vermilion, otherwise muted. Late weeks in "on time" widget → destructive.
  - Selected nav: ink icon on `primary/12` pill (`/18` dark), no side stripe.
  - Focus: base rule on `[class*="focus-visible:ring"]:focus-visible` adds a 2px background-colored gap to every existing ring; shadcn button/checkbox rings now `ring-2 ring-ring`.
  - Links: `@utility link` (ink, 1px underline at 30%, 3px offset, solid on hover) on all inline text links.
  - Charts: flat fills, no gradients (Done vs due `variant="solid"`; vendored radar fill edited to flat 0.3).
  - Course hues now `75,125,185,215,290,320,350,45` (`lib/course.ts`).
- **IBM Plex fonts** (replaced Geist, Impeccable "overused font"): Plex Sans body, Plex Serif as `--font-heading` (only dialog titles use it), Plex Mono for all readouts. Changed only `layout.tsx` + font tokens.
- **Impeccable mechanical fixes:** "Email me a link instead" button `py-3` (cramped padding); sidebar's top button group animates `grid-template-rows` instead of `height` (same 200ms ease-out, verified interpolation).
- **Contrast fix:** Today's classes blocks use solid black on course color (≥4.9:1 light, ≥9.2:1 dark).
- **Themed scrollbars:** one base rule: thin, muted-ink thumb (`color-mix(muted-foreground 40%)`), no track, on every scroller (widget library, calendar, chat, page). Widget-internal lists keep their fainter `--border` thumb.

## Important Decisions

Do not reverse these casually.

- **Palette = Paper & Ink.** Color may only mean: you/now (primary), a course, a status, the one primary action. Everything else stays neutral. Marigold as text only via `--warning`; bright marigold is fill only. No chart gradients.
- **Token aliases live in `:root` only** (`--brand`, `--chart-1/2`, `--sidebar-*`, `--warning-fill`): next-themes puts `.dark` on `<html>`, so they resolve against dark values. Don't re-add them to `.dark`.
- **"Due soon" = today/tmrw buckets** of the existing `when()` (≈36h by its rounding), not a new 48h rule, so a "2d" label never has two colors. User was told; change only if asked.
- **Existing courses keep their stored hues**; only new courses and the picker use the new list. Saving settings still works (no radio checked → no hue sent).
- **Fonts:** Plex Mono stays for readouts (instrument-dial brand). Serif only via `--font-heading`.
- **Sonner's toast height transition is left alone** (library behavior; overriding changes stacking).
- **Build path code-first**; design authority = `PRODUCT.md` + this palette (no `DESIGN.md` yet).
- **Changes need approval:** AI never saves without a confirm card. Models are config (`AI_MODEL`, `AI_VISION_MODEL`).
- **Slow work uses `/api/tasks`, not Server Actions** (they serialize per tab). New slow calls go in `TASKS` in `app/api/tasks/route.ts` with `slow()` / `useTasks()`.
- **Canvas HTML never injected** (`canvas-html.tsx` allowlist; no `dangerouslySetInnerHTML`). **Assignment context fenced** as untrusted, 6k cap.
- **Honest UI:** real data or a clear empty state; the only exception is the widget library's labeled "sample" previews. **Empty states must carry `data-empty`** or previews won't fall back.
- **EvilCharts config keys become CSS variable names** → keep them CSS-safe (Grade rings uses `c0…`).
- **Chart widgets stay lazy** (`next/dynamic`); hand-drawn SVG widgets in `chart-widgets.tsx` stay as-is (user choice).
- **Work mix kinds are neutral:** exam = ink 80%, quiz = ink 30% (`evil-widgets.tsx`), user choice. **Kept on purpose:** `evil-buttons/`, `spring.ts`, `cn`.

## In Progress / Unfinished Work

Nothing half-built. Open decisions/follow-ups:
- **Course faces** (`course-card.tsx`) keep their own light gradient with near-black ink (compliant, but a gradient; Impeccable flags cyan/purple "gradient backgrounds" on preview pages with hues 185/215/290).
- Later/ask first: grade goals (migration), Google sign-in setup (Supabase provider + OAuth + redirect URLs), saving the syllabus chip (migration). A `DESIGN.md` via `/impeccable document` would help before any SaaS landing page.

## Known Bugs / Issues

Confirmed:
- Impeccable still reports `layout-transition` from Sonner's `[data-sonner-toast]` CSS (intentional, see decisions).
- Light `--warning-fill` is 2.28:1 on card, fails 3:1 if ever used alone as a UI indicator (currently unused).
- Local `next build` fails on the **untracked** `login/course-preview` (`useSearchParams` without Suspense). Tracked code builds; to verify locally, temporarily rename it `_course-preview`.
- Hydration mismatch in dev on pages with the docked chat panel: BorderBeam size differs server vs client (viewport-dependent, not color-related). Plus the known harmless `next-themes` script warning.
- The running dev server keeps stale Tailwind classes (e.g. old `transition-[height]`) until restarted; production CSS is clean.
- Free AI models unreliable (429/503). Canvas https URL to a private IP not blocked (low risk). Short laptops (~750px tall) get small Home cells; tour flag per browser; failed layout save keeps unsaved layout until reload; magic link same-browser only. Courses widget at 2×2 is tiny (accepted).
- Safari only partly supports the scrollbar styling.
- `graphify update .` can segfault; the git hook's background rebuild still runs.

## Current Priorities

1. Further Phase 9 polish the user points at (they review screenshots and ask for specific fixes).

## Important Constraints / User Intent

- **Phase 9 is polish, not features.** Don't propose new features unless asked.
- **Workflow:** commit and push every important change straight to `main` (goes live via Vercel). Run tests/lint before committing (separate commands). Say "untested" / "needs migration N" when true. Per `CLAUDE.md`: Graphify first, minimal reads, terse chat, one fresh reviewer sub-agent for normal feature work (skip tiny ones), Ponytail/Chisle: no speculative abstractions.
- **Ask before:** adding a dependency, writing a migration, removing a feature, changing focus-timer behavior, changing chat storage, touching Supabase/env/API routes/auth.
- **Design specs the user approves are authoritative**: apply exactly; report conflicts instead of "improving" them.
- **Migrations:** the user pastes SQL into Supabase; code must work before a migration runs.
- **Local preview pages** `src/app/login/*-preview/` are untracked (`.git/info/exclude`); never commit. `dash-preview` (`?s=`, `&t=`, `?v=courses`), `cal-preview?show=calendar`, `course-preview`, `settings-preview`.
- **Windows:** Python edit scripts preserve line endings (bytes); some files are CRLF; never Prettier whole files; vitest can't resolve `@/` in `lib/*`. No Chrome; use Edge (`IMPECCABLE_BROWSER="C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"`) for detector URL scans.
- **User wants:** minimal, calm, readable UI ("Moleskine not SaaS"), visible but calm motion, nothing claimed that didn't happen.

## Testing / Validation Status

- **Automated:** `npm test` 48 passing; `npx tsc --noEmit` clean; `npm run lint` clean; `npm run build` passes (with the untracked course-preview excluded).
- **Impeccable detector** (bundled CLI, Edge, production build on :3100): only the Sonner `layout-transition` remains. Contrast computed for all token pairs (text ≥5.0:1, focus ring ≥5.5:1, nav icon ≥5.9:1).
- **Preview-verified locally (signed out, sample data):** palette light/dark, focus-ring gap, Plex loading, Home stacking at 900px, overdue header, course-page wording, sidebar grid-rows transition (interpolates 132→40px, 200ms ease-out), scrollbars.
- **Signed-in live check:** user confirmed everything works (2026-09-25). Not verified: Safari.
- **Preview gotcha:** a hidden browser pane throttles rAF and freezes animations; wait ~8s for intro animations.

## Relevant Architecture Context

- **Theme:** all color/font tokens + base rules (focus gap, selection, scrollbars, `link` utility, chat toast offset) in `src/app/globals.css`; fonts loaded in `src/app/layout.tsx`; course colors `lib/course.ts` (`courseColor` uses `--course-l/--course-c`).
- **Home:** `dashboard.tsx` (widgets via `render(data)`, header), `snap-grid.tsx` (grid / stacked mode), `lib/home.ts`, widgets in `widgets.tsx`, `chart-widgets.tsx`, `evil-widgets.tsx`, `up-next.tsx` (status colors).
- **Shell:** `sidebar.tsx` (nav, selected state), `app-shell.tsx` (floating Ask button).
- **Queries:** `graphify query "Where are theme tokens and status colors used?"`, `graphify query "How does the Home snap grid lay out widgets?"`, `graphify query "How does the widget library fall back to sample data?"`.

## Next Recommended Task

**Signed-in visual check of the new look on the live site.**
- **Goal:** with the user signed in (Claude never enters passwords), walk Home, Calendar, Courses, a course page, Chat and Settings in light and dark mode. Confirm the ink/paper colors, status colors (done/soon/late), selected nav pill, focus rings, links, Plex fonts, scrollbars, and that the chat toast sits above the composer.
- **Why next:** everything this session was verified only locally with sample data.
- **Done when:** each page is confirmed or its issue is fixed and pushed, and the Testing section here is updated.

## Suggested New-Session Prompt

"Read `CLAUDE.md` and `HANDOFF.md`. Use Graphify before broad source exploration and read only the minimum relevant files. If the handoff conflicts with the code, trust the code and tell me what's stale. Then continue with the Next Recommended Task."
