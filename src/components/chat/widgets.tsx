"use client";

import { CalendarRange, Check, Copy, ListChecks } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAssistant } from "@/components/app-shell";
import { ItemDetails } from "@/components/item-details";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useWork, when } from "@/components/up-next";
import { courseColor, meetingLabel } from "@/lib/course";
import type { Item } from "@/lib/progress";
import { cn } from "@/lib/utils";

// The live pieces inside the assistant's answers. They read the student's real items and class times
// (loaded by the app layout), so a chip is always current and checking something off here is the real thing.

const CHIP =
  "mx-0.5 inline-block max-w-full rounded-md bg-secondary px-1.5 py-px align-baseline font-medium text-foreground outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring";
const Dot = ({ hue }: { hue: number }) => (
  <span className="mr-1.5 inline-block size-2 rounded-full align-middle" style={{ background: courseColor(hue) }} />
);

// [Essay 1](item:2657af): a chip in its course color; tap it for details, check-off and its course.
export function ItemLink({ refId, children }: { refId: string; children?: React.ReactNode }) {
  const { schedule } = useAssistant();
  const [now] = useState(() => Date.now());
  const found = schedule.items.find((i) => i.id.startsWith(refId));
  const { shown, toggle } = useWork(found ? [found] : []);
  const item = shown[0];
  if (!item) return <span className="font-medium">{children}</span>;
  return (
    <Popover>
      <PopoverTrigger className={cn(CHIP, "text-left")}>
        <Dot hue={item.hue} />
        <span className={cn("strike", item.doneAt && "text-muted-foreground")} data-done={item.doneAt ? "" : undefined}>
          {children ?? item.title}
        </span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 gap-1.5 rounded-xl p-3.5">
        <ItemDetails item={item} now={now} onToggle={toggle} />
      </PopoverContent>
    </Popover>
  );
}

// A course code anywhere in an answer: a chip that opens the course.
export function CourseLink({ id, children }: { id: string; children: React.ReactNode }) {
  const { courses } = useAssistant();
  const course = courses.find((c) => c.id === id);
  if (!course) return <>{children}</>;
  return (
    <Link href={`/courses/${course.id}`} className={cn(CHIP, "font-mono text-[0.88em]")}>
      <Dot hue={course.hue} />
      {children}
    </Link>
  );
}

// [POLS 202 Mon/Wed 10:30–12:20](class:4d5e6f): a class time, opening its course (where it's edited).
export function ClassLink({ refId, children }: { refId: string; children: React.ReactNode }) {
  const { schedule } = useAssistant();
  const m = schedule.meetings.find((x) => x.id.startsWith(refId));
  if (!m) return <span className="font-medium">{children}</span>;
  return (
    <Link href={m.courseId ? `/courses/${m.courseId}` : "/courses"} className={CHIP} title={meetingLabel(m)}>
      <Dot hue={m.hue} />
      {children}
    </Link>
  );
}

