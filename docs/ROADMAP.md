# Roadmap

Each phase ends with: working feature deployed, committed + pushed, short update to you before starting the next.

| # | Phase | You get | Needs from you | Status (2026-09-23) |
| --- | --- | --- | --- | --- |
| 0 | **Foundation** | Next.js app, dark "blocks" design system, email + password login, deployed on Vercel | Supabase + Vercel accounts | ✅ Done: live at ericwei.me |
| 1 | **Items & progress** | Courses, manual add, Up next list with check-off, **progress block** | — | 🔄 Code done; waiting on migration 0001 + end-to-end test |
| 2 | **Canvas sync** | Access token + calendar feed sync, Sync now button, daily cron | Canvas token and/or feed URL | Not started |
| 3 | **Syllabus import** | Upload syllabus → AI extracts → review → saved | Anthropic API key, a real syllabus | Not started |
| 4 | **Timeline & calendar** | Semester timeline, workload heat map, exam countdown, Google Calendar feed | — | Exam countdown built (real data) |
| 5 | **AI assistant** | Ask bar, course chat, assignment summaries, exam study guides, "start by" dates, file uploads | Slides/notes to test with | Ask bar shell only |
| 6 | **Grades** | Current grade per course, what-if / "need X on final" | — | Grades block shell (empty until Canvas) |
| 7 | **Focus & heatmap** | Pomodoro dial, study heatmap | — | Heatmap shell (empty until timer) |
| 8 | **Polish** | Mobile layout, empty states, speed, a week of real daily use + fixes | Feedback | Ongoing |

## Later (SaaS step)

Multi-user onboarding, landing page, Stripe, Canvas OAuth developer key, two-way Google Calendar, auto time-blocking.
