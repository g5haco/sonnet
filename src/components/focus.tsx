"use client";

import { Block } from "@/components/block";
import { dayKey } from "@/lib/course";
import { streak, studyDays, type FocusSession } from "@/lib/focus";
import { cn } from "@/lib/utils";

const WEEKS = 18; // heatmap columns
const SHADES = ["bg-secondary", "bg-done/35", "bg-done/55", "bg-done/80", "bg-done"]; // heatmap, by level

// The study heatmap the focus timer (in the sidebar) fills.
export function FocusBlock({
  sessions,
  now,
  className,
}: {
  sessions: FocusSession[];
  now: number;
  className?: string;
}) {
  const days = studyDays(sessions);
  const today = new Date(now);
  const inRow = streak(days, today);
  // Columns are weeks (Sunday on top), ending with this week.
  const first = new Date(today);
  first.setDate(first.getDate() - first.getDay() - (WEEKS - 1) * 7);
  const cells = Array.from({ length: WEEKS * 7 }, (_, i) => {
    const d = new Date(first);
    d.setDate(first.getDate() + i);
    return { key: dayKey(d), label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }), future: d > today };
  });
  const level = (m = 0) => (m === 0 ? 0 : m < 25 ? 1 : m < 60 ? 2 : m < 120 ? 3 : 4);

  return (
    <Block title="Study days" aside={inRow ? `${inRow}-day streak` : undefined} className={className}>
      <div
        className="grid grid-flow-col grid-rows-7 gap-[3px] overflow-x-auto"
        style={{ gridTemplateColumns: `repeat(${WEEKS}, minmax(0, 1fr))` }}
        role="img"
        aria-label={`Focus minutes per day, last ${WEEKS} weeks. ${inRow}-day streak.`}
      >
        {cells.map((c) => {
          const m = days.get(c.key) ?? 0;
          return (
            <span
              key={c.key}
              title={c.future ? undefined : `${c.label}: ${m ? `${m} min` : "no focus time"}`}
              className={cn("aspect-square min-w-2 rounded-[3px]", c.future ? "bg-transparent" : SHADES[level(m)])}
            />
          );
        })}
      </div>
      {sessions.length === 0 && (
        <p className="mt-3 text-sm text-muted-foreground">Each focus session fills in a day. Start one with the timer in the sidebar.</p>
      )}
    </Block>
  );
}
