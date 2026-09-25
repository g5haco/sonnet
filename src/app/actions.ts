"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  canvasBaseUrl,
  canvasFeedUrl,
  canvasPages,
  encryptCanvasToken,
  syncCanvasUser,
  type CanvasCourse,
} from "@/lib/canvas";
import { complete, MODELS } from "@/lib/ai";
import { extractText, visionText } from "@/lib/extract";
import { parseSyllabusItems, sameWork, summaryPrompt, syllabusPrompt, weekLines, type Draft } from "@/lib/syllabus";
import { HUES, nextHue } from "@/lib/course";
import { readLayout } from "@/lib/home";
import type { Item } from "@/lib/progress";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Every action returns an error message for the UI, or nothing on success.
// Row-level security scopes all queries to the signed-in user.
type Result = { error?: string };

const KINDS: Item["kind"][] = ["assignment", "exam", "quiz", "reading"];
const text = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

async function done(error: { message: string } | null, what: string): Promise<Result> {
  if (error) return { error: `Couldn't ${what}. ${error.message}` };
  revalidatePath("/", "layout"); // the shell (Create dialogs) reads courses too
  return {};
}

export async function saveTerm(form: FormData): Promise<Result> {
  const start = text(form, "start");
  const weeks = Number(form.get("weeks"));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) return { error: "Pick the date your semester started." };
  if (!Number.isInteger(weeks) || weeks < 1 || weeks > 30) return { error: "Weeks should be between 1 and 30." };
  const supabase = await createClient();
  const { error } = await supabase.from("settings").upsert({ term_start: start, term_weeks: weeks });
  return done(error, "save your semester");
}

export async function createCourse(form: FormData): Promise<Result> {
  const code = text(form, "code");
  const name = text(form, "name");
  if (!code || code.length > 40) return { error: "Give the course a short code, like CHEM 1210." };
  if (name.length > 120) return { error: "That name is too long." };
  const supabase = await createClient();
  const { data: taken, error: readError } = await supabase.from("courses").select("hue");
  if (readError) return done(readError, "add the course");
  const { error } = await supabase.from("courses").insert({ code, name, hue: nextHue(taken.map((c) => c.hue)) });
  return done(error, "add the course");
}

