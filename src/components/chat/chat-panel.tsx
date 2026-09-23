"use client";

import { SquarePen, X } from "lucide-react";
import { ThinkingOrb } from "thinking-orbs";
import { ChatInput } from "@/components/chat/chat-input";
import { SHORTCUTS } from "@/components/chat/shortcuts";
import { cn } from "@/lib/utils";

export type ChatMessage = { id: number; role: "user" | "assistant" | "note"; text: string };

// The global assistant: docked on wide screens, a sheet elsewhere (see AppShell).
export function ChatPanel({
  messages,
  onSend,
  onClear,
  onClose,
  focusKey,
  className,
}: {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  onClear: () => void;
  onClose: () => void;
  focusKey?: number;
  className?: string;
}) {
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

      <div className="flex-1 overflow-y-auto px-4 py-5" aria-live="polite">
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
                <li key={m.id} className="max-w-[85%] self-end rounded-2xl rounded-br-md bg-secondary px-3.5 py-2 text-sm">
                  {m.text}
                </li>
              ) : m.role === "note" ? (
                <li key={m.id} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <ThinkingOrb state="breathing" size={20} aria-hidden="true" className="mt-px shrink-0" />
                  {m.text}
                </li>
              ) : (
                <li key={m.id} className="text-sm leading-relaxed whitespace-pre-wrap">
                  {m.text}
                </li>
              ),
            )}
          </ol>
        )}
      </div>

      <div className="shrink-0 p-3">
        <ChatInput onSend={onSend} focusKey={focusKey} shortcuts={messages.length > 0} />
      </div>
    </aside>
  );
}
