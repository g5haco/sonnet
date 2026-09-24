"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { animate } from "motion";
import { Block } from "@/components/block";
import { cn } from "@/lib/utils";
import { progress, verdict, type Item } from "@/lib/progress";

// Rolls the number on screen from its old value to the new one. Server HTML shows the real value,
// so nothing animates on load; only changes count.
function Count({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef(value);
  useLayoutEffect(() => {
    const text = ref.current?.firstChild;
    if (!text) return;
    const draw = (v: number) => {
      shown.current = v;
      text.nodeValue = String(Math.round(v));
    };
    draw(shown.current); // React already wrote the new value; put the old one back before the first paint
    // power3.out; reduced motion lands on the final value at once.
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const a = animate(shown.current, value, { duration: still ? 0 : 0.6, ease: [0.165, 0.84, 0.44, 1], onUpdate: draw });
    return () => a.stop();
  }, [value]);
  return <span ref={ref}>{value}</span>;
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
  const inTerm = !!week;
  const cleared = !!week && week.total > 0 && week.done === week.total;
  const wasCleared = useRef(cleared);

  // Week cleared: once the fill lands, the bar flashes like an LED confirming it.
  useEffect(() => {
    const el = nowBar.current;
    if (cleared && !wasCleared.current && el && !matchMedia("(prefers-reduced-motion: reduce)").matches)
      animate(
        el,
        { filter: ["brightness(1)", "brightness(1.9)", "brightness(1)"] },
        { delay: 0.45, duration: 0.82, times: [0, 0.15, 1], ease: "easeOut" },
      );
    wasCleared.current = cleared;
  }, [cleared]);

  return (
    <Block className={cn("@container", className)}>
      {/* Readout on the left, the semester's weekly bars on the right (stacked on phones). */}
      <div className="flex flex-col gap-6 @lg:flex-row @lg:items-end @lg:gap-8">
        <div className="shrink-0 @lg:w-52">
          <p className="flex items-baseline font-mono tabular-nums">
            <span className="text-7xl leading-none font-medium tracking-tighter">
              <Count value={p.percent} />
            </span>
            <span className="ml-1 text-3xl text-muted-foreground">%</span>
          </p>
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            of due work done
            {p.delta !== 0 && (
              <span className={p.delta > 0 ? "text-done" : "text-destructive"}>
                {" · "}
                {p.delta > 0 ? "+" : "−"}
                <Count value={Math.abs(p.delta)} /> vs last week
              </span>
            )}
          </p>
          <p className="mt-3 text-sm text-pretty [overflow-wrap:anywhere]">{verdict(p)}</p>
        </div>

        <div className="min-w-0 flex-1">
          <div
            role="img"
            aria-label={`Week ${p.current + 1} of ${weeks}. ${p.percent}% of work due so far is done.`}
            className="flex h-24 items-end gap-[3px] @lg:h-28 @lg:gap-1"
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
          {/* "now" sits under its bar; each edge label shows only if its side has room (container query),
              so they never overlap at any width. */}
          <div className="mt-2 flex font-mono text-xs text-muted-foreground">
            <span
              className={cn("@container", !inTerm && "flex-1")}
              style={inTerm ? { width: `calc(${((p.current + 0.5) / weeks) * 100}% - 1.5ch)` } : undefined}
            >
              {/* label width plus a 1ch gap */}
              <span className="hidden @min-[5ch]:inline">wk 1</span>
            </span>
            {inTerm && <span className="w-[3ch] shrink-0 text-center text-brand">now</span>}
            <span className="@container flex-1 text-right">
              {weeks > 1 && <span className="hidden @min-[6ch]:inline">wk {weeks}</span>}
            </span>
          </div>
        </div>
      </div>
    </Block>
  );
}
