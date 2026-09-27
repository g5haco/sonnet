-- Sonnet's weekly allowance plus cost metering. Every AI call writes one row: what it was, its weight
-- against the allowance, and (once the answer is done) its model, tokens and dollar cost.
create table public.ai_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  at timestamptz not null default now(),
  kind text not null,
  weight int not null,
  model text,
  tokens_in int,
  tokens_out int,
  cost numeric(12, 8),
  settled boolean not null default false
);
create index ai_usage_user_at on public.ai_usage (user_id, at);
alter table public.ai_usage enable row level security;
create policy "own usage" on public.ai_usage for select using (user_id = auth.uid());

-- Paid plans. No row = free. Written only with the service role (later by Stripe webhooks).
create table public.plans (
  user_id uuid primary key references auth.users on delete cascade,
  plan text not null default 'paid',
  until timestamptz -- null = no end date
);
alter table public.plans enable row level security;
create policy "own plan" on public.plans for select using (user_id = auth.uid());

-- The numbers live here, in one place. Weeks start Monday 00:00 UTC.
-- ponytail: UTC weeks; per-user time zones if Sunday-night resets confuse people.
create function public.usage_status()
returns table (plan text, used int, allowance int, today int, daily int, resets timestamptz)
language sql stable security definer set search_path = ''
as $$
  with p as (
    select coalesce(
      (select 'paid' from public.plans where user_id = auth.uid() and (until is null or until > now())),
      'free') as plan
  )
  select
    p.plan,
    coalesce((select sum(weight) from public.ai_usage where user_id = auth.uid() and at >= date_trunc('week', now())), 0)::int,
    case when p.plan = 'paid' then 1000 else 40 end, -- paid shows as unlimited; 1000 is the fair-use cap
    coalesce((select sum(weight) from public.ai_usage where user_id = auth.uid() and at >= date_trunc('day', now())), 0)::int,
    3, -- once the week is spent, a few uses a day still work
    date_trunc('week', now()) + interval '7 days'
  from p;
$$;

-- Charges one use up front; returns its row id, or null when the allowance is spent.
-- Weights are set here, not by the caller: think/web 2, reading a syllabus 3, Home search's AI free.
create function public.ai_spend(kind text)
returns bigint
language plpgsql security definer set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  w int := case kind when 'chat' then 1 when 'think' then 2 when 'search' then 2
                     when 'syllabus' then 3 when 'home-search' then 0 end;
  s record;
  new_id bigint;
begin
  if uid is null or w is null then return null; end if;
  perform pg_advisory_xact_lock(hashtext(uid::text || ':ai'));
  select * into s from public.usage_status();
  if w > 0 and s.used + w > s.allowance and s.today + w > s.daily then return null; end if;
  insert into public.ai_usage (user_id, kind, weight) values (uid, kind, w) returning id into new_id;
  return new_id;
end;
$$;

-- After the answer: record the cost, and give the use back if no AI answer came (failure or canned reply).
-- Server only (service role), so students can't refund themselves.
create function public.ai_settle(usage_id bigint, billable boolean, model text, tokens_in int, tokens_out int, cost numeric)
returns void
language sql security definer set search_path = ''
as $$
  update public.ai_usage set
    weight = case when billable then weight else 0 end,
    model = ai_settle.model, tokens_in = ai_settle.tokens_in, tokens_out = ai_settle.tokens_out,
    cost = ai_settle.cost, settled = true
  where id = usage_id and not settled;
$$;

revoke execute on function public.usage_status() from public, anon;
revoke execute on function public.ai_spend(text) from public, anon;
revoke execute on function public.ai_settle(bigint, boolean, text, int, int, numeric) from public, anon, authenticated;
grant execute on function public.usage_status() to authenticated;
grant execute on function public.ai_spend(text) to authenticated;
grant execute on function public.ai_settle(bigint, boolean, text, int, int, numeric) to service_role;
