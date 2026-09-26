"use client";
// The assistant, front and center: it reads the syllabus (demo plays each time it scrolls in), answers from your own
// material with sources, knows the whole term, plans the week behind a confirm card and makes flashcards.
import {
  BookOpen,
  CalendarDays,
  Check,
  Clock,
  FileText,
  Globe,
  GraduationCap,
  Layers,
  Lightbulb,
  ListChecks,
  MessageCircle,
  Mic,
  PanelRight,
  Paperclip,
  Presentation,
  Sparkles,
  Target,
} from "lucide-react";
import { MotionConfig, motion, useInView, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { courseColor } from "@/lib/course";
import { Caption, chip, FlickerStrip, Orbit, SectionHead } from "./features";
import { fadeUp, useSequence, Window } from "./showcase";

const POLS = courseColor(250);

// Illustration: a made-up POLS 202 syllabus, read and summarized.
const GRADING = [
  ["Final exam", 30],
  ["Two papers", 30],
  ["Midterm", 25],
  ["Participation", 15],
] as const;
const POLICIES = ["Late papers lose 10% a day, up to 3 days", "Two free absences, then −2% each", "Exams need a note to make up"];
const DATES = [
  ["Oct 9", "Paper 1"],
  ["Oct 28", "Midterm"],
  ["Dec 12", "Final exam"],
] as const;

function SyllabusDemo() {
  const [ref, step] = useSequence(5, 800);
  const reading = step < 2;
  return (
    <div ref={ref} className="flex min-h-[460px] items-center justify-center px-4 py-12 sm:px-6 md:min-h-[520px]">
      <Window title="POLS 202 · Materials">
        <div className="space-y-4 p-4 text-sm">
          <div className="relative flex items-center gap-3 overflow-hidden rounded-lg border border-border bg-background/60 p-3">
            <FileText className="size-8 shrink-0 text-muted-foreground" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">POLS202_Syllabus.pdf</p>
              <p className="text-xs text-muted-foreground" aria-live="polite">
                {reading ? "Reading 9 pages…" : "Read. Summary saved, the assistant remembers it."}
              </p>
            </div>
            {reading ? (
              <span className="absolute inset-y-0 left-0 w-1/3 animate-[scan_1.2s_ease-in-out_infinite] bg-linear-to-r from-transparent via-foreground/10 to-transparent motion-reduce:hidden" />
            ) : (
              <Check className="size-4 text-done" aria-hidden="true" />
            )}
          </div>

          {step >= 2 && (
            <motion.div {...fadeUp}>
              <p className="mb-2 text-xs text-muted-foreground">Grading</p>
              <ul className="space-y-1.5">
                {GRADING.map(([what, pct], i) => (
                  <li key={what} className="flex items-center gap-3">
                    <span className="w-24 shrink-0 text-xs">{what}</span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                      <motion.span
                        className="block h-full origin-left rounded-full"
                        style={{ background: POLS, width: `${(pct / 30) * 100}%` }}
                        initial={{ transform: "scaleX(0)" }}
                        animate={{ transform: "scaleX(1)" }}
                        transition={{ duration: 0.6, delay: i * 0.08, ease: [0.23, 1, 0.32, 1] }}
                      />
                    </span>
                    <span className="w-8 text-right font-mono text-xs">{pct}%</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
          {step >= 3 && (
            <motion.div {...fadeUp}>
              <p className="mb-1.5 text-xs text-muted-foreground">Policies</p>
              <ul className="list-disc space-y-0.5 pl-4 text-xs">
                {POLICIES.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </motion.div>
          )}
          {step >= 4 && (
            <motion.div {...fadeUp}>
              <p className="mb-1.5 text-xs text-muted-foreground">Key dates</p>
              <div className="flex flex-wrap gap-1.5">
                {DATES.map(([d, what]) => (
                  <span key={what} className="chip rounded-full px-2 py-0.5 font-mono text-xs" style={chip(POLS)}>
                    {d} · {what}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
          {step >= 5 && (
            <motion.p {...fadeUp} className="flex items-center gap-1.5 text-xs text-done">
              <CalendarDays className="size-3.5" aria-hidden="true" /> 3 key dates ready to add to your calendar
            </motion.p>
          )}
        </div>
      </Window>
    </div>
  );
}

// Ask it anything: pick a question and the answer streams in, with where it came from.
const QA = [
  {
    q: "How much is the final worth?",
    read: "Reading the POLS 202 syllabus",
    a: "30% of your grade, on Dec 12. You're at 93.4%, so a 92 on the final keeps your A.",
    src: ["POLS 202 syllabus", "Canvas grades"],
  },
  {
    q: "What's the late policy?",
    read: "Reading the POLS 202 syllabus",
    a: "Papers lose 10% a day, for up to 3 days; after that they're a zero. Paper 1 is due Oct 9, so that's the one to protect.",
    src: ["POLS 202 syllabus", "Your deadlines"],
  },
  {
    q: "Explain federalism from Tuesday's lecture",
    read: "Reading Lecture 6 slides and chapter 3",
    a: "Power split between the national government and the states. The slides frame it as layer cake (separate jobs) versus marble cake (shared jobs), and chapter 3 adds that the 10th Amendment leaves the rest to the states.",
    src: ["Lecture 6 slides", "Chapter 3 reading"],
  },
  {
    q: "What's due before Friday?",
    read: "Checking your deadlines",
    a: "Two things: BUS 101 Problem set 4 on Wednesday and the PSYC 100 quiz on Thursday. Nothing is late.",
    src: ["Canvas", "Your calendar"],
  },
];

function AskDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const reduce = useReducedMotion();
  const [q, setQ] = useState(0);
  const [n, setN] = useState(0); // characters of the answer shown
  const full = QA[q].a.length;
  useEffect(() => {
    const next = inView ? Math.min(n + 3, full) : 0;
    if (reduce || next === n) return;
    const id = setTimeout(() => setN(next), inView ? (n === 0 ? 700 : 18) : 0);
    return () => clearTimeout(id);
  }, [inView, reduce, n, full]);
  const shown = reduce ? full : n;
  return (
    <div ref={ref} className="flex min-h-[440px] flex-col items-center justify-center gap-4 px-4 py-12 sm:px-6 md:min-h-[500px]">
      <Window title="Assistant · POLS 202">
        <div className="flex min-h-64 flex-col gap-3 p-4 text-sm">
          <p className="self-end rounded-2xl rounded-br-md bg-secondary px-3.5 py-2">{QA[q].q}</p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="size-3.5" aria-hidden="true" />
            {QA[q].read}
            {shown < full && "…"}
          </p>
          <p aria-live="polite">
            {QA[q].a.slice(0, shown)}
            {shown > 0 && shown < full && <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-foreground align-middle" />}
          </p>
          {shown >= full && (
            <motion.div {...fadeUp} className="flex flex-wrap gap-1.5">
              {QA[q].src.map((s) => (
                <span key={s} className="flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                  <FileText className="size-3" aria-hidden="true" />
                  {s}
                </span>
              ))}
            </motion.div>
          )}
        </div>
      </Window>
      <div className="flex max-w-md flex-wrap justify-center gap-1.5">
        {QA.map((x, i) => (
          <button
            key={x.q}
            type="button"
            aria-pressed={i === q}
            onClick={() => (setQ(i), setN(0))}
            className="h-8 rounded-full border border-border px-3 text-xs text-muted-foreground transition-[background-color,color,scale] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-[0.97] aria-pressed:bg-secondary aria-pressed:text-foreground"
          >
            {x.q}
          </button>
        ))}
      </div>
    </div>
  );
}

// Everything it reads before it answers.
const KNOWS = [
  { icon: FileText, angle: 200, r: 150, label: "Syllabus" },
  { icon: Presentation, angle: 250, r: 125, label: "Slides" },
  { icon: BookOpen, angle: 305, r: 150, label: "Readings" },
  { icon: ListChecks, angle: 0, r: 130, label: "Assignments" },
  { icon: GraduationCap, angle: 55, r: 140, label: "Grades" },
  { icon: CalendarDays, angle: 110, r: 120, label: "Exams" },
  { icon: Clock, angle: 150, r: 150, label: "Class times" },
];

// Flashcards the assistant made from your slides; tap to flip.
const DECK = [
  ["Federalism", "Power shared between the national government and the states."],
  ["10th Amendment", "Powers not given to the federal government are reserved to the states or the people."],
  ["Supremacy Clause", "Federal law wins when it conflicts with state law (Article VI)."],
  ["Marble-cake federalism", "Levels of government share jobs instead of keeping separate layers."],
];

function FlashcardsDemo() {
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const go = (d: number) => (setFlipped(false), setI((i + d + DECK.length) % DECK.length));
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 px-4 py-12 sm:px-6 md:min-h-[420px]">
      <p className="text-xs text-muted-foreground">POLS 202 · Federalism · from Lecture 6 slides</p>
      <button
        type="button"
        onClick={() => setFlipped(!flipped)}
        aria-label={flipped ? "Show the term" : "Show the answer"}
        className="h-44 w-full max-w-sm [perspective:1000px] focus-visible:outline-none"
      >
        <motion.div
          className="relative size-full [transform-style:preserve-3d]"
          animate={{ transform: `rotateY(${flipped ? 180 : 0}deg)` }}
          transition={{ type: "spring", duration: 0.6, bounce: 0.15 }}
        >
          <span className="absolute inset-0 flex items-center justify-center rounded-2xl border border-border bg-card p-6 font-heading text-2xl font-semibold [backface-visibility:hidden]">
            {DECK[i][0]}
          </span>
          <span className="absolute inset-0 flex items-center justify-center rounded-2xl border border-border bg-secondary p-6 text-pretty [backface-visibility:hidden] [transform:rotateY(180deg)]">
            {DECK[i][1]}
          </span>
        </motion.div>
      </button>
      <div className="flex items-center gap-3 text-sm">
        <button type="button" onClick={() => go(-1)} className="h-8 rounded-full px-3 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
          Back
        </button>
        <span className="font-mono text-xs text-muted-foreground tabular-nums">
          {i + 1} / {DECK.length}
        </span>
        <button type="button" onClick={() => go(1)} className="h-8 rounded-full bg-primary px-4 text-primary-foreground transition-[opacity,scale] hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-[0.97]">
          Next
        </button>
      </div>
    </div>
  );
}

const TOOLS = [
  { icon: Paperclip, title: "Attach photos and PDFs", text: "Snap a worksheet or drop a file and ask about it." },
  { icon: Globe, title: "Search the web", text: "When the answer isn't in your courses, it looks it up and shows sources." },
  { icon: Lightbulb, title: "Think harder", text: "Flip it on for slower, more careful answers on tough problems." },
  { icon: Mic, title: "Talk instead of type", text: "Dictate your question in Chrome, Edge or Safari." },
  { icon: Target, title: "Focus on one course", text: "Point it at a course or an assignment and every answer stays on it." },
  { icon: PanelRight, title: "Always one click away", text: "A side panel next to your work, a full page, or a sheet on your phone." },
];

export function Assistant({ signUp }: { signUp: string }) {
  return (
    <MotionConfig reducedMotion="user">
      <section id="assistant" className="mx-auto max-w-6xl scroll-mt-24 md:px-4">
        <SectionHead icon={Sparkles} badge="The assistant" title="It has read your syllabus." muted="And everything else.">
          Sonnet&apos;s assistant knows every course, assignment, exam, class time and grade, plus the syllabus, slides
          and readings you add. Ask it anything about your classes and get answers from your own material.
        </SectionHead>

        <div className="border-y border-border md:border-x">
          <FlickerStrip />
          <div className="grid grid-cols-1 border-t border-border md:grid-cols-6">
            <div className="flex flex-col gap-6 p-8 md:sticky md:top-20 md:col-span-2 md:self-start lg:p-12">
              <h3 className="font-heading text-3xl font-semibold tracking-tight text-balance lg:text-4xl">
                Other chatbots start from zero. This one starts from your term.
              </h3>
              <p className="text-pretty text-muted-foreground">
                No pasting in the syllabus, no explaining which class is which. It already knows, and it never changes
                anything without your yes.
              </p>
              <Link
                href={signUp}
                className="inline-flex h-10 w-fit items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-[opacity,scale] hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
              >
                Try the assistant free
              </Link>
            </div>

            <div className="divide-y divide-border border-t border-border md:col-span-4 md:border-t-0 md:border-l">
              <div>
                <SyllabusDemo />
                <Caption icon={FileText} label="It reads the syllabus">
                  Upload it once. Sonnet writes a one-page summary (grading, policies, key dates) and remembers it, so
                  you never dig through the PDF again.
                </Caption>
              </div>
              <div>
                <AskDemo />
                <Caption icon={MessageCircle} label="Ask anything about your classes">
                  Answers come from your syllabus, slides, readings and deadlines, and say where they came from. Tap a
                  question to try it.
                </Caption>
              </div>
              <div>
                <Orbit
                  nodes={KNOWS}
                  center={
                    <div className="relative z-20 flex size-14 items-center justify-center rounded-full border border-border bg-card">
                      <Sparkles className="size-5" aria-hidden="true" />
                    </div>
                  }
                />
                <Caption icon={Sparkles} label="It knows your whole term">
                  Every course, assignment, exam, class time and grade, plus every file you add. That&apos;s why it can
                  answer &quot;what should I do next&quot; instead of guessing.
                </Caption>
              </div>
              <div>
                <AssistantDemo />
                <Caption icon={CalendarDays} label="It plans. You decide.">
                  Ask it to plan your week, move a deadline or add a class. Every change waits on a card for your yes.
                  Try both buttons.
                </Caption>
              </div>
              <div>
                <FlashcardsDemo />
                <Caption icon={Layers} label="Study guides and flashcards">
                  &quot;Help me study&quot; turns your own slides and readings into a study guide or a deck of flip
                  cards. Tap the card.
                </Caption>
              </div>
              <ul className="grid sm:grid-cols-2 lg:grid-cols-3">
                {TOOLS.map((f) => (
                  <li key={f.title} className="border-b border-border p-6 sm:border-r">
                    <f.icon className="size-5 text-muted-foreground" aria-hidden="true" />
                    <h3 className="mt-4 font-medium">{f.title}</h3>
                    <p className="mt-1.5 text-sm text-pretty text-muted-foreground">{f.text}</p>
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

