import { expect, test } from "vitest";
import { openByCourse, openByKind, paceByWeek } from "./charts";
import { sampleData } from "./sample";

test("sample data fills the charts on any day, including a real first week", () => {
  const now = Date.parse("2026-09-01T09:00:00");
  const s = sampleData(now);
  expect(paceByWeek(s.items, s.term, now).length).toBeGreaterThanOrEqual(2);
  expect(openByCourse(s.items, s.courses, now).filter((r) => r.open > 0).length).toBeGreaterThanOrEqual(3);
  expect(openByKind(s.items, now).length).toBeGreaterThan(1);
  expect(s.items.some((i) => i.kind === "exam" && Date.parse(i.due) > now)).toBe(true);
  expect(new Set(s.history.map((p) => p.day)).size).toBeGreaterThan(1);
  expect(s.sessions.every((x) => x.course_id)).toBe(true);
});
