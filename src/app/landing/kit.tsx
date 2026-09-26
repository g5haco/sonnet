"use client";
// Shared pieces of the landing page: motion presets, section headings, captions, demo windows and the hooks that
// drive the demos. Every section imports from here, and this file imports none of them (no import cycles).
import { MotionConfig, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

export const EASE = [0.16, 1, 0.3, 1] as const;
// Replays every time it scrolls back into view.
export const VIEW = { amount: 0.3 } as const;

export const chip = (color: string) => ({ "--chip": color }) as React.CSSProperties;

// A toggle pill in the demos: 44px tall on phones (touch), compact from sm up.
export const CHIP =
  "h-11 rounded-full border border-border px-3 text-xs text-muted-foreground transition-[background-color,color,scale] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-[0.97] aria-pressed:bg-secondary aria-pressed:text-foreground sm:h-8";

export const fadeUp = {
  initial: { opacity: 0, transform: "translateY(6px)" },
  animate: { opacity: 1, transform: "translateY(0px)" },
  transition: { duration: 0.35, ease: EASE },
};

// The hero's fade-up, for section headings: plays each time the heading scrolls into view, either direction.
export const RISE = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE } },
};

export function Rise({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <MotionConfig reducedMotion="user">
      <motion.div className={className} variants={RISE} initial="hidden" whileInView="visible" viewport={{ amount: 0.5 }}>
        {children}
      </motion.div>
    </MotionConfig>
  );
}

type Icon = React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" }>;

export function SectionHead({
  icon: Icon,
  badge,
  title,
  muted,
  children,
}: {
  icon: Icon;
  badge: string;
  title: string;
  muted: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className="flex flex-col items-center px-4 py-24 text-center"
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }}
      initial="hidden"
      whileInView="visible"
      viewport={{ amount: 0.5 }}
    >
      <motion.span variants={RISE} className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium">
        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
        {badge}
      </motion.span>
      <motion.h2 variants={RISE} className="mt-4 max-w-3xl font-heading text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-6xl">
        {title} <span className="text-muted-foreground">{muted}</span>
      </motion.h2>
      <motion.p variants={RISE} className="mt-5 max-w-xl text-lg text-pretty text-muted-foreground">
        {children}
      </motion.p>
    </motion.div>
  );
}

export function Caption({ icon: Icon, label, children }: { icon: Icon; label: string; children: React.ReactNode }) {
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

export function Window({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
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

// Counts 0 → total, one step every `ms`, while the returned ref is in view; resets when it leaves, so it replays.
// With reduced motion it jumps straight to the end.
export function useSequence(total: number, ms: number) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  useEffect(() => {
    const next = inView ? Math.min(step + 1, total) : 0;
    if (reduce || next === step) return;
    const id = setTimeout(() => setStep(next), inView ? ms : 0);
    return () => clearTimeout(id);
  }, [inView, reduce, step, total, ms]);
  return [ref, reduce ? total : step] as const;
}

// Calls `tick` every `ms` while the ref is in view, until the visitor touches the demo (call `stop`).
// Never runs with reduced motion.
export function useAutoCycle(tick: () => void, ms: number) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const reduce = useReducedMotion();
  const [stopped, setStopped] = useState(false);
  const step = useRef(tick);
  useEffect(() => {
    step.current = tick;
  });
  useEffect(() => {
    if (!inView || stopped || reduce) return;
    const id = setInterval(() => step.current(), ms);
    return () => clearInterval(id);
  }, [inView, stopped, reduce, ms]);
  return [ref, () => setStopped(true)] as const;
}

// A grid of squares that flicker softly; paused offscreen and still with reduced motion.
export function FlickerStrip() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const CELL = 6, SQ = 3;
    let cols = 0, cells = new Float32Array(0), raf = 0, visible = false;
    const color = getComputedStyle(canvas).color;
    const size = () => {
      const dpr = devicePixelRatio || 1;
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(canvas.clientWidth / CELL);
      cells = Float32Array.from({ length: cols * Math.ceil(canvas.clientHeight / CELL) }, () => Math.random() * 0.3);
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
    const ro = new ResizeObserver(() => (size(), draw()));
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting && !still;
      cancelAnimationFrame(raf);
      if (visible) raf = requestAnimationFrame(tick);
    });
    io.observe(canvas);
    return () => (ro.disconnect(), io.disconnect(), cancelAnimationFrame(raf));
  }, []);
  return <canvas ref={ref} aria-hidden="true" className="block h-14 w-full text-muted-foreground" />;
}

// Lines draw out from the center, then each node springs out to its spot (angle in degrees, radius in px).
// The whole field keeps turning slowly; icons and labels turn back so they stay upright.
const LINES = 22;
export function Orbit({ center, nodes }: { center: React.ReactNode; nodes: { icon: Icon; angle: number; r: number; label: string }[] }) {
  return (
    <motion.div
      aria-hidden="true"
      initial="hidden"
      whileInView="visible"
      viewport={VIEW}
      className="relative flex min-h-[320px] items-center justify-center overflow-hidden mask-[radial-gradient(ellipse_at_center,black_40%,transparent_85%)] md:min-h-[400px]"
    >
      <div className="absolute inset-0 animate-[spin_80s_linear_infinite] motion-reduce:animate-none">
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
        {nodes.map(({ icon: Icon, angle, r, label }, i) => {
          const a = (angle * Math.PI) / 180;
          return (
            <motion.div
              key={label}
              className="absolute top-1/2 left-1/2 z-30 -mt-5 -ml-5 flex size-10 items-center justify-center rounded-full border border-border bg-background"
              variants={{
                hidden: { x: 0, y: 0, scale: 0.5, opacity: 0 },
                visible: {
                  x: Math.cos(a) * r,
                  y: Math.sin(a) * r,
                  scale: 1,
                  opacity: 1,
                  transition: { type: "spring", stiffness: 160, damping: 14, delay: 0.05 + i * 0.07 },
                },
              }}
            >
              <span className="relative flex animate-[spin_80s_linear_infinite_reverse] items-center justify-center motion-reduce:animate-none">
                <Icon className="size-4 text-muted-foreground" />
                <span className="absolute top-full mt-3 text-[10px] whitespace-nowrap text-muted-foreground sm:text-xs">{label}</span>
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
