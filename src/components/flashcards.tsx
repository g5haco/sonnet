"use client";

import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Layers,
  Link2,
  Play,
  Plus,
  RotateCcw,
  Shuffle,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { createDeck, deleteDeck, shareDeck, updateDeck } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import type { Deck } from "@/lib/ai";
import { courseColor } from "@/lib/course";
import { cn } from "@/lib/utils";

export type Card = { front: string; back: string };
export type DeckRow = {
  id: string;
  title: string;
  cards: Card[];
  course_id: string | null;
  share_code: string | null;
  updated_at: string;
};
type Course = { id: string; code: string; hue: number };

const PILL = "h-11 gap-2 rounded-full px-4 md:h-9 active:scale-[0.97]";
const ICON = "size-11 rounded-full md:size-9";

// One card that flips on tap. The parent owns `flipped` so it can reset it when the card changes.
export function FlipCard({
  card,
  flipped,
  onFlip,
  onKeyDown,
  className,
}: {
  card: Card;
  flipped: boolean;
  onFlip: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  className?: string;
}) {
  return (
    <div className="[perspective:1200px]">
      <button
        type="button"
        onClick={onFlip}
        onKeyDown={onKeyDown}
        aria-label={`${flipped ? "Answer" : "Question"}: ${(flipped ? card.back : card.front) || "blank"}. Press to flip.`}
        className={cn(
          "relative grid min-h-36 w-full rounded-xl transition-transform duration-500 ease-out-quint [transform-style:preserve-3d] outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none",
          className,
        )}
        style={{ transform: flipped ? "rotateY(180deg)" : undefined }}
      >
        <span className="col-start-1 row-start-1 grid place-items-center overflow-auto rounded-xl bg-background p-5 text-center text-base font-medium text-balance whitespace-pre-line [backface-visibility:hidden]">
          {card.front}
        </span>
        <span className="col-start-1 row-start-1 grid place-items-center overflow-auto rounded-xl bg-background p-5 text-center text-sm text-pretty whitespace-pre-line [backface-visibility:hidden] [transform:rotateY(180deg)]">
          {card.back}
        </span>
      </button>
    </div>
  );
}

// A deck in the chat: one card at a time, tap (or Space) to flip, arrows to move.
// Decks are saved to Flashcards as they arrive; older chats' decks get a Save button.
export function FlashDeck({ deck }: { deck: Deck }) {
  const [at, setAt] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [savedId, setSavedId] = useState(deck.id);
  const [saving, start] = useTransition();
  const id = deck.id ?? savedId;
  const go = (d: number) => {
    setFlipped(false);
    setAt((i) => (i + d + deck.cards.length) % deck.cards.length);
  };
  return (
    <div className="mt-3 rounded-2xl bg-secondary p-3">
      <p className="mb-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="truncate font-medium text-foreground">{deck.title}</span>
        <span className="shrink-0 font-mono tabular-nums">
          {at + 1}/{deck.cards.length}
        </span>
      </p>
      <FlipCard
        card={deck.cards[at]}
        flipped={flipped}
        onFlip={() => setFlipped((f) => !f)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
            e.preventDefault();
            go(e.key === "ArrowRight" ? 1 : -1);
          }
        }}
      />
      <div className="mt-2 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => go(-1)} aria-label="Previous card" className="rounded-full">
          <ChevronLeft />
        </Button>
        <span className="font-mono text-xs text-muted-foreground">{flipped ? "answer" : "tap to flip"}</span>
        <Button variant="ghost" size="icon" onClick={() => go(1)} aria-label="Next card" className="rounded-full">
          <ChevronRight />
        </Button>
      </div>
      <div className="mt-1 flex min-h-11 items-center justify-center border-t border-border/60 pt-1 text-xs">
        {id ? (
          <Link href={`/flashcards/${id}`} className="inline-flex min-h-11 items-center gap-1.5 text-muted-foreground hover:text-foreground">
            <Check className="size-3.5 text-done" aria-hidden="true" />
            Saved · Open in Flashcards
          </Link>
        ) : (
          <button
            type="button"
            disabled={saving}
            onClick={() =>
              start(async () => {
                const r = await createDeck(deck);
                if (r.error) toast.error(r.error);
                else setSavedId(r.id);
              })
            }
            className="inline-flex min-h-11 items-center gap-1.5 text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <Layers className="size-3.5" aria-hidden="true" />
            {saving ? "Saving…" : "Save to Flashcards"}
          </button>
        )}
      </div>
    </div>
  );
}

