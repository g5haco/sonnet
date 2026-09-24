export type Item = {
  id: string;
  title: string;
  course: string; // course code, e.g. "CHEM 1210"
  courseId?: string;
  hue: number; // course color hue
  kind: "assignment" | "exam" | "quiz" | "reading";
  due: string;
  doneAt: string | null;
  score?: number | null; // points earned, from Canvas once graded
  points?: number | null; // points possible
};

const WEEK = 7 * 864e5;

// The last moment of this week (Sunday 23:59:59.999, local time).
export function endOfWeek(now: number) {
  const d = new Date(now);
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7));
  return d.setHours(23, 59, 59, 999);
}

// Share of items due by `t` that were done by `doneBy`. Nothing due yet = 100%.
// For "now", done is done (doneBy = Infinity); only past snapshots care when it was finished.
// Floored, so one overdue item among 200 reads 99%, never a rounded-up 100%.
function percentAt(items: Item[], t: number, doneBy: number) {
  const due = items.filter((i) => Date.parse(i.due) <= t);
  if (!due.length) return 100;
  const done = due.filter((i) => i.doneAt && Date.parse(i.doneAt) <= doneBy);
  return Math.floor((done.length / due.length) * 100);
}

// The line under the percent. "Fully caught up" only when nothing at all is left open.
export function verdict(p: Pick<ReturnType<typeof progress>, "percent" | "overdue" | "openThisWeek" | "next">) {
  if (p.overdue === 1) return "One thing slipped. Very fixable.";
  if (p.overdue > 1 && p.percent >= 80) return `${p.overdue} overdue. The rest is on track.`;
  if (p.overdue > 1) return `${p.overdue} overdue. Pick the smallest one and start there.`;
  if (p.openThisWeek === 1) return "Nothing overdue. One thing left this week.";
  if (p.openThisWeek > 1) return `Nothing overdue. ${p.openThisWeek} left this week.`;
  if (p.next) return `Nothing overdue. Next up: ${p.next.title}, in ${p.next.days}d.`;
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
  // Work due through the end of this week counts, so open work later this week keeps it under 100%.
  const percent = percentAt(items, endOfWeek(t), Infinity);
  const upcoming = items.filter((i) => !i.doneAt && Date.parse(i.due) > t);
  const next = upcoming.sort((a, b) => Date.parse(a.due) - Date.parse(b.due))[0];
  return {
    bars,
    current: weekOf(now.toISOString()),
    percent,
    delta: percent - percentAt(items, endOfWeek(t - WEEK), t - WEEK),
    overdue: items.filter((i) => !i.doneAt && Date.parse(i.due) <= t).length,
    openThisWeek: upcoming.filter((i) => Date.parse(i.due) <= endOfWeek(t)).length,
    // days rounded like Up next's due labels, so both say the same "9d" (never "0d": it's at least tomorrow)
    next: next && { title: next.title, days: Math.max(1, Math.round((Date.parse(next.due) - t) / 864e5)) },
  };
}
