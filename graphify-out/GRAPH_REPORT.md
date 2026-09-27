# Graph Report - sonnet  (2026-09-27)

## Corpus Check
- 159 files · ~141,879 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 3, .example 1, .ico 1)

## Summary
- 1275 nodes · 3250 edges · 113 communities (74 shown, 39 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 31 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ac4eb01b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- src_components_evilcharts_ui_recharts_legend_chartlegend
- chats_user_item
- ai.ts
- app-shell.tsx
- next
- dashboard.tsx
- compilerOptions
- dependencies
- package.json
- components.json
- showcase.tsx
- addDays
- components/widgets.tsx
- chat/widgets.tsx
- sonner
- server.ts
- settings-forms.tsx
- canvas.ts
- icons.tsx
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
- onboarding.tsx
- src_components_ui_draggable_widget_grid_spans
- devDependencies
- meetingLabel
- ai.test.ts
- focus-timer.tsx
- sync-window.tsx
- public.decks
- flashcards.tsx
- carousel.tsx
- chat-page.tsx
- app/actions.ts
- features.tsx
- app/layout.tsx
- 0014_rate_limits.sql
- progress.ts
- motion
- public.calendar_feed
- calendar.tsx
- ash-burst-button.tsx
- public.settings
- scripts
- react
- public.items
- PRODUCT.md
- form.tsx
- landing/page.tsx
- home.ts
- Things the next Claude must NOT do
- home-search.tsx
- chat/route.ts
- calendar.ts
- canvas-html.tsx
- ai.tsx
- AppShell
- Security
- syllabus.ts
- src_components_ui_container_scroll_animation
- src_components_ui_container_scroll_animation_containerscroll
- chat-input.tsx
- 0015_ai_usage.sql
- proposal-card.tsx
- doubt-button.tsx
- materials.tsx
- Commercialization roadmap
- course.ts
- study-widgets.tsx
- apple-icon.tsx
- login/page.tsx
- @supabase/ssr
- createAdminClient
- courses.tsx
- nav.tsx
- opengraph-image.tsx
- src_components_ui_interactive_list_preview
- src_components_ui_interactive_list_preview_interactivelistpreview
- signOut

## God Nodes (most connected - your core abstractions)
1. `courseColor()` - 66 edges
2. `createClient()` - 54 edges
3. `react` - 48 edges
4. `next` - 47 edges
5. `cn()` - 39 edges
6. `dayKey()` - 34 edges
7. `Item` - 29 edges
8. `useAssistant()` - 28 edges
9. `motion` - 27 edges
10. `addDays()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `Calendar and class-week grounding` --references--> `studentContext()`  [INFERRED]
  HANDOFF.md → src/lib/ai.ts
- `1. Rate limits — DONE (code), migration 0014 pending in Supabase` --references--> `allowed()`  [INFERRED]
  docs/PHASE-10-PLAN.md → src/lib/limit.ts
- `Syllabus memory in every chat (24k, summary excluded)` --implements--> `studentContext()`  [INFERRED]
  HANDOFF.md → src/lib/ai.ts
- `Reasoning rule (off by default, auto for tutoring, Think toggle)` --references--> `needsThinking()`  [EXTRACTED]
  HANDOFF.md → src/lib/ai.ts
- `Check for dates Canvas missed` --references--> `sameWork()`  [EXTRACTED]
  HANDOFF.md → src/lib/syllabus.ts

## Import Cycles
- 3-file cycle: `src/components/app-shell.tsx -> src/components/chat/chat-panel.tsx -> src/components/chat/widgets.tsx -> src/components/app-shell.tsx`
- 3-file cycle: `src/components/app-shell.tsx -> src/components/chat/chat-panel.tsx -> src/components/chat/chat-input.tsx -> src/components/app-shell.tsx`

## Hyperedges (group relationships)
- **Syllabus reference flow** — src_app_actions_summarizesyllabus, src_components_syllabus_summary_summarydialog, src_lib_syllabus_samework, handoff_syllabus_summary_note, handoff_ask_about_syllabus, handoff_missed_dates_check [EXTRACTED 1.00]
- **Chat request routing** — src_lib_attach_typedpart, src_lib_ai_askstasks, src_lib_ai_wantschange, src_lib_ai_needsthinking, src_lib_ai_streamreply [INFERRED 0.85]

## Communities (113 total, 39 thin omitted)

### Community 2 - "ai.ts"
Cohesion: 0.10
Nodes (16): unpdf, AttachedItem, ClassRow, ClassTime, complete(), DAYS, Kind, meterOf() (+8 more)

### Community 3 - "app-shell.tsx"
Cohesion: 0.09
Nodes (27): Assistant, AssistantContext, Course, CreateContext, Schedule, SettingsContext, useVisibleViewport(), ChatMessage (+19 more)

### Community 4 - "next"
Cohesion: 0.13
Nodes (5): csp, nextConfig, next, GET(), metadata

### Community 5 - "dashboard.tsx"
Cohesion: 0.10
Nodes (25): CountdownWidget(), Course, Dot(), ExamsWidget(), GradeBarsWidget(), graded(), GradePoint, hm() (+17 more)

### Community 6 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 7 - "dependencies"
Cohesion: 0.08
Nodes (25): dependencies, @base-ui/react, border-beam, class-variance-authority, cn, gsap, liquid-gooey, matter-js (+17 more)

### Community 8 - "package.json"
Cohesion: 0.09
Nodes (22): eslintConfig, name, private, version, @base-ui/react, class-variance-authority, cn, eslint (+14 more)

### Community 9 - "components.json"
Cohesion: 0.09
Nodes (22): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+14 more)

### Community 10 - "showcase.tsx"
Cohesion: 0.15
Nodes (14): AssistantDemo(), SyllabusDemo(), CoursesDemo(), SectionHead(), useSequence(), Window(), FILES, FilesDemo() (+6 more)

### Community 11 - "addDays"
Cohesion: 0.15
Nodes (17): vitest, slim(), Semester(), CalendarWidget(), withFiles(), addDays(), mondayOf(), range() (+9 more)

### Community 12 - "components/widgets.tsx"
Cohesion: 0.15
Nodes (21): Block(), FocusBlock(), SHADES, Link2, StickyNote, BuddyWidget(), WeekStrip(), ClassesWidget() (+13 more)

### Community 13 - "chat/widgets.tsx"
Cohesion: 0.11
Nodes (22): react-markdown, remark-gfm, CHIP, Markdown, components, HNode, linkCourses(), Markdown() (+14 more)

### Community 14 - "sonner"
Cohesion: 0.20
Nodes (8): sonner, maxDuration, TaskName, Tasks, Done, State, src_components_ui_status_mark, src_components_ui_status_mark_statusmark

### Community 15 - "server.ts"
Cohesion: 0.13
Nodes (28): CalendarPage(), metadata, Chat(), metadata, CoursePage(), generateMetadata(), CoursesPage(), metadata (+20 more)

### Community 16 - "settings-forms.tsx"
Cohesion: 0.13
Nodes (17): useAssistant(), Course, CourseDialog(), ItemDialog(), label, Submit(), useSubmit(), Account (+9 more)

### Community 17 - "canvas.ts"
Cohesion: 0.15
Nodes (24): saveCanvasConnection(), CanvasAssignment, canvasBaseUrl(), CanvasCourse, canvasFeedUrl(), CanvasItem, canvasPages(), CanvasSettings (+16 more)

### Community 18 - "icons.tsx"
Cohesion: 0.11
Nodes (22): ABOUT_ITEM, SHORTCUTS, Award, BookOpenCheck, Calculator, CalendarCheck, CalendarRange, CalendarSearch (+14 more)

### Community 19 - "public.grade_history"
Cohesion: 0.50
Nodes (3): public.grade_history, auth, public

### Community 21 - "Order"
Cohesion: 0.14
Nodes (13): 1. Rate limits — DONE (code), migration 0014 pending in Supabase, 2. Security pass, 3. Account deletion and export **[ask: touches auth]**, 4. Legal pages, 5. Monitoring **[ask: dependency or service]**, 6. Analytics **[ask: service]**, 7. Transactional email **[ask: service + DNS]**, 8. Google sign-in **[ask: auth]** (+5 more)

### Community 25 - "sidebar.tsx"
Cohesion: 0.12
Nodes (15): CREATE, CreateKind, GooeyMenu(), MenuItem, BookOpen, CalendarClock, FilePlus2, House (+7 more)

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

### Community 53 - "onboarding.tsx"
Cohesion: 0.18
Nodes (12): field, ChevronRight, EASE, KINDS, STEPS, EASE, HUE, SLIDES (+4 more)

### Community 55 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/matter-js, @types/node, @types/react (+3 more)

### Community 57 - "meetingLabel"
Cohesion: 0.25
Nodes (11): Syllabus memory in every chat (24k, summary excluded), Syllabus as reference (not date import), Syllabus summary note, calendarLines(), classLines(), dayName(), itemContext(), localNow() (+3 more)

### Community 58 - "ai.test.ts"
Cohesion: 0.28
Nodes (12): Polish pass before syllabus import, NDJSON streaming protocol (think/text/propose/cards/error), Server-side task answers (no model call), asksTasks(), ITEM_DESCRIPTION_CAP, needsVision(), streamReply(), taskAnswer() (+4 more)

### Community 59 - "focus-timer.tsx"
Cohesion: 0.19
Nodes (14): Focus, FocusButton(), FocusContext, FocusDial(), FocusProvider(), load(), mmss(), Run (+6 more)

### Community 60 - "sync-window.tsx"
Cohesion: 0.17
Nodes (9): ExternalLink, Review(), CANVAS_WORD, CanvasState, SyncWindow(), Tone, useCanvas(), slow() (+1 more)

### Community 61 - "public.decks"
Cohesion: 0.38
Nodes (6): decks_user_updated, public.decks, public.shared_deck(), auth, public, public.courses

### Community 62 - "flashcards.tsx"
Cohesion: 0.08
Nodes (31): usageStatus(), generateMetadata(), load, SharedDeckPage(), Card, count(), Course, CoursePicker() (+23 more)

### Community 63 - "carousel.tsx"
Cohesion: 0.27
Nodes (15): ANGLE, Card(), Carousel(), out(), PERIOD, Slide, Spot, spotOf() (+7 more)

### Community 64 - "chat-page.tsx"
Cohesion: 0.18
Nodes (10): border-beam, thinking-orbs, Saved, ChatLog(), shortcutsFor(), History, SquarePen, src_components_ui_popover (+2 more)

### Community 65 - "app/actions.ts"
Cohesion: 0.16
Nodes (34): addMaterial(), createCourse(), createItem(), createMeeting(), deleteChat(), deleteCourse(), deleteDeck(), deleteItem() (+26 more)

### Community 66 - "features.tsx"
Cohesion: 0.08
Nodes (28): Block(), CalendarDemo(), CLASSES, CountdownDemo(), DAYS, DUE, EVERYTHING, level() (+20 more)

### Community 67 - "app/layout.tsx"
Cohesion: 0.20
Nodes (8): next-themes, src_app_globals, geist, geistMono, metadata, viewport, src_components_ui_sonner, src_components_ui_sonner_toaster

### Community 68 - "0014_rate_limits.sql"
Cohesion: 0.50
Nodes (3): public.rate_hits, rate_hits_lookup, auth

### Community 69 - "progress.ts"
Cohesion: 0.14
Nodes (18): CourseView(), EASE, GlassWidget(), PIPS, PlantWidget(), r2(), RollWidget(), ProgressBlock() (+10 more)

### Community 70 - "motion"
Cohesion: 0.14
Nodes (15): motion, blurIn, Hero(), rise, stagger, TABS, Caption(), EASE (+7 more)

### Community 71 - "public.calendar_feed"
Cohesion: 0.33
Nodes (5): public.calendar_feed(), public.class_meetings, public.courses, public.items, public.settings

### Community 73 - "calendar.tsx"
Cohesion: 0.11
Nodes (29): ADD, Calendar(), clock(), EASE, GridProps, hhmm(), ItemChip(), longDay() (+21 more)

### Community 74 - "ash-burst-button.tsx"
Cohesion: 0.21
Nodes (13): matter-js, react-dom, ASH_COLORS, AshSim, createAshSimulation(), drawShard(), paintSim(), ParticleKind (+5 more)

### Community 76 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint, start, test

### Community 77 - "react"
Cohesion: 0.20
Nodes (14): react, Trash2, src_components_ui_button, src_components_ui_button_button, src_components_ui_button_buttonvariants, src_components_ui_checkbox, headline(), scoreLabel() (+6 more)

### Community 79 - "PRODUCT.md"
Cohesion: 0.07
Nodes (28): AGENTS.md (Next 16 rules), Next.js 16 breaking-changes rule (read node_modules/next/dist/docs), CLAUDE.md includes AGENTS.md (Next 16 rules), Phase 5 complete session handoff, Context-aware chat shortcuts (planned), Exam study guides (planned), Phase 5 Canvas sync (complete), Phase 6 Materials + syllabus (in progress) (+20 more)

### Community 80 - "form.tsx"
Cohesion: 0.43
Nodes (5): google(), LoginState, sendLink(), signIn(), signUp()

### Community 81 - "landing/page.tsx"
Cohesion: 0.15
Nodes (8): gsap, Assistant(), Features(), FAQ, metadata, WORKS_WITH, ScrubText(), Presentation

### Community 82 - "home.ts"
Cohesion: 0.21
Nodes (17): Drag, SnapGrid(), SPRING, COLS, DEFAULT_LAYOUT, fits(), freeSpot(), Layout (+9 more)

### Community 83 - "Things the next Claude must NOT do"
Cohesion: 0.20
Nodes (10): Phase 3 AI assistant (done), Calendar and class-week grounding, Commit and push every important change to main, AI never saves without a confirm card, Things the next Claude must NOT do, Honest UI (no fake data), Reasoning rule (off by default, auto for tutoring, Think toggle), UI rules (metal=AI only, gooey menus, cyan=you now, course hue rule) (+2 more)

### Community 84 - "home-search.tsx"
Cohesion: 0.06
Nodes (39): smartSearch(), EASE, FREE_LIST, ids, PAID, Prices, Pricing(), ProAmount() (+31 more)

### Community 85 - "chat/route.ts"
Cohesion: 0.19
Nodes (17): askSyllabus(), summarizeSyllabus(), maxDuration, POST(), lightContext(), Meter, needsSearch(), needsThinking() (+9 more)

### Community 86 - "calendar.ts"
Cohesion: 0.18
Nodes (14): RFC-5545, GET(), BYDAY, ClassMeeting, Feed, floating(), ics(), LABEL (+6 more)

### Community 87 - "canvas-html.tsx"
Cohesion: 0.28
Nodes (7): CanvasHtml(), convert(), DROP, external, KEEP, safeUrl(), TABLE_PARTS

### Community 88 - "ai.tsx"
Cohesion: 0.12
Nodes (14): DATES, DECK, GRADING, KNOWS, PLAN, POLICIES, POLS, QA (+6 more)

### Community 89 - "AppShell"
Cohesion: 0.20
Nodes (11): cleanCards(), createDeck(), itemChat(), loadChat(), saveChat(), saveName(), syncCanvasNow(), AppShell() (+3 more)

### Community 90 - "Security"
Cohesion: 0.40
Nodes (4): App, Database (RLS), Secret rotation checklist, Security

### Community 91 - "syllabus.ts"
Cohesion: 0.23
Nodes (14): importSyllabus(), readSyllabus(), bare(), DAYS, Draft, Kind, KINDS, parseSyllabusItems() (+6 more)

### Community 94 - "chat-input.tsx"
Cohesion: 0.14
Nodes (16): ChatInput(), PLACEHOLDERS, Recognition, RecognitionCtor, useDictationSupported(), BookOpenText, Brain, IconType (+8 more)

### Community 95 - "0015_ai_usage.sql"
Cohesion: 0.39
Nodes (5): ai_usage_user_at, public.ai_usage, public.plans, public.usage_status(), auth

### Community 96 - "proposal-card.tsx"
Cohesion: 0.24
Nodes (13): CalendarBody(), Body(), ClassTime, clock(), DESTRUCTIVE, Entry, mins(), ProposalCard() (+5 more)

### Community 97 - "doubt-button.tsx"
Cohesion: 0.22
Nodes (7): DEFAULT_CONFIRMATIONS, DoubtButton, DoubtButtonProps, DoubtState, extractText(), labelVariants, DoubtButton

### Community 98 - "materials.tsx"
Cohesion: 0.15
Nodes (18): Ask about the syllabus (fresh focused chat), FormError(), CalendarPlus, MessageCircle, RefreshCw, MaterialRow(), megabytes(), Sent (+10 more)

### Community 99 - "Commercialization roadmap"
Cohesion: 0.18
Nodes (10): At a glance, Commercialization roadmap, Metrics to watch (from Phase 10 on), Phase 10 — Launch readiness, Phase 11 — AI cost & reliability, Phase 12 — Pricing & billing, Phase 13 — Onboarding & activation, Phase 14 — Growth (+2 more)

### Community 101 - "course.ts"
Cohesion: 0.21
Nodes (11): TrendWidget(), CourseCard, CourseFace(), courseStats(), WhatIf(), courseFace(), gradeLabel(), LETTERS (+3 more)

### Community 102 - "study-widgets.tsx"
Cohesion: 0.14
Nodes (17): Pause, Play, BreatheWidget(), byDue(), EASE, Mood, MOUTHS, noise() (+9 more)

### Community 103 - "apple-icon.tsx"
Cohesion: 0.25
Nodes (5): contentType, size, contentType, Mark(), size

### Community 104 - "login/page.tsx"
Cohesion: 0.33
Nodes (4): LoginForm(), JSON_LD, metadata, POINTS

### Community 106 - "createAdminClient"
Cohesion: 0.22
Nodes (9): ref_node_crypto, ref_server_only, @supabase/supabase-js, disconnectCanvas(), resetAllData(), GET(), maxDuration, CanvasForm() (+1 more)

### Community 107 - "courses.tsx"
Cohesion: 0.24
Nodes (9): useCreate(), ADD, CoursesGrid(), FileUp, Material, Materials(), UploadWindow(), useUpload() (+1 more)

### Community 108 - "nav.tsx"
Cohesion: 0.25
Nodes (7): INCLUDED, LINKS, SiteNav(), Wordmark(), ChevronDown, Menu, X

### Community 109 - "opengraph-image.tsx"
Cohesion: 0.40
Nodes (3): alt, contentType, size

## Knowledge Gaps
- **361 isolated node(s):** `metadata`, `WORKS_WITH`, `FAQ`, `Mood`, `Sound` (+356 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 496 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **39 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `app-shell.tsx`, `dashboard.tsx`, `package.json`, `showcase.tsx`, `components/widgets.tsx`, `chat/widgets.tsx`, `sonner`, `server.ts`, `settings-forms.tsx`, `sidebar.tsx`, `flashcards.tsx`, `carousel.tsx`, `app/actions.ts`, `app/layout.tsx`, `motion`, `calendar.tsx`, `react`, `form.tsx`, `landing/page.tsx`, `home-search.tsx`, `ai.tsx`, `chat-input.tsx`, `materials.tsx`, `apple-icon.tsx`, `login/page.tsx`, `@supabase/ssr`, `courses.tsx`, `nav.tsx`, `opengraph-image.tsx`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `app-shell.tsx`, `dashboard.tsx`, `package.json`, `chat/widgets.tsx`, `settings-forms.tsx`, `sidebar.tsx`, `onboarding.tsx`, `focus-timer.tsx`, `sync-window.tsx`, `flashcards.tsx`, `carousel.tsx`, `chat-page.tsx`, `features.tsx`, `progress.ts`, `motion`, `calendar.tsx`, `ash-burst-button.tsx`, `form.tsx`, `landing/page.tsx`, `home.ts`, `home-search.tsx`, `canvas-html.tsx`, `ai.tsx`, `chat-input.tsx`, `proposal-card.tsx`, `doubt-button.tsx`, `materials.tsx`, `study-widgets.tsx`, `courses.tsx`, `nav.tsx`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **What connects `metadata`, `WORKS_WITH`, `FAQ` to the rest of the system?**
  _361 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ai.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10276679841897234 - nodes in this community are weakly interconnected._
- **Should `app-shell.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08735632183908046 - nodes in this community are weakly interconnected._
- **Should `next` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._