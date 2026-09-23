"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { HUES, nextHue } from "@/lib/course";
import type { Item } from "@/lib/progress";
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

export async function deleteMeeting(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("class_meetings").delete().eq("id", id);
  return done(error, "remove the class time");
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
export async function saveChat(id: string, title: string, focus: string, messages: unknown[]): Promise<Result> {
  if (!UUID.test(id) || !Array.isArray(messages)) return { error: "Bad chat." };
  const kept = messages.slice(-100);
  if (JSON.stringify(kept).length > 400_000) return { error: "That chat is too long to save." };
  const supabase = await createClient();
  const { error } = await supabase.from("chats").upsert({
    id,
    title: title.slice(0, 120),
    focus: focus.slice(0, 40),
    messages: kept,
    updated_at: new Date().toISOString(),
  });
  return error ? { error: `Couldn't save the chat. ${error.message}` } : {};
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
  const { data, error } = await supabase.from("chats").select("id, focus, messages").eq("id", id).maybeSingle();
  if (error || !data) return { error: "Couldn't open that chat." };
  return { chat: data as { id: string; focus: string; messages: unknown[] } };
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
}): Promise<Result> {
  const name = m.name?.trim().slice(0, 200);
  if (!UUID.test(m.course) || !["file", "link", "note"].includes(m.kind) || !name) return { error: "Give it a name." };
  if (m.kind === "link" && !/^https?:\/\/\S+$/i.test(m.url ?? "")) return { error: "That doesn't look like a link." };
  if (m.kind === "note" && !m.body?.trim()) return { error: "The note is empty." };
  if (m.kind === "file" && !m.path) return { error: "The upload didn't finish." };
  const supabase = await createClient();
  const { error } = await supabase.from("materials").insert({
    course_id: m.course,
    kind: m.kind,
    name,
    path: m.kind === "file" ? m.path : null,
    url: m.kind === "link" ? m.url : null,
    body: m.kind === "note" ? m.body!.slice(0, 100_000) : null,
    size: m.size ?? null,
    mime: m.mime ?? null,
  });
  return done(error, "add it");
}

export async function deleteMaterial(id: string): Promise<Result> {
  const supabase = await createClient();
  const { data } = await supabase.from("materials").select("path").eq("id", id).maybeSingle();
  if (data?.path) await supabase.storage.from("materials").remove([data.path]);
  const { error } = await supabase.from("materials").delete().eq("id", id);
  return done(error, "delete it");
}
