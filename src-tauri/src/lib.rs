//! Sonnet desktop shell: one window over the live site. No local server, no second UI.
//! Native commands: `app_info`, `auth_begin` (the email-link sign-in handoff, see `auth`) and the
//! `focus_sense_*` set (foreground-context sensing during focus sessions, see `focus_sense`).

mod auth;
mod focus_sense;

use std::{
    net::{TcpStream, ToSocketAddrs},
    sync::{mpsc, Arc, Mutex},
    thread,
    time::{Duration, SystemTime},
};

use serde::Serialize;
use tauri::{
    http::Response,
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    webview::NewWindowResponse,
    AppHandle, Manager, State, Url, WebviewUrl, WebviewWindowBuilder, WindowEvent,
};
use tauri_plugin_deep_link::DeepLinkExt;
use tauri_plugin_window_state::{AppHandleExt, StateFlags};

const MAIN: &str = "main";
const PROD_ORIGIN: &str = "https://www.ericwei.me";
const DEV_ORIGIN: &str = "http://localhost:3000";
const OFFLINE_SCHEME: &str = "sonnet-offline";
/// Windows and Android serve custom schemes as `http://<scheme>.localhost`.
const OFFLINE_WINDOWS_HOST: &str = "sonnet-offline.localhost";
const OFFLINE_HTML: &str = include_str!("../offline/offline.html");
const OFFLINE_CSP: &str = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; \
                           connect-src https: http://localhost:*; base-uri 'none'; form-action 'none'";
/// Reload when the window was hidden at least this long (deploy skew, spec §11).
const STALE_AFTER_SECS: u64 = 15 * 60;
/// Size and position only. `VISIBLE` is left out so a quit-from-tray never restores a hidden window.
const STATE_FLAGS: StateFlags = StateFlags::SIZE
    .union(StateFlags::POSITION)
    .union(StateFlags::MAXIMIZED)
    .union(StateFlags::FULLSCREEN);

/// Where the window may go. Everything else is handed to the system browser or dropped.
#[derive(Debug, PartialEq)]
enum Nav {
    Internal,
    External,
    Drop,
}

#[derive(Default)]
struct Shell {
    /// Wall-clock, not `Instant`: on macOS `Instant` stops during system sleep, and a Mac
    /// that slept overnight is exactly the stale-deploy case reload-on-show is for.
    hidden_at: Mutex<Option<SystemTime>>,
}

#[derive(Serialize)]
struct AppInfo {
    shell: &'static str,
    bridge: u32,
    os: &'static str,
    caps: Vec<&'static str>,
}

/// Pages that never get the bridge (spec §7): shared content, public pages, auth callbacks.
/// Tauri's capability check sees only the request Origin, not the page path, so every
/// command must apply this itself against the webview's real URL.
fn bridge_path_allowed(path: &str) -> bool {
    const DENIED: [&str; 5] = ["/f", "/landing", "/auth", "/privacy", "/terms"];
    !DENIED
        .iter()
        .any(|d| path == *d || path.strip_prefix(d).is_some_and(|rest| rest.starts_with('/')))
}

#[tauri::command]
async fn app_info(webview: tauri::Webview) -> Result<AppInfo, String> {
    let url = webview.url().map_err(|e| e.to_string())?;
    if !bridge_path_allowed(url.path()) {
        return Err("not available on this page".into());
    }
    Ok(AppInfo {
        shell: env!("CARGO_PKG_VERSION"),
        bridge: 1,
        os: if cfg!(target_os = "windows") {
            "windows"
        } else if cfg!(target_os = "macos") {
            "macos"
        } else {
            "linux"
        },
        caps: Vec::new(),
    })
}

/// The page asks for an emailed-link sign-in to be accepted by the app. Only the sign-in page may.
#[tauri::command]
async fn auth_begin(webview: tauri::Webview, handoff: State<'_, auth::Handoff>) -> Result<(), String> {
    let url = webview.url().map_err(|e| e.to_string())?;
    if !is_site_page(&url, &site_origin()) || url.path() != "/login" {
        return Err("not available on this page".into());
    }
    handoff.begin();
    log::info!("sign-in handoff started");
    Ok(())
}

