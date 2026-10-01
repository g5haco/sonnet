import { createClient } from "@/lib/supabase/server";

// Settings → Data → Export: everything Sonnet stores about the signed-in student, as one JSON download.
// Reads go through the per-user client, so row-level security limits every table to this account. Secrets
// stay out: the Canvas token lives in a table students can't read, and the calendar feed token and Canvas
// calendar link are dropped from settings. Uploaded files are listed (materials.path) but not bundled.
const TABLES = ["courses", "items", "class_meetings", "materials", "chats", "decks", "focus_sessions", "grade_history", "ai_usage"] as const;
const SECRETS = ["feed_token", "canvas_ics_url"];

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) return Response.json({ error: "Sign in again." }, { status: 401 });

  const out: Record<string, unknown> = {
    exported_at: new Date().toISOString(),
    account: { id: userId, email: data.claims.email ?? null, name: data.claims.user_metadata?.name ?? null },
  };
  const { data: settings, error } = await supabase.from("settings").select("*").eq("user_id", userId).maybeSingle();
  if (error) return Response.json({ error: "Couldn't read your settings." }, { status: 500 });
  out.settings = settings && Object.fromEntries(Object.entries(settings).filter(([k]) => !SECRETS.includes(k)));

  for (const table of TABLES) {
    const { data: rows, error } = await supabase.from(table).select("*").eq("user_id", userId).limit(50000);
    // A table from a migration the database doesn't have yet is skipped rather than failing the whole export.
    if (error) {
      if (error.code === "42P01" || error.code === "PGRST205") continue;
      return Response.json({ error: `Couldn't read your ${table}.` }, { status: 500 });
    }
    out[table] = rows;
  }

  return new Response(JSON.stringify(out, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="sonnet-export-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
