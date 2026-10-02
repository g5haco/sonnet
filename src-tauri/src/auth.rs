//! Desktop sign-in handoff (spec §7). An emailed link opens in the system browser, where the sign-in
//! code can't be redeemed (its verifier lives in this app's webview). `/auth/desktop` bounces the
//! code back as `sonnet://auth/callback?code=...`, and this module decides whether to accept it:
//! only while the page has asked for a sign-in (`auth_begin`) in the last 15 minutes, only once,
//! and only with that one parameter. Accepting it sends the webview to
//! the site's own `/auth/confirm`, which redeems the code with the webview's verifier.

use std::{
    sync::Mutex,
    time::{Duration, SystemTime},
};
use tauri::Url;

const TTL: Duration = Duration::from_secs(15 * 60);

/// The characters of a Supabase code. Nothing else is ever put in a URL.
fn token_ok(s: &str) -> bool {
    !s.is_empty() && s.len() <= 512 && s.bytes().all(|b| b.is_ascii_alphanumeric() || b == b'-' || b == b'_')
}

/// `sonnet://auth/callback?code=...` with exactly that one parameter. Only a PKCE `code` is accepted: it can be
/// redeemed only with the verifier this app's webview holds, so a code someone else made fails. A `token_hash`
/// would sign in whoever made it, so it is deliberately not handed over.
pub fn parse_callback(url: &Url) -> Option<String> {
    if url.scheme() != "sonnet"
        || url.host_str() != Some("auth")
        || url.path() != "/callback"
        || url.port().is_some()
        || !url.username().is_empty()
        || url.password().is_some()
        || url.fragment().is_some()
    {
        return None;
    }
    let pairs: Vec<(String, String)> = url.query_pairs().map(|(k, v)| (k.into_owned(), v.into_owned())).collect();
    match pairs.as_slice() {
        [(k, v)] if k == "code" && token_ok(v) => Some(v.clone()),
        _ => None,
    }
}

/// The site's own callback route, with the validated code.
pub fn confirm_url(site: &Url, code: &str) -> Url {
    let mut url = site.join("/auth/confirm").expect("confirm url joins");
    url.query_pairs_mut().append_pair("code", code);
    url
}

/// A sign-in the page has started and not yet finished. Memory only: quitting the app drops it.
#[derive(Default)]
pub struct Handoff(Mutex<Option<SystemTime>>);

impl Handoff {
    pub fn begin(&self) {
        *self.0.lock().unwrap() = Some(SystemTime::now());
    }

    /// True once per `begin`, within the time limit. A clock that stepped backwards counts as expired.
    pub fn consume(&self) -> bool {
        self.consume_at(SystemTime::now())
    }

    fn consume_at(&self, now: SystemTime) -> bool {
        let started = self.0.lock().unwrap().take();
        started.is_some_and(|t| now.duration_since(t).is_ok_and(|d| d < TTL))
    }

    #[cfg(test)]
    fn begin_at(&self, t: SystemTime) {
        *self.0.lock().unwrap() = Some(t);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn parse(s: &str) -> Option<String> {
        parse_callback(&Url::parse(s).unwrap())
    }

    #[test]
    fn accepts_a_code() {
        assert_eq!(parse("sonnet://auth/callback?code=3f2a-9B_c"), Some("3f2a-9B_c".into()));
    }

    #[test]
    fn rejects_everything_else() {
        for u in [
            "sonnet://auth/callback",
            "sonnet://auth/callback?code=",
            "sonnet://auth/callback?code=a%20b",
            "sonnet://auth/callback?code=a/b",
            "sonnet://auth/callback?code=<script>",
            "sonnet://auth/callback?code=ab&extra=1",
            "sonnet://auth/callback?code=ab&code=cd",
            "sonnet://auth/callback?code=ab&token_hash=cd&type=email",
            "sonnet://auth/callback?token_hash=cd&type=email",
            "sonnet://auth/callback?token_hash=cd",
            "sonnet://auth/callback?type=email",
            "sonnet://auth/callback?code=ab#frag",
            "sonnet://auth/callback/extra?code=ab",
            "sonnet://auth/other?code=ab",
            "sonnet://evil/callback?code=ab",
            "sonnet://user@auth/callback?code=ab",
            "sonnet://auth:80/callback?code=ab",
            "https://auth/callback?code=ab",
            "sonnetx://auth/callback?code=ab",
        ] {
            assert_eq!(parse(u), None, "{u}");
        }
        let long = format!("sonnet://auth/callback?code={}", "a".repeat(513));
        assert_eq!(parse(&long), None);
    }

    #[test]
    fn confirm_url_goes_to_the_sites_own_route() {
        let site = Url::parse("https://www.ericwei.me").unwrap();
        assert_eq!(confirm_url(&site, "abc").as_str(), "https://www.ericwei.me/auth/confirm?code=abc");
    }

    #[test]
    fn handoff_is_one_use_and_expires() {
        let h = Handoff::default();
        assert!(!h.consume(), "nothing pending");
        h.begin();
        assert!(h.consume());
        assert!(!h.consume(), "already used");

        let t0 = SystemTime::now();
        h.begin_at(t0);
        assert!(!h.consume_at(t0 + TTL), "expired at the limit");
        h.begin_at(t0);
        assert!(h.consume_at(t0 + TTL - Duration::from_secs(1)));
        h.begin_at(t0);
        assert!(!h.consume_at(t0 - Duration::from_secs(5)), "a clock that went backwards is expired");
    }
}
