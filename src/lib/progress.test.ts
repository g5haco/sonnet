import { expect, test } from "vitest";
import { progress, type Item } from "./progress";

const start = new Date("2026-08-24T00:00:00");
const at = (day: number) => new Date(start.getTime() + day * 864e5).toISOString();
const item = (due: number, doneOn: number | null): Item => ({
  id: String(due) + doneOn, title: "", course: "X", hue: 0, kind: "assignment",
  due: at(due), doneAt: doneOn === null ? null : at(doneOn),
});

test("percent, overdue, bars and weekly delta", () => {
  const items = [
    item(2, 1),     // week 0, done early
    item(9, null),  // week 1, overdue
    item(10, 12),   // week 1, done late (after last week's snapshot)
    item(20, null), // week 2, not due yet
  ];
  const p = progress(items, start, 4, new Date(at(16)));
  expect(p.current).toBe(2);
  expect(p.percent).toBe(67); // 2 of 3 due-so-far done
  expect(p.overdue).toBe(1);
  expect(p.delta).toBe(17);   // day 9: 1 of 2 done (50%) -> 67%
  expect(p.bars).toEqual([
    { total: 1, done: 1 }, { total: 2, done: 1 }, { total: 1, done: 0 }, { total: 0, done: 0 },
  ]);
});

test("done counts now even if it was checked after `now` was read", () => {
  const p = progress([item(2, 9)], start, 2, new Date(at(5)));
  expect(p.percent).toBe(100);
  expect(p.overdue).toBe(0);
});

test("nothing due yet counts as fully caught up", () => {
  expect(progress([], start, 2, start).percent).toBe(100);
});
