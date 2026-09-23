"use client";

import { CalendarDays, CalendarSync, CircleUser, Cloud, RefreshCw, SunMoon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTheme } from "next-themes";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ThinkingOrb } from "thinking-orbs";
import {
  disconnectCanvas,
  resetFeed,
  saveCanvasConnection,
  saveName,
  saveTerm,
  signOut,
  syncCanvasNow,
} from "@/app/actions";
import { field, FormError, label, Submit, useSubmit } from "@/components/create-forms";
import { ThemeSwitcher } from "@/components/kibo-ui/theme-switcher";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function SemesterForm({ start, weeks }: { start: string; weeks: number }) {
  const { pending, error, submit } = useSubmit(saveTerm, () => toast.success("Semester saved."));
  return (
    <form action={submit} className="grid gap-2 sm:grid-cols-[1fr_8rem_auto] sm:items-end sm:gap-3">
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
    <form action={submit} className="flex flex-col gap-2">
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
      <FormError text={error} />
    </form>
  );
}

export function Appearance() {
  const { theme, setTheme } = useTheme();
  return (
    <ThemeSwitcher value={(theme as "light" | "dark" | "system") ?? "system"} onChange={setTheme} className="w-fit" />
  );
}

export type SettingsSection = "semester" | "canvas" | "calendar" | "appearance" | "account";
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

