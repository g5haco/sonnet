"use client";
// Landing features, laid out like Magic UI's CodeForge template: a centered header, a flickering dot strip, then a
// sticky intro on the left and bordered illustration cards on the right that animate once when scrolled into view.
import {
  BookOpen,
  CalendarDays,
  FileText,
  GraduationCap,
  MessageCircle,
  Presentation,
  RefreshCw,
  Rss,
  Sparkles,
  Timer,
} from "lucide-react";
import { MotionConfig, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { courseColor } from "@/lib/course";

const EASE = [0.16, 1, 0.3, 1] as const;
const ONCE = { once: true, margin: "-80px" } as const;

// Illustration only: made-up course codes in the product's real course colors.
const SAMPLE = [
  { code: "BIO 110", due: "today", hue: 150, tone: "warning" },
  { code: "HIST 201", due: "2d", hue: 35 },
  { code: "CALC II", due: "done", hue: 250, tone: "done" },
  { code: "PSYC 100", due: "Fri", hue: 295 },
];

const chip = (color: string) => ({ "--chip": color }) as React.CSSProperties;

const SMALL = [
  {
    icon: CalendarDays,
    title: "One calendar",
    text: "Class times, deadlines and exams on a day, week or month view, with a feed for Google Calendar.",
  },
  {
    icon: GraduationCap,
    title: "Grades and what-if",
    text: "See where each course stands and what you'd need on the final to hit the grade you want.",
  },
  {
    icon: MessageCircle,
    title: "An assistant that knows your classes",
    text: "It reads your syllabus, slides and readings, and plans your week. Nothing saves without your yes.",
  },
];

// What flows into Sonnet, placed around the center mark (angle in degrees, radius in px).
const SOURCES = [
  { icon: GraduationCap, angle: 200, r: 150 },
  { icon: CalendarDays, angle: 240, r: 120 },
  { icon: FileText, angle: 300, r: 150 },
  { icon: Rss, angle: 355, r: 125 },
  { icon: Presentation, angle: 60, r: 135 },
  { icon: BookOpen, angle: 125, r: 125 },
];
const LINES = 22;

// A grid of squares that flicker softly; paused offscreen and still with reduced motion.
function FlickerStrip() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const CELL = 6, SQ = 3;
    let cols = 0, rows = 0, cells = new Float32Array(0), raf = 0, visible = false;
    const color = getComputedStyle(canvas).color;
    const size = () => {
      const dpr = devicePixelRatio || 1;
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(canvas.clientWidth / CELL);
      rows = Math.ceil(canvas.clientHeight / CELL);
      cells = Float32Array.from({ length: cols * rows }, () => Math.random() * 0.3);
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
      for (let i = 0; i < cells.length; i++) if (Math.random() < 0.02) cells[i] = Math.random() * 0.3;
      draw();
      if (visible) raf = requestAnimationFrame(tick);
    };
    size();
    draw();
    const ro = new ResizeObserver(() => { size(); draw(); });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting && !still;
      cancelAnimationFrame(raf);
      if (visible) raf = requestAnimationFrame(tick);
    });
    io.observe(canvas);
    return () => { ro.disconnect(); io.disconnect(); cancelAnimationFrame(raf); };
  }, []);
  return <canvas ref={ref} aria-hidden="true" className="block h-14 w-full text-muted-foreground" />;
}

// Lines draw out from the Sonnet mark, then each source springs out to its spot.
function SyncOrbit() {
  return (
    <motion.div
      aria-hidden="true"
      initial="hidden"
      whileInView="visible"
      viewport={ONCE}
      className="relative flex min-h-[320px] items-center justify-center overflow-hidden mask-[radial-gradient(ellipse_at_center,black_40%,transparent_85%)] md:min-h-[400px]"
    >
      {Array.from({ length: LINES }, (_, i) => (
        <div key={i} className="absolute top-1/2 left-1/2 origin-top-left" style={{ transform: `rotate(${(i * 360) / LINES}deg)` }}>
          <motion.div
            className="h-[1.5px] w-[40rem] origin-left bg-border"
            variants={{
              hidden: { scaleX: 0, opacity: 0 },
              visible: { scaleX: 1, opacity: i % 2 ? 0.6 : 1, transition: { duration: 0.8, delay: 0.1 + i * 0.015, ease: EASE } },
            }}
          />
        </div>
      ))}
      <div className="relative z-20 flex size-12 items-center justify-center rounded-full border border-border bg-card font-mono text-sm font-medium">
        s<span className="text-muted-foreground">.</span>
      </div>
      {SOURCES.map(({ icon: Icon, angle, r }, i) => {
        const a = (angle * Math.PI) / 180;
        return (
          <motion.div
            key={i}
            className="absolute top-1/2 left-1/2 z-30 -mt-5 -ml-5 flex size-10 items-center justify-center rounded-full border border-border bg-background"
            variants={{
              hidden: { x: 0, y: 0, scale: 0 },
              visible: {
                x: Math.cos(a) * r,
                y: Math.sin(a) * r,
                scale: 1,
                transition: { type: "spring", stiffness: 160, damping: 14, delay: 0.05 + i * 0.07 },
              },
            }}
          >
            <Icon className="size-4 text-muted-foreground" />
          </motion.div>
        );
      })}
    </motion.div>
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
      viewport={ONCE}
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
                  transition: { duration: 0.5, delay: Math.floor(i / 7) * 0.04, ease: EASE },
                },
              }}
            />
          );
        })}
      </div>
    </motion.div>
  );
}

