-- Phase 4: weekly class times per course (e.g. Mon/Wed/Fri 10:00-10:50 in ECCR 1B40).
-- Times are wall-clock times in the student's own timezone; the calendar places them on each week.

create table public.class_meetings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  course_id uuid not null references public.courses on delete cascade,
  weekdays int[] not null check (cardinality(weekdays) between 1 and 7 and weekdays <@ array[0,1,2,3,4,5,6]), -- 0 = Sunday
  starts time not null,
  ends time not null check (ends > starts),
  location text not null default '' check (length(location) <= 80),
  created_at timestamptz not null default now()
);

create index class_meetings_user on public.class_meetings (user_id);

alter table public.class_meetings enable row level security;

-- own rows only, and the course must be yours too (same rule as items)
create policy "own class meetings" on public.class_meetings for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.courses c where c.id = course_id and c.user_id = (select auth.uid()))
  );
