"use client";

import { Check } from "lucide-react";
import { MetalBadge } from "metal-fx";
import { useTheme } from "next-themes";
import { useState } from "react";
import { useAssistant } from "@/components/app-shell";
import type { ChatMessage } from "@/components/chat/chat-panel";
import { Button } from "@/components/ui/button";
import { parseDay, range, sessions } from "@/lib/calendar";
import { courseColor, dayKey } from "@/lib/course";
import { cn } from "@/lib/utils";

type Entry = NonNullable<ChatMessage["proposals"]>[number];

const clock = (d: Date) => d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
const mins = (d: Date) => d.getHours() * 60 + d.getMinutes();
const PX = 9; // px per hour in the mini week

// One change the assistant proposed, shown where it lands: the week around it, your classes and everything
// else due, so you can judge the fit before saying yes. Exams and quizzes need a real start time, so the card
// asks for one when the model only had a date (it defaults to 11:59 PM).
export function ProposalCard({ item, onResolve }: { item: Entry; onResolve: (accept: boolean, due?: string) => void }) {
  const { resolvedTheme } = useTheme();
  const { schedule, courses } = useAssistant();
  const { p, status } = item;
  const current = p.type === "update" ? schedule.items.find((i) => i.id === p.id) : undefined;
  const kind = p.type === "add" ? p.kind : current?.kind;
  const timed = kind === "exam" || kind === "quiz";
  const [time, setTime] = useState(() => (p.due && !(timed && p.due.endsWith("23:59")) ? p.due.slice(11, 16) : ""));
  const due = p.due && time ? `${p.due.slice(0, 10)}T${time}` : undefined;
  const code = p.type === "add" ? p.course : current?.course;
  const hue = courses.find(
    (c) => c.code.replace(/\s+/g, "").toUpperCase() === code?.replace(/\s+/g, "").toUpperCase(),
  )?.hue;
  const open = status === "pending" || status === "saving";

  const title = p.type === "add" ? p.title : (p.title ?? current?.title ?? p.was);
  const changes =
    p.type === "update"
      ? [
          p.title && `rename to “${p.title}”`,
          p.due && "move it",
          p.done !== undefined && (p.done ? "mark it done" : "mark it not done"),
        ].filter(Boolean)
      : [];

  return (
    <div className="mt-3 w-full max-w-md rounded-2xl bg-secondary p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {/* Metal marks the AI: this came from the assistant, check it before saving. */}
        <MetalBadge theme={resolvedTheme === "light" ? "light" : "dark"} scale={0.85}>
          AI
        </MetalBadge>
        <span>
          {p.type === "add" ? `Add ${p.kind}` : `Change: ${changes.join(", ")}`}
          {code && " · "}
        </span>
        {code && (
          <span className="flex items-center gap-1.5 font-mono">
            {hue !== undefined && <span className="size-2 rounded-full" style={{ background: courseColor(hue) }} />}
            {code}
          </span>
        )}
      </div>
      <p className="mt-2 text-lg leading-snug font-medium text-balance">{title}</p>

      {p.due && (
        <>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>
              {parseDay(p.due.slice(0, 10)).toLocaleDateString(undefined, {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </span>
            <span aria-hidden="true">·</span>
            {open ? (
              <label className="flex items-center gap-2">
                <span>{timed ? "starts" : "due"}</span>
                <input
                  type="time"
                  value={time}
                  required
                  onChange={(e) => setTime(e.target.value)}
                  aria-label={timed ? "Start time" : "Due time"}
                  className={cn(
                    "h-8 rounded-full bg-background px-3 font-mono text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    !time && "ring-2 ring-brand",
                  )}
                />
              </label>
            ) : (
              <span className="font-mono">{due && clock(new Date(due))}</span>
            )}
          </div>
          {timed && !time && open && (
            <p className="mt-1 text-sm text-brand">When does it start? Exams rarely happen at 11:59 PM.</p>
          )}
          <Week due={due ?? `${p.due.slice(0, 10)}T12:00`} placed={!!due} skip={current?.id} timed={timed} />
        </>
      )}

      {open ? (
        <div className="mt-4 flex gap-2">
          <Button
            disabled={status === "saving" || (!!p.due && !time)}
            onClick={() => onResolve(true, due)}
            className="h-10 rounded-full px-5 transition-transform active:scale-[0.97]"
          >
            {status === "saving"
              ? "Saving…"
              : p.due && !time
                ? "Pick a time first"
                : p.type === "add"
                  ? `Add ${p.kind}`
                  : "Save"}
          </Button>
          <Button
            variant="ghost"
            disabled={status === "saving"}
            onClick={() => onResolve(false)}
            className="h-10 rounded-full px-4"
          >
            Skip
          </Button>
        </div>
      ) : (
        <p
          className={cn(
            "mt-3 flex items-center gap-1.5 text-sm",
            status === "saved" ? "text-done" : status === "error" ? "text-destructive" : "text-muted-foreground",
          )}
          role="status"
        >
          {status === "saved" && <Check className="size-4" />}
          {status === "saved" ? "Saved" : status === "skipped" ? "Skipped" : item.error}
        </p>
      )}
    </div>
  );
}

// The week around the new date: classes as blocks, other deadlines as ticks, the new one in cyan ("you, now").
function Week({
  due,
  placed,
  skip,
  timed,
}: {
  due: string; // local "YYYY-MM-DDTHH:mm"
  placed: boolean; // false until the student picks a time
  skip?: string; // the item being moved, so it isn't drawn twice
  timed: boolean;
}) {
  const { schedule } = useAssistant();
  const at = new Date(due);
  const days = range("week", at);
  const keys = new Set(days.map(dayKey));
  const classes = sessions(schedule.meetings, days, null);
  const others = schedule.items.filter((i) => i.id !== skip && keys.has(dayKey(new Date(i.due))));
  const from = Math.min(
    8,
    ...classes.map((s) => s.start.getHours()),
    ...others.map((i) => new Date(i.due).getHours()),
    at.getHours(),
  );
  const top = (d: Date) => ((mins(d) - from * 60) / 60) * PX;

  // The fit, in words: a clash with a class, then what else that day and week hold.
  const sameDay = (d: Date) => dayKey(d) === dayKey(at);
  const clash = placed && timed ? classes.find((s) => sameDay(s.start) && at >= s.start && at < s.end) : undefined;
  const dayClasses = classes.filter((s) => sameDay(s.start));
  const dayItems = others.filter((i) => sameDay(new Date(i.due)));
  const dayLine = [
    ...dayClasses.map((s) => `${s.meeting.course} class ${clock(s.start)}–${clock(s.end)}`),
    ...dayItems.map((i) => `${i.title} ${i.kind === "exam" ? "exam" : "due"} ${clock(new Date(i.due))}`),
  ];
  const weekCount = others.filter((i) => !i.doneAt).length;

  return (
    <div className="mt-3">
      <div className="rounded-xl bg-background p-2">
        <div className="grid grid-cols-[1.5rem_repeat(7,minmax(0,1fr))] pb-1 text-center font-mono text-[10px] leading-tight">
          <span />
          {days.map((d) => (
            <span
              key={d.getTime()}
              className={cn(sameDay(d) ? "font-semibold text-foreground" : "text-muted-foreground")}
            >
              {d.toLocaleDateString(undefined, { weekday: "narrow" })}
              <br />
              {d.getDate()}
            </span>
          ))}
        </div>
        <div
          className="relative grid grid-cols-[1.5rem_repeat(7,minmax(0,1fr))]"
          style={{ height: (24 - from) * PX }}
          aria-hidden="true"
        >
          <div className="relative">
            {[12, 18]
              .filter((h) => h > from)
              .map((h) => (
                <span
                  key={h}
                  className="absolute right-1 -translate-y-1/2 font-mono text-[9px] text-muted-foreground"
                  style={{ top: (h - from) * PX }}
                >
                  {h === 12 ? "12p" : "6p"}
                </span>
              ))}
          </div>
          {days.map((d) => (
            <div key={d.getTime()} className={cn("relative border-l border-border", sameDay(d) && "bg-brand/10")}>
              {classes
                .filter((s) => dayKey(s.start) === dayKey(d))
                .map((s) => (
                  <span
                    key={s.key}
                    className="absolute inset-x-0.5 rounded-[3px]"
                    style={{
                      top: top(s.start),
                      height: Math.max(3, ((+s.end - +s.start) / 36e5) * PX),
                      background: `color-mix(in oklch, ${courseColor(s.meeting.hue)} 55%, transparent)`,
                    }}
                  />
                ))}
              {others
                .filter((i) => dayKey(new Date(i.due)) === dayKey(d))
                .map((i) => (
                  <span
                    key={i.id}
                    className={cn("absolute inset-x-1 h-[3px] rounded-full", i.doneAt && "opacity-40")}
                    style={{ top: top(new Date(i.due)), background: courseColor(i.hue) }}
                  />
                ))}
              {sameDay(d) && placed && (
                <span
                  className="absolute inset-x-0 z-10 h-1.5 rounded-full bg-brand ring-2 ring-background"
                  style={{ top: top(at) - 3 }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
      <p className="mt-2 text-sm leading-snug text-pretty text-muted-foreground">
        {clash && (
          <span className="text-destructive">
            Starts during your {clash.meeting.course} class ({clock(clash.start)}–{clock(clash.end)}).{" "}
          </span>
        )}
        {dayLine.length ? `That day: ${dayLine.join(" · ")}.` : "Nothing else that day."}{" "}
        {weekCount > 0 && `${weekCount} other thing${weekCount === 1 ? "" : "s"} due that week.`}
      </p>
    </div>
  );
}
