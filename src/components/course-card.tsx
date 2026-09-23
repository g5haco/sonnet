import { addDays, sessions, startOfDay, type ClassMeeting } from "@/lib/calendar";
import type { Item } from "@/lib/progress";
import { cn } from "@/lib/utils";

export type CourseCard = {
  id: string;
  code: string;
  name: string;
  hue: number;
  meetings: ClassMeeting[];
  items: Item[]; // this course's work
};

// The numbers a course card reads out, from that course's own items and class times.
export function courseStats(items: Item[], meetings: ClassMeeting[], now: number) {
  const sunday = startOfDay(addDays(new Date(now), (7 - new Date(now).getDay()) % 7));
  sunday.setHours(23, 59, 59, 999);
  const open = items.filter((i) => !i.doneAt);
  const exam = open
    .filter((i) => i.kind === "exam" && Date.parse(i.due) > now)
    .sort((a, b) => Date.parse(a.due) - Date.parse(b.due))[0];
  const today = startOfDay(new Date(now));
  const next = sessions(
    meetings,
    Array.from({ length: 8 }, (_, i) => addDays(today, i)),
    null,
  )
    .filter((s) => +s.end > now)
    .sort((a, b) => +a.start - +b.start)[0];
  return {
    week: open.filter((i) => Date.parse(i.due) >= now && Date.parse(i.due) <= +sunday).length,
    late: open.filter((i) => Date.parse(i.due) < now).length,
    examIn: exam && Math.ceil((Date.parse(exam.due) - now) / 864e5),
    nextClass:
      next &&
      `${+startOfDay(next.start) === +today ? "today" : next.start.toLocaleDateString(undefined, { weekday: "short" })} ${next.start.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`,
  };
}

// A course as a physical index card in its own color. Same light card in both themes, so the dark ink on it
// keeps >= 7:1 contrast whatever the page is doing.
// `compact`: the Home carousel's smaller cards keep only what reads at that size.
export function CourseFace({ course, now, compact }: { course: CourseCard; now: number; compact?: boolean }) {
  const s = courseStats(course.items, course.meetings, now);
  return (
    <div
      className="flex h-full flex-col p-5 text-[oklch(0.2_0_0)] select-none"
      style={{
        background: `linear-gradient(165deg, oklch(0.82 0.11 ${course.hue}), oklch(0.7 0.13 ${course.hue}))`,
      }}
    >
      <p className={cn("font-mono leading-tight font-semibold tracking-tight", compact ? "text-xl" : "text-lg")}>
        {course.code}
      </p>
      {course.name && (
        <p className={cn("mt-1 text-sm leading-snug font-medium", compact ? "line-clamp-1" : "line-clamp-2")}>
          {course.name}
        </p>
      )}
      <div className="mt-auto">
        <p className="text-6xl leading-none font-medium tracking-tight tabular-nums">{s.week}</p>
        <p className="mt-1 font-mono text-xs">
          due this week{s.late > 0 && <span className="font-semibold"> · {s.late} late</span>}
        </p>
        {compact ? (
          <p className="mt-3 border-t border-[oklch(0.2_0_0/0.2)] pt-2 font-mono text-xs">
            {s.examIn ? `exam in ${s.examIn}d` : s.nextClass ? `class ${s.nextClass}` : "no exams yet"}
          </p>
        ) : (
          <p className="mt-3 flex flex-wrap justify-between gap-x-2 border-t border-[oklch(0.2_0_0/0.2)] pt-2 font-mono text-[11px] whitespace-nowrap">
            <span>{s.examIn ? `exam in ${s.examIn}d` : "no exams yet"}</span>
            <span>{s.nextClass ?? "no class times"}</span>
          </p>
        )}
      </div>
    </div>
  );
}
