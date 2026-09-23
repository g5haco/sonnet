"use client";

// Adapted from HextaUI's ai-chat-input (chatbox design.txt): cycling letter-blur placeholder,
// expands on focus. Changes: shortcut chips instead of Think/Deep Search, voice dictation
// (Web Speech API + voice-glow), metal send button, textarea, reduced-motion aware.
import { ArrowUp, Mic, Square } from "lucide-react";
import { MetalFx } from "metal-fx";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useTheme } from "next-themes";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { useMicrophone, VoiceBeam } from "voice-glow";
import { SHORTCUTS } from "@/components/chat/shortcuts";
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
  onSend: (text: string) => void;
  busy?: boolean; // an answer is streaming
  shortcuts?: boolean; // off while the empty state already lists them
  focusKey?: number; // bump to focus the input (e.g. ⌘K)
  className?: string;
}) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [placeholder, setPlaceholder] = useState(0);
  const [listening, setListening] = useState(false);
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
    if (!t || busy) return;
    rec.current?.stop();
    onSend(t);
    setValue("");
  };

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
      <VoiceBeam
        stream={listening ? mic.stream : null}
        active={listening}
        idle={0}
        colorVariant="ice"
        theme={theme}
        className="rounded-3xl"
      >
        <div
          className="rounded-3xl bg-secondary transition-shadow focus-within:ring-2 focus-within:ring-ring"
          onClick={() => field.current?.focus()}
        >
          <div className="flex items-end gap-1.5 p-2">
            <div className="relative min-w-0 flex-1 self-center">
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
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(value);
                  }
                }}
                className="block max-h-40 min-h-9 w-full resize-none bg-transparent px-2 py-2 text-base outline-none [field-sizing:content] md:text-sm"
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

            {/* Metal marks the AI: it brightens once there's something to send. */}
            <MetalFx variant="circle" preset="silver" theme={theme} strength={value.trim() && !busy ? 1 : 0.35}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  send(value);
                }}
                disabled={!value.trim() || busy}
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
