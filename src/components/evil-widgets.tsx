"use client";

// Home's EvilCharts widgets (Recharts). Loaded with next/dynamic from the dashboard so Recharts stays out of the
// shared bundle. Same rule as chart-widgets: real data only, and an empty state that says what fills the chart.
import { Block } from "@/components/block";
import { EvilAreaChart } from "@/components/evilcharts/charts/recharts-area-chart";
import { EvilPieChart } from "@/components/evilcharts/charts/recharts-pie-chart";
import { EvilRadarChart } from "@/components/evilcharts/charts/recharts-radar-chart";
import { EvilRadialChart } from "@/components/evilcharts/charts/recharts-radial-chart";
import type { ChartConfig } from "@/components/evilcharts/ui/recharts-chart";
import type { Term } from "@/lib/calendar";
import { openByCourse, openByKind, paceByWeek } from "@/lib/charts";
import { courseColor } from "@/lib/course";
import type { Item } from "@/lib/progress";

type Course = { id: string; code: string; name: string; hue: number; grade?: number | null };

const Empty = ({ children }: { children: React.ReactNode }) => (
  <p className="m-auto max-w-72 text-center text-sm text-balance text-muted-foreground">{children}</p>
);
const color = (c: string) => ({ light: [c], dark: [c] });
const chart = "aspect-auto min-h-0 w-full flex-1";

// Open work ahead per course: a lopsided shape means one class is carrying the load.
export function RadarWidget({ items, courses, now }: { items: Item[]; courses: Course[]; now: number }) {
  const data = openByCourse(items, courses, now);
  const total = data.reduce((a, r) => a + r.open, 0);
  const config = { open: { label: "Open work", colors: color("var(--brand)") } } satisfies ChartConfig;
  return (
    <Block title="Workload radar" aside={total ? `${total} open` : undefined}>
      {courses.length < 3 || total === 0 ? (
        <Empty>{courses.length < 3 ? "Needs three or more courses to draw a shape." : "Nothing open ahead. Enjoy it."}</Empty>
      ) : (
        <EvilRadarChart className={chart} config={config} data={data} chartProps={{ outerRadius: "62%" }}>
          <EvilRadarChart.PolarGrid />
          <EvilRadarChart.PolarAngleAxis dataKey="course" tick={{ fontSize: 10 }} />
          <EvilRadarChart.Radar dataKey="open" variant="filled" />
          <EvilRadarChart.Tooltip />
        </EvilRadarChart>
      )}
    </Block>
  );
}

// Each course's current grade as a ring, a full sweep = 100%.
export function RingsWidget({ courses }: { courses: Course[] }) {
  // Keyed by position: config keys become CSS variable names, and course codes have spaces.
  const shown = courses.filter((c) => c.grade != null);
  const data = shown.map((c, k) => ({ key: `c${k}`, grade: Math.round(Number(c.grade)) }));
  const config: ChartConfig = Object.fromEntries(
    shown.map((c, k) => [`c${k}`, { label: c.code, colors: color(courseColor(c.hue)) }]),
  );
  return (
    <Block title="Grade rings">
      {data.length === 0 ? (
        <Empty>Grades show here once Canvas sync brings them in, or you add scores on a course page.</Empty>
      ) : (
        <>
          <EvilRadialChart className={chart} config={config} data={data} nameKey="key" max={100} innerRadius="30%">
            <EvilRadialChart.RadialBar dataKey="grade" showBackground cornerRadius={8} />
            <EvilRadialChart.Tooltip />
          </EvilRadialChart>
          <ul className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 font-mono text-xs">
            {shown.map((c, k) => (
              <li key={c.id} className="flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ background: courseColor(c.hue) }} aria-hidden="true" />
                {c.code} <span className="text-muted-foreground tabular-nums">{data[k].grade}%</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Block>
  );
}

// Per term week: how much came due and how much of it got done.
export function PaceWidget({ items, term, now }: { items: Item[]; term: Term; now: number }) {
  const data = paceByWeek(items, term, now);
  const config = {
    due: { label: "Due", colors: color("var(--muted-foreground)") },
    done: { label: "Done", colors: color("var(--brand)") },
  } satisfies ChartConfig;
  return (
    <Block title="Done vs due" aside="per week">
      {data.length < 2 ? (
        <Empty>Fills in week by week as the term goes on.</Empty>
      ) : (
        <EvilAreaChart className={chart} config={config} data={data} curveType="monotone">
          <EvilAreaChart.XAxis dataKey="week" interval="preserveStartEnd" />
          <EvilAreaChart.Area dataKey="due" variant="gradient" strokeVariant="dashed" />
          <EvilAreaChart.Area dataKey="done" variant="gradient" />
          <EvilAreaChart.Tooltip />
        </EvilAreaChart>
      )}
    </Block>
  );
}

const KINDS = { assignment: "Assignments", exam: "Exams", quiz: "Quizzes", reading: "Readings" } as const;

// What the open work ahead is made of.
export function MixWidget({ items, now }: { items: Item[]; now: number }) {
  const data = openByKind(items, now);
  const config: ChartConfig = {
    assignment: { label: KINDS.assignment, colors: color("var(--brand)") },
    exam: { label: KINDS.exam, colors: color("oklch(0.7 0.15 25)") },
    quiz: { label: KINDS.quiz, colors: color("oklch(0.75 0.13 80)") },
    reading: { label: KINDS.reading, colors: color("var(--muted-foreground)") },
  };
  return (
    <Block title="Work mix" aside={data.length ? `${data.reduce((a, r) => a + r.open, 0)} open` : undefined}>
      {data.length === 0 ? (
        <Empty>Nothing open ahead.</Empty>
      ) : (
        <EvilPieChart className={chart} config={config} data={data} dataKey="open" nameKey="kind">
          <EvilPieChart.Pie innerRadius="55%" paddingAngle={3} cornerRadius={6} />
          <EvilPieChart.Tooltip />
          <EvilPieChart.Legend />
        </EvilPieChart>
      )}
    </Block>
  );
}
