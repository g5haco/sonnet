import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";

// Shared chrome for signed-in pages. No auth check here: layouts don't re-run on navigation,
// so each page calls requireUser(). Row-level security returns nothing to signed-out visitors.
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const { data: courses } = await supabase.from("courses").select("id, code, hue").order("created_at");
  return <AppShell courses={courses ?? []}>{children}</AppShell>;
}
