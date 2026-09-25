"use client";

import { Calculator, CalendarClock, FilePlus2, FileUp, Plus, Settings2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createMeeting, deleteCourse, deleteMeeting, updateCourse } from "@/app/actions";
import { useCreate } from "@/components/app-shell";
import { Block } from "@/components/block";
import { CourseFace, courseStats, type CourseCard } from "@/components/course-card";
import { field, FormError, label, useSubmit } from "@/components/create-forms";
import { GooeyMenu, type MenuItem } from "@/components/gooey-menu";
import { Materials, type Material } from "@/components/materials";
import { TiltCard } from "@/components/tilt-card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { UpNext, useWork } from "@/components/up-next";
import type { ClassMeeting, Term } from "@/lib/calendar";
import { courseColor, gradeLabel, HUES, meetingLabel, needOnFinal, WEEKDAYS } from "@/lib/course";
import { progress, type Item } from "@/lib/progress";
import { cn } from "@/lib/utils";

// All courses as tilt cards. A card opens its course; the last tile adds one.
export function CoursesGrid({ courses }: { courses: CourseCard[] }) {
  const [now] = useState(() => Date.now());
  const create = useCreate();
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pt-5 pb-24 md:px-6 md:pt-7">
      <header className="mb-6">
        <h1 className="text-2xl font-medium tracking-tight">Courses</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {courses.length === 0
            ? "Add your first course. Assignments, exams and class times hang off it."
            : "Open one to see its work, class times and materials, or to change its name and color."}
        </p>
      </header>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(13rem,1fr))] gap-6">
        {courses.map((c) => (
          <li key={c.id}>
            <TiltCard href={`/courses/${c.id}`} label={`${c.code}${c.name ? `, ${c.name}` : ""}`}>
              <CourseFace course={c} now={now} />
            </TiltCard>
          </li>
        ))}
        <li>
          <button
            type="button"
            onClick={() => create("course")}
            className="flex aspect-[13/16] w-full flex-col items-center justify-center gap-2 rounded-[20px] border border-dashed border-foreground/20 text-sm text-muted-foreground transition-colors outline-none hover:border-foreground/40 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99]"
          >
            <Plus className="size-6" aria-hidden="true" />
            Add a course
          </button>
        </li>
      </ul>
    </main>
  );
}

const ADD: MenuItem<"assignment" | "exam" | "upload">[] = [
  { kind: "assignment", label: "Assignment", icon: FilePlus2 },
  { kind: "exam", label: "Exam", icon: CalendarClock },
  { kind: "upload", label: "Materials", icon: FileUp },
];

// One course: its work, class times, and its name and color.
export function CourseView({
  course,
  items,
  meetings,
  materials,
  term,
}: {
  course: { id: string; code: string; name: string; hue: number; grade?: number | null };
  items: Item[];
  meetings: ClassMeeting[];
  materials: Material[];
  term: Term | null;
}) {
  const [now] = useState(() => Date.now());
  const [adding, setAdding] = useState(false);
  const create = useCreate();
  const { shown, checked, toggle, remove } = useWork(items);
  const s = courseStats(shown, meetings, now);
  const percent = term && progress(shown, new Date(`${term.start}T00:00:00`), term.weeks, new Date(now)).percent;

  return (
    <main className="@container mx-auto w-full max-w-6xl px-4 pt-5 pb-24 md:px-6 md:pt-7">
      <Link href="/courses" className="font-mono text-xs text-muted-foreground hover:text-foreground">
        ← courses
      </Link>
      <header className="mt-3 mb-5 flex flex-wrap items-start gap-3">
        <span className="mt-2.5 size-3 shrink-0 rounded-full" style={{ background: courseColor(course.hue) }} />
        <div className="min-w-0 flex-1 basis-56">
          <h1 className="font-mono text-2xl font-medium tracking-tight">{course.code}</h1>
          {course.name && <p className="text-sm text-muted-foreground">{course.name}</p>}
          <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-xs text-muted-foreground">
            {course.grade != null && <span>grade {gradeLabel(course.grade)}</span>}
            {percent !== null && <span>{percent}% of work due by Sunday done</span>}
            <span>{s.week === 0 ? "nothing due this week" : `${s.week} due this week`}</span>
            {s.late > 0 && <span className="text-destructive">{s.late} late</span>}
            {s.examIn && <span>exam in {s.examIn}d</span>}
            {s.nextClass && <span>next class {s.nextClass}</span>}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Popover>
            <PopoverTrigger
              render={<Button variant="secondary" className="h-10 gap-2 rounded-full px-4 active:scale-[0.97]" />}
            >
              <Calculator aria-hidden="true" />
              What if
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 gap-4 rounded-2xl p-4">
              <PopoverHeader>
                <PopoverTitle>What do I need on the final?</PopoverTitle>
                <PopoverDescription>
                  {course.grade != null ? "Starts from your Canvas grade." : "Type your current grade to start."}
                </PopoverDescription>
              </PopoverHeader>
              <WhatIf grade={course.grade ?? null} />
            </PopoverContent>
          </Popover>
          <CourseSettings course={course} items={items.length} />
          <GooeyMenu
            direction="down"
            label="Add"
            tone="primary"
            items={ADD}
            open={adding}
            onOpenChange={setAdding}
            onPick={(kind) => create(kind, undefined, course.id)}
          />
        </div>
      </header>

      <div className="flex flex-col gap-3 @3xl:flex-row @3xl:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <UpNext
            title="Work"
            limit={100}
            items={shown}
            now={now}
            checked={checked}
            onToggle={toggle}
            onDelete={remove}
            empty={`Nothing for ${course.code} yet. Add an assignment or exam with Add.`}
          />
          <Materials course={course} materials={materials} />
        </div>
        <div className="flex flex-col gap-3 @3xl:w-80 @3xl:shrink-0">
          <Block title="Class times">
            <ClassTimes course={course} meetings={meetings} />
          </Block>
        </div>
      </div>
    </main>
  );
}

