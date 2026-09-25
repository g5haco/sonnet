import { expect, test } from "vitest";
import {
  canvasPages,
  decryptCanvasToken,
  encryptCanvasToken,
  mapCanvasAssignment,
  mapIcsEvents,
  parseCanvasIcs,
} from "./canvas";

test("Canvas assignments become planner items with descriptions, grades and submission state", () => {
  expect(
    mapCanvasAssignment("course-uuid", {
      id: "9007199254740993",
      course_id: "42",
      name: "Midterm 1",
      description: "<p>Chapters 1–4</p>",
      due_at: "2026-10-02T18:30:00Z",
      html_url: "https://canvas.example.edu/courses/42/assignments/9007199254740993",
      points_possible: 100,
      submission_types: ["online_upload", "online_text_entry", 7 as unknown as string],
      allowed_attempts: -1,
      is_quiz_assignment: true,
      submission: { workflow_state: "graded", submitted_at: "2026-10-02T17:00:00Z", score: 91 },
    }),
  ).toEqual({
    course_id: "course-uuid",
    source: "canvas",
    external_id: "42:9007199254740993",
    kind: "exam",
    title: "Midterm 1",
    description: "<p>Chapters 1–4</p>",
    due: "2026-10-02T18:30:00.000Z",
    html_url: "https://canvas.example.edu/courses/42/assignments/9007199254740993",
    points_possible: 100,
    submission_types: ["online_upload", "online_text_entry"], // junk dropped
    allowed_attempts: -1, // unlimited
    score: 91,
    done_at: "2026-10-02T17:00:00.000Z",
  });
});

test("Canvas pagination follows the opaque next link and keeps string ids", async () => {
  const seen: string[] = [];
  const fetcher = async (input: string | URL | Request) => {
    const url = String(input);
    seen.push(url);
    return new Response(JSON.stringify([{ id: url.endsWith("page=2") ? "2" : "1" }]), {
      headers: url.endsWith("page=2") ? {} : { Link: '<https://canvas.example.edu/api/v1/courses?page=2>; rel="next"' },
    });
  };
  await expect(
    canvasPages<{ id: string }>("https://canvas.example.edu/api/v1/courses", "secret", fetcher as typeof fetch),
  ).resolves.toEqual([{ id: "1" }, { id: "2" }]);
  expect(seen).toEqual([
    "https://canvas.example.edu/api/v1/courses",
    "https://canvas.example.edu/api/v1/courses?page=2",
  ]);
});

test("Canvas paging refuses a next link to another site", async () => {
  const fetcher = async () =>
    new Response("[]", { headers: { Link: '<http://169.254.169.254/latest>; rel="next"' } });
  await expect(
    canvasPages("https://canvas.example.edu/api/v1/courses", "secret", fetcher as typeof fetch),
  ).rejects.toThrow("another site");
});

test("Canvas calendar events unfold lines and token assignments win duplicate conflicts", () => {
  const events = parseCanvasIcs(
    [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "UID:event-1",
      "DTSTART:20261002T183000Z",
      "SUMMARY:Midterm 1",
      "DESCRIPTION:Chapters 1\\nthrough 4 at https://canvas.example.edu/courses/42/assignments/9",
      " continued",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n"),
  );
  expect(events).toMatchObject([
    {
      uid: "event-1",
      title: "Midterm 1",
      due: "2026-10-02T18:30:00.000Z",
      canvasCourseId: "42",
    },
  ]);
  expect(
    mapIcsEvents(events, new Map([["42", "course-uuid"]]), "fallback", [
      {
        ...mapCanvasAssignment("course-uuid", {
          id: 9,
          course_id: 42,
          name: "Midterm 1",
          due_at: "2026-10-02T18:30:00Z",
        })!,
      },
    ]),
  ).toEqual([]);
});

test("real Canvas feed titles and calendar links match their API assignment and course", () => {
  const events = parseCanvasIcs(
    [
      "BEGIN:VEVENT",
      "UID:event-assignment-9",
      "DTSTART:20260924T065900Z",
      "SUMMARY:Syllabus Quiz (Due Wednesday\\, September 23rd by 11:59 PM) [POLS&202 9347]",
      "URL:https://canvas.example.edu/calendar?include_contexts=course_42&month=09&year=2026#assignment_9",
      "END:VEVENT",
      "BEGIN:VEVENT",
      "UID:event-calendar-event-5",
      "DTSTART:20261028T170000Z",
      "SUMMARY:In-Class Midterm [POLS&202 9347]",
      "URL:https://canvas.example.edu/calendar?include_contexts=course_42#calendar_event_5",
      "END:VEVENT",
    ].join("\r\n"),
  );
  expect(events[0]).toMatchObject({
    title: "Syllabus Quiz (Due Wednesday, September 23rd by 11:59 PM)",
    courseCode: "POLS&202 9347",
    canvasCourseId: "42",
    assignmentId: "9",
  });
  const api = mapCanvasAssignment("pols", {
    id: 9,
    course_id: 42,
    name: events[0].title,
    due_at: "2026-09-24T06:59:59Z",
  })!;
  // the quiz is the API's; the midterm (a calendar event, not an assignment) lands in the real course by its code
  const mapped = mapIcsEvents(events, new Map(), "fallback", [api], new Map([["pols&202 9347", "pols"]]));
  expect(mapped).toHaveLength(1);
  expect(mapped[0]).toMatchObject({ title: "In-Class Midterm", course_id: "pols", kind: "exam" });
});

test("Canvas tokens are encrypted with authenticated encryption", () => {
  const previous = process.env.CANVAS_ENCRYPTION_KEY;
  process.env.CANVAS_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
  try {
    const encrypted = encryptCanvasToken("canvas-secret");
    expect(encrypted).not.toContain("canvas-secret");
    expect(decryptCanvasToken(encrypted)).toBe("canvas-secret");
    const parts = encrypted.split(".");
    parts[2] = `${parts[2][0] === "x" ? "y" : "x"}${parts[2].slice(1)}`;
    expect(() => decryptCanvasToken(parts.join("."))).toThrow();
  } finally {
    if (previous === undefined) delete process.env.CANVAS_ENCRYPTION_KEY;
    else process.env.CANVAS_ENCRYPTION_KEY = previous;
  }
});
