"use client";
// Landing hero, animated like Watermelon UI's landing-01: the copy fades up in a stagger, then a fan of real
// Sonnet screens (sample data) blurs in one by one; hovering one lifts it to the front, clicking opens it full size.
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MotionConfig, motion, type Variants } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const EASE = [0.16, 1, 0.3, 1] as const;

const stagger: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } } };
const rise: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE } },
};
const blurIn: Variants = {
  hidden: { opacity: 0, y: 12, filter: "blur(4px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: EASE } },
};

// Back to front: outer pairs first, Home last and largest in the middle.
const SCREENS = [
  { src: "calendar", alt: "The calendar's week view", pos: { top: "-8%", left: "-4%", width: "30%", rotate: "-10deg", zIndex: 2 } },
  { src: "courses", alt: "All courses as colored cards", pos: { top: "-8%", right: "-4%", width: "30%", rotate: "10deg", zIndex: 2 } },
  { src: "settings", alt: "Settings, with the theme picker", pos: { top: "0%", left: "38%", width: "24%", rotate: "0deg", zIndex: 0 } },
  { src: "course", alt: "One course's page with its work and materials", pos: { top: "12%", left: "4%", width: "34%", rotate: "-5deg", zIndex: 3 } },
  { src: "home-light", alt: "Home in light mode", pos: { top: "12%", right: "4%", width: "34%", rotate: "5deg", zIndex: 3 } },
  { src: "caught", alt: "Home when you're all caught up", pos: { top: "26%", left: "13%", width: "40%", rotate: "-2deg", zIndex: 4 } },
  { src: "login", alt: "The sign-in page", pos: { top: "26%", right: "13%", width: "40%", rotate: "2deg", zIndex: 4 } },
  { src: "home", alt: "Home: what's overdue, course cards, Up next and the assistant", pos: { top: "40%", left: "22%", width: "56%", rotate: "0deg", zIndex: 10 } },
];

export function Hero({ signUp }: { signUp: string }) {
  const [open, setOpen] = useState<number | null>(null); // index into SCREENS
  const shown = open === null ? null : SCREENS[open];
  const step = (d: number) => setOpen((i) => (i === null ? i : (i + d + SCREENS.length) % SCREENS.length));
  return (
    <MotionConfig reducedMotion="user">
      <motion.div className="mx-auto max-w-3xl text-center" variants={stagger} initial="hidden" animate="visible">
        <motion.a
          variants={rise}
          href="#features"
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-background/50 px-3 py-1 text-sm backdrop-blur hover:bg-accent"
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
          Sonnet pulls in your Canvas deadlines, lays out your week and tells you how caught up you really are. Plus an
          assistant that actually knows your courses.
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
        // Tall enough that the front screen (top 40%, ~0.36 × width tall) ends inside the box: height > 0.6 × width.
        className="relative mx-auto mt-20 aspect-[5/3] w-full max-w-6xl md:mt-28"
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1, delayChildren: 0.8 } } }}
      >
        {SCREENS.map((s, i) => (
          <motion.button
            key={s.src}
            type="button"
            aria-label={`Open: ${s.alt}`}
            onClick={() => setOpen(i)}
            className="absolute cursor-zoom-in rounded-lg focus-visible:ring-2 focus-visible:ring-ring md:rounded-xl"
            style={{ ...s.pos, transformOrigin: "center" }}
            variants={blurIn}
            whileHover={{ scale: 1.05, zIndex: 50, transition: { duration: 0.4 } }}
          >
            <div className="overflow-hidden rounded-lg border border-white/10 bg-card p-1 shadow-2xl md:rounded-xl md:p-1.5">
              <Image
                src={`/landing/${s.src}.webp`}
                alt={s.alt}
                width={2160}
                height={1350}
                quality={90}
                priority={s.src === "home"}
                sizes={`(min-width: 1152px) ${Math.round(parseFloat(s.pos.width) * 11.52)}px, ${parseFloat(s.pos.width)}vw`}
                className="h-auto w-full rounded-md md:rounded-lg"
              />
            </div>
          </motion.button>
        ))}
      </motion.div>
      <p className="mt-8 text-center font-mono text-xs text-muted-foreground">
        Real Sonnet screens, with sample data. Click one to see it up close.
      </p>

      <Dialog open={open !== null} onOpenChange={(o) => !o && setOpen(null)}>
        {/* `dark`: the portal renders outside the landing page's dark wrapper. */}
        <DialogContent
          className="dark gap-3 bg-card p-3 text-foreground sm:max-w-[min(92vw,90rem)]"
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") step(1);
            if (e.key === "ArrowLeft") step(-1);
          }}
        >
          {shown && (
            <>
              <Image
                src={`/landing/${shown.src}.webp`}
                alt={shown.alt}
                width={2160}
                height={1350}
                quality={90}
                sizes="92vw"
                className="h-auto max-h-[80dvh] w-full rounded-lg object-contain"
              />
              <div className="flex items-center gap-3 px-1">
                <DialogTitle className="flex-1 font-sans text-sm font-normal text-muted-foreground">{shown.alt}</DialogTitle>
                <button type="button" aria-label="Previous screen" onClick={() => step(-1)} className="grid size-9 place-items-center rounded-full bg-secondary hover:bg-accent">
                  <ChevronLeft className="size-4" />
                </button>
                <button type="button" aria-label="Next screen" onClick={() => step(1)} className="grid size-9 place-items-center rounded-full bg-secondary hover:bg-accent">
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </MotionConfig>
  );
}
