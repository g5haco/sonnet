# Project Handoff

> Updated 2026-09-26 (end of session 2), code through `593784c`. The code wins over this file. Product truth: `PRODUCT.md`. Plans: `docs/ROADMAP.md` (phases 0–9) and `docs/COMMERCIAL-ROADMAP.md` (phases 10–16, next).

## Project Summary

**Sonnet** is a student hub: Canvas sync, calendar, courses, materials, grades, focus timer, a customizable Home, and an AI (also named **Sonnet**) that knows every course down to the syllabus. Built by one college student; live at `https://www.ericwei.me`, multi-user (Supabase RLS). Stack: Next.js 16, Supabase, Vercel (Hobby, Fluid), OpenRouter (free models first), `motion`.

Direction: Phase 9 (polish + public landing) is wrapping up. Next is commercialization, Phase 10 (launch readiness). Pricing is **undecided**.

## Current State

- Live and working. Migrations 0001–0013 applied; none added this session.
- Signed-out `/` rewrites to `/landing`; signed-in `/` is Home.
- The user verified the rebuilt landing live in Edge (desktop) at the start of this session.
- Every commit below is pushed to `main` and deployed (Vercel status: success).

## Completed This Session

- **Home smart search** (`src/components/home-search.tsx`, `src/lib/search.ts`): search bar at the top middle of Home.
  - Keyword rules: status (overdue, next, done), kind (exam, quiz…), courses, dates (today, friday, oct 3, 10/3, this/next week), pages and settings sections.
  - Results are cards: day, course, work, place, and "Ask Sonnet".
  - Animated placeholder, sliding highlight, "/" to focus, arrow keys + Enter.
- **Fuzzy search goes to Sonnet**: words that match nothing locally (`fuzzy`) call the `smartSearch` server action (end of `src/app/actions.ts`) after 600ms. It sends numbered lines and gets indices + a one-line answer back; results are cached per query.
  - The prompt was tested live against OpenRouter (3–14s).
  - The signed-in path is **untested in the app** (the preview has no user).
- **Hover easing app-wide**: a base-layer `:where(a, button, …)` color transition in `globals.css`; Up next rows nudge 4px on hover.
- **Landing "And the rest"**: `components/ui/interactive-list-preview.tsx`, a sliding highlight + clip-reveal preview of real screenshots. Rebuilt on `motion` (not GSAP); a plain list on touch; reduced-motion fade.
- **Landing headings type in** letter by letter (`Typed` in `landing/kit.tsx`), replaying on scroll. Paragraphs still fade.
- **Chat input**:
  - A + button opens a full-width menu (Photos & files, Documents, Web search, Think harder); the + rotates to an ×.
  - Search/Think chips slide their label out when on; paper-plane send.
  - The menu is portaled to `body`, because the chat box clips its overflow.
- **ThoughtLine** (`components/ui/thought-line.*`, React Bits, trimmed): the thinking line in `chat/thought-chain.tsx`. It breathes and shimmers with a live clock, lists steps, then settles into "Thought for Xs" (minimum 1s). Reasoning and sources open from pills below it.
- **StatusMark** (`components/ui/status-mark.*`, React Bits, trimmed to running/done/failed) on the task toast cards (`components/tasks.tsx`); the old sliding bar was removed.
- **Long-answer bug fixed**: the 55s timeout covered the whole answer.
  - Now only 45s of silence aborts (`IDLE` in `src/lib/ai.ts`), and the chat route has `maxDuration = 300`.
  - A partial answer is kept, with a note under it (`app-shell.tsx`).
- **CLAUDE.md**: added the Handoff Protocol and Resume Protocol.
- A Ponytail/Chisle audit was run and applied: roughly −120 lines across these new files.

## Important Decisions

- **No new dependencies**: GSAP and Hugeicons were requested but replaced with `motion` and `lucide` (already installed). Keep it that way unless the user asks.
- **Honest landing**: previews show only real screenshots; rows without one show their icon tile. No inverted/blend effects on screenshots.
- **The + menu omits** Sales data, Mail and Calendar from the reference design: Sonnet has no such data. Web search/Think appear both in the menu and as chips (user asked for both).
- **Search stays keyword-first**; the AI is only for leftovers (cost, speed).
- Earlier decisions still hold:
  - AI-first landing.
  - One background layer.
  - FAQ/About on solid color.
  - Section shells differ on purpose.
  - Only headings animate on scroll.
  - The grade calculator and timer are not showcased.
- **Tooling**:
  - Playwright: `playwright-core` + `channel: 'msedge'` from the session scratchpad (the in-app pane renders black after scripted scrolls).
  - Higgsfield: upload first, then pass the id.

## Current Design System

