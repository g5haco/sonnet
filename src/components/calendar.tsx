"use client";

import { CalendarClock, CalendarPlus, ChevronLeft, ChevronRight, Clock, FilePlus2, Plus } from "lucide-react";
import { Liquid } from "liquid-gooey";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  startTransition,
  useEffect,
  useLayoutEffect,
  useOptimistic,
  useRef,
  useState,
  useSyncExternalStore,
  type RefObject,
} from "react";
import { toast } from "sonner";
import { setDone } from "@/app/actions";
import { useCreate } from "@/components/app-shell";
import { CalendarRail } from "@/components/calendar-rail";
import { ItemDetails } from "@/components/item-details";
import { GooeyMenu, type CreateKind, type MenuItem } from "@/components/gooey-menu";
import { Button, buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  lanes,
  parseDay,
  range,
  sessions,
  startOfDay,
  step,
  title,
  type ClassMeeting,
  type Session,
  type Term,
  type View,
} from "@/lib/calendar";
import { courseColor, dayKey, meetingLabel } from "@/lib/course";
import type { Item } from "@/lib/progress";
import { cn } from "@/lib/utils";

const VIEWS: View[] = ["day", "week", "month"];
const HOUR = 48; // px per hour in the time grid
const EASE = [0.22, 1, 0.36, 1] as const; // --ease-out-quint
const FRAME = "@container flex h-[calc(100dvh-3.5rem)] flex-col md:h-dvh"; // phone top bar is 3.5rem
const PILL = "h-9 rounded-full px-4";
const ADD: MenuItem<"assignment" | "exam" | "class">[] = [
  { kind: "assignment", label: "Assignment", icon: FilePlus2 },
  { kind: "exam", label: "Exam", icon: CalendarClock },
  { kind: "class", label: "Class times", icon: Clock },
];

// A course color washed into the page (--event sets the strength per theme): fills keep foreground text readable.
const tint = (hue: number, k = 1) =>
  `color-mix(in oklch, ${courseColor(hue)} calc(var(--event) * ${k}), var(--background))`;
const clock = (d: Date) => d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
const longDay = (d: Date) => d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
const minutes = (d: Date) => d.getHours() * 60 + d.getMinutes();
const hhmm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

type Props = {
  items: Item[];
  meetings: ClassMeeting[];
  term: Term | null;
  feed: string | null; // secret for the Google Calendar feed URL
  initial: { view: string; date: string };
};

const noop = () => () => {};

// The layout depends on your timezone, which the server doesn't know, so the calendar renders in the browser.
// Client-side navigation renders it straight away; only a hard reload shows the empty frame for a moment.
export function Calendar(props: Props) {
  const browser = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
  return browser ? <CalendarBody {...props} /> : <main className={FRAME} aria-busy="true" />;
}

