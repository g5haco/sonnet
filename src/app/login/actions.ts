"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { ok: boolean; message: string } | null;

export async function sendLink(_: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim();
  if (!email.includes("@")) return { ok: false, message: "That doesn't look like an email address." };

  const origin = (await headers()).get("origin");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    // No sign-ups: v1 is single-user, so only the existing account gets a link.
    options: { emailRedirectTo: `${origin}/auth/confirm`, shouldCreateUser: false },
  });
  if (error) return { ok: false, message: `Couldn't send the link: ${error.message}` };
  return { ok: true, message: `Link sent to ${email}. Check your inbox (and spam).` };
}