/// A `sonnet://` link reached the app. Only a well-formed sign-in callback is acted on, and its code is
/// used only if the sign-in page started one. Logs never carry the code.
fn handle_deep_link(app: &AppHandle, url: &Url) {
    let Some(code) = auth::parse_callback(url) else {
        log::info!("ignored a sonnet:// link: not a sign-in callback");
        return;
    };
    let Some(win) = app.get_webview_window(MAIN) else { return };
    let site = site_origin();
    let target = if app.state::<auth::Handoff>().consume() {
        log::info!("sign-in callback accepted");
        auth::confirm_url(&site, &code)
    } else {
        // A real link that arrives late (or after a restart) can't be used. Say so; the code is never read.
        log::info!("sign-in callback with none pending: showing the expired message");
        let mut login = site.join("/login").expect("login url joins");
        login.set_query(Some("expired=1"));
        login
    };
    let _ = win.navigate(target);
    let _ = win.show();
    let _ = win.unminimize();
    let _ = win.set_focus();
}

/// The site the window loads. Release builds always use production. Debug builds
/// use localhost:3000, or `SONNET_DESKTOP_ORIGIN` (to test the offline page).
fn site_origin() -> Url {
    if cfg!(debug_assertions) {
        if let Some(url) = std::env::var("SONNET_DESKTOP_ORIGIN")
            .ok()
            .and_then(|v| Url::parse(&v).ok())
            .filter(|u| matches!(u.scheme(), "http" | "https") && u.has_host())
        {
            return Url::parse(&url.origin().ascii_serialization()).expect("origin parses");
        }
        return Url::parse(DEV_ORIGIN).expect("dev origin parses");
    }
    Url::parse(PROD_ORIGIN).expect("prod origin parses")
}

/// Debug builds can shorten the threshold with `SONNET_DESKTOP_STALE_SECS` to test reload-on-show.
fn stale_after() -> Duration {
    let secs = if cfg!(debug_assertions) {
        std::env::var("SONNET_DESKTOP_STALE_SECS").ok().and_then(|v| v.parse().ok())
    } else {
        None
    };
    Duration::from_secs(secs.unwrap_or(STALE_AFTER_SECS))
}

fn start_url(site: &Url) -> Url {
    site.join("/login").expect("start url joins")
}

fn is_offline_page(url: &Url) -> bool {
    url.scheme() == OFFLINE_SCHEME
        || (url.scheme() == "http" && url.host_str() == Some(OFFLINE_WINDOWS_HOST))
}

/// A page of the site itself over http(s): the only kind the shell reloads or returns to.
fn is_site_page(url: &Url, site: &Url) -> bool {
    matches!(url.scheme(), "http" | "https") && url.origin() == site.origin()
}

/// Only the shell's own offline URL: exact host, no port, path `/`, and a single `to` that
/// is a page of the site. Site content linking to the offline page any other way is refused.
fn is_own_offline_url(url: &Url, site: &Url) -> bool {
    let mut to = url.query_pairs().filter(|(k, _)| k == "to");
    let (Some((_, back)), None) = (to.next(), to.next()) else {
        return false;
    };
    is_offline_page(url)
        && url.port().is_none()
        && url.path() == "/"
        && Url::parse(&back).is_ok_and(|b| is_site_page(&b, site))
}

/// The navigation lock: the window stays on the site's origin and the shell's own offline page.
fn classify(url: &Url, site: &Url) -> Nav {
    if url.as_str() == "about:blank" || is_own_offline_url(url, site) || url.origin() == site.origin() {
        return Nav::Internal;
    }
    if is_offline_page(url) {
        return Nav::Drop;
    }
    match url.scheme() {
        "http" | "https" => Nav::External,
        _ => Nav::Drop,
    }
}