- **Midnight Study** palette (tokens in `globals.css`): monochrome shell, off-white primary; the landing is always dark.
- **Color means something**: course hues (`HUES` in `src/lib/course.ts`), status (`--done`, `--warning`, `--destructive`) and data only. `bg-brand` is used only for active modes (chat chips).
- **Motion**: ease-out curves, low-bounce springs, never `scale(0)`. Everything respects reduced motion. Hover color changes ease at 150ms globally.
- **Must not regress**:
  - 44px tap targets on phones.
  - No horizontal overflow at 375px.
  - No hydration mismatches.
  - Readable contrast over the sky.

## In Progress / Unfinished Work

- **Untested live, signed in**:
  - The AI fallback in Home search.
  - The long-answer fix with a real 60s+ answer.
  - ThoughtLine in a real chat.
  - StatusMark on a real task (sync/upload).
- **Needs the user**:
  - Rewrite the About text in their own words.
  - Decide the pricing shape.
- **Deferred**: Google sign-in (Supabase provider + OAuth), then re-enable the button in `login/form.tsx`.
- **Planned, not approved**: `docs/COMMERCIAL-ROADMAP.md` phases 10–16, grade goals (migration), saving the syllabus chip (migration).

## Known Bugs / Issues

- **`smartSearch` has no rate limit**: a signed-in user could loop it and spend AI credits. Belongs in Phase 10 rate limiting.
- Dev-only hydration warnings on preview pages: `VoiceBeam` (chat input) and `MetalFx` (send button). Pre-existing, not from this session.
- Local `next build` fails on the untracked `login/course-preview` (`useSearchParams` without Suspense). Rename it `_course-preview` to build; `rm -rf .next/dev/types` first.
- Free AI models are flaky (429/503). `graphify update .` can segfault (a background rebuild runs on commit).
- **Windows editing**: `sed -i` and plain Python writes can convert CRLF files. `globals.css` has mixed line endings, so edit it byte-safely (read and write bytes).

## Current Priorities

1. Signed-in live check of this session's chat and search work (see Unfinished).
2. Phase 10 plan (hosting, legal pages, monitoring, **rate limits incl. `smartSearch`**), proposed before any change.
3. User decides pricing (drives Phase 11 metering); user's About text.

## Testing / Validation Status

- `npm test`: 53/53 passing (includes new `src/lib/search.test.ts`). `tsc` and `eslint src` are clean at `00485c9`.
- `npm run build`: not run this session; Vercel production builds succeeded.
- **Browser** (local dev, Playwright + Edge, 1440 and 375):
  - search cards, keyboard, blur-close, `/`
  - landing list preview + phone fallback
  - typed headings
  - chat toolbar and menu
  - ThoughtLine/StatusMark on a temporary page
  - no overflow
- **Not tested**: anything needing a signed-in user (see Unfinished); Safari; Firefox; real phones.

## Relevant Architecture / Graphify Context

- **Search**: `lib/search.ts` holds pure logic plus `aiSearchPrompt` and `parseAiSearch`. `smartSearch` is in `app/actions.ts`; the UI is `components/home-search.tsx`, mounted in the `dashboard.tsx` header.
- **Chat streaming**: `streamReply` in `lib/ai.ts` (idle timeout, retries) → `/api/chat` → the `send` loop in `app-shell.tsx` → `chat/chat-panel.tsx` + `chat/thought-chain.tsx`.
- **Landing**: `app/landing/*`; `kit.tsx` holds shared motion, `Typed` and `SectionHead` (it imports no section).
- **New public routes** must be added to the allowlist in `src/proxy.ts`.
- Queries:
  - `graphify query "How does a chat answer stream from the model to the thought line?"`
  - `graphify query "What does the landing kit export and who uses it?"`

## Important Constraints

- **Ask before**:
  - adding a dependency
  - writing a migration
  - removing a feature
  - changing focus-timer behavior, chat storage, Supabase/env/API routes/auth or billing
- **Migrations**: give the user SQL to paste into Supabase; never write to Supabase or enter passwords.
- **Commits**: commit + push every important change to `main`; run tsc, lint and tests first; say "untested" when true.
- **Preview pages**: `src/app/login/*-preview/` are untracked (`.git/info/exclude`) and must never be committed. Delete throwaway preview pages after use.
- Test screenshots go in the scratchpad. Don't Prettier whole files. User-approved designs are authoritative.

## Next Recommended Task

**Signed-in live check, then the Phase 10 plan.**
- **Goal**: on `https://www.ericwei.me`, signed in:
  - a vague Home search (e.g. "anatomy stuff") returns Sonnet picks
  - a long chat task streams past 60s without cutting off
  - the thought line settles correctly
  - a Canvas sync shows the StatusMark spin → check

  Fix anything broken, then propose the Phase 10 plan (include `smartSearch` rate limiting).
- **Why**: this session's AI-facing work is only verified on preview pages without a user.
- **Done when**: all four behave live (or fixes are pushed), and a Phase 10 plan is proposed for approval.

## Tomorrow / New-Session Startup Prompt

"do resume protocol"
