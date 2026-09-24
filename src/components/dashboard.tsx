"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useCreate, useOpenSettings } from "@/components/app-shell";
import { Block } from "@/components/block";
import { Carousel } from "@/components/carousel";
import { CourseFace, type CourseCard } from "@/components/course-card";
import { TermSetup } from "@/components/create-forms";
import { ExamRing } from "@/components/exam-ring";
import { ProgressBlock } from "@/components/progress-block";
import { UpNext, useWork } from "@/components/up-next";
import { WeekStrip } from "@/components/week-strip";
import { courseColor, gradeLabel } from "@/lib/course";
import { cn } from "@/lib/utils";
import { endOfWeek, progress, type Item } from "@/lib/progress";

export type Term = { start: string; weeks: number }; // start = YYYY-MM-DD (local)
type Course = { id: string; code: string; name: string; hue: number; grade?: number | null };

export function Dashboard({
  term,
  courses,
  items,
  cards,
  name,
}: {
  name: string;
  term: Term | null;
  courses: Course[];
  items: Item[];
  cards: CourseCard[];
}) {
  const [now] = useState(() => Date.now()); // one clock per render tree
  const { shown, checked, toggle: flipItem, remove } = useWork(items);
  const create = useCreate();
  const openSettings = useOpenSettings();

  if (!term) return <TermSetup />;
  const termStart = new Date(`${term.start}T00:00:00`);

  // Checking off the last thing due this week earns the "week cleared" moment.
  const toggle = (id: string) => {
    const next = flipItem(id);
    const p = progress(next, termStart, term.weeks, new Date(now));
    const week = p.bars[p.current];
    if (next.find((i) => i.id === id)?.doneAt && week?.total && week.done === week.total)
      toast.success("Week cleared. Go outside.");
  };

  const date = new Date(now);
  const today = date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const week = Math.min(Math.max(Math.floor((now - termStart.getTime()) / (7 * 864e5)) + 1, 1), term.weeks);
  const hour = date.getHours();
  // A few ways to say hello per time of day, one per date (so it doesn't change on every visit), with your name.
  const n = name.trim().split(/\s+/)[0];
  const hellos =
    hour < 5
      ? [`Up late${n && `, ${n}`}.`, `Still up${n && `, ${n}`}?`]
      : hour < 12
        ? [`Morning${n && `, ${n}`}.`, `Ready to get to work${n && `, ${n}`}?`, `Fresh start${n && `, ${n}`}.`]
        : hour < 18
          ? [`Afternoon${n && `, ${n}`}.`, `Keep it rolling${n && `, ${n}`}.`, `Halfway there${n && `, ${n}`}.`]
          : [`Evening${n && `, ${n}`}.`, `One more push${n && `, ${n}`}?`, `Wind-down time${n && `, ${n}`}.`];
  const greeting = hellos[Math.floor((now - termStart.getTime()) / 864e5) % hellos.length] ?? hellos[0];

  // The one-line situation report under the greeting.
  const open = shown.filter((i) => !i.doneAt);
  const dueThisWeek = open.filter((i) => Date.parse(i.due) >= now && Date.parse(i.due) <= endOfWeek(now)).length;
  const overdue = open.filter((i) => Date.parse(i.due) < now).length;
  const nextExam = open
    .filter((i) => i.kind === "exam" && Date.parse(i.due) > now)
    .sort((a, b) => Date.parse(a.due) - Date.parse(b.due))[0];
  const examIn = nextExam && Math.ceil((Date.parse(nextExam.due) - now) / 864e5);

  return (
    <main className="@container mx-auto w-full max-w-6xl px-4 pt-5 pb-24 md:px-6 md:pt-7">
      <header className="mb-6">
        <h1 className="text-3xl font-medium tracking-tight text-balance md:text-4xl">{greeting}</h1>
        <p className="mt-1.5 text-base text-muted-foreground">
          {today} · week {week} of {term.weeks}
          {/* A 1-week semester is almost always a typo, and it flattens every weekly readout. */}
          {term.weeks <= 2 && (
            <>
              {" · "}
              <button
                type="button"
                onClick={() => openSettings("semester")}
                className="text-foreground underline underline-offset-4 hover:text-brand"
              >
                set your real semester length
              </button>
            </>
          )}
        </p>
        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-sm text-muted-foreground">
          <span>{dueThisWeek === 0 ? "nothing due this week" : `${dueThisWeek} due this week`}</span>
          {overdue > 0 && <span className="text-destructive">{overdue} overdue</span>}
          {nextExam && (
            <span>
              {nextExam.course} exam in {examIn}d
            </span>
          )}
        </p>
      </header>

      {/* Two independent columns (not a grid), so no block is stretched to match its neighbour.
          Container queries: the layout reacts to the space left beside the assistant panel.
          Grades (one row per course, the block that grows) lives in the wide column, two-up, so many courses
          don't make the narrow column run on. Stacked on phones, the columns dissolve (`contents`) and
          order-1 sends the two placeholders below the live blocks. */}
      <div className="flex flex-col gap-3 @3xl:flex-row @3xl:items-start">
        <div className="contents min-w-0 flex-1 flex-col gap-3 @3xl:flex">
          <ProgressBlock items={shown} now={now} termStart={termStart} weeks={term.weeks} />
          <UpNext
            items={shown}
            now={now}
            checked={checked}
            onToggle={toggle}
            onDelete={remove}
            onAddCourse={courses.length ? undefined : () => create("course")}
          />
          <Block
            title="Grades"
            aside={courses.some((c) => c.grade != null) ? "from Canvas" : "with Canvas sync"}
            className="order-1"
          >
            {courses.length === 0 ? (
              <p className="text-sm text-muted-foreground">Your courses will line up here.</p>
            ) : (
              <ul className="-my-2 grid divide-y divide-border @4xl:grid-cols-2 @4xl:gap-x-8 @4xl:divide-y-0">
                {courses.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 py-2">
                    <span className="size-2 shrink-0 rounded-full" style={{ background: courseColor(c.hue) }} />
                    <span className="min-w-0 flex-1 truncate text-sm">
                      <span className="font-mono text-xs text-muted-foreground">{c.code}</span>
                      {c.name && <span className="ml-2">{c.name}</span>}
                    </span>
                    <span
                      className={cn("font-mono tabular-nums", c.grade == null && "text-muted-foreground")}
                      aria-label={c.grade == null ? "No grade yet" : undefined}
                    >
                      {gradeLabel(c.grade)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Block>
        </div>

        <div className="contents flex-col gap-3 @3xl:flex @3xl:w-80 @3xl:shrink-0">
          <ExamRing items={shown} now={now} />
          <WeekStrip items={shown} now={now} />
          {cards.length > 0 && (
            // Quick access to every course: spin the ring, tap a card to open it.
            <Block
              title="Courses"
              aside={
                <Link href="/courses" className="hover:text-foreground">
                  all courses →
                </Link>
              }
              className="overflow-hidden"
            >
              <Carousel
                label="Your courses"
                orbit={92}
                width={360}
                slides={cards.map((c) => ({
                  key: c.id,
                  href: `/courses/${c.id}`,
                  label: `${c.code}${c.name ? `, ${c.name}` : ""}`,
                  face: <CourseFace course={c} now={now} compact />,
                }))}
              />
            </Block>
          )}

          <Block title="Study days" aside="with the focus timer" className="order-1">
            <p className="text-sm text-muted-foreground">Your streak starts the first time you use the focus timer.</p>
          </Block>
        </div>
      </div>
    </main>
  );
}
