"use client";

import { CalendarSearch, MessageCircle, RefreshCw } from "lucide-react";
import dynamic from "next/dynamic";

import { FormError } from "@/components/create-forms";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

// react-markdown + remark-gfm stay out of the shared app bundle.
const Markdown = dynamic(() => import("@/components/chat/markdown").then((m) => m.Markdown));

// The syllabus as one page: what the AI read (grading, policies, key dates…). Kept as the course's
// "Syllabus summary" note; the full syllabus stays in the assistant's memory for anything the summary skips.
export function SummaryDialog({
  open,
  course,
  body,
  loading,
  error,
  onClose,
  onAsk,
  onDates,
  onRetry,
}: {
  open: boolean;
  course: string;
  body: string | null;
  loading: boolean;
  error: string;
  onClose: () => void;
  onAsk: () => void; // chat about this course, syllabus loaded
  onDates?: () => void; // look for deadlines the course doesn't have yet (needs the syllabus file)
  onRetry?: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden rounded-2xl p-0 shadow-2xl sm:max-w-2xl">
        <div className="border-b border-border px-5 pt-5 pb-4 sm:px-6">
          <DialogTitle className="text-lg font-medium tracking-tight">Syllabus summary</DialogTitle>
          <DialogDescription className="mt-1">
            {course}. The assistant keeps the full syllabus, so ask it anything this page leaves out.
          </DialogDescription>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 text-sm leading-relaxed sm:px-6">
          {loading ? (
            <p aria-busy="true" className="flex items-center gap-2 py-8 text-muted-foreground">
              <RefreshCw className="size-4 motion-safe:animate-spin" aria-hidden="true" />
              Reading the syllabus. This can take up to a minute.
            </p>
          ) : body ? (
            <Markdown text={body} />
          ) : (
            <div className="flex flex-col items-start gap-3 py-6">
              <FormError text={error} />
              {onRetry && (
                <Button variant="secondary" onClick={onRetry} className="h-9 rounded-full px-4">
                  Try again
                </Button>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-border px-5 py-3 sm:px-6">
          {onDates && (
            <Button variant="ghost" onClick={onDates} className="mr-auto h-10 rounded-full px-4">
              <CalendarSearch className="size-4" aria-hidden="true" />
              Check for dates Canvas missed
            </Button>
          )}
          <Button onClick={onAsk} disabled={loading} className="h-10 rounded-full px-5">
            <MessageCircle className="size-4" aria-hidden="true" />
            Ask about the syllabus
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
