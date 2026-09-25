import { expect, test } from "vitest";
import { DEFAULT_LAYOUT, fits, freeSpot, readLayout, type Layout } from "./home";

test("missing, unreadable or older-format layouts fall back to the default", () => {
  expect(readLayout(null)).toEqual(DEFAULT_LAYOUT);
  expect(readLayout({ id: "next" })).toEqual(DEFAULT_LAYOUT);
  expect(readLayout([{ id: "gone", x: 0, y: 0, w: 3, h: 2 }])).toEqual(DEFAULT_LAYOUT);
  expect(readLayout([{ id: "next", size: "wide" }])).toEqual(DEFAULT_LAYOUT); // two-column format
  expect(readLayout([{ id: "next", x: 0, y: 0, w: 6 }])).toEqual(DEFAULT_LAYOUT); // no height
});

test("a saved layout keeps valid places and drops unknown, repeated, off-grid, too-small and overlapping ones", () => {
  const saved = [
    { id: "focus", x: 10, y: 4, w: 2, h: 2 },
    { id: "weather", x: 0, y: 0, w: 3, h: 2 },
    { id: "next", x: 8, y: 0, w: 6, h: 2 }, // off the right edge
    { id: "courses", x: 0, y: 0, w: 2, h: 2 }, // smaller than it can go
    { id: "exam", x: 10, y: 3, w: 2, h: 2 }, // overlaps focus
    { id: "week", x: 0, y: 0, w: 3, h: 2 },
    { id: "focus", x: 0, y: 3, w: 2, h: 2 },
    null,
  ];
  expect(readLayout(saved)).toEqual([
    { id: "focus", x: 10, y: 4, w: 2, h: 2 },
    { id: "week", x: 0, y: 0, w: 3, h: 2 },
  ]);
});

test("an empty saved layout stays empty, and the default survives a round trip and fits", () => {
  expect(readLayout([])).toEqual([]);
  expect(readLayout(JSON.parse(JSON.stringify(DEFAULT_LAYOUT)))).toEqual(DEFAULT_LAYOUT);
  expect(DEFAULT_LAYOUT.every((p) => fits(DEFAULT_LAYOUT, p))).toBe(true);
});

test("a new widget takes the first free spot, shrinks to fit, or finds no room", () => {
  const layout: Layout = [{ id: "next", x: 0, y: 0, w: 12, h: 5 }];
  expect(freeSpot(layout, "streak")).toEqual({ id: "streak", x: 0, y: 5, w: 2, h: 1 });
  expect(freeSpot(layout, "week")).toEqual({ id: "week", x: 0, y: 5, w: 2, h: 1 }); // 3×2 doesn't fit: its smallest size
  expect(freeSpot(DEFAULT_LAYOUT, "timer")).toBeNull(); // the default fills the grid
});
