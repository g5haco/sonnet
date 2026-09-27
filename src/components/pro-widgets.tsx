"use client";

// Sonnet Pro's newer Home widgets: two study tools, one live readout, three playful ones.
import { Dices, RotateCcw } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAssistant } from "@/components/app-shell";
import { Block } from "@/components/block";
import { Fit } from "@/components/fit";
import { FlipCard, type Card } from "@/components/flashcards";
import { sessions as classSessions, startOfDay, type ClassMeeting, type Term } from "@/lib/calendar";
import { courseColor } from "@/lib/course";
import type { FocusSession } from "@/lib/focus";
import { endOfWeek, type Item } from "@/lib/progress";
import { cn } from "@/lib/utils";

const EASE = [0.23, 1, 0.32, 1] as const;
const r2 = (n: number) => +n.toFixed(2); // server and browser trig differ in the last digit (hydration)

export type DeckGlance = { id?: string; title: string; cards: Card[] };

// Flashcard: one card from your decks. Tap to flip, arrow for another. Keeps you warm between study sessions.
export function CardWidget({ decks }: { decks: DeckGlance[] }) {
  const pool = decks.flatMap((d) => d.cards.map((c) => ({ ...c, deck: d.title, id: d.id })));
  const [at, setAt] = useState(0);
  const [flipped, setFlipped] = useState(false);
  if (!pool.length)
    return (
      <Block title="Flashcard">
        <p data-empty className="m-auto text-center text-sm text-balance text-muted-foreground">
          Ask Sonnet for flashcards and a card from your decks shows up here.
        </p>
      </Block>
    );
  const card = pool[at % pool.length];
  return (
    <Block
      title="Flashcard"
      aside={
        card.id ? (
          <Link href={`/flashcards/${card.id}`} className="hover:text-foreground">
            {card.deck} →
          </Link>
        ) : (
          card.deck
        )
      }
      className="overflow-hidden"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <FlipCard
          key={at}
          card={card}
          flipped={flipped}
          onFlip={() => setFlipped((f) => !f)}
          className="h-full min-h-24 [&>span]:bg-secondary [&>span]:p-3 [&>span]:text-sm"
        />
        <button
          type="button"
          onClick={() => {
            setFlipped(false);
            // a different card each time, never the same one twice in a row
            setAt((i) => (pool.length < 2 ? i : i + 1 + Math.floor(Math.random() * (pool.length - 1))));
          }}
          className="self-end font-mono text-xs text-muted-foreground hover:text-foreground"
        >
          another card →
        </button>
      </div>
    </Block>
  );
}

