import { expect, test } from "vitest";
import { calendarLines, needsThinking } from "./ai";
import { meetingLabel } from "./course";

test("calendar grounding: this week, next week, today, in the student's timezone", () => {
  // 10:05 PM Wednesday in Los Angeles is already Thursday in UTC; the lines must say Wednesday.
  const [weeks, next14] = calendarLines(Date.parse("2026-09-24T05:05:00Z"), "America/Los_Angeles");
  expect(weeks).toBe(
    "This week: Mon, Sep 21 to Sun, Sep 27 (today is Wed, Sep 23). Next week: Mon, Sep 28 to Sun, Oct 4.",
  );
  expect(next14.startsWith("Next 14 days: Wed, Sep 23 (today), Thu, Sep 24, Fri, Sep 25,")).toBe(true);
  expect(next14).toContain("Fri, Oct 2");
});

test("Sunday belongs to the week that started on Monday", () => {
  const [weeks] = calendarLines(Date.parse("2026-09-27T18:00:00Z"), "UTC");
  expect(weeks).toContain("This week: Mon, Sep 21 to Sun, Sep 27 (today is Sun, Sep 27)");
});

test("reasoning turns on for tutoring, stays off for planner edits and lookups", () => {
  expect(needsThinking("explain the difference between velocity and acceleration")).toBe(true);
  expect(needsThinking("help me study for my chem midterm")).toBe(true);
  expect(needsThinking("add an essay for writing due next friday")).toBe(false);
  expect(needsThinking("move my midterm to wednesday")).toBe(false);
  expect(needsThinking("what's due this week?")).toBe(false);
});

test("class times read Monday-first, without seconds", () => {
  expect(meetingLabel({ weekdays: [5, 1, 3], starts: "10:00:00", ends: "10:50:00", location: "ECCR 1B40" })).toBe(
    "Mon/Wed/Fri 10:00–10:50 · ECCR 1B40",
  );
  expect(meetingLabel({ weekdays: [0, 2], starts: "18:30:00", ends: "20:00:00", location: "" })).toBe(
    "Tue/Sun 18:30–20:00",
  );
});
