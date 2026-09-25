"use client";

import { Check } from "lucide-react";
import { MetalBadge } from "metal-fx";
import { useTheme } from "next-themes";
import { useState } from "react";
import {
  createCourse,
  createItem,
  createMeeting,
  deleteCourse,
  deleteItem,
  deleteMeeting,
  removeClassDay,
  saveTerm,
  updateCourse,
  updateItem,
  updateMeeting,
} from "@/app/actions";
import { useAssistant } from "@/components/app-shell";
import type { ChatMessage } from "@/components/chat/chat-panel";
import { Button } from "@/components/ui/button";
import type { Proposal } from "@/lib/ai";
import { addDays, parseDay, range, sessions, startOfDay } from "@/lib/calendar";
import { courseColor, dayKey, meetingLabel } from "@/lib/course";
import { cn } from "@/lib/utils";

type Entry = NonNullable<ChatMessage["proposals"]>[number];
type ClassTime = { weekdays: number[]; starts: string; ends: string; location: string };

const clock = (d: Date) => d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
const mins = (d: Date) => d.getHours() * 60 + d.getMinutes();
const PX = 9; // px per hour in the mini week
const squash = (code: string) => code.replace(/\s+/g, "").toUpperCase();

// The student said yes: save the change with the same validated server actions the rest of the app uses.
// `due` is the card's (possibly corrected) local date-time, e.g. an exam time the student picked.
export function applyProposal(p: Proposal, courses: { id: string; code: string }[], due?: string) {
  const form = (fields: Record<string, string | string[]>) => {
    const f = new FormData();
    for (const [k, v] of Object.entries(fields)) for (const x of [v].flat()) f.append(k, x);
    return f;
  };
  switch (p.type) {
    case "add": {
      const course = courses.find((c) => squash(c.code) === squash(p.course));
      if (!course) return Promise.resolve({ error: `No course called ${p.course}. Add it first.` });
      // local time; this browser knows the zone
      const at = new Date(due ?? p.due).toISOString();
      return createItem(form({ title: p.title, kind: p.kind, course: course.id, due: at }));
    }
    case "update": {
      const when = due ?? p.due;
      return updateItem(p.id, { title: p.title, due: when && new Date(when).toISOString(), done: p.done });
    }
    case "delete":
      return deleteItem(p.id);
    case "add_class":
      return createMeeting(
        form({ course: p.courseId, day: p.weekdays.map(String), starts: p.starts, ends: p.ends, location: p.location }),
      );
    case "update_class":
      return updateMeeting(p.id, { weekdays: p.weekdays, starts: p.starts, ends: p.ends, location: p.location });
    case "delete_class":
      return deleteMeeting(p.id);
    case "remove_class_day":
      return removeClassDay(p.id, p.date);
    case "add_course":
      return createCourse(form({ code: p.code, name: p.name }));
    case "update_course":
      return updateCourse(form({ id: p.id, code: p.code, name: p.name }));
    case "delete_course":
      return deleteCourse(p.id);
    case "semester":
      return saveTerm(form({ start: p.start, weeks: String(p.weeks) }));
  }
}

// What each kind of change is called on its card, and on its confirm button.
const VERB: Record<Proposal["type"], [string, string]> = {
  add: ["Add", "Add"],
  update: ["Change", "Save"],
  delete: ["Delete", "Delete"],
  add_class: ["Class time", "Add class time"],
  update_class: ["Class time", "Save"],
  delete_class: ["Remove class time", "Remove"],
  remove_class_day: ["Remove from schedule", "Remove"],
  add_course: ["New course", "Add course"],
  update_course: ["Course", "Save"],
  delete_course: ["Delete course", "Delete"],
  semester: ["Semester", "Save"],
};
const DESTRUCTIVE = new Set<Proposal["type"]>(["delete", "delete_class", "delete_course"]);

