import { Calendar } from "@/components/calendar";
import type { ClassMeeting } from "@/lib/calendar";
import type { Item } from "@/lib/progress";
import { requireUser } from "@/lib/supabase/server";

export const metadata = { title: "Calendar · Sonnet" };

export default async function CalendarPage({ searchParams }: PageProps<"/calendar">) {
  const { supabase } = await requireUser();
  const [settings, courses, items, meetings] = await Promise.all([
    supabase.from("settings").select("term_start, term_weeks").maybeSingle(),
    supabase.from("courses").select("id, code, name, hue").order("created_at"),
    supabase.from("items").select("id, title, kind, due, done_at, course_id").order("due"),
    supabase.from("class_meetings").select("id, course_id, weekdays, starts, ends, location").order("starts"),
  ]);
  const error = settings.error ?? courses.error ?? items.error ?? meetings.error;
  if (error) throw new Error(`Couldn't load your calendar: ${error.message}`);

  const byId = new Map(courses.data!.map((c) => [c.id, c]));
  const q = await searchParams;
  return (
    <Calendar
      // ?view=week&date=2026-09-23 keeps your place across reloads (the page writes it back as you navigate)
      initial={{ view: String(q.view ?? ""), date: String(q.date ?? "") }}
      term={settings.data && { start: settings.data.term_start, weeks: settings.data.term_weeks }}
      items={items.data!.map((i): Item => ({
        id: i.id,
        title: i.title,
        kind: i.kind,
        due: i.due,
        doneAt: i.done_at,
        course: byId.get(i.course_id)?.code ?? "",
        hue: byId.get(i.course_id)?.hue ?? 0,
      }))}
      meetings={meetings.data!.map((m): ClassMeeting => ({
        ...m,
        course: byId.get(m.course_id)?.code ?? "",
        name: byId.get(m.course_id)?.name ?? "",
        hue: byId.get(m.course_id)?.hue ?? 0,
      }))}
    />
  );
}
