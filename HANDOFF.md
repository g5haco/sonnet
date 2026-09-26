# Project Handoff

> Updated 2026-09-26, through commit `ee1de79` (+ this docs commit). The code wins over this file if they disagree. Product truth: `PRODUCT.md`. Code structure: ask Graphify (`graphify-out/`). Plans: `docs/ROADMAP.md` (phases 0–9, done) and **`docs/COMMERCIAL-ROADMAP.md` (phases 10–16, next)**.

## Project Summary

**Sonnet** is a student hub: courses, deadlines, calendar, materials, grades, a focus timer and an AI (named **Sonnet**) that knows your courses down to the syllabus. Built by one college student (vibecoding on Windows). Live at `https://www.ericwei.me`, multi-user (RLS per user).

- **Stack:** Next.js 16 App Router, Supabase (Postgres + RLS, Auth, Storage), Vercel (Hobby), OpenRouter (free models), Recharts via vendored EvilCharts, `motion` for animation.
- **Direction:** Phase 9 (polish + public landing page) is wrapping up. Next is commercialization (Phase 10: launch readiness). Pricing is still undecided: the roadmap lists options, the user decides.

## Current State

App works on the live site. Signed-out visitors to `/` see the landing page (proxy rewrite to `/landing`); `/login` has the meadow backdrop. Migrations 0001–0013 applied. The landing page was verified locally in Edge (desktop 1440 + phone 375) after every change; the latest landing changes have **not** been checked on the live site yet.

## Completed This Session (2026-09-26)

**Landing page, rebuilt around the AI** (`src/app/landing/`):
- `page.tsx` order: nav → hero → works-with → **Sonnet AI** (`ai.tsx`) → **How it works** (`showcase.tsx`) → **Features** (`features.tsx`) → Pricing → FAQ → About → closing CTA → footer.
- **Hero** (`hero.tsx`): copy fades up; a 5-tab rotating screenshot showcase (Home, Ask Sonnet, Calendar, Courses, Course), 3s per tab with a progress bar, pauses on hover, arrow-key tabs. Screens are 2160px webp in `public/landing/` captured from the local preview pages (see Constraints).
- **Works with:** a bordered logo row (Canvas, Google Calendar, Syllabus PDFs, Slides and readings); the Canvas and Calendar marks are hand-drawn monochrome SVGs, not official logos.
- **Sonnet AI section** (sticky left intro + flicker strip): syllabus-reading demo, "Ask anything" streamed answers with sources (leads with "Break down Paper 1"), rotating orbit of what it knows, "Plan my week" confirm card, flip flashcards, a tools list.
- **How it works:** numbered 01–03 timeline: Canvas sync demo, files being read, the real Home courses carousel (fixed sample date).
- **Features:** bento of live demos (widgets you can toggle/shuffle, day/week/month calendar, ticking countdowns, tappable Up next, study-days dots) + "And the rest" plain list.
- **Nav** (`nav.tsx`): "What's included" dropdown (Sonnet AI, Features; `aria-expanded`, Escape/outside click), How it works, Pricing, FAQ, About; a phone menu below `md`.
- **Pricing:** one honest "Student · Free" card; "Paid plans aren't decided yet." **About:** two paragraphs written by Claude about a college student builder; the user should check the wording.
- **Motion:** section headings fade up like the hero and replay both ways; demos replay each time they scroll back in; smooth scrolling for nav links; animated FAQ answers (`::details-content`); everything respects reduced motion.
- **Background:** one fixed sky (`page.tsx` + `.sky-*` in `globals.css`): the dusk meadow behind the hero crossfades to the same meadow at night (`public/landing/night.webp`, Higgsfield Nano Banana from the dusk photo, blurred 12px), dimmed to 0.8 under the sections, fading to the solid theme color as Pricing scrolls in (FAQ and About are solid). The closing CTA has its own blurred night meadow fading in from solid. CSS scroll timelines, opacity only; browsers without them show the dim night sky.
- Shared pieces live in `kit.tsx` (SectionHead, Caption, Window, FlickerStrip, Orbit, Rise, `useSequence`, `useAutoCycle`, `CHIP`, EASE/VIEW). `kit.tsx` imports no section, so there are no import cycles.

**The AI is named Sonnet** (app-wide): system prompt says to introduce itself as Sonnet; it talks **casually** (all lowercase, minimal punctuation, exact facts; course codes/names/code keep capitals). UI labels say "Sonnet" (chat panel header, Ctrl+K button, errors, materials, syllabus summary, tour).

**Small app changes:** `courseFace(hue)` in `src/lib/course.ts` (course card gradient, shared with the landing).

**Audit fixes** (Ponytail/Chisle/Impeccable audit → 15/20, then all findings fixed): unused screenshots deleted, 44px phone tap targets, hydration mismatches fixed (fixed demo date; `Math.sin` values rounded because the server and browser differ in the last digits), CSS study dots instead of 126 motion nodes.

## Important Decisions

- **The landing is honest:** only shipped features, sample data labeled, no stats/testimonials; pricing says undecided. The detector flags the calendar demo's colored left border ("side-tab"); kept on purpose (calendar convention).
- **AI first:** Sonnet AI is the main product; it gets the second hero tab and the first content section.
- **Background = one layer**, never per-section images or colored gradient blobs (palette: color only for courses/status/data).
- Section shells deliberately differ (sticky split / timeline / bento + list) to avoid the "identical card grid" anti-reference.
- Carried over: Midnight Study palette; AI never saves without a confirm card; public paths are an allowlist in `src/proxy.ts`; don't install whole shadcn templates; `framer-motion` → use installed `motion`.

