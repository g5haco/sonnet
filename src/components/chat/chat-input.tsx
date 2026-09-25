"use client";

// Adapted from HextaUI's ai-chat-input (chatbox design.txt): cycling letter-blur placeholder,
// expands on focus. Changes: shortcut chips instead of Think/Deep Search, voice dictation
// (Web Speech API + voice-glow), metal send button, textarea, reduced-motion aware.
import { ArrowUp, FileText, Globe, Lightbulb, Mic, Paperclip, Square, X } from "lucide-react";
import { MetalFx } from "metal-fx";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useTheme } from "next-themes";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { useMicrophone, VoiceBeam } from "voice-glow";
import { SHORTCUTS } from "@/components/chat/shortcuts";
import { MAX_FILES, readAttachment, type ChatFile } from "@/lib/attach";
import { cn, isShown } from "@/lib/utils";

const PLACEHOLDERS = [
  "What's due before Friday?",
  "Make me a study plan for my next exam",
  "What did I miss this week?",
  "Explain my essay prompt",
  "How should I split up this weekend?",
];

// --- Dictation: the browser's own speech recognition (free; Chrome, Edge, Safari) ---
type Recognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  start: () => void;
  stop: () => void;
};
type RecognitionCtor = new () => Recognition;
const recognition = () =>
  typeof window === "undefined"
    ? undefined
    : ((window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor })
        .SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: RecognitionCtor }).webkitSpeechRecognition);
// Server renders "unsupported"; the client corrects it without a hydration mismatch.
const useDictationSupported = () =>
  useSyncExternalStore(
    () => () => {},
    () => !!recognition(),
    () => false,
  );

