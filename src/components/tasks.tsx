"use client";

import { X } from "@/components/icons";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { StatusMark } from "@/components/ui/status-mark";
import type { TaskName, Tasks } from "@/app/api/tasks/route";

// Slow work (reading a syllabus, syncing Canvas, uploading) keeps going when its window closes. Each run is a
// card in the toast stack at the bottom middle: working, then done (click to open the result) or failed.
type State = "running" | "done" | "error";
type Done = { note?: string; href?: string };

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

function Card({ id, label, state, note, open }: { id: string; label: string; state: State; note?: string; open?: () => void }) {
  const Body = open ? "button" : "div"; // only a finished card with somewhere to go is clickable
  return (
    <div className="relative w-[min(22rem,calc(100vw-2rem))] rounded-xl bg-popover text-sm text-popover-foreground shadow-lg ring-1 ring-foreground/10">
      <Body
        {...(open && { type: "button" as const, onClick: open })}
        className="flex w-full items-start gap-2.5 rounded-xl p-3 pr-9 text-left focus-visible:ring-2 focus-visible:ring-ring [button&]:cursor-pointer [button&]:hover:bg-accent/60"
      >
        {/* One ring morphs in place: spinning while it works, then a drawn check or cross. */}
        <StatusMark status={state === "error" ? "failed" : state} size={18} className="mt-px shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1">
          <span className="block font-medium [overflow-wrap:anywhere]">{label}</span>
          {note && <span className={state === "error" ? "text-destructive" : "text-muted-foreground"}>{note}</span>}
        </span>
      </Body>
      {state !== "running" && (
        <button
          type="button"
          onClick={() => toast.dismiss(id)}
          aria-label="Dismiss"
          className="absolute top-2 right-2 grid size-7 place-items-center rounded-full text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export function useTasks() {
  const router = useRouter();
  return async <T extends { error?: string }>(label: string, work: () => Promise<T>, done?: (r: T) => Done) => {
    const id = crypto.randomUUID();
    const show = (state: State, note?: string, href?: string) =>
      toast.custom(
        () => (
          <Card
            id={id}
            label={label}
            state={state}
            note={note}
            open={
              href
                ? () => {
                    router.push(href);
                    toast.dismiss(id);
                  }
                : undefined
            }
          />
        ),
        // successes step aside after 8s; running and failed cards stay until they settle or are dismissed
        { id, duration: state === "done" ? 8_000 : Infinity, dismissible: state !== "running" },
      );
    show("running");
    let r: T;
    try {
      r = await work();
    } catch {
      r = { error: "Something went wrong. Try again." } as T;
    }
    router.refresh(); // /api/tasks can't refresh this page's data the way an action does
    if (r.error) show("error", r.error);
    else {
      const d = done?.(r);
      show("done", d?.note, d?.href);
    }
    return r;
  };
}
