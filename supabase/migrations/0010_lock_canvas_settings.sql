-- Security: Canvas addresses and sync state are written only by the server (service role), after it
-- validates them. Without this, a signed-in user could write any URL straight through the REST API and
-- make the sync fetch it from the server.
create or replace function public.guard_canvas_settings()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;
  if tg_op = 'INSERT' then
    if new.canvas_base_url is not null or new.canvas_ics_url is not null or new.canvas_token_connected then
      raise exception 'Canvas settings can only be changed from Sync.';
    end if;
  elsif new.canvas_base_url is distinct from old.canvas_base_url
     or new.canvas_ics_url is distinct from old.canvas_ics_url
     or new.canvas_token_connected is distinct from old.canvas_token_connected
     or new.canvas_last_sync_status is distinct from old.canvas_last_sync_status
     or new.canvas_last_sync_error is distinct from old.canvas_last_sync_error then
    raise exception 'Canvas settings can only be changed from Sync.';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_canvas_settings on public.settings;
create trigger guard_canvas_settings
  before insert or update on public.settings
  for each row execute function public.guard_canvas_settings();

-- Uploaded images: raster formats only. SVG can carry script.
update storage.buckets
set allowed_mime_types = array[
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/avif',
  'text/plain',
  'text/markdown'
]
where id = 'materials';
