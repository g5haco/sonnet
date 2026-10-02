"use client";

import { Timer, X } from "@/components/icons";
import { AnimatePresence, motion, useDragControls, useMotionValue } from "motion/react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { logFocus } from "@/app/actions";
import { AnimatedCircularProgressBar } from "@/components/ui/animated-circular-progress-bar";
import { Button } from "@/components/ui/button";
import { focusSense, focusSessionId } from "@/lib/desktop/focus-sense";
import { enqueue, flush, type PendingLog } from "@/lib/focus";
import { cn } from "@/lib/utils";

const LENGTH = 25; // minutes per focus session
const KEY = "sonnet-focus"; // the running session survives page changes and reloads
const PENDING = "sonnet-focus-pending"; // finished sessions not saved yet; retried until the server confirms
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
const loadPending = (): PendingLog[] => {
  try {
    const queue = JSON.parse(localStorage.getItem(PENDING) ?? "[]");
    return Array.isArray(queue) ? queue : [];
  } catch {
    return [];
  }
};
const storePending = (queue: PendingLog[]) => {
  try {
    if (queue.length) localStorage.setItem(PENDING, JSON.stringify(queue));
    else localStorage.removeItem(PENDING);
  } catch {}
};

const mmss = (ms: number) => new Date(Math.max(0, Math.ceil(ms / 1000) * 1000)).toISOString().slice(14, 19);

// One timer for the whole app (it lives in the shell, so it keeps running on every page). The sidebar button
// opens a floating panel that stays until closed; a session logs when it finishes, or when stopped after a minute.
export function FocusProvider({ children }: { children: React.ReactNode }) {
  const [run, setRun] = useState<Run | null>(null);
  const [loaded, setLoaded] = useState(false); // the stored run has been read
  const [open, setOpen] = useState(false);
  const [tick, setTick] = useState(0);
  // Dragged by its header, kept inside the window; the spot is remembered while the app is open.
  const drag = useDragControls();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const bounds = useRef<HTMLDivElement>(null);

  // The queue lives in localStorage; memory holds it only when storage is blocked or full, so a finished session
  // is still sent (it just won't survive a reload).
  const memory = useRef<PendingLog[]>([]);
  const readQueue = () => memory.current.reduce(enqueue, loadPending());
  const writeQueue = (queue: PendingLog[]) => {
    storePending(queue);
    const kept = loadPending();
    memory.current = queue.every((q) => kept.some((k) => k.startedAt === q.startedAt)) ? [] : queue;
  };

  // Sends queued sessions, oldest first. One pass at a time across tabs (a Web Lock, so two tabs coming back
  // online can't both send the same session) and per tab; anything queued meanwhile joins the running pass.
  // Sessions just finished here (announce) get the usual toast; older ones saved on retry get a quiet note, and
  // their failures stay silent until the next try.
  const saving = useRef(false);
  const announce = useRef(new Set<string>());
  const save = async () => {
    if (saving.current) return;
    saving.current = true;
    const pass = async () => {
      const tried = new Set<string>();
      for (;;) {
        const todo = readQueue().filter((q) => !tried.has(q.startedAt));
        if (!todo.length) break;
        todo.forEach((q) => tried.add(q.startedAt));
        const { sent, dropped, failed } = await flush(todo, logFocus);
        const gone = new Set([...sent, ...dropped, ...failed.filter((f) => f.final).map((f) => f.log)].map((q) => q.startedAt));
        writeQueue(readQueue().filter((q) => !gone.has(q.startedAt)));
        for (const s of sent) {
          if (!announce.current.delete(s.startedAt)) toast.success(`Saved an earlier ${s.minutes}-min focus session.`);
          else toast.success(s.minutes >= LENGTH ? `${LENGTH} minutes done. Take a break.` : `${s.minutes} min logged.`);
        }
        for (const f of failed)
          if (announce.current.delete(f.log.startedAt))
            toast.error(f.final ? f.error : `${f.error} It's kept and will save later.`);
      }
    };
    try {
      if (navigator.locks) await navigator.locks.request("sonnet-focus-pending", pass);
      else await pass();
    } finally {
      saving.current = false;
    }
  };

  useEffect(() => {
    setRun(load()); // eslint-disable-line react-hooks/set-state-in-effect -- storage is client-only
    setLoaded(true);
    save();
    const retry = () => void save();
    window.addEventListener("online", retry);
    return () => window.removeEventListener("online", retry);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- mount only; save reads refs and storage
  // Desktop Focus Sense follows the run: start with it, stop without it, on change only. Not before the stored run
  // has loaded (the first render's null would stop a still-running session). On mount with no run, one stop ends a
  // monitor orphaned by a reload or sign-out.
  const sensed = useRef<number | null | undefined>(undefined); // run.start last sent
  useEffect(() => {
    const s = run?.start ?? null;
    if (!loaded || sensed.current === s || !focusSense.available()) return;
    sensed.current = s;
    void (run ? focusSense.start(focusSessionId(run.start), run.start + LENGTH * 60_000) : focusSense.stop());
  }, [run, loaded]);
  useEffect(() => {
    if (!run) return;
    setTick(Date.now()); // eslint-disable-line react-hooks/set-state-in-effect
    const id = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, [run]);

  // Queue the session before clearing the run, so there's always a saved copy until the server confirms.
  const finish = async (r: Run, minutes: number) => {
    setRun(null);
    if (minutes >= 1) {
      const log = { startedAt: new Date(r.start).toISOString(), minutes };
      writeQueue(enqueue(readQueue(), log));
      announce.current.add(log.startedAt);
    }
    store(null);
    await save();
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
        "relative grid size-10 max-md:size-11 shrink-0 place-items-center rounded-full shadow-[0_6px_18px_rgb(0_0_0/0.18)] transition-colors focus-visible:ring-2 focus-visible:ring-ring",
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
