"use client";

// Home's chart and live widgets: a big readout on top, the picture below. Every number comes from Sonnet's own
// data (courses, work, grades, focus sessions); when there's nothing to draw, the widget says what fills it.
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Fragment, useEffect, useState } from "react";
import { Block } from "@/components/block";
import { Fit } from "@/components/fit";
import { addDays, startOfDay, type Term } from "@/lib/calendar";
import { courseColor, dayKey, gradeLabel } from "@/lib/course";
import type { FocusSession } from "@/lib/focus";
import type { Item } from "@/lib/progress";
import { paceByWeek } from "@/lib/charts";
import { cn } from "@/lib/utils";

type Course = { id: string; code: string; name: string; hue: number; grade?: number | null };
export type GradePoint = { course_id: string; day: string; grade: number };

const Big = ({ children, unit }: { children: React.ReactNode; unit?: string }) => (
  <p className="font-mono text-3xl font-medium tracking-tight tabular-nums">
    {children}
    {unit && <span className="ml-1.5 text-sm font-normal tracking-normal text-muted-foreground">{unit}</span>}
  </p>
);
const Empty = ({ children }: { children: React.ReactNode }) => (
  <p data-empty className="m-auto max-w-72 text-center text-sm text-balance text-muted-foreground">{children}</p>
);
const Dot = ({ hue }: { hue: number }) => (
  <span className="size-2 shrink-0 rounded-full" style={{ background: courseColor(hue) }} aria-hidden="true" />
);
const graded = (courses: Course[]) => courses.filter((c): c is Course & { grade: number } => c.grade != null);
const hm = (min: number) => (min < 60 ? `${min}m` : `${Math.floor(min / 60)}h ${min % 60 ? `${min % 60}m` : ""}`.trim());

// Each course's grade over time, one line per course, from the grade Canvas sync records daily.
export function TrendWidget({ courses, history }: { courses: Course[]; history: GradePoint[] }) {
  const lines = courses
    .map((c) => ({ c, pts: history.filter((p) => p.course_id === c.id).sort((a, b) => a.day.localeCompare(b.day)) }))
    .filter((l) => l.pts.length > 0);
  const days = [...new Set(lines.flatMap((l) => l.pts.map((p) => p.day)))].sort();
  const grades = lines.flatMap((l) => l.pts.map((p) => Number(p.grade)));
  const hi = Math.max(Math.min(100, Math.ceil(Math.max(...grades) + 3)), Math.ceil(Math.max(...grades))); // extra credit
  const lo = Math.min(Math.max(0, Math.floor(Math.min(...grades) - 3)), hi - 1);
  const t = (day: string) => (Date.parse(day) - Date.parse(days[0])) / Math.max(1, Date.parse(days.at(-1)!) - Date.parse(days[0]));

  return (
    <Block title="Grade trend" aside={days.length > 1 ? `since ${new Date(`${days[0]}T00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : undefined}>
      {days.length < 2 ? (
        <Empty>Each daily Canvas sync adds a point. The lines appear after syncs on two different days.</Empty>
      ) : (
        <>
          <svg
            viewBox="0 0 100 40"
            preserveAspectRatio="none"
            className="min-h-24 w-full flex-1 overflow-visible"
            role="img"
            aria-label={lines.map((l) => `${l.c.code}: ${gradeLabel(l.pts[0].grade)} to ${gradeLabel(l.pts.at(-1)!.grade)}`).join(", ")}
          >
            {lines.map(({ c, pts }) => (
              <polyline
                key={c.id}
                fill="none"
                stroke={courseColor(c.hue)}
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
                strokeLinejoin="round"
                points={pts.map((p) => `${t(p.day) * 100},${40 - ((Number(p.grade) - lo) / (hi - lo)) * 40}`).join(" ")}
              />
            ))}
          </svg>
          <dl className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-x-6 gap-y-1.5 text-sm">
            {lines.map(({ c, pts }) => {
              const delta = Number(pts.at(-1)!.grade) - Number(pts[0].grade);
              return (
                <div key={c.id} className="flex items-center gap-2">
                  <dt className="flex min-w-0 flex-1 items-center gap-2 truncate font-mono text-xs">
                    <Dot hue={c.hue} />
                    {c.code}
                  </dt>
                  <dd className="font-mono text-xs tabular-nums">
                    {gradeLabel(pts.at(-1)!.grade)}{" "}
                    <span className={cn(delta > 0 ? "text-done" : delta < 0 ? "text-destructive" : "text-muted-foreground")}>
                      {delta > 0 ? "↑" : delta < 0 ? "↓" : "·"}
                      {Math.abs(Math.round(delta * 10) / 10)}
                    </span>
                  </dd>
                </div>
              );
            })}
          </dl>
        </>
      )}
    </Block>
  );
}

