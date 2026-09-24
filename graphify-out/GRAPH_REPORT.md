# Graph Report - sonnet  (2026-09-23)

## Corpus Check
- 94 files · ~66,451 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 699 nodes · 1588 edges · 52 communities (32 shown, 20 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 23 edges (avg confidence: 0.83)
- Token cost: 99,937 input · 0 output

## Community Hubs (Navigation)
- courses.tsx
- settings-forms.tsx
- widgets.tsx
- app/actions.ts
- rows.ts
- calendar.tsx
- compilerOptions
- dependencies
- package.json
- components.json
- ash-burst-button.tsx
- useAssistant()
- carousel.tsx
- chat-panel.tsx
- ai.ts
- Student Hub design spec v1
- app-shell.tsx
- attach.ts
- Phase 6 Materials + syllabus (in progres
- devDependencies
- PRODUCT.md
- chat-input.tsx
- ai.test.ts
- chat/route.ts
- Things the next Claude must NOT do
- scripts
- public.calendar_feed()
- 0001_init.sql
- app/layout.tsx
- studentContext()
- public.materials
- public.class_meetings
- proxy.ts
- public.canvas_connections
- Ideas: after-class check-in, start-by pl
- Phase 4 Calendar (done)
- eslint.config.mjs
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
- public.courses
- public.items
- public.settings

## God Nodes (most connected - your core abstractions)
1. `cn()` - 22 edges
2. `react` - 21 edges
3. `courseColor()` - 19 edges
4. `useAssistant()` - 19 edges
5. `Item` - 17 edges
6. `compilerOptions` - 16 edges
7. `done()` - 16 edges
8. `applyProposal()` - 15 edges
9. `lucide-react` - 15 edges
10. `next` - 15 edges

## Surprising Connections (you probably didn't know these)
- `Calendar and class-week grounding` --references--> `studentContext()`  [INFERRED]
  HANDOFF.md → src/lib/ai.ts
- `Syllabus memory in every chat (24k, summary excluded)` --implements--> `studentContext()`  [INFERRED]
  HANDOFF.md → src/lib/ai.ts
- `Reasoning rule (off by default, auto for tutoring, Think toggle)` --references--> `needsThinking()`  [EXTRACTED]
  HANDOFF.md → src/lib/ai.ts
- `Check for dates Canvas missed` --references--> `sameWork()`  [EXTRACTED]
  HANDOFF.md → src/lib/syllabus.ts
- `AI never saves without a confirm card` --references--> `applyProposal()`  [EXTRACTED]
  HANDOFF.md → src/components/chat/proposal-card.tsx

## Import Cycles
- 3-file cycle: `src/components/app-shell.tsx -> src/components/chat/chat-panel.tsx -> src/components/chat/markdown.tsx -> src/components/app-shell.tsx`
- 3-file cycle: `src/components/app-shell.tsx -> src/components/chat/chat-panel.tsx -> src/components/chat/widgets.tsx -> src/components/app-shell.tsx`
- 4-file cycle: `src/components/app-shell.tsx -> src/components/materials.tsx -> src/components/syllabus-summary.tsx -> src/components/chat/markdown.tsx -> src/components/app-shell.tsx`
- 4-file cycle: `src/components/app-shell.tsx -> src/components/chat/chat-panel.tsx -> src/components/chat/markdown.tsx -> src/components/chat/widgets.tsx -> src/components/app-shell.tsx`
- 5-file cycle: `src/components/app-shell.tsx -> src/components/materials.tsx -> src/components/syllabus-summary.tsx -> src/components/chat/markdown.tsx -> src/components/chat/widgets.tsx -> src/components/app-shell.tsx`

## Hyperedges (group relationships)
- **Syllabus reference flow** — src_app_actions_summarizesyllabus, src_components_syllabus_summary_summarydialog, src_lib_syllabus_samework, handoff_syllabus_summary_note, handoff_ask_about_syllabus, handoff_missed_dates_check [EXTRACTED 1.00]
- **Chat request routing** — src_lib_attach_typedpart, src_lib_ai_askstasks, src_lib_ai_wantschange, src_lib_ai_needsthinking, src_lib_ai_streamreply [INFERRED 0.85]

## Communities (52 total, 20 thin omitted)

### Community 0 - "courses.tsx"
Cohesion: 0.06
Nodes (63): RFC-5545, createItem(), createMeeting(), deleteCourse(), deleteMeeting(), done(), updateCourse(), updateItem() (+55 more)

### Community 1 - "settings-forms.tsx"
Cohesion: 0.07
Nodes (53): Ask about the syllabus (fresh focused chat), lucide-react, react, sonner, createCourse(), deleteMaterial(), disconnectCanvas(), resetAllData() (+45 more)

### Community 2 - "widgets.tsx"
Cohesion: 0.09
Nodes (43): deleteItem(), setDone(), useCreate(), useOpenSettings(), Block(), CalendarBody(), Semester(), CodeBlock() (+35 more)

### Community 3 - "app/actions.ts"
Cohesion: 0.08
Nodes (48): ref_node_crypto, @supabase/supabase-js, askSyllabus(), importSyllabus(), KINDS, readSyllabus(), Result, saveCanvasConnection() (+40 more)

### Community 4 - "rows.ts"
Cohesion: 0.13
Nodes (24): CalendarPage(), metadata, Chat(), metadata, CoursesPage(), metadata, AppLayout(), Page() (+16 more)

### Community 5 - "calendar.tsx"
Cohesion: 0.09
Nodes (27): nextConfig, liquid-gooey, motion, next, ADD, Calendar(), clock(), EASE (+19 more)

### Community 6 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 7 - "dependencies"
Cohesion: 0.07
Nodes (28): dependencies, @base-ui/react, border-beam, class-variance-authority, cn, date-fns, gsap, @gsap/react (+20 more)

### Community 8 - "package.json"
Cohesion: 0.08
Nodes (25): name, private, version, @base-ui/react, border-beam, class-variance-authority, cn, date-fns (+17 more)

### Community 9 - "components.json"
Cohesion: 0.09
Nodes (22): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+14 more)

### Community 10 - "ash-burst-button.tsx"
Cohesion: 0.12
Nodes (19): matter-js, react-dom, ASH_COLORS, AshSim, createAshSimulation(), drawShard(), paintSim(), ParticleKind (+11 more)

### Community 11 - "useAssistant()"
Cohesion: 0.16
Nodes (15): addMaterial(), useAssistant(), components, HNode, linkCourses(), Markdown(), MdNode, tidy() (+7 more)

### Community 12 - "carousel.tsx"
Cohesion: 0.22
Nodes (14): ANGLE, Carousel(), out(), PERIOD, Slide, Spot, spotOf(), write() (+6 more)

### Community 13 - "chat-panel.tsx"
Cohesion: 0.17
Nodes (12): thinking-orbs, deleteChat(), listChats(), ChatHistory(), Saved, ChatLog(), ChatMessage, ChatPanel() (+4 more)

### Community 14 - "ai.ts"
Cohesion: 0.12
Nodes (11): BASE, ClassRow, ClassTime, DAYS, Kind, MODELS, Refs, Task (+3 more)

### Community 15 - "Student Hub design spec v1"
Cohesion: 0.13
Nodes (14): Phase 5 Canvas sync (complete), Phase reorder (nothing dropped), Phase 0 Foundation plan (historical), Student Hub design spec v1, Vercel AI SDK + Anthropic (claude-haiku-4-5 / claude-sonnet-5), <=$10/month, v1.5 spec: shell, AI panel, calendar, materials, Canvas sync (encrypted token + ICS, daily cron), DeepSeek v4.1 flash default model (+6 more)

### Community 16 - "app-shell.tsx"
Cohesion: 0.16
Nodes (14): loadChat(), saveChat(), AppShell(), Assistant, AssistantContext, Course, CreateContext, Schedule (+6 more)

### Community 17 - "attach.ts"
Cohesion: 0.21
Nodes (8): unpdf, vitest, ChatFile, MAX_FILES, readAttachment(), shrink(), withFiles(), extractText()

### Community 18 - "Phase 6 Materials + syllabus (in progres"
Cohesion: 0.17
Nodes (12): Next.js 16 breaking-changes rule (read node_modules/next/dist/docs), CLAUDE.md includes AGENTS.md (Next 16 rules), Context-aware chat shortcuts (planned), Exam study guides (planned), Phase 6 Materials + syllabus (in progress), Chat attachments (photos, PDFs, text; up to 3), Personal MVP (single user, sign-ups closed, RLS everywhere), SaaS step (sign-up, Stripe, Resend, Canvas OAuth) (+4 more)

### Community 19 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/matter-js, @types/node, @types/react (+3 more)

### Community 20 - "PRODUCT.md"
Cohesion: 0.20
Nodes (9): AGENTS.md (Next 16 rules), Phase 5 complete session handoff, Phase 3 AI assistant (done), AI never saves without a confirm card, Accessibility: WCAG 2.2 AA, reduced motion, course color + code, Anti-references (Canvas, SaaS templates, childish gamification), Brand personality: precise, tactile, cheeky, Design principles (readouts not reports; color means something; everything answers back; calm by default; never lose trust) (+1 more)

### Community 21 - "chat-input.tsx"
Cohesion: 0.22
Nodes (9): metal-fx, next-themes, voice-glow, ChatInput(), PLACEHOLDERS, Recognition, RecognitionCtor, useDictationSupported() (+1 more)

### Community 22 - "ai.test.ts"
Cohesion: 0.43
Nodes (7): Polish pass before syllabus import, Server-side task answers (no model call), asksTasks(), taskAnswer(), toolsFor(), wantsCards(), wantsChange()

### Community 23 - "chat/route.ts"
Cohesion: 0.39
Nodes (7): NDJSON streaming protocol (think/text/propose/cards/error), maxDuration, POST(), needsThinking(), streamReply(), Turn, typedPart()

### Community 24 - "Things the next Claude must NOT do"
Cohesion: 0.33
Nodes (6): Calendar and class-week grounding, Commit and push every important change to main, Things the next Claude must NOT do, Honest UI (no fake data), Reasoning rule (off by default, auto for tutoring, Think toggle), UI rules (metal=AI only, gooey menus, cyan=you now, course hue rule)

### Community 25 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint, start, test

### Community 26 - "public.calendar_feed()"
Cohesion: 0.33
Nodes (5): public.class_meetings, public.calendar_feed(), public.courses, public.items, public.settings

### Community 27 - "0001_init.sql"
Cohesion: 0.47
Nodes (5): public.courses, public.items, public.settings, auth, public

### Community 28 - "app/layout.tsx"
Cohesion: 0.40
Nodes (3): geistMono, geistSans, metadata

### Community 29 - "studentContext()"
Cohesion: 0.70
Nodes (5): calendarLines(), classLines(), dayName(), localNow(), studentContext()

### Community 30 - "public.materials"
Cohesion: 0.50
Nodes (4): public.chats, public.materials, auth, public

### Community 31 - "public.class_meetings"
Cohesion: 0.50
Nodes (3): public.class_meetings, auth, public

## Knowledge Gaps
- **231 isolated node(s):** `LoginState`, `Saved`, `HNode`, `MdNode`, `ClassTime` (+226 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 293 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Why does `react` connect `settings-forms.tsx` to `courses.tsx`, `widgets.tsx`, `calendar.tsx`, `package.json`, `ash-burst-button.tsx`, `carousel.tsx`, `chat-panel.tsx`, `app-shell.tsx`, `chat-input.tsx`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Why does `next` connect `calendar.tsx` to `courses.tsx`, `settings-forms.tsx`, `widgets.tsx`, `app/actions.ts`, `rows.ts`, `package.json`, `carousel.tsx`, `app-shell.tsx`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **What connects `LoginState`, `Saved`, `HNode` to the rest of the system?**
  _231 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `courses.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.061828952239911146 - nodes in this community are weakly interconnected._
- **Should `settings-forms.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07259615384615385 - nodes in this community are weakly interconnected._
- **Should `widgets.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08650937689050212 - nodes in this community are weakly interconnected._