function Caption({ icon: Icon, label, children }: { icon: typeof Timer; label: string; children: React.ReactNode }) {
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
      <section id="features" className="mx-auto max-w-6xl scroll-mt-24 border-border pb-24 md:px-4">
        <div className="flex flex-col items-center px-4 py-24 text-center">
          <span className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium">
            <Sparkles className="size-4 text-muted-foreground" aria-hidden="true" />
            Features
          </span>
          <h2 className="mt-4 max-w-3xl font-heading text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-6xl">
            Better than five tabs <span className="text-muted-foreground">and a sticky note.</span>
          </h2>
          <p className="mt-5 max-w-xl text-lg text-pretty text-muted-foreground">
            Canvas, a calendar, a grade calculator, a timer and a chatbot, each in its own tab. Sonnet is one quiet
            place for all of it, and the color only ever means something: a course, or what&apos;s due.
          </p>
        </div>

        <div className="border-y border-border md:border-x">
          <FlickerStrip />
          <div className="grid border-t border-border md:grid-cols-6">
            <div className="flex flex-col gap-6 p-8 md:sticky md:top-20 md:col-span-2 md:self-start lg:p-12">
              <h3 className="font-heading text-3xl font-semibold tracking-tight text-balance lg:text-4xl">
                Your whole semester, in one calm place
              </h3>
              <p className="text-pretty text-muted-foreground">
                Deadlines, class times, grades and study time, all from the tools you already use. No setup marathon.
              </p>
              <Link
                href={signUp}
                className="inline-flex h-10 w-fit items-center rounded-full border border-border px-5 text-sm font-medium hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
              >
                Get started free
              </Link>
            </div>

            <div className="divide-y divide-border border-t border-border md:col-span-4 md:border-t-0 md:border-l">
              <div>
                <SyncOrbit />
                <Caption icon={RefreshCw} label="Canvas, synced">
                  Assignments, due dates and grades come in on their own, plus your syllabus, slides and readings.
                  Nothing is due that you don&apos;t know about.
                </Caption>
              </div>

              <div>
                <div className="flex min-h-[260px] items-center justify-center px-6 py-10 md:min-h-[320px]">
                  <motion.ul
                    aria-hidden="true"
                    initial="hidden"
                    whileInView="visible"
                    viewport={ONCE}
                    transition={{ staggerChildren: 0.1 }}
                    className="flex w-full max-w-sm flex-col divide-y divide-border rounded-xl border border-border bg-card px-4"
                  >
                    {SAMPLE.map((s) => (
                      <motion.li
                        key={s.code}
                        variants={{
                          hidden: { opacity: 0, y: 12 },
                          visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
                        }}
                        className="flex items-center gap-3 py-3 font-mono text-sm"
                      >
                        <span className="chip rounded-full px-1.5 text-xs" style={chip(courseColor(s.hue))}>
                          {s.code}
                        </span>
                        <span className="flex-1" />
                        <span
                          className={s.tone ? "chip rounded-full px-1.5" : "text-muted-foreground"}
                          style={s.tone ? chip(`var(--${s.tone})`) : undefined}
                        >
                          {s.due}
                        </span>
                      </motion.li>
                    ))}
                  </motion.ul>
                </div>
                <Caption icon={CalendarDays} label="Up next, at a glance">
                  Every course keeps its color. Status reads in words: late, today, done. Nothing to decode.
                </Caption>
              </div>

              <div>
                <StudyDots />
                <Caption icon={Timer} label="A focus timer that remembers">
                  Pomodoro-style sessions that keep track of how much you studied, day by day.
                </Caption>
              </div>

              <div className="grid divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                {SMALL.map((f) => (
                  <div key={f.title} className="p-6">
                    <f.icon className="size-5 text-muted-foreground" aria-hidden="true" />
                    <h3 className="mt-4 font-medium">{f.title}</h3>
                    <p className="mt-1.5 text-sm text-pretty text-muted-foreground">{f.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </MotionConfig>
  );
}
