# Roadmap

Each phase ends with: working feature deployed, committed + pushed, short update to you before starting the next.
Specs: [v1](superpowers/specs/2026-09-22-student-hub-design.md) · [v1.5 shell, AI, calendar, materials](superpowers/specs/2026-09-23-shell-ai-calendar-materials-design.md)

| # | Phase | You get | Needs from you | Status (2026-09-23) |
| --- | --- | --- | --- | --- |
| 0 | **Foundation** | App, design system, email + password login, live on Vercel | Supabase + Vercel accounts | ✅ Done: live at ericwei.me |
| 1 | **Items & progress** | Real courses and assignments, check-offs that save, progress bars, delete with undo | — | ✅ Done |
| 2 | **App shell** | Animated sidebar (Home, Calendar, Materials, Settings), gooey Create menu, Settings page (semester, courses, sign out), AI chat panel UI with shortcut chips and voice dictation, metal send button | — | ⏳ Next |
| 3 | **AI assistant** | Answers from Claude that know your courses, assignments, exams and class times; thinking-orb states; later it can add and edit items for you | Anthropic API key | ⏳ |
| 4 | **Calendar** | Day / week / month views with class times, due dates and exams; gooey view switch; Google Calendar feed | Your class schedule | ⏳ |
| 5 | **Canvas sync** | Courses, assignments and grades pulled from Canvas; Sync now; daily auto-sync | Canvas token and/or calendar feed URL | ⏳ |
| 6 | **Materials + syllabus import** | Upload hub (PDF, Word, PowerPoint, photos, notes, links); AI extracts deadlines, exams, class times and grade weights for review | A real syllabus | ⏳ |
| 7 | **Grades** | Current grade per course, what-if / "need X on final" | — | 🟡 Block exists, empty until Canvas |
| 8 | **Focus & heatmap** | Pomodoro timer that fills the study heatmap and streak | — | 🟡 Heatmap exists, empty until timer |
| 9 | **Polish** | Phone layout pass, a week of real daily use + fixes | Feedback | Ongoing |

## Later (SaaS step and extras)

Audio / video / YouTube uploads with transcription, lecture recording, multi-user sign-up, landing page (taste-skill), Stripe, real email provider (Resend) + custom sign-in email, Canvas OAuth developer key, two-way Google Calendar, auto time-blocking.
