import { DeckList, type DeckRow } from "@/components/flashcards";
import { requireUser } from "@/lib/supabase/server";

export const metadata = { title: "Flashcards · Sonnet" };

export default async function FlashcardsPage() {
  const { supabase } = await requireUser();
  const [decks, courses] = await Promise.all([
    supabase.from("decks").select("id, title, cards, course_id, share_code, updated_at").order("updated_at", { ascending: false }),
    supabase.from("courses").select("id, code, hue").order("created_at"),
  ]);
  const error = decks.error ?? courses.error;
  if (error) throw new Error(`Couldn't load your flashcards: ${error.message}`);
  return <DeckList decks={decks.data as DeckRow[]} courses={courses.data!} />;
}
