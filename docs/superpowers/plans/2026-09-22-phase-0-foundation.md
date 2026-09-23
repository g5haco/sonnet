# Phase 0 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A deployed Next.js app with the dark "blocks" look, magic-link login, and an empty dashboard grid only the owner can see.

**Architecture:** Next.js App Router + Tailwind + shadcn/ui. Supabase handles auth via `@supabase/ssr` cookie sessions; a middleware refreshes the session and redirects signed-out users to `/login`. Deployed to Vercel from GitHub `main`.

**Tech Stack:** Next.js (latest, TypeScript, App Router, `src/` dir), Tailwind CSS, shadcn/ui, `@supabase/supabase-js`, `@supabase/ssr`, Vercel.

**Spec:** `docs/superpowers/specs/2026-09-22-student-hub-design.md`

## Global Constraints

- Single user in v1: Supabase sign-ups disabled after the owner's account exists.
- Dark theme only in v1. Colors come from CSS tokens in `globals.css`, never hard-coded in components.
- Secrets live only in `.env.local` / Vercel env vars; `.env.local` is git-ignored.
- Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- No unit tests this phase — there is no logic yet. Vitest arrives in Phase 1 with the progress math. Verification here = `npm run build` + `npm run lint` + manual check.

---

### Task 1: Scaffold Next.js + shadcn

**Files:**
- Create: whole Next.js project at repo root (`package.json`, `src/app/*`, `tsconfig.json`, …), `components.json`, `src/lib/utils.ts`

**Interfaces:**
- Produces: `cn(...classes)` from `@/lib/utils`; `@/` path alias → `src/`.

- [ ] **Step 1: Scaffold into a temp folder** (create-next-app refuses a non-empty dir; repo has `docs/`)

```bash
npx create-next-app@latest ../sonnet-tmp --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes
```

- [ ] **Step 2: Move it into the repo** (keep our `.git` and `docs/`)

```bash
rm -rf ../sonnet-tmp/.git && cp -r ../sonnet-tmp/. . && rm -rf ../sonnet-tmp
```

- [ ] **Step 3: Init shadcn/ui** with defaults (neutral base color)

```bash
npx shadcn@latest init -d
```

- [ ] **Step 4: Verify**

Run: `npm run build && npm run lint` — Expected: both succeed.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "chore: scaffold Next.js + Tailwind + shadcn"
```

---

### Task 2: Design tokens + Block component + dashboard shell

> **As built:** shadcn already owns `muted`/`accent` as *background* colors, so custom names were dropped. Use shadcn's: `bg-background` (page), `bg-card` (block), `bg-secondary` (raised), `text-foreground`, `text-muted-foreground`, plus one new `brand` green (`--brand: #34c77b`). Blocks use `rounded-xl` (`--radius: 1rem`).

**Files:**
- Modify: `src/app/globals.css` (replace generated color variables with tokens below)
- Modify: `src/app/layout.tsx` (Geist font, `className="dark"` on `<html>`, title "Sonnet")
- Create: `src/components/block.tsx`
- Modify: `src/app/page.tsx` (dashboard grid of placeholder blocks)

**Interfaces:**
- Produces: `<Block title? className? children>` — the rounded dark card every dashboard feature renders inside.
- Produces: Tailwind color names `bg`, `block`, `raised`, `fg`, `muted`, `accent` (via `@theme`).

