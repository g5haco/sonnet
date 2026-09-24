# Graph Report - sonnet  (2026-09-23)

## Corpus Check
- 93 files · ~66,746 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 3, .example 1, .ico 1)

## Summary
- 693 nodes · 1727 edges · 43 communities (25 shown, 18 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 23 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `de9ab80f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- courses.tsx
- settings-forms.tsx
- app-shell.tsx
- canvas.ts
- rows.ts
- calendar.tsx
- compilerOptions
- dependencies
- package.json
- components.json
- ash-burst-button.tsx
- doubt-button.tsx
- react
- eslint.config.mjs
- ai.ts
- Student Hub design spec v1
- app/actions.ts
- devDependencies
- form.tsx
- scripts
- src_lib_gsap_gsap
- src_lib_gsap_usegsap
- public.calendar_feed
- 0001_init.sql
- 0004_chats_and_materials.sql
- public.class_meetings
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
- public.items
- public.settings

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 39 edges
2. `courseColor()` - 33 edges
3. `react` - 26 edges
4. `next` - 23 edges
5. `cn()` - 22 edges
6. `useAssistant()` - 19 edges
7. `lucide-react` - 18 edges
8. `dayKey()` - 17 edges
9. `Item` - 17 edges
10. `done()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `Calendar and class-week grounding` --references--> `studentContext()`  [INFERRED]
  HANDOFF.md → src/lib/ai.ts
- `Syllabus memory in every chat (24k, summary excluded)` --implements--> `studentContext()`  [INFERRED]
  HANDOFF.md → src/lib/ai.ts
- `Check for dates Canvas missed` --references--> `sameWork()`  [EXTRACTED]
  HANDOFF.md → src/lib/syllabus.ts
- `Syllabus summary note` --references--> `summarizeSyllabus()`  [EXTRACTED]
  HANDOFF.md → src/app/actions.ts
- `AI never saves without a confirm card` --references--> `applyProposal()`  [EXTRACTED]
  HANDOFF.md → src/components/chat/proposal-card.tsx

## Import Cycles
- 3-file cycle: `src/components/app-shell.tsx -> src/components/chat/chat-panel.tsx -> src/components/chat/widgets.tsx -> src/components/app-shell.tsx`
- 3-file cycle: `src/components/app-shell.tsx -> src/components/chat/chat-panel.tsx -> src/components/chat/markdown.tsx -> src/components/app-shell.tsx`
- 4-file cycle: `src/components/app-shell.tsx -> src/components/chat/chat-panel.tsx -> src/components/chat/markdown.tsx -> src/components/chat/widgets.tsx -> src/components/app-shell.tsx`
- 4-file cycle: `src/components/app-shell.tsx -> src/components/materials.tsx -> src/components/syllabus-summary.tsx -> src/components/chat/markdown.tsx -> src/components/app-shell.tsx`
- 5-file cycle: `src/components/app-shell.tsx -> src/components/materials.tsx -> src/components/syllabus-summary.tsx -> src/components/chat/markdown.tsx -> src/components/chat/widgets.tsx -> src/components/app-shell.tsx`

## Hyperedges (group relationships)
- **Syllabus reference flow** — src_app_actions_summarizesyllabus, src_components_syllabus_summary_summarydialog, src_lib_syllabus_samework, handoff_syllabus_summary_note, handoff_ask_about_syllabus, handoff_missed_dates_check [EXTRACTED 1.00]
- **Chat request routing** — src_lib_attach_typedpart, src_lib_ai_askstasks, src_lib_ai_wantschange, src_lib_ai_needsthinking, src_lib_ai_streamreply [INFERRED 0.85]

## Communities (43 total, 18 thin omitted)

### Community 0 - "courses.tsx"
Cohesion: 0.08
Nodes (56): nextConfig, next, react-markdown, remark-gfm, useAssistant(), useCreate(), Block(), components (+48 more)

### Community 1 - "settings-forms.tsx"
Cohesion: 0.07
Nodes (49): Ask about the syllabus (fresh focused chat), lucide-react, sonner, @supabase/ssr, signOut(), Course, CourseDialog(), field (+41 more)

### Community 2 - "app-shell.tsx"
Cohesion: 0.06
Nodes (43): border-beam, metal-fx, next-themes, thinking-orbs, unpdf, vitest, voice-glow, src_app_globals (+35 more)

### Community 3 - "canvas.ts"
Cohesion: 0.11
Nodes (28): ref_node_crypto, ref_server_only, @supabase/supabase-js, syncCanvasNow(), GET(), maxDuration, GET(), CanvasService() (+20 more)

### Community 4 - "rows.ts"
Cohesion: 0.20
Nodes (20): CalendarPage(), metadata, Chat(), metadata, CoursePage(), generateMetadata(), CoursesPage(), metadata (+12 more)

### Community 5 - "calendar.tsx"
Cohesion: 0.05
Nodes (68): RFC-5545, liquid-gooey, GET(), useOpenSettings(), ADD, Calendar(), CalendarBody(), clock() (+60 more)

### Community 6 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 7 - "dependencies"
Cohesion: 0.08
Nodes (25): dependencies, @base-ui/react, border-beam, class-variance-authority, cn, liquid-gooey, lucide-react, matter-js (+17 more)

### Community 8 - "package.json"
Cohesion: 0.12
Nodes (16): name, private, version, @base-ui/react, class-variance-authority, cn, @radix-ui/react-use-controllable-state, shadcn (+8 more)

### Community 9 - "components.json"
Cohesion: 0.09
Nodes (22): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+14 more)

