"use client";
// A list whose hovered row gets a sliding highlight while a preview clip-reveals beside it and drifts with the
// pointer. After Hyperiux Vault's interactive list preview, rebuilt on motion (already here) instead of GSAP.
// Touch screens (no hover) get the plain list: title and text, no preview.

import type { LucideIcon } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion, useSpring } from "motion/react";
import Image from "next/image";
import { useRef, useState, type PointerEvent } from "react";
import { cn } from "@/lib/utils";

export type PreviewItem = { title: string; text: string; icon: LucideIcon; img?: string };

const EASE = [0.22, 1, 0.36, 1] as const;
const DRIFT = 16; // px the preview leans toward the pointer
const spring = { stiffness: 170, damping: 24, mass: 0.6 };

export function InteractiveListPreview({ items, className }: { items: PreviewItem[]; className?: string }) {
  const [active, setActive] = useState<number | null>(null);
  const x = useSpring(0, spring);
  const y = useSpring(0, spring);
  const rowY = useSpring(0, spring); // follows the hovered row's middle
  const item = active == null ? null : items[active];
  const still = useReducedMotion();
  const preview = useRef<HTMLDivElement>(null);

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (still) return;
    const b = e.currentTarget.getBoundingClientRect();
    x.set(((e.clientX - b.left) / b.width - 0.5) * DRIFT);
    y.set(((e.clientY - b.top) / b.height - 0.5) * DRIFT);
  };

  return (
    <div
      onPointerMove={onMove}
      onPointerLeave={() => {
        setActive(null);
        x.set(0);
        y.set(0);
      }}
      className={cn("relative grid gap-10 md:[@media(hover:hover)]:grid-cols-[3fr_2fr]", className)}
    >
      <ul>
        {items.map((f, i) => (
          <li
            key={f.title}
            onPointerEnter={(e) => {
              if (e.pointerType !== "mouse") return;
              const row = e.currentTarget;
              // Centered on the row, but kept within the list's height.
              const half = (preview.current?.offsetHeight ?? 0) / 2;
              const max = (row.parentElement?.offsetHeight ?? 0) - half;
              const to = Math.max(half, Math.min(row.offsetTop + row.offsetHeight / 2, max));
              if (active == null || still) rowY.jump(to);
              else rowY.set(to);
              setActive(i);
            }}
            className="relative isolate flex gap-4 border-b border-border px-4 py-4 last:border-b-0"
          >
            {active === i && (
              <motion.span
                layoutId="list-preview-highlight"
                transition={{ type: "spring", bounce: 0.12, duration: 0.4 }}
                className="absolute inset-0 -z-10 rounded-xl bg-foreground"
              />
            )}
            <f.icon
              aria-hidden="true"
              className={cn(
                "mt-0.5 size-5 shrink-0 text-muted-foreground transition-colors duration-300",
                active === i && "text-background",
              )}
            />
            <div className={cn("min-w-0 transition-colors duration-300", active === i && "text-background")}>
              <p className="font-medium">{f.title}</p>
              <p
                className={cn(
                  "mt-1 text-sm text-pretty text-muted-foreground transition-colors duration-300",
                  active === i && "text-background/70",
                )}
              >
                {f.text}
              </p>
            </div>
          </li>
        ))}
      </ul>

      {/* The preview: decoration only, the row already says it all. Hidden without a mouse. */}
      <div aria-hidden="true" className="pointer-events-none relative hidden md:[@media(hover:hover)]:block">
        <motion.div style={{ x, y: rowY }} className="absolute inset-x-0 top-0 -translate-y-1/2">
          <motion.div ref={preview} style={{ y }} className="relative aspect-[16/10] w-full">
            <AnimatePresence>
              {item && (
                <motion.div
                  key={item.img ?? item.title}
                  // Reduced motion: a plain fade instead of the reveal.
                  initial={still ? { opacity: 0 } : { clipPath: "inset(50% 50% 50% 50% round 16px)" }}
                  animate={{ clipPath: "inset(0% 0% 0% 0% round 16px)", opacity: 1 }}
                  exit={still ? { opacity: 0 } : { clipPath: "inset(50% 50% 50% 50% round 16px)", opacity: 0 }}
                  transition={{ duration: 0.55, ease: EASE }}
                  className="absolute inset-0 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
                >
                  {item.img ? (
                    <Image src={item.img} alt="" fill sizes="480px" className="object-cover object-left-top" />
                  ) : (
                    <div className="grid h-full place-items-center">
                      <item.icon className="size-14 text-muted-foreground" strokeWidth={1.25} />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
