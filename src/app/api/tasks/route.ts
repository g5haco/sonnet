import { addMaterial, readSyllabus, summarizeSyllabus, syncCanvasNow } from "@/app/actions";

export const maxDuration = 60;

// The slow server actions, reachable by fetch. Next runs Server Actions one at a time per tab, so a minute-long
// syllabus read would hold up every check-off behind it; a plain request runs alongside them. Each function
// still checks the session and its own input, exactly as when it's called as an action.
const TASKS = {
  addMaterial,
  readSyllabus,
  summarizeSyllabus,
  syncCanvasNow,
} as const;
export type TaskName = keyof typeof TASKS;
export type Tasks = typeof TASKS;

export async function POST(request: Request) {
  const { name, args } = (await request.json().catch(() => ({}))) as { name?: string; args?: unknown };
  const task = Object.hasOwn(TASKS, name ?? "") ? TASKS[name as TaskName] : null;
  if (!task || !Array.isArray(args)) return Response.json({ error: "Unknown task." }, { status: 400 });
  return Response.json(await (task as (...a: unknown[]) => Promise<unknown>)(...args));
}
