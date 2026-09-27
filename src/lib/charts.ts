// Rows for Home's EvilCharts widgets, built from Sonnet's own work items.
import { startOfDay, type Term } from "./calendar";
import type { Item } from "./progress";
import { termGlance } from "./term";

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