// Current grades side by side as bars out of 100.
export function GradeBarsWidget({ courses }: { courses: Course[] }) {
  const list = graded(courses).sort((a, b) => b.grade - a.grade);
  const avg = list.length ? list.reduce((n, c) => n + c.grade, 0) / list.length : 0;
  return (
    <Block title="Grade bars" aside={list.length ? "from Canvas" : undefined}>
      {list.length === 0 ? (
        <Empty>Grades show up here after a Canvas sync.</Empty>
      ) : (
        <>
          <Big unit="average">{gradeLabel(avg)}</Big>
          <ul className="mt-4 flex flex-1 flex-col justify-evenly gap-2.5">
            {list.map((c) => (
              <li key={c.id} className="grid grid-cols-[5.5rem_1fr_3.5rem] items-center gap-3 font-mono text-xs">
                <span className="truncate">{c.code}</span>
                <span className="h-1.5 rounded-full bg-foreground/10">
                  <span className="block h-full rounded-full" style={{ width: `${Math.min(100, c.grade)}%`, background: courseColor(c.hue) }} />
                </span>
                <span className="text-right tabular-nums text-muted-foreground">{gradeLabel(c.grade)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Block>
  );
}

// The last graded work as bars (score out of points), in course colors.
export function ScoresWidget({ items }: { items: Item[] }) {
  const list = items
    .filter((i) => i.score != null && i.points)
    .sort((a, b) => a.due.localeCompare(b.due))
    .slice(-14)
    .map((i) => ({ ...i, pct: (i.score! / i.points!) * 100 }));
  const avg = list.reduce((n, i) => n + i.pct, 0) / (list.length || 1);
  return (
    <Block title="Recent scores" aside={list.length ? `last ${list.length}` : undefined}>
      {list.length === 0 ? (
        <Empty>Scores show up once Canvas grades your work.</Empty>
      ) : (
        <>
          <Big unit="average">{Math.round(avg)}%</Big>
          <div
            className="mt-4 flex min-h-16 flex-1 items-end gap-1"
            role="img"
            aria-label={list.map((i) => `${i.course} ${i.title}: ${i.score}/${i.points}`).join(", ")}
          >
            {list.map((i) => (
              <span
                key={i.id}
                title={`${i.course}: ${i.title} · ${i.score}/${i.points}`}
                className="flex-1 rounded-sm"
                style={{ height: `${Math.max(4, Math.min(100, i.pct))}%`, background: courseColor(i.hue) }}
              />
            ))}
          </div>
        </>
      )}
    </Block>
  );
}

// Every exam in the next 30 days as a day count, so crunch weeks show up before they arrive.
export function ExamsWidget({ items, now }: { items: Item[]; now: number }) {
  const list = items
    .filter((i) => i.kind === "exam" && !i.doneAt && Date.parse(i.due) > now && Date.parse(i.due) < now + 30 * 864e5)
    .sort((a, b) => a.due.localeCompare(b.due));
  return (
    <Block title="Exam countdowns" aside="next 30 days">
      {list.length === 0 ? (
        <Empty>No exams in the next 30 days.</Empty>
      ) : (
        <ul className="flex flex-1 flex-col justify-evenly gap-3">
          {list.map((i) => {
            const days = Math.ceil((Date.parse(i.due) - now) / 864e5);
            return (
              <li key={i.id} className="flex items-center gap-3">
                <span className="w-10 text-right font-mono text-2xl font-medium tabular-nums">{days}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{i.title}</span>
                  <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                    <Dot hue={i.hue} />
                    {i.course} · {days === 1 ? "day" : "days"}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Block>
  );
}

const SHADES = ["bg-foreground/[0.06]", "bg-done/35", "bg-done/55", "bg-done/80", "bg-done"];

// When you actually study: focus minutes by hour of day over the last 7 days.
export function HoursWidget({ sessions, now }: { sessions: FocusSession[]; now: number }) {
  const today = startOfDay(new Date(now));
  const days = Array.from({ length: 7 }, (_, k) => addDays(today, k - 6));
  const grid = new Map<string, number>(); // "day|hour" -> minutes
  for (const s of sessions) {
    const start = Date.parse(s.started_at);
    if (start < days[0].getTime()) continue;
    for (let m = 0; m < s.minutes; m++) {
      const t = new Date(start + m * 60_000);
      const k = `${dayKey(t)}|${t.getHours()}`;
      grid.set(k, (grid.get(k) ?? 0) + 1);
    }
  }
  const total = [...grid.values()].reduce((a, b) => a + b, 0);
  const level = (m = 0) => (m === 0 ? 0 : m < 15 ? 1 : m < 30 ? 2 : m < 45 ? 3 : 4);
  return (
    <Block title="Study hours" aside="last 7 days">
      <Big unit="focused">{hm(total)}</Big>
      <div
        className="mt-4 grid flex-1 grid-cols-[auto_minmax(0,1fr)] grid-rows-[repeat(7,minmax(0.5rem,1fr))_auto] gap-x-3 gap-y-[3px]"
        role="img"
        aria-label={`Focus minutes by hour of day, last 7 days: ${hm(total)} in total.`}
      >
        {days.map((d, r) => (
          <Fragment key={r}>
            <span className={cn("self-center font-mono text-xs", r === 6 ? "text-foreground" : "text-muted-foreground")}>
              {r === 6 ? "Today" : d.toLocaleDateString(undefined, { weekday: "short" })}
            </span>
            <span className="grid grid-cols-[repeat(24,minmax(0,1fr))] gap-[3px]">
              {Array.from({ length: 24 }, (_, h) => {
                const m = grid.get(`${dayKey(d)}|${h}`);
                return <span key={h} title={m ? `${m} min` : undefined} className={cn("min-h-2 rounded-[2px]", SHADES[level(m)])} />;
              })}
            </span>
          </Fragment>
        ))}
        <span />
        <span className="mt-1.5 grid grid-cols-4 font-mono text-xs text-muted-foreground" aria-hidden="true">
          {["12AM", "6AM", "12PM", "6PM"].map((h) => (
            <span key={h}>{h}</span>
          ))}
        </span>
      </div>
    </Block>
  );
}

// Share of past-due work checked off by its due date, and one tick per term week (amber = something was late).
export function OnTimeWidget({ items, now, term }: { items: Item[]; now: number; term: Term | null }) {
  const start = term ? Date.parse(`${term.start}T00:00:00`) : -Infinity;
  const past = items.filter((i) => Date.parse(i.due) < now && Date.parse(i.due) >= start);
  const onTime = (i: Item) => !!i.doneAt && Date.parse(i.doneAt) <= Date.parse(i.due);
  const rate = past.length ? Math.round((past.filter(onTime).length / past.length) * 100) : null;
  const weeks = Array.from({ length: term?.weeks ?? 0 }, (_, w) => {
    const list = past.filter((i) => Math.floor((Date.parse(i.due) - start) / (7 * 864e5)) === w);
    return list.length === 0 ? "none" : list.every(onTime) ? "ok" : "late";
  });
  return (
    <Block title="On-time rate" aside="this term">
      {rate === null ? (
        <Empty>Once work comes due, this shows how much you checked off in time.</Empty>
      ) : (
        <>
          <Big unit="on time">{rate}%</Big>
          <div className="mt-4 flex min-h-6 flex-1 gap-[3px]" role="img" aria-label={`${weeks.filter((w) => w === "late").length} weeks had late work.`}>
            {weeks.map((w, k) => (
              <span
                key={k}
                title={`Week ${k + 1}`}
                className={cn("flex-1 rounded-[2px]", w === "late" ? "bg-destructive/80" : w === "ok" ? "bg-foreground/30" : "bg-foreground/10")}
              />
            ))}
          </div>
        </>
      )}
    </Block>
  );
}

// Focus minutes per course (sessions logged with a course), as one share bar.
export function SplitWidget({ sessions, courses }: { sessions: FocusSession[]; courses: Course[] }) {
  const per = courses
    .map((c) => ({ c, min: sessions.filter((s) => s.course_id === c.id).reduce((n, s) => n + s.minutes, 0) }))
    .filter((x) => x.min > 0)
    .sort((a, b) => b.min - a.min);
  const total = per.reduce((n, x) => n + x.min, 0);
  return (
    <Block title="Time by course" aside="focus sessions">
      {total === 0 ? (
        <Empty>The focus timer logs time without a course, so there&apos;s nothing to split yet.</Empty>
      ) : (
        <>
          <Big>{hm(total)}</Big>
          <div className="mt-4 flex min-h-1.5 flex-1 gap-[3px]" role="img" aria-label={per.map((x) => `${x.c.code} ${hm(x.min)}`).join(", ")}>
            {per.map((x) => (
              <span key={x.c.id} className="h-full rounded-lg" style={{ width: `${(x.min / total) * 100}%`, background: courseColor(x.c.hue) }} />
            ))}
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 font-mono text-xs">
            {per.map((x) => (
              <div key={x.c.id} className="flex items-center gap-2">
                <dt className="flex min-w-0 flex-1 items-center gap-2 truncate">
                  <Dot hue={x.c.hue} />
                  {x.c.code}
                </dt>
                <dd className="tabular-nums text-muted-foreground">{Math.round((x.min / total) * 100)}%</dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </Block>
  );
}

// One digit that rolls up when it changes (stays still with reduced motion).
function Roll({ ch }: { ch: string }) {
  const still = useReducedMotion();
  return (
    <span className="relative inline-block overflow-hidden">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={ch}
          className="inline-block"
          initial={still ? false : { y: "-100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={still ? undefined : { y: "100%", opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          {ch}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

// The next open deadline, ticking every second.
export function CountdownWidget({ items }: { items: Item[] }) {
  const [now, setNow] = useState<number | null>(null); // client-only clock: the server's second never matches
  useEffect(() => {
    setNow(Date.now()); // eslint-disable-line react-hooks/set-state-in-effect
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (now === null) return <Block title="Next deadline" />;
  const next = items.filter((i) => !i.doneAt && Date.parse(i.due) > now).sort((a, b) => a.due.localeCompare(b.due))[0];
  if (!next)
    return (
      <Block title="Next deadline">
        <Empty>Nothing due. Enjoy it.</Empty>
      </Block>
    );
  const s = Math.floor((Date.parse(next.due) - now) / 1000);
  const parts: [number, string][] = [
    [Math.floor(s / 86400), "d"],
    [Math.floor((s % 86400) / 3600), "h"],
    [Math.floor((s % 3600) / 60), "m"],
    [s % 60, "s"],
  ];
  return (
    <Block title="Next deadline">
      <Fit>
      <p className="font-mono text-3xl font-medium tabular-nums" aria-label={`${parts.map(([n, u]) => `${n}${u}`).join(" ")} left`}>
        {parts
          .filter(([n], k) => n > 0 || k >= 2)
          .map(([n, u]) => (
            <span key={u} className="mr-2 inline-flex items-baseline">
              {String(n)
                .padStart(u === "d" ? 1 : 2, "0")
                .split("")
                .map((ch, k) => (
                  <Roll key={k} ch={ch} />
                ))}
              <span className="ml-0.5 text-sm font-normal text-muted-foreground">{u}</span>
            </span>
          ))}
      </p>
      </Fit>
      <p className="mt-2 flex items-center gap-2 text-sm">
        <Dot hue={next.hue} />
        <span className="truncate">{next.title}</span>
      </p>
    </Block>
  );
}


// Per term week: how much came due (dashed line) and how much of it got done (filled).
export function PaceWidget({ items, term, now }: { items: Item[]; term: Term; now: number }) {
  const data = paceByWeek(items, term, now);
  const top = Math.max(1, ...data.map((d) => d.due));
  const x = (i: number) => (i / Math.max(1, data.length - 1)) * 100;
  const y = (n: number) => 40 - (n / top) * 36;
  const line = (k: "due" | "done") => data.map((d, i) => `${x(i)},${y(d[k])}`).join(" ");
  const last = data.at(-1);
  return (
    <Block title="Done vs due" aside="per week">
      {data.length < 2 ? (
        <Empty>Fills in week by week as the term goes on.</Empty>
      ) : (
        <>
          <svg
            viewBox="0 0 100 40"
            preserveAspectRatio="none"
            className="min-h-20 w-full flex-1 overflow-visible"
            role="img"
            aria-label={data.map((d) => `${d.week}: ${d.done} of ${d.due} done`).join(", ")}
          >
            <polygon points={`0,40 ${line("done")} 100,40`} fill="var(--done)" fillOpacity={0.2} />
            <polyline points={line("done")} fill="none" stroke="var(--done)" strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
            <polyline
              points={line("due")}
              fill="none"
              stroke="var(--muted-foreground)"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              vectorEffect="non-scaling-stroke"
              strokeLinejoin="round"
            />
            {/* hover a week for its numbers */}
            {data.map((d, i) => (
              <rect key={d.week} x={x(i) - 50 / (data.length - 1)} width={100 / (data.length - 1)} y={0} height={40} fill="transparent">
                <title>{`${d.week}: ${d.done} of ${d.due} done`}</title>
              </rect>
            ))}
          </svg>
          <div className="mt-2 flex justify-between font-mono text-xs text-muted-foreground">
            <span>{data[0].week}</span>
            <span className="flex gap-3">
              <span className="text-done">done {last!.done}</span>
              <span>due {last!.due}</span>
            </span>
            <span>{last!.week}</span>
          </div>
        </>
      )}
    </Block>
  );
}
