# Project Handoff

> Updated 2026-09-24, through commit `acd5989`. The code wins over this file if they disagree. Phase-by-phase status lives in `docs/ROADMAP.md`. Code structure: ask Graphify (`graphify-out/`), not this file.

## Project Summary

**Sonnet** is a personal student hub for one user, a college student who builds the app by vibecoding on Windows. It puts courses, deadlines, a calendar, materials, grades, a focus timer and an AI assistant in one **minimal** app. It runs live at `https://www.ericwei.me`.

- **Stack:** Next.js 16 App Router, Supabase (Postgres with RLS, Auth, Storage), Vercel, OpenRouter for AI.
- **Direction:** Phases 0–8 are done. Phase 9 (polish and a real-use pass) is next. A SaaS version ("second step") comes later and only when the user asks.

## Current State

What works:

- **Core:** login; courses and course pages; work items with check-off and undo; class times; calendar; Google Calendar subscribe feed; Canvas sync (token and/or ICS feed, daily cron); materials upload.
- **Assistant:** side panel plus the `/chat` page, sharing one conversation; chats are saved.
  - **Changes need approval:** every change it proposes becomes a card the user confirms. Nothing saves without a yes.
  - **What it can use:** it reads the focused course's materials and its syllabus; accepts attached photos and files, and files dropped onto the chat; searches the web.
  - **Thought chain:** shows its steps, reasoning and web sources.
- **Phase 6, materials:** uploaded PDFs and text files get their text extracted. Photos and scanned PDFs are transcribed by the vision model at upload.
  - **Syllabus:** a one-page summary note, an "Ask about it" chat, and optional import of dates Canvas missed.
  - **Chat shortcuts:** chips follow the current course, including a "Study guide: <exam>" chip for any exam within 30 days.
- **Phase 7, grades:**
  - **Current grade:** each course's grade as Canvas computes it (course weights applied), shown on Home, course pages and in the assistant's context.
  - **Scores:** graded work shows its score, e.g. `18/20`.
  - **What if:** a block on course pages ("score needed on the final").
- **Phase 8, focus:**
  - **Timer:** one global 25-minute timer, started from a button in the sidebar. It opens a floating panel you can drag, with an animated ring.
  - **Heatmap:** logged minutes fill an 18-week heatmap and a streak on Home ("Study days").
- **Migrations:** 0001–0007 are applied (the user confirmed 0006 and 0007 this session).

## Completed This Session

- **Model routing** (`src/lib/ai.ts` `needsVision`, `MODELS`):
  - **Free by default:** everyday chat uses free models: `nvidia/nemotron-3-ultra-550b-a55b:free`, then `qwen/qwen3.8-27b:free`, then paid `deepseek/deepseek-v4.1-flash` as a last resort.
  - **Gemini 3.8 Flash only for:** the Think toggle, photos or files on *the current* message, and math asks (solve/prove/derive/calculate).
  - **No longer triggers Gemini:** an earlier photo in the conversation. Older photos are not sent to text-only models.
  - **Why:** the user found Gemini too expensive. Nemotron Ultra was the only free model that got both tool calls and syllabus dates right in a live comparison. Explaining and summarizing stay free because Nemotron did them well (but slowly: about 40 s for a long answer).
- **Phase 6 finished:** vision reading at upload (`visionText`), course-aware shortcuts with study-guide chips. Study guides are chat answers, not saved notes.
- **Phase 7, grades:**
  - Migration 0006 adds `courses.grade`. Sync requests `include[]=total_scores` and stores `computed_current_score`.
  - Pages select courses with `"*"` so they didn't break before the migration ran.
  - What-if formula: `needOnFinal`.
- **Phase 8, focus:**
  - Migration 0007 adds `focus_sessions`. The `logFocus` action saves sessions.
  - The timer lives in `FocusProvider` inside AppShell, so it runs on every page.
  - The running session is kept in `localStorage` (`sonnet-focus`). A session older than 50 minutes is dropped, not logged. Stopping logs whole minutes (at least 1). Reaching 25 minutes logs 25.
  - The user asked to remove the course picker and Home's Focus button. The panel ring fills over the full 25 minutes (the user rejected a once-a-minute sweep). The panel is dragged by its header and remembers its spot until the page reloads.
- **Thought chain and web search:**
  - **Streaming:** the server streams `reason`, `search` and `sources` events. The client builds the steps from the event order.
  - **Search:** uses the OpenRouter web plugin (`plugins:[{id:"web"}]`, about $0.02 a search). It runs when the Search toggle (globe icon) is on, or when `needsSearch()` matches: sources, fact-check, verify, news, etc.