const shuffled = <T,>(a: T[]) => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};

// Full-screen study: flip, then "Again" (card goes to the back of the line) or "Got it" (card is done).
// Keys: Space flips, 1 / ← again, 2 / → got it. Progress lasts for this session only.
// Mounted only while open, so every run starts fresh.
export function Study({ title, cards, onClose }: { title: string; cards: Card[]; onClose: () => void }) {
  const all = useMemo(() => cards.map((_, i) => i), [cards]);
  const [queue, setQueue] = useState(all);
  const [flipped, setFlipped] = useState(false);
  const [missed, setMissed] = useState(0);
  const restart = (order = all) => {
    setQueue(order);
    setFlipped(false);
    setMissed(0);
  };
  const grade = (gotIt: boolean) => {
    if (!flipped) return setFlipped(true); // answer first, then grade
    setFlipped(false);
    if (!gotIt) setMissed((n) => n + 1);
    setQueue(([head, ...rest]) => (gotIt ? rest : [...rest, head]));
  };
  const card = cards[queue[0]];
  const done = all.length - queue.length;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="flex h-dvh max-h-dvh w-full max-w-none flex-col gap-4 rounded-none p-4 sm:max-w-none md:p-8"
        onKeyDown={(e: React.KeyboardEvent) => {
          if (!card || ((e.target as HTMLElement).tagName === "BUTTON" && e.key === " ")) return;
          if (e.key === " ") {
            e.preventDefault();
            setFlipped((f) => !f);
          } else if (e.key === "1" || e.key === "ArrowLeft") grade(false);
          else if (e.key === "2" || e.key === "ArrowRight") grade(true);
        }}
      >
        <div className="flex items-center gap-3 pr-12">
          <DialogTitle className="min-w-0 flex-1 truncate">{title}</DialogTitle>
          <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
            {done}/{all.length}
          </span>
        </div>
        <DialogDescription className="sr-only">Flip each card, then mark it Again or Got it.</DialogDescription>
        <div className="h-1 overflow-hidden rounded-full bg-secondary" aria-hidden="true">
          <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${(done / Math.max(all.length, 1)) * 100}%` }} />
        </div>

        {card ? (
          <>
            <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center">
              <FlipCard
                key={queue[0] + ":" + queue.length}
                card={card}
                flipped={flipped}
                onFlip={() => setFlipped((f) => !f)}
                className="min-h-[min(22rem,50dvh)] [&>span]:bg-secondary [&>span]:text-lg md:[&>span]:text-xl"
              />
              <p className="mt-3 text-center font-mono text-xs text-muted-foreground">
                {flipped ? "Did you know it?" : "Tap the card or press Space to see the answer"}
              </p>
            </div>
            <div className="mx-auto grid w-full max-w-2xl grid-cols-[auto_1fr_1fr] gap-2">
              <Button variant="ghost" onClick={() => restart(shuffled(all))} aria-label="Shuffle and restart" className={ICON}>
                <Shuffle />
              </Button>
              <Button variant="secondary" onClick={() => grade(false)} className="h-12 rounded-full text-base">
                Again <kbd className="ml-1 hidden font-mono text-xs text-muted-foreground md:inline">1</kbd>
              </Button>
              <Button onClick={() => grade(true)} className="h-12 rounded-full text-base">
                {flipped ? "Got it" : "Show answer"} <kbd className="ml-1 hidden font-mono text-xs opacity-60 md:inline">2</kbd>
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
            <Check className="size-10 text-done" aria-hidden="true" />
            <p className="font-heading text-3xl">{all.length ? "Deck done" : "No cards yet"}</p>
            <p className="text-sm text-muted-foreground">
              {all.length ? (missed ? `${missed} ${missed === 1 ? "retry" : "retries"} along the way.` : "Every card first try.") : "Add a card to study."}
            </p>
            {!!all.length && (
              <div className="mt-4 flex gap-2">
                <Button variant="secondary" onClick={() => restart()} className={PILL}>
                  <RotateCcw /> Again
                </Button>
                <Button variant="secondary" onClick={() => restart(shuffled(all))} className={PILL}>
                  <Shuffle /> Shuffled
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

const count = (n: number) => `${n} ${n === 1 ? "card" : "cards"}`;

// /flashcards: every deck, newest first, filterable by course.
export function DeckList({ decks, courses }: { decks: DeckRow[]; courses: Course[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const byId = new Map(courses.map((c) => [c.id, c]));
  const used = courses.filter((c) => decks.some((d) => d.course_id === c.id));
  const shown = filter ? decks.filter((d) => d.course_id === filter) : decks;

  const create = () =>
    start(async () => {
      const r = await createDeck({ cards: [] });
      if (r.error) toast.error(r.error);
      else router.push(`/flashcards/${r.id}`);
    });

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pt-5 pb-24 md:px-6 md:pt-7">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Flashcards</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {decks.length ? "Decks Sonnet made in chat and ones you made. Open one to study, edit or share it." : "Ask Sonnet for flashcards in the chat, or make a deck yourself."}
          </p>
        </div>
        <Button onClick={create} disabled={pending} className={PILL}>
          <Plus /> New deck
        </Button>
      </header>

      {used.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filter by course">
          {[null, ...used.map((c) => c.id)].map((id) => {
            const c = id ? byId.get(id) : null;
            return (
              <button
                key={id ?? "all"}
                type="button"
                aria-pressed={filter === id}
                onClick={() => setFilter(id)}
                className={cn(
                  "inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm transition-colors md:h-8 md:px-3",
                  filter === id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground",
                )}
              >
                {c && <span className="size-2 rounded-full" style={{ background: courseColor(c.hue) }} aria-hidden="true" />}
                {c?.code ?? "All"}
              </button>
            );
          })}
        </div>
      )}

      {shown.length ? (
        <ul className="grid gap-3 sm:grid-cols-[repeat(auto-fill,minmax(16rem,1fr))]">
          {shown.map((d) => {
            const c = d.course_id ? byId.get(d.course_id) : null;
            return (
              <li key={d.id}>
                <Link
                  href={`/flashcards/${d.id}`}
                  className="group flex h-full min-h-32 flex-col rounded-2xl bg-secondary p-4 transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
                  style={c ? { boxShadow: `inset 3px 0 0 ${courseColor(c.hue)}` } : undefined}
                >
                  <span className="line-clamp-2 font-medium text-pretty">{d.title}</span>
                  <span className="mt-1 line-clamp-2 text-sm text-muted-foreground">{d.cards[0]?.front}</span>
                  <span className="mt-auto flex items-center gap-2 pt-3 font-mono text-xs text-muted-foreground">
                    {c && <span>{c.code}</span>}
                    <span>{count(d.cards.length)}</span>
                    {d.share_code && (
                      <span className="inline-flex items-center gap-1" title="Shared by link">
                        <Link2 className="size-3" aria-hidden="true" />
                        shared
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="grid place-items-center rounded-2xl border border-dashed border-border px-4 py-16 text-center">
          <Layers className="mb-3 size-8 text-muted-foreground" aria-hidden="true" />
          <p className="font-medium">{decks.length ? "No decks for this course" : "No decks yet"}</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">Try asking Sonnet: “Make flashcards for chapter 3.” Every deck it makes lands here.</p>
        </div>
      )}
    </main>
  );
}

// Course tag menu, animated like the chat's + menu. Arrow keys walk the rows, Escape or a click outside closes it.
function CoursePicker({ courses, value, onChange }: { courses: Course[]; value: string | null; onChange: (id: string | null) => void }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const current = courses.find((c) => c.id === value);
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent | KeyboardEvent) =>
      (e instanceof KeyboardEvent ? e.key === "Escape" : !root.current?.contains(e.target as Node)) && setOpen(false);
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);
  const rows: (Course | null)[] = [null, ...courses];
  return (
    <div ref={root} className="relative">
      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        whileTap={{ scale: 0.97 }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Course: ${current?.code ?? "none"}`}
        className={cn(
          "inline-flex h-11 items-center gap-2 rounded-full bg-secondary px-4 text-sm outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring md:h-9",
          open && "bg-accent",
        )}
      >
        {current && <span className="size-2 rounded-full" style={{ background: courseColor(current.hue) }} aria-hidden="true" />}
        {current?.code ?? "No course"}
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ type: "spring", bounce: 0.3, duration: 0.3 }}>
          <ChevronDown className="size-4 text-muted-foreground" />
        </motion.span>
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="listbox"
            aria-label="Course"
            initial={{ opacity: 0, y: -8, scale: 0.98, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -6, scale: 0.98, filter: "blur(2px)", transition: { duration: 0.14 } }}
            transition={{ type: "spring", bounce: 0.18, duration: 0.35 }}
            onKeyDown={(e) => {
              if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
              e.preventDefault();
              const items = [...e.currentTarget.querySelectorAll<HTMLElement>("[role=option]")];
              const at = items.indexOf(document.activeElement as HTMLElement);
              items[(at + (e.key === "ArrowDown" ? 1 : items.length - 1)) % items.length]?.focus();
            }}
            className="absolute top-full left-0 z-40 mt-2 flex max-h-72 w-56 origin-top flex-col overflow-y-auto rounded-3xl border border-border bg-popover p-2 shadow-2xl"
          >
            {rows.map((c, n) => {
              const on = (c?.id ?? null) === value;
              return (
                <motion.button
                  key={c?.id ?? "none"}
                  type="button"
                  role="option"
                  aria-selected={on}
                  autoFocus={on}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.03 * n, duration: 0.25 } }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onChange(c?.id ?? null);
                    setOpen(false);
                  }}
                  className="flex min-h-11 shrink-0 items-center gap-3 rounded-2xl px-3 text-left text-sm outline-none hover:bg-accent focus-visible:bg-accent"
                >
                  <span
                    className={cn("size-2 shrink-0 rounded-full", !c && "ring-1 ring-muted-foreground")}
                    style={c ? { background: courseColor(c.hue) } : undefined}
                    aria-hidden="true"
                  />
                  <span className={cn("min-w-0 flex-1 truncate", !c && "text-muted-foreground")}>{c?.code ?? "No course"}</span>
                  {on && <Check className="size-4 shrink-0 text-brand" aria-hidden="true" />}
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type Draft = Card & { k: number };
const snapshot = (title: string, course: string | null, cards: Card[]) =>
  JSON.stringify([title.trim(), course, cards.map((c) => [c.front.trim(), c.back.trim()]).filter(([f, b]) => f || b)]);
