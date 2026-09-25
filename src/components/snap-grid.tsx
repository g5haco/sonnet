"use client";

import { MotionConfig, motion } from "motion/react";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { COLS, resolve, ROW, WIDGETS, type Layout, type WidgetId } from "@/lib/home";
import { cn } from "@/lib/utils";

const GAP = 12; // px between widgets
const STACK = 760; // narrower than this (px), widgets stack in one column in layout order
const SPRING = { type: "spring", stiffness: 520, damping: 44 } as const; // critically damped: no bounce

type Drag = { id: WidgetId; startX: number; startY: number; left: number; top: number; dx: number; dy: number };

// Home's grid: 12 columns across the whole width, widgets at their natural height. In edit mode a widget drags
// anywhere and snaps to a column and row on release; widgets in the way move down. Keyboard: arrow keys.
export function SnapGrid({
  layout,
  onChange,
  editable,
  render,
  controls,
}: {
  layout: Layout;
  onChange: (layout: Layout) => void;
  editable: boolean;
  render: (id: WidgetId) => ReactNode;
  /** Edit controls over a widget; `stacked` = the one-column phone layout. */
  controls: (id: WidgetId, stacked: boolean) => ReactNode;
}) {
  const grid = useRef<HTMLDivElement>(null); // an outer box that never swaps, so its width is always measured
  const [width, setWidth] = useState(0);
  const [rows, setRows] = useState<Partial<Record<WidgetId, number>>>({});
  const [drag, setDrag] = useState<Drag | null>(null);
  const stacked = width > 0 && width < STACK;

  useLayoutEffect(() => {
    const el = grid.current!;
    const observer = new ResizeObserver(() => setWidth(el.getBoundingClientRect().width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Each widget's height in rows, measured from its content. One stable ref callback per widget, so its
  // observer isn't rebuilt on every render (drags render on every pointer move).
  const refs = useRef(new Map<WidgetId, (el: HTMLDivElement | null) => (() => void) | undefined>());
  const measure = (id: WidgetId) => {
    if (!refs.current.has(id)) refs.current.set(id, observe(id));
    return refs.current.get(id)!;
  };
  const observe = (id: WidgetId) => (el: HTMLDivElement | null) => {
    if (!el) return;
    const observer = new ResizeObserver(() => {
      const n = Math.ceil((el.offsetHeight + GAP) / ROW);
      setRows((r) => (r[id] === n ? r : { ...r, [id]: n }));
    });
    observer.observe(el);
    return () => observer.disconnect();
  };

  const col = (width + GAP) / COLS;
  const target = (d: Drag) => ({
    x: Math.round((d.left + d.dx) / col),
    y: Math.max(0, Math.round((d.top + d.dy) / ROW)),
  });
  const moved = (d: Drag | null): Layout =>
    d
      ? layout.map((p) => {
          if (p.id !== d.id) return p;
          const t = target(d);
          return { ...p, x: Math.min(COLS - p.w, Math.max(0, t.x)), y: t.y };
        })
      : layout;
  const placed = resolve(moved(drag), rows, drag?.id);
  const height = Math.max(0, ...placed.map((p) => (p.y + (rows[p.id] ?? 0)) * ROW)) - GAP;
  const ready = width > 0 && layout.every((p) => rows[p.id]);

  const commit = (next: Layout, pinned?: WidgetId) => onChange(resolve(next, rows, pinned));

  return <div ref={grid}>{stacked ? list() : board()}</div>;

  function list() {
    return (
      <ol className="flex flex-col gap-3">
        {[...layout]
          .sort((a, b) => a.y - b.y || a.x - b.x)
          .map((p) => (
            <li key={p.id} className="relative">
              <div ref={measure(p.id)} inert={editable} className={cn(editable && "opacity-60")}>
                {render(p.id)}
              </div>
              {editable && controls(p.id, true)}
            </li>
          ))}
      </ol>
    );
  }

  function board() {
    return (
      <MotionConfig reducedMotion="user">
        <div
          className={cn("relative w-full transition-opacity", !ready && "opacity-0")}
          style={{ height: Math.max(height, 0) + (editable ? 240 : 0) }} // room below to drop into while editing
        >
          {/* Snap guides: the 12 columns. */}
          {editable &&
            Array.from({ length: COLS }, (_, i) => (
              <div
                key={i}
                aria-hidden="true"
                className="absolute inset-y-0 rounded-lg border border-dashed border-foreground/10"
                style={{ left: i * col, width: col - GAP }}
              />
            ))}
          {drag &&
            (() => {
              const p = placed.find((q) => q.id === drag.id)!;
              return (
                <div
                  aria-hidden="true"
                  className="absolute rounded-2xl border-2 border-dashed border-foreground/30 bg-foreground/5"
                  style={{ left: p.x * col, top: p.y * ROW, width: p.w * col - GAP, height: (rows[p.id] ?? 1) * ROW - GAP }}
                />
              );
            })()}
          {placed.map((p) => {
            const dragging = drag?.id === p.id;
            return (
              <motion.div
                key={p.id}
                role="group"
                aria-label={editable ? `${WIDGETS[p.id].label}: drag to move, or use the arrow keys` : undefined}
                tabIndex={editable ? 0 : undefined}
                initial={false}
                animate={{
                  x: dragging ? drag.left + drag.dx : p.x * col,
                  y: dragging ? drag.top + drag.dy : p.y * ROW,
                  scale: dragging ? 1.02 : 1,
                }}
                transition={dragging ? { duration: 0 } : SPRING}
                className={cn(
                  "absolute top-0 left-0 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  editable && "cursor-grab touch-none outline-1 outline-offset-2 outline-foreground/25 outline-dashed select-none",
                  dragging && "z-20 cursor-grabbing shadow-2xl",
                )}
                style={{ width: p.w * col - GAP }}
                onPointerDown={(e) => {
                  if (!editable || e.button !== 0 || (e.target as HTMLElement).closest("button")) return;
                  e.currentTarget.setPointerCapture(e.pointerId);
                  setDrag({ id: p.id, startX: e.clientX, startY: e.clientY, left: p.x * col, top: p.y * ROW, dx: 0, dy: 0 });
                }}
                onPointerMove={(e) => {
                  if (dragging) setDrag({ ...drag, dx: e.clientX - drag.startX, dy: e.clientY - drag.startY });
                }}
                onPointerUp={() => {
                  if (!dragging) return;
                  setDrag(null);
                  if (drag.dx || drag.dy) commit(moved(drag), p.id);
                }}
                onPointerCancel={() => setDrag(null)}
                onKeyDown={(e) => {
                  if (!editable || e.target !== e.currentTarget) return;
                  const dx = e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1 : 0;
                  const dy = e.key === "ArrowUp" ? -8 : e.key === "ArrowDown" ? 8 : 0;
                  if (!dx && !dy) return;
                  e.preventDefault();
                  commit(
                    placed.map((q) =>
                      q.id === p.id ? { ...q, x: Math.min(COLS - q.w, Math.max(0, q.x + dx)), y: Math.max(0, q.y + dy) } : q,
                    ),
                    p.id,
                  );
                }}
              >
                <div ref={measure(p.id)} inert={editable} className={cn("transition-opacity", editable && "opacity-60")}>
                  {render(p.id)}
                </div>
                {editable && controls(p.id, false)}
              </motion.div>
            );
          })}
        </div>
      </MotionConfig>
    );
  }
}
