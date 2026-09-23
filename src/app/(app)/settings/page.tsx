import { Block } from "@/components/block";
import { FeedLink } from "@/components/calendar-rail";
import { Appearance, SemesterForm, SignOut } from "@/components/settings-forms";
import { requireUser } from "@/lib/supabase/server";

export const metadata = { title: "Settings · Sonnet" };

export default async function Settings() {
  const { supabase, email } = await requireUser();
  const settings = await supabase.from("settings").select("term_start, term_weeks, feed_token").maybeSingle();
  if (settings.error) throw new Error("Couldn't load your settings.");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 pt-4 pb-10 md:px-6 md:pt-6">
      <header className="mb-1">
        <h1 className="text-lg font-medium tracking-tight">Settings</h1>
      </header>

      <Block title="Semester">
        <SemesterForm start={settings.data?.term_start ?? ""} weeks={settings.data?.term_weeks ?? 16} />
      </Block>

      <Block title="Google Calendar">
        <FeedLink token={settings.data?.feed_token ?? null} />
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
