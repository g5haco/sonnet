# Graph Report - sonnet  (2026-09-23)

## Corpus Check
- 82 files · ~51,547 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 631 nodes · 1414 edges · 62 communities (25 shown, 37 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 68 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bf5fde6f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- courses.tsx
- calendar.tsx
- app-shell.tsx
- app/actions.ts
- ai.ts
- devDependencies
- compilerOptions
- rows.ts
- canvas.ts
- components.json
- HANDOFF.md (project handoff, most complete doc)
- carousel.tsx
- ROADMAP.md (phase status, most current)
- Global AI assistant (Sonnet)
- Phase 3: AI assistant
- Student Hub design spec v1
- react-dom
- PRODUCT.md
- login/actions.ts
- dependencies
- v1.5 spec: shell, AI panel, calendar, materials
- unpdf
- public.calendar_feed
- 0001_init.sql
- app/layout.tsx
- public.materials
- public.class_meetings
- proxy.ts
- public.canvas_connections
- class-variance-authority
- cn
- date-fns
- eslint.config.mjs
- gsap
- @gsap/react
- liquid-gooey
- lucide-react
- metal-fx
- motion
- next
- next.config.ts
- next-themes
- @radix-ui/react-use-controllable-state
- react
- react-markdown
- remark-gfm
- shadcn
- @supabase/ssr
- @supabase/supabase-js
- thinking-orbs
- tw-animate-css
- voice-glow
- postcss.config.mjs
- vercel.json
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (env var)
- NEXT_PUBLIC_SUPABASE_URL (env var)
- Ponytail minimal code philosophy
- Rejected: editing Supabase email template
- settings table
- public.courses
- public.items
- public.settings

## God Nodes (most connected - your core abstractions)
1. `HANDOFF.md (project handoff, most complete doc)` - 37 edges
2. `createClient()` - 35 edges
3. `courseColor()` - 33 edges
4. `cn()` - 19 edges
5. `ROADMAP.md (phase status, most current)` - 19 edges
6. `Item` - 17 edges
7. `dayKey()` - 17 edges
8. `useAssistant()` - 17 edges
9. `done()` - 16 edges
10. `compilerOptions` - 16 edges

## Surprising Connections (you probably didn't know these)
- `streamReply()` --implements--> `NDJSON streaming protocol (think, text, propose, cards, error)`  [INFERRED]
  src/lib/ai.ts → HANDOFF.md
- `OpenRouter free models fallback chain (Nemotron 3 Super -> Qwen 3.8 27B -> Nemotron 3 Ultra)` --semantically_similar_to--> `Vercel AI SDK + Anthropic (claude-haiku-4-5 / claude-sonnet-5), <=$10/month`  [INFERRED] [semantically similar]
  HANDOFF.md → docs/superpowers/specs/2026-09-22-student-hub-design.md
- `toIcs()` --implements--> `Google Calendar ICS subscribe feed (one-way)`  [INFERRED]
  src/lib/calendar.ts → HANDOFF.md
- `useAssistant()` --implements--> `Global AI assistant (Sonnet)`  [INFERRED]
  src/components/app-shell.tsx → HANDOFF.md
- `AppShell()` --implements--> `App shell (sidebar rail, AI panel, floating windows)`  [INFERRED]
  src/components/app-shell.tsx → HANDOFF.md

## Import Cycles
- 3-file cycle: `src/components/app-shell.tsx -> src/components/chat/chat-panel.tsx -> src/components/chat/markdown.tsx -> src/components/app-shell.tsx`
- 3-file cycle: `src/components/app-shell.tsx -> src/components/chat/chat-panel.tsx -> src/components/chat/widgets.tsx -> src/components/app-shell.tsx`
- 4-file cycle: `src/components/app-shell.tsx -> src/components/chat/chat-panel.tsx -> src/components/chat/markdown.tsx -> src/components/chat/widgets.tsx -> src/components/app-shell.tsx`

## Hyperedges (group relationships)
- **Canvas sync pipeline** — handoff_canvas_module, handoff_api_cron_canvas_route, handoff_supabase_admin_client, handoff_table_canvas_connections, handoff_env_canvas_encryption_key, handoff_env_cron_secret [EXTRACTED 1.00]
- **AI proposal -> confirm card -> apply flow** — src_lib_ai_tools, src_lib_ai_toproposal, src_lib_ai_streamreply, src_components_chat_proposal_card_applyproposal, handoff_confirm_cards [INFERRED 0.85]
- **AI speed/quality decisions** — handoff_openrouter_free_models, handoff_reasoning_rule, handoff_calendar_grounding, src_lib_ai_needsthinking [INFERRED 0.85]

## Communities (62 total, 37 thin omitted)

### Community 0 - "courses.tsx"
Cohesion: 0.10
Nodes (41): addMaterial(), useCreate(), useOpenSettings(), Block(), CourseCard, CourseFace(), courseStats(), ADD (+33 more)

### Community 1 - "calendar.tsx"
Cohesion: 0.07
Nodes (62): RFC-5545, GET(), ADD, Calendar(), CalendarBody(), clock(), EASE, GridProps (+54 more)

### Community 2 - "app-shell.tsx"
Cohesion: 0.06
Nodes (43): Rejected: offsetParent visibility checks, Assistant, AssistantContext, Course, CreateContext, Schedule, SettingsContext, useAssistant() (+35 more)

### Community 3 - "app/actions.ts"
Cohesion: 0.08
Nodes (55): createCourse(), createItem(), createMeeting(), deleteChat(), deleteCourse(), deleteItem(), deleteMaterial(), deleteMeeting() (+47 more)

### Community 4 - "ai.ts"
Cohesion: 0.11
Nodes (25): Accent 'oscilloscope cyan' means 'you, now', Proposal / confirm cards, Honest UI: no fake data; placeholders say what's coming, Rejected: pull()-based ReadableStream parser, Design principles (readouts not reports; color means something; everything answers back; calm by default; never lose trust), maxDuration, POST(), calendarLines() (+17 more)

### Community 5 - "devDependencies"
Cohesion: 0.07
Nodes (28): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+20 more)

