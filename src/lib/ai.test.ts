import { expect, test } from "vitest";
import { calendarLines, classLines, needsThinking, toProposal, wantsChange } from "./ai";
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

test("next class is found by date: today until it ends, then the next class day", () => {
  const pols = [{ course: "POLS 202", weekdays: [1, 3], starts: "10:30:00", ends: "12:20:00", location: "" }];
  const la = "America/Los_Angeles";
  // 12:30 AM Wednesday Sep 23 in LA: today's class hasn't happened yet.
  expect(classLines(pols, Date.parse("2026-09-23T07:30:00Z"), la)).toContain(
    ": Wed, Sep 23 (today, starts in 10h 0m) 10:30–12:20 POLS 202; Mon, Sep 28 10:30–12:20 POLS 202; Wed, Sep 30",
  );
  // 11:00 AM: in class. 1:00 PM: over, so Monday is next.
  expect(classLines(pols, Date.parse("2026-09-23T18:00:00Z"), la)).toContain(": Wed, Sep 23 (today, happening now)");
  expect(classLines(pols, Date.parse("2026-09-23T20:00:00Z"), la)).toContain(": Mon, Sep 28 10:30–12:20 POLS 202;");
  // Tuesday night: Wednesday is tomorrow.
  expect(classLines(pols, Date.parse("2026-09-23T04:00:00Z"), la)).toContain(": Wed, Sep 23 (tomorrow)");
});

test("tool calls become checked proposals: a room change keeps the rest of the class time", () => {
  const refs = {
    items: new Map([["2657af", { id: "2657af-full", title: "Essay", course: "POLS 202" }]]),
    classes: new Map([
      [
        "4d5e6f",
        { id: "4d5e6f-full", course: "POLS 202", weekdays: [1, 3], starts: "10:30:00", ends: "12:20:00", location: "" },
      ],
    ]),
    courses: [{ id: "c1", code: "POLS 202", name: "Civics", items: 1 }],
  };
  const call = (name: string, args: object) => toProposal({ name, args: JSON.stringify(args) }, refs);
  expect(call("update_class_time", { ref: "class:4d5e6f", room: "B102" })).toEqual({
    type: "update_class",
    id: "4d5e6f-full",
    course: "POLS 202",
    was: { weekdays: [1, 3], starts: "10:30", ends: "12:20", location: "" },
    weekdays: [1, 3],
    starts: "10:30",
    ends: "12:20",
    location: "B102",
  });
  expect(
    call("add_class_time", { course: "pols202", days: ["Tuesday", "thu"], starts: "9:00", ends: "10:15" }),
  ).toMatchObject({ type: "add_class", courseId: "c1", weekdays: [2, 4], starts: "09:00", ends: "10:15" });
  expect(call("delete_item", { ref: "ffffff" })).toBeNull(); // unknown ref
  expect(call("set_semester", { start: "2026-08-24", weeks: 40 })).toBeNull(); // out of range
});

test("planner tools only for change requests", () => {
  expect(wantsChange("What's due this week, in order of urgency?")).toBe(false);
  expect(wantsChange("explain photosynthesis")).toBe(false);
  expect(wantsChange("add an essay for POLS 202 due friday")).toBe(true);
  expect(wantsChange("I have a quiz on thursday")).toBe(true);
  expect(wantsChange("yes")).toBe(true);
});
