# Project Handoff

> Updated 2026-09-26 (end of session 3), code through `1376355`. The code wins over this file. Product truth: `PRODUCT.md`. Plans: `docs/ROADMAP.md` (phases 0–9), `docs/COMMERCIAL-ROADMAP.md` (phases 10–16), `docs/PHASE-10-PLAN.md` (current phase, step by step).

## Project Summary

**Sonnet** is a student hub: Canvas sync, calendar, courses, materials, grades, focus timer, a customizable Home, and an AI (also named **Sonnet**) that knows every course down to the syllabus. Built by one college student; live at `https://www.ericwei.me`, multi-user (Supabase RLS). Stack: Next.js 16, Supabase, Vercel (Hobby, Fluid), OpenRouter (free models first), `motion`.

Direction: commercialization. **Phase 10 (launch readiness) is in progress.** The pricing shape is agreed; the price number waits for real cost data.

## Current State

- Live; every commit is pushed to `main`.
- Migrations 0001–0015 exist. **The user ran 0015** (and was given the `ai_spend` update that sets syllabus = 3). **0014 is unconfirmed**; ask. Nothing is confirmed live with a signed-in user yet.
- Signed-out `/` rewrites to `/landing`; signed-in `/` is Home.

## Completed This Session

- **`docs/PHASE-10-PLAN.md`**: the Phase 10 plan, with step 1 marked done.
- **Hourly rate limits (0014)**: `rate_hits` table plus `take_hit()`. `allowed()` in `src/lib/limit.ts` fails open.
  - Limits per user per hour: chat 60, smartSearch 60, syllabus AI 20, file uploads 60, Canvas sync 6.
  - A rejected upload's storage file is deleted.
