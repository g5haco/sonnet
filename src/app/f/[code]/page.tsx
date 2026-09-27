import { cache } from "react";
import { notFound } from "next/navigation";
import { SharedDeck, type Card } from "@/components/flashcards";
import { createClient } from "@/lib/supabase/server";

// A shared deck: public, read-only. shared_deck() only returns the deck whose exact code this is.
const load = cache(async (code: string) => {
  if (!/^[A-Za-z0-9_-]{20,40}$/.test(code)) return null;
  const supabase = await createClient();
  const { data } = await supabase.rpc("shared_deck", { code }).maybeSingle();
  return data as { title: string; cards: Card[]; course: string | null; hue: number | null } | null;
});

export default async function SharedDeckPage({ params }: PageProps<"/f/[code]">) {
  const deck = await load((await params).code);
  if (!deck) notFound();
  return <SharedDeck deck={deck} />;
}

export async function generateMetadata({ params }: PageProps<"/f/[code]">) {
  const deck = await load((await params).code);
  return {
    title: deck ? `${deck.title} · Flashcards on Sonnet` : "Deck not found · Sonnet",
    description: deck ? `${deck.cards.length} flashcards${deck.course ? ` for ${deck.course}` : ""}. Study them free, no account needed.` : undefined,
    robots: { index: false },
  };
}
