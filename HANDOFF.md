# Project Handoff

> Updated 2026-09-26, through commit `a12ea7f`. The code wins over this file if they disagree. Product truth: `PRODUCT.md`. Code structure: ask Graphify (`graphify-out/`). `docs/ROADMAP.md` Phase 9 "term" line is stale (done).

## Project Summary

**Sonnet** is a student hub: courses, deadlines, calendar, materials, grades, a focus timer and an AI assistant in one **minimal** app. Built by one college student (vibecoding on Windows). Live at `https://www.ericwei.me`, multi-user (RLS per user).

- **Stack:** Next.js 16 App Router, Supabase (Postgres + RLS, Auth, Storage), Vercel (Hobby), OpenRouter (free models), Recharts via vendored EvilCharts, `motion` for animation.
- **Direction:** Phase 9 = polish and real use, plus a **public landing page** (built this session). Paid plans / pricing: still undecided; don't build unasked.

## Current State

Everything in the app works on the live site (user confirmed signed in, 2026-09-25). Signed-out visitors to `/` now see the landing page; `/login` has a meadow backdrop. Migrations 0001–0013 applied.

## Completed This Session

- **Midnight Study palette** (replaced Paper & Ink; user-approved exact values in `globals.css`). Monochrome shell: chroma-0 dark greys (bg 0.18, sidebar 0.195, card 0.21), off-white text; `--primary` (= `--brand`) is off-white in dark / ink in light, so primary buttons and "now"/today markers are neutral. Theme follows system. Contrast measured with a real luminance script (all AA).
- **Course colors:** 8 hues, saturated "Folio-like": `--course-l/c` 0.70/0.17 dark, 0.58/0.17 light. `HUES = [250, 35, 150, 295, 80, 195, 350, 115]` (spread order, blue first, so the first courses differ). Course-card faces use `oklch(0.82 0.15 h) → oklch(0.72 0.17 h)`. The user recolored their own courses via SQL; other users keep old stored hues.
- **Status colors:** done `0.74 0.17 160`, soon `0.80 0.16 70`, late `0.70 0.17 32` (dark; light variants in `globals.css`).
- **`chip` utility** (`globals.css`, set `--chip`): 16% tint, same-hue text mixed toward ink (oklab), 60% border. Used only on Up next course code + status labels, the chat WorkCard late label, and the landing page. Everywhere else course = dot + text (deliberately not changed).
- **Work mix** exam/quiz = neutral ink shades.
- **Home grid** (`snap-grid.tsx`): cells stretch (separate `sx`/`sy`) to fill any resolution; outside edit mode only the widgets' bounding box is used, so unused edge cells don't leave dead space. Edit mode shows the full grid.
- **Sidebar:** open rail shows `+` · wide "Chat" pill (icon + label) · timer at right; collapsed stays stacked icons.
- **Mobile keyboard (iOS):** `useVisibleViewport()` in `app-shell.tsx` writes `--vvh`/`--vvtop` from `visualViewport`; phone top bar, `/chat` page and assistant sheet size to it so the chat stays above the keyboard (ChatGPT-style). Android: `viewport.interactiveWidget = "resizes-content"`. Fields ≥16px on phones (no iOS zoom).
- **Dictation:** fails in Brave/Arc/Opera (no speech service); toast now says so and suggests Chrome/Edge/Safari or Win+H. User declined a server-side STT.
- **Login page:** Google button disabled with a "soon" sticker + note (Google OAuth not set up; `google` action kept). Blurred meadow backdrop (`public/login/meadow.webp`) and abstract dark pitch panel (`abstract.webp`), both Higgsfield-generated (Z Image; Soul Location needs a paid plan). Pitch panel forced `dark`. One `h1`, header/footer, JSON-LD.
- **SEO/tech hardening:** security headers + `poweredByHeader: false` in `next.config.ts` (X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy with `microphone=(self)` for dictation); `manifest.ts`, `icon.tsx`, `apple-icon.tsx` ("s." mark); theme-color. `images.qualities: [75, 90]`.
- **Landing page** `src/app/landing/` (always dark): proxy **rewrites** signed-out `/` → `/landing` (URL stays `/`); signed-in `/` = Home. Sections: floating nav pill, meadow hero, "works with", pitch, feature bento (big Up-next illustration + 5 features = 3 full rows), 3 steps, FAQ (`<details>`), closing CTA, footer. `hero.tsx`: Watermelon landing-01-style animation (staggered fade-up, fan of 8 real screenshots blurring in, hover lifts, **click opens a full-size Dialog with prev/next + arrow keys**). Screens in `public/landing/*.webp` (2160px q90, sample data from local preview pages). Sitemap includes `/`; robots allows `/$` and `/login`.
- **Reverted:** Aceternity container-scroll + self-contained interactive demo (user: "doesn't look good").

## Important Decisions

- **Palette = Midnight Study.** Color only means: a course, a status, data. Shell/nav/buttons neutral. No chart gradients. Aliases (`--brand`, `--chart-1/2`, `--sidebar-*`, `--warning-fill`) live in `:root` only (next-themes puts `.dark` on `<html>`).
- **Status vs course with shared hue** (amber/green): distinguished by form (status = word/icon/chip, course = dot/bar/block), not hue alone.
- **Landing = honest:** only shipped features, no stats/testimonials/pricing; screenshots captioned "sample data". Landing is always dark; Dialog content needs `dark` class (portal is outside the wrapper).
- **Don't install whole shadcn templates** (landing-01 pulled react-router-dom + 3 icon libs and would overwrite `button`/`checkbox`); port the needed part with `motion/react` instead. Same for `framer-motion` → use installed `motion`.
- **Public paths** are an allowlist in `src/proxy.ts` (`/login`, `/landing`, `/auth`, `/api/cal`, `/api/cron`, robots, sitemap, OG image, `/icon`, `/apple-icon`, `/manifest.webmanifest`). New public metadata routes must be added there or they redirect to `/login`.
- Carried over: AI never saves without a confirm card; slow work via `/api/tasks`; Canvas HTML never injected; honest UI/empty states carry `data-empty`; EvilCharts config keys CSS-safe; chart widgets lazy; Sonner toast CSS left alone; kept on purpose: `evil-buttons/`, `spring.ts`, `cn`.