fn offline_url(back_to: &Url) -> Url {
    let base = if cfg!(any(target_os = "windows", target_os = "android")) {
        format!("http://{OFFLINE_WINDOWS_HOST}/")
    } else {
        format!("{OFFLINE_SCHEME}://localhost/")
    };
    let mut url = Url::parse(&base).expect("offline url parses");
    url.query_pairs_mut().append_pair("to", back_to.as_str());
    url
}

/// Logs the origin only: full URLs can carry sign-in tokens.
fn open_external(app: &AppHandle, url: &Url) {
    log::info!("opening external link in the system browser: {}", url.origin().ascii_serialization());
    if let Err(err) = tauri_plugin_opener::OpenerExt::opener(app).open_url(url.as_str(), None::<&str>) {
        log::warn!("could not open external link: {err}");
    }
}

/// A TCP connect to the site's host. Says "can we reach the server", not "will the page load".
fn reachable(site: &Url) -> bool {
    let Some(host) = site.host_str().map(str::to_owned) else {
        return false;
    };
    let port = site.port_or_known_default().unwrap_or(443);
    let (tx, rx) = mpsc::channel();
    thread::spawn(move || {
        let ok = (host.as_str(), port).to_socket_addrs().is_ok_and(|mut addrs| {
            addrs.any(|a| TcpStream::connect_timeout(&a, Duration::from_secs(3)).is_ok())
        });
        let _ = tx.send(ok);
    });
    rx.recv_timeout(Duration::from_secs(5)).unwrap_or(false)
}

/// Brings the window back to the right page: leaves the offline page once the site is
/// reachable, shows it when the site isn't, and reloads an online page when asked.
fn refresh(app: &AppHandle, reload_online_page: bool) {
    let app = app.clone();
    thread::spawn(move || {
        let Some(win) = app.get_webview_window(MAIN) else { return };
        let site = site_origin();
        let current = win.url().ok();
        let on_offline = current.as_ref().is_some_and(is_offline_page);
        let online = reachable(&site);
        let result = match (online, on_offline) {
            (true, true) => {
                let back = current
                    .as_ref()
                    .and_then(|u| u.query_pairs().find(|(k, _)| k == "to"))
                    .and_then(|(_, v)| Url::parse(&v).ok())
                    .filter(|u| is_site_page(u, &site))
                    .unwrap_or_else(|| start_url(&site));
                win.navigate(back)
            }
            (true, false) if reload_online_page => win.reload(),
            (false, false) if reload_online_page => {
                let back = current.filter(|u| is_site_page(u, &site));
                win.navigate(offline_url(&back.unwrap_or_else(|| start_url(&site))))
            }
            _ => Ok(()),
        };
        if let Err(err) = result {
            log::warn!("refresh failed: {err}");
        }
    });
}

fn hide_main(app: &AppHandle) {
    if let Some(win) = app.get_webview_window(MAIN) {
        let _ = app.save_window_state(STATE_FLAGS);
        let _ = win.hide();
        *app.state::<Shell>().hidden_at.lock().unwrap() = Some(SystemTime::now());
    }
}

fn show_main(app: &AppHandle) {
    let hidden_since = app.state::<Shell>().hidden_at.lock().unwrap().take();
    if let Some(win) = app.get_webview_window(MAIN) {
        let _ = win.show();
        let _ = win.unminimize();
        let _ = win.set_focus();
    }
    // A clock that stepped backwards counts as stale.
    let stale = hidden_since.is_some_and(|t| t.elapsed().map_or(true, |d| d >= stale_after()));
    refresh(app, stale);
}

fn toggle_main(app: &AppHandle) {
    let showing = app
        .get_webview_window(MAIN)
        .is_some_and(|w| w.is_visible().unwrap_or(false) && !w.is_minimized().unwrap_or(false));
    if showing {
        hide_main(app);
    } else {
        show_main(app);
    }
}

