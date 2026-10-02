# Sonnet Desktop Architecture

> **Status: APPROVED for implementation.** This is the authoritative source of truth for Sonnet's web + desktop architecture. Approved by the user on 2026-10-01, against code at `f676d04`.
>
> **Basis:** the architecture comes from the Arena candidate `a016`, adopted by the user as the final decision. The Arena is closed. Every repo fact below was verified with Graphify and direct inspection, and the corrections from that verification are included.
>
> **Maintenance:**
> - Where this file and the code disagree on a *fact*, the code wins. Fix this file.
> - Change a decision tagged [Approved] only with the user's explicit OK.
>
> **Tags used below:**
> - **[Approved]**: a locked design decision. Not yet built.
> - **[Confirmed]**: a fact verified in the repo.
> - **[Platform test]**: a platform or service claim that still needs proof on real Windows/macOS (or the named service). Not a fact until tested.
> - **[User]**: a decision only the user can make.

---

## 1. Product Direction

- Sonnet stays a web app at `https://www.ericwei.me`. Nothing about the web product is removed or forked.
- Sonnet also ships as a desktop app for Windows (`Sonnet-Setup.exe`) and macOS (`Sonnet.dmg` / `Sonnet.app`).
- Web and desktop are **one product, one account, one data set**: the same Supabase project, the same deployment and the same UI.
- The desktop app adds native-only features, starting with **Focus Guardian** (detecting distraction during a focus session and stepping in safely).
- **Lecture Listener is deferred.** This spec only reserves a place for it (§6). It defines no work for it.

## 2. Selected Desktop Framework

**Tauri 2, used as a remote shell.**
- The desktop window loads the live hosted Sonnet site.
- A small Rust layer (`src-tauri/`) adds native capabilities.
- A typed TypeScript bridge (`src/lib/desktop/`) connects the two. [Approved]

**Why it won** [Approved, grounded in §3]

1. **Sonnet's server is not optional.**
   - It holds secrets, runs cron, streams AI, decrypts Canvas tokens and renders every signed-in page.
   - So any desktop design ends up as "hosted app + native layer". The only open question is which shell wraps it.
2. **Idle cost.** Tauri uses the OS webview (WebView2 or WKWebView), not a bundled Chromium plus Node. This matters because Focus Guardian keeps the app resident all day.
3. **Least privilege comes built in.**
   - Tauri capability files grant specific commands to specific windows and to specific remote URL patterns.
   - They are reviewable in a pull request.
   - Electron would need this boundary hand-built (`contextIsolation`, sandbox, preload, IPC validation).
4. **Electron's ease advantage mostly disappears.** Window detection, Accessibility and intervention need native code in either framework.
5. **Smaller installers** (about 5–15 MB, versus about 80–150 MB). These figures are estimates, not measured.

**Why the alternatives lost**

| Alternative | Reason |
|---|---|
| Electron, remote shell | Same shape and same reuse, but heavier at idle, ships its own Chromium, and needs hand-built least privilege. **The runner-up, and the fallback only if real macOS WebView testing exposes a blocking incompatibility** (see Limitations). |
| Tauri with a static Next export (`output: "export"`) | Would require rewriting 7 Server-Component pages, 38 Server Actions, the proxy and cookie auth as client code plus new APIs. That makes a second app. |
| Electron with a local Next server | The secrets can't ship in a binary, so the data still goes through Vercel. It would bundle Node and a server for no gain. |
| PWA (a `manifest.ts` already exists) | No window detection, intervention, global shortcuts or reliable background operation. |
| Wails, Flutter, native Swift/C# | Flutter and native UIs duplicate the UI. Wails has a smaller ecosystem and no permission model for remote pages. |

**Assumptions and limitations**

- **Online only.** The desktop app needs the internet, exactly like the web app. There is an offline page, not offline mode.
- **Direct download first.** No Microsoft Store and no Mac App Store, because the App Store sandbox blocks the Accessibility-based guardian. [Approved]
- **Two rendering engines:** Chromium on Windows (WebView2) and WebKit on macOS (WKWebView). Any WebKit bug Safari users hit today also hits the Mac app. Safari is untested today (see HANDOFF).
- **Electron is the fallback only.** Switch only if real macOS WKWebView testing exposes a blocking incompatibility that can't be fixed in web code. The bridge contract is framework-neutral, so switching replaces `src-tauri/` and one adapter file. [Approved]
- **No static-export rewrite**, ever, as a way into Tauri. [Approved]
- **Rust is new to the project.** It's estimated at about 1,000 lines for the foundation.
- **Development happens on Windows.** macOS builds come from CI, and a Mac (or a cloud Mac) is still needed for testing.

## 3. Current Repository Compatibility

### Confirmed facts (Graphify + inspection, `f676d04`)

| Area | Fact | Consequence |
|---|---|---|
| Next.js | Version `16.3.6`, React `19.2.8`. Middleware is `src/proxy.ts`. | The Next 16 docs in `node_modules/next/dist/docs/` apply. |
| Server Components | All 7 signed-in pages are async Server Components: `(app)/page.tsx`, `calendar`, `chat`, `courses`, `courses/[id]`, `flashcards`, `flashcards/[id]`. `(app)/layout.tsx` loads courses, items, meetings, settings and Canvas status on the server before rendering `AppShell`. | **Static export is blocked.** |
| Server Actions | `src/app/actions.ts` exports 38 async actions, imported by 18 modules. `src/app/login/actions.ts` exports `google`, `signUp`, `signIn` and `sendLink`. | Static export is blocked. Action IDs change on every build, so a long-lived window is exposed to deploy skew. |
| API routes | `api/chat`, `api/tasks`, `api/export`, `api/cal/[token]`, `api/cron/canvas` | They must stay hosted. That's fine for a remote shell. |
| Middleware | `proxy.ts` refreshes the Supabase session through `getClaims()`. It **rewrites a signed-out `/` to `/landing`**. It redirects signed-out visitors to `/login`, except on public paths (`/login`, `/landing`, `/auth`, `/api/cal`, `/api/cron`, `/f`, `/privacy`, `/terms`, plus metadata files). It has no rule for signed-in users. | A shell opening on `/` while signed out would show the marketing page. |
| Login page | `app/login/page.tsx` has **no redirect for users who are already signed in**. | The shell needs either a signed-in redirect or `/` as its post-login landing. |
| Auth | `@supabase/ssr` cookie sessions. `google`, `signUp` and `sendLink` build their redirect from `headers().get("origin")` to `/auth/confirm`. `/auth/confirm` handles both `code` (PKCE) and `token_hash`. **The Google button is disabled ("soon")**: the action exists but is not wired to the UI. | Password sign-in works in a webview as-is. Email links and Google need a system-browser handoff. |
| Supabase clients | `lib/supabase/server.ts` (SSR cookie client and `requireUser()`), `client.ts` (browser client, used only by `materials.tsx` and `work-view.tsx`), `admin.ts` (service role, reads `SUPABASE_SECRET_KEY` with a fallback to `SUPABASE_SERVICE_ROLE_KEY`). | The service-role key can never ship in a binary. |
| Env vars | Server-only: `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL`, `AI_VISION_MODEL`, `CANVAS_ENCRYPTION_KEY`, `CRON_SECRET`, `SUPABASE_SECRET_KEY` / `SUPABASE_SERVICE_ROLE_KEY`. Public: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. | All stay on Vercel. The desktop binary needs no env vars, only the origin URL. |
| Security headers | `next.config.ts` sends `Content-Security-Policy-Report-Only` with `script-src 'self' 'unsafe-inline'` and `connect-src 'self' <supabase> <supabase ws>`. Also `X-Frame-Options: DENY` and `Permissions-Policy: camera=(), geolocation=(), microphone=(self)`. `staleTimes.dynamic = 30`. | An enforced copy of this CSP would **not** block injected inline script, and it would block Tauri's IPC origin. |
| Deploy identity | There is no `deploymentId` in `next.config.ts`. | Nothing protects a window that outlives a deploy today. |
| Focus timer | `FocusProvider` lives in `components/focus-timer.tsx` and is mounted inside `components/app-shell.tsx`. The run is `{ start }` in `localStorage` key `sonnet-focus`, restored by `load()`. `toggle()` starts a run or stops it. **`finish()` clears the stored run before awaiting `logFocus`.** | **A durability bug:** any failed `logFocus` (a network error, a stale action ID, a closed window) loses that session. It must be fixed (§13, P1) before Focus Guardian depends on the timer. |
| HTML sinks | The only `dangerouslySetInnerHTML` is static JSON-LD on `/login`. Canvas HTML goes through `components/canvas-html.tsx`, which builds elements and avoids `dangerouslySetInnerHTML`. Chat uses `react-markdown` + `remark-gfm` **without** `rehype-raw`, so raw HTML is escaped. | The XSS surface is already small. Flashcard rendering is not yet audited. |
| Microphone | Chat dictation is feature-detected `SpeechRecognition` / `webkitSpeechRecognition` in `chat/chat-input.tsx`, and starting it also runs voice-glow's `useMicrophone` (the visual glow) on a microphone stream. | WebView2 (M2): `getUserMedia` works once the user allows it; speech recognition fails with `network`. WKWebView untested. |
| Browser-only state | `localStorage` holds the focus run, Quick note, Today's three and the tour flag. | It persists in the Tauri webview profile. |
| Repo | No `src-tauri/`, no `.vercelignore`, no Tauri dependency. Next docs present: `content-security-policy.md`, `static-exports.md`, `deploymentId.md`. | The project starts from zero on desktop. |

### What can stay shared

Everything that exists today: all pages, components, Server Actions, `lib/*`, the design system (`globals.css`, Geist, `components/icons.tsx`, `motion`), the Supabase clients, auth and the API routes. **Nothing is copied.**

### Implications

- **Routing:** the desktop start URL must be `/login`, not `/`, unless `/` gains other handling. [Approved]
- **Build:** `next build` is unchanged. `src-tauri/` is a separate build that Vercel never sees. [Approved]
- **Auth:** password sign-in works unchanged. Magic link, sign-up confirmation and Google need a deep-link handoff (§7). [Approved]
- **Supabase:** no schema change. RLS, storage and cascade deletes apply exactly as on the web. [Confirmed for current data; Guardian sync later would need a migration]

### Known blockers

