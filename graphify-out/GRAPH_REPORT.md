# Graph Report - sonnet  (2026-09-25)

## Corpus Check
- 138 files · ~100,933 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 3, .example 1, .ico 1)

## Summary
- 1120 nodes · 2784 edges · 86 communities (57 shown, 29 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 38 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1f112c54`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- recharts-area-chart.tsx
- chats_user_item
- recharts-radar-chart.tsx
- calendar-rail.tsx
- createClient
- startOfDay
- compilerOptions
- dependencies
- package.json
- components.json
- ash-burst-button.tsx
- dashboard.tsx
- settings-forms.tsx
- markdown.tsx
- ai.ts
- calendar.ts
- useAssistant
- canvas.ts
- app-shell.tsx
- public.grade_history
- src_components_ui_draggable_widget_grid
- sidebar.tsx
- src_lib_gsap_gsap
- src_lib_gsap_usegsap
- calendar.tsx
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
- components/widgets.tsx
- src_components_ui_draggable_widget_grid_spans
- app/actions.ts
- home.ts
- extract.ts
- utils.ts
- recharts-pie-chart.tsx
- recharts-radial-chart.tsx
- recharts-tooltip.tsx
- recharts-background.tsx
- recharts-brush.tsx
- recharts-chart.tsx
- syllabus.ts
- chat/route.ts
- chat-panel.tsx
- react
- devDependencies
- carousel.tsx
- PRODUCT.md
- focus-timer.tsx
- Phase 6 Materials + syllabus (in progress)
- scripts
- sync-window.tsx
- courses.tsx
- chat-input.tsx
- chat-page.tsx
- sonner
- ai.test.ts
- app/layout.tsx
- canvas-html.tsx
- attach.ts

## God Nodes (most connected - your core abstractions)
1. `courseColor()` - 51 edges
2. `createClient()` - 45 edges
3. `react` - 45 edges
4. `cn()` - 38 edges
5. `next` - 34 edges
6. `dayKey()` - 30 edges
7. `useAssistant()` - 28 edges
8. `Item` - 25 edges
9. `lucide-react` - 25 edges
10. `startOfDay()` - 23 edges

## Surprising Connections (you probably didn't know these)
- `Calendar and class-week grounding` --references--> `studentContext()`  [INFERRED]
  HANDOFF.md → src/lib/ai.ts
- `Syllabus memory in every chat (24k, summary excluded)` --implements--> `studentContext()`  [INFERRED]
  HANDOFF.md → src/lib/ai.ts
- `Reasoning rule (off by default, auto for tutoring, Think toggle)` --references--> `needsThinking()`  [EXTRACTED]
  HANDOFF.md → src/lib/ai.ts
- `AI never saves without a confirm card` --references--> `applyProposal()`  [EXTRACTED]
  HANDOFF.md → src/components/chat/proposal-card.tsx
- `Check for dates Canvas missed` --references--> `sameWork()`  [EXTRACTED]
  HANDOFF.md → src/lib/syllabus.ts

## Import Cycles
- 3-file cycle: `src/components/app-shell.tsx -> src/components/chat/chat-panel.tsx -> src/components/chat/chat-input.tsx -> src/components/app-shell.tsx`
- 3-file cycle: `src/components/app-shell.tsx -> src/components/chat/chat-panel.tsx -> src/components/chat/widgets.tsx -> src/components/app-shell.tsx`

## Hyperedges (group relationships)
- **Syllabus reference flow** — src_app_actions_summarizesyllabus, src_components_syllabus_summary_summarydialog, src_lib_syllabus_samework, handoff_syllabus_summary_note, handoff_ask_about_syllabus, handoff_missed_dates_check [EXTRACTED 1.00]
- **Chat request routing** — src_lib_attach_typedpart, src_lib_ai_askstasks, src_lib_ai_wantschange, src_lib_ai_needsthinking, src_lib_ai_streamreply [INFERRED 0.85]

## Communities (86 total, 29 thin omitted)

### Community 0 - "recharts-area-chart.tsx"
Cohesion: 0.05
Nodes (39): Area(), AreaActiveDotProp, AreaAnimationType, AreaChartContext, AreaChartContextValue, AreaDotProp, AreaProps, AreaVariant (+31 more)

### Community 2 - "recharts-radar-chart.tsx"
Cohesion: 0.06
Nodes (34): ColorStopsProps, DotProps, EvilRadarChart(), EvilRadarChartBaseProps, EvilRadarChartProps, generateLoadingData(), Legend(), LegendProps (+26 more)

### Community 3 - "calendar-rail.tsx"
Cohesion: 0.17
Nodes (16): useOpenSettings(), Classes(), LEVELS, MiniMonth(), Props, Semester(), LoadWidget(), Body() (+8 more)

### Community 4 - "createClient"
Cohesion: 0.07
Nodes (39): nextConfig, next, @supabase/ssr, CalendarPage(), metadata, Chat(), metadata, CoursePage() (+31 more)

### Community 5 - "startOfDay"
Cohesion: 0.23
Nodes (11): vitest, parseDay(), startOfDay(), openByCourse(), openByKind(), paceByWeek(), items, now (+3 more)

### Community 6 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 7 - "dependencies"
Cohesion: 0.08
Nodes (25): dependencies, @base-ui/react, border-beam, class-variance-authority, cn, liquid-gooey, lucide-react, matter-js (+17 more)

### Community 8 - "package.json"
Cohesion: 0.11
Nodes (18): eslintConfig, name, private, version, @base-ui/react, class-variance-authority, cn, eslint (+10 more)

### Community 9 - "components.json"
Cohesion: 0.08
Nodes (23): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+15 more)

### Community 10 - "ash-burst-button.tsx"
Cohesion: 0.12
Nodes (20): matter-js, react-dom, ASH_COLORS, AshSim, createAshSimulation(), drawShard(), paintSim(), ParticleKind (+12 more)

### Community 11 - "dashboard.tsx"
Cohesion: 0.08
Nodes (39): CountdownWidget(), Course, CUTOFFS, Dot(), ExamsWidget(), GapsWidget(), GradeBarsWidget(), graded() (+31 more)

### Community 12 - "settings-forms.tsx"
Cohesion: 0.16
Nodes (14): resetAllData(), saveName(), signOut(), Submit(), useSubmit(), day(), NameForm(), PAINT (+6 more)

### Community 13 - "markdown.tsx"
Cohesion: 0.16
Nodes (11): react-markdown, remark-gfm, Markdown, components, HNode, linkCourses(), Markdown(), MdNode (+3 more)

### Community 14 - "ai.ts"
Cohesion: 0.13
Nodes (18): AttachedItem, calendarLines(), classLines(), ClassRow, ClassTime, dayName(), DAYS, itemContext() (+10 more)

### Community 15 - "calendar.ts"
Cohesion: 0.15
Nodes (18): RFC-5545, setDone(), GET(), CalendarBody(), BYDAY, ClassMeeting, Feed, floating() (+10 more)

### Community 16 - "useAssistant"
Cohesion: 0.20
Nodes (15): addMaterial(), importSyllabus(), useAssistant(), CourseLink(), Materials(), UploadWindow(), useUpload(), Review() (+7 more)

### Community 17 - "canvas.ts"
Cohesion: 0.12
Nodes (27): ref_node_crypto, ref_server_only, @supabase/supabase-js, GET(), maxDuration, CanvasAssignment, canvasBaseUrl(), CanvasCourse (+19 more)

### Community 18 - "app-shell.tsx"
Cohesion: 0.12
Nodes (20): itemChat(), loadChat(), saveChat(), AppShell(), Assistant, AssistantContext, Course, CreateContext (+12 more)

### Community 19 - "public.grade_history"
Cohesion: 0.50
Nodes (3): auth, public, public.grade_history

### Community 21 - "sidebar.tsx"
Cohesion: 0.18
Nodes (9): liquid-gooey, CREATE, CreateKind, GooeyMenu(), MenuItem, NAV, Sidebar(), SPRING (+1 more)

### Community 25 - "calendar.tsx"
Cohesion: 0.15
Nodes (19): ADD, Calendar(), clock(), EASE, GridProps, hhmm(), ItemChip(), longDay() (+11 more)

### Community 26 - "public.calendar_feed"
Cohesion: 0.18
Nodes (9): public.class_meetings, public.courses, public.items, public.settings, public.calendar_feed(), public.courses, public.items, public.settings (+1 more)

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

### Community 53 - "components/widgets.tsx"
Cohesion: 0.19
Nodes (19): FocusBlock(), SHADES, FocusDial(), useFocus(), ClassesWidget(), clock(), inMinutes(), KIND_ICON (+11 more)

### Community 55 - "app/actions.ts"
Cohesion: 0.17
Nodes (28): createCourse(), createItem(), createMeeting(), deleteCourse(), deleteMaterial(), deleteMeeting(), done(), KINDS (+20 more)

### Community 57 - "home.ts"
Cohesion: 0.21
Nodes (17): Drag, SnapGrid(), SPRING, COLS, DEFAULT_LAYOUT, fits(), freeSpot(), Layout (+9 more)

### Community 58 - "extract.ts"
Cohesion: 0.20
Nodes (10): Syllabus memory in every chat (24k, summary excluded), Syllabus as reference (not date import), Syllabus summary note, askSyllabus(), summarizeSyllabus(), complete(), VISION_MODEL, extractText() (+2 more)

### Community 59 - "utils.ts"
Cohesion: 0.15
Nodes (19): deleteItem(), Block(), CodeBlock(), CopyAnswer(), ItemLink(), useCopy(), ExamRing(), Fit() (+11 more)

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

### Community 66 - "syllabus.ts"
Cohesion: 0.13
Nodes (20): Phase 5 Canvas sync (complete), Phase reorder (nothing dropped), Phase 0 Foundation plan (historical), Student Hub design spec v1, Vercel AI SDK + Anthropic (claude-haiku-4-5 / claude-sonnet-5), <=$10/month, v1.5 spec: shell, AI panel, calendar, materials, Canvas sync (encrypted token + ICS, daily cron), Check for dates Canvas missed (+12 more)

### Community 67 - "chat/route.ts"
Cohesion: 0.33
Nodes (10): NDJSON streaming protocol (think/text/propose/cards/error), maxDuration, POST(), lightContext(), needsSearch(), needsThinking(), needsVision(), smallTalk() (+2 more)

### Community 68 - "chat-panel.tsx"
Cohesion: 0.18
Nodes (11): thinking-orbs, ChatLog(), ChatMessage, ChatPanel(), STATUS, Chain, EASE, Mode (+3 more)

### Community 69 - "react"
Cohesion: 0.11
Nodes (36): Ask about the syllabus (fresh focused chat), lucide-react, motion, react, Course, field, FormError(), label (+28 more)

### Community 70 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/matter-js, @types/node, @types/react (+3 more)

### Community 71 - "carousel.tsx"
Cohesion: 0.27
Nodes (15): ANGLE, Card(), Carousel(), out(), PERIOD, Slide, Spot, spotOf() (+7 more)

### Community 73 - "PRODUCT.md"
Cohesion: 0.12
Nodes (15): AGENTS.md (Next 16 rules), Phase 5 complete session handoff, Phase 3 AI assistant (done), Calendar and class-week grounding, Commit and push every important change to main, AI never saves without a confirm card, Things the next Claude must NOT do, Honest UI (no fake data) (+7 more)

### Community 74 - "focus-timer.tsx"
Cohesion: 0.21
Nodes (12): logFocus(), Focus, FocusButton(), FocusContext, FocusProvider(), load(), mmss(), Run (+4 more)

### Community 75 - "Phase 6 Materials + syllabus (in progress)"
Cohesion: 0.13
Nodes (15): Next.js 16 breaking-changes rule (read node_modules/next/dist/docs), CLAUDE.md includes AGENTS.md (Next 16 rules), Context-aware chat shortcuts (planned), Exam study guides (planned), Phase 6 Materials + syllabus (in progress), Chat attachments (photos, PDFs, text; up to 3), DeepSeek v4.1 flash default model, Env vars (SUPABASE keys, AI_API_KEY, AI_MODEL, AI_VISION_MODEL, CANVAS_ENCRYPTION_KEY, CRON_SECRET) (+7 more)

### Community 76 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint, start, test

### Community 77 - "sync-window.tsx"
Cohesion: 0.22
Nodes (10): disconnectCanvas(), resetFeed(), saveCanvasConnection(), syncCanvasNow(), Onboarding(), CanvasForm(), FeedLink(), Tone (+2 more)

### Community 78 - "courses.tsx"
Cohesion: 0.15
Nodes (21): saveHomeLayout(), useCreate(), ClearWidget(), CourseCard, CourseFace(), courseStats(), ADD, CoursesGrid() (+13 more)

### Community 79 - "chat-input.tsx"
Cohesion: 0.21
Nodes (10): metal-fx, voice-glow, ChatInput(), PLACEHOLDERS, Recognition, RecognitionCtor, useDictationSupported(), ABOUT_ITEM (+2 more)

### Community 80 - "chat-page.tsx"
Cohesion: 0.24
Nodes (9): border-beam, deleteChat(), listChats(), ChatHistory(), Saved, src_components_ui_popover, src_components_ui_popover_popover, src_components_ui_popover_popovercontent (+1 more)

### Community 81 - "sonner"
Cohesion: 0.24
Nodes (6): sonner, maxDuration, TaskName, Tasks, Done, State

### Community 82 - "ai.test.ts"
Cohesion: 0.36
Nodes (8): Polish pass before syllabus import, Server-side task answers (no model call), asksTasks(), ITEM_DESCRIPTION_CAP, taskAnswer(), toolsFor(), wantsCards(), wantsChange()

### Community 83 - "app/layout.tsx"
Cohesion: 0.22
Nodes (7): next-themes, src_app_globals, geistMono, geistSans, metadata, src_components_ui_sonner, src_components_ui_sonner_toaster

### Community 84 - "canvas-html.tsx"
Cohesion: 0.28
Nodes (7): CanvasHtml(), convert(), DROP, external, KEEP, safeUrl(), TABLE_PARTS

### Community 85 - "attach.ts"
Cohesion: 0.32
Nodes (6): unpdf, ChatFile, MAX_FILES, readAttachment(), shrink(), withFiles()

## Knowledge Gaps
- **338 isolated node(s):** `Props`, `LEVELS`, `VIEWS`, `EASE`, `ADD` (+333 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 467 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **29 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `recharts-area-chart.tsx`, `recharts-radar-chart.tsx`, `calendar-rail.tsx`, `createClient`, `package.json`, `ash-burst-button.tsx`, `dashboard.tsx`, `settings-forms.tsx`, `app-shell.tsx`, `sidebar.tsx`, `calendar.tsx`, `app/actions.ts`, `home.ts`, `utils.ts`, `recharts-pie-chart.tsx`, `recharts-radial-chart.tsx`, `recharts-tooltip.tsx`, `recharts-background.tsx`, `recharts-brush.tsx`, `recharts-chart.tsx`, `chat-panel.tsx`, `carousel.tsx`, `focus-timer.tsx`, `sync-window.tsx`, `courses.tsx`, `chat-input.tsx`, `chat-page.tsx`, `canvas-html.tsx`?**
  _High betweenness centrality (0.173) - this node is a cross-community bridge._
- **Why does `next` connect `createClient` to `calendar-rail.tsx`, `chat-panel.tsx`, `react`, `carousel.tsx`, `package.json`, `dashboard.tsx`, `settings-forms.tsx`, `courses.tsx`, `chat-input.tsx`, `sonner`, `app-shell.tsx`, `app/layout.tsx`, `sidebar.tsx`, `components/widgets.tsx`, `app/actions.ts`, `calendar.tsx`, `utils.ts`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **What connects `Props`, `LEVELS`, `VIEWS` to the rest of the system?**
  _338 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `recharts-area-chart.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.04644412191582003 - nodes in this community are weakly interconnected._
- **Should `recharts-radar-chart.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.059233449477351915 - nodes in this community are weakly interconnected._
- **Should `createClient` be split into smaller, more focused modules?**
  _Cohesion score 0.06758832565284179 - nodes in this community are weakly interconnected._