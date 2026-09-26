"use client";
// Landing features, laid out like Magic UI's CodeForge template: a centered header, a flickering dot strip, then a
// sticky intro on the left and bordered cards on the right that animate each time they scroll into view.
import {
  CalendarDays,
  FolderOpen,
  GraduationCap,
  Hourglass,
  LayoutGrid,
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
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { courseColor } from "@/lib/course";

export const EASE = [0.16, 1, 0.3, 1] as const;
// Replays every time it scrolls back into view.
export const VIEW = { amount: 0.3 } as const;

// Illustration only: made-up course codes in the product's real course colors.
const SAMPLE = [
  { code: "BIO 110", due: "today", hue: 150, tone: "warning" },
  { code: "HIST 201", due: "2d", hue: 35 },
  { code: "CALC II", due: "done", hue: 250, tone: "done" },
  { code: "PSYC 100", due: "Fri", hue: 295 },
];

export const chip = (color: string) =>
  ({ "--chip": color }) as React.CSSProperties;

// Everything else Sonnet does, so the list is complete.
const EVERYTHING = [
  {
    icon: CalendarDays,
    title: "Day, week and month",
    text: "Class times, deadlines and exams on one calendar, with the week of the term.",
  },
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
    text: "Slides, readings and notes live with their course, ready for the assistant.",
  },
  {
    icon: GraduationCap,
    title: "Grades and what-if",
    text: "Canvas grades, trends and gaps, and what you need on the final.",
  },
  {
    icon: Hourglass,
    title: "Countdowns",
    text: "The next exam and the next deadline, ticking down on Home.",
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

type Node = { icon: typeof Timer; angle: number; r: number; label?: string };
const LINES = 22;

// A grid of squares that flicker softly; paused offscreen and still with reduced motion.
export function FlickerStrip() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const CELL = 6,
      SQ = 3;
    let cols = 0,
      rows = 0,
      cells = new Float32Array(0),
      raf = 0,
      visible = false;
    const color = getComputedStyle(canvas).color;
    const size = () => {
      const dpr = devicePixelRatio || 1;
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(canvas.clientWidth / CELL);
      rows = Math.ceil(canvas.clientHeight / CELL);
      cells = Float32Array.from(
        { length: cols * rows },
        () => Math.random() * 0.3,
      );
    };
    const draw = () => {
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
      ctx.fillStyle = color;
      for (let i = 0; i < cells.length; i++) {
        ctx.globalAlpha = cells[i];
        ctx.fillRect((i % cols) * CELL, Math.floor(i / cols) * CELL, SQ, SQ);
      }
    };
    const tick = () => {
      for (let i = 0; i < cells.length; i++)
        if (Math.random() < 0.02) cells[i] = Math.random() * 0.3;
      draw();
      if (visible) raf = requestAnimationFrame(tick);
    };
    size();
    draw();
    const ro = new ResizeObserver(() => {
      size();
      draw();
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting && !still;
      cancelAnimationFrame(raf);
      if (visible) raf = requestAnimationFrame(tick);
    });
    io.observe(canvas);
    return () => {
      ro.disconnect();
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="block h-14 w-full text-muted-foreground"
    />
  );
}

// Lines draw out from the center, then each node springs out to its spot (angle in degrees, radius in px).
export function Orbit({
  center,
  nodes,
}: {
  center: React.ReactNode;
  nodes: Node[];
}) {
  return (
    <motion.div
      aria-hidden="true"
      initial="hidden"
      whileInView="visible"
      viewport={VIEW}
      className="relative flex min-h-[320px] items-center justify-center overflow-hidden mask-[radial-gradient(ellipse_at_center,black_40%,transparent_85%)] md:min-h-[400px]"
    >
      {/* The whole field turns slowly; icons and labels turn back so they stay upright. */}
      <div className="absolute inset-0 animate-[spin_80s_linear_infinite] motion-reduce:animate-none">
        {Array.from({ length: LINES }, (_, i) => (
          <div
            key={i}
            className="absolute top-1/2 left-1/2 origin-top-left"
            style={{ transform: `rotate(${(i * 360) / LINES}deg)` }}
          >
            <motion.div
              className="h-[1.5px] w-[40rem] origin-left bg-border"
              variants={{
                hidden: { scaleX: 0, opacity: 0 },
                visible: {
                  scaleX: 1,
                  opacity: i % 2 ? 0.6 : 1,
                  transition: {
                    duration: 0.8,
                    delay: 0.1 + i * 0.015,
                    ease: EASE,
                  },
                },
              }}
            />
          </div>
        ))}
        {nodes.map(({ icon: Icon, angle, r, label }, i) => {
          const a = (angle * Math.PI) / 180;
          return (
            <motion.div
              key={i}
              className="absolute top-1/2 left-1/2 z-30 -mt-5 -ml-5 flex size-10 items-center justify-center rounded-full border border-border bg-background"
              variants={{
                hidden: { x: 0, y: 0, scale: 0.5, opacity: 0 },
                visible: {
                  x: Math.cos(a) * r,
                  y: Math.sin(a) * r,
                  scale: 1,
                  opacity: 1,
                  transition: {
                    type: "spring",
                    stiffness: 160,
                    damping: 14,
                    delay: 0.05 + i * 0.07,
                  },
                },
              }}
            >
              <span className="relative flex animate-[spin_80s_linear_infinite_reverse] items-center justify-center motion-reduce:animate-none">
                <Icon className="size-4 text-muted-foreground" />
                {label && (
                  <span className="absolute top-full mt-3 text-[10px] whitespace-nowrap text-muted-foreground sm:text-xs">
                    {label}
                  </span>
                )}
              </span>
            </motion.div>
          );
        })}
      </div>
      <span className="absolute top-1/2 left-1/2 size-14 -translate-1/2 animate-ping rounded-full border border-foreground/20 [animation-duration:2.5s] motion-reduce:hidden" />
      {center}
    </motion.div>
  );
}

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
  return i % 7 > 4 ? f * 0.5 : f; // weekends lighter
};

