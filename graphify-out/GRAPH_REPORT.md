# Graph Report - sonnet  (2026-09-23)

## Corpus Check
- 80 files · ~51,078 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 626 nodes · 1406 edges · 63 communities (27 shown, 36 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 68 edges (avg confidence: 0.87)
- Token cost: 112,980 input · 0 output

## Community Hubs (Navigation)
- Home, Courses & Create UI
- Calendar UI & ICS Feed
- App Shell & Chat Assistant
- Server Actions (all writes)
- Data Model & Core Decisions
- npm Dev Tooling
- TypeScript Config
- App Pages (routes)
- Canvas Sync Engine
- shadcn Config
- Calendar & Canvas Phases
- Home Courses Carousel
- Roadmap & Later Phases
- AI Assistant Design
- Phase 6 Materials & Syllabus
- Foundation & v1 Spec
- Supabase Security & RLS
- Product & Design Rules
- Login & Auth
- UI Dependencies
- App Shell Design
- OpenRouter AI Config
- Migration 0003 Calendar Feed
- Migration 0001 Init
- Root Layout & Fonts
- Migration 0004 Chats & Materials
- Migration 0002 Class Meetings
- Proxy (auth redirect)
- Migration 0005 Canvas
- Misc: class-variance-authority
- Misc: cn
- Misc: date-fns
- Misc: eslint.config.mjs
- Misc: gsap
- Misc: @gsap/react
- Misc: liquid-gooey
- Misc: lucide-react
- Misc: metal-fx
- Misc: motion
- Misc: next
- Misc: next.config.ts
- Misc: next-themes
- Misc: @radix-ui/react-use-controllable-state
- Misc: react
- Misc: react-markdown
- Misc: remark-gfm
- Misc: shadcn
- Misc: sonner
- Misc: @supabase/ssr
- Misc: @supabase/supabase-js
- Misc: thinking-orbs
- Misc: tw-animate-css
- Misc: voice-glow
- Misc: postcss.config.mjs
- Misc: vercel.json
- Misc: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (env var)
- Misc: NEXT_PUBLIC_SUPABASE_URL (env var)
- Misc: Ponytail minimal code philosophy
- Misc: Rejected: editing Supabase email template
- Misc: settings table
- Misc: public.courses
- Misc: public.items
- Misc: public.settings

## God Nodes (most connected - your core abstractions)
1. `HANDOFF.md (project handoff, most complete doc)` - 37 edges
2. `createClient()` - 35 edges
3. `courseColor()` - 33 edges
4. `ROADMAP.md (phase status, most current)` - 19 edges
5. `cn()` - 19 edges
6. `useAssistant()` - 17 edges
7. `dayKey()` - 17 edges
8. `Item` - 17 edges
9. `done()` - 16 edges
10. `compilerOptions` - 16 edges

## Surprising Connections (you probably didn't know these)
- `streamReply()` --implements--> `NDJSON streaming protocol (think, text, propose, cards, error)`  [INFERRED]
  src/lib/ai.ts → HANDOFF.md
- `OpenRouter free models fallback chain (Nemotron 3 Super -> Qwen 3.8 27B -> Nemotron 3 Ultra)` --semantically_similar_to--> `Vercel AI SDK + Anthropic (claude-haiku-4-5 / claude-sonnet-5), <=$10/month`  [INFERRED] [semantically similar]
  HANDOFF.md → docs/superpowers/specs/2026-09-22-student-hub-design.md
- `useAssistant()` --implements--> `Global AI assistant (Sonnet)`  [INFERRED]
  src/components/app-shell.tsx → HANDOFF.md
- `AppShell()` --implements--> `App shell (sidebar rail, AI panel, floating windows)`  [INFERRED]
  src/components/app-shell.tsx → HANDOFF.md
- `applyProposal()` --implements--> `Proposal / confirm cards`  [INFERRED]
  src/components/chat/proposal-card.tsx → HANDOFF.md

## Import Cycles
- 3-file cycle: `src/components/app-shell.tsx -> src/components/chat/chat-panel.tsx -> src/components/chat/widgets.tsx -> src/components/app-shell.tsx`
- 3-file cycle: `src/components/app-shell.tsx -> src/components/chat/chat-panel.tsx -> src/components/chat/markdown.tsx -> src/components/app-shell.tsx`
- 4-file cycle: `src/components/app-shell.tsx -> src/components/chat/chat-panel.tsx -> src/components/chat/markdown.tsx -> src/components/chat/widgets.tsx -> src/components/app-shell.tsx`

## Hyperedges (group relationships)
- **AI proposal -> confirm card -> apply flow** — src_lib_ai_tools, src_lib_ai_toproposal, src_lib_ai_streamreply, src_components_chat_proposal_card_applyproposal, handoff_confirm_cards [INFERRED 0.85]
- **Canvas sync pipeline** — handoff_canvas_module, handoff_api_cron_canvas_route, handoff_supabase_admin_client, handoff_table_canvas_connections, handoff_env_canvas_encryption_key, handoff_env_cron_secret [EXTRACTED 1.00]
- **AI speed/quality decisions** — handoff_openrouter_free_models, handoff_reasoning_rule, handoff_calendar_grounding, src_lib_ai_needsthinking [INFERRED 0.85]

## Communities (63 total, 36 thin omitted)

### Community 0 - "Home, Courses & Create UI"
Cohesion: 0.09
Nodes (49): useCreate(), useOpenSettings(), Block(), CourseCard, CourseFace(), courseStats(), ADD, CourseEditor() (+41 more)

### Community 1 - "Calendar UI & ICS Feed"
Cohesion: 0.07
Nodes (57): RFC-5545, GET(), ADD, Calendar(), CalendarBody(), clock(), EASE, GridProps (+49 more)

### Community 2 - "App Shell & Chat Assistant"
Cohesion: 0.06
Nodes (47): Rejected: offsetParent visibility checks, deleteChat(), listChats(), Assistant, AssistantContext, Course, CreateContext, Schedule (+39 more)

### Community 3 - "Server Actions (all writes)"
Cohesion: 0.09
Nodes (50): addMaterial(), createCourse(), createItem(), createMeeting(), deleteCourse(), deleteItem(), deleteMaterial(), deleteMeeting() (+42 more)

### Community 4 - "Data Model & Core Decisions"
Cohesion: 0.09
Nodes (31): files table (v1 plan), Accent 'oscilloscope cyan' means 'you, now', Calendar + class-week grounding in prompt, Proposal / confirm cards, Honest UI: no fake data; placeholders say what's coming, Rejected: pull()-based ReadableStream parser, class_meetings table, courses table (+23 more)

### Community 5 - "npm Dev Tooling"
Cohesion: 0.07
Nodes (28): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+20 more)

