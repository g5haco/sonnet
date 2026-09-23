"use client";

import { BorderBeam } from "border-beam";
import { Layers, MessageCircleQuestion, SquarePen } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { ThinkingOrb } from "thinking-orbs";
import { useAssistant } from "@/components/app-shell";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatLog } from "@/components/chat/chat-panel";
import { SHORTCUTS } from "@/components/chat/shortcuts";
import { courseColor } from "@/lib/course";

// The assistant as a full page: the same conversation as the side panel, with room to study in it.
// Border beam (Libraries.dev): always riding the page's input, brighter while the assistant is working.
export function ChatPage() {
  const { messages, busy, send, clear, resolve, focus, setFocus, focusKey, courses } = useAssistant();
  const { resolvedTheme } = useTheme();
  const [more, setMore] = useState(false);
  const log = useRef<HTMLDivElement>(null);
  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight });
  }, [messages]);

  // Ideas for the empty chat, pointed at the focused course (or the first one).
  const course = focus || courses[0]?.code;
  const ideas = [
    SHORTCUTS[0],
    SHORTCUTS[1],
    ...(course
      ? [
          {
            label: `Quiz me on ${course}`,
            prompt: `Quiz me on ${course}: one question at a time, wait for my answer, then tell me if I'm right and why.`,
            icon: MessageCircleQuestion,
          },
          {
            label: `Flashcards for ${course}`,
            prompt: `Make flashcards for the key ideas in ${course}.`,
            icon: Layers,
          },
        ]
      : []),
    ...SHORTCUTS.slice(2),
  ];
  const shown = more ? ideas : ideas.slice(0, 4);
  const title = messages.find((m) => m.role === "user")?.text;
  const hue = courses.find((c) => c.code === focus)?.hue;

  return (
    <main className="flex h-[calc(100dvh-3.5rem)] flex-col md:h-dvh">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4 md:px-6">
        <label className="flex h-9 shrink-0 items-center gap-2 rounded-full bg-secondary pr-1 pl-3 text-sm focus-within:ring-2 focus-within:ring-ring">
          <span
            className="size-2 rounded-full"
            style={{ background: hue !== undefined ? courseColor(hue) : "var(--muted-foreground)" }}
            aria-hidden="true"
          />
          <span className="sr-only">Which course is this chat about?</span>
          <select
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            className="h-full cursor-pointer bg-transparent pr-2 font-mono text-xs outline-none"
          >
            <option value="">All courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.code}>
                {c.code}
              </option>
            ))}
          </select>
        </label>
        <span className="text-muted-foreground" aria-hidden="true">
          ›
        </span>
        <h1 className="min-w-0 flex-1 truncate text-sm font-medium">{title ?? "New chat"}</h1>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={clear}
            className="flex h-9 shrink-0 items-center gap-2 rounded-full px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <SquarePen className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">New chat</span>
          </button>
        )}
      </header>

      <div ref={log} className="min-h-0 flex-1 overflow-y-auto" aria-live="polite">
        <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 py-8 md:px-6">
          {messages.length === 0 ? (
            <div className="m-auto flex flex-col items-center gap-6 text-center">
              <ThinkingOrb state="breathing" size={64} aria-hidden="true" />
              <div>
                <h2 className="text-2xl font-medium tracking-tight">What are we working on?</h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-pretty text-muted-foreground">
                  Ask about any course, deadline or exam. It can plan your week, quiz you, make flashcards, and add
                  things to your calendar once you say yes.
                </p>
              </div>
              <ul className="flex max-w-2xl flex-wrap justify-center gap-2">
                {shown.map(({ label, prompt, icon: Icon }) => (
                  <li key={label}>
                    <button
                      type="button"
                      onClick={() => send(prompt)}
                      className="flex h-10 items-center gap-2 rounded-full border border-border bg-background px-4 text-sm transition-[background-color,transform] hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
                    >
                      <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
              {ideas.length > 4 && (
                <button
                  type="button"
                  onClick={() => setMore((m) => !m)}
                  aria-expanded={more}
                  className="-mt-2 rounded-full px-3 py-1 text-sm text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {more ? "Fewer ideas" : "More ideas"}
                </button>
              )}
            </div>
          ) : (
            <ChatLog messages={messages} onResolve={resolve} roomy />
          )}
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl shrink-0 px-4 pb-4 md:px-6 md:pb-6">
        <BorderBeam
          size="md"
          colorVariant="colorful"
          theme={resolvedTheme === "light" ? "light" : "dark"}
          borderRadius={24}
          strength={busy ? 1 : 0.7}
          className="w-full"
        >
          <ChatInput onSend={send} focusKey={focusKey} busy={busy} shortcuts={messages.length > 0} />
        </BorderBeam>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Answers come from your courses and deadlines. Anything it adds waits for your OK.
        </p>
      </div>
    </main>
  );
}
