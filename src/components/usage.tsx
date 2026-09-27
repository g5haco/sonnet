"use client";

import { useEffect, useState } from "react";
import { usageStatus } from "@/app/actions";
import { cn } from "@/lib/utils";

type Usage = NonNullable<Awaited<ReturnType<typeof usageStatus>>>;

// Refetches whenever `key` changes (the chat passes its busy flag, so the count updates after each answer).
export function useUsage(key?: unknown) {
  const [usage, setUsage] = useState<Usage | null>(null);
  useEffect(() => {
    let live = true;
    usageStatus()
      .then((u) => live && setUsage(u))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [key]);
  return usage;
}

const resetDay = (u: Usage) => new Date(u.resets).toLocaleDateString(undefined, { weekday: "long" });

function describe(u: Usage) {
  const left = Math.max(u.allowance - u.used, 0);
  if (left > 0) return { left, text: `${left} of ${u.allowance} Sonnet uses left this week` };
  const daily = Math.max(u.daily - u.today, 0);
  return {
    left,
    text: daily
      ? `Week's uses spent: ${daily} left today, full refill ${resetDay(u)}`
      : `Out of uses for today. Refills tomorrow, fully on ${resetDay(u)}`,
  };
}

// One quiet line under the chat box. Paid plans don't see it; free users see it turn amber near the end.
export function UsageLine({ busy }: { busy: boolean }) {
  const u = useUsage(busy);
  if (!u || u.plan === "paid") return null;
  const { left, text } = describe(u);
  return (
    <p
      aria-live="polite"
      className={cn(
        "px-3 pt-1.5 text-right text-xs tabular-nums",
        left <= u.allowance * 0.2 ? "text-warning" : "text-muted-foreground",
      )}
    >
      {text}
    </p>
  );
}

// Settings: the meter, what counts, and when it refills.
export function UsageCard() {
  const u = useUsage();
  if (!u) return null;
  if (u.plan === "paid") return <p className="text-sm text-muted-foreground">Unlimited Sonnet on your plan.</p>;
  const { text } = describe(u);
  const pct = Math.min(u.used / u.allowance, 1) * 100;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm tabular-nums">{text}</p>
      <div
        role="meter"
        aria-label="Sonnet uses this week"
        aria-valuemin={0}
        aria-valuemax={u.allowance}
        aria-valuenow={Math.min(u.used, u.allowance)}
        className="h-1.5 overflow-hidden rounded-full bg-accent"
      >
        <div
          className={cn("h-full rounded-full transition-[width] duration-500", pct >= 80 ? "bg-warning" : "bg-foreground")}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        A question is 1, Think harder or web search 2, reading a syllabus 5. Canvas, calendar, grades and Home search
        are free. Refills {resetDay(u)}; after that runs out, {u.daily} uses a day still work.
      </p>
    </div>
  );
}
