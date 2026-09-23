import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Server components, actions and route handlers. The publishable (anon) key is safe to expose;
// row-level security is what protects data.
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components can't set cookies; proxy.ts refreshes the session instead.
        }
      },
    },
  });
}

// Every signed-in page calls this (layouts don't re-run on navigation, so they can't guard).
// Returns the client for further queries; row-level security scopes them to this user.
export async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");
  const meta = data.claims.user_metadata as { name?: string } | undefined;
  return { supabase, email: String(data.claims.email ?? ""), name: meta?.name ?? "" };
}
