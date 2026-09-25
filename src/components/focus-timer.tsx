"use client";

import { Timer, X } from "lucide-react";
import { AnimatePresence, motion, useDragControls, useMotionValue } from "motion/react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { logFocus } from "@/app/actions";
import { AnimatedCircularProgressBar } from "@/components/ui/animated-circular-progress-bar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LENGTH = 25; // minutes per focus session
const KEY = "sonnet-focus"; // the running session survives page changes and reloads
const SPRING = { type: "spring", stiffness: 420, damping: 36 } as const;

type Run = { start: number };
type Focus = {
  run: Run | null;
  left: number; // ms left in the running session
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void; // start a session, or stop (and log) the running one
};

const FocusContext = createContext<Focus>({
  run: null,
  left: LENGTH * 60_000,
  open: false,
  setOpen: () => {},
  toggle: () => {},
});
export const useFocus = () => useContext(FocusContext);

// A session the student walked away from long ago (browser closed, tab slept) is dropped, not logged.
const load = (): Run | null => {
  try {
    const run: Run | null = JSON.parse(localStorage.getItem(KEY) ?? "null");
    return run && Date.now() - run.start < 2 * LENGTH * 60_000 ? run : null;
  } catch {
    return null;
  }
};
const store = (run: Run | null) => {
  try {
    if (run) localStorage.setItem(KEY, JSON.stringify(run));
    else localStorage.removeItem(KEY);
  } catch {}
};

const mmss = (ms: number) => new Date(Math.max(0, Math.ceil(ms / 1000) * 1000)).toISOString().slice(14, 19);

// One timer for the whole app (it lives in the shell, so it keeps running on every page). The sidebar button
// opens a floating panel that stays until closed; a session logs when it finishes, or when stopped after a minute.
export function FocusProvider({ children }: { children: React.ReactNode }) {
  const [run, setRun] = useState<Run | null>(null);
  const [open, setOpen] = useState(false);
  const [tick, setTick] = useState(0);
  // Dragged by its header, kept inside the window; the spot is remembered while the app is open.
  const drag = useDragControls();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const bounds = useRef<HTMLDivElement>(null);

  useEffect(() => setRun(load()), []); // eslint-disable-line react-hooks/set-state-in-effect -- storage is client-only
  useEffect(() => {
    if (!run) return;
    setTick(Date.now()); // eslint-disable-line react-hooks/set-state-in-effect
    const id = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, [run]);

  const finish = async (r: Run, minutes: number) => {
    setRun(null);
    store(null);
    if (minutes < 1) return;
    const res = await logFocus({ startedAt: new Date(r.start).toISOString(), minutes });
    if (res.error) toast.error(res.error);
    else toast.success(minutes >= LENGTH ? `${LENGTH} minutes done. Take a break.` : `${minutes} min logged.`);
  };

  const left = run ? LENGTH * 60_000 - (Math.max(tick, run.start) - run.start) : LENGTH * 60_000;
  const over = !!run && left <= 0;
  useEffect(() => {
    if (run && over) finish(run, LENGTH); // eslint-disable-line react-hooks/set-state-in-effect
  }, [over]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = () => {
    if (run) return finish(run, Math.floor((Date.now() - run.start) / 60_000));
    const r = { start: Date.now() };
    setTick(r.start);
    setRun(r);
    store(r);
  };

  return (
    <FocusContext.Provider value={{ run, left, open, setOpen, toggle }}>
      {children}
      <div ref={bounds} className="pointer-events-none fixed inset-2 z-40" aria-hidden="true" />
      <AnimatePresence>
        {open && (
          <motion.section
            aria-label="Focus timer"
            initial={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.92, filter: "blur(4px)" }}
            transition={SPRING}
            drag
            dragListener={false}
            dragControls={drag}
            dragConstraints={bounds}
            dragMomentum={false}
            dragElastic={0.05}
            style={{ x, y }}
            className="fixed top-16 right-2 z-50 w-64 origin-top-right rounded-3xl border border-border bg-popover p-4 text-popover-foreground shadow-2xl md:top-4 md:right-auto md:left-[72px] md:origin-top-left"
          >
            <header
              onPointerDown={(e) => drag.start(e)}
              title="Drag to move"
              className="-mt-1 -mr-1 mb-1 flex cursor-grab touch-none items-center justify-between select-none active:cursor-grabbing"
            >
              <h2 className="text-sm font-medium">Focus</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                onPointerDown={(e) => e.stopPropagation()}
                aria-label="Close focus timer"
                className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-4" />
              </button>
            </header>
            <FocusDial />
          </motion.section>
        )}
      </AnimatePresence>
    </FocusContext.Provider>
  );
}

// The ring and Start/Stop, shared by the floating panel and Home's Focus timer widget: both drive the one timer.
export function FocusDial({ className }: { className?: string }) {
  const { run, left, toggle } = useFocus();
  const used = Math.floor((LENGTH * 60_000 - left) / 1000); // whole seconds into the session
  return (
    <div className={className}>
      {/* The ring fills over the whole session, a little every second. */}
      <AnimatedCircularProgressBar
        min={0}
        max={LENGTH * 60}
        value={run ? used : 0}
        gaugePrimaryColor="var(--done)"
        gaugeSecondaryColor="color-mix(in oklab, var(--foreground) 10%, transparent)"
        label="Focus time used"
        className="mx-auto size-40"
      >
        <span className="flex flex-col items-center">
          <span className="font-mono text-3xl font-medium tracking-tight tabular-nums">{mmss(left)}</span>
          <span className="mt-0.5 font-mono text-xs font-normal text-muted-foreground">
            {run ? `min ${Math.min(LENGTH, Math.floor(used / 60) + 1)} of ${LENGTH}` : `${LENGTH} min`}
          </span>
        </span>
      </AnimatedCircularProgressBar>
      <Button
        variant={run ? "secondary" : "default"}
        className="mt-4 h-10 w-full rounded-full transition-[background-color,transform] active:scale-[0.97]"
        onClick={toggle}
      >
        {run ? "Stop" : `Start ${LENGTH} min`}
      </Button>
    </div>
  );
}

// The sidebar's timer button: an icon when idle, a filling ring with the minutes left while a session runs.
export function FocusButton() {
  const { run, left, open, setOpen } = useFocus();
  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      aria-label={run ? `Focus timer, ${mmss(left)} left` : "Focus timer"}
      aria-expanded={open}
      title="Focus timer"
      className={cn(
        "relative grid size-10 shrink-0 place-items-center rounded-full shadow-[0_6px_18px_rgb(0_0_0/0.18)] transition-colors focus-visible:ring-2 focus-visible:ring-ring",
        open ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-accent",
      )}
    >
      <AnimatePresence initial={false} mode="popLayout">
        {run ? (
          <motion.span
            key="ring"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={SPRING}
          >
            <AnimatedCircularProgressBar
              min={0}
              max={LENGTH * 60_000}
              value={LENGTH * 60_000 - left}
              gaugePrimaryColor="var(--done)"
              gaugeSecondaryColor="color-mix(in oklab, currentColor 15%, transparent)"
              className="size-9 text-[11px]"
            >
              <span className="font-mono font-medium tabular-nums">{Math.ceil(left / 60_000)}</span>
            </AnimatedCircularProgressBar>
          </motion.span>
        ) : (
          <motion.span
            key="icon"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={SPRING}
          >
            <Timer className="size-5" aria-hidden="true" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
