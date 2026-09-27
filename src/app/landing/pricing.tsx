"use client";

import { CircleCheck, Sparkles, User } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

// ponytail: placeholder prices until 1-2 weeks of ai_usage cost data (HANDOFF: keep AI cost under ~30% of price).
const PRO = { monthly: 7, yearly: 60 };

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

function Price({ amount, children }: { amount: number; children: React.ReactNode }) {
  return (
    <div className="mt-8 min-h-28">
      <p className="flex items-start gap-1 font-semibold">
        <span className="mt-2 text-xl text-muted-foreground">$</span>
        <span className="font-heading text-6xl tabular-nums">{amount}</span>
      </p>
      <div className="mt-2 text-sm">{children}</div>
    </div>
  );
}

export function Pricing({ signUp }: { signUp: string }) {
  const [yearly, setYearly] = useState(true);
  const perMonth = yearly ? Math.round((PRO.yearly / 12) * 100) / 100 : PRO.monthly;
  const saves = Math.round((1 - PRO.yearly / (PRO.monthly * 12)) * 100);

  return (
    <>
      <div role="radiogroup" aria-label="Billing" className="mx-auto mt-8 flex w-fit rounded-full border border-border bg-card p-1 text-sm">
        {[
          { on: false, label: "Monthly" },
          { on: true, label: "Yearly", note: `save ${saves}%` },
        ].map((o) => (
          <button
            key={o.label}
            type="button"
            role="radio"
            aria-checked={yearly === o.on}
            onClick={() => setYearly(o.on)}
            className="relative flex h-10 items-center gap-2 rounded-full px-5 font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {yearly === o.on && (
              <motion.span
                layoutId="billing-pill"
                transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                className="absolute inset-0 -z-10 rounded-full bg-primary"
              />
            )}
            <span className={cn("transition-colors", yearly === o.on ? "text-primary-foreground" : "text-muted-foreground")}>{o.label}</span>
            {o.note && (
              <span className={cn("font-mono text-[11px] transition-colors", yearly === o.on ? "text-primary-foreground/70" : "text-done")}>
                {o.note}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="relative isolate mt-8 grid gap-5 md:grid-cols-2">
        <div className={card}>
          <p className="font-medium">Free</p>
          <p className="mt-2 text-sm text-muted-foreground">For every student. Everything you need to stay on top of the term.</p>
          <Price amount={0}>
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
          <Price amount={perMonth}>
            <p>per month</p>
            <p className="text-muted-foreground">{yearly ? `$${PRO.yearly} billed yearly` : "billed monthly, cancel anytime"}</p>
          </Price>
          <button type="button" disabled className={cn(button, "gap-2 bg-primary text-primary-foreground disabled:opacity-80")}>
            <Sparkles className="size-4" aria-hidden="true" /> Coming soon
          </button>
          <Features items={PAID} />
        </div>
      </div>
      <p className="mt-4 text-center text-sm text-muted-foreground">Pro isn&apos;t available yet. Prices may change before launch.</p>
    </>
  );
}
