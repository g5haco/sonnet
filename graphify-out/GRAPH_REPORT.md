# Graph Report - sonnet  (2026-09-24)

## Corpus Check
- 101 files · ~67,033 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 3, .example 1, .ico 1)

## Summary
- 735 nodes · 1859 edges · 46 communities (26 shown, 20 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 23 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `365fc4af`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- courses.tsx
- focus-timer.tsx
- eslint.config.mjs
- canvas.ts
- rows.ts
- calendar.ts
- compilerOptions
- dependencies
- package.json
- components.json
- ash-burst-button.tsx
- next
- ai.ts
- PRODUCT.md
- app/actions.ts
- calendar.tsx
- devDependencies
- doubt-button.tsx
- src_lib_gsap_gsap
- src_lib_gsap_usegsap
- public.calendar_feed
- 0001_init.sql
- public.focus_sessions
- 0004_chats_and_materials.sql
- public.class_meetings
- public.courses
- 0005_canvas_sync.sql
- Ideas: after-class check-in, start-by planning, crunch forecast, Sunday reset
- Phase 4 Calendar (done)
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
- scripts

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 40 edges
2. `courseColor()` - 33 edges
3. `react` - 28 edges
4. `cn()` - 26 edges
5. `next` - 23 edges
6. `dayKey()` - 22 edges
7. `lucide-react` - 20 edges
8. `useAssistant()` - 19 edges
9. `Item` - 18 edges
10. `done()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `Syllabus memory in every chat (24k, summary excluded)` --implements--> `studentContext()`  [INFERRED]
  HANDOFF.md → src/lib/ai.ts
- `Check for dates Canvas missed` --references--> `sameWork()`  [EXTRACTED]
  HANDOFF.md → src/lib/syllabus.ts
- `Calendar and class-week grounding` --references--> `studentContext()`  [INFERRED]
  HANDOFF.md → src/lib/ai.ts
- `AI never saves without a confirm card` --references--> `toProposal()`  [INFERRED]
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

## Communities (46 total, 20 thin omitted)

### Community 0 - "courses.tsx"
Cohesion: 0.07
Nodes (70): Ask about the syllabus (fresh focused chat), lucide-react, react, sonner, useCreate(), Block(), ADD, CourseView() (+62 more)

### Community 1 - "focus-timer.tsx"
Cohesion: 0.14
Nodes (14): Focus, FocusButton(), FocusContext, FocusProvider(), load(), mmss(), Run, SPRING (+6 more)

### Community 2 - "eslint.config.mjs"
Cohesion: 0.50
Nodes (3): eslintConfig, eslint, eslint-config-next

### Community 3 - "canvas.ts"
Cohesion: 0.12
Nodes (26): ref_node_crypto, ref_server_only, @supabase/supabase-js, syncCanvasNow(), GET(), maxDuration, CanvasService(), CanvasAssignment (+18 more)

### Community 4 - "rows.ts"
Cohesion: 0.19
Nodes (21): CalendarPage(), metadata, Chat(), metadata, CoursePage(), generateMetadata(), CoursesPage(), metadata (+13 more)

### Community 5 - "calendar.ts"
Cohesion: 0.08
Nodes (47): RFC-5545, vitest, GET(), useOpenSettings(), CalendarBody(), CalendarRail(), LEVELS, MiniMonth() (+39 more)

### Community 6 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 7 - "dependencies"
Cohesion: 0.08
Nodes (24): dependencies, @base-ui/react, border-beam, class-variance-authority, cn, liquid-gooey, lucide-react, matter-js (+16 more)

### Community 8 - "package.json"
Cohesion: 0.12
Nodes (15): name, private, version, @base-ui/react, class-variance-authority, cn, shadcn, tailwindcss (+7 more)

### Community 9 - "components.json"
Cohesion: 0.09
Nodes (22): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+14 more)

### Community 10 - "ash-burst-button.tsx"
Cohesion: 0.21
Nodes (12): matter-js, react-dom, ASH_COLORS, AshSim, createAshSimulation(), drawShard(), paintSim(), ParticleKind (+4 more)

### Community 12 - "next"
Cohesion: 0.11
Nodes (23): nextConfig, next, @supabase/ssr, LoginState, sendLink(), signIn(), LoginForm(), ANGLE (+15 more)

### Community 14 - "ai.ts"
Cohesion: 0.08
Nodes (40): Phase 3 AI assistant (done), Polish pass before syllabus import, Calendar and class-week grounding, Commit and push every important change to main, AI never saves without a confirm card, Things the next Claude must NOT do, Honest UI (no fake data), NDJSON streaming protocol (think/text/propose/cards/error) (+32 more)

### Community 15 - "PRODUCT.md"
Cohesion: 0.06
Nodes (31): AGENTS.md (Next 16 rules), Next.js 16 breaking-changes rule (read node_modules/next/dist/docs), CLAUDE.md includes AGENTS.md (Next 16 rules), Phase 5 complete session handoff, Context-aware chat shortcuts (planned), Exam study guides (planned), Phase 5 Canvas sync (complete), Phase 6 Materials + syllabus (in progress) (+23 more)

### Community 16 - "app/actions.ts"
Cohesion: 0.07
Nodes (68): addMaterial(), askSyllabus(), createCourse(), createItem(), createMeeting(), deleteChat(), deleteCourse(), deleteItem() (+60 more)

### Community 17 - "calendar.tsx"
Cohesion: 0.06
Nodes (56): liquid-gooey, react-markdown, remark-gfm, useAssistant(), ADD, Calendar(), clock(), EASE (+48 more)

### Community 18 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/matter-js, @types/node, @types/react (+3 more)

### Community 20 - "doubt-button.tsx"
Cohesion: 0.22
Nodes (8): motion, useAshBurst(), DEFAULT_CONFIRMATIONS, DoubtButton, DoubtButtonProps, DoubtState, extractText(), labelVariants

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
Cohesion: 0.05
Nodes (54): border-beam, metal-fx, next-themes, thinking-orbs, unpdf, voice-glow, loadChat(), saveChat() (+46 more)

### Community 53 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint, start, test

## Knowledge Gaps
- **215 isolated node(s):** `ADD`, `Course`, `Sent`, `Row`, `Tone` (+210 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 278 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `courses.tsx`, `focus-timer.tsx`, `rows.ts`, `calendar.ts`, `package.json`, `app/actions.ts`, `calendar.tsx`, `app-shell.tsx`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Why does `react` connect `courses.tsx` to `focus-timer.tsx`, `calendar.ts`, `package.json`, `ash-burst-button.tsx`, `next`, `app/actions.ts`, `app-shell.tsx`, `calendar.tsx`, `doubt-button.tsx`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **What connects `ADD`, `Course`, `Sent` to the rest of the system?**
  _215 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `courses.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06562150055991041 - nodes in this community are weakly interconnected._
- **Should `focus-timer.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14035087719298245 - nodes in this community are weakly interconnected._
- **Should `canvas.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11954022988505747 - nodes in this community are weakly interconnected._