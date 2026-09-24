import { expect, test } from "vitest";
import { parseSyllabusItems, weekDate, weekLines } from "./syllabus";

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
