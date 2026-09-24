import { notFound } from "next/navigation";
import { CourseView } from "@/components/courses";
import { ITEM_COLS, MEETING_COLS, toItems, toMeetings } from "@/lib/rows";
import { requireUser } from "@/lib/supabase/server";

export default async function CoursePage({ params }: PageProps<"/courses/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase } = await requireUser();
  const [settings, course, items, meetings, materials] = await Promise.all([
    supabase.from("settings").select("term_start, term_weeks").maybeSingle(),
    supabase.from("courses").select("*").eq("id", id).maybeSingle(), // "*": grade only exists after migration 0006
    supabase.from("items").select(ITEM_COLS).eq("course_id", id).order("due"),
    supabase.from("class_meetings").select(MEETING_COLS).eq("course_id", id).order("starts"),
    supabase
      .from("materials")
      .select("id, kind, name, path, url, body, size, mime, created_at")
      .eq("course_id", id)
      .order("created_at", { ascending: false }),
  ]);
  // Materials are extra: if they can't load (e.g. before migration 0004), the course page still works.
  const error = settings.error ?? course.error ?? items.error ?? meetings.error;
  if (error) throw new Error(`Couldn't load this course: ${error.message}`);
  if (!course.data) notFound();

  return (
    <CourseView
      course={course.data}
      term={settings.data && { start: settings.data.term_start, weeks: settings.data.term_weeks }}
      items={toItems(items.data!, [course.data])}
      meetings={toMeetings(meetings.data!, [course.data])}
      // A file's extracted text is for the assistant only; don't ship it to the page.
      materials={(materials.data ?? []).map((m) =>
        m.kind === "note" ? { ...m, readable: !!m.body } : { ...m, body: null, readable: !!m.body },
      )}
    />
  );
}

export async function generateMetadata({ params }: PageProps<"/courses/[id]">) {
  const { id } = await params;
  const { supabase } = await requireUser();
  const { data } = await supabase.from("courses").select("code").eq("id", id).maybeSingle();
  return { title: `${data?.code ?? "Course"} · Sonnet` };
}