### Community 6 - "TypeScript Config"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 7 - "App Pages (routes)"
Cohesion: 0.20
Nodes (20): CalendarPage(), metadata, Chat(), metadata, CoursePage(), generateMetadata(), CoursesPage(), metadata (+12 more)

### Community 8 - "Canvas Sync Engine"
Cohesion: 0.16
Nodes (20): GET(), maxDuration, CanvasAssignment, CanvasCourse, CanvasItem, canvasPages(), CanvasSettings, decryptCanvasToken() (+12 more)

### Community 9 - "shadcn Config"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 10 - "Calendar & Canvas Phases"
Cohesion: 0.17
Nodes (18): Phase 4: Calendar, Phase 5: Canvas sync, HANDOFF.md (project handoff, most complete doc), GET /api/cal/[token] ICS feed, GET /api/cron/canvas (daily Vercel Cron 11:00 UTC), Calendar (day/week/month + heat map rail), src/lib/canvas.ts (REST/ICS normalization, encryption, sync), Canvas sync (access token + ICS feed) (+10 more)

### Community 11 - "Home Courses Carousel"
Cohesion: 0.27
Nodes (15): ANGLE, Card(), Carousel(), out(), PERIOD, Slide, Spot, spotOf() (+7 more)

### Community 12 - "Roadmap & Later Phases"
Cohesion: 0.24
Nodes (10): ROADMAP.md (phase status, most current), Differentiator ideas (after-class check-in, start-by planning, crunch forecast, Sunday reset), Phase 7: Grades + what-if, Phase 8: Focus timer & heatmap, Phase 9: Polish, Phase order: Shell -> AI -> Calendar -> Canvas -> Materials -> Grades -> Focus -> Polish, focus_sessions table (planned), Commit and push every important change to main; keep ROADMAP current (+2 more)

### Community 13 - "AI Assistant Design"
Cohesion: 0.20
Nodes (10): Phase 3: AI assistant, Global AI assistant (Sonnet), POST /api/chat (src/app/api/chat/route.ts), Canvas descriptions labeled untrusted data, Saved chat history (/chat), Flashcards (make_flashcards deck, never saved), NDJSON streaming protocol (think, text, propose, cards, error), Reasoning off by default, auto for tutoring, Think toggle (+2 more)

### Community 14 - "Phase 6 Materials & Syllabus"
Cohesion: 0.25
Nodes (7): AGENTS.md (Next 16 rules), Phase 5 complete session handoff, Phase 6: Materials + syllabus import, Exam study guides, Materials hub (floating uploader + per-course materials), Reversed: Materials nav tab -> Courses pages, Syllabus AI import with review cards

