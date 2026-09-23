import { AppShell } from "@/components/app-shell";
import { ITEM_COLS, MEETING_COLS, toItems, toMeetings } from "@/lib/rows";
import { createClient } from "@/lib/supabase/server";

// Shared chrome for signed-in pages. No auth check here: layouts don't re-run on navigation,
// so each page calls requireUser(). Row-level security returns nothing to signed-out visitors.
// Items and class times feed the assistant's proposal cards (the week an added item lands in).
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const [courses, items, meetings] = await Promise.all([
    supabase.from("courses").select("id, code, name, hue").order("created_at"),
    supabase.from("items").select(ITEM_COLS).order("due"),
    supabase.from("class_meetings").select(MEETING_COLS).order("starts"),
  ]);
  const c = courses.data ?? [];
  return (
    <AppShell
      courses={c}
      schedule={{ items: toItems(items.data ?? [], c), meetings: toMeetings(meetings.data ?? [], c) }}
    >
      {children}
    </AppShell>
  );
}