// A ```work block: the listed items as a live list you can check off and open.
export function WorkCard({ text }: { text: string }) {
  const { schedule } = useAssistant();
  const [now] = useState(() => Date.now());
  const lines = text.split("\n").map((l) => l.trim());
  const title = lines.find((l) => /^title:/i.test(l))?.replace(/^title:\s*/i, "");
  const refs = [...new Set(lines.filter((l) => !/^title:/i.test(l)).flatMap((l) => l.match(/\b[0-9a-f]{6}\b/g) ?? []))];
  const found = refs
    .map((r) => schedule.items.find((i) => i.id.startsWith(r)))
    .filter((i): i is Item => i !== undefined)
    .sort((a, b) => Date.parse(a.due) - Date.parse(b.due)); // urgency = soonest due, whatever order the model wrote
  const { shown, toggle } = useWork(found);
  if (!shown.length) return null;

  return (
    <div className="my-3 overflow-hidden rounded-2xl bg-secondary">
      <p className="flex items-center justify-between gap-2 px-4 pt-3 pb-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-2 text-sm font-medium text-foreground">
          <ListChecks className="size-4 text-muted-foreground" aria-hidden="true" />
          {title ?? "Your work"}
        </span>
        <span className="font-mono">{shown.filter((i) => !i.doneAt).length} open</span>
      </p>
      <ul className="p-1.5">
        {shown.map((i) => {
          const done = !!i.doneAt;
          const due = when(i.due, now);
          return (
            <li
              key={i.id}
              className="flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors hover:bg-background/60"
            >
              <Checkbox
                // a real <button>: a <span> checkbox toggles twice on Space inside labels
                nativeButton
                render={<button type="button" />}
                checked={done}
                onCheckedChange={() => toggle(i.id)}
                aria-label={`${i.title}: done`}
                className="size-5 rounded-full transition-transform active:scale-80 data-checked:animate-check-pop data-checked:border-done data-checked:bg-done"
              />
              <Popover>
                <PopoverTrigger className="min-w-0 flex-1 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <span className={cn("block truncate font-medium", done && "text-muted-foreground")}>
                    <span className="strike" data-done={done || undefined}>
                      {i.title}
                    </span>
                    {i.kind === "exam" && (
                      <span className="ml-2 rounded-full bg-background px-2 py-0.5 font-mono text-[10px] uppercase">
                        exam
                      </span>
                    )}
                  </span>
                  <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                    <span className="size-2 rounded-full" style={{ background: courseColor(i.hue) }} />
                    {i.course} ·{" "}
                    {new Date(i.due).toLocaleString(undefined, {
                      weekday: "short",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-72 gap-1.5 rounded-xl p-3.5">
                  <ItemDetails item={i} now={now} onToggle={toggle} />
                </PopoverContent>
              </Popover>
              <span
                className={cn(
                  "shrink-0 font-mono text-sm tabular-nums",
                  done ? "text-muted-foreground" : due.late && "chip rounded-full px-1.5",
                )}
                style={!done && due.late ? ({ "--chip": "var(--destructive)" } as React.CSSProperties) : undefined}
              >
                {done ? "done" : due.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// A ```plan block ("day | start | end | what | ref"): study sessions on a timeline, grouped by day.
export function PlanCard({ text }: { text: string }) {
  const rows = text
    .split("\n")
    .map((l) => l.split("|").map((x) => x.trim()))
    .filter((r) => r.length >= 4 && r[0] && r[3]);
  if (!rows.length) return null;
  return (
    <div className="my-3 rounded-2xl bg-secondary p-4">
      <p className="mb-3 flex items-center gap-2 text-sm font-medium">
        <CalendarRange className="size-4 text-muted-foreground" aria-hidden="true" />
        Plan
      </p>
      <ol className="flex flex-col gap-4">
        {[...Map.groupBy(rows, (r) => r[0])].map(([day, list]) => (
          <li key={day}>
            <p className="mb-2 font-mono text-xs tracking-wide text-muted-foreground uppercase">{day}</p>
            <ul className="flex flex-col gap-2 border-l border-foreground/15 pl-4">
              {list.map(([, start, end, what, ref], i) => (
                <li key={i} className="relative">
                  <span
                    className="absolute top-[7px] -left-[20.5px] size-2 rounded-full bg-foreground/50"
                    aria-hidden="true"
                  />
                  <span className="mr-2 font-mono text-xs text-muted-foreground tabular-nums">
                    {start}
                    {end && `–${end}`}
                  </span>
                  <span>{what}</span>
                  {ref && /^[0-9a-f]{6}$/.test(ref) && (
                    <>
                      {" "}
                      <ItemLink refId={ref} />
                    </>
                  )}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}

function useCopy(text: string) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return { copied, copy };
}

// Fenced code: the language, the code, and a copy button, like every chat app worth using.
export function CodeBlock({ lang, text }: { lang: string; text: string }) {
  const { copied, copy } = useCopy(text);
  return (
    <div className="my-3 overflow-hidden rounded-xl border border-border bg-secondary/60">
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5 font-mono text-[11px] text-muted-foreground">
        <span>{lang || "code"}</span>
        <button
          type="button"
          onClick={copy}
          className="flex items-center gap-1 rounded-md px-1.5 py-0.5 transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-3 font-mono text-[13px] leading-relaxed">
        <code>{text}</code>
      </pre>
    </div>
  );
}

// Under a finished answer: copy it (as Markdown).
export function CopyAnswer({ text }: { text: string }) {
  const { copied, copy } = useCopy(text);
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Copied" : "Copy answer"}
      className="mt-1.5 -ml-1.5 flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied && "Copied"}
    </button>
  );
}
