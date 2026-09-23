"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { courseColor } from "@/lib/course";
import type { Item } from "@/lib/progress";
import { cn } from "@/lib/utils";

const KIND: Record<Item["kind"], string> = { assignment: "assignment", exam: "exam", quiz: "quiz", reading: "reading" };

// What a work item is and when it's due, with its one action (done / not done) and the way to its course.
// Shown in popovers: calendar chips, and item links and lists in the assistant's answers.
export function ItemDetails({ item, now, onToggle }: { item: Item; now: number; onToggle: (id: string) => void }) {
  const due = new Date(item.due);
  const late = !item.doneAt && +due < now;
  return (
    <>
      <p className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
        <span className="size-2 rounded-full" style={{ background: courseColor(item.hue) }} />
        {item.course} · {KIND[item.kind]}
      </p>
      <p className="text-base leading-snug font-medium">{item.title}</p>
      <p className={late ? "text-destructive" : "text-muted-foreground"}>
        {item.doneAt ? "Done. Was due " : late ? "Overdue. Was due " : "Due "}
        {due.toLocaleString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })}
      </p>
      <div className="mt-1.5 flex gap-2">
        <Button
          variant={item.doneAt ? "secondary" : "default"}
          onClick={() => onToggle(item.id)}
          className="h-9 flex-1 rounded-full active:scale-[0.97]"
        >
          {item.doneAt ? "Not done yet" : "Mark done"}
        </Button>
        {item.courseId && (
          <Link
            href={`/courses/${item.courseId}`}
            className={cn(buttonVariants({ variant: "ghost" }), "h-9 rounded-full px-3")}
          >
            Open {item.course}
          </Link>
        )}
      </div>
    </>
  );
}
