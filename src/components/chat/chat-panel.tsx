"use client";

import { Check, SquarePen, X } from "lucide-react";
import { MetalBadge } from "metal-fx";
import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";
import { ThinkingOrb } from "thinking-orbs";
import { ChatInput } from "@/components/chat/chat-input";
import { Button } from "@/components/ui/button";
import type { Proposal } from "@/lib/ai";
import { SHORTCUTS } from "@/components/chat/shortcuts";
import { cn } from "@/lib/utils";

export type ChatMessage = {
  id: number;
  role: "user" | "assistant" | "note";
  text: string;
  // assistant only, while it streams: reading your data → thinking → writing
  state?: "reading" | "thinking" | "writing";
  // changes the assistant proposed; nothing is saved until the student confirms
  proposals?: { p: Proposal; status: "pending" | "saving" | "saved" | "skipped" | "error"; error?: string }[];
};

const when = (local: string) =>
  new Date(local).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

// One proposed change: what it will do, in plain words, and the student's yes/no.
function ProposalCard({
  item,
  onResolve,
}: {
  item: NonNullable<ChatMessage["proposals"]>[number];
  onResolve: (accept: boolean) => void;
}) {
  const { resolvedTheme } = useTheme();
  const { p, status } = item;
  const lines =
    p.type === "add"
      ? [`${p.title}`, `${p.kind} · ${p.course} · due ${when(p.due)}`]
      : [
          p.was,
          [
            p.title && `rename to “${p.title}”`,
            p.due && `due ${when(p.due)}`,
            p.done !== undefined && (p.done ? "mark done" : "mark not done"),
          ]
            .filter(Boolean)
            .join(" · "),
        ];
  return (
    <div className="mt-2 rounded-2xl bg-secondary p-3">
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        {/* Metal marks the AI: this came from the assistant, check it before saving. */}
        <MetalBadge theme={resolvedTheme === "light" ? "light" : "dark"} scale={0.85}>
          AI
        </MetalBadge>
        {p.type === "add" ? "Add" : "Change"}
      </div>
      <p className="text-sm font-medium">{lines[0]}</p>
      <p className="font-mono text-xs text-muted-foreground">{lines[1]}</p>
      {status === "pending" || status === "saving" ? (
        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            disabled={status === "saving"}
            onClick={() => onResolve(true)}
            className="h-9 rounded-full px-4 transition-transform active:scale-[0.97]"
          >
            {status === "saving" ? "Saving…" : p.type === "add" ? "Add" : "Save"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={status === "saving"}
            onClick={() => onResolve(false)}
            className="h-9 rounded-full px-4"
          >
            Skip
          </Button>
        </div>
      ) : (
        <p
          className={cn(
            "mt-2 flex items-center gap-1.5 text-xs",
            status === "saved" ? "text-done" : status === "error" ? "text-destructive" : "text-muted-foreground",
          )}
          role="status"
        >
          {status === "saved" && <Check className="size-3.5" />}
          {status === "saved" ? "Saved" : status === "skipped" ? "Skipped" : item.error}
        </p>
      )}
    </div>
  );
}

// Models slip into markdown now and then; the panel shows plain text.
const plain = (t: string) =>
  t
    .replace(/\*\*|__/g, "")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^\s*[-*]\s+/gm, "• ");

const STATUS = {
  reading: { orb: "searching", label: "Reading your courses…" },
  thinking: { orb: "solving", label: "Thinking…" },
} as const;

// The global assistant: docked on wide screens, a sheet elsewhere (see AppShell).
export function ChatPanel({
  messages,
  onSend,
  onClear,
  onClose,
  focusKey,
  busy,
  onResolve,
  className,
}: {
  messages: ChatMessage[];
  busy: boolean;
  onResolve: (message: number, index: number, accept: boolean) => void;
  onSend: (text: string) => void;
  onClear: () => void;
  onClose: () => void;
  focusKey?: number;
  className?: string;
}) {
  // Keep the newest words in view while an answer streams.
  const log = useRef<HTMLDivElement>(null);
  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight });
  }, [messages]);

  return (
    <aside aria-label="Assistant" className={cn("flex flex-col bg-sidebar", className)}>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
        <ThinkingOrb state="breathing" size={20} aria-hidden="true" />
        <h2 className="text-sm font-medium">Assistant</h2>
        <div className="ml-auto flex items-center">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              aria-label="New chat"
              className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <SquarePen className="size-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close assistant"
            className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" />
          </button>
        </div>
      </header>

      <div ref={log} className="flex-1 overflow-y-auto px-4 py-5" aria-live="polite">
        {messages.length === 0 ? (
          <div className="flex min-h-full flex-col items-center justify-center gap-5 text-center">
            <ThinkingOrb state="breathing" size={64} aria-hidden="true" />
            <div>
              <p className="text-lg font-medium tracking-tight">What do you need?</p>
              <p className="mt-1 text-sm text-muted-foreground">Ask about your courses, deadlines and exams.</p>
            </div>
            <ul className="flex w-full flex-col gap-1.5">
              {SHORTCUTS.map(({ label, prompt, icon: Icon }) => (
                <li key={label}>
                  <button
                    type="button"
                    onClick={() => onSend(prompt)}
                    className="flex h-11 w-full items-center gap-3 rounded-xl bg-secondary/60 px-3 text-left text-sm transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <ol className="flex flex-col gap-4">
            {messages.map((m) =>
              m.role === "user" ? (
                <li
                  key={m.id}
                  className="max-w-[85%] self-end rounded-2xl rounded-br-md bg-secondary px-3.5 py-2 text-sm"
                >
                  {m.text}
                </li>
              ) : m.role === "note" ? (
                <li key={m.id} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <ThinkingOrb state="breathing" size={20} aria-hidden="true" className="mt-px shrink-0" />
                  {m.text}
                </li>
              ) : !m.text && (m.state === "reading" || m.state === "thinking") ? (
                <li key={m.id} className="flex items-center gap-2.5 text-sm text-muted-foreground" aria-busy="true">
                  <ThinkingOrb state={STATUS[m.state].orb} size={20} aria-hidden="true" />
                  {STATUS[m.state].label}
                </li>
              ) : (
                // aria-busy: screen readers announce the finished answer, not every streamed word
                <li key={m.id} className="text-sm leading-relaxed whitespace-pre-wrap" aria-busy={!!m.state}>
                  {plain(m.text)}
                  {m.proposals?.map((item, i) => (
                    <ProposalCard key={i} item={item} onResolve={(accept) => onResolve(m.id, i, accept)} />
                  ))}
                  {m.state === "writing" && (
                    <ThinkingOrb
                      state="composing"
                      size={20}
                      aria-hidden="true"
                      className="ml-1 inline-block align-middle"
                    />
                  )}
                </li>
              ),
            )}
          </ol>
        )}
      </div>

      <div className="shrink-0 p-3">
        <ChatInput onSend={onSend} focusKey={focusKey} busy={busy} shortcuts={messages.length > 0} />
      </div>
    </aside>
  );
}