### Community 6 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 7 - "rows.ts"
Cohesion: 0.20
Nodes (20): CalendarPage(), metadata, Chat(), metadata, CoursePage(), generateMetadata(), CoursesPage(), metadata (+12 more)

### Community 8 - "canvas.ts"
Cohesion: 0.14
Nodes (23): syncCanvasNow(), GET(), maxDuration, CanvasAssignment, CanvasCourse, CanvasItem, canvasPages(), CanvasSettings (+15 more)

### Community 9 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 10 - "HANDOFF.md (project handoff, most complete doc)"
Cohesion: 0.16
Nodes (19): HANDOFF.md (project handoff, most complete doc), GET /api/cal/[token] ICS feed, GET /api/cron/canvas (daily Vercel Cron 11:00 UTC), src/lib/canvas.ts (REST/ICS normalization, encryption, sync), Canvas sync (access token + ICS feed), CANVAS_ENCRYPTION_KEY (env var), CRON_SECRET (env var), SUPABASE_SECRET_KEY (env var) (+11 more)

### Community 11 - "carousel.tsx"
Cohesion: 0.27
Nodes (15): ANGLE, Card(), Carousel(), out(), PERIOD, Slide, Spot, spotOf() (+7 more)

### Community 12 - "ROADMAP.md (phase status, most current)"
Cohesion: 0.17
Nodes (16): ROADMAP.md (phase status, most current), Differentiator ideas (after-class check-in, start-by planning, crunch forecast, Sunday reset), Phase 4: Calendar, Phase 5: Canvas sync, Phase 6: Materials + syllabus import, Phase 7: Grades + what-if, Phase 8: Focus timer & heatmap, Phase 9: Polish (+8 more)

### Community 13 - "Global AI assistant (Sonnet)"
Cohesion: 0.13
Nodes (17): SaaS step (later), Global AI assistant (Sonnet), POST /api/chat (src/app/api/chat/route.ts), Calendar + class-week grounding in prompt, Canvas descriptions labeled untrusted data, Do-not-change rules (§19, §26), AI_API_KEY (env var), AI_BASE_URL (env var) (+9 more)

### Community 14 - "Phase 3: AI assistant"
Cohesion: 0.50
Nodes (4): Phase 3: AI assistant, Saved chat history (/chat), Flashcards (make_flashcards deck, never saved), chats table

