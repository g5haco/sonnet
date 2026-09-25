import type { WidgetSize } from "@/components/ui/draggable-widget-grid";

// Home's widgets, in the order the default layout uses. The label is each widget's accessible name.
export const WIDGETS = {
  progress: "Progress",
  next: "Up next",
  exam: "Next exam",
  week: "This week",
  courses: "Courses",
  grades: "Grades",
  focus: "Study days",
} as const;

export type WidgetId = keyof typeof WIDGETS;
export type Layout = { id: WidgetId; size: WidgetSize }[];

export const SIZES: WidgetSize[] = ["sm", "wide", "tall", "lg"];

export const DEFAULT_LAYOUT: Layout = [
  { id: "progress", size: "wide" },
  { id: "exam", size: "sm" },
  { id: "week", size: "sm" },
  { id: "next", size: "lg" },
  { id: "courses", size: "lg" },
  { id: "grades", size: "wide" },
  { id: "focus", size: "wide" },
];

// A saved layout (settings.home_layout) made safe to render: unknown widgets, bad sizes and repeats are dropped.
// Nothing saved, or nothing usable in it, means the default layout. An empty list is a real choice and stays empty.
export function readLayout(raw: unknown): Layout {
  if (!Array.isArray(raw)) return DEFAULT_LAYOUT;
  const seen = new Set<string>();
  const layout: Layout = [];
  for (const w of raw) {
    if (!w || !Object.hasOwn(WIDGETS, w.id) || !SIZES.includes(w.size) || seen.has(w.id)) continue;
    seen.add(w.id);
    layout.push({ id: w.id, size: w.size });
  }
  return raw.length && !layout.length ? DEFAULT_LAYOUT : layout;
}
