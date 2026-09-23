"use client";

import { useTheme } from "next-themes";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createMeeting, deleteCourse, deleteMeeting, saveTerm, signOut, updateCourse } from "@/app/actions";
import { field, FormError, label, Submit, useSubmit } from "@/components/create-forms";
import { ThemeSwitcher } from "@/components/kibo-ui/theme-switcher";
import { Button } from "@/components/ui/button";
import { courseColor, type Meeting, meetingLabel, WEEKDAYS } from "@/lib/course";
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

export function CourseRow({ course, meetings }: { course: Course; meetings: Meeting[] }) {
  const { pending, error, submit } = useSubmit(updateCourse, () => toast.success(`${course.code} saved.`));
  const [confirming, setConfirming] = useState(false);
  const [deleting, startDelete] = useTransition();

  return (
    <li className="py-3">
      <form action={submit} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="id" value={course.id} />
        <span
          className="size-3 shrink-0 rounded-full"
          style={{ background: courseColor(course.hue) }}
          aria-hidden="true"
        />
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
      <ClassTimes course={course} meetings={meetings} />
    </li>
  );
}

// Weekly class times for one course; the calendar and the assistant read these.
function ClassTimes({ course, meetings }: { course: Course; meetings: Meeting[] }) {
  const [adding, setAdding] = useState(false);
  const [removing, startRemove] = useTransition();
  const { pending, error, submit } = useSubmit(createMeeting, () => {
    setAdding(false);
    toast.success(`Class time added to ${course.code}.`);
  });
  const sorted = [...meetings].sort((a, b) => a.starts.localeCompare(b.starts));

  return (
    <div className="flex flex-col gap-1 pl-5">
      {sorted.map((m) => (
        <div key={m.id} className="flex items-center gap-2 text-sm">
          <span className="font-mono text-muted-foreground tabular-nums">{meetingLabel(m)}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={removing}
            aria-label={`Remove ${meetingLabel(m)}`}
            onClick={() =>
              startRemove(async () => {
                const r = await deleteMeeting(m.id);
                if (r.error) toast.error(r.error);
              })
            }
            className="rounded-full text-muted-foreground"
          >
            Remove
          </Button>
        </div>
      ))}
      {adding ? (
        <form action={submit} className="mt-1 flex flex-wrap items-center gap-2">
          <input type="hidden" name="course" value={course.id} />
          <fieldset className="flex gap-1">
            <legend className="sr-only">Days</legend>
            {[1, 2, 3, 4, 5, 6, 0].map((d) => (
              <label
                key={d}
                className="grid h-9 w-11 cursor-pointer place-items-center rounded-full bg-secondary font-mono text-xs select-none has-checked:bg-foreground has-checked:text-background has-focus-visible:ring-2 has-focus-visible:ring-ring"
              >
                <input type="checkbox" name="day" value={d} className="sr-only" />
                {WEEKDAYS[d]}
              </label>
            ))}
          </fieldset>
          <label className="sr-only" htmlFor={`starts-${course.id}`}>
            Starts
          </label>
          <input id={`starts-${course.id}`} name="starts" type="time" required className={cn(field, "w-32")} />
          <label className="sr-only" htmlFor={`ends-${course.id}`}>
            Ends
          </label>
          <input id={`ends-${course.id}`} name="ends" type="time" required className={cn(field, "w-32")} />
          <label className="sr-only" htmlFor={`room-${course.id}`}>
            Room
          </label>
          <input
            id={`room-${course.id}`}
            name="location"
            maxLength={80}
            placeholder="Room (optional)"
            className={cn(field, "w-auto min-w-32 flex-1")}
          />
          <Button type="submit" disabled={pending} className="h-11 rounded-full px-4">
            {pending ? "Adding…" : "Add"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setAdding(false)} className="h-11 rounded-full px-4">
            Cancel
          </Button>
          <div className="basis-full">
            <FormError text={error} />
          </div>
        </form>
      ) : (
        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setAdding(true)}
            className="-ml-2.5 rounded-full text-muted-foreground"
          >
            + Class time
          </Button>
        </div>
      )}
    </div>
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
