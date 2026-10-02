# Graph Report - sonnet  (2026-10-02)

## Corpus Check
- 198 files · ~205,469 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 4, .example 1, .ico 1)

## Summary
- 1649 nodes · 4125 edges · 126 communities (89 shown, 37 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 87 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `dd649854`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- src_components_evilcharts_ui_recharts_legend_chartlegend
- chats_user_item
- ai.ts
- app-shell.tsx
- settings-forms.tsx
- dashboard.tsx
- compilerOptions
- dependencies
- package.json
- components.json
- sidebar.tsx
- calendar.tsx
- components/widgets.tsx
- chat/widgets.tsx
- focus-sense.ts
- flashcards.tsx
- calendar.ts
- ai.tsx
- icons.tsx
- public.grade_history
- src_components_ui_draggable_widget_grid
- Order
- src_lib_gsap_gsap
- src_lib_gsap_usegsap
- next
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
- chat-input.tsx
- src_components_ui_draggable_widget_grid_spans
- sync-window.tsx
- benchmark.test.ts
- ai.test.ts
- 13. Migration Plan
- createClient
- public.decks
- proposal-card.tsx
- react
- devDependencies
- materials.tsx
- features.tsx
- app/layout.tsx
- 0014_rate_limits.sql
- usage.tsx
- classify.ts
- public.calendar_feed
- form.tsx
- legal.tsx
- public.settings
- lexicon.ts
- cn
- public.items
- Student Hub design spec v1
- login/page.tsx
- landing/page.tsx
- home.ts
- Things the next Claude must NOT do
- home-search.tsx
- 3. Current Repository Compatibility
- canvas.ts
- chat-page.tsx
- focus-timer.tsx
- desktop/page.tsx
- Security
- chat/route.ts
- src_components_ui_container_scroll_animation
- src_components_ui_container_scroll_animation_containerscroll
- Phase 6 Materials + syllabus (in progress)
- 0015_ai_usage.sql
- opengraph-image.tsx
- score.ts
- courses.tsx
- Commercialization roadmap
- Sonnet Desktop Architecture
- study-widgets.tsx
- scripts
- heuristics.ts
- csp.ts
- app/actions.ts
- createAdminClient
- context.ts
- create-forms.tsx
- src_components_ui_interactive_list_preview
- src_components_ui_interactive_list_preview_interactivelistpreview
- focus-session-debug.tsx
- vitest
- pricing.tsx
- score.test.ts
- types.ts
- syllabus.ts
- ash-burst-button.tsx
- rules.ts
- doubt-button.tsx
- PRODUCT.md
- canvas-html.tsx
- ActivityInput
- Focus Sense classifier: recorded results (M6B, 2026-10-02)
- tasks/route.ts

## God Nodes (most connected - your core abstractions)
1. `courseColor()` - 66 edges
2. `createClient()` - 57 edges
3. `react` - 53 edges
4. `next` - 51 edges
5. `cn()` - 39 edges
6. `dayKey()` - 34 edges
7. `Item` - 31 edges
8. `useAssistant()` - 28 edges
9. `motion` - 27 edges
10. `vitest` - 23 edges

## Surprising Connections (you probably didn't know these)
- `Known blockers` --references--> `logFocus()`  [INFERRED]
  DESKTOP_ARCHITECTURE_SPEC.md → src/app/actions.ts
- `4. Target Architecture` --references--> `logFocus()`  [INFERRED]
  DESKTOP_ARCHITECTURE_SPEC.md → src/app/actions.ts
- `11. Packaging and Updating` --references--> `logFocus()`  [INFERRED]
  DESKTOP_ARCHITECTURE_SPEC.md → src/app/actions.ts
- `Calendar and class-week grounding` --references--> `studentContext()`  [INFERRED]
  HANDOFF.md → src/lib/ai.ts
- `Syllabus memory in every chat (24k, summary excluded)` --implements--> `studentContext()`  [INFERRED]
  HANDOFF.md → src/lib/ai.ts

## Import Cycles
- 3-file cycle: `src/components/app-shell.tsx -> src/components/chat/chat-panel.tsx -> src/components/chat/chat-input.tsx -> src/components/app-shell.tsx`
- 3-file cycle: `src/components/app-shell.tsx -> src/components/chat/chat-panel.tsx -> src/components/chat/widgets.tsx -> src/components/app-shell.tsx`

## Hyperedges (group relationships)
- **Syllabus reference flow** — src_app_actions_summarizesyllabus, src_components_syllabus_summary_summarydialog, src_lib_syllabus_samework, handoff_syllabus_summary_note, handoff_ask_about_syllabus, handoff_missed_dates_check [EXTRACTED 1.00]
- **Chat request routing** — src_lib_attach_typedpart, src_lib_ai_askstasks, src_lib_ai_wantschange, src_lib_ai_needsthinking, src_lib_ai_streamreply [INFERRED 0.85]

## Communities (126 total, 37 thin omitted)

### Community 2 - "ai.ts"
Cohesion: 0.12
Nodes (20): AttachedItem, calendarLines(), classLines(), ClassRow, ClassTime, complete(), dayName(), DAYS (+12 more)

### Community 3 - "app-shell.tsx"
Cohesion: 0.10
Nodes (26): Assistant, AssistantContext, Course, CreateContext, Schedule, SettingsContext, slim(), useVisibleViewport() (+18 more)

### Community 4 - "settings-forms.tsx"
Cohesion: 0.12
Nodes (16): CourseDialog(), ItemDialog(), useSubmit(), Account, day(), DeleteAccount(), NameForm(), PAINT (+8 more)

### Community 5 - "dashboard.tsx"
Cohesion: 0.10
Nodes (35): Block(), useCreate(), CountdownWidget(), Course, Dot(), ExamsWidget(), GradeBarsWidget(), graded() (+27 more)

### Community 6 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 7 - "dependencies"
Cohesion: 0.08
Nodes (25): dependencies, @base-ui/react, border-beam, class-variance-authority, cn, gsap, liquid-gooey, matter-js (+17 more)

### Community 8 - "package.json"
Cohesion: 0.08
Nodes (24): eslintConfig, name, private, version, @base-ui/react, class-variance-authority, cn, eslint (+16 more)

### Community 9 - "components.json"
Cohesion: 0.09
Nodes (22): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+14 more)

