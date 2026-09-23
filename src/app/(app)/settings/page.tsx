import { Block } from "@/components/block";
import { Appearance, CourseRow, SemesterForm, SignOut } from "@/components/settings-forms";
import { requireUser } from "@/lib/supabase/server";

export const metadata = { title: "Settings · Sonnet" };

export default async function Settings() {
  const { supabase, email } = await requireUser();
  const [settings, courses] = await Promise.all([
    supabase.from("settings").select("term_start, term_weeks").maybeSingle(),
    supabase
      .from("courses")
      .select("id, code, name, hue, items(count), class_meetings(id, weekdays, starts, ends, location)")
      .order("created_at"),
  ]);
  if (settings.error ?? courses.error) throw new Error("Couldn't load your settings.");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 pt-4 pb-10 md:px-6 md:pt-6">
      <header className="mb-1">
        <h1 className="text-lg font-medium tracking-tight">Settings</h1>
      </header>

      <Block title="Semester">
        <SemesterForm start={settings.data?.term_start ?? ""} weeks={settings.data?.term_weeks ?? 16} />
      </Block>

      <Block title="Courses" aside={`${courses.data!.length} total`}>
        {courses.data!.length === 0 ? (
          <p className="text-sm text-muted-foreground">No courses yet. Add one from the + in the sidebar.</p>
        ) : (
          <ul className="-my-3 divide-y divide-border">
            {courses.data!.map((c) => (
              <CourseRow
                key={c.id}
                course={{ id: c.id, code: c.code, name: c.name, hue: c.hue, items: c.items[0]?.count ?? 0 }}
                meetings={c.class_meetings}
              />
            ))}
          </ul>
        )}
      </Block>

      <Block title="Appearance">
        <Appearance />
      </Block>

      <Block title="Account" aside={email}>
        <div>
          <SignOut />
        </div>
      </Block>
    </main>
  );
}
