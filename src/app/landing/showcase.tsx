"use client";
// "How it works" as hands-on demos, like the workflow cards in Magic UI's CodeForge template: a Canvas sync that
// plays itself when scrolled into view, then an assistant plan, a what-if grade slider and a focus timer to try.
import { Check, GraduationCap, MessageCircle, RefreshCw, Timer, Workflow } from "lucide-react";
import { AnimatePresence, MotionConfig, motion, useInView, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { courseColor } from "@/lib/course";
import { Caption, chip, EASE, FlickerStrip, SectionHead } from "./features";

// Counts 0 → total, one step every `ms`, once the returned ref scrolls into view (instantly with reduced motion).
function useSequence(total: number, ms: number) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-120px" });
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!inView || reduce || step >= total) return;
    const id = setTimeout(() => setStep(step + 1), ms);
    return () => clearTimeout(id);
  }, [inView, reduce, step, total, ms]);
  return [ref, reduce ? total : step] as const;
}

const fadeUp = {
  initial: { opacity: 0, transform: "translateY(6px)" },
  animate: { opacity: 1, transform: "translateY(0px)" },
  transition: { duration: 0.35, ease: EASE },
};

function Window({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`w-full max-w-md overflow-hidden rounded-xl border border-border bg-card shadow-2xl ${className}`}>
      <div className="flex items-center gap-2 border-b border-border bg-secondary/50 px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span key={i} className="size-2.5 rounded-full bg-muted-foreground/40" />
          ))}
        </span>
        <span className="ml-2 text-xs text-muted-foreground">{title}</span>
      </div>
      {children}
    </div>
  );
}

const SYNC = [
  "Connecting to canvas.yourschool.edu",
  "Found 5 courses",
  "Importing assignments: 42/42, done.",
  "Reading syllabus PDFs",
  "Building your week",
];