### Community 10 - "sidebar.tsx"
Cohesion: 0.10
Nodes (16): INCLUDED, LINKS, SiteNav(), Wordmark(), CreateKind, BookOpen, CalendarDays, ChevronDown (+8 more)

### Community 11 - "calendar.tsx"
Cohesion: 0.14
Nodes (20): ADD, Calendar(), clock(), EASE, GridProps, hhmm(), ItemChip(), longDay() (+12 more)

### Community 12 - "components/widgets.tsx"
Cohesion: 0.18
Nodes (19): FocusBlock(), SHADES, FocusDial(), useFocus(), BuddyWidget(), WeekStrip(), ClassesWidget(), clock() (+11 more)

### Community 13 - "chat/widgets.tsx"
Cohesion: 0.17
Nodes (18): useAssistant(), Markdown, components, HNode, linkCourses(), Markdown(), MdNode, tidy() (+10 more)

### Community 14 - "focus-sense.ts"
Cohesion: 0.20
Nodes (8): FocusActivityEvent, FocusSenseStatus, focusSessionId(), HEARTBEAT_MS, IDLE_AFTER_MS, Invoke, queue, status

### Community 15 - "flashcards.tsx"
Cohesion: 0.08
Nodes (45): CalendarPage(), metadata, CoursePage(), generateMetadata(), CoursesPage(), metadata, DeckPage(), generateMetadata() (+37 more)

### Community 16 - "calendar.ts"
Cohesion: 0.10
Nodes (33): RFC-5545, @supabase/supabase-js, GET(), CalendarBody(), CalendarRail(), Classes(), LEVELS, MiniMonth() (+25 more)

### Community 17 - "ai.tsx"
Cohesion: 0.07
Nodes (35): AssistantDemo(), DATES, DECK, GRADING, KNOWS, PLAN, POLICIES, POLS (+27 more)

### Community 18 - "icons.tsx"
Cohesion: 0.13
Nodes (20): ABOUT_ITEM, Shortcut, SHORTCUTS, Award, BookOpenCheck, CalendarCheck, CalendarRange, CheckIcon (+12 more)

### Community 19 - "public.grade_history"
Cohesion: 0.50
Nodes (3): public.grade_history, auth, public

### Community 21 - "Order"
Cohesion: 0.14
Nodes (13): 1. Rate limits — DONE (code), migration 0014 pending in Supabase, 2. Security pass, 3. Account deletion and export **[ask: touches auth]**, 4. Legal pages, 5. Monitoring **[ask: dependency or service]**, 6. Analytics **[ask: service]**, 7. Transactional email **[ask: service + DNS]**, 8. Google sign-in **[ask: auth]** (+5 more)

