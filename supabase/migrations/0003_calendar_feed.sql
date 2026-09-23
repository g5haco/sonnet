-- Phase 4: a private feed URL Google Calendar can subscribe to (one-way: Sonnet -> Google).

-- The secret in the feed URL. "New link" in the app replaces it, which kills the old URL.
alter table public.settings add column feed_token uuid not null default gen_random_uuid() unique;

-- Google fetches the feed without signing in, so row-level security can't identify the student.
-- This function runs as its owner and returns one student's calendar only to whoever holds their token.
create function public.calendar_feed(token uuid) returns jsonb
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
        'location', m.location))
      from public.class_meetings m where m.user_id = s.user_id), '[]'::jsonb)
  )
  from public.settings s
  where s.feed_token = token;
$$;

revoke execute on function public.calendar_feed(uuid) from public;
grant execute on function public.calendar_feed(uuid) to anon, authenticated;
