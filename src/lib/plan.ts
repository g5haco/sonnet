import type { SupabaseClient } from "@supabase/supabase-js";

// What Free allows. The database enforces the counts too (migration 0017), so these are for messages and UI.
export const FREE = { courses: 2, decks: 1 };

export const LIMIT_MESSAGE = {
  courses: `Free keeps ${FREE.courses} courses. Remove one to add another, or go Pro (coming soon) for unlimited courses.`,
  decks: `Free keeps ${FREE.decks} flashcard deck. Delete it to save a new one, or go Pro (coming soon) for unlimited decks.`,
};

// The trigger's error for a capped insert, as the message students see.
export const limitError = (message: string) =>
  message.includes("FREE_LIMIT_COURSES") ? LIMIT_MESSAGE.courses : message.includes("FREE_LIMIT_DECKS") ? LIMIT_MESSAGE.decks : null;

// Paid = a live row in plans. A user's own client can read only their row; the admin client needs `userId`.
export async function isPaid(supabase: SupabaseClient, userId?: string) {
  let q = supabase.from("plans").select("until");
  if (userId) q = q.eq("user_id", userId);
  const { data } = await q.maybeSingle();
  return !!data && (data.until === null || Date.parse(data.until) > Date.now());
}