function CalendarBody({ items, meetings, term, feed, initial }: Props) {
  const [view, setView] = useState<View>(() =>
    VIEWS.includes(initial.view as View)
      ? (initial.view as View)
      : matchMedia("(min-width: 768px)").matches
        ? "week"
        : "day",
  );
  const [anchor, setAnchor] = useState(() =>
    /^\d{4}-\d{2}-\d{2}$/.test(initial.date) ? parseDay(initial.date) : startOfDay(new Date()),
  );
  const [adding, setAdding] = useState(false);
  const [dir, setDir] = useState(0); // page slide: -1 back, 1 forward, 0 = view change (fade)
  const [now, setNow] = useState(() => Date.now());
  const [list, flip] = useOptimistic(items, (all, id: string) =>
    all.map((i) => (i.id === id ? { ...i, doneAt: i.doneAt ? null : new Date().toISOString() } : i)),
  );
  const create = useCreate();
  const router = useRouter();
  const scroll = useRef<number | null>(null); // time-grid scroll position, kept while paging

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => window.history.replaceState(null, "", `?view=${view}&date=${dayKey(anchor)}`), [view, anchor]);

  const go = (d: number) => {
    setDir(d);
    setAnchor((a) => step(view, a, d));
  };
  const jump = (day: Date, to: View = view) => {
    setDir(to === view ? Math.sign(+startOfDay(day) - +anchor) : 0);
    setAnchor(startOfDay(day));
    setView(to);
  };
  const today = () => jump(new Date());
  const toggle = (id: string) => {
    const done = !list.find((i) => i.id === id)?.doneAt;
    startTransition(async () => {
      flip(id);
      const r = await setDone(id, done);
      if (r.error) toast.error(r.error);
    });
  };
  // Adding from the header pre-fills the day you're looking at (today keeps the usual "tomorrow night").
  const add = (kind: CreateKind) =>
    create(kind, dayKey(anchor) === dayKey(new Date()) ? undefined : `${dayKey(anchor)}T23:59`);

  // T today, D/W/M views, ←/→ page. Ignored while typing or inside dialogs and menus.
  useEffect(() => {
    const keys = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (e.metaKey || e.ctrlKey || e.altKey || target.closest("input, textarea, select, [role=dialog], [role=menu]"))
        return;
      const k = e.key.toLowerCase();
      if (k === "t") today();
      else if (k === "d" || k === "w" || k === "m")
        jump(
          anchor,
          VIEWS.find((v) => v[0] === k),
        );
      else if (k === "arrowleft" || k === "arrowright") {
        e.preventDefault();
        go(k === "arrowleft" ? -1 : 1);
      }
    };
    document.addEventListener("keydown", keys);
    return () => document.removeEventListener("keydown", keys);
  });

  const days = range(view, anchor);
  const shown = sessions(meetings, days, term);
  const due = Map.groupBy(
    [...list].sort((a, b) => Date.parse(a.due) - Date.parse(b.due)),
    (i) => dayKey(new Date(i.due)),
  );

  return (
    <main className={FRAME}>
      <header className="flex flex-wrap items-center gap-x-2 gap-y-3 border-b border-border px-4 py-3 md:px-6">
        <Button variant="secondary" onClick={today} title="Today (T)" className={PILL}>
          Today
        </Button>
        <div className="flex">
          <Button
            variant="ghost"
            onClick={() => go(-1)}
            aria-label={`Previous ${view}`}
            title="Previous (←)"
            className="size-9 rounded-full"
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="ghost"
            onClick={() => go(1)}
            aria-label={`Next ${view}`}
            title="Next (→)"
            className="size-9 rounded-full"
          >
            <ChevronRight />
          </Button>
        </div>
        <h1 className="text-lg font-medium tracking-tight tabular-nums" aria-live="polite">
          <span className="sr-only">Calendar, </span>
          {title(view, anchor)}
        </h1>
        <div className="ml-auto flex items-center gap-2">
          <ViewSwitch view={view} onChange={(v) => jump(anchor, v)} />
          <GooeyMenu
            direction="down"
            label="Add"
            tone="primary"
            items={ADD}
            open={adding}
            onOpenChange={setAdding}
            onPick={(k) => (k === "class" ? router.push("/courses") : add(k))}
          />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <CalendarRail
          className="hidden @3xl:flex"
          view={view}
          anchor={anchor}
          days={days}
          items={list}
          meetings={meetings}
          term={term}
          now={now}
          feed={feed}
          onPick={(d, to) => jump(d, to)}
        />
        <div className="relative min-w-0 flex-1 overflow-hidden">
          <AnimatePresence initial={false} custom={dir}>
            <motion.div
              key={`${view}:${dayKey(days[0])}`}
              custom={dir}
              variants={PAGE}
              initial="enter"
              animate="show"
              exit="exit"
              transition={{ duration: 0.22, ease: EASE }}
              className="absolute inset-0 flex flex-col"
            >
              {view === "month" ? (
                <MonthGrid
                  days={days}
                  anchor={anchor}
                  sessions={shown}
                  due={due}
                  now={now}
                  onToggle={toggle}
                  onDay={(d) => jump(d, "day")}
                />
              ) : (
                <TimeGrid
                  days={days}
                  sessions={shown}
                  due={due}
                  now={now}
                  scroll={scroll}
                  onToggle={toggle}
                  onAdd={create}
                  onDay={(d) => jump(d, "day")}
                />
              )}
            </motion.div>
          </AnimatePresence>
          {items.length === 0 && <Empty hasClasses={meetings.length > 0} onAdd={add} />}
        </div>
      </div>
    </main>
  );
}

