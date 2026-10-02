import { expect, test } from "vitest";
import { csp, isStatic, makeNonce, THEME_SCRIPT_HASH } from "./csp";

const supabase = "https://x.supabase.co";

test("dynamic pages: nonce + strict-dynamic, no unsafe-inline scripts; desktop IPC allowed", () => {
  const p = csp({ nonce: "abc", dev: false, supabase });
  const scripts = p.split("; ").find((d) => d.startsWith("script-src"))!;
  expect(scripts).toBe(`script-src 'self' 'nonce-abc' '${THEME_SCRIPT_HASH}' 'strict-dynamic'`);
  expect(p).toContain(`connect-src 'self' ${supabase} wss://x.supabase.co ipc: http://ipc.localhost`);
  expect(p).toContain("frame-ancestors 'none'");
  expect(p).not.toContain("unsafe-eval");
});

test("prerendered pages keep inline scripts; dev adds eval for React's debugging", () => {
  expect(csp({ dev: false, supabase })).toContain("script-src 'self' 'unsafe-inline'");
  expect(csp({ nonce: "abc", dev: true, supabase })).toContain("'strict-dynamic' 'unsafe-eval'");
});

test("static routes are exact; nonces are fresh", () => {
  expect(isStatic("/landing")).toBe(true);
  expect(isStatic("/privacy")).toBe(true);
  expect(isStatic("/login")).toBe(false);
  expect(isStatic("/")).toBe(false);
  expect(isStatic("/landing/x")).toBe(false);
  expect(makeNonce()).not.toBe(makeNonce());
});

