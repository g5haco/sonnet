"use client";

// Home's EvilCharts widgets (Recharts). Loaded with next/dynamic from the dashboard so Recharts stays out of the
// shared bundle. Same rule as chart-widgets: real data only, and an empty state that says what fills the chart.
import { Block } from "@/components/block";
import { EvilAreaChart } from "@/components/evilcharts/charts/recharts-area-chart";
import type { ChartConfig } from "@/components/evilcharts/ui/recharts-chart";
import type { Term } from "@/lib/calendar";
import { paceByWeek } from "@/lib/charts";
import type { Item } from "@/lib/progress";

const Empty = ({ children }: { children: React.ReactNode }) => (
  <p data-empty className="m-auto max-w-72 text-center text-sm text-balance text-muted-foreground">{children}</p>
);
const color = (c: string) => ({ light: [c], dark: [c] });
const chart = "aspect-auto min-h-0 w-full flex-1";

// Per term week: how much came due and how much of it got done.
export function PaceWidget({ items, term, now }: { items: Item[]; term: Term; now: number }) {
  const data = paceByWeek(items, term, now);
  const config = {
    due: { label: "Due", colors: color("var(--muted-foreground)") },
    done: { label: "Done", colors: color("var(--done)") },
  } satisfies ChartConfig;
  return (
    <Block title="Done vs due" aside="per week">
      {data.length < 2 ? (
        <Empty>Fills in week by week as the term goes on.</Empty>
      ) : (
        <EvilAreaChart className={chart} config={config} data={data} curveType="monotone">
          <EvilAreaChart.XAxis dataKey="week" interval="preserveStartEnd" />
          <EvilAreaChart.Area dataKey="due" variant="solid" strokeVariant="dashed" />
          <EvilAreaChart.Area dataKey="done" variant="solid" />
          <EvilAreaChart.Tooltip />
        </EvilAreaChart>
      )}
    </Block>
  );
}

