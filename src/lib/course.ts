// Course colors share one lightness/chroma (theme tokens); only the hue varies.
// Eight hues 45deg apart. Amber (80) and green (150) share hues with --warning / --done: status is always a word or icon
// (or a chip), course identity always a dot/bar/block, so form tells them apart, not hue alone.
// Ordered so the first few courses land far apart on the wheel (blue, coral, green, violet, ...).
export const HUES = [250, 35, 150, 295, 80, 195, 350, 115];

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
