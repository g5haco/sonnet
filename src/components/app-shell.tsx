"use client";

import { MotionConfig } from "motion/react";
import { useRouter } from "next/navigation";
import { createContext, useContext, useState } from "react";
import { toast } from "sonner";
import { CourseDialog, ItemDialog } from "@/components/create-forms";
import type { CreateKind } from "@/components/create-menu";
import { Sidebar } from "@/components/sidebar";
import type { Item } from "@/lib/progress";

type Course = { id: string; code: string; hue: number };

// Any page can open the Create flows (e.g. the dashboard's "Add your first course").
const CreateContext = createContext<(kind: CreateKind) => void>(() => {});
export const useCreate = () => useContext(CreateContext);

export function AppShell({ courses, children }: { courses: Course[]; children: React.ReactNode }) {
  const [now] = useState(() => Date.now());
  const [dialog, setDialog] = useState<"course" | Item["kind"] | null>(null);
  const router = useRouter();

  const create = (kind: CreateKind) => {
    if (kind === "upload") return router.push("/materials");
    if (kind !== "course" && courses.length === 0) {
      toast("Add a course first. Assignments and exams hang off it.");
      return setDialog("course");
    }
    setDialog(kind);
  };

  return (
    <MotionConfig reducedMotion="user">
      <CreateContext.Provider value={create}>
        <div className="flex min-h-dvh flex-col md:flex-row">
          <Sidebar onCreate={create} />
          <div className="min-w-0 flex-1">{children}</div>
        </div>
        <CourseDialog open={dialog === "course"} onOpenChange={(o) => !o && setDialog(null)} />
        <ItemDialog
          kind={dialog === "course" ? null : dialog}
          courses={courses}
          now={now}
          onOpenChange={(o) => !o && setDialog(null)}
        />
      </CreateContext.Provider>
    </MotionConfig>
  );
}
