-- Chat history (the Chat page's History) and course materials (uploads, links, notes on each course's page).

create table public.chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  title text not null default '' check (length(title) <= 120),
  focus text not null default '' check (length(focus) <= 40), -- course code the chat was about, '' = all
  messages jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
create index chats_user_updated on public.chats (user_id, updated_at desc);

create table public.materials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  course_id uuid not null references public.courses on delete cascade,
  kind text not null check (kind in ('file', 'link', 'note')),
  name text not null check (length(name) between 1 and 200),
  path text check (length(path) <= 400), -- file: object path in the "materials" bucket
  url text check (length(url) <= 2000), -- link
  body text check (length(body) <= 100000), -- note text (later: text extracted from files)
  size bigint,
  mime text,
  created_at timestamptz not null default now()
);
create index materials_course on public.materials (course_id, created_at desc);

alter table public.chats enable row level security;
alter table public.materials enable row level security;

create policy "own chats" on public.chats for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
-- materials: own rows only, and the course must be yours too (same rule as items)
create policy "own materials" on public.materials for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.courses c where c.id = course_id and c.user_id = (select auth.uid()))
  );

-- Private bucket for uploaded files, 50 MB each. Files live under <user id>/<course id>/..., and a student
-- can only touch objects inside their own <user id>/ folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('materials', 'materials', false, 52428800, array[
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/*',
  'text/plain',
  'text/markdown'
])
on conflict (id) do nothing;

create policy "own material files" on storage.objects for all to authenticated
  using (bucket_id = 'materials' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'materials' and (storage.foldername(name))[1] = (select auth.uid())::text);
