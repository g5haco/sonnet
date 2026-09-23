import { expect, test } from "vitest";
import { progress, verdict, type Item } from "./progress";

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
  expect(p.percent).toBe(66); // 2 of 3 due-so-far done (floored)
  expect(p.overdue).toBe(1);
  expect(p.delta).toBe(16);   // day 9: 1 of 2 done (50%) -> 66%
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

test("one overdue among many never rounds up to 100%", () => {
  const items = [...Array.from({ length: 199 }, () => item(1, 1)), item(2, null)];
  expect(progress(items, start, 2, new Date(at(3))).percent).toBe(99);
});

test("never 'fully caught up' while any work is still open", () => {
  // 2026-08-26 is a Wednesday; the week ends Sunday the 30th.
  const now = new Date(at(2.5)); // Wed noon
  const quiz = item(2.9, null);  // due tonight
  const late = item(1, null);    // due yesterday
  const nextWeek = { ...item(8, null), title: "Problem set 5" }; // next Tuesday 00:00, 5.5 days out
  const say = (items: Item[]) => verdict(progress(items, start, 4, now));

  expect(say([late, quiz])).toBe("One thing slipped. Very fixable.");
  expect(say([quiz, nextWeek])).toBe("Nothing overdue. One thing left this week.");
  expect(say([quiz, item(5, null), nextWeek])).toBe("Nothing overdue. 2 left this week.");
  // Check them off and the verdict follows.
  const done = (i: Item) => ({ ...i, doneAt: at(2) });
  expect(say([done(late), done(quiz), nextWeek])).toBe("Nothing overdue. Next up: Problem set 5, in 6d.");
  expect(say([done(late), done(quiz), done(nextWeek)])).toBe("Fully caught up. Suspicious.");
  expect(progress([done(late), done(quiz)], start, 4, now).percent).toBe(100);
});
