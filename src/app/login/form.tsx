"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { google, signIn, signUp } from "./actions";

const field =
  "h-11 rounded-full bg-secondary px-4 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm";

// Google's "G", in its own colors (their brand rules want it that way on a sign-in button).
const G = (
  <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8Z" />
    <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24Z" />
    <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1Z" />
    <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9Z" />
  </svg>
);

export function LoginForm({ mode, note: initial }: { mode: "in" | "up"; note: string | null }) {
  const [state, action, pending] = useActionState(mode === "up" ? signUp : signIn, null);
  const note = state ?? (initial ? { ok: false, message: initial } : null);

  return (
    <div className="flex flex-col gap-4">
      <form action={google}>
        <Button
          type="submit"
          variant="secondary"
          className="h-11 w-full gap-2.5 rounded-full transition-transform active:scale-[0.97]"
        >
          {G}
          Continue with Google
        </Button>
      </form>

      <p className="flex items-center gap-3 font-mono text-xs text-muted-foreground" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        or with email
        <span className="h-px flex-1 bg-border" />
      </p>

      <form action={action} className="flex flex-col gap-2">
        {mode === "up" && (
          <>
            <label htmlFor="name" className="text-sm font-medium">
              Name <span className="font-normal text-muted-foreground">(for the greeting)</span>
            </label>
            <input id="name" name="name" autoComplete="given-name" maxLength={60} className={cn(field, "mb-2")} />
          </>
        )}
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          aria-describedby="login-note"
          className={field}
        />
        <label htmlFor="password" className="mt-2 text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required={mode === "up"}
          minLength={mode === "up" ? 8 : undefined}
          autoComplete={mode === "up" ? "new-password" : "current-password"}
          className={field}
        />
        <Button
          type="submit"
          name="intent"
          value="password"
          disabled={pending}
          className="mt-3 h-11 rounded-full transition-transform active:scale-[0.97]"
        >
          {pending ? "One sec…" : mode === "up" ? "Create account" : "Sign in"}
        </Button>
        {mode === "in" && (
          <Button type="submit" name="intent" value="link" variant="ghost" disabled={pending} className="h-11 rounded-full">
            Email me a link instead
          </Button>
        )}
        <p id="login-note" role="status" className={cn("min-h-5 text-sm", note?.ok ? "text-done" : "text-destructive")}>
          {note?.message}
        </p>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {mode === "up" ? "Already have an account? " : "New here? "}
        <Link
          href={mode === "up" ? "/login" : "/login?mode=signup"}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          {mode === "up" ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}
