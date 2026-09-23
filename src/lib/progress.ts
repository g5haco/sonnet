export type Item = {
  id: string;
  title: string;
  course: string;
  kind: "assignment" | "exam" | "quiz" | "reading";
  due: string;
  doneAt: string | null;
};

const WEEK = 7 * 864e5;

// Share of items due by `t` that were done by `doneBy`. Nothing due yet = fully caught up.
// For "now", done is done (doneBy = Infinity); only past snapshots care when it was finished.
function percentAt(items: Item[], t: number, doneBy: number) {
  const due = items.filter((i) => Date.parse(i.due) <= t);
  if (!due.length) return 100;
  const done = due.filter((i) => i.doneAt && Date.parse(i.doneAt) <= doneBy);
  return Math.round((done.length / due.length) * 100);
}

export function progress(items: Item[], termStart: Date, weeks: number, now: Date) {
  const t = now.getTime();
  const weekOf = (iso: string) => Math.floor((Date.parse(iso) - termStart.getTime()) / WEEK);
  const bars = Array.from({ length: weeks }, () => ({ total: 0, done: 0 }));
  for (const i of items) {
    const bar = bars[weekOf(i.due)];
    if (!bar) continue;
    bar.total++;
    if (i.doneAt) bar.done++;
  }
  const percent = percentAt(items, t, Infinity);
  return {
    bars,
    current: weekOf(now.toISOString()),
    percent,
    delta: percent - percentAt(items, t - WEEK, t - WEEK),
    overdue: items.filter((i) => !i.doneAt && Date.parse(i.due) <= t).length,
  };
}