fn build_tray(app: &AppHandle) -> tauri::Result<()> {
    let open = MenuItem::with_id(app, "open", "Open Sonnet", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit Sonnet", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&open, &quit])?;
    let mut tray = TrayIconBuilder::with_id("main")
        .tooltip("Sonnet")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "open" => show_main(app),
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                toggle_main(tray.app_handle());
            }
        });
    if let Some(icon) = app.default_window_icon() {
        tray = tray.icon(icon.clone());
    }
    tray.build(app)?;
    Ok(())
}

fn build_main_window(app: &AppHandle) -> tauri::Result<()> {
    let site = site_origin();
    let start = start_url(&site);
    let first = if reachable(&site) {
        start.clone()
    } else {
        log::warn!("site unreachable at startup, showing the offline page");
        offline_url(&start)
    };

    let nav_app = app.clone();
    let nav_site = site.clone();
    let win_app = app.clone();
    let win_site = site.clone();
    WebviewWindowBuilder::new(app, MAIN, WebviewUrl::External(first))
        .title("Sonnet")
        // Tauri otherwise replaces WebView2's drop handler on Windows, so files dragged in from
        // Explorer never reach the page's HTML5 drop zones (chat attachments, materials).
        // A drop that misses a zone should navigate to file://, which the navigation lock drops.
        .disable_drag_drop_handler()
        .inner_size(1280.0, 800.0)
        .min_inner_size(480.0, 600.0)
        .on_navigation(move |url| match classify(url, &nav_site) {
            Nav::Internal => true,
            Nav::External => {
                open_external(&nav_app, url);
                false
            }
            Nav::Drop => {
                log::info!("dropped navigation to scheme {}", url.scheme());
                false
            }
        })
        .on_new_window(move |url, _features| {
            // `window.open()` arrives as about:blank; only real site pages replace the window.
            if is_site_page(&url, &win_site) {
                if let Some(win) = win_app.get_webview_window(MAIN) {
                    let _ = win.navigate(url);
                }
            } else if classify(&url, &win_site) == Nav::External {
                open_external(&win_app, &url);
            } else {
                log::info!("dropped new window ({})", url.scheme());
            }
            NewWindowResponse::Deny
        })
        .build()?;
    Ok(())
}

/// Debug builds also let the dev server call `app_info`. Under `tauri dev` the dev URL
/// counts as a local origin. Any other origin, or a `--debug` build without a dev URL,
/// is remote and matched by origin, as in production.
#[cfg(debug_assertions)]
fn add_dev_capability(app: &AppHandle) -> tauri::Result<()> {
    let site = site_origin();
    let origin = site.origin().ascii_serialization();
    app.add_capability(
        tauri::ipc::CapabilityBuilder::new("dev")
            .window(MAIN)
            .local(origin == DEV_ORIGIN)
            .remote(origin)
            .permission("allow-app-info")
            .permission("allow-auth-begin")
            .permission("allow-focus-sense-status")
            .permission("allow-focus-sense-configure")
            .permission("allow-focus-sense-start")
            .permission("allow-focus-sense-stop")
            .permission("allow-focus-sense-events")
            .permission("allow-focus-sense-clear"),
    )
}

