import { expect, test } from "vitest";
import { DEFAULT_LAYOUT, readLayout } from "./home";

test("missing or unreadable layouts fall back to the default", () => {
  expect(readLayout(null)).toEqual(DEFAULT_LAYOUT);
  expect(readLayout(undefined)).toEqual(DEFAULT_LAYOUT);
  expect(readLayout({ id: "next" })).toEqual(DEFAULT_LAYOUT);
  expect(readLayout([{ id: "gone", size: "sm" }])).toEqual(DEFAULT_LAYOUT);
});

test("a saved layout keeps its order, drops unknown ids and repeats, and maps sizes to a column", () => {
  const saved = [
    { id: "focus", size: "wide" },
    { id: "weather", size: "sm" },
    { id: "next", size: "huge" },
    { id: "week", size: "sm" },
    { id: "exam", size: "sm", extra: 1 },
    { id: "focus", size: "sm" },
    null,
  ];
  expect(readLayout(saved)).toEqual([
    { id: "focus", size: "wide" },
    { id: "next", size: "wide" },
    { id: "week", size: "sm" },
    { id: "exam", size: "sm" },
  ]);
});

test("an empty saved layout stays empty", () => {
  expect(readLayout([])).toEqual([]);
});

test("a layout survives a save and load round trip", () => {
  expect(readLayout(JSON.parse(JSON.stringify(DEFAULT_LAYOUT)))).toEqual(DEFAULT_LAYOUT);
});