### Community 10 - "ash-burst-button.tsx"
Cohesion: 0.21
Nodes (12): matter-js, react-dom, ASH_COLORS, AshSim, createAshSimulation(), drawShard(), paintSim(), ParticleKind (+4 more)

### Community 11 - "doubt-button.tsx"
Cohesion: 0.22
Nodes (8): motion, useAshBurst(), DEFAULT_CONFIRMATIONS, DoubtButton, DoubtButtonProps, DoubtState, extractText(), labelVariants

### Community 12 - "react"
Cohesion: 0.26
Nodes (16): react, ANGLE, Card(), Carousel(), out(), PERIOD, Slide, Spot (+8 more)

### Community 13 - "eslint.config.mjs"
Cohesion: 0.50
Nodes (3): eslintConfig, eslint, eslint-config-next

### Community 14 - "ai.ts"
Cohesion: 0.05
Nodes (56): AGENTS.md (Next 16 rules), Next.js 16 breaking-changes rule (read node_modules/next/dist/docs), CLAUDE.md includes AGENTS.md (Next 16 rules), Phase 5 complete session handoff, Context-aware chat shortcuts (planned), Exam study guides (planned), Phase 3 AI assistant (done), Phase 6 Materials + syllabus (in progress) (+48 more)

### Community 15 - "Student Hub design spec v1"
Cohesion: 0.13
Nodes (14): Phase 5 Canvas sync (complete), Phase reorder (nothing dropped), Phase 0 Foundation plan (historical), Student Hub design spec v1, Vercel AI SDK + Anthropic (claude-haiku-4-5 / claude-sonnet-5), <=$10/month, v1.5 spec: shell, AI panel, calendar, materials, Canvas sync (encrypted token + ICS, daily cron), DeepSeek v4.1 flash default model (+6 more)

### Community 16 - "app/actions.ts"
Cohesion: 0.07
Nodes (64): addMaterial(), askSyllabus(), createCourse(), createItem(), createMeeting(), deleteChat(), deleteCourse(), deleteItem() (+56 more)

### Community 19 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/matter-js, @types/node, @types/react (+3 more)

### Community 20 - "form.tsx"
Cohesion: 0.39
Nodes (4): LoginState, sendLink(), signIn(), LoginForm()

### Community 21 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint, start, test

### Community 26 - "public.calendar_feed"
Cohesion: 0.33
Nodes (5): public.class_meetings, public.calendar_feed(), public.courses, public.items, public.settings

### Community 27 - "0001_init.sql"
Cohesion: 0.43
Nodes (6): items_user_due, public.courses, public.items, public.settings, auth, public

### Community 30 - "0004_chats_and_materials.sql"
Cohesion: 0.43
Nodes (6): chats_user_updated, materials_course, public.chats, public.materials, auth, public

### Community 31 - "public.class_meetings"
Cohesion: 0.50
Nodes (4): class_meetings_user, public.class_meetings, auth, public

### Community 33 - "0005_canvas_sync.sql"
Cohesion: 0.40
Nodes (4): courses_user_canvas, public.canvas_connections, auth, public.courses

## Knowledge Gaps
- **211 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+206 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 267 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `courses.tsx` to `settings-forms.tsx`, `app-shell.tsx`, `canvas.ts`, `rows.ts`, `calendar.tsx`, `package.json`, `react`, `app/actions.ts`, `form.tsx`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `courses.tsx`, `settings-forms.tsx`, `app-shell.tsx`, `calendar.tsx`, `package.json`, `ash-burst-button.tsx`, `doubt-button.tsx`, `app/actions.ts`, `form.tsx`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _211 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `courses.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07675675675675675 - nodes in this community are weakly interconnected._
- **Should `settings-forms.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06963645673323093 - nodes in this community are weakly interconnected._
- **Should `app-shell.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0593990216631726 - nodes in this community are weakly interconnected._