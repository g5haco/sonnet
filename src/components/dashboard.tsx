"use client";

import { Plus, RotateCcw, X } from "lucide-react";
import Link from "next/link";
import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { saveHomeLayout } from "@/app/actions";
import { useCreate, useOpenSettings } from "@/components/app-shell";
import { Block } from "@/components/block";
import { Carousel } from "@/components/carousel";
import { CourseFace, type CourseCard } from "@/components/course-card";
import { Onboarding } from "@/components/onboarding";
import { Tour } from "@/components/tour";
import { ExamRing } from "@/components/exam-ring";
import { ProgressBlock } from "@/components/progress-block";
import { UpNext, useWork } from "@/components/up-next";
import { courseColor, gradeLabel } from "@/lib/course";
import type { ClassMeeting, Term } from "@/lib/calendar";
import { sampleData } from "@/lib/sample";
import { termGlance } from "@/lib/term";
import { cn } from "@/lib/utils";
import { Fit } from "@/components/fit";
import { FocusBlock } from "@/components/focus";
import {
  AskWidget,
  CalendarWidget,
  ClassesWidget,
  MaterialsWidget,
  StreakWidget,
  TimerWidget,
  type RecentMaterial,
} from "@/components/widgets";
import {
  ClearWidget,
  CountdownWidget,
  ExamsWidget,
  GapsWidget,
  GradeBarsWidget,
  HoursWidget,
  LoadWidget,
  OnTimeWidget,
  ScoresWidget,
  SplitWidget,
  SpotlightWidget,
  TrendWidget,
  type GradePoint,
} from "@/components/chart-widgets";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SnapGrid } from "@/components/snap-grid";
import type { FocusSession } from "@/lib/focus";
import { DEFAULT_LAYOUT, freeSpot, WIDGETS, type Layout, type WidgetId } from "@/lib/home";
import { endOfWeek, progress, type Item } from "@/lib/progress";

// Recharts widgets load on demand, only when one is on the grid.
const RadarWidget = dynamic(() => import("@/components/evil-widgets").then((m) => m.RadarWidget));
const RingsWidget = dynamic(() => import("@/components/evil-widgets").then((m) => m.RingsWidget));
const PaceWidget = dynamic(() => import("@/components/evil-widgets").then((m) => m.PaceWidget));
const MixWidget = dynamic(() => import("@/components/evil-widgets").then((m) => m.MixWidget));

// A side-column-width render (w-80) at 3/4 scale, as tall as the h-44 frame, so charts get a real height.
const PREVIEW = "flex h-[235px] w-80 origin-top-left scale-[0.75] flex-col *:flex-1";

type Course = { id: string; code: string; name: string; hue: number; grade?: number | null };


