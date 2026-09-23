# PROJECT HANDOFF

> Updated 2026-09-23 at HEAD `7eb1e4f` (46 commits). The first version of this file was written at `d765b6e`, before 19 more commits (Phase 4 and the "extras before Phase 5"); this version reflects them. Verified at update time: git clean and in sync with `origin/main`, `npm test` 13/13, `npx tsc --noEmit` clean, `npm run lint` clean. **The code wins over this document** if they disagree. For phase-by-phase status, `docs/ROADMAP.md` is the most current source.

---

## 1. Executive Summary

- **Project:** **Sonnet**. Repo `g5haco/sonnet` (private). Live at **https://www.ericwei.me** (Vercel, auto-deploys every push to `main`).
- **What it is:** a web app for a college student that puts a semester in one place: every assignment/exam/quiz/reading, class times, a calendar, how caught up you are, per-course pages with materials, and a **global AI assistant** that knows all of it, can change anything (after a confirm card), makes flashcards, and keeps a chat history.
- **Stage:** personal MVP in active development. **Phases 0–4 are done** (foundation, items & progress, app shell, AI assistant, calendar), plus extras the user asked for before Phase 5 (Courses pages, Chat page with history, course materials, floating Settings and uploader).
- **Who it's for now:** one user (the owner, a college student), daily use. Sign-ups closed.
- **Next:** **Phase 5: Canvas sync.**
- **Success for this stage:** the owner opens Sonnet daily instead of Canvas; every deadline and class is in it; the assistant is fast and correct.

## 2. Original Product Vision

**Problem:** students juggle 4–6 courses, each with a syllabus and Canvas page; existing tools each do one thing (StudyFetch = AI tutor, MyStudyLife = organizer, Motion = scheduler, BlockPlan = semester plan, DormWay = Canvas sync, Notion = DIY). The owner wants **one minimal, easy tool** with only the most important parts.

**LONG-TERM VISION:** Canvas sync (token + calendar feed), syllabus AI import, manual entry; unified to-do + calendar (classes, deadlines, exams) + Google Calendar feed; AI assistant (tutor, assignment summaries, exam study guides, planning, creates/edits things); materials hub (docs, slides, photos, notes, links; later audio/video/YouTube/lecture recording); grades + what-if; focus timer + study heatmap (light gamification only). **SaaS later** ("second step"): sign-up, landing page, Stripe, real email provider (Resend), Canvas OAuth developer key, two-way Google Calendar, auto time-blocking.

**Differentiator ideas (in `docs/ROADMAP.md`, not scheduled):** Sonnet knows the semester's *time* (classes + every deadline + progress): after-class check-ins that feed flashcards/study guides; "start by" planning into free gaps between classes (ghost blocks); crunch forecast from the heat map; a Sunday reset.

**CURRENT PERSONAL MVP:** single user, sign-ups closed, RLS on everything (so SaaS is additive later), free AI (OpenRouter free models), no payments/landing/email provider/Canvas OAuth. Don't pull SaaS requirements in unless the user asks.

## 3. Current Scope

**Done and in the app:** login; courses (tilt-card grid, a page per course: work, class times, materials, code/name/color, delete); items (add, check off, delete with undo, show done); class times; semester settings; Home (greeting with name, status line, progress, Up next, exam ring, week strip, courses carousel, grades/study placeholders, "semester looks wrong" nudge); Calendar (day/week/month, due rows, class grid, now-line, popovers, heat map rail, mini month, keyboard shortcuts, gooey view switch + Add); Google Calendar subscribe feed; global AI (side panel + full Chat page, same conversation) with Markdown rendering, live chips/cards, confirm cards for every change type, flashcards, course focus, saved chat history; floating Settings window; floating uploader + per-course materials (files to Supabase Storage, links, notes).

**Not built yet / deferred:** Canvas sync (Phase 5, next); AI reading materials + syllabus import + exam study guides (Phase 6 remainder); real grades (Phase 7); focus timer + heatmap data (Phase 8); polish/real-use pass (Phase 9); audio/video/YouTube, lecture recording, Quizlet (no API), two-way Google Calendar, auto time-blocking, XP/badges.

**Placeholders still in place:** Grades block ("with Canvas sync"), Study days ("with the focus timer").

## 4. User Preferences and Development Philosophy

- **Work in steps, keep the user updated, never one-shot.** Plan before big work; get approval on scope/design; report after each step in plain language (the user vibecodes everything and is on Windows).
- **Commit and push every important change to `main` immediately** (asked twice: "do this every time, don't forget"). Commit even if not fully testable, but say "untested" or "needs migration N" in the message. No long-lived branches. Keep **`docs/ROADMAP.md` current** and never drop original roadmap items.
- **Ponytail minimal code:** few files, no speculative abstractions, reuse installed deps, native features first, one small test for non-trivial logic; short "why" comments.
- **Design:** impeccable + ui-ux-pro-max + taste-skill (`design-taste-frontend`) together for UI; GSAP skills + Genjutsu (motion-principles, gsap, css-native) for animation; **shadcn + Kibo UI** before hand-rolling; Libraries.dev and Bencho components placed thoughtfully ("be smart, not mindless"). Minimal, not overwhelming; light gamification.
- **Honest UI:** never fake data or answers; placeholders say what's coming.
- **Free AI** (the user rejected a paid Anthropic key) but **fast**, with reasoning when it matters.
- **Secrets:** the user puts them in `.env.local`/Vercel/the app; never ask them to paste secret keys in chat.
- Give step-by-step dashboard instructions (Supabase, Vercel, IONOS, OpenRouter); ask for screenshots when a UI differs. The user applies migrations by pasting SQL into Supabase → SQL Editor.

