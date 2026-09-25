"use client";

// Home's extra widgets (the originals live in their own files). `wide` = the main column, else the side column.
import { FileText, Link2, StickyNote } from "lucide-react";
import Link from "next/link";
import { useAssistant } from "@/components/app-shell";
import { Block } from "@/components/block";
import { shortcutsFor } from "@/components/chat/shortcuts";
import { FocusDial } from "@/components/focus-timer";
import { sessions, startOfDay, type Term } from "@/lib/calendar";
import { courseColor, dayKey } from "@/lib/course";
import { streak, studyDays, type FocusSession } from "@/lib/focus";
import type { Item } from "@/lib/progress";
import { cn } from "@/lib/utils";

const clock = (d: Date) => d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
const inMinutes = (ms: number) => (ms < 60 * 60_000 ? `${Math.max(1, Math.round(ms / 60_000))} min` : `${Math.round(ms / 36e5)} h`);

// The same timer as the sidebar button and its floating panel: starting here starts that one.
export function TimerWidget() {
  return (
    <Block title="Focus timer">
      <FocusDial className="mx-auto w-full max-w-64" />
    </Block>
  );
}

// Today's classes. Narrow: the next one and how soon. Wide: the day as a timeline with a "now" line.
export function ClassesWidget({ term, now, wide }: { term: Term | null; now: number; wide: boolean }) {
  const { meetings } = useAssistant().schedule;
  const today = sessions(meetings, [startOfDay(new Date(now))], term).sort((a, b) => +a.start - +b.start);
  const next = today.find((s) => +s.end > now);
  const empty = meetings.length === 0 ? "Add class times on a course page to see them here." : "No classes today.";

  if (!wide || today.length === 0)
    return (
      <Block title="Today's classes">
        {!next ? (
          <p className="text-sm text-muted-foreground">{today.length ? "Done with classes for today." : empty}</p>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <span className="mt-2 size-2.5 shrink-0 rounded-full" style={{ background: courseColor(next.meeting.hue) }} />
              <div className="min-w-0">
                <p className="truncate font-mono text-xl font-medium">{next.meeting.course}</p>
                <p className="text-sm text-muted-foreground">
                  {+next.start <= now ? `now, until ${clock(next.end)}` : `in ${inMinutes(+next.start - now)} · ${clock(next.start)}`}
                  {next.meeting.location && ` · ${next.meeting.location}`}
                </p>
              </div>
            </div>
            {today
              .filter((s) => +s.start > +next.start)
              .map((s) => (
                <p key={s.key} className="flex justify-between gap-2 font-mono text-xs text-muted-foreground">
                  <span className="truncate">{s.meeting.course}</span>
                  <span className="tabular-nums">{clock(s.start)}</span>
                </p>
              ))}
          </div>
        )}
      </Block>
    );

  // Timeline: from 8am (or the first class) to 6pm (or the last), whole hours.
  const from = Math.min(8, ...today.map((s) => s.start.getHours()));
  let to = Math.max(18, ...today.map((s) => s.end.getHours() + (s.end.getMinutes() ? 1 : 0)));
  to += (to - from) % 2; // even span, so the 2-hour labels land on the ends
  const at = (d: Date) => ((d.getHours() + d.getMinutes() / 60 - from) / (to - from)) * 100;
  const nowAt = at(new Date(now));
  return (
    <Block title="Today's classes" aside={next ? `next in ${inMinutes(Math.max(0, +next.start - now))}` : "all done"}>
      <div
        role="img"
        aria-label={today.map((s) => `${s.meeting.course} ${clock(s.start)} to ${clock(s.end)}`).join(", ")}
        className="relative h-16 rounded-lg bg-secondary"
      >
        {today.map((s) => (
          <div
            key={s.key}
            title={`${s.meeting.course} ${clock(s.start)}–${clock(s.end)}${s.meeting.location ? `, ${s.meeting.location}` : ""}`}
            className={cn("absolute inset-y-1.5 overflow-hidden rounded-md px-1.5 py-1", +s.end < now && "opacity-40")}
            style={{ left: `${at(s.start)}%`, width: `${at(s.end) - at(s.start)}%`, background: courseColor(s.meeting.hue) }}
          >
            <span className="block truncate font-mono text-xs font-medium text-black/80">{s.meeting.course}</span>
            <span className="block truncate text-xs text-black/60">{s.meeting.location}</span>
          </div>
        ))}
        {nowAt > 0 && nowAt < 100 && (
          <div className="absolute -inset-y-1 w-0.5 rounded-full bg-brand" style={{ left: `${nowAt}%` }} />
        )}
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-xs text-muted-foreground" aria-hidden="true">
        {Array.from({ length: Math.floor((to - from) / 2) + 1 }, (_, i) => (
          <span key={i}>{((from + i * 2 + 11) % 12) + 1}</span>
        ))}
      </div>
    </Block>
  );
}

