import { Calendar } from "@/components/calendar";
import { ITEM_COLS, MEETING_COLS, toItems, toMeetings } from "@/lib/rows";
import { requireUser } from "@/lib/supabase/server";

export const metadata = { title: "Calendar · Sonnet" };

export default async function CalendarPage({ searchParams }: PageProps<"/calendar">) {
  const { supabase } = await requireUser();
  const [settings, courses, items, meetings] = await Promise.all([
    supabase.from("settings").select("term_start, term_weeks, feed_token").maybeSingle(),
    supabase.from("courses").select("id, code, name, hue").order("created_at"),
    supabase.from("items").select(ITEM_COLS).order("due"),
    supabase.from("class_meetings").select(MEETING_COLS).order("starts"),
  ]);
  const error = settings.error ?? courses.error ?? items.error ?? meetings.error;
  if (error) throw new Error(`Couldn't load your calendar: ${error.message}`);

  const q = await searchParams;
  return (
    <Calendar
      // ?view=week&date=2026-09-23 keeps your place across reloads (the page writes it back as you navigate)
      initial={{ view: String(q.view ?? ""), date: String(q.date ?? "") }}
      term={settings.data && { start: settings.data.term_start, weeks: settings.data.term_weeks }}
      feed={settings.data?.feed_token ?? null}
      items={toItems(items.data!, courses.data!)}
      meetings={toMeetings(meetings.data!, courses.data!)}
    />
  );
}
