# Project Handoff

> Updated 2026-09-26 (end of session), code through `5733d2b`. The code wins over this file. Product truth: `PRODUCT.md`. Plans: `docs/ROADMAP.md` (phases 0–9, done) and `docs/COMMERCIAL-ROADMAP.md` (phases 10–16, next).

## Project Summary

**Sonnet** is a student hub: Canvas sync, calendar, courses, materials, grades, focus timer, a customizable Home, and an AI (also named **Sonnet**) that knows every course down to the syllabus. Built by one college student; live at `https://www.ericwei.me`, multi-user (Supabase RLS). Stack: Next.js 16, Supabase, Vercel (Hobby), OpenRouter (free models), `motion`.

Direction: Phase 9 (polish + public landing page) is wrapping up. Next is commercialization, starting with Phase 10 (launch readiness). Pricing is **undecided**; the roadmap lists options only.

## Current State

- The app works on the live site (user-confirmed 2026-09-25). Migrations 0001–0013 applied.
- Signed-out `/` is rewritten to `/landing` (URL stays `/`); signed-in `/` is Home.
- The landing page was rebuilt this session and pushed, but only verified locally (Edge 1440 + 375), **not on the live site**.

## Completed This Session

- **Live check of the old landing + login** (start of session): both worked on the live site at desktop and phone width.
- **Landing rebuilt around the AI** (`src/app/landing/`). Why: the AI is the product's differentiator; the user wanted CodeForge-style (Magic UI template) animated, hands-on showcases. Sections:
  - **Hero:** a 5-tab rotating screenshot showcase with "Ask Sonnet" second.
  - **Works with:** a logo row.
  - **Sonnet AI:** syllabus-reading demo, "Ask anything" with sources, orbit, plan confirm card, flashcards, tools.
  - **How it works:** a 01–03 timeline (Canvas sync, files read, courses carousel).
  - **Features:** a bento of live demos (widgets, calendar, countdowns, Up next, study days) plus an "And the rest" list.
  - **Pricing** (honest "Free"), **FAQ**, **About**, closing CTA.
  - Demos replay each time they scroll back into view; section headings fade up like the hero; nav links smooth-scroll; FAQ answers animate open.
- **Nav:** a "What's included" dropdown (Sonnet AI, Features), How it works, Pricing, FAQ, About; a phone menu below 768px.
- **Continuous meadow sky** behind the landing. Why: seamless sections, tied to the login page's meadow.
  - Dusk meadow under the hero, crossfading to the same meadow at night (`public/landing/night.webp`, made with Higgsfield from the dusk photo, blurred).
  - Dimmed under the sections, fading to the solid theme color as Pricing scrolls in (FAQ and About solid).
  - The closing CTA has its own blurred night meadow fading in from solid.
  - Pure CSS scroll timelines, opacity only.
- **The AI is named Sonnet, app-wide.** The system prompt makes it introduce itself as Sonnet and talk **casually** (lowercase, minimal punctuation, exact facts; course codes and names keep capitals). UI strings say "Sonnet" instead of "the assistant". Why: user request, brand identity.
- **Landing screenshots refreshed** (Home with many widgets, a real chat answering from a syllabus, courses in the 8 distinct app hues). Why: the old Home shot showed few widgets and the courses looked repetitive.
- **Audit + fixes** (Ponytail, Chisle, Impeccable): shared `kit.tsx` (removes an import cycle that crashed the page once), 44px phone tap targets, hydration fixes, CSS study dots, unused screenshots deleted, `courseFace()` helper in `src/lib/course.ts`.
- **Docs:** new `docs/COMMERCIAL-ROADMAP.md`; `docs/ROADMAP.md` marks Phase 9 as wrapping up.

## Important Decisions

- **Honest landing:** only shipped features, sample data labeled, no fake stats or testimonials. Pricing says "Paid plans aren't decided yet" until the user decides.
- **AI first:** Sonnet AI gets the second hero tab and the first content section. Don't bury it.
- **One background layer** for the whole landing; never per-section photos, parallax or colored blobs. FAQ and About must sit on solid color (user request).
- **Section shells deliberately differ** (sticky split / timeline / bento + list) to avoid the "identical card grids" anti-reference. Don't re-unify them.
- **Only section headings fade on scroll** (user request); cards and blocks don't.
- **The grade calculator and timer are not showcased** on the landing (user decision); they stay in the "rest" list.
- The calendar demo's colored left border is flagged by the Impeccable detector as "side-tab"; kept on purpose (calendar convention).
- **Tooling:**
  - **Playwright:** its MCP needs Chrome (not installed); use `playwright-core` with `channel: 'msedge'` from the session scratchpad.
  - **Higgsfield images:** upload first (`higgsfield upload create`), then pass the returned id; passing a local file directly fails.

## Current Design System

- **Palette: Midnight Study** (tokens in `globals.css`). Monochrome shell: near-neutral dark greys and an off-white primary. The landing is always dark.
- **Color means something:** course hues (`HUES` in `src/lib/course.ts`, dot/bar/chip), status (done/soon/late) and data only. Buttons, nav and shell stay neutral. No decorative gradients. Glows are white at very low opacity.
- Course cards use `courseFace(hue)`. The `chip` utility (course codes, status words) appears on the landing and in a few app spots only.
- **Motion:** ease-out curves (`EASE` in `landing/kit.tsx`), springs with low bounce, never `scale(0)`; every animation respects reduced motion.
- **Typography:** unchanged from the app (heading serif for display, mono for readouts and codes).
- **Must not regress:** 44px tap targets on phones, no horizontal overflow at 375px, no hydration mismatches (demo data must be deterministic), readable contrast over the sky (content sits on solid card or background colors).

