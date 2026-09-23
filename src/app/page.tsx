import { redirect } from "next/navigation";
import { Dashboard } from "@/components/dashboard";
import { createClient } from "@/lib/supabase/server";

export default async function Page() {
  // The real check (proxy.ts only redirects optimistically).
  const { data } = await (await createClient()).auth.getClaims();
  if (!data?.claims) redirect("/login");
  return <Dashboard />;
}