const area =
  "w-full resize-none rounded-xl bg-background px-3 py-2.5 text-base outline-none [field-sizing:content] min-h-11 focus-visible:ring-2 focus-visible:ring-ring md:text-sm";

// /flashcards/[id]: rename, tag a course, edit/add/reorder/delete cards, study, share, delete.
export function DeckEditor({ deck, courses, origin }: { deck: DeckRow; courses: Course[]; origin: string }) {
  const router = useRouter();
  const nextKey = useRef(deck.cards.length + 1);
  const [title, setTitle] = useState(deck.title);
  const [course, setCourse] = useState(deck.course_id);
  const [cards, setCards] = useState<Draft[]>(() =>
    deck.cards.length ? deck.cards.map((c, k) => ({ ...c, k })) : [{ front: "", back: "", k: 0 }],
  );
  const [saved, setSaved] = useState(() => snapshot(deck.title, deck.course_id, deck.cards));
  const [code, setCode] = useState(deck.share_code);
  const [studying, setStudying] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, start] = useTransition();
  const focusKey = useRef<number | null>(null);

  const now = snapshot(title, course, cards);
  const dirty = now !== saved;
  const real = cards.filter((c) => c.front.trim() || c.back.trim());

  // Don't lose edits to a closed tab.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const edit = (k: number, side: keyof Card, v: string) => setCards((all) => all.map((c) => (c.k === k ? { ...c, [side]: v } : c)));
  const move = (i: number, d: number) =>
    setCards((all) => {
      const b = [...all];
      [b[i], b[i + d]] = [b[i + d], b[i]];
      return b;
    });
  const add = () => {
    const k = nextKey.current++;
    focusKey.current = k;
    setCards((all) => [...all, { front: "", back: "", k }]);
  };

  const save = () =>
    start(async () => {
      const r = await updateDeck(deck.id, { title, course, cards: real.map(({ front, back }) => ({ front, back })) });
      if (r.error) return void toast.error(r.error);
      setSaved(now);
      toast.success("Deck saved.");
    });

  const share = (on: boolean) =>
    start(async () => {
      const r = await shareDeck(deck.id, on);
      if (r.error) return void toast.error(r.error);
      setCode(r.code ?? null);
      if (r.code) copy(`${origin}/f/${r.code}`);
    });
  const copy = (url: string) =>
    navigator.clipboard.writeText(url).then(
      () => toast.success("Link copied."),
      () => toast.error("Couldn't copy. Select the link and copy it."),
    );

  const remove = () =>
    start(async () => {
      const r = await deleteDeck(deck.id);
      if (r.error) return void toast.error(r.error);
      setSaved(now); // no unsaved-changes prompt on the way out
      router.push("/flashcards");
    });

  const link = code && `${origin}/f/${code}`;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pt-5 pb-32 md:px-6 md:pt-7">
      <Link href="/flashcards" className="-my-3 inline-flex min-h-11 items-center font-mono text-xs text-muted-foreground hover:text-foreground">
        ← Flashcards
      </Link>

      <header className="mt-2 flex flex-col gap-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          aria-label="Deck name"
          placeholder="Deck name"
          className="-mx-2 rounded-lg bg-transparent px-2 py-1 text-2xl font-medium tracking-tight outline-none hover:bg-secondary/60 focus-visible:bg-secondary focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="flex flex-wrap items-center gap-2">
          <CoursePicker courses={courses} value={course} onChange={setCourse} />
          <Button variant="secondary" onClick={() => setStudying(true)} disabled={!real.length} className={PILL}>
            <Play /> Study
          </Button>

          <Popover>
            <PopoverTrigger render={<Button variant="secondary" className={PILL} />}>
              <Link2 /> {code ? "Shared" : "Share"}
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[min(22rem,calc(100vw-2rem))] gap-3 rounded-2xl p-4">
              <PopoverHeader>
                <PopoverTitle>Share by link</PopoverTitle>
                <PopoverDescription>
                  {code
                    ? "Anyone with this link can view and study this deck, no account needed. They can't edit it."
                    : "Make a link anyone can open to view and study this deck, without signing in."}
                </PopoverDescription>
              </PopoverHeader>
              {link ? (
                <>
                  <div className="flex gap-2">
                    <input readOnly value={link} onFocus={(e) => e.target.select()} aria-label="Share link" className="h-11 min-w-0 flex-1 rounded-full bg-secondary px-4 font-mono text-xs outline-none md:h-9" />
                    <Button variant="secondary" onClick={() => copy(link)} aria-label="Copy link" className={ICON}>
                      <Copy />
                    </Button>
                  </div>
                  <Button variant="ghost" disabled={pending} onClick={() => share(false)} className="h-11 rounded-full text-destructive md:h-9">
                    Stop sharing (the link stops working)
                  </Button>
                </>
              ) : (
                <Button disabled={pending} onClick={() => share(true)} className="h-11 rounded-full md:h-9">
                  Create and copy link
                </Button>
              )}
              {dirty && <p className="text-xs text-warning">Save first: the link shows the last saved version.</p>}
            </PopoverContent>
          </Popover>

          <span className="ml-auto font-mono text-xs text-muted-foreground">{count(real.length)}</span>
        </div>
      </header>

      <ol className="mt-6 flex flex-col gap-3">
        {cards.map((c, i) => (
          <li key={c.k} className="rounded-2xl bg-secondary p-3">
            <div className="mb-2 flex items-center gap-1">
              <span className="mr-auto pl-1 font-mono text-xs text-muted-foreground tabular-nums">{i + 1}</span>
              <Button variant="ghost" size="icon" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move card ${i + 1} up`} className={ICON}>
                <ArrowUp />
              </Button>
              <Button variant="ghost" size="icon" disabled={i === cards.length - 1} onClick={() => move(i, 1)} aria-label={`Move card ${i + 1} down`} className={ICON}>
                <ArrowDown />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCards((all) => all.filter((x) => x.k !== c.k))}
                aria-label={`Delete card ${i + 1}`}
                className={cn(ICON, "hover:text-destructive")}
              >
                <Trash2 />
              </Button>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <textarea
                ref={(el) => {
                  if (el && focusKey.current === c.k) {
                    focusKey.current = null;
                    el.focus();
                  }
                }}
                value={c.front}
                onChange={(e) => edit(c.k, "front", e.target.value)}
                maxLength={1000}
                rows={1}
                aria-label={`Card ${i + 1} front`}
                placeholder="Front: question or term"
                className={cn(area, "font-medium")}
              />
              <textarea
                value={c.back}
                onChange={(e) => edit(c.k, "back", e.target.value)}
                maxLength={2000}
                rows={1}
                aria-label={`Card ${i + 1} back`}
                placeholder="Back: answer"
                className={area}
              />
            </div>
          </li>
        ))}
      </ol>
      <Button variant="ghost" onClick={add} disabled={cards.length >= 200} className={cn(PILL, "mt-3 w-full border border-dashed border-border")}>
        <Plus /> Add card
      </Button>

      <div className="mt-10 border-t border-border pt-4">
        {confirmDelete ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm">Delete “{deck.title}” for good?</span>
            <Button variant="destructive" disabled={pending} onClick={remove} className={PILL}>
              Delete deck
            </Button>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)} className={PILL}>
              Keep it
            </Button>
          </div>
        ) : (
          <Button variant="ghost" onClick={() => setConfirmDelete(true)} className={cn(PILL, "text-muted-foreground hover:text-destructive")}>
            <Trash2 /> Delete deck
          </Button>
        )}
      </div>

      {/* Save bar: only while there are unsaved changes. */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 flex justify-center p-4 transition-[translate,opacity] duration-200 ease-out-quint",
          dirty ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
        )}
        aria-hidden={!dirty}
      >
        <div className="flex items-center gap-3 rounded-full bg-popover py-2 pr-2 pl-5 shadow-lg ring-1 ring-border">
          <span className="text-sm text-muted-foreground">Unsaved changes</span>
          <Button onClick={save} disabled={pending || !title.trim()} tabIndex={dirty ? 0 : -1} className={PILL}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      {studying && <Study title={title} cards={real} onClose={() => setStudying(false)} />}
    </main>
  );
}

// /f/[code]: a shared deck, read-only, for anyone.
export function SharedDeck({ deck }: { deck: { title: string; cards: Card[]; course: string | null; hue: number | null } }) {
  const [studying, setStudying] = useState(false);
  const [flipped, setFlipped] = useState<number | null>(null);
  return (
    <main className="mx-auto w-full max-w-4xl px-4 pt-6 pb-24 md:px-6 md:pt-10">
      <Link href="/" className="font-mono text-lg font-medium tracking-tight">
        sonnet<span className="text-brand">.</span>
      </Link>
      <header className="mt-8 mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          {deck.course && (
            <p className="mb-1 flex items-center gap-2 font-mono text-xs text-muted-foreground">
              {deck.hue != null && <span className="size-2 rounded-full" style={{ background: courseColor(deck.hue) }} aria-hidden="true" />}
              {deck.course}
            </p>
          )}
          <h1 className="font-heading text-3xl text-pretty md:text-4xl">{deck.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{count(deck.cards.length)} · tap a card to flip it</p>
        </div>
        <Button onClick={() => setStudying(true)} disabled={!deck.cards.length} className={PILL}>
          <Play /> Study
        </Button>
      </header>
      <ul className="grid gap-3 sm:grid-cols-2">
        {deck.cards.map((c, i) => (
          <li key={i}>
            <FlipCard card={c} flipped={flipped === i} onFlip={() => setFlipped((f) => (f === i ? null : i))} className="[&>span]:bg-secondary" />
          </li>
        ))}
      </ul>
      <p className="mt-10 text-center text-sm text-muted-foreground">
        Made with{" "}
        <Link href="/" className="link">
          Sonnet
        </Link>
        , the student hub with an AI that knows your courses.
      </p>
      {studying && <Study title={deck.title} cards={deck.cards} onClose={() => setStudying(false)} />}
    </main>
  );
}
