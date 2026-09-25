import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { HUES } from "./course";

export type CanvasCourse = {
  id: string | number;
  name?: string;
  course_code?: string;
  enrollments?: { computed_current_score?: number | null }[]; // with include[]=total_scores
};
type CanvasAssignment = {
  id: string | number;
  course_id: string | number;
  name: string;
  description?: string | null;
  due_at?: string | null;
  html_url?: string | null;
  points_possible?: number | null;
  quiz_id?: string | number | null;
  is_quiz_assignment?: boolean;
  submission?: {
    workflow_state?: string;
    submitted_at?: string | null;
    graded_at?: string | null;
    score?: number | null;
  } | null;
};

type CanvasItem = {
  course_id: string;
  source: "canvas" | "ics";
  external_id: string;
  kind: "assignment" | "exam" | "quiz" | "reading";
  title: string;
  description: string | null;
  due: string;
  html_url: string | null;
  points_possible: number | null;
  score: number | null;
  done_at: string | null;
};

type CanvasSettings = {
  canvas_base_url: string | null;
  canvas_ics_url: string | null;
  canvas_token_connected: boolean;
};

const iso = (value?: string | null) => {
  const date = value && new Date(value);
  return date && !Number.isNaN(date.valueOf()) ? date.toISOString() : null;
};

export function mapCanvasAssignment(courseId: string, assignment: CanvasAssignment): CanvasItem | null {
  const due = iso(assignment.due_at);
  if (!due || !assignment.name?.trim()) return null;
  const submitted = assignment.submission;
  const done =
    submitted && ["submitted", "graded", "pending_review", "complete"].includes(submitted.workflow_state ?? "");
  const title = assignment.name.trim().slice(0, 200);
  return {
    course_id: courseId,
    source: "canvas",
    external_id: `${assignment.course_id}:${assignment.id}`,
    kind: /\b(exam|midterm|final)\b/i.test(title)
      ? "exam"
      : assignment.is_quiz_assignment || assignment.quiz_id
        ? "quiz"
        : "assignment",
    title,
    description: assignment.description?.slice(0, 100_000) || null,
    due,
    html_url: assignment.html_url?.slice(0, 2_000) || null,
    points_possible: Number.isFinite(assignment.points_possible) ? assignment.points_possible! : null,
    score: Number.isFinite(submitted?.score) ? submitted!.score! : null,
    done_at: done ? (iso(submitted?.submitted_at) ?? iso(submitted?.graded_at) ?? due) : null,
  };
}

export function canvasBaseUrl(value: string) {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function canvasFeedUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function encryptionKey() {
  const key = Buffer.from(process.env.CANVAS_ENCRYPTION_KEY ?? "", "base64");
  if (key.length !== 32) throw new Error("CANVAS_ENCRYPTION_KEY must be a base64-encoded 32-byte key.");
  return key;
}

export function encryptCanvasToken(token: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString("base64url")).join(".");
}

export function decryptCanvasToken(value: string) {
  const [iv, tag, encrypted] = value.split(".").map((part) => Buffer.from(part, "base64url"));
  if (!iv || !tag || !encrypted) throw new Error("The saved Canvas token is invalid.");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv, { authTagLength: 16 });
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

const nextLink = (header: string | null) =>
  header
    ?.split(",")
    .map((part) => part.match(/<([^>]+)>;\s*rel="([^"]+)"/))
    .find((match) => match?.[2] === "next")?.[1] ?? null;

export async function canvasPages<T>(url: string, token: string, fetcher: typeof fetch = fetch): Promise<T[]> {
  const rows: T[] = [];
  let next: string | null = url;
  while (next) {
    const response = await fetcher(next, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json+canvas-string-ids" },
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok)
      throw new Error(
        response.status === 401 ? "Canvas rejected the access token." : `Canvas returned ${response.status}.`,
      );
    const page = (await response.json()) as T[];
    if (!Array.isArray(page)) throw new Error("Canvas returned an unexpected response.");
    rows.push(...page);
    next = nextLink(response.headers.get("link"));
    // The token only ever goes to the Canvas server we started on.
    if (next && new URL(next).origin !== new URL(url).origin) throw new Error("Canvas sent a link to another site.");
  }
  return rows;
}

