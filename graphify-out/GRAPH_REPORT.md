# Graph Report - sonnet  (2026-10-02)

## Corpus Check
- 175 files · ~157,874 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 4, .example 1, .ico 1)

## Summary
- 1386 nodes · 3482 edges · 108 communities (71 shown, 37 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 61 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `59ee619f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- src_components_evilcharts_ui_recharts_legend_chartlegend
- chats_user_item
- ai.ts
- chat-panel.tsx
- settings-forms.tsx
- dashboard.tsx
- compilerOptions
- dependencies
- package.json
- components.json
- sidebar.tsx
- calendar.tsx
- dayKey
- markdown.tsx
- focus-sense-settings.tsx
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
- attach.ts
- src_components_ui_draggable_widget_grid_spans
- sync-window.tsx
- OpenRouter
- ai.test.ts
- 13. Migration Plan
- app-shell.tsx
- public.decks
- createClient
- react
- devDependencies
- materials.tsx
- features.tsx
- app/layout.tsx
- 0014_rate_limits.sql
- usage.tsx
- motion
- public.calendar_feed
- form.tsx
- legal.tsx
- public.settings
- apple-icon.tsx
- utils.ts
- public.items
- PRODUCT.md
- login/page.tsx
- landing/page.tsx
- pricing.tsx
- Things the next Claude must NOT do
- home-search.tsx
- 3. Current Repository Compatibility
- app/actions.ts
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
- eslint.config.mjs
- courseColor
- Commercialization roadmap
- Sonnet Desktop Architecture
- study-widgets.tsx
- scripts
- csp.ts
- courses.tsx
- src_components_ui_interactive_list_preview
- src_components_ui_interactive_list_preview_interactivelistpreview

## God Nodes (most connected - your core abstractions)
1. `courseColor()` - 66 edges
2. `createClient()` - 57 edges
3. `react` - 51 edges
4. `next` - 51 edges
5. `cn()` - 39 edges
6. `dayKey()` - 34 edges
7. `Item` - 29 edges
8. `useAssistant()` - 28 edges
9. `motion` - 27 edges
10. `addDays()` - 20 edges

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

## Communities (108 total, 37 thin omitted)

### Community 2 - "ai.ts"
Cohesion: 0.12
Nodes (19): AttachedItem, calendarLines(), classLines(), ClassRow, ClassTime, dayName(), DAYS, itemContext() (+11 more)

### Community 3 - "chat-panel.tsx"
Cohesion: 0.14
Nodes (14): thinking-orbs, ChatMessage, ChatPanel(), STATUS, Shortcut, Chain, EASE, Mode (+6 more)

### Community 4 - "settings-forms.tsx"
Cohesion: 0.11
Nodes (22): deleteAccount(), removeFiles(), resetAllData(), signOut(), CourseSettings(), CourseDialog(), ItemDialog(), Submit() (+14 more)

### Community 5 - "dashboard.tsx"
Cohesion: 0.09
Nodes (30): CountdownWidget(), Course, ExamsWidget(), GradeBarsWidget(), graded(), GradePoint, hm(), HoursWidget() (+22 more)

### Community 6 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 7 - "dependencies"
Cohesion: 0.08
Nodes (25): dependencies, @base-ui/react, border-beam, class-variance-authority, cn, gsap, liquid-gooey, matter-js (+17 more)

### Community 8 - "package.json"
Cohesion: 0.10
Nodes (19): name, private, version, @base-ui/react, class-variance-authority, cn, metal-fx, @phosphor-icons/react (+11 more)

### Community 9 - "components.json"
Cohesion: 0.09
Nodes (22): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+14 more)

### Community 10 - "sidebar.tsx"
Cohesion: 0.11
Nodes (17): liquid-gooey, CREATE, CreateKind, GooeyMenu(), MenuItem, BookOpen, CalendarClock, CalendarDays (+9 more)

### Community 11 - "calendar.tsx"
Cohesion: 0.12
Nodes (23): ADD, Calendar(), clock(), EASE, GridProps, hhmm(), ItemChip(), longDay() (+15 more)

### Community 12 - "dayKey"
Cohesion: 0.22
Nodes (14): vitest, FocusBlock(), SHADES, BuddyWidget(), StreakWidget(), dayKey(), FocusSession, PendingLog (+6 more)

### Community 13 - "markdown.tsx"
Cohesion: 0.16
Nodes (11): react-markdown, remark-gfm, Markdown, components, HNode, linkCourses(), Markdown(), MdNode (+3 more)

### Community 14 - "focus-sense-settings.tsx"
Cohesion: 0.17
Nodes (11): FocusSenseSettings(), Row(), src_components_ui_checkbox, src_components_ui_checkbox_checkbox, FocusActivityEvent, focusSense, FocusSenseStatus, focusSessionId() (+3 more)

### Community 15 - "flashcards.tsx"
Cohesion: 0.06
Nodes (57): @supabase/supabase-js, deleteDeck(), shareDeck(), GET(), SECRETS, TABLES, CalendarPage(), metadata (+49 more)

### Community 16 - "calendar.ts"
Cohesion: 0.10
Nodes (39): RFC-5545, GET(), useOpenSettings(), CalendarBody(), CalendarRail(), LEVELS, MiniMonth(), Props (+31 more)

### Community 17 - "ai.tsx"
Cohesion: 0.10
Nodes (21): AssistantDemo(), DATES, DECK, GRADING, KNOWS, PLAN, POLICIES, POLS (+13 more)

### Community 18 - "icons.tsx"
Cohesion: 0.07
Nodes (36): ChatInput(), PLACEHOLDERS, Recognition, RecognitionCtor, useDictationSupported(), ABOUT_ITEM, SHORTCUTS, Award (+28 more)

### Community 19 - "public.grade_history"
Cohesion: 0.50
Nodes (3): public.grade_history, auth, public

### Community 21 - "Order"
Cohesion: 0.14
Nodes (13): 1. Rate limits — DONE (code), migration 0014 pending in Supabase, 2. Security pass, 3. Account deletion and export **[ask: touches auth]**, 4. Legal pages, 5. Monitoring **[ask: dependency or service]**, 6. Analytics **[ask: service]**, 7. Transactional email **[ask: service + DNS]**, 8. Google sign-in **[ask: auth]** (+5 more)

### Community 25 - "next"
Cohesion: 0.17
Nodes (3): nextConfig, next, metadata

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
Cohesion: 0.32
Nodes (6): slim(), ChatFile, MAX_FILES, readAttachment(), shrink(), withFiles()

### Community 55 - "sync-window.tsx"
Cohesion: 0.20
Nodes (5): resetFeed(), CANVAS_WORD, CanvasState, FeedLink(), Tone

### Community 57 - "OpenRouter"
Cohesion: 0.29
Nodes (7): Chat attachments (photos, PDFs, text; up to 3), DeepSeek v4.1 flash default model, Env vars (SUPABASE keys, AI_API_KEY, AI_MODEL, AI_VISION_MODEL, CANVAS_ENCRYPTION_KEY, CRON_SECRET), Gemini 3.8 flash vision model (VISION_MODEL), OpenRouter, Rejected: paid Anthropic API, Supabase (Postgres, Auth, Storage, RLS)

### Community 58 - "ai.test.ts"
Cohesion: 0.28
Nodes (12): Polish pass before syllabus import, NDJSON streaming protocol (think/text/propose/cards/error), Server-side task answers (no model call), asksTasks(), ITEM_DESCRIPTION_CAP, needsVision(), streamReply(), taskAnswer() (+4 more)

### Community 59 - "13. Migration Plan"
Cohesion: 0.22
Nodes (9): 13. Migration Plan, Focus Sense F1. Sensing foundation (built, session 9, Windows), M0. Web prerequisites (no desktop code), M1. Desktop shell, M4. Windows packaging proof, M5. macOS packaging and configuration proof, M6. Native capability bridge, M7. Readiness for Focus Guardian (+1 more)

### Community 60 - "app-shell.tsx"
Cohesion: 0.16
Nodes (16): itemChat(), loadChat(), saveChat(), AppShell(), Assistant, AssistantContext, Course, CreateContext (+8 more)

### Community 61 - "public.decks"
Cohesion: 0.38
Nodes (6): decks_user_updated, public.decks, public.shared_deck(), auth, public, public.courses

### Community 62 - "createClient"
Cohesion: 0.17
Nodes (29): createCourse(), createItem(), createMeeting(), deleteCourse(), deleteItem(), deleteMeeting(), disconnectCanvas(), done() (+21 more)

### Community 63 - "react"
Cohesion: 0.07
Nodes (43): matter-js, react, react-dom, CanvasHtml(), convert(), DROP, external, KEEP (+35 more)

### Community 64 - "devDependencies"
Cohesion: 0.17
Nodes (12): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @tauri-apps/cli, @types/matter-js, @types/node (+4 more)

### Community 65 - "materials.tsx"
Cohesion: 0.08
Nodes (35): Ask about the syllabus (fresh focused chat), sonner, deleteMaterial(), importSyllabus(), TaskName, Tasks, useAssistant(), useCreate() (+27 more)

### Community 66 - "features.tsx"
Cohesion: 0.08
Nodes (29): Block(), CalendarDemo(), CLASSES, CountdownDemo(), DAYS, DUE, EVERYTHING, level() (+21 more)

### Community 67 - "app/layout.tsx"
Cohesion: 0.20
Nodes (8): next-themes, src_app_globals, geist, geistMono, metadata, viewport, src_components_ui_sonner, src_components_ui_sonner_toaster

### Community 68 - "0014_rate_limits.sql"
Cohesion: 0.50
Nodes (3): public.rate_hits, rate_hits_lookup, auth

### Community 69 - "usage.tsx"
Cohesion: 0.29
Nodes (9): usageStatus(), KINDS, remaining(), resetDay(), Usage, UsageCard(), UsageDetails(), UsagePill() (+1 more)

### Community 70 - "motion"
Cohesion: 0.09
Nodes (24): motion, CoursesDemo(), blurIn, Hero(), rise, stagger, TABS, Caption() (+16 more)

### Community 71 - "public.calendar_feed"
Cohesion: 0.33
Nodes (5): public.calendar_feed(), public.class_meetings, public.courses, public.items, public.settings

### Community 73 - "form.tsx"
Cohesion: 0.22
Nodes (14): Confirmed facts (Graphify + inspection, `f676d04`), M3. Auth and data verification, Sign-in handoff [Approved], callback(), google(), LoginState, sendLink(), signIn() (+6 more)

### Community 74 - "legal.tsx"
Cohesion: 0.29
Nodes (6): CONTACT, LegalPage(), Section(), UPDATED, metadata, metadata

### Community 76 - "apple-icon.tsx"
Cohesion: 0.25
Nodes (5): contentType, size, contentType, Mark(), size

### Community 77 - "utils.ts"
Cohesion: 0.10
Nodes (33): setDone(), Block(), CodeBlock(), CopyAnswer(), useCopy(), WorkCard(), CourseView(), Copy (+25 more)

### Community 79 - "PRODUCT.md"
Cohesion: 0.13
Nodes (13): AGENTS.md (Next 16 rules), Phase 5 complete session handoff, Phase 5 Canvas sync (complete), Phase reorder (nothing dropped), Phase 0 Foundation plan (historical), Student Hub design spec v1, Vercel AI SDK + Anthropic (claude-haiku-4-5 / claude-sonnet-5), <=$10/month, v1.5 spec: shell, AI panel, calendar, materials (+5 more)

### Community 80 - "login/page.tsx"
Cohesion: 0.40
Nodes (3): JSON_LD, metadata, POINTS

### Community 81 - "landing/page.tsx"
Cohesion: 0.10
Nodes (15): gsap, Assistant(), Features(), INCLUDED, LINKS, SiteNav(), Wordmark(), FAQ (+7 more)

### Community 82 - "pricing.tsx"
Cohesion: 0.10
Nodes (28): EASE, FREE_LIST, ids, PAID, Prices, Pricing(), ProAmount(), saving() (+20 more)

### Community 83 - "Things the next Claude must NOT do"
Cohesion: 0.20
Nodes (10): Phase 3 AI assistant (done), Calendar and class-week grounding, Commit and push every important change to main, AI never saves without a confirm card, Things the next Claude must NOT do, Honest UI (no fake data), Reasoning rule (off by default, auto for tutoring, Think toggle), UI rules (metal=AI only, gooey menus, cyan=you now, course hue rule) (+2 more)

### Community 84 - "home-search.tsx"
Cohesion: 0.09
Nodes (25): Course, EASE, EXAMPLES, Found, HomeSearch(), Row, when(), ArrowRight (+17 more)

### Community 85 - "3. Current Repository Compatibility"
Cohesion: 0.40
Nodes (5): 3. Current Repository Compatibility, Implications, Known blockers, Still to verify, What can stay shared

### Community 86 - "app/actions.ts"
Cohesion: 0.05
Nodes (72): ref_node_crypto, ref_node_fs, ref_server_only, unpdf, html, theme, addMaterial(), askSyllabus() (+64 more)

### Community 87 - "chat-page.tsx"
Cohesion: 0.18
Nodes (12): border-beam, deleteChat(), listChats(), ChatHistory(), Saved, ChatLog(), History, SquarePen (+4 more)

### Community 88 - "focus-timer.tsx"
Cohesion: 0.14
Nodes (22): 11. Packaging and Updating, 4. Target Architecture, M2. Shared app boot, P1. Focus-session durability fix (prerequisite, before M6), logFocus(), Focus, FocusButton(), FocusContext (+14 more)

### Community 89 - "desktop/page.tsx"
Cohesion: 0.33
Nodes (5): Bounce(), DesktopSignIn(), metadata, desktopLink(), Params

### Community 90 - "Security"
Cohesion: 0.40
Nodes (4): App, Database (RLS), Secret rotation checklist, Security

### Community 91 - "chat/route.ts"
Cohesion: 0.39
Nodes (7): maxDuration, POST(), lightContext(), needsSearch(), needsThinking(), smallTalk(), Turn

### Community 94 - "Phase 6 Materials + syllabus (in progress)"
Cohesion: 0.18
Nodes (11): Next.js 16 breaking-changes rule (read node_modules/next/dist/docs), CLAUDE.md includes AGENTS.md (Next 16 rules), Context-aware chat shortcuts (planned), Exam study guides (planned), Phase 6 Materials + syllabus (in progress), Personal MVP (single user, sign-ups closed, RLS everywhere), SaaS step (sign-up, Stripe, Resend, Canvas OAuth), Sonnet student planner (+3 more)

### Community 95 - "0015_ai_usage.sql"
Cohesion: 0.39
Nodes (5): ai_usage_user_at, public.ai_usage, public.plans, public.usage_status(), auth

### Community 96 - "opengraph-image.tsx"
Cohesion: 0.40
Nodes (3): alt, contentType, size

### Community 97 - "eslint.config.mjs"
Cohesion: 0.50
Nodes (3): eslintConfig, eslint, eslint-config-next

### Community 98 - "courseColor"
Cohesion: 0.15
Nodes (17): Dot(), ScoresWidget(), Dot(), Link2, StickyNote, Row(), WeekStrip(), CalendarWidget() (+9 more)

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

### Community 105 - "csp.ts"
Cohesion: 0.29
Nodes (10): @supabase/ssr, csp(), CSP_HEADER, ENFORCE, isStatic(), makeNonce(), STATIC, THEME_SCRIPT_HASH (+2 more)

### Community 109 - "courses.tsx"
Cohesion: 0.13
Nodes (29): ADD, Course, field, FormError(), label, ChevronRight, ExternalLink, MessageCircle (+21 more)

## Knowledge Gaps
- **402 isolated node(s):** `1. Product Direction`, `2. Selected Desktop Framework`, `What can stay shared`, `Implications`, `Still to verify` (+397 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 541 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **37 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `chat-panel.tsx`, `settings-forms.tsx`, `dashboard.tsx`, `package.json`, `sidebar.tsx`, `calendar.tsx`, `flashcards.tsx`, `calendar.ts`, `ai.tsx`, `icons.tsx`, `app-shell.tsx`, `react`, `materials.tsx`, `app/layout.tsx`, `motion`, `form.tsx`, `legal.tsx`, `apple-icon.tsx`, `utils.ts`, `login/page.tsx`, `landing/page.tsx`, `pricing.tsx`, `home-search.tsx`, `app/actions.ts`, `desktop/page.tsx`, `opengraph-image.tsx`, `courseColor`, `csp.ts`, `courses.tsx`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `chat-panel.tsx`, `settings-forms.tsx`, `dashboard.tsx`, `package.json`, `sidebar.tsx`, `calendar.tsx`, `focus-sense-settings.tsx`, `flashcards.tsx`, `calendar.ts`, `ai.tsx`, `icons.tsx`, `sync-window.tsx`, `app-shell.tsx`, `createClient`, `materials.tsx`, `features.tsx`, `usage.tsx`, `motion`, `form.tsx`, `legal.tsx`, `utils.ts`, `landing/page.tsx`, `pricing.tsx`, `home-search.tsx`, `chat-page.tsx`, `focus-timer.tsx`, `desktop/page.tsx`, `study-widgets.tsx`, `courses.tsx`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Why does `typedPart()` connect `ai.test.ts` to `OpenRouter`, `ai.ts`, `chat/route.ts`, `attach.ts`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **What connects `1. Product Direction`, `2. Selected Desktop Framework`, `What can stay shared` to the rest of the system?**
  _402 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ai.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11956521739130435 - nodes in this community are weakly interconnected._
- **Should `chat-panel.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14166666666666666 - nodes in this community are weakly interconnected._
- **Should `settings-forms.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11333333333333333 - nodes in this community are weakly interconnected._