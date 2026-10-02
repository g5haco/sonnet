// Focus Sense, the desktop app's foreground-app sensing (src-tauri/src/focus_sense). Browsers have no bridge, so
// every call here makes no request there and resolves to null / [].
import { inDesktop } from "./index";

export type FocusActivityEvent = {
  seq: number;
  timestamp: number;
  sessionId: string;
  platform: "windows" | "macos";
  kind: "context" | "start" | "stop";
  source: "foreground-window" | "monitor";
  appName: string | null;
  processName: string | null;
  windowTitle: string | null;
  redacted: "excluded" | "private" | null;
  confidence: "full" | "partial" | "none";
};
export type FocusSenseStatus = {
  supported: boolean;
  enabled: boolean;
  exclusions: string[];
  monitoring: { sessionId: string; startedAt: number; until: number } | null;
  paused: boolean; // the user paused the latest session; the timer can't restart it
};

type Invoke = (command: string, args?: unknown) => Promise<unknown>;

// One call at a time, in order: IPC requests can otherwise finish out of order, and a stop that overtakes its start
// would leave a monitor running.
let queue: Promise<unknown> = Promise.resolve();

// null when there's no bridge or the app refused; never throws.
const call = <T>(command: string, args?: unknown): Promise<T | null> => {
  if (!inDesktop()) return Promise.resolve(null);
  const invoke = (window as unknown as { __TAURI_INTERNALS__: { invoke: Invoke } }).__TAURI_INTERNALS__.invoke;
  const next = queue.then(() => invoke(command, args) as Promise<T>).catch(() => null);
  queue = next;
  return next;
};

// The session id is the web timer's run.start in ms, the same instant focus_sessions logs as started_at.
export const focusSessionId = (start: number) => String(start);

export const focusSense = {
  available: inDesktop,
  status: () => call<FocusSenseStatus>("focus_sense_status"),
  configure: (c: { enabled: boolean; exclusions: string[] }) =>
    call<FocusSenseStatus>("focus_sense_configure", { config: { enabled: c.enabled, exclusions: c.exclusions } }),
  start: (sessionId: string, endsAt: number) => call<FocusSenseStatus>("focus_sense_start", { req: { sessionId, endsAt } }),
  // pause: the user paused sensing for the rest of this session (it stays off across a reload).
  stop: (pause = false) => call<FocusSenseStatus>("focus_sense_stop", { req: { pause } }),
  clear: () => call<FocusSenseStatus>("focus_sense_clear"),
  events: async (sessionId: string, after = 0) =>
    (await call<FocusActivityEvent[]>("focus_sense_events", { req: { sessionId, after } })) ?? [],
  // Polls for new events after a cursor; the returned function stops it.
  onActivity(sessionId: string, cb: (e: FocusActivityEvent) => void, intervalMs = 2000): () => void {
    if (!inDesktop()) return () => {};
    let after = 0;
    let busy = false;
    const poll = async () => {
      if (busy) return;
      busy = true;
      try {
        for (const e of await focusSense.events(sessionId, after)) {
          if (!id) return;
          after = Math.max(after, e.seq);
          cb(e);
        }
      } finally {
        busy = false;
      }
    };
    let id: ReturnType<typeof setInterval> | null = setInterval(poll, intervalMs);
    void poll();
    return () => {
      if (id) clearInterval(id);
      id = null;
    };
  },
};