- **Drag-and-drop:** dragging files over any `[data-chat]` area shows an overlay; dropping attaches them.
- **Progress percent fix** (`src/lib/progress.ts`):
  - **Bug:** the percent only counted work already past due, so it showed 100% with work still open this week.
  - **Fix:** it now counts everything due through Sunday. Label: "of work due by Sunday done".
  - **Delta:** compares with a week ago using the same rule.
- **Cleanups:**
  - Removed: GSAP (replaced by `motion` `animate`), Kibo contribution-graph and theme-switcher, `date-fns`, `@radix-ui/react-use-controllable-state`.
  - Shared `complete()` helper for one-shot AI calls.
  - Names used only inside their own file are no longer exported.
- **CLAUDE.md:** token-efficiency rules added, then compressed with caveman-compress. The uncompressed backup is outside the repo.

## Important Decisions

Do not reverse these casually.

- **Changes need approval:** the AI never saves without a confirm card. Tools are proposals; the server resolves short refs to real ids.
- **Model choice is config, not code:** override with the env vars `AI_MODEL` (comma-separated fallbacks) and `AI_VISION_MODEL`. Don't move everyday chat to paid models without asking; cost is the user's main concern.
- **Reasoning:** off by default. It turns on for tutoring questions (`needsThinking`) or the Think toggle. Always-on reasoning was rejected because it takes about 15 s before the first word.
- **Grades:** Canvas's computed score is the source of truth; don't compute weighted grades ourselves. What-if uses a single final weight on purpose.
- **Focus timer:**
  - It is global, so it lives in the shell, not in pages.
  - No course picker (the user called it useless).
  - The ring fills slowly over 25 minutes.
  - Home's heatmap block has no buttons.
- **Honest UI:** no fake data. Placeholders say what's coming.
- **Visual language:**
  - Metal styling only on AI elements. Gooey only for menus and pickers.
  - No gradient text, glassmorphism or bouncy easing. Respect reduced motion.
  - No course hues near red, green or cyan.
- **Phase order is the user's choice:** Shell → AI → Calendar → Canvas → Materials → Grades → Focus → Polish. Nothing from the original roadmap is ever dropped.
- **Kept on purpose, despite audits:** the `evil-buttons/` Reset-all-data animation (it uses `matter-js`), and the custom spring in `src/lib/spring.ts`. Its tuned feel is used by the carousel and tilt cards.

## Current Priorities

1. **Phase 9: real-use pass.** The user uses the app signed in; fix what breaks. Many features were only checked in the preview pane (see Testing).
2. **Phase 9 polish.** Small UX issues the user reports.
3. **Deferred ideas** (in `docs/ROADMAP.md`, not scheduled): after-class check-in, "start by" planning, crunch forecast, Sunday reset.
4. **P1 done:** `vercel.json` `regions` = `pdx1` (Supabase is us-west-2).

## In Progress / Unfinished Work

Nothing is half-built. Open follow-ups:

- **Study guides:** they live only in chat history. Saving them as course notes (like the syllabus summary) was offered, not built.
- **What-if:** not per assignment group. Manual (non-Canvas) courses can't save a grade.
- **Timer:** the panel position resets on reload. There are no notifications when a session ends on another tab. The length is fixed at 25 minutes.
- **Web search:** never tried with a real signed-in request. Only the OpenRouter response format was verified live, plus the UI with a fake stream.

## Known Bugs / Issues

Confirmed:

- **Free models are unreliable:** they return 429/503 or overload; Qwen was down during every test. Mitigated by fallbacks and one retry.
- **Nemotron Ultra is slow** on long answers (about 40 s total, though it streams).
- **Magic-link sign-in** only works in the same browser (Supabase PKCE). Password login is primary.
- **Dev-only warning:** next-themes logs a "script tag" error in the console. Harmless.
- **`graphify update .`** segfaulted once. The git hook's background rebuild still runs.

Possible, not confirmed:

- The scheduled daily Canvas cron run hasn't been separately observed.
- The Supabase URL config (Site URL / redirect) was never verified.

## Product / UX Intent

- **Minimal, not overwhelming.** Light gamification: the heatmap and streak are the only game elements.
- **The user wants visible, smooth animation**, but not busy animation. Several animation choices were reverted on their feedback.
- **The assistant = an organizer:** it explains assignments, summarizes, plans what to study, and adds things to the calendar after a yes.

