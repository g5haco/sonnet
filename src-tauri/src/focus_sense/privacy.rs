//! Exclusions and redaction, applied to every sample before it becomes an event.
//!
//! Best effort. What this cannot detect reliably:
//! - sensitive content in an ordinary window title (an email subject, a document or file name);
//! - private windows whose title carries no marker (some Chrome/Brave/Opera/Vivaldi versions, PWAs);
//! - UWP/Store apps, which mostly report `ApplicationFrameHost.exe`, so excluding one by exe name fails;
//! - renamed or portable copies of the listed apps.

use super::{Confidence, Redaction, Sample};

/// Longest stored window title, in characters (not bytes).
pub const TITLE_MAX: usize = 256;
const NAME_MAX: usize = 128;

/// Lowercase exe names never recorded: password managers, and Windows credential, elevation and lock
/// screens. Short on purpose; users add more through their exclusions.
const SENSITIVE: [&str; 11] = [
    "1password.exe",
    "bitwarden.exe",
    "keepass.exe",
    "keepassxc.exe",
    "enpass.exe",
    "nordpass.exe",
    "proton pass.exe",
    "credentialuibroker.exe",
    "consent.exe",
    "logonui.exe",
    "lockapp.exe",
];

/// Only these get the private-window title check, so a "Private" title elsewhere is kept.
const BROWSERS: [&str; 6] = ["msedge.exe", "chrome.exe", "firefox.exe", "brave.exe", "opera.exe", "vivaldi.exe"];

/// The browsers' own private-window title forms, matched where the browser puts them (the end), so a
/// page merely titled "private" doesn't match.
fn private_title(t: &str) -> bool {
    t.contains(" - [InPrivate]") // Edge: "Page - [InPrivate] - Microsoft Edge"
        || t.ends_with("Private Browsing") // Firefox: "Page — Mozilla Firefox Private Browsing"
        || t.ends_with("(Incognito)") // Chrome: "Page - Google Chrome (Incognito)"
        || t.ends_with("(Private)") // Brave and others, where they mark it
}

/// Control characters stripped, trimmed, at most `max` characters. Empty is `None`.
fn clean(s: Option<String>, max: usize) -> Option<String> {
    let s: String = s?.chars().filter(|c| !c.is_control()).collect();
    let s: String = s.trim().chars().take(max).collect();
    let s = s.trim_end();
    (!s.is_empty()).then(|| s.to_string())
}

/// Applies exclusions and redaction before anything is stored. `exclusions` are lowercase exe names.
pub fn apply(sample: Sample, exclusions: &[String]) -> (Sample, Option<Redaction>) {
    let process_name = clean(sample.process_name, NAME_MAX);
    let lower = process_name.as_deref().map(str::to_lowercase).unwrap_or_default();
    if !lower.is_empty() && (SENSITIVE.contains(&lower.as_str()) || exclusions.iter().any(|e| e.eq_ignore_ascii_case(&lower))) {
        return (Sample { has_window: sample.has_window, ..Sample::default() }, Some(Redaction::Excluded));
    }
    // Checked before truncation, so a long title keeps its browser suffix.
    let title = clean(sample.window_title, usize::MAX);
    let private = BROWSERS.contains(&lower.as_str()) && title.as_deref().is_some_and(private_title);
    // Fail closed: with no process name (elevated, protected) exclusions can't be checked, so no title either.
    let window_title = if private || process_name.is_none() { None } else { clean(title, TITLE_MAX) };
    let s = Sample { has_window: sample.has_window, process_name, app_name: clean(sample.app_name, NAME_MAX), window_title };
    (s, private.then_some(Redaction::Private))
}

