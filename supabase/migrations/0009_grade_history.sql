-- Phase 9: one grade per course per day, recorded by Canvas sync; the Grade trend widget draws it.
create table public.grade_history (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  course_id uuid not null references public.courses on delete cascade,
  day date not null,
  grade numeric not null,
  primary key (course_id, day)
);

alter table public.grade_history enable row level security;

create policy "own grade history" on public.grade_history for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.courses c where c.id = course_id and c.user_id = (select auth.uid()))
  );
