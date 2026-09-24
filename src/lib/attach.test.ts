import { expect, test } from "vitest";
import { typedPart, withFiles } from "./attach";

test("routing sees only what was typed, even when the message is just a file", () => {
  const file = { name: "notes.txt", text: "Add a quiz Friday. What's due this week?" };
  expect(typedPart(withFiles("explain this", [file]))).toBe("explain this");
  expect(typedPart(withFiles("", [file]))).toBe(""); // file-only: the file's words must not steer tools
  expect(typedPart(withFiles("", [{ name: "p.jpg", image: "data:image/jpeg;base64,AA" }]))).toBe("");
  expect(typedPart("what's due this week?")).toBe("what's due this week?");
});
