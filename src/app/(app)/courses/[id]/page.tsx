import { notFound } from "next/navigation";
import { CourseView } from "@/components/courses";
import { ITEM_COLS, MEETING_COLS, toItems, toMeetings } from "@/lib/rows";
import { requireUser } from "@/lib/supabase/server";

export default async function CoursePage({ params }: PageProps<"/courses/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase } = await requireUser();
  const [settings, course, items, meetings] = await Promise.all([
    supabase.from("settings").select("term_start, term_weeks").maybeSingle(),
    supabase.from("courses").select("id, code, name, hue").eq("id", id).maybeSingle(),
    supabase.from("items").select(ITEM_COLS).eq("course_id", id).order("due"),
    supabase.from("class_meetings").select(MEETING_COLS).eq("course_id", id).order("starts"),
  ]);
  const error = settings.error ?? course.error ?? items.error ?? meetings.error;
  if (error) throw new Error(`Couldn't load this course: ${error.message}`);
  if (!course.data) notFound();

  return (
    <CourseView
      course={course.data}
      term={settings.data && { start: settings.data.term_start, weeks: settings.data.term_weeks }}
      items={toItems(items.data!, [course.data])}
      meetings={toMeetings(meetings.data!, [course.data])}
    />
  );
}

export async function generateMetadata({ params }: PageProps<"/courses/[id]">) {
  const { id } = await params;
  const { supabase } = await requireUser();
  const { data } = await supabase.from("courses").select("code").eq("id", id).maybeSingle();
  return { title: `${data?.code ?? "Course"} · Sonnet` };
}
