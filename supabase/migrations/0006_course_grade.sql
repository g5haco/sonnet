-- Phase 7: each course's current grade (percent), as Canvas computes it with the course's weights.
alter table public.courses
  add column grade numeric check (grade >= 0 and grade <= 1000);
