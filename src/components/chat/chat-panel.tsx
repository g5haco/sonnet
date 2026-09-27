"use client";

import { FileText, Image as ImageIcon, SquarePen, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { ThinkingOrb } from "thinking-orbs";
import { ChatInput } from "@/components/chat/chat-input";
import dynamic from "next/dynamic";

import { ProposalCard } from "@/components/chat/proposal-card";
import { FlashDeck } from "@/components/flashcards";
import type { Deck, Proposal } from "@/lib/ai";
import type { ChatFile } from "@/lib/attach";
import type { Shortcut } from "@/components/chat/shortcuts";
import { ThoughtChain, type Chain } from "@/components/chat/thought-chain";
import { CopyAnswer } from "@/components/chat/widgets";
import { cn } from "@/lib/utils";

// react-markdown + remark-gfm stay out of the shared app bundle.
const Markdown = dynamic(() => import("@/components/chat/markdown").then((m) => m.Markdown));

export type ChatMessage = {
  id: number;
  role: "user" | "assistant" | "note";
  text: string;
  // assistant only, while it streams: reading your data → thinking → writing
  state?: "reading" | "thinking" | "writing";
  // changes the assistant proposed; nothing is saved until the student confirms
  proposals?: { p: Proposal; status: "pending" | "saving" | "saved" | "skipped" | "error"; error?: string }[];
  cards?: Deck; // flashcards the assistant made
  chain?: Chain; // assistant only: what it did (steps, reasoning, web search)
  files?: ChatFile[]; // student only: attached photos/files (photos aren't kept in saved chats)
};

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
  shortcuts,
  busy,
  onResolve,
  className,
}: {
  messages: ChatMessage[];
  busy: boolean;
  onResolve: (message: number, index: number, accept: boolean, due?: string) => void;
  onSend: (text: string, think?: boolean, files?: ChatFile[], course?: string, search?: boolean) => void;
  onClear: () => void;
  onClose: () => void;
  focusKey?: number;
  shortcuts: Shortcut[];
  className?: string;
}) {
  // Keep the newest words in view while an answer streams.
  const log = useRef<HTMLDivElement>(null);
  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight });
  }, [messages]);

  return (
    <aside data-chat aria-label="Sonnet" className={cn("flex flex-col bg-sidebar", className)}>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
        <ThinkingOrb state="breathing" size={20} aria-hidden="true" />
        <h2 className="text-sm font-medium">Sonnet</h2>
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
            aria-label="Close Sonnet"
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
              {shortcuts.slice(0, 5).map(({ label, prompt, icon: Icon, focus }) => (
                <li key={label}>
                  <button
                    type="button"
                    onClick={() => onSend(prompt, false, undefined, focus)}
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
          <ChatLog messages={messages} onResolve={onResolve} />
        )}
      </div>

      <div className="shrink-0 p-3">
        <ChatInput onSend={onSend} focusKey={focusKey} busy={busy} shortcuts={messages.length > 0} />
      </div>
    </aside>
  );
}

// The conversation itself, shared by the side panel and the Chat page (`roomy` = the page's bigger type).
export function ChatLog({
  messages,
  onResolve,
  roomy,
}: {
  messages: ChatMessage[];
  onResolve: (message: number, index: number, accept: boolean, due?: string) => void;
  roomy?: boolean;
}) {
  return (
    <ol className={cn("flex flex-col leading-relaxed", roomy ? "gap-8 text-[15px]" : "gap-6 text-sm")}>
      {messages.map((m) =>
        m.role === "user" ? (
          <li key={m.id} className="flex max-w-[85%] flex-col items-end gap-1.5 self-end">
            {!!m.files?.length && (
              <span className="flex flex-wrap justify-end gap-1.5">
                {m.files.map((f, i) =>
                  f.image ? (
                    // eslint-disable-next-line @next/next/no-img-element -- a local data: URL, nothing to optimize
                    <img
                      key={i}
                      src={f.image}
                      alt={f.name}
                      className="size-20 rounded-xl object-cover ring-1 ring-border"
                    />
                  ) : (
                    <span
                      key={i}
                      className="flex h-9 max-w-52 items-center gap-2 rounded-xl bg-secondary px-3 text-xs text-muted-foreground"
                    >
                      {/* an image with no data = a photo from a saved chat (not stored) */}
                      {f.text ? <FileText className="size-4 shrink-0" /> : <ImageIcon className="size-4 shrink-0" />}
                      <span className="truncate">{f.name}</span>
                    </span>
                  ),
                )}
              </span>
            )}
            {m.text && (
              <span className="rounded-2xl rounded-br-md bg-secondary px-3.5 py-2 whitespace-pre-wrap">{m.text}</span>
            )}
          </li>
        ) : m.role === "note" ? (
          <li key={m.id} className="flex items-start gap-2.5 text-muted-foreground">
            <ThinkingOrb state="breathing" size={20} aria-hidden="true" className="mt-px shrink-0" />
            {m.text}
          </li>
        ) : !m.chain && !m.text && (m.state === "reading" || m.state === "thinking") ? (
          <li key={m.id} className="flex items-center gap-2.5 text-muted-foreground" aria-busy="true">
            <ThinkingOrb state={STATUS[m.state].orb} size={20} aria-hidden="true" />
            {STATUS[m.state].label}
          </li>
        ) : (
          // aria-busy: screen readers announce the finished answer, not every streamed word
          <li key={m.id} className="min-w-0" aria-busy={!!m.state}>
            {m.chain && <ThoughtChain chain={m.chain} busy={!!m.state} />}
            {m.text && <Markdown text={m.text} />}
            {m.proposals?.map((item, i) => (
              <ProposalCard key={i} item={item} onResolve={(accept, due) => onResolve(m.id, i, accept, due)} />
            ))}
            {m.cards && <FlashDeck deck={m.cards} />}
            {!m.state && m.text && <CopyAnswer text={m.text} />}
            {m.state === "writing" && (
              <ThinkingOrb state="composing" size={20} aria-hidden="true" className="ml-1 inline-block align-middle" />
            )}
          </li>
        ),
      )}
    </ol>
  );
}