// Paging slides the way you went; switching views cross-fades with a hair of scale.
const PAGE = {
  enter: (d: number) => ({ opacity: 0, x: d * 32, scale: d ? 1 : 0.985 }),
  show: { opacity: 1, x: 0, scale: 1 },
  exit: (d: number) => ({ opacity: 0, x: d * -32, scale: d ? 1 : 0.985 }),
};

// Day / Week / Month. The white pill is liquid-gooey "move": it trails the selection like a drop of rubber.
function ViewSwitch({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  const W = 64;
  return (
    <div className="relative flex rounded-full bg-secondary p-1 [--seg:var(--background)] dark:[--seg:var(--accent)]">
      <div className="pointer-events-none absolute inset-1">
        <Liquid fill="var(--seg)" shadow="0 1px 2px rgb(0 0 0 / 0.12)" className="size-full">
          <Liquid.Item effect="move" move={{ wobble: 0.2, trail: 0.4 }}>
            <div
              className="h-7 rounded-full transition-transform duration-300 ease-out-quint"
              style={{ width: W, transform: `translateX(${VIEWS.indexOf(view) * W}px)` }}
            />
          </Liquid.Item>
        </Liquid>
      </div>
      {VIEWS.map((v) => (
        <button
          key={v}
          type="button"
          aria-pressed={v === view}
          onClick={() => onChange(v)}
          title={`${v[0].toUpperCase() + v.slice(1)} (${v[0].toUpperCase()})`}
          style={{ width: W }}
          className={cn(
            "relative h-7 rounded-full text-sm capitalize transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
            v === view ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {v}
        </button>
      ))}
    </div>
  );
}

type GridProps = {
  days: Date[];
  sessions: Session[];
  due: Map<string, Item[]>;
  now: number;
  onToggle: (id: string) => void;
  onDay: (d: Date) => void;
};

// Day and week: a "Due" row on top (deadlines never scroll out of sight), classes in the time grid below.
function TimeGrid({
  days,
  sessions,
  due,
  now,
  scroll,
  onToggle,
  onAdd,
  onDay,
}: GridProps & { scroll: RefObject<number | null>; onAdd: (kind: CreateKind, due?: string) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ col: number; min: number } | null>(null);
  const single = days.length === 1;
  const todayKey = dayKey(new Date(now));
  const nowMin = minutes(new Date(now));
  const showsToday = days.some((d) => dayKey(d) === todayKey);
  const placed = lanes(sessions);
  const cols = { gridTemplateColumns: `3.5rem repeat(${days.length}, minmax(0, 1fr))` };
  const zone = new Intl.DateTimeFormat(undefined, { timeZoneName: "short" })
    .formatToParts(new Date(now))
    .find((p) => p.type === "timeZoneName")?.value;

  // Open where the day happens: where you left off, else a bit before now or the first class, else 7:30.
  useLayoutEffect(() => {
    const el = box.current!;
    const first = Math.min(...placed.map((s) => minutes(s.start)));
    const start = showsToday ? nowMin - 90 : Number.isFinite(first) ? first - 30 : 450;
    el.scrollTop = scroll.current ?? (start / 60) * HOUR;
    const save = () => (scroll.current = el.scrollTop);
    el.addEventListener("scroll", save, { passive: true });
    return () => el.removeEventListener("scroll", save);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- once per page; later changes shouldn't yank the scroll

  const slot = (e: React.PointerEvent | React.MouseEvent) =>
    Math.min(47, Math.max(0, Math.floor((e.nativeEvent.offsetY / HOUR) * 2))) * 30;

  return (
    <div className="flex h-full flex-col overflow-x-auto">
      <div className={cn("flex h-full flex-col", !single && "min-w-[40rem]")}>
        <div className="grid border-b border-border" style={cols}>
          <div className="flex items-end justify-end pr-2 pb-2 font-mono text-[10px] text-muted-foreground">{zone}</div>
          {days.map((d) => {
            const isToday = dayKey(d) === todayKey;
            const inner = (
              <>
                <span className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
                  {d.toLocaleDateString(undefined, { weekday: "short" })}
                </span>
                <span
                  className={cn(
                    "grid size-8 place-items-center rounded-full text-lg tabular-nums",
                    isToday && "bg-brand font-medium text-brand-foreground",
                  )}
                >
                  {d.getDate()}
                </span>
              </>
            );
            return single ? (
              <div
                key={d.getTime()}
                className="flex flex-col items-center gap-0.5 py-2"
                aria-current={isToday ? "date" : undefined}
              >
                {inner}
              </div>
            ) : (
              <button
                key={d.getTime()}
                type="button"
                onClick={() => onDay(d)}
                aria-label={`${longDay(d)}, open day`}
                aria-current={isToday ? "date" : undefined}
                className="flex flex-col items-center gap-0.5 rounded-lg py-2 outline-none transition-colors hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring"
              >
                {inner}
              </button>
            );
          })}
        </div>

        <div className="grid border-b border-border" style={cols}>
          <div className="pt-2.5 pr-2 text-right font-mono text-[10px] text-muted-foreground uppercase">Due</div>
          {days.map((d) => {
            const all = due.get(dayKey(d)) ?? [];
            const cap = single ? all.length : 3;
            return (
              <div key={d.getTime()} className="group flex min-w-0 flex-col gap-0.5 border-l border-border p-1">
                {all.slice(0, cap).map((i) => (
                  <ItemChip key={i.id} item={i} now={now} wide={single} onToggle={onToggle} />
                ))}
                {all.length > cap && (
                  <button
                    type="button"
                    onClick={() => onDay(d)}
                    className="px-1.5 text-left font-mono text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    +{all.length - cap} more
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onAdd("assignment", `${dayKey(d)}T23:59`)}
                  aria-label={`Add something due ${longDay(d)}`}
                  className="flex h-6 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity outline-none group-hover:opacity-100 hover:bg-accent hover:text-foreground focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring [@media(hover:none)]:opacity-60"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        <div ref={box} className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="relative grid" style={{ ...cols, height: 24 * HOUR }}>
            <div className="relative">
              {Array.from({ length: 23 }, (_, h) => (
                <span
                  key={h}
                  className="absolute right-2 -translate-y-1/2 font-mono text-[10px] text-muted-foreground"
                  style={{ top: (h + 1) * HOUR }}
                >
                  {showsToday && Math.abs(nowMin - (h + 1) * 60) < 20
                    ? null
                    : new Date(2000, 0, 1, h + 1).toLocaleTimeString(undefined, { hour: "numeric" })}
                </span>
              ))}
              {showsToday && (
                <span
                  className="absolute right-1 z-20 -translate-y-1/2 rounded-full bg-brand px-1.5 font-mono text-[10px] whitespace-nowrap text-brand-foreground tabular-nums"
                  style={{ top: (nowMin / 60) * HOUR }}
                >
                  {new Date(now)
                    .toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
                    .replace(/\s*[ap]\.?\s?m\.?$/i, "")}
                </span>
              )}
            </div>
            {days.map((d, col) => {
              const key = dayKey(d);
              return (
                <div
                  key={key}
                  className={cn("relative cursor-cell border-l border-border", key === todayKey && "bg-brand/[0.04]")}
                  style={{
                    backgroundImage: "linear-gradient(var(--border) 1px, transparent 1px)",
                    backgroundSize: `100% ${HOUR}px`,
                  }}
                  // Empty time = an exam at that time. Deadlines go in the Due row above.
                  onPointerMove={(e) => {
                    const min = slot(e);
                    setHover((h) =>
                      e.target !== e.currentTarget ? null : h?.col === col && h.min === min ? h : { col, min },
                    );
                  }}
                  onPointerLeave={() => setHover(null)}
                  onClick={(e) => e.target === e.currentTarget && onAdd("exam", `${key}T${hhmm(slot(e))}`)}
                >
                  {hover?.col === col && (
                    <div
                      className="pointer-events-none absolute inset-x-1 rounded-md bg-accent px-1.5 pt-0.5 font-mono text-[11px] text-muted-foreground"
                      style={{ top: (hover.min / 60) * HOUR, height: HOUR / 2 }}
                    >
                      + exam {clock(new Date(2000, 0, 1, 0, hover.min))}
                    </div>
                  )}
                  {placed
                    .filter((s) => dayKey(s.start) === key)
                    .map((s) => (
                      <SessionBlock key={s.key} s={s} past={+s.end < now} wide={single} />
                    ))}
                  {key === todayKey && (
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 z-10 h-0.5 bg-brand"
                      style={{ top: (nowMin / 60) * HOUR }}
                    >
                      <span className="absolute -top-[3px] -left-1 size-2 rounded-full bg-brand" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function SessionBlock({
  s,
  past,
  wide,
}: {
  s: Session & { lane: number; lanes: number };
  past: boolean;
  wide: boolean;
}) {
  const m = s.meeting;
  const height = Math.max(22, ((+s.end - +s.start) / 36e5) * HOUR);
  return (
    <Popover>
      <PopoverTrigger
        className="absolute z-[1] flex flex-col overflow-hidden rounded-md px-1.5 py-1 text-left text-xs leading-tight outline-none transition-[filter] hover:brightness-95 focus-visible:ring-2 focus-visible:ring-ring dark:hover:brightness-110"
        style={{
          top: (minutes(s.start) / 60) * HOUR + 1,
          height: height - 2,
          left: `calc(${(s.lane / s.lanes) * 100}% + 2px)`,
          width: `calc(${100 / s.lanes}% - 4px)`,
          // Past classes wash out; text stays full contrast.
          background: tint(m.hue, past ? 0.35 : 1),
          boxShadow: past ? undefined : `inset 0 0 0 1px ${tint(m.hue, 2.2)}`,
        }}
      >
        <span className="truncate font-mono font-medium">
          {m.course}
          {wide && m.name && <span className="font-sans font-normal"> · {m.name}</span>}
        </span>
        {height > 36 && (
          <span className="truncate text-foreground/75 tabular-nums">
            {clock(s.start)}–{clock(s.end)}
          </span>
        )}
        {height > 54 && m.location && <span className="truncate text-foreground/75">{m.location}</span>}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 gap-1.5 rounded-xl p-3.5">
        <p className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <span className="size-2 rounded-full" style={{ background: courseColor(m.hue) }} />
          {m.course} · class
        </p>
        <p className="text-base leading-snug font-medium">{m.name || m.course}</p>
        <p className="text-muted-foreground">
          {longDay(s.start)} · {clock(s.start)}–{clock(s.end)}
        </p>
        {m.location && <p>{m.location}</p>}
        <p className="font-mono text-xs text-muted-foreground">Every {meetingLabel(m)}</p>
        <Link
          href={m.courseId ? `/courses/${m.courseId}` : "/courses"}
          className="mt-1 text-sm underline underline-offset-4 hover:text-foreground"
        >
          Edit class times
        </Link>
      </PopoverContent>
    </Popover>
  );
}

// One thing due. Exams get the course wash so they stand out from ordinary deadlines.
function ItemChip({
  item,
  now,
  wide,
  onToggle,
}: {
  item: Item;
  now: number;
  wide?: boolean;
  onToggle: (id: string) => void;
}) {
  const exam = item.kind === "exam";
  const due = new Date(item.due);
  const late = !item.doneAt && +due < now;
  return (
    <Popover>
      <PopoverTrigger
        title={`${item.course}: ${item.title}`}
        className={cn(
          "flex w-full min-w-0 shrink-0 items-center gap-1.5 rounded-md px-1.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
          wide ? "h-8 text-sm" : "h-6 text-xs",
          exam ? "font-medium hover:brightness-95 dark:hover:brightness-110" : "hover:bg-accent",
        )}
        style={exam ? { background: tint(item.hue) } : undefined}
      >
        <span
          className={cn("size-2 shrink-0 rounded-full", item.doneAt && "opacity-40")}
          style={{ background: courseColor(item.hue) }}
        />
        <span className="sr-only">{item.course} </span>
        {wide && (
          <span
            className={cn(
              "shrink-0 font-mono text-xs tabular-nums",
              late ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {clock(due)}
          </span>
        )}
        {wide && <span className="shrink-0 font-mono text-xs text-muted-foreground">{item.course}</span>}
        {exam && <span className="shrink-0 font-mono text-[10px] uppercase">Exam</span>}
        <span
          className={cn("strike min-w-0 truncate", item.doneAt && "text-muted-foreground", late && "text-destructive")}
          data-done={item.doneAt ? "" : undefined}
        >
          {item.title}
        </span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 gap-1.5 rounded-xl p-3.5">
        <ItemDetails item={item} now={now} onToggle={onToggle} />
      </PopoverContent>
    </Popover>
  );
}

// Month: six full weeks. Deadlines as chips, classes as course-colored dots; any day opens its Day view.
function MonthGrid({ days, anchor, sessions, due, now, onToggle, onDay }: GridProps & { anchor: Date }) {
  const todayKey = dayKey(new Date(now));
  const classes = Map.groupBy(sessions, (s) => dayKey(s.start));
  return (
    <div className="flex h-full flex-col">
      <div className="grid grid-cols-7 border-b border-border">
        {days.slice(0, 7).map((d) => (
          <div key={d.getTime()} className="px-2 py-2 text-right font-mono text-[11px] text-muted-foreground uppercase">
            {d.toLocaleDateString(undefined, { weekday: "short" })}
          </div>
        ))}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6">
        {days.map((d) => {
          const key = dayKey(d);
          const all = due.get(key) ?? [];
          const cls = classes.get(key) ?? [];
          const other = d.getMonth() !== anchor.getMonth();
          const isToday = key === todayKey;
          return (
            <div
              key={key}
              onClick={(e) => e.target === e.currentTarget && onDay(d)}
              className={cn(
                "flex min-h-0 min-w-0 cursor-pointer flex-col gap-0.5 overflow-hidden border-r border-b border-border p-1 transition-colors hover:bg-accent/30",
                other && "bg-muted/40",
              )}
            >
              <div className="flex items-center justify-between gap-1 pl-1">
                <span
                  className="flex min-w-0 gap-0.5"
                  title={cls.map((s) => `${s.meeting.course} ${clock(s.start)}`).join("\n")}
                >
                  {cls.map((s) => (
                    <span
                      key={s.key}
                      className="size-1.5 rounded-full"
                      style={{ background: courseColor(s.meeting.hue) }}
                    />
                  ))}
                  {cls.length > 0 && (
                    <span className="sr-only">Classes: {cls.map((s) => s.meeting.course).join(", ")}</span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => onDay(d)}
                  aria-label={`${longDay(d)}, open day`}
                  aria-current={isToday ? "date" : undefined}
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-full font-mono text-xs tabular-nums outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring",
                    other && "text-muted-foreground",
                    isToday && "bg-brand font-medium text-brand-foreground hover:bg-brand",
                  )}
                >
                  {d.getDate()}
                </button>
              </div>
              {all.slice(0, 3).map((i) => (
                <ItemChip key={i.id} item={i} now={now} onToggle={onToggle} />
              ))}
              {all.length > 3 && (
                <button
                  type="button"
                  onClick={() => onDay(d)}
                  className="px-1.5 text-left font-mono text-[11px] text-muted-foreground hover:text-foreground"
                >
                  +{all.length - 3} more
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Shown until the first deadline exists. Sits over the grid, so your classes stay visible around it.
function Empty({ hasClasses, onAdd }: { hasClasses: boolean; onAdd: (kind: CreateKind) => void }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center p-4">
      <div className="pointer-events-auto flex max-w-sm flex-col items-center gap-2 rounded-2xl bg-card p-6 text-center shadow-[0_8px_30px_rgb(0_0_0/0.12)] ring-1 ring-border">
        <CalendarPlus className="size-6 text-muted-foreground" aria-hidden="true" />
        <h2 className="mt-1 text-lg font-medium tracking-tight text-balance">
          {hasClasses ? "Classes are in. Now the deadlines." : "Your calendar is wide open"}
        </h2>
        <p className="text-sm text-pretty text-muted-foreground">
          {hasClasses
            ? "Add your exams and due dates and they'll sit right on top of your class schedule."
            : "Add your class times and your first exam. They'll land here in course colors."}
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {hasClasses ? (
            <Button variant="secondary" onClick={() => onAdd("assignment")} className={PILL}>
              Add an assignment
            </Button>
          ) : (
            <Link href="/courses" className={cn(buttonVariants({ variant: "secondary" }), PILL)}>
              Add class times
            </Link>
          )}
          <Button onClick={() => onAdd("exam")} className={PILL}>
            Add an exam
          </Button>
        </div>
      </div>
    </div>
  );
}
