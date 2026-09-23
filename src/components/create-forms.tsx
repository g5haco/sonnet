"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createCourse, createItem, saveTerm } from "@/app/actions";
import { Block } from "@/components/block";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { courseColor, dayKey } from "@/lib/course";
import type { Item } from "@/lib/progress";

export const field =
  "h-11 w-full rounded-full bg-secondary px-4 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm";
export const label = "text-sm font-medium";

// Runs a server action from a form; closes/continues on success, shows the error otherwise.
export function useSubmit(action: (f: FormData) => Promise<{ error?: string }>, onDone: () => void) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const submit = (f: FormData) =>
    start(async () => {
      const r = await action(f);
      setError(r.error ?? "");
      if (!r.error) onDone();
    });
  return { pending, error, submit };
}

export function Submit({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <Button type="submit" disabled={pending} className="mt-2 h-11 rounded-full transition-transform active:scale-[0.97]">
      {pending ? "Saving…" : children}
    </Button>
  );
}

export function FormError({ text }: { text: string }) {
  return (
    <p role="alert" className="min-h-5 text-sm text-destructive">
      {text}
    </p>
  );
}

// First run: the progress bars need to know when week 1 was.
export function TermSetup() {
  const { pending, error, submit } = useSubmit(saveTerm, () => toast.success("Semester set. Now add a course."));
  return (
    <Block className="mx-auto mt-[12vh] w-full max-w-sm">
      <h1 className="text-2xl font-medium tracking-tight">When did your semester start?</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">So the weekly bars line up with your real weeks.</p>
      <form action={submit} className="flex flex-col gap-2">
        <label htmlFor="start" className={label}>
          First day of classes
        </label>
        <input id="start" name="start" type="date" required className={field} />
        <label htmlFor="weeks" className={`${label} mt-2`}>
          Weeks in the semester
        </label>
        <input id="weeks" name="weeks" type="number" min={1} max={30} defaultValue={16} required className={field} />
        <Submit pending={pending}>Start the semester</Submit>
        <FormError text={error} />
      </form>
    </Block>
  );
}

export function CourseDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { pending, error, submit } = useSubmit(createCourse, () => {
    onOpenChange(false);
    toast.success("Course added.");
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add a course</DialogTitle>
          <DialogDescription>It gets its own color everywhere.</DialogDescription>
        </DialogHeader>
        <form action={submit} className="flex flex-col gap-2">
          <label htmlFor="code" className={label}>
            Course code
          </label>
          <input id="code" name="code" required maxLength={40} placeholder="CHEM 1210" className={field} />
          <label htmlFor="name" className={`${label} mt-2`}>
            Name <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input id="name" name="name" maxLength={120} placeholder="General Chemistry I" className={field} />
          <Submit pending={pending}>Add course</Submit>
          <FormError text={error} />
        </form>
      </DialogContent>
    </Dialog>
  );
}

type Course = { id: string; code: string; hue: number };

export function ItemDialog({
  kind,
  courses,
  now,
  onOpenChange,
}: {
  kind: Item["kind"] | null; // null = closed
  courses: Course[];
  now: number;
  onOpenChange: (o: boolean) => void;
}) {
  const { pending, error, submit } = useSubmit(createItem, () => {
    onOpenChange(false);
    toast.success(kind === "exam" ? "Exam added. It's on the countdown." : "Added to Up next.");
  });
  // Default: tomorrow at 11:59pm, the most common deadline there is.
  const tomorrow = `${dayKey(new Date(now + 864e5))}T23:59`;

  return (
    <Dialog open={kind !== null} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{kind === "exam" ? "Add an exam" : "Add an assignment"}</DialogTitle>
          <DialogDescription>Shows up in Up next and your weekly progress.</DialogDescription>
        </DialogHeader>
        <form
          // datetime-local has no timezone; convert here, where the local timezone is known
          action={(f) => {
            f.set("due", new Date(String(f.get("due"))).toISOString());
            submit(f);
          }}
          className="flex flex-col gap-2"
        >
          <label htmlFor="title" className={label}>
            Title
          </label>
          <input
            id="title"
            name="title"
            required
            maxLength={200}
            placeholder={kind === "exam" ? "Midterm 1" : "Problem Set 3"}
            className={field}
          />
          <fieldset className="mt-2 flex flex-col gap-2">
            <legend className={`${label} mb-2`}>Course</legend>
            <div className="flex flex-wrap gap-2">
              {courses.map((c, i) => (
                <label
                  key={c.id}
                  className="flex h-9 cursor-pointer items-center gap-2 rounded-full bg-secondary px-3 font-mono text-xs has-checked:ring-2 has-checked:ring-ring has-focus-visible:ring-2 has-focus-visible:ring-ring"
                >
                  <input type="radio" name="course" value={c.id} defaultChecked={i === 0} required className="sr-only" />
                  <span className="size-2 rounded-full" style={{ background: courseColor(c.hue) }} />
                  {c.code}
                </label>
              ))}
            </div>
          </fieldset>
          {kind !== "exam" && (
            <>
              <label htmlFor="kind" className={`${label} mt-2`}>
                Type
              </label>
              <select id="kind" name="kind" defaultValue="assignment" className={field}>
                <option value="assignment">Assignment</option>
                <option value="quiz">Quiz</option>
                <option value="reading">Reading</option>
              </select>
            </>
          )}
          {kind === "exam" && <input type="hidden" name="kind" value="exam" />}
          <label htmlFor="due" className={`${label} mt-2`}>
            Due
          </label>
          <input id="due" name="due" type="datetime-local" required defaultValue={tomorrow} className={field} />
          <Submit pending={pending}>{kind === "exam" ? "Add exam" : "Add"}</Submit>
          <FormError text={error} />
        </form>
      </DialogContent>
    </Dialog>
  );
}
