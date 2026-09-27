# Graph Report - sonnet  (2026-09-26)

## Corpus Check
- 157 files · ~141,252 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 3, .example 1, .ico 1)

## Summary
- 1317 nodes · 3168 edges · 100 communities (64 shown, 36 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 39 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5ca14a1a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- recharts-area-chart.tsx
- chats_user_item
- recharts-radar-chart.tsx
- courses.tsx
- react
- dashboard.tsx
- compilerOptions
- dependencies
- package.json
- components.json
- ash-burst-button.tsx
- calendar.ts
- app/actions.ts
- markdown.tsx
- ai.ts
- home.ts
- app-shell.tsx
- canvas.ts
- usage.tsx
- public.grade_history
- src_components_ui_draggable_widget_grid
- Order
- src_lib_gsap_gsap
- src_lib_gsap_usegsap
- chat/route.ts
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
- 0010_lock_canvas_settings.sql
- public.items
- public.settings
- src_components_ui_draggable_widget_grid_widgetsize
- settings-forms.tsx
- src_components_ui_draggable_widget_grid_spans
- devDependencies
- materials.tsx
- calendar.tsx
- syllabus.ts
- recharts-pie-chart.tsx
- recharts-radial-chart.tsx
- recharts-tooltip.tsx
- recharts-background.tsx
- recharts-brush.tsx
- recharts-chart.tsx
- features.tsx
- app/layout.tsx
- showcase.tsx
- useAssistant
- motion
- public.calendar_feed
- Things the next Claude must NOT do
- chat-panel.tsx
- public.settings
- scripts
- calendar-rail.tsx
- public.items
- doubt-button.tsx
- chat-input.tsx
- landing/page.tsx
- not-found.tsx
- home-search.tsx
- ai.tsx
- components/widgets.tsx
- next
- PRODUCT.md
- form.tsx
- tasks.tsx
- src_components_ui_container_scroll_animation
- src_components_ui_container_scroll_animation_containerscroll
- 0015_ai_usage.sql
- apple-icon.tsx
- work-view.tsx
- Commercialization roadmap
- courseColor
- login/page.tsx
- opengraph-image.tsx
- @supabase/ssr

## God Nodes (most connected - your core abstractions)
1. `courseColor()` - 60 edges
2. `react` - 52 edges
3. `createClient()` - 48 edges
4. `next` - 43 edges
5. `cn()` - 40 edges
6. `dayKey()` - 32 edges
7. `lucide-react` - 31 edges
8. `useAssistant()` - 30 edges
9. `Item` - 28 edges
10. `motion` - 26 edges

## Surprising Connections (you probably didn't know these)
- `Calendar and class-week grounding` --references--> `studentContext()`  [INFERRED]
  HANDOFF.md → src/lib/ai.ts
- `Syllabus memory in every chat (24k, summary excluded)` --implements--> `studentContext()`  [INFERRED]
  HANDOFF.md → src/lib/ai.ts
- `1. Rate limits — DONE (code), migration 0014 pending in Supabase` --references--> `allowed()`  [INFERRED]
  docs/PHASE-10-PLAN.md → src/lib/limit.ts
- `Reasoning rule (off by default, auto for tutoring, Think toggle)` --references--> `needsThinking()`  [EXTRACTED]
  HANDOFF.md → src/lib/ai.ts
- `Check for dates Canvas missed` --references--> `sameWork()`  [EXTRACTED]
  HANDOFF.md → src/lib/syllabus.ts

## Import Cycles
- 3-file cycle: `src/components/app-shell.tsx -> src/components/chat/chat-panel.tsx -> src/components/chat/chat-input.tsx -> src/components/app-shell.tsx`
- 3-file cycle: `src/components/app-shell.tsx -> src/components/chat/chat-panel.tsx -> src/components/chat/widgets.tsx -> src/components/app-shell.tsx`

## Hyperedges (group relationships)
- **Syllabus reference flow** — src_app_actions_summarizesyllabus, src_components_syllabus_summary_summarydialog, src_lib_syllabus_samework, handoff_syllabus_summary_note, handoff_ask_about_syllabus, handoff_missed_dates_check [EXTRACTED 1.00]
- **Chat request routing** — src_lib_attach_typedpart, src_lib_ai_askstasks, src_lib_ai_wantschange, src_lib_ai_needsthinking, src_lib_ai_streamreply [INFERRED 0.85]

## Communities (100 total, 36 thin omitted)

### Community 0 - "recharts-area-chart.tsx"
Cohesion: 0.05
Nodes (39): Area(), AreaActiveDotProp, AreaAnimationType, AreaChartContext, AreaChartContextValue, AreaDotProp, AreaProps, AreaVariant (+31 more)

### Community 2 - "recharts-radar-chart.tsx"
Cohesion: 0.06
Nodes (34): ColorStopsProps, DotProps, EvilRadarChart(), EvilRadarChartBaseProps, EvilRadarChartProps, generateLoadingData(), Legend(), LegendProps (+26 more)

### Community 3 - "courses.tsx"
Cohesion: 0.18
Nodes (16): useCreate(), CourseCard, CourseFace(), ADD, CoursesGrid(), CourseView(), WhatIf(), Material (+8 more)

### Community 4 - "react"
Cohesion: 0.15
Nodes (23): react, CanvasHtml(), convert(), DROP, external, KEEP, safeUrl(), TABLE_PARTS (+15 more)

### Community 5 - "dashboard.tsx"
Cohesion: 0.13
Nodes (21): ClearWidget(), CountdownWidget(), Course, CUTOFFS, ExamsWidget(), GapsWidget(), GradeBarsWidget(), graded() (+13 more)

### Community 6 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 7 - "dependencies"
Cohesion: 0.08
Nodes (25): dependencies, @base-ui/react, border-beam, class-variance-authority, cn, liquid-gooey, lucide-react, matter-js (+17 more)

### Community 8 - "package.json"
Cohesion: 0.09
Nodes (21): eslintConfig, name, private, version, @base-ui/react, border-beam, class-variance-authority, cn (+13 more)

### Community 9 - "components.json"
Cohesion: 0.08
Nodes (23): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+15 more)

