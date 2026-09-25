import { expect, test } from "vitest";
import { calendarLines, classLines, asksTasks, needsSearch, needsThinking, needsVision, taskAnswer, toolsFor, toProposal, wantsChange } from "./ai";
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
  expect(call("remove_class_day", { ref: "class:4d5e6f", date: "2026-09-28" })).toEqual({
    type: "remove_class_day",
    date: "2026-09-28",
    classes: [{ id: "4d5e6f-full", course: "POLS 202", starts: "10:30", ends: "12:20" }],
  });
  expect(call("remove_class_day", { ref: "class:4d5e6f", date: "2026-09-29" })).toBeNull(); // a Tuesday: no class
  // "No class Monday" (no ref) means every class that meets that day.
  refs.classes.set("777777", { id: "math-full", course: "MATH 142", weekdays: [1, 2, 3, 4, 5], starts: "13:30:00", ends: "14:20:00", location: "" });
  expect(call("remove_class_day", { date: "2026-09-28" })).toMatchObject({
    classes: [{ id: "4d5e6f-full" }, { id: "math-full" }],
  });
  expect(call("remove_class_day", { date: "2026-09-29" })).toMatchObject({ classes: [{ id: "math-full" }] });
  expect(call("delete_item", { ref: "ffffff" })).toBeNull(); // unknown ref
  expect(call("set_semester", { start: "2026-08-24", weeks: 40 })).toBeNull(); // out of range
});

test("planner tools only for change requests", () => {
  expect(wantsChange("What's due this week, in order of urgency?")).toBe(false);
  expect(wantsChange("explain photosynthesis")).toBe(false);
  expect(wantsChange("add an essay for POLS 202 due friday")).toBe(true);
  expect(wantsChange("I have a quiz on thursday")).toBe(true);
  expect(wantsChange("yes")).toBe(true);
  expect(wantsChange("My math is everyday from 1:30pm to 2:20pm")).toBe(true);
  expect(wantsChange("chem lab is on Tuesdays 2-4")).toBe(true);
  expect(wantsChange("When is my math class?")).toBe(false);
  expect(wantsChange("No class next monday")).toBe(true);
});

test("task questions get no tools; flashcards only when asked", () => {
  const names = (q: string) => toolsFor(q).map((t) => t.function.name);
  for (const q of [
    "What assignments are due this week?",
    "What should I work on this week?",
    "Show my assignments this week in order of urgency.",
    "What's due this week?",
    "What's overdue?",
    "What should I work on first this week?",
  ])
    expect(names(q)).toEqual([]);
  expect(names("Make me flashcards for Chapter 4.")).toEqual(["make_flashcards"]);
  expect(names("add an essay due friday")).toContain("add_item");
  expect(names("add an essay due friday")).not.toContain("make_flashcards");
});

