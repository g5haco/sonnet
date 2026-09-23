"use client";

import { startTransition, useOptimistic, useState } from "react";
import { toast } from "sonner";
import { deleteItem, setDone } from "@/app/actions";
import { useCreate } from "@/components/app-shell";
import { Block } from "@/components/block";
import { TermSetup } from "@/components/create-forms";
import { ExamRing } from "@/components/exam-ring";
import {
  ContributionGraph,
  ContributionGraphBlock,
  ContributionGraphCalendar,
} from "@/components/kibo-ui/contribution-graph";
import { ProgressBlock } from "@/components/progress-block";
import { UpNext } from "@/components/up-next";
import { courseColor, dayKey } from "@/lib/course";
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

  const today = new Date(now).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const week = Math.floor((now - termStart.getTime()) / (7 * 864e5)) + 1;
  // Empty until the focus timer (Phase 7) logs real study time.
  const studyDays = Array.from({ length: term.weeks * 7 }, (_, d) => ({
    date: dayKey(new Date(termStart.getTime() + d * 864e5)),
    count: 0,
    level: 0,
  }));

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pt-4 pb-10 md:px-6 md:pt-6">
      <header className="mb-4">
        <h1 className="text-lg font-medium tracking-tight">{today}</h1>
        <p className="font-mono text-xs text-muted-foreground">
          week {Math.min(Math.max(week, 1), term.weeks)} of {term.weeks}
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-12">
        <ProgressBlock items={shown} now={now} termStart={termStart} weeks={term.weeks} className="md:col-span-8" />
        <ExamRing items={shown} now={now} className="md:col-span-4" />
        <UpNext
          items={shown}
          now={now}
          checked={checked}
          onToggle={toggle}
          onDelete={remove}
          onAddCourse={courses.length ? undefined : () => create("course")}
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
                    <span className="block truncate text-sm">{c.name || "\u00a0"}</span>
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

    </main>
  );
}
