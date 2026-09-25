"use client";

import Link from "next/link";
import { startTransition, useOptimistic, useState } from "react";
import { toast } from "sonner";
import { deleteItem, setDone } from "@/app/actions";
import { Block } from "@/components/block";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { endOfWeek, type Item } from "@/lib/progress";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { courseColor } from "@/lib/course";

const DAY = 864e5;

// Check-offs show instantly (and flip back if saving fails). Delete hides the row at once and only deletes
// when the Undo toast closes (5s); if the tab closes first, the item simply survives: the safe failure.
export function useWork(items: Item[]) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [optimistic, flip] = useOptimistic(items, (list, id: string) =>
    list.map((i) => (i.id === id ? { ...i, doneAt: i.doneAt ? null : new Date().toISOString() } : i)),
  );
  const shown = optimistic.filter((i) => !hidden.has(i.id));

  // Returns the list as it will look, so callers can react (e.g. "week cleared").
  const toggle = (id: string) => {
    const nowDone = !shown.find((i) => i.id === id)?.doneAt;
    setChecked((s) => new Set(s).add(id));
    startTransition(async () => {
      flip(id);
      const r = await setDone(id, nowDone);
      if (r.error) toast.error(r.error);
    });
    return shown.map((i) => (i.id === id ? { ...i, doneAt: nowDone ? "x" : null } : i));
  };

  const remove = (item: Item) => {
    const show = (on: boolean) =>
      setHidden((s) => {
        const n = new Set(s);
        if (on) n.delete(item.id);
        else n.add(item.id);
        return n;
      });
    let settled = false;
    const commit = async () => {
      if (settled) return;
      settled = true;
      const r = await deleteItem(item.id);
      if (r.error) {
        toast.error(r.error);
        show(true);
      }
    };
    show(false);
    toast(`Deleted "${item.title}"`, {
      action: {
        label: "Undo",
        onClick: () => {
          settled = true;
          show(true);
        },
      },
      onAutoClose: commit,
      onDismiss: commit,
    });
  };

  return { shown, checked, toggle, remove };
}

// Graded work shows its score, e.g. 18/20.
export const scoreLabel = (score: number, points?: number | null) =>
  `${+Number(score).toFixed(2)}${points ? `/${+Number(points).toFixed(2)}` : ""}`;

export function when(due: string, now: number) {
  const days = Math.round((Date.parse(due) - now) / DAY);
  if (days < 0) return { label: `${-days}d late`, late: true, soon: false };
  if (days === 0) return { label: "today", late: false, soon: true };
  if (days === 1) return { label: "tmrw", late: false, soon: true };
  return { label: `${days}d`, late: false, soon: false };
}

function headline(open: Item[], now: number) {
  const n = open.filter((i) => Date.parse(i.due) <= endOfWeek(now)).length;
  if (n === 0) return "Nothing due this week."; // the joke lives in the progress block's verdict
  if (n === 1) return "1 thing between you and the weekend.";
  return `${n} things between you and the weekend.`;
}

