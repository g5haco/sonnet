import { afterEach, describe, expect, it, vi } from "vitest";
import { focusSense, focusSessionId, type FocusActivityEvent } from "./focus-sense";

const bridge = (impl: (command: string, args?: unknown) => unknown) => {
  const invoke = vi.fn(async (command: string, args?: unknown) => impl(command, args));
  vi.stubGlobal("window", { __TAURI_INTERNALS__: { invoke } });
  return invoke;
};
const status = { supported: true, enabled: true, exclusions: [], monitoring: null, paused: false };
const event = (seq: number): FocusActivityEvent => ({
  seq,
  timestamp: seq,
  sessionId: "1",
  platform: "windows",
  kind: "context",
  source: "foreground-window",
  appName: null,
  processName: null,
  windowTitle: null,
  redacted: null,
  confidence: "none",
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("focusSense", () => {
  it("does nothing without the bridge", async () => {
    expect(focusSense.available()).toBe(false);
    vi.stubGlobal("window", {});
    expect(focusSense.available()).toBe(false);
    expect(await focusSense.status()).toBeNull();
    expect(await focusSense.configure({ enabled: true, exclusions: [] })).toBeNull();
    expect(await focusSense.start("1", 2)).toBeNull();
    expect(await focusSense.stop()).toBeNull();
    expect(await focusSense.clear()).toBeNull();
    expect(await focusSense.events("1")).toEqual([]);
    focusSense.onActivity("1", () => {})();
  });

  it("sends the argument shapes the app expects", async () => {
    const invoke = bridge(() => status);
    expect(focusSense.available()).toBe(true);
    expect(await focusSense.status()).toEqual(status);
    await focusSense.configure({ enabled: true, exclusions: ["discord.exe"] });
    await focusSense.start("1700", 1800);
    await focusSense.stop();
    await focusSense.stop(true);
    await focusSense.events("1700", 4);
    await focusSense.clear();
    expect(invoke.mock.calls).toEqual([
      ["focus_sense_status", undefined],
      ["focus_sense_configure", { config: { enabled: true, exclusions: ["discord.exe"] } }],
      ["focus_sense_start", { req: { sessionId: "1700", endsAt: 1800 } }],
      ["focus_sense_stop", { req: { pause: false } }],
      ["focus_sense_stop", { req: { pause: true } }],
      ["focus_sense_events", { req: { sessionId: "1700", after: 4 } }],
      ["focus_sense_clear", undefined],
    ]);
  });

  it("sends calls one at a time, in order, even when an earlier one is slow", async () => {
    const order: string[] = [];
    const invoke = vi.fn(async (c: string) => {
      order.push(`begin ${c}`);
      await new Promise((r) => setTimeout(r, c === "focus_sense_start" ? 30 : 0));
      order.push(`end ${c}`);
      return status;
    });
    vi.stubGlobal("window", { __TAURI_INTERNALS__: { invoke } });
    await Promise.all([focusSense.start("1", 2), focusSense.stop()]);
    expect(order).toEqual(["begin focus_sense_start", "end focus_sense_start", "begin focus_sense_stop", "end focus_sense_stop"]);
  });

  it("turns a refusal into null or []", async () => {
    bridge(() => Promise.reject("focus sense is off"));
    expect(await focusSense.start("1", 2)).toBeNull();
    expect(await focusSense.events("1")).toEqual([]);
  });

  it("polls with an advancing cursor until unsubscribed", async () => {
    vi.useFakeTimers();
    const pages = [[event(1), event(2)], [event(3)], []];
    const invoke = bridge(() => pages.shift() ?? []);
    const seen: number[] = [];
    const stop = focusSense.onActivity("1", (e) => seen.push(e.seq), 1000);
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(1000);
    expect(seen).toEqual([1, 2, 3]);
    expect(invoke.mock.calls.map((c) => (c[1] as { req: { after: number } }).req.after)).toEqual([0, 2, 3]);
    stop();
    await vi.advanceTimersByTimeAsync(5000);
    expect(invoke).toHaveBeenCalledTimes(3);
  });

  it("uses the timer's start as the session id", () => {
    expect(focusSessionId(1759400000000)).toBe("1759400000000");
  });
});
