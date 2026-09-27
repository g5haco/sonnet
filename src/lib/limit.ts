import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

// Per-user budgets, one window each (migration 0014).
export const LIMITS = {
  chat: { max: 60, minutes: 60 },
  search: { max: 60, minutes: 60 },
  syllabus: { max: 20, minutes: 60 },
  upload: { max: 60, minutes: 60 },
  sync: { max: 6, minutes: 60 },
} as const;

export const LIMITED = "You've hit the hourly limit for this. Try again a bit later.";

// Records one hit; false once the budget is used up. Fails open if the database call errors,
// so an outage (or the migration not being applied yet) never locks students out.
export async function allowed(supabase: Supabase, bucket: keyof typeof LIMITS): Promise<boolean> {
  const { max, minutes } = LIMITS[bucket];
  const { data, error } = await supabase.rpc("take_hit", { bucket, max_hits: max, window_s: minutes * 60 });
  if (error) console.error("[limit]", error.message);
  return error ? true : data === true;
}
