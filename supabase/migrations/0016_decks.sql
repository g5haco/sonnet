-- Flashcard decks: saved from the chat (automatically) or made by hand, edited on /flashcards.
-- A deck with a share_code can be read by anyone through shared_deck(code), signed in or not.
create table public.decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  course_id uuid references public.courses on delete set null,
  title text not null default 'Flashcards' check (length(title) between 1 and 120),
  -- [{ "front": "...", "back": "..." }], at most 200 cards
  cards jsonb not null default '[]'::jsonb
    check (jsonb_typeof(cards) = 'array' and jsonb_array_length(cards) <= 200 and pg_column_size(cards) <= 400000),
  share_code text unique check (share_code ~ '^[A-Za-z0-9_-]{20,40}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index decks_user_updated on public.decks (user_id, updated_at desc);

alter table public.decks enable row level security;

-- Own rows only, and a course tag must be your own course (same rule as materials).
create policy "own decks" on public.decks for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and (course_id is null or exists (select 1 from public.courses c where c.id = course_id and c.user_id = (select auth.uid())))
  );

-- The public share page. Only a deck's exact code finds it; nothing can be listed or guessed.
create or replace function public.shared_deck(code text)
returns table (title text, cards jsonb, course text, hue int, updated_at timestamptz)
language sql stable security definer set search_path = ''
as $$
  select d.title, d.cards, c.code, c.hue, d.updated_at
  from public.decks d left join public.courses c on c.id = d.course_id
  where d.share_code is not null and d.share_code = shared_deck.code -- qualified: courses has a "code" column too
$$;
revoke all on function public.shared_deck(text) from public;
grant execute on function public.shared_deck(text) to anon, authenticated;
