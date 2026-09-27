-- Free plan limits: 2 courses and 1 flashcard deck. Paid (a live row in plans) has no limit.
-- Enforced here, so direct API calls can't skip them; rows made before the limit stay.
create or replace function public.enforce_free_limits()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  cap int := case tg_table_name when 'courses' then 2 else 1 end;
  n int;
begin
  if exists (select 1 from public.plans p where p.user_id = new.user_id and (p.until is null or p.until > now())) then
    return new;
  end if;
  -- one insert at a time per user and table, so two tabs can't both slip under the cap
  perform pg_advisory_xact_lock(hashtext(tg_table_name || new.user_id::text));
  execute format('select count(*) from public.%I where user_id = $1', tg_table_name) into n using new.user_id;
  if n >= cap then
    raise exception using errcode = 'P0001', message = 'FREE_LIMIT_' || upper(tg_table_name);
  end if;
  return new;
end
$$;
revoke all on function public.enforce_free_limits() from public, anon, authenticated;

drop trigger if exists courses_free_limit on public.courses;
create trigger courses_free_limit before insert on public.courses
  for each row execute function public.enforce_free_limits();

drop trigger if exists decks_free_limit on public.decks;
create trigger decks_free_limit before insert on public.decks
  for each row execute function public.enforce_free_limits();
