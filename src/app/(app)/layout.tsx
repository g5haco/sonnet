import { AppShell } from "@/components/app-shell";
import { ITEM_COLS, MEETING_COLS, toItems, toMeetings } from "@/lib/rows";
import { createClient } from "@/lib/supabase/server";

// Shared chrome for signed-in pages. No auth check here: layouts don't re-run on navigation,
// so each page calls requireUser(). Row-level security returns nothing to signed-out visitors.
// Items and class times feed the assistant's cards; the settings row and account feed the Settings window,
// which floats over whatever page is open.
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const [courses, items, meetings, settings, auth] = await Promise.all([
    supabase.from("courses").select("id, code, name, hue").order("created_at"),
    supabase.from("items").select(ITEM_COLS).order("due"),
    supabase.from("class_meetings").select(MEETING_COLS).order("starts"),
    supabase.from("settings").select("term_start, term_weeks, feed_token").maybeSingle(),
    supabase.auth.getClaims(),
  ]);
  const c = courses.data ?? [];
  const claims = auth.data?.claims;
  const s = settings.data;
  return (
    <AppShell
      courses={c}
      schedule={{ items: toItems(items.data ?? [], c), meetings: toMeetings(meetings.data ?? [], c) }}
      account={{
        email: String(claims?.email ?? ""),
        name: (claims?.user_metadata as { name?: string } | undefined)?.name ?? "",
        term: s && { start: s.term_start, weeks: s.term_weeks },
        feed: s?.feed_token ?? null,
      }}
    >
      {children}
    </AppShell>
  );
}
