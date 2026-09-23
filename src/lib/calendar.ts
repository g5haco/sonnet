import { dayKey, type Meeting } from "./course";

// Date math for the calendar views, in the browser's local time. Weeks start on Monday like the rest of
// Sonnet (week strip, progress weeks, the assistant's calendar lines).

export type View = "day" | "week" | "month";
export type Term = { start: string; weeks: number };
export type ClassMeeting = Meeting & { course: string; name: string; hue: number };
export type Session = { key: string; meeting: ClassMeeting; start: Date; end: Date };

// setDate keeps wall-clock time across DST changes; adding 864e5 ms would not.
export const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const mondayOf = (d: Date) => addDays(startOfDay(d), -((d.getDay() + 6) % 7));
export const parseDay = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

// The days a view shows around `anchor`. Month is always 6 full weeks, so the grid never jumps in height.
export function range(view: View, anchor: Date) {
  if (view === "day") return [startOfDay(anchor)];
  const first = view === "week" ? mondayOf(anchor) : mondayOf(new Date(anchor.getFullYear(), anchor.getMonth(), 1));
  return Array.from({ length: view === "week" ? 7 : 42 }, (_, i) => addDays(first, i));
}

// Previous/next page. Month keeps the day of month where it can (Jan 31 -> Feb 28).
export function step(view: View, anchor: Date, dir: number) {
  if (view !== "month") return addDays(anchor, dir * (view === "week" ? 7 : 1));
  const x = new Date(anchor.getFullYear(), anchor.getMonth() + dir, 1);
  x.setDate(Math.min(anchor.getDate(), new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate()));
  return x;
}

export function title(view: View, anchor: Date) {
  if (view === "day") return anchor.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  if (view === "month") return anchor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const days = range("week", anchor);
  const fmt = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" });
  return fmt.formatRange(days[0], days[6]); // "Sep 21 – 27, 2026", "Sep 28 – Oct 4, 2026"
}

const at = (day: Date, time: string) => {
  const x = new Date(day);
  x.setHours(+time.slice(0, 2), +time.slice(3, 5), 0, 0);
  return x;
};

// Weekly class times placed on real days, only inside the semester when its dates are set.
export function sessions(meetings: ClassMeeting[], days: Date[], term: Term | null): Session[] {
  const from = term && parseDay(term.start);
  const until = from && addDays(from, term.weeks * 7);
  return days.flatMap((d) =>
    from && until && (d < from || d >= until)
      ? []
      : meetings
          .filter((m) => m.weekdays.includes(d.getDay()))
          .map((m) => ({ key: `${m.id}-${dayKey(d)}`, meeting: m, start: at(d, m.starts), end: at(d, m.ends) })),
  );
}

// Overlapping events share a day column side by side: each gets a lane and its cluster's lane count.
export function lanes<T extends { start: Date; end: Date }>(list: T[]) {
  const out: (T & { lane: number; lanes: number })[] = [];
  let cluster: typeof out = [];
  let ends: number[] = [];
  let clusterEnd = 0;
  const close = () => cluster.forEach((e) => (e.lanes = ends.length));
  for (const e of [...list].sort((a, b) => +a.start - +b.start)) {
    if (+e.start >= clusterEnd) {
      close();
      cluster = [];
      ends = [];
    }
    let lane = ends.findIndex((t) => t <= +e.start);
    if (lane < 0) lane = ends.length;
    ends[lane] = +e.end;
    clusterEnd = Math.max(clusterEnd, +e.end);
    const placed = { ...e, lane, lanes: 1 };
    cluster.push(placed);
    out.push(placed);
  }
  close();
  return out;
}