function StudyDots() {
  return (
    <motion.div
      aria-hidden="true"
      initial="hidden"
      whileInView="visible"
      viewport={VIEW}
      className="flex min-h-[260px] items-center justify-center overflow-hidden px-6 mask-[radial-gradient(ellipse_at_center,black_50%,transparent_90%)] md:min-h-[320px]"
    >
      <div className="grid grid-flow-col grid-rows-7 gap-1.5 sm:gap-2">
        {Array.from({ length: WEEKS * 7 }, (_, i) => {
          const l = level(i);
          return (
            <motion.span
              key={i}
              className="size-2.5 rounded-full bg-foreground sm:size-3"
              variants={{
                hidden: { opacity: 0, scale: 0.4 },
                visible: {
                  opacity: l < 0.2 ? 0.07 : 0.15 + l * 0.75,
                  scale: 1,
                  transition: {
                    duration: 0.5,
                    delay: Math.floor(i / 7) * 0.04,
                    ease: EASE,
                  },
                },
              }}
            />
          );
        })}
      </div>
    </motion.div>
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
              background: `linear-gradient(oklch(0.82 0.15 ${h}), oklch(0.72 0.17 ${h}))`,
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
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const [shown, setShown] = useState(START);
  const [touched, setTouched] = useState(false);
  useEffect(() => {
    if (
      !inView ||
      touched ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const id = setInterval(() => setShown((s) => [...s.slice(1), s[0]]), 2400);
    return () => clearInterval(id);
  }, [inView, touched]);
  const toggle = (id: string) => {
    setTouched(true);
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
            className="h-7 rounded-full border border-border px-2.5 text-xs text-muted-foreground transition-[background-color,color,scale] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-[0.97] aria-pressed:bg-secondary aria-pressed:text-foreground"
          >
            {shown.includes(t.id) ? "−" : "+"} {t.id}
          </button>
        ))}
        <button
          type="button"
          onClick={() => (setTouched(true), setShown((s) => [...s].reverse()))}
          className="flex h-7 items-center gap-1 rounded-full px-2.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <Shuffle className="size-3" aria-hidden="true" /> Shuffle
        </button>
      </div>
    </div>
  );
}

