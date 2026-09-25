-- One-off days off: a class time stays weekly, minus the dates removed from the schedule ("no class next Monday").
alter table public.class_meetings
  add column skip_dates date[] not null default '{}' check (cardinality(skip_dates) <= 200);

-- The Google Calendar feed leaves those days out too.
create or replace function public.calendar_feed(token uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'term', jsonb_build_object('start', s.term_start, 'weeks', s.term_weeks),
    'courses', coalesce((
      select jsonb_agg(jsonb_build_object('id', c.id, 'code', c.code))
      from public.courses c where c.user_id = s.user_id), '[]'::jsonb),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', i.id, 'course_id', i.course_id, 'kind', i.kind, 'title', i.title, 'due', i.due, 'done_at', i.done_at))
      from public.items i where i.user_id = s.user_id), '[]'::jsonb),
    'meetings', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', m.id, 'course_id', m.course_id, 'weekdays', m.weekdays, 'starts', m.starts, 'ends', m.ends,
        'location', m.location, 'skip_dates', m.skip_dates))
      from public.class_meetings m where m.user_id = s.user_id), '[]'::jsonb)
  )
  from public.settings s
  where s.feed_token = token;
$$;