### Community 25 - "next"
Cohesion: 0.10
Nodes (8): nextConfig, next, contentType, size, contentType, Mark(), size, metadata

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

### Community 53 - "chat-input.tsx"
Cohesion: 0.12
Nodes (16): metal-fx, unpdf, ChatInput(), PLACEHOLDERS, Recognition, RecognitionCtor, useDictationSupported(), BookOpenText (+8 more)

### Community 55 - "sync-window.tsx"
Cohesion: 0.17
Nodes (7): Copy, CANVAS_WORD, CanvasState, FeedLink(), SyncWindow(), Tone, useCanvas()

### Community 57 - "benchmark.test.ts"
Cohesion: 0.07
Nodes (49): abstain(), Baseline, BLOCKLIST, blocklistBaseline(), fitKeywordThreshold(), keywordBaseline(), STOPWORDS, tokens() (+41 more)

### Community 58 - "ai.test.ts"
Cohesion: 0.36
Nodes (8): Polish pass before syllabus import, Server-side task answers (no model call), asksTasks(), ITEM_DESCRIPTION_CAP, taskAnswer(), toolsFor(), wantsCards(), wantsChange()

### Community 59 - "13. Migration Plan"
Cohesion: 0.17
Nodes (16): 13. Migration Plan, 15. Open Risks / Unverified Claims, Focus Sense F1. Sensing foundation (built, session 9, Windows), M0. Web prerequisites (no desktop code), M2. Shared app boot, M4. Windows packaging proof, M5. macOS packaging and configuration proof, M6. Native capability bridge (+8 more)

### Community 60 - "createClient"
Cohesion: 0.13
Nodes (21): cleanCards(), createDeck(), deleteChat(), deleteDeck(), itemChat(), listChats(), loadChat(), saveChat() (+13 more)

### Community 61 - "public.decks"
Cohesion: 0.38
Nodes (6): decks_user_updated, public.decks, public.shared_deck(), auth, public, public.courses

### Community 62 - "proposal-card.tsx"
Cohesion: 0.16
Nodes (24): createCourse(), createItem(), createMeeting(), deleteCourse(), deleteMeeting(), saveName(), saveTerm(), setClassDayOff() (+16 more)

### Community 63 - "react"
Cohesion: 0.26
Nodes (16): react, ANGLE, Card(), Carousel(), out(), PERIOD, Slide, Spot (+8 more)

### Community 64 - "devDependencies"
Cohesion: 0.17
Nodes (12): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @tauri-apps/cli, @types/matter-js, @types/node (+4 more)

### Community 65 - "materials.tsx"
Cohesion: 0.09
Nodes (29): sonner, @supabase/ssr, CalendarPlus, FileType, Link2, StickyNote, TriangleAlert, Material (+21 more)

### Community 66 - "features.tsx"
Cohesion: 0.07
Nodes (31): SyllabusDemo(), CalendarDemo(), CLASSES, CountdownDemo(), DAYS, DUE, EVERYTHING, level() (+23 more)

### Community 67 - "app/layout.tsx"
Cohesion: 0.20
Nodes (8): next-themes, src_app_globals, geist, geistMono, metadata, viewport, src_components_ui_sonner, src_components_ui_sonner_toaster

### Community 68 - "0014_rate_limits.sql"
Cohesion: 0.50
Nodes (3): public.rate_hits, rate_hits_lookup, auth

### Community 69 - "usage.tsx"
Cohesion: 0.22
Nodes (11): src_components_ui_popover, src_components_ui_popover_popovercontent, src_components_ui_popover_popovertrigger, KINDS, remaining(), resetDay(), Usage, UsageCard() (+3 more)

### Community 70 - "classify.ts"
Cohesion: 0.09
Nodes (35): Systems, ask(), classify(), classifyEvents(), classifyLocal(), LocalResult, Opts, src_lib_desktop_sense_classify_semanticrequest (+27 more)

### Community 71 - "public.calendar_feed"
Cohesion: 0.33
Nodes (5): public.calendar_feed(), public.class_meetings, public.courses, public.items, public.settings

### Community 73 - "form.tsx"
Cohesion: 0.22
Nodes (14): Confirmed facts (Graphify + inspection, `f676d04`), M3. Auth and data verification, Sign-in handoff [Approved], callback(), google(), LoginState, sendLink(), signIn() (+6 more)

### Community 74 - "legal.tsx"
Cohesion: 0.29
Nodes (6): CONTACT, LegalPage(), Section(), UPDATED, metadata, metadata

