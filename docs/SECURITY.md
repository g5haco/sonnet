# Security

Phase 10 step 2, reviewed 2026-09-27.

## Database (RLS)

Every table has RLS on.
- **User-owned tables:** `settings`, `courses`, `items`, `class_meetings`, `chats`, `materials`, `focus_sessions`, `grade_history` and `decks` have own-rows policies for `authenticated`. Rows that point at a course also check that the course is yours.
- **Read-only tables:** `ai_usage` and `plans` can be read, not written, by the user. Only the service role writes them.
- **No-policy tables:** `rate_hits` and `canvas_connections` have no policies; only server functions or the service role touch them.

Every `security definer` function has `search_path = ''`, and its default PUBLIC execute right is revoked, then granted to the roles that need it:
- `calendar_feed(token)` and `shared_deck(code)`: `anon` and `authenticated`. Each needs the exact secret.
- `usage_status`, `ai_spend` and `take_hit`: `authenticated`.
- `ai_settle`: `service_role` only.
- `enforce_free_limits`: trigger only, nobody can call it directly.

No fixes needed.

## App

- **Server actions** have no session check of their own. They use the per-user Supabase client, so a signed-out call hits RLS and gets nothing. The costly ones also go through `take_hit`.
- **`/api/tasks`** is an allowlist of four of those actions.
- **`/api/cron/canvas`** compares `CRON_SECRET` in constant time.
- **`/api/cal/[token]`** checks that the token is a UUID before calling `calendar_feed`.
- **User and AI HTML:**
  - Chat markdown goes through react-markdown's `defaultUrlTransform`, so `javascript:` links are dropped.
  - Canvas descriptions are rebuilt as React elements (`canvas-html.tsx`), with no raw HTML.
  - Web-search sources and material links keep `http(s)` URLs only.
- **Headers** (`next.config.ts`): nosniff, `X-Frame-Options: DENY`, a referrer policy, a permissions policy, and a CSP.
  - The CSP is **report-only**. Violations show in the browser console; none were seen on landing, login, Home, calendar, settings or `/f`.
  - Once real use shows none either, rename the header to `Content-Security-Policy` to enforce it.
- **Dependencies:** `npm audit --omit=dev` reports 0 vulnerabilities.

## Secret rotation checklist

Rotate a secret right away if it leaks, and otherwise once before launch. Set each new value in Vercel (Production and Preview) and `.env.local`, then redeploy.

| Secret | Where to make a new one | Effect of rotating |
| --- | --- | --- |
| `SUPABASE_SECRET_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API keys: create a new secret key, deploy, then delete the old one | None if the new key is deployed before the old one is deleted |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Same page (publishable key) | Public by design. Rotate only if it's abused |
| `AI_API_KEY` | OpenRouter → Keys: new key, then revoke the old one. Set a credit limit on the key | None |
| `CRON_SECRET` | Any random 32+ bytes (`openssl rand -hex 32`) | None. Vercel Cron sends the new value after the redeploy |
| `CANVAS_ENCRYPTION_KEY` | 32 random bytes, base64 (`openssl rand -base64 32`) | **Every stored Canvas token becomes unreadable.** Students must reconnect Canvas in Sync. Rotate only if it leaked |
| Google Calendar feed links | Per user: Sync → New link | That user's old feed URL stops working |

Also: keep `.env.local` out of git (it's in `.gitignore`). Review the Supabase auth settings (email confirmations, rate limits, allowed redirect URLs = the production domain only).
