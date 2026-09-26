import type { Metadata } from "next";
import { Check, ChevronDown, FileText, Presentation } from "lucide-react";
import Link from "next/link";
import { Assistant } from "./ai";
import { Features } from "./features";
import { Hero } from "./hero";
import { Showcase } from "./showcase";

// The public front page. Signed-out visitors to "/" are rewritten here by the proxy (the URL stays "/"); signed-in
// ones get Home. Always dark: it's the product's own look. Only real, shipped features; no stats or testimonials.
export const metadata: Metadata = {
  title: "Sonnet · Your courses, deadlines and grades in one place",
  description:
    "An AI assistant that has read your syllabus and knows every deadline, plus Canvas sync, a calendar, grades with what-if, a customizable Home and a focus timer. Free.",
  alternates: { canonical: "/" },
};

const SIGN_UP = "/login?mode=signup";

// Simple monochrome marks (not official logos) for what Sonnet connects to.
function CanvasMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
      {Array.from({ length: 8 }, (_, i) => (
        <circle key={i} cx={12 + 8 * Math.cos((i * Math.PI) / 4)} cy={12 + 8 * Math.sin((i * Math.PI) / 4)} r="2" fill="currentColor" />
      ))}
    </svg>
  );
}
function CalendarMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
      <rect x="3" y="4" width="18" height="17" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M3 9h18" stroke="currentColor" strokeWidth="2" />
      <text x="12" y="18.5" textAnchor="middle" fontSize="8" fontWeight="700" fill="currentColor" fontFamily="sans-serif">
        31
      </text>
    </svg>
  );
}
const WORKS_WITH = [
  { name: "Canvas", mark: <CanvasMark /> },
  { name: "Google Calendar", mark: <CalendarMark /> },
  { name: "Syllabus PDFs", mark: <FileText className="size-6" aria-hidden="true" /> },
  { name: "Slides and readings", mark: <Presentation className="size-6" aria-hidden="true" /> },
];

// Real answers about how Sonnet works today.
const FAQ = [
  ["Is it free?", "Yes. Sonnet is free for students."],
  [
    "What does the assistant know?",
    "Every course, assignment, exam, class time and grade in Sonnet, plus the syllabus, slides, readings and notes you upload. It answers from those first, and can search the web when you ask.",
  ],
  [
    "Is the assistant always fast?",
    "It runs on free AI models, so it can be slow or busy at times. When that happens it tells you, and you can try again.",
  ],
  [
    "Does it work with my school's Canvas?",
    "If your school uses Canvas, yes: connect with a Canvas access token, the Canvas calendar feed, or both.",
  ],
  [
    "Can the assistant change my stuff?",
    "Only with your okay. It proposes changes as cards you confirm; nothing saves without a yes.",
  ],
  [
    "Who can see my data?",
    "Only you. Every row is locked to your account, and Settings can wipe your academic data whenever you want.",
  ],
  ["Do I need to install anything?", "No. It runs in your browser, on a laptop or a phone."],
];

const PLAN = [
  "The assistant, with your syllabus, slides and readings",
  "Canvas sync and the Google Calendar feed",
  "Calendar, grades and what-if, countdowns",
  "A customizable Home with 29 widgets",
  "Focus timer, study days and streaks",
];

function Wordmark() {
  return (
    <span className="font-mono text-lg font-medium tracking-tight">
      sonnet<span className="text-muted-foreground">.</span>
    </span>
  );
}

function Primary({ children, href = SIGN_UP }: { children: React.ReactNode; href?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
    </Link>
  );
}

