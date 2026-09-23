"use client";

import { BookOpen, CalendarClock, FilePlus2, FileUp, Plus, Search } from "lucide-react";
import { MotionConfig } from "motion/react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { toast } from "sonner";
import { Block } from "@/components/block";
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
import { progress } from "@/lib/progress";
import { courseColor, courses, dayKey, sampleItems, studyDays, termStart, WEEKS } from "@/lib/sample";

const soon = (what: string, phase: number) => () => toast(`${what} lands in Phase ${phase}.`);

const create = [
  { label: "Assignment", icon: FilePlus2, phase: 1 },
  { label: "Exam", icon: CalendarClock, phase: 1 },
  { label: "Upload syllabus", icon: FileUp, phase: 3 },
  { label: "Course", icon: BookOpen, phase: 1 },
];

const letter = (g: number) =>
  g >= 93 ? "A" : g >= 90 ? "A−" : g >= 87 ? "B+" : g >= 83 ? "B" : g >= 80 ? "B−" : g >= 77 ? "C+" : "C";

function streak(now: number) {
  const today = dayKey(new Date(now));
  const past = studyDays.filter((d) => d.date <= today).reverse();
  const n = past.findIndex((d) => d.count === 0);
  return n === -1 ? past.length : n;
}

export function Dashboard() {
  const [items, setItems] = useState(sampleItems);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [now] = useState(() => Date.now()); // one clock per render tree
  const { theme, setTheme } = useTheme();

  const toggle = (id: string) => {
    const next = items.map((i) =>
      i.id === id ? { ...i, doneAt: i.doneAt ? null : new Date().toISOString() } : i,
    );
    setItems(next);
    setChecked((s) => new Set(s).add(id));
    const p = progress(next, termStart, WEEKS, new Date(now));
    const week = p.bars[p.current];
    if (next.find((i) => i.id === id)?.doneAt && week.total && week.done === week.total) {
      toast.success("Week cleared. Go outside.");
    }
  };

  const today = new Date(now).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  const week = Math.floor((now - termStart.getTime()) / (7 * 864e5)) + 1;

  return (
    <MotionConfig reducedMotion="user">
      <main className="mx-auto w-full max-w-6xl px-4 pt-4 pb-10 md:px-6 md:pt-6">
        <header className="mb-4 flex flex-wrap items-center gap-3">
          <div className="mr-auto md:mr-0">
            <p className="font-mono text-lg font-medium tracking-tight">
              sonnet<span className="text-brand">.</span>
            </p>
            <p className="font-mono text-xs text-muted-foreground">
              {today} · wk {week}/{WEEKS}
              <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground">sample data</span>
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
              {create.map(({ label, icon: Icon, phase }) => (
                <DropdownMenuItem key={label} onClick={soon(label, phase)} className="gap-3 rounded-xl px-3 py-2.5">
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
          <ProgressBlock items={items} now={now} className="md:col-span-8" />
          <ExamRing items={items} now={now} className="md:col-span-4" />
          <UpNext items={items} now={now} checked={checked} onToggle={toggle} className="md:col-span-7 md:row-span-2" />

          <Block title="Grades" aside="so far" className="md:col-span-5">
            <ul className="divide-y divide-border">
              {courses.map((c) => (
                <li key={c.code} className="flex items-center gap-3 py-2.5">
                  <span className="size-2 rounded-full" style={{ background: courseColor(c.code) }} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-mono text-xs text-muted-foreground">{c.code}</span>
                    <span className="block truncate text-sm">{c.name}</span>
                  </span>
                  <span className="font-mono text-2xl font-medium tabular-nums tracking-tight">{letter(c.grade)}</span>
                  <span className="w-12 text-right font-mono text-xs text-muted-foreground tabular-nums">
                    {c.grade.toFixed(1)}
                  </span>
                </li>
              ))}
            </ul>
          </Block>

          <Block title="Study days" aside={`${streak(now)}-day streak`} className="md:col-span-5">
            <ContributionGraph data={studyDays} blockSize={12} blockMargin={3} blockRadius={3} fontSize={12}>
              <ContributionGraphCalendar className="font-mono text-muted-foreground">
                {({ activity, dayIndex, weekIndex }) => (
                  <ContributionGraphBlock
                    activity={activity}
                    dayIndex={dayIndex}
                    weekIndex={weekIndex}
                    className='data-[level="1"]:fill-brand/30 data-[level="2"]:fill-brand/55 data-[level="3"]:fill-brand/80 data-[level="4"]:fill-brand'
                  />
                )}
              </ContributionGraphCalendar>
            </ContributionGraph>
          </Block>
        </div>
      </main>
    </MotionConfig>
  );
}