- **Weekly allowance + cost metering (0015)**:
  - Tables `ai_usage` (one row per AI call: kind, weight, model, tokens, cost) and `plans` (no row = free; service role only).
  - SQL functions `usage_status()`, `ai_spend(kind)` (weights live in SQL) and `ai_settle(...)` (service role only, so students can't refund themselves).
  - Free: 40 uses/week, weeks start Monday 00:00 UTC. Once the week is spent, 3/day still work. Weights: chat 1, think 2, web search 2, **syllabus 3**; Home search AI costs 0 (metered for cost only).
  - Paid: shown as unlimited, with a hidden fair-use cap of 1000/week.
  - A use is charged up front and refunded when no AI answer comes (failure or canned task answer). This works through an `onEnd(Meter)` callback on `streamReply` and `complete` in `lib/ai.ts`; requests send `usage: {include: true}`.
  - Wired into `/api/chat` (429 + `SPENT` message), `askSyllabus` and `smartSearch` in `actions.ts`.
- **Credits pill** (`src/components/usage.tsx`):
  - `UsagePill` sits in the chat toolbar left of +. It shows a ring and the number left; amber at 20% or less; ∞ for paid.
  - Clicking it opens a popover: left/allowance, a bar, per-kind counts with their costs, the refill day and time in local time, and what's free.
  - `UsageCard` shows the same details in Settings → Account.
  - `usageStatus()` action returns the status plus `byKind`.
- **Fonts**: Archivo (text) and Abril Fatface (headings) replace IBM Plex Sans/Serif. IBM Plex Mono is kept. `.font-heading { font-synthesis-weight: none }`, because Abril has one weight.

## Important Decisions

- **Monetization shape** (agreed with the user):
  - Free users get a visible weekly allowance with weights; a daily floor keeps them from being shut off.
  - The paid tier is "unlimited" with a hidden fair-use cap. It will use the stronger model for heavy tasks, get priority when free models fail, and cost about $6–8/month or $20–25/term.
  - Keep AI cost under ~30% of the price. **Set the price only after 1–2 weeks of `ai_usage` data.**
- Canvas, calendar, grades, timer and Home search are always free.
- Rate limiting and metering use Postgres functions, **no new dependencies**. Both fail open when the database call errors.
- Error tracking and analytics are **deferred** until charging starts. The user asked why they're needed; the answer was "not yet". Plan: Next `onRequestError` + email, no Sentry.
- Still holding from earlier sessions:
  - No new dependencies without asking (`motion` and `lucide` only).
  - Honest landing: real screenshots only.
  - Search is keyword-first; the AI only handles the leftovers.

## Current Design System

- **Midnight Study** palette (tokens in `globals.css`): monochrome shell, off-white primary; the landing is always dark.
- **Type**: Archivo for text, Abril Fatface for `font-heading`, IBM Plex Mono for mono and the wordmark.
- **Color means something**: course hues, status (`--done`, `--warning`, `--destructive`) and data only. The credits pill uses `text-warning` when low.
- **Motion**: ease-out, low-bounce springs, never `scale(0)`, reduced motion respected. Hover color changes ease at 150ms.
- **Must not regress**: 44px tap targets on phones, no overflow at 375px, no hydration mismatches, readable contrast over the sky.

## In Progress / Unfinished Work

- **Untested live, signed in**:
  - The credits pill and Settings card.
  - The allowance: charge, refund, 429 when spent.
  - The hourly limits.
  - Home search AI, long answers, ThoughtLine, StatusMark (carried over from session 2).
- **Abril Fatface** may look heavy on small in-app titles (`text-base`/`text-xl` headings). Not checked signed in; the fallback is Abril for landing headlines only.
- **Needs the user**:
  - About text.
  - Legal review of the privacy/terms drafts (once written).
  - Accounts for Resend, uptime checks and Google OAuth.
  - Secret rotation.
- Phase 10 steps 2–9 are not started (see `docs/PHASE-10-PLAN.md`).

## Known Bugs / Issues

- Weeks reset Monday 00:00 UTC, which is Sunday evening in the US. The UI shows the local day and time; per-user time zones come later if needed.
- `visionText` (photo uploads) calls the AI but isn't metered.
- On a retry, only the last attempt's cost is logged.
- Dev-only hydration warnings from `VoiceBeam` and `MetalFx` (pre-existing).
- Local `next build` fails on the untracked `login/course-preview`. Rename it `_course-preview`; `rm -rf .next/dev/types` first.
- Free AI models are flaky (429/503). `graphify update .` can segfault (a background rebuild runs on commit).
- **Windows editing**: `globals.css` has mixed line endings; edit it byte-safely.
- `ChatInput` can't render outside `AppShell`, because the `useAssistant` context isn't exported. Preview pages must mock around it.

## Current Priorities

1. Signed-in live check of the credits pill, the allowance and the session 2 AI work.
2. **Phase 10 step 2: security pass.** RLS review of every table, CSP header (report-only first), `supply-chain-risk-auditor` + `npm audit`, and a secret-rotation checklist for the user.
3. Phase 10 step 3: account deletion and data export (touches auth, so ask first).
4. After 1–2 weeks: read the `ai_usage` costs, then set the price (Phase 11/12).

## Testing / Validation Status

- `npm test`: 53/53. `tsc` and `eslint` are clean on the touched files at `1376355`.
- **Browser**: the credits pill and popover were checked on a throwaway preview page with mock data (700px wide, dark). The landing fonts were checked locally with no overflow.
- **Not tested**: anything signed in; the SQL functions against the real database; Safari, Firefox, real phones.
- Useful SQL once live: `select kind, count(*), avg(cost), sum(cost) from ai_usage where settled group by kind;`

## Relevant Architecture / Graphify Context

- **Limits and metering**: `src/lib/limit.ts` (`allowed`, `spend`, `settle`, `LIMITED`, `SPENT`) sits on `migrations/0014` + `0015`. It's called from `api/chat/route.ts` and from `smartSearch`, `askSyllabus`, `addMaterial` and `syncCanvasNow` in `app/actions.ts`.
- **AI**: `lib/ai.ts` exports `complete(request, onEnd?)` and `streamReply(..., onEnd?)`, and the `Meter` type.
- **Usage UI**: `components/usage.tsx` → `chat/chat-input.tsx` (pill) and `settings-forms.tsx` (card).
- **Granting paid by hand**: `insert into plans (user_id) values ('<uuid>');`
- **New public routes** go in the `src/proxy.ts` allowlist (needed for `/privacy` and `/terms`).
- Query: `graphify query "How does an AI call get charged and settled against the weekly allowance?"`

## Important Constraints

- **Ask before**:
  - adding a dependency
  - writing a migration
  - removing a feature
  - changing focus-timer behavior, chat storage, Supabase/env/API routes/auth or billing
- **Migrations**: give the user the SQL to paste into Supabase, and **always also give a `create or replace` / delta version** for when the earlier SQL was already run. (The user was frustrated at having to ask for this.)
- Never write to Supabase or enter passwords.
- **Commits**: commit + push every important change to `main`; run tsc, lint and tests first; say "untested" when true.
- **Preview pages**: `src/app/login/*-preview/` are untracked and must never be committed; delete them after use.
- **Communication**: terse, and give copy-paste commands directly.

## Next Recommended Task

**Phase 10 step 2: security pass.**
- **Goal**: every table has RLS with correct `user_id` policies, a CSP header ships in report-only mode, dependency audit findings are triaged, and the user gets a secret-rotation checklist.
- **Why**: it's code-only, needs nothing from the user, and must be done before charging.
- **Done when**: an RLS report exists (fixes proposed as a migration, with approval), CSP is live in report-only with no violations on landing, chat or settings, and the audit is clean or its findings are documented.

## Tomorrow / New-Session Startup Prompt

"do resume protocol"
