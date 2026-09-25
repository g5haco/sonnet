import { expect, test } from "vitest";
import { DEFAULT_LAYOUT, readLayout } from "./home";

test("missing or unreadable layouts fall back to the default", () => {
  expect(readLayout(null)).toEqual(DEFAULT_LAYOUT);
  expect(readLayout(undefined)).toEqual(DEFAULT_LAYOUT);
  expect(readLayout({ id: "next" })).toEqual(DEFAULT_LAYOUT);
  expect(readLayout([{ id: "gone", size: "sm" }])).toEqual(DEFAULT_LAYOUT);
});

test("a saved layout keeps its order and drops unknown ids, bad sizes and repeats", () => {
  const saved = [
    { id: "focus", size: "lg" },
    { id: "weather", size: "sm" },
    { id: "next", size: "huge" },
    { id: "exam", size: "sm", extra: 1 },
    { id: "focus", size: "sm" },
    null,
  ];
  expect(readLayout(saved)).toEqual([
    { id: "focus", size: "lg" },
    { id: "exam", size: "sm" },
  ]);
});

test("an empty saved layout stays empty", () => {
  expect(readLayout([])).toEqual([]);
});

test("a layout survives a save and load round trip", () => {
  expect(readLayout(JSON.parse(JSON.stringify(DEFAULT_LAYOUT)))).toEqual(DEFAULT_LAYOUT);
});
