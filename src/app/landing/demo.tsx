"use client";
// The landing page's try-it-now demo: a small, self-contained copy of Sonnet on sample data. Everything lives in
// this component's state (nothing is saved or sent anywhere); the assistant's answers are built from that state,
// not from an AI. Loaded client-only, since the sample dates are relative to the visitor's today.
import { CalendarDays, Check, Home, LibraryBig, MessageCircle, Pause, Play, RotateCcw, Timer, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { courseColor } from "@/lib/course";
import { cn } from "@/lib/utils";

const COURSES = [
  { code: "BIO 110", name: "Cell Biology", hue: 150, grade: 91.2 },
  { code: "HIST 201", name: "Modern Europe", hue: 35, grade: 84.5 },
  { code: "CALC II", name: "Calculus II", hue: 250, grade: 78.9 },
  { code: "PSYC 100", name: "Intro to Psychology", hue: 295, grade: 95.1 },
];

type Item = { id: number; title: string; c: number; day: number; kind: "assignment" | "exam" | "quiz" | "reading"; done: boolean };

const START: Item[] = [
  { id: 1, title: "Lab report: osmosis", c: 0, day: -1, kind: "assignment", done: false },
  { id: 2, title: "Problem set 6", c: 2, day: 0, kind: "assignment", done: false },
  { id: 3, title: "Chapter 4 reading", c: 3, day: 0, kind: "reading", done: false },
  { id: 4, title: "Essay outline", c: 1, day: 1, kind: "assignment", done: false },
  { id: 5, title: "Quiz 3", c: 3, day: 2, kind: "quiz", done: false },
  { id: 6, title: "Midterm", c: 2, day: 5, kind: "exam", done: false },
  { id: 7, title: "Primary source response", c: 1, day: 4, kind: "assignment", done: false },
  { id: 8, title: "Discussion post", c: 0, day: -3, kind: "assignment", done: true },
];

const DAY = 864e5;
const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const chip = (color: string) => ({ "--chip": color }) as React.CSSProperties;

function dueLabel(i: Item, today: Date) {
  if (i.done) return { text: "done", tone: "var(--done)" };
  if (i.day < 0) return { text: `${-i.day}d late`, tone: "var(--destructive)" };
  if (i.day === 0) return { text: "today", tone: "var(--warning)" };
  if (i.day === 1) return { text: "tmrw", tone: "var(--warning)" };
  return { text: new Date(+today + i.day * DAY).toLocaleDateString(undefined, { weekday: "short" }), tone: null };
}

type View = "home" | "calendar" | "courses";
type Msg = { from: "you" | "sonnet"; text: string };

export default function Demo() {
  const [today] = useState(() => new Date(new Date().setHours(12, 0, 0, 0)));
  const [items, setItems] = useState(START);
  const [view, setView] = useState<View>("home");
  const [open, setOpen] = useState<number | null>(null);
  const [chat, setChat] = useState(false); // phones: the assistant is a sheet
  const toggle = (id: number) => setItems((l) => l.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));

  const openItems = items.filter((i) => !i.done);
  const overdue = openItems.filter((i) => i.day < 0).length;
  const week = openItems.filter((i) => i.day >= 0 && i.day < 7).length;
  const exam = openItems.find((i) => i.kind === "exam");
  const detail = items.find((i) => i.id === open);

  const NAV = [
    { id: "home" as const, icon: Home, label: "Home" },
    { id: "calendar" as const, icon: CalendarDays, label: "Calendar" },
    { id: "courses" as const, icon: LibraryBig, label: "Courses" },
  ];

  return (
    <div className="relative flex h-full text-left text-sm">
      <nav aria-label="Demo" className="flex w-14 shrink-0 flex-col items-center gap-2 border-r border-border bg-sidebar py-4">
        <span className="mb-2 font-mono font-medium">s.</span>
        {NAV.map((n) => (
          <button
            key={n.id}
            type="button"
            title={n.label}
            aria-label={n.label}
            aria-current={view === n.id ? "page" : undefined}
            onClick={() => setView(n.id)}
            className={cn(
              "grid size-10 place-items-center rounded-xl transition-colors",
              view === n.id ? "bg-primary/12 text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <n.icon className="size-5" />
          </button>
        ))}
        <button
          type="button"
          aria-label="Assistant"
          onClick={() => setChat(true)}
          className="mt-auto grid size-10 place-items-center rounded-full bg-secondary lg:hidden"
        >
          <MessageCircle className="size-5" />
        </button>
      </nav>

      <div className="min-w-0 flex-1 overflow-y-auto p-4 md:p-6 [scrollbar-width:thin]">
        {view === "home" && (
          <>
            <h3 className="text-2xl font-medium tracking-tight">Good afternoon, Alex.</h3>
            <p className="mt-1 flex flex-wrap gap-x-4 font-mono text-xs text-muted-foreground">
              {overdue > 0 ? (
                <span className="font-medium text-destructive">● {overdue} overdue</span>
              ) : (
                <span className="text-done">nothing overdue</span>
              )}
              <span>{week} due this week</span>
              {exam && <span>{COURSES[exam.c].code} exam in {exam.day}d</span>}
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-5">
              <section className="rounded-2xl bg-card p-4 md:col-span-3">
                <header className="mb-2 flex items-baseline justify-between">
                  <h4 className="font-medium text-muted-foreground">Up next</h4>
                  <span className="font-mono text-xs text-muted-foreground">tap a circle</span>
                </header>
                <ul>
                  {[...items].sort((a, b) => Number(a.done) - Number(b.done) || a.day - b.day).map((i) => {
                    const d = dueLabel(i, today);
                    return (
                      <li key={i.id} className="flex items-center gap-3 py-1.5">
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={i.done}
                          aria-label={`Mark ${i.title} done`}
                          onClick={() => toggle(i.id)}
                          className={cn(
                            "grid size-5 shrink-0 place-items-center rounded-full border transition-colors",
                            i.done ? "border-done bg-done text-background" : "border-foreground/30 hover:border-foreground",
                          )}
                        >
                          {i.done && <Check className="size-3 motion-safe:animate-check-pop" strokeWidth={3} />}
                        </button>
                        <button type="button" onClick={() => setOpen(i.id)} className="min-w-0 flex-1 text-left">
                          <span className={cn("block truncate", i.done && "text-muted-foreground line-through")}>{i.title}</span>
                          <span className="chip rounded-full px-1.5 font-mono text-xs" style={chip(courseColor(COURSES[i.c].hue))}>
                            {COURSES[i.c].code}
                          </span>
                        </button>
                        <span
                          className={cn("shrink-0 font-mono text-xs", d.tone ? "chip rounded-full px-1.5" : "text-muted-foreground")}
                          style={d.tone ? chip(d.tone) : undefined}
                        >
                          {d.text}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>
              <div className="flex flex-col gap-3 md:col-span-2">
                <section className="rounded-2xl bg-card p-4">
                  <h4 className="mb-3 font-medium text-muted-foreground">This week</h4>
                  <WeekStrip items={openItems} today={today} />
                </section>
                <Focus />
              </div>
            </div>
          </>
        )}

        {view === "calendar" && (
          <>
            <h3 className="text-2xl font-medium tracking-tight">This week</h3>
            <p className="mt-1 font-mono text-xs text-muted-foreground">tap anything to open it</p>
            <div className="mt-5 grid grid-cols-7 gap-1.5">
              {Array.from({ length: 7 }, (_, k) => {
                const offset = k - ((today.getDay() + 6) % 7);
                const d = new Date(+today + offset * DAY);
                return (
                  <div key={k} className={cn("min-h-64 rounded-xl p-1.5", offset === 0 ? "bg-accent" : "bg-card")}>
                    <p className="text-center font-mono text-[11px] text-muted-foreground">{WEEK[k]}</p>
                    <p className={cn("mx-auto mb-2 grid size-7 place-items-center rounded-full text-center", offset === 0 && "bg-primary text-primary-foreground")}>
                      {d.getDate()}
                    </p>
                    {items
                      .filter((i) => i.day === offset)
                      .map((i) => (
                        <button
                          key={i.id}
                          type="button"
                          onClick={() => setOpen(i.id)}
                          className={cn("mb-1 block w-full truncate rounded-md px-1.5 py-1 text-left text-[11px] text-[oklch(0.2_0_0)]", i.done && "opacity-50 line-through")}
                          style={{ background: courseColor(COURSES[i.c].hue) }}
                        >
                          {i.title}
                        </button>
                      ))}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {view === "courses" && (
          <>
            <h3 className="text-2xl font-medium tracking-tight">Courses</h3>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {COURSES.map((c, k) => {
                const left = openItems.filter((i) => i.c === k).length;
                return (
                  <div
                    key={c.code}
                    className="flex h-40 flex-col rounded-2xl p-4 text-[oklch(0.2_0_0)]"
                    style={{ background: `linear-gradient(165deg, oklch(0.82 0.15 ${c.hue}), oklch(0.72 0.17 ${c.hue}))` }}
                  >
                    <p className="font-mono text-lg font-semibold">{c.code}</p>
                    <p className="text-xs">{c.name}</p>
                    <p className="mt-auto font-mono text-3xl">{left}</p>
                    <p className="flex justify-between border-t border-[oklch(0.2_0_0/0.2)] pt-1.5 font-mono text-xs">
                      <span>open</span>
                      <span>grade {c.grade}%</span>
                    </p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <Assistant items={items} today={today} open={chat} onClose={() => setChat(false)} />

      {detail && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-black/40 p-4" onClick={() => setOpen(null)}>
          <div
            role="dialog"
            aria-label={detail.title}
            className="w-full max-w-xs rounded-2xl bg-popover p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                <span className="size-2 rounded-full" style={{ background: courseColor(COURSES[detail.c].hue) }} />
                {COURSES[detail.c].code} · {detail.kind}
              </p>
              <button type="button" aria-label="Close" onClick={() => setOpen(null)} className="text-muted-foreground hover:text-foreground">
                <X className="size-4" />
              </button>
            </div>
            <p className="mt-2 text-base font-medium">{detail.title}</p>
            <p className="mt-1 text-muted-foreground">
              Due {new Date(+today + detail.day * DAY).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}, 11:59 PM
            </p>
            <button
              type="button"
              onClick={() => toggle(detail.id)}
              className="mt-4 h-9 w-full rounded-full bg-primary text-sm font-medium text-primary-foreground"
            >
              {detail.done ? "Mark not done" : "Mark done"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function WeekStrip({ items, today }: { items: Item[]; today: Date }) {
  const monday = -((today.getDay() + 6) % 7);
  return (
    <div className="grid grid-cols-7 text-center">
      {WEEK.map((w, k) => {
        const offset = monday + k;
        return (
          <div key={w} className="flex flex-col items-center gap-1">
            <span className="font-mono text-[10px] text-muted-foreground">{w[0]}</span>
            <span className={cn("grid size-7 place-items-center rounded-full", offset === 0 && "bg-primary font-medium text-primary-foreground")}>
              {new Date(+today + offset * DAY).getDate()}
            </span>
            <span className="flex h-1.5 gap-0.5">
              {items
                .filter((i) => i.day === offset)
                .map((i) => (
                  <span key={i.id} className="size-1.5 rounded-full" style={{ background: courseColor(COURSES[i.c].hue) }} />
                ))}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// A real 25-minute timer (it counts, it just doesn't log anything).
function Focus() {
  const [left, setLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [running]);
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  return (
    <section className="flex items-center gap-3 rounded-2xl bg-card p-4">
      <Timer className="size-5 text-muted-foreground" aria-hidden="true" />
      <span className="font-mono text-2xl tabular-nums">
        {mm}:{ss}
      </span>
      <span className="ml-auto flex gap-1.5">
        <button
          type="button"
          aria-label={running ? "Pause" : "Start focus"}
          onClick={() => setRunning(!running)}
          className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground"
        >
          {running ? <Pause className="size-4" /> : <Play className="size-4" />}
        </button>
        <button
          type="button"
          aria-label="Reset"
          onClick={() => {
            setRunning(false);
            setLeft(25 * 60);
          }}
          className="grid size-9 place-items-center rounded-full bg-secondary"
        >
          <RotateCcw className="size-4" />
        </button>
      </span>
    </section>
  );
}

const ASK = ["What's due this week?", "Plan my week", "Catch me up"] as const;

// Canned answers, written from the demo's current state so they change as you check things off.
function answer(q: string, items: Item[], today: Date) {
  const open = items.filter((i) => !i.done).sort((a, b) => a.day - b.day);
  const line = (i: Item) => `• ${i.title} (${COURSES[i.c].code}), ${dueLabel(i, today).text}`;
  if (q === ASK[0]) {
    const w = open.filter((i) => i.day < 7);
    return w.length ? `${w.length} things are open this week:\n${w.map(line).join("\n")}` : "Nothing open this week. Nice.";
  }
  if (q === ASK[1]) {
    const late = open.filter((i) => i.day < 0);
    const soon = open.filter((i) => i.day >= 0 && i.day <= 1);
    const exam = open.find((i) => i.kind === "exam");
    return [
      late.length ? `First, clear what's late: ${late.map((i) => i.title).join(", ")}.` : "Nothing's late, so start with what's due soonest.",
      soon.length ? `Today and tomorrow: ${soon.map((i) => i.title).join(", ")}.` : "",
      exam ? `Then study for the ${COURSES[exam.c].code} ${exam.title.toLowerCase()} a little each day until ${dueLabel(exam, today).text}.` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }
  const late = open.filter((i) => i.day < 0);
  const done = items.filter((i) => i.done).length;
  return `${done} of ${items.length} done. ${late.length ? `${late.length} overdue: ${late.map((i) => i.title).join(", ")}.` : "Nothing overdue."}`;
}

function Assistant({ items, today, open, onClose }: { items: Item[]; today: Date; open: boolean; onClose: () => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const [text, setText] = useState("");
  const list = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Only the message list scrolls (scrollIntoView would move the whole landing page).
    list.current?.scrollTo({ top: list.current.scrollHeight });
  }, [msgs, typing]);

  const ask = (q: string) => {
    if (typing || !q.trim()) return;
    setMsgs((m) => [...m, { from: "you", text: q }]);
    setText("");
    setTyping(true);
    setTimeout(() => {
      const reply = (ASK as readonly string[]).includes(q)
        ? answer(q, items, today)
        : "In this demo I can only answer the suggestions above. Sign up and I'll answer anything about your real courses.";
      setMsgs((m) => [...m, { from: "sonnet", text: reply }]);
      setTyping(false);
    }, 700);
  };

  return (
    <aside
      aria-label="Assistant"
      className={cn(
        "w-72 shrink-0 flex-col border-l border-border bg-background max-lg:absolute max-lg:inset-y-0 max-lg:right-0 max-lg:z-10 max-lg:w-full max-lg:max-w-80",
        open ? "flex" : "hidden lg:flex",
      )}
    >
      <header className="flex h-12 items-center justify-between border-b border-border px-4">
        <span className="font-medium">Assistant</span>
        <button type="button" aria-label="Close assistant" onClick={onClose} className="text-muted-foreground lg:hidden">
          <X className="size-4" />
        </button>
      </header>
      <div ref={list} className="flex-1 overflow-y-auto p-3 [scrollbar-width:thin]">
        {msgs.length === 0 && <p className="mb-3 text-center text-muted-foreground">Ask about your courses, deadlines and exams.</p>}
        {msgs.map((m, k) => (
          <p
            key={k}
            className={cn(
              "mb-2 rounded-2xl px-3 py-2 whitespace-pre-line",
              m.from === "you" ? "ml-8 bg-secondary" : "mr-4 bg-card",
            )}
          >
            {m.text}
          </p>
        ))}
        {typing && <p className="mb-2 w-fit rounded-2xl bg-card px-3 py-2 text-muted-foreground motion-safe:animate-pulse">thinking…</p>}
      </div>
      <div className="flex flex-col gap-1.5 p-3">
        {ASK.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => ask(q)}
            className="rounded-xl bg-card px-3 py-2 text-left transition-colors hover:bg-accent"
          >
            {q}
          </button>
        ))}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(text);
          }}
          className="mt-1"
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ask anything…"
            aria-label="Ask the demo assistant"
            className="h-10 w-full rounded-xl border border-input bg-transparent px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </form>
      </div>
    </aside>
  );
}
