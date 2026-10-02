import { describe, expect, it, vi } from "vitest";
import { createSemanticCache, openRouterProvider, parseVerdicts, prompt } from "./semantic";
import type { SemanticRequest } from "./types";

const req = (title: string): SemanticRequest => ({ context: { goal: "study mitosis", courseName: "BIOL 1610" }, app: "chrome.exe", title });
const reply = (content: unknown, ok = true) => vi.fn(async () => ({ ok, json: async () => ({ choices: [{ message: { content } }] }) }) as unknown as Response);

describe("openRouterProvider", () => {
  it("posts only the requests, with fallback models and temperature 0", async () => {
    const fetch = reply('[{"i":1,"label":"ON_TASK","confidence":0.9,"reason":"Fits."}]');
    const p = openRouterProvider({ apiKey: "k", baseUrl: "https://example.test/v1/", models: ["a", "b"], fetch });
    expect(p.local).toBe(false);
    expect(await p.classify([req("Mitosis - YouTube")])).toEqual([{ label: "ON_TASK", confidence: 0.9, reason: "Fits." }]);
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://example.test/v1/chat/completions");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer k");
    const body = JSON.parse(init.body as string);
    expect(body).toMatchObject({ models: ["a", "b"], temperature: 0 });
    expect(body.messages[1].content).toContain('"title":"Mitosis - YouTube"');
    expect(body.messages[1].content).toContain('Session context: {"goal":"study mitosis","courseName":"BIOL 1610"}');
  });

  it("rejects malformed items one by one", async () => {
    const content = "```json\n" + JSON.stringify([
      { i: 1, label: "DISTRACTING", confidence: 0.8, reason: "Game." },
      { i: 2, label: "MAYBE", confidence: 0.8, reason: "?" },
      { i: 3, label: "ON_TASK", confidence: 80, reason: "Out of range." },
      { i: 4, label: "ON_TASK", confidence: 0.7 },
      { i: 1, label: "ON_TASK", confidence: 0.9, reason: "Duplicate." },
      { i: 9, label: "ON_TASK", confidence: 0.9, reason: "No such item." },
    ]) + "\n```";
    const p = openRouterProvider({ apiKey: "k", models: ["a"], fetch: reply(content) });
    expect(await p.classify([req("1"), req("2"), req("3"), req("4"), req("5")])).toEqual([
      { label: "DISTRACTING", confidence: 0.8, reason: "Game." },
      null,
      null,
      null,
      null,
    ]);
  });

  it("any failure is all nulls", async () => {
    const two = [req("a"), req("b")];
    const cases = [
      reply("[]", false),
      reply("not json"),
      reply(null),
      vi.fn(async () => {
        throw new Error("offline");
      }),
    ];
    for (const fetch of cases) expect(await openRouterProvider({ apiKey: "k", models: ["a"], fetch: fetch as never }).classify(two)).toEqual([null, null]);
  });

  it("times out on its own and when the caller aborts", async () => {
    const hang = vi.fn(
      (_: unknown, init?: RequestInit) =>
        new Promise<Response>((_, reject) => init?.signal?.addEventListener("abort", () => reject(new Error("aborted")))),
    );
    const p = openRouterProvider({ apiKey: "k", models: ["a"], fetch: hang as never, timeoutMs: 10 });
    expect(await p.classify([req("a")])).toEqual([null]);
    const slow = openRouterProvider({ apiKey: "k", models: ["a"], fetch: hang as never, timeoutMs: 60_000 });
    const ac = new AbortController();
    const pending = slow.classify([req("a")], ac.signal);
    ac.abort();
    expect(await pending).toEqual([null]);
  });
});

describe("prompt and parsing", () => {
  it("numbers items and repeats context only when it differs", () => {
    const same = prompt([req("a"), req("b")]);
    expect(same).toMatch(/^Session context:/);
    expect(same).toContain('1. {"app":"chrome.exe","title":"a"}');
    expect(same).toContain('2. {"app":"chrome.exe","title":"b"}');
    const mixed = prompt([req("a"), { ...req("b"), context: {} }]);
    expect(mixed).not.toMatch(/^Session context:/);
    expect(mixed).toContain('"context":{}');
  });

  it("parseVerdicts tolerates prose around the array", () => {
    expect(parseVerdicts('Sure! [{"i":1,"label":"UNCERTAIN","confidence":0.3,"reason":" Hard  to tell. "}] Hope that helps.', 1)).toEqual([
      { label: "UNCERTAIN", confidence: 0.3, reason: "Hard to tell." },
    ]);
    expect(parseVerdicts('{"i":1}', 1)).toEqual([null]);
  });
});

describe("createSemanticCache", () => {
  it("is a bounded LRU that counts hits and misses", () => {
    const c = createSemanticCache(2);
    const v = { label: "ON_TASK" as const, confidence: 0.8, reason: "Fits." };
    c.set("a", v);
    c.set("b", v);
    expect(c.get("a")).toEqual(v); // a is now most recent
    c.set("c", v); // evicts b
    expect(c.get("b")).toBeUndefined();
    expect(c.get("c")).toEqual(v);
    expect(c).toMatchObject({ size: 2, hits: 2, misses: 1 });
    expect(createSemanticCache().size).toBe(0);
  });
});