### Community 76 - "lexicon.ts"
Cohesion: 0.12
Nodes (27): REF(), clip(), EVERYDAY, evidence, GAMES, hasTerm(), Hit, isStudy() (+19 more)

### Community 77 - "cn"
Cohesion: 0.14
Nodes (20): Block(), EASE, PIPS, PlantWidget(), r2(), RollWidget(), ProgressBlock(), headline() (+12 more)

### Community 79 - "Student Hub design spec v1"
Cohesion: 0.15
Nodes (13): Phase 5 Canvas sync (complete), Phase reorder (nothing dropped), Phase 0 Foundation plan (historical), Student Hub design spec v1, Vercel AI SDK + Anthropic (claude-haiku-4-5 / claude-sonnet-5), <=$10/month, v1.5 spec: shell, AI panel, calendar, materials, Canvas sync (encrypted token + ICS, daily cron), DeepSeek v4.1 flash default model (+5 more)

### Community 80 - "login/page.tsx"
Cohesion: 0.40
Nodes (3): JSON_LD, metadata, POINTS

### Community 81 - "landing/page.tsx"
Cohesion: 0.10
Nodes (16): gsap, motion, Assistant(), Features(), blurIn, Hero(), rise, stagger (+8 more)

### Community 82 - "home.ts"
Cohesion: 0.21
Nodes (17): Drag, SnapGrid(), SPRING, COLS, DEFAULT_LAYOUT, fits(), freeSpot(), Layout (+9 more)

### Community 83 - "Things the next Claude must NOT do"
Cohesion: 0.29
Nodes (7): Calendar and class-week grounding, Commit and push every important change to main, Things the next Claude must NOT do, Honest UI (no fake data), Reasoning rule (off by default, auto for tutoring, Think toggle), UI rules (metal=AI only, gooey menus, cyan=you now, course hue rule), needsThinking()

### Community 84 - "home-search.tsx"
Cohesion: 0.08
Nodes (27): useOpenSettings(), Course, EASE, EXAMPLES, Found, HomeSearch(), Row, when() (+19 more)

### Community 85 - "3. Current Repository Compatibility"
Cohesion: 0.40
Nodes (5): 3. Current Repository Compatibility, Implications, Known blockers, Still to verify, What can stay shared

### Community 86 - "canvas.ts"
Cohesion: 0.15
Nodes (24): saveCanvasConnection(), CanvasAssignment, canvasBaseUrl(), CanvasCourse, canvasFeedUrl(), CanvasItem, canvasPages(), CanvasSettings (+16 more)

### Community 87 - "chat-page.tsx"
Cohesion: 0.16
Nodes (12): border-beam, thinking-orbs, Chat(), metadata, ChatPage(), Saved, ChatLog(), shortcutsFor() (+4 more)

### Community 88 - "focus-timer.tsx"
Cohesion: 0.13
Nodes (21): M1. Desktop shell, P1. Focus-session durability fix (prerequisite, before M6), Focus, FocusButton(), FocusContext, FocusProvider(), load(), loadPending() (+13 more)

### Community 89 - "desktop/page.tsx"
Cohesion: 0.33
Nodes (5): Bounce(), DesktopSignIn(), metadata, desktopLink(), Params

### Community 90 - "Security"
Cohesion: 0.40
Nodes (4): App, Database (RLS), Secret rotation checklist, Security

### Community 91 - "chat/route.ts"
Cohesion: 0.16
Nodes (21): NDJSON streaming protocol (think/text/propose/cards/error), askSyllabus(), smartSearch(), summarizeSyllabus(), maxDuration, POST(), lightContext(), Meter (+13 more)

### Community 94 - "Phase 6 Materials + syllabus (in progress)"
Cohesion: 0.15
Nodes (13): Next.js 16 breaking-changes rule (read node_modules/next/dist/docs), CLAUDE.md includes AGENTS.md (Next 16 rules), Context-aware chat shortcuts (planned), Exam study guides (planned), Phase 6 Materials + syllabus (in progress), Chat attachments (photos, PDFs, text; up to 3), Gemini 3.8 flash vision model (VISION_MODEL), Personal MVP (single user, sign-ups closed, RLS everywhere) (+5 more)

### Community 95 - "0015_ai_usage.sql"
Cohesion: 0.39
Nodes (5): ai_usage_user_at, public.ai_usage, public.plans, public.usage_status(), auth

### Community 96 - "opengraph-image.tsx"
Cohesion: 0.40
Nodes (3): alt, contentType, size

