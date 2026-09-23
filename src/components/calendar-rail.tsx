"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useOpenSettings } from "@/components/app-shell";
import { FeedLink } from "@/components/settings-forms";
import { Button } from "@/components/ui/button";
import { addDays, parseDay, range, type ClassMeeting, type Term, type View } from "@/lib/calendar";
import { courseColor, dayKey, meetingLabel } from "@/lib/course";
import { progress, type Item } from "@/lib/progress";
import { cn } from "@/lib/utils";

type Props = {
  view: View;
  anchor: Date;
  days: Date[];
  items: Item[];
  meetings: ClassMeeting[];
  term: Term | null;
  now: number;
  feed: string | null;
  onPick: (day: Date, view?: View) => void;
  className?: string;
};

// The calendar's left column: jump to a date, see the whole semester's load, check your class times.
export function CalendarRail({ className, ...p }: Props) {
  return (
    <aside
      aria-label="Calendar tools"
      className={cn("w-64 shrink-0 flex-col gap-7 overflow-y-auto border-r border-border p-4", className)}
    >
      <MiniMonth {...p} />
      <Semester {...p} />
      <Classes meetings={p.meetings} />
      <section>
        <h2 className="mb-1 pl-1 text-sm font-medium">Google Calendar</h2>
        <FeedLink token={p.feed} className="pl-1" />
      </section>
    </aside>
  );
}

