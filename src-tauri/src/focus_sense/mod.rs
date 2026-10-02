//! Focus Sense, sensing foundation. While a web focus session runs (and the user turned it on), a
//! monitor thread samples the foreground window about once a second and stores a normalized event
//! whenever the foreground context changes. Events stay on this computer (`store`), in one JSONL file
//! per focus session. No screenshots, no OCR, no page content, no clipboard, no keystrokes.
//!
//! - `sensor`: the platform adapter (Windows: foreground window, process image, window title).
//! - `privacy`: exclusions and redaction, applied before anything is stored.
//! - `monitor`: the one monitor thread, its start/stop and its self-expiry.
//! - `store`: config and per-session event files, bounded and deletable.
//!
//! The commands below are the whole bridge surface. Each is path-gated in Rust (`page_allowed`),
//! because Tauri capabilities scope by origin only.

pub mod monitor;
pub mod privacy;
pub mod sensor;
pub mod store;

use serde::{Deserialize, Serialize};
use tauri::{State, Url};

/// What the store writes and the page reads. One line of a session's JSONL file.
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ActivityEvent {
    /// 1, 2, 3… within the session. Assigned by `Store::append`.
    pub seq: u64,
    /// Milliseconds since the Unix epoch, when the change was observed.
    pub timestamp: u64,
    pub session_id: String,
    /// "windows" or "macos".
    pub platform: String,
    pub kind: Kind,
    pub source: Source,
    /// The app's own name (Windows: the exe's FileDescription, e.g. "Google Chrome").
    pub app_name: Option<String>,
    /// The executable's file name, e.g. "chrome.exe".
    pub process_name: Option<String>,
    /// At most `privacy::TITLE_MAX` characters.
    pub window_title: Option<String>,
    pub redacted: Option<Redaction>,
    pub confidence: Confidence,
}

#[derive(Serialize, Deserialize, Clone, Copy, Debug, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Kind {
    /// The foreground context changed (or was first seen).
    Context,
    /// Monitoring began for this session.
    Start,
    /// Monitoring ended: the session stopped, the user paused or turned it off, or it expired.
    Stop,
}

#[derive(Serialize, Deserialize, Clone, Copy, Debug, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum Source {
    ForegroundWindow,
    Monitor,
}

#[derive(Serialize, Deserialize, Clone, Copy, Debug, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Redaction {
    /// A built-in sensitive app or one the user excluded: nothing identifying is kept.
    Excluded,
    /// A private/incognito browser window, detected from its title: the title is dropped.
    Private,
}

#[derive(Serialize, Deserialize, Clone, Copy, Debug, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Confidence {
    /// Process and title were both read.
    Full,
    /// A window was in front but something couldn't be read (e.g. an elevated or protected process).
    Partial,
    /// No foreground window (lock screen, switching), or a start/stop marker.
    None,
}

/// One raw reading from the platform sensor, before privacy rules.
#[derive(Clone, Debug, Default, PartialEq)]
pub struct Sample {
    pub has_window: bool,
    pub process_name: Option<String>,
    pub app_name: Option<String>,
    pub window_title: Option<String>,
}

/// Saved in the app data folder. Off until the user turns it on.
#[derive(Serialize, Deserialize, Clone, Debug, Default, PartialEq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Config {
    pub enabled: bool,
    /// Lowercase executable names, e.g. "discord.exe". Added to the built-in sensitive list.
    pub exclusions: Vec<String>,
}

pub fn now_ms() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_or(0, |d| d.as_millis() as u64)
}

// ---------------------------------------------------------------- commands

