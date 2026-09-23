"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { signIn } from "./actions";

const field =
  "h-11 rounded-full bg-secondary px-4 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm";

export function LoginForm({ expired }: { expired: boolean }) {
  const [state, action, pending] = useActionState(signIn, null);
  const note = state ?? (expired ? { ok: false, message: "That link expired or was already used. Get a fresh one." } : null);

  return (
    <form action={action} className="flex flex-col gap-2">
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
      <input id="password" name="password" type="password" autoComplete="current-password" className={field} />
      <Button
        type="submit"
        name="intent"
        value="password"
        disabled={pending}
        className="mt-2 h-11 rounded-full transition-transform active:scale-[0.97]"
      >
        {pending ? "One sec…" : "Sign in"}
      </Button>
      <Button type="submit" name="intent" value="link" variant="ghost" disabled={pending} className="h-11 rounded-full">
        Email me a link instead
      </Button>
      <p
        id="login-note"
        role="status"
        className={cn("min-h-5 text-sm", note?.ok ? "text-done" : "text-destructive")}
      >
        {note?.message}
      </p>
    </form>
  );
}
