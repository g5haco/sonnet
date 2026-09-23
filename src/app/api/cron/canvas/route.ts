import { syncCanvasUser } from "@/lib/canvas";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 60;

// Vercel calls this once a day and sends CRON_SECRET as the bearer token.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("settings")
    .select("user_id")
    .or("canvas_token_connected.eq.true,canvas_ics_url.not.is.null");
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const results = [];
  for (const { user_id } of data ?? []) {
    try {
      results.push({ userId: user_id, ok: true, ...(await syncCanvasUser(admin, user_id)) });
    } catch (syncError) {
      results.push({
        userId: user_id,
        ok: false,
        error: syncError instanceof Error ? syncError.message : "Sync failed",
      });
    }
  }
  return Response.json({ synced: results.length, results });
}
