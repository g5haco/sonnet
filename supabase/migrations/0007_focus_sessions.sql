-- Phase 8: focus timer sessions; they fill the study heatmap and streak.
create table public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  course_id uuid references public.courses on delete set null, -- optional: focus without a course
  started_at timestamptz not null,
  minutes int not null check (minutes between 1 and 240),
  created_at timestamptz not null default now()
);

create index focus_sessions_user on public.focus_sessions (user_id, started_at);

alter table public.focus_sessions enable row level security;

-- own rows only, and a course (when set) must be yours too
create policy "own focus sessions" on public.focus_sessions for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and (course_id is null
      or exists (select 1 from public.courses c where c.id = course_id and c.user_id = (select auth.uid())))
  );
