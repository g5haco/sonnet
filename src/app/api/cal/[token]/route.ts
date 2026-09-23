import { createClient } from "@supabase/supabase-js";
import { toIcs, type Feed } from "@/lib/calendar";

// The Google Calendar subscription: /api/cal/<secret>.ics. Google fetches it without signing in,
// so the secret token in the URL is the only key (see calendar_feed() in migration 0003).
export async function GET(_request: Request, ctx: RouteContext<"/api/cal/[token]">) {
  const token = (await ctx.params).token.replace(/\.ics$/, "");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token))
    return new Response("Not found", { status: 404 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
  const { data, error } = await supabase.rpc("calendar_feed", { token });
  if (error) {
    console.error("[cal]", error.message);
    return new Response("Feed unavailable, try again later.", { status: 503 });
  }
  if (!data) return new Response("Not found", { status: 404 });

  return new Response(toIcs(data as Feed, new Date()), {
    headers: { "Content-Type": "text/calendar; charset=utf-8", "Cache-Control": "private, max-age=300" },
  });
}
