import { Block } from "@/components/block";
import type { Item } from "@/lib/progress";
import { courseColor } from "@/lib/sample";

const TICKS = 60;
const RUNWAY = 21 * 864e5; // the ring is full three weeks out and drains to the exam

export function ExamRing({ items, now, className }: { items: Item[]; now: number; className?: string }) {
  const exam = items
    .filter((i) => i.kind === "exam" && Date.parse(i.due) > now)
    .sort((a, b) => Date.parse(a.due) - Date.parse(b.due))[0];

  if (!exam) {
    return (
      <Block title="Next exam" className={className}>
        <p className="m-auto text-center text-sm text-muted-foreground">No exams on the horizon. Enjoy it.</p>
      </Block>
    );
  }

  const left = Date.parse(exam.due) - now;
  const days = Math.floor(left / 864e5);
  const hours = Math.floor((left % 864e5) / 3600e3);
  const lit = Math.ceil(TICKS * Math.min(1, left / RUNWAY));
  const color = courseColor(exam.course);
  const date = new Date(exam.due).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

  return (
    <Block title="Next exam" aside={days <= 3 ? "crunch time" : "plenty of runway"} className={className}>
      <div className="relative mx-auto aspect-square w-full max-w-56">
        <svg viewBox="0 0 200 200" className="size-full -rotate-90" aria-hidden="true">
          {Array.from({ length: TICKS }, (_, i) => {
            const a = (i / TICKS) * 2 * Math.PI;
            const inner = i % 5 === 0 ? 70 : 76;
            // rounded: server and browser Math.cos differ in the last digit, which breaks hydration
            const at = (r: number, f: typeof Math.cos) => +(100 + r * f(a)).toFixed(2);
            return (
              <line
                key={i}
                x1={at(inner, Math.cos)}
                y1={at(inner, Math.sin)}
                x2={at(92, Math.cos)}
                y2={at(92, Math.sin)}
                strokeWidth={2.5}
                strokeLinecap="round"
                style={{ stroke: i < lit ? color : "var(--muted)" }}
              />
            );
          })}
        </svg>
        <p className="absolute inset-0 flex items-center justify-center font-mono tabular-nums">
          <span className="text-5xl font-medium tracking-tighter">{days}</span>
          <span className="mr-2 text-xl text-muted-foreground">d</span>
          <span className="text-5xl font-medium tracking-tighter">{hours}</span>
          <span className="text-xl text-muted-foreground">h</span>
        </p>
      </div>
      <p className="mt-4 flex items-center gap-2 text-sm">
        <span className="size-2 rounded-full" style={{ background: color }} />
        <span className="font-mono text-xs text-muted-foreground">{exam.course}</span>
        <span className="truncate">{exam.title}</span>
        <span className="ml-auto shrink-0 font-mono text-xs text-muted-foreground">{date}</span>
      </p>
    </Block>
  );
}
