"use client";
// Landing hero, animated like Watermelon UI's landing-01: the copy fades up in a stagger, then real Sonnet screens
// (sample data) blur in as a tabbed showcase that rotates every 3s, like Magic UI's CodeForge demo.
import { MotionConfig, motion, type Variants } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { EASE } from "./kit";


const stagger: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } } };
const rise: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE } },
};
const blurIn: Variants = {
  hidden: { opacity: 0, y: 12, filter: "blur(4px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: EASE } },
};

// The five tabs of the rotating showcase; each advances when its progress bar fills (3s, paused on hover).
const TABS = [
  { src: "home", label: "Home", alt: "Home: progress, grades, next exam, Up next, this week and course cards" },
  { src: "assistant", label: "Ask Sonnet", alt: "Sonnet answering from a course syllabus, with a study block to confirm" },
  { src: "calendar", label: "Calendar", alt: "The calendar's week view" },
  { src: "courses", label: "Courses", alt: "All courses as colored cards" },
  { src: "course", label: "Course", alt: "One course's page with its work and materials" },
];

export function Hero({ signUp }: { signUp: string }) {
  const [active, setActive] = useState(0);
  return (
    <MotionConfig reducedMotion="user">
      <motion.div className="mx-auto max-w-3xl text-center" variants={stagger} initial="hidden" whileInView="visible" viewport={{ amount: 0.3 }}>
        <motion.a
          variants={rise}
          href="#features"
          className="mb-6 inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-background/50 px-3 py-1 text-sm sm:min-h-0 backdrop-blur hover:bg-accent"
        >
          <span
            className="chip rounded-full px-1.5 font-mono text-xs"
            style={{ "--chip": "var(--done)" } as React.CSSProperties}
          >
            free
          </span>
          Made for students on Canvas <span aria-hidden="true">→</span>
        </motion.a>
        <motion.h1
          variants={rise}
          className="font-heading text-5xl leading-[1.02] font-semibold tracking-tight text-balance sm:text-7xl"
        >
          All your classes, one calm place.
        </motion.h1>
        <motion.p variants={rise} className="mx-auto mt-6 max-w-xl text-lg text-pretty text-white/80">
          Sonnet is an AI that has read your syllabus, slides and readings, and knows every deadline, grade and class
          time. Plus your Canvas work, calendar and grades in one calm place.
        </motion.p>
        <motion.div variants={rise} className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href={signUp}
            className="inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-[opacity,scale] hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
          >
            Get started free
          </Link>
          <Link
            href="/login"
            className="inline-flex h-11 items-center rounded-full border border-border bg-background/40 px-6 text-sm font-medium backdrop-blur transition-[background-color,scale] hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
          >
            Sign in
          </Link>
        </motion.div>
      </motion.div>

      <motion.div
        className="group mx-auto mt-20 w-full max-w-6xl overflow-hidden rounded-2xl border border-white/10 bg-card/80 shadow-2xl backdrop-blur md:mt-28"
        variants={blurIn}
        initial="hidden"
        whileInView="visible"
        viewport={{ amount: 0.2 }}
        transition={{ delay: 0.8 }}
      >
        <div
          role="tablist"
          aria-label="Sonnet screens"
          className="grid grid-cols-5 border-b border-border"
          onKeyDown={(e) => {
            // Arrow keys move between tabs (roving focus), like native tabs.
            const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
            if (!d) return;
            const next = (active + d + TABS.length) % TABS.length;
            setActive(next);
            document.getElementById(`tab-${TABS[next].src}`)?.focus();
          }}
        >
          {TABS.map((t, i) => (
            <button
              key={t.src}
              type="button"
              role="tab"
              id={`tab-${t.src}`}
              aria-selected={i === active}
              tabIndex={i === active ? 0 : -1}
              aria-controls="hero-screen"
              onClick={() => setActive(i)}
              className="relative h-12 border-border px-1 text-xs font-medium text-muted-foreground transition-colors not-last:border-r hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none aria-selected:text-foreground sm:text-sm"
            >
              {t.label}
              {i === active && (
                <span
                  key={active}
                  aria-hidden="true"
                  onAnimationEnd={() => setActive((active + 1) % TABS.length)}
                  className="absolute inset-x-0 bottom-0 h-0.5 origin-left animate-[tab-progress_3s_linear_forwards] bg-foreground group-hover:[animation-play-state:paused] motion-reduce:animate-none"
                />
              )}
            </button>
          ))}
        </div>
        <div id="hero-screen" role="tabpanel" aria-labelledby={`tab-${TABS[active].src}`} className="relative p-2 md:p-3">
          {TABS.map((t, i) => (
            <Image
              key={t.src}
              src={`/landing/${t.src}.webp`}
              alt={i === active ? t.alt : ""}
              aria-hidden={i !== active}
              width={2160}
              height={1350}
              quality={90}
              priority={i === 0}
              sizes="(min-width: 1152px) 1152px, 100vw"
              className={`h-auto w-full rounded-lg transition-opacity duration-500 ease-out ${i ? "absolute inset-2 w-[calc(100%-1rem)] md:inset-3 md:w-[calc(100%-1.5rem)]" : ""} ${i === active ? "opacity-100" : "opacity-0"}`}
            />
          ))}
        </div>
      </motion.div>
      <p className="mt-8 text-center font-mono text-xs text-muted-foreground">Real Sonnet screens, with sample data.</p>
    </MotionConfig>
  );
}
