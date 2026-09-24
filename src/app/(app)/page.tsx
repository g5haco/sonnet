import { Dashboard } from "@/components/dashboard";
import { ITEM_COLS, MEETING_COLS, toCards, toItems, toMeetings } from "@/lib/rows";
import { requireUser } from "@/lib/supabase/server";

export default async function Page() {
  const { supabase, name } = await requireUser();

  const [settings, courses, items, meetings, focus] = await Promise.all([
    supabase.from("settings").select("term_start, term_weeks").maybeSingle(),
    supabase.from("courses").select("*").order("created_at"), // "*": grade only exists after migration 0006
    supabase.from("items").select(ITEM_COLS).order("due"),
    supabase.from("class_meetings").select(MEETING_COLS).order("starts"),
    // Extra: before migration 0007 this fails and Home shows an empty heatmap.
    supabase
      .from("focus_sessions")
      .select("started_at, minutes")
      .order("started_at", { ascending: false })
      .limit(1000), // ponytail: newest 1000 sessions cover the 18-week heatmap; filter by date if they don't
  ]);
  const error = settings.error ?? courses.error ?? items.error ?? meetings.error;
  if (error) throw new Error(`Couldn't load your dashboard: ${error.message}`);

  const all = toItems(items.data!, courses.data!);
  return (
    <Dashboard
      name={name}
      term={settings.data && { start: settings.data.term_start, weeks: settings.data.term_weeks }}
      courses={courses.data!}
      items={all}
      sessions={focus.data ?? []}
      cards={toCards(courses.data!, all, toMeetings(meetings.data!, courses.data!))}
    />
  );
}
