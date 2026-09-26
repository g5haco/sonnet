"use client";
// "How it works" as a three-step timeline, each step with its own live demo: a Canvas sync that plays itself, files
// being read, then the courses carousel you land on. Demos replay each time they scroll back into view.
import { Check, FileText, Workflow, RefreshCw } from "lucide-react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import Link from "next/link";
import { CoursesDemo } from "./features";
import { fadeUp, SectionHead, useSequence, Window } from "./kit";

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
    <div ref={ref} className="relative flex min-h-[360px] items-center justify-center px-4 py-14 sm:px-6 md:min-h-[400px]">
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
                    className="mt-1 inline-flex h-11 items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-[opacity,scale] hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97] sm:h-9"
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

// Files land in a course and get read, one by one.
const FILES = ["Syllabus · POLS 202.pdf", "Lecture 6 slides.pdf", "Chapter 3 reading.pdf"];

function FilesDemo() {
  const [ref, step] = useSequence(FILES.length * 2, 600);
  return (
    <div ref={ref} className="flex min-h-[300px] items-center justify-center px-4 py-14 sm:px-6 md:min-h-[400px]">
      <Window title="POLS 202 · Materials">
        <ul className="min-h-44 space-y-2 p-4 text-sm">
          {FILES.slice(0, Math.ceil(step / 2)).map((f, i) => (
            <motion.li key={f} {...fadeUp} className="flex items-center gap-3 rounded-lg border border-border bg-background/60 px-3 py-2.5">
              <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">{f}</span>
              {step > i * 2 + 1 ? (
                <span className="flex items-center gap-1 text-xs text-done">
                  <Check className="size-3.5" aria-hidden="true" /> read
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">reading…</span>
              )}
            </motion.li>
          ))}
        </ul>
      </Window>
    </div>
  );
}

const STEPS = [
  {
    title: "Connect Canvas",
    text: "Paste an access token or your Canvas calendar link. Courses, deadlines and grades come in, and keep coming.",
    demo: (signUp: string) => <SyncDemo signUp={signUp} />,
  },
  {
    title: "Add your syllabus",
    text: "Drop in the syllabus, slides and readings. Sonnet reads them and remembers, so you can ask about them later.",
    demo: () => <FilesDemo />,
  },
  {
    title: "Open Home",
    text: "Every course arrives in its own color with its work and exams filled in. Spin through them. Give it a drag.",
    demo: (signUp: string) => <CoursesDemo signUp={signUp} />,
  },
];

export function Showcase({ signUp }: { signUp: string }) {
  return (
    <MotionConfig reducedMotion="user">
      <section id="how" className="mx-auto max-w-6xl scroll-mt-24 md:px-4">
        <SectionHead icon={Workflow} badge="How it works" title="Set up in a minute." muted="Three steps, no marathon.">
          Connect Canvas once and Sonnet does the sorting. Everything below is a live demo with sample data.
        </SectionHead>

        <ol className="border-y border-border md:border-x">
          {STEPS.map((s, i) => (
            <li key={s.title} className="grid grid-cols-1 border-border not-last:border-b md:grid-cols-5">
              <div className="relative p-8 md:col-span-2 lg:p-12">
                <span className="font-mono text-5xl text-muted-foreground/60 tabular-nums">0{i + 1}</span>
                <h3 className="mt-4 font-heading text-2xl font-semibold tracking-tight">{s.title}</h3>
                <p className="mt-2 text-pretty text-muted-foreground">{s.text}</p>
              </div>
              <div className="border-t border-border md:col-span-3 md:border-t-0 md:border-l">{s.demo(signUp)}</div>
            </li>
          ))}
        </ol>
      </section>
    </MotionConfig>
  );
}
