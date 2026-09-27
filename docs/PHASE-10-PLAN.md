# Phase 10 plan: launch readiness

Proposed 2026-09-26. Nothing here is approved yet. Scope comes from `COMMERCIAL-ROADMAP.md` Phase 10.
Rule: steps marked **[ask]** need approval for a dependency, migration, auth/env change or a paid plan.

## Order

Code-only safety work comes first, then work that needs the user or money.

### 1. Rate limits — DONE (code), migration 0014 pending in Supabase
- `take_hit()` in `0014_rate_limits.sql` plus `allowed()` in `src/lib/limit.ts`; it fails open until the migration is applied.
- Per user, per hour: chat 60, smartSearch 60, syllabus read/summary 20, file uploads 60, Canvas sync 6.
- Skipped: `/api/cal` (token-gated, cheap, polled by calendar apps) and per-IP limits (every costly path needs sign-in).

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
