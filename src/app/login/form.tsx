"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { sendLink } from "./actions";

export function LoginForm({ expired }: { expired: boolean }) {
  const [state, action, pending] = useActionState(sendLink, null);
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
        className="h-11 rounded-full bg-secondary px-4 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
      />
      <Button type="submit" disabled={pending} className="mt-2 h-11 rounded-full transition-transform active:scale-[0.97]">
        {pending ? "Sending…" : "Email me a sign-in link"}
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
