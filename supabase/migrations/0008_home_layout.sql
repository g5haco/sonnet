-- Phase 9: the Home widget layout, [{ "id": "next", "size": "lg" }, ...] in order. Null means the default layout.
alter table public.settings add column home_layout jsonb;
