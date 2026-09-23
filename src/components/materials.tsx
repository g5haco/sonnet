"use client";

import { FileText, FileUp, Image as ImageIcon, Link2, Presentation, StickyNote, Trash2 } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { addMaterial, deleteMaterial } from "@/app/actions";
import { Block } from "@/components/block";
import { field, FormError } from "@/components/create-forms";
import { Button } from "@/components/ui/button";
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

// A course's materials: drop files in, or add a link or a pasted note. Later (Phase 6) the assistant reads them.
export function Materials({ course, materials }: { course: { id: string; code: string }; materials: Material[] }) {
  const [uploading, setUploading] = useState<string[]>([]);
  const [over, setOver] = useState(false);
  const [adding, setAdding] = useState<"link" | "note" | null>(null);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  const upload = async (files: File[]) => {
    const supabase = createClient();
    const { data } = await supabase.auth.getClaims();
    const uid = data?.claims.sub;
    if (!uid) return toast.error("Sign in again to upload.");
    for (const file of files) {
      if (file.size > MAX) {
        toast.error(`${file.name} is over 50 MB.`);
        continue;
      }
      setUploading((u) => [...u, file.name]);
      // Storage keys: stick to safe characters; the real name is kept in the row.
      const path = `${uid}/${course.id}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]+/g, "_").slice(-80)}`;
      const put = await supabase.storage.from("materials").upload(path, file, { contentType: file.type });
      const r = put.error
        ? { error: `Couldn't upload ${file.name}. ${put.error.message}` }
        : await addMaterial({
            course: course.id,
            kind: "file",
            name: file.name,
            path,
            size: file.size,
            mime: file.type,
          });
      if (r.error) toast.error(r.error);
      setUploading((u) => u.filter((n) => n !== file.name));
    }
  };

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

  const save = (form: FormData) =>
    start(async () => {
      const url = String(form.get("url") ?? "").trim();
      const body = String(form.get("body") ?? "");
      // Unnamed: a link is called by its site, a note by its first line.
      const fallback = adding === "note" ? body.trim().split("\n")[0].slice(0, 80) : (URL.parse(url)?.hostname ?? "");
      const r = await addMaterial({
        course: course.id,
        kind: adding!,
        name: String(form.get("name") ?? "").trim() || fallback,
        url,
        body,
      });
      setError(r.error ?? "");
      if (!r.error) setAdding(null);
    });

  return (
    <Block title="Materials" aside={materials.length ? `${materials.length} saved` : undefined}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          upload([...e.dataTransfer.files]);
        }}
        className={cn(
          "flex flex-col items-center gap-1.5 rounded-xl border border-dashed px-4 py-6 text-center transition-colors",
          over ? "border-foreground/50 bg-accent/50" : "border-foreground/20",
        )}
      >
        <FileUp className="size-5 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm">
          Drop files here, or{" "}
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="font-medium underline underline-offset-4 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            browse
          </button>
        </p>
        <p className="text-xs text-muted-foreground">
          Syllabus, slides, notes, photos: PDF, Word, PowerPoint, images, up to 50 MB
        </p>
        <input
          ref={input}
          type="file"
          multiple
          accept={ACCEPT}
          className="sr-only"
          onChange={(e) => {
            upload([...(e.target.files ?? [])]);
            e.target.value = "";
          }}
        />
      </div>

      <div className="mt-3 flex gap-2">
        {(["link", "note"] as const).map((k) => (
          <Button
            key={k}
            type="button"
            variant={adding === k ? "secondary" : "ghost"}
            size="sm"
            onClick={() => {
              setError("");
              setAdding(adding === k ? null : k);
            }}
            className="rounded-full"
          >
            {k === "link" ? <Link2 /> : <StickyNote />} {k === "link" ? "Add a link" : "Add a note"}
          </Button>
        ))}
      </div>
      {adding && (
        <form action={save} className="mt-2 flex flex-col gap-2">
          {adding === "link" ? (
            <input name="url" type="url" required placeholder="https://…" aria-label="Link" className={field} />
          ) : (
            <textarea
              name="body"
              required
              rows={5}
              placeholder="Paste notes, a syllabus section, an assignment prompt…"
              aria-label="Note"
              className="w-full rounded-2xl bg-secondary px-4 py-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
            />
          )}
          <input name="name" maxLength={200} placeholder="Name (optional)" aria-label="Name" className={field} />
          <div className="flex gap-2">
            <Button type="submit" disabled={pending} className="h-10 rounded-full px-5">
              {pending ? "Saving…" : "Save"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setAdding(null)} className="h-10 rounded-full px-4">
              Cancel
            </Button>
          </div>
          <FormError text={error} />
        </form>
      )}

      {(materials.length > 0 || uploading.length > 0) && (
        <ul className="-mx-2 mt-3">
          {uploading.map((n) => (
            <li
              key={n}
              className="flex min-h-11 items-center gap-3 px-2 text-sm text-muted-foreground"
              aria-busy="true"
            >
              <FileUp className="size-4 animate-pulse" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">{n}</span>
              <span className="font-mono text-xs">uploading…</span>
            </li>
          ))}
          {materials.map((m) => (
            <MaterialRow key={m.id} m={m} onOpen={() => open(m)} />
          ))}
        </ul>
      )}
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
