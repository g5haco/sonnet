"use client";

import { motion } from "motion/react";
import { Block } from "@/components/block";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { Item } from "@/lib/progress";
import { courseColor } from "@/lib/sample";

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
  className,
}: {
  items: Item[];
  now: number;
  checked: Set<string>; // checked this session: stays visible so a mis-tap can be undone
  onToggle: (id: string) => void;
  className?: string;
}) {
  const list = items
    .filter((i) => !i.doneAt || checked.has(i.id))
    .sort((a, b) => Date.parse(a.due) - Date.parse(b.due))
    .slice(0, 8);

  return (
    <Block title="Up next" aside={headline(items.filter((i) => !i.doneAt), now)} className={className}>
      {list.length === 0 ? (
        <p className="m-auto py-10 text-center text-sm text-muted-foreground">
          Nothing due. Connect Canvas or drop in a syllabus to fill this up.
        </p>
      ) : (
        <ul className="-mx-2">
          {list.map((i) => {
            const done = !!i.doneAt;
            const due = when(i.due, now);
            return (
              <motion.li layout key={i.id} transition={{ type: "spring", stiffness: 500, damping: 40 }}>
                <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-accent/60">
                  <motion.span whileTap={{ scale: 0.8 }} className="flex">
                    <Checkbox
                      checked={done}
                      onCheckedChange={() => onToggle(i.id)}
                      className="size-5 rounded-full data-checked:border-done data-checked:bg-done"
                    />
                  </motion.span>
                  <span className="min-w-0 flex-1">
                    <span className={cn("block truncate transition-opacity", done && "line-through opacity-45")}>
                      {i.title}
                      {i.kind === "exam" && (
                        <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 font-mono text-[11px] text-secondary-foreground no-underline">
                          exam
                        </span>
                      )}
                    </span>
                    <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                      <span className="size-2 rounded-full" style={{ background: courseColor(i.course) }} />
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
              </motion.li>
            );
          })}
        </ul>
      )}
    </Block>
  );
}
