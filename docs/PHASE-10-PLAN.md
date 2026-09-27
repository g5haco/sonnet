# Phase 10 plan: launch readiness

Proposed 2026-09-26. Nothing here is approved yet. Scope comes from `COMMERCIAL-ROADMAP.md` Phase 10.
Rule: steps marked **[ask]** need approval for a dependency, migration, auth/env change or a paid plan.

## Order

Code-only safety work comes first, then work that needs the user or money.

### 1. Rate limits **[ask: migration 0014]**
- No new dependency: add a Postgres table `rate_hits(key text, at timestamptz)` and a `security definer` function `take_hit(key, window_s, max) returns boolean` that counts rows in the window, inserts one and returns true or false. Old rows are pruned by the existing Canvas cron.
- One helper, `limit(key, max, windowS)`, in `src/lib/limit.ts`, called on the server in:

  | Endpoint | Key | Budget (starting guess) |
  |---|---|---|
  | `/api/chat` | user | 30/10 min, 200/day |
  | `smartSearch` (actions.ts) | user | 20/min, 300/day |
  | `readSyllabus`, `summarizeSyllabus`, `importSyllabus` | user | 20/hour |
  | `addMaterial` (uploads) | user | 60/hour (keep existing size caps) |
  | `syncCanvasNow` | user | 6/hour |
  | `/api/cal` (public ICS) | IP | 60/hour |
- On a limit hit, return a plain message ("You've hit the hourly limit, try again at 3:40"), never an error mid-stream. The chat checks before streaming starts.
- Login already gets 429s from Supabase Auth, so nothing is needed there.
- Test: `limit.test.ts` for the window math, plus one manual 429 run in dev.

### 2. Security pass
- Review RLS on every table: a script lists every table with RLS off or with no policy. Hand-check the policies that cover `user_id`.
- CSP header in `next.config`, report-only for a week and then enforced. It must allow Supabase, OpenRouter (server only), Canvas images and Vercel.
- Dependency audit with the `supply-chain-risk-auditor` skill; `npm audit`.
- Secrets rotation (Supabase service key, OpenRouter key, cron secret) is done by the user in the dashboards; I give a checklist.

### 3. Account deletion and export **[ask: touches auth]**
- Settings, under Data: "Export my data" downloads JSON of courses, items, meetings, materials metadata, chats and focus logs.
- "Delete my account": typed confirmation → remove storage files → `auth.admin.deleteUser` (service role, server only). Rows go with it through cascade; verify every FK has `on delete cascade`, and add a migration if one doesn't.

### 4. Legal pages
- `/privacy` and `/terms`, public (add to the `src/proxy.ts` allowlist) and linked from the landing footer and sign-up.
- I draft them from what the code actually stores and sends (Supabase, OpenRouter plus the model providers, Canvas token encryption, Vercel). **The user gets them reviewed**; student data makes this matter.

### 5. Monitoring **[ask: dependency or service]**
- Errors: Sentry (`@sentry/nextjs`) on client and server. The zero-dependency fallback is `instrumentation.ts` `onRequestError` plus Vercel logs, which is weaker.
- Uptime: a free external checker (e.g. UptimeRobot) on `/landing` and on a new `/api/health` that pings Supabase, with alerts to email. The user sets up the account.

### 6. Analytics **[ask: service]**
- Plausible or PostHog, cookieless. Events: landing view → sign-up → Canvas connected → first Sonnet question (the activation event for Phase 13).

### 7. Transactional email **[ask: service + DNS]**
- Resend with an `ericwei.me` domain as Supabase Auth's custom SMTP; branded sign-in and reset templates. Receipts wait for Phase 12.

### 8. Google sign-in **[ask: auth]**
- The user creates the OAuth client and consent screen; I enable the provider and bring back the button in `login/form.tsx`.

### 9. Hosting upgrade **[user, $]**
- Vercel Pro and Supabase Pro before charging anyone (Hobby is non-commercial). Not needed until Phase 12 billing goes live.

## Needs from the user
1. Approve migration 0014 (rate limits), and later any cascade fix.
2. Choose Sentry or no-dependency error logging; choose Plausible or PostHog.
3. Get the legal review, create the Resend/Google/uptime accounts, rotate secrets.
4. Pricing is still open; it doesn't block Phase 10.

## Done when
- Every AI, upload and sync path is rate-limited and tested.
- The RLS/CSP/audit report is clean.
- Export and delete work end to end on a test account.
- Legal pages are live and linked.
- Errors and uptime alert to email; funnel events are recorded.
