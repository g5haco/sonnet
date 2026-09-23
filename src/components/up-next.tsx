"use client";

import { Block } from "@/components/block";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { Item } from "@/lib/progress";
import { Button } from "@/components/ui/button";
import { courseColor } from "@/lib/course";

const DAY = 864e5;

function when(due: string, now: number) {
  const days = Math.round((Date.parse(due) - now) / DAY);
  if (days < 0) return { label: `${-days}d late`, late: true };
  if (days === 0) return { label: "today", late: false };
  if (days === 1) return { label: "tmrw", late: false };
  return { label: `${days}d`, late: false };
}

function headline(open: Item[], now: number) {
  const sunday = new Date(now);
  sunday.setDate(sunday.getDate() + ((7 - sunday.getDay()) % 7));
  sunday.setHours(23, 59, 59);
  const n = open.filter((i) => Date.parse(i.due) <= sunday.getTime()).length;
  if (n === 0) return "Nothing due this week. Suspicious.";
  if (n === 1) return "1 thing between you and the weekend.";
  return `${n} things between you and the weekend.`;
}

export function UpNext({
  items,
  now,
  checked,
  onToggle,
  onAddCourse,
  className,
}: {
  items: Item[];
  now: number;
  checked: Set<string>; // checked this session: stays visible so a mis-tap can be undone
  onToggle: (id: string) => void;
  onAddCourse?: () => void; // set when there are no courses yet
  className?: string;
}) {
  const open = items
    .filter((i) => !i.doneAt || checked.has(i.id))
    .sort((a, b) => Date.parse(a.due) - Date.parse(b.due));
  const list = open.slice(0, 8);

  return (
    <Block title="Up next" aside={headline(items.filter((i) => !i.doneAt), now)} className={className}>
      {list.length === 0 ? (
        <div className="m-auto flex flex-col items-center gap-3 py-10 text-center text-sm text-muted-foreground">
          {onAddCourse ? (
            <>
              <p>Start with a course. Assignments and exams hang off it.</p>
              <Button onClick={onAddCourse} className="h-11 rounded-full px-5 transition-transform active:scale-[0.97]">
                Add your first course
              </Button>
            </>
          ) : (
            <p>Nothing due. Add an assignment from Create, or wait for Canvas sync.</p>
          )}
        </div>
      ) : (
        <ul className="-mx-2">
          {list.map((i) => {
            const done = !!i.doneAt;
            const due = when(i.due, now);
            return (
              <li key={i.id}>
                <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-accent/60">
                  <Checkbox
                    // a real <button>: a <span> checkbox inside <label> toggles twice on Space
                    nativeButton
                    render={<button type="button" />}
                    checked={done}
                    onCheckedChange={() => onToggle(i.id)}
                    aria-label={i.title}
                    className="size-5 rounded-full transition-transform active:scale-80 data-checked:animate-check-pop data-checked:border-done data-checked:bg-done"
                  />
                  <span className="min-w-0 flex-1">
                    <span className={cn("block truncate transition-opacity duration-300", done && "opacity-45")}>
                      <span className="strike" data-done={done || undefined}>
                        {i.title}
                      </span>
                      {i.kind === "exam" && (
                        <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 font-mono text-xs text-secondary-foreground no-underline">
                          exam
                        </span>
                      )}
                    </span>
                    <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                      <span className="size-2 rounded-full" style={{ background: courseColor(i.hue) }} />
                      {i.course}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "font-mono text-sm tabular-nums",
                      done ? "text-muted-foreground" : due.late ? "text-destructive" : "text-foreground",
                    )}
                  >
                    {done ? "done" : due.label}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
      {open.length > list.length && (
        <p className="mt-auto pt-4 font-mono text-xs text-muted-foreground">
          +{open.length - list.length} more this term
        </p>
      )}
    </Block>
  );
}
