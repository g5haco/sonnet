# Sonnet

One place for a college student's classes: everything due, how caught up you are, and an AI that knows each course.

Personal project first, possible SaaS later. Direction and scope live in [PRODUCT.md](PRODUCT.md), [docs/ROADMAP.md](docs/ROADMAP.md) and the [v1 spec](docs/superpowers/specs/2026-09-22-student-hub-design.md).

## Stack

Next.js 16 (App Router) · Tailwind + shadcn/ui + Kibo UI · GSAP · Supabase (auth, Postgres) · Vercel

## Run it

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase URL and publishable key
npm run dev                  # http://localhost:3000
```

```bash
npm test        # vitest
npm run lint
npm run build
```

## Layout

- `src/app` — routes: dashboard (`/`), `/login`, `/auth/confirm`
- `src/components` — dashboard blocks; `ui/` (shadcn) and `kibo-ui/` are vendored registry code
- `src/lib` — progress math (tested), sample data, Supabase clients, GSAP setup
- `src/proxy.ts` — refreshes the session and redirects signed-out visitors