type IcsEvent = {
  uid: string;
  title: string;
  description: string | null;
  due: string;
  url: string | null;
  canvasCourseId: string | null;
  courseCode: string | null; // Canvas appends " [POLS&202 9347]" to feed titles
  assignmentId: string | null;
};

const unescapeIcs = (value: string) =>
  value.replace(/\\n/gi, "\n").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\");

const icsDate = (value: string) => {
  const raw = value.trim();
  if (/^\d{8}$/.test(raw))
    return new Date(`${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}T23:59:00Z`).toISOString();
  const match = raw.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/);
  if (!match) return null;
  const [, y, m, d, h, min, s, z] = match;
  return iso(`${y}-${m}-${d}T${h}:${min}:${s}${z || "Z"}`);
};

export function parseCanvasIcs(text: string): IcsEvent[] {
  const lines = text.replace(/\r?\n[ \t]/g, "").split(/\r?\n/);
  const events: IcsEvent[] = [];
  let row: Record<string, string> | null = null;
  for (const line of lines) {
    if (line === "BEGIN:VEVENT") row = {};
    else if (line === "END:VEVENT" && row) {
      const due = icsDate(row.DTSTART ?? "");
      if (row.UID && row.SUMMARY && due) {
        const url = row.URL || row.DESCRIPTION?.match(/https?:\/\/\S+/)?.[0]?.replace(/[)>.,]+$/, "") || null;
        const summary = unescapeIcs(row.SUMMARY).trim();
        const code = summary.match(/\s*\[([^\]]+)\]$/);
        // Feed links point at the calendar (…include_contexts=course_42#assignment_9), not the assignment.
        const courseId = url?.match(/\/courses\/(\d+)|course_(\d+)/);
        const assignmentId = url?.match(/\/assignments\/(\d+)|assignment_(\d+)/);
        events.push({
          uid: row.UID.slice(0, 300),
          title: (code ? summary.slice(0, code.index) : summary).slice(0, 200),
          description: row.DESCRIPTION ? unescapeIcs(row.DESCRIPTION).slice(0, 100_000) : null,
          due,
          url,
          canvasCourseId: courseId?.[1] ?? courseId?.[2] ?? null,
          courseCode: code?.[1].trim().slice(0, 40) ?? null, // courses.code holds at most 40
          assignmentId: assignmentId?.[1] ?? assignmentId?.[2] ?? null,
        });
      }
      row = null;
    } else if (row) {
      const split = line.indexOf(":");
      if (split > 0) row[line.slice(0, split).split(";")[0]] = line.slice(split + 1);
    }
  }
  return events;
}

// Same title and due within a day (the feed and the API can round due times differently).
const sameWork = (a: { title: string; due: string }, b: { title: string; due: string }) =>
  a.title.trim().toLowerCase() === b.title.trim().toLowerCase() &&
  Math.abs(Date.parse(a.due) - Date.parse(b.due)) <= 864e5;

export function mapIcsEvents(
  events: IcsEvent[],
  courses: Map<string, string>,
  fallbackCourseId: string,
  canvasItems: CanvasItem[],
  codes = new Map<string, string>(), // lowercased course code → local course id
): CanvasItem[] {
  return events
    .filter(
      (event) => !canvasItems.some((item) => event.assignmentId && item.external_id.endsWith(`:${event.assignmentId}`)),
    )
    .map((event): CanvasItem => ({
      course_id:
        (event.canvasCourseId && courses.get(event.canvasCourseId)) ||
        (event.courseCode && codes.get(event.courseCode.toLowerCase())) ||
        fallbackCourseId,
      source: "ics",
      external_id: event.uid,
      kind: /\b(exam|midterm|final)\b/i.test(event.title)
        ? "exam"
        : /\bquiz\b/i.test(event.title)
          ? "quiz"
          : "assignment",
      title: event.title,
      description: event.description,
      due: event.due,
      html_url: event.url,
      points_possible: null,
      score: null,
      done_at: null,
    }))
    .filter((event) => !canvasItems.some((item) => item.html_url === event.html_url || sameWork(item, event)));
}

