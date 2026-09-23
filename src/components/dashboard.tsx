"use client";

import { startTransition, useOptimistic, useState } from "react";
import { toast } from "sonner";
import { deleteItem, setDone } from "@/app/actions";
import { useCreate } from "@/components/app-shell";
import { Block } from "@/components/block";
import { TermSetup } from "@/components/create-forms";
import { ExamRing } from "@/components/exam-ring";
import { ProgressBlock } from "@/components/progress-block";
import { UpNext } from "@/components/up-next";
import { WeekStrip } from "@/components/week-strip";
import { courseColor } from "@/lib/course";
import { progress, type Item } from "@/lib/progress";

export type Term = { start: string; weeks: number }; // start = YYYY-MM-DD (local)
type Course = { id: string; code: string; name: string; hue: number };

export function Dashboard({ term, courses, items }: { term: Term | null; courses: Course[]; items: Item[] }) {
  const [now] = useState(() => Date.now()); // one clock per render tree
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const create = useCreate();
  // Check-offs show instantly; if saving fails the item flips back when the transition ends.
  const [optimistic, flip] = useOptimistic(items, (list, id: string) =>
    list.map((i) => (i.id === id ? { ...i, doneAt: i.doneAt ? null : new Date().toISOString() } : i)),
  );
  const shown = optimistic.filter((i) => !hidden.has(i.id));

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

  // Delete hides the row at once and only deletes when the Undo toast closes (5s).
  // If the tab closes first, the item simply survives: the safe failure.
  const remove = (item: Item) => {
    const show = (on: boolean) =>
      setHidden((s) => {
        const n = new Set(s);
        if (on) n.delete(item.id);
        else n.add(item.id);
        return n;
      });
    let settled = false;
    const commit = async () => {
      if (settled) return;
      settled = true;
      const r = await deleteItem(item.id);
      if (r.error) {
        toast.error(r.error);
        show(true);
      }
    };
    show(false);
    toast(`Deleted "${item.title}"`, {
      action: {
        label: "Undo",
        onClick: () => {
          settled = true;
          show(true);
        },
      },
      onAutoClose: commit,
      onDismiss: commit,
    });
  };

  const date = new Date(now);
  const today = date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const week = Math.min(Math.max(Math.floor((now - termStart.getTime()) / (7 * 864e5)) + 1, 1), term.weeks);
  const hour = date.getHours();
  const greeting = hour < 5 ? "Up late." : hour < 12 ? "Morning." : hour < 18 ? "Afternoon." : "Evening.";

  // The one-line situation report under the greeting.
  const sunday = new Date(date);
  sunday.setDate(sunday.getDate() + ((7 - sunday.getDay()) % 7));
  sunday.setHours(23, 59, 59, 999);
  const open = shown.filter((i) => !i.doneAt);
  const dueThisWeek = open.filter((i) => Date.parse(i.due) >= now && Date.parse(i.due) <= sunday.getTime()).length;
  const overdue = open.filter((i) => Date.parse(i.due) < now).length;
  const nextExam = open
    .filter((i) => i.kind === "exam" && Date.parse(i.due) > now)
    .sort((a, b) => Date.parse(a.due) - Date.parse(b.due))[0];
  const examIn = nextExam && Math.ceil((Date.parse(nextExam.due) - now) / 864e5);

  return (
    <main className="@container mx-auto w-full max-w-6xl px-4 pt-5 pb-24 md:px-6 md:pt-7">
      <header className="mb-5">
        <h1 className="text-2xl font-medium tracking-tight">{greeting}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {today} · week {week} of {term.weeks}
        </p>
        <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-xs text-muted-foreground">
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
          Container queries: the layout reacts to the space left beside the assistant panel. */}
      <div className="flex flex-col gap-3 @3xl:flex-row @3xl:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <ProgressBlock items={shown} now={now} termStart={termStart} weeks={term.weeks} />
          <UpNext
            items={shown}
            now={now}
            checked={checked}
            onToggle={toggle}
            onDelete={remove}
            onAddCourse={courses.length ? undefined : () => create("course")}
          />
        </div>

        <div className="flex flex-col gap-3 @3xl:w-80 @3xl:shrink-0">
          <ExamRing items={shown} now={now} />
          <WeekStrip items={shown} now={now} />
          <Block title="Grades" aside="with Canvas sync">
            {courses.length === 0 ? (
              <p className="text-sm text-muted-foreground">Your courses will line up here.</p>
            ) : (
              <ul className="-my-2 divide-y divide-border">
                {courses.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 py-2">
                    <span className="size-2 shrink-0 rounded-full" style={{ background: courseColor(c.hue) }} />
                    <span className="min-w-0 flex-1 truncate text-sm">
                      <span className="font-mono text-xs text-muted-foreground">{c.code}</span>
                      {c.name && <span className="ml-2">{c.name}</span>}
                    </span>
                    <span className="font-mono text-muted-foreground" aria-label="No grade yet">
                      –
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Block>
          <Block title="Study days" aside="with the focus timer">
            <p className="text-sm text-muted-foreground">Your streak starts the first time you use the focus timer.</p>
          </Block>
        </div>
      </div>
    </main>
  );
}
