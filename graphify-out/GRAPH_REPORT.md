# Graph Report - sonnet  (2026-09-26)

## Corpus Check
- 157 files · ~140,895 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 3, .example 1, .ico 1)

## Summary
- 1314 nodes · 3162 edges · 106 communities (72 shown, 34 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 39 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4217e331`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- recharts-area-chart.tsx
- chats_user_item
- recharts-radar-chart.tsx
- courses.tsx
- carousel.tsx
- dashboard.tsx
- compilerOptions
- dependencies
- package.json
- components.json
- ash-burst-button.tsx
- startOfDay
- proposal-card.tsx
- markdown.tsx
- ai.ts
- home.ts
- app-shell.tsx
- canvas.ts
- Student Hub design spec v1
- public.grade_history
- src_components_ui_draggable_widget_grid
- Order
- src_lib_gsap_gsap
- src_lib_gsap_usegsap
- app/actions.ts
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
- sync-window.tsx
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
- addDays
- motion
- public.calendar_feed
- Things the next Claude must NOT do
- recharts-dot.tsx
- public.settings
- scripts
- calendar-rail.tsx
- public.items
- PRODUCT.md
- chat-input.tsx
- landing/page.tsx
- ai.test.ts
- calendar.ts
- search.ts
- ai.tsx
- components/widgets.tsx
- evil-widgets.tsx
- next
- Phase 6 Materials + syllabus (in progress)
- createClient
- materials.tsx
- src_components_ui_container_scroll_animation
- src_components_ui_container_scroll_animation_containerscroll
- focus-timer.tsx
- 0015_ai_usage.sql
- apple-icon.tsx
- canvas-html.tsx
- work-view.tsx
- Commercialization roadmap
- chat/route.ts
- react
- login/page.tsx
- opengraph-image.tsx
- @supabase/ssr
- CodeBlock

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

## Communities (106 total, 34 thin omitted)

### Community 0 - "recharts-area-chart.tsx"
Cohesion: 0.05
Nodes (39): Area(), AreaActiveDotProp, AreaAnimationType, AreaChartContext, AreaChartContextValue, AreaDotProp, AreaProps, AreaVariant (+31 more)

### Community 2 - "recharts-radar-chart.tsx"
Cohesion: 0.07
Nodes (27): ColorStopsProps, DotProps, EvilRadarChart(), EvilRadarChartBaseProps, EvilRadarChartProps, generateLoadingData(), Legend(), LegendProps (+19 more)

### Community 3 - "courses.tsx"
Cohesion: 0.21
Nodes (13): CourseCard, CourseFace(), courseStats(), ADD, WhatIf(), Material, src_components_ui_popover_popoverdescription, src_components_ui_popover_popoverheader (+5 more)

### Community 4 - "carousel.tsx"
Cohesion: 0.27
Nodes (15): ANGLE, Card(), Carousel(), out(), PERIOD, Slide, Spot, spotOf() (+7 more)

### Community 5 - "dashboard.tsx"
Cohesion: 0.11
Nodes (34): useCreate(), ClearWidget(), CountdownWidget(), Course, CUTOFFS, Dot(), ExamsWidget(), GapsWidget() (+26 more)

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

### Community 11 - "startOfDay"
Cohesion: 0.23
Nodes (11): vitest, startOfDay(), Term, openByCourse(), openByKind(), paceByWeek(), items, now (+3 more)

### Community 12 - "proposal-card.tsx"
Cohesion: 0.13
Nodes (28): metal-fx, createMeeting(), deleteCourse(), deleteItem(), deleteMaterial(), deleteMeeting(), done(), logFocus() (+20 more)

### Community 13 - "markdown.tsx"
Cohesion: 0.16
Nodes (11): react-markdown, remark-gfm, Markdown, components, HNode, linkCourses(), Markdown(), MdNode (+3 more)

### Community 14 - "ai.ts"
Cohesion: 0.13
Nodes (18): AttachedItem, calendarLines(), classLines(), ClassRow, ClassTime, dayName(), DAYS, itemContext() (+10 more)

### Community 15 - "home.ts"
Cohesion: 0.10
Nodes (38): CalendarPage(), metadata, Chat(), metadata, CoursePage(), generateMetadata(), CoursesPage(), metadata (+30 more)

### Community 16 - "app-shell.tsx"
Cohesion: 0.15
Nodes (18): itemChat(), loadChat(), saveChat(), AppShell(), Assistant, AssistantContext, Course, CreateContext (+10 more)

### Community 17 - "canvas.ts"
Cohesion: 0.14
Nodes (24): ref_node_crypto, GET(), maxDuration, CanvasAssignment, canvasBaseUrl(), CanvasCourse, canvasFeedUrl(), CanvasItem (+16 more)

### Community 18 - "Student Hub design spec v1"
Cohesion: 0.22
Nodes (8): Phase 5 Canvas sync (complete), Phase reorder (nothing dropped), Phase 0 Foundation plan (historical), Student Hub design spec v1, Vercel AI SDK + Anthropic (claude-haiku-4-5 / claude-sonnet-5), <=$10/month, v1.5 spec: shell, AI panel, calendar, materials, Canvas sync (encrypted token + ICS, daily cron), Check for dates Canvas missed

### Community 19 - "public.grade_history"
Cohesion: 0.50
Nodes (3): public.grade_history, auth, public

### Community 21 - "Order"
Cohesion: 0.14
Nodes (13): 1. Rate limits — DONE (code), migration 0014 pending in Supabase, 2. Security pass, 3. Account deletion and export **[ask: touches auth]**, 4. Legal pages, 5. Monitoring **[ask: dependency or service]**, 6. Analytics **[ask: service]**, 7. Transactional email **[ask: service + DNS]**, 8. Google sign-in **[ask: auth]** (+5 more)

### Community 25 - "app/actions.ts"
Cohesion: 0.12
Nodes (29): ref_server_only, unpdf, addMaterial(), askSyllabus(), KINDS, readSyllabus(), Result, smartSearch() (+21 more)

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
Cohesion: 0.09
Nodes (28): next-themes, createCourse(), createItem(), disconnectCanvas(), resetAllData(), saveCanvasConnection(), saveName(), saveTerm() (+20 more)

### Community 55 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/matter-js, @types/node, @types/react (+3 more)

### Community 57 - "sync-window.tsx"
Cohesion: 0.15
Nodes (26): lucide-react, sonner, Course, field, FormError(), label, EASE, KINDS (+18 more)

### Community 58 - "calendar.tsx"
Cohesion: 0.15
Nodes (19): ADD, Calendar(), clock(), EASE, GridProps, hhmm(), ItemChip(), longDay() (+11 more)

### Community 59 - "syllabus.ts"
Cohesion: 0.27
Nodes (11): importSyllabus(), bare(), DAYS, Draft, Kind, KINDS, parseSyllabusItems(), realDate() (+3 more)

### Community 60 - "recharts-pie-chart.tsx"
Cohesion: 0.09
Nodes (20): BackgroundProps, EMPTY_GLOWING_SECTORS, EvilPieChart(), EvilPieChartProps, LabelListProps, LabelProps, Legend(), LegendProps (+12 more)

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
Nodes (8): src_app_globals, metadata, plexMono, plexSans, plexSerif, viewport, src_components_ui_sonner, src_components_ui_sonner_toaster

### Community 68 - "showcase.tsx"
Cohesion: 0.22
Nodes (8): CoursesDemo(), fadeUp, SectionHead(), Window(), FILES, Showcase(), STEPS, SYNC

### Community 69 - "addDays"
Cohesion: 0.19
Nodes (15): CalendarBody(), MiniMonth(), hm(), HoursWidget(), LoadWidget(), Body(), addDays(), mondayOf() (+7 more)

### Community 70 - "motion"
Cohesion: 0.15
Nodes (14): motion, blurIn, Hero(), rise, stagger, TABS, Caption(), EASE (+6 more)

### Community 71 - "public.calendar_feed"
Cohesion: 0.33
Nodes (5): public.calendar_feed(), public.class_meetings, public.courses, public.items, public.settings

### Community 73 - "Things the next Claude must NOT do"
Cohesion: 0.20
Nodes (10): Phase 3 AI assistant (done), Calendar and class-week grounding, Commit and push every important change to main, AI never saves without a confirm card, Things the next Claude must NOT do, Honest UI (no fake data), Reasoning rule (off by default, auto for tutoring, Think toggle), UI rules (metal=AI only, gooey menus, cyan=you now, course hue rule) (+2 more)

### Community 74 - "recharts-dot.tsx"
Cohesion: 0.25
Nodes (7): ChartDot, ChartDotProps, ColoredBorderDot, DefaultDot, DotVariant, DotVariantProps, PrimaryBorderDot

### Community 76 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint, start, test

### Community 77 - "calendar-rail.tsx"
Cohesion: 0.12
Nodes (19): useAssistant(), useOpenSettings(), Classes(), LEVELS, Props, Semester(), ClassLink(), Course (+11 more)

### Community 79 - "PRODUCT.md"
Cohesion: 0.18
Nodes (10): AGENTS.md (Next 16 rules), Next.js 16 breaking-changes rule (read node_modules/next/dist/docs), CLAUDE.md includes AGENTS.md (Next 16 rules), Phase 5 complete session handoff, Personal MVP (single user, sign-ups closed, RLS everywhere), SaaS step (sign-up, Stripe, Resend, Canvas OAuth), Sonnet student planner, Accessibility: WCAG 2.2 AA, reduced motion, course color + code (+2 more)

### Community 80 - "chat-input.tsx"
Cohesion: 0.06
Nodes (42): border-beam, liquid-gooey, thinking-orbs, voice-glow, usageStatus(), ChatInput(), PLACEHOLDERS, Recognition (+34 more)

### Community 81 - "landing/page.tsx"
Cohesion: 0.14
Nodes (10): Assistant(), Features(), INCLUDED, LINKS, SiteNav(), Wordmark(), FAQ, metadata (+2 more)

### Community 82 - "ai.test.ts"
Cohesion: 0.25
Nodes (12): Polish pass before syllabus import, NDJSON streaming protocol (think/text/propose/cards/error), Server-side task answers (no model call), asksTasks(), ITEM_DESCRIPTION_CAP, needsVision(), streamReply(), taskAnswer() (+4 more)

### Community 83 - "calendar.ts"
Cohesion: 0.22
Nodes (12): RFC-5545, GET(), BYDAY, Feed, floating(), ics(), LABEL, Session (+4 more)

### Community 84 - "search.ts"
Cohesion: 0.14
Nodes (15): at0(), Course, FILLER, KINDS, MONTHS, norm(), Place, PLACES (+7 more)

### Community 85 - "ai.tsx"
Cohesion: 0.12
Nodes (17): AssistantDemo(), DATES, DECK, GRADING, KNOWS, PLAN, POLICIES, POLS (+9 more)

### Community 86 - "components/widgets.tsx"
Cohesion: 0.17
Nodes (21): FocusBlock(), SHADES, FocusDial(), useFocus(), WeekStrip(), CalendarWidget(), ClassesWidget(), clock() (+13 more)

### Community 87 - "evil-widgets.tsx"
Cohesion: 0.21
Nodes (11): MixWidget, PaceWidget, RadarWidget, RingsWidget, color(), Course, KINDS, MixWidget() (+3 more)

### Community 88 - "next"
Cohesion: 0.17
Nodes (3): nextConfig, next, metadata

### Community 89 - "Phase 6 Materials + syllabus (in progress)"
Cohesion: 0.15
Nodes (13): Context-aware chat shortcuts (planned), Exam study guides (planned), Phase 6 Materials + syllabus (in progress), Chat attachments (photos, PDFs, text; up to 3), DeepSeek v4.1 flash default model, Env vars (SUPABASE keys, AI_API_KEY, AI_MODEL, AI_VISION_MODEL, CANVAS_ENCRYPTION_KEY, CRON_SECRET), Gemini 3.8 flash vision model (VISION_MODEL), OpenRouter (+5 more)

### Community 90 - "createClient"
Cohesion: 0.24
Nodes (11): @supabase/supabase-js, deleteChat(), listChats(), GET(), google(), LoginState, sendLink(), signIn() (+3 more)

### Community 91 - "materials.tsx"
Cohesion: 0.12
Nodes (20): Ask about the syllabus (fresh focused chat), TaskName, Tasks, MaterialRow(), Materials(), megabytes(), Sent, TILES (+12 more)

### Community 94 - "focus-timer.tsx"
Cohesion: 0.21
Nodes (11): Focus, FocusButton(), FocusContext, FocusProvider(), load(), mmss(), Run, SPRING (+3 more)

### Community 95 - "0015_ai_usage.sql"
Cohesion: 0.24
Nodes (7): auth, public.rate_hits, rate_hits_lookup, ai_usage_user_at, public.ai_usage, public.plans, public.usage_status()

### Community 96 - "apple-icon.tsx"
Cohesion: 0.25
Nodes (5): contentType, size, contentType, Mark(), size

### Community 97 - "canvas-html.tsx"
Cohesion: 0.28
Nodes (7): CanvasHtml(), convert(), DROP, external, KEEP, safeUrl(), TABLE_PARTS

### Community 98 - "work-view.tsx"
Cohesion: 0.32
Nodes (7): src_components_ui_button_buttonvariants, src_components_ui_dialog_dialogheader, scoreLabel(), Detail, http(), SUBMISSION, WorkView()

### Community 99 - "Commercialization roadmap"
Cohesion: 0.18
Nodes (10): At a glance, Commercialization roadmap, Metrics to watch (from Phase 10 on), Phase 10 — Launch readiness, Phase 11 — AI cost & reliability, Phase 12 — Pricing & billing, Phase 13 — Onboarding & activation, Phase 14 — Growth (+2 more)

### Community 100 - "chat/route.ts"
Cohesion: 0.39
Nodes (7): maxDuration, POST(), lightContext(), needsSearch(), needsThinking(), smallTalk(), Turn

### Community 101 - "react"
Cohesion: 0.16
Nodes (17): react, Block(), Dot(), ItemDetails(), ProgressBlock(), src_components_ui_checkbox, src_components_ui_checkbox_checkbox, src_components_ui_popover (+9 more)

### Community 102 - "login/page.tsx"
Cohesion: 0.33
Nodes (4): LoginForm(), JSON_LD, metadata, POINTS

### Community 103 - "opengraph-image.tsx"
Cohesion: 0.40
Nodes (3): alt, contentType, size

### Community 105 - "CodeBlock"
Cohesion: 0.67
Nodes (3): CodeBlock(), CopyAnswer(), useCopy()

## Knowledge Gaps
- **418 isolated node(s):** `Result`, `KINDS`, `maxDuration`, `PLACEHOLDERS`, `Recognition` (+413 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 575 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **34 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `recharts-area-chart.tsx`, `recharts-radar-chart.tsx`, `courses.tsx`, `carousel.tsx`, `dashboard.tsx`, `package.json`, `ash-burst-button.tsx`, `proposal-card.tsx`, `home.ts`, `app-shell.tsx`, `settings-forms.tsx`, `sync-window.tsx`, `calendar.tsx`, `recharts-pie-chart.tsx`, `recharts-radial-chart.tsx`, `recharts-tooltip.tsx`, `recharts-background.tsx`, `recharts-brush.tsx`, `recharts-chart.tsx`, `features.tsx`, `motion`, `recharts-dot.tsx`, `calendar-rail.tsx`, `chat-input.tsx`, `landing/page.tsx`, `ai.tsx`, `materials.tsx`, `focus-timer.tsx`, `canvas-html.tsx`, `work-view.tsx`?**
  _High betweenness centrality (0.200) - this node is a cross-community bridge._
- **Why does `next` connect `next` to `courses.tsx`, `carousel.tsx`, `dashboard.tsx`, `package.json`, `home.ts`, `app-shell.tsx`, `app/actions.ts`, `settings-forms.tsx`, `sync-window.tsx`, `calendar.tsx`, `app/layout.tsx`, `showcase.tsx`, `motion`, `calendar-rail.tsx`, `chat-input.tsx`, `landing/page.tsx`, `ai.tsx`, `components/widgets.tsx`, `createClient`, `materials.tsx`, `apple-icon.tsx`, `react`, `login/page.tsx`, `opengraph-image.tsx`, `@supabase/ssr`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **Why does `motion` connect `motion` to `recharts-area-chart.tsx`, `dashboard.tsx`, `package.json`, `ash-burst-button.tsx`, `home.ts`, `app-shell.tsx`, `settings-forms.tsx`, `sync-window.tsx`, `calendar.tsx`, `recharts-pie-chart.tsx`, `recharts-brush.tsx`, `features.tsx`, `showcase.tsx`, `calendar-rail.tsx`, `chat-input.tsx`, `ai.tsx`, `components/widgets.tsx`, `focus-timer.tsx`, `react`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **What connects `Result`, `KINDS`, `maxDuration` to the rest of the system?**
  _418 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `recharts-area-chart.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.04644412191582003 - nodes in this community are weakly interconnected._
- **Should `recharts-radar-chart.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07308377896613191 - nodes in this community are weakly interconnected._
- **Should `dashboard.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11336032388663968 - nodes in this community are weakly interconnected._