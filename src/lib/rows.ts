import type { ClassMeeting } from "./calendar";
import type { Item } from "./progress";

// Database rows -> the shapes the UI uses, with each row's course code, name and color copied on.

type Course = { id: string; code: string; name: string; hue: number };
type ItemRow = {
  id: string;
  title: string;
  kind: Item["kind"];
  due: string;
  done_at: string | null;
  course_id: string;
  score?: number | null;
  points_possible?: number | null;
};
type MeetingRow = { id: string; course_id: string; weekdays: number[]; starts: string; ends: string; location: string; skip_dates?: string[] };

export const ITEM_COLS = "id, title, kind, due, done_at, course_id, score, points_possible";
// "*", not a column list: skip_dates (migration 0011) is simply absent before the migration runs.
export const MEETING_COLS = "*";

export function toItems(rows: ItemRow[], courses: Course[]): Item[] {
  const byId = new Map(courses.map((c) => [c.id, c]));
  return rows.map((i) => ({
    id: i.id,
    title: i.title,
    kind: i.kind,
    due: i.due,
    doneAt: i.done_at,
    score: i.score ?? null,
    points: i.points_possible ?? null,
    courseId: i.course_id,
    course: byId.get(i.course_id)?.code ?? "",
    hue: byId.get(i.course_id)?.hue ?? 0,
  }));
}

export function toMeetings(rows: MeetingRow[], courses: Course[]): ClassMeeting[] {
  const byId = new Map(courses.map((c) => [c.id, c]));
  return rows.map(({ course_id, ...m }) => ({
    ...m,
    course: byId.get(course_id)?.code ?? "",
    name: byId.get(course_id)?.name ?? "",
    hue: byId.get(course_id)?.hue ?? 0,
    courseId: course_id,
  }));
}

// One card per course, carrying that course's work and class times.
export const toCards = (courses: Course[], items: Item[], meetings: ClassMeeting[]) =>
  courses.map((c) => ({
    ...c,
    items: items.filter((i) => i.courseId === c.id),
    meetings: meetings.filter((m) => m.courseId === c.id),
  }));
