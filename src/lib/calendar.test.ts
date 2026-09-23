import { expect, test } from "vitest";
import { dayKey } from "./course";
import { lanes, range, sessions, step, toIcs, type ClassMeeting } from "./calendar";

const keys = (days: Date[]) => days.map(dayKey);
const wed = new Date(2026, 8, 23); // Wed Sep 23 2026

test("views: Monday-first week, 6-week month, month steps keep the day where they can", () => {
  expect(keys(range("week", wed))).toEqual([
    "2026-09-21",
    "2026-09-22",
    "2026-09-23",
    "2026-09-24",
    "2026-09-25",
    "2026-09-26",
    "2026-09-27",
  ]);
  const month = range("month", wed);
  expect([month.length, dayKey(month[0]), dayKey(month[41])]).toEqual([42, "2026-08-31", "2026-10-11"]);
  expect(dayKey(step("month", new Date(2027, 0, 31), 1))).toBe("2027-02-28");
  expect(dayKey(step("week", wed, -1))).toBe("2026-09-16");
});

test("class sessions land on their weekdays, only inside the semester", () => {
  const pols: ClassMeeting = {
    id: "m1",
    course: "POLS 202",
    name: "",
    hue: 65,
    weekdays: [1, 3],
    starts: "10:30:00",
    ends: "12:20:00",
    location: "",
  };
  const week = sessions([pols], range("week", wed), { start: "2026-08-24", weeks: 16 });
  expect(week.map((s) => [dayKey(s.start), s.start.getHours(), s.start.getMinutes(), s.end.getHours()])).toEqual([
    ["2026-09-21", 10, 30, 12],
    ["2026-09-23", 10, 30, 12],
  ]);
  // Semester ends Dec 13 (16 weeks from Aug 24): nothing the week after.
  expect(sessions([pols], range("week", new Date(2026, 11, 16)), { start: "2026-08-24", weeks: 16 })).toEqual([]);
});

test("overlapping events split the column; separate ones keep it whole", () => {
  const e = (h1: number, h2: number) => ({ start: new Date(2026, 8, 23, h1), end: new Date(2026, 8, 23, h2) });
  expect(lanes([e(9, 11), e(10, 12), e(13, 14)]).map((x) => [x.lane, x.lanes])).toEqual([
    [0, 2],
    [1, 2],
    [0, 1],
  ]);
});

test("Google Calendar feed: weekly classes in wall-clock time, deadlines in UTC, text escaped", () => {
  const feed = toIcs(
    {
      term: { start: "2026-08-24", weeks: 16 },
      courses: [{ id: "c1", code: "POLS 202" }],
      meetings: [
        { id: "m1", course_id: "c1", weekdays: [1, 3], starts: "10:30:00", ends: "12:20:00", location: "ECON 119" },
      ],
      items: [
        {
          id: "i1",
          course_id: "c1",
          kind: "exam",
          title: "Midterm 1, part A",
          due: "2026-10-02T17:00:00+00:00",
          done_at: null,
        },
      ],
    },
    new Date("2026-09-23T07:00:00Z"),
  );
  expect(feed).toContain("DTSTART:20260824T103000\r\nDTEND:20260824T122000\r\n");
  expect(feed).toContain("RRULE:FREQ=WEEKLY;BYDAY=MO,WE;UNTIL=20261213T235959");
  expect(feed).toContain("DTSTART:20261002T170000Z\r\nSUMMARY:Exam: Midterm 1\\, part A (POLS 202)");
  expect(feed.startsWith("BEGIN:VCALENDAR\r\n") && feed.endsWith("END:VCALENDAR\r\n")).toBe(true);
});
