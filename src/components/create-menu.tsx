"use client";

import { BookOpen, CalendarClock, FilePlus2, FileUp, Plus } from "lucide-react";
import { Liquid } from "liquid-gooey";
import { useEffect, useRef } from "react";
import { cn, isShown } from "@/lib/utils";

export type CreateKind = "assignment" | "exam" | "course" | "upload";
export type MenuItem<K extends string> = { kind: K; label: string; icon: typeof Plus };

const ITEMS: MenuItem<CreateKind>[] = [
  { kind: "assignment", label: "Assignment", icon: FilePlus2 },
  { kind: "exam", label: "Exam", icon: CalendarClock },
  { kind: "course", label: "Course", icon: BookOpen },
  { kind: "upload", label: "Upload", icon: FileUp },
];

// Geometry (px): a 40px "+" (or a labelled "+ Add" pill) and 40×144 pills. Closed, each pill shrinks under
// the trigger so the goo hides it; open, they drip out as a column that stays bridged to it (gap < goo blur).
// The Liquid group must contain the whole travel, or the goo filter clips the pills.
const BTN = 40;
const LABELLED = 88; // "+ Add"
const PILL_W = 144;
const GAP = 6;
const STEP = BTN + GAP;

// The gooey plus-menu (liquid-gooey "morph"): the sidebar's Create, and the calendar's Add.
export function CreateMenu<K extends string = CreateKind>({
  direction,
  open,
  onOpenChange,
  onPick,
  items = ITEMS as MenuItem<K>[],
  label,
  tone = "secondary",
}: {
  direction: "right" | "down";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (kind: K) => void;
  items?: MenuItem<K>[];
  label?: string; // shows "+ label" instead of a bare "+"
  tone?: "secondary" | "primary";
}) {
  const root = useRef<HTMLDivElement>(null);
  const plus = useRef<HTMLButtonElement>(null);
  const trigger = label ? LABELLED : BTN;
  // rail: pills to the right of the trigger (top-left of the group); down: below it (top-right of the group)
  const box =
    direction === "right"
      ? { plusX: 0, width: trigger + 12 + PILL_W, height: items.length * STEP, side: "left-0" }
      : { plusX: PILL_W - trigger, width: PILL_W, height: (items.length + 1) * STEP + 6, side: "right-0" };
  const tucked = { x: box.plusX + trigger / 2 - PILL_W / 2, y: 0, scale: 0.25 };
  const spot = (i: number) =>
    direction === "right" ? { x: trigger + 12, y: i * STEP, scale: 1 } : { x: 0, y: (i + 1) * STEP + 6, scale: 1 };

  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => {
      // Two copies exist (desktop rail, phone bar); only the visible one decides.
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
    <div ref={root} className="relative z-50 h-10" style={{ width: trigger }}>
      {/* Liquid forces position: relative on itself, so this box does the anchoring. */}
      <div
        className={cn("pointer-events-none absolute top-0", box.side)}
        style={{ width: box.width, height: box.height }}
      >
        <Liquid
          blur={10}
          contrast={20}
          fill={tone === "primary" ? "var(--primary)" : "var(--secondary)"}
          shadow="0 6px 18px rgb(0 0 0 / 0.18)"
          className={cn("size-full", tone === "primary" && "text-primary-foreground")}
        >
          {items.map(({ kind, label: text, icon: Icon }, i) => {
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
                  onClick={() => {
                    onOpenChange(false);
                    onPick(kind);
                  }}
                  className={cn(
                    "flex h-10 items-center gap-2.5 rounded-full px-4 text-sm font-medium transition-opacity duration-150 focus-visible:ring-2 focus-visible:ring-ring",
                    open ? "pointer-events-auto opacity-100" : "opacity-0",
                    open && (tone === "primary" ? "hover:bg-primary-foreground/15" : "hover:bg-accent/70"),
                  )}
                  style={{ width: PILL_W }}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {text}
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
              aria-label={label ? undefined : open ? "Close create menu" : "Create"}
              className="pointer-events-auto flex h-10 items-center justify-center gap-1.5 rounded-full text-sm font-medium transition-transform active:scale-95 focus-visible:ring-2 focus-visible:ring-ring"
              style={{ width: trigger }}
            >
              <Plus
                className={cn("size-5 transition-transform duration-300 ease-out-quint", open && "rotate-45")}
                aria-hidden="true"
              />
              {label}
            </button>
          </Liquid.Item>
        </Liquid>
      </div>
    </div>
  );
}
