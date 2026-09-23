export type Item = {
  id: string;
  title: string;
  course: string; // course code, e.g. "CHEM 1210"
  courseId?: string;
  hue: number; // course color hue
  kind: "assignment" | "exam" | "quiz" | "reading";
  due: string;
  doneAt: string | null;
};

const WEEK = 7 * 864e5;

// The last moment of this week (Sunday 23:59:59.999, local time).
export function endOfWeek(now: number) {
  const d = new Date(now);
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7));
  return d.setHours(23, 59, 59, 999);
}

// Share of items due by `t` that were done by `doneBy`. Nothing due yet = fully caught up.
// For "now", done is done (doneBy = Infinity); only past snapshots care when it was finished.
// Floored, so one overdue item among 200 reads 99%, never a rounded-up 100%.
function percentAt(items: Item[], t: number, doneBy: number) {
  const due = items.filter((i) => Date.parse(i.due) <= t);
  if (!due.length) return 100;
  const done = due.filter((i) => i.doneAt && Date.parse(i.doneAt) <= doneBy);
  return Math.floor((done.length / due.length) * 100);
}

// The line under the percent. Only "fully caught up" when nothing is overdue AND nothing is left this week.
export function verdict({ percent, overdue, openThisWeek }: { percent: number; overdue: number; openThisWeek: number }) {
  if (overdue === 1) return "One thing slipped. Very fixable.";
  if (overdue > 1 && percent >= 80) return `${overdue} overdue. The rest is on track.`;
  if (overdue > 1) return `${overdue} overdue. Pick the smallest one and start there.`;
  if (openThisWeek === 1) return "Nothing overdue. One thing left this week.";
  if (openThisWeek > 1) return `Nothing overdue. ${openThisWeek} left this week.`;
  return "Fully caught up. Suspicious.";
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
    openThisWeek: items.filter((i) => !i.doneAt && Date.parse(i.due) > t && Date.parse(i.due) <= endOfWeek(t)).length,
  };
}
