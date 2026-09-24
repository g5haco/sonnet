"use client";

import { Check, ChevronDown, Globe, Search, Sparkle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { ThinkingOrb } from "thinking-orbs";
import { cn } from "@/lib/utils";

// What the assistant did for one answer: its steps, its reasoning (when the model thinks) and its web search.
export type Chain = {
  steps: string[];
  reasoning: string;
  query?: string; // the web search, when there was one
  sources?: { url: string; title: string }[];
  started: number;
  ms?: number; // set when the answer is done
};

// One step at a time; a step already listed is kept where it is.
export const addStep = (c: Chain, step: string): Chain => (c.steps.includes(step) ? c : { ...c, steps: [...c.steps, step] });

type Mode = "steps" | "reasoning" | "search";
const EASE = [0.22, 1, 0.36, 1] as const;

// Collapsed: the live status while it works, "Thought for 4 seconds" once done. Open: Steps / Reasoning / Search.
export function ThoughtChain({ chain, busy }: { chain: Chain; busy: boolean }) {
  const [open, setOpen] = useState(false);
  const modes = (["steps", "reasoning", "search"] as Mode[]).filter(
    (m) => m === "steps" || (m === "reasoning" ? !!chain.reasoning.trim() : !!(chain.query || chain.sources?.length)),
  );
  const [mode, setMode] = useState<Mode>("steps");
  const shown = modes.includes(mode) ? mode : "steps";
  const seconds = Math.max(1, Math.round((chain.ms ?? 0) / 1000));
  const title = busy
    ? `${chain.steps.at(-1) ?? "Working"}…`
    : `${chain.reasoning.trim() ? "Thought" : "Worked"} for ${seconds} second${seconds === 1 ? "" : "s"}`;

  return (
    <div className="mb-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="-mx-1 flex max-w-full items-center gap-2 rounded-lg px-1 py-0.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        {busy ? (
          <ThinkingOrb state={chain.reasoning ? "solving" : "searching"} size={20} aria-hidden="true" />
        ) : (
          <Sparkle className="size-4 shrink-0" aria-hidden="true" />
        )}
        {/* a new status slides in; the old one is simply replaced (no exit to pile up on fast updates) */}
        <motion.span
          key={title}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: EASE }}
          className="truncate font-medium"
        >
          {title}
        </motion.span>
        <ChevronDown className={cn("size-4 shrink-0 transition-transform duration-200", open && "rotate-180")} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="mt-2 ml-2 border-l border-border pl-4 text-sm">
              {shown === "steps" && (
                <ol className="flex flex-col gap-1.5">
                  {chain.steps.map((s, i) => {
                    const live = busy && i === chain.steps.length - 1;
                    return (
                      <li key={s} className={cn("flex items-center gap-2", live ? "text-foreground" : "text-muted-foreground")}>
                        {live ? (
                          <span className="size-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <Check className="size-3.5 shrink-0" aria-hidden="true" />
                        )}
                        {s}
                      </li>
                    );
                  })}
                </ol>
              )}
              {shown === "reasoning" && (
                <p className="max-h-64 overflow-y-auto whitespace-pre-wrap text-muted-foreground">{chain.reasoning.trim()}</p>
              )}
              {shown === "search" && (
                <div className="flex flex-col gap-2">
                  {chain.query && (
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Search className="size-3.5 shrink-0" aria-hidden="true" />
                      <span className="truncate">{chain.query}</span>
                    </p>
                  )}
                  {chain.sources?.map((s) => (
                    <a
                      key={s.url}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-w-0 items-center gap-2 rounded-md hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Globe className="size-3.5 shrink-0 text-brand" aria-hidden="true" />
                      <span className="truncate font-medium">{s.title || new URL(s.url).hostname}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {new URL(s.url).hostname.replace(/^www\./, "")}
                      </span>
                    </a>
                  ))}
                  {!chain.sources?.length && (
                    <p className="text-muted-foreground">{busy ? "Searching…" : "No sources came back."}</p>
                  )}
                </div>
              )}
            </div>
            {modes.length > 1 && (
              <div role="tablist" aria-label="Show" className="mt-3 inline-flex rounded-full bg-secondary p-1">
                {modes.map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="tab"
                    aria-selected={shown === m}
                    onClick={() => setMode(m)}
                    className="relative rounded-full px-3 py-1 text-xs capitalize transition-colors focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {shown === m && (
                      <motion.span
                        layoutId={`chain-tab-${chain.started}`}
                        className="absolute inset-0 rounded-full bg-background ring-1 ring-border"
                        transition={{ type: "spring", stiffness: 500, damping: 38 }}
                      />
                    )}
                    <span className={cn("relative", shown === m ? "text-foreground" : "text-muted-foreground")}>{m}</span>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
