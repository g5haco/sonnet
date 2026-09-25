# Product

<!-- impeccable:product-schema 1 -->

## Platform

web (responsive: laptop and phone browsers; live at https://www.ericwei.me)

## Register

product

## Users

College students taking 4–6 courses, each with its own syllabus, Canvas page and deadlines. They open Sonnet many times a day on a laptop and phone: late at night checking what's due tomorrow, and between classes in bright rooms. The job: know what's due, how caught up they are, and what to do next, without opening Canvas.

## Product Purpose

One place for a student's classes. Canvas sync, syllabus import and a materials hub feed a single list of everything due and a calendar of classes, deadlines and exams; a progress readout shows how caught up you are; a global AI assistant that knows every course, assignment and exam answers questions, plans the week and builds study guides. Success is opening Sonnet daily instead of Canvas, with every deadline for the term already in it.

## Positioning

Sonnet knows the student's whole term: class times, every deadline, grades and how caught up they are. Document-first tools and Canvas itself don't combine these, so Sonnet can answer "what do I do next" and plan the week, not just list files.

## Capabilities and Constraints

- Shipped: Canvas sync (token or ICS), Google Calendar feed, syllabus import (summary + key dates), materials, grades with what-if, focus timer, a customizable Home widget grid, and an AI assistant that can change data only through a confirm card.
- Multi-user today (each user's data is private). Say "term", not "semester", in the UI (onboarding still offers semester or quarter).
- AI runs on free models by default, so it can be slow or fail; the UI must say so plainly.
- **Planned, undecided:** Sonnet is going SaaS: paid plans and a public landing page are intended, but pricing, plan limits and timing are not decided. Don't invent them.

## Brand Personality

Precise, tactile, cheeky.

- **Precise** like Linear or Raycast: fast, quiet, trustworthy, nothing out of place.
- **Tactile** like a Teenage Engineering device: controls feel physical, readouts are big and confident, every press has a response.
- **Cheeky** like a grown-up Duolingo: encouraging copy with a wink, small celebrations when you finish things. Never childish, never nagging.

## Anti-references

- Canvas itself: cluttered, grey, institutional.
- Generic SaaS admin templates: identical card grids, hero-metric tiles, purple gradients.
- Childish gamification: mascots, confetti, points shops, guilt-trip streak notifications.
- The first Sonnet draft: six identical grey boxes with no color and nothing that responds.

## Evidence on Hand

- The live app and real use by its builder. No testimonials, user counts, press or benchmarks exist yet; don't fabricate them.

## Design Principles

1. **Readouts, not reports.** The important numbers (how caught up, days to exam, grade) are big, glanceable and honest, like instrument dials.
2. **Color means something.** Neutral UI; the accent marks "you, now"; each course owns a color. No decorative color.
3. **Everything answers back.** Every control responds to touch with physical motion. Delight lives in moments (checking off, clearing a week), not everywhere.
4. **Calm by default, loud on purpose.** Nothing blinks or begs. Urgency is shown once, clearly, when it's real.
5. **Never lose trust.** AI-extracted data is always reviewed before it's saved; sync failures are stated plainly.

## Accessibility & Inclusion

- WCAG 2.2 AA: 4.5:1 body text, 3:1 large text and UI glyphs, in both light and dark themes.
- Every animation has a `prefers-reduced-motion` alternative.
- Course colors are never the only signal: always paired with the course code or name.
- Full keyboard use; visible focus rings; 44px touch targets on phone.
