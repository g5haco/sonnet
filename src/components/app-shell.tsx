"use client";

import { MetalFx } from "metal-fx";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ThinkingOrb } from "thinking-orbs";
import { itemChat, loadChat, saveChat, syncCanvasNow } from "@/app/actions";
import { ChatPanel, type ChatMessage } from "@/components/chat/chat-panel";
import { applyProposal } from "@/components/chat/proposal-card";
import { CourseDialog, ItemDialog } from "@/components/create-forms";
import type { CreateKind } from "@/components/gooey-menu";
import { UploadWindow } from "@/components/materials";
import { SettingsWindow, type Account, type SettingsSection } from "@/components/settings-forms";
import { Sidebar } from "@/components/sidebar";
import { SyncWindow } from "@/components/sync-window";
import type { Deck, Proposal } from "@/lib/ai";
import { withFiles, type ChatFile } from "@/lib/attach";
import type { ClassMeeting } from "@/lib/calendar";
import type { Item } from "@/lib/progress";
import { cn } from "@/lib/utils";
import { shortcutsFor } from "@/components/chat/shortcuts";
import { addStep, type Chain } from "@/components/chat/thought-chain";
import { FocusProvider } from "@/components/focus-timer";

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
  // course: focus it first; search: look things up on the web
  send: (text: string, think?: boolean, files?: ChatFile[], course?: string, search?: boolean) => void;
  clear: () => void;
  resolve: (message: number, index: number, accept: boolean, due?: string) => void;
  focus: string; // course code this chat is about, "" = all courses
  setFocus: (code: string) => void;
  focusKey: number;
  courses: Course[];
  schedule: Schedule;
  open: (id: string) => Promise<boolean>; // reopen a saved chat
  chatId: string | null;
  show: () => void; // open the assistant panel (or focus it on /chat)
  item: Item | null; // the assignment an "Ask about this" chat is about (its chip)
  detach: () => void; // remove the chip: it becomes a normal chat
  askAbout: (item: Item) => Promise<void>; // "Ask about this": back to that assignment's chat, or a new one
  syllabus: string; // course code whose syllabus the chat is about ("Ask about it"), shown as a chip; "" = none
  askSyllabus: (course: string) => void;
  detachSyllabus: () => void;
};
export type Schedule = { items: Item[]; meetings: ClassMeeting[] };
// Any page can open the floating Settings window (e.g. the calendar's "set your semester dates"), closing Sync if open.
const SettingsContext = createContext<(section?: SettingsSection) => void>(() => {});
export const useOpenSettings = () => useContext(SettingsContext);

const AssistantContext = createContext<Assistant | null>(null);
export const useAssistant = () => useContext(AssistantContext)!;

const WIDE = "(min-width: 1280px)"; // xl: the assistant docks beside the page

// The request for one answer: attached files' text rides in each turn's content, in full only on the newest turn
// that has files (older ones keep 4k each); only the newest 3 photos go along, so a photo-heavy chat stays well
// under the ~4.5 MB request limit.
function slim(history: Pick<ChatMessage, "role" | "text" | "files">[]) {
  let photos = 3;
  const newest = history.findLastIndex((m) => m.files?.length);
  const turns = [];
  for (let i = history.length - 1; i >= 0; i--) {
    // newest first, so the photo budget goes to the most recent photos
    const m = history[i];
    const files = m.files?.map((f) => (i === newest ? f : { ...f, text: f.text?.slice(0, 4000) }));
    const images = (files ?? []).flatMap((f) => (f.image && photos-- > 0 ? [f.image] : []));
    turns.unshift({ role: m.role, content: withFiles(m.text, files), images });
  }
  return turns;
}

