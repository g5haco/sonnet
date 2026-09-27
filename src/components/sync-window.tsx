"use client";

import { ChevronDown, ChevronRight, Copy, ExternalLink, RefreshCw } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { disconnectCanvas, resetFeed, saveCanvasConnection } from "@/app/actions";
import { slow, useTasks } from "@/components/tasks";
import { useOpenSettings } from "@/components/app-shell";
import { field, FormError, label, useSubmit } from "@/components/create-forms";
import type { Account } from "@/components/settings-forms";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { FREE } from "@/lib/plan";

// on = flowing, ready = wired but idle, busy = syncing now, error = broken, off = not set up.
type Tone = "on" | "ready" | "busy" | "error" | "off";
const TONE: Record<Tone, string> = {
  on: "text-done",
  ready: "text-foreground",
  busy: "text-foreground",
  error: "text-destructive",
  off: "text-muted-foreground",
};

// An LED and a word. Color never carries the state alone.
function Status({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span className={cn("flex shrink-0 items-center gap-2 font-mono text-xs", TONE[tone])}>
      <span
        aria-hidden="true"
        className={cn(
          "size-2 rounded-[2px]",
          tone === "off" ? "ring-1 ring-current" : "bg-current",
          (tone === "on" || tone === "error") && "shadow-[0_0_6px_currentColor]",
          tone === "busy" && "animate-pulse",
        )}
      />
      {children}
    </span>
  );
}

// The wire between two nodes. A dot travels it while data moves; it breaks when a sync fails.
function Wire({ tone }: { tone: Tone }) {
  const still = useReducedMotion();
  const moving = !still && (tone === "on" || tone === "busy");
  return (
    <span aria-hidden="true" className={cn("relative flex h-6 min-w-6 flex-1 items-center", TONE[tone])}>
      {tone === "error" ? (
        <>
          <span className="h-px flex-1 bg-current opacity-60" />
          <span className="px-1 font-mono text-xs leading-none">×</span>
          <span className="h-px flex-1 bg-current opacity-60" />
        </>
      ) : (
        <span
          className={cn(
            "h-px flex-1",
            tone === "off" ? "border-t border-dashed border-current opacity-50" : "bg-current opacity-40",
          )}
        />
      )}
      {moving && (
        <span className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden">
          <motion.span
            className="absolute inset-0"
            initial={{ x: "-100%" }}
            animate={{ x: "0%" }}
            transition={{ duration: tone === "busy" ? 0.7 : 2.4, ease: "linear", repeat: Infinity }}
          >
            <span className="absolute top-0 right-0 size-1.5 rounded-full bg-current shadow-[0_0_6px_currentColor]" />
          </motion.span>
        </span>
      )}
      <ChevronRight className="-ml-1 size-3 shrink-0 opacity-60" />
    </span>
  );
}

function Node({ name, role, hub }: { name: string; role: string; hub?: boolean }) {
  return (
    <span className="flex shrink-0 flex-col items-center gap-1.5">
      <span
        className={cn(
          "rounded-md px-2.5 py-1.5 font-mono text-xs",
          hub ? "bg-foreground text-background" : "bg-background ring-1 ring-border",
        )}
      >
        {name}
      </span>
      <span className="font-mono text-[11px] text-muted-foreground">{role}</span>
    </span>
  );
}

// One integration as a channel strip: its channel and state on the left, what it does and the controls on the right.
function Channel({
  channel,
  name,
  status,
  blurb,
  children,
}: {
  channel: string;
  name: string;
  status: React.ReactNode;
  blurb: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-label={name}
      className="grid gap-x-6 gap-y-3 border-t border-border px-5 py-5 sm:grid-cols-[9rem_1fr] sm:px-6"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 sm:flex-col sm:items-start">
        <span className="font-mono text-xs text-muted-foreground">{channel}</span>
        <h3 className="text-sm font-medium">{name}</h3>
        <span className="ml-auto sm:ml-0">{status}</span>
      </div>
      <div className="min-w-0">
        <p className="mb-4 max-w-prose text-sm text-pretty text-muted-foreground">{blurb}</p>
        {children}
      </div>
    </section>
  );
}

// The sync in flight, if any: reopening the window mid-sync shows it as syncing instead of allowing a second one.
let running: Promise<unknown> | null = null;

// Canvas's state, shared by the wire at the top and the channel below.
function useCanvas(connection: Account["canvas"]) {
  const connected = connection.tokenConnected || Boolean(connection.icsUrl);
  const [pending, startSync] = useTransition();
  const track = useTasks();
  const syncing = pending || !!running || connection.lastSyncStatus === "syncing"; // this tab's click, or the server's run
  // Runs in the corner too, so the window can close mid-sync.
  const sync = () =>
    startSync(async () => {
      running ??= track("Syncing Canvas", () => slow("syncCanvasNow"), (r) => ({
        note:
          `${r.count ?? 0} item${r.count === 1 ? "" : "s"} up to date.` +
          (r.skipped
            ? ` Free keeps ${FREE.courses} courses, so ${r.skipped} more from Canvas ${r.skipped === 1 ? "wasn't" : "weren't"} imported.`
            : ""),
      })).finally(() => (running = null));
      await running;
    });
  const failed = connection.lastSyncStatus === "error" || Boolean(connection.lastSyncError);
  const tone: Tone = syncing ? "busy" : !connected ? "off" : failed ? "error" : "on";
  return { connected, syncing, sync, failed, tone };
}
type CanvasState = ReturnType<typeof useCanvas>;

