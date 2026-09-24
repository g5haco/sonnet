"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { logFocus } from "@/app/actions";
import { Block } from "@/components/block";
import { Button } from "@/components/ui/button";
import { courseColor, dayKey } from "@/lib/course";
import { streak, studyDays, type FocusSession } from "@/lib/focus";
import { cn } from "@/lib/utils";

const LENGTH = 25; // minutes per focus session
const WEEKS = 18; // heatmap columns
const KEY = "sonnet-focus"; // the running session survives page changes and reloads

type Run = { start: number; course: string };

const load = (): Run | null => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "null");
  } catch {
    return null;
  }
};
const store = (run: Run | null) => {
  try {
    if (run) localStorage.setItem(KEY, JSON.stringify(run));
    else localStorage.removeItem(KEY);
  } catch {}
};

// The focus timer and the study heatmap it fills. Sessions log when they finish, or when stopped after a minute.
// ponytail: the timer only runs while Home is open (a session finished elsewhere logs on the next visit, capped at
// 25 min); a global timer in the shell if students want it on every page.
export function FocusBlock({
  courses,
  sessions,
  now,
  className,
}: {
  courses: { id: string; code: string; hue: number }[];
  sessions: FocusSession[];
  now: number;
  className?: string;
}) {
  const [run, setRun] = useState<Run | null>(null);
  const [course, setCourse] = useState("");
  const [tick, setTick] = useState(now);

  useEffect(() => setRun(load()), []); // eslint-disable-line react-hooks/set-state-in-effect -- storage is client-only
  useEffect(() => {
    if (!run) return;
    const id = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, [run]);

  const finish = async (r: Run, minutes: number) => {
    setRun(null);
    store(null);
    if (minutes < 1) return;
    const res = await logFocus({ course: r.course, startedAt: new Date(r.start).toISOString(), minutes });
    if (res.error) toast.error(res.error);
    else toast.success(minutes >= LENGTH ? `${LENGTH} minutes done. Take a break.` : `${minutes} min logged.`);
  };

  const left = run ? LENGTH * 60_000 - (tick - run.start) : LENGTH * 60_000;
  useEffect(() => {
    if (run && left <= 0) finish(run, LENGTH); // eslint-disable-line react-hooks/set-state-in-effect
  }, [run, left <= 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const days = studyDays(sessions);
  const today = new Date(now);
  const inRow = streak(days, today);
  // Columns are weeks (Sunday on top), ending with this week.
  const first = new Date(today);
  first.setDate(first.getDate() - first.getDay() - (WEEKS - 1) * 7);
  const cells = Array.from({ length: WEEKS * 7 }, (_, i) => {
    const d = new Date(first);
    d.setDate(first.getDate() + i);
    return { key: dayKey(d), label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }), future: d > today };
  });
  const level = (m = 0) => (m === 0 ? 0 : m < 25 ? 1 : m < 60 ? 2 : m < 120 ? 3 : 4);
  const mmss = (ms: number) => {
    const s = Math.max(0, Math.ceil(ms / 1000));
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  };
  const running = courses.find((c) => c.id === run?.course);

  return (
    <Block title="Study days" aside={inRow ? `${inRow}-day streak` : undefined} className={className}>
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-mono text-3xl font-medium tracking-tight tabular-nums" aria-live="off">
          {mmss(left)}
        </span>
        {run ? (
          <>
            {running && (
              <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                <span className="size-2 rounded-full" style={{ background: courseColor(running.hue) }} />
                {running.code}
              </span>
            )}
            <Button
              variant="secondary"
              className="ml-auto h-10 rounded-full px-5"
              onClick={() => finish(run, Math.floor((Date.now() - run.start) / 60_000))}
            >
              Stop
            </Button>
          </>
        ) : (
          <>
            <select
              aria-label="Course"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              className="order-last h-10 basis-full rounded-full bg-secondary px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">No course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code}
                </option>
              ))}
            </select>
            <Button
              className="ml-auto h-10 rounded-full px-5"
              onClick={() => {
                const r = { start: Date.now(), course };
                setTick(r.start);
                setRun(r);
                store(r);
              }}
            >
              Focus {LENGTH} min
            </Button>
          </>
        )}
      </div>

      <div
        className="mt-4 grid grid-flow-col grid-rows-7 gap-[3px] overflow-x-auto"
        style={{ gridTemplateColumns: `repeat(${WEEKS}, minmax(0, 1fr))` }}
        role="img"
        aria-label={`Focus minutes per day, last ${WEEKS} weeks. ${inRow}-day streak.`}
      >
        {cells.map((c) => {
          const m = days.get(c.key) ?? 0;
          return (
            <span
              key={c.key}
              title={c.future ? undefined : `${c.label}: ${m ? `${m} min` : "no focus time"}`}
              className={cn(
                "aspect-square min-w-2 rounded-[3px]",
                c.future ? "bg-transparent" : level(m) === 0 ? "bg-secondary" : "bg-done",
                ["", "opacity-35", "opacity-55", "opacity-80", ""][level(m)],
              )}
            />
          );
        })}
      </div>
      {sessions.length === 0 && (
        <p className="mt-3 text-sm text-muted-foreground">Each focus session fills in a day. Start one above.</p>
      )}
    </Block>
  );
}
