// Home is a 12-column snap grid. Each widget has a place (x = column, y = row of ROW px) and a width in columns;
// its height is whatever its content needs. Widgets that would overlap are pushed down, never over each other.

export const COLS = 12;
export const ROW = 8; // px per grid row: fine enough that widgets keep their natural height

// Every widget: its accessible name, default width and narrowest width (in columns).
export const WIDGETS = {
  progress: { label: "Progress", w: 6, min: 4 },
  next: { label: "Up next", w: 6, min: 4 },
  grades: { label: "Grades", w: 6, min: 3 },
  exam: { label: "Next exam", w: 3, min: 3 },
  week: { label: "This week", w: 3, min: 3 },
  courses: { label: "Courses", w: 4, min: 4 }, // the carousel needs the room
  focus: { label: "Study days", w: 3, min: 3 },
  timer: { label: "Focus timer", w: 3, min: 3 },
  classes: { label: "Today's classes", w: 6, min: 3 },
  calendar: { label: "Calendar", w: 3, min: 3 },
  today: { label: "Due today", w: 4, min: 3 },
  streak: { label: "Streak", w: 3, min: 2 },
  materials: { label: "Recent materials", w: 4, min: 3 },
  ask: { label: "Ask about…", w: 6, min: 3 },
  trend: { label: "Grade trend", w: 6, min: 4 },
  gradebars: { label: "Grade bars", w: 4, min: 3 },
  scores: { label: "Recent scores", w: 4, min: 3 },
  gaps: { label: "Grade gaps", w: 4, min: 3 },
  exams: { label: "Exam countdowns", w: 4, min: 3 },
  spotlight: { label: "Course spotlight", w: 3, min: 3 },
  hours: { label: "Study hours", w: 6, min: 4 },
  load: { label: "Workload", w: 6, min: 3 },
  ontime: { label: "On-time rate", w: 3, min: 3 },
  split: { label: "Time by course", w: 4, min: 3 },
  countdown: { label: "Next deadline", w: 3, min: 2 },
  clear: { label: "Week clear", w: 3, min: 2 },
} as const;

export type WidgetId = keyof typeof WIDGETS;
export type Place = { id: WidgetId; x: number; y: number; w: number };
export type Layout = Place[];

// The original Home, across the whole width: rows 0/1/2 only set the order; heights push widgets down.
export const DEFAULT_LAYOUT: Layout = [
  { id: "progress", x: 0, y: 0, w: 6 },
  { id: "exam", x: 6, y: 0, w: 3 },
  { id: "week", x: 9, y: 0, w: 3 },
  { id: "next", x: 0, y: 1, w: 6 },
  { id: "focus", x: 6, y: 1, w: 3 },
  { id: "courses", x: 6, y: 2, w: 4 },
  { id: "grades", x: 0, y: 2, w: 6 },
];

const int = (v: unknown, lo: number, hi: number) =>
  Number.isInteger(v) ? Math.min(hi, Math.max(lo, v as number)) : null;

// A saved layout (settings.home_layout) made safe to render: unknown widgets, repeats and places without numbers
// are dropped, widths and columns are clamped. Nothing saved, an older format, or nothing usable = the default.
// An empty list is a real choice and stays empty.
export function readLayout(raw: unknown): Layout {
  if (!Array.isArray(raw)) return DEFAULT_LAYOUT;
  const seen = new Set<string>();
  const layout: Layout = [];
  for (const p of raw) {
    if (!p || !Object.hasOwn(WIDGETS, p.id) || seen.has(p.id)) continue;
    const id = p.id as WidgetId;
    const w = int(p.w, WIDGETS[id].min, COLS);
    const x = w === null ? null : int(p.x, 0, COLS - w);
    const y = int(p.y, 0, 100_000);
    if (w === null || x === null || y === null) continue;
    seen.add(id);
    layout.push({ id, x, y, w });
  }
  return raw.length && !layout.length ? DEFAULT_LAYOUT : layout;
}

const across = (a: Place, b: Place) => a.x < b.x + b.w && b.x < a.x + a.w;

// Final places: `pinned` (the widget being dragged) keeps its spot; everything else, top to bottom, drops just
// below any placed widget it would overlap. `rows` = each widget's height in grid rows.
export function resolve(layout: Layout, rows: Partial<Record<WidgetId, number>>, pinned?: WidgetId): Layout {
  const h = (p: Place) => rows[p.id] ?? 1;
  const order = [...layout].sort((a, b) => Number(b.id === pinned) - Number(a.id === pinned) || a.y - b.y || a.x - b.x);
  const placed: Layout = [];
  for (const p of order) {
    let y = p.y;
    for (let moved = true; moved; ) {
      moved = false;
      for (const q of placed)
        if (across(p, q) && y < q.y + h(q) && q.y < y + h(p)) {
          y = q.y + h(q);
          moved = true;
        }
    }
    placed.push({ ...p, y });
  }
  return placed;
}
