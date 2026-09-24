"use client";

import { Timer, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { logFocus } from "@/app/actions";
import { AnimatedCircularProgressBar } from "@/components/ui/animated-circular-progress-bar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const LENGTH = 25; // minutes per focus session
const KEY = "sonnet-focus"; // the running session survives page changes and reloads
const SPRING = { type: "spring", stiffness: 420, damping: 36 } as const;

type Run = { start: number };
type Focus = {
  run: Run | null;
  left: number; // ms left in the running session
  open: boolean;
  setOpen: (open: boolean) => void;
};

const FocusContext = createContext<Focus>({ run: null, left: LENGTH * 60_000, open: false, setOpen: () => {} });
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

export const mmss = (ms: number) => new Date(Math.max(0, Math.ceil(ms / 1000) * 1000)).toISOString().slice(14, 19);

// One timer for the whole app (it lives in the shell, so it keeps running on every page). The sidebar button
// opens a floating panel that stays until closed; a session logs when it finishes, or when stopped after a minute.
export function FocusProvider({ children }: { children: React.ReactNode }) {
  const [run, setRun] = useState<Run | null>(null);
  const [open, setOpen] = useState(false);
  const [tick, setTick] = useState(0);

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

  const start = () => {
    const r = { start: Date.now() };
    setTick(r.start);
    setRun(r);
    store(r);
  };

  return (
    <FocusContext.Provider value={{ run, left, open, setOpen }}>
      {children}
      <AnimatePresence>
        {open && (
          <motion.section
            aria-label="Focus timer"
            initial={{ opacity: 0, scale: 0.9, y: -6, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.92, y: -6, filter: "blur(4px)" }}
            transition={SPRING}
            className="fixed top-16 right-2 z-50 w-64 origin-top-right rounded-3xl border border-border bg-popover p-4 text-popover-foreground shadow-2xl md:top-4 md:right-auto md:left-[72px] md:origin-top-left"
          >
            <header className="-mt-1 -mr-1 mb-1 flex items-center justify-between">
              <h2 className="text-sm font-medium">Focus</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close focus timer"
                className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-4" />
              </button>
            </header>
            <AnimatedCircularProgressBar
              min={0}
              max={LENGTH * 60_000}
              value={LENGTH * 60_000 - left}
              gaugePrimaryColor="var(--done)"
              gaugeSecondaryColor="color-mix(in oklab, var(--foreground) 10%, transparent)"
              label="Focus time used"
              className="mx-auto size-40"
            >
              <span className="flex flex-col items-center">
                <span className="font-mono text-3xl font-medium tracking-tight tabular-nums">{mmss(left)}</span>
                <span className="mt-0.5 font-mono text-xs font-normal text-muted-foreground">
                  {run ? "focusing" : `${LENGTH} min`}
                </span>
              </span>
            </AnimatedCircularProgressBar>
            <Button
              variant={run ? "secondary" : "default"}
              className="mt-4 h-10 w-full rounded-full transition-[background-color,transform] active:scale-[0.97]"
              onClick={() => (run ? finish(run, Math.floor((Date.now() - run.start) / 60_000)) : start())}
            >
              {run ? "Stop" : `Start ${LENGTH} min`}
            </Button>
          </motion.section>
        )}
      </AnimatePresence>
    </FocusContext.Provider>
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
