import { expect, test } from "vitest";
import { gradeLabel, needOnFinal } from "./course";

test("what-if: score needed on the final", () => {
  expect(needOnFinal(85, 90, 20)).toBeCloseTo(110); // out of reach
  expect(needOnFinal(92, 90, 25)).toBeCloseTo(84);
  expect(needOnFinal(80, 80, 30)).toBeCloseTo(80);
  expect(gradeLabel(91.237)).toBe("91.2%");
  expect(gradeLabel(null)).toBe("–");
});
