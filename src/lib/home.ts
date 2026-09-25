// Home is a fixed grid of square cells, COLS × ROWS, sized to fit the screen (no scrolling). Each widget has a
// place (x, y) and a size (w, h) in cells. Widgets never overlap and never leave the grid.

export const COLS = 12;
export const ROWS = 6;

// Every widget: its accessible name, default size, and smallest size (in cells).
type Spec = { label: string; w: number; h: number; minW?: number; minH?: number };
export const WIDGETS = {
  progress: { label: "Progress", w: 5, h: 2, minW: 3, minH: 2 },
  next: { label: "Up next", w: 5, h: 4, minW: 3, minH: 2 },
  grades: { label: "Grades", w: 3, h: 4, minH: 2 },
  exam: { label: "Next exam", w: 2, h: 2, minH: 2 },
  courses: { label: "Courses", w: 4, h: 3, minW: 3, minH: 3 }, // the carousel needs the room
  focus: { label: "Study days", w: 2, h: 2 },
  timer: { label: "Focus timer", w: 2, h: 2, minH: 2 },
  classes: { label: "Today's classes", w: 4, h: 1 },
  // 1 column wide: today; 1 row tall: this week; bigger: the month.
  calendar: { label: "Calendar", w: 3, h: 1, minW: 1, minH: 1 },
  today: { label: "Due today", w: 3, h: 2 },
  streak: { label: "Streak", w: 2, h: 1 },
  materials: { label: "Recent materials", w: 3, h: 2 },
  ask: { label: "Ask about…", w: 4, h: 1 },
  trend: { label: "Grade trend", w: 4, h: 2, minW: 3 },
  gradebars: { label: "Grade bars", w: 3, h: 2 },
  scores: { label: "Recent scores", w: 3, h: 2 },
  gaps: { label: "Grade gaps", w: 3, h: 2 },
  exams: { label: "Exam countdowns", w: 3, h: 2 },
  spotlight: { label: "Course spotlight", w: 3, h: 2 },
  hours: { label: "Study hours", w: 4, h: 2, minW: 3 },
  load: { label: "Workload", w: 4, h: 2 },
  ontime: { label: "On-time rate", w: 3, h: 1 },
  split: { label: "Time by course", w: 3, h: 2 },
  countdown: { label: "Next deadline", w: 3, h: 1 },
  clear: { label: "Week clear", w: 3, h: 1 },
  radar: { label: "Workload radar", w: 3, h: 3, minW: 3, minH: 2 },
  rings: { label: "Grade rings", w: 3, h: 3, minW: 2, minH: 2 },
  pace: { label: "Done vs due", w: 4, h: 2, minW: 3, minH: 2 },
  mix: { label: "Work mix", w: 3, h: 3, minW: 2, minH: 2 },
} satisfies Record<string, Spec>;

export type WidgetId = keyof typeof WIDGETS;
export type Place = { id: WidgetId; x: number; y: number; w: number; h: number };
export type Layout = Place[];

const minW = (id: WidgetId) => (WIDGETS[id] as Spec).minW ?? 2;
const minH = (id: WidgetId) => (WIDGETS[id] as Spec).minH ?? 1;

// The original Home's widgets, filling the grid.
export const DEFAULT_LAYOUT: Layout = [
  { id: "progress", x: 0, y: 0, w: 5, h: 2 },
  { id: "exam", x: 5, y: 0, w: 2, h: 2 },
  { id: "calendar", x: 7, y: 0, w: 3, h: 1 },
  { id: "streak", x: 7, y: 1, w: 3, h: 1 },
  { id: "focus", x: 10, y: 0, w: 2, h: 2 },
  { id: "next", x: 0, y: 2, w: 5, h: 4 },
  { id: "courses", x: 5, y: 2, w: 4, h: 4 },
  { id: "grades", x: 9, y: 2, w: 3, h: 4 },
];

const overlaps = (a: Place, b: Place) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

// Whether `p` fits: inside the grid, at least its smallest size, and clear of every other widget.
export const fits = (layout: Layout, p: Place) =>
  p.x >= 0 &&
  p.y >= 0 &&
  p.x + p.w <= COLS &&
  p.y + p.h <= ROWS &&
  p.w >= minW(p.id) &&
  p.h >= minH(p.id) &&
  layout.every((q) => q.id === p.id || !overlaps(p, q));

// The first free spot for a new widget (top to bottom, left to right): its default size, else its smallest.
export function freeSpot(layout: Layout, id: WidgetId): Place | null {
  for (const [w, h] of [
    [WIDGETS[id].w, WIDGETS[id].h],
    [minW(id), minH(id)],
  ])
    for (let y = 0; y + h <= ROWS; y++)
      for (let x = 0; x + w <= COLS; x++) if (fits(layout, { id, x, y, w, h })) return { id, x, y, w, h };
  return null;
}

// A saved layout (settings.home_layout) made safe to render: unknown widgets, repeats, and places that are off
// the grid or overlap an earlier widget are dropped. Nothing saved, an older format, or nothing usable = the
// default. An empty list is a real choice and stays empty.
export function readLayout(raw: unknown): Layout {
  if (!Array.isArray(raw)) return DEFAULT_LAYOUT;
  const layout: Layout = [];
  for (const saved of raw) {
    const p = saved?.id === "week" ? { ...saved, id: "calendar" } : saved; // "This week" is now the Calendar's week view
    if (!p || !Object.hasOwn(WIDGETS, p.id) || layout.some((q) => q.id === p.id)) continue;
    if (![p.x, p.y, p.w, p.h].every(Number.isInteger)) continue;
    const place = { id: p.id as WidgetId, x: p.x, y: p.y, w: p.w, h: p.h };
    if (fits(layout, place)) layout.push(place);
  }
  return raw.length && !layout.length ? DEFAULT_LAYOUT : layout;
}
