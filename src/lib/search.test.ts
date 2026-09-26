import { expect, test } from "vitest";
import { search } from "./search";
import type { Item } from "./progress";

const now = new Date(2026, 8, 26, 12).getTime(); // Sat Sep 26 2026, noon
const courses = [
  { id: "p", code: "POLS&202 9347", name: "American Government", hue: 150 },
  { id: "k", code: "KINS236 9528", name: "Kinesiology", hue: 250 },
];
const item = (id: string, title: string, kind: Item["kind"], due: Date, courseId = "k", doneAt: string | null = null): Item => ({
  id, title, kind, due: due.toISOString(), doneAt, course: "", hue: 0, courseId,
});
const items = [
  item("late", "Skeleton Labeling", "assignment", new Date(2026, 8, 20)),
  item("soon", "Case Study 1", "assignment", new Date(2026, 8, 27, 23)),
  item("fri", "Weekly Journal 2", "assignment", new Date(2026, 9, 2, 23), "p"),
  item("mid", "Midterm", "exam", new Date(2026, 9, 28, 9), "p"),
  item("old", "Intro post", "assignment", new Date(2026, 8, 10), "p", "2026-09-09"),
];
const ids = (q: string) => search(q, items, courses, now).items.map((i) => i.id);

test("status, kind and course words filter work", () => {
  expect(ids("overdue assignments")).toEqual(["late"]);
  expect(ids("next assignment due")).toEqual(["soon", "fri"]);
  expect(ids("next exam")).toEqual(["mid"]);
  expect(ids("pols")).toEqual(["fri", "mid", "old"]);
  expect(ids("done")).toEqual(["old"]);
  expect(search("pols", items, courses, now).courses.map((c) => c.id)).toEqual(["p"]);
});

test("dates: named days, month days, relative days and weeks", () => {
  expect(ids("friday")).toEqual(["fri"]);
  expect(ids("oct 28")).toEqual(["mid"]);
  expect(ids("10/2")).toEqual(["fri"]);
  expect(ids("wednesday")).toEqual([]);
  expect(search("wednesday", items, courses, now).days[0].date).toBe("2026-09-30");
  expect(search("saturday", items, courses, now).days[0].date).toBe("2026-09-26");
  expect(search("jan 5", items, courses, now).days[0].date).toBe("2027-01-05");
  expect(search("2/30", items, courses, now).days).toEqual([]);
  expect(ids("tomorrow")).toEqual(["soon"]);
  expect(ids("due next week")).toEqual(["fri"]);
  expect(search("friday", items, courses, now).days[0].date).toBe("2026-10-02");
});

test("title text, places, and nonsense", () => {
  expect(ids("skeleton")).toEqual(["late"]);
  expect(search("settings", items, courses, now).places.map((p) => p.settings)).toEqual(["account", "semester", "data"]);
  expect(search("cal", items, courses, now).places[0].label).toBe("Calendar");
  expect(ids("zzzz")).toEqual([]);
  expect(ids("")).toEqual([]);
});