const CANVAS_WORD: Record<Tone, string> = {
  busy: "syncing…",
  off: "not connected",
  error: "sync failed",
  on: "connected",
  ready: "connected",
};

// Sync: everything that flows into Sonnet (Canvas) or out of it (the Google Calendar feed), drawn as the
// signal path it is. Floats over the current page, like Settings.
export function SyncWindow({ open, onClose, account }: { open: boolean; onClose: () => void; account: Account }) {
  const canvas = useCanvas(account.canvas);
  const feedTone: Tone = account.feed ? "ready" : "off";
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden rounded-2xl p-0 shadow-2xl sm:max-w-2xl">
        <div className="px-5 pt-5 pb-5 sm:px-6">
          <DialogTitle className="font-sans text-base font-medium">Sync</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-pretty">
            What flows into Sonnet, and what it sends out.
          </DialogDescription>
          <div
            role="img"
            aria-label={`Canvas to Sonnet: ${CANVAS_WORD[canvas.tone]}. Sonnet to Google Calendar: ${account.feed ? "link ready" : "needs term dates"}.`}
            className="mt-5 flex items-start gap-1 rounded-xl bg-muted/60 px-3 py-4 sm:gap-2 sm:px-5"
          >
            <Node name="canvas" role="in" />
            <Wire tone={canvas.tone} />
            <Node name="sonnet" role="you" hub />
            <Wire tone={feedTone} />
            <Node name="google" role="out" />
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <CanvasService connection={account.canvas} hasTerm={Boolean(account.term)} state={canvas} />
          <Channel
            channel="out · 01"
            name="Google Calendar"
            status={<Status tone={feedTone}>{account.feed ? "link ready" : "needs term"}</Status>}
            blurb="Sends classes, due dates and exams to Google Calendar. One-way; Google refreshes it every few hours."
          >
            <FeedLink token={account.feed} />
          </Channel>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Canvas and the feed both live on the semester's settings row, so both need semester dates first.
function NeedsSemester({ what, className }: { what: string; className?: string }) {
  const openSettings = useOpenSettings();
  return (
    <p className={cn("text-sm text-pretty text-muted-foreground", className)}>
      {what} needs your term dates.{" "}
      <button type="button" onClick={() => openSettings("semester")} className="link">
        Set them
      </button>
    </p>
  );
}

function CanvasService({
  connection,
  hasTerm,
  state: { connected, syncing, sync, failed, tone },
}: {
  connection: Account["canvas"];
  hasTerm: boolean;
  state: CanvasState;
}) {
  const [editing, setEditing] = useState(false);
  const last = connection.lastSyncAt
    ? new Date(connection.lastSyncAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    : null;

  return (
    <Channel
      channel="in · 01"
      name="Canvas"
      status={<Status tone={tone}>{CANVAS_WORD[tone]}</Status>}
      blurb="Pulls courses, deadlines, assignment details and scores. Use the token, the calendar feed, or both."
    >
      {connected && (
        <>
          <dl className="grid max-w-md grid-cols-[1.5fr_1fr_1fr] gap-px overflow-hidden rounded-lg bg-border font-mono text-xs">
            {[
              ["last sync", last ?? "never"],
              ["items", connection.lastSyncStatus === "success" ? String(connection.lastSyncCount) : "—"],
              ["schedule", "daily"],
            ].map(([k, v]) => (
              <div key={k} className="bg-background px-3 py-2">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="mt-0.5 truncate tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
          {connection.lastSyncError && (
            <p role="alert" className="mt-3 text-sm text-pretty text-destructive">
              {connection.lastSyncError}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button disabled={syncing} onClick={sync} className="h-10 rounded-full px-4 active:scale-[0.97]">
              <RefreshCw className={cn("size-4", syncing && "animate-spin")} aria-hidden="true" />
              {syncing ? "Syncing…" : failed ? "Try again" : "Sync now"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setEditing((e) => !e)}
              aria-expanded={editing}
              className="h-10 rounded-full px-4"
            >
              Edit connection
              <ChevronDown
                className={cn("size-4 transition-transform duration-200", editing && "rotate-180")}
                aria-hidden="true"
              />
            </Button>
          </div>
        </>
      )}
      {/* Not connected: the form IS the next step. Connected: it waits behind "Edit connection". */}
      <AnimatePresence initial={false}>
        {(!connected || editing) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            {!hasTerm && <NeedsSemester what="Canvas" className="mb-4 px-1" />}
            <CanvasForm
              connection={connection}
              connected={connected}
              disabled={!hasTerm}
              onSaved={() => setEditing(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </Channel>
  );
}

function CanvasForm({
  connection,
  connected,
  disabled,
  onSaved,
}: {
  connection: Account["canvas"];
  connected: boolean;
  disabled: boolean; // no semester yet: nowhere to save the connection
  onSaved: () => void;
}) {
  const { pending, error, submit } = useSubmit(saveCanvasConnection, () => {
    toast.success("Canvas connection saved.");
    onSaved();
  });
  const [disconnecting, startDisconnect] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const disconnect = () =>
    startDisconnect(async () => {
      const result = await disconnectCanvas();
      setConfirming(false);
      if (result.error) toast.error(result.error);
      else toast("Canvas disconnected. Imported work stays in Sonnet.");
    });

  return (
    // px-1: room for the focus rings inside the collapsing (overflow-hidden) wrapper
    <form autoComplete="off" action={submit} className={cn("grid gap-4 px-1 pb-1", connected && "mt-5 border-t border-border pt-5")}>
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
      <div className="grid gap-2">
        <label htmlFor="canvas-token" className={label}>
          Access token
        </label>
        <input
          id="canvas-token"
          name="token"
          // Masked with CSS, not type="password": a password field makes browsers offer saved logins and
          // pop "Save password?" on submit. The data-* flags keep password-manager extensions off it too.
          type="text"
          autoComplete="off"
          spellCheck={false}
          data-1p-ignore
          data-lpignore="true"
          data-bwignore
          data-form-type="other"
          className={cn(field, "[-webkit-text-security:disc]")}
          placeholder={connection.tokenConnected ? "Connected. Leave blank to keep it" : "Paste token"}
        />
        <p className="text-xs text-muted-foreground">Encrypted before it&apos;s stored and never sent back to this screen.</p>
      </div>
      <div className="grid gap-2">
        <label htmlFor="canvas-ics" className={label}>
          Calendar feed URL <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <input
          id="canvas-ics"
          name="icsUrl"
          type="url"
          defaultValue={connection.icsUrl}
          placeholder="https://school.instructure.com/feeds/calendars/..."
          className={field}
        />
        <p className="text-xs text-muted-foreground">Adds dated Canvas events the token doesn&apos;t return.</p>
      </div>
      <FormError text={error} />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={pending || disabled} className="h-10 rounded-full px-5 active:scale-[0.97]">
          {pending ? "Checking…" : connected ? "Save changes" : "Connect Canvas"}
        </Button>
        {connected &&
          (confirming ? (
            <Button
              type="button"
              variant="destructive"
              disabled={disconnecting}
              onClick={disconnect}
              onBlur={() => setConfirming(false)}
              autoFocus
              className="h-10 rounded-full px-4"
            >
              {disconnecting ? "Disconnecting…" : "Imported work stays. Disconnect?"}
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setConfirming(true)}
              className="h-10 rounded-full px-4 text-muted-foreground"
            >
              Disconnect
            </Button>
          ))}
      </div>
    </form>
  );
}

// The Google Calendar feed. The link is a secret (anyone with it sees your schedule), so it stays hidden
// until asked for. "New link" retires the old URL, so it asks twice.
export function FeedLink({ token, className }: { token: string | null; className?: string }) {
  const [shown, setShown] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();
  if (!token) return <NeedsSemester what="The feed" className={className} />;

  const url = () => `${location.origin}/api/cal/${token}.ics`;
  // Google's subscribe-by-URL takes the feed in `cid` (webcal:// is the calendar-subscription scheme).
  const google = () =>
    `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(url().replace(/^https?:/, "webcal:"))}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url());
      toast.success("Feed link copied", { description: "Google Calendar: Other calendars, +, From URL, paste." });
    } catch {
      toast("Copy this link", { description: url(), duration: 20_000 });
    }
  };
  const renew = () =>
    start(async () => {
      const r = await resetFeed();
      setConfirming(false);
      if (r.error) toast.error(r.error);
      else toast("New link made. The old one no longer works.");
    });

  if (!shown)
    return (
      <div className={cn("flex flex-col items-start gap-3", className)}>
        <p className="text-sm text-pretty text-muted-foreground">
          In Google Calendar, pick Other calendars, +, From URL, and paste the link.
        </p>
        <Button variant="secondary" onClick={() => setShown(true)} className="h-9 rounded-full px-4">
          View feed link
        </Button>
      </div>
    );

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <input
        readOnly
        value={url()}
        aria-label="Feed link"
        onFocus={(e) => e.currentTarget.select()}
        className={cn(field, "font-mono text-xs md:text-xs")}
      />
      <p className="text-xs text-pretty text-muted-foreground">
        Anyone with this link can see your schedule. If it leaks, make a new one.
      </p>
      <div className="flex flex-wrap gap-2">
        <a
          href={google()}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants(), "h-9 rounded-full px-4 active:scale-[0.97]")}
        >
          <ExternalLink className="size-4" aria-hidden="true" />
          Open in Google Calendar
        </a>
        <Button variant="secondary" onClick={copy} className="h-9 rounded-full px-4 active:scale-[0.97]">
          <Copy className="size-4" aria-hidden="true" />
          Copy
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
        <Button variant="ghost" onClick={() => setShown(false)} className="h-9 rounded-full px-4">
          Hide
        </Button>
      </div>
    </div>
  );
}