export async function updateCourse(form: FormData): Promise<Result> {
  const code = text(form, "code");
  const name = text(form, "name");
  const hue = Number(form.get("hue"));
  if (!code || code.length > 40) return { error: "Give the course a short code, like CHEM 1210." };
  if (name.length > 120) return { error: "That name is too long." };
  if (form.has("hue") && !HUES.includes(hue)) return { error: "Pick one of the course colors." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("courses")
    .update(form.has("hue") ? { code, name, hue } : { code, name })
    .eq("id", text(form, "id"));
  return done(error, "save the course");
}

// Also deletes the course's items (on delete cascade), so the UI confirms first.
export async function deleteCourse(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("courses").delete().eq("id", id);
  return done(error, "delete the course");
}

export async function createMeeting(form: FormData): Promise<Result> {
  const weekdays = [...new Set(form.getAll("day").map(Number))].filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
  const starts = text(form, "starts");
  const ends = text(form, "ends");
  const location = text(form, "location");
  if (!weekdays.length) return { error: "Pick at least one day." };
  if (!/^\d{2}:\d{2}$/.test(starts) || !/^\d{2}:\d{2}$/.test(ends)) return { error: "Pick a start and end time." };
  if (ends <= starts) return { error: "Class should end after it starts." };
  if (location.length > 80) return { error: "That room name is too long." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("class_meetings")
    .insert({ course_id: text(form, "course"), weekdays, starts, ends, location });
  return done(error, "add the class time");
}

// A changed class time the student confirmed (e.g. "my POLS class is in B102"). Validated here, not trusted.
export async function updateMeeting(
  id: string,
  m: { weekdays: number[]; starts: string; ends: string; location: string },
): Promise<Result> {
  const weekdays = [...new Set(m.weekdays)].filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
  if (!weekdays.length) return { error: "Pick at least one day." };
  if (!/^\d{2}:\d{2}$/.test(m.starts) || !/^\d{2}:\d{2}$/.test(m.ends)) return { error: "Pick a start and end time." };
  if (m.ends <= m.starts) return { error: "Class should end after it starts." };
  if (m.location.length > 80) return { error: "That room name is too long." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("class_meetings")
    .update({ weekdays, starts: m.starts, ends: m.ends, location: m.location.trim() })
    .eq("id", id);
  return done(error, "save the class time");
}

// A day off for weekly classes ("no class next Monday"): the date joins (off) or leaves (undo) each
// class time's skip_dates.
export async function setClassDayOff(ids: string[], date: string, off: boolean): Promise<Result> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Pick a day." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("class_meetings").select("*").in("id", ids);
  if (error) return done(error, "find those class times");
  if (!data?.length) return { error: "Those class times are gone." };
  for (const m of data) {
    const rest = ((m.skip_dates ?? []) as string[]).filter((d) => d !== date);
    const skip = off ? [...rest, date].sort() : rest;
    const { error: saveError } = await supabase.from("class_meetings").update({ skip_dates: skip }).eq("id", m.id);
    if (saveError) return done(saveError, off ? "remove that day" : "put that day back");
  }
  return done(null, "");
}

export async function deleteMeeting(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("class_meetings").delete().eq("id", id);
  return done(error, "remove the class time");
}

// Home's widget layout.
export async function saveHomeLayout(raw: unknown): Promise<Result> {
  const layout = readLayout(raw);
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const { error } = await supabase
    .from("settings")
    .update({ home_layout: layout })
    .eq("user_id", data?.claims.sub ?? "");
  return done(error, "save your Home layout");
}

// A fresh secret for the Google Calendar feed; the old URL stops working (e.g. if it was shared by accident).
export async function resetFeed(): Promise<Result> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const { error } = await supabase
    .from("settings")
    .update({ feed_token: crypto.randomUUID() })
    .eq("user_id", data?.claims.sub ?? "");
  return done(error, "make a new link");
}

// ---- Canvas ----

export async function saveCanvasConnection(form: FormData): Promise<Result> {
  const base = canvasBaseUrl(text(form, "baseUrl"));
  const feedInput = text(form, "icsUrl");
  const feed = feedInput ? canvasFeedUrl(feedInput) : null;
  const token = text(form, "token");
  if (!base) return { error: "Use your school's full HTTPS Canvas address." };
  if (feedInput && !feed) return { error: "That Canvas calendar link doesn't look right." };

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) return { error: "Sign in again." };

  try {
    const admin = createAdminClient();
    const { data: current, error: settingsError } = await admin
      .from("settings")
      .select("canvas_token_connected")
      .eq("user_id", userId)
      .maybeSingle();
    if (settingsError) throw settingsError;
    // Canvas settings live on the semester row (new account, or after Reset all data).
    if (!current) return { error: "Set your semester dates first (Settings → Semester), then connect Canvas." };
    if (!token && !feed && !current?.canvas_token_connected)
      return { error: "Add an access token, a calendar link, or both." };
    if (token) {
      await canvasPages<CanvasCourse>(
        `${base}/api/v1/courses?enrollment_type=student&state[]=available&per_page=1`,
        token,
      );
      const { error } = await admin.from("canvas_connections").upsert({
        user_id: userId,
        token_encrypted: encryptCanvasToken(token),
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
    }
    const { error } = await admin
      .from("settings")
      .update({
        canvas_base_url: base,
        canvas_ics_url: feed,
        canvas_token_connected: Boolean(token || current?.canvas_token_connected),
        canvas_last_sync_status: "idle",
        canvas_last_sync_error: null,
      })
      .eq("user_id", userId);
    if (error) throw error;
    revalidatePath("/", "layout");
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Couldn't save the Canvas connection." };
  }
}

export async function syncCanvasNow(): Promise<Result & { count?: number }> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) return { error: "Sign in again." };
  try {
    const result = await syncCanvasUser(createAdminClient(), userId);
    revalidatePath("/", "layout");
    return { count: result.items };
  } catch (error) {
    revalidatePath("/", "layout");
    return { error: error instanceof Error ? error.message : "Canvas sync failed." };
  }
}

