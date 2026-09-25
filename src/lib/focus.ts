import { dayKey } from "./course";

export type FocusSession = { started_at: string; minutes: number; course_id?: string | null };

// Minutes studied per local day ("YYYY-MM-DD").
export function studyDays(sessions: FocusSession[]) {
  const days = new Map<string, number>();
  for (const s of sessions) {
    const key = dayKey(new Date(s.started_at));
    days.set(key, (days.get(key) ?? 0) + s.minutes);
  }
  return days;
}

// Days in a row with focus time, ending today (or yesterday, so the streak survives until tonight).
export function streak(days: Map<string, number>, today: Date) {
  const d = new Date(today);
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (days.has(dayKey(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}
