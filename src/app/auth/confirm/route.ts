import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// The emailed sign-in link lands here. token_hash works when the email is opened on another
// device (needs the email template change in the README); code is Supabase's default link.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const tokenHash = params.get("token_hash");
  const code = params.get("code");
  const supabase = await createClient();

  const { error } = tokenHash
    ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type: (params.get("type") ?? "email") as EmailOtpType })
    : code
      ? await supabase.auth.exchangeCodeForSession(code)
      : { error: true };

  return NextResponse.redirect(new URL(error ? "/login?expired=1" : "/", request.url));
}
