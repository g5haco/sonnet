"use client";

import { useTheme } from "next-themes";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteCourse, saveTerm, signOut, updateCourse } from "@/app/actions";
import { field, FormError, label, Submit, useSubmit } from "@/components/create-forms";
import { ThemeSwitcher } from "@/components/kibo-ui/theme-switcher";
import { Button } from "@/components/ui/button";
import { courseColor } from "@/lib/course";
import { cn } from "@/lib/utils";

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

type Course = { id: string; code: string; name: string; hue: number; items: number };

export function CourseRow({ course }: { course: Course }) {
  const { pending, error, submit } = useSubmit(updateCourse, () => toast.success(`${course.code} saved.`));
  const [confirming, setConfirming] = useState(false);
  const [deleting, startDelete] = useTransition();

  return (
    <li className="py-3">
      <form action={submit} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="id" value={course.id} />
        <span className="size-3 shrink-0 rounded-full" style={{ background: courseColor(course.hue) }} aria-hidden="true" />
        <label className="sr-only" htmlFor={`code-${course.id}`}>
          Course code
        </label>
        <input
          id={`code-${course.id}`}
          name="code"
          required
          maxLength={40}
          defaultValue={course.code}
          className={cn(field, "w-32 font-mono")}
        />
        <label className="sr-only" htmlFor={`name-${course.id}`}>
          Course name
        </label>
        <input
          id={`name-${course.id}`}
          name="name"
          maxLength={120}
          defaultValue={course.name}
          placeholder="Name (optional)"
          className={cn(field, "w-auto min-w-40 flex-1")}
        />
        <Button type="submit" variant="secondary" disabled={pending} className="h-11 rounded-full px-4">
          {pending ? "Saving…" : "Save"}
        </Button>
        {confirming ? (
          // Deleting a course deletes its items too, so it takes a second, explicit click.
          <Button
            type="button"
            variant="destructive"
            disabled={deleting}
            onClick={() =>
              startDelete(async () => {
                const r = await deleteCourse(course.id);
                if (r.error) toast.error(r.error);
                else toast(`Deleted ${course.code}.`);
              })
            }
            onBlur={() => setConfirming(false)}
            autoFocus
            className="h-11 rounded-full px-4"
          >
            {deleting ? "Deleting…" : `Delete it and ${course.items} item${course.items === 1 ? "" : "s"}`}
          </Button>
        ) : (
          <Button type="button" variant="ghost" onClick={() => setConfirming(true)} className="h-11 rounded-full px-4">
            Delete
          </Button>
        )}
      </form>
      <FormError text={error} />
    </li>
  );
}

export function Appearance() {
  const { theme, setTheme } = useTheme();
  return (
    <ThemeSwitcher
      value={(theme as "light" | "dark" | "system") ?? "system"}
      onChange={setTheme}
      className="w-fit"
    />
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
