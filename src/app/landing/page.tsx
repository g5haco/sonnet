import type { Metadata } from "next";
import { FileText, Presentation } from "lucide-react";
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
          <div className="hidden gap-6 text-sm text-muted-foreground sm:flex">
            <a href="#assistant" className="hover:text-foreground">
              Assistant
            </a>
            <a href="#features" className="hover:text-foreground">
              Features
            </a>
            <a href="#how" className="hover:text-foreground">
              How it works
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

        <section aria-labelledby="faq" className="mx-auto max-w-3xl px-4 py-24">
          <h2 id="faq" className="text-center font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
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