### Community 15 - "Foundation & v1 Spec"
Cohesion: 0.29
Nodes (8): Next.js 16 breaking-changes rule (read node_modules/next/dist/docs), Phase 0: Foundation, Phase 1: Items & progress, Phase 0 Foundation plan (historical), Student Hub design spec v1, Vercel AI SDK + Anthropic (claude-haiku-4-5 / claude-sonnet-5), <=$10/month, Progress block (caught-up %, weekly bars), Proxy (src/proxy.ts, Next 16 renamed middleware)

### Community 16 - "Supabase Security & RLS"
Cohesion: 0.29
Nodes (8): SaaS step (later), Do-not-change rules (§19, §26), SUPABASE_SECRET_KEY (env var), SUPABASE_SERVICE_ROLE_KEY (env var), RLS on every table (user_id default auth.uid()), Supabase (Postgres, Auth, Storage), Supabase admin client (src/lib/supabase/admin.ts), canvas_connections table

### Community 17 - "Product & Design Rules"
Cohesion: 0.25
Nodes (6): Component placement rules (gooey=menus, metal=AI only, orbs=AI status, voice-glow=dictation, border-beam=chat input), Course hues >=40 deg from red, green, cyan; always with course code, Sonnet (student planner app), Accessibility: WCAG 2.2 AA, reduced motion, course color + code, Anti-references (Canvas, SaaS templates, childish gamification), Brand personality: precise, tactile, cheeky

### Community 18 - "Login & Auth"
Cohesion: 0.39
Nodes (4): LoginState, sendLink(), signIn(), LoginForm()

### Community 19 - "UI Dependencies"
Cohesion: 0.29
Nodes (7): @base-ui/react, border-beam, dependencies, @base-ui/react, border-beam, react-dom, react-dom

### Community 20 - "App Shell Design"
Cohesion: 0.38
Nodes (7): Phase 2: App shell, v1.5 spec: shell, AI panel, calendar, materials, App shell (sidebar rail, AI panel, floating windows), Rejected: header Create button + dashboard Ask bar, Browser Web Speech API, Floating Settings window, Voice dictation (Web Speech API)

### Community 21 - "OpenRouter AI Config"
Cohesion: 0.33
Nodes (6): AI_API_KEY (env var), AI_BASE_URL (env var), AI_MODEL (env var), OpenRouter free models fallback chain (Nemotron 3 Super -> Qwen 3.8 27B -> Nemotron 3 Ultra), Rejected: paid Anthropic API / NVIDIA NIM / Bytez, OpenRouter

### Community 22 - "Migration 0003 Calendar Feed"
Cohesion: 0.33
Nodes (5): public.class_meetings, public.calendar_feed(), public.courses, public.items, public.settings

### Community 23 - "Migration 0001 Init"
Cohesion: 0.47
Nodes (5): public.courses, public.items, public.settings, auth, public

### Community 24 - "Root Layout & Fonts"
Cohesion: 0.40
Nodes (3): geistMono, geistSans, metadata

### Community 25 - "Migration 0004 Chats & Materials"
Cohesion: 0.50
Nodes (4): public.chats, public.materials, auth, public

### Community 26 - "Migration 0002 Class Meetings"
Cohesion: 0.50
Nodes (3): public.class_meetings, auth, public

## Ambiguous Edges - Review These
- `Phase 0 Foundation plan (historical)` → `Proxy (src/proxy.ts, Next 16 renamed middleware)`  [AMBIGUOUS]
  docs/superpowers/plans/2026-09-22-phase-0-foundation.md · relation: conceptually_related_to

## Knowledge Gaps
- **178 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+173 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 229 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **36 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Phase 0 Foundation plan (historical)` and `Proxy (src/proxy.ts, Next 16 renamed middleware)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `HANDOFF.md (project handoff, most complete doc)` connect `Calendar & Canvas Phases` to `Data Model & Core Decisions`, `Roadmap & Later Phases`, `AI Assistant Design`, `Phase 6 Materials & Syllabus`, `Foundation & v1 Spec`, `Supabase Security & RLS`, `Product & Design Rules`, `App Shell Design`, `OpenRouter AI Config`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **Why does `Global AI assistant (Sonnet)` connect `AI Assistant Design` to `App Shell & Chat Assistant`, `Data Model & Core Decisions`, `Calendar & Canvas Phases`, `App Shell Design`, `OpenRouter AI Config`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Why does `useAssistant()` connect `App Shell & Chat Assistant` to `Home, Courses & Create UI`, `Calendar UI & ICS Feed`, `Server Actions (all writes)`, `App Pages (routes)`, `AI Assistant Design`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _178 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Home, Courses & Create UI` be split into smaller, more focused modules?**
  _Cohesion score 0.08560140474100088 - nodes in this community are weakly interconnected._
- **Should `Calendar UI & ICS Feed` be split into smaller, more focused modules?**
  _Cohesion score 0.07242063492063493 - nodes in this community are weakly interconnected._