export async function disconnectCanvas(): Promise<Result> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) return { error: "Sign in again." };
  try {
    const admin = createAdminClient();
    const { error: secretError } = await admin.from("canvas_connections").delete().eq("user_id", userId);
    if (secretError) throw secretError;
    const { error } = await admin
      .from("settings")
      .update({
        canvas_base_url: null,
        canvas_ics_url: null,
        canvas_token_connected: false,
        canvas_last_sync_status: "idle",
        canvas_last_sync_error: null,
      })
      .eq("user_id", userId);
    return done(error, "disconnect Canvas");
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Couldn't disconnect Canvas." };
  }
}

// Settings → Data: wipes the academic data but keeps the account (login, name). Canvas is disconnected
// first, or the daily sync would import everything again. Deleting courses cascades to their items, class
// times and materials; deleting the settings row clears the semester, the feed token and Canvas sync status.
export async function resetAllData(confirm: string): Promise<Result> {
  if (confirm !== "RESET") return { error: "Type RESET to confirm." };
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) return { error: "Sign in again." };

  const canvas = await disconnectCanvas();
  if (canvas.error) return canvas;

  // Uploads live at <user id>/<course id>/<file>; storage policies only reach the user's own folder.
  // ponytail: one page (1000) per folder; paginate if anyone ever uploads more to a single course.
  const bucket = supabase.storage.from("materials");
  const { data: top, error: listError } = await bucket.list(userId, { limit: 1000 });
  if (listError) return { error: `Couldn't reset your files. ${listError.message}` };
  const paths: string[] = [];
  for (const entry of top ?? []) {
    if (entry.id)
      paths.push(`${userId}/${entry.name}`); // a file (folders have no id)
    else {
      const { data: files } = await bucket.list(`${userId}/${entry.name}`, { limit: 1000 });
      paths.push(...(files ?? []).map((f) => `${userId}/${entry.name}/${f.name}`));
    }
  }
  if (paths.length) {
    const { error } = await bucket.remove(paths);
    if (error) return { error: `Couldn't reset your files. ${error.message}` };
  }

  for (const table of ["courses", "chats", "settings"] as const) {
    const { error } = await supabase.from(table).delete().eq("user_id", userId);
    if (error) return { error: `Couldn't reset your ${table}. ${error.message}` };
  }
  revalidatePath("/", "layout");
  return {};
}

// Stored on the account (auth user metadata), so it needs no table. Refreshing the session puts it in
// the token right away, which is where pages read it.
export async function saveName(form: FormData): Promise<Result> {
  const name = text(form, "name").slice(0, 40);
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ data: { name } });
  if (error) return { error: `Couldn't save your name. ${error.message}` };
  await supabase.auth.refreshSession();
  revalidatePath("/", "layout");
  return {};
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function createItem(form: FormData): Promise<Result> {
  const title = text(form, "title");
  const kind = text(form, "kind") as Item["kind"];
  const due = text(form, "due"); // ISO string; the browser converts from local time
  if (!title || title.length > 200) return { error: "Give it a title." };
  if (!KINDS.includes(kind)) return { error: "Pick what kind of work this is." };
  if (Number.isNaN(Date.parse(due))) return { error: "Pick a due date." };
  const supabase = await createClient();
  const { error } = await supabase.from("items").insert({ title, kind, due, course_id: text(form, "course") });
  return done(error, "save it");
}

export async function deleteItem(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("items").delete().eq("id", id);
  return done(error, "delete it");
}

