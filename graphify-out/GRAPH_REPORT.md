# Graph Report - sonnet  (2026-10-02)

## Corpus Check
- 175 files · ~157,874 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 4, .example 1, .ico 1)

## Summary
- 1387 nodes · 3483 edges · 110 communities (73 shown, 37 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 60 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d3b860ea`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- src_components_evilcharts_ui_recharts_legend_chartlegend
- chats_user_item
- ai.ts
- chat-panel.tsx
- Item
- dashboard.tsx
- compilerOptions
- dependencies
- package.json
- components.json
- sidebar.tsx
- calendar.tsx
- course.ts
- useAssistant
- focus-sense.ts
- flashcards.tsx
- calendar.ts
- canvas.ts
- icons.tsx
- public.grade_history
- src_components_ui_draggable_widget_grid
- Order
- src_lib_gsap_gsap
- src_lib_gsap_usegsap
- createAdminClient
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
- attach.ts
- src_components_ui_draggable_widget_grid_spans
- pricing.tsx
- Phase 6 Materials + syllabus (in progress)
- ai.test.ts
- 13. Migration Plan
- app-shell.tsx
- public.decks
- createClient
- next
- devDependencies
- tasks.tsx
- features.tsx
- app/layout.tsx
- 0014_rate_limits.sql
- usage.tsx
- ai.tsx
- public.calendar_feed
- Confirmed facts (Graphify + inspection, `f676d04`)
- ash-burst-button.tsx
- public.settings
- home-search.tsx
- progress.ts
- public.items
- Student Hub design spec v1
- login/page.tsx
- landing/page.tsx
- home.ts
- Things the next Claude must NOT do
- search.ts
- 3. Current Repository Compatibility
- app/actions.ts
- chat-page.tsx
- focus-timer.tsx
- export/route.ts
- Security
- syllabus.ts
- src_components_ui_container_scroll_animation
- src_components_ui_container_scroll_animation_containerscroll
- PRODUCT.md
- 0015_ai_usage.sql
- doubt-button.tsx
- canvas-html.tsx
- chat/widgets.tsx
- Commercialization roadmap
- Sonnet Desktop Architecture
- study-widgets.tsx
- scripts
- syncCanvasNow
- csp.ts
- studentContext
- courses.tsx
- src_components_ui_interactive_list_preview
- src_components_ui_interactive_list_preview_interactivelistpreview

## God Nodes (most connected - your core abstractions)
1. `courseColor()` - 66 edges
2. `createClient()` - 57 edges
3. `next` - 51 edges
4. `react` - 51 edges
5. `cn()` - 39 edges
6. `dayKey()` - 34 edges
7. `Item` - 29 edges
8. `useAssistant()` - 28 edges
9. `motion` - 27 edges
10. `done()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `Known blockers` --references--> `logFocus()`  [INFERRED]
  DESKTOP_ARCHITECTURE_SPEC.md → src/app/actions.ts
- `Focus Sense F1. Sensing foundation (built, session 9, Windows)` --references--> `FocusProvider()`  [INFERRED]
  DESKTOP_ARCHITECTURE_SPEC.md → src/components/focus-timer.tsx
- `Calendar and class-week grounding` --references--> `studentContext()`  [INFERRED]
  HANDOFF.md → src/lib/ai.ts
- `Syllabus memory in every chat (24k, summary excluded)` --implements--> `studentContext()`  [INFERRED]
  HANDOFF.md → src/lib/ai.ts
- `1. Rate limits — DONE (code), migration 0014 pending in Supabase` --references--> `allowed()`  [INFERRED]
  docs/PHASE-10-PLAN.md → src/lib/limit.ts

## Import Cycles
- 3-file cycle: `src/components/app-shell.tsx -> src/components/chat/chat-panel.tsx -> src/components/chat/chat-input.tsx -> src/components/app-shell.tsx`
- 3-file cycle: `src/components/app-shell.tsx -> src/components/chat/chat-panel.tsx -> src/components/chat/widgets.tsx -> src/components/app-shell.tsx`

## Hyperedges (group relationships)
- **Syllabus reference flow** — src_app_actions_summarizesyllabus, src_components_syllabus_summary_summarydialog, src_lib_syllabus_samework, handoff_syllabus_summary_note, handoff_ask_about_syllabus, handoff_missed_dates_check [EXTRACTED 1.00]
- **Chat request routing** — src_lib_attach_typedpart, src_lib_ai_askstasks, src_lib_ai_wantschange, src_lib_ai_needsthinking, src_lib_ai_streamreply [INFERRED 0.85]

## Communities (110 total, 37 thin omitted)

### Community 2 - "ai.ts"
Cohesion: 0.11
Nodes (16): maxDuration, AttachedItem, ClassRow, ClassTime, DAYS, Deck, Kind, lightContext() (+8 more)

### Community 3 - "chat-panel.tsx"
Cohesion: 0.16
Nodes (12): ChatMessage, ChatPanel(), STATUS, Chain, EASE, Mode, ThoughtChain(), FlashDeck() (+4 more)

### Community 4 - "Item"
Cohesion: 0.20
Nodes (10): vitest, parseDay(), Term, paceByWeek(), items, now, Item, termGlance() (+2 more)

### Community 5 - "dashboard.tsx"
Cohesion: 0.10
Nodes (33): useCreate(), Block(), CountdownWidget(), Course, Dot(), ExamsWidget(), GradeBarsWidget(), graded() (+25 more)

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

### Community 10 - "sidebar.tsx"
Cohesion: 0.11
Nodes (17): liquid-gooey, CREATE, CreateKind, GooeyMenu(), MenuItem, BookOpen, CalendarClock, CalendarDays (+9 more)

### Community 11 - "calendar.tsx"
Cohesion: 0.09
Nodes (32): useOpenSettings(), ADD, Calendar(), clock(), EASE, GridProps, hhmm(), ItemChip() (+24 more)

### Community 12 - "course.ts"
Cohesion: 0.14
Nodes (22): ChatPage(), shortcutsFor(), WhatIf(), FocusBlock(), SHADES, BuddyWidget(), WeekStrip(), AskWidget() (+14 more)

### Community 13 - "useAssistant"
Cohesion: 0.14
Nodes (16): react-markdown, remark-gfm, UpNext(), CHIP, useAssistant(), Markdown, components, HNode (+8 more)

### Community 14 - "focus-sense.ts"
Cohesion: 0.17
Nodes (11): LoginForm(), call(), FocusActivityEvent, focusSense, FocusSenseStatus, focusSessionId(), Invoke, queue (+3 more)

### Community 15 - "flashcards.tsx"
Cohesion: 0.07
Nodes (50): deleteDeck(), shareDeck(), CalendarPage(), metadata, Chat(), metadata, CoursePage(), generateMetadata() (+42 more)

### Community 16 - "calendar.ts"
Cohesion: 0.12
Nodes (32): RFC-5545, GET(), CalendarBody(), MiniMonth(), CourseCard, CourseFace(), courseStats(), ClassesWidget() (+24 more)

### Community 17 - "canvas.ts"
Cohesion: 0.13
Nodes (27): saveCanvasConnection(), CanvasAssignment, canvasBaseUrl(), CanvasCourse, canvasFeedUrl(), CanvasItem, canvasPages(), CanvasSettings (+19 more)

### Community 18 - "icons.tsx"
Cohesion: 0.07
Nodes (37): PLACEHOLDERS, Recognition, RecognitionCtor, ABOUT_ITEM, Shortcut, SHORTCUTS, Award, BookOpenCheck (+29 more)

### Community 19 - "public.grade_history"
Cohesion: 0.50
Nodes (3): public.grade_history, auth, public

### Community 21 - "Order"
Cohesion: 0.14
Nodes (13): 1. Rate limits — DONE (code), migration 0014 pending in Supabase, 2. Security pass, 3. Account deletion and export **[ask: touches auth]**, 4. Legal pages, 5. Monitoring **[ask: dependency or service]**, 6. Analytics **[ask: service]**, 7. Transactional email **[ask: service + DNS]**, 8. Google sign-in **[ask: auth]** (+5 more)

### Community 25 - "createAdminClient"
Cohesion: 0.16
Nodes (10): ref_node_crypto, ref_node_fs, ref_server_only, @supabase/supabase-js, html, theme, GET(), maxDuration (+2 more)

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

### Community 53 - "attach.ts"
Cohesion: 0.24
Nodes (7): unpdf, ChatInput(), useDictationSupported(), ChatFile, readAttachment(), shrink(), withFiles()

### Community 55 - "pricing.tsx"
Cohesion: 0.16
Nodes (10): EASE, FREE_LIST, ids, PAID, Prices, Pricing(), ProAmount(), saving() (+2 more)

### Community 57 - "Phase 6 Materials + syllabus (in progress)"
Cohesion: 0.15
Nodes (13): Context-aware chat shortcuts (planned), Exam study guides (planned), Phase 6 Materials + syllabus (in progress), Chat attachments (photos, PDFs, text; up to 3), DeepSeek v4.1 flash default model, Env vars (SUPABASE keys, AI_API_KEY, AI_MODEL, AI_VISION_MODEL, CANVAS_ENCRYPTION_KEY, CRON_SECRET), Gemini 3.8 flash vision model (VISION_MODEL), OpenRouter (+5 more)

### Community 58 - "ai.test.ts"
Cohesion: 0.28
Nodes (12): Polish pass before syllabus import, NDJSON streaming protocol (think/text/propose/cards/error), Server-side task answers (no model call), asksTasks(), ITEM_DESCRIPTION_CAP, needsVision(), streamReply(), taskAnswer() (+4 more)

### Community 59 - "13. Migration Plan"
Cohesion: 0.18
Nodes (11): 13. Migration Plan, Focus Sense F1. Sensing foundation (built, session 9, Windows), M0. Web prerequisites (no desktop code), M1. Desktop shell, M3. Auth and data verification, M4. Windows packaging proof, M5. macOS packaging and configuration proof, M6. Native capability bridge (+3 more)

### Community 60 - "app-shell.tsx"
Cohesion: 0.17
Nodes (15): itemChat(), loadChat(), saveChat(), AppShell(), Assistant, AssistantContext, Course, CreateContext (+7 more)

### Community 61 - "public.decks"
Cohesion: 0.38
Nodes (6): decks_user_updated, public.decks, public.shared_deck(), auth, public, public.courses

### Community 62 - "createClient"
Cohesion: 0.17
Nodes (30): createCourse(), createItem(), createMeeting(), deleteCourse(), deleteItem(), deleteMaterial(), deleteMeeting(), done() (+22 more)

### Community 63 - "next"
Cohesion: 0.05
Nodes (37): nextConfig, next, contentType, size, Bounce(), DesktopSignIn(), metadata, contentType (+29 more)

### Community 64 - "devDependencies"
Cohesion: 0.17
Nodes (12): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @tauri-apps/cli, @types/matter-js, @types/node (+4 more)

### Community 65 - "tasks.tsx"
Cohesion: 0.29
Nodes (5): X, Done, State, src_components_ui_status_mark, src_components_ui_status_mark_statusmark

### Community 66 - "features.tsx"
Cohesion: 0.08
Nodes (27): Block(), CalendarDemo(), CLASSES, CountdownDemo(), DAYS, DUE, EVERYTHING, level() (+19 more)

### Community 67 - "app/layout.tsx"
Cohesion: 0.20
Nodes (8): next-themes, src_app_globals, geist, geistMono, metadata, viewport, src_components_ui_sonner, src_components_ui_sonner_toaster

### Community 68 - "0014_rate_limits.sql"
Cohesion: 0.50
Nodes (3): public.rate_hits, rate_hits_lookup, auth

### Community 69 - "usage.tsx"
Cohesion: 0.21
Nodes (12): usageStatus(), src_components_ui_popover_popover, src_components_ui_popover_popovercontent, src_components_ui_popover_popovertrigger, KINDS, remaining(), resetDay(), Usage (+4 more)

### Community 70 - "ai.tsx"
Cohesion: 0.06
Nodes (41): motion, AssistantDemo(), DATES, DECK, GRADING, KNOWS, PLAN, POLICIES (+33 more)

### Community 71 - "public.calendar_feed"
Cohesion: 0.33
Nodes (5): public.calendar_feed(), public.class_meetings, public.courses, public.items, public.settings

### Community 73 - "Confirmed facts (Graphify + inspection, `f676d04`)"
Cohesion: 0.44
Nodes (8): Confirmed facts (Graphify + inspection, `f676d04`), Sign-in handoff [Approved], callback(), google(), LoginState, sendLink(), signIn(), signUp()

### Community 74 - "ash-burst-button.tsx"
Cohesion: 0.21
Nodes (12): matter-js, react-dom, ASH_COLORS, AshSim, createAshSimulation(), drawShard(), paintSim(), ParticleKind (+4 more)

### Community 76 - "home-search.tsx"
Cohesion: 0.18
Nodes (11): Course, EASE, EXAMPLES, Found, HomeSearch(), Row, when(), ArrowRight (+3 more)

### Community 77 - "progress.ts"
Cohesion: 0.12
Nodes (21): WorkCard(), CourseView(), EASE, GlassWidget(), PIPS, PlantWidget(), r2(), RollWidget() (+13 more)

### Community 79 - "Student Hub design spec v1"
Cohesion: 0.22
Nodes (8): Phase 5 Canvas sync (complete), Phase reorder (nothing dropped), Phase 0 Foundation plan (historical), Student Hub design spec v1, Vercel AI SDK + Anthropic (claude-haiku-4-5 / claude-sonnet-5), <=$10/month, v1.5 spec: shell, AI panel, calendar, materials, Canvas sync (encrypted token + ICS, daily cron), Check for dates Canvas missed

### Community 80 - "login/page.tsx"
Cohesion: 0.40
Nodes (3): JSON_LD, metadata, POINTS

### Community 81 - "landing/page.tsx"
Cohesion: 0.11
Nodes (14): gsap, Assistant(), Features(), INCLUDED, LINKS, SiteNav(), Wordmark(), FAQ (+6 more)

### Community 82 - "home.ts"
Cohesion: 0.21
Nodes (17): Drag, SnapGrid(), SPRING, COLS, DEFAULT_LAYOUT, fits(), freeSpot(), Layout (+9 more)

### Community 83 - "Things the next Claude must NOT do"
Cohesion: 0.29
Nodes (7): Calendar and class-week grounding, Commit and push every important change to main, Things the next Claude must NOT do, Honest UI (no fake data), Reasoning rule (off by default, auto for tutoring, Think toggle), UI rules (metal=AI only, gooey menus, cyan=you now, course hue rule), needsThinking()

### Community 84 - "search.ts"
Cohesion: 0.14
Nodes (15): at0(), Course, FILLER, KINDS, MONTHS, norm(), Place, PLACES (+7 more)

### Community 85 - "3. Current Repository Compatibility"
Cohesion: 0.40
Nodes (5): 3. Current Repository Compatibility, Implications, Known blockers, Still to verify, What can stay shared

### Community 86 - "app/actions.ts"
Cohesion: 0.09
Nodes (35): addMaterial(), askSyllabus(), deleteAccount(), disconnectCanvas(), KINDS, removeFiles(), resetAllData(), Result (+27 more)

### Community 87 - "chat-page.tsx"
Cohesion: 0.24
Nodes (9): border-beam, thinking-orbs, deleteChat(), listChats(), ChatHistory(), Saved, ChatLog(), History (+1 more)

### Community 88 - "focus-timer.tsx"
Cohesion: 0.13
Nodes (23): 11. Packaging and Updating, 4. Target Architecture, M2. Shared app boot, P1. Focus-session durability fix (prerequisite, before M6), logFocus(), Focus, FocusButton(), FocusContext (+15 more)

### Community 89 - "export/route.ts"
Cohesion: 0.50
Nodes (3): GET(), SECRETS, TABLES

### Community 90 - "Security"
Cohesion: 0.40
Nodes (4): App, Database (RLS), Secret rotation checklist, Security

### Community 91 - "syllabus.ts"
Cohesion: 0.27
Nodes (12): readSyllabus(), bare(), DAYS, Draft, Kind, KINDS, parseSyllabusItems(), realDate() (+4 more)

### Community 94 - "PRODUCT.md"
Cohesion: 0.13
Nodes (14): AGENTS.md (Next 16 rules), Next.js 16 breaking-changes rule (read node_modules/next/dist/docs), CLAUDE.md includes AGENTS.md (Next 16 rules), Phase 5 complete session handoff, Phase 3 AI assistant (done), AI never saves without a confirm card, Personal MVP (single user, sign-ups closed, RLS everywhere), SaaS step (sign-up, Stripe, Resend, Canvas OAuth) (+6 more)

### Community 95 - "0015_ai_usage.sql"
Cohesion: 0.39
Nodes (5): ai_usage_user_at, public.ai_usage, public.plans, public.usage_status(), auth

### Community 96 - "doubt-button.tsx"
Cohesion: 0.22
Nodes (8): useAshBurst(), DEFAULT_CONFIRMATIONS, DoubtButton, DoubtButtonProps, DoubtState, extractText(), labelVariants, DoubtButton

### Community 97 - "canvas-html.tsx"
Cohesion: 0.28
Nodes (7): CanvasHtml(), convert(), DROP, external, KEEP, safeUrl(), TABLE_PARTS

### Community 98 - "chat/widgets.tsx"
Cohesion: 0.28
Nodes (8): CodeBlock(), CopyAnswer(), Dot(), PlanCard(), useCopy(), Copy, ItemDetails(), src_components_ui_popover

### Community 99 - "Commercialization roadmap"
Cohesion: 0.18
Nodes (10): At a glance, Commercialization roadmap, Metrics to watch (from Phase 10 on), Phase 10 — Launch readiness, Phase 11 — AI cost & reliability, Phase 12 — Pricing & billing, Phase 13 — Onboarding & activation, Phase 14 — Growth (+2 more)

### Community 101 - "Sonnet Desktop Architecture"
Cohesion: 0.10
Nodes (20): 10. Web Compatibility, 12. Focus Guardian Readiness, 14. Explicit Non-Goals, 15. Open Risks / Unverified Claims, 16. Authoritative Implementation Decisions, 1. Product Direction, 2. Selected Desktop Framework, 5. Shared vs Desktop-Only Boundaries (+12 more)

### Community 102 - "study-widgets.tsx"
Cohesion: 0.14
Nodes (17): Pause, Play, BreatheWidget(), byDue(), EASE, Mood, MOUTHS, noise() (+9 more)

### Community 103 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, desktop:build, desktop:dev, dev, lint, start, test

### Community 104 - "syncCanvasNow"
Cohesion: 0.29
Nodes (7): cleanCards(), createDeck(), saveName(), syncCanvasNow(), updateDeck(), Onboarding(), limitError()

### Community 105 - "csp.ts"
Cohesion: 0.29
Nodes (10): @supabase/ssr, csp(), CSP_HEADER, ENFORCE, isStatic(), makeNonce(), STATIC, THEME_SCRIPT_HASH (+2 more)

### Community 106 - "studentContext"
Cohesion: 0.48
Nodes (7): calendarLines(), classLines(), dayName(), itemContext(), localNow(), plainText(), studentContext()

### Community 109 - "courses.tsx"
Cohesion: 0.06
Nodes (77): Ask about the syllabus (fresh focused chat), react, sonner, importSyllabus(), ADD, Course, CourseDialog(), field (+69 more)

## Knowledge Gaps
- **402 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+397 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 542 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **37 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `chat-panel.tsx`, `dashboard.tsx`, `package.json`, `sidebar.tsx`, `calendar.tsx`, `course.ts`, `flashcards.tsx`, `icons.tsx`, `createAdminClient`, `pricing.tsx`, `app-shell.tsx`, `tasks.tsx`, `app/layout.tsx`, `ai.tsx`, `Confirmed facts (Graphify + inspection, `f676d04`)`, `home-search.tsx`, `login/page.tsx`, `landing/page.tsx`, `app/actions.ts`, `chat/widgets.tsx`, `csp.ts`, `courses.tsx`?**
  _High betweenness centrality (0.116) - this node is a cross-community bridge._
- **Why does `react` connect `courses.tsx` to `chat-panel.tsx`, `dashboard.tsx`, `package.json`, `sidebar.tsx`, `calendar.tsx`, `flashcards.tsx`, `icons.tsx`, `pricing.tsx`, `app-shell.tsx`, `createClient`, `next`, `features.tsx`, `usage.tsx`, `ai.tsx`, `ash-burst-button.tsx`, `home-search.tsx`, `progress.ts`, `landing/page.tsx`, `home.ts`, `chat-page.tsx`, `focus-timer.tsx`, `doubt-button.tsx`, `canvas-html.tsx`, `chat/widgets.tsx`, `study-widgets.tsx`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Why does `createClient()` connect `createClient` to `ai.ts`, `usage.tsx`, `syncCanvasNow`, `Confirmed facts (Graphify + inspection, `f676d04`)`, `courses.tsx`, `flashcards.tsx`, `canvas.ts`, `app/actions.ts`, `chat-page.tsx`, `focus-timer.tsx`, `export/route.ts`, `syllabus.ts`, `app-shell.tsx`, `createAdminClient`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _402 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ai.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10822510822510822 - nodes in this community are weakly interconnected._
- **Should `dashboard.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09639953542392567 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._