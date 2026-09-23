"use client";

import { MetalFx } from "metal-fx";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ThinkingOrb } from "thinking-orbs";
import { loadChat, saveChat } from "@/app/actions";
import { ChatPanel, type ChatMessage } from "@/components/chat/chat-panel";
import { applyProposal } from "@/components/chat/proposal-card";
import { CourseDialog, ItemDialog } from "@/components/create-forms";
import type { CreateKind } from "@/components/gooey-menu";
import { SettingsWindow, type Account, type SettingsSection } from "@/components/settings-forms";
import { Sidebar } from "@/components/sidebar";
import type { Deck, Proposal } from "@/lib/ai";
import type { ClassMeeting } from "@/lib/calendar";
import type { Item } from "@/lib/progress";
import { cn } from "@/lib/utils";

type Course = { id: string; code: string; hue: number };

// Any page can open the Create flows (e.g. the dashboard's "Add your first course").
// `due` pre-fills the date (datetime-local "YYYY-MM-DDTHH:mm"), e.g. from a calendar slot; `course` pre-picks
// the course (an id), e.g. from that course's page.
const CreateContext = createContext<(kind: CreateKind, due?: string, course?: string) => void>(() => {});
export const useCreate = () => useContext(CreateContext);

// The one conversation, shared by the side panel and the Chat page.
type Assistant = {
  messages: ChatMessage[];
  busy: boolean;
  send: (text: string, think?: boolean) => void;
  clear: () => void;
  resolve: (message: number, index: number, accept: boolean, due?: string) => void;
  focus: string; // course code this chat is about, "" = all courses
  setFocus: (code: string) => void;
  focusKey: number;
  courses: Course[];
  schedule: Schedule;
  open: (id: string) => Promise<void>; // reopen a saved chat
  chatId: string | null;
};
export type Schedule = { items: Item[]; meetings: ClassMeeting[] };
// Any page can open the floating Settings window (e.g. the calendar's "set your semester dates").
const SettingsContext = createContext<(section?: SettingsSection) => void>(() => {});
export const useOpenSettings = () => useContext(SettingsContext);

const AssistantContext = createContext<Assistant | null>(null);
export const useAssistant = () => useContext(AssistantContext)!;

const WIDE = "(min-width: 1280px)"; // xl: the assistant docks beside the page