// Assistant proposals the student confirmed (rename, re-date, check off). Validated here, not trusted.
export async function updateItem(id: string, patch: { title?: string; due?: string; done?: boolean }): Promise<Result> {
  const row: { title?: string; due?: string; done_at?: string | null } = {};
  if (patch.title !== undefined) {
    const title = patch.title.trim();
    if (!title || title.length > 200) return { error: "Give it a title." };
    row.title = title;
  }
  if (patch.due !== undefined) {
    if (Number.isNaN(Date.parse(patch.due))) return { error: "That due date doesn't look right." };
    row.due = new Date(patch.due).toISOString();
  }
  if (patch.done !== undefined) row.done_at = patch.done ? new Date().toISOString() : null;
  if (!Object.keys(row).length) return { error: "Nothing to change." };
  const supabase = await createClient();
  const { error } = await supabase.from("items").update(row).eq("id", id);
  return done(error, "save the change");
}

export async function setDone(id: string, isDone: boolean): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("items")
    .update({ done_at: isDone ? new Date().toISOString() : null })
    .eq("id", id);
  return done(error, "save that check-off");
}

// ---- Chat history ----

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Saved after each answer (and each yes/no on a proposal). Chats aren't shown elsewhere, so no revalidate.
// item: the work item an "Ask about this" chat is about (null once its chip is removed).
export async function saveChat(
  id: string,
  title: string,
  focus: string,
  messages: unknown[],
  item: string | null = null,
): Promise<Result> {
  if (!UUID.test(id) || !Array.isArray(messages) || (item !== null && !UUID.test(item))) return { error: "Bad chat." };
  const kept = messages.slice(-100);
  if (JSON.stringify(kept).length > 400_000) return { error: "That chat is too long to save." };
  const supabase = await createClient();
  const row = { id, title: title.slice(0, 120), focus: focus.slice(0, 40), messages: kept, updated_at: new Date().toISOString() };
  let { error } = await supabase.from("chats").upsert({ ...row, item_id: item });
  // Before migration 0013 there's no item_id column: save the chat without its assignment link.
  if (error && ["PGRST204", "42703"].includes(error.code)) ({ error } = await supabase.from("chats").upsert(row));
  return error ? { error: `Couldn't save the chat. ${error.message}` } : {};
}

// The newest chat about this work item, so "Ask about this" returns to it. None before migration 0013.
export async function itemChat(item: string) {
  if (!UUID.test(item)) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("chats")
    .select("id")
    .eq("item_id", item)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.id as string | undefined) ?? null;
}

export async function listChats() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chats")
    .select("id, title, focus, updated_at")
    .order("updated_at", { ascending: false })
    .limit(40);
  return error ? { error: `Couldn't load your chats. ${error.message}`, chats: [] } : { chats: data };
}

export async function loadChat(id: string) {
  if (!UUID.test(id)) return { error: "Bad chat." };
  const supabase = await createClient();
  // "*": item_id exists only after migration 0013
  const { data, error } = await supabase.from("chats").select("*").eq("id", id).maybeSingle();
  if (error || !data) return { error: "Couldn't open that chat." };
  return { chat: data as { id: string; focus: string; messages: unknown[]; item_id?: string | null } };
}

export async function deleteChat(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("chats").delete().eq("id", id);
  return error ? { error: `Couldn't delete the chat. ${error.message}` } : {};
}

// ---- Course materials ----
// Files go browser -> Storage directly (server actions have a 1 MB body limit); this records them.

export async function addMaterial(m: {
  course: string;
  kind: "file" | "link" | "note";
  name: string;
  path?: string;
  url?: string;
  body?: string;
  size?: number;
  mime?: string;
}): Promise<Result & { id?: string; readable?: boolean }> {
  const name = m.name?.trim().slice(0, 200);
  if (!UUID.test(m.course) || !["file", "link", "note"].includes(m.kind) || !name) return { error: "Give it a name." };
  if (m.kind === "link" && !/^https?:\/\/\S+$/i.test(m.url ?? "")) return { error: "That doesn't look like a link." };
  if (m.kind === "note" && !m.body?.trim()) return { error: "The note is empty." };
  if (m.kind === "file" && !m.path) return { error: "The upload didn't finish." };
  const supabase = await createClient();
  let text: string | null = null;
  // Read the file back (the user's own storage policies apply) so the assistant can use its text.
  // ponytail: extraction runs inline and skips files over 15 MB; move to a background job if uploads get slow.
  if (m.kind === "file" && (m.size ?? 0) <= 15_000_000) {
    const { data } = await supabase.storage.from("materials").download(m.path!);
    if (data) {
      const bytes = new Uint8Array(await data.arrayBuffer());
      const mime = m.mime || data.type;
      text = (await extractText(bytes, mime).catch(() => null)) ?? (await visionText(bytes, mime, name));
    }
  }
  const { data: row, error } = await supabase
    .from("materials")
    .insert({
      course_id: m.course,
      kind: m.kind,
      name,
      path: m.kind === "file" ? m.path : null,
      url: m.kind === "link" ? m.url : null,
      body: m.kind === "note" ? m.body!.slice(0, 100_000) : text,
      size: m.size ?? null,
      mime: m.mime ?? null,
    })
    .select("id")
    .single();
  const r = await done(error, "add it");
  return r.error ? r : { id: row!.id, readable: m.kind === "note" || !!text };
}

