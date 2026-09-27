import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { DeckEditor, type DeckRow } from "@/components/flashcards";
import { requireUser } from "@/lib/supabase/server";

export default async function DeckPage({ params }: PageProps<"/flashcards/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase } = await requireUser();
  const [deck, courses, h] = await Promise.all([
    supabase.from("decks").select("id, title, cards, course_id, share_code, updated_at").eq("id", id).maybeSingle(),
    supabase.from("courses").select("id, code, hue").order("created_at"),
    headers(),
  ]);
  const error = deck.error ?? courses.error;
  if (error) throw new Error(`Couldn't load this deck: ${error.message}`);
  if (!deck.data) notFound();
  // Share links use the address the student is on (localhost in dev, the live domain in production).
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  return <DeckEditor deck={deck.data as DeckRow} courses={courses.data!} origin={origin} />;
}

export async function generateMetadata({ params }: PageProps<"/flashcards/[id]">) {
  const { id } = await params;
  const { supabase } = await requireUser();
  const { data } = await supabase.from("decks").select("title").eq("id", id).maybeSingle();
  return { title: `${data?.title ?? "Deck"} · Sonnet` };
}
