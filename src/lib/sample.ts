import type { Item } from "./progress";

// Demo data until Phase 1/2 wire up real courses. Dates are relative to "now" so it always looks live.
export const courses = [
  { code: "CHEM 1210", name: "General Chemistry I", hue: 25, grade: 88.6 },
  { code: "MATH 2415", name: "Calculus III", hue: 265, grade: 93.1 },
  { code: "PSYC 1010", name: "Intro to Psychology", hue: 330, grade: 96.4 },
  { code: "WRTG 1150", name: "First-Year Writing", hue: 85, grade: 84.9 },
  { code: "CSCI 1300", name: "Computer Science 1", hue: 160, grade: 91.7 },
];

export const courseColor = (code: string) =>
  `oklch(var(--course-l) var(--course-c) ${courses.find((c) => c.code === code)?.hue ?? 0})`;

export const WEEKS = 16;
// Local calendar date as YYYY-MM-DD (toISOString would give the UTC date).
export const dayKey = (d: Date) => d.toLocaleDateString("en-CA");
const DAY = 864e5;
const today = new Date();
today.setHours(23, 59, 0, 0);
// Monday four weeks back, so "now" sits in week 5 of 16.
export const termStart = new Date(today.getTime() - ((today.getDay() + 6) % 7) * DAY - 28 * DAY);
termStart.setHours(0, 0, 0, 0);

// [day from term start, course, title, kind, done: true | false | days-late]
const rows: [number, string, string, Item["kind"], boolean | number][] = [
  [2, "PSYC 1010", "Syllabus quiz", "quiz", true],
  [4, "CSCI 1300", "Lab 0: Setup", "assignment", true],
  [7, "MATH 2415", "HW 12.1 Vectors", "assignment", true],
  [9, "CHEM 1210", "Problem Set 1", "assignment", true],
  [11, "WRTG 1150", "Reading response 1", "reading", true],
  [14, "MATH 2415", "HW 12.3 Dot product", "assignment", true],
  [15, "CSCI 1300", "Lab 1: Loops", "assignment", 1],
  [16, "CHEM 1210", "Problem Set 2", "assignment", true],
  [18, "PSYC 1010", "Ch. 2 quiz", "quiz", true],
  [21, "MATH 2415", "HW 12.5 Lines & planes", "assignment", true],
  [22, "WRTG 1150", "Essay 1 draft", "assignment", false],
  [23, "CHEM 1210", "Lab report: Density", "assignment", true],
  [25, "CSCI 1300", "Lab 2: Functions", "assignment", true],
  [28, "MATH 2415", "HW 13.1 Vector functions", "assignment", true],
  [29, "PSYC 1010", "Ch. 3 quiz", "quiz", false],
  [30, "CHEM 1210", "Problem Set 3", "assignment", false],
  [31, "CSCI 1300", "Lab 3: Lists", "assignment", false],
  [32, "WRTG 1150", "Peer review notes", "reading", false],
  [35, "MATH 2415", "HW 13.3 Arc length", "assignment", false],
  [36, "CHEM 1210", "Midterm 1", "exam", false],
  [38, "WRTG 1150", "Essay 1 final", "assignment", false],
  [39, "CSCI 1300", "Project 1: Text adventure", "assignment", false],
  [42, "PSYC 1010", "Midterm", "exam", false],
  [44, "MATH 2415", "Quiz 2", "quiz", false],
  [46, "CHEM 1210", "Problem Set 4", "assignment", false],
  [50, "CSCI 1300", "Lab 4: Dictionaries", "assignment", false],
  [52, "WRTG 1150", "Reading response 4", "reading", false],
  [56, "MATH 2415", "Midterm", "exam", false],
  [60, "CHEM 1210", "Problem Set 5", "assignment", false],
  [66, "CSCI 1300", "Project 2", "assignment", false],
  [73, "PSYC 1010", "Ch. 7 quiz", "quiz", false],
  [80, "WRTG 1150", "Essay 2 draft", "assignment", false],
  [88, "CHEM 1210", "Midterm 2", "exam", false],
  [95, "MATH 2415", "HW 15.2", "assignment", false],
  [103, "CSCI 1300", "Final project", "assignment", false],
  [109, "CHEM 1210", "Final exam", "exam", false],
];

const iso = (day: number) => new Date(termStart.getTime() + day * DAY + 23 * 3600e3).toISOString();

export const sampleItems: Item[] = rows.map(([day, course, title, kind, done], i) => ({
  id: String(i),
  title,
  course,
  kind,
  due: iso(day),
  doneAt: done === false ? null : iso(day - 1 + (done === true ? 0 : done)),
}));

// Study minutes per day: deterministic pattern, none in the future.
export const studyDays = Array.from({ length: WEEKS * 7 }, (_, day) => {
  const date = new Date(termStart.getTime() + day * DAY);
  const past = date <= today;
  const recent = today.getTime() - date.getTime() < 9 * DAY; // a live 9-day streak
  const count = !past ? 0 : recent ? 20 + ((day * 37) % 90) : [0, 25, 50, 0, 75, 40, 110, 30, 0, 60][(day * 7 + 3) % 10];
  return {
    date: dayKey(date),
    count,
    level: count === 0 ? 0 : Math.min(4, Math.ceil(count / 30)),
  };
});
