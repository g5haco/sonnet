-- Phase 5: Canvas token/calendar connections, sync status, and imported assignment details.

alter table public.settings
  add column canvas_base_url text check (length(canvas_base_url) <= 300),
  add column canvas_ics_url text check (length(canvas_ics_url) <= 2000),
  add column canvas_token_connected boolean not null default false,
  add column canvas_last_sync_at timestamptz,
  add column canvas_last_sync_status text not null default 'idle'
    check (canvas_last_sync_status in ('idle', 'syncing', 'success', 'error')),
  add column canvas_last_sync_error text check (length(canvas_last_sync_error) <= 1000),
  add column canvas_last_sync_count int not null default 0 check (canvas_last_sync_count >= 0);

alter table public.courses add column canvas_course_id text;
create unique index courses_user_canvas on public.courses (user_id, canvas_course_id) where canvas_course_id is not null;

alter table public.items
  add column description text,
  add column points_possible numeric,
  add column score numeric,
  add column html_url text check (length(html_url) <= 2000);

-- No anon/authenticated policies: only Sonnet's server-side secret-key client can touch Canvas tokens.
create table public.canvas_connections (
  user_id uuid primary key references auth.users on delete cascade,
  token_encrypted text not null,
  updated_at timestamptz not null default now()
);
alter table public.canvas_connections enable row level security;
revoke all on table public.canvas_connections from anon, authenticated;

