"use client";

import { useEffect, useState, useSyncExternalStore, useTransition } from "react";
import { toast } from "sonner";
import { FormError } from "@/components/create-forms";
import { Row } from "@/components/settings-forms";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { focusSense, type FocusSenseStatus } from "@/lib/desktop/focus-sense";

const help = "text-sm text-pretty text-muted-foreground";

// Settings' Data tab, desktop app only: nothing renders in a browser, or where the app has no sensor.
export function FocusSenseSettings() {
  const desktop = useSyncExternalStore(() => () => {}, focusSense.available, () => false);
  const [status, setStatus] = useState<FocusSenseStatus | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!desktop) return;
    let live = true;
    void focusSense.status().then((s) => {
      if (!live || !s) return;
      setStatus(s);
      setText(s.exclusions.join("\n"));
    });
    return () => {
      live = false;
    };
  }, [desktop]);

  if (!status?.supported) return null;

  const toggle = (enabled: boolean) =>
    start(async () => {
      const s = await focusSense.configure({ enabled, exclusions: status.exclusions });
      if (s) setStatus(s);
      else toast.error("Couldn't change Focus Sense. Try again.");
    });
  const saveExclusions = () =>
    start(async () => {
      const exclusions = text
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      const s = await focusSense.configure({ enabled: status.enabled, exclusions });
      if (!s) return setError("Couldn't save. Use file names like discord.exe.");
      setError("");
      setStatus(s);
      setText(s.exclusions.join("\n"));
      toast.success("Saved.");
    });
  const pause = () =>
    start(async () => {
      const s = await focusSense.stop(true);
      if (s) setStatus(s);
    });
  const clear = () =>
    start(async () => {
      const s = await focusSense.clear();
      setConfirming(false);
      if (!s) return void toast.error("Couldn't clear Focus Sense data. Try again.");
      setStatus(s);
      toast("Focus Sense data cleared.");
    });

  return (
    <>
      <Row title="Focus Sense" hint="Desktop app only. Stays on this computer.">
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
          <Checkbox checked={status.enabled} onCheckedChange={toggle} disabled={pending} />
          Note which app and window is in front during focus sessions
        </label>
        <p className={`mt-1 ${help}`}>
          While a focus session runs, Sonnet notes which app is in front and its window title, about once a second.
          Nothing leaves this computer. No screenshots, keystrokes or page content.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-xs text-muted-foreground">
            {status.monitoring
              ? "Watching this session"
              : !status.enabled
                ? "Off"
                : status.paused
                  ? "Paused until your next session"
                  : "On, starts with your next session"}
          </p>
          {status.monitoring && (
            <Button variant="secondary" onClick={pause} disabled={pending} className="h-11 rounded-full px-5">
              Pause for this session
            </Button>
          )}
        </div>
      </Row>
      <Row
        title="Never record"
        hint="App file names, one per line, e.g. discord.exe. Password managers are always skipped."
        htmlFor="focus-sense-exclusions"
      >
        <textarea
          id="focus-sense-exclusions"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          placeholder="discord.exe"
          className="w-full resize-y rounded-2xl bg-secondary px-4 py-3 font-mono text-base outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
        />
        {error && <FormError text={error} />}
        <Button variant="secondary" onClick={saveExclusions} disabled={pending} className="mt-2 h-11 rounded-full px-5">
          Save
        </Button>
      </Row>
      <Row title="Focus Sense data" hint="Sessions older than 30 days are removed on their own.">
        {confirming ? (
          <div className="flex flex-col gap-3">
            <p className={help}>Delete every recorded session on this computer? Your settings stay.</p>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="destructive" onClick={clear} disabled={pending} className="h-11 rounded-full px-5">
                {pending ? "Clearing…" : "Clear"}
              </Button>
              <Button variant="ghost" onClick={() => setConfirming(false)} disabled={pending} className="h-11 rounded-full px-4">
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="secondary" onClick={() => setConfirming(true)} className="h-11 rounded-full px-5">
            Clear Focus Sense data
          </Button>
        )}
      </Row>
    </>
  );
}