### Community 97 - "score.ts"
Cohesion: 0.10
Nodes (27): addNote(), BLOCK_GAP_MS, buildTimeline(), EndRule, Episode, focusedIn(), FREE_IDLE_MS, FREE_IDLE_SHARE (+19 more)

### Community 98 - "courses.tsx"
Cohesion: 0.13
Nodes (22): CourseCard, CourseFace(), courseStats(), ADD, CoursesGrid(), WhatIf(), CREATE, GooeyMenu() (+14 more)

### Community 99 - "Commercialization roadmap"
Cohesion: 0.18
Nodes (10): At a glance, Commercialization roadmap, Metrics to watch (from Phase 10 on), Phase 10 — Launch readiness, Phase 11 — AI cost & reliability, Phase 12 — Pricing & billing, Phase 13 — Onboarding & activation, Phase 14 — Growth (+2 more)

### Community 101 - "Sonnet Desktop Architecture"
Cohesion: 0.09
Nodes (22): 10. Web Compatibility, 11. Packaging and Updating, 12. Focus Guardian Readiness, 14. Explicit Non-Goals, 16. Authoritative Implementation Decisions, 1. Product Direction, 2. Selected Desktop Framework, 4. Target Architecture (+14 more)

### Community 102 - "study-widgets.tsx"
Cohesion: 0.14
Nodes (17): Pause, Play, BreatheWidget(), byDue(), EASE, Mood, MOUTHS, noise() (+9 more)

### Community 103 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, desktop:build, desktop:dev, dev, lint, start, test

### Community 104 - "heuristics.ts"
Cohesion: 0.25
Nodes (24): chat(), content(), elsewhere(), first(), fits(), ide(), judge(), lone() (+16 more)

### Community 105 - "csp.ts"
Cohesion: 0.33
Nodes (9): csp(), CSP_HEADER, ENFORCE, isStatic(), makeNonce(), STATIC, THEME_SCRIPT_HASH, config (+1 more)

### Community 106 - "app/actions.ts"
Cohesion: 0.19
Nodes (16): addMaterial(), deleteItem(), deleteMaterial(), done(), KINDS, logFocus(), resetFeed(), Result (+8 more)

### Community 107 - "createAdminClient"
Cohesion: 0.14
Nodes (14): ref_node_crypto, ref_node_fs, ref_server_only, html, theme, deleteAccount(), disconnectCanvas(), removeFiles() (+6 more)

### Community 108 - "context.ts"
Cohesion: 0.27
Nodes (14): Course, FocusContextPicker(), focusSense, bindContext(), cleanContext(), KINDS, nextContext(), read() (+6 more)

### Community 109 - "create-forms.tsx"
Cohesion: 0.11
Nodes (28): Ask about the syllabus (fresh focused chat), Course, field, label, Submit(), CalendarSearch, ExternalLink, MessageCircle (+20 more)

### Community 112 - "focus-session-debug.tsx"
Cohesion: 0.17
Nodes (13): FormError(), FocusSenseSettings(), allEvents(), at(), FocusSessionDebug(), tone, View, LENGTH (+5 more)

### Community 113 - "vitest"
Cohesion: 0.25
Nodes (9): vitest, startOfDay(), Term, paceByWeek(), items, now, termGlance(), on() (+1 more)

### Community 114 - "pricing.tsx"
Cohesion: 0.15
Nodes (11): EASE, FREE_LIST, ids, PAID, Prices, Pricing(), ProAmount(), saving() (+3 more)

### Community 115 - "score.test.ts"
Cohesion: 0.13
Nodes (6): MISSING_STOP_GRACE_MS, Opts, scenarios, Step, W, ClassifiedEvent

### Community 116 - "types.ts"
Cohesion: 0.18
Nodes (12): Focus Sense M6B. Classification and focus metrics (built, session 9, Windows), ENFORCEMENT_CONFIDENCE, FocusClassification, FocusSessionContext, Method, ScoredSegment, SegmentKind, SemanticProvider (+4 more)

### Community 117 - "syllabus.ts"
Cohesion: 0.27
Nodes (12): importSyllabus(), readSyllabus(), bare(), DAYS, KINDS, parseSyllabusItems(), realDate(), sameWork() (+4 more)

### Community 118 - "ash-burst-button.tsx"
Cohesion: 0.21
Nodes (12): matter-js, react-dom, ASH_COLORS, AshSim, createAshSimulation(), drawShard(), paintSim(), ParticleKind (+4 more)

