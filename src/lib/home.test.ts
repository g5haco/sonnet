import { expect, test } from "vitest";
import { DEFAULT_LAYOUT, readLayout, resolve, type Layout } from "./home";

test("missing, unreadable or older-format layouts fall back to the default", () => {
  expect(readLayout(null)).toEqual(DEFAULT_LAYOUT);
  expect(readLayout(undefined)).toEqual(DEFAULT_LAYOUT);
  expect(readLayout({ id: "next" })).toEqual(DEFAULT_LAYOUT);
  expect(readLayout([{ id: "gone", x: 0, y: 0, w: 3 }])).toEqual(DEFAULT_LAYOUT);
  expect(readLayout([{ id: "next", size: "wide" }])).toEqual(DEFAULT_LAYOUT); // the two-column format
});

test("a saved layout keeps its places, drops unknown ids and repeats, and clamps widths and columns", () => {
  const saved = [
    { id: "focus", x: 9, y: 40, w: 3 },
    { id: "weather", x: 0, y: 0, w: 3 },
    { id: "next", x: 11, y: 0, w: 99 }, // too wide: full width at column 0
    { id: "exam", x: 2, y: 5, w: 1 }, // narrower than it can go
    { id: "focus", x: 0, y: 0, w: 3 },
    { id: "week", x: "1", y: 0, w: 3 },
    null,
  ];
  expect(readLayout(saved)).toEqual([
    { id: "focus", x: 9, y: 40, w: 3 },
    { id: "next", x: 0, y: 0, w: 12 },
    { id: "exam", x: 2, y: 5, w: 3 },
  ]);
});

test("an empty saved layout stays empty, and a layout survives a save and load round trip", () => {
  expect(readLayout([])).toEqual([]);
  expect(readLayout(JSON.parse(JSON.stringify(DEFAULT_LAYOUT)))).toEqual(DEFAULT_LAYOUT);
});

test("overlapping widgets are pushed down; side-by-side ones keep their rows", () => {
  const layout: Layout = [
    { id: "progress", x: 0, y: 0, w: 6 },
    { id: "exam", x: 6, y: 0, w: 3 },
    { id: "next", x: 0, y: 5, w: 6 }, // overlaps progress (10 rows tall)
  ];
  const placed = resolve(layout, { progress: 10, exam: 4, next: 20 });
  expect(placed.find((p) => p.id === "exam")!.y).toBe(0);
  expect(placed.find((p) => p.id === "next")!.y).toBe(10);
});

test("the dragged widget keeps its spot and pushes the others below it", () => {
  const layout: Layout = [
    { id: "progress", x: 0, y: 0, w: 6 },
    { id: "exam", x: 2, y: 0, w: 3 }, // dropped on top of progress
  ];
  const placed = resolve(layout, { progress: 10, exam: 4 }, "exam");
  expect(placed.find((p) => p.id === "exam")!.y).toBe(0);
  expect(placed.find((p) => p.id === "progress")!.y).toBe(4);
});
