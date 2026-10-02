//! The platform adapter: what is in front right now. Read-only: no hooks, no injected code, no
//! messages sent to other processes.
//!
//! macOS is not built. A future adapter would use `NSWorkspace.frontmostApplication` (no permission
//! needed) for the app's identity; window titles need the Accessibility permission. Until one is built
//! and tested on a Mac, `supported()` is false there.

use super::Sample;

/// "windows" | "macos" | "other"
pub const PLATFORM: &str = if cfg!(windows) {
    "windows"
} else if cfg!(target_os = "macos") {
    "macos"
} else {
    "other"
};

/// True only where a real sensor exists (Windows).
pub fn supported() -> bool {
    cfg!(windows)
}

pub trait Sensor: Send {
    fn sample(&mut self) -> Sample;
}

/// None where unsupported.
#[cfg(windows)]
pub fn platform_sensor() -> Option<Box<dyn Sensor>> {
    Some(Box::new(win::Foreground::default()))
}

/// None where unsupported.
#[cfg(not(windows))]
pub fn platform_sensor() -> Option<Box<dyn Sensor>> {
    None
}

#[cfg(windows)]
mod win {
    use super::{Sample, Sensor};
    use std::{collections::HashMap, ffi::c_void, ffi::OsString, os::windows::ffi::OsStringExt, path::Path, ptr};

    type Handle = *mut c_void;

    #[link(name = "user32")]
    extern "system" {
        fn GetForegroundWindow() -> Handle;
        fn GetWindowTextLengthW(hwnd: Handle) -> i32;
        fn GetWindowTextW(hwnd: Handle, text: *mut u16, max: i32) -> i32;
        fn GetWindowThreadProcessId(hwnd: Handle, pid: *mut u32) -> u32;
        fn GetLastInputInfo(info: *mut LastInputInfo) -> i32;
    }

    /// LASTINPUTINFO: only the tick of the last keyboard/mouse input, never the input itself.
    #[repr(C)]
    struct LastInputInfo {
        size: u32,
        time: u32,
    }

    #[link(name = "kernel32")]
    extern "system" {
        fn GetTickCount() -> u32;
        fn OpenProcess(access: u32, inherit: i32, pid: u32) -> Handle;
        fn QueryFullProcessImageNameW(process: Handle, flags: u32, name: *mut u16, size: *mut u32) -> i32;
        fn CloseHandle(handle: Handle) -> i32;
    }

    #[link(name = "version")]
    extern "system" {
        fn GetFileVersionInfoSizeW(file: *const u16, ignored: *mut u32) -> u32;
        fn GetFileVersionInfoW(file: *const u16, ignored: u32, len: u32, data: *mut c_void) -> i32;
        fn VerQueryValueW(block: *const c_void, sub: *const u16, value: *mut *mut c_void, len: *mut u32) -> i32;
    }

    const PROCESS_QUERY_LIMITED_INFORMATION: u32 = 0x1000;
    /// Longest Windows path, in UTF-16 units.
    const PATH_MAX: usize = 32_768;
    const NAMES_MAX: usize = 64;

    /// The foreground window's process, title and app name. The process is re-read only when the
    /// foreground pid changes; app names are cached per exe path.
    // ponytail: a pid reused by a new process within one poll keeps the old identity until focus moves.
    #[derive(Default)]
    pub struct Foreground {
        pid: u32,
        process_name: Option<String>,
        app_name: Option<String>,
        names: HashMap<Vec<u16>, Option<String>>,
    }

    impl Sensor for Foreground {
        fn sample(&mut self) -> Sample {
            // SAFETY: no arguments; returns a window handle or null.
            let hwnd = unsafe { GetForegroundWindow() };
            let idle = idle_ms().is_some_and(|ms| ms >= super::super::IDLE_AFTER_MS);
            if hwnd.is_null() {
                return Sample { idle, ..Sample::default() };
            }
            let mut pid = 0;
            // SAFETY: `pid` is a valid out pointer; a stale hwnd makes the call fail and leave it 0.
            unsafe { GetWindowThreadProcessId(hwnd, &mut pid) };
            if pid != self.pid {
                self.pid = pid;
                (self.process_name, self.app_name) = self.identify(pid);
            }
            // Our own window's title would be fetched with a message to our UI thread, which can be
            // blocked joining this thread at exit. Other processes' titles are read without messages.
            let window_title = if pid == std::process::id() { None } else { title(hwnd) };
            Sample { has_window: true, process_name: self.process_name.clone(), app_name: self.app_name.clone(), window_title, idle }
        }
    }

    /// Milliseconds since the last keyboard or mouse input anywhere in this session (the system idle timer).
    fn idle_ms() -> Option<u64> {
        let mut info = LastInputInfo { size: std::mem::size_of::<LastInputInfo>() as u32, time: 0 };
        // SAFETY: `info` is a valid LASTINPUTINFO with its size set.
        if unsafe { GetLastInputInfo(&mut info) } == 0 {
            return None;
        }
        // SAFETY: no arguments. Both values are 32-bit tick counts, so the difference wraps correctly.
        Some(u64::from(unsafe { GetTickCount() }.wrapping_sub(info.time)))
    }