// Calendar. Narrow: today (the date and what's due). Wide: this month, a dot per thing due.
export function CalendarWidget({ items, now, wide }: { items: Item[]; now: number; wide: boolean }) {
  const today = new Date(now);
  const due = (d: Date) => items.filter((i) => dayKey(new Date(i.due)) === dayKey(d));
  const link = (
    <Link href="/calendar" className="hover:text-foreground">
      calendar →
    </Link>
  );

  if (!wide) {
    const list = due(today);
    return (
      <Block title="Today" aside={link}>
        <p className="flex items-baseline gap-2">
          <span className="font-mono text-4xl font-medium tabular-nums">{today.getDate()}</span>
          <span className="text-sm text-muted-foreground">
            {today.toLocaleDateString(undefined, { weekday: "long", month: "short" })}
          </span>
        </p>
        <ul className="mt-3 flex flex-col gap-1.5 text-sm">
          {list.length === 0 && <li className="text-muted-foreground">Nothing due today.</li>}
          {list.map((i) => (
            <li key={i.id} className={cn("flex items-center gap-2", i.doneAt && "text-muted-foreground line-through")}>
              <span className="size-2 shrink-0 rounded-full" style={{ background: courseColor(i.hue) }} />
              <span className="truncate">{i.title}</span>
            </li>
          ))}
        </ul>
      </Block>
    );
  }

  const first = new Date(today.getFullYear(), today.getMonth(), 1);
  const start = new Date(first);
  start.setDate(1 - ((first.getDay() + 6) % 7)); // back to Monday
  const weeks = Math.ceil((((first.getDay() + 6) % 7) + new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()) / 7);
  const days = Array.from({ length: weeks * 7 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  return (
    <Block title={today.toLocaleDateString(undefined, { month: "long" })} aside={link}>
      <ol className="grid grid-cols-7 gap-y-1 text-center">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <li key={i} className="font-mono text-xs text-muted-foreground" aria-hidden="true">
            {d}
          </li>
        ))}
        {days.map((d) => {
          const list = due(d);
          const isToday = dayKey(d) === dayKey(today);
          return (
            <li
              key={d.toISOString()}
              className={cn("flex flex-col items-center gap-0.5", d.getMonth() !== today.getMonth() && "opacity-35")}
              title={list.map((i) => `${i.course}: ${i.title}`).join("\n") || undefined}
            >
              <span
                className={cn(
                  "grid size-7 place-items-center rounded-full font-mono text-xs tabular-nums",
                  isToday && "bg-brand font-medium text-brand-foreground",
                )}
                aria-current={isToday ? "date" : undefined}
              >
                {d.getDate()}
              </span>
              {list.length > 0 && <span className="sr-only">{list.length} due</span>}
              <span className="flex h-1.5 gap-0.5" aria-hidden="true">
                {list.slice(0, 3).map((i) => (
                  <span key={i.id} className="size-1.5 rounded-full" style={{ background: courseColor(i.hue) }} />
                ))}
              </span>
            </li>
          );
        })}
      </ol>
    </Block>
  );
}

// The streak, big, and today's focus minutes: the light game part of Study days without the heatmap.
export function StreakWidget({ sessions: list, now }: { sessions: FocusSession[]; now: number }) {
  const days = studyDays(list);
  const today = new Date(now);
  const n = streak(days, today);
  const minutes = days.get(dayKey(today)) ?? 0;
  return (
    <Block title="Streak">
      <p className="flex items-baseline gap-2">
        <span className="font-mono text-5xl font-medium tracking-tight tabular-nums">{n}</span>
        <span className="text-sm text-muted-foreground">{n === 1 ? "day" : "days"} in a row</span>
      </p>
      <p className="mt-2 font-mono text-xs text-muted-foreground">
        {minutes ? `${minutes} min focused today` : n ? "Focus today to keep it going." : "Start the timer to begin one."}
      </p>
    </Block>
  );
}

export type RecentMaterial = { id: string; kind: "file" | "link" | "note"; name: string; course_id: string };
const KIND_ICON = { file: FileText, link: Link2, note: StickyNote };

// The newest uploads across every course; each opens its course's page, where the file lives.
export function MaterialsWidget({
  materials,
  courses,
}: {
  materials: RecentMaterial[];
  courses: { id: string; code: string; hue: number }[];
}) {
  return (
    <Block title="Recent materials">
      {materials.length === 0 ? (
        <p className="text-sm text-muted-foreground">Slides, readings and notes you upload show up here.</p>
      ) : (
        <ul className="-mx-2 flex flex-col">
          {materials.map((m) => {
            const c = courses.find((x) => x.id === m.course_id);
            const Icon = KIND_ICON[m.kind];
            return (
              <li key={m.id}>
                <Link
                  href={`/courses/${m.course_id}`}
                  className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">{m.name}</span>
                  {c && (
                    <span className="flex shrink-0 items-center gap-1.5 font-mono text-xs text-muted-foreground">
                      <span className="size-2 rounded-full" style={{ background: courseColor(c.hue) }} />
                      {c.code}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Block>
  );
}

// One tap to the assistant: the chat's course-aware shortcuts, for the course with the next exam.
export function AskWidget({ items, now }: { items: Item[]; now: number }) {
  const a = useAssistant();
  const exam = items
    .filter((i) => i.kind === "exam" && !i.doneAt && Date.parse(i.due) > now)
    .sort((x, y) => x.due.localeCompare(y.due))[0];
  const chips = shortcutsFor(exam?.course, items, now).slice(0, 4);
  return (
    <Block title="Ask about…" aside={exam?.course}>
      <ul className="flex flex-wrap gap-2">
        {chips.map((c) => (
          <li key={c.label}>
            <button
              type="button"
              disabled={a.busy}
              onClick={() => {
                a.send(c.prompt, false, undefined, c.focus);
                a.show();
              }}
              className="flex h-9 items-center gap-2 rounded-full bg-secondary px-3.5 text-sm transition-[background-color,transform] outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97] disabled:opacity-50"
            >
              <c.icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="max-w-56 truncate">{c.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </Block>
  );
}
