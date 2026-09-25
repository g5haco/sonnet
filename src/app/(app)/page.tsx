import { Dashboard } from "@/components/dashboard";
import { readLayout } from "@/lib/home";
import { ITEM_COLS, MEETING_COLS, toCards, toItems, toMeetings } from "@/lib/rows";
import { requireUser } from "@/lib/supabase/server";

export default async function Page() {
  const { supabase, name } = await requireUser();

  const [settings, courses, items, meetings, focus, materials, history] = await Promise.all([
    supabase.from("settings").select("*").maybeSingle(),
    supabase.from("courses").select("*").order("created_at"), // "*": grade only exists after migration 0006
    supabase.from("items").select(ITEM_COLS).order("due"),
    supabase.from("class_meetings").select(MEETING_COLS).order("starts"),
    supabase
      .from("focus_sessions")
      .select("started_at, minutes, course_id")
      .order("started_at", { ascending: false })
      .limit(1000), // ponytail: newest 1000 sessions cover the 18-week heatmap; filter by date if they don't
    // The Recent materials widget: newest 5 across courses.
    supabase.from("materials").select("id, kind, name, course_id").order("created_at", { ascending: false }).limit(5),
    // Grade trend points, newest 2000.
    supabase.from("grade_history").select("course_id, day, grade").order("day", { ascending: false }).limit(2000),
  ]);
  const error = settings.error ?? courses.error ?? items.error ?? meetings.error;
  if (error) throw new Error(`Couldn't load your dashboard: ${error.message}`);

  const all = toItems(items.data!, courses.data!);
  return (
    <Dashboard
      name={name}
      layout={readLayout(settings.data?.home_layout)}
      term={settings.data && { start: settings.data.term_start, weeks: settings.data.term_weeks }}
      courses={courses.data!}
      items={all}
      sessions={focus.data ?? []}
      materials={materials.data ?? []}
      history={history.data ?? []}
      cards={toCards(courses.data!, all, toMeetings(meetings.data!, courses.data!))}
    />
  );
}
