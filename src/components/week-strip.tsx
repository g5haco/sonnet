import Link from "next/link";
import { Block } from "@/components/block";
import { courseColor, dayKey } from "@/lib/course";
import type { Item } from "@/lib/progress";
import { cn } from "@/lib/utils";

// Monday-to-Sunday at a glance: one dot per thing due, in course colors. Opens the calendar.
export function WeekStrip({ items, now, className }: { items: Item[]; now: number; className?: string }) {
  const today = new Date(now);
  const monday = new Date(today);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const days = Array.from({ length: 7 }, (_, i) => new Date(monday.getTime() + i * 864e5));
  const due = (d: Date) => items.filter((i) => dayKey(new Date(i.due)) === dayKey(d));

  return (
    <Block title="This week" aside={<Link href="/calendar" className="hover:text-foreground">calendar →</Link>} className={className}>
      <ol className="grid flex-1 grid-cols-7 content-center gap-1 text-center">
        {days.map((d) => {
          const list = due(d);
          const isToday = dayKey(d) === dayKey(today);
          return (
            <li key={d.toISOString()} className="flex flex-col items-center gap-1">
              <span className="font-mono text-xs leading-none text-muted-foreground">
                {d.toLocaleDateString(undefined, { weekday: "narrow" })}
              </span>
              <span
                className={cn(
                  "grid size-7 place-items-center rounded-full font-mono text-sm tabular-nums",
                  isToday && "bg-brand font-medium text-brand-foreground",
                )}
                aria-current={isToday ? "date" : undefined}
              >
                {d.getDate()}
              </span>
              <span
                className="flex h-2 items-center justify-center gap-1"
                aria-label={`${list.length} due`}
                title={list.map((i) => `${i.course}: ${i.title}`).join("\n") || undefined}
              >
                {list.slice(0, 3).map((i) => (
                  <span
                    key={i.id}
                    className={cn("size-2 rounded-full", i.doneAt && "opacity-30")}
                    style={{ background: courseColor(i.hue) }}
                  />
                ))}
                {list.length > 3 && <span className="font-mono text-xs leading-none text-muted-foreground">+{list.length - 3}</span>}
              </span>
            </li>
          );
        })}
      </ol>
    </Block>
  );
}