## In Progress / Unfinished Work

Nothing half-built. Open options (ask first):
- Landing: a true month-view screenshot (capture came out identical to week; dropped); optional rotating headline word; pricing section only once SaaS plans are decided.
- Google sign-in setup (Supabase provider + OAuth + redirect URLs), then undo the disabled button in `login/form.tsx`.
- Later/ask first: grade goals (migration), saving the syllabus chip (migration), a `DESIGN.md` (`/impeccable document`) reflecting Midnight Study.

## Known Bugs / Issues

- Local `next build` fails on the untracked `login/course-preview` (`useSearchParams` without Suspense). Build with it renamed `_course-preview`, and `rm -rf .next/dev/types` first (stale dev types break type-check).
- Hydration mismatch in dev on pages with the docked chat panel (BorderBeam size) + harmless next-themes script warning.
- Impeccable (pre-existing, not from this session): low-contrast false positives on stacked course cards, "cyan gradient" on course faces (hue 195), some cramped-padding/nested-card/Sonner layout-transition findings.
- `X-Frame-Options: DENY` blocks iframes of the site (intended; remember when testing).
- Free AI models unreliable (429/503); Safari only partly supports scrollbar styling; `graphify update .` can segfault.
- The browser preview pane often renders black bands/timeouts after scripted scrolls and pauses animations when hidden; verify with JS measurements.

## Current Priorities

1. Live check of the landing page (signed out) and login on desktop + phone, incl. the hero Dialog and image sharpness.
2. iPhone check of the chat keyboard behavior (only simulated so far).
3. Further polish the user points at.

## Important Constraints / User Intent

- Minimal, calm, readable ("Moleskine not SaaS"); the user likes Folio's black shell + colorful content. Reviews screenshots and asks for specific fixes; reverts things that don't look good.
- Workflow: commit + push every important change straight to `main` (Vercel). Run tests/lint/tsc (separately) before committing. Say "untested" when true.
- **Ask before:** adding a dependency, writing a migration, removing a feature, changing focus-timer behavior, chat storage, Supabase/env/API routes/auth. (Proxy public-path edits were done with the user's implied approval for landing/icons.)
- User-approved design specs are authoritative; apply exactly, report conflicts.
- Migrations/data fixes: give the user SQL to paste into Supabase; Claude never writes to Supabase or enters passwords.
- Local preview pages `src/app/login/*-preview/` are untracked (`.git/info/exclude`); never commit. `dash-preview` (`?s=`, `&t=`, `?v=courses`), `cal-preview?show=calendar`, `course-preview`, `settings-preview`.
- Windows: edit files byte-safely (some CRLF); never Prettier whole files. **Python edit scripts: build the new content fully before `open(p,'wb')`** (a failed write truncated a file this session). Use Edge for puppeteer/Impeccable; puppeteer lives in the session scratchpad, not the project.

## Testing / Validation Status

- `npm test` 48 passing; `tsc` clean; `npm run lint` clean; `npm run build` passes (course-preview excluded).
- Verified locally (signed out, sample data): palette light/dark, chips contrast (measured), Home grid fill at 2000px, sidebar Chat pill, login backdrops light/dark, mobile pages at 375px (no horizontal overflow), assistant sheet with simulated keyboard, landing sections/bento/hero animation/hover/Dialog + arrow keys, icons/manifest served, security headers.
- User confirmed on live: signed-in app, Home grid fix.
- **Not verified:** landing + login on the live site; real iPhone keyboard; Android; Safari; dictation error toast (no mic in pane).

## Relevant Architecture Context

- Theme tokens, `chip` utility, base rules: `src/app/globals.css`; fonts/viewport: `src/app/layout.tsx`; course colors: `src/lib/course.ts`.
- Auth gate + landing rewrite: `src/proxy.ts`. Landing: `src/app/landing/{page,hero}.tsx`. Login: `src/app/login/{page,form}.tsx`.
- Home: `dashboard.tsx` + `snap-grid.tsx`; shell: `app-shell.tsx` (visual viewport hook, assistant sheet), `sidebar.tsx`; chat: `components/chat/*`.
- Queries: `graphify query "How does the proxy decide public vs signed-in routes?"`, `graphify query "Where are theme tokens and chip styles used?"`, `graphify query "How does the Home snap grid lay out widgets?"`.

## Next Recommended Task

**Live verification of the landing and login pages.**
- **Goal:** signed out on `https://www.ericwei.me`, check `/` (hero animation, fan, click-to-expand Dialog, image sharpness, sections, FAQ, CTAs → `/login?mode=signup`) and `/login` (meadow, pitch panel, disabled Google button) at desktop and phone widths; fix anything broken.
- **Why:** it's the public face and was only verified on localhost.
- **Done when:** both pages look right on live at both widths (or fixes are pushed) and the Testing section is updated.

## Suggested New-Session Prompt

"Read `CLAUDE.md` and `HANDOFF.md`. Use Graphify before broad source exploration and read only the minimum relevant files. If the handoff conflicts with the code, trust the code and tell me what's stale. Then continue with the Next Recommended Task."
