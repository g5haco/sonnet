"use client";

import { useState } from "react";
import { LENGTH } from "@/components/focus-timer";
import { Button } from "@/components/ui/button";
import { focusSense, type FocusActivityEvent } from "@/lib/desktop/focus-sense";
import { classifyEvents } from "@/lib/desktop/sense/classify";
import { sessionContext } from "@/lib/desktop/sense/context";
import { scoreSession } from "@/lib/desktop/sense/score";
import type { ClassifiedEvent, FocusSessionContext, SessionReport } from "@/lib/desktop/sense/types";

type View = { ctx: FocusSessionContext; events: ClassifiedEvent[]; report: SessionReport };

const min = (ms: number) => `${(ms / 60_000).toFixed(1)}m`;
const at = (t: number, start: number) => {
  const s = Math.max(0, Math.round((t - start) / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};
const tone = { ON_TASK: "text-done", DISTRACTING: "text-destructive", UNCERTAIN: "text-muted-foreground" } as const;

// Every event of the session, paging past the app's 500-per-call limit.
async function allEvents(id: string) {
  const out: FocusActivityEvent[] = [];
  for (;;) {
    const page = await focusSense.events(id, out.at(-1)?.seq ?? 0);
    out.push(...page);
    if (page.length < 500) return out;
  }
}

// A developer view of the latest session: raw activity, how each context was classified and why, and the metrics.
// Computed here on demand; nothing is saved. Uses no semantic provider (ambiguous contexts stay UNCERTAIN).
export function FocusSessionDebug({ sessionId }: { sessionId: string }) {
  const [view, setView] = useState<View | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setBusy(true);
    const ctx = sessionContext(sessionId);
    const events = await classifyEvents(await allEvents(sessionId), ctx);
    const start = Number(sessionId);
    const report = scoreSession(events, { start, intendedEnd: start + LENGTH * 60_000, now: Date.now() });
    setView({ ctx, events, report });
    setBusy(false);
  };

  const m = view?.report.metrics;
  const start = Number(sessionId);
  return (
    <div className="min-w-0">
      <Button variant="secondary" onClick={load} disabled={busy} className="h-11 rounded-full px-5">
        {busy ? "Reading…" : view ? "Refresh" : "Show latest session"}
      </Button>
      {view && m && (
        <div className="mt-4 grid gap-4 text-sm">
          <p className="text-muted-foreground">
            For: {[view.ctx.courseName, view.ctx.assignmentTitle, view.ctx.goal].filter(Boolean).join(" · ") || "nothing set"}
            {" · "}ended by {view.report.window.endRule}
          </p>
          <dl className="grid grid-cols-3 gap-x-4 gap-y-2 font-mono text-xs sm:grid-cols-5">
            {[
              ["score", m.focusScore ?? "—"],
              ["verified", `${m.verifiedMinutes}m`],
              ["focused", min(m.focusedMs)],
              ["distracted", min(m.distractionMs)],
              ["uncertain", min(m.uncertainMs)],
              ["idle", min(m.idleMs)],
              ["episodes", m.distractionEvents],
              ["slips", m.slips],
              ["recoveries", m.recoveries],
              ["longest", min(m.longestFocusedBlockMs)],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="text-base tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
          <ul className="grid gap-1 text-xs text-muted-foreground">
            {view.report.explain.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <details>
            <summary className="cursor-pointer py-2 text-sm font-medium">Timeline ({view.report.segments.length})</summary>
            <ul className="grid gap-1 font-mono text-xs">
              {view.report.segments.map((s) => (
                <li key={s.start} className="flex flex-wrap gap-x-3">
                  <span className="tabular-nums">
                    {at(s.start, start)}–{at(s.end, start)}
                  </span>
                  <span className={s.kind in tone ? tone[s.kind as keyof typeof tone] : ""}>{s.kind}</span>
                  {s.rawKind !== s.kind && <span className="text-muted-foreground">was {s.rawKind}</span>}
                  {s.note && <span className="text-muted-foreground">{s.note}</span>}
                </li>
              ))}
            </ul>
          </details>
          <details>
            <summary className="cursor-pointer py-2 text-sm font-medium">Events ({view.events.length})</summary>
            <ul className="grid gap-2 text-xs">
              {view.events.map((e) => (
                <li key={e.seq} className="grid gap-0.5 border-t border-border pt-2">
                  <span className="font-mono tabular-nums text-muted-foreground">
                    {at(e.timestamp, start)} {e.kind}
                    {e.idle && " · idle"}
                    {e.redacted && ` · ${e.redacted}`}
                  </span>
                  {e.kind === "context" && (
                    <span className="truncate">
                      {e.processName ?? "unknown app"}
                      {e.windowTitle && ` — ${e.windowTitle}`}
                    </span>
                  )}
                  {e.classification && (
                    <span>
                      <span className={tone[e.classification.label]}>{e.classification.label}</span>{" "}
                      <span className="font-mono">
                        {e.classification.confidence.toFixed(2)} {e.classification.method}
                      </span>{" "}
                      <span className="text-muted-foreground">{e.classification.reason}</span>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}
    </div>
  );
}