### Community 10 - "ash-burst-button.tsx"
Cohesion: 0.21
Nodes (13): matter-js, react-dom, ASH_COLORS, AshSim, createAshSimulation(), drawShard(), paintSim(), ParticleKind (+5 more)

### Community 11 - "calendar.ts"
Cohesion: 0.07
Nodes (51): RFC-5545, vitest, GET(), CalendarBody(), MiniMonth(), LoadWidget(), SpotlightWidget(), Body() (+43 more)

### Community 12 - "app/actions.ts"
Cohesion: 0.12
Nodes (48): addMaterial(), createCourse(), createItem(), createMeeting(), deleteCourse(), deleteItem(), deleteMaterial(), deleteMeeting() (+40 more)

### Community 13 - "markdown.tsx"
Cohesion: 0.13
Nodes (14): react-markdown, remark-gfm, Markdown, components, HNode, linkCourses(), Markdown(), MdNode (+6 more)

### Community 14 - "ai.ts"
Cohesion: 0.09
Nodes (35): Polish pass before syllabus import, NDJSON streaming protocol (think/text/propose/cards/error), Server-side task answers (no model call), unpdf, asksTasks(), AttachedItem, calendarLines(), classLines() (+27 more)

### Community 15 - "home.ts"
Cohesion: 0.10
Nodes (37): CalendarPage(), metadata, Chat(), metadata, CoursePage(), generateMetadata(), CoursesPage(), metadata (+29 more)

### Community 16 - "app-shell.tsx"
Cohesion: 0.15
Nodes (17): itemChat(), loadChat(), saveChat(), AppShell(), Assistant, AssistantContext, Course, CreateContext (+9 more)

### Community 17 - "canvas.ts"
Cohesion: 0.11
Nodes (27): ref_node_crypto, ref_server_only, @supabase/supabase-js, GET(), maxDuration, GET(), CanvasAssignment, canvasBaseUrl() (+19 more)

### Community 18 - "usage.tsx"
Cohesion: 0.20
Nodes (12): src_components_ui_popover, src_components_ui_popover_popover, src_components_ui_popover_popovercontent, src_components_ui_popover_popovertrigger, KINDS, remaining(), resetDay(), Usage (+4 more)

