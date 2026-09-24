"use client";

import {
  Check,
  FileText,
  FileType,
  FileUp,
  Image as ImageIcon,
  Link2,
  Presentation,
  StickyNote,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { addMaterial, deleteMaterial } from "@/app/actions";
import { useAssistant, useCreate } from "@/components/app-shell";
import { Block } from "@/components/block";
import { field, FormError } from "@/components/create-forms";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { courseColor } from "@/lib/course";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export type Material = {
  id: string;
  kind: "file" | "link" | "note";
  name: string;
  path: string | null;
  url: string | null;
  body: string | null;
  size: number | null;
  mime: string | null;
  created_at: string;
};

const MAX = 50 * 1024 * 1024; // matches the bucket's limit (migration 0004)
const ACCEPT = ".pdf,.doc,.docx,.ppt,.pptx,.txt,.md,image/*";

function Glyph({ m }: { m: Material }) {
  const c = "size-4 shrink-0 text-muted-foreground";
  if (m.kind === "link") return <Link2 className={c} aria-hidden="true" />;
  if (m.kind === "note") return <StickyNote className={c} aria-hidden="true" />;
  if (m.mime?.startsWith("image/")) return <ImageIcon className={c} aria-hidden="true" />;
  if (m.mime?.includes("presentation") || m.mime?.includes("powerpoint"))
    return <Presentation className={c} aria-hidden="true" />;
  return <FileText className={c} aria-hidden="true" />;
}
const megabytes = (n: number) =>
  n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1048576).toFixed(1)} MB`;

type Sent = { key: string; name: string; state: "uploading" | "done" | "error" };

// Files go browser -> Storage (into the student's own folder), then a row records them. One at a time,
// so each shows its own state.
function useUpload() {
  const [sent, setSent] = useState<Sent[]>([]);
  const upload = async (course: string, files: File[]) => {
    const supabase = createClient();
    const { data } = await supabase.auth.getClaims();
    const uid = data?.claims.sub;
    if (!uid) return void toast.error("Sign in again to upload.");
    for (const file of files) {
      const key = crypto.randomUUID();
      const mark = (state: Sent["state"]) => setSent((s) => s.map((x) => (x.key === key ? { ...x, state } : x)));
      setSent((s) => [...s, { key, name: file.name, state: "uploading" }]);
      if (file.size > MAX) {
        mark("error");
        toast.error(`${file.name} is over 50 MB.`);
        continue;
      }
      // Storage keys: stick to safe characters; the real name is kept in the row.
      const path = `${uid}/${course}/${key}-${file.name.replace(/[^\w.-]+/g, "_").slice(-80)}`;
      const put = await supabase.storage.from("materials").upload(path, file, { contentType: file.type });
      const r = put.error
        ? { error: `Couldn't upload ${file.name}. ${put.error.message}` }
        : await addMaterial({ course, kind: "file", name: file.name, path, size: file.size, mime: file.type });
      mark(r.error ? "error" : "done");
      if (r.error) toast.error(r.error);
    }
  };
  return { sent, upload };
}

const TILES: { label: string; icon: typeof FileText; accept?: string; mode?: "link" | "note" }[] = [
  { label: "PDF", icon: FileText, accept: ".pdf" },
  { label: "PowerPoint", icon: Presentation, accept: ".ppt,.pptx" },
  { label: "Word", icon: FileType, accept: ".doc,.docx" },
  { label: "Images", icon: ImageIcon, accept: "image/*" },
  { label: "Link", icon: Link2, mode: "link" },
  { label: "Note", icon: StickyNote, mode: "note" },
];

