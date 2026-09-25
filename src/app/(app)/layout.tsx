import { AppShell } from "@/components/app-shell";
import { ITEM_COLS, MEETING_COLS, toItems, toMeetings } from "@/lib/rows";
import { createClient } from "@/lib/supabase/server";

// Shared chrome for signed-in pages. No auth check here: layouts don't re-run on navigation,
// so each page calls requireUser(). Row-level security returns nothing to signed-out visitors.
// Items and class times feed the assistant's cards; the settings row and account feed the Settings window,
// which floats over whatever page is open.
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const [courses, items, meetings, settings, canvas, auth] = await Promise.all([
    supabase.from("courses").select("id, code, name, hue").order("created_at"),
    supabase.from("items").select(ITEM_COLS).order("due"),
    supabase.from("class_meetings").select(MEETING_COLS).order("starts"),
    supabase.from("settings").select("term_start, term_weeks, feed_token").maybeSingle(),
    // Separate query keeps the existing app usable until migration 0005 is applied.
    supabase
      .from("settings")
      .select(
        "canvas_base_url, canvas_ics_url, canvas_token_connected, canvas_last_sync_at, canvas_last_sync_status, canvas_last_sync_error, canvas_last_sync_count",
      )
      .maybeSingle(),
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
        canvas: {
          baseUrl: canvas.data?.canvas_base_url ?? "",
          icsUrl: canvas.data?.canvas_ics_url ?? "",
          tokenConnected: canvas.data?.canvas_token_connected ?? false,
          lastSyncAt: canvas.data?.canvas_last_sync_at ?? null,
          lastSyncStatus: canvas.data?.canvas_last_sync_status ?? "idle",
          lastSyncError: canvas.data?.canvas_last_sync_error ?? null,
          lastSyncCount: canvas.data?.canvas_last_sync_count ?? 0,
        },
      }}
    >
      {children}
    </AppShell>
  );
}
