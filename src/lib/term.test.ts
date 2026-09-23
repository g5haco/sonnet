import { expect, test } from "vitest";
import { termGlance } from "./term";

const term = { start: "2026-08-24", weeks: 16 }; // a Monday; the last day is Sun Dec 13
const on = (y: number, m: number, d: number, h = 12) => termGlance(term, new Date(y, m - 1, d, h));

test("before, during and after the semester", () => {
  expect(on(2026, 8, 23)).toMatchObject({ phase: "upcoming", percent: 0, weeksLeft: 15 });
  expect(on(2026, 8, 24, 0)).toMatchObject({ phase: "now", week: 1, weeksLeft: 15 });
  expect(on(2026, 9, 23)).toMatchObject({ phase: "now", week: 5, weeksLeft: 11 });
  expect(on(2026, 11, 2)).toMatchObject({ phase: "now", week: 11 }); // after the DST change
  expect(on(2026, 12, 13, 23)).toMatchObject({ phase: "now", week: 16, weeksLeft: 0, percent: 100 });
  expect(on(2026, 12, 14)).toMatchObject({ phase: "finished", percent: 100 });
  expect(on(2026, 9, 23).end).toEqual(new Date(2026, 11, 13));
});
