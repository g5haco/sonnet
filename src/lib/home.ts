import type { WidgetSize } from "@/components/ui/draggable-widget-grid";

// Home's widgets, in the order the default layout uses: an accessible name, and the sizes each one is built for.
// A widget only offers sizes it fills well; the first is its default.
export const WIDGETS = {
  progress: { label: "Progress", sizes: ["wide"] },
  next: { label: "Up next", sizes: ["lg", "tall"] },
  exam: { label: "Next exam", sizes: ["sm"] },
  week: { label: "This week", sizes: ["wide"] },
  courses: { label: "Courses", sizes: ["lg"] },
  grades: { label: "Grades", sizes: ["wide", "tall"] },
  focus: { label: "Study days", sizes: ["wide"] },
} satisfies Record<string, { label: string; sizes: WidgetSize[] }>;

export type WidgetId = keyof typeof WIDGETS;
export type Layout = { id: WidgetId; size: WidgetSize }[];

export const DEFAULT_LAYOUT: Layout = [
  { id: "progress", size: "wide" },
  { id: "exam", size: "sm" },
  { id: "courses", size: "lg" },
  { id: "next", size: "lg" },
  { id: "week", size: "wide" },
  { id: "grades", size: "wide" },
  { id: "focus", size: "wide" },
];

// A saved layout (settings.home_layout) made safe to render: unknown widgets and repeats are dropped, and a size
// the widget isn't built for becomes its default size.
// Nothing saved, or nothing usable in it, means the default layout. An empty list is a real choice and stays empty.
export function readLayout(raw: unknown): Layout {
  if (!Array.isArray(raw)) return DEFAULT_LAYOUT;
  const seen = new Set<string>();
  const layout: Layout = [];
  for (const w of raw) {
    if (!w || !Object.hasOwn(WIDGETS, w.id) || seen.has(w.id)) continue;
    seen.add(w.id);
    const sizes: WidgetSize[] = WIDGETS[w.id as WidgetId].sizes;
    layout.push({ id: w.id, size: sizes.includes(w.size) ? w.size : sizes[0] });
  }
  return raw.length && !layout.length ? DEFAULT_LAYOUT : layout;
}
