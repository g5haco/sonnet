import type { WidgetSize } from "@/components/ui/draggable-widget-grid";

// Home's widgets and their accessible names. Home keeps its two columns, each widget at its natural size;
// a widget's `size` says which column it sits in: "wide" = the main column, "sm" = the side column.
export const WIDGETS = {
  progress: "Progress",
  next: "Up next",
  grades: "Grades",
  exam: "Next exam",
  week: "This week",
  courses: "Courses",
  focus: "Study days",
} as const;

export type WidgetId = keyof typeof WIDGETS;
export type Layout = { id: WidgetId; size: WidgetSize }[];

export const DEFAULT_LAYOUT: Layout = [
  { id: "progress", size: "wide" },
  { id: "next", size: "wide" },
  { id: "grades", size: "wide" },
  { id: "exam", size: "sm" },
  { id: "week", size: "sm" },
  { id: "courses", size: "sm" },
  { id: "focus", size: "sm" },
];

// A saved layout (settings.home_layout) made safe to render: unknown widgets and repeats are dropped, and any
// size other than the side column's means the main column.
// Nothing saved, or nothing usable in it, means the default layout. An empty list is a real choice and stays empty.
export function readLayout(raw: unknown): Layout {
  if (!Array.isArray(raw)) return DEFAULT_LAYOUT;
  const seen = new Set<string>();
  const layout: Layout = [];
  for (const w of raw) {
    if (!w || !Object.hasOwn(WIDGETS, w.id) || seen.has(w.id)) continue;
    seen.add(w.id);
    layout.push({ id: w.id, size: w.size === "sm" ? "sm" : "wide" });
  }
  return raw.length && !layout.length ? DEFAULT_LAYOUT : layout;
}
