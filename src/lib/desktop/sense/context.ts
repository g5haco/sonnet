// What a focus session is for: a course, an assignment and/or a goal. Desktop only. Kept in this browser profile
// (localStorage), keyed by the session id; it never goes to the server and the timer's saved session is unchanged.
import type { FocusSessionContext } from "./types";

export type StudyContext = Omit<FocusSessionContext, "sessionId">;

const NEXT = "sonnet-focus-sense-next"; // picked in the timer before Start
const SESSIONS = "sonnet-focus-sense-sessions"; // sessionId -> context
const KEEP = 30;
const KINDS = ["assignment", "exam", "quiz", "reading"] as const;

const read = (key: string): unknown => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null");
  } catch {
    return null;
  }
};
const write = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

const text = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined);

// Only known fields, as bounded strings. Anything else in storage is dropped.
export function cleanContext(v: unknown): StudyContext {
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  const kind = KINDS.find((k) => k === o.assignmentKind);
  const c: StudyContext = {
    goal: text(o.goal, 200),
    courseId: text(o.courseId, 64),
    courseName: text(o.courseName, 120),
    assignmentId: text(o.assignmentId, 64),
    assignmentTitle: text(o.assignmentTitle, 200),
    assignmentKind: kind,
  };
  return Object.fromEntries(Object.entries(c).filter(([, x]) => x !== undefined)) as StudyContext;
}

const sessions = (): Record<string, StudyContext> => {
  const all = read(SESSIONS);
  return all && typeof all === "object" ? (all as Record<string, StudyContext>) : {};
};

export const nextContext = () => cleanContext(read(NEXT));
export const setNextContext = (c: StudyContext) => write(NEXT, cleanContext(c));

// The timer started sensing this session: the context picked for "next" becomes its own. Once per session, so a
// reload doesn't overwrite it. Keeps the newest KEEP sessions.
export function bindContext(sessionId: string) {
  const all = sessions();
  if (all[sessionId]) return;
  all[sessionId] = nextContext();
  const ids = Object.keys(all)
    .sort((a, b) => Number(b) - Number(a))
    .slice(0, KEEP);
  write(SESSIONS, Object.fromEntries(ids.map((id) => [id, all[id]])));
}

export const sessionContext = (sessionId: string): FocusSessionContext => ({
  sessionId,
  ...cleanContext(sessions()[sessionId]),
});

export const clearContexts = () => {
  try {
    localStorage.removeItem(SESSIONS);
  } catch {}
};
