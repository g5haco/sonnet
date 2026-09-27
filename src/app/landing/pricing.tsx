"use client";

import { CircleCheck, Sparkles, User } from "lucide-react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Prices = { monthly: number; yearly: number };

// Pro's price, hidden (null) until 1-2 weeks of ai_usage cost data say what it must be (AI cost under ~30% of it).
// Set it, e.g. { monthly: 12, yearly: 115 }, and the Monthly/Annual switch and the discount animation appear.
const PRO: Prices | null = null;

const FREE = [
  "40 AI uses a week, and 3 a day after that",
  "Sonnet reads your syllabus, slides and readings",
  "Canvas sync and the Google Calendar feed",
  "Calendar, grades and what-if",
  "Flashcards with share links",
  "Focus timer, study days and streaks",
];
const PAID = [
  "Everything in Free",
  "Unlimited AI, no weekly allowance",
  "Stronger AI for Think harder and syllabus reading",
  "First in line when Sonnet is busy",
];

const card = "relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-7 shadow-lg";
const button =
  "flex h-11 w-full items-center justify-center rounded-xl text-sm font-medium transition-opacity focus-visible:ring-2 focus-visible:ring-ring";
const EASE = [0.23, 1, 0.32, 1] as const; // strong ease-out

const saving = (p: Prices) => Math.round((1 - p.yearly / (p.monthly * 12)) * 100);

function Features({ items }: { items: string[] }) {
  return (
    <ul className="mt-6 space-y-3 border-t border-border pt-6 text-sm">
      {items.map((f) => (
        <li key={f} className="flex gap-2.5">
          <CircleCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          {f}
        </li>
      ))}
    </ul>
  );
}

function Price({ amount, children }: { amount: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mt-8 min-h-28">
      <div className="flex items-end gap-1 font-semibold">{amount}</div>
      <div className="mt-2 text-sm">{children}</div>
    </div>
  );
}

