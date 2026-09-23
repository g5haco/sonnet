# Sonnet v1.5: App shell, global AI panel, Calendar, Materials

Extends the [v1 spec](2026-09-22-student-hub-design.md). Driven by review feedback on 2026-09-23: the top-right Create button felt out of place; the user wants a dedicated upload page, a calendar with class times, and a global AI chat on the right that knows everything.

## Layout

Three columns on desktop: **sidebar rail (60px) | page | AI panel (~380px)**.

- **Sidebar** (pattern from the provided `sidebar.txt`, Aceternity-style): logo, gooey Create "+", Home, Calendar, Materials, Settings; account at the bottom. Collapsed to icons; expands on hover **or keyboard focus** as an overlay (content never reflows). Built on `motion` (already installed; the renamed framer-motion), not a new dependency. Phones: top bar with menu button → full-screen menu.
- **AI panel**: global, lives in the app layout so it persists across page navigation. Docked open at ≥1280px; below that a metal "Ask" circle button slides it in; phones get a full-screen sheet.
- The dashboard's inline Ask bar and top-right Create button are removed.

Routes: `/` Home (dashboard), `/calendar`, `/materials`, `/settings`, plus existing `/login`, `/auth/confirm`.

## Component placement rules (Libraries.dev, MIT, zero-dependency packages)

| Package | Where | Rule |
| --- | --- | --- |
| `liquid-gooey` (morph) | Sidebar Create "+" splits into droplets: Assignment, Exam, Course, Upload | The effect's canonical plus-menu; replaces the header button |
| `liquid-gooey` (move) | Calendar Day / Week / Month switch indicator | Its documented tab-indicator use |
| `metal-fx` v2, `silver` preset | Chat send (circle), "Ask" open-panel button (circle), `MetalBadge` "AI" on AI-generated or AI-extracted content | Metal marks the AI. ~3 placements, never decorative elsewhere. WebGL2 with plain fallback built in. |
| `thinking-orbs` | Chat panel status (20px inline, 64px empty state) | State = what the AI is doing: searching (reading your data), composing (writing), solving (problem), listening (dictation), working (processing an upload), connecting (Canvas sync), breathing (idle) |
| `voice-glow` (`ice` palette) | Wraps the chat input while dictating; `processing` while the AI answers a dictated question | Cyan family keeps the brand accent meaningful |

Chat input follows the provided `chatbox design.txt` (HextaUI ai-chat-input): cycling example-question placeholder, expands on focus to reveal shortcut chips; mic and metal send buttons.

Not used: `bot-avatars` (a mascot; PRODUCT.md anti-reference), `img-fx` (image generation; needs three.js; no fit), `border-beam` (duplicates voice-glow processing and the orbs).

All motion respects `prefers-reduced-motion` (the packages ship their own handling; ours is in `lib/gsap.ts` + global CSS).

## AI assistant

- `POST /api/chat` route handler, streaming, Anthropic SDK (consult the claude-api skill when building). Model: Sonnet 5 for chat.
- Context per request: today's date, semester, courses, class times, open and recently done items, exams. Prompt-cached. Budget target unchanged (≤ $10/month single user).
- Shortcuts: "What's due this week?", "Plan my week", "Help me study for my next exam", "Catch me up" (overdue triage), "Explain an assignment". Later: context-aware chips (e.g. an exam within 7 days).
- Later in the phase: tool use so the assistant can add and edit items ("put my essay due Friday"), always shown for confirmation before saving.
- Voice dictation: browser Web Speech API (free; Chrome, Edge, Safari). Hidden where unsupported (Firefox). Note: Chrome sends dictated audio to Google for recognition; stated in Settings.

## Calendar

- Day / Week / Month views. Week and day are a custom time grid; month may use Kibo `calendar`; the left rail may use Kibo `mini-calendar`.
- Shows class meetings (new), due dates and exams (existing items), in course colors.
- New table `class_meetings`: `course_id`, `weekdays int[]` (0 = Sunday), `starts time`, `ends time`, `location text`. Entered in Settings → course, later auto-filled by syllabus import.
- Google Calendar: one-way subscribe feed `/api/cal/<secret>.ics` (from v1 spec).

## Materials

- `/materials`: upload hub (drop zone + tiles per source type) and a list of uploaded materials per course with processing status.
- First version: PDF, Word, PowerPoint, images (e.g. a photo of a syllabus), pasted text, links. Later: audio, video, YouTube (need a transcription provider and its cost). Quizlet: skipped (no public API).
- Supabase Storage bucket `materials` + table `materials` (`course_id`, `kind`, `name`, `storage_path`, `status` processing/ready/failed, extracted `text`), all RLS-scoped.
- Syllabus import (from v1 spec) runs here: extraction → review screen with the metal "AI" badge → save items, exams, class times, grade weights. Extracted material text also feeds the assistant's context.

## Settings

Semester start and length (the existing `settings` row), courses (rename, color, class times, delete), Canvas connection (Phase 5), theme, sign out, voice-privacy note.

## Out of scope for now

Chat history persistence across devices (decision pending), audio/video/YouTube uploads, lecture recording, two-way Google Calendar, auto time-blocking, multi-user sign-up.
