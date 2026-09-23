"use server";

import { revalidatePath } from "next/cache";
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
  revalidatePath("/");
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

export async function setDone(id: string, isDone: boolean): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("items")
    .update({ done_at: isDone ? new Date().toISOString() : null })
    .eq("id", id);
  return done(error, "save that check-off");
}
