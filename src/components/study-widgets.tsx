"use client";

// Sonnet Pro Home widgets for the study session itself: Today's three, Soundscape, Breathe, Quick note,
// and Study buddy. (Roll for it, Study plant and Week glass live in pro-widgets.tsx.)
import { Check, Pause, Play } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Block } from "@/components/block";
import { courseColor, dayKey } from "@/lib/course";
import { studyDays, type FocusSession } from "@/lib/focus";
import { endOfWeek, type Item } from "@/lib/progress";
import { cn } from "@/lib/utils";

const EASE = [0.23, 1, 0.32, 1] as const;
const r2 = (n: number) => +n.toFixed(2);

// A per-device value in localStorage. null on the server and first paint, so nothing mismatches on hydration.
// ponytail: this device only; a settings column if people want their note and picks on every device.
function useStored(key: string): [string | null, (v: string) => void] {
  const value = useSyncExternalStore(
    (changed) => {
      window.addEventListener("storage", changed);
      window.addEventListener("sonnet-store", changed);
      return () => {
        window.removeEventListener("storage", changed);
        window.removeEventListener("sonnet-store", changed);
      };
    },
    () => {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    () => null,
  );
  const set = (v: string) => {
    try {
      localStorage.setItem(key, v);
    } catch {}
    window.dispatchEvent(new Event("sonnet-store"));
  };
  return [value, set];
}

const byDue = (a: Item, b: Item) => Date.parse(a.due) - Date.parse(b.due);

// Today's three: commit to three things for today and check them off. A fresh list every day.
export function ThreeWidget({ items: given, now, onToggle, preset }: { items: Item[]; now: number; onToggle?: (id: string) => void; preset?: boolean }) {
  const [raw, save] = useStored(`sonnet:three:${dayKey(new Date(now))}`);
  const [choosing, setChoosing] = useState(false);
  let picked: string[] = [];
  try {
    picked = raw ? JSON.parse(raw) : [];
  } catch {}
  // preset: the widget library shows three picked, one checked off
  if (preset) picked = given.filter((i) => Date.parse(i.due) > now - 864e5).sort(byDue).slice(0, 3).map((i) => i.id);
  const doneOne = preset ? picked[0] : null;
  const items = doneOne ? given.map((i) => (i.id === doneOne ? { ...i, doneAt: i.doneAt ?? new Date(now).toISOString() } : i)) : given;
  const chosen = picked.map((id) => items.find((i) => i.id === id)).filter((i): i is Item => !!i);
  const candidates = items.filter((i) => !i.doneAt && !picked.includes(i.id)).sort(byDue).slice(0, 6);
  const done = chosen.filter((i) => i.doneAt).length;
  const allDone = chosen.length > 0 && done === chosen.length;
  const setPicked = (ids: string[]) => save(JSON.stringify(ids));

  return (
    <Block
      title="Today's three"
      aside={chosen.length ? `${done}/${chosen.length} done` : "pick your focus"}
      className="relative overflow-hidden"
    >
      <ul className="flex flex-col gap-1.5">
        <AnimatePresence initial={false}>
          {chosen.map((i) => (
            <motion.li
              key={i.id}
              layout
              initial={{ opacity: 0, transform: "translateY(6px)" }}
              animate={{ opacity: 1, transform: "translateY(0px)" }}
              exit={{ opacity: 0 }}
              className="group flex min-h-11 items-center gap-3 rounded-xl bg-secondary px-3"
            >
              <button
                type="button"
                onClick={() => onToggle?.(i.id)}
                aria-label={`${i.doneAt ? "Uncheck" : "Check off"} ${i.title}`}
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full border-2 transition-colors",
                  i.doneAt ? "border-done bg-done text-background" : "border-muted-foreground/50 hover:border-foreground",
                )}
              >
                {i.doneAt && (
                  <motion.span
                    initial={{ transform: "scale(0.5)" }}
                    animate={{ transform: "scale(1)" }}
                    transition={{ type: "spring", bounce: 0.5, duration: 0.35 }}
                  >
                    <Check className="size-3.5" strokeWidth={3} />
                  </motion.span>
                )}
              </button>
              <span className={cn("min-w-0 flex-1", i.doneAt && "text-muted-foreground line-through")}>
                <span className="block truncate text-sm font-medium">{i.title}</span>
                <span className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                  <span className="size-1.5 rounded-full" style={{ background: courseColor(i.hue) }} />
                  {i.course}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setPicked(picked.filter((id) => id !== i.id))}
                aria-label={`Take ${i.title} off today's three`}
                className="grid size-8 place-items-center rounded-full font-mono text-sm text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground focus-visible:opacity-100"
              >
                ×
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      {chosen.length < 3 &&
        (choosing ? (
          <ul className="mt-2 flex min-h-0 flex-col gap-0.5 overflow-y-auto border-t border-border pt-2" aria-label="Pick one">
            {candidates.length === 0 && <li className="text-sm text-muted-foreground">Nothing open to pick.</li>}
            {candidates.map((i) => (
              <li key={i.id}>
                <button
                  type="button"
                  onClick={() => {
                    setPicked([...picked, i.id]);
                    if (picked.length >= 2) setChoosing(false);
                  }}
                  className="flex min-h-9 w-full items-center gap-2 rounded-lg px-2 text-left text-sm hover:bg-accent"
                >
                  <span className="size-1.5 shrink-0 rounded-full" style={{ background: courseColor(i.hue) }} />
                  <span className="truncate">{i.title}</span>
                  <span className="ml-auto shrink-0 font-mono text-[11px] text-muted-foreground">{i.course}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <button
            type="button"
            onClick={() => setChoosing(true)}
            className="mt-2 flex min-h-11 w-full items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:text-foreground"
          >
            + Pick {chosen.length ? "another" : "three things for today"}
          </button>
        ))}
      {/* All three done: a small burst. */}
      <AnimatePresence>
        {allDone && (
          <motion.div
            key="burst"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 grid place-items-center"
            aria-live="polite"
          >
            {Array.from({ length: 12 }, (_, k) => {
              const a = (k / 12) * 2 * Math.PI;
              return (
                <motion.span
                  key={k}
                  className="absolute size-1.5 rounded-full bg-done"
                  initial={{ transform: "translate(0px, 0px) scale(1)", opacity: 1 }}
                  animate={{ transform: `translate(${r2(Math.cos(a) * 90)}px, ${r2(Math.sin(a) * 60)}px) scale(0.4)`, opacity: 0 }}
                  transition={{ duration: 0.9, ease: EASE }}
                />
              );
            })}
            <motion.p
              initial={{ transform: "scale(0.9)", opacity: 0 }}
              animate={{ transform: "scale(1)", opacity: 1 }}
              transition={{ type: "spring", bounce: 0.4, duration: 0.5, delay: 0.2 }}
              className="rounded-full bg-popover px-3 py-1 text-sm font-medium shadow-md ring-1 ring-border"
            >
              All three done.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </Block>
  );
}

type Sound = "rain" | "brown" | "ocean";
const SOUNDS: { id: Sound; label: string }[] = [
  { id: "rain", label: "Rain" },
  { id: "brown", label: "Brown noise" },
  { id: "ocean", label: "Ocean" },
];

// Four seconds of noise, looped. Brown noise is white noise through a leaky integrator (deeper, softer).
function noise(ctx: AudioContext, brown: boolean) {
  const buf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i++) {
    const w = Math.random() * 2 - 1;
    last = (last + 0.02 * w) / 1.02;
    d[i] = brown ? last * 3.5 : w;
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  return src;
}

// Soundscape: study sounds made in the browser (Web Audio, no files).
export function SoundWidget() {
  const [playing, setPlaying] = useState<Sound | null>(null);
  const [volume, setVolume] = useState(0.5);
  const ctx = useRef<AudioContext | null>(null);
  const master = useRef<GainNode | null>(null);
  const nodes = useRef<AudioScheduledSourceNode[]>([]);
  const still = !!useReducedMotion();
  useEffect(() => () => void ctx.current?.close(), []);

  const play = (kind: Sound) => {
    nodes.current.forEach((n) => n.stop());
    nodes.current = [];
    if (playing === kind) return setPlaying(null);
    const c = (ctx.current ??= new AudioContext());
    void c.resume();
    if (!master.current) {
      master.current = c.createGain();
      master.current.connect(c.destination);
    }
    master.current.gain.value = volume;
    const src = noise(c, kind !== "rain");
    const gain = c.createGain();
    if (kind === "rain") {
      const hp = c.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 800;
      const lp = c.createBiquadFilter();
      lp.frequency.value = 6000;
      gain.gain.value = 0.3;
      src.connect(hp).connect(lp).connect(gain);
    } else if (kind === "ocean") {
      const lp = c.createBiquadFilter();
      lp.frequency.value = 700;
      gain.gain.value = 0.5;
      // waves: the volume swells and falls about every 8 seconds
      const lfo = c.createOscillator();
      lfo.frequency.value = 0.12;
      const depth = c.createGain();
      depth.gain.value = 0.45;
      lfo.connect(depth).connect(gain.gain);
      lfo.start();
      nodes.current.push(lfo);
      src.connect(lp).connect(gain);
    } else {
      gain.gain.value = 0.9;
      src.connect(gain);
    }
    gain.connect(master.current);
    src.start();
    nodes.current.push(src);
    setPlaying(kind);
  };

  return (
    <Block title="Soundscape" aside={playing ? "playing" : "for focus"}>
      <div className="flex flex-1 flex-col justify-center gap-3">
        <div className="flex h-8 items-end justify-center gap-1" aria-hidden="true">
          {[0.5, 0.9, 0.6, 1, 0.7, 0.4, 0.8].map((h, k) => (
            <motion.span
              key={k}
              className={cn("h-full w-1.5 origin-bottom rounded-full", playing ? "bg-brand" : "bg-muted-foreground/30")}
              animate={
                playing && !still
                  ? { transform: [`scaleY(${h * 0.3})`, `scaleY(${h})`, `scaleY(${h * 0.5})`, `scaleY(${h * 0.3})`] }
                  : { transform: "scaleY(0.15)" }
              }
              transition={playing && !still ? { duration: 1.2 + k * 0.13, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }}
            />
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-1.5">
          {SOUNDS.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={playing === s.id}
              onClick={() => play(s.id)}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm transition-colors",
                playing === s.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground",
              )}
            >
              {playing === s.id ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
              {s.label}
            </button>
          ))}
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          aria-label="Volume"
          onChange={(e) => {
            const v = Number(e.target.value);
            setVolume(v);
            if (master.current && ctx.current) master.current.gain.setTargetAtTime(v, ctx.current.currentTime, 0.05);
          }}
          className="mx-auto h-8 w-3/4 cursor-pointer accent-foreground"
        />
      </div>
    </Block>
  );
}

const PHASES = ["Breathe in", "Hold", "Breathe out", "Hold"];
const ROUNDS = 4;

// Breathe: one minute of box breathing (4 in, 4 hold, 4 out, 4 hold). For the minutes before an exam.
export function BreatheWidget() {
  const [step, setStep] = useState(-1); // -1 = not started; ROUNDS * 4 = done
  const running = step >= 0 && step < ROUNDS * 4;
  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => setStep((s) => s + 1), 4000);
    return () => clearTimeout(t);
  }, [step, running]);
  const phase = step % 4;
  const big = running && (phase === 0 || phase === 1);

  return (
    <Block title="Breathe" aside={running ? `round ${Math.floor(step / 4) + 1} of ${ROUNDS}` : "1 minute"}>
      <button
        type="button"
        onClick={() => setStep(running ? -1 : 0)}
        aria-label={running ? "Stop the breathing exercise" : "Start a one-minute breathing exercise"}
        className="relative grid min-h-24 flex-1 place-items-center rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <motion.span
          aria-hidden="true"
          className="absolute aspect-square h-[90%] max-h-48 rounded-full bg-brand/15 ring-1 ring-brand/40"
          animate={{ transform: `scale(${big ? 1 : 0.62})` }}
          transition={{ duration: running ? 4 : 0.6, ease: [0.37, 0, 0.63, 1] }}
        />
        <span className="relative text-center" aria-live="polite">
          <span className="block font-heading text-xl">
            {running ? PHASES[phase] : step === ROUNDS * 4 ? "Nice. Go get it." : "Tap to start"}
          </span>
          {!running && <span className="font-mono text-[11px] text-muted-foreground">4 in · 4 hold · 4 out · 4 hold</span>}
        </span>
      </button>
    </Block>
  );
}

// Quick note: a scratchpad on Home. Saved on this device as you type.
export function NoteWidget({ preset }: { preset?: string }) {
  const [stored, save] = useStored("sonnet:note");
  const note = preset ?? stored;
  return (
    <Block title="Quick note" aside="saved on this device">
      <textarea
        value={note ?? ""}
        onChange={(e) => save(e.target.value.slice(0, 5000))}
        aria-label="Quick note"
        placeholder="A question for office hours, a page number, a thought for later…"
        className="-mx-1 min-h-16 flex-1 resize-none rounded-lg bg-transparent px-1 text-sm leading-relaxed outline-none placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-ring"
      />
    </Block>
  );
}

type Mood = "worried" | "party" | "sleepy" | "happy" | "idle";
const SAYS: Record<Mood, string> = {
  worried: "Something's overdue. Fix one with me?",
  party: "Week cleared! Dance break.",
  sleepy: "Zzz… sleep helps you remember.",
  happy: "You studied today. Proud of you.",
  idle: "Start a focus session? I'll cheer.",
};
const MOUTHS: Record<Mood, string> = {
  worried: "M43 73 Q50 67 57 73",
  party: "M41 67 Q50 79 59 67 Z",
  sleepy: "M47 71 Q50 74 53 71",
  happy: "M42 68 Q50 76 58 68",
  idle: "M45 70 H55",
};

// Study buddy: a little creature whose mood follows your week. Tap it for hearts.
export function BuddyWidget({ items, sessions, now }: { items: Item[]; sessions: FocusSession[]; now: number }) {
  const still = !!useReducedMotion();
  const [hearts, setHearts] = useState<number[]>([]);
  const end = endOfWeek(now);
  const week = items.filter((i) => Date.parse(i.due) > end - 7 * 864e5 && Date.parse(i.due) <= end);
  const hour = new Date(now).getHours();
  const mood: Mood = items.some((i) => !i.doneAt && Date.parse(i.due) < now)
    ? "worried"
    : week.length && week.every((i) => i.doneAt)
      ? "party"
      : hour >= 23 || hour < 6
        ? "sleepy"
        : studyDays(sessions).has(dayKey(new Date(now)))
          ? "happy"
          : "idle";
  const body =
    still || mood === "sleepy"
      ? undefined
      : mood === "party"
        ? { y: [0, -8, 0] }
        : { scaleY: [1, 1.04, 1] };

  return (
    <Block title="Study buddy" className="overflow-hidden">
      <button
        type="button"
        onClick={() => setHearts((h) => [...h, Date.now()].slice(-6))}
        aria-label={`Study buddy. ${SAYS[mood]} Tap to pet.`}
        className="relative grid min-h-0 w-full flex-1 place-items-center rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <motion.svg
          viewBox="0 0 100 100"
          className="h-full max-h-40 min-h-14"
          aria-hidden="true"
          style={{ transformOrigin: "50% 90%" }}
          animate={body}
          transition={{ duration: mood === "party" ? 0.5 : 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <ellipse cx="50" cy="90" rx="26" ry="3" className="fill-foreground/10" />
          <ellipse cx="50" cy="62" rx="34" ry="28" className="fill-foreground" />
          {mood === "sleepy" ? (
            <>
              <path d="M36 57 Q40 60 44 57" strokeWidth="2.5" strokeLinecap="round" fill="none" className="stroke-background" />
              <path d="M56 57 Q60 60 64 57" strokeWidth="2.5" strokeLinecap="round" fill="none" className="stroke-background" />
            </>
          ) : (
            <motion.g
              style={{ transformOrigin: "50px 56px" }}
              animate={still ? undefined : { scaleY: [1, 1, 0.1, 1] }}
              transition={{ duration: 4, times: [0, 0.9, 0.95, 1], repeat: Infinity }}
            >
              <ellipse cx="40" cy="56" rx="4" ry={mood === "worried" ? 5.5 : 5} className="fill-background" />
              <ellipse cx="60" cy="56" rx="4" ry={mood === "worried" ? 5.5 : 5} className="fill-background" />
            </motion.g>
          )}
          {(mood === "happy" || mood === "party") && (
            <>
              <ellipse cx="32" cy="66" rx="4" ry="2.5" className="fill-destructive/40" />
              <ellipse cx="68" cy="66" rx="4" ry="2.5" className="fill-destructive/40" />
            </>
          )}
          <path
            d={MOUTHS[mood]}
            strokeWidth="2.5"
            strokeLinecap="round"
            className={cn("stroke-background", mood === "party" ? "fill-background" : "fill-none")}
          />
          {mood === "sleepy" && !still && (
            <motion.text
              x="74"
              y="32"
              className="fill-muted-foreground font-mono text-[12px]"
              animate={{ opacity: [0, 1, 0], y: [4, -6, -12] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            >
              z
            </motion.text>
          )}
        </motion.svg>
        <AnimatePresence>
          {hearts.map((h) => (
            <motion.span
              key={h}
              aria-hidden="true"
              className="pointer-events-none absolute text-lg text-destructive"
              initial={{ opacity: 1, transform: "translate(0px, 0px) scale(0.6)" }}
              animate={{ opacity: 0, transform: `translate(${(h % 5) * 8 - 16}px, -70px) scale(1.1)` }}
              transition={{ duration: 1.1, ease: EASE }}
              onAnimationComplete={() => setHearts((all) => all.filter((x) => x !== h))}
            >
              ♥
            </motion.span>
          ))}
        </AnimatePresence>
      </button>
      <p className="mt-2 text-center text-xs text-balance text-muted-foreground">{SAYS[mood]}</p>
    </Block>
  );
}
