# Project Handoff

> Updated 2026-09-25, through commit `b40cf3f`. The code wins over this file if they disagree. Phase status lives in `docs/ROADMAP.md`. Code structure: ask Graphify (`graphify-out/`), not this file.

## Project Summary

**Sonnet** is a student hub: courses, deadlines, calendar, materials, grades, a focus timer and an AI assistant in one **minimal** app. Built by one college student (vibecoding on Windows). Live at `https://www.ericwei.me`. Sign-up exists, so it's multi-user (RLS scopes everything per user).

- **Stack:** Next.js 16 App Router, Supabase (Postgres + RLS, Auth, Storage), Vercel (Hobby), OpenRouter (free models by default).
- **Direction:** Phases 0–8 done; Phase 9 (polish + real-use pass) in progress. SaaS extras (Stripe, landing page) only when the user asks.

## Current State

Works (see ROADMAP for phases 0–8): login/sign-up/Google, onboarding + tour, Home widget grid, courses, work items, class times, calendar, Google Calendar feed, Canvas sync (token and/or ICS) with hourly catch-up on open, materials + syllabus summary/date import, grades + what-if, focus timer, assistant with confirm cards and web search.

**All migrations 0001–0013 are applied** (user confirmed). No pre-migration fallbacks remain in code.

The user ran the signed-in real-use pass on the live site (2026-09-25): everything works.

## Completed This Session

- **Production polish:** root metadata (`metadataBase`), login title/canonical/OG/Twitter, generated OG image (`app/opengraph-image.tsx`), `not-found.tsx`, `robots.ts` + `sitemap.ts` (only `/login` public; `(app)` layout is noindex). `proxy.ts` lets signed-out crawlers reach robots/sitemap/OG image.
- **Bundle:** `matter-js` (Reset button) and `react-markdown` load via `next/dynamic` → shared app JS 336 → 219 KB gzip.
- **Security pass (Semgrep, supply-chain, sharp-edges):** Canvas sync re-validates saved URLs (https) before fetching; paging refuses cross-origin `next` links (token never leaves the Canvas host); GCM `authTagLength: 16`; proxy public paths match exactly (`p` or `p/…`); cron secret uses `timingSafeEqual`. **Migration 0010:** trigger blocks non-service-role writes to `settings.canvas_*`; materials bucket drops SVG.
- **Assistant fixes:** statements with a clock time / repeating day ("my math is every day 1:30–2:20") count as change requests; a reply that opens as raw JSON is held back and retried; saved class cards don't warn about overlapping themselves.
- **Remove a day from the schedule (0011 `class_meetings.skip_dates`):** tool `remove_class_day` — no ref = every class that date ("no class Monday"), ref = one class. Hidden in calendar sessions, ICS feed (EXDATE), assistant context. Saved card has **Undo** (`setClassDayOff(ids, date, off)`).
- **Work view (0012 `items.submission_types`, `allowed_attempts`):** course page title click opens a large two-column dialog (`work-view.tsx`): due, points/score, submission, attempts, Canvas description, Mark as done/Undo (same `useWork` toggle), Open in Canvas, **Ask about this**. Descriptions render through `canvas-html.tsx` (browser `DOMParser` → allowlisted React elements, no new dep). `?item=<id>` on a course page opens it; item popovers' "Open assignment" link there. Home's widget still completes on click.
- **Slow tasks in the background:** `useTasks()` (`components/tasks.tsx`) shows Sonner custom toasts (bottom middle): running → done (click opens result) / failed. Used by syllabus summary (`?summary=1`), syllabus dates (`?dates=<file>`, in-flight read cached per file), Canvas sync, uploads. These calls go through **`/api/tasks`** (`slow()`), not Server Actions.
- **Ask about this (0013 `chats.item_id`):** chat attached to one assignment: chip in the shared chat input (panel and `/chat`), opens `/chat`; server adds `itemContext()` (all fields, description as text capped at 6k chars inside `<<<DESCRIPTION … DESCRIPTION>>>`, missing fields "not in Sonnet") on every message; canned due-lists skipped; reopening returns to that item's newest chat; × detaches; switching course detaches. Syllabus "Ask about it" attaches a **syllabus chip** (not persisted).
- **Assistant scope:** general help (code, writing, math, anything) with basic refusals (weapons, malware, hurting someone, minors, serious crime; self-harm → 988). max_tokens 3000/4000; history keeps 16k chars per answer. Pure small talk (`smallTalk()`) skips course data; the "Reading your courses" step now comes from the server (`{t:"read"}`) only when it really loaded them.
- **UI:** docked chat input stacks (text full width, buttons below) via container query; descriptions 15px.
- **Cleanups (chisle/ponytail audits):** term week from `termGlance` everywhere, `addDays` for day ranges, unused exports/variants/props removed, all migration fallbacks removed.

## Important Decisions

Do not reverse these casually.

