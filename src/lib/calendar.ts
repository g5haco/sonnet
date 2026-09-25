import { dayKey, type Meeting } from "./course";

// Date math for the calendar views, in the browser's local time. Weeks start on Monday like the rest of
// Sonnet (week strip, progress weeks, the assistant's calendar lines).

export type View = "day" | "week" | "month";
export type Term = { start: string; weeks: number };
export type ClassMeeting = Meeting & { course: string; name: string; hue: number; courseId?: string };
export type Session = { key: string; meeting: ClassMeeting; start: Date; end: Date };

// setDate keeps wall-clock time across DST changes; adding 864e5 ms would not.
export const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const mondayOf = (d: Date) => addDays(startOfDay(d), -((d.getDay() + 6) % 7));
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
          .filter((m) => m.weekdays.includes(d.getDay()) && !m.skip_dates?.includes(dayKey(d)))
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

// ---- Google Calendar feed (iCalendar, RFC 5545) ----

// What the calendar_feed() database function returns (migration 0003).
export type Feed = {
  term: Term;
  courses: { id: string; code: string }[];
  items: { id: string; course_id: string; kind: string; title: string; due: string; done_at: string | null }[];
  meetings: (Omit<Meeting, "id"> & { id: string; course_id: string })[];
};

const BYDAY = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
const LABEL: Record<string, string> = { assignment: "Due", exam: "Exam", quiz: "Quiz", reading: "Reading" };
const ics = (s: string) => s.replace(/[\\;,]/g, (c) => "\\" + c).replace(/\r?\n/g, "\\n");
const utc = (d: Date) =>
  d
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, ""); // 20260924T010000Z
// No timezone on class times ("floating"): Google shows them at the same wall-clock time in your own zone.
const floating = (day: Date, time: string) => `${utc(day).slice(0, 8)}T${time.slice(0, 5).replace(":", "")}00`;

// ponytail: lines aren't folded at 75 octets (a SHOULD in the spec); Google reads long lines fine.
export function toIcs(feed: Feed, now: Date) {
  const code = new Map(feed.courses.map((c) => [c.id, c.code]));
  const start = new Date(`${feed.term.start}T00:00:00Z`);
  const last = utc(new Date(+start + (feed.term.weeks * 7 - 1) * 864e5)).slice(0, 8);
  const out = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Sonnet//Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Sonnet",
    "X-PUBLISHED-TTL:PT1H",
  ];
  const event = (uid: string, ...props: string[]) =>
    out.push("BEGIN:VEVENT", `UID:${uid}@sonnet`, `DTSTAMP:${utc(now)}`, ...props, "END:VEVENT");

  for (const m of feed.meetings) {
    // Repeats weekly from the first class day of the semester to its last day.
    const first = Array.from({ length: 7 }, (_, i) => new Date(+start + i * 864e5)).find((d) =>
      m.weekdays.includes(d.getUTCDay()),
    )!;
    event(
      `class-${m.id}`,
      `DTSTART:${floating(first, m.starts)}`,
      `DTEND:${floating(first, m.ends)}`,
      `RRULE:FREQ=WEEKLY;BYDAY=${m.weekdays.map((d) => BYDAY[d]).join(",")};UNTIL=${last}T235959`,
      `SUMMARY:${ics(`${code.get(m.course_id) ?? "Class"} class`)}`,
      ...(m.location ? [`LOCATION:${ics(m.location)}`] : []),
      ...(m.skip_dates ?? []).map((d) => `EXDATE:${floating(new Date(`${d}T00:00:00Z`), m.starts)}`),
    );
  }
  // Deadlines are moments, not blocks: no DTEND means the event ends when it starts.
  for (const i of feed.items)
    event(
      i.id,
      `DTSTART:${utc(new Date(i.due))}`,
      `SUMMARY:${ics(`${i.done_at ? "Done" : (LABEL[i.kind] ?? "Due")}: ${i.title} (${code.get(i.course_id) ?? ""})`)}`,
    );
  out.push("END:VCALENDAR");
  return out.join("\r\n") + "\r\n";
}
