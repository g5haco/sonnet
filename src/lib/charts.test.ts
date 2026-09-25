import { expect, test } from "vitest";
import { openByCourse, openByKind, paceByWeek } from "./charts";
import type { Item } from "./progress";

const item = (id: string, due: string, kind: Item["kind"], doneAt: string | null, courseId = "a"): Item => ({
  id, title: id, course: "X", courseId, hue: 0, kind, due, doneAt,
});
const now = Date.parse("2026-09-16T12:00:00"); // Wed of week 3 (term starts Mon Aug 31)
const items = [
  item("1", "2026-09-01T23:59:00", "assignment", "2026-09-01T10:00:00"), // W1 done
  item("2", "2026-09-10T23:59:00", "quiz", null), // W2 missed
  item("3", "2026-09-17T23:59:00", "exam", null, "b"), // ahead
  item("4", "2026-09-20T23:59:00", "assignment", null), // ahead
  item("5", "2026-09-18T23:59:00", "reading", "2026-09-15T10:00:00"), // ahead but done
];

test("open work ahead per course and kind; past and done work left out", () => {
  expect(openByCourse(items, [{ id: "a", code: "A" }, { id: "b", code: "B" }], now)).toEqual([
    { course: "A", open: 1 },
    { course: "B", open: 1 },
  ]);
  expect(openByKind(items, now)).toEqual([
    { kind: "assignment", open: 1 },
    { kind: "exam", open: 1 },
  ]);
});

test("pace counts due and done per term week up to this week", () => {
  expect(paceByWeek(items, { start: "2026-08-31", weeks: 16 }, now)).toEqual([
    { week: "W1", due: 1, done: 1 },
    { week: "W2", due: 1, done: 0 },
    { week: "W3", due: 3, done: 1 },
  ]);
  expect(paceByWeek(items, { start: "2026-10-05", weeks: 16 }, now)).toEqual([]); // not started
});
