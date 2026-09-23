"use client";

import { BookOpen, CalendarClock, FilePlus2, FileUp, Plus } from "lucide-react";
import { Liquid } from "liquid-gooey";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export type CreateKind = "assignment" | "exam" | "course" | "upload";

const ITEMS: { kind: CreateKind; label: string; icon: typeof Plus }[] = [
  { kind: "assignment", label: "Assignment", icon: FilePlus2 },
  { kind: "exam", label: "Exam", icon: CalendarClock },
  { kind: "course", label: "Course", icon: BookOpen },
  { kind: "upload", label: "Upload", icon: FileUp },
];

// Geometry (px): a 40px "+" and 40×144 pills. Closed, each pill shrinks under the "+" so the goo
// hides it; open, they drip out as a column that stays bridged to the "+" (gap < goo blur).
// The Liquid group must contain the whole travel, or the goo filter clips the pills.
const BTN = 40;
const PILL_W = 144;
const GAP = 6;
const STEP = BTN + GAP;
const LAYOUT = {
  // rail: pills to the right of the "+", which sits at the group's top-left
  right: {
    plusX: 0,
    width: BTN + 12 + PILL_W,
    height: ITEMS.length * STEP,
    side: "left-0",
  },
  // phone bar: pills drop below the "+", which sits at the group's top-right
  down: {
    plusX: PILL_W - BTN,
    width: PILL_W,
    height: (ITEMS.length + 1) * STEP + 6,
    side: "right-0",
  },
};
const tucked = (plusX: number) => ({
  x: plusX + BTN / 2 - PILL_W / 2,
  y: 0,
  scale: 0.25,
});
const spot = (i: number, direction: "right" | "down") =>
  direction === "right" ? { x: BTN + 12, y: i * STEP, scale: 1 } : { x: 0, y: (i + 1) * STEP + 6, scale: 1 };

// The gooey plus-menu (liquid-gooey "morph"): replaces the old header Create button.
export function CreateMenu({
  direction,
  open,
  onOpenChange,
  onPick,
}: {
  direction: "right" | "down";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (kind: CreateKind) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const box = LAYOUT[direction];
  const plus = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => {
      // Two copies exist (desktop rail, phone bar); only the visible one decides.
      if (root.current?.offsetParent && !root.current.contains(e.target as Node)) onOpenChange(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || !root.current?.offsetParent) return;
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
    <div ref={root} className="relative z-50 size-10">
      {/* Liquid forces position: relative on itself, so this box does the anchoring. */}
      <div
        className={cn("pointer-events-none absolute top-0", box.side)}
        style={{ width: box.width, height: box.height }}
      >
        <Liquid
          blur={10}
          contrast={20}
          fill="var(--secondary)"
          shadow="0 6px 18px rgb(0 0 0 / 0.18)"
          className="size-full"
        >
          {ITEMS.map(({ kind, label, icon: Icon }, i) => {
            const at = open ? spot(i, direction) : tucked(box.plusX);
            return (
              <Liquid.Item
                key={kind}
                x={at.x}
                y={at.y}
                scale={at.scale}
                transition="smooth"
                delay={open ? i * 35 : (ITEMS.length - i) * 20}
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
                    open ? "pointer-events-auto opacity-100 hover:bg-accent/70" : "opacity-0",
                  )}
                  style={{ width: PILL_W }}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {label}
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
              aria-label={open ? "Close create menu" : "Create"}
              className="pointer-events-auto grid size-10 place-items-center rounded-full transition-transform active:scale-95 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Plus
                className={cn("size-5 transition-transform duration-300 ease-out-quint", open && "rotate-45")}
                aria-hidden="true"
              />
            </button>
          </Liquid.Item>
        </Liquid>
      </div>
    </div>
  );
}
