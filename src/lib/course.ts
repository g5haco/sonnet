// Course colors share one lightness/chroma (theme tokens); only the hue varies.
// Hues stay >= 40deg from destructive (25), done (150) and brand (205-220) so a course never reads as a status.
export const HUES = [75, 125, 185, 215, 290, 320, 350, 45];

export const courseColor = (hue: number) => `oklch(var(--course-l) var(--course-c) ${hue})`;

// First hue not taken yet; cycles once all are used.
export const nextHue = (taken: number[]) => HUES.find((h) => !taken.includes(h)) ?? HUES[taken.length % HUES.length];

// Local calendar date as YYYY-MM-DD (toISOString would give the UTC date).
export const dayKey = (d: Date) => d.toLocaleDateString("en-CA");

// Weekly class time. Postgres `time` comes back as "HH:MM:SS"; weekdays use 0 = Sunday like Date.getDay().
export type Meeting = { id: string; weekdays: number[]; starts: string; ends: string; location: string; skip_dates?: string[] };

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// "Mon/Wed/Fri 10:00–10:50 · ECCR 1B40", days in Monday-first order.
export const meetingLabel = (m: Omit<Meeting, "id">) =>
  [...m.weekdays]
    .sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7))
    .map((d) => WEEKDAYS[d])
    .join("/") +
  ` ${m.starts.slice(0, 5)}–${m.ends.slice(0, 5)}` +
  (m.location ? ` · ${m.location}` : "");

// Grade shown as "91.2%", or "–" when there isn't one yet.
export const gradeLabel = (grade?: number | null) => (grade == null ? "–" : `${Math.round(grade * 10) / 10}%`);

// Score needed on a final worth `weight`% to finish at `target`%, from the current grade (all percents).
// ponytail: assumes the current grade stands for everything except the final; per-group weights if that's too rough.
export const needOnFinal = (current: number, target: number, weight: number) =>
  (target - current * (1 - weight / 100)) / (weight / 100);