- [ ] **Step 1: Tokens** — in `globals.css`, keep the Tailwind + shadcn imports and set these (shadcn's `--background`, `--foreground`, `--card`, `--muted-foreground`, `--primary` map onto them so shadcn components match):

```css
:root {
  --bg: #1b1c1e;       /* page */
  --block: #232426;    /* block surface */
  --raised: #2c2d30;   /* pills, inputs inside a block */
  --fg: #ededed;
  --muted: #8a8b8f;
  --accent: #34c77b;   /* the green from the 62% gauge */
  --radius: 1.25rem;

  --background: var(--bg);
  --foreground: var(--fg);
  --card: var(--block);
  --card-foreground: var(--fg);
  --muted-foreground: var(--muted);
  --primary: var(--fg);
  --primary-foreground: var(--bg);
  --border: #ffffff12;
  --input: var(--raised);
  --ring: var(--accent);
}

@theme inline {
  --color-bg: var(--bg);
  --color-block: var(--block);
  --color-raised: var(--raised);
  --color-fg: var(--fg);
  --color-muted: var(--muted);
  --color-accent: var(--accent);
}

body { background: var(--bg); color: var(--fg); }
```

Delete any generated `.dark { … }` / `prefers-color-scheme` blocks — dark is the only theme.

- [ ] **Step 2: Block component**

```tsx
// src/components/block.tsx
import { cn } from "@/lib/utils";

export function Block({
  title,
  className,
  children,
}: {
  title?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className={cn("rounded-[var(--radius)] bg-block p-5", className)}>
      {title && <h2 className="mb-3 text-sm text-muted">{title}</h2>}
      {children}
    </section>
  );
}
```

- [ ] **Step 3: Dashboard shell** — `src/app/page.tsx`:

```tsx
import { Block } from "@/components/block";

export default function Dashboard() {
  return (
    <main className="mx-auto max-w-6xl p-4 md:p-6">
      <div className="mb-4 rounded-full bg-raised px-5 py-3 text-muted">Ask anything…</div>
      <div className="grid gap-3 md:grid-cols-3">
        <Block title="Progress" className="md:col-span-2 min-h-48" />
        <Block title="Next exam" className="min-h-48" />
        <Block title="Up next" className="md:col-span-2 min-h-64" />
        <Block title="Focus" className="min-h-64" />
        <Block title="Study days" className="md:col-span-2 min-h-40" />
        <Block title="Grades" className="min-h-40" />
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Verify** — `npm run build`, then `npm run dev` and open `http://localhost:3000`: dark page, pill ask bar, 6 rounded blocks; collapses to one column at 375px width with no horizontal scroll.

- [ ] **Step 5: Commit** — `git commit -am "feat: dark blocks design tokens + dashboard shell"` (add new files first).

---

### Task 3: Supabase magic-link auth + route protection

**Needs from user (pause here):** create a free Supabase project, then paste `Project URL` and `anon`/publishable key. In Supabase → Authentication → URL Configuration set Site URL `http://localhost:3000`.

**Files:**
- Create: `.env.local` (git-ignored — confirm `.gitignore` has `.env*`)
- Create: `src/lib/supabase/server.ts`, `src/lib/supabase/client.ts`
- Create: `src/middleware.ts` (if the installed Next.js major uses `src/proxy.ts` instead, use that filename and export name `proxy` — check `node_modules/next/package.json` version and the Next docs)
- Create: `src/app/login/page.tsx`, `src/app/login/actions.ts`, `src/app/auth/confirm/route.ts`

**Interfaces:**
- Produces: `createClient()` from `@/lib/supabase/server` (async, for server components/actions/routes) and from `@/lib/supabase/client` (browser). Every later phase queries data through these.

- [ ] **Step 1: Install + env**

```bash
npm i @supabase/supabase-js @supabase/ssr
```

```
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

- [ ] **Step 2: Clients**

```ts
// src/lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => {
          try {
            list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // called from a Server Component; middleware refreshes the session instead
          }
        },
      },
    },
  );
}
```

```ts
// src/lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
```

- [ ] **Step 3: Middleware** — refresh session, redirect signed-out users:

```ts
// src/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  if (!user && !path.startsWith("/login") && !path.startsWith("/auth")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
```

- [ ] **Step 4: Login page + action**

```ts
// src/app/login/actions.ts
"use server";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function sendLink(_: unknown, form: FormData) {
  const email = String(form.get("email") ?? "").trim();
  if (!email) return { message: "Enter your email." };
  const origin = (await headers()).get("origin");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/confirm` },
  });
  return { message: error ? error.message : "Check your email for a sign-in link." };
}
```

```tsx
// src/app/login/page.tsx
"use client";
import { useActionState } from "react";
import { sendLink } from "./actions";
import { Block } from "@/components/block";

export default function Login() {
  const [state, action, pending] = useActionState(sendLink, null);
  return (
    <main className="grid min-h-dvh place-items-center p-4">
      <Block className="w-full max-w-sm">
        <h1 className="mb-4 text-xl">Sign in</h1>
        <form action={action} className="flex flex-col gap-3">
          <label htmlFor="email" className="text-sm text-muted">Email</label>
          <input id="email" name="email" type="email" required autoComplete="email"
            className="rounded-full bg-raised px-4 py-2 outline-none focus:ring-2 focus:ring-accent" />
          <button disabled={pending} className="rounded-full bg-fg py-2 text-bg disabled:opacity-50">
            {pending ? "Sending…" : "Email me a link"}
          </button>
          {state?.message && <p className="text-sm text-muted" role="status">{state.message}</p>}
        </form>
      </Block>
    </main>
  );
}
```

- [ ] **Step 5: Confirm route** — exchanges the emailed code for a session:

```ts
// src/app/auth/confirm/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.redirect(new URL("/login", request.url));
}
```

- [ ] **Step 6: Verify manually** — `npm run dev`; visiting `/` redirects to `/login`; submit email; click link; land on dashboard. Then in Supabase → Authentication → Sign In / Providers, turn **off** "Allow new users to sign up".

- [ ] **Step 7: Build + commit** — `npm run build && npm run lint`, then `git add -A && git commit -m "feat: Supabase magic-link auth + route protection"`.

---

### Task 4: Deploy to Vercel

**Needs from user (pause here):** free Vercel account signed in with GitHub; import `g5haco/sonnet`.

- [ ] **Step 1:** In Vercel import the repo, add env vars `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, deploy.
- [ ] **Step 2:** In Supabase → URL Configuration, set Site URL to the Vercel URL and add `https://<vercel-url>/auth/confirm` and `http://localhost:3000/auth/confirm` to Redirect URLs.
- [ ] **Step 3: Verify** — on the live URL, sign in by magic link on laptop and phone; dashboard renders; signed-out visit redirects to `/login`.
- [ ] **Step 4:** `git push` (Vercel redeploys on every push to `main` from here on). Report Phase 0 done with the live URL.
