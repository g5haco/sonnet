// After `next build`: the CSP allows next-themes' inline theme script by hash (src/lib/csp.ts). The hash depends
// on the bundled script, which can change with next-themes or Next upgrades, so check it against real output.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const expected = readFileSync("src/lib/csp.ts", "utf8").match(/THEME_SCRIPT_HASH = "([^"]+)"/)?.[1];
const html = readFileSync(".next/server/app/privacy.html", "utf8");
const theme = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).find((s) => s.includes("prefers-color-scheme"));
const actual = theme && `sha256-${createHash("sha256").update(theme).digest("base64")}`;

if (!expected || !actual || actual !== expected) {
  console.error(`CSP theme script hash is stale. src/lib/csp.ts has ${expected}; the build renders ${actual}.`);
  console.error("Update THEME_SCRIPT_HASH, or signed-in pages will lose the theme script once the CSP is enforced.");
  process.exit(1);
}
console.log("CSP theme script hash matches the build.");
