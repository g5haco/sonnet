# Graph Report - sonnet  (2026-09-26)

## Corpus Check
- 164 files · ~144,429 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 3, .example 1, .ico 1)

## Summary
- 1314 nodes · 3206 edges · 113 communities (76 shown, 37 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 41 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1fae6e95`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- recharts-area-chart.tsx
- chats_user_item
- recharts-dot.tsx
- app-shell.tsx
- next
- dashboard.tsx
- compilerOptions
- dependencies
- package.json
- components.json
- showcase.tsx
- calendar.ts
- dayKey
- markdown.tsx
- ai.ts
- server.ts
- settings-forms.tsx
- canvas.ts
- usage.tsx
- public.grade_history
- src_components_ui_draggable_widget_grid
- Order
- src_lib_gsap_gsap
- src_lib_gsap_usegsap
- sidebar.tsx
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
- courses.tsx
- src_components_ui_draggable_widget_grid_spans
- devDependencies
- tasks.tsx
- calendar.tsx
- focus-timer.tsx
- sync-window.tsx
- public.decks
- recharts-tooltip.tsx
- carousel.tsx
- recharts-brush.tsx
- recharts-chart.tsx
- features.tsx
- app/layout.tsx
- 0014_rate_limits.sql
- chat/widgets.tsx
- motion
- public.calendar_feed
- createClient
- ash-burst-button.tsx
- public.settings
- scripts
- app/actions.ts
- public.items
- PRODUCT.md
- attach.ts
- landing/page.tsx
- pricing.tsx
- evil-widgets.tsx
- search.ts
- ai.tsx
- addDays
- recharts-background.tsx
- doubt-button.tsx
- home-search.tsx
- syllabus.ts
- course.ts
- src_components_ui_container_scroll_animation
- src_components_ui_container_scroll_animation_containerscroll
- chat-input.tsx
- 0015_ai_usage.sql
- useSubmit
- apple-icon.tsx
- materials.tsx
- Commercialization roadmap
- EvilAreaChart
- study-widgets.tsx
- canvas-html.tsx
- form.tsx
- [code]/page.tsx
- CHIP
- login/page.tsx
- opengraph-image.tsx
- disconnectCanvas
- src_components_ui_interactive_list_preview
- src_components_ui_interactive_list_preview_interactivelistpreview
- not-found.tsx

## God Nodes (most connected - your core abstractions)
1. `courseColor()` - 66 edges
2. `createClient()` - 54 edges
3. `react` - 54 edges
4. `next` - 47 edges
5. `cn()` - 44 edges
6. `dayKey()` - 34 edges
7. `lucide-react` - 34 edges
8. `Item` - 30 edges
9. `motion` - 29 edges
10. `useAssistant()` - 28 edges

## Surprising Connections (you probably didn't know these)
- `1. Rate limits — DONE (code), migration 0014 pending in Supabase` --references--> `allowed()`  [INFERRED]
  docs/PHASE-10-PLAN.md → src/lib/limit.ts
- `Calendar and class-week grounding` --references--> `studentContext()`  [INFERRED]
  HANDOFF.md → src/lib/ai.ts
- `Syllabus memory in every chat (24k, summary excluded)` --implements--> `studentContext()`  [INFERRED]
  HANDOFF.md → src/lib/ai.ts
- `Check for dates Canvas missed` --references--> `sameWork()`  [EXTRACTED]
  HANDOFF.md → src/lib/syllabus.ts
- `Reasoning rule (off by default, auto for tutoring, Think toggle)` --references--> `needsThinking()`  [EXTRACTED]
  HANDOFF.md → src/lib/ai.ts

## Import Cycles
- 3-file cycle: `src/components/app-shell.tsx -> src/components/chat/chat-panel.tsx -> src/components/chat/widgets.tsx -> src/components/app-shell.tsx`
- 3-file cycle: `src/components/app-shell.tsx -> src/components/chat/chat-panel.tsx -> src/components/chat/chat-input.tsx -> src/components/app-shell.tsx`

## Hyperedges (group relationships)
- **Syllabus reference flow** — src_app_actions_summarizesyllabus, src_components_syllabus_summary_summarydialog, src_lib_syllabus_samework, handoff_syllabus_summary_note, handoff_ask_about_syllabus, handoff_missed_dates_check [EXTRACTED 1.00]
- **Chat request routing** — src_lib_attach_typedpart, src_lib_ai_askstasks, src_lib_ai_wantschange, src_lib_ai_needsthinking, src_lib_ai_streamreply [INFERRED 0.85]

## Communities (113 total, 37 thin omitted)

### Community 0 - "recharts-area-chart.tsx"
Cohesion: 0.05
Nodes (36): Area(), AreaActiveDotProp, AreaAnimationType, AreaChartContext, AreaChartContextValue, AreaDotProp, AreaProps, AreaVariant (+28 more)

### Community 2 - "recharts-dot.tsx"
Cohesion: 0.25
Nodes (7): ChartDot, ChartDotProps, ColoredBorderDot, DefaultDot, DotVariant, DotVariantProps, PrimaryBorderDot

### Community 3 - "app-shell.tsx"
Cohesion: 0.12
Nodes (20): Assistant, AssistantContext, Course, CreateContext, Schedule, SettingsContext, useVisibleViewport(), ChatMessage (+12 more)

### Community 4 - "next"
Cohesion: 0.15
Nodes (4): nextConfig, next, @supabase/ssr, config

### Community 5 - "dashboard.tsx"
Cohesion: 0.12
Nodes (28): Block(), CountdownWidget(), Course, Dot(), ExamsWidget(), GradeBarsWidget(), graded(), GradePoint (+20 more)

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

### Community 10 - "showcase.tsx"
Cohesion: 0.18
Nodes (12): SyllabusDemo(), CoursesDemo(), fadeUp, SectionHead(), useSequence(), Window(), FILES, FilesDemo() (+4 more)

### Community 11 - "calendar.ts"
Cohesion: 0.15
Nodes (16): RFC-5545, @supabase/supabase-js, GET(), BYDAY, Feed, floating(), ics(), LABEL (+8 more)

### Community 12 - "dayKey"
Cohesion: 0.32
Nodes (10): MiniMonth(), FocusBlock(), SHADES, BuddyWidget(), StreakWidget(), dayKey(), FocusSession, streak() (+2 more)

### Community 13 - "markdown.tsx"
Cohesion: 0.13
Nodes (14): react-markdown, remark-gfm, Markdown, components, HNode, linkCourses(), Markdown(), MdNode (+6 more)

### Community 14 - "ai.ts"
Cohesion: 0.06
Nodes (63): Phase 3 AI assistant (done), Polish pass before syllabus import, Calendar and class-week grounding, Commit and push every important change to main, AI never saves without a confirm card, Things the next Claude must NOT do, Honest UI (no fake data), NDJSON streaming protocol (think/text/propose/cards/error) (+55 more)

### Community 15 - "server.ts"
Cohesion: 0.13
Nodes (28): CalendarPage(), metadata, Chat(), metadata, CoursePage(), generateMetadata(), CoursesPage(), metadata (+20 more)

### Community 16 - "settings-forms.tsx"
Cohesion: 0.16
Nodes (10): signOut(), Submit(), day(), PAINT, SECTIONS, SemesterSettings(), SettingsSection, SettingsWindow() (+2 more)

### Community 17 - "canvas.ts"
Cohesion: 0.12
Nodes (29): ref_node_crypto, ref_server_only, saveCanvasConnection(), syncCanvasNow(), GET(), maxDuration, CanvasAssignment, canvasBaseUrl() (+21 more)

### Community 18 - "usage.tsx"
Cohesion: 0.20
Nodes (12): src_components_ui_popover, src_components_ui_popover_popover, src_components_ui_popover_popovercontent, src_components_ui_popover_popovertrigger, KINDS, remaining(), resetDay(), Usage (+4 more)

### Community 19 - "public.grade_history"
Cohesion: 0.50
Nodes (3): public.grade_history, auth, public

### Community 21 - "Order"
Cohesion: 0.14
Nodes (13): 1. Rate limits — DONE (code), migration 0014 pending in Supabase, 2. Security pass, 3. Account deletion and export **[ask: touches auth]**, 4. Legal pages, 5. Monitoring **[ask: dependency or service]**, 6. Analytics **[ask: service]**, 7. Transactional email **[ask: service + DNS]**, 8. Google sign-in **[ask: auth]** (+5 more)

### Community 25 - "sidebar.tsx"
Cohesion: 0.18
Nodes (9): liquid-gooey, CREATE, CreateKind, GooeyMenu(), MenuItem, NAV, Sidebar(), SPRING (+1 more)

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

### Community 53 - "courses.tsx"
Cohesion: 0.10
Nodes (44): lucide-react, react, sonner, ADD, Course, field, FormError(), label (+36 more)

### Community 55 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/matter-js, @types/node, @types/react (+3 more)

### Community 57 - "tasks.tsx"
Cohesion: 0.22
Nodes (7): maxDuration, TaskName, Tasks, Done, State, src_components_ui_status_mark, src_components_ui_status_mark_statusmark

### Community 58 - "calendar.tsx"
Cohesion: 0.15
Nodes (19): ADD, Calendar(), clock(), EASE, GridProps, hhmm(), ItemChip(), longDay() (+11 more)

### Community 59 - "focus-timer.tsx"
Cohesion: 0.21
Nodes (13): Focus, FocusButton(), FocusContext, FocusDial(), FocusProvider(), load(), mmss(), Run (+5 more)

### Community 60 - "sync-window.tsx"
Cohesion: 0.12
Nodes (15): useOpenSettings(), Classes(), LEVELS, Props, Semester(), ClassLink(), Account, CANVAS_WORD (+7 more)

### Community 61 - "public.decks"
Cohesion: 0.38
Nodes (6): decks_user_updated, public.decks, public.shared_deck(), auth, public, public.courses

### Community 62 - "recharts-tooltip.tsx"
Cohesion: 0.18
Nodes (17): recharts, ColorGradient(), getColorsCount(), getPayloadConfigFromPayload(), useChart(), ChartLegendContent(), ChartLegendVariant, getLegendFillStyle() (+9 more)

### Community 63 - "carousel.tsx"
Cohesion: 0.27
Nodes (15): ANGLE, Card(), Carousel(), out(), PERIOD, Slide, Spot, spotOf() (+7 more)

### Community 64 - "recharts-brush.tsx"
Cohesion: 0.15
Nodes (13): Brush(), BrushProps, CurveType, DragState, DragType, EvilBrush(), EvilBrushProps, EvilBrushRange (+5 more)

### Community 65 - "recharts-chart.tsx"
Cohesion: 0.15
Nodes (14): AtLeastOneThemeColor, axisValueToPercentFormatter(), ChartContainer(), ChartContainerProps, ChartContext, ChartContextProps, ChartStyle(), distributeColors() (+6 more)

### Community 66 - "features.tsx"
Cohesion: 0.12
Nodes (19): Block(), CalendarDemo(), CLASSES, CountdownDemo(), DAYS, DUE, EVERYTHING, level() (+11 more)

### Community 67 - "app/layout.tsx"
Cohesion: 0.18
Nodes (9): next-themes, src_app_globals, abril, archivo, metadata, plexMono, viewport, src_components_ui_sonner (+1 more)

### Community 68 - "0014_rate_limits.sql"
Cohesion: 0.50
Nodes (3): public.rate_hits, rate_hits_lookup, auth

### Community 69 - "chat/widgets.tsx"
Cohesion: 0.11
Nodes (26): Dot(), WorkCard(), CourseView(), ItemDetails(), EASE, GlassWidget(), PIPS, PlantWidget() (+18 more)

### Community 70 - "motion"
Cohesion: 0.15
Nodes (14): motion, blurIn, Hero(), rise, stagger, TABS, Caption(), EASE (+6 more)

### Community 71 - "public.calendar_feed"
Cohesion: 0.33
Nodes (5): public.calendar_feed(), public.class_meetings, public.courses, public.items, public.settings

### Community 73 - "createClient"
Cohesion: 0.15
Nodes (29): createItem(), createMeeting(), deleteCourse(), deleteItem(), deleteMaterial(), deleteMeeting(), done(), logFocus() (+21 more)

### Community 74 - "ash-burst-button.tsx"
Cohesion: 0.21
Nodes (12): matter-js, react-dom, ASH_COLORS, AshSim, createAshSimulation(), drawShard(), paintSim(), ParticleKind (+4 more)

### Community 76 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint, start, test

### Community 77 - "app/actions.ts"
Cohesion: 0.13
Nodes (21): addMaterial(), cleanCards(), createDeck(), deleteChat(), deleteDeck(), itemChat(), KINDS, listChats() (+13 more)

### Community 79 - "PRODUCT.md"
Cohesion: 0.07
Nodes (28): AGENTS.md (Next 16 rules), Next.js 16 breaking-changes rule (read node_modules/next/dist/docs), CLAUDE.md includes AGENTS.md (Next 16 rules), Phase 5 complete session handoff, Context-aware chat shortcuts (planned), Exam study guides (planned), Phase 5 Canvas sync (complete), Phase 6 Materials + syllabus (in progress) (+20 more)

### Community 80 - "attach.ts"
Cohesion: 0.28
Nodes (7): unpdf, slim(), ChatFile, MAX_FILES, readAttachment(), shrink(), withFiles()

### Community 81 - "landing/page.tsx"
Cohesion: 0.15
Nodes (9): Assistant(), Features(), INCLUDED, LINKS, SiteNav(), Wordmark(), FAQ, metadata (+1 more)

### Community 82 - "pricing.tsx"
Cohesion: 0.11
Nodes (25): EASE, FREE_LIST, ids, PAID, Prices, Pricing(), ProAmount(), saving() (+17 more)

### Community 83 - "evil-widgets.tsx"
Cohesion: 0.22
Nodes (8): vitest, PaceWidget, color(), PaceWidget(), Term, paceByWeek(), items, now

### Community 84 - "search.ts"
Cohesion: 0.13
Nodes (17): aiSearchPrompt(), at0(), Course, FILLER, KINDS, MONTHS, norm(), parseAiSearch() (+9 more)

### Community 85 - "ai.tsx"
Cohesion: 0.17
Nodes (9): DATES, DECK, GRADING, KNOWS, PLAN, POLICIES, POLS, QA (+1 more)

### Community 86 - "addDays"
Cohesion: 0.21
Nodes (17): CalendarBody(), Body(), ClassesWidget(), clock(), inMinutes(), addDays(), at(), mondayOf() (+9 more)

### Community 87 - "recharts-background.tsx"
Cohesion: 0.12
Nodes (4): BackgroundVariant, ChartBackgroundProps, PATTERN_MAP, PatternProps

### Community 88 - "doubt-button.tsx"
Cohesion: 0.22
Nodes (8): useAshBurst(), DEFAULT_CONFIRMATIONS, DoubtButton, DoubtButtonProps, DoubtState, extractText(), labelVariants, DoubtButton

### Community 89 - "home-search.tsx"
Cohesion: 0.19
Nodes (12): CourseCard, CourseFace(), courseStats(), Course, EASE, EXAMPLES, Found, HomeSearch() (+4 more)

### Community 90 - "syllabus.ts"
Cohesion: 0.23
Nodes (14): importSyllabus(), readSyllabus(), bare(), DAYS, Draft, Kind, KINDS, parseSyllabusItems() (+6 more)

### Community 91 - "course.ts"
Cohesion: 0.21
Nodes (11): TrendWidget(), WhatIf(), Dashboard(), gradeLabel(), HUES, letterGrade(), LETTERS, needOnFinal() (+3 more)

### Community 94 - "chat-input.tsx"
Cohesion: 0.13
Nodes (19): border-beam, metal-fx, thinking-orbs, voice-glow, useAssistant(), ChatInput(), PLACEHOLDERS, Recognition (+11 more)

### Community 95 - "0015_ai_usage.sql"
Cohesion: 0.39
Nodes (5): ai_usage_user_at, public.ai_usage, public.plans, public.usage_status(), auth

### Community 96 - "useSubmit"
Cohesion: 0.24
Nodes (11): createCourse(), saveName(), saveTerm(), text(), CourseDialog(), ItemDialog(), useSubmit(), Onboarding() (+3 more)

### Community 97 - "apple-icon.tsx"
Cohesion: 0.25
Nodes (5): contentType, size, contentType, Mark(), size

### Community 98 - "materials.tsx"
Cohesion: 0.16
Nodes (17): Ask about the syllabus (fresh focused chat), useCreate(), CoursesGrid(), Material, MaterialRow(), Materials(), megabytes(), Sent (+9 more)

### Community 99 - "Commercialization roadmap"
Cohesion: 0.18
Nodes (10): At a glance, Commercialization roadmap, Metrics to watch (from Phase 10 on), Phase 10 — Launch readiness, Phase 11 — AI cost & reliability, Phase 12 — Pricing & billing, Phase 13 — Onboarding & activation, Phase 14 — Growth (+2 more)

### Community 101 - "EvilAreaChart"
Cohesion: 0.50
Nodes (4): EvilAreaChart(), useLoadingData(), useEvilBrush(), getLoadingData()

### Community 102 - "study-widgets.tsx"
Cohesion: 0.17
Nodes (15): BreatheWidget(), byDue(), EASE, Mood, MOUTHS, noise(), NoteWidget(), PHASES (+7 more)

### Community 103 - "canvas-html.tsx"
Cohesion: 0.28
Nodes (7): CanvasHtml(), convert(), DROP, external, KEEP, safeUrl(), TABLE_PARTS

### Community 104 - "form.tsx"
Cohesion: 0.36
Nodes (6): google(), LoginState, sendLink(), signIn(), signUp(), LoginForm()

### Community 105 - "[code]/page.tsx"
Cohesion: 0.60
Nodes (4): generateMetadata(), load, SharedDeckPage(), Card

### Community 106 - "CHIP"
Cohesion: 0.40
Nodes (5): AssistantDemo(), UpNext(), CHIP, CourseLink(), ItemLink()

### Community 107 - "login/page.tsx"
Cohesion: 0.40
Nodes (3): JSON_LD, metadata, POINTS

### Community 108 - "opengraph-image.tsx"
Cohesion: 0.40
Nodes (3): alt, contentType, size

### Community 109 - "disconnectCanvas"
Cohesion: 0.67
Nodes (3): disconnectCanvas(), resetAllData(), CanvasForm()

## Knowledge Gaps
- **400 isolated node(s):** `metadata`, `WORKS_WITH`, `FAQ`, `Props`, `LEVELS` (+395 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 561 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **37 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `courses.tsx` to `recharts-area-chart.tsx`, `recharts-dot.tsx`, `app-shell.tsx`, `dashboard.tsx`, `package.json`, `settings-forms.tsx`, `usage.tsx`, `sidebar.tsx`, `calendar.tsx`, `focus-timer.tsx`, `sync-window.tsx`, `recharts-tooltip.tsx`, `carousel.tsx`, `recharts-brush.tsx`, `recharts-chart.tsx`, `features.tsx`, `chat/widgets.tsx`, `motion`, `createClient`, `ash-burst-button.tsx`, `landing/page.tsx`, `pricing.tsx`, `ai.tsx`, `recharts-background.tsx`, `doubt-button.tsx`, `home-search.tsx`, `chat-input.tsx`, `materials.tsx`, `study-widgets.tsx`, `canvas-html.tsx`, `form.tsx`, `[code]/page.tsx`?**
  _High betweenness centrality (0.154) - this node is a cross-community bridge._
- **Why does `next` connect `next` to `app-shell.tsx`, `dashboard.tsx`, `package.json`, `showcase.tsx`, `server.ts`, `settings-forms.tsx`, `sidebar.tsx`, `courses.tsx`, `tasks.tsx`, `calendar.tsx`, `sync-window.tsx`, `carousel.tsx`, `app/layout.tsx`, `chat/widgets.tsx`, `motion`, `createClient`, `app/actions.ts`, `landing/page.tsx`, `pricing.tsx`, `ai.tsx`, `home-search.tsx`, `chat-input.tsx`, `apple-icon.tsx`, `materials.tsx`, `form.tsx`, `[code]/page.tsx`, `login/page.tsx`, `opengraph-image.tsx`, `not-found.tsx`?**
  _High betweenness centrality (0.112) - this node is a cross-community bridge._
- **Why does `motion` connect `motion` to `recharts-area-chart.tsx`, `app-shell.tsx`, `dashboard.tsx`, `package.json`, `showcase.tsx`, `settings-forms.tsx`, `sidebar.tsx`, `courses.tsx`, `calendar.tsx`, `focus-timer.tsx`, `sync-window.tsx`, `recharts-brush.tsx`, `features.tsx`, `chat/widgets.tsx`, `ash-burst-button.tsx`, `pricing.tsx`, `ai.tsx`, `doubt-button.tsx`, `home-search.tsx`, `chat-input.tsx`, `study-widgets.tsx`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **What connects `metadata`, `WORKS_WITH`, `FAQ` to the rest of the system?**
  _400 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `recharts-area-chart.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0473469387755102 - nodes in this community are weakly interconnected._
- **Should `app-shell.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1225296442687747 - nodes in this community are weakly interconnected._
- **Should `dashboard.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12195121951219512 - nodes in this community are weakly interconnected._