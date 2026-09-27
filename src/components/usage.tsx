"use client";

import { useEffect, useState } from "react";
import { usageStatus } from "@/app/actions";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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

// Weeks reset Monday 00:00 UTC, so say the local day and time (in the US that's Sunday evening).
const resetDay = (u: Usage) =>
  new Date(u.resets).toLocaleString(undefined, { weekday: "long", hour: "numeric", minute: "2-digit" });

// What's left: the week's allowance, then the daily floor once that's spent.
function remaining(u: Usage) {
  const week = Math.max(u.allowance - u.used, 0);
  const daily = Math.max(u.daily - u.today, 0);
  return { week, daily, left: week || daily, low: week <= u.allowance * 0.2 };
}

const KINDS: { kind: string; label: string; cost: number }[] = [
  { kind: "chat", label: "Questions", cost: 1 },
  { kind: "think", label: "Think harder", cost: 2 },
  { kind: "search", label: "Web search", cost: 2 },
  { kind: "syllabus", label: "Syllabus reading", cost: 2 },
];

function Ring({ value, className }: { value: number; className?: string }) {
  const c = 2 * Math.PI * 7;
  return (
    <svg viewBox="0 0 18 18" aria-hidden="true" className={cn("size-4 -rotate-90", className)}>
      <circle cx="9" cy="9" r="7" fill="none" strokeWidth="2.5" className="stroke-foreground/15" />
      <circle
        cx="9"
        cy="9"
        r="7"
        fill="none"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - Math.min(Math.max(value, 0), 1))}
        className="stroke-current transition-[stroke-dashoffset] duration-500 ease-out motion-reduce:transition-none"
      />
    </svg>
  );
}

// The chat box's credits pill: a ring and what's left; opens the week's details.
export function UsagePill({ busy }: { busy: boolean }) {
  const u = useUsage(busy);
  if (!u) return null;
  const paid = u.plan === "paid";
  const r = remaining(u);
  return (
    // The chat box expands on click; the pill's clicks stay here.
    <span onClick={(e) => e.stopPropagation()} className="contents">
      <Popover>
        <PopoverTrigger
          aria-label={paid ? "Sonnet usage: unlimited" : `${r.left} Sonnet uses left. Show details`}
          className={cn(
            "flex h-9 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium tabular-nums transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring data-popup-open:bg-accent",
            !paid && r.low ? "text-warning" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Ring value={paid ? 1 : r.week ? r.week / u.allowance : r.daily / u.daily} />
          {paid ? "∞" : r.left}
        </PopoverTrigger>
        <PopoverContent side="top" align="end" sideOffset={10} className="w-72 gap-3 rounded-2xl p-4">
          <UsageDetails u={u} />
        </PopoverContent>
      </Popover>
    </span>
  );
}

function UsageDetails({ u }: { u: Usage }) {
  const paid = u.plan === "paid";
  const r = remaining(u);
  const pct = Math.min(u.used / u.allowance, 1) * 100;
  return (
    <>
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-medium">{paid ? "Unlimited Sonnet" : r.week ? `${r.week} of ${u.allowance} left` : `${r.daily} left today`}</p>
        <p className="text-xs text-muted-foreground">{paid ? "Paid plan" : "This week"}</p>
      </div>
      {!paid && (
        <div
          role="meter"
          aria-label="Sonnet uses this week"
          aria-valuemin={0}
          aria-valuemax={u.allowance}
          aria-valuenow={Math.min(u.used, u.allowance)}
          className="h-1.5 overflow-hidden rounded-full bg-accent"
        >
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none",
              r.low ? "bg-warning" : "bg-foreground",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
      <ul className="flex flex-col gap-1.5 text-xs">
        {KINDS.map(({ kind, label, cost }) => (
          <li key={kind} className="flex justify-between gap-3 tabular-nums">
            <span className="text-muted-foreground">
              {label} <span className="opacity-60">· {cost} each</span>
            </span>
            <span>{u.byKind[kind]?.count ?? 0}</span>
          </li>
        ))}
      </ul>
      <p className="border-t border-border pt-3 text-xs text-muted-foreground">
        {paid
          ? "Your plan has no weekly limit."
          : `Refills ${resetDay(u)}. After the week runs out, ${u.daily} uses a day still work. Canvas, calendar, grades and Home search are always free.`}
      </p>
    </>
  );
}

// Settings: the same details, inline.
export function UsageCard() {
  const u = useUsage();
  if (!u) return null;
  return (
    <div className="flex max-w-sm flex-col gap-3 text-sm">
      <UsageDetails u={u} />
    </div>
  );
}
