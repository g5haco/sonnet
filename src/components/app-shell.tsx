"use client";

import { MetalFx } from "metal-fx";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ThinkingOrb } from "thinking-orbs";
import { ChatPanel, type ChatMessage } from "@/components/chat/chat-panel";
import { createItem, updateItem } from "@/app/actions";
import { CourseDialog, ItemDialog } from "@/components/create-forms";
import type { CreateKind } from "@/components/create-menu";
import { Sidebar } from "@/components/sidebar";
import type { Proposal } from "@/lib/ai";
import type { Item } from "@/lib/progress";
import { cn } from "@/lib/utils";

type Course = { id: string; code: string; hue: number };

// Any page can open the Create flows (e.g. the dashboard's "Add your first course").
const CreateContext = createContext<(kind: CreateKind) => void>(() => {});
export const useCreate = () => useContext(CreateContext);

const WIDE = "(min-width: 1280px)"; // xl: the assistant docks beside the page

export function AppShell({ courses, children }: { courses: Course[]; children: React.ReactNode }) {
  const [now] = useState(() => Date.now());
  const [dialog, setDialog] = useState<"course" | Item["kind"] | null>(null);
  // Assistant: docked (wide screens, open by default) or a sheet (everything else).
  const [docked, setDocked] = useState(true);
  const [sheet, setSheet] = useState(false);
  const [focusKey, setFocusKey] = useState(0);
  // Session-only history (decided 2026-09-23): lives here, so it survives page changes.
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const nextId = useRef(0);
  const inflight = useRef<AbortController | null>(null);
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "light" ? "light" : "dark";

  const create = (kind: CreateKind) => {
    if (kind === "upload") return router.push("/materials");
    if (kind !== "course" && courses.length === 0) {
      toast("Add a course first. Assignments and exams hang off it.");
      return setDialog("course");
    }
    setDialog(kind);
  };

  const openAssistant = () => {
    if (window.matchMedia(WIDE).matches) setDocked(true);
    else setSheet(true);
    setFocusKey((k) => k + 1);
  };

  // Streams the answer from /api/chat (NDJSON events: think | text | error) into the conversation.
  const send = async (text: string, think = false) => {
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
          const e = JSON.parse(line) as { t: "think" | "text" | "propose" | "error"; v?: string | Proposal[] };
          if (e.t === "think") patch((m) => ({ ...m, state: m.text ? m.state : "thinking" }));
          else if (e.t === "text") patch((m) => ({ ...m, text: m.text + e.v, state: "writing" }));
          else if (e.t === "propose")
            patch((m) => ({ ...m, proposals: (e.v as Proposal[]).map((p) => ({ p, status: "pending" as const })) }));
          else throw new Error(String(e.v));
        }
      }
      patch((m) =>
        m.text || m.proposals?.length
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
  const resolve = async (message: number, index: number, accept: boolean) => {
    const set = (status: "saving" | "saved" | "skipped" | "error", error?: string) =>
      setMessages((all) =>
        all.map((m) =>
          m.id === message
            ? { ...m, proposals: m.proposals?.map((x, i) => (i === index ? { ...x, status, error } : x)) }
            : m,
        ),
      );
    const p = messages.find((m) => m.id === message)?.proposals?.[index]?.p;
    if (!p || !accept) return set("skipped");
    set("saving");
    let result: { error?: string };
    if (p.type === "add") {
      const squash = (code: string) => code.replace(/\s+/g, "").toUpperCase();
      const course = courses.find((c) => squash(c.code) === squash(p.course));
      if (!course) return set("error", `No course called ${p.course}. Add it first with the +.`);
      const form = new FormData();
      form.set("title", p.title);
      form.set("kind", p.kind);
      form.set("course", course.id);
      form.set("due", new Date(p.due).toISOString()); // the model gives local time; this browser knows the zone
      result = await createItem(form);
    } else {
      result = await updateItem(p.id, { title: p.title, due: p.due && new Date(p.due).toISOString(), done: p.done });
    }
    if (result.error) set("error", result.error);
    else set("saved");
  };

  const clear = () => {
    inflight.current?.abort();
    setMessages([]);
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
  }, []);

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
        <div className="flex min-h-dvh flex-col md:flex-row">
          <Sidebar onCreate={create} />
          <div className="min-w-0 flex-1">{children}</div>
          {docked &&
            panel(
              () => setDocked(false),
              "sticky top-0 hidden h-dvh w-[380px] shrink-0 border-l border-border xl:flex",
            )}
        </div>

        {/* The metal "Ask" button: always below xl; on xl only while the dock is closed. */}
        <div className={cn("fixed right-4 bottom-4 z-40 md:right-6 md:bottom-6", docked && "xl:hidden")}>
          <MetalFx variant="circle" preset="silver" theme={theme}>
            <button
              type="button"
              onClick={openAssistant}
              aria-label="Ask the assistant (Ctrl+K)"
              className="grid size-12 place-items-center rounded-full bg-foreground shadow-lg transition-transform active:scale-95"
            >
              <ThinkingOrb state="breathing" size={20} theme={theme === "dark" ? "light" : "dark"} aria-hidden="true" />
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

        <CourseDialog open={dialog === "course"} onOpenChange={(o) => !o && setDialog(null)} />
        <ItemDialog
          kind={dialog === "course" ? null : dialog}
          courses={courses}
          now={now}
          onOpenChange={(o) => !o && setDialog(null)}
        />
      </CreateContext.Provider>
    </MotionConfig>
  );
}
