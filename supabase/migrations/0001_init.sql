-- Phase 1: courses, items (assignments/exams/...), per-user term settings.
-- Every row belongs to a user; row-level security makes each account see only its own rows.

create table public.settings (
  user_id uuid primary key default auth.uid() references auth.users on delete cascade,
  term_start date not null,
  term_weeks int not null default 16 check (term_weeks between 1 and 30)
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  code text not null check (length(code) between 1 and 40),
  name text not null default '' check (length(name) <= 120),
  hue int not null check (hue between 0 and 360),
  created_at timestamptz not null default now()
);

create table public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  course_id uuid not null references public.courses on delete cascade,
  kind text not null check (kind in ('assignment', 'exam', 'quiz', 'reading')),
  title text not null check (length(title) between 1 and 200),
  due timestamptz not null,
  done_at timestamptz,
  -- where it came from; Canvas/syllabus imports (Phases 2-3) upsert on (source, external_id)
  source text not null default 'manual' check (source in ('manual', 'canvas', 'ics', 'syllabus')),
  external_id text,
  created_at timestamptz not null default now(),
  unique (user_id, source, external_id)
);

create index items_user_due on public.items (user_id, due);

alter table public.settings enable row level security;
alter table public.courses enable row level security;
alter table public.items enable row level security;

create policy "own settings" on public.settings for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own courses" on public.courses for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
-- items: own rows only, and the course must be yours too
create policy "own items" on public.items for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.courses c where c.id = course_id and c.user_id = (select auth.uid()))
  );
