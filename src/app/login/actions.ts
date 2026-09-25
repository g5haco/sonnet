"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type LoginState = { ok: boolean; message: string } | null;

// Google: Supabase sends the student to Google, then back to /auth/confirm with a code (the provider has to be
// turned on in Supabase → Authentication → Providers).
export async function google() {
  const origin = (await headers()).get("origin");
  const { data, error } = await (await createClient()).auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/confirm` },
  });
  redirect(error || !data.url ? "/login?google=0" : data.url);
}

// A new account: name, email, password. Supabase emails a confirmation link that lands on /auth/confirm.
export async function signUp(_: LoginState, form: FormData): Promise<LoginState> {
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email.includes("@")) return { ok: false, message: "That doesn't look like an email address." };
  if (password.length < 8) return { ok: false, message: "Use at least 8 characters for your password." };
  const origin = (await headers()).get("origin");
  const { data, error } = await (await createClient()).auth.signUp({
    email,
    password,
    options: { data: { name }, emailRedirectTo: `${origin}/auth/confirm` },
  });
  if (error?.status === 429) return { ok: false, message: "Too many attempts. Try again in a few minutes." };
  if (error) return { ok: false, message: `Couldn't create the account: ${error.message}` };
  if (data.session) redirect("/"); // email confirmation is off: straight in
  return { ok: true, message: `Almost there. Confirm the link we sent to ${email}.` };
}

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
    // Links are for existing accounts; new ones sign up with a password or Google.
    options: { emailRedirectTo: `${origin}/auth/confirm`, shouldCreateUser: false },
  });
  if (error?.code === "otp_disabled" || /signups not allowed/i.test(error?.message ?? ""))
    return { ok: false, message: "There's no account for that email." };
  if (error?.status === 429) return { ok: false, message: "Too many links requested. Try again in a few minutes." };
  if (error) return { ok: false, message: `Couldn't send the link: ${error.message}` };
  return { ok: true, message: `Link sent to ${email}. Check your inbox (and spam).` };
}
