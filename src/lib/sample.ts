// Made-up data for the widget library: a widget with nothing real to show yet previews with this instead,
// labeled "Sample", so you can see what it does before adding it. Never saved, never shown on Home itself.
import { addDays, startOfDay, type ClassMeeting } from "./calendar";
import { dayKey } from "./course";
import type { FocusSession } from "./focus";
import type { Item } from "./progress";

const COURSES = [
  { id: "s1", code: "MATH 142", name: "Calculus II", hue: 290, grade: 91.5 },
  { id: "s2", code: "CHEM 110", name: "General Chemistry", hue: 200, grade: 84.2 },
  { id: "s3", code: "ENGL 101", name: "Composition", hue: 65, grade: 95 },
  { id: "s4", code: "HIST 150", name: "World History", hue: 20, grade: 78.6 },
];

export function sampleData(now: number) {
  const today = startOfDay(new Date(now));
  // Its own term, five weeks in, so week-by-week charts have something to draw even in your first week.
  const term = { start: dayKey(addDays(today, -32)), weeks: 16 };
  const at = (days: number, h = 23, m = 59) => {
    const d = addDays(today, days);
    d.setHours(h, m);
    return d.toISOString();
  };
  // Work from four weeks back to three weeks ahead; most past work checked off.
  const back = 28;
  const kinds: Item["kind"][] = ["assignment", "quiz", "assignment", "reading", "assignment", "exam"];
  const items: Item[] = Array.from({ length: 24 }, (_, k) => {
    const c = COURSES[k % 4];
    const day = -back + Math.round((k * (back + 21)) / 24);
    const kind = kinds[k % kinds.length];
    const past = day < 0;
    return {
      id: `sample-${k}`,
      title: kind === "exam" ? `Exam ${Math.ceil(k / 6)}` : kind === "quiz" ? `Quiz ${k}` : kind === "reading" ? `Chapter ${k}` : `Problem set ${k}`,
      course: c.code,
      courseId: c.id,
      hue: c.hue,
      kind,
      due: at(day),
      doneAt: past && k % 5 !== 1 ? at(day - 1, 20) : null,
      score: past ? 8 + (k % 3) : null,
      points: past ? 10 : null,
    };
  });
  const meetings: ClassMeeting[] = COURSES.map((c, k) => ({
    id: `sample-m${k}`,
    weekdays: k % 2 ? [2, 4] : [1, 3, 5],
    starts: ["09:00", "11:00", "13:30", "15:00"][k],
    ends: ["09:50", "12:15", "14:20", "16:15"][k],
    location: "",
    course: c.code,
    name: c.name,
    hue: c.hue,
    courseId: c.id,
  }));
  // Every day of the week that's been here: 0–4 focus sessions, tagged with a course.
  const sessions: FocusSession[] = Array.from({ length: 40 }, (_, k) => ({
    started_at: at(-Math.floor(k * 0.7), 15),
    minutes: [25, 50, 30, 90][k % 4],
    course_id: COURSES[k % 3].id,
  }));
  const history = COURSES.flatMap((c, k) =>
    Array.from({ length: 6 }, (_, d) => ({
      course_id: c.id,
      day: at(d * 3 - 15).slice(0, 10),
      grade: c.grade + (k % 2 ? 1 : -1) * (5 - d) * 0.8,
    })),
  );
  const materials = COURSES.slice(0, 3).map((c, k) => ({
    id: `sample-f${k}`,
    kind: (["file", "note", "link"] as const)[k],
    name: ["Lecture 7 slides.pdf", "Midterm review", "Lab manual"][k],
    course_id: c.id,
  }));
  const cards = COURSES.map((c) => ({
    ...c,
    items: items.filter((i) => i.courseId === c.id),
    meetings: meetings.filter((m) => m.courseId === c.id),
  }));
  return { term, courses: COURSES, items, meetings, sessions, history, materials, cards };
}
