import { redirect } from "next/navigation";
import { Dashboard } from "@/components/dashboard";
import type { Item } from "@/lib/progress";
import { createClient } from "@/lib/supabase/server";

export default async function Page() {
  const supabase = await createClient();
  // The real check (proxy.ts only redirects optimistically).
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) redirect("/login");

  const [settings, courses, items] = await Promise.all([
    supabase.from("settings").select("term_start, term_weeks").maybeSingle(),
    supabase.from("courses").select("id, code, name, hue").order("created_at"),
    supabase.from("items").select("id, title, kind, due, done_at, course_id").order("due"),
  ]);
  const error = settings.error ?? courses.error ?? items.error;
  if (error) throw new Error(`Couldn't load your dashboard: ${error.message}`);

  const byId = new Map(courses.data!.map((c) => [c.id, c]));
  return (
    <Dashboard
      term={settings.data && { start: settings.data.term_start, weeks: settings.data.term_weeks }}
      courses={courses.data!}
      items={items.data!.map(
        (i): Item => ({
          id: i.id,
          title: i.title,
          kind: i.kind,
          due: i.due,
          doneAt: i.done_at,
          course: byId.get(i.course_id)?.code ?? "",
          hue: byId.get(i.course_id)?.hue ?? 0,
        }),
      )}
    />
  );
}
