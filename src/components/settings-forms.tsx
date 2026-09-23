"use client";

import { useTheme } from "next-themes";
import { useTransition } from "react";
import { toast } from "sonner";
import { saveTerm, signOut } from "@/app/actions";
import { field, FormError, label, Submit, useSubmit } from "@/components/create-forms";
import { ThemeSwitcher } from "@/components/kibo-ui/theme-switcher";
import { Button } from "@/components/ui/button";

export function SemesterForm({ start, weeks }: { start: string; weeks: number }) {
  const { pending, error, submit } = useSubmit(saveTerm, () => toast.success("Semester saved."));
  return (
    <form action={submit} className="grid gap-2 sm:grid-cols-[1fr_8rem_auto] sm:items-end sm:gap-3">
      <div className="flex flex-col gap-2">
        <label htmlFor="start" className={label}>
          First day of classes
        </label>
        <input id="start" name="start" type="date" required defaultValue={start} className={field} />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="weeks" className={label}>
          Weeks
        </label>
        <input id="weeks" name="weeks" type="number" min={1} max={30} required defaultValue={weeks} className={field} />
      </div>
      <Submit pending={pending}>Save</Submit>
      <div className="sm:col-span-3">
        <FormError text={error} />
      </div>
    </form>
  );
}

export function Appearance() {
  const { theme, setTheme } = useTheme();
  return (
    <ThemeSwitcher value={(theme as "light" | "dark" | "system") ?? "system"} onChange={setTheme} className="w-fit" />
  );
}

export function SignOut() {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="secondary"
      disabled={pending}
      onClick={() => start(() => signOut())}
      className="h-11 rounded-full px-5 transition-transform active:scale-[0.97]"
    >
      {pending ? "Signing out…" : "Sign out"}
    </Button>
  );
}