function MiniMonth({ view, anchor, days, items, now, onPick }: Props) {
  const first = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
  const [month, setMonth] = useState(() => first(anchor));
  // Follow the main calendar when it pages into another month.
  const [followed, setFollowed] = useState(anchor);
  if (followed !== anchor) {
    setFollowed(anchor);
    setMonth(first(anchor));
  }

  const cells = range("month", month);
  const inView = new Set(view === "month" ? [] : days.map(dayKey));
  const busy = new Set(items.filter((i) => !i.doneAt).map((i) => dayKey(new Date(i.due))));
  const todayKey = dayKey(new Date(now));
  const turn = (n: number) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + n, 1));

  return (
    <section>
      <header className="mb-2 flex items-center justify-between">
        <h2 className="pl-1 text-sm font-medium">
          {month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </h2>
        <div className="flex">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => turn(-1)}
            aria-label="Previous month"
            className="rounded-full"
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => turn(1)}
            aria-label="Next month"
            className="rounded-full"
          >
            <ChevronRight />
          </Button>
        </div>
      </header>
      <div className="grid grid-cols-7 text-center font-mono text-[10px] text-muted-foreground" aria-hidden="true">
        {cells.slice(0, 7).map((d) => (
          <span key={d.getTime()} className="py-1">
            {d.toLocaleDateString(undefined, { weekday: "narrow" })}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((d, i) => {
          const key = dayKey(d);
          const on = inView.has(key);
          const isToday = key === todayKey;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onPick(d)}
              aria-label={d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
              aria-current={isToday ? "date" : undefined}
              className={cn(
                "group relative grid h-8 place-items-center font-mono text-xs tabular-nums outline-none",
                on && "bg-secondary",
                // the shown week reads as one rounded band, like a highlighter stroke
                on && (i % 7 === 0 || !inView.has(dayKey(addDays(d, -1)))) && "rounded-l-full",
                on && (i % 7 === 6 || !inView.has(dayKey(addDays(d, 1)))) && "rounded-r-full",
                d.getMonth() !== month.getMonth() && "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "grid size-7 place-items-center rounded-full transition-colors group-hover:bg-accent group-focus-visible:ring-2 group-focus-visible:ring-ring",
                  isToday && "bg-brand font-medium text-brand-foreground group-hover:bg-brand",
                )}
              >
                {d.getDate()}
              </span>
              {busy.has(key) && (
                <span className="absolute bottom-0.5 size-1 rounded-full bg-foreground/50" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

// The semester at a glance: one cell per week, darker = more due. Doubles as navigation.
const LEVELS = [0, 12, 26, 60, 82]; // % of foreground mixed into the cell; text flips to light from level 3
function Semester({ term, items, now, days, view, onPick }: Props) {
  const openSettings = useOpenSettings();
  if (!term)
    return (
      <section>
        <h2 className="mb-1 pl-1 text-sm font-medium">Semester</h2>
        <p className="pl-1 text-sm text-muted-foreground">
          Set your semester dates in{" "}
          <button type="button" onClick={() => openSettings()} className="text-foreground underline underline-offset-4">
            Settings
          </button>{" "}
          to see which weeks are heavy.
        </p>
      </section>
    );

  const start = parseDay(term.start);
  const { bars, current } = progress(items, start, term.weeks, new Date(now));
  const weekOf = (t: number) => Math.floor((t - +start) / (7 * 864e5));
  const exams = new Set(items.filter((i) => i.kind === "exam").map((i) => weekOf(Date.parse(i.due))));
  const shown = view === "month" ? -1 : weekOf(+days[0]); // the week on screen (month spans several)
  const max = Math.max(1, ...bars.map((b) => b.total));
  const status =
    current < 0
      ? `starts ${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
      : current >= term.weeks
        ? "finished"
        : `week ${current + 1} of ${term.weeks}`;

  return (
    <section>
      <header className="mb-2 flex items-baseline justify-between pl-1">
        <h2 className="text-sm font-medium">Semester</h2>
        <span className="font-mono text-xs text-muted-foreground">{status}</span>
      </header>
      <ol className="grid grid-cols-8 gap-1">
        {bars.map((b, w) => {
          const level = b.total && Math.min(4, Math.ceil((b.total / max) * 4));
          const from = addDays(start, w * 7);
          const dates = `${from.toLocaleDateString(undefined, { month: "short", day: "numeric" })} to ${addDays(from, 6).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
          const label = `Week ${w + 1}, ${dates}: ${b.total} due${exams.has(w) ? ", exam week" : ""}`;
          return (
            <li key={w}>
              <button
                type="button"
                onClick={() => onPick(from, "week")}
                aria-label={label}
                title={label}
                className={cn(
                  "relative grid h-7 w-full place-items-center rounded-md font-mono text-[10px] tabular-nums outline-none transition-transform active:scale-90 focus-visible:ring-2 focus-visible:ring-ring",
                  level >= 3 ? "text-background" : "text-foreground",
                  w === current && "ring-2 ring-brand",
                  w === shown && w !== current && "ring-1 ring-foreground/60",
                )}
                style={{ background: `color-mix(in oklch, var(--foreground) ${LEVELS[level]}%, var(--secondary))` }}
              >
                {w + 1}
                {exams.has(w) && <span className="absolute top-1 right-1 size-1 rounded-full bg-current" />}
              </button>
            </li>
          );
        })}
      </ol>
      <div
        className="mt-2 flex items-center justify-end gap-1 font-mono text-[10px] text-muted-foreground"
        aria-hidden="true"
      >
        light
        {LEVELS.map((l) => (
          <span
            key={l}
            className="size-2.5 rounded-sm"
            style={{ background: `color-mix(in oklch, var(--foreground) ${l}%, var(--secondary))` }}
          />
        ))}
        heavy
      </div>
    </section>
  );
}

function Classes({ meetings }: { meetings: ClassMeeting[] }) {
  const byCourse = [...Map.groupBy(meetings, (m) => m.course)];
  return (
    <section>
      <header className="mb-2 flex items-baseline justify-between pl-1">
        <h2 className="text-sm font-medium">Classes</h2>
        <Link href="/courses" className="font-mono text-xs text-muted-foreground hover:text-foreground">
          edit →
        </Link>
      </header>
      {byCourse.length === 0 ? (
        <p className="pl-1 text-sm text-muted-foreground">
          No class times yet.{" "}
          <Link href="/courses" className="text-foreground underline underline-offset-4">
            Add them on a course
          </Link>
          .
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5 pl-1">
          {byCourse.map(([code, list]) => (
            <li key={code} className="flex gap-2.5">
              <span className="mt-1 size-2 shrink-0 rounded-full" style={{ background: courseColor(list[0].hue) }} />
              <div className="min-w-0 font-mono text-xs">
                <p className="font-medium">{code}</p>
                {list.map((m) => (
                  <p key={m.id} className="text-muted-foreground">
                    {meetingLabel(m)}
                  </p>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