async function getOrCreateCourse(
  admin: SupabaseClient,
  userId: string,
  remote: CanvasCourse,
  index: number,
  existing: { id: string; code: string; canvas_course_id: string | null }[],
) {
  const remoteId = String(remote.id);
  const code = (remote.course_code || remote.name || `Canvas ${remoteId}`).trim().slice(0, 40);
  const found = existing.find(
    (course) => course.canvas_course_id === remoteId || course.code.toLowerCase() === code.toLowerCase(),
  );
  if (found) {
    if (!found.canvas_course_id) await admin.from("courses").update({ canvas_course_id: remoteId }).eq("id", found.id);
    return found.id;
  }
  const { data, error } = await admin
    .from("courses")
    .insert({
      user_id: userId,
      canvas_course_id: remoteId,
      code,
      name: (remote.name ?? "").slice(0, 120),
      hue: HUES[index % HUES.length],
    })
    .select("id")
    .single();
  if (error) throw error;
  existing.push({ id: data.id, code, canvas_course_id: remoteId });
  return data.id as string;
}

export async function syncCanvasUser(admin: SupabaseClient, userId: string, fetcher: typeof fetch = fetch) {
  const { data: settings, error: settingsError } = await admin
    .from("settings")
    .select("canvas_base_url, canvas_ics_url, canvas_token_connected")
    .eq("user_id", userId)
    .single();
  if (settingsError) throw settingsError;
  const config = settings as CanvasSettings;
  await admin
    .from("settings")
    .update({ canvas_last_sync_status: "syncing", canvas_last_sync_error: null })
    .eq("user_id", userId);

  try {
    const canvasCourses: CanvasCourse[] = [];
    const assignments = new Map<string, CanvasAssignment[]>();
    if (config.canvas_token_connected) {
      const { data: secret, error } = await admin
        .from("canvas_connections")
        .select("token_encrypted")
        .eq("user_id", userId)
        .single();
      if (error || !secret) throw new Error("Canvas access token is missing.");
      // Re-checked here: the saved value is only trusted if it still passes the save-time rules.
      const base = config.canvas_base_url && canvasBaseUrl(config.canvas_base_url);
      if (!base) throw new Error("Canvas base URL is missing.");
      const token = decryptCanvasToken(secret.token_encrypted);
      canvasCourses.push(
        ...(await canvasPages<CanvasCourse>(
          `${base}/api/v1/courses?enrollment_type=student&state[]=available&include[]=total_scores&per_page=100`,
          token,
          fetcher,
        )),
      );
      for (const course of canvasCourses) {
        assignments.set(
          String(course.id),
          await canvasPages<CanvasAssignment>(
            `${base}/api/v1/courses/${course.id}/assignments?include[]=submission&order_by=due_at&per_page=100`,
            token,
            fetcher,
          ),
        );
      }
    }

    let ics: IcsEvent[] = [];
    const feed = config.canvas_ics_url && canvasFeedUrl(config.canvas_ics_url);
    if (feed) {
      const response = await fetcher(feed, { signal: AbortSignal.timeout(20_000) });
      if (!response.ok) throw new Error(`Canvas calendar returned ${response.status}.`);
      ics = parseCanvasIcs(await response.text());
    }

    const { data: current, error: coursesError } = await admin
      .from("courses")
      .select("id, code, canvas_course_id")
      .eq("user_id", userId);
    if (coursesError) throw coursesError;
    const existing = current ?? [];
    const courseIds = new Map<string, string>();
    for (const [index, course] of canvasCourses.entries()) {
      const id = await getOrCreateCourse(admin, userId, course, index, existing);
      courseIds.set(String(course.id), id);
      // Canvas's own current score (weights applied); null when the course hides totals.
      // A separate write, so a database without migration 0006 still syncs (the error is ignored).
      const grade = course.enrollments?.find((e) => Number.isFinite(e.computed_current_score))?.computed_current_score;
      await admin.from("courses").update({ grade: grade ?? null }).eq("id", id);
      // Today's point on the Grade trend (one per course per day). Ignored before migration 0009.
      if (grade != null)
        await admin
          .from("grade_history")
          .upsert({ user_id: userId, course_id: id, day: new Date().toISOString().slice(0, 10), grade });
    }
    // Feed-only users (no token) still get real courses from the " [CODE]" on each feed title.
    for (const event of ics) {
      const known =
        (event.canvasCourseId && courseIds.has(event.canvasCourseId)) ||
        existing.some((c) => c.code.toLowerCase() === event.courseCode?.toLowerCase());
      if (!known && event.courseCode) {
        const id = await getOrCreateCourse(
          admin,
          userId,
          { id: event.canvasCourseId ?? `ics:${event.courseCode}`, course_code: event.courseCode },
          existing.length,
          existing,
        );
        if (event.canvasCourseId) courseIds.set(event.canvasCourseId, id);
      }
    }
    const codes = new Map(existing.map((c) => [c.code.toLowerCase(), c.id]));
    const unplaced = (event: IcsEvent) =>
      !(event.canvasCourseId && courseIds.has(event.canvasCourseId)) &&
      !codes.has(event.courseCode?.toLowerCase() ?? "");
    let fallback = existing.find((course) => course.code === "CANVAS")?.id;
    if (ics.length && !fallback && ics.some(unplaced)) {
      fallback = await getOrCreateCourse(
        admin,
        userId,
        { id: "calendar", course_code: "CANVAS", name: "Canvas Calendar" },
        existing.length,
        existing,
      );
    }

    const tokenItems = [...assignments].flatMap(([courseId, rows]) => {
      const local = courseIds.get(courseId);
      return local
        ? rows.map((row) => mapCanvasAssignment(local, row)).filter((row): row is CanvasItem => row !== null)
        : [];
    });
    const items = [
      ...tokenItems,
      ...mapIcsEvents(ics, courseIds, fallback ?? existing[0]?.id ?? "", tokenItems, codes),
    ].filter((item) => item.course_id);
    if (items.length) {
      const { error } = await admin.from("items").upsert(
        items.map((item) => ({ ...item, user_id: userId })),
        { onConflict: "user_id,source,external_id" },
      );
      if (error) throw error;
    }
    // An empty feed is more likely a Canvas hiccup than an empty term: then leave the saved rows alone.
    if (config.canvas_ics_url && ics.length) {
      // Feed rows that are now covered by the API (or gone from the feed) are duplicates: remove them,
      // then the "CANVAS" catch-all course if nothing is left in it. Deleted by id in chunks so a long
      // feed can't overflow the request URL.
      const kept = new Set(items.filter((i) => i.source === "ics").map((i) => i.external_id));
      const { data: saved, error } = await admin
        .from("items")
        .select("id, external_id")
        .eq("user_id", userId)
        .eq("source", "ics");
      if (error) throw error;
      const stale = (saved ?? []).filter((row) => !kept.has(row.external_id)).map((row) => row.id);
      for (let i = 0; i < stale.length; i += 100) {
        const { error } = await admin
          .from("items")
          .delete()
          .eq("user_id", userId)
          .in("id", stale.slice(i, i + 100));
        if (error) throw error;
      }
      const catchAll = existing.find((c) => c.code === "CANVAS" && c.canvas_course_id === "calendar");
      if (catchAll) {
        const { count } = await admin
          .from("items")
          .select("id", { count: "exact", head: true })
          .eq("course_id", catchAll.id);
        if (count === 0) await admin.from("courses").delete().eq("id", catchAll.id).eq("user_id", userId);
      }
    }
    await admin
      .from("settings")
      .update({
        canvas_last_sync_at: new Date().toISOString(),
        canvas_last_sync_status: "success",
        canvas_last_sync_error: null,
        canvas_last_sync_count: items.length,
      })
      .eq("user_id", userId);
    return { courses: canvasCourses.length, items: items.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Canvas sync failed.";
    await admin
      .from("settings")
      .update({ canvas_last_sync_status: "error", canvas_last_sync_error: message.slice(0, 1_000) })
      .eq("user_id", userId);
    throw error;
  }
}
