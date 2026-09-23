"use client";

import { MetalFx } from "metal-fx";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { ThinkingOrb } from "thinking-orbs";
import { ChatPanel, type ChatMessage } from "@/components/chat/chat-panel";
import { CourseDialog, ItemDialog } from "@/components/create-forms";
import type { CreateKind } from "@/components/create-menu";
import { Sidebar } from "@/components/sidebar";
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

  const send = (text: string) =>
    setMessages((m) => [
      ...m,
      { id: m.length, role: "user", text },
      // Phase 3 connects Claude; until then, say so instead of pretending.
      { id: m.length + 1, role: "note", text: "I'm not connected yet. Real answers arrive in Phase 3." },
    ]);

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
      onClear={() => setMessages([])}
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
          {docked && panel(() => setDocked(false), "sticky top-0 hidden h-dvh w-[380px] shrink-0 border-l border-border xl:flex")}
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
