-- Canvas assignment details for the work view. Null for ICS, syllabus and hand-added items.
alter table public.items
  add column submission_types text[] check (cardinality(submission_types) <= 10),
  add column allowed_attempts int check (allowed_attempts >= -1); -- Canvas: -1 = unlimited