    impl Foreground {
        fn identify(&mut self, pid: u32) -> (Option<String>, Option<String>) {
            let Some(path) = image_path(pid) else { return (None, None) };
            let process_name = Path::new(&OsString::from_wide(&path)).file_name().map(|n| n.to_string_lossy().into_owned());
            if !self.names.contains_key(&path) && self.names.len() >= NAMES_MAX {
                self.names.clear();
            }
            let app_name = self.names.entry(path).or_insert_with_key(|p| description(p)).clone();
            (process_name, app_name)
        }
    }

    fn title(hwnd: Handle) -> Option<String> {
        // SAFETY: a stale hwnd makes the call return 0.
        let len = unsafe { GetWindowTextLengthW(hwnd) };
        if len <= 0 {
            return None;
        }
        let mut buf = vec![0u16; len as usize + 1];
        // SAFETY: `buf` holds `buf.len()` units; the call writes at most that many, NUL included.
        let n = unsafe { GetWindowTextW(hwnd, buf.as_mut_ptr(), buf.len() as i32) };
        (n > 0).then(|| String::from_utf16_lossy(&buf[..(n as usize).min(len as usize)]))
    }

    /// The exe's full path, in memory only. Fails for elevated or protected processes.
    fn image_path(pid: u32) -> Option<Vec<u16>> {
        if pid == 0 {
            return None;
        }
        // SAFETY: plain call; null means no access or no such process.
        let process = unsafe { OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, 0, pid) };
        if process.is_null() {
            return None;
        }
        let mut buf = vec![0u16; PATH_MAX];
        let mut len = buf.len() as u32;
        // SAFETY: `process` is open; `buf` holds `len` units and the call writes at most that many.
        let ok = unsafe { QueryFullProcessImageNameW(process, 0, buf.as_mut_ptr(), &mut len) };
        // SAFETY: opened above, closed exactly once.
        unsafe { CloseHandle(process) };
        buf.truncate((len as usize).min(PATH_MAX));
        (ok != 0 && !buf.is_empty()).then_some(buf)
    }

    fn nul_terminated(s: impl IntoIterator<Item = u16>) -> Vec<u16> {
        s.into_iter().chain([0]).collect()
    }

    /// The exe's version resource `FileDescription`, e.g. "Google Chrome".
    fn description(path: &[u16]) -> Option<String> {
        let file = nul_terminated(path.iter().copied());
        // SAFETY: `file` is NUL-terminated; a null out pointer is allowed for the ignored handle.
        let size = unsafe { GetFileVersionInfoSizeW(file.as_ptr(), ptr::null_mut()) };
        if size == 0 {
            return None;
        }
        let mut data = vec![0u8; size as usize];
        // SAFETY: `data` has `size` writable bytes.
        if unsafe { GetFileVersionInfoW(file.as_ptr(), 0, size, data.as_mut_ptr().cast()) } == 0 {
            return None;
        }
        let mut langs = Vec::new();
        if let Some(t) = value(&data, r"\VarFileInfo\Translation", 1).filter(|t| t.len() >= 4) {
            let (lang, cp) = (u16::from_le_bytes([t[0], t[1]]), u16::from_le_bytes([t[2], t[3]]));
            langs.push(format!("{lang:04x}{cp:04x}"));
        }
        langs.extend(["040904b0".to_string(), "040904e4".to_string()]);
        langs.iter().find_map(|l| {
            let bytes = value(&data, &format!(r"\StringFileInfo\{l}\FileDescription"), 2)?;
            let wide: Vec<u16> = bytes.chunks_exact(2).map(|c| u16::from_le_bytes([c[0], c[1]])).collect();
            let text = String::from_utf16_lossy(wide.split(|&c| c == 0).next().unwrap_or_default());
            let text = text.trim();
            (!text.is_empty()).then(|| text.to_string())
        })
    }

    /// A value inside a version block, as bytes. `unit` is the size of what VerQueryValueW counts in
    /// `len`: 1 for binary values, 2 for strings (UTF-16 units).
    fn value<'a>(data: &'a [u8], sub: &str, unit: usize) -> Option<&'a [u8]> {
        let sub = nul_terminated(sub.encode_utf16());
        let (mut found, mut len) = (ptr::null_mut(), 0u32);
        // SAFETY: `data` was filled by GetFileVersionInfoW, `sub` is NUL-terminated, the out pointers are
        // valid. The result is only used after checking it lies inside `data`.
        let ok = unsafe { VerQueryValueW(data.as_ptr().cast(), sub.as_ptr(), &mut found, &mut len) };
        if ok == 0 || found.is_null() {
            return None;
        }
        let start = (found as usize).checked_sub(data.as_ptr() as usize)?;
        data.get(start..start.checked_add(len as usize * unit)?)
    }
}

#[cfg(test)]
mod tests {
    #[cfg(windows)]
    #[test]
    fn windows_sensor_samples_without_panicking() {
        assert!(super::supported());
        assert_eq!(super::PLATFORM, "windows");
        let mut s = super::platform_sensor().unwrap();
        for _ in 0..3 {
            let sample = s.sample();
            assert!(sample.has_window || sample.process_name.is_none());
        }
    }
}
