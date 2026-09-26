"use client";
// Landing features: a bento of live demos (widgets, calendar, countdowns, Up next, study days), then everything else
// as a plain list. Also exports the courses carousel demo, used by How it works.
import {
  CalendarDays,
  FolderOpen,
  GraduationCap,
  Hourglass,
  LayoutGrid,
  ListChecks,
  Lock,
  Palette,
  Plus,
  RefreshCw,
  Rss,
  Shuffle,
  Smartphone,
  Sparkles,
  SunMoon,
  Timer,
} from "lucide-react";
import { AnimatePresence, MotionConfig, motion, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Carousel } from "@/components/carousel";
import { CourseFace, type CourseCard } from "@/components/course-card";
import { courseColor, courseFace } from "@/lib/course";
import { Caption, CHIP, chip, EASE, SectionHead, useAutoCycle, VIEW } from "./kit";

// Illustration only: made-up course codes in the product's real course colors.
const SAMPLE = [
  { code: "BIO 110", due: "today", hue: 150, tone: "warning" },
  { code: "HIST 201", due: "2d", hue: 35 },
  { code: "CALC II", due: "done", hue: 250, tone: "done" },
  { code: "PSYC 100", due: "Fri", hue: 295 },
];

// Everything else Sonnet does, so the list is complete.
const EVERYTHING = [
  {
    icon: Rss,
    title: "Google Calendar feed",
    text: "Subscribe once and your deadlines show up in Google or Apple Calendar.",
  },
  {
    icon: RefreshCw,
    title: "Canvas token or feed",
    text: "Sync with an access token or just the calendar link. It refreshes daily.",
  },
  {
    icon: FolderOpen,
    title: "Materials per course",
    text: "Slides, readings and notes live with their course, ready for Sonnet.",
  },
  {
    icon: GraduationCap,
    title: "Grades and what-if",
    text: "Canvas grades, trends and gaps, and what you need on the final.",
  },
  {
    icon: Palette,
    title: "A color per course",
    text: "Every course keeps its color everywhere. Rename or recolor any time.",
  },
  {
    icon: Plus,
    title: "Quick add",
    text: "Add an assignment, exam, reading or class from anywhere with one +.",
  },
  {
    icon: Timer,
    title: "Focus timer and streaks",
    text: "Pomodoro sessions, study hours, study days and a streak to keep.",
  },
  {
    icon: SunMoon,
    title: "Light, dark or system",
    text: "A calm theme that follows your device, day or night.",
  },
  {
    icon: Smartphone,
    title: "On your phone",
    text: "Runs in the browser, laptop or phone. Add it to your home screen.",
  },
  {
    icon: Lock,
    title: "Private by default",
    text: "Only you see your data, and Settings can wipe it whenever you want.",
  },
];

// Up next rows you can tick off: tap one and its status flips to "done", tap again to undo.
function UpNext() {
  const [done, setDone] = useState<string[]>(["CALC II"]);
  return (
    <motion.ul
      initial="hidden"
      whileInView="visible"
      viewport={VIEW}
      transition={{ staggerChildren: 0.1 }}
      className="flex w-full max-w-sm flex-col divide-y divide-border rounded-xl border border-border bg-card px-2"
    >
      {SAMPLE.map((s) => {
        const isDone = done.includes(s.code);
        const tone = isDone ? "done" : s.tone === "done" ? undefined : s.tone;
        return (
          <motion.li
            key={s.code}
            variants={{
              hidden: { opacity: 0, y: 12 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.6, ease: EASE },
              },
            }}
          >
            <button
              type="button"
              aria-pressed={isDone}
              onClick={() =>
                setDone((d) =>
                  isDone ? d.filter((c) => c !== s.code) : [...d, s.code],
                )
              }
              className="flex w-full items-center gap-3 rounded-lg px-2 py-3 font-mono text-sm transition-[background-color,scale] hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-[0.98]"
            >
              <span
                className="chip rounded-full px-1.5 text-xs"
                style={chip(courseColor(s.hue))}
              >
                {s.code}
              </span>
              <span className="flex-1" />
              <span
                className={
                  tone ? "chip rounded-full px-1.5" : "text-muted-foreground"
                }
                style={tone ? chip(`var(--${tone})`) : undefined}
              >
                {isDone ? "done" : s.due === "done" ? "Mon" : s.due}
              </span>
            </button>
          </motion.li>
        );
      })}
    </motion.ul>
  );
}

