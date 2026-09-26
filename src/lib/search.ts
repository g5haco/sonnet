import { dayKey } from "./course";
import { endOfWeek, type Item } from "./progress";

// Home's smart search: plain words ("next exam", "overdue pols", "friday", "oct 3", "settings") -> result cards.
// ponytail: keyword rules, not an AI; Ask Sonnet is the fallback for anything fuzzier.

type Course = { id: string; code: string; name: string; hue: number };
export type Place = { label: string; hint: string; href?: string; settings?: "account" | "semester" | "data" };
export type Results = { days: { date: string; items: Item[] }[]; courses: Course[]; items: Item[]; places: Place[] };

const PLACES: (Place & { words: string[] })[] = [
  { label: "Home", hint: "your dashboard", href: "/", words: ["home", "dashboard", "widgets"] },
  { label: "Calendar", hint: "day, week and month", href: "/calendar", words: ["calendar", "schedule", "month", "classes"] },
  { label: "Courses", hint: "every course", href: "/courses", words: ["courses", "classes", "materials", "syllabus"] },
  { label: "Chat with Sonnet", hint: "your AI", href: "/chat", words: ["chat", "sonnet", "ai", "ask", "assistant"] },
  { label: "Account settings", hint: "name, email, sign out", settings: "account", words: ["settings", "account", "profile", "name", "email", "password", "sign", "logout"] },
  { label: "Semester settings", hint: "term dates and length", settings: "semester", words: ["settings", "semester", "term", "weeks", "start"] },
  { label: "Data settings", hint: "Canvas, export, reset", settings: "data", words: ["settings", "data", "canvas", "export", "delete", "reset", "sync"] },
];

const KINDS: Record<string, Item["kind"]> = {
  exam: "exam", exams: "exam", midterm: "exam", midterms: "exam", final: "exam", finals: "exam", test: "exam", tests: "exam",
  quiz: "quiz", quizzes: "quiz",
  reading: "reading", readings: "reading", read: "reading",
  assignment: "assignment", assignments: "assignment", homework: "assignment", hw: "assignment", essay: "assignment",
};
const STATUS: Record<string, "overdue" | "done" | "next"> = {
  overdue: "overdue", late: "overdue", missed: "overdue", missing: "overdue", behind: "overdue",
  done: "done", completed: "done", finished: "done", submitted: "done",
  next: "next", upcoming: "next", soon: "next", coming: "next", todo: "next",
};
const FILLER = new Set(["due", "the", "my", "a", "an", "all", "any", "what", "whats", "what's", "is", "are", "show", "me", "for", "in", "on", "of", "to", "do", "i", "have", "work", "stuff", "things", "items", "up", "this", "week", "when"]);
const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const at0 = (t: number) => new Date(t).setHours(0, 0, 0, 0);

export function search(raw: string, items: Item[], courses: Course[], now: number): Results {
  let q = ` ${raw.toLowerCase().trim()} `;
  const out: Results = { days: [], courses: [], items: [], places: [] };
  if (!q.trim()) return out;

  // Dates first, cut out of the query as they're found: a range narrows work, a single day also gets a day card.
  let range: [number, number] | null = null;
  let day: number | null = null;
  const take = (re: RegExp) => {
    const m = q.match(re);
    if (m) q = q.replace(m[0], " ");
    return m;
  };
  const today = at0(now);
  if (take(/ next week /)) range = [endOfWeek(now) + 1, endOfWeek(now) + 7 * 864e5];
  else if (take(/ this week /)) range = [today, endOfWeek(now)];
  else if (take(/ today | tonight /)) day = today;
  else if (take(/ tomorrow /)) day = today + 864e5;
  else if (take(/ yesterday /)) day = today - 864e5;
  else {
    const m = take(/ (jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.? (\d{1,2})(st|nd|rd|th)? /) ?? take(/ (\d{1,2})\/(\d{1,2}) /);
    const w = take(/ (sun|mon|tues?|wed(?:nes)?|thu(?:rs?)?|fri|sat(?:ur)?)(day)? /);
    if (m) {
      const month = isNaN(+m[1]) ? MONTHS.indexOf(m[1]) : +m[1] - 1;
      const year = new Date(now).getFullYear();
      // More than ~2 months back means next year's ("jan 5" in December); "2/30" isn't a date.
      let d = new Date(year, month, +m[2]);
      if (d.getTime() < today - 60 * 864e5) d = new Date(year + 1, month, +m[2]);
      if (d.getDate() === +m[2]) day = d.getTime();
    } else if (w) {
      const dow = DAYS.findIndex((d) => d.startsWith(w[1]));
      day = today + (((dow - new Date(now).getDay() + 7) % 7) * 864e5); // the next one, today included
      day = at0(day + 2 * 36e5); // DST-safe snap back to midnight
    }
  }
  if (day != null) range = [day, day + 864e5 - 1];

  // Then keywords: kind, status, course, and whatever's left is text to match in titles.
  const words = q.split(/\s+/).filter(Boolean);
  let kind: Item["kind"] | undefined;
  let status: "overdue" | "done" | "next" | undefined;
  const text: string[] = [];
  const hit = new Set<Course>();
  for (const w of words) {
    if (KINDS[w]) kind = KINDS[w];
    else if (STATUS[w]) status = STATUS[w];
    else if (!FILLER.has(w)) {
      const n = norm(w);
      const c = n.length >= 2 ? courses.filter((c) => norm(c.code).startsWith(n) || (n.length >= 4 && norm(c.name).includes(n))) : [];
      if (c.length) c.forEach((x) => hit.add(x));
      else text.push(n);
    }
  }
  out.courses = [...hit];
  out.places = PLACES.filter((p) => words.some((w) => w.length >= 2 && !FILLER.has(w) && p.words.some((k) => k.startsWith(w))));

  const sorted = (list: Item[]) => {
    const open = list.filter((i) => !i.doneAt);
    const future = open.filter((i) => Date.parse(i.due) >= now).sort((a, b) => Date.parse(a.due) - Date.parse(b.due));
    const late = open.filter((i) => Date.parse(i.due) < now).sort((a, b) => Date.parse(b.due) - Date.parse(a.due));
    const done = list.filter((i) => i.doneAt).sort((a, b) => Date.parse(b.due) - Date.parse(a.due));
    return status === "overdue" ? late : status === "done" ? done : status === "next" ? future : [...future, ...late, ...done];
  };
  const matched = items.filter(
    (i) =>
      (!hit.size || [...hit].some((c) => c.id === i.courseId)) &&
      (!kind || i.kind === kind) &&
      (!range || (Date.parse(i.due) >= range[0] && Date.parse(i.due) <= range[1])) &&
      text.every((t) => norm(i.title).includes(t)),
  );
  // Only list work when the query asked for some (a lone course name shows the course, plus its upcoming work).
  if (kind || status || range || text.length || hit.size) out.items = sorted(matched).slice(0, 8);
  if (day != null) out.days = [{ date: dayKey(new Date(day)), items: sorted(matched) }];
  return out;
}
