// Rows for Home's EvilCharts widgets, built from Sonnet's own work items.
import { startOfDay, type Term } from "./calendar";
import type { Item } from "./progress";
import { termGlance } from "./term";

const open = (i: Item, from: number) => !i.doneAt && Date.parse(i.due) >= from;

// Open work still ahead, per course (radar axes).
export const openByCourse = (items: Item[], courses: { id: string; code: string }[], now: number) => {
  const from = +startOfDay(new Date(now));
  return courses.map((c) => ({ course: c.code, open: items.filter((i) => i.courseId === c.id && open(i, from)).length }));
};

// Open work still ahead, per kind (pie sectors); empty kinds left out.
export const openByKind = (items: Item[], now: number) => {
  const from = +startOfDay(new Date(now));
  return (["assignment", "exam", "quiz", "reading"] as const)
    .map((kind) => ({ kind, open: items.filter((i) => i.kind === kind && open(i, from)).length }))
    .filter((r) => r.open > 0);
};

// Per term week so far: how much came due, and how much of that is checked off.
export const paceByWeek = (items: Item[], term: Term, now: number) => {
  const g = termGlance(term, new Date(now));
  const weeks = Math.min(Math.max(g.week, 0), term.weeks);
  return Array.from({ length: weeks }, (_, w) => {
    // Whole days first (rounded: DST days are 23 or 25 hours), then weeks.
    const list = items.filter((i) => Math.floor(Math.round((+startOfDay(new Date(i.due)) - +g.start) / 864e5) / 7) === w);
    return { week: `W${w + 1}`, due: list.length, done: list.filter((i) => i.doneAt).length };
  });
};
