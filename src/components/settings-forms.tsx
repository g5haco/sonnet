"use client";

import { CalendarDays, Check, CircleUser, ShieldCheck } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { resetAllData, saveName, saveTerm, signOut } from "@/app/actions";
import { useAssistant } from "@/components/app-shell";
import { field, FormError, label, Submit, useSubmit } from "@/components/create-forms";
import { DoubtButton } from "@/components/evil-buttons/doubt-button";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { termGlance } from "@/lib/term";
import { cn } from "@/lib/utils";

export function SemesterForm({ start, weeks }: { start: string; weeks: number }) {
  const { pending, error, submit } = useSubmit(saveTerm, () => toast.success("Semester saved."));
  return (
    <form autoComplete="off" action={submit} className="grid gap-2 sm:grid-cols-[1fr_8rem_auto] sm:items-end sm:gap-3">
      <div className="flex flex-col gap-2">
        <label htmlFor="start" className={label}>
          First day of classes
        </label>
        <input id="start" name="start" type="date" required defaultValue={start} className={field} />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="weeks" className={label}>
          Weeks
        </label>
        <input id="weeks" name="weeks" type="number" min={1} max={30} required defaultValue={weeks} className={field} />
      </div>
      <Submit pending={pending}>Save</Submit>
      <div className="sm:col-span-3">
        <FormError text={error} />
      </div>
    </form>
  );
}

// What Home calls you ("Morning, Eric.").
export function NameForm({ name }: { name: string }) {
  const { pending, error, submit } = useSubmit(saveName, () => toast.success("Saved. Say hi on Home."));
  return (
    <form autoComplete="off" action={submit} className="flex flex-col gap-2">
      <label htmlFor="your-name" className={label}>
        What should Sonnet call you?
      </label>
      <div className="flex gap-2">
        <input
          id="your-name"
          name="name"
          maxLength={40}
          defaultValue={name}
          placeholder="First name"
          className={field}
        />
        <Button type="submit" variant="secondary" disabled={pending} className="h-11 shrink-0 rounded-full px-5">
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
      {error && <FormError text={error} />}
    </form>
  );
}

// Each preview paints its own theme whatever the app is in now, so the colors are fixed here
// (the neutral surfaces from globals.css: background, sidebar/card, accent, foreground).
const PAINT = {
  light: { bg: "oklch(1 0 0)", rail: "oklch(0.968 0 0)", line: "oklch(0.9 0 0)", ink: "oklch(0.18 0 0)" },
  dark: { bg: "oklch(0.145 0 0)", rail: "oklch(0.195 0 0)", line: "oklch(0.29 0 0)", ink: "oklch(0.965 0 0)" },
};
const THEMES = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "system", label: "System" },
] as const;

// A tiny Sonnet: rail, a heading, a line of text, two cards.
function Mini({ paint, className }: { paint: (typeof PAINT)["light"]; className?: string }) {
  return (
    <span className={cn("absolute inset-0 flex", className)} style={{ background: paint.bg }}>
      <span className="flex w-1/5 flex-col items-center gap-1.5 pt-2.5" style={{ background: paint.rail }}>
        {[0, 1, 2].map((i) => (
          <span key={i} className="size-2 rounded-full" style={{ background: paint.line }} />
        ))}
      </span>
      <span className="flex flex-1 flex-col gap-1.5 p-2.5">
        <span className="h-1.5 w-1/2 rounded-full" style={{ background: paint.ink }} />
        <span className="h-1 w-3/4 rounded-full" style={{ background: paint.line }} />
        <span className="mt-auto grid grid-cols-2 gap-1.5">
          <span className="h-5 rounded-md" style={{ background: paint.rail }} />
          <span className="h-5 rounded-md" style={{ background: paint.rail }} />
        </span>
      </span>
    </span>
  );
}

// Light / Dark / System as real radio buttons, drawn as little previews of the app.
export function ThemePicker() {
  const { theme, setTheme } = useTheme();
  const current = theme ?? "system";
  return (
    <fieldset className="grid max-w-md grid-cols-3 gap-3">
      <legend className="sr-only">Theme</legend>
      {THEMES.map(({ id, label: text }) => (
        <label key={id} className="group flex cursor-pointer flex-col gap-2">
          <input
            type="radio"
            name="theme"
            value={id}
            checked={current === id}
            onChange={() => setTheme(id)}
            className="peer sr-only"
          />
          <span
            aria-hidden="true"
            className={cn(
              "relative block aspect-[4/3] overflow-hidden rounded-xl ring-1 ring-border ring-offset-2 ring-offset-background transition-shadow duration-150",
              "group-hover:ring-foreground/30 peer-checked:ring-2 peer-checked:ring-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring",
            )}
          >
            {id === "system" ? (
              <>
                <Mini paint={PAINT.light} className="[clip-path:inset(0_50%_0_0)]" />
                <Mini paint={PAINT.dark} className="[clip-path:inset(0_0_0_50%)]" />
              </>
            ) : (
              <Mini paint={PAINT[id]} />
            )}
          </span>
          <span
            className={cn(
              "flex items-center gap-1.5 text-sm transition-colors",
              current === id ? "font-medium" : "text-muted-foreground group-hover:text-foreground",
            )}
          >
            {text}
            {current === id && <Check className="size-3.5" aria-hidden="true" />}
          </span>
        </label>
      ))}
    </fieldset>
  );
}