// One change the assistant proposed, shown where it lands: for dated work and class times, the week around
// it with your classes and everything else due, so you can judge the fit before saying yes. Exams and quizzes
// need a real start time, so the card asks for one when the model only had a date (it defaults to 11:59 PM).
export function ProposalCard({ item, onResolve }: { item: Entry; onResolve: (accept: boolean, due?: string) => void }) {
  const { resolvedTheme } = useTheme();
  const { schedule, courses } = useAssistant();
  const { p, status } = item;
  const current = p.type === "update" ? schedule.items.find((i) => i.id === p.id) : undefined;
  const kind = p.type === "add" ? p.kind : current?.kind;
  const dated = p.type === "add" || p.type === "update" ? p.due : undefined;
  const timed = kind === "exam" || kind === "quiz";
  const [time, setTime] = useState(() => (dated && !(timed && dated.endsWith("23:59")) ? dated.slice(11, 16) : ""));
  const due = dated && time ? `${dated.slice(0, 10)}T${time}` : undefined;
  const code =
    "course" in p
      ? p.course
      : p.type === "update"
        ? current?.course
        : p.type === "update_course" || p.type === "delete_course"
          ? p.code
          : undefined;
  const hue = courses.find((c) => code && squash(c.code) === squash(code))?.hue;
  const open = status === "pending" || status === "saving";
  const [label, button] = VERB[p.type];

  const changes =
    p.type === "update"
      ? [
          p.title && `rename to “${p.title}”`,
          p.due && "move it",
          p.done !== undefined && (p.done ? "mark it done" : "mark it not done"),
        ].filter(Boolean)
      : [];

  return (
    <div className="mt-3 w-full max-w-md rounded-2xl bg-secondary p-4 text-sm">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {/* Metal marks the AI: this came from the assistant, check it before saving. */}
        <MetalBadge theme={resolvedTheme === "light" ? "light" : "dark"} scale={0.85}>
          AI
        </MetalBadge>
        <span>
          {p.type === "add" ? `Add ${p.kind}` : p.type === "update" ? `Change: ${changes.join(", ")}` : label}
        </span>
        {code && (
          <span className="flex items-center gap-1.5 font-mono">
            <span aria-hidden="true">·</span>
            {hue !== undefined && <span className="size-2 rounded-full" style={{ background: courseColor(hue) }} />}
            {code}
          </span>
        )}
      </div>

      <Body p={p} current={current?.title} />

      {dated && (
        <>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-muted-foreground">
            <span>
              {parseDay(dated.slice(0, 10)).toLocaleDateString(undefined, {
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
            <p className="mt-1 text-brand">When does it start? Exams rarely happen at 11:59 PM.</p>
          )}
          <Week
            anchor={parseDay(dated.slice(0, 10))}
            pin={due ? new Date(due) : null}
            skipItem={current?.id}
            timed={timed}
          />
        </>
      )}
      {(p.type === "add_class" || p.type === "update_class") && (
        <Week
          anchor={startOfDay(new Date())}
          klass={p}
          skipClass={p.type === "update_class" ? p.id : undefined}
          saved={status === "saved"}
        />
      )}

      {open ? (
        <div className="mt-4 flex gap-2">
          <Button
            variant={DESTRUCTIVE.has(p.type) ? "destructive" : "default"}
            disabled={status === "saving" || (!!dated && !time)}
            onClick={() => onResolve(true, due)}
            className="h-10 rounded-full px-5 transition-transform active:scale-[0.97]"
          >
            {status === "saving"
              ? "Saving…"
              : dated && !time
                ? "Pick a time first"
                : p.type === "add"
                  ? `Add ${p.kind}`
                  : button}
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
            "mt-3 flex items-center gap-1.5",
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

// The headline and plain-words detail for each kind of change.
function Body({ p, current }: { p: Proposal; current?: string }) {
  const title = "mt-2 text-lg leading-snug font-medium text-balance";
  const detail = "mt-1 text-muted-foreground";
  switch (p.type) {
    case "add":
      return <p className={title}>{p.title}</p>;
    case "update":
      return <p className={title}>{p.title ?? current ?? p.was}</p>;
    case "delete":
      return (
        <>
          <p className={title}>{p.was}</p>
          <p className={detail}>Gone for good once you confirm.</p>
        </>
      );
    case "add_class":
    case "delete_class":
      return <p className={cn(title, "font-mono text-base")}>{meetingLabel(p)}</p>;
    case "remove_class_day":
      return (
        <>
          <p className={title}>
            {parseDay(p.date).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
            <span className="font-mono text-base text-muted-foreground">
              {" "}
              {p.starts}–{p.ends}
            </span>
          </p>
          <p className={detail}>Just this day. The weekly class time stays.</p>
        </>
      );
    case "update_class":
      return (
        <>
          <p className={cn(title, "font-mono text-base")}>{meetingLabel(p)}</p>
          <p className={detail}>
            was <span className="font-mono">{meetingLabel(p.was)}</span>
          </p>
        </>
      );
    case "add_course":
      return (
        <p className={title}>
          <span className="font-mono">{p.code}</span>
          {p.name && <span className="text-muted-foreground"> · {p.name}</span>}
        </p>
      );
    case "update_course":
      return (
        <>
          <p className={title}>
            <span className="font-mono">{p.code}</span>
            {p.name && <span className="text-muted-foreground"> · {p.name}</span>}
          </p>
          <p className={detail}>was {p.was}</p>
        </>
      );
    case "delete_course":
      return (
        <>
          <p className={cn(title, "font-mono")}>{p.code}</p>
          <p className={detail}>
            Its {p.items} item{p.items === 1 ? "" : "s"} and class times go with it, for good.
          </p>
        </>
      );
    case "semester": {
      const start = parseDay(p.start);
      const fmt = (d: Date) => d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
      return (
        <>
          <p className={title}>{p.weeks} weeks</p>
          <p className={detail}>
            {fmt(start)} to {fmt(addDays(start, p.weeks * 7 - 1))}
          </p>
        </>
      );
    }
  }
}

// The week around the change: classes as blocks, other deadlines as ticks, and the new thing in cyan
// ("you, now"): a pinned item, or a new/changed class time drawn on each of its days.
function Week({
  anchor,
  pin,
  klass,
  skipItem,
  skipClass,
  timed,
  saved,
}: {
  anchor: Date;
  pin?: Date | null; // where the item lands; null until the student picks a time
  klass?: ClassTime & { course: string };
  skipItem?: string; // the item being moved, so it isn't drawn twice
  skipClass?: string; // the class time being changed
  saved?: boolean; // once saved, the class is in the schedule too, so it would "overlap" itself
  timed?: boolean;
}) {
  const { schedule } = useAssistant();
  const days = range("week", anchor);
  const keys = new Set(days.map(dayKey));
  const classes = sessions(
    schedule.meetings.filter((m) => m.id !== skipClass),
    days,
    null,
  );
  const fresh = klass ? sessions([{ ...klass, id: "new", name: "", hue: 0 }], days, null) : [];
  const others = schedule.items.filter((i) => i.id !== skipItem && keys.has(dayKey(new Date(i.due))));
  const from = Math.min(
    8,
    ...classes.map((s) => s.start.getHours()),
    ...fresh.map((s) => s.start.getHours()),
    ...others.map((i) => new Date(i.due).getHours()),
    ...(pin ? [pin.getHours()] : []),
  );
  const top = (d: Date) => ((mins(d) - from * 60) / 60) * PX;
  const focus = pin ?? (klass ? null : anchor);
  const isFocus = (d: Date) => !!focus && dayKey(d) === dayKey(focus);
  const overlap = (a: { start: Date; end: Date }, b: { start: Date; end: Date }) => a.start < b.end && b.start < a.end;

  // The fit, in words.
  let line: React.ReactNode = null;
  if (klass && !saved) {
    const clash = fresh.flatMap((f) => classes.filter((c) => overlap(f, c)).map((c) => ({ f, c })))[0];
    line = clash ? (
      <span className="text-destructive">
        Overlaps {clash.c.meeting.course} on {clash.f.start.toLocaleDateString(undefined, { weekday: "long" })} (
        {clock(clash.c.start)}–{clock(clash.c.end)}).
      </span>
    ) : (
      "Fits around your other classes."
    );
  } else if (focus) {
    const same = (d: Date) => dayKey(d) === dayKey(focus);
    const clash = pin && timed ? classes.find((s) => same(s.start) && pin >= s.start && pin < s.end) : undefined;
    const dayLine = [
      ...classes.filter((s) => same(s.start)).map((s) => `${s.meeting.course} class ${clock(s.start)}–${clock(s.end)}`),
      ...others
        .filter((i) => same(new Date(i.due)))
        .map((i) => `${i.title} ${i.kind === "exam" ? "exam" : "due"} ${clock(new Date(i.due))}`),
    ];
    const weekCount = others.filter((i) => !i.doneAt).length;
    line = (
      <>
        {clash && (
          <span className="text-destructive">
            Starts during your {clash.meeting.course} class ({clock(clash.start)}–{clock(clash.end)}).{" "}
          </span>
        )}
        {dayLine.length ? `That day: ${dayLine.join(" · ")}.` : "Nothing else that day."}{" "}
        {weekCount > 0 && `${weekCount} other thing${weekCount === 1 ? "" : "s"} due that week.`}
      </>
    );
  }

  return (
    <div className="mt-3">
      <div className="rounded-xl bg-background p-2">
        <div className="grid grid-cols-[1.5rem_repeat(7,minmax(0,1fr))] pb-1 text-center font-mono text-[10px] leading-tight">
          <span />
          {days.map((d) => (
            <span
              key={d.getTime()}
              className={cn(isFocus(d) ? "font-semibold text-foreground" : "text-muted-foreground")}
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
            <div key={d.getTime()} className={cn("relative border-l border-border", isFocus(d) && "bg-brand/10")}>
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
              {fresh
                .filter((s) => dayKey(s.start) === dayKey(d))
                .map((s) => (
                  <span
                    key={s.key}
                    className="absolute inset-x-0 z-10 rounded-[3px] bg-brand ring-2 ring-background"
                    style={{ top: top(s.start), height: Math.max(4, ((+s.end - +s.start) / 36e5) * PX) }}
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
              {pin && dayKey(pin) === dayKey(d) && (
                <span
                  className="absolute inset-x-0 z-10 h-1.5 rounded-full bg-brand ring-2 ring-background"
                  style={{ top: top(pin) - 3 }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
      {line && <p className="mt-2 leading-snug text-pretty text-muted-foreground">{line}</p>}
    </div>
  );
}
