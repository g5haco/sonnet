// Content Security Policy, set per request in proxy.ts (DESKTOP_ARCHITECTURE_SPEC.md §7).
// Dynamic pages get a per-request nonce with 'strict-dynamic': Next stamps the nonce on its own scripts, and an
// injected inline script can't run. Prerendered pages (landing, privacy, terms, 404) were built with no request,
// so their inline bootstrap has no nonce; the listed ones keep 'unsafe-inline' rather than lose static rendering. The
// desktop app never grants native commands on those routes.

// Flip once real use (signed in, email links, actions, chat) shows no violations in the browser console.
export const ENFORCE = false;
export const CSP_HEADER = ENFORCE ? "Content-Security-Policy" : "Content-Security-Policy-Report-Only";

// Prerendered HTML routes ("/" signed out is rewritten to /landing). Keep in sync with the build's ○ routes.
// Known gap: the prerendered 404 (unknown URLs while signed in) gets the nonce policy, so once enforced it shows
// without JavaScript (its Home link is a plain link and still works). Making it dynamic would make every static
// page dynamic.
const STATIC = ["/landing", "/privacy", "/terms"];
export const isStatic = (path: string) => STATIC.includes(path);

// Web Crypto (no Buffer): proxy can run on the edge runtime.
export const makeNonce = () => btoa(crypto.randomUUID());

// next-themes' inline theme script, rendered by the root layout. Giving it the nonce would mean reading headers in
// the root layout, which makes every page dynamic, so it's allowed by hash. The hash is of the bundled script, so
// it can change with a next-themes or Next upgrade; `npm run build` checks it (scripts/check-csp-hash.mjs).
// `next dev` doesn't minify it, so dev reports that one script; judge the policy on a production build.
export const THEME_SCRIPT_HASH = "sha256-n46vPwSWuMC0W703pBofImv82Z26xo4LXymv0E9caPk=";

export function csp({ nonce, dev, supabase }: { nonce?: string; dev: boolean; supabase: string }) {
  const scripts = nonce ? `'self' 'nonce-${nonce}' '${THEME_SCRIPT_HASH}' 'strict-dynamic'` : "'self' 'unsafe-inline'";
  return [
    "default-src 'self'",
    `script-src ${scripts}${dev ? " 'unsafe-eval'" : ""}`,
    // Styles stay 'unsafe-inline': motion animates through style attributes, which nonces can't cover.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:", // Canvas descriptions embed images from school domains
    "font-src 'self' data:",
    // ipc: and ipc.localhost are the desktop shell's bridge (Tauri); browsers never use them.
    `connect-src 'self' ${supabase} ${supabase.replace(/^http/, "ws")} ipc: http://ipc.localhost`,
    "media-src 'self' blob:",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}