export type SettingsSection = "account" | "semester" | "data";
export type Account = {
  email: string;
  name: string;
  term: { start: string; weeks: number } | null;
  feed: string | null;
  canvas: {
    baseUrl: string;
    icsUrl: string;
    tokenConnected: boolean;
    lastSyncAt: string | null;
    lastSyncStatus: "idle" | "syncing" | "success" | "error";
    lastSyncError: string | null;
    lastSyncCount: number;
  };
};

// Preferences only. Integrations (Canvas, the Google Calendar feed) live in Sync.
const SECTIONS: { id: SettingsSection; label: string; short?: string; icon: typeof CalendarDays }[] = [
  { id: "account", label: "Account & appearance", short: "Account", icon: CircleUser },
  { id: "semester", label: "Semester", icon: CalendarDays },
  { id: "data", label: "Data & privacy", icon: ShieldCheck },
];

const heading = "text-base font-medium";
const help = "mt-1 text-sm text-pretty text-muted-foreground";
const group = "mt-6 border-t border-border pt-6";

// Settings float over whatever page you're on (it stays visible behind), so closing drops you right back.
export function SettingsWindow({
  section,
  onSection,
  onClose,
  account,
}: {
  section: SettingsSection | null; // null = closed
  onSection: (s: SettingsSection) => void;
  onClose: () => void;
  account: Account;
}) {
  return (
    <Dialog open={section !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex h-[min(46rem,calc(100dvh-2rem))] flex-col gap-0 overflow-hidden rounded-2xl p-0 shadow-2xl sm:max-w-4xl lg:max-w-5xl">
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
          <nav
            aria-label="Settings sections"
            className="flex shrink-0 gap-1 overflow-x-auto border-b border-border p-2 sm:w-60 sm:flex-col sm:border-r sm:border-b-0 sm:p-4"
          >
            <p className="hidden px-2.5 pt-1 pb-3 text-sm font-medium sm:block">Settings</p>
            {SECTIONS.map(({ id, label: text, short, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => onSection(id)}
                aria-current={section === id ? "page" : undefined}
                className={cn(
                  "flex h-9 shrink-0 items-center gap-2.5 rounded-lg px-2.5 text-sm whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                  section === id
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                )}
              >
                {/* phones: no icons and short labels, so all three tabs fit */}
                <Icon className="hidden size-4 sm:block" aria-hidden="true" />
                <span className={cn(short && "hidden sm:inline")}>{text}</span>
                {short && <span className="sm:hidden">{short}</span>}
              </button>
            ))}
          </nav>
          <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-8">
            <AnimatePresence mode="wait" initial={false}>
              <motion.section
                key={section}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="max-w-2xl"
              >
                {section === "account" && (
                  <>
                    <h2 className={heading}>Account &amp; appearance</h2>
                    <p className={cn(help, "mb-6 font-mono")}>{account.email}</p>
                    <NameForm name={account.name} />
                    <div className={group}>
                      <h3 className={label}>Theme</h3>
                      <p className={cn(help, "mb-4")}>Light, dark, or follow your device.</p>
                      <ThemePicker />
                    </div>
                    <div className={group}>
                      <SignOut />
                    </div>
                  </>
                )}
                {section === "semester" && <SemesterSettings term={account.term} />}
                {section === "data" && (
                  <>
                    <h2 className={heading}>Data &amp; privacy</h2>
                    <p className={cn(help, "mb-6")}>
                      Everything you add is private to your account. Your Canvas token is encrypted, and the Google
                      Calendar link is a secret you can replace any time in Sync.
                    </p>
                    <ResetData onDone={onClose} />
                  </>
                )}
              </motion.section>
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const day = (d: Date) => d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

// The semester at a glance (where you are in it), then the two numbers that define it.
function SemesterSettings({ term }: { term: Account["term"] }) {
  const [now] = useState(() => new Date());
  const g = term && termGlance(term, now);
  return (
    <>
      <h2 className={heading}>Semester</h2>
      <p className={cn(help, "mb-6")}>
        Sets the weekly bars on Home, the calendar&apos;s heat map, and when class times stop repeating.
      </p>
      {g ? (
        <div className="rounded-2xl bg-secondary/60 p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-mono text-2xl font-medium tabular-nums">
              {g.phase === "upcoming" ? (
                "Not started"
              ) : g.phase === "finished" ? (
                "Finished"
              ) : (
                <>
                  Week {g.week}
                  <span className="text-muted-foreground"> of {term.weeks}</span>
                </>
              )}
            </p>
            <p className="font-mono text-xs text-muted-foreground">
              {g.phase === "upcoming"
                ? `starts ${day(g.start)}`
                : g.phase === "finished"
                  ? `ended ${day(g.end)}`
                  : g.weeksLeft
                    ? `${g.weeksLeft} week${g.weeksLeft === 1 ? "" : "s"} left`
                    : "last week"}
            </p>
          </div>
          <div
            role="progressbar"
            aria-label="Semester progress"
            aria-valuenow={g.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            className="mt-4 h-1.5 overflow-hidden rounded-full bg-foreground/10"
          >
            <div className="h-full rounded-full bg-foreground" style={{ width: `${g.percent}%` }} />
          </div>
          <p className="mt-2 flex justify-between font-mono text-xs text-muted-foreground tabular-nums">
            <span>{day(g.start)}</span>
            <span>{day(g.end)}</span>
          </p>
        </div>
      ) : (
        <p className="rounded-2xl bg-secondary/60 p-5 text-sm text-pretty">
          No semester yet. Add the first day of classes to turn on weekly progress, the heat map and the Google Calendar
          feed.
        </p>
      )}
      <div className={group}>
        <h3 className={cn(label, "mb-4")}>{term ? "Change dates" : "Set dates"}</h3>
        {term && term.weeks <= 2 && (
          <p className="mb-4 rounded-xl bg-secondary px-3 py-2 text-sm">
            Set to {term.weeks} week{term.weeks === 1 ? "" : "s"}? Most semesters run 15 or 16.
          </p>
        )}
        <SemesterForm start={term?.start ?? ""} weeks={term?.weeks ?? 16} />
      </div>
    </>
  );
}

// Deliberately slow: open, read what goes, then push through three doubts. No one-click path.
function ResetData({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [tries, setTries] = useState(0); // a failed reset remounts the button, straight back to idle
  const [pending, start] = useTransition();
  const { clear } = useAssistant();
  const router = useRouter();
  const reset = () =>
    start(async () => {
      const r = await resetAllData("RESET"); // the server still requires the word
      if (r.error) {
        setTries((n) => n + 1);
        return setError(r.error);
      }
      clear(); // the open conversation would otherwise be saved again
      toast("All data cleared. Fresh start.");
      onDone();
      router.replace("/");
    });
  const cancel = () => {
    setOpen(false);
    setError("");
  };

  return (
    <section aria-labelledby="reset-title" className="rounded-2xl border border-destructive/40 p-5">
      <h3 id="reset-title" className="text-sm font-medium text-destructive">
        Reset all data
      </h3>
      <p className={help}>
        Deletes every course with its assignments, exams, class times and materials (uploaded files too), your chats,
        and your semester dates. Canvas gets disconnected, or its daily sync would bring everything back. Your login and
        name stay. This can&apos;t be undone.
      </p>
      {open ? (
        <div className="mt-5 flex flex-col gap-2">
          <FormError text={error} />
          <div className="flex flex-wrap items-center gap-2">
            {/* Four deliberate clicks, each asking again; the last one burns it all down. */}
            <DoubtButton
              key={tries}
              label="Delete everything"
              confirmations={["Are you sure?", "Every course, every file. Still?", "No undo. Last chance."]}
              successLabel="Deleting…"
              resetAfter={0}
              disabled={pending}
              onConfirm={reset}
              className="rounded-full"
            />
            <Button
              type="button"
              variant="ghost"
              onClick={cancel}
              disabled={pending}
              className="h-10 rounded-full px-4"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          onClick={() => setOpen(true)}
          className="mt-5 h-10 rounded-full border-destructive/40 px-5 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          Reset all data…
        </Button>
      )}
    </section>
  );
}

export function SignOut() {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="secondary"
      disabled={pending}
      onClick={() => start(() => signOut())}
      className="h-11 rounded-full px-5 transition-transform active:scale-[0.97]"
    >
      {pending ? "Signing out…" : "Sign out"}
    </Button>
  );
}