export default function Landing() {
  return (
    <div className="dark bg-background text-foreground">
      <header className="fixed inset-x-0 top-3 z-50 px-4">
        <nav
          aria-label="Main"
          className="mx-auto flex h-14 max-w-4xl items-center gap-6 rounded-2xl border border-border bg-background/70 px-5 backdrop-blur-md"
        >
          <Link href="/" aria-label="Sonnet home">
            <Wordmark />
          </Link>
          <div className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            {/* A CSS dropdown: opens on hover or keyboard focus, no script. */}
            <div className="group relative">
              <button type="button" aria-haspopup="true" className="flex items-center gap-1 hover:text-foreground focus-visible:text-foreground focus-visible:outline-none">
                What&apos;s included <ChevronDown className="size-3.5 transition-transform group-focus-within:rotate-180 group-hover:rotate-180" aria-hidden="true" />
              </button>
              <div className="invisible absolute top-full -left-3 pt-3 opacity-0 transition-[opacity,visibility] duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                <div className="flex w-64 flex-col rounded-xl border border-border bg-background/95 p-1.5 shadow-2xl backdrop-blur-md">
                  <a href="#assistant" className="rounded-lg px-3 py-2 hover:bg-accent focus-visible:bg-accent focus-visible:outline-none">
                    <span className="block text-foreground">Assistant</span>
                    <span className="text-xs">Knows your courses, down to the syllabus</span>
                  </a>
                  <a href="#features" className="rounded-lg px-3 py-2 hover:bg-accent focus-visible:bg-accent focus-visible:outline-none">
                    <span className="block text-foreground">Features</span>
                    <span className="text-xs">Widgets, calendar, grades, timer and more</span>
                  </a>
                </div>
              </div>
            </div>
            <a href="#how" className="hover:text-foreground">
              How it works
            </a>
            <a href="#pricing" className="hover:text-foreground">
              Pricing
            </a>
            <a href="#faq" className="hover:text-foreground">
              FAQ
            </a>
            <a href="#about" className="hover:text-foreground">
              About
            </a>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/login" className="hidden h-9 items-center rounded-full px-4 text-sm hover:bg-accent sm:flex">
              Sign in
            </Link>
            <Link
              href={SIGN_UP}
              className="flex h-9 items-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Get started
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero: the meadow, dimmed, with the real app on top of it. */}
        <section className="relative isolate overflow-hidden px-4 pt-36 pb-16 sm:pt-44">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[url(/login/meadow.webp)] bg-cover bg-center brightness-[0.5]"
          />
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 -z-10 h-1/3 bg-linear-to-b from-transparent to-background" />
          <Hero signUp={SIGN_UP} />
        </section>

        {/* Works with: a bordered logo row, like CodeForge's "trusted by" grid. */}
        <section aria-labelledby="works-with" className="reveal mx-auto mt-8 max-w-6xl md:px-4">
          <div className="grid grid-cols-2 gap-px border-y border-border bg-border md:grid-cols-5 md:border-x">
            <p
              id="works-with"
              className="col-span-2 flex items-center justify-center bg-background p-6 text-center text-sm text-muted-foreground md:col-span-1"
            >
              Works with the tools your school already uses
            </p>
            {WORKS_WITH.map((w) => (
              <div
                key={w.name}
                className="flex items-center justify-center gap-2.5 bg-background px-4 py-8 text-foreground/75 transition-colors hover:text-foreground"
              >
                {w.mark}
                <span className="text-sm font-medium whitespace-nowrap sm:text-base">{w.name}</span>
              </div>
            ))}
          </div>
        </section>

        <Assistant signUp={SIGN_UP} />

        <Showcase signUp={SIGN_UP} />

        <Features signUp={SIGN_UP} />

        <section id="pricing" aria-labelledby="pricing-title" className="reveal mx-auto max-w-3xl scroll-mt-24 px-4 pt-24">
          <h2 id="pricing-title" className="text-center font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
            Pricing
          </h2>
          <div className="mx-auto mt-10 max-w-md rounded-2xl border border-border bg-card p-8">
            <p className="text-sm text-muted-foreground">Student</p>
            <p className="mt-2 font-heading text-5xl font-semibold">
              Free <span className="text-base font-normal text-muted-foreground">no card needed</span>
            </p>
            <ul className="mt-6 space-y-2 text-sm">
              {PLAN.map((f) => (
                <li key={f} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-done" aria-hidden="true" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Primary>Get started free</Primary>
            </div>
          </div>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Paid plans aren&apos;t decided yet. Today, everything on this page is free.
          </p>
        </section>

        <section aria-labelledby="faq" className="mx-auto max-w-3xl scroll-mt-24 px-4 py-24">
          <h2 id="faq" className="scroll-mt-28 text-center font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
            Questions and answers
          </h2>
          <div className="mt-10 divide-y divide-border border-y border-border">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group reveal py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
                  {q}
                  <span aria-hidden="true" className="text-muted-foreground transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-pretty text-muted-foreground">{a}</p>
              </details>
            ))}
          </div>
        </section>

        <section id="about" aria-labelledby="about-title" className="reveal mx-auto max-w-3xl scroll-mt-24 px-4 pb-24">
          <h2 id="about-title" className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">About</h2>
          <div className="mt-6 space-y-4 text-lg text-pretty text-muted-foreground">
            <p>
              Sonnet is built by one college student who got tired of juggling Canvas, a calendar app, a grade
              spreadsheet, a timer and a chatbot that knew nothing about his classes.
            </p>
            <p>
              So it&apos;s one calm place instead: every deadline in one list, a Home you arrange yourself, and an
              assistant that has actually read your syllabus. It&apos;s used for real classes every day, and it keeps
              getting better from what students ask for.
            </p>
          </div>
        </section>

        {/* Closing call to action, back on the meadow. */}
        <section className="relative isolate overflow-hidden px-4 py-32 text-center">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[url(/login/meadow.webp)] bg-cover bg-bottom brightness-[0.45]"
          />
          <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-1/3 bg-linear-to-t from-transparent to-background" />
          <h2 className="font-heading text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            Stop losing deadlines in tabs.
          </h2>
          <p className="mx-auto mt-5 max-w-md text-lg text-white/80">Free for students. Bring your classes.</p>
          <div className="mt-8 flex justify-center">
            <Primary>Get started free</Primary>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-4 py-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-4 text-sm text-muted-foreground">
          <Wordmark />
          <p className="flex-1">A student hub for courses, deadlines, grades and focus.</p>
          <a href="#features" className="hover:text-foreground">
            Features
          </a>
          <Link href="/login" className="hover:text-foreground">
            Sign in
          </Link>
        </div>
      </footer>
    </div>
  );
}
