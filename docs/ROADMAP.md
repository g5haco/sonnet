# Roadmap

Each phase ends with: working feature deployed, committed + pushed, short update to you before starting the next.
Specs: [v1](superpowers/specs/2026-09-22-student-hub-design.md) · [v1.5 shell, AI, calendar, materials](superpowers/specs/2026-09-23-shell-ai-calendar-materials-design.md)

| #   | Phase                           | You get                                                                                                                                                                                             | Needs from you                                                                            | Status (2026-09-23)                                                                                                                   |
| --- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 0   | **Foundation**                  | App, design system, email + password login, live on Vercel                                                                                                                                          | Supabase + Vercel accounts                                                                | ✅ Done: live at ericwei.me                                                                                                           |
| 1   | **Items & progress**            | Real courses and assignments, check-offs that save, progress bars, delete with undo                                                                                                                 | —                                                                                         | ✅ Done                                                                                                                               |
| 2   | **App shell**                   | Animated sidebar (Home, Calendar, Courses; Chat button by +), gooey Create menu, floating Settings and Sync windows, AI chat panel UI with shortcut chips and voice dictation, metal send button | —                                                                                         | ✅ Done                                                                                                                               |
| 3   | **AI assistant**                | Answers from Claude that know your courses, assignments, exams and class times; thinking-orb states; later it can add and edit items for you                                                        | OpenRouter API key                                                                        | ✅ Done: answers in ~0.5s; adds/changes items after you confirm                                                                       |
| 4   | **Calendar**                    | Day / week / month views with class times, due dates and exams; semester timeline with a heavy-week heat map; gooey view switch; Google Calendar feed                                               | Your class schedule                                                                       | ✅ Done: views, heat map in the calendar's left column, gooey switch + Add, Google Calendar feed                                      |
| 5   | **Canvas sync**                 | Courses, assignments (with descriptions, so the AI can summarize them) and grades pulled from Canvas; Sync now; daily auto-sync                                                                     | —                                                                                         | ✅ Complete: encrypted token + ICS sync, status UI, daily cron, AI descriptions, and live sync verified                            |
| 6   | **Materials + syllabus import** | Upload hub (PDF, Word, PowerPoint, photos, notes, links); AI extracts deadlines, exams, class times and grade weights for review; exam study guides from your materials                             | A real syllabus                                                                           | ✅ Done: uploads, text from PDFs, photos and scanned PDFs (vision model), the AI reads a course's materials, syllabus summary + import with review, exam study guides and course-aware chat shortcuts |
| 7   | **Grades**                      | Current grade per course, what-if / "need X on final"                                                                                                                                               | —                                                                                         | ✅ Done: Canvas's current grade per course (Home, course page, assistant), graded work shows its score, "need X on the final" calculator                                                                                                   |
| 8   | **Focus & heatmap**             | Pomodoro timer that fills the study heatmap and streak                                                                                                                                              | —                                                                                         | ✅ Done: global focus timer in the sidebar (animated ring panel), minutes per course, 18-week heatmap + streak on Home                                                                                                  |
| 9   | **Polish**                      | Phone layout pass, a week of real daily use + fixes                                                                                                                                                 | Feedback                                                                                  | Ongoing                                                                                                                               |

**Now: Phase 9 — polish and a real-use pass.**

Done in Phase 9 (2026-09-24):
- **Home**: a 12×6 grid of square cells that fits the screen; drag widgets anywhere, resize from a corner, a widget library with live previews, 25 widgets that fill their size (charts stretch, lists spread, fixed designs scale). Saved per user (migration 0008). Grade trend needs migration 0009.
- **Course page**: What-if in a popover; Course settings window (name, code, color, class times, delete); work and materials full width.
- **Sign in / sign up**: two-panel page, sign-up mode, Continue with Google (Google provider must be enabled in Supabase).
- **Onboarding**: a floating 4-step window (name, term as quarter or semester, Canvas, done), then a one-time 5-slide feature tour.
- **Canvas**: opening the app syncs when the last sync is over an hour old (the Vercel Hobby cron stays daily).
- Tried and removed at your request: customizable sidebar buttons.

Still to do in Phase 9:
- ~~Real-use pass signed in~~: done 2026-09-25, user confirmed everything works on the live site.
- ~~Production polish~~ done 2026-09-24: login title/canonical/OG + Twitter card, generated social image, custom 404, robots.txt + sitemap (only /login public; app pages noindex), proxy lets crawlers reach them. Source maps stay off (Next default). Bundle: matter-js (Reset animation) and react-markdown now lazy-load, shared app JS 336 → 219 KB gzipped.
- Say "term" instead of "semester" in Settings and Home's nudge.
- Dashboard polish beyond Home (calendar, courses list).

### Added before Phase 5 (from your feedback)

- **Courses** page (tilt cards) and a page per course: work, class times, materials, name and color. The Materials tab was folded into it.
- **Home**: courses carousel (right column), bigger greeting with your name, a nudge when the semester length looks wrong.
- **Chat** page: history, course focus (gooey picker), flashcards, border beam.
- **Assistant as an all-in-one**: it can add, change or delete work, class times (days, times, room), courses and the semester, always through a confirm card; answers render like a real chat app (Markdown, code blocks, live item/course chips, work-list and study-plan cards).
- **Bigger AI cards** showing the week an item lands in, clashes with classes, and asking for an exam's start time.
- **Settings** and the **uploader** are floating windows over the current page; a chat button sits beside the sidebar's +.

### Polish pass before syllabus import (2026-09-23)

- Chat button beside + opens Chat (Chat tab removed); **Sync** window for Canvas + Google Calendar; Settings regrouped (Account & appearance, Semester, Data & privacy) with a visual theme picker and **Reset all data**.
- Home: honest status line (never "caught up" with open work), no week-label overlap, Grades moved left to balance columns, long titles stay inside rows.
- Calendar: steady "+ exam" hover pill and dialog close; gooey menus settle into separate pills.
- Chat: task questions (due this week, overdue, what first) get ordered task cards, never flashcards.

### Ideas to make Sonnet its own (not scheduled yet)

Sonnet knows the whole semester's time (class times, every deadline, how caught up you are), which document-first tools don't:

1. **After-class check-in**: when a class ends, a two-line "what was it about?" builds a journal the assistant uses for flashcards and study guides.
2. **"Start by" planning**: effort estimates turn into work blocks in the free gaps between classes (ghost blocks on the calendar).
3. **Crunch forecast**: the heat map warns weeks ahead ("week 9: 2 exams and an essay; start the essay in week 7").
4. **Sunday reset**: a two-minute weekly review.

## Where the original roadmap went

Nothing was dropped; phases were reordered (your choice: shell → AI → calendar → Canvas) and the App shell phase was added from feedback. Old → new: 0→0, 1→1, 5 AI→3, 4 timeline & calendar→4, 2 Canvas→5, 3 syllabus→6, 6 grades→7, 7 focus→8, 8 polish→9.

## Later (SaaS step and extras)

Audio / video / YouTube uploads with transcription, lecture recording, landing page (taste-skill), Stripe, real email provider (Resend) + custom sign-in email, Canvas OAuth developer key, two-way Google Calendar, auto time-blocking.
