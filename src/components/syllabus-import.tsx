"use client";

import { CalendarPlus, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { importSyllabus, type readSyllabus } from "@/app/actions";
import { FormError } from "@/components/create-forms";
import { slow, useTasks } from "@/components/tasks";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { Draft, Kind } from "@/lib/syllabus";
import { cn } from "@/lib/utils";

type Row = Draft & { key: number; on: boolean };

// One reading per file per visit: closing the window mid-read and opening it again (or from the corner card)
// joins the same request instead of starting another free-model call. Cleared once the dates are added.
const readings = new Map<string, ReturnType<typeof readSyllabus>>();
const KINDS: Kind[] = ["assignment", "exam", "quiz", "reading"];
const cell =
  "h-9 min-w-0 rounded-lg bg-background px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

// Review before import: the model's reading of the syllabus, every row editable, nothing saved until
// "Add". Rows without a date (the syllabus was vague) stay unticked until the student gives them one.
export function SyllabusImport({
  material,
  courseId,
  onClose,
  sample,
}: {
  material: { id: string; name: string } | null;
  courseId?: string; // where the corner card leads back to
  onClose: () => void;
  sample?: { items: Draft[]; course: string }; // a finished reading, for local previews (no model call)
}) {
  return (
    <Dialog open={material !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden rounded-2xl p-0 shadow-2xl sm:max-w-3xl">
        {material && <Review key={material.id} material={material} courseId={courseId} onClose={onClose} sample={sample} />}
      </DialogContent>
    </Dialog>
  );
}

function Review({
  material,
  courseId,
  onClose,
  sample,
}: {
  material: { id: string; name: string };
  courseId?: string;
  onClose: () => void;
  sample?: { items: Draft[]; course: string };
}) {
  const toRows = (items: Draft[]) => items.map((d, key) => ({ ...d, key, on: d.date !== null }));
  const [rows, setRows] = useState<Row[] | null>(sample ? toRows(sample.items) : null);
  const [course, setCourse] = useState(sample?.course ?? "");
  const [known, setKnown] = useState(0); // dated items the course already has (e.g. from Canvas), left out
  const [error, setError] = useState("");
  const [reading, startRead] = useTransition();
  const [saving, startSave] = useTransition();

  const track = useTasks();
  const read = () =>
    startRead(async () => {
      setError("");
      let reading = readings.get(material.id);
      if (!reading) {
        reading = track(
          "Finding dates in the syllabus",
          () => slow("readSyllabus", material.id, Intl.DateTimeFormat().resolvedOptions().timeZone),
          (r) => ({
            note: `${r.items?.length ?? 0} found. Click to review.`,
            href: courseId && `/courses/${courseId}?dates=${material.id}`,
          }),
        );
        readings.set(material.id, reading);
      }
      const r = await reading;
      if (r.error) {
        readings.delete(material.id); // "Try again" makes a fresh request
        return setError(r.error);
      }
      setCourse(r.course ?? "");
      setKnown(r.known ?? 0);
      setRows(toRows(r.items ?? []));
    });
  // once, when the window opens
  // (the ref: dev Strict Mode runs effects twice, and each read is a free-model request)
  const started = useRef(false);
  useEffect(() => {
    if (started.current || sample) return;
    started.current = true;
    read();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const edit = (key: number, patch: Partial<Row>) =>
    setRows((rs) => rs!.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const chosen = (rows ?? []).filter((r) => r.on && r.date && r.title.trim());
  const add = () =>
    startSave(async () => {
      const r = await importSyllabus(
        material.id,
        // local wall-clock -> an instant, here where the student's timezone is known; no time = end of day
        chosen.map((c) => ({
          title: c.title,
          kind: c.kind,
          due: new Date(`${c.date}T${c.time ?? "23:59"}`).toISOString(),
        })),
      );
      if (r.error) return setError(r.error);
      readings.delete(material.id);
      toast.success(
        `Added ${r.added} to ${course}.` +
          (r.skipped ? ` ${r.skipped} ${r.skipped === 1 ? "was" : "were"} already there.` : ""),
      );
      onClose();
    });

  return (
    <>
      <div className="border-b border-border px-5 pt-5 pb-4 sm:px-6">
        <DialogTitle className="text-lg font-medium tracking-tight">Dates from the syllabus</DialogTitle>
        <DialogDescription className="mt-1 truncate">
          {course ? `${course} · ` : ""}
          {material.name}
        </DialogDescription>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
        {reading || (!rows && !error) ? (
          <p aria-busy="true" className="flex items-center gap-2 px-2 py-10 text-sm text-muted-foreground">
            <RefreshCw className="size-4 motion-safe:animate-spin" aria-hidden="true" />
            Reading the syllabus. This can take up to a minute.
          </p>
        ) : !rows ? (
          <div className="flex flex-col items-start gap-3 px-2 py-6">
            <FormError text={error} />
            <Button variant="secondary" onClick={read} className="h-9 rounded-full px-4">
              Try again
            </Button>
          </div>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {rows.map((r) => (
              <li
                key={r.key}
                className={cn(
                  "grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-xl bg-secondary p-2 transition-opacity sm:grid-cols-[auto_1fr_7.5rem_9.5rem_7.5rem_auto]",
                  !r.on && "opacity-60",
                )}
              >
                <Checkbox
                  nativeButton
                  render={<button type="button" />}
                  checked={r.on}
                  disabled={!r.date}
                  onCheckedChange={(on) => edit(r.key, { on })}
                  aria-label={`Import ${r.title}`}
                  className="size-5 rounded-full data-checked:border-done data-checked:bg-done"
                />
                <input
                  value={r.title}
                  onChange={(e) => edit(r.key, { title: e.target.value })}
                  maxLength={200}
                  autoComplete="off"
                  aria-label="Title"
                  className={cell}
                />
                <button
                  type="button"
                  onClick={() => setRows((rs) => rs!.filter((x) => x.key !== r.key))}
                  aria-label={`Remove ${r.title}`}
                  className="grid size-9 place-items-center rounded-full text-muted-foreground hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring col-start-3 row-start-1 sm:col-start-6"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
                <div className="col-span-3 grid grid-cols-2 gap-2 sm:col-span-3 sm:col-start-3 sm:row-start-1 sm:grid-cols-subgrid">
                  <select
                    value={r.kind}
                    onChange={(e) => edit(r.key, { kind: e.target.value as Kind })}
                    aria-label="Type"
                    className={cn(cell, "col-span-2 sm:col-span-1")}
                  >
                    {KINDS.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={r.date ?? ""}
                    onChange={(e) => edit(r.key, { date: e.target.value || null, on: !!e.target.value })}
                    aria-label="Date"
                    aria-invalid={!r.date}
                    className={cn(cell, !r.date && "ring-1 ring-destructive")}
                  />
                  <input
                    type="time"
                    value={r.time ?? ""}
                    onChange={(e) => edit(r.key, { time: e.target.value || null })}
                    aria-label="Time (optional)"
                    className={cell}
                  />
                </div>
                {!r.date && (
                  <p className="col-span-3 px-1 text-xs text-destructive sm:col-span-6">
                    The syllabus didn&apos;t give a clear date. Add one to import it.
                  </p>
                )}
              </li>
            ))}
            {rows.length === 0 && (
              <p className="px-2 py-6 text-sm text-muted-foreground">
                {known
                  ? `${course} already has all ${known} dated items from this syllabus. Nothing to add.`
                  : "Nothing left to add."}
              </p>
            )}
            {rows.length > 0 && known > 0 && (
              <li className="px-2 pt-2 text-xs text-muted-foreground">
                {known} more {known === 1 ? "is" : "are"} already in {course} (e.g. from Canvas), so{" "}
                {known === 1 ? "it isn't" : "they aren't"} listed.
              </li>
            )}
          </ul>
        )}
      </div>

      {rows && (
        <div className="flex flex-wrap items-center gap-3 border-t border-border px-5 py-3 sm:px-6">
          <FormError text={error} />
          <span className="mr-auto font-mono text-xs text-muted-foreground">
            {chosen.length} of {rows.length} selected · no time = 11:59 PM
          </span>
          <Button variant="ghost" onClick={onClose} className="h-10 rounded-full px-4">
            Cancel
          </Button>
          <Button onClick={add} disabled={!chosen.length || saving} className="h-10 rounded-full px-5">
            <CalendarPlus className="size-4" aria-hidden="true" />
            {saving ? "Adding…" : `Add ${chosen.length} to ${course}`}
          </Button>
        </div>
      )}
    </>
  );
}
