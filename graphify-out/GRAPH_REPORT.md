# Graph Report - sonnet  (2026-09-26)

## Corpus Check
- 164 files · ~144,431 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 3, .example 1, .ico 1)

## Summary
- 1315 nodes · 3208 edges · 97 communities (61 shown, 36 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 40 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `98860f1f`
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
- course.ts
- components/widgets.tsx
- chat/widgets.tsx
- ai.ts
- flashcards.tsx
- settings-forms.tsx
- app/actions.ts
- courses.tsx
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
- materials.tsx
- src_components_ui_draggable_widget_grid_spans
- devDependencies
- syllabus-import.tsx
- calendar.tsx
- focus-timer.tsx
- sync-window.tsx
- public.decks
- recharts-tooltip.tsx
- react
- recharts-brush.tsx
- recharts-chart.tsx
- features.tsx
- app/layout.tsx
- 0014_rate_limits.sql
- utils.ts
- motion
- public.calendar_feed
- ash-burst-button.tsx
- public.settings
- scripts
- public.items
- syllabus.ts
- chat-input.tsx
- lucide-react
- pricing.tsx
- evil-widgets.tsx
- search.ts
- ai.tsx
- doubt-button.tsx
- home-search.tsx
- src_components_ui_container_scroll_animation
- src_components_ui_container_scroll_animation_containerscroll
- chat-page.tsx
- 0015_ai_usage.sql
- work-view.tsx
- Commercialization roadmap
- EvilAreaChart
- study-widgets.tsx
- src_components_ui_interactive_list_preview
- src_components_ui_interactive_list_preview_interactivelistpreview

## God Nodes (most connected - your core abstractions)
1. `courseColor()` - 66 edges
2. `react` - 54 edges
3. `createClient()` - 54 edges
4. `next` - 47 edges
5. `cn()` - 44 edges
6. `lucide-react` - 34 edges
7. `dayKey()` - 34 edges
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
- `AI never saves without a confirm card` --references--> `applyProposal()`  [EXTRACTED]
  HANDOFF.md → src/components/chat/proposal-card.tsx
- `Reasoning rule (off by default, auto for tutoring, Think toggle)` --references--> `needsThinking()`  [EXTRACTED]
  HANDOFF.md → src/lib/ai.ts

## Import Cycles
- 3-file cycle: `src/components/app-shell.tsx -> src/components/chat/chat-panel.tsx -> src/components/chat/chat-input.tsx -> src/components/app-shell.tsx`
- 3-file cycle: `src/components/app-shell.tsx -> src/components/chat/chat-panel.tsx -> src/components/chat/widgets.tsx -> src/components/app-shell.tsx`

## Hyperedges (group relationships)
- **Syllabus reference flow** — src_app_actions_summarizesyllabus, src_components_syllabus_summary_summarydialog, src_lib_syllabus_samework, handoff_syllabus_summary_note, handoff_ask_about_syllabus, handoff_missed_dates_check [EXTRACTED 1.00]
- **Chat request routing** — src_lib_attach_typedpart, src_lib_ai_askstasks, src_lib_ai_wantschange, src_lib_ai_needsthinking, src_lib_ai_streamreply [INFERRED 0.85]

## Communities (97 total, 36 thin omitted)

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
Cohesion: 0.05
Nodes (23): nextConfig, next, @supabase/ssr, contentType, size, GET(), contentType, Mark() (+15 more)

### Community 5 - "dashboard.tsx"
Cohesion: 0.11
Nodes (24): CountdownWidget(), Course, ExamsWidget(), GradeBarsWidget(), graded(), GradePoint, hm(), HoursWidget() (+16 more)

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
Cohesion: 0.22
Nodes (8): CoursesDemo(), fadeUp, SectionHead(), Window(), FILES, Showcase(), STEPS, SYNC

### Community 11 - "course.ts"
Cohesion: 0.13
Nodes (30): RFC-5545, @supabase/supabase-js, GET(), CalendarBody(), MiniMonth(), CourseFace(), courseStats(), addDays() (+22 more)

### Community 12 - "components/widgets.tsx"
Cohesion: 0.19
Nodes (18): FocusBlock(), SHADES, BuddyWidget(), WeekStrip(), CalendarWidget(), ClassesWidget(), clock(), inMinutes() (+10 more)

### Community 13 - "chat/widgets.tsx"
Cohesion: 0.14
Nodes (21): react-markdown, remark-gfm, useAssistant(), Markdown, components, HNode, linkCourses(), Markdown() (+13 more)

### Community 14 - "ai.ts"
Cohesion: 0.05
Nodes (66): Phase 3 AI assistant (done), Polish pass before syllabus import, Calendar and class-week grounding, Commit and push every important change to main, AI never saves without a confirm card, Things the next Claude must NOT do, Honest UI (no fake data), NDJSON streaming protocol (think/text/propose/cards/error) (+58 more)

### Community 15 - "flashcards.tsx"
Cohesion: 0.08
Nodes (45): CalendarPage(), metadata, Chat(), metadata, CoursePage(), generateMetadata(), CoursesPage(), metadata (+37 more)

### Community 16 - "settings-forms.tsx"
Cohesion: 0.12
Nodes (18): signOut(), Course, CourseDialog(), ItemDialog(), Submit(), useSubmit(), Account, day() (+10 more)

### Community 17 - "app/actions.ts"
Cohesion: 0.06
Nodes (85): ref_node_crypto, ref_server_only, addMaterial(), cleanCards(), createCourse(), createDeck(), createItem(), createMeeting() (+77 more)

### Community 18 - "courses.tsx"
Cohesion: 0.15
Nodes (17): usageStatus(), useCreate(), ADD, CoursesGrid(), src_components_ui_popover, src_components_ui_popover_popover, src_components_ui_popover_popovercontent, src_components_ui_popover_popovertrigger (+9 more)

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

### Community 53 - "materials.tsx"
Cohesion: 0.11
Nodes (28): Ask about the syllabus (fresh focused chat), field, FormError(), ItemDetails(), Material, MaterialRow(), megabytes(), Sent (+20 more)

### Community 55 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/matter-js, @types/node, @types/react (+3 more)

### Community 57 - "syllabus-import.tsx"
Cohesion: 0.11
Nodes (21): sonner, importSyllabus(), maxDuration, TaskName, Tasks, Materials(), useUpload(), KINDS (+13 more)

### Community 58 - "calendar.tsx"
Cohesion: 0.11
Nodes (28): ADD, Calendar(), clock(), EASE, GridProps, hhmm(), ItemChip(), longDay() (+20 more)

### Community 59 - "focus-timer.tsx"
Cohesion: 0.21
Nodes (13): Focus, FocusButton(), FocusContext, FocusDial(), FocusProvider(), load(), mmss(), Run (+5 more)

### Community 60 - "sync-window.tsx"
Cohesion: 0.18
Nodes (6): label, CANVAS_WORD, CanvasState, SyncWindow(), Tone, useCanvas()

### Community 61 - "public.decks"
Cohesion: 0.38
Nodes (6): decks_user_updated, public.decks, public.shared_deck(), auth, public, public.courses

### Community 62 - "recharts-tooltip.tsx"
Cohesion: 0.18
Nodes (17): recharts, ColorGradient(), getColorsCount(), getPayloadConfigFromPayload(), useChart(), ChartLegendContent(), ChartLegendVariant, getLegendFillStyle() (+9 more)

### Community 63 - "react"
Cohesion: 0.07
Nodes (27): react, CanvasHtml(), convert(), DROP, external, KEEP, safeUrl(), TABLE_PARTS (+19 more)

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

### Community 69 - "utils.ts"
Cohesion: 0.15
Nodes (21): Block(), CourseView(), EASE, GlassWidget(), PIPS, PlantWidget(), r2(), RollWidget() (+13 more)

### Community 70 - "motion"
Cohesion: 0.15
Nodes (14): motion, blurIn, Hero(), rise, stagger, TABS, Caption(), EASE (+6 more)

### Community 71 - "public.calendar_feed"
Cohesion: 0.33
Nodes (5): public.calendar_feed(), public.class_meetings, public.courses, public.items, public.settings

### Community 74 - "ash-burst-button.tsx"
Cohesion: 0.21
Nodes (12): matter-js, react-dom, ASH_COLORS, AshSim, createAshSimulation(), drawShard(), paintSim(), ParticleKind (+4 more)

### Community 76 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint, start, test

### Community 79 - "syllabus.ts"
Cohesion: 0.06
Nodes (39): AGENTS.md (Next 16 rules), Next.js 16 breaking-changes rule (read node_modules/next/dist/docs), CLAUDE.md includes AGENTS.md (Next 16 rules), Phase 5 complete session handoff, Context-aware chat shortcuts (planned), Exam study guides (planned), Phase 5 Canvas sync (complete), Phase 6 Materials + syllabus (in progress) (+31 more)

### Community 80 - "chat-input.tsx"
Cohesion: 0.16
Nodes (13): metal-fx, voice-glow, slim(), ChatInput(), PLACEHOLDERS, Recognition, RecognitionCtor, useDictationSupported() (+5 more)

### Community 81 - "lucide-react"
Cohesion: 0.15
Nodes (10): lucide-react, Assistant(), Features(), INCLUDED, LINKS, SiteNav(), Wordmark(), FAQ (+2 more)

### Community 82 - "pricing.tsx"
Cohesion: 0.11
Nodes (25): EASE, FREE_LIST, ids, PAID, Prices, Pricing(), ProAmount(), saving() (+17 more)

### Community 83 - "evil-widgets.tsx"
Cohesion: 0.14
Nodes (14): vitest, WhatIf(), PaceWidget, color(), PaceWidget(), parseDay(), Term, paceByWeek() (+6 more)

### Community 84 - "search.ts"
Cohesion: 0.13
Nodes (17): aiSearchPrompt(), at0(), Course, FILLER, KINDS, MONTHS, norm(), parseAiSearch() (+9 more)

### Community 85 - "ai.tsx"
Cohesion: 0.13
Nodes (16): AssistantDemo(), DATES, DECK, GRADING, KNOWS, PLAN, POLICIES, POLS (+8 more)

### Community 88 - "doubt-button.tsx"
Cohesion: 0.22
Nodes (8): useAshBurst(), DEFAULT_CONFIRMATIONS, DoubtButton, DoubtButtonProps, DoubtState, extractText(), labelVariants, DoubtButton

### Community 89 - "home-search.tsx"
Cohesion: 0.22
Nodes (10): useOpenSettings(), Semester(), Course, EASE, EXAMPLES, Found, HomeSearch(), Row (+2 more)

### Community 94 - "chat-page.tsx"
Cohesion: 0.20
Nodes (9): border-beam, thinking-orbs, Saved, ChatLog(), ABOUT_ITEM, Shortcut, SHORTCUTS, shortcutsFor() (+1 more)

### Community 95 - "0015_ai_usage.sql"
Cohesion: 0.39
Nodes (5): ai_usage_user_at, public.ai_usage, public.plans, public.usage_status(), auth

### Community 98 - "work-view.tsx"
Cohesion: 0.29
Nodes (8): src_components_ui_button_buttonvariants, src_components_ui_dialog_dialogheader, scoreLabel(), Detail, http(), SUBMISSION, WorkView(), createClient()

### Community 99 - "Commercialization roadmap"
Cohesion: 0.18
Nodes (10): At a glance, Commercialization roadmap, Metrics to watch (from Phase 10 on), Phase 10 — Launch readiness, Phase 11 — AI cost & reliability, Phase 12 — Pricing & billing, Phase 13 — Onboarding & activation, Phase 14 — Growth (+2 more)

### Community 101 - "EvilAreaChart"
Cohesion: 0.50
Nodes (4): EvilAreaChart(), useLoadingData(), useEvilBrush(), getLoadingData()

### Community 102 - "study-widgets.tsx"
Cohesion: 0.17
Nodes (15): BreatheWidget(), byDue(), EASE, Mood, MOUTHS, noise(), NoteWidget(), PHASES (+7 more)

## Knowledge Gaps
- **400 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+395 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 562 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **36 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `recharts-area-chart.tsx`, `recharts-dot.tsx`, `app-shell.tsx`, `next`, `dashboard.tsx`, `package.json`, `chat/widgets.tsx`, `flashcards.tsx`, `settings-forms.tsx`, `app/actions.ts`, `courses.tsx`, `sidebar.tsx`, `materials.tsx`, `syllabus-import.tsx`, `calendar.tsx`, `focus-timer.tsx`, `sync-window.tsx`, `recharts-tooltip.tsx`, `recharts-brush.tsx`, `recharts-chart.tsx`, `features.tsx`, `utils.ts`, `motion`, `ash-burst-button.tsx`, `chat-input.tsx`, `lucide-react`, `pricing.tsx`, `ai.tsx`, `doubt-button.tsx`, `home-search.tsx`, `chat-page.tsx`, `work-view.tsx`, `study-widgets.tsx`?**
  _High betweenness centrality (0.142) - this node is a cross-community bridge._
- **Why does `next` connect `next` to `app-shell.tsx`, `dashboard.tsx`, `package.json`, `showcase.tsx`, `components/widgets.tsx`, `chat/widgets.tsx`, `flashcards.tsx`, `settings-forms.tsx`, `app/actions.ts`, `courses.tsx`, `sidebar.tsx`, `materials.tsx`, `syllabus-import.tsx`, `calendar.tsx`, `react`, `app/layout.tsx`, `utils.ts`, `motion`, `chat-input.tsx`, `lucide-react`, `pricing.tsx`, `ai.tsx`, `home-search.tsx`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._
- **Why does `motion` connect `motion` to `recharts-area-chart.tsx`, `app-shell.tsx`, `dashboard.tsx`, `package.json`, `showcase.tsx`, `components/widgets.tsx`, `flashcards.tsx`, `settings-forms.tsx`, `sidebar.tsx`, `materials.tsx`, `calendar.tsx`, `focus-timer.tsx`, `sync-window.tsx`, `recharts-brush.tsx`, `features.tsx`, `utils.ts`, `ash-burst-button.tsx`, `chat-input.tsx`, `pricing.tsx`, `ai.tsx`, `doubt-button.tsx`, `home-search.tsx`, `study-widgets.tsx`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _400 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `recharts-area-chart.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0473469387755102 - nodes in this community are weakly interconnected._
- **Should `app-shell.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1225296442687747 - nodes in this community are weakly interconnected._
- **Should `next` be split into smaller, more focused modules?**
  _Cohesion score 0.052525252525252523 - nodes in this community are weakly interconnected._