// ---- Syllabus import ----
// Two steps with the student in between: read (the model lists dated work, nothing saved), then import
// only what they approved on the review card.

export async function readSyllabus(
  materialId: string,
  timeZone: string,
): Promise<Result & { items?: Draft[]; course?: string; known?: number }> {
  if (!UUID.test(materialId)) return { error: "That file isn't available." };
  const supabase = await createClient();
  const [{ data: m }, { data: term }] = await Promise.all([
    supabase.from("materials").select("body, course_id, courses(code)").eq("id", materialId).maybeSingle(),
    supabase.from("settings").select("term_start, term_weeks").maybeSingle(),
  ]);
  if (!m) return { error: "That file isn't available." };
  if (!m.body?.trim())
    return { error: "No text could be read from this file. Word and PowerPoint files aren't supported yet; upload a PDF or photos instead." };
  const course = (m.courses as unknown as { code: string } | null)?.code ?? "this course";
  let today: string;
  try {
    today = new Date().toLocaleDateString("en-CA", { timeZone }); // YYYY-MM-DD
  } catch {
    today = new Date().toISOString().slice(0, 10);
  }
  const reply = await askSyllabus(syllabusPrompt(course, today, weekLines(term?.term_start, term?.term_weeks)), m.body);
  if ("error" in reply) return reply;
  const items = parseSyllabusItems(reply.text, term?.term_start);
  if (!items.length) return { error: "No dated assignments or exams were found in this file." };
  // Only what the course doesn't have yet: with Canvas connected that's usually little or nothing.
  const { data: existing } = await supabase.from("items").select("title, due").eq("course_id", m.course_id);
  const fresh = items.filter(
    (d) => !(existing ?? []).some((e) => sameWork({ title: d.title, due: d.date && `${d.date}T12:00:00Z` }, e)),
  );
  return { items: fresh, course, known: items.length - fresh.length };
}

// One non-streamed answer about a syllabus (the paid default model, free ones as fallback).
async function askSyllabus(system: string, body: string): Promise<{ text: string } | { error: string }> {
  if (!process.env.AI_API_KEY) return { error: "The assistant isn't set up yet: AI_API_KEY is missing." };
  const ask = () =>
    complete({
      ...(MODELS.length > 1 ? { models: MODELS } : { model: MODELS[0] }),
      reasoning: { enabled: false },
      temperature: 0,
      max_tokens: 6000,
      messages: [
        { role: "system", content: system },
        // ponytail: first 40k characters; a longer syllabus would need splitting by section
        { role: "user", content: body.slice(0, 40_000) },
      ],
    });
  // Models fail now and then: one quiet retry before giving up.
  const text = (await ask()) ?? (await ask());
  return text ? { text } : { error: "The AI couldn't read it just now. Try again in a minute." };
}

