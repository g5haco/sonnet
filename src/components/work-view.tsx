"use client";

import { ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { CanvasHtml } from "@/components/canvas-html";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { scoreLabel } from "@/components/up-next";
import { courseColor } from "@/lib/course";
import type { Item } from "@/lib/progress";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// The rest of the row, loaded when the view opens. select("*"): columns a migration hasn't added yet
// (submission_types, allowed_attempts: 0012) are simply missing, and their lines stay hidden.
type Detail = {
  source?: string;
  description?: string | null;
  html_url?: string | null;
  submission_types?: string[] | null;
  allowed_attempts?: number | null;
};

const SUBMISSION: Record<string, string> = {
  online_upload: "File upload",
  online_text_entry: "Text entry",
  online_url: "Website URL",
  media_recording: "Media recording",
  student_annotation: "Annotation",
  online_quiz: "Quiz",
  discussion_topic: "Discussion",
  external_tool: "External tool",
  wiki_page: "Page",
  on_paper: "On paper",
  none: "Nothing to submit",
};

const http = (url?: string | null) => (url && /^https?:\/\//i.test(url) ? url : null);

// One work item, everything Sonnet knows about it. Check-off goes through the page's useWork, so the
// list, the Home widget and this button all agree (and Undo is the same toggle).
export function WorkView({
  item: current,
  onClose,
  onToggle,
}: {
  item: Item | null;
  onClose: () => void;
  onToggle: (id: string) => void;
}) {
  // Keeps drawing the last item while the dialog animates out (current turns null the moment it closes).
  const [last, setLast] = useState(current);
  if (current && current !== last) setLast(current);
  const item = current ?? last;
  const [detail, setDetail] = useState<{ id: string; row: Detail | null } | null>(null);
  const id = item?.id;

  useEffect(() => {
    if (!id) return;
    let live = true;
    createClient()
      .from("items")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => live && setDetail({ id, row: data }));
    return () => {
      live = false;
    };
  }, [id]);

  const d = detail && detail.id === id ? detail.row : undefined; // undefined = still loading
  const done = !!item?.doneAt;
  const link = http(d?.html_url);
  const types = d?.submission_types ?? [];
  const facts = item && [
    [
      "Due",
      new Date(item.due).toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
    ],
    item.score != null
      ? ["Score", scoreLabel(item.score, item.points)]
      : item.points != null && ["Points", `${+Number(item.points).toFixed(2)} pts`],
    types.length > 0 && ["Submit", types.map((t) => SUBMISSION[t] ?? t.replace(/_/g, " ")).join(", ")],
    d?.allowed_attempts != null &&
      d.allowed_attempts !== 0 && ["Attempts", d.allowed_attempts === -1 ? "Unlimited" : String(d.allowed_attempts)],
  ];

  return (
    <Dialog open={!!current} onOpenChange={(open) => !open && onClose()}>
      {/* Big like a page: details on the left, the description scrolls on the right (stacked on phones). */}
      <DialogContent className="max-h-[90dvh] gap-0 overflow-y-auto rounded-2xl p-0 sm:max-w-5xl md:h-[88dvh] md:grid-cols-[17rem_1fr] md:overflow-hidden">
        {item && (
          <>
            <div className="flex flex-col gap-4 p-5 md:overflow-y-auto md:border-r md:border-border md:p-6">
              <DialogHeader>
                <DialogDescription className="flex items-center gap-1.5 font-mono text-xs">
                  <span className="size-2 rounded-full" style={{ background: courseColor(item.hue) }} />
                  {item.course}
                  <span aria-hidden="true">·</span>
                  {item.kind}
                </DialogDescription>
                <DialogTitle className="text-lg leading-snug text-balance">{item.title}</DialogTitle>
              </DialogHeader>

              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                {facts
                  ?.filter((f): f is string[] => !!f)
                  .map(([k, v]) => (
                    <div key={k} className="contents">
                      <dt className="text-muted-foreground">{k}</dt>
                      <dd className="font-mono tabular-nums">{v}</dd>
                    </div>
                  ))}
              </dl>

              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  variant={done ? "secondary" : "default"}
                  onClick={() => onToggle(item.id)}
                  className="h-10 rounded-full px-5 transition-transform active:scale-[0.97]"
                >
                  {done ? "Undo" : "Mark as done"}
                </Button>
                {link && (
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(buttonVariants({ variant: "ghost" }), "h-10 gap-2 rounded-full px-4")}
                  >
                    Open in Canvas
                    <ExternalLink aria-hidden="true" />
                  </a>
                )}
              </div>
            </div>

            <div className="flex min-h-0 flex-col gap-4 px-5 pb-6 md:overflow-y-auto md:px-10 md:py-8">
              <div className="flex max-w-prose flex-col gap-4">
                {d === undefined ? (
                  <p className="text-sm text-muted-foreground">Loading details…</p>
                ) : (
                  <>
                    {d?.description &&
                      (d.source === "canvas" ? (
                        <CanvasHtml html={d.description} base={link ?? undefined} />
                      ) : (
                        <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-pretty [overflow-wrap:anywhere]">
                          {d.description}
                        </p>
                      ))}
                    {d?.source === "ics" && (
                      <p className="rounded-lg bg-secondary px-3 py-2 text-sm text-muted-foreground">
                        Points, submission type and attempts need a Canvas access token. Add one in Sync.
                      </p>
                    )}
                    {d !== null && !d.description && d.source !== "ics" && (
                      <p className="text-sm text-muted-foreground">
                        {d.source === "canvas" ? "No description in Canvas." : "No description."}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