/// `None` with no window in front. `Full` when process and title were read, or a field was dropped on
/// purpose (`redacted`). `Partial` when something couldn't be read (elevated or protected process).
pub fn confidence(s: &Sample, redacted: Option<Redaction>) -> Confidence {
    if !s.has_window {
        Confidence::None
    } else if redacted.is_some() || (s.process_name.is_some() && s.window_title.is_some()) {
        Confidence::Full
    } else {
        Confidence::Partial
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample(process: &str, title: &str) -> Sample {
        Sample {
            has_window: true,
            process_name: Some(process.into()),
            app_name: Some("App".into()),
            window_title: Some(title.into()),
        }
    }

    #[test]
    fn excluded_apps_keep_nothing_identifying() {
        let blank = Sample { has_window: true, ..Sample::default() };
        for (p, ex) in [("KeePassXC.exe", vec![]), ("Discord.exe", vec!["discord.exe".to_string()]), ("discord.exe", vec!["DISCORD.EXE".to_string()])] {
            assert_eq!(apply(sample(p, "secret"), &ex), (blank.clone(), Some(Redaction::Excluded)), "{p}");
        }
        assert_eq!(apply(sample("discord.exe", "chat"), &[]).1, None);
    }

    #[test]
    fn private_windows_drop_only_the_title_and_only_in_browsers() {
        for (p, t) in [
            ("msedge.exe", "Bank - [InPrivate] - Microsoft\u{200b} Edge"),
            ("firefox.exe", "Bank — Mozilla Firefox Private Browsing"),
            ("chrome.exe", "Bank - Google Chrome (Incognito)"),
            ("Brave.exe", "Bank - Brave (Private)"),
        ] {
            let (s, r) = apply(sample(p, t), &[]);
            assert_eq!(r, Some(Redaction::Private), "{t}");
            assert_eq!((s.window_title, s.process_name.as_deref(), s.app_name.as_deref()), (None, Some(p), Some("App")));
        }
        for (p, t) in [
            ("notepad.exe", "Notes (Private)"),
            ("winword.exe", "Private Browsing"),
            ("chrome.exe", "Private Browsing explained - Google Chrome"),
            ("firefox.exe", "My private notes — Mozilla Firefox"),
        ] {
            assert_eq!(apply(sample(p, t), &[]), (sample(p, t), None), "{t}");
        }
    }

    #[test]
    fn an_unreadable_process_keeps_no_title() {
        let s = Sample { has_window: true, process_name: None, app_name: None, window_title: Some("Secret".into()) };
        let (out, r) = apply(s, &[]);
        assert_eq!((out.window_title.as_deref(), r), (None, None));
        assert_eq!(confidence(&out, r), Confidence::Partial);
    }

    #[test]
    fn titles_are_cleaned_and_bounded_by_chars() {
        let long = "é".repeat(TITLE_MAX + 10);
        let t = apply(sample("a.exe", &long), &[]).0.window_title.unwrap();
        assert_eq!(t.chars().count(), TITLE_MAX);
        assert_eq!(apply(sample("a.exe", "  a\u{0}b\tc\r\n "), &[]).0.window_title.as_deref(), Some("abc"));
        assert_eq!(apply(sample("a.exe", " \u{7}\n "), &[]).0.window_title, None);
        let name = apply(sample(&"n".repeat(300), "t"), &[]).0.process_name.unwrap();
        assert_eq!(name.len(), NAME_MAX);
    }

    #[test]
    fn confidence_cases() {
        let none = Sample::default();
        assert_eq!(confidence(&none, None), Confidence::None);
        assert_eq!(confidence(&sample("a.exe", "t"), None), Confidence::Full);
        let no_title = Sample { window_title: None, ..sample("a.exe", "t") };
        assert_eq!(confidence(&no_title, None), Confidence::Partial);
        assert_eq!(confidence(&no_title, Some(Redaction::Private)), Confidence::Full);
        let blank = Sample { has_window: true, ..Sample::default() };
        assert_eq!(confidence(&blank, None), Confidence::Partial);
        assert_eq!(confidence(&blank, Some(Redaction::Excluded)), Confidence::Full);
    }
}