// The phone keyboard doesn't shrink the page on iOS: it pans the visible area up instead, pushing the top bar and
// the chat header off screen. So the visible area's height and offset go in --vvh / --vvtop, and the phone top bar,
// the /chat page and the assistant sheet size themselves to it (ChatGPT-style: everything stays above the
// keyboard). Skipped while pinch-zoomed, where following the zoomed area would look broken.
function useVisibleViewport() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const set = () => {
      if (Math.abs(vv.scale - 1) > 0.01) return;
      const s = document.documentElement.style;
      s.setProperty("--vvh", `${vv.height}px`);
      s.setProperty("--vvtop", `${vv.offsetTop}px`);
    };
    set();
    vv.addEventListener("resize", set);
    vv.addEventListener("scroll", set);
    return () => {
      vv.removeEventListener("resize", set);
      vv.removeEventListener("scroll", set);
    };
  }, []);
}

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
  useVisibleViewport();
  const [dialog, setDialog] = useState<"course" | Item["kind"] | null>(null);
  const [due, setDue] = useState<string>();
  const [pick, setPick] = useState<string>();
  const [settings, setSettings] = useState<SettingsSection | null>(null); // the floating window; null = closed
  const [sync, setSync] = useState(false); // the Sync window (Canvas, Google Calendar)
  // The uploader: `n` gives each opening a fresh window (and course pick); closing keeps it mounted to animate.
  const [upload, setUpload] = useState<{ open: boolean; course?: string; n: number }>({ open: false, n: 0 });
  // Assistant: docked (wide screens, open by default) or a sheet (everything else).
  const [docked, setDocked] = useState(true);
  const [sheet, setSheet] = useState(false);
  const [focusKey, setFocusKey] = useState(0);
  // The conversation lives here, so it survives page changes; each chat is also saved (History on /chat).
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatId, setChatId] = useState<string | null>(null);
  const dirty = useRef(false); // changed since the last save
  const [focus, setFocus] = useState("");
  const [itemId, setItemId] = useState<string | null>(null);
  const [syllabus, setSyllabus] = useState(""); // not saved: a reopened chat keeps its course focus, not the chip
  const router = useRouter();
  const item = schedule.items.find((i) => i.id === itemId) ?? null;
  const path = usePathname();

  // Canvas catch-up: the Vercel Hobby cron only runs daily, so opening the app syncs when the last sync is over
  // an hour old. Quiet on purpose; the action refreshes the page's data when it's done.
  const { baseUrl, lastSyncAt, lastSyncStatus } = account.canvas;
  useEffect(() => {
    const stale = !lastSyncAt || Date.now() - Date.parse(lastSyncAt) > 60 * 60_000;
    if (baseUrl && stale && lastSyncStatus !== "syncing") void syncCanvasNow();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- once per app load
  const onChatPage = path === "/chat"; // the page is the assistant there: no panel, no Ask button
  const nextId = useRef(0);
  const inflight = useRef<AbortController | null>(null);
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "light" ? "light" : "dark";

  const create = (kind: CreateKind, due?: string, course?: string) => {
    if (kind === "upload") return setUpload((u) => ({ open: true, course, n: u.n + 1 }));
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
  const send = async (text: string, think = false, files?: ChatFile[], course?: string, search = false) => {
    if (course) changeFocus(course);
    if (!chatId) setChatId(crypto.randomUUID());
    dirty.current = true;
    const mine = { role: "user" as const, text, files: files?.length ? files : undefined };
    const history = [...messages.filter((m) => m.role !== "note" && (m.text || m.files?.length)), mine];
    const answer = (nextId.current += 2);
    const patch = (change: (m: ChatMessage) => ChatMessage) =>
      setMessages((all) => all.map((m) => (m.id === answer ? change(m) : m)));
    setMessages((all) => [
      ...all,
      { id: answer - 1, ...mine },
      {
        id: answer,
        role: "assistant",
        text: "",
        state: "reading",
        chain: { steps: [], reasoning: "", started: Date.now() }, // steps arrive as the server does them
      },
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
          search,
          focus: (course ?? focus) || undefined,
          item: item?.id, // every message, so the assistant always has the assignment's details
          syllabus: !!syllabus && syllabus === (course ?? focus),
          messages: slim(history),
        }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body)
        throw new Error(
          res.status === 413
            ? "Those files are too big to send together. Try fewer photos."
            : ((await res.json().catch(() => null))?.error ?? "Couldn't reach the assistant."),
        );
      // An expired session gets redirected to the login page (HTML), not the answer stream.
      if (res.headers.get("content-type")?.includes("text/html")) throw new Error("Your session ended. Sign in again.");
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
            t: "read" | "think" | "reason" | "search" | "sources" | "text" | "propose" | "cards" | "error";
            v?: string | Proposal[] | Deck | Chain["sources"];
          };
          // Every event also moves the thought chain along (see ThoughtChain).
          const step = (m: ChatMessage, s: string) => m.chain && addStep(m.chain, s);
          if (e.t === "read") patch((m) => ({ ...m, chain: step(m, "Reading your courses") }));
          else if (e.t === "think")
            patch((m) => ({ ...m, state: m.text ? m.state : "thinking", chain: step(m, "Thinking it through") }));
          else if (e.t === "reason")
            patch((m) => ({ ...m, chain: m.chain && { ...m.chain, reasoning: m.chain.reasoning + e.v } }));
          else if (e.t === "search")
            patch((m) => ({ ...m, chain: m.chain && { ...addStep(m.chain, "Searching the web"), query: e.v as string } }));
          else if (e.t === "sources")
            patch((m) => ({ ...m, chain: m.chain && { ...m.chain, sources: e.v as Chain["sources"] } }));
          else if (e.t === "text")
            patch((m) => ({ ...m, text: m.text + e.v, state: "writing", chain: step(m, "Writing the answer") }));
          else if (e.t === "propose")
            patch((m) => ({
              ...m,
              proposals: (e.v as Proposal[]).map((p) => ({ p, status: "pending" as const })),
              chain: step(m, `Drafted ${(e.v as Proposal[]).length === 1 ? "a change" : `${(e.v as Proposal[]).length} changes`} for you to confirm`),
            }));
          else if (e.t === "cards") patch((m) => ({ ...m, cards: e.v as Deck, chain: step(m, "Made flashcards") }));
          else throw new Error(String(e.v));
        }
      }
      patch((m) =>
        m.text || m.proposals?.length || m.cards
          ? { ...m, state: undefined, chain: m.chain && { ...m.chain, ms: Date.now() - m.chain.started } }
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
    setItemId(null);
    setSyllabus("");
  };
  const detach = () => {
    dirty.current = true; // saved without the link, so "Ask about this" starts fresh next time
    setItemId(null);
  };
  // Another course means another subject: the assignment chip goes.
  const changeFocus = (code: string) => {
    if (item && code !== item.course) detach();
    if (code !== syllabus) setSyllabus("");
    setFocus(code);
  };
  // The syllabus chip is the course focus made visible: removing it drops the focus too.
  const detachSyllabus = () => {
    setSyllabus("");
    setFocus("");
  };

  // Save once an answer (or a yes/no) settles. Streaming states and in-flight saves aren't stored.
  useEffect(() => {
    if (!dirty.current || !chatId || !messages.length || messages.some((m) => m.state)) return;
    dirty.current = false;
    const first = messages.find((m) => m.role === "user");
    const title = first?.text || first?.files?.map((f) => f.name).join(", ") || "";
    const stored = messages.map((m) => ({
      ...m,
      state: undefined, // dropped by JSON
      // photos stay in this session only, and a file keeps its first 4k characters (saves have a size limit)
      files: m.files?.map((f) => ({ name: f.name, text: f.text?.slice(0, 4000) })),
      chain: m.chain && { ...m.chain, reasoning: m.chain.reasoning.slice(0, 4000) },
      proposals: m.proposals?.map((x) => (x.status === "saving" ? { ...x, status: "pending" as const } : x)),
    }));
    // item?.id: an assignment deleted meanwhile isn't linked (its row is gone)
    saveChat(chatId, title, focus, stored, item?.id ?? null).then((r) => r.error && console.error("[chat]", r.error));
  }, [messages, chatId, focus, item?.id]);

  const open = async (id: string) => {
    const r = await loadChat(id);
    if (!r.chat) {
      toast.error(r.error);
      return false;
    }
    inflight.current?.abort();
    const loaded = (r.chat.messages as ChatMessage[]).map((m, i) => ({ ...m, id: i }));
    nextId.current = loaded.length + 1; // new messages get fresh ids
    setMessages(loaded);
    setFocus(r.chat.focus);
    setItemId(r.chat.item_id ?? null);
    setSyllabus("");
    setChatId(id);
    return true;
  };

  const askAbout = async (i: Item) => {
    if (itemId !== i.id) {
      const saved = await itemChat(i.id);
      if (!saved || !(await open(saved))) clear();
    }
    setFocus(i.course); // the course's syllabus and materials come along, as with "Ask about it"
    setItemId(i.id);
    setSyllabus("");
    router.push("/chat"); // the full chat page, not the side panel
  };
  const askSyllabus = (course: string) => {
    clear(); // a fresh chat about this course's syllabus, not a switch mid-conversation
    setFocus(course); // the chat reads the course's syllabus and materials in full
    setSyllabus(course);
    router.push("/chat");
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
      shortcuts={shortcutsFor(
        focus || courses.find((c) => path === `/courses/${c.id}`)?.code,
        schedule.items,
        now,
        item,
      )}
      className={className}
    />
  );

  return (
    <MotionConfig reducedMotion="user">
      <CreateContext.Provider value={create}>
        <SettingsContext.Provider
          value={(section = "semester") => {
            setSync(false);
            setSettings(section);
          }}
        >
          <AssistantContext.Provider
            value={{
              messages,
              busy: messages.some((m) => m.state),
              send,
              clear,
              resolve,
              focus,
              setFocus: changeFocus,
              focusKey,
              courses,
              schedule,
              open,
              chatId,
              show: openAssistant,
              item,
              detach,
              askAbout,
              syllabus,
              askSyllabus,
              detachSyllabus,
            }}
          >
            <FocusProvider>
            <div className="flex min-h-dvh flex-col md:flex-row">
              <Sidebar
                onCreate={create}
                onSettings={() => setSettings("account")}
                onSync={() => {
                  setSettings(null);
                  setSync(true);
                }}
                syncFailed={account.canvas.lastSyncStatus === "error"}
              />
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
                <div
                  className="fixed inset-x-0 z-50 xl:hidden"
                  style={{ top: "var(--vvtop, 0px)", height: "var(--vvh, 100dvh)" }}
                >
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
                    {panel(() => setSheet(false), "h-full w-full border-l border-border")}
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
            <SyncWindow open={sync} onClose={() => setSync(false)} account={account} />
            <UploadWindow
              key={upload.n}
              open={upload.open}
              course={upload.course}
              onClose={() => setUpload((u) => ({ ...u, open: false }))}
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
            </FocusProvider>
          </AssistantContext.Provider>
        </SettingsContext.Provider>
      </CreateContext.Provider>
    </MotionConfig>
  );
}