### Community 19 - "public.grade_history"
Cohesion: 0.50
Nodes (3): public.grade_history, auth, public

### Community 21 - "Order"
Cohesion: 0.14
Nodes (13): 1. Rate limits — DONE (code), migration 0014 pending in Supabase, 2. Security pass, 3. Account deletion and export **[ask: touches auth]**, 4. Legal pages, 5. Monitoring **[ask: dependency or service]**, 6. Analytics **[ask: service]**, 7. Transactional email **[ask: service + DNS]**, 8. Google sign-in **[ask: auth]** (+5 more)

### Community 25 - "chat/route.ts"
Cohesion: 0.18
Nodes (18): askSyllabus(), smartSearch(), summarizeSyllabus(), maxDuration, POST(), lightContext(), Meter, needsSearch() (+10 more)

### Community 26 - "public.calendar_feed"
Cohesion: 0.33
Nodes (5): public.calendar_feed(), public.class_meetings, public.courses, public.items, public.settings

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

### Community 53 - "settings-forms.tsx"
Cohesion: 0.15
Nodes (12): next-themes, signOut(), Submit(), Account, day(), PAINT, SECTIONS, SemesterSettings() (+4 more)

### Community 55 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/matter-js, @types/node, @types/react (+3 more)

### Community 57 - "materials.tsx"
Cohesion: 0.10
Nodes (40): Ask about the syllabus (fresh focused chat), lucide-react, sonner, Course, field, FormError(), label, MaterialRow() (+32 more)

### Community 58 - "calendar.tsx"
Cohesion: 0.06
Nodes (39): liquid-gooey, ADD, Calendar(), clock(), EASE, GridProps, hhmm(), ItemChip() (+31 more)

### Community 59 - "syllabus.ts"
Cohesion: 0.25
Nodes (13): readSyllabus(), bare(), DAYS, Draft, Kind, KINDS, parseSyllabusItems(), realDate() (+5 more)

### Community 60 - "recharts-pie-chart.tsx"
Cohesion: 0.10
Nodes (19): BackgroundProps, EMPTY_GLOWING_SECTORS, EvilPieChartProps, LabelListProps, LabelProps, Legend(), LegendProps, LOADING_PIE_DATA (+11 more)

### Community 61 - "recharts-radial-chart.tsx"
Cohesion: 0.11
Nodes (22): ColorGradientStyle(), EvilRadialChart(), EvilRadialChartBaseProps, EvilRadialChartProps, generateLoadingData(), getVariantConfig(), Legend(), LegendProps (+14 more)

### Community 62 - "recharts-tooltip.tsx"
Cohesion: 0.18
Nodes (17): recharts, ColorGradient(), ColorGradient(), FillGradient(), StrokeGradient(), getColorsCount(), getPayloadConfigFromPayload(), useChart() (+9 more)

### Community 63 - "recharts-background.tsx"
Cohesion: 0.12
Nodes (5): BackgroundVariant, ChartBackground(), ChartBackgroundProps, PATTERN_MAP, PatternProps

### Community 64 - "recharts-brush.tsx"
Cohesion: 0.15
Nodes (13): Brush(), BrushProps, CurveType, DragState, DragType, EvilBrush(), EvilBrushProps, EvilBrushRange (+5 more)

### Community 65 - "recharts-chart.tsx"
Cohesion: 0.15
Nodes (14): AtLeastOneThemeColor, axisValueToPercentFormatter(), ChartContainer(), ChartContainerProps, ChartContext, ChartContextProps, ChartStyle(), distributeColors() (+6 more)

### Community 66 - "features.tsx"
Cohesion: 0.10
Nodes (22): Block(), CalendarDemo(), CLASSES, CountdownDemo(), DAYS, DUE, EVERYTHING, level() (+14 more)

### Community 67 - "app/layout.tsx"
Cohesion: 0.20
Nodes (8): src_app_globals, abril, archivo, metadata, plexMono, viewport, src_components_ui_sonner, src_components_ui_sonner_toaster