export function SectionHead({
  icon: Icon,
  badge,
  title,
  muted,
  children,
}: {
  icon: typeof Timer;
  badge: string;
  title: string;
  muted: string;
  children: React.ReactNode;
}) {
  return (
    <div className="reveal flex flex-col items-center px-4 py-24 text-center">
      <span className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium">
        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
        {badge}
      </span>
      <h2 className="mt-4 max-w-3xl font-heading text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-6xl">
        {title} <span className="text-muted-foreground">{muted}</span>
      </h2>
      <p className="mt-5 max-w-xl text-lg text-pretty text-muted-foreground">
        {children}
      </p>
    </div>
  );
}

export function Caption({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Timer;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-xl p-6">
      <h3 className="flex items-center gap-3 text-sm text-muted-foreground">
        <Icon className="size-4" aria-hidden="true" />
        {label}
      </h3>
      <p className="mt-2 leading-relaxed text-pretty">{children}</p>
    </div>
  );
}

export function Features({ signUp }: { signUp: string }) {
  return (
    <MotionConfig reducedMotion="user">
      <section
        id="features"
        className="mx-auto max-w-6xl scroll-mt-24 border-border pb-24 md:px-4"
      >
        <SectionHead
          icon={Sparkles}
          badge="Features"
          title="Better than five tabs"
          muted="and a sticky note."
        >
          Canvas, a calendar, a grade calculator, a timer and a chatbot, each in
          its own tab. Sonnet is one quiet place for all of it, and the color
          only ever means something: a course, or what&apos;s due.
        </SectionHead>

        <div className="border-y border-border md:border-x">
          <FlickerStrip />
          <div className="grid grid-cols-1 border-t border-border md:grid-cols-6">
            <div className="flex flex-col gap-6 p-8 md:sticky md:top-20 md:col-span-2 md:self-start lg:p-12">
              <h3 className="font-heading text-3xl font-semibold tracking-tight text-balance lg:text-4xl">
                Everything your term needs
              </h3>
              <p className="text-pretty text-muted-foreground">
                A Home you build yourself, one calendar, grades, countdowns, a
                focus timer and every file for every course. All of it feeds the
                assistant.
              </p>
              <Link
                href={signUp}
                className="inline-flex h-10 w-fit items-center rounded-full border border-border px-5 text-sm font-medium hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
              >
                Get started free
              </Link>
            </div>

            <div className="divide-y divide-border border-t border-border md:col-span-4 md:border-t-0 md:border-l">
              <div className="reveal">
                <WidgetsDemo />
                <Caption icon={LayoutGrid} label="Make Home yours">
                  29 widgets: progress, grades, countdowns, calendar, courses,
                  study hours and more. Drag them around, resize them, keep only
                  what helps. Try the chips above.
                </Caption>
              </div>

              <div className="reveal">
                <div className="flex min-h-[260px] items-center justify-center px-6 py-10 md:min-h-[320px]">
                  <UpNext />
                </div>
                <Caption icon={CalendarDays} label="Up next, at a glance">
                  Every course keeps its color. Status reads in words: late,
                  today, done. Tap one to check it off.
                </Caption>
              </div>

              <div className="reveal">
                <StudyDots />
                <Caption icon={Timer} label="Study days, counted">
                  Every focus session adds up, day by day, so you can see the
                  weeks you showed up.
                </Caption>
              </div>

              <ul className="grid sm:grid-cols-2 lg:grid-cols-3">
                {EVERYTHING.map((f) => (
                  <li
                    key={f.title}
                    className="reveal border-b border-border p-6 sm:border-r"
                  >
                    <f.icon
                      className="size-5 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <h3 className="mt-4 font-medium">{f.title}</h3>
                    <p className="mt-1.5 text-sm text-pretty text-muted-foreground">
                      {f.text}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </MotionConfig>
  );
}