// The uploader, floating over whatever page you're on: pick the course, then drop anything from class, pick a
// kind of file, or add a link or pasted notes.
export function UploadWindow({ open, course, onClose }: { open: boolean; course?: string; onClose: () => void }) {
  const { courses } = useAssistant();
  const [pick, setPick] = useState(course ?? courses[0]?.id ?? "");
  const [over, setOver] = useState(false);
  const [mode, setMode] = useState<"link" | "note" | null>(null);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const { sent, upload } = useUpload();
  const input = useRef<HTMLInputElement>(null);
  const chosen = courses.find((c) => c.id === pick);

  const browse = (accept: string) => {
    if (!input.current) return;
    input.current.accept = accept; // set before opening, so the picker filters to that kind
    input.current.click();
  };
  const save = (form: FormData) =>
    start(async () => {
      const url = String(form.get("url") ?? "").trim();
      const body = String(form.get("body") ?? "");
      // Unnamed: a link is called by its site, a note by its first line.
      const fallback = mode === "note" ? body.trim().split("\n")[0].slice(0, 80) : (URL.parse(url)?.hostname ?? "");
      const r = await addMaterial({
        course: pick,
        kind: mode!,
        name: String(form.get("name") ?? "").trim() || fallback,
        url,
        body,
      });
      setError(r.error ?? "");
      if (!r.error) {
        toast.success(`${mode === "link" ? "Link" : "Note"} added to ${chosen?.code}.`);
        setMode(null);
      }
    });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto rounded-2xl p-0 shadow-2xl sm:max-w-xl">
        <div className="p-5 sm:p-6">
          <DialogTitle className="text-lg font-medium tracking-tight">Add materials</DialogTitle>
          <DialogDescription className="mt-1">
            Syllabus, slides, readings, notes: they live on the course&apos;s page.
          </DialogDescription>

          {courses.length === 0 ? (
            <p className="mt-5 text-sm text-muted-foreground">Add a course first; materials hang off it.</p>
          ) : (
            <>
              <fieldset className="mt-5">
                <legend className="mb-2 text-sm font-medium">For</legend>
                <div className="flex flex-wrap gap-2">
                  {courses.map((c) => (
                    <label
                      key={c.id}
                      className="flex h-9 cursor-pointer items-center gap-2 rounded-full bg-secondary px-3 font-mono text-xs has-checked:ring-2 has-checked:ring-ring has-focus-visible:ring-2 has-focus-visible:ring-ring"
                    >
                      <input
                        type="radio"
                        name="upload-course"
                        value={c.id}
                        checked={pick === c.id}
                        onChange={() => setPick(c.id)}
                        className="sr-only"
                      />
                      <span className="size-2 rounded-full" style={{ background: courseColor(c.hue) }} />
                      {c.code}
                    </label>
                  ))}
                </div>
              </fieldset>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setOver(true);
                }}
                onDragLeave={() => setOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setOver(false);
                  upload(pick, [...e.dataTransfer.files]);
                }}
                className={cn(
                  "mt-5 rounded-2xl border border-dashed p-5 text-center transition-colors",
                  over ? "border-brand bg-brand/5" : "border-foreground/20",
                )}
              >
                {/* three file cards fanned out, the way papers land on a desk */}
                <div className="relative mx-auto h-14 w-28" aria-hidden="true">
                  {[FileText, Presentation, ImageIcon].map((Icon, i) => (
                    <span
                      key={i}
                      className="absolute top-0 left-1/2 grid h-14 w-11 place-items-center rounded-lg bg-secondary shadow-md ring-1 ring-border transition-transform duration-300 ease-out-quint"
                      style={{
                        transform: `translateX(calc(-50% + ${(i - 1) * (over ? 30 : 24)}px)) rotate(${(i - 1) * (over ? 12 : 8)}deg)`,
                        zIndex: i === 1 ? 2 : 1,
                      }}
                    >
                      <Icon className="size-5 text-muted-foreground" />
                    </span>
                  ))}
                </div>
                <p className="mt-4 text-base font-medium">Drop anything from class</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  or{" "}
                  <button
                    type="button"
                    onClick={() => browse(ACCEPT)}
                    className="font-medium text-foreground underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    browse your files
                  </button>{" "}
                  · up to 50 MB each
                </p>
                <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {TILES.map(({ label: text, icon: Icon, accept, mode: m }) => (
                    <button
                      key={text}
                      type="button"
                      aria-pressed={m ? mode === m : undefined}
                      onClick={() => (m ? setMode(mode === m ? null : m) : browse(accept!))}
                      className={cn(
                        "flex h-11 items-center gap-2.5 rounded-xl bg-secondary px-3 text-sm transition-[background-color,transform] hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]",
                        m && mode === m && "ring-2 ring-ring",
                      )}
                    >
                      <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
                      {text}
                    </button>
                  ))}
                </div>
                <input
                  ref={input}
                  type="file"
                  multiple
                  className="sr-only"
                  onChange={(e) => {
                    upload(pick, [...(e.target.files ?? [])]);
                    e.target.value = "";
                  }}
                />
              </div>

              {mode && (
                <form autoComplete="off" action={save} className="mt-4 flex flex-col gap-2">
                  {mode === "link" ? (
                    <input
                      name="url"
                      type="url"
                      required
                      autoFocus
                      placeholder="https://…"
                      aria-label="Link"
                      className={field}
                    />
                  ) : (
                    <textarea
                      name="body"
                      required
                      autoFocus
                      rows={5}
                      placeholder="Paste notes, a syllabus section, an assignment prompt…"
                      aria-label="Note"
                      className="w-full rounded-2xl bg-secondary px-4 py-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
                    />
                  )}
                  <input
                    name="name"
                    maxLength={200}
                    placeholder="Name (optional)"
                    aria-label="Name"
                    className={field}
                  />
                  <Button type="submit" disabled={pending} className="h-10 rounded-full px-5">
                    {pending ? "Saving…" : `Add ${mode === "link" ? "link" : "note"} to ${chosen?.code ?? "course"}`}
                  </Button>
                  <FormError text={error} />
                </form>
              )}

              {sent.length > 0 && (
                <ul className="mt-4 flex flex-col gap-1" aria-live="polite">
                  {sent.map((s) => (
                    <li key={s.key} className="flex items-center gap-3 rounded-lg bg-secondary px-3 py-2 text-sm">
                      {s.state === "done" ? (
                        <Check className="size-4 text-done" aria-hidden="true" />
                      ) : s.state === "error" ? (
                        <TriangleAlert className="size-4 text-destructive" aria-hidden="true" />
                      ) : (
                        <FileUp className="size-4 animate-pulse text-muted-foreground" aria-hidden="true" />
                      )}
                      <span className="min-w-0 flex-1 truncate">{s.name}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {s.state === "done" ? "added" : s.state === "error" ? "failed" : "uploading…"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
        <p className="border-t border-border px-5 py-3 text-xs text-muted-foreground sm:px-6">
          Next up: the assistant reads what you add here, for study guides and flashcards from your own slides.
        </p>
      </DialogContent>
    </Dialog>
  );
}

// A course's materials: the list, a way into the uploader, and drop-to-upload right onto the block.
export function Materials({ course, materials }: { course: { id: string; code: string }; materials: Material[] }) {
  const create = useCreate();
  const { sent, upload } = useUpload();
  const [over, setOver] = useState(false);
  const busy = sent.filter((s) => s.state === "uploading");

  const open = async (m: Material) => {
    if (!m.path) return;
    const tab = window.open("", "_blank"); // opened now, while the click still counts, so it isn't blocked
    const { data, error } = await createClient().storage.from("materials").createSignedUrl(m.path, 60);
    if (error || !data) {
      tab?.close();
      return toast.error("Couldn't open that file.");
    }
    if (tab) tab.location.href = data.signedUrl;
  };

  return (
    <Block
      title="Materials"
      aside={
        <button
          type="button"
          onClick={() => create("upload", undefined, course.id)}
          className="rounded-full hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          + upload
        </button>
      }
    >
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          upload(course.id, [...e.dataTransfer.files]);
        }}
        className={cn("-m-2 rounded-xl p-2 transition-colors", over && "bg-brand/5 ring-2 ring-brand")}
      >
        {materials.length === 0 && busy.length === 0 ? (
          <button
            type="button"
            onClick={() => create("upload", undefined, course.id)}
            className="flex w-full flex-col items-center gap-1.5 rounded-xl border border-dashed border-foreground/20 px-4 py-6 text-center transition-colors hover:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <FileUp className="size-5 text-muted-foreground" aria-hidden="true" />
            <span className="text-sm">Add the syllabus, slides or notes</span>
            <span className="text-xs text-muted-foreground">Drop files here, or open the uploader</span>
          </button>
        ) : (
          <ul className="-mx-2">
            {busy.map((s) => (
              <li
                key={s.key}
                className="flex min-h-11 items-center gap-3 px-2 text-sm text-muted-foreground"
                aria-busy="true"
              >
                <FileUp className="size-4 animate-pulse" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">{s.name}</span>
                <span className="font-mono text-xs">uploading…</span>
              </li>
            ))}
            {materials.map((m) => (
              <MaterialRow key={m.id} m={m} onOpen={() => open(m)} />
            ))}
          </ul>
        )}
      </div>
    </Block>
  );
}

function MaterialRow({ m, onOpen }: { m: Material; onOpen: () => void }) {
  const [removing, start] = useTransition();
  const [showNote, setShowNote] = useState(false);
  const meta = [
    m.size ? megabytes(m.size) : m.kind === "link" ? (URL.parse(m.url ?? "")?.hostname ?? "link") : m.kind,
    new Date(m.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
  ].join(" · ");
  const openIt = () => (m.kind === "note" ? setShowNote((s) => !s) : m.kind === "link" ? undefined : onOpen());

  return (
    <li className="group">
      <div className="flex items-center">
        {m.kind === "link" ? (
          <a
            href={m.url!}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-lg px-2 transition-colors hover:bg-accent/60"
          >
            <Glyph m={m} />
            <span className="min-w-0 flex-1 truncate text-sm">{m.name}</span>
            <span className="shrink-0 font-mono text-xs text-muted-foreground">{meta}</span>
          </a>
        ) : (
          <button
            type="button"
            onClick={openIt}
            aria-expanded={m.kind === "note" ? showNote : undefined}
            className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-lg px-2 text-left transition-colors hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Glyph m={m} />
            <span className="min-w-0 flex-1 truncate text-sm">{m.name}</span>
            <span className="shrink-0 font-mono text-xs text-muted-foreground">{meta}</span>
          </button>
        )}
        <button
          type="button"
          disabled={removing}
          onClick={() =>
            start(async () => {
              const r = await deleteMaterial(m.id);
              if (r.error) toast.error(r.error);
            })
          }
          aria-label={`Delete ${m.name}`}
          className="grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground transition-opacity hover:text-destructive focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
      {showNote && <p className="mx-2 mb-2 rounded-xl bg-secondary px-3 py-2 text-sm whitespace-pre-wrap">{m.body}</p>}
    </li>
  );
}
