# Graph Report - sonnet  (2026-09-24)

## Corpus Check
- 108 files · ~74,410 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 3, .example 1, .ico 1)

## Summary
- 802 nodes · 2077 edges · 60 communities (33 shown, 27 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 23 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2a9abf1f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- dashboard.tsx
- chat/widgets.tsx
- canvas.ts
- next
- calendar.tsx
- compilerOptions
- dependencies
- package.json
- components.json
- ash-burst-button.tsx
- chart-widgets.tsx
- carousel.tsx
- ai.ts
- home.ts
- app/actions.ts
- devDependencies
- public.grade_history
- src_components_ui_draggable_widget_grid
- PRODUCT.md
- src_lib_gsap_gsap
- src_lib_gsap_usegsap
- public.calendar_feed
- 0001_init.sql
- src_components_ui_draggable_widget_grid_draggablewidgetgrid
- public.focus_sessions
- 0004_chats_and_materials.sql
- public.class_meetings
- public.courses
- 0005_canvas_sync.sql
- Ideas: after-class check-in, start-by planning, crunch forecast, Sunday reset
- Phase 4 Calendar (done)
- src_components_ui_draggable_widget_grid_widgetitem
- postcss.config.mjs
- vercel.json
- Default implementation review rule
- Phase 0 Foundation (done)
- Phase 1 Items & progress (done)
- Phase 2 App shell (done)
- Phase 7 Grades (partial)
- Phase 9 Polish (ongoing)
- files table (v1 plan)
- focus_sessions table (planned)
- Ponytail minimal code
- app-shell.tsx
- public.items
- public.settings
- src_components_ui_draggable_widget_grid_widgetsize
- scripts
- src_components_ui_draggable_widget_grid_spans
- public.settings
- Phase 6 Materials + syllabus (in progress)
- motion
- Things the next Claude must NOT do
- ai.test.ts
- chat/route.ts
- OpenRouter
- eslint.config.mjs

## God Nodes (most connected - your core abstractions)
1. `courseColor()` - 43 edges
2. `createClient()` - 41 edges
3. `react` - 30 edges
4. `cn()` - 29 edges
5. `dayKey()` - 28 edges
6. `useAssistant()` - 24 edges
7. `next` - 24 edges
8. `lucide-react` - 22 edges
9. `Item` - 20 edges
10. `done()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `Calendar and class-week grounding` --references--> `studentContext()`  [INFERRED]
  HANDOFF.md → src/lib/ai.ts
- `Syllabus memory in every chat (24k, summary excluded)` --implements--> `studentContext()`  [INFERRED]
  HANDOFF.md → src/lib/ai.ts
- `Check for dates Canvas missed` --references--> `sameWork()`  [EXTRACTED]
  HANDOFF.md → src/lib/syllabus.ts
- `Reasoning rule (off by default, auto for tutoring, Think toggle)` --references--> `needsThinking()`  [EXTRACTED]
  HANDOFF.md → src/lib/ai.ts
- `Syllabus summary note` --references--> `summarizeSyllabus()`  [EXTRACTED]
  HANDOFF.md → src/app/actions.ts

## Import Cycles
- 3-file cycle: `src/components/app-shell.tsx -> src/components/chat/chat-panel.tsx -> src/components/chat/widgets.tsx -> src/components/app-shell.tsx`
- 3-file cycle: `src/components/app-shell.tsx -> src/components/chat/chat-panel.tsx -> src/components/chat/markdown.tsx -> src/components/app-shell.tsx`
- 4-file cycle: `src/components/app-shell.tsx -> src/components/chat/chat-panel.tsx -> src/components/chat/markdown.tsx -> src/components/chat/widgets.tsx -> src/components/app-shell.tsx`
- 4-file cycle: `src/components/app-shell.tsx -> src/components/materials.tsx -> src/components/syllabus-summary.tsx -> src/components/chat/markdown.tsx -> src/components/app-shell.tsx`
- 5-file cycle: `src/components/app-shell.tsx -> src/components/materials.tsx -> src/components/syllabus-summary.tsx -> src/components/chat/markdown.tsx -> src/components/chat/widgets.tsx -> src/components/app-shell.tsx`

## Hyperedges (group relationships)
- **Syllabus reference flow** — src_app_actions_summarizesyllabus, src_components_syllabus_summary_summarydialog, src_lib_syllabus_samework, handoff_syllabus_summary_note, handoff_ask_about_syllabus, handoff_missed_dates_check [EXTRACTED 1.00]
- **Chat request routing** — src_lib_attach_typedpart, src_lib_ai_askstasks, src_lib_ai_wantschange, src_lib_ai_needsthinking, src_lib_ai_streamreply [INFERRED 0.85]

## Communities (60 total, 27 thin omitted)

### Community 0 - "dashboard.tsx"
Cohesion: 0.07
Nodes (70): Ask about the syllabus (fresh focused chat), lucide-react, react, sonner, useCreate(), Block(), ClearWidget(), CourseCard (+62 more)

### Community 2 - "chat/widgets.tsx"
Cohesion: 0.10
Nodes (30): react-markdown, remark-gfm, useAssistant(), Classes(), SpotlightWidget(), components, HNode, linkCourses() (+22 more)

### Community 3 - "canvas.ts"
Cohesion: 0.11
Nodes (28): ref_node_crypto, ref_server_only, @supabase/supabase-js, syncCanvasNow(), GET(), maxDuration, CanvasService(), CanvasAssignment (+20 more)

### Community 4 - "next"
Cohesion: 0.10
Nodes (30): nextConfig, next, @supabase/ssr, CalendarPage(), metadata, Chat(), metadata, CoursePage() (+22 more)

### Community 5 - "calendar.tsx"
Cohesion: 0.05
Nodes (67): RFC-5545, liquid-gooey, GET(), useOpenSettings(), ADD, Calendar(), CalendarBody(), clock() (+59 more)

### Community 6 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 7 - "dependencies"
Cohesion: 0.08
Nodes (24): dependencies, @base-ui/react, border-beam, class-variance-authority, cn, liquid-gooey, lucide-react, matter-js (+16 more)

### Community 8 - "package.json"
Cohesion: 0.11
Nodes (17): name, private, version, @base-ui/react, class-variance-authority, cn, metal-fx, shadcn (+9 more)

### Community 9 - "components.json"
Cohesion: 0.09
Nodes (22): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+14 more)

### Community 10 - "ash-burst-button.tsx"
Cohesion: 0.21
Nodes (12): matter-js, react-dom, ASH_COLORS, AshSim, createAshSimulation(), drawShard(), paintSim(), ParticleKind (+4 more)

### Community 11 - "chart-widgets.tsx"
Cohesion: 0.07
Nodes (48): CountdownWidget(), Course, CUTOFFS, Dot(), ExamsWidget(), GapsWidget(), GradeBarsWidget(), graded() (+40 more)

### Community 12 - "carousel.tsx"
Cohesion: 0.27
Nodes (15): ANGLE, Card(), Carousel(), out(), PERIOD, Slide, Spot, spotOf() (+7 more)

### Community 14 - "ai.ts"
Cohesion: 0.14
Nodes (15): calendarLines(), classLines(), ClassRow, ClassTime, dayName(), DAYS, Kind, localNow() (+7 more)

### Community 15 - "home.ts"
Cohesion: 0.21
Nodes (16): Drag, SnapGrid(), SPRING, COLS, DEFAULT_LAYOUT, fits(), freeSpot(), Layout (+8 more)

### Community 16 - "app/actions.ts"
Cohesion: 0.07
Nodes (68): unpdf, addMaterial(), askSyllabus(), createCourse(), createItem(), createMeeting(), deleteChat(), deleteCourse() (+60 more)

### Community 18 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/matter-js, @types/node, @types/react (+3 more)

### Community 19 - "public.grade_history"
Cohesion: 0.50
Nodes (3): auth, public, public.grade_history

### Community 21 - "PRODUCT.md"
Cohesion: 0.13
Nodes (13): AGENTS.md (Next 16 rules), Phase 5 complete session handoff, Phase 5 Canvas sync (complete), Phase reorder (nothing dropped), Phase 0 Foundation plan (historical), Student Hub design spec v1, Vercel AI SDK + Anthropic (claude-haiku-4-5 / claude-sonnet-5), <=$10/month, v1.5 spec: shell, AI panel, calendar, materials (+5 more)

### Community 26 - "public.calendar_feed"
Cohesion: 0.33
Nodes (5): public.class_meetings, public.calendar_feed(), public.courses, public.items, public.settings

### Community 27 - "0001_init.sql"
Cohesion: 0.43
Nodes (6): items_user_due, public.courses, public.items, public.settings, auth, public

### Community 29 - "public.focus_sessions"
Cohesion: 0.50
Nodes (4): focus_sessions_user, public.focus_sessions, auth, public

### Community 30 - "0004_chats_and_materials.sql"
Cohesion: 0.43
Nodes (6): chats_user_updated, materials_course, public.chats, public.materials, auth, public

### Community 31 - "public.class_meetings"
Cohesion: 0.50
Nodes (4): class_meetings_user, public.class_meetings, auth, public

### Community 33 - "0005_canvas_sync.sql"
Cohesion: 0.40
Nodes (4): courses_user_canvas, public.canvas_connections, auth, public.courses

### Community 49 - "app-shell.tsx"
Cohesion: 0.06
Nodes (52): border-beam, next-themes, thinking-orbs, loadChat(), saveChat(), src_app_globals, geistMono, geistSans (+44 more)

### Community 53 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint, start, test

### Community 58 - "Phase 6 Materials + syllabus (in progress)"
Cohesion: 0.18
Nodes (11): Next.js 16 breaking-changes rule (read node_modules/next/dist/docs), CLAUDE.md includes AGENTS.md (Next 16 rules), Context-aware chat shortcuts (planned), Exam study guides (planned), Phase 6 Materials + syllabus (in progress), Personal MVP (single user, sign-ups closed, RLS everywhere), SaaS step (sign-up, Stripe, Resend, Canvas OAuth), Sonnet student planner (+3 more)

### Community 59 - "motion"
Cohesion: 0.22
Nodes (8): motion, useAshBurst(), DEFAULT_CONFIRMATIONS, DoubtButton, DoubtButtonProps, DoubtState, extractText(), labelVariants

### Community 60 - "Things the next Claude must NOT do"
Cohesion: 0.20
Nodes (10): Phase 3 AI assistant (done), Calendar and class-week grounding, Commit and push every important change to main, AI never saves without a confirm card, Things the next Claude must NOT do, Honest UI (no fake data), Reasoning rule (off by default, auto for tutoring, Think toggle), UI rules (metal=AI only, gooey menus, cyan=you now, course hue rule) (+2 more)

### Community 61 - "ai.test.ts"
Cohesion: 0.31
Nodes (8): Polish pass before syllabus import, Server-side task answers (no model call), vitest, asksTasks(), taskAnswer(), toolsFor(), wantsCards(), wantsChange()

### Community 62 - "chat/route.ts"
Cohesion: 0.39
Nodes (8): NDJSON streaming protocol (think/text/propose/cards/error), maxDuration, POST(), needsSearch(), needsThinking(), needsVision(), streamReply(), typedPart()

### Community 63 - "OpenRouter"
Cohesion: 0.29
Nodes (7): Chat attachments (photos, PDFs, text; up to 3), DeepSeek v4.1 flash default model, Env vars (SUPABASE keys, AI_API_KEY, AI_MODEL, AI_VISION_MODEL, CANVAS_ENCRYPTION_KEY, CRON_SECRET), Gemini 3.8 flash vision model (VISION_MODEL), OpenRouter, Rejected: paid Anthropic API, Supabase (Postgres, Auth, Storage, RLS)

### Community 64 - "eslint.config.mjs"
Cohesion: 0.50
Nodes (3): eslintConfig, eslint, eslint-config-next

## Knowledge Gaps
- **222 isolated node(s):** `Course`, `CUTOFFS`, `SHADES`, `Term`, `Course` (+217 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 298 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **27 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `dashboard.tsx` to `chat/widgets.tsx`, `calendar.tsx`, `package.json`, `ash-burst-button.tsx`, `chart-widgets.tsx`, `carousel.tsx`, `home.ts`, `app/actions.ts`, `app-shell.tsx`, `motion`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Why does `next` connect `next` to `dashboard.tsx`, `chat/widgets.tsx`, `calendar.tsx`, `package.json`, `chart-widgets.tsx`, `carousel.tsx`, `app/actions.ts`, `app-shell.tsx`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **What connects `Course`, `CUTOFFS`, `SHADES` to the rest of the system?**
  _222 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dashboard.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0671892497200448 - nodes in this community are weakly interconnected._
- **Should `chat/widgets.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0962566844919786 - nodes in this community are weakly interconnected._
- **Should `canvas.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11290322580645161 - nodes in this community are weakly interconnected._