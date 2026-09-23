"use client";

import { BookOpen, CalendarClock, FilePlus2, FileUp, Plus, Search } from "lucide-react";
import { useTheme } from "next-themes";
import { startTransition, useOptimistic, useState } from "react";
import { toast } from "sonner";
import { setDone } from "@/app/actions";
import { Block } from "@/components/block";
import { CourseDialog, ItemDialog, TermSetup } from "@/components/create-forms";
import { ExamRing } from "@/components/exam-ring";
import {
  ContributionGraph,
  ContributionGraphBlock,
  ContributionGraphCalendar,
} from "@/components/kibo-ui/contribution-graph";
import { ThemeSwitcher } from "@/components/kibo-ui/theme-switcher";
import { ProgressBlock } from "@/components/progress-block";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UpNext } from "@/components/up-next";
import { courseColor, dayKey } from "@/lib/course";
import { progress, type Item } from "@/lib/progress";

export type Term = { start: string; weeks: number }; // start = YYYY-MM-DD (local)
type Course = { id: string; code: string; name: string; hue: number };

const soon = (what: string, phase: number) => () => toast(`${what} lands in Phase ${phase}.`);

export function Dashboard({ term, courses, items }: { term: Term | null; courses: Course[]; items: Item[] }) {
  const [now] = useState(() => Date.now()); // one clock per render tree
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [dialog, setDialog] = useState<"course" | Item["kind"] | null>(null);
  const { theme, setTheme } = useTheme();
  // Check-offs show instantly; if saving fails the item flips back when the transition ends.
  const [shown, flip] = useOptimistic(items, (list, id: string) =>
    list.map((i) => (i.id === id ? { ...i, doneAt: i.doneAt ? null : new Date().toISOString() } : i)),
  );

  if (!term) return <TermSetup />;
  const termStart = new Date(`${term.start}T00:00:00`);

  const toggle = (id: string) => {
    const nowDone = !shown.find((i) => i.id === id)?.doneAt;
    setChecked((s) => new Set(s).add(id));
    startTransition(async () => {
      flip(id);
      const r = await setDone(id, nowDone);
      if (r.error) toast.error(r.error);
    });
    const next = shown.map((i) => (i.id === id ? { ...i, doneAt: nowDone ? "x" : null } : i));
    const p = progress(next, termStart, term.weeks, new Date(now));
    const week = p.bars[p.current];
    if (nowDone && week?.total && week.done === week.total) toast.success("Week cleared. Go outside.");
  };

  // Assignments and exams need a course to belong to.
  const add = (kind: Item["kind"]) => () => {
    if (courses.length) return setDialog(kind);
    toast("Add a course first.");
    setDialog("course");
  };
  const create = [
    { label: "Assignment", icon: FilePlus2, run: add("assignment") },
    { label: "Exam", icon: CalendarClock, run: add("exam") },
    { label: "Upload syllabus", icon: FileUp, run: soon("Syllabus import", 3) },
    { label: "Course", icon: BookOpen, run: () => setDialog("course") },
  ];

  const today = new Date(now).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  const week = Math.floor((now - termStart.getTime()) / (7 * 864e5)) + 1;
  // Empty until the focus timer (Phase 7) logs real study time.
  const studyDays = Array.from({ length: term.weeks * 7 }, (_, d) => ({
    date: dayKey(new Date(termStart.getTime() + d * 864e5)),
    count: 0,
    level: 0,
  }));

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pt-4 pb-10 md:px-6 md:pt-6">
      <header className="mb-4 flex flex-wrap items-center gap-3">
        <div className="mr-auto md:mr-0">
          <p className="font-mono text-lg font-medium tracking-tight">
            sonnet<span className="text-brand">.</span>
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            {today} · wk {Math.min(Math.max(week, 1), term.weeks)}/{term.weeks}
          </p>
        </div>

        <form
          className="order-last flex h-11 w-full items-center gap-2 rounded-full bg-secondary px-4 transition-shadow focus-within:ring-2 focus-within:ring-ring md:order-none md:mx-6 md:w-auto md:flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            soon("The course assistant", 5)();
          }}
        >
          <Search className="size-4 text-muted-foreground" aria-hidden="true" />
          <label htmlFor="ask" className="sr-only">
            Ask about your courses
          </label>
          <input
            id="ask"
            placeholder="Ask anything about your courses…"
            className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </form>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button className="h-11 rounded-full px-5 transition-transform active:scale-[0.97]">
                <Plus /> Create
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-52 rounded-2xl p-1.5">
            {create.map(({ label, icon: Icon, run }) => (
              <DropdownMenuItem key={label} onClick={run} className="gap-3 rounded-xl px-3 py-2.5">
                <Icon /> {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <ThemeSwitcher
          value={(theme as "light" | "dark" | "system") ?? "system"}
          onChange={setTheme}
          className="hidden md:flex"
        />
      </header>

      <div className="grid gap-3 md:grid-cols-12">
        <ProgressBlock items={shown} now={now} termStart={termStart} weeks={term.weeks} className="md:col-span-8" />
        <ExamRing items={shown} now={now} className="md:col-span-4" />
        <UpNext
          items={shown}
          now={now}
          checked={checked}
          onToggle={toggle}
          onAddCourse={courses.length ? undefined : () => setDialog("course")}
          className="md:col-span-7 md:row-span-2"
        />

        <Block title="Grades" aside="with Canvas sync" className="md:col-span-5">
          {courses.length === 0 ? (
            <p className="m-auto py-6 text-center text-sm text-muted-foreground">Your courses will line up here.</p>
          ) : (
            <ul className="divide-y divide-border">
              {courses.map((c) => (
                <li key={c.id} className="flex items-center gap-3 py-2.5">
                  <span className="size-2 rounded-full" style={{ background: courseColor(c.hue) }} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-mono text-xs text-muted-foreground">{c.code}</span>
                    <span className="block truncate text-sm">{c.name || " "}</span>
                  </span>
                  <span className="font-mono text-2xl font-medium text-muted-foreground" aria-label="No grade yet">
                    –
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Block>

        <Block title="Study days" aside="with the focus timer" className="md:col-span-5">
          <ContributionGraph data={studyDays} blockSize={12} blockMargin={3} blockRadius={3} fontSize={12}>
            <ContributionGraphCalendar className="font-mono text-muted-foreground">
              {({ activity, dayIndex, weekIndex }) => (
                <ContributionGraphBlock activity={activity} dayIndex={dayIndex} weekIndex={weekIndex} />
              )}
            </ContributionGraphCalendar>
          </ContributionGraph>
        </Block>
      </div>

      <CourseDialog open={dialog === "course"} onOpenChange={(o) => !o && setDialog(null)} />
      <ItemDialog
        kind={dialog === "course" ? null : dialog}
        courses={courses}
        now={now}
        onOpenChange={(o) => !o && setDialog(null)}
      />
    </main>
  );
}