// Annual: the monthly price gets struck through, a "save" tag pops in, and the discounted number rolls in.
function ProAmount({ prices, yearly }: { prices: Prices; yearly: boolean }) {
  const now = yearly ? Math.round((prices.yearly / 12) * 100) / 100 : prices.monthly;
  return (
    <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
      <span className="flex items-start gap-1">
        <span className="mt-2 text-xl text-muted-foreground">$</span>
        {/* The number rolls: the old one leaves upward, the new one rises in. */}
        <span className="relative inline-grid overflow-hidden font-heading text-6xl leading-[1.15] tabular-nums">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={now}
              initial={{ transform: "translateY(60%)", opacity: 0, filter: "blur(4px)" }}
              animate={{
                transform: "translateY(0%)",
                opacity: 1,
                filter: "blur(0px)",
                transition: { duration: 0.45, ease: EASE, delay: yearly ? 0.2 : 0 },
              }}
              exit={{ transform: "translateY(-60%)", opacity: 0, filter: "blur(4px)", transition: { duration: 0.25, ease: EASE } }}
            >
              {now}
            </motion.span>
          </AnimatePresence>
        </span>
      </span>
      <AnimatePresence initial={false}>
        {yearly && (
          <motion.span
            key="was"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            className="mb-2.5 flex items-center gap-2"
          >
            <span className="relative font-heading text-2xl text-muted-foreground tabular-nums">
              ${prices.monthly}
              <span className="sr-only"> before</span>
              {/* the strike draws left to right */}
              <motion.span
                aria-hidden="true"
                initial={{ transform: "rotate(-8deg) scaleX(0)" }}
                animate={{ transform: "rotate(-8deg) scaleX(1)", transition: { duration: 0.3, ease: EASE } }}
                className="absolute inset-x-[-3px] top-1/2 h-0.5 origin-left rounded-full bg-foreground/70"
              />
            </span>
            <motion.span
              initial={{ transform: "scale(0.9)", opacity: 0 }}
              animate={{ transform: "scale(1)", opacity: 1, transition: { type: "spring", bounce: 0.35, duration: 0.4, delay: 0.3 } }}
              className="rounded-full bg-done/15 px-2 py-0.5 font-mono text-xs font-medium text-done"
            >
              save {saving(prices)}%
            </motion.span>
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

// Monthly / Annual: a sliding thumb; the annual side carries its saving.
function BillingSwitch({ yearly, onChange, save }: { yearly: boolean; onChange: (y: boolean) => void; save: number }) {
  return (
    <div role="radiogroup" aria-label="Billing" className="mx-auto mt-8 grid w-fit grid-cols-2 rounded-full bg-secondary p-1 ring-1 ring-border">
      {[false, true].map((on) => {
        const active = yearly === on;
        return (
          <button
            key={String(on)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(on)}
            className="group relative isolate flex h-11 items-center justify-center gap-1.5 rounded-full px-6 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {active && (
              <motion.span
                layoutId="billing-thumb"
                transition={{ type: "spring", bounce: 0.15, duration: 0.45 }}
                className="absolute inset-0 -z-10 rounded-full bg-foreground shadow-md"
              />
            )}
            <span className={cn("transition-colors duration-200", active ? "text-background" : "text-muted-foreground group-hover:text-foreground")}>
              {on ? "Annual" : "Monthly"}
            </span>
            {on && (
              <span className={cn("whitespace-nowrap font-normal transition-colors duration-200", active ? "text-background/60" : "text-done")}>
                (Save {save}%)
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// `prices`: for previews only; the page uses PRO.
export function Pricing({ signUp, prices = PRO }: { signUp: string; prices?: Prices | null }) {
  const [yearly, setYearly] = useState(false);

  return (
    <MotionConfig reducedMotion="user">
      {prices && <BillingSwitch yearly={yearly} onChange={setYearly} save={saving(prices)} />}

      <div className="relative isolate mt-8 grid gap-5 md:grid-cols-2">
        <div className={card}>
          <p className="font-medium">Free</p>
          <p className="mt-2 text-sm text-muted-foreground">For every student. Everything you need to stay on top of the term.</p>
          <Price
            amount={
              <>
                <span className="mt-2 self-start text-xl text-muted-foreground">$</span>
                <span className="font-heading text-6xl leading-[1.15]">0</span>
              </>
            }
          >
            <p>free forever</p>
            <p className="text-muted-foreground">no card needed</p>
          </Price>
          <Link href={signUp} className={cn(button, "bg-secondary text-foreground hover:opacity-90")}>
            Get started free
          </Link>
          <Features items={FREE} />
        </div>

        <div className={card}>
          {/* The warm glow from the reference, top center. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 -top-24 -z-10 mx-auto h-56 w-3/4 bg-[radial-gradient(closest-side,oklch(0.7_0.12_60/0.35),transparent)]"
          />
          <p className="flex items-center gap-2 font-medium">
            <User className="size-4 text-muted-foreground" aria-hidden="true" />
            Sonnet Pro
          </p>
          <p className="mt-2 text-sm text-muted-foreground">For heavy AI users. Study as much as you want, all term.</p>
          {prices ? (
            <Price amount={<ProAmount prices={prices} yearly={yearly} />}>
              <p>per month</p>
              <p className="text-muted-foreground">{yearly ? `$${prices.yearly} billed yearly` : "billed monthly, cancel anytime"}</p>
            </Price>
          ) : (
            <Price amount={<span className="font-heading text-4xl leading-[1.15]">Price coming soon</span>}>
              <p className="text-muted-foreground">Monthly or yearly. Set before Pro launches.</p>
            </Price>
          )}
          <button type="button" disabled className={cn(button, "gap-2 bg-primary text-primary-foreground disabled:opacity-80")}>
            <Sparkles className="size-4" aria-hidden="true" /> Coming soon
          </button>
          <Features items={PAID} />
        </div>
      </div>
      <p className="mt-4 text-center text-sm text-muted-foreground">Pro isn&apos;t available yet. Everything in Free works today.</p>
    </MotionConfig>
  );
}
