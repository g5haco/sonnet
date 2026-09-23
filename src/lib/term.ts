import { addDays, parseDay, startOfDay, type Term } from "./calendar";

// Where today falls in the semester: before it, in week N of M, or past its last day (`end`, inclusive).
export function termGlance(term: Term, now: Date) {
  const start = parseDay(term.start);
  const days = term.weeks * 7;
  const day = Math.round((+startOfDay(now) - +start) / 864e5); // round: DST days are 23 or 25 hours
  const phase = day < 0 ? "upcoming" : day >= days ? "finished" : "now";
  return {
    start,
    end: addDays(start, days - 1),
    phase,
    week: Math.floor(day / 7) + 1,
    weeksLeft: Math.max(0, term.weeks - Math.floor(Math.max(0, day) / 7) - 1),
    percent: Math.round((Math.min(days, Math.max(0, day + 1)) / days) * 100),
  } as const;
}