1. **CSP:** `'unsafe-inline'` scripts mean an XSS could reach native commands. Before native commands beyond `app_info` and notify ship, the CSP must be nonce-based and enforced. [Confirmed problem; approved fix]
2. **Deploy skew:** stale Server Action IDs in a tray-resident window. [Confirmed problem; approved fix in §11]
3. **Focus-session durability:** `finish()` clears the persisted run before `logFocus` succeeds. This is a prerequisite reliability bug, fixed before Focus Guardian depends on the study timer (§13, P1). [Confirmed problem; approved fix]
4. **Signed-out `/` → `/landing`:** solved by the `/login` start URL plus a signed-in redirect. [Confirmed problem; approved fix]

### Still to verify

- Whether the project's Vercel plan supports Skew Protection (§11). [User]
- How the signed-in app behaves in WKWebView and Safari (never tested). [Platform test]
- Whether `SpeechRecognition` works in WebView2 and WKWebView. [Platform test]
- How flashcard text is rendered (not audited yet; a repo check in M0).

## 4. Target Architecture

```
Sonnet (one repo, one Next.js app, one Vercel deployment)
├── Hosted (unchanged): Vercel Next.js 16 + Supabase
│   ├── RSC pages · 38 Server Actions · /api/* · proxy.ts (+ nonce CSP) · cron
│   └── all secrets · AI · Canvas · metering · export/delete
├── Shared web code: src/  (pages, components, lib, design system, auth)
│   └── src/lib/desktop/   typed bridge; returns null in a browser
├── Web client: any browser → www.ericwei.me   (bridge = null; behaves as today)
└── Desktop client: Tauri 2 shell → loads www.ericwei.me
    ├── Main window   (WebView2 / WKWebView) start /login → / ; bridge on signed-in routes only
    ├── Overlay window  /desktop/overlay ; one command
    ├── Rust core (src-tauri/)
    │   ├── app · auth handoff · tray · shortcuts · notify · sound · store · log · updater
    │   ├── focus mirror (follows the web timer, never owns it)
    │   └── guardian: foreground watcher → rules → action ladder
    │       ├── windows.rs (Win32 events, UI Automation)
    │       └── macos.rs   (NSWorkspace, Accessibility)
    └── Local app data: rules.json, logs (never tokens, titles or domains)
```

**Data flow during a session:**
1. **Start:** the web Start button (or the tray, or a shortcut, routed to `toggle()`) starts the web run. The bridge calls `focus.started` and Rust arms the guardian.
2. **Drift:** a foreground change arrives as an OS event. Rust matches it against the rules, then shows a notice, the overlay, or hides the app (opt-in).
3. **End:** the web run ends, `finish()` calls `logFocus`, the bridge calls `focus.ended`, and the guardian disarms.

## 5. Shared vs Desktop-Only Boundaries

| Kind | Location | Rule |
|---|---|---|
| Shared React components | existing `src/components/` | Unchanged. No desktop branches inside them. |
| Shared feature/domain code | existing `src/lib/`, `src/app/actions.ts` | Unchanged. |
| Shared API/services | existing `src/app/api/`, Supabase | Unchanged. Hosted. |
| Web-specific code | `src/app/landing/`, `proxy.ts` CSP, public pages | The shell never grants native commands to these routes. |
| Desktop UI (web code, desktop-only) | new `src/components/desktop/` | Rendered **after mount** and only when `getDesktop()` returns a bridge that reports the needed capability. Loaded by dynamic import. |
| Desktop pages (web code) | new `src/app/desktop/overlay/page.tsx` (outside `(app)`), new `src/app/auth/desktop/page.tsx` | The overlay route is signed-in only. The handoff page is under the already-public `/auth`. |
| Bridge | new `src/lib/desktop/` (`bridge.ts` contract, one Tauri adapter, `useDesktop()`) | The only place that imports `@tauri-apps/api`, by dynamic import. |
| Native shell and adapters | new `src-tauri/` (Rust, `tauri.conf.json`, `capabilities/*.json`, icons, `offline.html`) | Never imported by web code. Ignored by Vercel, ESLint and Graphify. |

**Rules** [Approved]
1. Detect the desktop by capability (`bridge.has("guardian")`), never by user agent.
2. The server never branches on the desktop. The one exception is an explicit `client=desktop` form field on the auth actions, which changes only the email/OAuth redirect URL.
3. Render desktop UI only after mount. This keeps the project's "no hydration mismatches" rule.
4. Web bundle cost stays near zero (a dynamic import).

## 6. Native Capability Boundary

### Bridge contract (TypeScript, framework-neutral) [Approved]

```ts
export type DesktopBridge = {
  info(): Promise<{ shell: string; bridge: number; os: "windows" | "macos"; caps: string[] }>;
  has(cap: string): boolean;
  notify(n: { title: string; body: string }): Promise<void>;
  focus: {
    ready(running: boolean): Promise<void>;
    started(s: { startedAt: number; minutes: number }): Promise<void>;
    ended(): Promise<void>;
    onCommand(cb: (c: { type: "start" | "stop" }) => void): () => void;
  };
  auth: { begin(): Promise<void> };
  guardian: {
    getRules(): Promise<GuardianRules>;
    setRules(r: GuardianRules): Promise<void>;
    permission(): Promise<{ accessibility: "granted" | "denied" | "not-needed" }>;
    requestPermission(kind: "accessibility"): Promise<void>; // opens the OS settings pane
    onEvent(cb: (e: GuardianEvent) => void): () => void;
  };
  shortcut: { set(action: "toggle-focus" | "pause-guardian", accel: string | null): Promise<void> };
  updates: { check(): Promise<"none" | "ready">; install(): Promise<void> };
};
export function getDesktop(): Promise<DesktopBridge | null>; // null in any browser
```

**Principles:**
- Commands are intent-level. The page can say "a focus session started", never "minimize window X".
- Raw activity (app identity, titles, domains) stays in Rust memory. The web only receives outcomes.
- Rust validates every input and rejects unknown fields.
- The contract is versioned. The web supports the current bridge version and the one before it (N and N-1).

### Minimum native interfaces for Focus Guardian

| Capability | Rust module | Windows adapter | macOS adapter | Default |
|---|---|---|---|---|
| Active app/window detection | `guardian/` | `SetWinEventHook(EVENT_SYSTEM_FOREGROUND)`, event-driven, plus process exe | `NSWorkspace` activation notifications (bundle ID, no permission) | On (app identity only) |
| Accessibility / context (window title, browser domain) | `guardian/` | UI Automation | Accessibility API (permission-gated) | Opt-in. Domain only, never page content. |
| Screen capture fallback | future `capture.rs` | Windows.Graphics.Capture | ScreenCaptureKit | **Off. Not part of the foundation.** One window or region, user-started, processed locally. |
| Floating overlay | `overlay.rs` | Tauri window, always on top, no focus steal | same | Created per session |
| Notifications | notification plugin | toast | UNUserNotification | On |
| Sound | `sound.rs` | `PlaySoundW` (bundled chimes) | `NSSound` | On |
| Local app storage | store plugin | app data folder | app data folder | `rules.json` |
| Global shortcuts | global-shortcut plugin via `shortcuts.rs` | RegisterHotKey | Carbon hotkeys (no Input Monitoring) | None until the user picks one. Named actions only. |
| Safe Strict Mode intervention | `guardian/` action ladder | `ShowWindow(SW_MINIMIZE)`; skips elevated windows | `NSRunningApplication.hide()` | Opt-in |
| Background operation | tray, close-to-tray, autostart plugin | — | — | Autostart opt-in |
| Lecture Listener audio (deferred) | future `audio.rs` (`cpal`; WASAPI loopback / ScreenCaptureKit audio) | — | — | Not built |

**Action ladder (the safe-intervention ceiling):**
1. Notice: a notification and a chime.
2. Overlay with "Back to work", "5 more minutes" and "End session".
3. Hide the app (opt-in).

**Never:** kill processes, close windows or tabs, send keystrokes, block the network, or touch elevated windows.

Every step has a one-click override. A "pause guardian" control always works. At most one intervention per app every 2 minutes.

**Focus timer coupling:**
- The web timer is the single source of truth. Rust arms only after `focus.started`.
- Tray, shortcut and overlay "End session" call the existing `toggle()` through `focus.onCommand`.
- The timer's rules are not changed.

## 7. Security and Permissions

### Ring model [Approved]

| Ring | Can | Cannot |
|---|---|---|
| Rust core | The OS APIs listed in §6 | Read Supabase data or tokens; call Sonnet's server (except a page reload); run shell commands |
| Main window, signed-in routes only | Allowlisted commands in `capabilities/main.json` | File system, HTTP, shell, process spawn, raw OS calls |
| Main window on `/login` | `auth_begin`, `app_info` (`login.json`) | Everything else |
| Overlay window, `/desktop/overlay` only | `overlay_respond` and listening to its own event | Everything else |