- **Changes need approval:** the AI never saves without a confirm card. Model choice is config (`AI_MODEL`, `AI_VISION_MODEL`); free models by default.
- **Slow work uses `/api/tasks`, not Server Actions:** Next runs Server Actions one at a time per tab, so a minute-long syllabus read would block check-offs. Add new slow server calls to the `TASKS` map in `app/api/tasks/route.ts` and call them with `slow()`; wrap in `useTasks()` for the toast. The tray refreshes the router when a task settles.
- **Task cards are Sonner toasts** (bottom middle, user's choice), not a separate tray.
- **Canvas HTML is never injected:** `canvas-html.tsx` copies allowlisted tags only; links http(s)/mailto, new tab; failed images become links. Don't switch to `dangerouslySetInnerHTML`.
- **Assignment context is fenced** as untrusted data; keep the markers and the 6k cap (free models choke on long prompts).
- **Chips:** assignment chip = persisted link (`chats.item_id`); syllabus chip = the course focus made visible (removing it drops the focus). One chip markup in `chat-input.tsx` serves both.
- **Honest UI:** real data or a clear empty/"not in Sonnet" state; ICS-only items say details need a Canvas token; no fake progress percentages.
- **Home grid, focus timer, visual language, Vercel Hobby, kept-on-purpose code** (`evil-buttons/`, `spring.ts`): unchanged from before; see ROADMAP/PRODUCT.
- **`cn` package stays** (it is clsx + tailwind-merge in one dep).

## In Progress / Unfinished Work

Nothing half-built. Follow-ups:
- **Google sign-in** still needs the Google provider in Supabase + OAuth client + redirect URLs (`https://www.ericwei.me/auth/confirm`, `http://localhost:3000/auth/confirm`).
- **Syllabus chip isn't saved** with the chat (reopened chat keeps focus, not chip). Persisting it needs a migration; user hasn't asked.
- Unscheduled ideas: after-class check-in, "start by" planning, crunch forecast, Sunday reset (ROADMAP).

## Known Bugs / Issues

Confirmed:
- Free AI models are unreliable (429/503); Nemotron slow on long answers.
- On `/chat`, a task toast (bottom middle) can cover the centered composer until it clears.
- Canvas URL checks are https-only; an https URL pointing at a private IP isn't blocked (low risk on Vercel).
- Local `next build` fails on the untracked `src/app/login/cal-preview` type error (missing `canvas` field); move the `*-preview` folders aside to build.
- Grid widgets never auto-shrink on small screens; tour flag is per browser; a failed layout save keeps the unsaved layout until reload; magic link works only in the same browser.
- `graphify update .` can segfault; the git hook's background rebuild still runs.

## Current Priorities

1. Polish Calendar and Courses list pages (next task below).

## Important Constraints / User Intent

- **Workflow:** commit and push every important change straight to `main`; say "needs migration N" / "untested" in messages. Per `CLAUDE.md`: Graphify first, minimal reads, terse chat, one fresh reviewer sub-agent after normal feature work (skip for tiny changes). Ponytail/Chisle: reuse code and deps, no speculative abstractions, one small test for non-trivial logic.
- **Ask before:** adding a dependency, writing a migration, removing a feature, changing focus-timer behavior, changing how chats are stored.
- **Migrations:** the user pastes SQL into Supabase; new code must work before its migration runs, and the fallback is removed once the user confirms it ran.
- **Secrets** only in `.env.local`/Vercel. **Next 16:** `src/proxy.ts` is middleware; pages call `requireUser()`; read `node_modules/next/dist/docs/` for unfamiliar APIs.
- **Local preview pages** `src/app/login/*-preview/` are untracked (`.git/info/exclude`); never commit. `course-preview` was given a schedule item locally for chip testing.
- **Windows editing gotchas:** Python edit scripts must preserve line endings (read/write bytes or `newline=''`) and use raw strings for regex/`\n`; `src/app/(app)/page.tsx` is CRLF; never run Prettier on whole existing files (only on new files, `--print-width 120`).
- **User wants:** minimal UI, visible but calm animation, big readable assignment view, chat that answers anything, nothing claimed that didn't happen.

## Testing / Validation Status

- **Automated:** `npm test` 45 passing (incl. `itemContext`, `smallTalk`, remove-class-day proposals, Canvas mapping + cross-origin paging). `npx tsc --noEmit` clean except local `cal-preview`. `npm run lint` clean. `npm audit` 0 vulnerabilities; Semgrep 1 finding (fixed).
- **Preview-verified (signed out, local):** work view open/close/size (desktop 1600/2560, phone), task toast error state and position, docked chat input stacking, Ask-about-this chip + starters + ×, Reset button lazy load, OG/robots/sitemap routes.
- **Signed in (live, 2026-09-25):** user confirmed all flows work.
- **Preview gotcha:** hidden pane freezes animations; stale HMR errors linger in the console after fixes.

## Relevant Architecture Context

- **Chat:** `AppShell` holds the one conversation (messages, focus, `itemId`, `syllabus`) shared by `ChatPanel` and `ChatPage`; `send()` posts `{focus, item, syllabus}` to `/api/chat` → `smallTalk ? lightContext : studentContext(…)` → `streamReply` (NDJSON events incl. `read`). Saved via `saveChat` (`chats.item_id`).
- **Work items:** `courses.tsx` owns `useWork` + `WorkView`; `UpNext` gets `onOpen` only there (Home has none).
- **Slow tasks:** `components/tasks.tsx` (`useTasks`, `slow`) ↔ `app/api/tasks/route.ts`.
- **Useful queries:**
  - `graphify query "How does Ask about this attach an assignment to the chat and reach the model?"`
  - `graphify query "How do slow tasks run through /api/tasks and show status toasts?"`
  - `graphify query "Where does Canvas sync write items and assignment details?"`
  - `graphify explain "WorkView"`

## Next Recommended Task

**Polish Calendar and Courses list pages** (Impeccable for the pass; keep the minimal visual language).

## Suggested New-Session Prompt

"Read `CLAUDE.md` and `HANDOFF.md`. Use Graphify before broad source exploration and read only the minimum relevant files. If the handoff conflicts with the code, trust the code and note what's stale. Then continue with the Next Recommended Task."
