"use client";

import {
  BookOpen,
  CalendarClock,
  CalendarDays,
  ChartNoAxesColumn,
  Grid3x3,
  GraduationCap,
  ListTodo,
  Plus,
  RotateCcw,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { saveHomeLayout } from "@/app/actions";
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
import { FocusBlock } from "@/components/focus";
import { GooeyMenu, type MenuItem } from "@/components/gooey-menu";
import { Button } from "@/components/ui/button";
import { DraggableWidgetGrid, SPANS, type WidgetItem, type WidgetSize } from "@/components/ui/draggable-widget-grid";
import type { FocusSession } from "@/lib/focus";
import { DEFAULT_LAYOUT, WIDGETS, type Layout, type WidgetId } from "@/lib/home";
import { endOfWeek, progress, type Item } from "@/lib/progress";

export type Term = { start: string; weeks: number }; // start = YYYY-MM-DD (local)
type Course = { id: string; code: string; name: string; hue: number; grade?: number | null };

const ICONS: Record<WidgetId, typeof Plus> = {
  progress: ChartNoAxesColumn,
  next: ListTodo,
  exam: CalendarClock,
  week: CalendarDays,
  courses: BookOpen,
  grades: GraduationCap,
  focus: Grid3x3,
};

export function Dashboard({
  term,
  courses,
  items,
  cards,
  sessions,
  name,
  layout: saved = DEFAULT_LAYOUT,
}: {
  name: string;
  layout?: Layout;
  term: Term | null;
  courses: Course[];
  items: Item[];
  cards: CourseCard[];
  sessions: FocusSession[];
}) {
  const [now] = useState(() => Date.now()); // one clock per render tree
  const { shown, checked, toggle: flipItem, remove } = useWork(items);
  const create = useCreate();
  const openSettings = useOpenSettings();
  // Home is a widget grid you arrange in edit mode; Done saves the layout to settings.home_layout.
  const [layout, setLayout] = useState(saved);
  const [lastSaved, setLastSaved] = useState(saved);
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [saving, startSave] = useTransition();

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

  const view: Record<WidgetId, ReactNode> = {
    progress: <ProgressBlock items={shown} now={now} termStart={termStart} weeks={term.weeks} />,
    next: (
      <UpNext
        items={shown}
        now={now}
        checked={checked}
        onToggle={toggle}
        onDelete={remove}
        onAddCourse={courses.length ? undefined : () => create("course")}
      />
    ),
    exam: <ExamRing items={shown} now={now} />,
    week: <WeekStrip items={shown} now={now} />,
    courses: (
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
        <div className="grid flex-1 place-items-center">
        {cards.length === 0 ? (
          <p className="text-sm text-muted-foreground">Your courses will spin here once you add one.</p>
        ) : (
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
        )}
        </div>
      </Block>
    ),
    grades: (
      <Block
        title="Grades"
        aside={courses.some((c) => c.grade != null) ? "from Canvas" : "with Canvas sync"}
        className="@container"
      >
        {courses.length === 0 ? (
          <p className="text-sm text-muted-foreground">Your courses will line up here.</p>
        ) : (
          <ul className="-my-2 grid divide-y divide-border @xl:grid-cols-2 @xl:gap-x-8 @xl:divide-y-0">
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
    ),
    focus: <FocusBlock sessions={sessions} now={now} />,
  };
  const items_: WidgetItem[] = layout.map((w) => ({ ...w, label: WIDGETS[w.id].label }));
  const missing: MenuItem<WidgetId>[] = (Object.keys(WIDGETS) as WidgetId[])
    .filter((id) => !layout.some((w) => w.id === id))
    .map((id) => ({ kind: id, label: WIDGETS[id].label, icon: ICONS[id] }));

  const finish = () => {
    setEditing(false);
    setAdding(false);
    if (JSON.stringify(layout) === JSON.stringify(lastSaved)) return;
    startSave(async () => {
      const r = await saveHomeLayout(layout);
      if (r.error) return void toast.error(r.error);
      setLastSaved(layout);
    });
  };

  return (
    <main className="@container mx-auto w-full max-w-6xl px-4 pt-5 pb-24 md:px-6 md:pt-7">
      <header className="mb-6 flex flex-wrap items-start gap-x-4 gap-y-3">
        <div className="min-w-0 flex-1 basis-72">
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
        </div>
        <div className="ml-auto flex items-center gap-2">
          {editing ? (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setLayout(DEFAULT_LAYOUT)}
                className="h-10 gap-2 rounded-full px-4 text-muted-foreground"
              >
                <RotateCcw aria-hidden="true" />
                Reset
              </Button>
              {missing.length > 0 && (
                <GooeyMenu
                  direction="down"
                  label="Add widget"
                  items={missing}
                  open={adding}
                  onOpenChange={setAdding}
                  onPick={(id) => setLayout((l) => [...l, { id, size: DEFAULT_LAYOUT.find((w) => w.id === id)!.size }])}
                />
              )}
              <Button id="home-done" type="button" onClick={finish} className="h-10 rounded-full px-5 active:scale-[0.97]">
                Done
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="secondary"
              disabled={saving}
              onClick={() => setEditing(true)}
              className="h-10 rounded-full px-5 active:scale-[0.97]"
            >
              {saving ? "Saving…" : "Edit"}
            </Button>
          )}
        </div>
      </header>

      <DraggableWidgetGrid
        items={items_}
        editable={editing}
        rowHeight={320}
        onChange={(next) => setLayout(next.map(({ id, size }) => ({ id: id as WidgetId, size })))}
        renderItem={(w) => view[w.id as WidgetId]}
        controls={(w, columns) => (
          <>
            <button
              type="button"
              aria-label={`Remove ${w.label}`}
              onClick={() => {
                setLayout((l) => l.filter((x) => x.id !== w.id));
                document.getElementById("home-done")?.focus(); // the button is about to disappear
              }}
              className="absolute -top-2.5 -left-2.5 z-10 grid size-8 place-items-center rounded-full bg-foreground text-background shadow-sm transition-transform outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-90"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
            {columns > 1 && WIDGETS[w.id as WidgetId].sizes.length > 1 && (
              <div
                role="group"
                aria-label={`${w.label} size`}
                className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-0.5 rounded-full bg-popover p-1 shadow-sm ring-1 ring-foreground/10"
              >
                {(WIDGETS[w.id as WidgetId].sizes as WidgetSize[]).map((size) => (
                  <button
                    key={size}
                    type="button"
                    aria-pressed={w.size === size}
                    onClick={() => setLayout((l) => l.map((x) => (x.id === w.id ? { ...x, size } : x)))}
                    className="h-7 rounded-full px-2 font-mono text-xs tabular-nums text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring aria-pressed:bg-foreground aria-pressed:text-background"
                  >
                    {SPANS[size].col}×{SPANS[size].row}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      />
      {layout.length === 0 && !editing && (
        <p className="rounded-2xl border border-dashed border-foreground/15 p-6 text-sm text-muted-foreground">
          Home is empty. Press Edit to add widgets back.
        </p>
      )}
    </main>
  );
}
