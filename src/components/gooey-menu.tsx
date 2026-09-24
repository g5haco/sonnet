"use client";

import { BookOpen, CalendarClock, Check, ChevronDown, FilePlus2, FileUp, Plus } from "lucide-react";
import { Liquid } from "liquid-gooey";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn, isShown } from "@/lib/utils";

export type CreateKind = "assignment" | "exam" | "course" | "upload";
// A pill in the menu: an icon, or a color dot (e.g. a course).
export type MenuItem<K extends string> = { kind: K; label: string; icon?: typeof Plus; color?: string };

const CREATE: MenuItem<CreateKind>[] = [
  { kind: "assignment", label: "Assignment", icon: FilePlus2 },
  { kind: "exam", label: "Exam", icon: CalendarClock },
  { kind: "course", label: "Course", icon: BookOpen },
  { kind: "upload", label: "Upload", icon: FileUp },
];

// Geometry (px): a 40px trigger ("+", or a labelled pill measured at runtime) and 40px-tall pills. Closed,
// each pill shrinks under the trigger so the goo hides it; opening, they drip out bridged while they still
// overlap, then settle apart as separate pills: GAP is 2x the goo blur, past where the goo can span (~1.6x),
// so the resting menu reads as distinct controls. The Liquid group must contain the whole travel, or the
// filter clips pills.
const BTN = 40;
const PILL_W = 144;
const BLUR = 8;
const GAP = 2 * BLUR;
const STEP = BTN + GAP;

// The gooey menu (liquid-gooey "morph"): the sidebar's Create, the Add buttons on
// the calendar and course pages, and the Chat page's course picker. `direction`: "right" of the trigger
// (sidebar rail), "down" under a right-aligned trigger (page headers), "below" under a left-aligned one.
export function GooeyMenu<K extends string = CreateKind>({
  direction,
  open,
  onOpenChange,
  onPick,
  items = CREATE as MenuItem<K>[],
  label,
  dot,
  chevron,
  mono,
  selected,
  tone = "secondary",
}: {
  direction: "right" | "down" | "below";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (kind: K) => void;
  items?: MenuItem<K>[];
  label?: string; // a labelled trigger ("+ Add", "All courses") instead of a bare "+"
  dot?: string; // a color dot on the trigger (the picked course)
  chevron?: boolean; // a picker: chevron instead of "+", and a check on the `selected` pill
  mono?: boolean; // course codes read better in mono
  selected?: K;
  tone?: "secondary" | "primary";
}) {
  const root = useRef<HTMLDivElement>(null);
  const plus = useRef<HTMLButtonElement>(null);
  const [measured, setMeasured] = useState(88);
  const trigger = label ? measured : BTN;
  const pill = Math.max(chevron ? 176 : PILL_W, direction === "right" ? 0 : trigger); // pickers carry a check mark
  const box =
    direction === "right"
      ? { plusX: 0, width: trigger + GAP + pill, height: Math.max(items.length * STEP, BTN), side: "left-0" }
      : {
          plusX: direction === "down" ? pill - trigger : 0,
          width: pill,
          height: (items.length + 1) * STEP,
          side: direction === "down" ? "right-0" : "left-0",
        };
  const tucked = { x: box.plusX + trigger / 2 - pill / 2, y: 0, scale: 0.25 };
  const spot = (i: number) =>
    direction === "right" ? { x: trigger + GAP, y: i * STEP, scale: 1 } : { x: 0, y: (i + 1) * STEP, scale: 1 };

  // A labelled trigger sizes to its text; the goo geometry follows the measured width.
  useLayoutEffect(() => {
    const el = plus.current;
    if (!label || !el) return;
    const fit = () => setMeasured(el.offsetWidth);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [label]);

  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => {
      // Two copies can exist (desktop rail, phone bar); only the visible one decides.
      if (isShown(root.current) && !root.current?.contains(e.target as Node)) onOpenChange(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || !isShown(root.current)) return;
      onOpenChange(false);
      plus.current?.focus();
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open, onOpenChange]);

  return (
    // Above everything only while open, so a closed picker never covers the expanding sidebar.
    <div ref={root} className={cn("relative h-10", open ? "z-50" : "z-10")} style={{ width: trigger }}>
      {/* Liquid forces position: relative on itself, so this box does the anchoring. */}
      <div
        className={cn("pointer-events-none absolute top-0", box.side)}
        style={{ width: box.width, height: box.height }}
      >
        <Liquid
          blur={BLUR}
          contrast={20}
          fill={tone === "primary" ? "var(--primary)" : "var(--secondary)"}
          shadow="0 6px 18px rgb(0 0 0 / 0.18)"
          className={cn("size-full", tone === "primary" && "text-primary-foreground")}
        >
          {items.map(({ kind, label: text, icon: Icon, color }, i) => {
            const at = open ? spot(i) : tucked;
            return (
              <Liquid.Item
                key={kind}
                x={at.x}
                y={at.y}
                scale={at.scale}
                transition="smooth"
                delay={open ? i * 35 : (items.length - i) * 20}
                style={{ position: "absolute", top: 0, left: 0 }}
              >
                <button
                  type="button"
                  tabIndex={open ? 0 : -1}
                  aria-hidden={!open}
                  aria-current={chevron && kind === selected ? "true" : undefined}
                  onClick={() => {
                    onOpenChange(false);
                    onPick(kind);
                  }}
                  className={cn(
                    "flex h-10 items-center gap-2.5 rounded-full px-4 text-sm font-medium transition-opacity duration-150 focus-visible:ring-2 focus-visible:ring-ring",
                    open ? "pointer-events-auto opacity-100" : "opacity-0",
                    open && (tone === "primary" ? "hover:bg-primary-foreground/15" : "hover:bg-accent/70"),
                  )}
                  style={{ width: pill }}
                >
                  {Icon && <Icon className="size-4 shrink-0" aria-hidden="true" />}
                  {color !== undefined && (
                    <span className="size-2.5 shrink-0 rounded-full" style={{ background: color }} aria-hidden="true" />
                  )}
                  <span className={cn("min-w-0 flex-1 truncate text-left", mono && "font-mono text-xs")}>{text}</span>
                  {chevron && kind === selected && <Check className="size-4 shrink-0" aria-hidden="true" />}
                </button>
              </Liquid.Item>
            );
          })}
          {/* last, so it paints above the tucked pills */}
          <Liquid.Item x={0} y={0} style={{ position: "absolute", top: 0, left: box.plusX }}>
            <button
              ref={plus}
              type="button"
              onClick={() => onOpenChange(!open)}
              aria-expanded={open}
              aria-haspopup="menu"
              aria-label={label ? undefined : open ? "Close create menu" : "Create"}
              className={cn(
                "pointer-events-auto flex h-10 items-center justify-center gap-2 rounded-full text-sm font-medium whitespace-nowrap transition-transform active:scale-95 focus-visible:ring-2 focus-visible:ring-ring",
                label ? "px-4" : "w-10",
                mono && "font-mono text-xs",
              )}
            >
              {dot && (
                <span className="size-2.5 shrink-0 rounded-full" style={{ background: dot }} aria-hidden="true" />
              )}
              {!chevron && (
                <Plus
                  className={cn("size-5 transition-transform duration-300 ease-out-quint", open && "rotate-45")}
                  aria-hidden="true"
                />
              )}
              {label}
              {chevron && (
                <ChevronDown
                  className={cn("size-4 transition-transform duration-300 ease-out-quint", open && "rotate-180")}
                  aria-hidden="true"
                />
              )}
            </button>
          </Liquid.Item>
        </Liquid>
      </div>
    </div>
  );
}
