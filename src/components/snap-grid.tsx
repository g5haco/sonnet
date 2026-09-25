"use client";

import { MotionConfig, motion } from "motion/react";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { COLS, fits, ROWS, WIDGETS, type Layout, type Place, type WidgetId } from "@/lib/home";
import { cn } from "@/lib/utils";

const GAP = 12; // px between cells
const STACK = 760; // narrower than this (px), widgets stack in one column in layout order
const SPRING = { type: "spring", stiffness: 520, damping: 44 } as const; // critically damped: no bounce

type Drag = { id: WidgetId; mode: "move" | "size"; startX: number; startY: number; dx: number; dy: number };

// Home's grid: COLS × ROWS square cells, as big as the space allows, so it always fits the screen. In edit mode a
// widget drags to any free cells, and its bottom-right corner resizes it; both snap to cells on release, and a
// spot that's taken or off the grid springs back. Keyboard: arrows move, Shift + arrows resize.
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
  controls: (id: WidgetId) => ReactNode; // edit controls over a widget (remove)
}) {
  const box = useRef<HTMLDivElement>(null); // the space to fill
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [drag, setDrag] = useState<Drag | null>(null);
  const stacked = size.w > 0 && size.w < STACK;

  useLayoutEffect(() => {
    const el = box.current!;
    const observer = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setSize({ w: r.width, h: r.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [stacked]); // the stacked list and the grid use different boxes

  const step = Math.max(0, Math.min((size.w + GAP) / COLS, (size.h + GAP) / ROWS)); // one cell plus its gap
  const px = (n: number) => n * step - GAP; // n cells across, in px

  // Where the dragged widget would land, snapped to cells.
  const target = (d: Drag): Place => {
    const p = layout.find((q) => q.id === d.id)!;
    const cells = (v: number) => Math.round(v / step);
    return d.mode === "move"
      ? { ...p, x: p.x + cells(d.dx), y: p.y + cells(d.dy) }
      : { ...p, w: Math.max(1, p.w + cells(d.dx)), h: Math.max(1, p.h + cells(d.dy)) };
  };
  const drop = drag && target(drag);
  const ok = drop ? fits(layout, drop) : false;
  const commit = (p: Place) => {
    if (fits(layout, p)) onChange(layout.map((q) => (q.id === p.id ? p : q)));
  };

  const pointer = (id: WidgetId, mode: Drag["mode"]) => ({
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      if (!editable || e.button !== 0 || (mode === "move" && (e.target as HTMLElement).closest("button"))) return;
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      setDrag({ id, mode, startX: e.clientX, startY: e.clientY, dx: 0, dy: 0 });
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (drag?.id === id && drag.mode === mode)
        setDrag({ ...drag, dx: e.clientX - drag.startX, dy: e.clientY - drag.startY });
    },
    onPointerUp: (e: React.PointerEvent) => {
      if (drag?.id !== id || drag.mode !== mode) return;
      e.stopPropagation();
      setDrag(null);
      commit(target(drag));
    },
    onPointerCancel: () => setDrag(null),
  });

  if (stacked)
    return (
      <div ref={box}>
        <ol className="flex flex-col gap-3">
          {[...layout]
            .sort((a, b) => a.y - b.y || a.x - b.x)
            .map((p) => (
              <li key={p.id} className="relative">
                <div inert={editable} className={cn(editable && "opacity-60")}>
                  {render(p.id)}
                </div>
                {editable && controls(p.id)}
              </li>
            ))}
        </ol>
      </div>
    );

  return (
    <div ref={box} className="min-h-0 flex-1">
      <MotionConfig reducedMotion="user">
        <div className={cn("relative", !step && "opacity-0")} style={{ width: px(COLS), height: px(ROWS) }}>
          {/* Snap guides: every cell. */}
          {editable &&
            Array.from({ length: COLS * ROWS }, (_, i) => (
              <div
                key={i}
                aria-hidden="true"
                className="absolute rounded-xl border border-dashed border-foreground/10"
                style={{ left: (i % COLS) * step, top: Math.floor(i / COLS) * step, width: px(1), height: px(1) }}
              />
            ))}
          {drop && (
            <div
              aria-hidden="true"
              className={cn(
                "absolute rounded-2xl border-2 border-dashed",
                ok ? "border-foreground/40 bg-foreground/5" : "border-destructive/60 bg-destructive/10",
              )}
              style={{ left: drop.x * step, top: drop.y * step, width: px(drop.w), height: px(drop.h) }}
            />
          )}
          {/* Widgets appear once the grid is measured, so they start in place instead of growing from 0. */}
          {!!step && layout.map((p) => {
            const d = drag?.id === p.id ? drag : null;
            const moving = d?.mode === "move";
            const sizing = d?.mode === "size";
            return (
              <motion.div
                key={p.id}
                role="group"
                aria-label={
                  editable ? `${WIDGETS[p.id].label}: drag to move; arrow keys move, Shift + arrow keys resize` : undefined
                }
                tabIndex={editable ? 0 : undefined}
                initial={false}
                animate={{
                  x: p.x * step + (moving ? d.dx : 0),
                  y: p.y * step + (moving ? d.dy : 0),
                  width: Math.max(px(1), px(p.w) + (sizing ? d.dx : 0)),
                  height: Math.max(px(1), px(p.h) + (sizing ? d.dy : 0)),
                }}
                transition={d ? { duration: 0 } : SPRING}
                className={cn(
                  "absolute top-0 left-0 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  editable &&
                    "cursor-grab touch-none outline-1 outline-offset-2 outline-foreground/25 outline-dashed select-none",
                  d && "z-20 shadow-2xl",
                  moving && "cursor-grabbing",
                )}
                {...pointer(p.id, "move")}
                onKeyDown={(e) => {
                  if (!editable || e.target !== e.currentTarget) return;
                  const dx = e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1 : 0;
                  const dy = e.key === "ArrowUp" ? -1 : e.key === "ArrowDown" ? 1 : 0;
                  if (!dx && !dy) return;
                  e.preventDefault();
                  commit(e.shiftKey ? { ...p, w: p.w + dx, h: p.h + dy } : { ...p, x: p.x + dx, y: p.y + dy });
                }}
              >
                {/* Fixed size: content that's taller scrolls inside the widget. */}
                <div
                  inert={editable}
                  className={cn(
                    "h-full overflow-hidden rounded-2xl transition-opacity *:h-full *:overflow-x-hidden *:overflow-y-auto *:[scrollbar-color:var(--border)_transparent] *:[scrollbar-width:thin]",
                    editable && "opacity-60",
                  )}
                >
                  {render(p.id)}
                </div>
                {editable && (
                  <>
                    {controls(p.id)}
                    <span
                      aria-hidden="true"
                      title="Drag to resize"
                      className="absolute right-1 bottom-1 z-10 grid size-7 cursor-nwse-resize touch-none place-items-center rounded-full bg-foreground text-background shadow-sm"
                      {...pointer(p.id, "size")}
                    >
                      <svg viewBox="0 0 10 10" className="size-3" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M9 3 3 9M9 6 6 9" strokeLinecap="round" />
                      </svg>
                    </span>
                  </>
                )}
              </motion.div>
            );
          })}
        </div>
      </MotionConfig>
    </div>
  );
}