- **No bridge on:** `/f/*` (other users' shared content), `/landing`, `/auth/*`, `/privacy`, `/terms`, or any `*.vercel.app` preview (opened in the system browser).
- **Never granted:** `fs`, `shell`, `http`, process spawn, clipboard, or arbitrary shortcut registration.
- **Development:** `dev.json` grants the same commands to `http://localhost:3000/*`, in debug builds only.

### Bridge safety requirements

1. **Enforced nonce CSP** (M0) [Approved]:
   - Move the CSP into `proxy.ts` with a per-request nonce: `script-src 'self' 'nonce-…' 'strict-dynamic'`, with no `'unsafe-inline'`. This follows Next's `content-security-policy.md`.
   - Add `ipc: http://ipc.localhost` to `connect-src`.
   - **Begin report-only.** Verify real app behavior (sign-in, sign-out, email links, Server Actions, chat streaming, public pages) before enforcing.
   - **Do not regress auth, Server Actions or public pages just to satisfy the CSP.** If nonces would degrade a public page (they force dynamic rendering of `/landing`, `/login`, `/privacy` and `/terms`), choose a narrower option, such as hashes or experimental SRI for that page, and record the choice.
   - **Native bridge privileges are not expanded beyond `app_info` and notify until the enforced CSP has been validated.**
2. **Rust validation:** every command validates its input, with one malformed-input unit test per command.
3. **Remote URL scoping:** capability `remote.urls` are path-scoped to exact routes, not the whole origin.
   - **Corrected by M1 (tested on Windows, Tauri 2.12.1):** this does not work. On the IPC protocol Tauri matches `remote.urls` against the request `Origin` header, which has no path. A path pattern never matches, and a root `/` pattern is treated as a wildcard. Capabilities therefore scope by **origin** only.
   - **Replacement rule:** every command takes the `Webview` and checks `webview.url().path()` against its own allowlist (`bridge_path_allowed` in `src-tauri/src/lib.rs`). The ring table above describes this per-command gate, not capability files.
   - **Limit (session 9 review):** `webview.url()` follows `history.pushState`/`replaceState`, so a script already running on a denied page of the same origin can change the path and pass the gate. The path gate stops the app's own code on those pages; **the origin is the real trust boundary**, held by the enforced CSP. Commands that return sensitive data are therefore kept narrow (`focus_sense_events` serves only the latest session).
4. **Navigation lock:** the main window can't leave `www.ericwei.me`. External http/https links open in the system browser. Other schemes are dropped.
5. **Deep links:** `sonnet://auth/callback` is accepted only while a one-use, 15-minute handoff is pending, with exact parameters (see the handoff flow below).
6. **Flashcard audit:** confirm flashcard text renders as text before the bridge ships. Canvas HTML and chat markdown are already safe (§3).

### Secrets that stay server-side [Confirmed list]

`AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL`, `AI_VISION_MODEL`, `CANVAS_ENCRYPTION_KEY`, `CRON_SECRET`, `SUPABASE_SECRET_KEY` / `SUPABASE_SERVICE_ROLE_KEY`.

The desktop binary contains **no** secrets. The only key it holds is the updater **public** key.

### Permission tiers (ask at the moment of use; nothing at install) [Approved]

| Tier | Feature | Windows | macOS | If denied |
|---|---|---|---|---|
| 0 | App identity, tray, shortcuts, sound, local data | none | none | n/a |
| 1 | Notifications | none | prompt on first use | overlay and sound only |
| 2 | Window titles, browser domain | none (UI Automation) | **Accessibility** (manual toggle in System Settings) | whole-app rules only |
| 3 | Hide the app | none (elevated windows skipped) | none | overlay only |
| Future | Screen capture | none (a capture border shows) | **Screen Recording** (toggle plus relaunch) | feature off |
| Future | Microphone | microphone privacy toggle | Microphone prompt + `NSMicrophoneUsageDescription` | feature off |
| Avoid | Apple Events, Input Monitoring, keystroke hooks | | | not used |

### Sign-in handoff [Approved]

1. **Marking the request as desktop:**
   - `login/form.tsx` adds a hidden `client=desktop` field after mount, only when a bridge exists.
   - `google`, `signUp` and `sendLink` then redirect to `${origin}/auth/desktop` instead of `/auth/confirm`.
2. **Starting the handoff:** the form first calls `bridge.auth.begin()`, which records a one-use pending handoff that expires in 15 minutes. Google opens in the system browser, and email links open there anyway.
3. **Bounce page:** `/auth/desktop` opens `sonnet://auth/callback?…`. It shows fallback text ("open this on the computer where Sonnet is installed").
4. **Accepting the link:** the shell accepts it only if a handoff is pending, the path is exact, and it carries exactly one of:
   - a `code` matching `^[A-Za-z0-9_-]+$`
   - a `token_hash` plus a `type` in {email, magiclink, signup}
5. **Finishing:** the shell navigates the main window to the existing `/auth/confirm`, which uses the webview's PKCE verifier.

**Why it's safe:**
- A forged `code` fails, because there is no matching verifier.
- A forged link with no pending handoff is ignored.

**Repo note:** Google is disabled in the UI today, so the handoff is needed for sign-up and magic link first. `google()` must become a form action before Google sign-in ships.

## 8. Windows Architecture

- **Runtime:**
  - A Tauri 2 process plus a WebView2 main window (Chromium, evergreen and OS-patched).
  - An overlay window created per session.
  - A Rust guardian on `SetWinEventHook`, which receives events and doesn't poll.
- **Packaging:** the Tauri NSIS bundler, per-user install (`installMode: "currentUser"`), so there is no admin prompt. x64 first; ARM64 on demand.
- **Installer:** CI renames `Sonnet_<ver>_x64-setup.exe` to **`Sonnet-Setup.exe`**. No Node, Rust, Python or terminal is needed on the user's machine.
- **WebView2:** `webviewInstallMode: downloadBootstrapper`. Switch to `embedBootstrapper` if installs fail on old Windows 10.
- **Native capabilities:** the `windows` crate for Win32 and UI Automation. Official plugins for tray, notifications, shortcuts, store, autostart, single-instance, deep-link and updater.
- **Uninstall:** a standard Apps entry, with optional local-data removal.
- **Limitations:**
  - **Unsigned builds:** SmartScreen shows "Windows protected your PC", and antivirus may flag an unsigned window watcher. The download page must explain both.
  - Elevated windows can't be minimized and are skipped.
  - Browser-domain reading through UI Automation is fragile across browser versions.

## 9. macOS Architecture

- **Runtime:** a Tauri 2 process plus a WKWebView main window (WebKit, updated with macOS), plus an overlay window and an `NSWorkspace`-based watcher.
- **Packaging:** `Sonnet.app` inside **`Sonnet.dmg`**, as a universal binary (`universal-apple-darwin`), built on GitHub Actions `macos-latest`. Minimum macOS 12. [Approved]
- **Native capabilities:** `objc2` bindings to AppKit and Accessibility. `NSSound`. Carbon hotkeys. A transparent overlay needs `macOSPrivateApi`, which rules out the Mac App Store.
- **Permissions:**
  - Accessibility (tier 2) is a manual toggle in Privacy & Security.
  - Screen Recording (future) requires a relaunch.
  - The Microphone prompt (future) needs `NSMicrophoneUsageDescription` plus the `com.apple.security.device.audio-input` entitlement under the hardened runtime.
  - Info.plist keys and entitlements are added only when a feature needs them.
- **Signing and notarization (later):**
  - Requires an Apple Developer ID ($99 a year), the hardened runtime, and `notarytool` in CI. No code changes.
  - Until then, builds are ad-hoc signed (required on Apple Silicon). Users click Open Anyway in Privacy & Security.
- **Limitations:**
  - **Ad-hoc-signed apps lose the Accessibility grant on every update.** A Developer ID is required before tier 2 reaches real users. [Platform test]
  - WebKit rendering differences, untested today.
  - System-audio capture needs macOS 13 or later (Lecture Listener only).

## 10. Web Compatibility

- The web app is the same deployment. A browser gets `getDesktop() === null`, so:
  - no desktop UI renders: no broken or disabled controls, and no "desktop only" teasers unless deliberately designed;
  - the `client=desktop` field is never added, and auth behaves exactly as today;
  - `@tauri-apps/api` is never loaded.
- Every web edit in the plan is also correct for browsers:
  - the `/login` signed-in redirect;
  - the nonce CSP;
  - `focus-timer.tsx` bridge calls that do nothing without a bridge.
- `next build`, `npm test`, `tsc` and `eslint` must pass at every milestone. `src-tauri/` is excluded from Vercel, ESLint and Graphify.
- Desktop-only features reuse shared UI: Guardian settings use the existing design system and components. Only the native data source differs.

## 11. Packaging and Updating

- **Windows:** NSIS per-user, then `Sonnet-Setup.exe`, built by CI on a `desktop-v*` tag. Unsigned at first.
- **macOS:** universal `.app` inside `.dmg`, then `Sonnet.dmg`, built by CI on the same tag. Ad-hoc signed at first.
- **Future signing:**
  - Windows: Azure Trusted Signing or an OV certificate, added as CI secrets.
  - macOS: Developer ID plus notarization.
  - No code changes are needed for either.
- **Future auto-update** [Approved]. There are two channels:
  - **Web:** `git push` to Vercel, as today. All UI and logic ship this way, daily.
  - **Shell:** the Tauri updater plugin, for Rust, capabilities and bridge-version changes. These are rare.
    - Updates are signed with a minisign keypair (mandatory and independent of OS signing): the private key in CI, the public key in `tauri.conf.json`.
    - **Update source: GitHub Releases at first**, unless implementation evidence shows a material blocker. The manifest is a static `latest.json` attached to the release. [Approved]
    - **Keep the source abstract:** the updater endpoint URL is set once in `tauri.conf.json` (`plugins.updater.endpoints`) and read nowhere else. Moving to another CDN means changing that URL and the CI upload step, with no app-code change. [Approved]
    - It checks on launch and every 6 hours, downloads in the background, and installs on "Restart to update" or on quit.
- **Deploy-skew protection** (required, because Server Action IDs change on every build) [Approved]:
  1. **Vercel Skew Protection, where supported.** Do not assume it is available. Current Vercel documentation limits Skew Protection to Pro and Enterprise plans. If this project is on a supported plan, enabling it is the **preferred** mitigation. If not, layers 2–4 are the mitigation, and implementation is **not** blocked. [User: confirm the plan]
  2. **Reload on show:** if the main window was hidden for 15 minutes or more, or after the system wakes, the shell reloads it.
  3. **Pre-end reload:** if a session is armed and the window is hidden, the shell reloads it 60 seconds before the mirrored end time. `load()` restores the run, and `finish()` then calls `logFocus` on fresh code.
  4. **Bridge-version handling:** the web supports bridge versions N and N-1, and shows "update the app" for older shells (§6).

  Layers 2–4 work on any Vercel plan. They reduce skew. They do not replace the durability fix (P1), because `finish()` clears the stored run before `logFocus` succeeds [Confirmed].

## 12. Focus Guardian Readiness

Focus Guardian work starts only when **every** item below passes on Windows 11 (and Windows 10 22H2) **and** macOS 12+, unless noted. [Approved]

**Background execution**
1. Closing the window keeps the app in the tray. Tray → Quit exits. A second launch focuses the existing window.
2. Autostart (opt-in) launches the app hidden at login.
3. **Idle cost:** no session, window hidden, after 10 minutes. Average CPU at or below 1%, and total memory (shell plus webview processes) at or below 250 MB. **During a session:** average CPU at or below 2%. Measured in Task Manager and Activity Monitor.

**Native context collection**
4. The foreground watcher is event-driven and reports app-identity changes within 500 ms, with no OS permission.
5. Window title and browser domain work after an Accessibility grant on macOS (no grant needed on Windows). Denial is reported as `denied`, and the guardian falls back to whole-app rules.

**Local storage**
6. Rules persist in the app data folder across restarts and across a shell update from N to N+1.
7. No Supabase token or secret is stored outside the webview profile. Logs contain no titles or domains.

**Overlay**
8. The overlay appears within 300 ms of a rule match, stays on top, and doesn't take keyboard focus until clicked. Its "End session" stops the web run, and the session is logged (or dropped if under one minute) exactly like the web Stop button.

**Notifications and sound**
9. A notification and a chime fire with every window hidden.

**Permission handling**
10. Nothing is requested at install. Each permission is requested only after Sonnet's own screen explains why. Every denial degrades as described in §7.

**Platform adapter pattern**
11. All OS calls live in `guardian/windows.rs` and `guardian/macos.rs` behind one Rust trait. The bridge contract is identical on both platforms.
12. `app_info` reports the shell version, bridge version and capabilities. The web hides desktop UI without a bridge and shows "update the app" when the bridge is too old.

**Security boundary**
13. The CSP is **enforced**: `script-src` has a nonce and no `'unsafe-inline'`, and `connect-src` includes `ipc: http://ipc.localhost`. An injected inline script is blocked, and bridge calls cause no CSP violations.
14. A test `invoke` is refused on `/f/<code>`, `/landing`, `/privacy`, `/terms`, `/auth/desktop` and a `*.vercel.app` preview. No capability file grants `fs`, `shell`, `http` or process spawn. Every command rejects malformed input (unit tested).
15. A forged `sonnet://` link signs no one in.

**Timer integration and skew**
16. A session started from the web button, the tray or the shortcut is the same single web run. It arms the guardian, logs through `logFocus`, and disarms the guardian at its end even if the window stayed hidden.
17. **Skew test:** start a session, hide the window, deploy a web change, and wait for the end. The session is logged. Then reopen from the tray: the first Server Action succeeds.

**Safe future Strict Mode integration**
18. "Hide app" minimizes or hides the app and never closes it. Elevated windows are skipped without error. A "pause guardian" shortcut works with the app hidden and disarms immediately. The action-ladder ceiling (§6) is enforced in Rust, not in web code.

**Install, auth and regression**
19. Unsigned `Sonnet-Setup.exe` and `Sonnet.dmg`, built by CI from a tag, install on clean machines with no developer tools. A tampered update is rejected.
20. Password sign-in, sign-up confirmation and magic link all end signed in **inside** the app. First launch opens `/login`, never `/landing`. Browser auth is unchanged.
21. `privacy/page.tsx` describes what the desktop app observes and states that it stays on the device.
22. Web: `npm test`, `tsc`, `eslint` and the Vercel build pass, and a browser session behaves as before, including the focus timer. One reviewer pass over the diff, with findings fixed.

**Focus-session durability**
23. P1 has shipped: a failed `logFocus` (offline, stale action, server error) no longer loses the session. The run is kept or queued and logged once, never twice, and this is covered by a unit test.

## 13. Migration Plan

Each milestone ships on its own and keeps the web app working.

**Ordering rules:**
- M0 starts first.
- Native bridge privileges beyond `app_info` and notify are not granted until M0's **enforced** CSP has been validated.
- M1, M2, M4 and M5 grant no command beyond `app_info` and notify, so they may proceed while M0's CSP is still in report-only. M3 adds `auth_begin`, so it waits for the validated enforced CSP.
- P1 must ship before M6 wires the focus timer to the bridge.

### M0. Web prerequisites (no desktop code)
- **Goal:** clear the web-side blockers from §3: the CSP, the signed-out landing problem, and the deploy-skew decision.
- **Files:**
  - `src/proxy.ts` (nonce CSP, report-only first)
  - `next.config.ts` (remove the static CSP header once the proxy sends it)
  - signed-in redirect from `/login` to `/` (implemented in `src/proxy.ts`, not `login/page.tsx`: it reuses the proxy's `getClaims` result and carries refreshed cookies)
  - Vercel Skew Protection setting (only if the plan supports it)
  - a flashcard-rendering check (renders as text)
  - a Safari/WebKit pass over the signed-in app
- **Risks:**
  - The nonce CSP breaks an inline or third-party script.
  - Public pages lose static rendering.
  - Auth or Server Actions regress.
- **Done when:**
  - The nonce CSP runs in report-only. Real app behavior is verified (sign-in, sign-out, email links, Server Actions, chat streaming, public pages) with no unexplained violations. Only then is it enforced.
  - No regression in auth, Server Actions or public pages was accepted to satisfy the CSP.
  - A signed-in visit to `/login` goes to `/`.
  - The Vercel plan is checked. Skew Protection is enabled if supported, or recorded as unavailable, which does not block later milestones.
  - Safari blockers are fixed or listed.
- **Tests:** `npm test`, `tsc`, `eslint`, a Vercel preview build. Manually: sign in and out, use a magic link, run a Server Action, stream a chat, load the public pages, and check the console for CSP reports. After enforcing, an injected inline `<script>` on a preview is blocked.
- **Rollback:** revert the commit. The CSP falls back to the current report-only header, and the login redirect is 2 lines.
- **Needs user OK:** proxy and CSP change, auth-page change, Vercel setting.
- **Implementation facts (2026-10-02)** [Confirmed]:
  - **Where the policy lives:** `src/lib/csp.ts` builds it and `src/proxy.ts` sets it on both the request and the response. Next reads the nonce from the request header, including `Content-Security-Policy-Report-Only`. `ENFORCE = false`.
  - **Prerendered pages:** `/landing` (and signed-out `/`), `/privacy` and `/terms` get a policy without a nonce that keeps `'unsafe-inline'`, so they stay static. This is the narrower option allowed in §7. No native command is ever granted on these routes.
  - **Theme script:** the `next-themes` inline script in the root layout is allowed by `sha256` hash. A nonce would require reading headers in the root layout, which makes every page dynamic. `npm run build` runs `scripts/check-csp-hash.mjs`, which fails the build if the hash drifts. `next dev` doesn't minify that script, so dev reports it; judge the policy on a production build.
  - **Known gap:** the prerendered 404 (an unknown URL while signed in) gets the nonce policy, so once enforced it renders without JavaScript. Its Home link still works. Making it dynamic made every static page dynamic, so that fix was rejected.
  - **Skew Protection:** not active on production. Live asset URLs have no `?dpl=` marker, and HANDOFF records Vercel Pro as not yet bought. The §11 fallback applies.

### P1. Focus-session durability fix (prerequisite, before M6)
- **Goal:** a failed `logFocus` must not lose a session. Today `finish()` in `components/focus-timer.tsx` clears the persisted run (`store(null)`) before `logFocus` returns. [Confirmed]
- **Files:** `src/components/focus-timer.tsx`, possibly a small helper in `src/lib/`.
- **Approach:** keep the run, or a pending-log record, in `localStorage` until `logFocus` succeeds. Retry it on the next load. Make sure the same session is never logged twice.
- **Risks:**
  - Double-logging on retry.
  - Changing focus-timer behavior, which needs the user's OK per HANDOFF.
- **Done when:**
  - Stopping a session while offline, or with a failing action, keeps it. It is logged exactly once after recovery.
  - The normal path behaves exactly as today (length, the one-minute minimum, toasts).
- **Tests:** a unit test for the failure → retry → single-log path, plus a manual offline stop.
- **Rollback:** revert the commit, which restores today's behavior.
- **Needs user OK:** focus-timer change.
- **Implementation facts (2026-10-02)** [Confirmed]:
  - **Queue:** `sonnet-focus-pending` in `localStorage`, with an in-memory fallback when storage is blocked. Sessions go through `enqueue` and `flush` in `src/lib/focus.ts`.
  - **When it retries:** on mount and on the `online` event, serialized across tabs with a Web Lock.
  - **Server side:** `logFocus` returns success if a row with the same `started_at` already exists. It marks invalid sessions `final`, so they're dropped instead of retried.
  - **Not covered:** two requests racing past the server's check-then-insert. The lock covers the realistic case; a unique index would need a migration.

### M1. Desktop shell
- **Goal:** a Tauri window that loads the site.
- **Files:**
  - new `src-tauri/` (main window, start URL `/login`, localhost in debug)
  - navigation lock, external links to the system browser, `offline.html`
  - single instance, window state, tray, close-to-tray, reload-on-show, log
  - `package.json` scripts `desktop:dev` / `desktop:build`
  - `.gitignore` (`src-tauri/target/`), new `.vercelignore`, ESLint and Graphify ignores
- **Risks:**
  - Rust toolchain setup on Windows.
  - A WebView2 quirk.
- **Done when:** `npm run desktop:dev` opens Sonnet locally, password sign-in lands on `/`, external links open the browser, and the offline page shows with Wi-Fi off.
- **Tests:** manual smoke test. `next build` is unaffected.
- **Rollback:** delete `src-tauri/` and the scripts. The web is untouched.
- **Needs user OK:** Rust crates, the `@tauri-apps/cli` dev dependency. *(Given 2026-10-02.)*
- **Implemented (session 8).** Facts from the build and the Windows run:
  - **Shell:** `src-tauri/src/lib.rs`. One window `main`, created in Rust. Debug loads `http://localhost:3000/login`; release loads `https://www.ericwei.me/login`. Debug-only env overrides: `SONNET_DESKTOP_ORIGIN` (test the offline page), `SONNET_DESKTOP_STALE_SECS` (test reload-on-show).
  - **Navigation lock:** same-origin and `about:blank` stay in the window. Other `http(s)` URLs, including `window.open` and `target=_blank`, go to the system browser. Every other scheme is dropped. Logs hold the origin only, never the path or query (they can carry sign-in tokens). 9 unit tests (lookalike hosts, hostile offline URLs, the path gate, the capability shape).
  - **Offline page:** `src-tauri/offline/offline.html`, served by a custom protocol (`sonnet-offline`, `http://sonnet-offline.localhost` on Windows) so it works under `tauri dev` too. It polls the site root every 5 s and on the `online` event (never the return page itself, so a one-use link isn't consumed), and returns to the page it came from. Shown when a TCP probe to the site fails at startup or on show. The lock accepts only the shell's own URL for it (exact host, no port, path `/`, one `to` that is a page of the site); site content linking to it any other way is dropped.
  - **`window.open`:** only a real site page replaces the window. `about:blank` (what `window.open('')` sends) is denied. `target=_blank` links to other sites open in the system browser. This needed `tauri-plugin-opener`'s own click handler turned off (`open_js_links_on_click(false)`): it swallows those clicks and then fails the ACL check.
  - **Reload-on-show:** hidden for 15 minutes or more, then reload. The hide time is wall-clock (`SystemTime`), because `Instant` stops during sleep on macOS. Always runs the probe, so a window left on the offline page recovers on show. **Not implemented:** reload after system wake while the window is visible.
  - **Lifecycle:** single instance (a second launch shows the window), window state saved on hide (size, position, maximized, fullscreen; not visibility), close hides to the tray, tray left-click toggles, the tray menu has Open and Quit, and a macOS dock click shows the window. Log file: `%LOCALAPPDATA%\me.ericwei.sonnet\logs\sonnet.log` (3 files of 1 MB).
  - **Native surface:** one command, `app_info` (`{shell, bridge: 1, os, caps: []}`). `tauri-plugin-opener` is initialised for Rust use only; its commands are denied to pages (tested). Same for the window-state plugin.
  - **Capability:** `capabilities/main.json` grants `allow-app-info` to `https://www.ericwei.me`, `local: false`. Debug builds add a `dev` capability at runtime. See the correction under §7 item 3: path rules are enforced by `bridge_path_allowed` (denies `/f`, `/landing`, `/auth`, `/privacy`, `/terms`).
  - **Tauri treats the dev URL as a local origin,** so under `tauri dev` the localhost page is "local", not remote.
  - **Packaging:** `npm run desktop:build` produced `Sonnet_0.1.0_x64-setup.exe` (1.44 MiB, NSIS, per-user) and a 4.4 MB `sonnet-desktop.exe`. The installer was built but not installed. `bundle.targets` is `["nsis","app","dmg"]`. Windows built only NSIS, with no error. The first NSIS build downloads Tauri's NSIS tooling.
  - **Dependencies:** see the table below.
  - **Not covered by M1 (known):**
    - A load that fails after the TCP probe succeeds (HTTP 5xx, a connection that drops mid-load) shows WebView2's own error page, not the offline page.
    - Icons are upscaled from the 512 px web mark. Regenerate from a 1024 px source before release.
    - macOS is configured but never built or run.
    - No code signing, no auto-update, no Skew Protection.
    - The tray's right-click menu and a physical tray click were not exercised; the left-click handler was driven with the tray's own window message.

  | Dependency | Version | Purpose | License | In the shipped app |
  |---|---|---|---|---|
  | `@tauri-apps/cli` (npm, dev) | 2.12.1 | `tauri dev` / `tauri build` | Apache-2.0 OR MIT | No |
  | `tauri` (crate) | 2.12.1 | The shell and webview. Feature `tray-icon`. | Apache-2.0 OR MIT | Yes |
  | `tauri-build` (build dep) | 2.7.1 | Build script, app-command permissions | Apache-2.0 OR MIT | No |
  | `tauri-plugin-single-instance` | 2.5.2 | One running copy | Apache-2.0 OR MIT | Yes |
  | `tauri-plugin-window-state` | 2.5.0 | Remember size and position | Apache-2.0 OR MIT | Yes |
  | `tauri-plugin-log` | 2.10.0 | Log file and console | Apache-2.0 OR MIT | Yes |
  | `tauri-plugin-opener` | 2.7.0 | Open external links in the system browser (Rust only, no page access) | Apache-2.0 OR MIT | Yes |
  | `log` | 0.4.34 | Log macros | MIT OR Apache-2.0 | Yes |
  | `serde` | 1.0.229 | Serialise `app_info` | MIT OR Apache-2.0 | Yes |

  The Rust lockfile resolves 467 packages in total, about 219 of them on the Windows runtime path. Their licenses weren't audited. Run `cargo-deny` or an equivalent before the first public release.

### M2. Shared app boot
- **Goal:** prove the full app runs unchanged inside the shell.
- **Files:** none expected, apart from fixes for webview-specific breakage.
- **Risks:**
  - WebKit differences on macOS.
  - Autoplay or `AudioContext` policy for focus noise.
  - `SpeechRecognition` missing in a webview.
- **Done when:** all 7 signed-in pages, chat streaming, Canvas sync, file upload, export download and the focus timer work in WebView2. The mic button hides where `SpeechRecognition` is missing.
- **Tests:** the manual page checklist, and a console free of new errors.
- **Rollback:** revert the individual fixes.
- **Implemented (session 8, Windows/WebView2 only).** Signed in as the user, in the shell against a local dev server and a local production build. Facts:
  - **Worked unchanged:**
    - Pages: Home, Courses, a course with its work list, an assignment's detail panel, Calendar, Chat, Flashcards and a deck, the Settings window and the Sync window.
    - Session: a password sign-in persisted across a full app restart (the shell went from `/login` straight to `/`).
    - Data flows: chat answers streamed incrementally as NDJSON; a materials upload went browser to Supabase storage and was listed; the export link saved `sonnet-export-<date>.json` to Downloads with no dialog; the Canvas "Sync now" server action round-tripped.
    - Focus timer: the run was restored after a reload, and a stop after more than a minute logged ("1 min logged", `logFocus` completed, the pending queue emptied). This is the P1 success path, now seen signed in.
    - Lifecycle: close-to-tray and a long-hide reload kept the session; clipboard `writeText` works.
  - **Incompatibilities found and fixed:**
    1. **Materials did nothing on click.** `materials.tsx` calls `window.open("", "_blank")` and later sets the tab's location. The shell denies `about:blank` windows (M1), so the call returned null and the code silently did nothing. Fix, shared and two lines: when no blank tab is granted, open the signed URL with `window.open(url, "_blank", "noopener")`. In the shell that reaches `on_new_window` and opens the system browser. Browsers that grant the blank tab behave exactly as before.
    2. **File drops from Explorer reach no drop zone.** By default Tauri replaces WebView2's drop handler on Windows (its docs: `disable_drag_drop_handler` "is required to use HTML5 drag and drop APIs on the frontend on Windows"). The chat and materials use HTML5 drop zones. Fix: `.disable_drag_drop_handler()` in `build_main_window`. **Not verified with a real OS drop** (Explorer automation was refused and a scripted OLE drag never started). Indirect evidence only: the set of native windows with an OLE drop target changed, to the plain Chromium registration. A file dropped outside a zone will try `file://`, which the navigation lock drops. Test by dragging a file into the chat box.
  - **Dictation:** `SpeechRecognition` and `webkitSpeechRecognition` both exist in WebView2, so the mic button shows. `start()` fires `audiostart` and then `error: "network"`, the same failure as Brave. The existing handler shows a toast ("This browser doesn't offer speech recognition… Win + H") and the app stays usable. Not changed: the button stays and the toast says "browser". WebView2's default asks the user for the microphone at the moment of use (the stored allow decision for `localhost:3000` was set by the user's click).
  - **Not caused by WebView2:** React error #418 (a hydration mismatch) on every signed-in page of a production build. It comes from the `MetalFx` send button (server renders its fallback, the client renders the canvas), and the built-in Chromium browser logs the same mismatch on a mock page.
  - **Audio and timers while hidden to the tray** (12 s): an `AudioContext` stayed `running`, its clock advanced and a 1 s interval kept ticking. `document.visibilityState` stays `visible` when the window is hidden. No throttling was seen. Longer hides weren't measured. The audible output itself wasn't heard.
  - **Downloads:** the file saves silently. Whether WebView2 shows its own download flyout wasn't observable.
  - **Clipboard:** `readText` hangs on a permission prompt. The app never calls it.
  - **Not tested:** a real Canvas import (the hourly limit was already used, and the local server has no `SUPABASE_SECRET_KEY`), the native file-picker dialog, sign-out, Safari/WebKit, a physical drag-and-drop.
  - **Test-harness note:** a pending WebView2 permission bubble shows up as a second `page` target on the debug port. Pick the target with the large viewport, or a script will drive the bubble.

### M3. Auth and data verification
- **Goal:** sessions and data behave identically to the browser, and email-based sign-in works.
- **Files:**
  - new `src/app/auth/desktop/page.tsx`
  - `src/app/login/form.tsx` (hidden `client` field)
  - `src/app/login/actions.ts` (redirect choice)
  - `src-tauri` `auth.rs` and the deep-link plugin
  - the Supabase redirect allowlist entry
- **Risks:**
  - PKCE verifier cookie scoping between the webview and the callback.
  - The deep-link scheme registration differs per OS.
- **Done when:**
  - Quit and relaunch keeps the session.
  - Sign-up confirmation and magic link complete inside the app.
  - A forged `sonnet://` link is ignored.
  - Browser auth is unchanged.
  - RLS returns the same data as the browser for the same account.
- **Tests:** a manual auth matrix in the desktop app and the browser, the forged-link test, and existing unit tests.
- **Rollback:** remove the `client` field. The actions fall back to `/auth/confirm`.
- **Needs user OK:** auth change, Supabase redirect URL.
- **Precondition:** M0's enforced CSP is validated. *(Met in session 8, see below.)*
- **Implemented (session 8, Windows).** The handoff in §7 is built as specified, with these facts:
  - **Pieces:**
    - `src-tauri/src/auth.rs`: the parser for `sonnet://auth/callback` (exactly one `code`; characters `[A-Za-z0-9_-]` up to 512; no extra parameters, fragment, port or user info) and the pending state (`Handoff`: memory only, one use, 15 minutes, a backwards clock counts as expired).
    - `auth_begin` in `lib.rs`: the second native command, refused unless the webview's real URL is a page of the site with path `/login`.
    - A `sonnet://` handler: accepts a callback only if the parser passes and a handoff is pending, then navigates the main window to the site's own `/auth/confirm` with those parameters. Logs never carry the code.
    - Web: `src/lib/desktop/index.ts` (bridge detection and `beginDesktopSignIn`, no `@tauri-apps/api`), `src/lib/desktop/auth-link.ts` (the same rules, unit-tested), `src/app/auth/desktop/` (the public bounce page), a hidden `client=desktop` field in `login/form.tsx` (added after mount, only inside the app), `login/actions.ts` choosing `/auth/desktop` or `/auth/confirm`.
  - **Only a PKCE `code` is handed over, never a `token_hash`.** This departs from the §7 text, on the reviewer's finding: a code is redeemable only with the verifier this webview holds, so a code an attacker made fails, but a `token_hash` would sign the victim in as whoever made it (it matters if the email template is ever switched to `token_hash`). `/auth/confirm` still accepts `token_hash` for browsers.
  - **Browser behavior is unchanged:** no field, no bridge, the same redirect.
  - **The email is a PKCE link.** Supabase's default template sends `…/auth/v1/verify?token=pkce_…&type=magiclink&redirect_to=<origin>/auth/desktop`, then redirects to `redirect_to?code=<code>`. That code can only be redeemed with the verifier cookie the webview holds, which is why the system browser can't finish the sign-in.
  - **Verified end to end** (dev origin, real email): request a link from `/login` in the app, follow it as a browser would, `/auth/desktop` renders the `sonnet://` link, the OS starts a second instance, single-instance forwards the URL, the app accepts it and lands on `/` signed in. This also confirms the PKCE verifier cookie is still valid when the deep link returns (§15).
  - **Forged and edge cases:** a malformed callback, a wrong host and an extra parameter are ignored and the page doesn't change. A well-formed callback with **nothing pending** (a link opened after 15 minutes, after quitting the app, or on a cold start) is not used: the window is shown on `/login?expired=1` ("That link expired or was already used", or `/` if still signed in). With a handoff pending, a well-formed forged code is accepted by the gate, fails redemption, and shows "That link expired or was already used." A second callback is then treated as having nothing pending (one use). A spent link redirects to `/auth/desktop?error=otp_expired`, which shows the same message. `auth_begin` is refused on `/` and allowed on `/login`. 13 Rust tests and 4 web tests cover the rules. The last end-to-end run with a real emailed link used the version before the code-only change; after it, a forged code exercised the accepted and late paths, and Supabase's email rate limit blocked a third real link.
  - **Cold start:** launching by link when the app isn't running starts the app and shows the expired message (the pending state is memory-only), so a link clicked after quitting the app needs a fresh request. Supabase links last about an hour, longer than the 15-minute window.
  - **Registration:** the config registers `sonnet` in the NSIS installer (per user, HKCU, removed on uninstall). A debug build registers itself only when `SONNET_DESKTOP_REGISTER_SCHEME` is set, because that points the user's `sonnet://` links at the dev exe.
  - **Supabase change needed, not applied.** Authentication, URL Configuration, Redirect URLs: add `https://www.ericwei.me/auth/desktop`. `http://localhost:3000/auth/desktop` was already honored in the dev test. The email template stays the default. **The live site also has to be deployed** (the `/auth/desktop` route, and the code below), or an installed app's email links land on a missing page.
  - **Not tested:** sign-up confirmation (it uses the same path and would create an account), Google (disabled in the UI; the `google` action never sends `client=desktop`, and `form-action 'self'` would need a check when it ships), macOS.
  - **New dependencies:** `tauri-plugin-deep-link` 2.6.1 (registers the scheme and delivers the URL; Apache-2.0 OR MIT; ships), `serde_json` 1.0.151 (needed by `generate_context!` once a `plugins` config exists, already in the tree via Tauri; MIT OR Apache-2.0; ships), and the `deep-link` feature of `tauri-plugin-single-instance` (forwards a second launch's URL).
- **CSP enforced (session 8).** `ENFORCE = true` in `src/lib/csp.ts`. Basis: a production build, signed in, in the desktop app, with a `securitypolicyviolation` listener. A control (a cross-origin `fetch` and an iframe) did report `connect-src` and `frame-src`, so the listener works. Zero violations on: Home, Courses, a course, an assignment panel, Calendar (week and month), Flashcards, Chat plus a streamed answer, Settings, Sync, the focus timer, a materials upload and delete, the export download, the signed-in `/login` redirect and a bogus auth callback; signed out: `/login` (all modes), `/landing`, `/privacy`, `/terms`, a missing `/f/` code, `/auth/desktop`, a 404. The sweep was repeated after enforcing, with the same result and every flow working. **Not covered:** Vercel itself (nothing deployed), Google OAuth, the prerendered 404 while signed in (the known gap).
- **Native bridge:** `auth_begin` is the only privilege added, and only after the enforced policy was validated, as §16 requires.

### M4. Windows packaging proof
- **Goal:** a real `Sonnet-Setup.exe`.
- **Files:** `.github/workflows/desktop.yml` (`tauri-apps/tauri-action`, `windows-latest`, `desktop-v*` tag), `tauri.conf.json` bundle section, icons.
- **Risks:**
  - SmartScreen or antivirus friction.
  - WebView2 bootstrapper failures.
- **Done when:** on a clean Windows 11 VM, the installer runs without admin, the app launches from Start, uninstalls cleanly, and passes the M2 checklist.
- **Tests:** clean-VM install, uninstall and reinstall.
- **Rollback:** disable the workflow. No user impact.
- **Needs user OK:** GitHub Actions.
- **Implemented (session 8): local validation of the NSIS installer; no CI workflow yet.** Environment: **the current machine, with Sonnet state cleaned** (its dev WebView2 profile moved aside and later restored, the debug scheme key removed, sentinel files planted). It is not a clean VM, so a clean Windows 10/11 machine is still unverified. The installer was run with `/S` (silent); the interactive wizard and the uninstaller's own prompts weren't exercised.
  - **Install:** per user with no admin prompt, to `%LOCALAPPDATA%\Sonnet` (`sonnet-desktop.exe`, `uninstall.exe`). It adds a Start Menu shortcut `Sonnet.lnk`, an Apps entry (name Sonnet, version 0.1.0, publisher `ericwei`, about 4.6 MB) and the `sonnet://` scheme pointing at the installed exe. No desktop shortcut. The installer is 1.46 MiB. The process in Task Manager is `sonnet-desktop.exe`.
  - **Installed build:** launches from the Start Menu shortcut, runs from the install folder, loads the live site, and shows the Sonnet "s." mark as its icon. A second launch starts no second instance. The tray exists and its left-click toggles the window (driven with the tray's own message). Closing hides to the tray with the process alive, and a second launch shows it again. Moving and resizing the window, quitting fully and relaunching restored the size and position (window state lives in `%APPDATA%\me.ericwei.sonnet`, which also survived the profile clean-up).
  - **Sign-in in the installed build:** the user signed in by hand on the live site. The session survived a hide and reopen, a full exit and relaunch, and an uninstall plus reinstall (the profile is kept). `app_info` works and `auth_begin` is refused off `/login`. The `sonnet://` scheme reached the installed exe both with the app running and as a cold start, and a callback with nothing pending was ignored.
  - **Uninstall (`/S`):** removed the exe, `uninstall.exe`, the shortcut, the Apps entry and the scheme key. It **left** the install folder when it held a file the installer didn't write, and it **kept** the WebView2 profile, logs and window state (so reinstalling keeps the user signed in). Unrelated files (sentinels in `%LOCALAPPDATA%\Programs` and Documents, Downloads) were untouched.
  - **Reinstall:** worked over the leftover folder, with the Start Menu entry, Apps entry and scheme back.
  - **Not done:** a clean-VM run, SmartScreen and antivirus behavior (§15), the interactive wizard, the "delete app data" choice in the uninstaller, `.github/workflows/desktop.yml` (it needs the user's OK for GitHub Actions), code signing.

### M5. macOS packaging and configuration proof
- **Goal:** a real `Sonnet.dmg`.
- **Files:** the same workflow with a `macos-latest` job, the universal target, ad-hoc signing, a minimal Info.plist.
- **Risks:**
  - No local Mac.
  - Gatekeeper friction.
  - WKWebView breakage.
- **Done when:** on a clean Apple Silicon Mac (and Intel if available), drag to Applications, Open Anyway, launch, and pass the M2 checklist in WKWebView.
- **Tests:** the clean-Mac checklist.
- **Rollback:** disable the job.
- **Needs user OK:** access to a Mac or cloud Mac for testing.

### M6. Native capability bridge
- **Goal:** a typed bridge and the Guardian primitives.
- **Files:**
  - Web side:
    - new `src/lib/desktop/` (contract, Tauri adapter, `useDesktop()`)
    - new `src/components/desktop/` (Settings "Desktop app vX" row, Guardian permission and rule settings)
    - new `src/app/desktop/overlay/page.tsx`
    - `src/components/focus-timer.tsx` (`ready`/`started`/`ended` calls and an `onCommand` → `toggle()` subscription; **no timer-rule changes**)
  - Rust side, in `src-tauri/src/`: `app.rs`, `focus.rs`, `overlay.rs`, `sound.rs`, `shortcuts.rs`, `guardian/{mod,rules,windows,macos}.rs`
  - Capability files: `src-tauri/capabilities/{main,login,overlay,dev}.json`
  - Updater: updater plugin, signing key, `latest.json` on GitHub Releases (endpoint configured only in `tauri.conf.json`)
- **Risks:**
  - Bridge and web version skew.
  - Hidden-webview timer throttling.
  - Accessibility grants lost on unsigned macOS updates.
  - Fragile browser-domain reading.
- **Done when:** §12 items 4–9, 11–14 and 16–18 pass on Windows. macOS passes items 4, 8 and 9 at tier 0.
- **Tests:** a Rust unit test per command for malformed input, a capability-refusal test per denied route, the manual timer-integration matrix, and the skew test.
- **Rollback:**
  - The web side does nothing without a bridge, so reverting the shell is invisible to web users.
  - The `focus-timer.tsx` edits are additive calls behind `getDesktop()`.
- **Needs user OK:**
  - the `@tauri-apps/api` dependency and the plugin crates (`windows`, `objc2`);
  - the focus-timer touch;
  - the new route;
  - the GitHub releases location (repo name, public or private).
- **Precondition:** M0's enforced CSP is validated, and P1 has shipped.

### Focus Sense F1. Sensing foundation (built, session 9, Windows)

Infrastructure only: no classification, scoring, blocking, overlay, notifications or report UI. "Focus Sense" is the user's current name for the first native feature (Focus Guardian in the sections above).

- **Rust** (`src-tauri/src/focus_sense/`): `mod.rs` (event types, validation, the six commands), `sensor.rs` (platform adapter), `privacy.rs` (exclusions and redaction), `monitor.rs` (the one monitor thread), `store.rs` (local files). No new crates: Win32 is called through `extern "system"` declarations.
- **Windows APIs:** user32 `GetForegroundWindow`, `GetWindowTextLengthW`, `GetWindowTextW` (no message is sent to another process's window, so a hung app can't block it), `GetWindowThreadProcessId`; kernel32 `OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION)`, `QueryFullProcessImageNameW`, `CloseHandle`; version.dll `GetFileVersionInfoSizeW`, `GetFileVersionInfoW`, `VerQueryValueW` (the exe's FileDescription as the app name). Only the exe's file name is kept, never its path. Sonnet's own window title isn't read (it would message our UI thread, which joins the monitor at exit).
- **Not used:** screenshots, OCR, UI Automation, accessibility, URLs, clipboard, keystrokes, `SetWinEventHook`. No permission on Windows.
- **macOS:** `sensor::supported()` is false and `platform_sensor()` is `None`. The future adapter is `NSWorkspace.frontmostApplication` (no permission) for app identity; titles need Accessibility. Nothing is built or tested.
- **Event** (one JSONL line, also what the page reads): `{ seq, timestamp (ms), sessionId, platform: "windows"|"macos", kind: "context"|"start"|"stop", source: "foreground-window"|"monitor", appName, processName, windowTitle, redacted: "excluded"|"private"|null, confidence: "full"|"partial"|"none" }`. `start`/`stop` mark monitoring boundaries (stop covers session end, pause, turn-off, expiry and quit). A hard kill leaves no `stop`: the next `start` follows directly.
- **Monitoring:** polls once a second (`monitor::POLL`) and writes a `context` event only when the (process, app, title, redaction, window present) tuple changes. One thread at most (`focus-sense`); a second `start` for the same session is a no-op, a different session replaces it. `stop` wakes the thread through a channel and joins it (4 ms measured). The thread ends itself at the timer's end plus 2 minutes, capped at 4 hours from start. `RunEvent::Exit` stops it. Not event-driven yet: §12 item 4 (500 ms, event-driven) is not met.
- **Lifecycle:** the web timer is the source of truth. `FocusProvider` calls `start(String(run.start), run.start + 25 min)` when a run exists and `stop()` when it ends, only after the stored run has loaded, and only on change. A reload of a running session re-sends the same `start` (no stop/start). Mount with no run sends one `stop`. Browsers make no calls. The web client queues bridge calls so they reach Rust in order; every state-changing command also holds one control lock in Rust.
- **Opt-in and pause:** off until turned on in Settings → Data (desktop only). Turning it off stops the monitor at once; turning it on applies from the next session. "Pause for this session" (`stop { pause: true }`) keeps that session unmonitored across reloads, in memory only (an app restart forgets it).
- **Privacy rules** (`privacy.rs`, applied before storage): built-in sensitive exes (1Password, Bitwarden, KeePass, KeePassXC, Enpass, NordPass, Proton Pass, Windows credential/elevation/logon/lock UI) and user exclusions keep nothing identifying (`redacted: "excluded"`); private browser windows of known browsers, detected by title marker, lose the title (`"private"`); an unreadable process (elevated, protected) loses the title too (fail closed). Titles are stripped of control characters and capped at 256 characters. Logs carry lifecycle and session ids only.
- **Storage** (`<LocalAppData>/me.ericwei.sonnet/focus-sense/`): `config.json` (`enabled`, `exclusions`, atomic write) and `sessions/<sessionId>.jsonl`. Session ids are digits only (the timer's start in ms, matching `focus_sessions.started_at`). Bounds: 3000 `context` events per session, the newest 100 session files, 30-day retention by file time (`store::RETENTION`, the knob for a later configurable window). Pruned at app start and at each `start`. Clear deletes every session file and keeps the config. No Supabase, no sync.
- **Commands** (each `page_allowed`: a site page, `bridge_path_allowed`, not `/login`; inputs `deny_unknown_fields`): `focus_sense_status`, `focus_sense_configure { config }`, `focus_sense_start { req: { sessionId, endsAt } }`, `focus_sense_stop { req: { pause } }`, `focus_sense_events { req: { sessionId, after } }` (only the latest session started in this run of the app, 500 per page), `focus_sense_clear`. No Tauri events: the page polls `events` (`focusSense.onActivity` in `src/lib/desktop/focus-sense.ts`). Capability: the six `allow-focus-sense-*` permissions only.
- **Known limits:** the config and data are per computer, not per Sonnet account (a second user signing in on the same machine inherits the setting and can clear the data). Store/UWP apps report `ApplicationFrameHost.exe`. Private windows are detected only when the title carries the browser's marker. Ordinary titles can still contain sensitive text (document or email subjects); retention and exclusions are the controls. If a pid is reused within one poll, the old identity is kept until focus moves. A sign-out mid-session leaves the monitor running until its deadline (at most the timer's end plus 2 minutes). Not tested: an elevated foreground window, a clean machine, antivirus reaction, macOS.
- **Measured (Windows 11, debug build, shell process only):** about 31 ms of CPU per minute while monitoring (≈0.05% of one core) and 0 ms idle with no session; the thread count drops back by one after stop. WebView2 processes not included.

### Focus Sense M6B. Classification and focus metrics (built, session 9, Windows)

Answers "what was the student doing" (per foreground context) and "how focused was the session" (deterministic metrics). Enforces nothing; nothing is stored on a server; study history (`focus_sessions`, `logFocus`) is unchanged. Runs in the page, on demand, from the latest session's events.

- **Code** (`src/lib/desktop/sense/`): `types.ts` (contract: `FocusClassification`, `FocusSessionContext`, `SemanticProvider`, `SessionReport`, `ENFORCEMENT_CONFIDENCE = 0.9`, `isEnforceable`), `classify.ts` + `rules.ts` + `heuristics.ts` + `lexicon.ts` (classifier), `semantic.ts` (provider boundary, cache, offline and OpenRouter providers), `score.ts` (timeline, smoothing, metrics), `context.ts` (what a session is for). UI: `src/components/desktop/focus-context-picker.tsx` (timer "Working on": course, assignment, goal; desktop with Focus Sense on only) and `focus-session-debug.tsx` (Settings → Data → Latest session: events, labels, reasons, timeline, metrics). Benchmark: `bench/focus-sense/` (methodology in its README, recorded runs in `RESULTS.md`).
- **Native additions:** events carry `idle` (true after `IDLE_AFTER_MS` = 120 s with no keyboard/mouse input, from user32 `GetLastInputInfo` and kernel32 `GetTickCount`; only the time of the last input is read, never the input), a `heartbeat` event after 60 s without any other event (`monitor::HEARTBEAT_POLLS`), and `status.latest`. No new commands or permissions. Old JSONL lines without `idle` still parse.
- **Session context:** reuses Sonnet's own courses (code + name) and schedule items. Picked before Start, stored in localStorage (`sonnet-focus-sense-next`), bound to the session id when the timer starts sensing (`sonnet-focus-sense-sessions`, newest 30, cleaned and length-capped). Cleared with "Clear Focus Sense data".
- **Classification result:** `{ label: ON_TASK | DISTRACTING | UNCERTAIN, confidence 0..1 (UNCERTAIN = 0), reason, method: rule | heuristic | semantic | abstain, lean? }`. Prefers UNCERTAIN; idle is not an input.
- **Layers** (cheapest first):
  0. Abstain: redacted (excluded/private), no window, no title and no process.
  1. Rules: Sonnet itself ON_TASK 0.95; ~60 known game executables DISTRACTING 0.95 (not in a game-design session, never Minecraft Education); launchers 0.85; Windows shell (desktop, Task Switching, Settings) UNCERTAIN.
  2. Heuristics on the title against the context: browser-suffix stripping, site detection (YouTube, Reddit, Discord, LMS, docs, PDF, IDEs, chat, music, social, streaming, shopping…), course-code department expansion and a subject lexicon (~830 terms, 17 subjects), numbered references ("Exam 3", "PS6"), leisure and entertainment-format wording, personal-plan wording, related-subject map. Typical outputs: LMS naming the course 0.9; matching video/page/doc/IDE/chat 0.8–0.85; generic course material 0.65; mild leisure 0.65–0.75; unrelated subject's study material DISTRACTING 0.6.
  3. Semantic (optional): only `needsSemantic` items (UNCERTAIN, content-bearing title, some context), batched ≤ 20, deduped, LRU cache (500). Verdicts capped at 0.85 and never enforceable; below 0.6 → UNCERTAIN with a lean; any failure → UNCERTAIN.
- **Enforceable (for a future Strict Mode only):** DISTRACTING ≥ 0.9 from rule/heuristic. Reached only by a known game exe outside game-themed sessions (0.95) or by strong leisure wording on video/Reddit/fun sites (0.92) when the session has a known subject, isn't media study (media, film, communication, journalism, sport management…), shares no 5-letter word prefix with the title, and the title has no academic or programming term. A fun site with no leisure wording tops out at 0.85.
- **Semantic provider and privacy:** the app ships with the offline provider only (no network). `openRouterProvider` exists in `semantic.ts` for measurement and a future server route, is not imported by client code, and was not run on held-out data. If wired later, it would send only `{ goal, courseName, assignmentTitle, app, title }` (no ids, no history; never redacted, private, chat, email, call, terminal or blank titles). Wiring it needs a server route, a privacy-page change and the user's OK. Requests per hour, latency and cache hit rate are therefore not measured; with batching and the cache the design bound is about one request per batch of new ambiguous contexts (about 20% of contexts on the benchmark).
- **Benchmark:** baselines are an app/domain blocklist and a title-keyword overlap (threshold fit on dev). v1 (180 examples) failed its held-out gate after tuning (77.5% vs 79.0%) and is spent. v2 (189 examples, 112 dev / 77 held-out, 43% hard, built by an isolated worker) was tuned once on dev and run on held-out once: **77.9% exact (gate 73.6%), 93.8% decisive, 37.7% abstain, 1 false ON_TASK, 2 false DISTRACTING, 0 enforceable false positives, 20.8% would need the semantic layer**; keyword baseline 63.6%, blocklist 54.5% (41.7% enforceable FPs on study). Post-run safety caps changed no v2 dev result. Full tables and the leakage review: `bench/focus-sense/RESULTS.md`.
- **Timeline and missing stop** (`score.ts`): runs go from `start` to `stop`; a context holds until the next context or run end; heartbeats prove liveness. A run without a stop, or a silent gap inside a run, ends 90 s (`MISSING_STOP_GRACE_MS` = heartbeat + 30 s) after its last event; the rest is UNMONITORED. A final run is "in-progress" only while `now − last event ≤ 90 s`. Everything is clipped to `[run.start, run.start + 25 min]`. Idle makes ON_TASK/UNCERTAIN time IDLE (backdated 120 s, not past the previous boundary); a DISTRACTING context stays DISTRACTING while idle.
- **Smoothing:** same-kind stretches merge; ON_TASK/UNCERTAIN stretches under 15 s take their neighbours' kind (only neighbours ≥ 15 s count; DISTRACTING is never absorbed); DISTRACTING stretches less than 60 s apart form one window; a window with under 60 s of DISTRACTING time is a forgiven slip, otherwise one episode, "recovered" if ON_TASK follows.
- **Metrics:** focused (time ON_TASK both before and after smoothing, not idle, monitored), distraction (episodes), slips, uncertain, idle, unmonitored (the six sum to the session), longest focused block (gaps under 2 min of UNCERTAIN/IDLE and slips don't break it), episodes, recoveries, median recovery, evidence = (focused + distraction + slips) / session.
- **Verified minutes** = min(floor(focused / 1 min), 25). Nothing else is credited.
- **Focus score** (0–100; null when evidence < 0.25 or focused + distraction = 0): `D = Σ episodes d × (1 + k × min(d, 20 min)/20 min)`, k = 0.5 if recovered else 1; `idleExcess = max(0, idle − max(5 min, 20% of session))`; `slipExcess = max(0, slips − max(2 min, 10% of session))`; `score = round(100 × F / (F + D + idleExcess + slipExcess))`. It never exceeds the plain on-task share. Examples (60-min windows): near-perfect 100 / 59 verified; 58 + 2 distracted 97; timer farming 10/50 gaming 9 / 10 verified; one 20-min distraction 57 vs ten 2-min episodes 66; walked away 45 min 31 / 15 verified; unrelated IDE (mostly UNCERTAIN) null / 8 verified.
- **Live Windows check:** a 12-minute session classified a real game (VALORANT) as DISTRACTING 0.95, a stoichiometry Wikipedia page as ON_TASK 0.85 for CHEM 1210, a "minecraft lets play" YouTube page as DISTRACTING 0.92, Task Switching/Notepad/Claude as UNCERTAIN; the off/on gap was UNMONITORED and heartbeats appeared.
- **Known limits:** hands-off lecture watching becomes IDLE after 2 minutes and isn't credited; titles alone can't tell a TV show from a topic ("Breaking Bad") or name unknown games; the lexicon is English and US-course-centric; about 38% of held-out contexts stay UNCERTAIN offline; rapid alternation credits the on-task blips themselves; the session context is per computer and only as good as what the student picks; the classifier runs in the page, so the latest session's titles are visible to page code (origin + CSP are the boundary, §7).

### M7. Readiness for Focus Guardian
- **Goal:** pass the §12 gate.
- **Files:** `src/app/privacy/page.tsx` (describe on-device observation), plus fixes found by the gate.
- **Risks:** idle-memory budget missed on Windows (WebView2 process overhead).
- **Done when:** all 23 items in §12 pass on both platforms, with one reviewer pass done.
- **Tests:** the full §12 checklist, recorded in HANDOFF.
- **Rollback:** not applicable. This milestone is a gate, not a deploy.
- **Needs user OK:** legal-text change.

## 14. Explicit Non-Goals

- Do not redesign Sonnet. The desktop app uses the existing UI and design system.
- Do not implement Focus Guardian features (rules UI polish, scoring, history, stats) in this foundation. Build only the primitives in §6 and the gate in §12.
- Do not implement Lecture Listener or any microphone or audio capture.
- Do not apply production database migrations. Guardian rules stay local. Cross-device sync is a later decision.
- Do not duplicate the app: no static export, no second UI, no local Next server, no monorepo split.
- Do not add screen capture to the foundation.
- Do not sign or notarize yet, and do not buy certificates.
- Do not push to `main` unless current project instructions explicitly require it. Each milestone needs the user's approval (dependencies, auth, proxy, focus timer) before it starts.

## 15. Open Risks / Unverified Claims

The architecture is approved. The claims below are **not** verified. They are platform, framework or service behaviors that the approved design relies on. Do not treat them as facts until the named test passes. If one fails, fix the design within the approved decisions, or raise it with the user if it touches a locked decision (§16).

| Claim | Needs | How to verify |
|---|---|---|
| Tauri idle footprint (about 10–30 MB above the page) and installer size (about 5–15 MB) | Windows + macOS test | Measure at M4 and M5 |
| ≤1% idle CPU and ≤250 MB total memory are achievable with WebView2 | Windows test | Measure at M7. WebView2 spawns several processes. |
| ~~Path-scoped `remote.urls` in Tauri 2 capabilities match exactly as described, including subpaths~~ **Disproved at M1:** matching is by `Origin` only (no path), and a root `/` is a wildcard. Path rules are enforced in Rust per command (§7). | Framework test | Done (M1). Re-run the refusal test per command at M6. |
| Tauri IPC from a remote origin needs `ipc: http://ipc.localhost` in `connect-src` | Framework test | Watch the CSP reports at M6 |
| Nonce CSP plus `'strict-dynamic'` works with Next 16.3 here, without breaking `motion`, GSAP or Vercel scripts | Web test | M0 report-only period. **Verified locally (session 8): zero violations signed in and out on a production build, then enforced.** Vercel itself untested. |
| Skew Protection is available on this project's Vercel plan (Vercel's docs limit it to Pro/Enterprise) and covers Server Actions | Service check | Check the Vercel plan and settings (M0). Not blocking. |
| The PKCE verifier cookie set in the webview is still valid when the deep link returns | Windows + macOS test | M3 auth matrix. **Windows: verified** with a real emailed link (session 8). macOS untested. |
| Ad-hoc-signed macOS apps lose the Accessibility grant on update | macOS test | M5 and M6 on real hardware |
| Carbon hotkeys need no Input Monitoring permission | macOS test | M6 |
| The signed-in app works in WKWebView and Safari (never tested). **A failure here is the only trigger for the Electron fallback.** | macOS test | M0 Safari pass, M5 |
| `SpeechRecognition` exists in WebView2 and WKWebView | Windows + macOS test | M2. **WebView2: exists, but `start()` ends in `error: network` (unsupported).** WKWebView untested. |
| `AudioContext` focus noise plays in a hidden webview | Windows + macOS test | M2. **WebView2: stays `running` for the 12 s tested; audible output not heard.** macOS untested. |
| UI Automation and Accessibility can read the browser domain reliably | Windows + macOS test | M6. A browser-extension companion is the fallback. |
| WebView2 is present on target Windows 10 machines | Windows test | M4 clean VM. Present on the Windows 11 dev machine; a clean VM wasn't available (session 8). |
| Antivirus tolerates an unsigned app that watches windows | Windows test | M4. Not tested; the app watches nothing yet. |
| Hidden-webview timer throttling doesn't break the focus run | Windows + macOS test | M6 skew test. WebView2 (M2): a 1 s interval kept ticking and `visibilityState` stayed `visible` for 12 s hidden; longer hides and macOS untested. |
| GitHub Releases works as the updater source (asset URLs, rate limits, public access) | Service test | M6 update test (N to N+1) |

## 16. Authoritative Implementation Decisions

These are **approved and locked**. Future sessions must preserve them unless the user explicitly changes them.

- [ ] **Tauri 2 thin shell** loading the live Sonnet site (`https://www.ericwei.me`), with a small Rust native layer and a typed bridge. No local server, no second UI.
- [ ] **No static-export rewrite.**
- [ ] **The existing web app stays fully supported.** Desktop features are gated and never break web builds.
- [ ] **Focus Guardian is the first major desktop-native feature.**
- [ ] **The focus-session durability fix (P1) ships before Focus Guardian depends on the timer.**
- [ ] **One repo, one Next app, one deployment.** Desktop code lives only in `src-tauri/`, `src/lib/desktop/`, `src/components/desktop/`, `src/app/desktop/` and `src/app/auth/desktop/`.
- [ ] **All server logic and secrets stay on Vercel and Supabase.** The binary holds no secrets.
- [ ] **The start URL is `/login`.** `/login` redirects signed-in users to `/`.
- [ ] **The bridge is capability-detected and returns null in browsers.** Desktop UI renders after mount only. No user-agent sniffing. The server's only desktop signal is the `client=desktop` auth field.
- [ ] **Commands are intent-level, validated in Rust, and path-scoped.** No commands on `/f/*`, public pages or previews. Never `fs`, `shell`, `http` or process spawn.
- [ ] **Nonce CSP is M0.** Begin report-only, verify real app behavior, then enforce. Never regress auth, Server Actions or public pages to satisfy it. Bridge privileges beyond `app_info` and notify wait for the validated enforced CSP.
- [ ] **The web focus timer is the single source of truth.** The desktop drives it only through `toggle()`. The timer's rules are not changed.
- [ ] **Raw activity stays on the device.** Logs hold no titles or domains. Rules are local only, so no migration is needed. *Changed by the user in session 9 (Focus Sense F1):* raw events are persisted locally per session and the page may read the latest session's events through `focus_sense_events`. Nothing goes to Supabase or any server.
- [ ] **Intervention ceiling:** notice, then overlay, then hide (opt-in). Never kill, close, send keystrokes or block the network.
- [ ] **Permissions are requested at the moment of use and degrade gracefully.** Nothing is requested at install.
- [ ] **Deploy skew:** Vercel Skew Protection is preferred if the plan supports it (Pro/Enterprise per Vercel's docs; never assumed). Otherwise, and in any case, use reload-on-show, the pre-end reload and N/N-1 bridge handling. Not blocking.
- [ ] **Two update channels:** web through Vercel, shell through the signed Tauri updater. **GitHub Releases is the first update source.** The endpoint is set only in `tauri.conf.json`, so it can move to another CDN.
- [ ] **Direct download first, no app stores.** Windows: a normal installer executable (`Sonnet-Setup.exe`, NSIS per-user). macOS: `Sonnet.dmg` containing `Sonnet.app` (universal).
- [ ] **A macOS Developer ID is required before the Accessibility tier reaches users.**
- [ ] **Lecture Listener and screen capture are deferred.** If built, they are native Rust modules behind their own capabilities.
- [ ] **Electron is the fallback only if real macOS WebView testing exposes a blocking incompatibility.** It would replace `src-tauri/` and one adapter, behind the same contract.
- [ ] **Every dependency, auth, proxy, focus-timer, route and Vercel change still needs the user's OK**, per HANDOFF.
