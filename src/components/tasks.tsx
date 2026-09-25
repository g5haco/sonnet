"use client";

import { Check, RefreshCw, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { createContext, useContext, useState, type ReactNode } from "react";
import type { TaskName, Tasks } from "@/app/api/tasks/route";

// Slow work (reading a syllabus, syncing Canvas, uploading) keeps going when its window closes. Each run shows
// a card in the bottom-right corner: working, then done (click to open the result) or failed.
type Task = { id: string; label: string; state: "running" | "done" | "error"; note?: string; href?: string };
type Done = { note?: string; href?: string };
type Run = <T extends { error?: string }>(label: string, work: () => Promise<T>, done?: (r: T) => Done) => Promise<T>;

const TasksContext = createContext<Run>((_, work) => work());
export const useTasks = () => useContext(TasksContext);

// Calls a slow server function through /api/tasks instead of as a Server Action, so it doesn't queue the
// tab's other actions (check-offs, saves) behind it.
export async function slow<K extends TaskName>(name: K, ...args: Parameters<Tasks[K]>): Promise<Awaited<ReturnType<Tasks[K]>>> {
  const res = await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, args }),
  });
  return res.ok ? res.json() : ({ error: "Couldn't reach Sonnet. Try again." } as Awaited<ReturnType<Tasks[K]>>);
}

export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const router = useRouter();
  const dismiss = (id: string) => setTasks((ts) => ts.filter((t) => t.id !== id));

  const run: Run = async (label, work, done) => {
    const id = crypto.randomUUID();
    setTasks((ts) => [...ts, { id, label, state: "running" }]);
    const settle = (patch: Partial<Task>) => setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    try {
      const r = await work();
      router.refresh(); // /api/tasks can't refresh this page's data the way an action does
      if (r.error) settle({ state: "error", note: r.error });
      else {
        settle({ state: "done", ...done?.(r) });
        setTimeout(() => dismiss(id), 8_000); // successes step aside; failures wait to be read
      }
      return r;
    } catch {
      settle({ state: "error", note: "Something went wrong. Try again." });
      return { error: "Something went wrong. Try again." } as Awaited<ReturnType<typeof work>>;
    }
  };

  return (
    <TasksContext.Provider value={run}>
      {children}
      {/* Above the metal Ask button; polite live region so screen readers hear "done" without being cut off. */}
      <ol
        aria-live="polite"
        className="pointer-events-none fixed right-4 bottom-20 z-[60] flex w-72 max-w-[calc(100vw-2rem)] flex-col gap-2 md:right-6 md:bottom-24"
      >
        <AnimatePresence initial={false}>
          {tasks.map((t) => {
            const open = t.state === "done" && !!t.href;
            const Card = open ? "button" : "div"; // only a finished card with somewhere to go is clickable
            return (
              <motion.li
                key={t.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ type: "spring", stiffness: 420, damping: 40 }}
                className="pointer-events-auto relative rounded-xl bg-popover text-sm text-popover-foreground shadow-lg ring-1 ring-foreground/10"
              >
                <Card
                  {...(open && {
                    type: "button",
                    onClick: () => {
                      router.push(t.href!);
                      dismiss(t.id);
                    },
                  })}
                  className="flex w-full items-start gap-2.5 rounded-xl p-3 pr-9 text-left [button&]:cursor-pointer [button&]:hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {t.state === "running" ? (
                    <RefreshCw className="mt-0.5 size-4 shrink-0 text-muted-foreground motion-safe:animate-spin" aria-hidden="true" />
                  ) : t.state === "done" ? (
                    <Check className="mt-0.5 size-4 shrink-0 text-done" aria-hidden="true" />
                  ) : (
                    <X className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{t.label}</span>
                    {t.note && (
                      <span className={t.state === "error" ? "text-destructive" : "text-muted-foreground"}>{t.note}</span>
                    )}
                    {t.state === "running" && (
                      // No percentage: none of these report real progress, so the bar only says "working".
                      <span className="mt-2 block h-1 overflow-hidden rounded-full bg-muted">
                        <span className="block h-full w-1/3 rounded-full bg-done motion-safe:animate-task-slide" />
                      </span>
                    )}
                  </span>
                </Card>
                {t.state !== "running" && (
                  <button
                    type="button"
                    onClick={() => dismiss(t.id)}
                    aria-label="Dismiss"
                    className="absolute top-2 right-2 grid size-7 place-items-center rounded-full text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </button>
                )}
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ol>
    </TasksContext.Provider>
  );
}