## 5. Architecture Overview

- **Next.js 16 App Router** (TypeScript) on **Vercel**. **Supabase**: Postgres with RLS, Auth (email+password, magic-link fallback), **Storage** (private `materials` bucket).
- **Server components** load data per page; `(app)/layout.tsx` also loads what the shell needs (courses, schedule = items + class meetings, settings row, account) for the Create dialogs, AI cards and Settings window.
- **Server actions** (`src/app/actions.ts`) do all writes (validated, `revalidatePath("/", "layout")`).
- **Route handlers:** `POST /api/chat` (AI, NDJSON stream); `GET /api/cal/[token]` (ICS feed via the `calendar_feed(token)` security-definer SQL function; the proxy lets it through signed out).
- **Proxy** (`src/proxy.ts`, Next 16's renamed middleware): session refresh + redirect signed-out visitors to `/login`; every page also calls `requireUser()`.
- **Client state:** `AppShell` holds the one assistant conversation (shared by the side panel and `/chat` via `useAssistant()`), the Create/uploader/Settings windows, and exposes `useCreate()` and `useOpenSettings()`. A `useWork()` hook (check-off + delete with undo) is shared by Home and course pages. No global store library.
- No background jobs yet (Phase 5 plans Vercel Cron for daily Canvas sync).

```mermaid
graph TD
    Browser["Browser: React 19 client components (AppShell, pages)"] -->|server actions| Actions["src/app/actions.ts"]
    Browser -->|POST /api/chat NDJSON| Chat["src/app/api/chat/route.ts"]
    Browser -->|direct upload, signed URLs| Storage[("Supabase Storage: materials bucket")]
    Browser --> Proxy["src/proxy.ts"] --> Pages["(app) pages: server components + requireUser()"]
    Pages --> DB[("Supabase Postgres + Auth, RLS")]
    Actions --> DB
    Chat --> AI["src/lib/ai.ts: context, tools, streaming"] --> DB
    AI --> OR["OpenRouter free models (fallback chain)"]
    Google["Google Calendar (signed out)"] -->|GET /api/cal/token.ics| Feed["src/app/api/cal/[token]"] -->|calendar_feed(token)| DB
```

## 6. Technology Stack (installed and used)

| Tech | Version | Notes |
|---|---|---|
| Next.js | 16.3.6 | App Router, Turbopack. Breaking changes vs training data: read `node_modules/next/dist/docs/` (see `AGENTS.md`). Middleware = **Proxy**. Run `npx next typegen` after adding routes. |
| React | 19.2.8 | |
| TypeScript / Tailwind CSS | 5 / 4 | Tailwind v4 `@theme` tokens, container queries. |
| shadcn/ui (`base-nova`, Base UI primitives) | CLI 4.21 | button, checkbox, dialog, sonner. `dropdown-menu` was **removed** (unused). Uses the `cn` npm package. |
| Kibo UI | vendored | `theme-switcher` (Settings), `contribution-graph` (unused, reserved for Phase 8). `src/components/kibo-ui/**` is lint-ignored. |
| Supabase | supabase-js 2.117, ssr 0.12.7 | DB, auth (`getClaims()`), storage. |
| motion | 13.4.1 | Sidebar, sheets/windows, chat input, calendar page slides. |
| GSAP + @gsap/react | 3.15 / 2.1.2 | Number roll, week-cleared flash (`src/lib/gsap.ts`). |
| Libraries.dev | liquid-gooey 0.2.2, metal-fx 2.0.11, thinking-orbs 0.3.2, voice-glow 0.2.1, **border-beam 1.4.1** | Placement rules in §12. |
| Bencho components (user-supplied, MIT) | in repo | Tilt card (`tilt-card.tsx`), carousel (`carousel.tsx`), shared spring (`src/lib/spring.ts`). |
| react-markdown + remark-gfm | 10.1 / 4.0.1 | Chat answers render as Markdown with custom blocks (`src/components/chat/markdown.tsx`). |
| next-themes, sonner, lucide-react, date-fns | | Theme, toasts, icons (date-fns via Kibo). |
| Vitest | 5.0.1 | `npm test` (needs `@types/node@^24`). |

**Planned, not installed:** Vercel Cron (Phase 5), text extraction for materials (Phase 6).

## 7. Repository Map

```text
/
├── HANDOFF.md · AGENTS.md (Next 16 rules; CLAUDE.md includes it) · PRODUCT.md · README.md · .env.example
├── skills-lock.json, .claude/skills/handoff, .agents/skills/handoff   ← "handoff" skill (mattpocock/skills)
├── .claude/launch.json          ← preview server "dev" (npm run dev, port 3000)
├── .impeccable/critique/        ← saved impeccable critique snapshot
├── docs/ROADMAP.md              ← phase status (most current), extras, ideas, old→new phase map
├── docs/superpowers/specs/      ← v1 spec (Canvas design lives here), v1.5 spec (shell/AI/calendar/materials)
├── docs/superpowers/plans/      ← Phase 0 plan (historical)
├── supabase/migrations/0001–0004 ← schema (see §9)
└── src/
    ├── proxy.ts
    ├── app/
    │   ├── layout.tsx, globals.css, actions.ts
    │   ├── api/chat/route.ts     ← AI endpoint
    │   ├── api/cal/[token]/      ← ICS feed
    │   ├── login/, auth/confirm/
    │   └── (app)/  layout.tsx · page.tsx (Home) · calendar/ · chat/ · courses/ · courses/[id]/
    ├── components/
    │   ├── app-shell.tsx         ← shell, assistant state (useAssistant), Create/Settings/uploader windows
    │   ├── sidebar.tsx, gooey-menu.tsx (all liquid menus/pickers), create-forms.tsx, settings-forms.tsx (SettingsWindow)
    │   ├── dashboard.tsx, progress-block.tsx, up-next.tsx, exam-ring.tsx, week-strip.tsx, carousel.tsx
    │   ├── calendar.tsx, calendar-rail.tsx, item-details.tsx
    │   ├── courses.tsx, course-card.tsx, tilt-card.tsx, materials.tsx (course Materials block + UploadWindow)
    │   ├── block.tsx
    │   ├── chat/  chat-panel.tsx · chat-page.tsx · chat-input.tsx · markdown.tsx · widgets.tsx · proposal-card.tsx · shortcuts.ts
    │   └── ui/ (shadcn) · kibo-ui/ (vendored)
    └── lib/
        ├── ai.ts (+ ai.test.ts)             ← context, calendar/class grounding, tools, proposals, streaming, reasoning rule
        ├── calendar.ts (+ calendar.test.ts) ← calendar date math, toIcs()
        ├── progress.ts (+ progress.test.ts)
        ├── course.ts (hues, courseColor, meetingLabel, dayKey) · rows.ts (DB row → UI mapping) · spring.ts
        └── gsap.ts · utils.ts (cn, isShown) · supabase/{server,client}.ts (requireUser)
```

## 8. Important Files

| File | Purpose | Notes |
|---|---|---|
| `src/lib/ai.ts` | Whole AI layer | Provider config (`AI_BASE_URL`, `AI_MODEL` comma list → OpenRouter `models` fallback, `AI_API_KEY`); `TOOLS` (see §11); `calendarLines()` + class-week grounding; `studentContext()` → `{ text, refs }` where `Refs = { items, classes, courses }`; `needsThinking()`; `streamReply()` (NDJSON: `think`, `text`, `propose`, `cards`, `error`; 55s timeout; one silent retry; single read loop); `toProposal()` (tested). |
| `src/app/api/chat/route.ts` | AI endpoint | Auth; validates the last 12 turns, timezone, `think`, course `focus`. |
| `src/components/app-shell.tsx` | Shell + assistant | `send`, `clear`, `resolve` (applies confirmed proposals via `applyProposal`), chat save/load (`saveChat`/`loadChat`), Ctrl/⌘+K, panel docked ≥1280px / sheet below; hides the panel and Ask button on `/chat`. |
| `src/components/chat/proposal-card.tsx` | Confirm cards | One card per change type; week view with class-clash warning; exams without a time ask for one; destructive actions use a red button; `applyProposal()`. |
| `src/components/chat/markdown.tsx`, `widgets.tsx` | Answer rendering | Markdown, code blocks + Copy, `item:`/`class:` link chips, course-code auto-links, ```work and ```plan blocks as live cards, flashcard deck. |
| `src/components/chat/chat-page.tsx` | `/chat` | Course-focus gooey picker, idea chips, History (reopen/delete), border beam around the input. |
| `src/components/calendar.tsx`, `calendar-rail.tsx` | `/calendar` | Views, popovers, add from an empty slot, rail (mini month, heat map, class times, feed link). The URL keeps your place; T/D/W/M + arrow keys. |
| `src/app/actions.ts` | All writes | Term, courses, meetings (create/update/delete), feed reset, name (auth user metadata), items, done, chats (save/list/load/delete), materials (add/delete). |
| `src/components/materials.tsx` | Materials | Course Materials block (drop files, links, notes, 60s signed links) + floating `UploadWindow`. |
| `src/components/settings-forms.tsx` | Settings window | Semester, Google Calendar feed link (copy / new link two-step), Appearance, Account (name, sign out). |
| `supabase/migrations/*.sql` | Schema | Applied manually by the user; see §9 for the status uncertainty. |
| `docs/ROADMAP.md` | Status | Update at the end of each phase/step. |

## 9. Current Data Model

All tables have RLS, `user_id default auth.uid()`, and policies scoped to `(select auth.uid())`.

- **0001:** `settings (user_id PK, term_start date, term_weeks 1..30)`; `courses (id, user_id, code 1..40, name ≤120, hue 0..360, created_at)`; `items (id, user_id, course_id → courses cascade, kind assignment|exam|quiz|reading, title 1..200, due timestamptz, done_at, source manual|canvas|ics|syllabus, external_id, created_at, unique (user_id, source, external_id))`, index `(user_id, due)`.
- **0002:** `class_meetings (id, user_id, course_id → courses cascade, weekdays int[] 0=Sun, starts time, ends time, location)`. Wall-clock times in the student's timezone.
- **0003:** `settings.feed_token uuid unique default gen_random_uuid()`; function `calendar_feed(token) returns jsonb` (security definer, `search_path = ''`, execute granted to anon/authenticated), returning term/courses/items/meetings for the matching token only.
- **0004:** `chats (id, user_id, title ≤120, focus ≤40, messages jsonb, updated_at)`; `materials (id, user_id, course_id → courses cascade, kind file|link|note, name 1..200, path, url, body ≤100000, created_at)`; private storage bucket `materials` (50 MB, docs/slides/images/text) with policies limiting objects to the user's own folder (`foldername[1] = auth.uid()`).
- **Display name:** stored in Supabase auth user metadata (no table).
- **Migration status (uncertain):** the user confirmed running **0001**. 0002–0004 were each committed with "needs migration applied", and whether the user ran them is **not confirmed here**. Course pages survive a missing 0004 (commit `6c8097b`). Ask the user, or check, before building on them.
- **Expected next:** Phase 5 adds Canvas connection fields (base URL, encrypted token, ICS URL, last sync status) and Canvas item fields (description, points, score, url), per the v1 spec.

## 10. Core Product Flows

Most features after Phase 3 were checked visually with sample data; they were not clicked through signed in by Claude, because the preview pane can't sign in.

- **Sign in:** `/login` with password (primary) or an email link (same browser only). Working; confirmed by the user.
- **Create:** the sidebar's gooey "+" (Assignment, Exam, Course, Upload) and the gooey "+ Add" on calendar and course pages (pre-fills date/course). Dialogs are in `create-forms.tsx`.
- **Check off / delete with undo / show done:** `useWork()`, on Home and course pages.
- **Calendar:** see §8; add from an empty time slot or a day's "+".
- **Google Calendar feed:** copy the link in the rail or Settings → Google Calendar "From URL". Classes appear as weekly repeats, deadlines at their due time; "New link" kills the old URL.
- **Courses:** `/courses` tilt grid → `/courses/[id]` (work, class times, materials, edit code/name/color, delete).
- **Materials:** upload window (tiles: PDF/PowerPoint/Word/Images/Link/Note, drag and drop) and the per-course block. Files upload from the browser into the user's folder and open through 60s signed links. The AI does **not** read them yet (Phase 6).
- **Assistant:** side panel or `/chat` (same conversation), course focus, Think toggle, dictation, shortcut/idea chips. Answers stream; proposals become confirm cards; flashcards become a flip deck. Chats auto-save after each answer; History is on `/chat`.
- **Settings window:** opened from the sidebar or any `useOpenSettings()` call (e.g. Home's "set your real semester length" nudge when weeks ≤ 2).

## 11. AI System (single assistant, "Sonnet")

- **Provider/models:** OpenRouter free models, default chain `nvidia/nemotron-3-super-120b-a12b:free` → `qwen/qwen3.8-27b:free` → `nvidia/nemotron-3-ultra-550b-a55b:free` (Gemma dropped: frequent 429). The account showed 1,000 free requests/day and 20/min. Free providers may log prompts.
- **Reasoning:** off by default (~0.5s to the first word). Auto-on via `needsThinking()` for tutoring asks (explain, why, how do…, solve, study, quiz, compare, outline…) or messages over 280 characters; never for planner edits (add/move/change/mark/…). The **Think** toggle forces it (`effort: "low"`, `max_tokens` 2000).
- **Context:** the current time in the student's timezone; `calendarLines()` (this/next week, next 14 days, the "this/next Friday" rule); every class in the coming week with real dates, today/tomorrow/happening now, and a countdown; semester week; courses; class times; the work list written as the chat's own links (`[Title](item:ref)`, `class:` refs); optional course focus.
- **Tools (each becomes a confirm card; nothing auto-saves):** `add_item`, `update_item`, `delete_item`, `add_class_time`, `update_class_time`, `delete_class_time`, `add_course`, `update_course`, `delete_course`, `set_semester`, and `make_flashcards` (a deck shown in chat, never saved).
- **Rendering:** Markdown (react-markdown + remark-gfm) with item/course/class chips and ```work / ```plan blocks, plus a Copy button.
- **Streaming protocol:** NDJSON events `think`, `text`, `propose` (Proposal[]), `cards` (Deck), `error`.
- **History:** chats are saved per conversation (`chats` table, migration 0004). **This reverses the earlier "session-only" decision** (made during the extras work).
- **Orb states:** searching (reading data), solving (thinking), composing (writing), breathing (idle); `connecting` is reserved for Canvas sync and `working` for upload processing.
- **Resilience:** 55s timeout, one silent retry before any text arrives, errors logged, friendly 429/401 messages.

## 12. UI / UX System

- **Aesthetic:** "Precise, tactile, cheeky" (Linear/Raycast precision, Teenage Engineering readouts, grown-up Duolingo copy). Light and dark (system default; toggle in Settings). Tokens live in `src/app/globals.css` (OKLCH).
- **Color meaning:** the brand "oscilloscope cyan" means "you, now" only; green = done; red = late/destructive. Course hues come from `HUES` in `src/lib/course.ts` (at least 40° away from red, green and cyan) and always appear with the course code.
- **Type:** Geist + Geist Mono (readouts, labels, numbers).
- **Layout:** sidebar rail (expands over content; a chat button sits beside the "+" when expanded) | page | AI panel docked at ≥1280px (a sheet below that; hidden on `/chat`). Settings and the uploader are **floating windows** over the current page. Nav: Home, Calendar, Courses, Chat (+ Settings). The **Materials tab was replaced by Courses**; materials live on course pages.
- **Component rules:**
  - gooey (liquid-gooey): every liquid menu and picker (Create, Add, the chat course picker) and the calendar view switch
  - metal (silver): AI only (send, Ask, "AI" badge)
  - thinking-orbs: AI status
  - voice-glow (ice): dictation
  - **border-beam: around the Chat page input** (a reversal: it was "not used" earlier)
  - Bencho tilt card: course cards
  - Bencho carousel: Home courses
  - bot-avatars and img-fx: still not used
- **Motion:** GSAP only where JS or timelines are needed; CSS elsewhere; motion for layout-like UI; no bounce/elastic easing; no page-load choreography; reduced motion respected everywhere.
- **Design tooling:** run the impeccable detector (`node <impeccable skill>/scripts/detect.mjs --json <files>`) on changed UI files before committing.
- **Don't casually change:** the accent's meaning, the course hue rule, the gooey "+" in the sidebar (the user disliked a header Create button), metal only on AI, honest placeholders, the floating Settings window.

## 13. Completed Work (see `git log` for details)

- **Phases 0–3** (foundation, auth, items/progress, app shell, AI with confirm cards, speed fix, date grounding, reasoning toggle): commits up to `1db55c3`.
- **After that** (`git log d765b6e..HEAD`):
  - class times + class-week grounding (`166e9df`, `c49f3db`)
  - calendar (`f7e554d`, `de0a639`)
  - Google Calendar feed (`7de6f88`)
  - Courses pages + carousel (`68a88d5`)
  - Chat page + flashcards + border beam (`f506dcd`)
  - bigger cards + greeting name (`f369913`)
  - Markdown rendering + all-in-one tools (`b891bfc`)
  - gooey picker + sidebar chat button (`464362c`)
  - floating Settings (`8d01d0e`)
  - chat history + materials (`6ff973d`)
  - floating uploader (`6a31e01`)
  - materials guard (`6c8097b`)
  - roadmap docs, and the handoff skill (`7eb1e4f`)

## 14. Work In Progress

- **Phase 6 (partial):** uploads, links and notes per course work (needs 0004). **AI reading materials, syllabus import and exam study guides have not started.**
- **Nothing half-written in the working tree** (it's clean).
- **Not verified signed in by Claude:** most features after Phase 3 were checked visually with sample data in the preview pane, not with the user's real account (the pane can't sign in, and Claude must not type passwords).

## 15. Current Immediate Task

**The last finished work** was the extras before Phase 5 (Courses, Chat page with history, materials, floating Settings/uploader), then docs (`5357910`) and adding the `handoff` skill (`7eb1e4f`).

**The next task is Phase 5: Canvas sync** (`docs/ROADMAP.md`). Before coding, confirm with the user:
1. Which migrations (0002–0004) have been applied.
2. The school's Canvas base URL, and whether they'll connect with an access token, the calendar feed URL, or both. They asked for both options. The token is entered in the app, never pasted in chat.
3. That the semester length is set correctly.

## 16. Next Steps

### P0: Phase 5, Canvas sync (design in `docs/superpowers/specs/2026-09-22-student-hub-design.md`)
1. **Migration 0005:** Canvas connection on `settings` (base URL, token **encrypted at rest**, ICS URL, last sync time/status/error) and Canvas item fields (description, points, score, html_url). Done when it's applied, RLS is intact, and the client can never read the token.
2. **Sync logic (server-only):** token REST (`/api/v1/courses`, `/courses/:id/assignments?include[]=submission`) and/or ICS parsing → upsert courses/items on `(user_id, source, external_id)`; submitted = done; store scores; never delete on a failed fetch. Done when unit tests cover mapping and dedupe, and a real sync fills the user's account.
3. **Canvas section in the Settings window:** connect, Sync now, last sync status, and the `connecting` orb while syncing. Done when the user can connect and sync from the UI.
4. **Daily auto-sync** (Vercel Cron), once manual sync works.
5. **AI context:** add assignment descriptions so the assistant can summarize assignments.
6. Update `docs/ROADMAP.md`, and commit and push after each step.

### P1
- The rest of Phase 6: text extraction, the AI reading materials, syllabus import with review cards, exam study guides.
- Context-aware chat shortcuts.

### P2
- Phase 7: grades + what-if.
- Phase 8: focus timer + heatmap (Kibo contribution-graph is vendored for it).
- Phase 9: polish.
- The roadmap "ideas" (after-class check-in, start-by planning, crunch forecast, Sunday reset).
- The SaaS step.

## 17. Bugs and Known Issues

| Issue | Severity | Symptoms | Cause | Files | Status | Fix |
|---|---|---|---|---|---|---|
| Migrations 0002–0004 possibly not applied | High (if not) | Class times, feed, chats and materials fail on the live site | The user applies SQL manually | `supabase/migrations/` | Unknown | Ask the user; they paste each file into the Supabase SQL Editor |
| Free AI models intermittently 429/503 | Medium | A "busy" message, or a retry | Free tier | `src/lib/ai.ts` | Mitigated | Reorder `AI_MODEL`; use a paid model for SaaS |
| Features not tested signed in with real data | Medium | Possible real-data bugs | The preview pane can't sign in | many | Open | Ask the user to sign in to the pane, or test on ericwei.me |
| Magic link only works in the same browser | Low | "link expired" | Supabase's default PKCE link; editing templates needs custom SMTP | `src/app/auth/confirm/route.ts` | Known | Resend SMTP + a `token_hash` template (the route already supports it) |
| next-themes script warning (dev only) | Low | A console error in dev | next-themes under React 19 | `src/app/layout.tsx` | Harmless | Ignore |
| Browser pane frame throttling | Info | Animations, timers and toasts stall in tests | Hidden pane | — | Test artifact | Take a screenshot to force frames |

## 18. Failed Attempts / Rejected Approaches (still relevant)

- **Paid Anthropic API** → rejected (cost) → OpenRouter free models. **NVIDIA NIM** (one-time credits) and **Bytez** ($1 every 4 weeks) → rejected.
- **Reasoning always on** → ~15s to the first word → off by default, auto for tutoring, plus the Think toggle.
- **A `pull()`-based `ReadableStream` parser** → stalled on keep-alive comments → a single read loop.
- **`offsetParent` visibility checks** → always null inside `position: fixed` → `isShown()`.
- **Header Create button + dashboard Ask bar** → the user said they were out of place → gooey "+" in the sidebar, plus the AI panel.
- **Rigid grid dashboard** → two independent columns.
- **Bouncy easing, and red/green course hues** → replaced.
- **Base UI checkbox as a `<span>` inside a `<label>`** (double toggle on Space) → native `<button>`.
- **A `liquid-gooey` group with an `absolute` class** → the library forces `relative` → wrap it in an anchoring box sized to the full travel.
- **Editing the Supabase email template** → needs custom SMTP → skipped.
- **Ignoring reduced motion** → rejected; the user declined an in-app motion toggle.
- **Reversed decisions:**
  - session-only chat → now saved
  - border beam "not used" → used on the Chat page
  - a `/settings` page → a floating window
  - a Materials nav tab → Courses pages
  - the shadcn dropdown → removed

## 19. Important Decisions (do NOT casually reverse)

- **Next.js + Supabase + Vercel**, a single user, sign-ups closed, **RLS on everything**.
- **Email + password** login as the primary method.
- **OpenRouter free models** through OpenAI-compatible config; reasoning off by default, auto for tutoring, plus the Think toggle; **calendar and class-week grounding** in the prompt.
- **The AI never saves without a confirm card** (every tool is a proposal; destructive ones are red).
- **Phase order:** Shell → AI → Calendar → Canvas → Materials → Grades → Focus → Polish (the user's choice). Nothing from the original roadmap was dropped (mapping in `docs/ROADMAP.md`).
- **Global assistant:** a side panel at ≥1280px plus the full `/chat` page, sharing one conversation; chats are saved.
- **Metal = AI only; gooey = liquid menus/pickers; accent = "you, now".**
- **Commit and push to `main` after each important change; keep the roadmap current.**
- **Ponytail minimal code.**
- **Next 16 conventions:** Proxy, generated `PageProps`/`LayoutProps`, `requireUser()` in every page.

## 20. Environment and Setup

Node 24, npm 11, Windows (Git Bash/PowerShell).

```bash
npm install
cp .env.example .env.local     # fill in values; never commit
npm run dev                    # http://localhost:3000 (preview config "dev")
npm test                       # vitest (13 tests)
npx tsc --noEmit
npm run lint
npm run build
npx next typegen               # after adding routes
```

- **Env var names:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `AI_API_KEY`; optional `AI_BASE_URL`, `AI_MODEL`. Use the same names in Vercel → Settings → Environment Variables (they apply on the next deploy).
- **Database:** paste each `supabase/migrations/000N_*.sql` into Supabase → SQL Editor, in order.
- **Supabase URL config:** should include Site URL `https://www.ericwei.me` and redirect `https://www.ericwei.me/auth/confirm` (plus localhost). The user was told to set this; it's not verified.
- **Formatting:** there's no Prettier config; use `npx prettier --print-width 120 --write <files>` to match the code (~120 columns).

## 21. Testing Status

- **Automated (13 tests, 3 files):** progress math; AI calendar lines, the reasoning rule and `toProposal`; calendar date math and `toIcs()`.
- **Live AI checks** (temporary `tsx` scripts, since deleted): streaming, retry, proposals, date/class grounding, flashcards, a class-room change, setting the semester.
- **Visual checks** in the preview pane with sample data (mostly 1440px dark; the calendar also at 375px).
- **Untested / highest risk:**
  - everything after Phase 3, signed in with real data
  - migrations 0002–0004 on the live project
  - uploads to Storage
  - saving and loading chat history
  - the ICS feed in Google Calendar
  - the light theme on the newer screens
  - the phone layout of the newer screens

## 22. Git State

`main` = `origin/main`, clean at `7eb1e4f`. The only branch is `main`. Never commit `.env.local`. Ignored: `.next/`, `next-env.d.ts`, `*.tsbuildinfo`, and `.impeccable/hook.cache.json` (via `.git/info/exclude`).

## 23. External Services

- **Supabase:** DB, auth, and the storage bucket `materials`. Env: the two `NEXT_PUBLIC_SUPABASE_*` variables. Built-in email is rate-limited; editing templates needs custom SMTP.
- **Vercel:** hosting; domain `ericwei.me` (apex → `www`); env vars set by the user.
- **IONOS:** DNS (A `@` → Vercel, CNAME `www` → the project's Vercel DNS host; mail records kept).
- **OpenRouter:** AI. Env `AI_API_KEY` (plus optional overrides).
- **Google Calendar:** subscribes to `/api/cal/<token>.ics` (one-way).
- **Browser Web Speech API:** dictation (Chrome sends the audio to Google).
- **GitHub:** `g5haco/sonnet`; the `gh` CLI is authenticated on this machine.
- **Canvas:** not connected yet (Phase 5).

## 24. Security / Privacy

**Implemented:**
- RLS on every table.
- Storage objects limited to the user's own folder.
- The ICS feed goes through a security-definer function keyed by an unguessable, rotatable token.
- All writes are validated server-side; `/api/chat` requires auth and validates input.
- AI tools never execute server-side: they become confirm cards, and refs are resolved server-side (the model never sees full ids).
- Secrets live only in env vars; sign-ups are closed.

**Needed before wider distribution:**
- a paid, privacy-respecting AI provider
- per-user rate limits
- an email provider
- **Canvas token encryption (a Phase 5 requirement)**
- sandboxed text extraction for uploads (Phase 6)
- a privacy note for dictation
- a check that feed tokens can't leak through logs

## 25. Performance Notes

- **MVP:** AI ~0.5s to the first word with reasoning off, 4–10s with it on. The context lists up to 300 items plus the class week. The free tier allows 20 requests/min and 1,000/day. Everything renders client-side, which is fine at personal scale.
- **SaaS later:** AI cost and rate limits, context size, Canvas sync jobs, storage and extraction costs.

## 26. Things the Next Claude Must NOT Do

- Don't rebuild finished work (Phases 0–4, Courses, the Chat page and history, materials, the floating windows).
- Don't let the AI save anything without a confirm card, and don't remove the date/class grounding or the reasoning rule and toggle.
- Don't switch to a paid AI provider without the user's consent.
- Don't bring back a header Create button, a `/settings` page, or a Materials nav tab without asking.
- Don't use metal outside AI elements. No mascots, gradient text, glassmorphism, identical card grids or bouncy easing, and don't ignore reduced motion.
- Don't use course hues near red, green or cyan.
- Don't commit fake or sample data (use temporary local patches only, and revert them).
- Don't add SaaS complexity unless asked.
- Don't commit secrets, print `.env.local`, ask the user to paste secret keys, or type their password.
- Don't store the Canvas token in plain text or send it to the client.
- Don't use `pull()`-based streams that can return without enqueueing, or `offsetParent` for visibility checks.
- Don't edit `src/components/kibo-ui/**` casually (it's vendored and lint-ignored).
- In Python heredoc patches, write backslashes as `chr(92)` (`\n`/`\s` got mangled several times).
- Don't forget to commit and push after each important step, and to update `docs/ROADMAP.md`.

## 27. Assumptions and Uncertainties

- **Confirmed:** the repo state and checks above; 0001 applied; login works; the AI key is set locally and in Vercel; the user has used the assistant on the live site; the domain works.
- **Unknown:**
  - whether 0002–0004 were applied
  - whether the user's semester length was fixed
  - whether the Supabase URL config was updated
  - whether the newer features work with real data
- **Unresolved:**
  - the Canvas details (base URL, token vs feed)
  - when Phase 6 extraction happens relative to Canvas
  - when the SaaS step starts
- **Provenance:** the sections of this document covering work after `d765b6e` were reconstructed from commit messages and the code, not from the conversations that produced them.

## 28. Conversation Knowledge Not Visible in the Repository

- **The original brief:** combine StudyFetch/MyStudyLife/StudyKit/BlockPlan/DormWay/Notion/Motion into one **minimal** tool; "don't overwhelm users"; light gamification (the user chose minimal).
- **The user:** a college student who vibecodes on Windows. They switched to free AI after first planning a ~$5–10/month Anthropic budget.
- **Canvas:** the user wants **both** connection options (access token and calendar feed).
- **What "AI planner/organizer" means to them:** explain assignments, summarize requirements, say what to study for an exam, suggest when to do things.
- **Google Calendar:** one-way was chosen.
- **Reference UIs the user supplied:**
  - dark "blocks" dashboards (66%/76% bar cards, tick gauges), a "+ Create" pill, a dropdown menu
  - StudyFetch's upload page and calendar
  - Libraries.dev (orbs, voice, metal v2, gooey)
  - a sidebar prompt (`sidebar.txt`) and a chatbox prompt (`chatbox design.txt`)
  - Bencho components (Search, Slide to Confirm, Tilt card, carousel). **Slide to Confirm** was earmarked for big actions like importing many syllabus items (Phase 6); Search wasn't chosen.
- **Feedback so far:** the user liked the design ("looks amazing"), cares that animations are visible and smooth, and wanted faster AI replies plus reasoning for tutoring.
- **The 1-week semester:** the user once saved the semester as 1 week, which is why the Home nudge exists.
- **This file:** the user asked for HANDOFF.md to stay accurate. A `handoff` skill (`.claude/skills/handoff`) now exists for writing session handoffs to the OS temp folder.

## 29. Glossary

- **Item:** an assignment/exam/quiz/reading row. **Class meeting / class time:** a weekly class slot.
- **Progress / caught up %:** the share of work due so far that's done. **Week cleared:** all of this week's items are done.
- **Proposal / confirm card:** an AI-suggested change waiting for the user's yes. **ref:** the short id shown to the model (`item:`/`class:` links).
- **Think / reasoning:** OpenRouter reasoning turned on (automatically or by the toggle). **Calendar grounding:** the explicit date lines in the prompt.
- **Focus:** the course a chat is about ("All courses" = none).
- **Docked / sheet / floating window:** the AI panel beside the page / a sliding overlay / Settings and the uploader over the page.
- **Brand / oscilloscope cyan:** the accent that means "you, now". **Course hue:** a course's color.
- **Block:** the rounded card primitive. **Gooey menu:** the liquid-gooey menus and pickers (`gooey-menu.tsx`).
- **Libraries.dev / Bencho:** the MIT component sources used in the UI.

## 30. Continuation Instructions

> You are continuing **Sonnet**, a personal all-in-one student planner (Next.js 16 + Supabase + Vercel + OpenRouter free AI), live at www.ericwei.me.
>
> 1. Read this file, then `docs/ROADMAP.md`, `PRODUCT.md`, `AGENTS.md`, and the Canvas sections of the v1 spec.
> 2. Run `git status`, `git log --oneline -10`, `npm test`, `npx tsc --noEmit` and `npm run lint`. The code is the source of truth.
> 3. Unless the user says otherwise, start **Phase 5 (Canvas sync)**: first settle the three questions in §15, then take the architectural path (a short design and the user's approval), then build in committed steps (§16).
> 4. Work in steps and report in plain language. Commit and push each important change to `main`, update `docs/ROADMAP.md`, keep code minimal, run the impeccable detector on UI changes, and test in the preview pane (ask the user to sign in there; never type passwords).
> 5. Preserve §19 and §26 unless the user explicitly asks to revisit them.

---

## Project State Snapshot

```yaml
project_name: Sonnet (student planner)
current_phase: "Phases 0-4 done + extras (Courses, Chat page/history, materials, floating Settings/uploader); Phase 5 next"
current_goal: "Canvas sync: token and/or calendar feed, Sync now, daily auto-sync, assignment descriptions for the AI"
current_branch: main
head: 7eb1e4f
working_tree_clean: true
last_finished_work: "Extras before Phase 5 (6a31e01, 6c8097b), roadmap docs (5357910), handoff skill (7eb1e4f)"
next_action: "Ask which migrations (0002-0004) are applied + Canvas URL and connection method; then design Phase 5"
major_completed_features:
  - Auth (password + email link), RLS everywhere
  - Courses (tilt grid, per-course pages), items, class times, semester settings
  - Home dashboard (progress, Up next, exam ring, week strip, courses carousel)
  - Calendar (day/week/month, heat map rail, gooey switch/Add) + Google Calendar feed
  - Assistant (panel + /chat), Markdown answers, confirm cards for all changes, flashcards, saved history
  - Floating Settings window and uploader; per-course materials (files/links/notes)
major_in_progress_features:
  - "Phase 6: AI reading materials, syllabus import, study guides (not started; uploads done)"
major_pending_features: [Phase 5 Canvas sync, Phase 7 grades, Phase 8 focus timer, Phase 9 polish]
known_blockers:
  - "Unknown whether migrations 0002-0004 are applied on the live project"
  - "Claude can't sign in to the preview pane; real-data testing needs the user"
important_files: [src/lib/ai.ts, src/app/api/chat/route.ts, src/components/app-shell.tsx, src/components/chat/proposal-card.tsx, src/app/actions.ts, src/components/calendar.tsx, supabase/migrations/, docs/ROADMAP.md]
do_not_change:
  - "AI changes only via confirm cards"
  - "Free OpenRouter chain, reasoning-off default + auto/Think, date/class grounding"
  - "Gooey + in sidebar, metal only on AI, floating Settings window"
  - "Commit/push to main after each important change; keep ROADMAP current"
```