export function AppShell({
  courses,
  schedule,
  account,
  children,
}: {
  courses: Course[];
  schedule: Schedule;
  account: Account;
  children: React.ReactNode;
}) {
  const [now] = useState(() => Date.now());
  const [dialog, setDialog] = useState<"course" | Item["kind"] | null>(null);
  const [due, setDue] = useState<string>();
  const [pick, setPick] = useState<string>();
  const [settings, setSettings] = useState<SettingsSection | null>(null); // the floating window; null = closed
  // Assistant: docked (wide screens, open by default) or a sheet (everything else).
  const [docked, setDocked] = useState(true);
  const [sheet, setSheet] = useState(false);
  const [focusKey, setFocusKey] = useState(0);
  // The conversation lives here, so it survives page changes; each chat is also saved (History on /chat).
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatId, setChatId] = useState<string | null>(null);
  const dirty = useRef(false); // changed since the last save
  const [focus, setFocus] = useState("");
  const onChatPage = usePathname() === "/chat"; // the page is the assistant there: no panel, no Ask button
  const nextId = useRef(0);
  const inflight = useRef<AbortController | null>(null);
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "light" ? "light" : "dark";

  const create = (kind: CreateKind, due?: string, course?: string) => {
    if (kind === "upload") return router.push("/courses"); // materials live on each course's page
    setDue(due);
    setPick(course);
    if (kind !== "course" && courses.length === 0) {
      toast("Add a course first. Assignments and exams hang off it.");
      return setDialog("course");
    }
    setDialog(kind);
  };

  const openAssistant = () => {
    if (onChatPage) return setFocusKey((k) => k + 1);
    if (window.matchMedia(WIDE).matches) setDocked(true);
    else setSheet(true);
    setFocusKey((k) => k + 1);
  };

  // Streams the answer from /api/chat (NDJSON events: think | text | error) into the conversation.
  const send = async (text: string, think = false) => {
    if (!chatId) setChatId(crypto.randomUUID());
    dirty.current = true;
    const history = [...messages.filter((m) => m.role !== "note" && m.text), { role: "user" as const, text }];
    const answer = (nextId.current += 2);
    const patch = (change: (m: ChatMessage) => ChatMessage) =>
      setMessages((all) => all.map((m) => (m.id === answer ? change(m) : m)));
    setMessages((all) => [
      ...all,
      { id: answer - 1, role: "user", text },
      { id: answer, role: "assistant", text: "", state: "reading" },
    ]);

    const ctrl = new AbortController();
    inflight.current = ctrl;
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          think,
          focus: focus || undefined,
          messages: history.map((m) => ({ role: m.role, content: m.text })),
        }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body)
        throw new Error((await res.json().catch(() => null))?.error ?? "Couldn't reach the assistant.");
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines.filter(Boolean)) {
          const e = JSON.parse(line) as {
            t: "think" | "text" | "propose" | "cards" | "error";
            v?: string | Proposal[] | Deck;
          };
          if (e.t === "think") patch((m) => ({ ...m, state: m.text ? m.state : "thinking" }));
          else if (e.t === "text") patch((m) => ({ ...m, text: m.text + e.v, state: "writing" }));
          else if (e.t === "propose")
            patch((m) => ({ ...m, proposals: (e.v as Proposal[]).map((p) => ({ p, status: "pending" as const })) }));
          else if (e.t === "cards") patch((m) => ({ ...m, cards: e.v as Deck }));
          else throw new Error(String(e.v));
        }
      }
      patch((m) =>
        m.text || m.proposals?.length || m.cards
          ? { ...m, state: undefined }
          : { ...m, role: "note", text: "No answer came back. Try again.", state: undefined },
      );
    } catch (err) {
      if (ctrl.signal.aborted) return; // "new chat" cancelled it
      patch((m) => ({
        ...m,
        role: "note",
        text: err instanceof Error ? err.message : "Something went wrong.",
        state: undefined,
      }));
    }
  };

  // The student said yes (or no) to a change the assistant proposed. Only now is anything saved.
  // `due` is the card's (possibly corrected) local date-time, e.g. an exam time the student picked.
  const resolve = async (message: number, index: number, accept: boolean, due?: string) => {
    const set = (status: "saving" | "saved" | "skipped" | "error", error?: string) =>
      setMessages((all) =>
        all.map((m) =>
          m.id === message
            ? { ...m, proposals: m.proposals?.map((x, i) => (i === index ? { ...x, status, error } : x)) }
            : m,
        ),
      );
    dirty.current = true;
    const p = messages.find((m) => m.id === message)?.proposals?.[index]?.p;
    if (!p || !accept) return set("skipped");
    set("saving");
    const result = await applyProposal(p, courses, due);
    if (result.error) set("error", result.error);
    else set("saved");
  };

  const clear = () => {
    inflight.current?.abort();
    setMessages([]);
    setChatId(null);
  };

  // Save once an answer (or a yes/no) settles. Streaming states and in-flight saves aren't stored.
  useEffect(() => {
    if (!dirty.current || !chatId || !messages.length || messages.some((m) => m.state)) return;
    dirty.current = false;
    const title = messages.find((m) => m.role === "user")?.text ?? "";
    const stored = messages.map((m) => ({
      ...m,
      state: undefined, // dropped by JSON
      proposals: m.proposals?.map((x) => (x.status === "saving" ? { ...x, status: "pending" as const } : x)),
    }));
    saveChat(chatId, title, focus, stored).then((r) => r.error && console.error("[chat]", r.error));
  }, [messages, chatId, focus]);

  const open = async (id: string) => {
    const r = await loadChat(id);
    if (!r.chat) return void toast.error(r.error);
    inflight.current?.abort();
    const loaded = (r.chat.messages as ChatMessage[]).map((m, i) => ({ ...m, id: i }));
    nextId.current = loaded.length + 1; // new messages get fresh ids
    setMessages(loaded);
    setFocus(r.chat.focus);
    setChatId(id);
  };

  // ⌘K / Ctrl+K: straight to the assistant from anywhere. Escape closes the sheet.
  useEffect(() => {
    const keys = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openAssistant();
      } else if (e.key === "Escape") setSheet(false);
    };
    document.addEventListener("keydown", keys);
    return () => document.removeEventListener("keydown", keys);
  }, [onChatPage]); // eslint-disable-line react-hooks/exhaustive-deps -- openAssistant only varies by page

  const panel = (onClose: () => void, className: string) => (
    <ChatPanel
      messages={messages}
      onSend={send}
      onClear={clear}
      busy={messages.some((m) => m.state)}
      onResolve={resolve}
      onClose={onClose}
      focusKey={focusKey}
      className={className}
    />
  );

  return (
    <MotionConfig reducedMotion="user">
      <CreateContext.Provider value={create}>
        <SettingsContext.Provider value={(section = "semester") => setSettings(section)}>
          <AssistantContext.Provider
            value={{
              messages,
              busy: messages.some((m) => m.state),
              send,
              clear,
              resolve,
              focus,
              setFocus,
              focusKey,
              courses,
              schedule,
              open,
              chatId,
            }}
          >
            <div className="flex min-h-dvh flex-col md:flex-row">
              <Sidebar onCreate={create} onAsk={openAssistant} onSettings={() => setSettings("semester")} />
              <div className="min-w-0 flex-1">{children}</div>
              {docked &&
                !onChatPage &&
                panel(
                  () => setDocked(false),
                  "sticky top-0 hidden h-dvh w-[380px] shrink-0 border-l border-border xl:flex",
                )}
            </div>

            {/* The metal "Ask" button: always below xl; on xl only while the dock is closed. */}
            <div
              className={cn(
                "fixed right-4 bottom-4 z-40 md:right-6 md:bottom-6",
                docked && "xl:hidden",
                onChatPage && "hidden",
              )}
            >
              <MetalFx variant="circle" preset="silver" theme={theme}>
                <button
                  type="button"
                  onClick={openAssistant}
                  aria-label="Ask the assistant (Ctrl+K)"
                  className="grid size-12 place-items-center rounded-full bg-foreground shadow-lg transition-transform active:scale-95"
                >
                  <ThinkingOrb
                    state="breathing"
                    size={20}
                    theme={theme === "dark" ? "light" : "dark"}
                    aria-hidden="true"
                  />
                </button>
              </MetalFx>
            </div>

            <AnimatePresence>
              {sheet && (
                <div className="fixed inset-0 z-50 xl:hidden">
                  <motion.div
                    className="absolute inset-0 bg-black/40"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSheet(false)}
                  />
                  <motion.div
                    className="absolute inset-y-0 right-0 flex w-full sm:w-[420px]"
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {panel(() => setSheet(false), "h-dvh w-full border-l border-border")}
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            <SettingsWindow
              section={settings}
              onSection={setSettings}
              onClose={() => setSettings(null)}
              account={account}
            />
            <CourseDialog open={dialog === "course"} onOpenChange={(o) => !o && setDialog(null)} />
            <ItemDialog
              kind={dialog === "course" ? null : dialog}
              courses={courses}
              now={now}
              due={due}
              course={pick}
              onOpenChange={(o) => !o && setDialog(null)}
            />
          </AssistantContext.Provider>
        </SettingsContext.Provider>
      </CreateContext.Provider>
    </MotionConfig>
  );
}