const SECTIONS: { id: SettingsSection; label: string; icon: typeof CalendarDays }[] = [
  { id: "semester", label: "Semester", icon: CalendarDays },
  { id: "canvas", label: "Canvas", icon: Cloud },
  { id: "calendar", label: "Google Calendar", icon: CalendarSync },
  { id: "appearance", label: "Appearance", icon: SunMoon },
  { id: "account", label: "Account", icon: CircleUser },
];

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
  const heading = "text-base font-medium";
  const help = "mt-1 mb-5 text-sm text-pretty text-muted-foreground";
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
            {SECTIONS.map(({ id, label: text, icon: Icon }) => (
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
                <Icon className="size-4" aria-hidden="true" />
                {text}
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
              >
                {section === "semester" && (
                  <>
                    <h2 className={heading}>Semester</h2>
                    <p className={help}>
                      Sets the weekly bars on Home, the calendar&apos;s heat map, and when class times stop repeating.
                    </p>
                    {account.term && account.term.weeks <= 2 && (
                      <p className="mb-4 rounded-xl bg-secondary px-3 py-2 text-sm">
                        Set to {account.term.weeks} week{account.term.weeks === 1 ? "" : "s"}? Most semesters run 15 or
                        16.
                      </p>
                    )}
                    <SemesterForm start={account.term?.start ?? ""} weeks={account.term?.weeks ?? 16} />
                  </>
                )}
                {section === "calendar" && (
                  <>
                    <h2 className={cn(heading, "mb-3")}>Google Calendar</h2>
                    <FeedLink token={account.feed} />
                  </>
                )}
                {section === "canvas" && <CanvasForm connection={account.canvas} />}
                {section === "appearance" && (
                  <>
                    <h2 className={heading}>Appearance</h2>
                    <p className={help}>Light, dark, or follow your device.</p>
                    <Appearance />
                  </>
                )}
                {section === "account" && (
                  <>
                    <h2 className={heading}>Account</h2>
                    <p className={cn(help, "font-mono")}>{account.email}</p>
                    <NameForm name={account.name} />
                    <div className="mt-4">
                      <SignOut />
                    </div>
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

function CanvasForm({ connection }: { connection: Account["canvas"] }) {
  const { resolvedTheme } = useTheme();
  const {
    pending: saving,
    error,
    submit,
  } = useSubmit(saveCanvasConnection, () => toast.success("Canvas connection saved."));
  const [syncing, startSync] = useTransition();
  const [disconnecting, startDisconnect] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const connected = connection.tokenConnected || Boolean(connection.icsUrl);
  const sync = () =>
    startSync(async () => {
      const result = await syncCanvasNow();
      if (result.error) toast.error(result.error);
      else toast.success(`Canvas synced ${result.count ?? 0} item${result.count === 1 ? "" : "s"}.`);
    });
  const disconnect = () =>
    startDisconnect(async () => {
      const result = await disconnectCanvas();
      setConfirming(false);
      if (result.error) toast.error(result.error);
      else toast("Canvas disconnected. Imported work stays in Sonnet.");
    });
  const last = connection.lastSyncAt
    ? new Date(connection.lastSyncAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
    : "Not synced yet";

  return (
    <div className="max-w-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-medium">Canvas</h2>
          <p className="mt-1 mb-5 text-sm text-pretty text-muted-foreground">
            Pull courses, deadlines, assignment details and scores. Use either connection—or both for the best coverage.
          </p>
        </div>
        {(syncing || connection.lastSyncStatus === "syncing") && (
          <ThinkingOrb
            state="connecting"
            size={32}
            theme={resolvedTheme === "light" ? "dark" : "light"}
            aria-label="Connecting to Canvas"
          />
        )}
      </div>

      <form action={submit} className="grid gap-4">
        <div className="grid gap-2">
          <label htmlFor="canvas-base" className={label}>
            Canvas address
          </label>
          <input
            id="canvas-base"
            name="baseUrl"
            type="url"
            required
            defaultValue={connection.baseUrl}
            placeholder="https://school.instructure.com"
            className={field}
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
          <div className="grid gap-2">
            <label htmlFor="canvas-token" className={label}>
              Access token
            </label>
            <input
              id="canvas-token"
              name="token"
              type="password"
              autoComplete="off"
              placeholder={connection.tokenConnected ? "Connected — leave blank to keep" : "Paste token"}
              className={field}
            />
            <p className="text-xs text-muted-foreground">
              Encrypted before it is stored and never sent back to this screen.
            </p>
          </div>
          <div className="grid gap-2">
            <label htmlFor="canvas-ics" className={label}>
              Calendar feed URL
            </label>
            <input
              id="canvas-ics"
              name="icsUrl"
              type="url"
              defaultValue={connection.icsUrl}
              placeholder="https://school.instructure.com/feeds/calendars/..."
              className={field}
            />
            <p className="text-xs text-muted-foreground">
              Adds dated Canvas events that are not returned by the token API.
            </p>
          </div>
        </div>
        <FormError text={error} />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={saving} className="h-10 rounded-full px-5 active:scale-[0.97]">
            {saving ? "Checking…" : "Save connection"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={!connected || syncing}
            onClick={sync}
            className="h-10 rounded-full px-5 active:scale-[0.97]"
          >
            <RefreshCw className={cn("size-4", syncing && "animate-spin")} aria-hidden="true" />
            {syncing ? "Syncing…" : "Sync now"}
          </Button>
        </div>
      </form>

      <div className="mt-6 rounded-xl bg-secondary/70 p-4 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-medium">{connected ? "Connected" : "Not connected"}</span>
          <span className="font-mono text-xs text-muted-foreground">{last}</span>
        </div>
        {connection.lastSyncStatus === "success" && (
          <p className="mt-1 text-muted-foreground">
            Last sync found {connection.lastSyncCount} item{connection.lastSyncCount === 1 ? "" : "s"}.
          </p>
        )}
        {connection.lastSyncError && (
          <p role="alert" className="mt-1 text-destructive">
            {connection.lastSyncError}
          </p>
        )}
      </div>

      {connected && (
        <div className="mt-6 border-t border-border pt-5">
          {confirming ? (
            <Button
              variant="destructive"
              disabled={disconnecting}
              onClick={disconnect}
              onBlur={() => setConfirming(false)}
              autoFocus
              className="h-9 rounded-full px-4"
            >
              {disconnecting ? "Disconnecting…" : "Imported work stays. Disconnect?"}
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={() => setConfirming(true)}
              className="h-9 rounded-full px-4 text-muted-foreground"
            >
              Disconnect Canvas
            </Button>
          )}
        </div>
      )}
    </div>
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

// Subscribe once in Google Calendar (one-way). "New link" retires the old secret URL, so it asks twice.
export function FeedLink({ token, className }: { token: string | null; className?: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();
  if (!token) return <p className={cn("text-sm text-muted-foreground", className)}>Set your semester dates first.</p>;

  const copy = async () => {
    const url = `${location.origin}/api/cal/${token}.ics`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Feed link copied", { description: "Google Calendar: Other calendars, +, From URL, paste." });
    } catch {
      toast("Copy this link", { description: url, duration: 20_000 });
    }
  };
  const renew = () =>
    start(async () => {
      const r = await resetFeed();
      setConfirming(false);
      if (r.error) toast.error(r.error);
      else toast("New link made. The old one no longer works.");
    });

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <p className="text-sm text-pretty text-muted-foreground">
        Classes, due dates and exams in Google Calendar. Copy the link, then in Google Calendar pick Other calendars, +,
        From URL. Google refreshes it every few hours.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={copy} className="h-9 rounded-full px-4 active:scale-[0.97]">
          Copy feed link
        </Button>
        {confirming ? (
          <Button
            variant="destructive"
            disabled={pending}
            onClick={renew}
            onBlur={() => setConfirming(false)}
            autoFocus
            className="h-9 rounded-full px-4"
          >
            {pending ? "Making…" : "Old link stops working. OK?"}
          </Button>
        ) : (
          <Button variant="ghost" onClick={() => setConfirming(true)} className="h-9 rounded-full px-4">
            New link
          </Button>
        )}
      </div>
    </div>
  );
}
