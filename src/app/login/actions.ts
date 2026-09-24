"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type LoginState = { ok: boolean; message: string } | null;

// One form, two buttons: "Sign in" (password) or "Email me a link instead".
export async function signIn(_: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim();
  if (!email.includes("@")) return { ok: false, message: "That doesn't look like an email address." };
  if (form.get("intent") === "link") return sendLink(email);

  const password = String(form.get("password") ?? "");
  if (!password) return { ok: false, message: "Enter your password, or use the email link." };
  const { error } = await (await createClient()).auth.signInWithPassword({ email, password });
  if (error?.status === 429) return { ok: false, message: "Too many attempts. Try again in a few minutes." };
  // Same message for wrong email or wrong password, so the form doesn't reveal which accounts exist.
  if (error) return { ok: false, message: "That email and password don't match." };
  redirect("/");
}

async function sendLink(email: string): Promise<LoginState> {
  const origin = (await headers()).get("origin");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    // No sign-ups: v1 is single-user, so only the existing account gets a link.
    options: { emailRedirectTo: `${origin}/auth/confirm`, shouldCreateUser: false },
  });
  if (error?.code === "otp_disabled" || /signups not allowed/i.test(error?.message ?? ""))
    return { ok: false, message: "There's no account for that email." };
  if (error?.status === 429) return { ok: false, message: "Too many links requested. Try again in a few minutes." };
  if (error) return { ok: false, message: `Couldn't send the link: ${error.message}` };
  return { ok: true, message: `Link sent to ${email}. Check your inbox (and spam).` };
}
