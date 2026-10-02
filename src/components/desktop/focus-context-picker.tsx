"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { focusSense } from "@/lib/desktop/focus-sense";
import { nextContext, setNextContext, type StudyContext } from "@/lib/desktop/sense/context";
import type { Item } from "@/lib/progress";

type Course = { id: string; code: string; name?: string };

const field =
  "h-11 w-full rounded-full bg-secondary px-4 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm";

// Desktop app with Focus Sense on: what the next session is for, so Focus Sense can judge what's on-task.
// Optional; kept on this computer. Renders nothing in a browser.
export function FocusContextPicker({ courses, items }: { courses: Course[]; items: Item[] }) {
  const desktop = useSyncExternalStore(() => () => {}, focusSense.available, () => false);
  const [on, setOn] = useState(false);
  const [ctx, setCtx] = useState<StudyContext>({});

  useEffect(() => {
    if (!desktop) return;
    setCtx(nextContext()); // eslint-disable-line react-hooks/set-state-in-effect -- storage is client-only
    void focusSense.status().then((s) => setOn(!!s?.supported && s.enabled));
  }, [desktop]);
  if (!on) return null;

  const update = (c: StudyContext) => {
    setCtx(c);
    setNextContext(c);
  };
  const course = courses.find((c) => c.id === ctx.courseId);
  const open = items
    .filter((i) => i.courseId === ctx.courseId && !i.doneAt)
    .sort((a, b) => a.due.localeCompare(b.due))
    .slice(0, 40);

  return (
    <fieldset className="mt-4 grid gap-2">
      <legend className="mb-2 text-xs text-muted-foreground">Working on (optional, for Focus Sense)</legend>
      <select
        aria-label="Course"
        value={ctx.courseId ?? ""}
        onChange={(e) => {
          const c = courses.find((x) => x.id === e.target.value);
          update({ goal: ctx.goal, ...(c && { courseId: c.id, courseName: c.name ? `${c.code} ${c.name}` : c.code }) });
        }}
        className={field}
      >
        <option value="">No course</option>
        {courses.map((c) => (
          <option key={c.id} value={c.id}>
            {c.code}
          </option>
        ))}
      </select>
      {course && open.length > 0 && (
        <select
          aria-label="Assignment"
          value={ctx.assignmentId ?? ""}
          onChange={(e) => {
            const i = open.find((x) => x.id === e.target.value);
            const { goal, courseId, courseName } = ctx;
            update({ goal, courseId, courseName, ...(i && { assignmentId: i.id, assignmentTitle: i.title, assignmentKind: i.kind }) });
          }}
          className={field}
        >
          <option value="">Any work for {course.code}</option>
          {open.map((i) => (
            <option key={i.id} value={i.id}>
              {i.title}
            </option>
          ))}
        </select>
      )}
      <input
        aria-label="Goal"
        value={ctx.goal ?? ""}
        onChange={(e) => update({ ...ctx, goal: e.target.value })}
        maxLength={200}
        placeholder="Goal, e.g. finish lab 3"
        className={field}
      />
    </fieldset>
  );
}
