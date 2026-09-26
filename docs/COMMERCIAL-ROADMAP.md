# Commercialization roadmap

Phases 0–9 (see [ROADMAP.md](ROADMAP.md)) built the product. This roadmap takes Sonnet from "free app one student uses" to "a product students pay for". Same rules as before: each phase ships something working, committed and pushed, with a short update before the next.

**Ground rules**

- Pricing, plan limits and timing are **your decisions**; phases below mark them as decision points and give options, not answers.
- Honest marketing only: no fake users, testimonials or stats. Real ones come from Phase 14.
- Anything touching auth, Supabase, env vars, billing or migrations gets your approval first (as today).

## At a glance

| #   | Phase                       | Why it matters                                             | Needs from you                                   | Done when                                                                  |
| --- | --------------------------- | ---------------------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------- |
| 10  | **Launch readiness**        | You can't charge money on the current setup                | Legal pages review, paid Vercel + Supabase plans | Legal pages live, monitoring on, backups on, abuse limits on AI routes     |
| 11  | **AI cost & reliability**   | Sonnet AI is the product; free models are slow and flaky   | A budget per user per month                      | Paid model tier, per-user usage metering, cost per active user known       |
| 12  | **Pricing & billing**       | Revenue                                                    | Plans, prices, free-tier limits                  | Stripe checkout, customer portal, entitlements enforced, receipts by email |
| 13  | **Onboarding & activation** | Most signups never connect Canvas; fix the first 10 minutes | Watch 3–5 real students sign up                  | Activation metric defined, measured and improving                          |
| 14  | **Growth**                  | Nobody finds it yet                                         | Time for content, campus contacts                | A repeatable source of signups beyond word of mouth                        |
| 15  | **Retention features**      | Paid users stay because Sonnet saves them time weekly      | Feedback from paying users                       | Week-4 retention measured and rising                                       |
| 16  | **Scale & support**         | More users, more schools, more questions                   | Support hours                                    | Support inbox, status page, a second LMS                                   |

## Phase 10 — Launch readiness

The things a paying customer (and Stripe) will expect to exist.

- **Hosting that allows commercial use.** Vercel's Hobby plan is for non-commercial use only: move to Vercel Pro before charging. Supabase Pro for daily backups, no project pausing and higher limits.
- **Legal pages:** Privacy Policy and Terms of Service, linked from the footer, sign-up and checkout. Say plainly what's stored (courses, grades, uploaded files, chat), where (Supabase), which AI providers see what, and how to delete it. Have them reviewed; student data (FERPA-adjacent) makes this matter.
- **Account deletion and data export** in Settings (wipe exists for academic data; add "delete my account" and a JSON/CSV export).
- **Transactional email** with a real provider (e.g. Resend): branded sign-in, password reset and receipt emails from your own domain.
- **Google sign-in** finished (Supabase provider + OAuth consent screen), then re-enable the button on /login.
- **Monitoring:** error tracking (e.g. Sentry) on client and server, uptime checks on / and /api/chat, alerts to your email.
- **Abuse limits:** rate limits on /api/chat, uploads and sync per user and per IP; file size caps already exist, keep them.
- **Privacy-friendly analytics** (e.g. Plausible or PostHog with no ad cookies) for the landing funnel and in-app events.
- **Security pass:** RLS review of every table, secrets rotation, dependency audit (`supply-chain-risk-auditor`), CSP header.

## Phase 11 — AI cost & reliability

Sonnet AI is what people will pay for, so it must be fast and dependable, and you must know what it costs.

- **Model tiers:** keep a free/cheap model for quick answers; route "think harder", long syllabus questions and study guides to a stronger paid model. Fallback chain when a provider fails (already partly there).
- **Usage metering:** log tokens and cost per request per user (migration: `ai_usage`). This is the number pricing depends on.
- **Cost controls:** cache syllabus summaries and material text (already stored), trim context to the course in focus, cap output length, stream everything.
- **Quality checks:** a small set of saved test questions (syllabus policy, what's due, plan my week) run before each model change.
- **Decision point:** monthly AI budget per free user and per paid user.

## Phase 12 — Pricing & billing

- **Decision point: plans.** Common shapes for student tools, to choose from:
  - *Freemium:* everything free except Sonnet AI beyond a monthly quota (e.g. N questions or uploads); paid removes the cap and unlocks the stronger model.
  - *Free trial, then paid:* full access for 7–14 days, then one plan.
  - *Term pass:* one price per term (matches how students think), plus monthly.
  Student price points in this category usually sit between a coffee and a streaming subscription per month; annual or per-term pricing lowers churn over summer.
- **Stripe:** Checkout, Customer Portal (cancel, change card, invoices), webhooks → `subscriptions` table (migration), entitlements checked on the server for every AI call and upload.
- **Paywall UX:** honest limits shown before they're hit ("12 of 50 questions this month"), never mid-answer surprises. Update the landing Pricing section and FAQ only once plans are real.
- **Taxes and receipts:** Stripe Tax or a merchant of record (e.g. Paddle/Lemon Squeezy) if selling internationally.

## Phase 13 — Onboarding & activation

- **Define activation**, e.g. "connected Canvas and asked Sonnet one question within 24 hours". Track it from Phase 10 analytics.
- **Easier Canvas connect:** step-by-step token guide with screenshots per school; ICS-only path first, token later. Longer term, a Canvas OAuth developer key (needs a school admin; start the conversation early).
- **Demo mode:** try the app with sample data before connecting anything (the landing demos already prove this works).
- **Syllabus nudge:** after Canvas sync, prompt to add each course's syllabus so Sonnet AI is useful on day one.
- **Lifecycle emails:** welcome, "you haven't connected Canvas", weekly "what's due" digest (opt-in).
- **Mobile:** installable PWA with push notifications for deadlines (opt-in, never nagging).

## Phase 14 — Growth

- **Landing:** keep it honest and fast; add real testimonials and screenshots from real users with permission; A/B the headline only once there's traffic.
- **SEO:** guides that match what students search ("how to get a Canvas access token", "Canvas calendar feed to Google Calendar", per-school pages).
- **Referrals:** give a free month for each friend who activates.
- **Campus:** student ambassadors, club partnerships, TA/professor word of mouth; start at your own school.
- **Content:** short videos showing Sonnet AI answering from a real syllabus; Product Hunt launch once billing and onboarding are solid.

## Phase 15 — Retention features

From the "make Sonnet its own" ideas, the ones that make weekly value obvious:

1. **Sunday reset:** a two-minute weekly review and plan with Sonnet AI.
2. **"Start by" planning:** effort estimates become work blocks in free gaps between classes.
3. **Crunch forecast:** warn weeks ahead ("week 9: 2 exams and an essay; start the essay in week 7").
4. **After-class check-in:** two lines per class that feed flashcards and study guides.
5. **Grade goals** (migration) and saving the syllabus chip.
6. Audio/lecture uploads with transcription (paid tier candidate).

## Phase 16 — Scale & support

- Support inbox and an in-app feedback button; a public status page.
- Admin dashboard: signups, activation, AI cost, errors, churn.
- More LMSs: Blackboard, Brightspace (D2L), Moodle, starting with whichever real users ask for.
- Two-way Google Calendar sync.
- Later, if demand shows up: school or club plans.

## Metrics to watch (from Phase 10 on)

Visitors → signups → activated → weekly active → paid → retained after 4 weeks, plus AI cost per active user and gross margin per paid user.
