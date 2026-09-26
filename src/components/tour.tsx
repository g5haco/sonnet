"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { courseColor } from "@/lib/course";
import { cn } from "@/lib/utils";

export const TOUR_KEY = "sonnet-tour"; // set when onboarding finishes; Home plays the tour once and clears it

const EASE = [0.16, 1, 0.3, 1] as const;
const HUE = [65, 290, 335];

// Small drawn scenes of each feature (not screenshots, so they never go stale or show someone's data).
const Row = ({ hue, w, due, late }: { hue: number; w: string; due: string; late?: boolean }) => (
  <div className="flex items-center gap-2.5 rounded-lg bg-card/80 px-3 py-2">
    <span className="size-3.5 rounded-full border border-foreground/30" />
    <span className="flex flex-1 flex-col gap-1">
      <span className="h-2 rounded-full bg-foreground/70" style={{ width: w }} />
      <span className="flex items-center gap-1">
        <span className="size-1.5 rounded-full" style={{ background: courseColor(hue) }} />
        <span className="h-1.5 w-10 rounded-full bg-foreground/25" />
      </span>
    </span>
    <span className={cn("font-mono text-[10px]", late ? "text-destructive" : "text-foreground")}>{due}</span>
  </div>
);

const SLIDES = [
  {
    title: "Home is yours to arrange",
    text: "Drag widgets anywhere on the grid and resize them from a corner. Progress, deadlines, grades and focus, laid out how you like.",
    art: (
      <div className="grid h-full grid-cols-4 grid-rows-3 gap-2">
        <div className="col-span-2 row-span-1 flex items-end gap-1 rounded-lg bg-card/80 p-2.5">
          {[40, 70, 55, 90, 30, 60].map((h, i) => (
            <span key={i} className={cn("flex-1 rounded-full", i === 3 ? "bg-brand" : "bg-foreground/20")} style={{ height: `${h}%` }} />
          ))}
        </div>
        <div className="grid place-items-center rounded-lg bg-card/80">
          <span className="size-10 rounded-full border-4 border-brand/80 border-t-foreground/15" />
        </div>
        <div className="rounded-lg border-2 border-dashed border-foreground/25" />
        <div className="col-span-2 row-span-2 flex flex-col gap-1.5 rounded-lg bg-card/80 p-2.5">
          {HUE.map((h, i) => (
            <span key={h} className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full" style={{ background: courseColor(h) }} />
              <span className="h-1.5 rounded-full bg-foreground/40" style={{ width: `${70 - i * 15}%` }} />
            </span>
          ))}
        </div>
        <div className="col-span-2 row-span-2 grid grid-cols-7 gap-0.5 rounded-lg bg-card/80 p-2.5">
          {Array.from({ length: 28 }, (_, i) => (
            <span key={i} className={cn("rounded-[2px]", [3, 9, 10, 17, 18, 24].includes(i) ? "bg-done" : "bg-foreground/10")} />
          ))}
        </div>
      </div>
    ),
  },
  {
    title: "Every deadline, already here",
    text: "Canvas syncs your assignments, exams and grades every day. Check things off as you go; clear the week and you'll hear about it.",
    art: (
      <div className="flex h-full flex-col justify-center gap-2">
        <Row hue={HUE[0]} w="70%" due="2d late" late />
        <Row hue={HUE[1]} w="55%" due="today" />
        <Row hue={HUE[2]} w="80%" due="tmrw" />
        <Row hue={HUE[0]} w="45%" due="4d" />
      </div>
    ),
  },
  {
    title: "Sonnet knows your classes",
    text: "It reads your syllabus and materials, plans your week and makes study guides. Anything it wants to change waits for your yes.",
    art: (
      <div className="flex h-full flex-col justify-center gap-2 text-[11px]">
        <span className="self-end rounded-2xl rounded-br-md bg-foreground px-3 py-1.5 text-background">Add my midterm on Oct 3</span>
        <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-card/80 p-2.5">
          <span className="text-muted-foreground">Add this exam?</span>
          <div className="mt-1.5 flex items-center gap-2 rounded-lg bg-secondary px-2.5 py-1.5">
            <span className="size-1.5 rounded-full" style={{ background: courseColor(HUE[1]) }} />
            <span className="font-medium">Midterm 1</span>
            <span className="ml-auto font-mono text-muted-foreground">Oct 3</span>
          </div>
          <div className="mt-1.5 flex gap-1.5">
            <span className="rounded-full bg-foreground px-2.5 py-0.5 text-background">Add</span>
            <span className="rounded-full bg-secondary px-2.5 py-0.5">Not now</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Grades, and what the final needs",
    text: "Your Canvas grade for every course, a trend over the term, and a calculator for the score you need on the final.",
    art: (
      <div className="flex h-full flex-col justify-center gap-3">
        {[92, 84, 77].map((g, i) => (
          <div key={g} className="grid grid-cols-[3rem_1fr_2.5rem] items-center gap-2 font-mono text-[11px]">
            <span className="h-2 rounded-full bg-foreground/40" />
            <span className="h-2 rounded-full bg-foreground/10">
              <span className="block h-full rounded-full" style={{ width: `${g}%`, background: courseColor(HUE[i]) }} />
            </span>
            <span className="text-right">{g}%</span>
          </div>
        ))}
        <span className="mt-1 self-start rounded-full bg-card/80 px-3 py-1 text-[11px]">
          You need <span className="font-mono font-medium">81%</span> on the final for 90%.
        </span>
      </div>
    ),
  },
  {
    title: "Focus, one session at a time",
    text: "A 25-minute timer that follows you around the app. Each session fills in your study heatmap and keeps your streak going.",
    art: (
      <div className="flex h-full items-center justify-center gap-6">
        <div className="grid size-28 place-items-center rounded-full border-[6px] border-done border-l-foreground/15">
          <span className="font-mono text-lg font-medium">18:42</span>
        </div>
        <div className="flex flex-col items-start gap-1">
          <span className="font-mono text-4xl font-medium">6</span>
          <span className="text-xs text-muted-foreground">days in a row</span>
        </div>
      </div>
    ),
  },
];

// The one-time feature tour after sign-up: a picture and a line per feature, dots to show where you are.
export function Tour() {
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);

  useEffect(() => {
    try {
      if (!localStorage.getItem(TOUR_KEY)) return;
      localStorage.removeItem(TOUR_KEY); // once, even if they close it early
      setOpen(true); // eslint-disable-line react-hooks/set-state-in-effect -- storage is client-only
    } catch {}
  }, []);

  const go = (d: number) => {
    setDir(d);
    setI((n) => n + d);
  };
  const s = SLIDES[i];
  const last = i === SLIDES.length - 1;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent showCloseButton={false} className="gap-0 overflow-hidden rounded-3xl p-5 sm:max-w-md">
        <div className="relative h-56 overflow-hidden rounded-2xl bg-secondary p-5">
          <AnimatePresence mode="popLayout" initial={false} custom={dir}>
            <motion.div
              key={i}
              initial={{ opacity: 0, x: dir * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -40 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="h-full"
              aria-hidden="true"
            >
              {s.art}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="mt-5 flex justify-center gap-1.5" aria-hidden="true">
          {SLIDES.map((_, n) => (
            <span
              key={n}
              className={cn("h-1.5 rounded-full transition-all duration-300", n === i ? "w-6 bg-foreground" : "w-3 bg-foreground/15")}
            />
          ))}
        </div>
        <DialogTitle className="mt-5 text-lg">{s.title}</DialogTitle>
        <DialogDescription className="mt-2 min-h-15 text-pretty">{s.text}</DialogDescription>
        <p className="sr-only" aria-live="polite">
          {i + 1} of {SLIDES.length}
        </p>
        <div className="mt-5 flex items-center gap-2">
          {i > 0 && (
            <Button variant="ghost" onClick={() => go(-1)} className="h-10 rounded-full px-4">
              Back
            </Button>
          )}
          {!last && (
            <Button variant="ghost" onClick={() => setOpen(false)} className="ml-auto h-10 rounded-full px-4 text-muted-foreground">
              Skip
            </Button>
          )}
          <Button
            onClick={() => (last ? setOpen(false) : go(1))}
            className={cn("h-10 rounded-full px-5 transition-transform active:scale-[0.97]", last && "ml-auto")}
          >
            {last ? "Start" : "Next"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