function SyncDemo({ signUp }: { signUp: string }) {
  const [ref, step] = useSequence(SYNC.length + 2, 650);
  const synced = step > SYNC.length;
  return (
    <div ref={ref} className="relative flex min-h-[360px] items-center justify-center px-6 py-14 md:min-h-[420px]">
      <div className="relative w-full max-w-md">
        <motion.span
          key={synced ? "done" : "sync"}
          {...fadeUp}
          className="absolute -top-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium"
        >
          {synced ? (
            <Check className="size-3.5 text-done" aria-hidden="true" />
          ) : (
            <RefreshCw className="size-3.5 animate-spin text-muted-foreground motion-reduce:animate-none" aria-hidden="true" />
          )}
          {synced ? "Synced" : "Syncing"}
        </motion.span>
        <Window title="Connect Canvas">
          <div className="min-h-44 space-y-1.5 p-5 font-mono text-[13px]" aria-live="polite">
            <p>
              <span className="text-muted-foreground">$</span> sonnet connect canvas
            </p>
            {SYNC.slice(0, step).map((line) => (
              <motion.p key={line} {...fadeUp} className="text-muted-foreground">
                {line}
                {!line.endsWith(".") && (step > SYNC.indexOf(line) + 1 ? "" : "...")}
              </motion.p>
            ))}
            {synced && (
              <motion.p {...fadeUp} className="text-done">
                ✓ All set. 3 things due this week.
              </motion.p>
            )}
          </div>
        </Window>
        <AnimatePresence>
          {step > SYNC.length + 1 && (
            <motion.div
              initial={{ opacity: 0, transform: "translateY(16px) scale(0.96)" }}
              animate={{ opacity: 1, transform: "translateY(0px) scale(1)" }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
              className="absolute inset-x-6 top-24 sm:inset-x-10"
            >
              <Window title="Home">
                <div className="flex flex-col items-center gap-3 px-6 py-7 text-center">
                  <p className="font-heading text-xl font-semibold">Your week is ready</p>
                  <p className="text-sm text-muted-foreground">Deadlines, classes and grades, all in one place.</p>
                  <Link
                    href={signUp}
                    className="mt-1 inline-flex h-9 items-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition-[opacity,scale] hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
                  >
                    Try it free
                  </Link>
                </div>
              </Window>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const PLAN = [
  { code: "BIO 110", hue: 150, what: "Lab report draft", when: "Mon 4–6pm" },
  { code: "HIST 201", hue: 35, what: "Read ch. 7–8", when: "Tue 7–8pm" },
  { code: "PSYC 100", hue: 295, what: "Quiz review", when: "Thu 3–4pm" },
];

function AssistantDemo() {
  const [ref, step] = useSequence(3, 700);
  const [answer, setAnswer] = useState<"added" | "skipped" | null>(null);
  return (
    <div ref={ref} className="flex min-h-[380px] items-center justify-center px-6 py-14 md:min-h-[440px]">
      <Window title="Assistant">
        <div className="flex min-h-72 flex-col gap-3 p-4 text-sm">
          {step >= 1 && (
            <motion.p {...fadeUp} className="self-end rounded-2xl rounded-br-md bg-secondary px-3.5 py-2">
              Plan my week
            </motion.p>
          )}
          {step === 2 && (
            <motion.span {...fadeUp} className="flex gap-1 self-start px-1 py-2" aria-label="Thinking">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="size-1.5 animate-pulse rounded-full bg-muted-foreground motion-reduce:animate-none"
                  style={{ animationDelay: `${i * 120}ms` }}
                />
              ))}
            </motion.span>
          )}
          {step >= 3 && (
            <motion.div {...fadeUp} className="flex flex-col gap-3">
              <p className="text-muted-foreground">Here&apos;s a plan around your deadlines. Want it on your calendar?</p>
              <div className="rounded-xl border border-border bg-background/60">
                <ul className="divide-y divide-border">
                  {PLAN.map((p) => (
                    <li key={p.code} className="flex items-center gap-3 px-3 py-2.5">
                      <span className="chip shrink-0 rounded-full px-1.5 font-mono text-xs" style={chip(courseColor(p.hue))}>
                        {p.code}
                      </span>
                      <span className="flex-1 truncate">{p.what}</span>
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">{p.when}</span>
                      {answer === "added" && (
                        <motion.span {...fadeUp}>
                          <Check className="size-3.5 text-done" aria-hidden="true" />
                        </motion.span>
                      )}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center gap-2 border-t border-border p-2.5" aria-live="polite">
                  {answer ? (
                    <>
                      <p className="flex-1 px-1 text-muted-foreground">
                        {answer === "added" ? "Added to your calendar." : "Nothing saved."}
                      </p>
                      <button
                        type="button"
                        onClick={() => setAnswer(null)}
                        className="h-8 rounded-full px-3 text-xs text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      >
                        Undo
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setAnswer("added")}
                        className="h-8 rounded-full bg-primary px-3.5 text-xs font-medium text-primary-foreground transition-[opacity,scale] hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-[0.97]"
                      >
                        Add to calendar
                      </button>
                      <button
                        type="button"
                        onClick={() => setAnswer("skipped")}
                        className="h-8 rounded-full px-3 text-xs text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      >
                        Not now
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </Window>
    </div>
  );
}

// Illustration numbers: 75% of the course graded at 88.4%, the final is the other 25%.
const letter = (g: number) =>
  g >= 93 ? "A" : g >= 90 ? "A-" : g >= 87 ? "B+" : g >= 83 ? "B" : g >= 80 ? "B-" : g >= 77 ? "C+" : g >= 70 ? "C" : "D";

function WhatIfDemo() {
  const [final, setFinal] = useState(80);
  const grade = 0.75 * 88.4 + 0.25 * final;
  return (
    <div className="flex min-h-[320px] items-center justify-center px-6 py-14 md:min-h-[380px]">
      <Window title="CALC II · Grades">
        <div className="space-y-6 p-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Course grade if you get this on the final</p>
              <p className="mt-1 font-mono text-4xl font-medium tabular-nums">{grade.toFixed(1)}%</p>
            </div>
            <motion.span
              key={letter(grade)}
              initial={{ opacity: 0, transform: "scale(0.9)" }}
              animate={{ opacity: 1, transform: "scale(1)" }}
              transition={{ type: "spring", duration: 0.3, bounce: 0.2 }}
              className="chip rounded-full px-2.5 py-0.5 font-mono text-lg"
              style={chip(courseColor(250))}
            >
              {letter(grade)}
            </motion.span>
          </div>
          <label className="block">
            <span className="flex justify-between text-sm">
              Final exam <span className="font-mono text-muted-foreground tabular-nums">{final}%</span>
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={final}
              onChange={(e) => setFinal(+e.target.value)}
              className="mt-3 w-full accent-foreground"
            />
          </label>
          <p className="text-xs text-muted-foreground">Graded so far: 88.4% · worth 75% of the course</p>
        </div>
      </Window>
    </div>
  );
}

const FOCUS = 25 * 60;

function TimerDemo() {
  const [{ left, running, today }, set] = useState({ left: FOCUS, running: false, today: 50 });
  useEffect(() => {
    if (!running) return;
    // Demo speed: a 25-minute session plays in about 4 seconds, then counts toward today.
    const id = setInterval(
      () => set((t) => (t.left > 15 ? { ...t, left: t.left - 15 } : { left: 0, running: false, today: t.today + 25 })),
      40,
    );
    return () => clearInterval(id);
  }, [running]);
  const R = 54;
  const C = 2 * Math.PI * R;
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  return (
    <div className="flex min-h-[320px] items-center justify-center px-6 py-14 md:min-h-[380px]">
      <Window title="Focus">
        <div className="flex flex-wrap items-center justify-center gap-6 p-6">
          <div className="relative size-32 shrink-0">
            <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden="true">
              <circle cx="60" cy="60" r={R} fill="none" strokeWidth="6" className="stroke-secondary" />
              <circle
                cx="60"
                cy="60"
                r={R}
                fill="none"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C * (left / FOCUS)}
                className="stroke-foreground"
              />
            </svg>
            <span className="absolute inset-0 grid place-items-center font-mono text-2xl tabular-nums">
              {mm}:{ss}
            </span>
          </div>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              Studied today: <span className="font-mono text-foreground tabular-nums">{today} min</span>
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => set((t) => ({ ...t, left: t.left || FOCUS, running: !t.running }))}
                className="h-9 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition-[opacity,scale] hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-[0.97]"
              >
                {running ? "Pause" : left === FOCUS || left === 0 ? "Start focus" : "Resume"}
              </button>
              <button
                type="button"
                onClick={() => set((t) => ({ ...t, left: FOCUS, running: false }))}
                className="h-9 rounded-full px-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </Window>
    </div>
  );
}

export function Showcase({ signUp }: { signUp: string }) {
  return (
    <MotionConfig reducedMotion="user">
      <section id="how" className="mx-auto max-w-6xl scroll-mt-24 md:px-4">
        <SectionHead icon={Workflow} badge="How it works" title="Set up in a minute." muted="Then try it right here.">
          Connect Canvas once and Sonnet does the sorting. Everything below is a live demo with sample data: click
          around.
        </SectionHead>

        <div className="border-y border-border md:border-x">
          <FlickerStrip />
          <div className="grid grid-cols-1 border-t border-border md:grid-cols-6">
            <div className="flex flex-col gap-6 p-8 md:sticky md:top-20 md:col-span-2 md:self-start lg:p-12">
              <h3 className="font-heading text-3xl font-semibold tracking-tight text-balance lg:text-4xl">
                From Canvas to a calm week
              </h3>
              <p className="text-pretty text-muted-foreground">
                Your deadlines come in on their own. Then ask for a plan, check what you need on the final, and start a
                focus session.
              </p>
            </div>

            <div className="divide-y divide-border border-t border-border md:col-span-4 md:border-t-0 md:border-l">
              <div>
                <SyncDemo signUp={signUp} />
                <Caption icon={RefreshCw} label="Connect once">
                  Add your Canvas access token or calendar feed. Courses, assignments and grades arrive in a minute.
                </Caption>
              </div>
              <div>
                <AssistantDemo />
                <Caption icon={MessageCircle} label="It suggests. You decide.">
                  Ask the assistant to plan your week. It works from your real courses, and nothing saves without your
                  yes. Try both buttons.
                </Caption>
              </div>
              <div>
                <WhatIfDemo />
                <Caption icon={GraduationCap} label="Grades and what-if">
                  Drag the slider: see what the final does to your course grade before you walk into it.
                </Caption>
              </div>
              <div>
                <TimerDemo />
                <Caption icon={Timer} label="Focus, counted">
                  Pomodoro-style sessions that add up day by day. This one runs fast so you don&apos;t have to wait 25
                  minutes.
                </Caption>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MotionConfig>
  );
}