## In Progress / Unfinished Work

Nothing half-built. Open items:
- Live check of the new landing (desktop + phone), esp. the scroll-driven sky in Safari and the phone menu.
- The About text needs the user's own words/name.
- Google sign-in setup, then re-enable the button in `login/form.tsx`.
- Next phase: **Phase 10 — Launch readiness** (see `docs/COMMERCIAL-ROADMAP.md`). First real blocker: Vercel Hobby doesn't allow commercial use; move to Pro before charging.

## Known Bugs / Issues

- Local `next build` fails on the untracked `login/course-preview` (`useSearchParams` without Suspense). Build with it renamed `_course-preview`; `rm -rf .next/dev/types` first.
- Dev-only: hydration warning on preview pages with the docked chat (MetalFx / BorderBeam) + next-themes script warning. Chat saves fail on preview pages (RLS, no user); expected.
- The Next.js dev overlay can keep showing "1 issue" from an earlier hot reload; reload the page before trusting it.
- Free AI models are unreliable (429/503); Safari only partly supports scrollbar styling; `graphify update .` can segfault.
- The browser pane renders black after scripted scrolls and freezes animations; verify with Playwright + Edge instead (see Constraints). The Read tool can show a **cached** image when a screenshot is rewritten to the same path; use new filenames.
- Higgsfield CLI: passing a local file to `generate create --image` fails (S3 signature error); run `higgsfield upload create <file>` first and pass the returned id. Credits left ≈ 7.7 (free plan).

## Current Priorities

1. Live check of the landing on desktop + phone (Chrome, Safari, Firefox fallback).
2. Start Phase 10 (hosting plan, legal pages, monitoring, abuse limits) after the user approves.
3. Decide pricing shape (Phase 12 decision point) early; it drives Phase 11 metering.

## Important Constraints / User Intent

- Minimal, calm, readable ("Moleskine not SaaS"); likes Folio's black shell + colorful content, CodeForge-style animated showcases. Reviews screenshots and asks for specific fixes; reverts what doesn't look good.
- Workflow: commit + push every important change straight to `main` (Vercel). Run tsc, lint, tests (separately) before committing. Say "untested" when true.
- **Ask before:** adding a dependency, writing a migration, removing a feature, changing focus-timer behavior, chat storage, Supabase/env/API routes/auth, billing.
- Migrations/data fixes: give the user SQL to paste into Supabase; Claude never writes to Supabase or enters passwords.
- Local preview pages `src/app/login/*-preview/` are untracked (`.git/info/exclude`); never commit. `dash-preview` now uses the app's 8 hues, 8 courses, a richer Home layout and `?v=chat` (full-page chat); landing screenshots are captured from it with Playwright at 1920×1200 @1.125 (→ 2160×1350) and a routed `/api/chat` for the chat shot.
- Verification: Playwright is not usable through its MCP (needs Chrome); use `playwright-core` from the session scratchpad with `channel: 'msedge'`.
- Windows: edit files byte-safely; build new content fully before writing. Heredocs with `\n` inside Python strings can turn into real newlines; prefer script files for big edits.

## Testing / Validation Status

- `npm test` 48 passing; `tsc` clean; `npm run lint` clean.
- Verified locally (Edge, 1440 + 375): all landing sections, demos and interactions, replaying animations, smooth nav scroll, FAQ animation, dropdown + phone menu, arrow-key tabs, tap targets ≥ 44px on phone, no horizontal overflow, no console/hydration errors, sky opacities at each section.
- **Not verified:** the new landing on the live site; Safari (scroll timelines); real iPhone chat keyboard; Android; Sonnet's casual voice in a real chat (prompt change only).

## Relevant Architecture Context

- Landing: `src/app/landing/{page,nav,hero,ai,showcase,features,kit}.tsx`; sky + FAQ + scroll CSS at the end of `src/app/globals.css`.
- AI prompt: `RULES` in `src/lib/ai.ts`. Theme tokens: `globals.css`; course colors: `src/lib/course.ts`.
- Auth gate + landing rewrite: `src/proxy.ts`. Home: `dashboard.tsx` + `snap-grid.tsx`; carousel: `components/carousel.tsx`.
- Queries: `graphify query "How does the proxy decide public vs signed-in routes?"`, `graphify query "What does the landing kit export and who uses it?"`.

## Next Recommended Task

**Phase 10 — Launch readiness** (after a live check of the landing).
- **Goal:** a setup that can legally and safely take payments: Vercel Pro + Supabase Pro, Privacy Policy + Terms pages, account deletion + export, error monitoring, rate limits on AI/upload routes.
- **Why:** Vercel Hobby forbids commercial use; Stripe and students will expect legal pages and data controls.
- **Done when:** every Phase 10 bullet in `docs/COMMERCIAL-ROADMAP.md` is shipped or explicitly deferred by the user.

## Suggested New-Session Prompt

"Read `CLAUDE.md` and `HANDOFF.md`, then `docs/COMMERCIAL-ROADMAP.md`. Use Graphify before broad source exploration and read only the minimum relevant files. If the handoff conflicts with the code, trust the code and tell me what's stale. Start with a live check of the landing page, then propose the Phase 10 plan before changing anything."
