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