### Community 68 - "showcase.tsx"
Cohesion: 0.22
Nodes (8): CoursesDemo(), fadeUp, SectionHead(), Window(), FILES, Showcase(), STEPS, SYNC

### Community 69 - "useAssistant"
Cohesion: 0.26
Nodes (11): thinking-orbs, deleteChat(), listChats(), useAssistant(), ChatHistory(), ChatPage(), Saved, ChatLog() (+3 more)

### Community 70 - "motion"
Cohesion: 0.15
Nodes (14): motion, blurIn, Hero(), rise, stagger, TABS, Caption(), EASE (+6 more)

### Community 71 - "public.calendar_feed"
Cohesion: 0.33
Nodes (5): public.calendar_feed(), public.class_meetings, public.courses, public.items, public.settings

### Community 73 - "Things the next Claude must NOT do"
Cohesion: 0.20
Nodes (10): Phase 3 AI assistant (done), Calendar and class-week grounding, Commit and push every important change to main, AI never saves without a confirm card, Things the next Claude must NOT do, Honest UI (no fake data), Reasoning rule (off by default, auto for tutoring, Think toggle), UI rules (metal=AI only, gooey menus, cyan=you now, course hue rule) (+2 more)

### Community 74 - "chat-panel.tsx"
Cohesion: 0.20
Nodes (9): ChatPanel(), STATUS, Chain, EASE, Mode, ThoughtChain(), src_components_ui_thought_line, src_components_ui_thought_line_thoughtline (+1 more)

### Community 76 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint, start, test

### Community 77 - "calendar-rail.tsx"
Cohesion: 0.16
Nodes (17): useOpenSettings(), Classes(), LEVELS, Props, Semester(), ClassLink(), ProgressBlock(), FeedLink() (+9 more)

### Community 79 - "doubt-button.tsx"
Cohesion: 0.22
Nodes (7): DEFAULT_CONFIRMATIONS, DoubtButton, DoubtButtonProps, DoubtState, extractText(), labelVariants, DoubtButton

### Community 80 - "chat-input.tsx"
Cohesion: 0.19
Nodes (12): ChatInput(), PLACEHOLDERS, Recognition, RecognitionCtor, useDictationSupported(), ABOUT_ITEM, Shortcut, SHORTCUTS (+4 more)

### Community 81 - "landing/page.tsx"
Cohesion: 0.14
Nodes (10): Assistant(), Features(), INCLUDED, LINKS, SiteNav(), Wordmark(), FAQ, metadata (+2 more)

### Community 84 - "home-search.tsx"
Cohesion: 0.09
Nodes (25): Course, EASE, EXAMPLES, Found, HomeSearch(), Row, when(), courseFace() (+17 more)

### Community 85 - "ai.tsx"
Cohesion: 0.12
Nodes (17): AssistantDemo(), DATES, DECK, GRADING, KNOWS, PLAN, POLICIES, POLS (+9 more)

### Community 86 - "components/widgets.tsx"
Cohesion: 0.16
Nodes (21): Dashboard(), FocusBlock(), SHADES, FocusDial(), useFocus(), CalendarWidget(), ClassesWidget(), clock() (+13 more)

### Community 89 - "PRODUCT.md"
Cohesion: 0.06
Nodes (31): AGENTS.md (Next 16 rules), Next.js 16 breaking-changes rule (read node_modules/next/dist/docs), CLAUDE.md includes AGENTS.md (Next 16 rules), Phase 5 complete session handoff, Context-aware chat shortcuts (planned), Exam study guides (planned), Phase 5 Canvas sync (complete), Phase 6 Materials + syllabus (in progress) (+23 more)

### Community 90 - "form.tsx"
Cohesion: 0.36
Nodes (6): google(), LoginState, sendLink(), signIn(), signUp(), LoginForm()

### Community 91 - "tasks.tsx"
Cohesion: 0.22
Nodes (7): maxDuration, TaskName, Tasks, Done, State, src_components_ui_status_mark, src_components_ui_status_mark_statusmark

### Community 95 - "0015_ai_usage.sql"
Cohesion: 0.24
Nodes (7): auth, public.rate_hits, rate_hits_lookup, ai_usage_user_at, public.ai_usage, public.plans, public.usage_status()