## In Progress / Unfinished Work

- **Incomplete / unverified:**
  - The new landing on the live site (Safari scroll timelines especially).
  - Sonnet's casual voice in a real chat (prompt change only).
- **Needs the user:** the About text was written by Claude; the user should put it in their own words and name.
- **Deferred:** Google sign-in (Supabase provider + OAuth), then re-enable the disabled button in `login/form.tsx`.
- **Planned, not approved yet:** everything in `docs/COMMERCIAL-ROADMAP.md` (phases 10–16), grade goals (migration), saving the syllabus chip (migration).

## Known Bugs / Issues

- Local `next build` fails on the untracked `login/course-preview` (`useSearchParams` without Suspense). Rename it `_course-preview` to build; `rm -rf .next/dev/types` first.
- Dev-only on preview pages: a hydration warning from the chat send button (MetalFx) and chat save errors (no user, RLS). Expected.
- Free AI models are unreliable (429/503). `graphify update .` can segfault.
- The in-app browser pane renders black after scripted scrolls; the Read tool can show a cached image when a screenshot is overwritten under the same name.

## Current Priorities

1. Live check of the landing (desktop + phone; Chrome, Safari, Firefox fallback).
2. Get the user's About text.
3. Phase 10 plan (hosting, legal pages, monitoring, rate limits), proposed before any change.
4. User decides the pricing shape early (drives Phase 11 usage metering).

## Testing / Validation Status

- **Unit tests:** `npm test` 48/48 passing (last run after the Sonnet rename and audit fixes).
- **Type check and lint:** `tsc` clean and `eslint src` clean at the last code commit.
- **Build:** `npm run build` was **not run this session**.
- **Browser (local dev, Playwright + Edge, 1440×900 and 375×812):**
  - every landing section and demo interaction
  - animations replaying when scrolling back
  - smooth nav scrolling, FAQ animation
  - dropdown (`aria-expanded`, Escape) and phone menu
  - arrow-key tabs
  - no tap targets under 44px on phone
  - no horizontal overflow
  - no console or hydration errors
  - sky layer opacities at each section
- **Impeccable audit:** 15/20 before fixes; all findings then fixed. The detector's only remaining finding is the intentional side-tab.
- **Ponytail/Chisle audit:** run; findings applied.
- **Not tested:** the live site after today's changes, Safari, Firefox, a real iPhone or Android, real chat replies in the new voice.

## Relevant Architecture / Graphify Context

- **Landing:** `page.tsx` (sections, sky layers, FAQ/Pricing/About), `nav.tsx`, `hero.tsx`, `ai.tsx`, `showcase.tsx`, `features.tsx`, `kit.tsx` (shared; imports no section). Sky, FAQ and scroll CSS sit at the end of `src/app/globals.css`.
- **Public routes:** an allowlist in `src/proxy.ts` (new public routes must be added there).
- **AI behavior:** `RULES` in `src/lib/ai.ts`; the chat UI in `src/components/chat/*` and `app-shell.tsx`.
- **Useful queries:**
  - `graphify query "What does the landing kit export and who uses it?"`
  - `graphify query "How does the proxy decide public vs signed-in routes?"`
  - `graphify query "Where is the AI system prompt and how are chat requests streamed?"`
  - `graphify explain "Carousel"`

## Important Constraints

- **Ask before:** adding a dependency, writing a migration, removing a feature, changing focus-timer behavior, chat storage, Supabase/env/API routes/auth, billing.
- **Migrations:** give the user SQL to paste into Supabase; never write to Supabase or enter passwords.
- **Commits:** commit + push every important change straight to `main`; run tsc, lint and tests first; say "untested" when true.
- **Preview pages:** `src/app/login/*-preview/` are untracked (`.git/info/exclude`); never commit them. Landing screenshots come from `dash-preview` (`?v=courses`, `?v=chat`), captured at 1920×1200 @1.125.
- **Windows editing:** edit files byte-safely; for big edits, use Python script files (heredoc `\n` can become real newlines). Don't Prettier whole files.
- **Test screenshots:** keep them in the scratchpad, never the repo root.
- **Style:** user-approved designs are authoritative. Keep the landing honest, calm and AI-first.

## Next Recommended Task

**Live verification of the rebuilt landing page.**
- **Goal:** on `https://www.ericwei.me` signed out, check every section at desktop and phone widths in Chrome and Safari (and Firefox for the static-sky fallback): hero tabs, the sky crossfade, demos, nav dropdown and phone menu, FAQ animation, closing CTA. Fix anything broken.
- **Why:** today's large changes were only verified on localhost; this is the public face, and Phase 10 builds on it.
- **Done when:** the landing looks and behaves right live on both widths (or fixes are pushed), and the Testing section is updated.
- **Files:** `src/app/landing/*`, the end of `src/app/globals.css`.

## Tomorrow Startup Prompt

"Read `CLAUDE.md`, then `HANDOFF.md`. Use Graphify before any broad source exploration and read only the minimum files needed; trust the current code over anything stale in the handoff and tell me what's stale. Use the project skills where they fit: Graphify to locate architecture and files, UI Skills for UI critique and guidance, Impeccable for substantial UI polish or design-system work, Chisle to keep implementation lean, Ponytail to simplify after implementing. Briefly summarize the current state and the next task, then continue with the Next Recommended Task."
