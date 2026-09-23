"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { nextHue } from "@/lib/course";
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
  if (!code || code.length > 40) return { error: "Give the course a short code, like CHEM 1210." };
  if (name.length > 120) return { error: "That name is too long." };
  const supabase = await createClient();
  const { error } = await supabase.from("courses").update({ code, name }).eq("id", text(form, "id"));
  return done(error, "save the course");
}

// Also deletes the course's items (on delete cascade), so the UI confirms first.
export async function deleteCourse(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("courses").delete().eq("id", id);
  return done(error, "delete the course");
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