### Community 96 - "apple-icon.tsx"
Cohesion: 0.25
Nodes (5): contentType, size, contentType, Mark(), size

### Community 98 - "work-view.tsx"
Cohesion: 0.33
Nodes (7): src_components_ui_dialog_dialogheader, scoreLabel(), Detail, http(), SUBMISSION, WorkView(), createClient()

### Community 99 - "Commercialization roadmap"
Cohesion: 0.18
Nodes (10): At a glance, Commercialization roadmap, Metrics to watch (from Phase 10 on), Phase 10 — Launch readiness, Phase 11 — AI cost & reliability, Phase 12 — Pricing & billing, Phase 13 — Onboarding & activation, Phase 14 — Growth (+2 more)

### Community 101 - "courseColor"
Cohesion: 0.21
Nodes (16): Block(), Dot(), Dot(), WorkCard(), ItemDialog(), ItemDetails(), src_components_ui_button_buttonvariants, src_components_ui_checkbox (+8 more)

### Community 102 - "login/page.tsx"
Cohesion: 0.40
Nodes (3): JSON_LD, metadata, POINTS

### Community 103 - "opengraph-image.tsx"
Cohesion: 0.40
Nodes (3): alt, contentType, size

## Knowledge Gaps
- **419 isolated node(s):** `Result`, `KINDS`, `PLACEHOLDERS`, `Recognition`, `RecognitionCtor` (+414 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 577 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **36 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `recharts-area-chart.tsx`, `recharts-radar-chart.tsx`, `courses.tsx`, `dashboard.tsx`, `package.json`, `ash-burst-button.tsx`, `app/actions.ts`, `home.ts`, `app-shell.tsx`, `usage.tsx`, `settings-forms.tsx`, `materials.tsx`, `calendar.tsx`, `recharts-pie-chart.tsx`, `recharts-radial-chart.tsx`, `recharts-tooltip.tsx`, `recharts-background.tsx`, `recharts-brush.tsx`, `recharts-chart.tsx`, `features.tsx`, `useAssistant`, `motion`, `chat-panel.tsx`, `calendar-rail.tsx`, `doubt-button.tsx`, `chat-input.tsx`, `landing/page.tsx`, `home-search.tsx`, `ai.tsx`, `form.tsx`, `work-view.tsx`, `courseColor`?**
  _High betweenness centrality (0.154) - this node is a cross-community bridge._
- **Why does `next` connect `next` to `courses.tsx`, `react`, `dashboard.tsx`, `package.json`, `app/actions.ts`, `home.ts`, `app-shell.tsx`, `canvas.ts`, `settings-forms.tsx`, `materials.tsx`, `calendar.tsx`, `app/layout.tsx`, `showcase.tsx`, `motion`, `chat-panel.tsx`, `calendar-rail.tsx`, `chat-input.tsx`, `landing/page.tsx`, `not-found.tsx`, `home-search.tsx`, `ai.tsx`, `components/widgets.tsx`, `form.tsx`, `tasks.tsx`, `apple-icon.tsx`, `courseColor`, `login/page.tsx`, `opengraph-image.tsx`, `@supabase/ssr`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **Why does `motion` connect `motion` to `recharts-area-chart.tsx`, `dashboard.tsx`, `package.json`, `ash-burst-button.tsx`, `home.ts`, `app-shell.tsx`, `settings-forms.tsx`, `materials.tsx`, `calendar.tsx`, `recharts-pie-chart.tsx`, `recharts-brush.tsx`, `features.tsx`, `showcase.tsx`, `chat-panel.tsx`, `calendar-rail.tsx`, `doubt-button.tsx`, `chat-input.tsx`, `home-search.tsx`, `ai.tsx`, `components/widgets.tsx`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **What connects `Result`, `KINDS`, `PLACEHOLDERS` to the rest of the system?**
  _419 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `recharts-area-chart.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.04644412191582003 - nodes in this community are weakly interconnected._
- **Should `recharts-radar-chart.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.059233449477351915 - nodes in this community are weakly interconnected._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.1455026455026455 - nodes in this community are weakly interconnected._