// The syllabus as a one-page digest (grading, policies, key dates…), kept as the course's "Syllabus summary"
// note: visible and editable on the course page. A new summary replaces the old one.
export async function summarizeSyllabus(materialId: string): Promise<Result & { id?: string; body?: string }> {
  if (!UUID.test(materialId)) return { error: "That file isn't available." };
  const supabase = await createClient();
  const { data: m } = await supabase
    .from("materials")
    .select("body, course_id, courses(code)")
    .eq("id", materialId)
    .maybeSingle();
  if (!m) return { error: "That file isn't available." };
  if (!m.body?.trim())
    return { error: "No text could be read from this file. Word and PowerPoint files aren't supported yet; upload a PDF or photos instead." };
  const course = (m.courses as unknown as { code: string } | null)?.code ?? "this course";
  const reply = await askSyllabus(summaryPrompt(course), m.body);
  if ("error" in reply) return reply;
  const body = reply.text.replace(/^```(?:markdown)?\s*|\s*```$/g, "").slice(0, 20_000);
  // Save the new one first, then drop older ones: a failed save never leaves the course without a summary.
  const { data: note, error } = await supabase
    .from("materials")
    .insert({ course_id: m.course_id, kind: "note", name: "Syllabus summary", body })
    .select("id")
    .single();
  if (error) return { error: `Couldn't save the summary. ${error.message}` };
  await supabase
    .from("materials")
    .delete()
    .eq("course_id", m.course_id)
    .eq("kind", "note")
    .eq("name", "Syllabus summary")
    .neq("id", note.id);
  revalidatePath("/", "layout");
  return { id: note.id, body };
}

export async function importSyllabus(
  materialId: string,
  rows: { title: string; kind: string; due: string }[],
): Promise<Result & { added?: number; skipped?: number }> {
  if (!UUID.test(materialId) || !Array.isArray(rows) || rows.length > 100) return { error: "Nothing to import." };
  const clean = rows
    .map((r) => ({
      title: String(r.title ?? "")
        .trim()
        .slice(0, 200),
      kind: r.kind,
      due: new Date(r.due),
    }))
    .filter((r) => r.title && ["assignment", "exam", "quiz", "reading"].includes(r.kind) && !isNaN(r.due.valueOf()));
  if (!clean.length) return { error: "Give each item a title and a date." };
  const supabase = await createClient();
  const { data: m } = await supabase.from("materials").select("course_id").eq("id", materialId).maybeSingle();
  if (!m) return { error: "That file isn't available." };
  // Skip what the course already has (e.g. from Canvas, whose titles run longer).
  const { data: existing } = await supabase.from("items").select("title, due").eq("course_id", m.course_id);
  const fresh = clean.filter(
    (r) => !(existing ?? []).some((e) => sameWork({ title: r.title, due: r.due.toISOString() }, e)),
  );
  if (fresh.length) {
    const { error } = await supabase.from("items").upsert(
      fresh.map((r) => ({
        course_id: m.course_id,
        kind: r.kind,
        title: r.title,
        due: r.due.toISOString(),
        source: "syllabus",
        external_id: `${materialId}:${r.title.toLowerCase()}:${r.due.toISOString().slice(0, 10)}`.slice(0, 300),
      })),
      { onConflict: "user_id,source,external_id", ignoreDuplicates: true },
    );
    if (error) return { error: `Couldn't import: ${error.message}` };
  }
  revalidatePath("/", "layout");
  return { added: fresh.length, skipped: clean.length - fresh.length };
}

export async function deleteMaterial(id: string): Promise<Result> {
  const supabase = await createClient();
  const { data } = await supabase.from("materials").select("path").eq("id", id).maybeSingle();
  if (data?.path) await supabase.storage.from("materials").remove([data.path]);
  const { error } = await supabase.from("materials").delete().eq("id", id);
  return done(error, "delete it");
}

// ---- Focus timer ----
// One finished (or stopped) focus session; the heatmap and streak on Home read these.
export async function logFocus(s: { startedAt: string; minutes: number }): Promise<Result> {
  const started = Date.parse(s.startedAt);
  if (!Number.isInteger(s.minutes) || s.minutes < 1 || s.minutes > 240) return { error: "That session's length is off." };
  if (!Number.isFinite(started) || started > Date.now() + 60_000 || started < Date.now() - 2 * 864e5)
    return { error: "That session's time is off." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("focus_sessions")
    .insert({ started_at: new Date(started).toISOString(), minutes: s.minutes });
  return done(error, "save the session");
}
