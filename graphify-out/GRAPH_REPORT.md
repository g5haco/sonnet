# Graph Report - sonnet  (2026-09-24)

## Corpus Check
- 101 files · ~66,913 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 3, .example 1, .ico 1)

## Summary
- 733 nodes · 1847 edges · 53 communities (33 shown, 20 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 23 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6be08d19`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- settings-forms.tsx
- form.tsx
- Phase 6 Materials + syllabus (in progress)
- canvas.ts
- next
- calendar.tsx
- compilerOptions
- dependencies
- package.json
- components.json
- ash-burst-button.tsx
- courses.tsx
- carousel.tsx
- PRODUCT.md
- ai.ts
- Student Hub design spec v1
- app/actions.ts
- widgets.tsx
- devDependencies
- chat/route.ts
- doubt-button.tsx
- ai.test.ts
- src_lib_gsap_gsap
- src_lib_gsap_usegsap
- Things the next Claude must NOT do
- public.calendar_feed
- 0001_init.sql
- extract.ts
- public.focus_sessions
- 0004_chats_and_materials.sql
- public.class_meetings
- public.courses
- 0005_canvas_sync.sql
- Ideas: after-class check-in, start-by planning, crunch forecast, Sunday reset
- Phase 4 Calendar (done)
- studentContext
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
- `Calendar and class-week grounding` --references--> `studentContext()`  [INFERRED]
  HANDOFF.md → src/lib/ai.ts
- `Syllabus memory in every chat (24k, summary excluded)` --implements--> `studentContext()`  [INFERRED]
  HANDOFF.md → src/lib/ai.ts
- `Reasoning rule (off by default, auto for tutoring, Think toggle)` --references--> `needsThinking()`  [EXTRACTED]
  HANDOFF.md → src/lib/ai.ts
- `Check for dates Canvas missed` --references--> `sameWork()`  [EXTRACTED]
  HANDOFF.md → src/lib/syllabus.ts
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

## Communities (53 total, 20 thin omitted)

### Community 0 - "settings-forms.tsx"
Cohesion: 0.08
Nodes (45): Ask about the syllabus (fresh focused chat), sonner, signOut(), Course, CourseDialog(), field, FormError(), ItemDialog() (+37 more)

### Community 1 - "form.tsx"
Cohesion: 0.39
Nodes (4): LoginState, sendLink(), signIn(), LoginForm()

### Community 2 - "Phase 6 Materials + syllabus (in progress)"
Cohesion: 0.17
Nodes (12): Next.js 16 breaking-changes rule (read node_modules/next/dist/docs), CLAUDE.md includes AGENTS.md (Next 16 rules), Context-aware chat shortcuts (planned), Exam study guides (planned), Phase 6 Materials + syllabus (in progress), Chat attachments (photos, PDFs, text; up to 3), Personal MVP (single user, sign-ups closed, RLS everywhere), SaaS step (sign-up, Stripe, Resend, Canvas OAuth) (+4 more)

### Community 3 - "canvas.ts"
Cohesion: 0.12
Nodes (27): ref_node_crypto, ref_server_only, @supabase/supabase-js, syncCanvasNow(), GET(), maxDuration, CanvasService(), CanvasAssignment (+19 more)

### Community 4 - "next"
Cohesion: 0.10
Nodes (30): nextConfig, next, @supabase/ssr, CalendarPage(), metadata, Chat(), metadata, CoursePage() (+22 more)

### Community 5 - "calendar.tsx"
Cohesion: 0.06
Nodes (62): RFC-5545, GET(), useOpenSettings(), ADD, Calendar(), CalendarBody(), clock(), EASE (+54 more)

### Community 6 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 7 - "dependencies"
Cohesion: 0.08
Nodes (24): dependencies, @base-ui/react, border-beam, class-variance-authority, cn, liquid-gooey, lucide-react, matter-js (+16 more)

### Community 8 - "package.json"
Cohesion: 0.09
Nodes (22): eslintConfig, name, private, version, @base-ui/react, border-beam, class-variance-authority, cn (+14 more)

### Community 9 - "components.json"
Cohesion: 0.09
Nodes (22): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+14 more)

### Community 10 - "ash-burst-button.tsx"
Cohesion: 0.21
Nodes (13): matter-js, react-dom, ASH_COLORS, AshSim, createAshSimulation(), drawShard(), paintSim(), ParticleKind (+5 more)

### Community 11 - "courses.tsx"
Cohesion: 0.11
Nodes (40): useCreate(), Block(), WorkCard(), CourseCard, CourseFace(), courseStats(), ADD, CoursesGrid() (+32 more)

### Community 12 - "carousel.tsx"
Cohesion: 0.27
Nodes (15): ANGLE, Card(), Carousel(), out(), PERIOD, Slide, Spot, spotOf() (+7 more)

### Community 13 - "PRODUCT.md"
Cohesion: 0.20
Nodes (9): AGENTS.md (Next 16 rules), Phase 5 complete session handoff, Phase 3 AI assistant (done), AI never saves without a confirm card, Accessibility: WCAG 2.2 AA, reduced motion, course color + code, Anti-references (Canvas, SaaS templates, childish gamification), Brand personality: precise, tactile, cheeky, Design principles (readouts not reports; color means something; everything answers back; calm by default; never lose trust) (+1 more)

### Community 14 - "ai.ts"
Cohesion: 0.14
Nodes (9): ClassRow, ClassTime, DAYS, Kind, MODELS, Refs, Task, TASK_WORDS (+1 more)

### Community 15 - "Student Hub design spec v1"
Cohesion: 0.13
Nodes (14): Phase 5 Canvas sync (complete), Phase reorder (nothing dropped), Phase 0 Foundation plan (historical), Student Hub design spec v1, Vercel AI SDK + Anthropic (claude-haiku-4-5 / claude-sonnet-5), <=$10/month, v1.5 spec: shell, AI panel, calendar, materials, Canvas sync (encrypted token + ICS, daily cron), DeepSeek v4.1 flash default model (+6 more)

### Community 16 - "app/actions.ts"
Cohesion: 0.08
Nodes (61): vitest, addMaterial(), askSyllabus(), createCourse(), createItem(), createMeeting(), deleteChat(), deleteCourse() (+53 more)

### Community 17 - "widgets.tsx"
Cohesion: 0.10
Nodes (27): react-markdown, remark-gfm, useAssistant(), Classes(), components, HNode, linkCourses(), Markdown() (+19 more)

### Community 18 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/matter-js, @types/node, @types/react (+3 more)

### Community 19 - "chat/route.ts"
Cohesion: 0.33
Nodes (9): NDJSON streaming protocol (think/text/propose/cards/error), maxDuration, POST(), needsSearch(), needsThinking(), needsVision(), streamReply(), Turn (+1 more)

### Community 20 - "doubt-button.tsx"
Cohesion: 0.25
Nodes (6): DEFAULT_CONFIRMATIONS, DoubtButton, DoubtButtonProps, DoubtState, extractText(), labelVariants

### Community 21 - "ai.test.ts"
Cohesion: 0.43
Nodes (7): Polish pass before syllabus import, Server-side task answers (no model call), asksTasks(), taskAnswer(), toolsFor(), wantsCards(), wantsChange()

### Community 25 - "Things the next Claude must NOT do"
Cohesion: 0.33
Nodes (6): Calendar and class-week grounding, Commit and push every important change to main, Things the next Claude must NOT do, Honest UI (no fake data), Reasoning rule (off by default, auto for tutoring, Think toggle), UI rules (metal=AI only, gooey menus, cyan=you now, course hue rule)

### Community 26 - "public.calendar_feed"
Cohesion: 0.33
Nodes (5): public.class_meetings, public.calendar_feed(), public.courses, public.items, public.settings

### Community 27 - "0001_init.sql"
Cohesion: 0.43
Nodes (6): items_user_due, public.courses, public.items, public.settings, auth, public

### Community 28 - "extract.ts"
Cohesion: 0.47
Nodes (4): complete(), VISION_MODEL, extractText(), visionText()

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

### Community 36 - "studentContext"
Cohesion: 0.70
Nodes (5): calendarLines(), classLines(), dayName(), localNow(), studentContext()

### Community 49 - "app-shell.tsx"
Cohesion: 0.06
Nodes (58): lucide-react, metal-fx, motion, next-themes, react, thinking-orbs, AppShell(), Assistant (+50 more)

### Community 53 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint, start, test

## Knowledge Gaps
- **215 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+210 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 277 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `settings-forms.tsx`, `form.tsx`, `calendar.tsx`, `package.json`, `courses.tsx`, `carousel.tsx`, `app/actions.ts`, `app-shell.tsx`, `widgets.tsx`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Why does `react` connect `app-shell.tsx` to `settings-forms.tsx`, `form.tsx`, `calendar.tsx`, `package.json`, `ash-burst-button.tsx`, `courses.tsx`, `carousel.tsx`, `app/actions.ts`, `widgets.tsx`, `doubt-button.tsx`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _215 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `settings-forms.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08051948051948052 - nodes in this community are weakly interconnected._
- **Should `canvas.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11827956989247312 - nodes in this community are weakly interconnected._
- **Should `next` be split into smaller, more focused modules?**
  _Cohesion score 0.09696969696969697 - nodes in this community are weakly interconnected._