// Sample study time, 18 weeks × 7 days; deterministic so server and client render the same.
const WEEKS = 18;
const level = (i: number) => {
  const v = Math.sin(i * 12.9898) * 43758.5453;
  const f = v - Math.floor(v);
  // rounded: Math.sin differs in the last digits between the server and the browser (hydration)
  return Math.round((i % 7 > 4 ? f * 0.5 : f) * 100) / 100; // weekends lighter
};

function StudyDots() {
  const ref = useRef<HTMLDivElement>(null);
  const on = useInView(ref, VIEW) ? 1 : 0;
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="flex min-h-[260px] items-center justify-center overflow-hidden px-6 mask-[radial-gradient(ellipse_at_center,black_50%,transparent_90%)] md:min-h-[320px]"
    >
      {/* --on flips 0 → 1 in view; each dot eases in with its own CSS transition, delayed by its week. */}
      <div className="grid grid-flow-col grid-rows-7 gap-1.5 sm:gap-2" style={{ "--on": on } as React.CSSProperties}>
        {Array.from({ length: WEEKS * 7 }, (_, i) => {
          const l = level(i);
          return (
            <span
              key={i}
              className="size-2.5 rounded-full bg-foreground transition-[opacity,scale] duration-500 ease-out motion-reduce:transition-none sm:size-3"
              style={{
                opacity: `calc(var(--on) * ${l < 0.2 ? 0.07 : 0.15 + l * 0.75})`,
                scale: "calc(0.4 + var(--on) * 0.6)",
                transitionDelay: `${Math.floor(i / 7) * 40}ms`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

// A small Home you can rearrange: tiles reshuffle on their own while in view; touching a control stops the demo.
const TILES = [
  {
    id: "Progress",
    span: "col-span-2 row-span-2",
    body: (
      <div className="flex h-full items-end gap-3">
        <p className="font-mono text-3xl leading-none">
          33<span className="text-sm text-muted-foreground">%</span>
        </p>
        <div className="flex h-full flex-1 items-end gap-1">
          {[30, 55, 80, 45, 95, 60, 25].map((h, i) => (
            <span
              key={i}
              className={`flex-1 rounded-full ${i === 4 ? "bg-foreground" : "bg-secondary"}`}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "Grades",
    span: "col-span-2 row-span-2",
    body: (
      <ul className="space-y-1.5 font-mono">
        {(
          [
            ["POLS 202", 250, "93.4"],
            ["BUS 101", 150, "88.0"],
            ["CHEM 1210", 295, "72.5"],
            ["HIST 150", 195, "84.7"],
          ] as const
        ).map(([c, h, g]) => (
          <li key={c} className="flex items-center gap-1.5">
            <span
              className="size-1.5 shrink-0 rounded-full"
              style={{ background: courseColor(h) }}
            />
            <span className="flex-1 truncate">{c}</span>
            {g}%
          </li>
        ))}
      </ul>
    ),
  },
  {
    id: "Next exam",
    span: "col-span-2",
    body: <p className="font-mono text-xl">9d 13h</p>,
  },
  {
    id: "This week",
    span: "col-span-2",
    body: (
      <div className="flex justify-between font-mono">
        {[21, 22, 23, 24, 25, 26, 27].map((d) => (
          <span
            key={d}
            className={
              d === 26 ? "rounded-full bg-foreground px-1 text-background" : ""
            }
          >
            {d}
          </span>
        ))}
      </div>
    ),
  },
  { id: "Timer", span: "", body: <p className="font-mono text-base">25:00</p> },
  {
    id: "Streak",
    span: "",
    body: <p className="font-mono text-base">12 days</p>,
  },
  {
    id: "Courses",
    span: "col-span-2 row-span-2",
    body: (
      <div className="relative h-full">
        {[295, 35, 250].map((h, i) => (
          <span
            key={h}
            className="absolute top-1 h-[85%] w-[45%] rounded-lg shadow-lg"
            style={{
              left: `${10 + i * 20}%`,
              rotate: `${(i - 1) * 8}deg`,
              background: courseFace(h),
            }}
          />
        ))}
      </div>
    ),
  },
  {
    id: "Grade trend",
    span: "col-span-2",
    body: (
      <svg viewBox="0 0 100 24" className="h-6 w-full" aria-hidden="true">
        <polyline
          points="0,20 15,16 30,18 45,10 60,12 75,6 100,4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    ),
  },
  {
    id: "Next deadline",
    span: "col-span-2",
    body: <p className="font-mono text-base">23h 12m 20s</p>,
  },
  {
    id: "Rings",
    span: "row-span-2",
    body: (
      <svg
        viewBox="0 0 40 40"
        className="mx-auto w-full max-w-16"
        aria-hidden="true"
      >
        {[16, 11, 6].map((r, i) => (
          <circle
            key={r}
            cx="20"
            cy="20"
            r={r}
            fill="none"
            strokeWidth="3"
            strokeLinecap="round"
            stroke={courseColor([250, 150, 35][i])}
            strokeDasharray={`${2 * Math.PI * r * [0.9, 0.7, 0.8][i]} 999`}
            transform="rotate(-90 20 20)"
          />
        ))}
      </svg>
    ),
  },
];
const START = [
  "Progress",
  "Grades",
  "Next exam",
  "This week",
  "Courses",
  "Timer",
  "Streak",
];

function WidgetsDemo() {
  const [shown, setShown] = useState(START);
  const [ref, stop] = useAutoCycle(() => setShown((s) => [...s.slice(1), s[0]]), 2400);
  const toggle = (id: string) => {
    stop();
    setShown((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };
  return (
    <div
      ref={ref}
      className="flex flex-col items-center gap-5 px-4 py-12 sm:px-6"
    >
      <div className="grid w-full max-w-lg grid-flow-dense auto-rows-[64px] grid-cols-4 gap-2 text-[10px] sm:auto-rows-[72px] sm:text-xs">
        <AnimatePresence mode="popLayout">
          {shown.map((id) => {
            const t = TILES.find((x) => x.id === id)!;
            return (
              <motion.div
                key={id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", duration: 0.5, bounce: 0.15 }}
                className={`${t.span} flex flex-col gap-1.5 overflow-hidden rounded-xl border border-border bg-card p-2.5`}
              >
                <span className="text-muted-foreground">{id}</span>
                <div className="min-h-0 flex-1">{t.body}</div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      <div className="flex max-w-lg flex-wrap justify-center gap-1.5">
        {TILES.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={shown.includes(t.id)}
            onClick={() => toggle(t.id)}
            className={CHIP}
          >
            {shown.includes(t.id) ? "−" : "+"} {t.id}
          </button>
        ))}
        <button
          type="button"
          onClick={() => (stop(), setShown((s) => [...s].reverse()))}
          className="flex h-11 items-center sm:h-8 gap-1 rounded-full px-2.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <Shuffle className="size-3" aria-hidden="true" /> Shuffle
        </button>
      </div>
    </div>
  );
}

// A small calendar you can switch between day, week and month; it cycles on its own until you pick a view.
const CLASSES = [
  { code: "CHEM 1210", hue: 295, days: [0, 2, 4], from: 9, to: 10 },
  { code: "POLS 202", hue: 250, days: [0, 2], from: 10.5, to: 12 },
  { code: "BUS 101", hue: 150, days: [1, 3], from: 13, to: 14.25 },
];
const DUE = [
  { day: 2, what: "Paper 1", hue: 250 },
  { day: 3, what: "Quiz", hue: 35 },
  { day: 4, what: "Midterm", hue: 150 },
];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const VIEWS = ["Day", "Week", "Month"] as const;
const H0 = 8, H1 = 15; // hours shown

function Block({ c }: { c: (typeof CLASSES)[number] }) {
  return (
    <span
      className="absolute inset-x-0.5 overflow-hidden rounded-md border-l-2 px-1 py-0.5 font-mono text-[9px] leading-tight sm:text-[10px]"
      style={{
        top: `${((c.from - H0) / (H1 - H0)) * 100}%`,
        height: `${((c.to - c.from) / (H1 - H0)) * 100}%`,
        borderColor: courseColor(c.hue),
        background: `color-mix(in oklab, ${courseColor(c.hue)} 18%, transparent)`,
      }}
    >
      {c.code}
    </span>
  );
}

function CalendarDemo() {
  const [view, setView] = useState<(typeof VIEWS)[number]>("Week");
  const [ref, stop] = useAutoCycle(() => setView((v) => VIEWS[(VIEWS.indexOf(v) + 1) % VIEWS.length]), 3000);
  const days = view === "Day" ? [2] : [0, 1, 2, 3, 4];
  return (
    <div ref={ref} className="flex min-h-[380px] flex-col items-center justify-center gap-4 px-4 py-12 sm:px-6 md:min-h-[440px]">
      <div className="flex rounded-full border border-border p-0.5 text-xs" role="group" aria-label="Calendar view">
        {VIEWS.map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={v === view}
            onClick={() => (stop(), setView(v))}
            className="h-11 rounded-full px-4 text-muted-foreground transition-colors sm:h-7 sm:px-3 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none aria-pressed:bg-secondary aria-pressed:text-foreground"
          >
            {v}
          </button>
        ))}
      </div>
      <div className="h-64 w-full max-w-md overflow-hidden rounded-xl border border-border bg-card p-3" aria-hidden="true">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, transform: "scale(0.97)" }}
            animate={{ opacity: 1, transform: "scale(1)" }}
            exit={{ opacity: 0, transform: "scale(0.97)" }}
            transition={{ duration: 0.25, ease: EASE }}
            className="flex h-full flex-col"
          >
            {view === "Month" ? (
              <div className="grid flex-1 grid-cols-7 gap-1 font-mono text-[10px]">
                {Array.from({ length: 35 }, (_, i) => {
                  const d = ((i + 27) % 30) + 1;
                  const due = i >= 21 && i <= 25 ? DUE.find((x) => x.day === i - 21) : undefined;
                  return (
                    <span key={i} className={`flex flex-col items-center gap-1 rounded-md py-1 ${i === 23 ? "bg-secondary" : ""} ${i < 3 ? "text-muted-foreground/50" : ""}`}>
                      {d}
                      {due && <span className="size-1.5 rounded-full" style={{ background: courseColor(due.hue) }} />}
                    </span>
                  );
                })}
              </div>
            ) : (
              <>
                <div className="flex gap-1 pl-7 font-mono text-[10px] text-muted-foreground">
                  {days.map((d) => (
                    <span key={d} className="flex-1 text-center">
                      {DAYS[d]} {21 + d}
                    </span>
                  ))}
                </div>
                <div className="mt-1 flex gap-1 pl-7">
                  {days.map((d) => {
                    const due = DUE.find((x) => x.day === d);
                    return (
                      <span key={d} className="h-4 flex-1 truncate text-center text-[9px]">
                        {due && (
                          <span className="chip rounded-full px-1" style={chip(courseColor(due.hue))}>
                            {due.what}
                          </span>
                        )}
                      </span>
                    );
                  })}
                </div>
                <div className="relative mt-1 flex flex-1 gap-1">
                  <div className="flex w-6 flex-col justify-between font-mono text-[9px] text-muted-foreground">
                    <span>8a</span>
                    <span>11a</span>
                    <span>3p</span>
                  </div>
                  {days.map((d) => (
                    <div key={d} className="relative flex-1 rounded-md bg-background/50">
                      {CLASSES.filter((c) => c.days.includes(d)).map((c) => (
                        <Block key={c.code} c={c} />
                      ))}
                    </div>
                  ))}
                  <span className="absolute inset-x-0 left-7 h-px bg-foreground/60" style={{ top: "45%" }} />
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// Countdowns that actually tick, with the same ring of ticks as the Home widget.
const pad = (n: number) => String(n).padStart(2, "0");
const split = (s: number) => [Math.floor(s / 86400), Math.floor(s / 3600) % 24, Math.floor(s / 60) % 60, s % 60];

function CountdownDemo() {
  const [t, setT] = useState(0); // seconds since shown
  useEffect(() => {
    const id = setInterval(() => setT((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const [d, h, m, s] = split(9 * 86400 + 13 * 3600 + 4 * 60 + 12 - t);
  const [, h2, m2, s2] = split(23 * 3600 + 12 * 60 + 20 - t);
  return (
    <div className="flex min-h-[320px] flex-wrap items-center justify-center gap-4 px-4 py-12 sm:px-6 md:min-h-[380px]">
      <div className="flex w-56 flex-col items-center gap-3 rounded-xl border border-border bg-card p-4">
        <p className="self-start text-xs text-muted-foreground">Next exam</p>
        <div className="relative size-36">
          <svg viewBox="0 0 100 100" className="size-full" aria-hidden="true">
            {Array.from({ length: 60 }, (_, i) => (
              <line
                key={i}
                x1="50"
                y1="4"
                x2="50"
                y2={i % 5 ? "10" : "13"}
                strokeWidth="1.6"
                strokeLinecap="round"
                transform={`rotate(${i * 6} 50 50)`}
                className={i <= s ? "stroke-foreground" : "stroke-foreground/20"}
              />
            ))}
          </svg>
          <p className="absolute inset-0 flex items-center justify-center font-mono text-2xl tabular-nums">
            {d}
            <span className="text-xs text-muted-foreground">d</span>&nbsp;{h}
            <span className="text-xs text-muted-foreground">h</span>
          </p>
        </div>
        <p className="flex w-full items-center gap-1.5 text-xs">
          <span className="size-1.5 rounded-full" style={{ background: courseColor(150) }} />
          BUS 101 Midterm
          <span className="ml-auto font-mono text-muted-foreground tabular-nums">
            {pad(m)}:{pad(s)}
          </span>
        </p>
      </div>
      <div className="flex w-56 flex-col gap-3 rounded-xl border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground">Next deadline</p>
        <p className="font-mono text-3xl tabular-nums">
          {h2}
          <span className="text-sm text-muted-foreground">h</span> {pad(m2)}
          <span className="text-sm text-muted-foreground">m</span> {pad(s2)}
          <span className="text-sm text-muted-foreground">s</span>
        </p>
        <p className="flex items-center gap-1.5 text-xs">
          <span className="size-1.5 rounded-full" style={{ background: courseColor(250) }} />
          POLS 202 Paper 1
        </p>
      </div>
    </div>
  );
}

// The real Home courses carousel, with sample courses: drag or swipe to spin it.
const SAMPLE_COURSES = [
  ["POLS 202", "Civics", 250],
  ["Precalc II", "", 35],
  ["BUS 101", "Intro to Business", 150],
  ["CHEM 1210", "", 295],
  ["ENGL 110", "Composition", 80],
  ["HIST 150", "", 195],
] as const;

const NOW = Date.UTC(2026, 8, 21, 16); // a Monday: every sample due date lands this week

export function CoursesDemo({ signUp }: { signUp: string }) {
  const now = NOW;
  const cards: CourseCard[] = SAMPLE_COURSES.map(([code, name, hue], k) => ({
    id: `c${k}`,
    code,
    name,
    hue,
    meetings: [],
    items: Array.from({ length: 1 + (k % 3) }, (_, j) => ({
      id: `i${k}-${j}`,
      title: "Sample work",
      course: code,
      hue,
      kind: j === 1 && k % 2 === 0 ? ("exam" as const) : ("assignment" as const),
      due: new Date(now + (j * 2 + 1) * 86400000).toISOString(),
      doneAt: null,
    })),
  }));
  return (
    <div className="flex min-h-[380px] items-center justify-center overflow-hidden px-4 py-12 md:min-h-[440px]">
      <Carousel
        label="Sample courses"
        orbit={92}
        width={360}
        slides={cards.map((c) => ({
          key: c.id,
          href: signUp,
          label: `${c.code}${c.name ? `, ${c.name}` : ""}`,
          face: <CourseFace course={c} now={now} compact />,
        }))}
      />
    </div>
  );
}

function Cell({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`flex flex-col justify-between bg-background ${className}`}>{children}</div>;
}

export function Features() {
  return (
    <MotionConfig reducedMotion="user">
      <section id="features" className="mx-auto max-w-6xl scroll-mt-24 pb-24 md:px-4">
        <SectionHead icon={Sparkles} badge="Features" title="Better than five tabs" muted="and a sticky note.">
          Canvas, a calendar, a grade calculator, a timer and a chatbot, each in its own tab. Sonnet is one quiet
          place for all of it, and the color only ever means something: a course, or what&apos;s due.
        </SectionHead>

        <div className="grid gap-px border-y border-border bg-border md:grid-cols-2 md:border-x">
          <Cell className="md:col-span-2 md:flex-row md:items-center">
            <div className="md:w-3/5">
              <WidgetsDemo />
            </div>
            <div className="md:w-2/5 md:pr-6">
              <Caption icon={LayoutGrid} label="Make Home yours">
                29 widgets: progress, grades, countdowns, calendar, courses, study hours and more. Drag them around,
                resize them, keep only what helps. Try the chips.
              </Caption>
            </div>
          </Cell>
          <Cell>
            <CalendarDemo />
            <Caption icon={CalendarDays} label="One calendar for everything">
              Class times, deadlines and exams from every course on a day, week or month view. Switch views above.
            </Caption>
          </Cell>
          <Cell>
            <CountdownDemo />
            <Caption icon={Hourglass} label="Countdowns">
              The next exam and the next deadline tick down on Home, to the second, so nothing sneaks up on you.
            </Caption>
          </Cell>
          <Cell>
            <div className="flex min-h-[260px] items-center justify-center px-6 py-10 md:min-h-[320px]">
              <UpNext />
            </div>
            <Caption icon={ListChecks} label="Up next, at a glance">
              Every course keeps its color. Status reads in words: late, today, done. Tap one to check it off.
            </Caption>
          </Cell>
          <Cell>
            <StudyDots />
            <Caption icon={Timer} label="Study days, counted">
              Every focus session adds up, day by day, so you can see the weeks you showed up.
            </Caption>
          </Cell>
        </div>

        <h3 className="mt-20 px-4 font-heading text-2xl font-semibold tracking-tight">And the rest</h3>
        <dl className="mt-6 grid gap-x-12 gap-y-6 px-4 sm:grid-cols-2">
          {EVERYTHING.map((f) => (
            <div key={f.title} className="flex gap-4">
              <f.icon className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div>
                <dt className="font-medium">{f.title}</dt>
                <dd className="mt-1 text-sm text-pretty text-muted-foreground">{f.text}</dd>
              </div>
            </div>
          ))}
        </dl>
      </section>
    </MotionConfig>
  );
}
