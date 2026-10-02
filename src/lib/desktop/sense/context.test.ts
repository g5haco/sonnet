import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bindContext, cleanContext, clearContexts, nextContext, sessionContext, setNextContext } from "./context";

beforeEach(() => {
  const store = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  });
});
afterEach(() => vi.unstubAllGlobals());

describe("session context", () => {
  it("keeps only known, bounded fields", () => {
    expect(cleanContext({ goal: "  mitosis quiz ", courseName: "BIOL 1610", x: 1, assignmentKind: "party" })).toEqual({
      goal: "mitosis quiz",
      courseName: "BIOL 1610",
    });
    expect(cleanContext({ goal: "a".repeat(500) }).goal).toHaveLength(200);
    expect(cleanContext(null)).toEqual({});
  });

  it("binds the picked context to a session once", () => {
    setNextContext({ courseName: "CHEM 1210", goal: "stoichiometry" });
    bindContext("1000");
    setNextContext({ courseName: "HIST 1700" });
    bindContext("1000"); // a reload of the same session
    expect(sessionContext("1000")).toEqual({ sessionId: "1000", courseName: "CHEM 1210", goal: "stoichiometry" });
    expect(nextContext()).toEqual({ courseName: "HIST 1700" });
    expect(sessionContext("2000")).toEqual({ sessionId: "2000" });
  });

  it("keeps the newest 30 sessions and clears", () => {
    for (let i = 1; i <= 35; i++) bindContext(String(i * 1000));
    expect(sessionContext("1000")).toEqual({ sessionId: "1000" });
    setNextContext({ goal: "x" });
    bindContext("99000");
    expect(sessionContext("99000").goal).toBe("x");
    clearContexts();
    expect(sessionContext("99000")).toEqual({ sessionId: "99000" });
  });

  it("survives broken storage", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => "{not json",
      setItem: () => {
        throw new Error("full");
      },
      removeItem: () => {},
    });
    expect(nextContext()).toEqual({});
    expect(() => bindContext("1")).not.toThrow();
  });
});
