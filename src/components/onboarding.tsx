"use client";

import { ChevronLeft, ChevronRight, RefreshCw, X } from "lucide-react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useState, useTransition } from "react";
import { createCourse, saveTerm } from "@/app/actions";
import { field, FormError, label } from "@/components/create-forms";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STEPS = ["Semester", "Courses", "Done"];
const EASE = [0.16, 1, 0.3, 1] as const;

// First run: semester dates, then courses, then a finish line. Nothing saves until Finish, because saving the
// semester is what swaps this screen for Home.
export function Onboarding() {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [start, setStart] = useState("");
  const [weeks, setWeeks] = useState("16");
  const [courses, setCourses] = useState<{ code: string; name: string }[]>([]);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [saving, startSave] = useTransition();

  const termOk = /^\d{4}-\d{2}-\d{2}$/.test(start) && +weeks >= 1 && +weeks <= 30;
  const go = (d: number) => {
    setError("");
    setDir(d);
    setStep((s) => s + d);
  };
  const addCourse = () => {
    if (!code.trim()) return;
    setCourses((c) => [...c, { code: code.trim(), name: name.trim() }]);
    setCode("");
    setName("");
  };
  const finish = () =>
    startSave(async () => {
      for (const c of courses) {
        const f = new FormData();
        f.set("code", c.code);
        f.set("name", c.name);
        const r = await createCourse(f);
        if (r.error) return setError(r.error);
        setCourses((all) => all.slice(1)); // saved: a retry won't add it twice
      }
      const f = new FormData();
      f.set("start", start);
      f.set("weeks", weeks);
      const r = await saveTerm(f);
      if (r.error) setError(r.error);
    });

  return (
    <MotionConfig reducedMotion="user">
      <main className="mx-auto flex w-full max-w-lg flex-col px-4 pt-[10vh] pb-24">
        {/* Progress: a dot per step, and a bar that fills to the current one. */}
        <ol className="grid grid-cols-3 text-center">
          {STEPS.map((s, i) => (
            <li key={s} className="flex flex-col items-center gap-2" aria-current={i === step ? "step" : undefined}>
              <span
                className={cn(
                  "size-3.5 rounded-full transition-[background-color,box-shadow] duration-300",
                  i < step ? "bg-foreground" : i === step ? "bg-foreground ring-4 ring-foreground/20" : "bg-secondary",
                )}
              />
              <span className={cn("text-xs", i === step ? "font-medium text-foreground" : "text-muted-foreground")}>
                {s}
              </span>
            </li>
          ))}
        </ol>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
          <motion.div
            className="h-full rounded-full bg-foreground"
            initial={false}
            animate={{ width: `${((step + 0.5) / STEPS.length) * 100}%` }}
            transition={{ duration: 0.5, ease: EASE }}
          />
        </div>

        <section className="mt-8 overflow-hidden rounded-3xl border border-border bg-card p-6 md:p-8">
          <AnimatePresence mode="wait" initial={false} custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              initial={{ opacity: 0, x: dir * 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -24 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="flex flex-col gap-2"
            >
              {step === 0 && (
                <>
                  <h1 className="text-2xl font-medium tracking-tight">When does your semester run?</h1>
                  <p className="mb-4 text-sm text-muted-foreground">So the weekly bars line up with your real weeks.</p>
                  <label htmlFor="start" className={label}>
                    First day of classes
                  </label>
                  <input id="start" type="date" value={start} onChange={(e) => setStart(e.target.value)} className={field} />
                  <label htmlFor="weeks" className={cn(label, "mt-2")}>
                    Weeks in the semester
                  </label>
                  <input
                    id="weeks"
                    type="number"
                    min={1}
                    max={30}
                    value={weeks}
                    onChange={(e) => setWeeks(e.target.value)}
                    className={field}
                  />
                </>
              )}

              {step === 1 && (
                <>
                  <h1 className="text-2xl font-medium tracking-tight">What are you taking?</h1>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Each course gets its own color. Canvas users can skip this: sync brings them in.
                  </p>
                  <form
                    autoComplete="off"
                    onSubmit={(e) => {
                      e.preventDefault();
                      addCourse();
                    }}
                    className="flex flex-col gap-2"
                  >
                    <div className="flex gap-2">
                      <label htmlFor="code" className="sr-only">
                        Course code
                      </label>
                      <input
                        id="code"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        maxLength={40}
                        placeholder="CHEM 1210"
                        className={cn(field, "w-32 min-w-0 font-mono")}
                      />
                      <label htmlFor="cname" className="sr-only">
                        Name (optional)
                      </label>
                      <input
                        id="cname"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={120}
                        placeholder="General Chemistry (optional)"
                        className={cn(field, "min-w-0 flex-1")}
                      />
                    </div>
                    <Button type="submit" variant="secondary" disabled={!code.trim()} className="h-10 rounded-full">
                      Add course
                    </Button>
                  </form>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {courses.map((c, i) => (
                      <li key={i} className="flex h-9 items-center gap-2 rounded-full bg-secondary pr-1 pl-3.5 text-sm">
                        <span className="font-mono">{c.code}</span>
                        {c.name && <span className="max-w-40 truncate text-muted-foreground">{c.name}</span>}
                        <button
                          type="button"
                          aria-label={`Remove ${c.code}`}
                          onClick={() => setCourses((all) => all.filter((_, j) => j !== i))}
                          className="grid size-7 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <X className="size-3.5" aria-hidden="true" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {step === 2 && (
                <>
                  <h1 className="text-2xl font-medium tracking-tight">You&apos;re set.</h1>
                  <p className="mb-4 text-sm text-muted-foreground">
                    {weeks} weeks from{" "}
                    {new Date(`${start}T00:00`).toLocaleDateString(undefined, { month: "long", day: "numeric" })}
                    {courses.length ? `, ${courses.length} course${courses.length === 1 ? "" : "s"}` : ""}.
                  </p>
                  <p className="flex gap-3 rounded-2xl bg-secondary p-4 text-sm">
                    <RefreshCw className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <span>
                      <span className="font-medium">On Canvas?</span>{" "}
                      <span className="text-muted-foreground">
                        Sync in the sidebar pulls in your courses, assignments and grades.
                      </span>
                    </span>
                  </p>
                  <FormError text={error} />
                </>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex items-center justify-between">
            {step > 0 ? (
              <Button variant="outline" onClick={() => go(-1)} className="h-10 gap-1 rounded-full pr-4 pl-3">
                <ChevronLeft aria-hidden="true" /> Back
              </Button>
            ) : (
              <span />
            )}
            {step < STEPS.length - 1 ? (
              <Button
                onClick={() => go(1)}
                disabled={step === 0 && !termOk}
                className="h-10 gap-1 rounded-full pr-3 pl-4 transition-transform active:scale-[0.97]"
              >
                {step === 1 && courses.length === 0 ? "Skip" : "Next"} <ChevronRight aria-hidden="true" />
              </Button>
            ) : (
              <Button
                onClick={finish}
                disabled={saving}
                className="h-10 rounded-full px-5 transition-transform active:scale-[0.97]"
              >
                {saving ? "Setting up…" : "Go to Home"}
              </Button>
            )}
          </div>
        </section>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Step {step + 1} of {STEPS.length}: {STEPS[step]}
        </p>
      </main>
    </MotionConfig>
  );
}
