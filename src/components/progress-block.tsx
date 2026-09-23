"use client";

import { useRef } from "react";
import { Block } from "@/components/block";
import { gsap, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import { progress, type Item } from "@/lib/progress";

// Rolls the number on screen from its old value to the new one. Server HTML shows the real value,
// so nothing animates on load; only changes count.
function Count({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef({ v: value });
  useGSAP(
    () => {
      const text = ref.current?.firstChild;
      if (!text) return;
      const draw = () => (text.nodeValue = String(Math.round(shown.current.v)));
      draw(); // React already wrote the new value; put the old one back before the first paint
      gsap.to(shown.current, { v: value, duration: 0.6, ease: "power3.out", overwrite: true, onUpdate: draw });
    },
    { dependencies: [value] },
  );
  return <span ref={ref}>{value}</span>;
}

function verdict(percent: number, overdue: number) {
  if (percent === 100) return "Fully caught up. Suspicious.";
  if (overdue === 1) return "One thing slipped. Very fixable.";
  if (percent >= 80) return `${overdue} overdue. The rest is on track.`;
  return `${overdue} overdue. Pick the smallest one and start there.`;
}

export function ProgressBlock({
  items,
  now,
  termStart,
  weeks,
  className,
}: {
  items: Item[];
  now: number;
  termStart: Date;
  weeks: number;
  className?: string;
}) {
  const p = progress(items, termStart, weeks, new Date(now));
  const tallest = Math.max(1, ...p.bars.map((b) => b.total));
  const nowBar = useRef<HTMLDivElement>(null);
  const week = p.bars[p.current]; // undefined before week 1 or after the last week
  const cleared = !!week && week.total > 0 && week.done === week.total;
  const wasCleared = useRef(cleared);

  // Week cleared: once the fill lands, the bar flashes like an LED confirming it.
  useGSAP(
    () => {
      if (cleared && !wasCleared.current && nowBar.current) {
        gsap
          .timeline({ delay: 0.45 })
          .to(nowBar.current, { filter: "brightness(1.9)", duration: 0.12, ease: "power2.out" })
          .to(nowBar.current, { filter: "brightness(1)", duration: 0.7, ease: "power2.out" });
      }
      wasCleared.current = cleared;
    },
    { dependencies: [cleared] },
  );

  return (
    <Block className={className}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="flex items-baseline font-mono tabular-nums">
            <span className="text-7xl leading-none font-medium tracking-tighter md:text-8xl">
              <Count value={p.percent} />
            </span>
            <span className="ml-1 text-3xl text-muted-foreground">%</span>
          </p>
          <p className="mt-3 text-sm text-muted-foreground">{verdict(p.percent, p.overdue)}</p>
        </div>
        <p className="text-right text-sm text-muted-foreground">
          caught up
          {p.delta !== 0 && (
            <span className={cn("block font-mono text-xs", p.delta > 0 ? "text-done" : "text-destructive")}>
              {p.delta > 0 ? "+" : "−"}
              <Count value={Math.abs(p.delta)} /> vs last week
            </span>
          )}
        </p>
      </div>

      <div
        role="img"
        aria-label={`Week ${p.current + 1} of ${weeks}. ${p.percent}% of work due so far is done.`}
        className="mt-8 flex h-28 items-end gap-[3px] md:h-32 md:gap-1"
      >
        {p.bars.map((b, i) => {
          const past = i < p.current;
          const now = i === p.current;
          const filled = b.total ? b.done / b.total : 0;
          return (
            <div
              key={i}
              title={`Week ${i + 1}: ${b.done} of ${b.total} done`}
              className={cn(
                "relative flex-1 overflow-hidden rounded-full",
                past && filled < 1 ? "bg-destructive/25" : "bg-muted-foreground/20",
              )}
              style={{ height: `${b.total ? 22 + (78 * b.total) / tallest : 10}%` }}
            >
              {(past || now) && b.total > 0 && (
                <div
                  ref={now ? nowBar : undefined}
                  className={cn(
                    "absolute inset-0 transition-[clip-path] duration-500 ease-out-quint motion-reduce:transition-none",
                    now ? "bg-brand" : "bg-foreground",
                  )}
                  style={{ clipPath: `inset(${(1 - filled) * 100}% 0 0 0 round 999px)` }}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="relative mt-2 flex justify-between font-mono text-xs text-muted-foreground">
        <span>wk 1</span>
        <span
          className="absolute -translate-x-1/2 text-brand"
          style={{ left: `${((p.current + 0.5) / weeks) * 100}%` }}
        >
          now
        </span>
        <span>wk {weeks}</span>
      </div>
    </Block>
  );
}
