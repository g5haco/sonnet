import { expect, test } from "vitest";
import { streak, studyDays } from "./focus";

test("study days add up per local day; the streak counts back from today or yesterday", () => {
  const at = (d: number, h = 10) => new Date(2026, 8, d, h).toISOString();
  const days = studyDays([
    { started_at: at(20), minutes: 25 },
    { started_at: at(21), minutes: 25 },
    { started_at: at(21, 15), minutes: 10 },
    { started_at: at(22), minutes: 25 },
  ]);
  expect(days.get("2026-09-21")).toBe(35);
  expect(streak(days, new Date(2026, 8, 22, 20))).toBe(3); // studied today
  expect(streak(days, new Date(2026, 8, 23, 9))).toBe(3); // not yet today: still alive
  expect(streak(days, new Date(2026, 8, 24, 9))).toBe(0); // missed yesterday
});