test("task questions are routed by phrasing, not one exact sentence", () => {
  for (const q of [
    "What assignments are due this week?",
    "What should I work on this week?",
    "Show my assignments this week in order of urgency.",
    "What's due this week?",
    "What do I have due this week?",
    "What homework do I have?",
    "What should I work on first this week?",
    "I'm behind. What's overdue, and what should I do first?",
  ])
    expect(asksTasks(q), q).toBe("week");
  expect(asksTasks("What's overdue?")).toBe("overdue");
  // other time frames, single items, tutoring, cards and changes go to the model
  for (const q of [
    "What's due next week?",
    "Do I have anything due Friday?",
    "When is my essay due?",
    "What's the late policy?",
    "I'm behind in calc, explain limits",
    "Make me flashcards for Chapter 4.",
    "I have a quiz due Friday",
    "explain photosynthesis",
  ])
    expect(asksTasks(q), q).toBeNull();
  // review round 2: near-miss task questions (were sent to the model)
  for (const q of [
    "How much work do I have this week?",
    "am i behind on anything",
    "What's on my plate?",
    "What's left to do?",
    "Help me figure out what to do first this week",
  ])
    expect(asksTasks(q), q).not.toBeNull();
  // review round 2: questions about one thing (were wrongly given the canned lists)
  const names = ["Profile Picture Assignment", "Problem set 3", "Weekly Journal 1", "Introductions", "MATH 142", "POLS 202"];
  for (const q of [
    "What does the Profile Picture Assignment require?",
    "What's the late penalty for Problem set 3?",
    "What is the Weekly Journal 1 homework about?",
    "Show me the Introductions assignment details",
    "Which assignment is worth the most points?",
    "Any tips for my homework?",
    "What's due for MATH 142?",
    "What assignments does POLS 202 have?",
  ])
    expect(asksTasks(q, names), q).toBeNull();
  // review round 3: nicknames, other time frames, judgement questions → model
  for (const q of [
    "What's due in math?",
    "What's due in chem this week?",
    "Show me my bio homework",
    "What's due this semester?",
    "what's due in the next 3 days",
    "Which assignment is hardest?",
    "What's the heaviest thing due this week?",
  ])
    expect(asksTasks(q, ["Art"]), q).toBeNull();
  expect(asksTasks("What should I start first this week?", ["Art"])).toBe("week");
  expect(asksTasks("Remind me what's due this week")).toBe("week");
  expect(wantsChange("Remind me what's due this week")).toBe(false);
  expect(wantsChange("remind me to study friday")).toBe(true);
  expect(wantsChange("What do I have due this week?")).toBe(false);
  expect(wantsChange("my problem set is due Friday")).toBe(false);
});

test("task answers: a one-line lead naming the most urgent thing, then ordered work lists", () => {
  const t = (ref: string, when: string) => ({ ref, title: `Item ${ref}`, when });
  const tasks = {
    overdue: [t("aaa111", "was due 2 days ago")],
    thisWeek: [t("bbb222", "is due tomorrow at 9:00 AM"), t("ccc333", "is due Friday at 11:59 PM")],
  };
  const week = taskAnswer("What's due this week?", tasks);
  expect(week).toMatch(/^\*\*1 overdue, 2 due the rest of this week\.\*\* Start here \(due 2 days ago\): \[Item aaa111\]\(item:aaa111\)\n/);
  expect(week).toMatch(/title: Overdue\naaa111\n[\s\S]*title: Due this week\nbbb222\nccc333\n/);
  expect(taskAnswer("What's overdue?", tasks)).not.toContain("bbb222");
  expect(taskAnswer("What should I work on first this week?", tasks)).toContain("title: Next up");
  expect(taskAnswer("What's overdue?", { overdue: [], thisWeek: [] })).toBe("**Nothing overdue.** Enjoy it while it lasts.");
  expect((taskAnswer("What's due this week?", tasks).match(/```work/g) ?? []).length).toBe(2);
});

test("the paid model only for this turn's photos and files, or thinking", () => {
  const plain = { role: "user" as const, content: "add bio lab friday" };
  expect(needsVision(plain, false)).toBe(false);
  expect(needsVision(plain, true)).toBe(true);
  expect(needsVision({ ...plain, images: ["data:image/png;base64,AA"] }, false)).toBe(true);
  expect(needsVision({ ...plain, content: "what's due?\n\n[Attached file: hw.pdf]\nQ1" }, false)).toBe(true);
  expect(needsVision({ ...plain, content: "[Attached image: board.jpg]" }, false)).toBe(true);
  expect(needsVision({ ...plain, content: "explain my journal assignment" }, false)).toBe(false);
  expect(needsVision({ ...plain, content: "solve 2x + 3 = 11" }, false)).toBe(true);
});

test("web search only for sources, fact checks and news, never schedule questions", () => {
  expect(needsSearch("can you fact check this claim?")).toBe(true);
  expect(needsSearch("find me sources on federalism")).toBe(true);
  expect(needsSearch("what's due this week?")).toBe(false);
  expect(needsSearch("add my research paper friday")).toBe(false);
});
