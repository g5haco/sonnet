"use client";

import { BorderBeam } from "border-beam";
import { History, Layers, MessageCircleQuestion, SquarePen, Trash2 } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteChat, listChats } from "@/app/actions";
import { ThinkingOrb } from "thinking-orbs";
import { useAssistant } from "@/components/app-shell";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatLog } from "@/components/chat/chat-panel";
import { GooeyMenu } from "@/components/gooey-menu";
import { SHORTCUTS } from "@/components/chat/shortcuts";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { courseColor } from "@/lib/course";

// The assistant as a full page: the same conversation as the side panel, with room to study in it.
// Border beam (Libraries.dev): always riding the page's input, brighter while the assistant is working.
export function ChatPage() {
  const { messages, busy, send, clear, resolve, focus, setFocus, focusKey, courses } = useAssistant();
  const { resolvedTheme } = useTheme();
  const [more, setMore] = useState(false);
  const [picking, setPicking] = useState(false);
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
        {/* Which course the chat is about: the same gooey menu as Create, one pill per course. */}
        <GooeyMenu
          direction="below"
          chevron
          mono
          label={focus || "All courses"}
          dot={hue !== undefined ? courseColor(hue) : "var(--muted-foreground)"}
          selected={focus}
          items={[
            { kind: "", label: "All courses", color: "var(--muted-foreground)" },
            ...courses.map((c) => ({ kind: c.code, label: c.code, color: courseColor(c.hue) })),
          ]}
          open={picking}
          onOpenChange={setPicking}
          onPick={setFocus}
        />
        <span className="text-muted-foreground" aria-hidden="true">
          ›
        </span>
        <h1 className="min-w-0 flex-1 truncate text-sm font-medium">{title ?? "New chat"}</h1>
        <ChatHistory />
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

type Saved = { id: string; title: string; focus: string; updated_at: string };

// Past chats, newest first. Loaded when opened, so it's always current.
function ChatHistory() {
  const { open, chatId, clear } = useAssistant();
  const [chats, setChats] = useState<Saved[] | null>(null);
  const [, start] = useTransition();
  const load = () =>
    start(async () => {
      const r = await listChats();
      if (r.error) toast.error(r.error);
      setChats(r.chats);
    });
  const remove = (id: string) =>
    start(async () => {
      const r = await deleteChat(id);
      if (r.error) return void toast.error(r.error);
      setChats((c) => c?.filter((x) => x.id !== id) ?? null);
      if (id === chatId) clear();
    });

  return (
    <Popover onOpenChange={(o) => o && load()}>
      <PopoverTrigger className="flex h-9 shrink-0 items-center gap-2 rounded-full px-3 text-sm text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
        <History className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">History</span>
      </PopoverTrigger>
      <PopoverContent align="end" className="max-h-96 w-80 gap-0 overflow-y-auto rounded-xl p-1.5">
        {chats === null ? (
          <p className="p-3 text-sm text-muted-foreground">Loading…</p>
        ) : chats.length === 0 ? (
          <p className="p-3 text-sm text-muted-foreground">No saved chats yet. They save as you go.</p>
        ) : (
          <ul>
            {chats.map((c) => (
              <li key={c.id} className="group flex items-center">
                <button
                  type="button"
                  onClick={() => open(c.id)}
                  aria-current={c.id === chatId || undefined}
                  className="flex min-w-0 flex-1 flex-col rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring aria-[current]:bg-accent"
                >
                  <span className="truncate text-sm">{c.title || "Untitled chat"}</span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {c.focus || "all courses"} ·{" "}
                    {new Date(c.updated_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => remove(c.id)}
                  aria-label={`Delete chat: ${c.title || "Untitled"}`}
                  className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:text-destructive focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
