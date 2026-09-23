import { CoursesGrid } from "@/components/courses";
import { ITEM_COLS, MEETING_COLS, toCards, toItems, toMeetings } from "@/lib/rows";
import { requireUser } from "@/lib/supabase/server";

export const metadata = { title: "Courses · Sonnet" };

export default async function CoursesPage() {
  const { supabase } = await requireUser();
  const [courses, items, meetings] = await Promise.all([
    supabase.from("courses").select("id, code, name, hue").order("created_at"),
    supabase.from("items").select(ITEM_COLS).order("due"),
    supabase.from("class_meetings").select(MEETING_COLS).order("starts"),
  ]);
  const error = courses.error ?? items.error ?? meetings.error;
  if (error) throw new Error(`Couldn't load your courses: ${error.message}`);
  return (
    <CoursesGrid
      courses={toCards(courses.data!, toItems(items.data!, courses.data!), toMeetings(meetings.data!, courses.data!))}
    />
  );
}
