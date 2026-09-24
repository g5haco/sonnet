import { expect, test } from "vitest";
import { parseSyllabusItems, sameWork, weekDate, weekLines } from "./syllabus";

test("syllabus items: lenient wrapper, strict rows, bad data dropped or flagged", () => {
  const raw = `Here you go:
\`\`\`json
{"items":[
  {"title":"  Essay 1 ","kind":"assignment","date":"2026-10-02","time":"23:59"},
  {"title":"Midterm","kind":"test","date":"2026-10-21","time":"9:30"},
  {"title":"Ch. 4 reading","kind":"reading","date":"week 3","time":null},
  {"title":"Final project","kind":"assignment","date":"2026-02-30"},
  {"title":"","kind":"quiz","date":"2026-10-05"},
  {"title":"Quiz 2","date":"2026-10-09","time":"25:00"},
  {"title":"Essay 1","kind":"assignment","date":"2026-10-02"},
  "junk", null
]}
\`\`\``;
  expect(parseSyllabusItems(raw)).toEqual([
    { title: "Essay 1", kind: "assignment", date: "2026-10-02", time: "23:59" },
    { title: "Midterm", kind: "exam", date: "2026-10-21", time: "09:30" }, // unknown kind inferred from the title
    { title: "Ch. 4 reading", kind: "reading", date: null, time: null }, // unresolved date kept, for the student to fill
    { title: "Final project", kind: "assignment", date: null, time: null }, // Feb 30 isn't a date
    { title: "Quiz 2", kind: "quiz", date: "2026-10-09", time: null }, // bad time dropped, date kept
  ]);
  expect(parseSyllabusItems('[{"title":"Lab 1","kind":"assignment","date":"2026-09-30"}]')).toHaveLength(1);
  expect(parseSyllabusItems("Sorry, I can't read that.")).toEqual([]);
  expect(parseSyllabusItems('{"items": "none"}')).toEqual([]);
});

test("week list starts on the Monday of the first week", () => {
  expect(weekLines("2026-09-23", 2)).toContain("week 1 = 2026-09-21; week 2 = 2026-09-28");
  expect(weekLines(null, null)).toBe("Semester dates: not set.");
});

test("week + weekday resolve in code from the semester start", () => {
  // semester starts Wed Sep 23 2026; week 1 is the week of Mon Sep 21
  expect(weekDate("2026-09-23", 6, "Wednesday")).toBe("2026-10-28");
  expect(weekDate("2026-09-23", 2, "Sun")).toBe("2026-10-04");
  expect(weekDate("2026-09-23", 9, null)).toBe("2026-11-22"); // "end of week 9"
  expect(weekDate(null, 3, "Fri")).toBeNull();
  expect(weekDate("2026-09-23", 0, "Fri")).toBeNull();
  expect(
    parseSyllabusItems(
      '{"items":[{"title":"Journal 1","kind":"assignment","date":null,"week":"2","day":"Sun"}]}',
      "2026-09-21",
    )[0].date,
  ).toBe("2026-10-04");
});

test("a reported week beats the model's own (miscounted) date", () => {
  // review case: "Week 1: Lab 0 due Friday" came back as date 2026-09-27 plus week 1 / Fri
  const [lab] = parseSyllabusItems('[{"title":"Lab 0","date":"2026-09-27","week":1,"day":"Fri"}]', "2026-09-21");
  expect(lab.date).toBe("2026-09-25");
  // no semester set: the stated date is all there is
  expect(parseSyllabusItems('[{"title":"Lab 0","date":"2026-09-27","week":1,"day":"Fri"}]')[0].date).toBe("2026-09-27");
});

test("syllabus items match Canvas items despite Canvas's longer titles", () => {
  const canvas = {
    title: "Syllabus Quiz (Due Wednesday, September 23rd by 11:59 PM) [POLS&202 9347]",
    due: "2026-09-24T06:59:00Z",
  };
  expect(sameWork({ title: "Syllabus Quiz", due: "2026-09-23T23:59:00-07:00" }, canvas)).toBe(true);
  expect(
    sameWork(
      { title: "Journal 1 (Help Me Help You!)", due: null },
      { title: "Journal 1", due: "2026-09-27T00:00:00Z" },
    ),
  ).toBe(true);
  expect(
    sameWork({ title: "Journal 2", due: "2026-10-04T12:00:00Z" }, { title: "Journal 1", due: "2026-10-04T12:00:00Z" }),
  ).toBe(false);
  expect(
    sameWork({ title: "Midterm", due: "2026-10-28T12:00:00Z" }, { title: "Midterm", due: "2026-12-11T12:00:00Z" }),
  ).toBe(false);
});

test("whole-word title match: Journal 1 is in Weekly Journal 1, not in Journal 10", () => {
  const d = "2026-10-04T12:00:00Z";
  expect(sameWork({ title: "Journal 1", due: d }, { title: "Weekly Journal 1 (Help Me Help You)", due: d })).toBe(true);
  expect(sameWork({ title: "Journal 1", due: d }, { title: "Weekly Journal 10", due: d })).toBe(false);
});
