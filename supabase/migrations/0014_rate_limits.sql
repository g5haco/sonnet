-- Per-user rate limits for costly actions (AI calls, uploads, Canvas sync).
-- take_hit() records one hit and says whether it fits in the window; callers pick a bucket per action.
create table public.rate_hits (
  user_id uuid not null references auth.users on delete cascade,
  bucket text not null,
  at timestamptz not null default now()
);
create index rate_hits_lookup on public.rate_hits (user_id, bucket, at);
alter table public.rate_hits enable row level security; -- no policies: only take_hit() touches it

create function public.take_hit(bucket text, max_hits int, window_s int)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  n int;
begin
  if uid is null then return false; end if;
  perform pg_advisory_xact_lock(hashtext(uid::text || ':' || bucket)); -- parallel requests count one by one
  delete from public.rate_hits h
    where h.user_id = uid and h.bucket = take_hit.bucket and h.at < now() - make_interval(secs => window_s);
  select count(*) into n from public.rate_hits h where h.user_id = uid and h.bucket = take_hit.bucket;
  if n >= max_hits then return false; end if;
  insert into public.rate_hits (user_id, bucket) values (uid, take_hit.bucket);
  return true;
end;
$$;

revoke execute on function public.take_hit(text, int, int) from public, anon;
grant execute on function public.take_hit(text, int, int) to authenticated;