### Community 119 - "rules.ts"
Cohesion: 0.21
Nodes (10): Ctx, abstain(), APPS, BROWSERS, GAMES, Kind, result(), rule() (+2 more)

### Community 120 - "doubt-button.tsx"
Cohesion: 0.22
Nodes (8): useAshBurst(), DEFAULT_CONFIRMATIONS, DoubtButton, DoubtButtonProps, DoubtState, extractText(), labelVariants, DoubtButton

### Community 121 - "PRODUCT.md"
Cohesion: 0.20
Nodes (9): AGENTS.md (Next 16 rules), Phase 5 complete session handoff, Phase 3 AI assistant (done), AI never saves without a confirm card, Accessibility: WCAG 2.2 AA, reduced motion, course color + code, Anti-references (Canvas, SaaS templates, childish gamification), Brand personality: precise, tactile, cheeky, Design principles (readouts not reports; color means something; everything answers back; calm by default; never lose trust) (+1 more)

### Community 122 - "canvas-html.tsx"
Cohesion: 0.28
Nodes (7): CanvasHtml(), convert(), DROP, external, KEEP, safeUrl(), TABLE_PARTS

### Community 123 - "ActivityInput"
Cohesion: 0.40
Nodes (4): Datasets, Focus Sense benchmark, Gates (v2 held-out, vitest assertions), ActivityInput

### Community 124 - "Focus Sense classifier: recorded results (M6B, 2026-10-02)"
Cohesion: 0.40
Nodes (4): Focus Sense classifier: recorded results (M6B, 2026-10-02), Review notes on this run, v1 (180 examples; spent), v2 (189 examples; gated; held-out now spent)

### Community 125 - "tasks/route.ts"
Cohesion: 0.40
Nodes (3): maxDuration, TaskName, Tasks

## Knowledge Gaps
- **477 isolated node(s):** `1. Product Direction`, `2. Selected Desktop Framework`, `What can stay shared`, `Implications`, `Still to verify` (+472 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 634 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **37 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `app-shell.tsx`, `settings-forms.tsx`, `dashboard.tsx`, `package.json`, `sidebar.tsx`, `calendar.tsx`, `chat/widgets.tsx`, `flashcards.tsx`, `calendar.ts`, `ai.tsx`, `chat-input.tsx`, `sync-window.tsx`, `proposal-card.tsx`, `materials.tsx`, `features.tsx`, `usage.tsx`, `form.tsx`, `legal.tsx`, `cn`, `landing/page.tsx`, `home.ts`, `home-search.tsx`, `chat-page.tsx`, `focus-timer.tsx`, `desktop/page.tsx`, `courses.tsx`, `study-widgets.tsx`, `context.ts`, `create-forms.tsx`, `focus-session-debug.tsx`, `pricing.tsx`, `ash-burst-button.tsx`, `doubt-button.tsx`, `canvas-html.tsx`?**
  _High betweenness centrality (0.123) - this node is a cross-community bridge._
- **Why does `vitest` connect `vitest` to `app-shell.tsx`, `package.json`, `focus-sense.ts`, `calendar.ts`, `benchmark.test.ts`, `ai.test.ts`, `classify.ts`, `cn`, `home.ts`, `home-search.tsx`, `canvas.ts`, `focus-timer.tsx`, `desktop/page.tsx`, `courses.tsx`, `csp.ts`, `app/actions.ts`, `context.ts`, `score.test.ts`, `syllabus.ts`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **Why does `next` connect `next` to `app-shell.tsx`, `settings-forms.tsx`, `dashboard.tsx`, `package.json`, `sidebar.tsx`, `calendar.tsx`, `components/widgets.tsx`, `chat/widgets.tsx`, `flashcards.tsx`, `calendar.ts`, `ai.tsx`, `chat-input.tsx`, `createClient`, `react`, `materials.tsx`, `app/layout.tsx`, `form.tsx`, `legal.tsx`, `cn`, `login/page.tsx`, `landing/page.tsx`, `home-search.tsx`, `desktop/page.tsx`, `opengraph-image.tsx`, `courses.tsx`, `csp.ts`, `app/actions.ts`, `create-forms.tsx`, `pricing.tsx`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **What connects `1. Product Direction`, `2. Selected Desktop Framework`, `What can stay shared` to the rest of the system?**
  _477 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ai.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12318840579710146 - nodes in this community are weakly interconnected._
- **Should `app-shell.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0967741935483871 - nodes in this community are weakly interconnected._
- **Should `settings-forms.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12280701754385964 - nodes in this community are weakly interconnected._