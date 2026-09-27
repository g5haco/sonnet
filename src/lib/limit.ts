import type { Meter } from "@/lib/ai";
import { createAdminClient } from "@/lib/supabase/admin";
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

// The weekly Sonnet allowance (migration 0015). spend() charges up front and returns the usage row
// (null id = not metered, e.g. the migration isn't applied; fails open). settle() records cost and
// refunds the use when no AI answer came. It runs with the service role so students can't refund themselves.
export type UsageKind = "chat" | "think" | "search" | "syllabus" | "home-search";

export const SPENT = "You've used this week's Sonnet allowance. It refills Monday, and a few uses a day still work.";

export async function spend(supabase: Supabase, kind: UsageKind): Promise<{ ok: boolean; id: number | null }> {
  const { data, error } = await supabase.rpc("ai_spend", { kind });
  if (error) {
    console.error("[usage]", error.message);
    return { ok: true, id: null };
  }
  return data === null ? { ok: false, id: null } : { ok: true, id: Number(data) };
}

export async function settle(id: number | null, m: Meter) {
  if (id === null) return;
  await createAdminClient()
    .rpc("ai_settle", {
      usage_id: id,
      billable: m.billable,
      model: m.model ?? null,
      tokens_in: m.tokensIn ?? null,
      tokens_out: m.tokensOut ?? null,
      cost: m.cost ?? null,
    })
    .then(({ error }) => error && console.error("[usage]", error.message));
}
