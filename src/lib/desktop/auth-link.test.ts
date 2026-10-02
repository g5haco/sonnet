import { describe, expect, it } from "vitest";
import { desktopLink } from "./auth-link";

describe("desktopLink", () => {
  it("passes a code", () => {
    expect(desktopLink({ code: "3f2a-9B_c" })).toBe("sonnet://auth/callback?code=3f2a-9B_c");
  });

  it("ignores unrelated parameters", () => {
    expect(desktopLink({ code: "abc", utm: "x" })).toBe("sonnet://auth/callback?code=abc");
  });

  it("never forwards a token hash", () => {
    expect(desktopLink({ code: "a", token_hash: "b", type: "email" })).toBe("sonnet://auth/callback?code=a");
  });

  it("makes no link from anything else", () => {
    for (const p of [
      {},
      { code: "" },
      { code: "a b" },
      { code: "a&x=1" },
      { code: "<script>" },
      { code: ["a", "b"] },
      { token_hash: "b", type: "magiclink" },
      { code: "a".repeat(513) },
    ])
      expect(desktopLink(p), JSON.stringify(p)).toBeNull();
  });
});
