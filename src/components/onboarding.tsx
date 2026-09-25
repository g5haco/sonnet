"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createCourse, saveCanvasConnection, saveName, saveTerm, syncCanvasNow } from "@/app/actions";
import { field, FormError, label } from "@/components/create-forms";
import { TOUR_KEY } from "@/components/tour";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STEPS = ["Name", "Semester", "Canvas", "Courses", "Done"];
const EASE = [0.16, 1, 0.3, 1] as const;

// First run: name, semester dates, Canvas, courses, then a finish line. Nothing saves until "Go to Home",
// because saving the semester is what swaps this screen for Home. Canvas connects after the semester (its
// settings live on that row) and its first sync runs in the background with a toast.
export function Onboarding({ name: known = "" }: { name?: string }) {
  const [step, setStep] = useState(0);
  const [me, setMe] = useState(known);
  const [canvas, setCanvas] = useState({ baseUrl: "", token: "", icsUrl: "" });
  const onCanvas = Boolean(canvas.baseUrl.trim() && (canvas.token.trim() || canvas.icsUrl.trim()));
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
  const form = (fields: Record<string, string>) => {
    const f = new FormData();
    for (const [k, v] of Object.entries(fields)) f.set(k, v);
    return f;
  };
  const finish = () =>
    startSave(async () => {
      if (me.trim() !== known) {
        const r = await saveName(form({ name: me.trim() }));
        if (r.error) return setError(r.error);
      }
      for (const c of courses) {
        const f = new FormData();
        f.set("code", c.code);
        f.set("name", c.name);
        const r = await createCourse(f);
        if (r.error) return setError(r.error);
        setCourses((all) => all.slice(1)); // saved: a retry won't add it twice
      }
      try {
        localStorage.setItem(TOUR_KEY, "1"); // Home plays the feature tour once
      } catch {}
      const r = await saveTerm(form({ start, weeks }));
      if (r.error) return setError(r.error);
      if (!onCanvas) return;
      // Home is showing by now, so Canvas reports through toasts.
      const c = await saveCanvasConnection(form(canvas));
      if (c.error) return void toast.error(`Canvas didn't connect: ${c.error} Try again from Sync in the sidebar.`);
      toast.promise(
        syncCanvasNow().then((r) => {
          if (r.error) throw new Error(r.error);
          return r.count ?? 0;
        }),
        {
          loading: "Syncing Canvas…",
          success: (n) => `Canvas synced: ${n} item${n === 1 ? "" : "s"}.`,
          error: (e: Error) => `Canvas sync failed: ${e.message}`,
        },
      );
    });

  return (
    <MotionConfig reducedMotion="user">
      <main className="mx-auto flex w-full max-w-lg flex-col px-4 pt-[10vh] pb-24">
        {/* Progress: a dot per step, and a bar that fills to the current one. */}
        <ol className="grid grid-cols-5 text-center">
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
                  <h1 className="text-2xl font-medium tracking-tight">What should we call you?</h1>
                  <p className="mb-4 text-sm text-muted-foreground">Home greets you by it. First name is plenty.</p>
                  <label htmlFor="me" className={label}>
                    Name
                  </label>
                  <input
                    id="me"
                    value={me}
                    onChange={(e) => setMe(e.target.value)}
                    maxLength={40}
                    autoComplete="given-name"
                    className={field}
                  />
                </>
              )}

              {step === 1 && (
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

              {step === 2 && (
                <>
                  <h1 className="text-2xl font-medium tracking-tight">Bring in Canvas?</h1>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Sonnet pulls your courses, assignments and grades from Canvas every day. Not on Canvas? Skip
                    it; you can connect later from Sync.
                  </p>
                  <label htmlFor="ob-base" className={label}>
                    Canvas address
                  </label>
                  <input
                    id="ob-base"
                    type="url"
                    value={canvas.baseUrl}
                    onChange={(e) => setCanvas({ ...canvas, baseUrl: e.target.value })}
                    placeholder="https://school.instructure.com"
                    className={field}
                  />
                  <label htmlFor="ob-token" className={cn(label, "mt-2")}>
                    Access token
                  </label>
                  <input
                    id="ob-token"
                    // Masked with CSS, not type="password", so browsers don't offer to save it as a login.
                    type="text"
                    autoComplete="off"
                    spellCheck={false}
                    data-1p-ignore
                    data-lpignore="true"
                    value={canvas.token}
                    onChange={(e) => setCanvas({ ...canvas, token: e.target.value })}
                    placeholder="Paste token"
                    className={cn(field, "[-webkit-text-security:disc]")}
                  />
                  <p className="text-xs text-muted-foreground">
                    In Canvas: Account → Settings → New access token. It&apos;s encrypted before it&apos;s stored.
                  </p>
                  <label htmlFor="ob-ics" className={cn(label, "mt-2")}>
                    Calendar feed URL <span className="font-normal text-muted-foreground">(optional, or instead)</span>
                  </label>
                  <input
                    id="ob-ics"
                    type="url"
                    value={canvas.icsUrl}
                    onChange={(e) => setCanvas({ ...canvas, icsUrl: e.target.value })}
                    placeholder="https://school.instructure.com/feeds/calendars/..."
                    className={field}
                  />
                </>
              )}

              {step === 3 && (
                <>
                  <h1 className="text-2xl font-medium tracking-tight">What are you taking?</h1>
                  <p className="mb-4 text-sm text-muted-foreground">
                    {onCanvas ? "Canvas brings your courses in. Add any it won't have." : "Each course gets its own color."}
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

              {step === 4 && (
                <>
                  <h1 className="text-2xl font-medium tracking-tight">
                    You&apos;re set{me.trim() && `, ${me.trim().split(/\s+/)[0]}`}.
                  </h1>
                  <p className="mb-4 text-sm text-muted-foreground">
                    {weeks} weeks from{" "}
                    {new Date(`${start}T00:00`).toLocaleDateString(undefined, { month: "long", day: "numeric" })}
                    {courses.length ? `, ${courses.length} course${courses.length === 1 ? "" : "s"}` : ""}
                    {onCanvas ? ", and Canvas syncs as soon as Home opens" : ""}.
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
                disabled={step === 1 && !termOk}
                className="h-10 gap-1 rounded-full pr-3 pl-4 transition-transform active:scale-[0.97]"
              >
                {(step === 2 && !onCanvas) || (step === 3 && courses.length === 0) ? "Skip" : "Next"} <ChevronRight aria-hidden="true" />
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