/// What the page sees. Never includes event content.
#[derive(Serialize, Debug, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Status {
    /// This platform has a working sensor (Windows today).
    pub supported: bool,
    pub enabled: bool,
    pub exclusions: Vec<String>,
    pub monitoring: Option<monitor::Running>,
    /// The user paused sensing for the latest session; the timer restarting it (a reload) is ignored.
    pub paused: bool,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct StartReq {
    pub session_id: String,
    /// When the web timer will end the session, ms since epoch.
    pub ends_at: u64,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct StopReq {
    /// The user paused sensing (stays off for this session), rather than the session ending.
    pub pause: bool,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct EventsReq {
    pub session_id: String,
    /// Return events with `seq` greater than this.
    pub after: u64,
}

/// Longest a monitor may run, whatever the page asks: the 25-minute timer plus a wide margin.
pub const MAX_RUN_MS: u64 = 4 * 60 * 60 * 1000;
/// Kept running this long past the timer's end, so a slightly late `stop` still finds it.
pub const GRACE_MS: u64 = 2 * 60 * 1000;
pub const MAX_EXCLUSIONS: usize = 100;
pub const EVENTS_PAGE: usize = 500;

/// The web timer's session id is its start time in ms: digits only, so it is always a safe file name
/// (no traversal, no Windows device names like `COM1`).
pub fn session_id_ok(s: &str) -> bool {
    (1..=20).contains(&s.len()) && s.bytes().all(|b| b.is_ascii_digit())
}

/// An executable name: letters, digits, `.`, `_`, `-`, space. Stored lowercase.
pub fn exclusion_ok(s: &str) -> bool {
    (1..=64).contains(&s.len())
        && s.trim() == s
        && s.bytes().all(|b| b.is_ascii_alphanumeric() || matches!(b, b'.' | b'_' | b'-' | b' '))
}

/// Normalizes and validates a requested config. Duplicates collapse.
pub fn clean_config(mut c: Config) -> Result<Config, String> {
    if c.exclusions.len() > MAX_EXCLUSIONS {
        return Err("too many exclusions".into());
    }
    if !c.exclusions.iter().all(|e| exclusion_ok(e)) {
        return Err("invalid exclusion".into());
    }
    c.exclusions = c.exclusions.iter().map(|e| e.to_ascii_lowercase()).collect();
    c.exclusions.sort();
    c.exclusions.dedup();
    Ok(c)
}

/// The monitor's deadline: the timer's end plus grace, never past `MAX_RUN_MS` from now, never in the past.
pub fn deadline(ends_at: u64, now: u64) -> Result<u64, String> {
    if ends_at <= now.saturating_sub(GRACE_MS) {
        return Err("session already ended".into());
    }
    Ok(ends_at.saturating_add(GRACE_MS).min(now + MAX_RUN_MS))
}

/// Signed-in app pages of the site only: not `/login`, nor anything `bridge_path_allowed` refuses.
fn page_allowed(webview: &tauri::Webview) -> Result<(), String> {
    let url: Url = webview.url().map_err(|e| e.to_string())?;
    if crate::is_site_page(&url, &crate::site_origin()) && crate::bridge_path_allowed(url.path()) && url.path() != "/login" {
        Ok(())
    } else {
        Err("not available on this page".into())
    }
}

pub struct FocusSense {
    pub store: std::sync::Arc<store::Store>,
    pub monitor: monitor::Monitor,
    /// Held for the whole of every command, so a check (enabled, paused) and its action can't
    /// interleave with another command's.
    control: std::sync::Mutex<Control>,
}

/// Memory only: a restart forgets both.
#[derive(Default)]
struct Control {
    /// The latest session the timer started. The only one the page may read events for.
    latest: Option<String>,
    /// Set when the user paused that session.
    paused: Option<String>,
}

impl FocusSense {
    pub fn new(store: std::sync::Arc<store::Store>) -> Self {
        Self { store, monitor: monitor::Monitor::default(), control: Default::default() }
    }

    fn lock(&self) -> std::sync::MutexGuard<'_, Control> {
        self.control.lock().unwrap_or_else(std::sync::PoisonError::into_inner)
    }

    fn status(&self, c: &Control) -> Status {
        let config = self.store.load_config();
        Status {
            supported: sensor::supported(),
            enabled: config.enabled,
            exclusions: config.exclusions,
            monitoring: self.monitor.current(),
            paused: c.paused.is_some() && c.paused == c.latest,
        }
    }
}

#[tauri::command]
pub async fn focus_sense_status(webview: tauri::Webview, fs: State<'_, FocusSense>) -> Result<Status, String> {
    page_allowed(&webview)?;
    Ok(fs.status(&fs.lock()))
}

/// Turning it off stops a running monitor at once. Turning it on takes effect at the next session start.
#[tauri::command]
pub async fn focus_sense_configure(
    webview: tauri::Webview,
    fs: State<'_, FocusSense>,
    config: Config,
) -> Result<Status, String> {
    page_allowed(&webview)?;
    let config = clean_config(config)?;
    let c = fs.lock();
    fs.store.save_config(&config).map_err(|e| {
        log::warn!("focus sense: could not save config: {e}");
        "could not save settings".to_string()
    })?;
    if !config.enabled {
        fs.monitor.stop();
    }
    log::info!("focus sense configured: enabled={} exclusions={}", config.enabled, config.exclusions.len());
    Ok(fs.status(&c))
}

/// Idempotent for the running session; a different session replaces it. A paused session stays paused.
#[tauri::command]
pub async fn focus_sense_start(
    webview: tauri::Webview,
    fs: State<'_, FocusSense>,
    req: StartReq,
) -> Result<Status, String> {
    page_allowed(&webview)?;
    if !session_id_ok(&req.session_id) {
        return Err("invalid session".into());
    }
    let until = deadline(req.ends_at, now_ms())?;
    if !sensor::supported() {
        return Err("not supported on this platform".into());
    }
    let mut c = fs.lock();
    if c.paused.as_deref() == Some(req.session_id.as_str()) {
        return Ok(fs.status(&c));
    }
    let config = fs.store.load_config();
    if !config.enabled {
        return Err("focus sense is off".into());
    }
    let _ = fs.store.prune(std::time::SystemTime::now());
    let store = fs.store.clone();
    let sink: monitor::Sink = std::sync::Arc::new(move |mut e: ActivityEvent| {
        if let Err(err) = store.append(&mut e) {
            log::warn!("focus sense: could not store an event: {err}");
        }
    });
    fs.monitor.start(req.session_id.clone(), until, config.exclusions, sink)?;
    c.paused = None;
    c.latest = Some(req.session_id);
    Ok(fs.status(&c))
}

/// Stops the monitor: the session ended, or (`pause`) the user paused sensing for the rest of it, which
/// survives a page reload. Safe to call when nothing runs.
#[tauri::command]
pub async fn focus_sense_stop(
    webview: tauri::Webview,
    fs: State<'_, FocusSense>,
    req: StopReq,
) -> Result<Status, String> {
    page_allowed(&webview)?;
    let mut c = fs.lock();
    if req.pause {
        if let Some(r) = fs.monitor.current() {
            c.paused = Some(r.session_id);
        }
    }
    fs.monitor.stop();
    Ok(fs.status(&c))
}

/// Least privilege: only the latest session the timer started in this run of the app, not the
/// history on disk (that is for a later, native-side reader).
#[tauri::command]
pub async fn focus_sense_events(
    webview: tauri::Webview,
    fs: State<'_, FocusSense>,
    req: EventsReq,
) -> Result<Vec<ActivityEvent>, String> {
    page_allowed(&webview)?;
    if !session_id_ok(&req.session_id) {
        return Err("invalid session".into());
    }
    if fs.lock().latest.as_deref() != Some(req.session_id.as_str()) {
        return Err("not available for this session".into());
    }
    fs.store.read(&req.session_id, req.after, EVENTS_PAGE).map_err(|e| {
        log::warn!("focus sense: could not read events: {e}");
        "could not read events".to_string()
    })
}

/// Deletes every stored event (the settings stay). A running monitor is stopped first.
#[tauri::command]
pub async fn focus_sense_clear(webview: tauri::Webview, fs: State<'_, FocusSense>) -> Result<Status, String> {
    page_allowed(&webview)?;
    let c = fs.lock();
    fs.monitor.stop();
    fs.store.clear().map_err(|e| {
        log::warn!("focus sense: could not clear data: {e}");
        "could not clear data".to_string()
    })?;
    log::info!("focus sense: local data cleared");
    Ok(fs.status(&c))
}

/// The capability test checks each of these is granted, and nothing else.
#[cfg(test)]
pub const COMMANDS: [&str; 6] = [
    "focus_sense_status",
    "focus_sense_configure",
    "focus_sense_start",
    "focus_sense_stop",
    "focus_sense_events",
    "focus_sense_clear",
];

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn session_ids_are_file_name_safe() {
        assert!(session_id_ok("1759400000000"));
        for s in ["", "../x", "a/b", "a\\b", "a.b", "a b", "%2e", "COM1", "nul", "-1", "1e9", &"1".repeat(21)] {
            assert!(!session_id_ok(s), "{s}");
        }
    }

    #[test]
    fn config_is_validated_and_normalized() {
        let c = clean_config(Config { enabled: true, exclusions: vec!["Discord.exe".into(), "discord.exe".into(), "x y.exe".into()] }).unwrap();
        assert_eq!(c.exclusions, vec!["discord.exe", "x y.exe"]);
        for bad in ["", " a.exe", "a/b.exe", "..\\a", "a\u{0}", &"a".repeat(65)] {
            assert!(clean_config(Config { enabled: true, exclusions: vec![bad.into()] }).is_err(), "{bad:?}");
        }
        assert!(clean_config(Config { enabled: true, exclusions: vec!["a".into(); MAX_EXCLUSIONS + 1] }).is_err());
    }

    #[test]
    fn requests_reject_unknown_and_malformed_fields() {
        assert!(serde_json::from_str::<StartReq>(r#"{"sessionId":"1","endsAt":5}"#).is_ok());
        for bad in [
            r#"{"sessionId":"1","endsAt":5,"x":1}"#,
            r#"{"sessionId":"1"}"#,
            r#"{"sessionId":1,"endsAt":5}"#,
            r#"{"sessionId":"1","endsAt":-5}"#,
            r#"{"sessionId":"1","endsAt":"5"}"#,
        ] {
            assert!(serde_json::from_str::<StartReq>(bad).is_err(), "{bad}");
        }
        assert!(serde_json::from_str::<EventsReq>(r#"{"sessionId":"1","after":0,"limit":9}"#).is_err());
        assert!(serde_json::from_str::<StopReq>(r#"{"pause":true}"#).is_ok());
        assert!(serde_json::from_str::<StopReq>(r#"{}"#).is_err());
        assert!(serde_json::from_str::<StopReq>(r#"{"pause":1}"#).is_err());
        assert!(serde_json::from_str::<Config>(r#"{"enabled":true,"exclusions":[],"path":"C:/"}"#).is_err());
        assert!(serde_json::from_str::<Config>(r#"{"enabled":"yes","exclusions":[]}"#).is_err());
    }

    #[test]
    fn deadline_is_bounded() {
        let now = 1_000_000_000_000;
        assert_eq!(deadline(now + 25 * 60_000, now), Ok(now + 25 * 60_000 + GRACE_MS));
        assert_eq!(deadline(now + 100 * MAX_RUN_MS, now), Ok(now + MAX_RUN_MS));
        assert!(deadline(now - GRACE_MS, now).is_err());
        assert!(deadline(0, now).is_err());
        assert!(deadline(now - 1000, now).is_ok(), "a slightly late start still runs until grace ends");
    }

    #[test]
    fn events_serialize_in_the_documented_shape() {
        let e = ActivityEvent {
            seq: 1,
            timestamp: 5,
            session_id: "1".into(),
            platform: "windows".into(),
            kind: Kind::Context,
            source: Source::ForegroundWindow,
            app_name: Some("Notepad".into()),
            process_name: Some("notepad.exe".into()),
            window_title: None,
            redacted: Some(Redaction::Private),
            confidence: Confidence::Partial,
        };
        assert_eq!(
            serde_json::to_string(&e).unwrap(),
            r#"{"seq":1,"timestamp":5,"sessionId":"1","platform":"windows","kind":"context","source":"foreground-window","appName":"Notepad","processName":"notepad.exe","windowTitle":null,"redacted":"private","confidence":"partial"}"#
        );
    }
}
