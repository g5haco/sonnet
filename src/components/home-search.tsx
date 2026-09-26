"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, CalendarDays, Search, Settings, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { smartSearch } from "@/app/actions";
import { useAssistant, useOpenSettings } from "@/components/app-shell";
import { courseColor, courseFace } from "@/lib/course";
import type { Item } from "@/lib/progress";
import { search } from "@/lib/search";
import { cn } from "@/lib/utils";

type Course = { id: string; code: string; name: string; hue: number };
type Row = { key: string; go: () => void; node: ReactNode; wide?: boolean };
type Found = Awaited<ReturnType<typeof smartSearch>> | "loading";

const EASE = [0.22, 1, 0.36, 1] as const;
const EXAMPLES = ["next assignment due", "overdue", "exams", "this week", "friday", "settings"];

// "in 2d", "today", "3d late", "done"
function when(i: Item, now: number) {
  if (i.doneAt) return "done";
  const d = Math.round((new Date(i.due).setHours(0, 0, 0, 0) - new Date(now).setHours(0, 0, 0, 0)) / 864e5);
  return d === 0 ? "today" : d === 1 ? "tomorrow" : d > 0 ? `in ${d}d` : `${-d}d late`;
}

// Home's search bar: plain-language queries ("next exam", "overdue pols", "oct 3") -> cards you can open.
export function HomeSearch({ items, courses, now }: { items: Item[]; courses: Course[]; now: number }) {
  const router = useRouter();
  const openSettings = useOpenSettings();
  const assistant = useAssistant();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [hint, setHint] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const q = query;
  const r = useMemo(() => search(q, items, courses, now), [q, items, courses, now]);
  // Words the keyword search can't place go to Sonnet after a short pause; answers are kept per query.
  const [ai, setAi] = useState<Record<string, Found>>({});
  const key = q.trim().toLowerCase();
  const found = r.fuzzy && key in ai ? ai[key] : undefined; // null: Sonnet had nothing to say
  useEffect(() => {
    if (!r.fuzzy || key in ai) return;
    const id = setTimeout(() => {
      setAi((a) => ({ ...a, [key]: "loading" }));
      const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
      smartSearch(key, today)
        .catch(() => null)
        .then((res) => setAi((a) => ({ ...a, [key]: res })));
    }, 600);
    return () => clearTimeout(id);
  }, [r.fuzzy, key, ai]);
  const picked = found && found !== "loading" ? found : null;
  const shownCourses = [...r.courses, ...courses.filter((c) => picked?.courses.includes(c.id) && !r.courses.includes(c))];
  const shownItems = [...r.items, ...(picked?.items.map((id) => items.find((i) => i.id === id)).filter((i) => !!i) ?? [])];

  // "/" focuses search from anywhere on Home (not while typing elsewhere).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "/" && !t.closest("input, textarea, [contenteditable]")) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    const onDown = (e: PointerEvent) => box.current?.contains(e.target as Node) || setOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, []);
  // The placeholder cycles through example queries while the box is empty.
  useEffect(() => {
    if (query) return;
    const id = setInterval(() => setHint((h) => (h + 1) % EXAMPLES.length), 2800);
    return () => clearInterval(id);
  }, [query]);

  const done = (go: () => void) => () => {
    go();
    setOpen(false);
    (document.activeElement as HTMLElement | null)?.blur();
  };
  const tint = (hue: number) => ({ "--chip": courseColor(hue) }) as CSSProperties;

  const rows: Row[] = [
    ...r.days.map((d) => {
      const date = new Date(`${d.date}T12:00:00`);
      const due = d.items.filter((i) => !i.doneAt);
      return {
        key: `day-${d.date}`,
        wide: true,
        go: done(() => router.push(`/calendar?view=day&date=${d.date}`)),
        node: (
          <span className="flex items-center gap-4">
            <span className="flex w-12 shrink-0 flex-col items-center rounded-lg border border-border py-1.5 leading-none">
              <span className="font-mono text-[11px] text-muted-foreground uppercase">{date.toLocaleDateString(undefined, { month: "short" })}</span>
              <span className="mt-1 text-xl font-medium tabular-nums">{date.getDate()}</span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-medium">{date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</span>
              <span className="block truncate text-sm text-muted-foreground">
                {due.length ? `${due.length} due · ${due.map((i) => i.title).join(", ")}` : "Nothing due. Open the day"}
              </span>
            </span>
            <CalendarDays aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          </span>
        ),
      };
    }),
    ...shownCourses.map((c) => {
      const next = items.filter((i) => i.courseId === c.id && !i.doneAt && Date.parse(i.due) >= now).sort((a, b) => Date.parse(a.due) - Date.parse(b.due))[0];
      return {
        key: `course-${c.id}`,
        go: done(() => router.push(`/courses/${c.id}`)),
        node: (
          <span className="flex items-center gap-3">
            <span aria-hidden="true" className="size-10 shrink-0 rounded-lg shadow-sm" style={{ background: courseFace(c.hue) }} />
            <span className="min-w-0">
              <span className="block truncate font-mono text-sm">{c.code}</span>
              <span className="block truncate text-sm text-muted-foreground">{next ? `next: ${next.title} · ${when(next, now)}` : c.name || "Course"}</span>
            </span>
          </span>
        ),
      };
    }),
    ...shownItems.map((i) => {
      const status = i.doneAt ? "done" : Date.parse(i.due) < now ? "destructive" : Date.parse(i.due) - now < 2 * 864e5 ? "warning" : null;
      return {
        key: `item-${i.id}`,
        go: done(() => router.push(i.courseId ? `/courses/${i.courseId}` : "/calendar")),
        node: (
          <span className="flex min-w-0 flex-col gap-1.5">
            <span className="line-clamp-2 text-sm font-medium">{i.title}</span>
            <span className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
              <span className="chip truncate rounded-full px-1.5" style={tint(i.hue)}>{i.course}</span>
              <span>{i.kind}</span>
              <span
                className={cn("ml-auto shrink-0", status && "chip rounded-full px-1.5")}
                style={status ? ({ "--chip": `var(--${status})` } as CSSProperties) : undefined}
              >
                {when(i, now)}
              </span>
            </span>
          </span>
        ),
      };
    }),
    ...r.places.map((p) => ({
      key: `place-${p.label}`,
      go: done(() => (p.href ? router.push(p.href) : openSettings(p.settings))),
      node: (
        <span className="flex items-center gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
            {p.settings ? <Settings aria-hidden="true" className="size-4" /> : <ArrowRight aria-hidden="true" className="size-4" />}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-medium">{p.label}</span>
            <span className="block truncate text-xs text-muted-foreground">{p.hint}</span>
          </span>
        </span>
      ),
    })),
  ];
  // Anything typed can go to Sonnet, always the last card.
  if (q.trim())
    rows.push({
      key: "ask",
      wide: true,
      go: done(() => {
        assistant.send(q.trim());
        assistant.show();
      }),
      node: (
        <span className="flex items-center gap-3 text-sm">
          <Sparkles aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 truncate">
            Ask Sonnet <span className="text-muted-foreground">“{q.trim()}”</span>
          </span>
        </span>
      ),
    });

  // Keep the highlighted card in view while arrowing through a long list.
  const activeKey = rows[active]?.key;
  useEffect(() => {
    if (activeKey) document.getElementById(`hs-${activeKey}`)?.scrollIntoView({ block: "nearest" });
  }, [activeKey]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => (a + (e.key === "ArrowDown" ? 1 : rows.length - 1)) % Math.max(rows.length, 1));
    } else if (e.key === "Enter") rows[active]?.go();
    else if (e.key === "Escape") {
      if (query) return setQuery("");
      input.current?.blur();
      setOpen(false);
    }
  };

  const shown = open;
  return (
    <div
      ref={box}
      onBlur={(e) => box.current?.contains(e.relatedTarget as Node) || setOpen(false)}
      className="relative w-full"
    >
      <motion.label
        animate={{ scale: open ? 1.02 : 1 }}
        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
        className={cn(
          "group flex h-11 w-full cursor-text items-center gap-2.5 rounded-full border border-border bg-card px-4 transition-[border-color,box-shadow,background-color] duration-300",
          "hover:border-foreground/25 hover:bg-muted/40",
          open && "border-foreground/30 shadow-[0_0_0_4px_oklch(1_0_0/0.04),0_12px_40px_-12px_oklch(0_0_0/0.6)]",
        )}
      >
        <motion.span animate={{ rotate: open ? -12 : 0, scale: open ? 1.1 : 1 }} transition={{ type: "spring", bounce: 0.5, duration: 0.5 }}>
          <Search aria-hidden="true" className="size-4 text-muted-foreground transition-colors group-hover:text-foreground" />
        </motion.span>
        <span className="relative min-w-0 flex-1">
          <input
            ref={input}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKey}
            role="combobox"
            aria-expanded={shown}
            aria-controls="home-search-results"
            aria-activedescendant={shown && rows[active] ? `hs-${rows[active].key}` : undefined}
            aria-label="Search your work, courses, dates and settings"
            className="w-full bg-transparent text-sm outline-none"
          />
          {!query && (
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center overflow-hidden text-sm text-muted-foreground">
              Search&nbsp;
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={hint}
                  initial={{ y: 14, opacity: 0, filter: "blur(4px)" }}
                  animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                  exit={{ y: -14, opacity: 0, filter: "blur(4px)" }}
                  transition={{ duration: 0.45, ease: EASE }}
                  className="truncate"
                >
                  “{EXAMPLES[hint]}”
                </motion.span>
              </AnimatePresence>
            </span>
          )}
        </span>
        <kbd className="hidden rounded border border-border px-1.5 font-mono text-[11px] text-muted-foreground md:block">/</kbd>
      </motion.label>

      <AnimatePresence>
        {shown && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.15 } }}
            transition={{ duration: 0.3, ease: EASE }}
            className="absolute top-full left-1/2 z-50 mt-2 max-h-[70vh] w-[min(40rem,calc(100vw-2rem))] -translate-x-1/2 origin-top overflow-y-auto overscroll-contain rounded-2xl border border-border bg-popover p-2 shadow-2xl"
          >
            {!q.trim() ? (
              <div className="p-2">
                <p className="mb-2 font-mono text-xs text-muted-foreground">try</p>
                <div className="flex flex-wrap gap-2">
                  {EXAMPLES.map((x, n) => (
                    <motion.button
                      key={x}
                      type="button"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: n * 0.03, duration: 0.3, ease: EASE }}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => {
                        setQuery(x);
                        setActive(0);
                        input.current?.focus();
                      }}
                      className="min-h-9 rounded-full border border-border px-3 text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                    >
                      {x}
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : (
              <>
              {found !== undefined && (found === null || found === "loading" || found.answer) && (
                <p aria-live="polite" className="flex items-center gap-2 px-3 pt-2 pb-2.5 text-sm text-muted-foreground">
                  <Sparkles aria-hidden="true" className={cn("size-4 shrink-0", found === "loading" && "animate-pulse")} />
                  {found === "loading" ? (
                    <span className="animate-pulse">Sonnet is looking…</span>
                  ) : (
                    (found?.answer ?? "Sonnet couldn't search just now.")
                  )}
                </p>
              )}
              <div id="home-search-results" role="listbox" className="grid gap-1.5 sm:grid-cols-2">
                {rows.map((row, n) => (
                  <motion.button
                    key={row.key}
                    id={`hs-${row.key}`}
                    type="button"
                    role="option"
                    tabIndex={-1}
                    aria-selected={n === active}
                    layout="position"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(n, 8) * 0.025, duration: 0.3, ease: EASE }}
                    onPointerMove={() => setActive(n)}
                    onClick={row.go}
                    className={cn(
                      "relative isolate min-h-11 rounded-xl border border-transparent p-3 text-left transition-[transform,border-color] duration-200 active:scale-[0.98]",
                      n === active && "border-border",
                      row.wide && "sm:col-span-2",
                    )}
                  >
                    {n === active && (
                      <motion.span
                        layoutId="home-search-active"
                        transition={{ type: "spring", bounce: 0.15, duration: 0.35 }}
                        className="absolute inset-0 -z-10 rounded-xl bg-muted"
                      />
                    )}
                    {row.node}
                  </motion.button>
                ))}
              </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
