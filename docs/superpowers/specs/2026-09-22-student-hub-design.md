# Student Hub — Design Spec (v1)

Working name: **Sonnet**. One place for a college student's classes: everything due, how caught up you are, and an AI that knows each course.

## Goal & success criteria

- v1 is personal: one user, deployed on Vercel, opened daily instead of Canvas.
- Success = every deadline for the semester is in the app, with no manual re-typing beyond what the syllabus/Canvas don't cover.
- Built so a later SaaS step is additive (auth + row-level security from day one), not a rewrite.

## Stack

| Layer | Choice |
| --- | --- |
| App | Next.js (App Router, TypeScript), Tailwind, shadcn/ui |
| Data / auth / files | Supabase (Postgres + RLS, email magic-link auth, Storage) |
| AI | Vercel AI SDK + Anthropic. `claude-haiku-4-5` for extraction/summaries, `claude-sonnet-5` for chat |
| Hosting | Vercel (+ Vercel Cron for daily sync) |

AI budget target: ≤ $10/month for one user.

## Screens

**Dashboard (Today)** — dark rounded "blocks" grid, per the reference screenshots:
- **Ask bar** — "Ask anything…" → course-aware assistant.
- **Progress block** — assignment progress (see below).
- **Up next** — unified to-do (Canvas + syllabus + manual), check-off animation, AI "start by" date per item.
- **Exam countdown** — ring gauge for the next exam.
- **Focus timer** — Pomodoro dial, logs minutes to a course.
- **Study heatmap** — GitHub-style, days with focus minutes. The only gamified element.
- **Grades** — current grade per course + "need X on final".

**Course page** — assignments, grade weights + what-if calculator, uploaded files, course-scoped chat. Assignment detail shows AI summary (requirements, rubric points, suggested plan). Exam detail shows AI study guide.

**Timeline page** — semester view, workload heat map by week.

**Settings** — Canvas connection (access token and/or calendar feed URL), syllabus upload, Google Calendar feed URL.

### Progress block (the "66%" bars)

- **Big number** = done ÷ assignments due up to today. 100% = fully caught up; lower = behind.
- **Bars** = one per semester week. Bar height = number of assignments that week. Each bar fills bottom-up by the share completed; past weeks bright, future weeks dim.
- Overdue-and-not-done count shown as a small label when > 0.

## Data model (Postgres, all tables `user_id` + RLS `user_id = auth.uid()`)

- `courses` — name, code, color, `canvas_course_id`, `grade_weights` jsonb (`[{category, weight}]`).
- `items` — `course_id`, `kind` (assignment | exam | quiz | reading), title, description, `due_at`, `points_possible`, `score`, `category`, `source` (canvas | ics | syllabus | manual), `external_id`, `done_at`, `start_by`, `ai_summary` jsonb. Unique `(user_id, source, external_id)` so re-syncs update instead of duplicating.
- `files` — `course_id`, storage path, `kind` (syllabus | slides | notes), extracted text.
- `focus_sessions` — `course_id`, `started_at`, minutes.
- `settings` — Canvas base URL, Canvas token (encrypted at rest), Canvas ICS URL, calendar-feed secret.

## Data flow

- **Canvas token sync**: REST `/api/v1/courses` + `/courses/:id/assignments?include[]=submission` → upsert courses/items; submitted assignments auto-marked done; scores imported.
- **Canvas ICS sync**: fetch feed → parse → upsert items (due dates only). Used alone or alongside the token; token data wins on conflicts.
- Sync runs daily via Vercel Cron and on a "Sync now" button.
- **Syllabus import**: upload PDF/image → Claude extracts `{course, grade_weights, items[], exam_topics}` as structured output → **review screen** → user confirms → saved. Nothing AI-extracted is saved without review.
- **Assistant**: gets the course's items + file text in context (prompt caching). No vector search in v1 — a semester of one course's materials fits in context. Add embeddings only if context cost or size becomes a problem.
- **Google Calendar**: app serves `/api/cal/<secret>.ics`; user subscribes in Google Calendar (one-way).

## Error handling

- Sync failures (bad token, Canvas down) show on the Settings page with last-success time; never delete items on a failed fetch.
- AI extraction failures fall back to manual entry with the uploaded file still attached.
- Canvas token is stored encrypted and never sent to the client.

## Testing

- Unit tests (Vitest) for the logic that can silently be wrong: progress %, grade / what-if math, Canvas + ICS → item mapping, dedupe.
- Manual check of each phase on the deployed app with real courses.

## Out of scope for v1

Auto time-blocking, two-way Google Calendar, study groups, lecture transcription, XP/badges, payments, multi-user onboarding, Canvas OAuth developer key.
