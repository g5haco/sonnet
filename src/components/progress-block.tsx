import { Block } from "@/components/block";
import { cn } from "@/lib/utils";
import { progress, type Item } from "@/lib/progress";
import { termStart, WEEKS } from "@/lib/sample";

function verdict(percent: number, overdue: number) {
  if (percent === 100) return "Fully caught up. Suspicious.";
  if (overdue === 1) return "One thing slipped. Very fixable.";
  if (percent >= 80) return `${overdue} overdue. The rest is on track.`;
  return `${overdue} overdue. Pick the smallest one and start there.`;
}

export function ProgressBlock({ items, now, className }: { items: Item[]; now: number; className?: string }) {
  const p = progress(items, termStart, WEEKS, new Date(now));
  const tallest = Math.max(1, ...p.bars.map((b) => b.total));

  return (
    <Block className={className}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="flex items-baseline font-mono tabular-nums">
            <span className="text-7xl leading-none font-medium tracking-tighter md:text-8xl">
              {p.percent}
            </span>
            <span className="ml-1 text-3xl text-muted-foreground">%</span>
            {p.delta !== 0 && (
              <span className={cn("ml-3 text-sm", p.delta > 0 ? "text-done" : "text-destructive")}>
                {p.delta > 0 ? "+" : ""}
                {p.delta}
              </span>
            )}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">{verdict(p.percent, p.overdue)}</p>
        </div>
        <p className="text-right text-sm text-muted-foreground">
          caught up
          <br />
          <span className="font-mono text-xs">vs last week</span>
        </p>
      </div>

      <div
        role="img"
        aria-label={`Week ${p.current + 1} of ${WEEKS}. ${p.percent}% of work due so far is done.`}
        className="mt-8 flex h-28 items-end gap-[3px] md:h-32 md:gap-1"
      >
        {p.bars.map((b, i) => {
          const past = i < p.current;
          const now = i === p.current;
          const filled = b.total ? b.done / b.total : 1;
          return (
            <div
              key={i}
              title={`Week ${i + 1}: ${b.done} of ${b.total} done`}
              className={cn(
                "relative flex-1 overflow-hidden rounded-full",
                past && filled < 1 ? "bg-destructive/25" : "bg-muted",
              )}
              style={{ height: `${b.total ? 22 + (78 * b.total) / tallest : 10}%` }}
            >
              {(past || now) && (
                <div
                  className={cn(
                    "absolute inset-0 transition-[clip-path] duration-500 ease-spring motion-reduce:transition-none",
                    now ? "bg-brand" : "bg-foreground",
                  )}
                  style={{ clipPath: `inset(${(1 - filled) * 100}% 0 0 0 round 999px)` }}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="relative mt-2 flex justify-between font-mono text-[11px] text-muted-foreground">
        <span>wk 1</span>
        <span
          className="absolute -translate-x-1/2 text-brand"
          style={{ left: `${((p.current + 0.5) / WEEKS) * 100}%` }}
        >
          now
        </span>
        <span>wk {WEEKS}</span>
      </div>
    </Block>
  );
}
