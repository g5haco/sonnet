"use client";

import { Globe, Search } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { ThoughtLine } from "@/components/ui/thought-line";
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

type Mode = "reasoning" | "search";
const EASE = [0.22, 1, 0.36, 1] as const;

// The ThoughtLine: breathes while it works (steps trace beneath), settles into "Thought for 4.2s". Once done,
// the reasoning and the web search each open from a small pill under it.
export function ThoughtChain({ chain, busy }: { chain: Chain; busy: boolean }) {
  const modes = (["reasoning", "search"] as Mode[]).filter((m) =>
    m === "reasoning" ? !!chain.reasoning.trim() : !!(chain.query || chain.sources?.length),
  );
  const [open, setOpen] = useState<Mode | null>(null);
  const shown = open && modes.includes(open) ? open : null;
  const thought = !!chain.reasoning.trim();

  return (
    <div className="mb-2 text-sm text-muted-foreground">
      <ThoughtLine
        working={busy}
        label={thought ? "Thinking…" : "Working…"}
        doneLabel={thought ? "Thought for" : "Worked for"}
        steps={chain.steps}
        // never "0.0s": old chats saved without a duration read as at least 1s
        elapsed={busy ? undefined : Math.max(1, (chain.ms ?? 0) / 1000)}
      />
      {!busy && modes.length > 0 && (
        <div className="mt-2 flex gap-1.5">
          {modes.map((m) => (
            <button
              key={m}
              type="button"
              aria-expanded={shown === m}
              onClick={() => setOpen((o) => (o === m ? null : m))}
              className={cn(
                "h-7 rounded-full border px-2.5 text-xs capitalize focus-visible:ring-2 focus-visible:ring-ring",
                shown === m ? "border-border bg-secondary text-foreground" : "border-transparent hover:bg-accent hover:text-foreground",
              )}
            >
              {m === "search" ? "sources" : m}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence initial={false}>
        {shown && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="mt-2 ml-2 border-l border-border pl-4 text-sm">
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