// "What do I need on the final?": the current grade (Canvas's, or typed in), a goal and the final's weight.
function WhatIf({ grade }: { grade: number | null }) {
  const [current, setCurrent] = useState(grade == null ? "" : gradeLabel(grade).slice(0, -1));
  const [target, setTarget] = useState("90");
  const [weight, setWeight] = useState("20");
  const [c, t, w] = [current, target, weight].map(Number);
  const need = current && target && w > 0 && w <= 100 ? needOnFinal(c, t, w) : null;
  const input = (id: string, text: string, value: string, set: (v: string) => void) => (
    <label htmlFor={id} className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{text}</span>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min={0}
        step="any"
        value={value}
        onChange={(e) => set(e.target.value)}
        className={cn(field, "h-10 px-3 font-mono tabular-nums")}
      />
    </label>
  );
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        {input("wi-current", "Now %", current, setCurrent)}
        {input("wi-target", "Goal %", target, setTarget)}
        {input("wi-weight", "Final %", weight, setWeight)}
      </div>
      <p className="text-sm" aria-live="polite">
        {need === null ? (
          <span className="text-muted-foreground">
            {current ? "Enter the final's weight (1–100%)." : "Enter your current grade to see what the final needs."}
          </span>
        ) : need <= 0 ? (
          <>You&apos;re set: even a 0 on the final keeps {t}%.</>
        ) : need > 100 ? (
          <span className="text-destructive">
            You&apos;d need {Math.ceil(need)}% on the final. {t}% is out of reach this way.
          </span>
        ) : (
          <>
            You need <span className="font-mono font-medium">{Math.ceil(need)}%</span> on the final for {t}%.
          </>
        )}
      </p>
    </div>
  );
}