## Important Constraints

- **Workflow:**
  - Commit and push every important change straight to `main`. No branches. Say "needs migration N" or "untested" in the commit message.
  - Keep `docs/ROADMAP.md` current.
  - Work in steps and keep the user updated. Write plain-language summaries.
  - Per `CLAUDE.md`: after normal feature work, run one fresh reviewer sub-agent. Skip it for tiny changes. Use Graphify first; read minimal files; caveman-style terse chat.
  - Ponytail minimal code: reuse existing code and deps, no speculative abstractions, one small test for any non-trivial logic.
- **Migrations:** the user applies them by pasting SQL into Supabase → SQL Editor. Code must keep working before a new migration runs.
- **Secrets:** they live in `.env.local` and Vercel. Never print them or ask the user to paste keys in chat. Env var names: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `AI_API_KEY`, `SUPABASE_SECRET_KEY`, `CANVAS_ENCRYPTION_KEY`, `CRON_SECRET`, and optionally `AI_BASE_URL`, `AI_MODEL`, `AI_VISION_MODEL`.
- **Next 16:** `src/proxy.ts` replaces middleware. Every page calls `requireUser()`. Read `node_modules/next/dist/docs/` before using unfamiliar APIs.
- **Local preview pages:** `src/app/login/*-preview/` are untracked (listed in `.git/info/exclude`); never commit them. `cal-preview` has a known type error; ignore it. They give the preview pane signed-out views with sample data.
- **Windows editing gotchas:**
  - Python heredocs turned `\b` into a backspace character. Use the Edit tool for regexes.
  - Python on Windows writes CRLF unless you pass `newline=''`. Keep each file's existing line endings (most are LF).
  - Never run Prettier on whole files: the project has no config, and it reformats everything. The code is about 120 columns wide.

## Testing / Validation Status

- **Automated:** `npm test` passes 38 tests (vitest). `npx tsc --noEmit` is clean, apart from the local `cal-preview`. `npm run lint` is clean.
- **Verified in the local preview pane** (signed out, sample data): timer panel, drag, ring values, heatmap, what-if calculator, graded scores, thought chain (fake stream), drop overlay, course-aware chips.
- **Verified live against OpenRouter** (scripts): the free-model comparison, the web plugin returning `annotations`, and reasoning deltas.
- **Not tested signed in / on the live site:**
  - real Canvas grades after sync
  - focus sessions saving
  - web search in chat
  - photo and scanned-PDF transcription at upload
  - study-guide chips with real exams
- **Preview pane gotcha:** when the pane is hidden, the browser freezes CSS transitions and timers. Check computed values, or take a screenshot to force frames.

## Graphify Context

- **Recent work lives in:** the AI chat pipeline (`streamReply` → `/api/chat` → AppShell `send()` → `ChatLog` / `ThoughtChain`), the focus timer (`FocusProvider` in AppShell → `logFocus` → Home `FocusBlock`), and grades (Canvas sync → `courses.grade` → Dashboard, CourseView `WhatIf`).
- **Useful queries:**
  - `graphify query "How does a chat message stream from streamReply to the thought chain?"`
  - `graphify query "Where is the focus timer state and where are sessions logged?"`
  - `graphify query "How does Canvas sync write grades and scores?"`
  - `graphify explain "progress()"`: the Home and course percent and the weekly bars.

## Next Recommended Task

**Phase 9, real-use pass.**

- **Goal:** find and fix what breaks with real signed-in data.
- **Why next:** Phases 0–8 are built, but many features were only checked in the signed-out preview.
- **How:**
  - Ask the user to test the live site with this checklist: Canvas sync fills grades and scores; a focus session of 1+ minute shows on the heatmap; a "fact check …" question shows sources in the Search tab; a photo upload is readable; the study-guide chip works.
  - Fix the issues the user reports, one commit each.
- **Definition of done:** the user confirms each item works (or the fixes are pushed), and `docs/ROADMAP.md` Phase 9 is updated.

## Suggested New-Session Startup

"Read `HANDOFF.md` for current project state and decisions. Use Graphify before broad source exploration to understand the architecture relevant to the task. Read only the minimum files needed. If the handoff conflicts with current code, trust the code and note the stale handoff information.
Then continue with: Phase 9 real-use pass. Give me the live-site test checklist from the handoff, then fix whatever I report."
