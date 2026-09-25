-- A chat can be about one work item ("Ask about this"). Removing the chip clears it.
alter table public.chats add column item_id uuid references public.items on delete set null;
create index chats_user_item on public.chats (user_id, item_id, updated_at desc) where item_id is not null;