export function UpNext({
  items,
  now,
  checked,
  onToggle,
  onDelete,
  onAddCourse,
  onOpen,
  title = "Up next",
  limit = 8,
  empty = "Nothing due. Add an assignment with the + in the sidebar, or wait for Canvas sync.",
  className,
}: {
  items: Item[];
  now: number;
  checked: Set<string>; // checked this session: stays visible so a mis-tap can be undone
  onToggle: (id: string) => void;
  onDelete: (item: Item) => void;
  onAddCourse?: () => void; // set when there are no courses yet
  onOpen?: (item: Item) => void; // set: the checkbox completes, the rest of the row opens the item (course page)
  title?: string;
  limit?: number;
  empty?: string;
  className?: string;
}) {
  const [showDone, setShowDone] = useState(false);
  const doneCount = items.filter((i) => i.doneAt).length;
  const open = items
    .filter((i) => showDone || !i.doneAt || checked.has(i.id))
    .sort((a, b) => Date.parse(a.due) - Date.parse(b.due));
  const list = open.slice(0, limit);
  // Without onOpen (Home) the whole row is a <label>, so a click anywhere checks it off.
  const Row = onOpen ? "div" : "label";
  const wrap = (i: Item, body: React.ReactNode) =>
    onOpen ? (
      <button
        type="button"
        onClick={() => onOpen(i)}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 self-stretch rounded-md text-left focus-visible:ring-2 focus-visible:ring-ring"
      >
        {body}
      </button>
    ) : (
      body
    );

  return (
    <Block
      title={title}
      aside={headline(
        items.filter((i) => !i.doneAt),
        now,
      )}
      className={className}
    >
      {list.length === 0 ? (
        <div data-empty className="m-auto flex flex-col items-center gap-3 py-10 text-center text-sm text-muted-foreground">
          {onAddCourse ? (
            <>
              <p>Start with a course. Assignments and exams hang off it.</p>
              <Button onClick={onAddCourse} className="h-11 rounded-full px-5 transition-transform active:scale-[0.97]">
                Add your first course
              </Button>
            </>
          ) : (
            <p>{empty}</p>
          )}
        </div>
      ) : (
        // The list scrolls on its own, so the header and the footer below stay in view in a short widget.
        <ul className="-mx-2 min-h-0 flex-1 overflow-y-auto [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin]">
          {list.map((i) => {
            const done = !!i.doneAt;
            const due = when(i.due, now);
            const status = done ? "done" : due.late ? "destructive" : due.soon ? "warning" : null;
            return (
              <li key={i.id} className="group flex items-center">
                {/* min-w-0: otherwise a long title sets the row's minimum width and pushes the due label and
                    delete button out of the card */}
                <Row className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-accent/60">
                  <Checkbox
                    // a real <button>: a <span> checkbox inside <label> toggles twice on Space
                    nativeButton
                    render={<button type="button" />}
                    checked={done}
                    onCheckedChange={() => onToggle(i.id)}
                    aria-label={i.title}
                    className="size-5 rounded-full transition-transform active:scale-80 data-checked:animate-check-pop data-checked:border-done data-checked:bg-done"
                  />
                  {wrap(
                    i,
                    <>
                      <span className="min-w-0 flex-1">
                        {/* Two lines at most (anywhere: even one unbroken word wraps); the full title is on hover. */}
                        <span
                          title={i.title}
                          className={cn(
                            "line-clamp-2 [overflow-wrap:anywhere] transition-opacity duration-300",
                            done && "opacity-45",
                          )}
                        >
                          <span className="strike" data-done={done || undefined}>
                            {i.title}
                          </span>
                        </span>
                        <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                          <span className="chip truncate rounded-full px-1.5" style={{ "--chip": courseColor(i.hue) } as React.CSSProperties}>
                            {i.course}
                          </span>
                          {/* on the meta line, so a long title can't clip it */}
                          {i.kind === "exam" && (
                            <span className="shrink-0 rounded-full bg-secondary px-1.5 text-secondary-foreground">exam</span>
                          )}
                        </span>
                      </span>
                      <span
                        className={cn(
                          "shrink-0 font-mono text-sm tabular-nums",
                          status ? "chip rounded-full px-1.5" : "text-muted-foreground",
                        )}
                        style={status ? ({ "--chip": `var(--${status})` } as React.CSSProperties) : undefined}
                      >
                        {/* graded work shows its score, e.g. 18/20 */}
                        {i.score != null ? scoreLabel(i.score, i.points) : done ? "done" : due.label}
                      </span>
                    </>,
                  )}
                </Row>
                {/* always visible on touch; appears on hover/focus with a mouse */}
                <button
                  type="button"
                  onClick={() => onDelete(i)}
                  aria-label={`Delete ${i.title}`}
                  className="grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground transition-opacity hover:text-destructive focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {(open.length > list.length || doneCount > 0) && (
        <p className="mt-auto flex items-center justify-between gap-3 pt-4 font-mono text-xs text-muted-foreground">
          {open.length > list.length ? (
            <Link href="/calendar" className="rounded-sm hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
              +{open.length - list.length} more this term →
            </Link>
          ) : (
            <span />
          )}
          {doneCount > 0 && (
            <button
              type="button"
              onClick={() => setShowDone((v) => !v)}
              aria-pressed={showDone}
              className="-m-2 rounded-full p-2 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              {showDone ? "Hide done" : `Show done (${doneCount})`}
            </button>
          )}
        </p>
      )}
    </Block>
  );
}