### Community 15 - "Student Hub design spec v1"
Cohesion: 0.29
Nodes (8): Next.js 16 breaking-changes rule (read node_modules/next/dist/docs), Phase 0: Foundation, Phase 1: Items & progress, Phase 0 Foundation plan (historical), Student Hub design spec v1, Vercel AI SDK + Anthropic (claude-haiku-4-5 / claude-sonnet-5), <=$10/month, Progress block (caught-up %, weekly bars), Proxy (src/proxy.ts, Next 16 renamed middleware)

### Community 17 - "PRODUCT.md"
Cohesion: 0.18
Nodes (8): AGENTS.md (Next 16 rules), Phase 5 complete session handoff, Component placement rules (gooey=menus, metal=AI only, orbs=AI status, voice-glow=dictation, border-beam=chat input), Course hues >=40 deg from red, green, cyan; always with course code, Sonnet (student planner app), Accessibility: WCAG 2.2 AA, reduced motion, course color + code, Anti-references (Canvas, SaaS templates, childish gamification), Brand personality: precise, tactile, cheeky

### Community 18 - "login/actions.ts"
Cohesion: 0.39
Nodes (4): LoginState, sendLink(), signIn(), LoginForm()

### Community 19 - "dependencies"
Cohesion: 0.29
Nodes (7): @base-ui/react, border-beam, dependencies, @base-ui/react, border-beam, sonner, sonner

### Community 20 - "v1.5 spec: shell, AI panel, calendar, materials"
Cohesion: 0.18
Nodes (14): Phase 2: App shell, files table (v1 plan), v1.5 spec: shell, AI panel, calendar, materials, App shell (sidebar rail, AI panel, floating windows), Materials hub (floating uploader + per-course materials), Rejected: header Create button + dashboard Ask bar, Reversed: Materials nav tab -> Courses pages, Browser Web Speech API (+6 more)

### Community 22 - "public.calendar_feed"
Cohesion: 0.33
Nodes (5): public.class_meetings, public.calendar_feed(), public.courses, public.items, public.settings

### Community 23 - "0001_init.sql"
Cohesion: 0.47
Nodes (5): public.courses, public.items, public.settings, auth, public

### Community 24 - "app/layout.tsx"
Cohesion: 0.40
Nodes (3): geistMono, geistSans, metadata

### Community 25 - "public.materials"
Cohesion: 0.50
Nodes (4): public.chats, public.materials, auth, public

### Community 26 - "public.class_meetings"
Cohesion: 0.50
Nodes (3): public.class_meetings, auth, public

## Ambiguous Edges - Review These
- `Proxy (src/proxy.ts, Next 16 renamed middleware)` → `Phase 0 Foundation plan (historical)`  [AMBIGUOUS]
  docs/superpowers/plans/2026-09-22-phase-0-foundation.md · relation: conceptually_related_to

## Knowledge Gaps
- **179 isolated node(s):** `name`, `version`, `private`, `dev`, `build` (+174 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 230 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **37 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Proxy (src/proxy.ts, Next 16 renamed middleware)` and `Phase 0 Foundation plan (historical)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `HANDOFF.md (project handoff, most complete doc)` connect `HANDOFF.md (project handoff, most complete doc)` to `ai.ts`, `ROADMAP.md (phase status, most current)`, `Global AI assistant (Sonnet)`, `Phase 3: AI assistant`, `Student Hub design spec v1`, `PRODUCT.md`, `v1.5 spec: shell, AI panel, calendar, materials`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **Why does `Global AI assistant (Sonnet)` connect `Global AI assistant (Sonnet)` to `app-shell.tsx`, `ai.ts`, `HANDOFF.md (project handoff, most complete doc)`, `Phase 3: AI assistant`, `v1.5 spec: shell, AI panel, calendar, materials`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Why does `useAssistant()` connect `app-shell.tsx` to `courses.tsx`, `calendar.tsx`, `app/actions.ts`, `rows.ts`, `Global AI assistant (Sonnet)`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _179 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `courses.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09760374050263004 - nodes in this community are weakly interconnected._
- **Should `calendar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06832298136645963 - nodes in this community are weakly interconnected._