// Class now: a ring that fills through the class you're in, or counts down to the next one today.
export function NowClassWidget({ term, now: start, meetings: given }: { term: Term | null; now: number; meetings?: ClassMeeting[] }) {
  const schedule = useAssistant().schedule.meetings;
  const [now, setNow] = useState(start);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  const today = classSessions(given ?? schedule, [startOfDay(new Date(now))], term).sort((a, b) => +a.start - +b.start);
  const current = today.find((s) => +s.start <= now && +s.end > now);
  const next = today.find((s) => +s.start > now);
  const s = current ?? next;
  if (!s)
    return (
      <Block title="Class now">
        <p data-empty={!(given ?? schedule).length || undefined} className="m-auto text-center text-sm text-muted-foreground">
          {today.length ? "Classes are done for today." : "No classes today."}
        </p>
      </Block>
    );
  const share = current ? (now - +s.start) / (+s.end - +s.start) : 0;
  const mins = Math.max(1, Math.round(((current ? +s.end : +s.start) - now) / 60_000));
  const C = 2 * Math.PI * 42;
  return (
    <Block title="Class now" aside={current ? "in class" : "up next"}>
      <Fit>
        <div className="relative size-36">
          <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden="true">
            <circle cx="50" cy="50" r="42" fill="none" strokeWidth="8" className="stroke-secondary" />
            <motion.circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              stroke={courseColor(s.meeting.hue)}
              strokeDasharray={r2(C)}
              initial={{ strokeDashoffset: r2(C) }}
              animate={{ strokeDashoffset: r2(C * (1 - (current ? share : 1))) }}
              transition={{ duration: 1.2, ease: EASE }}
              style={{ opacity: current ? 1 : 0.35 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-mono text-sm font-medium">{s.meeting.course}</span>
            <span className="font-heading text-3xl leading-none tabular-nums">{mins < 60 ? mins : Math.round(mins / 60)}</span>
            <span className="font-mono text-[11px] text-muted-foreground">
              {mins < 60 ? "min" : "h"} {current ? "left" : "to go"}
            </span>
          </div>
        </div>
      </Fit>
    </Block>
  );
}

// A wave that rolls sideways forever (paused for reduced motion). Two copies side by side loop seamlessly.
function Wave({ className, speed = 5, still }: { className?: string; speed?: number; still: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 200 20"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={cn("absolute -top-3 left-0 h-4 w-[200%]", className)}
      animate={still ? undefined : { transform: ["translateX(0%)", "translateX(-50%)"] }}
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

// Term: two bars racing, time gone vs work done. Ahead of the clock = good.
export function TermWidget({ term, items, now }: { term: Term | null; items: Item[]; now: number }) {
  if (!term) return <Block title="Term progress" />;
  const start = Date.parse(`${term.start}T00:00:00`);
  const time = Math.min(1, Math.max(0, (now - start) / (term.weeks * 7 * 864e5)));
  const done = items.length ? items.filter((i) => i.doneAt).length / items.length : 0;
  const bars = [
    { label: "term gone", v: time, cls: "bg-muted-foreground/50" },
    { label: "work done", v: done, cls: "bg-brand" },
  ];
  return (
    <Block title="Term progress" aside={done >= time ? "ahead of the clock" : "the clock is ahead"}>
      <div className="flex flex-1 flex-col justify-center gap-4">
        {bars.map((b, i) => (
          <div key={b.label}>
            <p className="mb-1.5 flex justify-between font-mono text-xs text-muted-foreground">
              <span>{b.label}</span>
              <span className="text-foreground tabular-nums">{Math.round(b.v * 100)}%</span>
            </p>
            <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
              <motion.div
                className={cn("h-full origin-left rounded-full", b.cls)}
                initial={{ transform: "scaleX(0)" }}
                animate={{ transform: `scaleX(${b.v})` }}
                transition={{ duration: 1.1, ease: EASE, delay: i * 0.15 }}
              />
            </div>
          </div>
        ))}
      </div>
    </Block>
  );
}

// Roll for it: can't pick what to work on? Roll. Titles spin like a slot machine and land on one,
// weighted toward what's due soonest.
export function RollWidget({ items, now }: { items: Item[]; now: number }) {
  const open = items.filter((i) => !i.doneAt && Date.parse(i.due) > now).sort((a, b) => Date.parse(a.due) - Date.parse(b.due)).slice(0, 8);
  const [shown, setShown] = useState<Item | null>(null);
  const [rolling, setRolling] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const still = !!useReducedMotion();

  const roll = () => {
    if (!open.length || rolling) return;
    // weights 8, 7, 6…: sooner is likelier
    const bag = open.flatMap((i, k) => Array<Item>(open.length - k).fill(i));
    const pick = bag[Math.floor(Math.random() * bag.length)];
    if (still) return setShown(pick);
    setRolling(true);
    let n = 0;
    const tick = () => {
      n++;
      if (n >= 12) {
        setShown(pick);
        setRolling(false);
        return;
      }
      setShown(open[n % open.length]);
      timer.current = setTimeout(tick, 40 + n * n * 2.5); // slows down like a real wheel
    };
    tick();
  };

  return (
    <Block title="Roll for it" aside={shown && !rolling ? "do this one" : "can't decide?"} className="overflow-hidden">
      {!open.length ? (
        <p data-empty className="m-auto text-center text-sm text-muted-foreground">Nothing open to roll for. Nice.</p>
      ) : (
        <div className="flex flex-1 items-center gap-4">
          <motion.button
            type="button"
            onClick={roll}
            whileTap={{ scale: 0.9 }}
            animate={rolling ? { rotate: [0, 360] } : { rotate: 0 }}
            transition={rolling ? { duration: 0.5, repeat: Infinity, ease: "linear" } : { duration: 0.3 }}
            aria-label="Roll for what to work on"
            className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {shown && !rolling ? <RotateCcw className="size-5" /> : <Dices className="size-6" />}
          </motion.button>
          <div className="relative h-14 min-w-0 flex-1 overflow-hidden" aria-live="polite">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={shown?.id ?? "none"}
                initial={{ transform: "translateY(100%)", opacity: 0 }}
                animate={{ transform: "translateY(0%)", opacity: 1 }}
                exit={{ transform: "translateY(-100%)", opacity: 0 }}
                transition={{ duration: rolling ? 0.08 : 0.35, ease: EASE }}
                className="flex h-14 flex-col justify-center"
              >
                {shown ? (
                  <>
                    <p className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                      <span className="size-2 rounded-full" style={{ background: courseColor(shown.hue) }} />
                      {shown.course}
                    </p>
                    <p className="truncate font-medium">{shown.title}</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Tap the dice. It picks, you start.</p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
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
                initial={{ transform: "scale(0)" }}
                animate={{ transform: "scale(1)" }}
                transition={{ type: "spring", bounce: 0.45, duration: 0.6, delay: 0.5 + k * 0.12 }}
              />
            );
          })}
          {bloom && (
            <motion.g
              style={{ transformOrigin: `50px ${97 - height}px` }}
              initial={{ transform: "scale(0) rotate(-90deg)" }}
              animate={{ transform: "scale(1) rotate(0deg)" }}
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