export function Dashboard({
  term,
  courses,
  items,
  cards,
  sessions,
  materials = [],
  history = [],
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
  materials?: RecentMaterial[];
  history?: GradePoint[];
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

  if (!term) return <Onboarding name={name} />;
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
  const week = Math.min(Math.max(termGlance(term, date).week, 1), term.weeks);
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

  const at = (id: WidgetId) => layout.find((w) => w.id === id) ?? { w: 12, h: 6 };
  const wide = (id: WidgetId) => at(id).w >= 4;
  // Every widget, drawn from one set of data: yours on Home, or the sample set in the widget library.
  type Data = Pick<Parameters<typeof Dashboard>[0], "courses" | "cards" | "sessions"> & {
    shown: Item[];
    materials: RecentMaterial[];
    history: GradePoint[];
    meetings?: ClassMeeting[];
    term: Term;
  };
  const render = ({ shown, courses, cards, sessions, materials, history, meetings, term }: Data): Record<WidgetId, ReactNode> => ({
    progress: <ProgressBlock items={shown} now={now} termStart={new Date(`${term.start}T00:00:00`)} weeks={term.weeks} />,
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
        <Fit>
        {cards.length === 0 ? (
          <p data-empty className="text-sm text-muted-foreground">Your courses will spin here once you add one.</p>
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
        </Fit>
      </Block>
    ),
    grades: (
      <Block
        title="Grades"
        aside={courses.some((c) => c.grade != null) ? "from Canvas" : "with Canvas sync"}
        className="@container"
      >
        {courses.length === 0 ? (
          <p data-empty className="text-sm text-muted-foreground">Your courses will line up here.</p>
        ) : (
          <ul className="-my-2 grid min-w-0 flex-1 auto-rows-[minmax(2.5rem,1fr)] divide-y divide-border @xl:grid-cols-2 @xl:gap-x-8 @xl:divide-y-0">
            {courses.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-2">
                <span className="size-2 shrink-0 rounded-full" style={{ background: courseColor(c.hue) }} />
                {/* Narrow (side column): just the code, bigger. Wide: code and name. */}
                <span className="min-w-0 flex-1 truncate font-mono text-sm @md:text-xs @md:text-muted-foreground">
                  {c.code}
                  {c.name && <span className="ml-2 hidden font-sans text-sm text-foreground @md:inline">{c.name}</span>}
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
    timer: <TimerWidget />,
    classes: <ClassesWidget term={term} now={now} wide={wide("classes")} meetings={meetings} />,
    calendar: <CalendarWidget items={shown} now={now} w={at("calendar").w} h={at("calendar").h} />,
    today: (
      <UpNext
        title="Due today"
        limit={20}
        items={shown.filter((i) => (checked.has(i.id) || !i.doneAt) && Date.parse(i.due) >= now && Date.parse(i.due) - now < 864e5)}
        now={now}
        checked={checked}
        onToggle={toggle}
        onDelete={remove}
        empty="Nothing due in the next 24 hours."
      />
    ),
    streak: <StreakWidget sessions={sessions} now={now} />,
    materials: <MaterialsWidget materials={materials} courses={courses} />,
    ask: <AskWidget items={shown} now={now} />,
    trend: <TrendWidget courses={courses} history={history} />,
    gradebars: <GradeBarsWidget courses={courses} />,
    scores: <ScoresWidget items={shown} />,
    gaps: <GapsWidget courses={courses} />,
    exams: <ExamsWidget items={shown} now={now} />,
    spotlight: <SpotlightWidget courses={courses} items={shown} now={now} term={term} />,
    hours: <HoursWidget sessions={sessions} now={now} />,
    load: <LoadWidget items={shown} now={now} />,
    ontime: <OnTimeWidget items={shown} now={now} term={term} />,
    split: <SplitWidget sessions={sessions} courses={courses} />,
    countdown: <CountdownWidget items={shown} />,
    clear: <ClearWidget items={shown} now={now} />,
    radar: <RadarWidget items={shown} courses={courses} now={now} />,
    rings: <RingsWidget courses={courses} />,
    pace: <PaceWidget items={shown} term={term} now={now} />,
    mix: <MixWidget items={shown} now={now} />,
  });
  const view = render({ shown, courses, cards, sessions, materials, history, term });
  // Library previews: a widget with nothing real to show yet (its empty state) swaps to the sample render.
  const fake = adding ? sampleData(now) : null;
  const sample = fake && render({ ...fake, shown: fake.items });
  // A new widget takes the first free spot on the grid; a full grid says so.
  const add = (id: WidgetId) => {
    const spot = freeSpot(layout, id);
    if (!spot) return void toast(`No room for ${WIDGETS[id].label}. Remove or shrink a widget first.`);
    setLayout((l) => [...l, spot]);
    setAdding(false);
  };

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
    <main className="@container flex w-full flex-col px-4 pt-5 pb-24 md:h-dvh md:overflow-y-auto md:px-6 md:pt-7 md:pb-20">
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
                  set your real term length
                </button>
              </>
            )}
          </p>
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-sm text-muted-foreground">
            {/* Late work is the one thing Home says first and loudest (calm by default, loud on purpose). */}
            {overdue > 0 && (
              <span className="flex items-center gap-1.5 font-medium text-destructive">
                <span aria-hidden="true" className="size-2 rounded-full bg-destructive" />
                {overdue} overdue
              </span>
            )}
            <span>{dueThisWeek === 0 ? "nothing due this week" : `${dueThisWeek} due this week`}</span>
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
              <Button
                type="button"
                variant="secondary"
                onClick={() => setAdding(true)}
                className="h-10 gap-2 rounded-full px-4"
              >
                <Plus aria-hidden="true" />
                Add widget
              </Button>
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

      <SnapGrid
        layout={layout}
        onChange={setLayout}
        editable={editing}
        render={(id) => view[id]}
        controls={(id) => (
          <button
            type="button"
            aria-label={`Remove ${WIDGETS[id].label}`}
            onClick={() => {
              setLayout((l) => l.filter((x) => x.id !== id));
              document.getElementById("home-done")?.focus(); // the button is about to disappear
            }}
            className="absolute top-2 left-2 z-10 grid size-8 place-items-center rounded-full bg-foreground text-background shadow-sm transition-transform outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-90"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        )}
      />
      {layout.length === 0 && !editing && (
        <p className="rounded-2xl border border-dashed border-foreground/15 p-6 text-sm text-muted-foreground">
          Home is empty. Press Edit to add widgets back.
        </p>
      )}
      <Tour />
      {/* The widget library: every widget with a live preview (your real data). */}
      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto rounded-2xl sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Widgets</DialogTitle>
            <DialogDescription>Previews use your real data, or sample data until you have some. A new widget takes the first free space; drag it anywhere.</DialogDescription>
          </DialogHeader>
          <ul className="grid gap-4 sm:grid-cols-2">
            {(Object.keys(WIDGETS) as WidgetId[]).map((id) => {
              const on = layout.some((w) => w.id === id);
              return (
                <li key={id} className="flex flex-col gap-3 rounded-2xl bg-muted/40 p-3">
                  {/* A side-column-width render, shrunk to fit and cut off at the bottom. */}
                  {/* If your data leaves it empty (peer-has), the sample render shows instead, labeled. */}
                  <div aria-hidden="true" inert className="relative h-44 overflow-hidden rounded-xl">
                    <div className={cn(PREVIEW, "peer has-data-empty:hidden")}>{view[id]}</div>
                    <div className={cn(PREVIEW, "hidden peer-has-data-empty:flex")}>{sample?.[id]}</div>
                    <span className="absolute top-2 right-2 hidden rounded-full bg-secondary px-2 py-0.5 font-mono text-[10px] text-muted-foreground peer-has-data-empty:block">
                      sample
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="mr-auto text-sm font-medium">{WIDGETS[id].label}</span>
                    {on ? (
                      <span className="font-mono text-xs text-muted-foreground">on Home</span>
                    ) : (
                      <Button type="button" size="sm" onClick={() => add(id)} className="h-8 rounded-full px-3">
                        Add
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </DialogContent>
      </Dialog>
    </main>
  );
}
