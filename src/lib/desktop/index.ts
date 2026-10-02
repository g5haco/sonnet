// The desktop app's bridge (DESKTOP_ARCHITECTURE_SPEC.md §6). Browsers have none, so everything here is a no-op there.
type Internals = { invoke?: (command: string, args?: unknown) => Promise<unknown> };
const internals = () =>
  typeof window === "undefined" ? undefined : (window as unknown as { __TAURI_INTERNALS__?: Internals }).__TAURI_INTERNALS__;

export const inDesktop = () => typeof internals()?.invoke === "function";

// Tells the app a sign-in by emailed link is starting, so it will accept the link's callback. The app only
// allows this from /login, and ignores a callback it wasn't waiting for.
export const beginDesktopSignIn = () => {
  void internals()?.invoke?.("auth_begin").catch(() => {});
};