// Weekly class times; the calendar and the assistant read these.
function ClassTimes({ course, meetings }: { course: { id: string; code: string }; meetings: ClassMeeting[] }) {
  const [adding, setAdding] = useState(false);
  const [removing, startRemove] = useTransition();
  const { pending, error, submit } = useSubmit(createMeeting, () => {
    setAdding(false);
    toast.success(`Class time added to ${course.code}.`);
  });
  const sorted = [...meetings].sort((a, b) => a.starts.localeCompare(b.starts));

  return (
    <div className="flex flex-col gap-1">
      {sorted.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground">When does it meet? The calendar and the assistant use this.</p>
      )}
      {sorted.map((m) => (
        <div key={m.id} className="flex items-center justify-between gap-2 text-sm">
          <span className="font-mono tabular-nums">{meetingLabel(m)}</span>
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
        <form autoComplete="off" action={submit} className="mt-2 flex flex-col gap-2">
          <input type="hidden" name="course" value={course.id} />
          <fieldset className="flex flex-wrap gap-1">
            <legend className="sr-only">Days</legend>
            {[1, 2, 3, 4, 5, 6, 0].map((d) => (
              <label
                key={d}
                className="grid h-9 w-9 cursor-pointer place-items-center rounded-full bg-secondary font-mono text-xs select-none has-checked:bg-foreground has-checked:text-background has-focus-visible:ring-2 has-focus-visible:ring-ring"
              >
                <input type="checkbox" name="day" value={d} className="sr-only" />
                {WEEKDAYS[d].slice(0, 2)}
              </label>
            ))}
          </fieldset>
          <div className="flex gap-2">
            <label className="sr-only" htmlFor="starts">
              Starts
            </label>
            <input id="starts" name="starts" type="time" required className={cn(field, "min-w-0")} />
            <label className="sr-only" htmlFor="ends">
              Ends
            </label>
            <input id="ends" name="ends" type="time" required className={cn(field, "min-w-0")} />
          </div>
          <label className="sr-only" htmlFor="room">
            Room
          </label>
          <input id="room" name="location" maxLength={80} placeholder="Room (optional)" className={field} />
          <div className="flex gap-2">
            <Button type="submit" disabled={pending} className="h-10 flex-1 rounded-full">
              {pending ? "Adding…" : "Add"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setAdding(false)} className="h-10 rounded-full px-4">
              Cancel
            </Button>
          </div>
          <FormError text={error} />
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

// A settings button whose dialog edits name, code and color. Deleting takes a second, explicit click
// because it takes the course's work with it.
function CourseSettings({
  course,
  items,
}: {
  course: { id: string; code: string; name: string; hue: number };
  items: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { pending, error, submit } = useSubmit(updateCourse, () => {
    setOpen(false);
    toast.success(`${course.code} saved.`);
  });
  const [confirming, setConfirming] = useState(false);
  const [deleting, startDelete] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="secondary"
        aria-label="Course settings"
        title="Course settings"
        onClick={() => setOpen(true)}
        className="size-10 rounded-full active:scale-[0.95]"
      >
        <Settings2 aria-hidden="true" />
      </Button>
      <DialogContent className="rounded-2xl sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Course settings</DialogTitle>
          <DialogDescription>How {course.code} shows up everywhere in Sonnet.</DialogDescription>
        </DialogHeader>
        <form autoComplete="off" action={submit} className="flex flex-col gap-2">
          <input type="hidden" name="id" value={course.id} />
          <label htmlFor="code" className={label}>
            Code
          </label>
          <input
            id="code"
            name="code"
            required
            maxLength={40}
            defaultValue={course.code}
            className={cn(field, "font-mono")}
          />
          <label htmlFor="name" className={cn(label, "mt-2")}>
            Name <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input id="name" name="name" maxLength={120} defaultValue={course.name} className={field} />
          <fieldset className="mt-2">
            <legend className={cn(label, "mb-2")}>Color</legend>
            <div className="flex flex-wrap gap-2">
              {HUES.map((h) => (
                <label
                  key={h}
                  className="grid size-9 cursor-pointer place-items-center rounded-full has-checked:ring-2 has-checked:ring-foreground has-focus-visible:ring-2 has-focus-visible:ring-ring"
                >
                  <input type="radio" name="hue" value={h} defaultChecked={h === course.hue} className="sr-only" />
                  <span className="size-6 rounded-full" style={{ background: courseColor(h) }} />
                  <span className="sr-only">Hue {h}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="submit" disabled={pending} className="h-10 rounded-full px-5 active:scale-[0.97]">
              {pending ? "Saving…" : "Save"}
            </Button>
            {confirming ? (
              <Button
                type="button"
                variant="destructive"
                disabled={deleting}
                onClick={() =>
                  startDelete(async () => {
                    const r = await deleteCourse(course.id);
                    if (r.error) return void toast.error(r.error);
                    toast(`Deleted ${course.code}.`);
                    router.push("/courses");
                  })
                }
                onBlur={() => setConfirming(false)}
                autoFocus
                className="h-10 rounded-full px-4"
              >
                {deleting ? "Deleting…" : `Delete it and ${items} item${items === 1 ? "" : "s"}`}
              </Button>
            ) : (
              <Button type="button" variant="ghost" onClick={() => setConfirming(true)} className="h-10 rounded-full px-4">
                Delete course
              </Button>
            )}
          </div>
          <FormError text={error} />
        </form>
      </DialogContent>
    </Dialog>
  );
}