pub fn run() {
    let log_level = if cfg!(debug_assertions) {
        log::LevelFilter::Debug
    } else {
        log::LevelFilter::Info
    };

    tauri::Builder::default()
        // Must be first: a second launch shows the running window instead.
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| show_main(app)))
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(log_level)
                .max_file_size(1_000_000)
                .rotation_strategy(tauri_plugin_log::RotationStrategy::KeepSome(3))
                .targets([
                    tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Stdout),
                    tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::LogDir {
                        file_name: Some("sonnet".into()),
                    }),
                ])
                .build(),
        )
        .plugin(tauri_plugin_window_state::Builder::default().with_state_flags(STATE_FLAGS).build())
        // Used from Rust only. No opener permission is granted to any page, and its injected
        // click handler is off: it would swallow `target=_blank` clicks (then be denied) before
        // they reach `on_new_window`.
        .plugin(tauri_plugin_opener::Builder::new().open_js_links_on_click(false).build())
        // After single-instance, which forwards a second launch's `sonnet://` argument to it.
        .plugin(tauri_plugin_deep_link::init())
        .register_uri_scheme_protocol(OFFLINE_SCHEME, |_ctx, _req| {
            Response::builder()
                .header("Content-Type", "text/html; charset=utf-8")
                .header("Content-Security-Policy", OFFLINE_CSP)
                .header("Cache-Control", "no-store")
                .header("X-Content-Type-Options", "nosniff")
                .body(OFFLINE_HTML.as_bytes().to_vec())
                .expect("offline response builds")
        })
        .manage(Shell::default())
        .manage(auth::Handoff::default())
        .invoke_handler(tauri::generate_handler![
            app_info,
            auth_begin,
            focus_sense::focus_sense_status,
            focus_sense::focus_sense_configure,
            focus_sense::focus_sense_start,
            focus_sense::focus_sense_stop,
            focus_sense::focus_sense_events,
            focus_sense::focus_sense_clear
        ])
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                if window.label() == MAIN {
                    api.prevent_close();
                    hide_main(window.app_handle());
                }
            }
        })
        .setup(|app| {
            let handle = app.handle();
            log::info!(
                "Sonnet desktop {} starting, site {}",
                env!("CARGO_PKG_VERSION"),
                site_origin().origin().ascii_serialization()
            );
            #[cfg(debug_assertions)]
            {
                add_dev_capability(handle)?;
                // Installed builds register the scheme in the installer. A debug exe registers itself only
                // when asked, because that points the user's sonnet:// links at the dev exe.
                if std::env::var_os("SONNET_DESKTOP_REGISTER_SCHEME").is_some() {
                    handle.deep_link().register_all()?;
                }
            }
            let link_handle = handle.clone();
            handle.deep_link().on_open_url(move |event| {
                for url in event.urls() {
                    handle_deep_link(&link_handle, &url);
                }
            });
            // Focus Sense data lives beside the webview profile. Nothing runs until a focus session asks.
            let store = Arc::new(focus_sense::store::Store::new(handle.path().app_local_data_dir()?.join("focus-sense")));
            let _ = store.prune(SystemTime::now());
            handle.manage(focus_sense::FocusSense::new(store));
            build_tray(handle)?;
            build_main_window(handle)?;
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building Sonnet desktop")
        .run(|_app, _event| {
            // Quitting ends a running monitor cleanly, so its session file gets its stop marker.
            if let tauri::RunEvent::Exit = _event {
                _app.state::<focus_sense::FocusSense>().monitor.stop();
            }
            // The dock icon brings a hidden window back on macOS.
            #[cfg(target_os = "macos")]
            if let tauri::RunEvent::Reopen { .. } = _event {
                show_main(_app);
            }
        });
}

#[cfg(test)]
mod tests {
    use super::*;

    fn site() -> Url {
        Url::parse(PROD_ORIGIN).unwrap()
    }

    fn nav(s: &str) -> Nav {
        classify(&Url::parse(s).unwrap(), &site())
    }

    #[test]
    fn site_pages_stay_inside() {
        assert_eq!(nav("https://www.ericwei.me/"), Nav::Internal);
        assert_eq!(nav("https://www.ericwei.me/courses?x=1#y"), Nav::Internal);
        assert_eq!(nav("https://www.ericwei.me:443/login"), Nav::Internal);
        assert_eq!(nav("about:blank"), Nav::Internal);
    }

    #[test]
    fn own_offline_page_stays_inside() {
        let ok = "https://www.ericwei.me/courses";
        assert_eq!(nav(&format!("http://sonnet-offline.localhost/?to={ok}")), Nav::Internal);
        assert_eq!(nav(&format!("sonnet-offline://localhost/?to={ok}")), Nav::Internal);
    }

    #[test]
    fn site_content_cannot_drive_the_offline_page() {
        for u in [
            "http://sonnet-offline.localhost/",
            "http://sonnet-offline.localhost/?to=https://evil.example/x",
            "http://sonnet-offline.localhost/?to=http://localhost:5000/",
            "http://sonnet-offline.localhost/?to=javascript:alert(1)",
            "http://sonnet-offline.localhost/?to=http://sonnet-offline.localhost/?to=https://www.ericwei.me/",
            "http://sonnet-offline.localhost:3000/?to=https://www.ericwei.me/",
            "http://sonnet-offline.localhost/x?to=https://www.ericwei.me/",
            "http://sonnet-offline.localhost/?to=https://www.ericwei.me/&to=https://evil.example/",
            "sonnet-offline://localhost/?to=https://evil.example/",
        ] {
            assert_eq!(nav(u), Nav::Drop, "{u}");
        }
    }

    #[test]
    fn only_site_pages_count_as_site_pages() {
        let s = site();
        assert!(is_site_page(&Url::parse("https://www.ericwei.me/x").unwrap(), &s));
        for u in ["about:blank", "http://sonnet-offline.localhost/", "https://evil.example/", "blob:https://www.ericwei.me/1"] {
            assert!(!is_site_page(&Url::parse(u).unwrap(), &s), "{u}");
        }
    }

    #[test]
    fn lookalike_hosts_are_external() {
        assert_eq!(nav("https://www.ericwei.me.evil.com/"), Nav::External);
        assert_eq!(nav("https://evil.com/www.ericwei.me"), Nav::External);
        assert_eq!(nav("https://www.ericwei.me@evil.com/"), Nav::External);
        assert_eq!(nav("https://ericwei.me/"), Nav::External);
        assert_eq!(nav("http://www.ericwei.me/"), Nav::External);
        assert_eq!(nav("https://www.ericwei.me:8443/"), Nav::External);
        assert_eq!(nav("http://sonnet-offline.localhost.evil.com/"), Nav::External);
        assert_eq!(nav("https://sonnet-offline.localhost/?to=https://www.ericwei.me/"), Nav::External);
    }

    #[test]
    fn other_schemes_are_dropped() {
        for u in ["javascript:alert(1)", "file:///c:/x", "mailto:a@b.c", "data:text/html,hi", "tauri://localhost/"] {
            assert_eq!(nav(u), Nav::Drop, "{u}");
        }
    }

    #[test]
    fn offline_url_round_trips_the_return_page() {
        let back = Url::parse("https://www.ericwei.me/courses?a=1&b=2").unwrap();
        let url = offline_url(&back);
        assert!(is_offline_page(&url));
        let to = url.query_pairs().find(|(k, _)| k == "to").unwrap().1.into_owned();
        assert_eq!(to, back.as_str());
    }

    #[test]
    fn bridge_is_denied_on_public_and_shared_pages() {
        for p in ["/f", "/f/abc", "/landing", "/landing/x", "/auth/confirm", "/auth/desktop", "/privacy", "/terms"] {
            assert!(!bridge_path_allowed(p), "{p}");
        }
        for p in ["/", "/login", "/courses", "/focus", "/files", "/fx", "/privacy-policy", "/authors"] {
            assert!(bridge_path_allowed(p), "{p}");
        }
    }

    #[test]
    fn packaged_capability_names_only_the_apps_own_commands() {
        let cap = include_str!("../capabilities/main.json");
        assert!(cap.contains("\"https://www.ericwei.me\""));
        assert!(cap.contains("\"local\": false"));
        assert!(cap.contains("allow-app-info") && cap.contains("allow-auth-begin"));
        for c in focus_sense::COMMANDS {
            assert!(cap.contains(&format!("allow-{}", c.replace('_', "-"))), "{c}");
        }
        assert_eq!(cap.matches("\"allow-").count(), 2 + focus_sense::COMMANDS.len(), "no other permission");
        assert!(!cap.contains("core:") && !cap.contains("fs:") && !cap.contains("shell"));
        assert!(!cap.contains("opener") && !cap.contains("window-state") && !cap.contains("deep-link"));
    }
}
