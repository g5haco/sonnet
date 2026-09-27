"use client";

// Sonnet Pro's playful Home widgets: Roll for it, Study plant and Week glass. (Study tools: study-widgets.tsx.)
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Block } from "@/components/block";
import { when } from "@/components/up-next";
import { courseColor } from "@/lib/course";
import type { FocusSession } from "@/lib/focus";
import { endOfWeek, type Item } from "@/lib/progress";
import { cn } from "@/lib/utils";

const EASE = [0.23, 1, 0.32, 1] as const;
const r2 = (n: number) => +n.toFixed(2); // server and browser trig differ in the last digit (hydration)

// A wave that rolls sideways forever (paused for reduced motion). Two copies side by side loop seamlessly.
function Wave({ className, speed = 5, still }: { className?: string; speed?: number; still: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 200 20"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={cn("absolute -top-3 left-0 h-4 w-[200%]", className)}
      animate={still ? undefined : { x: ["0%", "-50%"] }}
      transition={{ duration: speed, ease: "linear", repeat: Infinity }}
    >
      <path d="M0 10 Q 25 0 50 10 T 100 10 T 150 10 T 200 10 V 20 H 0 Z" fill="currentColor" />
    </motion.svg>
  );
}

// Week glass: fills as you finish this week's work. Full = bubbles.
export function GlassWidget({ items, now }: { items: Item[]; now: number }) {
  const still = !!useReducedMotion();
  const end = endOfWeek(now);
  const week = items.filter((i) => Date.parse(i.due) > end - 7 * 864e5 && Date.parse(i.due) <= end);
  const done = week.filter((i) => i.doneAt).length;
  const share = week.length ? done / week.length : 1;
  return (
    <Block title="Week glass" aside={week.length ? `${done}/${week.length} done` : "nothing due"}>
      <div className="flex min-h-0 flex-1 items-center justify-center gap-5">
        <div
          role="img"
          aria-label={`${Math.round(share * 100)}% of this week's work done`}
          className="relative h-full max-h-40 min-h-20 w-20 overflow-hidden rounded-b-3xl rounded-t-md border-2 border-foreground/25"
        >
          <motion.div
            className="absolute inset-x-0 bottom-0 bg-brand text-brand"
            initial={{ height: "0%" }}
            animate={{ height: `${share * 100}%` }}
            transition={{ type: "spring", bounce: 0.2, duration: 1.4 }}
          >
            {share > 0 && share < 1 && <Wave still={still} />}
            {share >= 1 &&
              !still &&
              [0, 1, 2, 3].map((k) => (
                <motion.span
                  key={k}
                  className="absolute bottom-0 size-1.5 rounded-full bg-background/60"
                  style={{ left: `${20 + k * 18}%` }}
                  animate={{ transform: ["translateY(0px)", "translateY(-120px)"], opacity: [0, 1, 0] }}
                  transition={{ duration: 2.2, repeat: Infinity, delay: k * 0.5, ease: "easeOut" }}
                />
              ))}
          </motion.div>
        </div>
        <p className="max-w-32 text-sm text-balance text-muted-foreground">
          <span className="block font-heading text-3xl text-foreground tabular-nums">{Math.round(share * 100)}%</span>
          {share >= 1 ? "Full. Week cleared." : "Finish work to fill it up."}
        </p>
      </div>
    </Block>
  );
}

// Roll for it: can't pick what to work on? Roll the die. Task cards shuffle past like a deck and land on one,
// weighted toward what's due soonest. The card fills the widget; the die sits on its corner.
const PIPS: Record<number, number[]> = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };

function Die({ face, rolling }: { face: number; rolling: boolean }) {
  return (
    <motion.span
      aria-hidden="true"
      className="grid size-12 grid-cols-3 grid-rows-3 place-items-center rounded-xl bg-foreground p-2 shadow-lg"
      animate={rolling ? { rotate: [0, 90, 180, 270, 360], y: [0, -10, 0, -6, 0] } : { rotate: 0, y: 0 }}
      transition={rolling ? { duration: 0.45, repeat: Infinity, ease: "linear" } : { type: "spring", bounce: 0.5, duration: 0.5 }}
    >
      {Array.from({ length: 9 }, (_, k) => (
        <span key={k} className={cn("size-2 rounded-full", PIPS[face].includes(k) ? "bg-background" : "bg-transparent")} />
      ))}
    </motion.span>
  );
}

export function RollWidget({ items, now, preset }: { items: Item[]; now: number; preset?: boolean }) {
  const open = items
    .filter((i) => !i.doneAt && Date.parse(i.due) > now)
    .sort((a, b) => Date.parse(a.due) - Date.parse(b.due))
    .slice(0, 8);
  // preset: the widget library shows a landed roll
  const [shown, setShown] = useState<Item | null>(preset ? (open[1] ?? open[0] ?? null) : null);
  const [face, setFace] = useState(preset ? 5 : 6);
  const [rolling, setRolling] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const still = !!useReducedMotion();

  const roll = () => {
    if (!open.length || rolling) return;
    // weights 8, 7, 6…: sooner is likelier
    const bag = open.flatMap((i, k) => Array<Item>(open.length - k).fill(i));
    const pick = bag[Math.floor(Math.random() * bag.length)];
    const land = 1 + Math.floor(Math.random() * 6);
    if (still) {
      setFace(land);
      return setShown(pick);
    }
    setRolling(true);
    let n = 0;
    const tick = () => {
      n++;
      setFace(1 + Math.floor(Math.random() * 6));
      if (n >= 10) {
        setFace(land);
        setShown(pick);
        setRolling(false);
        return;
      }
      setShown(open[n % open.length]);
      timer.current = setTimeout(tick, 60 + n * n * 4); // slows down like a real roll
    };
    tick();
  };

  const tint = shown && `color-mix(in oklch, ${courseColor(shown.hue)} ${rolling ? 10 : 20}%, var(--secondary))`;
  const due = shown && when(shown.due, now);

  return (
    <Block title="Roll for it" aside={shown && !rolling ? "do this one" : "can't decide?"} className="overflow-hidden">
      {!open.length ? (
        <p data-empty className="m-auto text-center text-sm text-muted-foreground">Nothing open to roll for. Nice.</p>
      ) : (
        <button
          type="button"
          onClick={roll}
          aria-label={shown && !rolling ? `Rolled: ${shown.course}, ${shown.title}. Roll again` : "Roll for what to work on"}
          className="group relative flex min-h-24 flex-1 outline-none [perspective:800px] focus-visible:[&>div]:ring-2 focus-visible:[&>div]:ring-ring"
        >
          {/* the deck behind the card */}
          <span aria-hidden="true" className="absolute inset-x-3 -bottom-1.5 top-2 rounded-2xl bg-secondary/50" />
          <span aria-hidden="true" className="absolute inset-x-1.5 -bottom-0.5 top-1 rounded-2xl bg-secondary/70" />
          <div className="relative flex flex-1 overflow-hidden rounded-2xl bg-secondary" aria-live="polite">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={`${shown?.id ?? "none"}-${face}`}
                initial={{ opacity: 0, y: "35%", rotateX: -35 }}
                animate={{ opacity: 1, y: "0%", rotateX: 0 }}
                exit={{ opacity: 0, y: "-35%", rotateX: 35 }}
                transition={rolling ? { duration: 0.12, ease: EASE } : { type: "spring", bounce: 0.35, duration: 0.5 }}
                className="flex flex-1 flex-col justify-between p-4 pr-18 text-left"
                style={tint ? { background: tint } : undefined}
              >
                {shown ? (
                  <>
                    <span className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                      <span className="size-2 rounded-full" style={{ background: courseColor(shown.hue) }} />
                      {shown.course} · {shown.kind}
                    </span>
                    <span className="line-clamp-3 font-heading text-2xl leading-tight text-balance">{shown.title}</span>
                    <span className={cn("font-mono text-xs", due?.soon ? "text-warning" : "text-muted-foreground")}>
                      due {due?.label}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-mono text-xs text-muted-foreground">{open.length} open to pick from</span>
                    <span className="font-heading text-2xl leading-tight">Can&apos;t decide what&apos;s next?</span>
                    <span className="text-sm text-muted-foreground">Roll the die. It picks, you start.</span>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
            <span className="absolute right-4 bottom-4 transition-transform duration-200 group-hover:-rotate-6">
              <Die face={face} rolling={rolling} />
            </span>
          </div>
        </button>
      )}
    </Block>
  );
}

// Study plant: grows with this week's focus minutes. A sprout at 0, a leaf per half hour, a flower at 5 hours.
export function PlantWidget({ sessions, now }: { sessions: FocusSession[]; now: number }) {
  const still = !!useReducedMotion();
  const end = endOfWeek(now);
  const minutes = sessions
    .filter((s) => Date.parse(s.started_at) > end - 7 * 864e5 && Date.parse(s.started_at) <= end)
    .reduce((n, s) => n + s.minutes, 0);
  const leaves = Math.min(8, Math.floor(minutes / 30));
  const bloom = minutes >= 300;
  const height = 30 + leaves * 6; // stem length; room above for the flower
  return (
    <Block title="Study plant" aside={`${Math.floor(minutes / 60)}h ${minutes % 60}m this week`}>
      <div className="flex min-h-0 flex-1 items-end justify-center">
        <motion.svg
          viewBox="0 0 100 120"
          className="h-full max-h-44 min-h-20"
          role="img"
          aria-label={`A plant with ${leaves} leaves${bloom ? " and a flower" : ""}`}
          style={{ transformOrigin: "50% 100%" }}
          animate={still ? undefined : { rotate: [-1.5, 1.5, -1.5] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* pot */}
          <path d="M30 100 H70 L66 118 H34 Z" className="fill-muted-foreground/40" />
          <rect x="27" y="96" width="46" height="6" rx="2" className="fill-muted-foreground/60" />
          {/* stem */}
          <motion.path
            d={`M50 97 C 48 ${97 - height / 2}, 52 ${97 - height / 2}, 50 ${97 - height}`}
            fill="none"
            strokeWidth="3"
            strokeLinecap="round"
            className="stroke-done"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: EASE }}
          />
          {Array.from({ length: leaves }, (_, k) => {
            const y = r2(92 - (k + 1) * (height / (leaves + 1)));
            const left = k % 2 === 0;
            return (
              <motion.path
                key={k}
                d={left ? `M50 ${y} q -14 -10 -20 2 q 10 6 20 -2 Z` : `M50 ${y} q 14 -10 20 2 q -10 6 -20 -2 Z`}
                className="fill-done"
                style={{ transformOrigin: `50px ${y}px` }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.45, duration: 0.6, delay: 0.5 + k * 0.12 }}
              />
            );
          })}
          {bloom && (
            <motion.g
              style={{ transformOrigin: `50px ${97 - height}px` }}
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", bounce: 0.4, duration: 0.9, delay: 0.5 + leaves * 0.12 }}
            >
              {[0, 72, 144, 216, 288].map((a) => (
                <ellipse
                  key={a}
                  cx="50"
                  cy={97 - height - 6}
                  rx="4"
                  ry="7"
                  className="fill-brand"
                  transform={`rotate(${a} 50 ${97 - height})`}
                />
              ))}
              <circle cx="50" cy={97 - height} r="3.5" className="fill-warning" />
            </motion.g>
          )}
        </motion.svg>
      </div>
      <p className="mt-2 text-center font-mono text-[11px] text-muted-foreground">
        {bloom ? "In bloom. Great week." : leaves < 8 ? `${30 - (minutes % 30)} min to the next leaf` : `${300 - minutes} min to bloom`}
      </p>
    </Block>
  );
}