export function ChatInput({
  onSend,
  focusKey,
  busy = false,
  shortcuts = true,
  className,
}: {
  onSend: (text: string, think: boolean, files?: ChatFile[], course?: string, search?: boolean) => void;
  busy?: boolean; // an answer is streaming
  shortcuts?: boolean; // off while the empty state already lists them
  focusKey?: number; // bump to focus the input (e.g. ⌘K)
  className?: string;
}) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [placeholder, setPlaceholder] = useState(0);
  const [listening, setListening] = useState(false);
  const [think, setThink] = useState(false); // off = Sonnet decides per question
  const [search, setSearch] = useState(false); // off = only when the question asks for sources or a fact check
  const [drop, setDrop] = useState<DOMRect | null>(null); // files dragged over the chat: where the overlay goes
  const [files, setFiles] = useState<ChatFile[]>([]);
  const [reading, setReading] = useState(0); // attachments still being prepared
  const picker = useRef<HTMLInputElement>(null);
  const wrapper = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const rec = useRef<Recognition | null>(null);
  const id = useId(); // the docked panel and the phone sheet can both be mounted
  const still = useReducedMotion();
  const dictation = useDictationSupported();
  const mic = useMicrophone();
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "light" ? "light" : "dark";
  const expanded = shortcuts && (focused || !!value || listening);

  // Cycle example questions while idle (not with reduced motion).
  useEffect(() => {
    if (expanded || still) return;
    const timer = setInterval(() => setPlaceholder((p) => (p + 1) % PLACEHOLDERS.length), 3200);
    return () => clearInterval(timer);
  }, [expanded, still]);

  // Collapse when clicking elsewhere with nothing typed.
  useEffect(() => {
    const away = (e: PointerEvent) => {
      if (wrapper.current && !wrapper.current.contains(e.target as Node)) setFocused(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, []);

  useEffect(() => {
    if (focusKey && isShown(field.current)) field.current?.focus();
  }, [focusKey]);

  useEffect(() => () => rec.current?.stop(), []);

  const send = (text: string) => {
    const t = text.trim();
    if ((!t && !files.length) || busy || reading) return;
    rec.current?.stop();
    onSend(t, think, files.length ? files : undefined, undefined, search);
    setValue("");
    setFiles([]);
  };

  // Photos, PDFs and text files: prepared here (shrunk / read to text), then sent with the next message.
  const attach = async (list: File[]) => {
    const room = MAX_FILES - files.length;
    if (list.length > room) toast.error(`Up to ${MAX_FILES} files per message.`);
    for (const file of list.slice(0, Math.max(room, 0))) {
      setReading((n) => n + 1);
      try {
        const ready = await readAttachment(file);
        setFiles((f) => (f.length < MAX_FILES ? [...f, ready] : f));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : `Couldn't read ${file.name}.`);
      } finally {
        setReading((n) => n - 1);
      }
    }
    field.current?.focus();
  };

  // Files dragged anywhere over the chat (the panel or the Chat page, marked data-chat) show a drop overlay.
  useEffect(() => {
    const zone = wrapper.current?.closest("[data-chat]");
    if (!zone) return;
    const enter = (e: Event) => {
      if (!(e as DragEvent).dataTransfer?.types.includes("Files") || !isShown(zone)) return;
      setDrop(zone.getBoundingClientRect());
    };
    const end = () => setDrop(null);
    zone.addEventListener("dragenter", enter);
    window.addEventListener("dragend", end);
    window.addEventListener("drop", end);
    return () => {
      zone.removeEventListener("dragenter", enter);
      window.removeEventListener("dragend", end);
      window.removeEventListener("drop", end);
    };
  }, []);

  const toggleDictation = async () => {
    if (listening) return rec.current?.stop();
    const Rec = recognition();
    if (!Rec) return;
    const base = value.trim();
    const r = new Rec();
    r.continuous = true;
    r.interimResults = true;
    r.lang = navigator.language;
    r.onresult = (e) => {
      const heard = Array.from(e.results, (res) => res[0].transcript).join("");
      setValue(base ? `${base} ${heard}` : heard);
    };
    r.onend = () => {
      setListening(false);
      mic.stop();
    };
    r.onerror = (e) => {
      if (e.error === "not-allowed") toast.error("Microphone access is blocked. Allow it in your browser to dictate.");
      else if (e.error !== "no-speech" && e.error !== "aborted") toast.error("Dictation stopped. Try again.");
    };
    rec.current = r;
    r.start();
    setListening(true);
    void mic.start(); // only feeds the glow; recognition works without it
  };

  return (
    <div ref={wrapper} className={cn("w-full", className)}>
      <AnimatePresence>
        {drop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ top: drop.top, left: drop.left, width: drop.width, height: drop.height }}
            className="fixed z-50 p-3"
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setDrop(null)}
            onDrop={(e) => {
              e.preventDefault();
              setDrop(null);
              void attach([...e.dataTransfer.files]);
            }}
          >
            <motion.div
              initial={{ scale: 0.96 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className="pointer-events-none grid size-full place-items-center rounded-3xl border-2 border-dashed border-brand bg-brand/10 backdrop-blur-sm"
            >
              <span className="flex flex-col items-center gap-3 text-sm font-medium text-brand">
                <motion.span
                  animate={still ? undefined : { y: [0, -6, 0] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                  className="grid size-14 place-items-center rounded-2xl bg-brand/15"
                >
                  <Paperclip className="size-6" aria-hidden="true" />
                </motion.span>
                Drop files here to add to chat
                <span className="text-xs font-normal text-muted-foreground">Photos, PDFs or text · up to {MAX_FILES}</span>
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <VoiceBeam
        stream={listening ? mic.stream : null}
        active={listening}
        idle={0}
        colorVariant="ice"
        theme={theme}
        className="rounded-3xl"
      >
        <div
          className="@container rounded-3xl bg-secondary transition-shadow focus-within:ring-2 focus-within:ring-ring"
          onClick={() => field.current?.focus()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void attach([...e.dataTransfer.files]);
          }}
        >
          {(files.length > 0 || reading > 0) && (
            <div className="flex flex-wrap gap-2 px-3 pt-3">
              {files.map((f, i) => (
                <span key={i} className="group relative">
                  {f.image ? (
                    // eslint-disable-next-line @next/next/no-img-element -- a local data: URL, nothing to optimize
                    <img src={f.image} alt={f.name} className="size-14 rounded-xl object-cover ring-1 ring-border" />
                  ) : (
                    <span className="flex h-14 max-w-44 items-center gap-2 rounded-xl bg-background px-3 text-xs">
                      <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      <span className="truncate">{f.name}</span>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFiles((all) => all.filter((_, j) => j !== i));
                    }}
                    aria-label={`Remove ${f.name}`}
                    className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-foreground text-background focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
              {reading > 0 && (
                <span
                  aria-busy="true"
                  className="grid size-14 place-items-center rounded-xl bg-background text-muted-foreground"
                >
                  <Paperclip className="size-4 motion-safe:animate-pulse" aria-label="Reading the file" />
                </span>
              )}
            </div>
          )}
          {/* Narrow (the docked assistant): the text gets the whole width and the buttons sit on a row below. */}
          <div className="flex items-end gap-1.5 p-2 @max-md:flex-wrap">
            <div className="relative min-w-0 flex-1 self-center @max-md:basis-full">
              <label htmlFor={id} className="sr-only">
                Ask about your courses
              </label>
              <textarea
                ref={field}
                id={id}
                rows={1}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onFocus={() => setFocused(true)}
                onPaste={(e) => {
                  const pasted = [...e.clipboardData.files];
                  if (pasted.length) {
                    e.preventDefault();
                    void attach(pasted); // a screenshot pasted straight into the chat
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(value);
                  }
                }}
                className="block max-h-40 min-h-9 w-full resize-none bg-transparent px-2 py-2 text-base outline-none [field-sizing:content] [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin] md:text-sm"
              />
              {/* Animated placeholder: one example question at a time, letters blurring in. */}
              {!value && (
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center px-2">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={focused || still ? "static" : placeholder}
                      className="truncate text-sm whitespace-nowrap text-muted-foreground"
                      initial="hidden"
                      animate="shown"
                      exit="gone"
                      variants={{
                        shown: { transition: { staggerChildren: 0.02 } },
                        gone: { transition: { staggerChildren: 0.01 } },
                      }}
                    >
                      {(focused ? "Ask anything about your courses…" : PLACEHOLDERS[placeholder])
                        .split("")
                        .map((ch, i) => (
                          <motion.span
                            key={i}
                            className="inline-block"
                            variants={{
                              hidden: { opacity: 0, filter: "blur(8px)", y: 6 },
                              shown: { opacity: 1, filter: "blur(0px)", y: 0, transition: { duration: 0.3 } },
                              gone: { opacity: 0, filter: "blur(8px)", y: -6, transition: { duration: 0.2 } },
                            }}
                          >
                            {ch === " " ? "\u00a0" : ch}
                          </motion.span>
                        ))}
                    </motion.span>
                  </AnimatePresence>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                picker.current?.click();
              }}
              disabled={files.length >= MAX_FILES}
              aria-label="Attach a photo or file"
              title="Attach photos, PDFs or text files (or paste a screenshot)"
              className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
            >
              <Paperclip className="size-4" />
            </button>
            <input
              ref={picker}
              type="file"
              multiple
              accept="image/*,.pdf,.txt,.md"
              hidden
              onChange={(e) => {
                void attach([...(e.target.files ?? [])]);
                e.target.value = "";
              }}
            />
            {/* Search: look things up on the web and cite sources. Off = only when the question asks for it. */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSearch((v) => !v);
              }}
              aria-pressed={search}
              aria-label="Search the web"
              title={search ? "Web search on: answers cite their sources" : "Search the web (otherwise only when asked for sources)"}
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                search ? "bg-brand/15 text-brand" : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Globe className="size-4" />
            </button>
            {/* Think: force careful (slower) answers. Off = Sonnet decides from the question. */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setThink((v) => !v);
              }}
              aria-pressed={think}
              aria-label="Think harder"
              title={think ? "Thinking on: slower, more careful answers" : "Think harder (otherwise Sonnet decides)"}
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                think ? "bg-brand/15 text-brand" : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Lightbulb className={cn("size-4", think && "fill-current")} />
            </button>
            {dictation && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void toggleDictation();
                }}
                aria-pressed={listening}
                aria-label={listening ? "Stop dictating" : "Dictate"}
                title="Dictation uses your browser's speech service (Chrome sends the audio to Google)."
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                  listening
                    ? "bg-brand text-brand-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {listening ? <Square className="size-3.5 fill-current" /> : <Mic className="size-4" />}
              </button>
            )}

            <span aria-hidden="true" className="hidden flex-1 @max-md:block" />
            {/* Metal marks the AI: it brightens once there's something to send. */}
            <MetalFx
              variant="circle"
              preset="silver"
              theme={theme}
              strength={(value.trim() || files.length) && !busy && !reading ? 1 : 0.35}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  send(value);
                }}
                disabled={(!value.trim() && !files.length) || busy || reading > 0}
                aria-label="Send"
                className="grid size-9 place-items-center rounded-full bg-foreground text-background transition-transform active:scale-95 disabled:bg-accent disabled:text-muted-foreground"
              >
                <ArrowUp className="size-4" />
              </button>
            </MetalFx>
          </div>

          {/* Expanded: shortcuts for the questions students ask most. */}
          <motion.div
            initial={false}
            animate={{ height: expanded ? "auto" : 0, opacity: expanded ? 1 : 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
            inert={!expanded}
          >
            <div className="flex flex-wrap gap-1.5 px-2 pb-2">
              {SHORTCUTS.map(({ label, prompt, icon: Icon }) => (
                <button
                  key={label}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    send(prompt);
                  }}
                  className="flex h-8 items-center gap-1.5 rounded-full bg-background/60 px-3 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Icon className="size-3.5" aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </VoiceBeam>
    </div>
  );
}
