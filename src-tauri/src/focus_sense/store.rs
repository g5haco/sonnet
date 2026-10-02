//! Config and per-session event files under `<app local data>/focus-sense`: `config.json` and
//! `sessions/<session_id>.jsonl`, one event per line. Bounded per session, by age and by count; deletable.
//! One lock serializes every file operation (the monitor thread appends while commands read or clear).

use super::{session_id_ok, ActivityEvent, Config, Kind};
use std::collections::HashMap;
use std::fs;
use std::io::{self, Write};
use std::path::PathBuf;
use std::sync::{Mutex, MutexGuard};
use std::time::{Duration, SystemTime};

/// Context events past this are dropped; Start/Stop markers are still kept, up to `MARKER_SLACK` more.
pub const MAX_EVENTS_PER_SESSION: u64 = 3000;
const MARKER_SLACK: u64 = 16;
/// Newest kept.
pub const MAX_SESSIONS: usize = 100;
/// By file modification time.
pub const RETENTION: Duration = Duration::from_secs(30 * 24 * 60 * 60);

pub struct Store {
    dir: PathBuf,
    /// Last seq per session, rebuilt from its file on first touch.
    seqs: Mutex<HashMap<String, u64>>,
}

fn invalid() -> io::Error {
    io::Error::new(io::ErrorKind::InvalidInput, "invalid session id")
}

/// A session file's bytes; missing → empty. Files are small (capped at ~3000 lines).
fn load(path: &PathBuf) -> io::Result<Vec<u8>> {
    match fs::read(path) {
        Err(e) if e.kind() == io::ErrorKind::NotFound => Ok(Vec::new()),
        r => r,
    }
}

/// Every parseable event, in order. Corrupt or partial lines are skipped.
fn events(bytes: &[u8]) -> impl Iterator<Item = ActivityEvent> + '_ {
    bytes.split(|&b| b == b'\n').filter_map(|line| serde_json::from_slice(line).ok())
}

impl Store {
    /// `dir` = <app local data>/focus-sense. Nothing is created until the first write.
    pub fn new(dir: PathBuf) -> Self {
        Self { dir, seqs: Mutex::new(HashMap::new()) }
    }

    fn lock(&self) -> MutexGuard<'_, HashMap<String, u64>> {
        self.seqs.lock().unwrap_or_else(|e| e.into_inner())
    }

    fn sessions(&self) -> PathBuf {
        self.dir.join("sessions")
    }

    /// Re-checked here so no id can name a path outside the sessions folder.
    fn session_path(&self, session_id: &str) -> io::Result<PathBuf> {
        if !session_id_ok(session_id) {
            return Err(invalid());
        }
        Ok(self.sessions().join(format!("{session_id}.jsonl")))
    }

    /// Default (off, no exclusions) when missing or unreadable/corrupt.
    pub fn load_config(&self) -> Config {
        let _g = self.lock();
        fs::read(self.dir.join("config.json"))
            .ok()
            .and_then(|b| serde_json::from_slice(&b).ok())
            .unwrap_or_default()
    }

    /// Atomic: write config.json.tmp then rename over config.json.
    pub fn save_config(&self, c: &Config) -> io::Result<()> {
        let _g = self.lock();
        fs::create_dir_all(&self.dir)?;
        let tmp = self.dir.join("config.json.tmp");
        fs::write(&tmp, serde_json::to_vec(c)?)?;
        fs::rename(&tmp, self.dir.join("config.json"))
    }

    /// Assigns `e.seq` and appends one line to the session's file. Ok(false) when dropped by the cap.
    pub fn append(&self, e: &mut ActivityEvent) -> io::Result<bool> {
        let path = self.session_path(&e.session_id)?;
        let mut seqs = self.lock();
        let mut line = Vec::new();
        let last = match seqs.get(&e.session_id) {
            Some(&n) => n,
            None => {
                let bytes = load(&path)?;
                if bytes.last().is_some_and(|&b| b != b'\n') {
                    line.push(b'\n'); // a torn last line (crash mid-write) mustn't swallow this one
                }
                events(&bytes).map(|ev| ev.seq).max().unwrap_or(0)
            }
        };
        seqs.insert(e.session_id.clone(), last);
        let cap = if matches!(e.kind, Kind::Context | Kind::Heartbeat) { MAX_EVENTS_PER_SESSION } else { MAX_EVENTS_PER_SESSION + MARKER_SLACK };
        if last >= cap {
            return Ok(false);
        }
        e.seq = last + 1;
        serde_json::to_writer(&mut line, e)?;
        line.push(b'\n');
        fs::create_dir_all(self.sessions())?;
        fs::OpenOptions::new().create(true).append(true).open(&path)?.write_all(&line)?;
        seqs.insert(e.session_id.clone(), e.seq);
        Ok(true)
    }

    /// Events with seq > `after`, at most `limit`, in order.
    pub fn read(&self, session_id: &str, after: u64, limit: usize) -> io::Result<Vec<ActivityEvent>> {
        let path = self.session_path(session_id)?;
        let _g = self.lock();
        Ok(events(&load(&path)?).filter(|ev| ev.seq > after).take(limit).collect())
    }

    /// Deletes session files older than `RETENTION`, then all but the newest `MAX_SESSIONS`. Ignores non-.jsonl files.
    pub fn prune(&self, now: SystemTime) -> io::Result<()> {
        let mut seqs = self.lock();
        let entries = match fs::read_dir(self.sessions()) {
            Ok(r) => r,
            Err(e) if e.kind() == io::ErrorKind::NotFound => return Ok(()),
            Err(e) => return Err(e),
        };
        let mut files = Vec::new();
        for entry in entries {
            let entry = entry?;
            let path = entry.path();
            if path.extension().is_some_and(|x| x == "jsonl") && entry.file_type()?.is_file() {
                files.push((entry.metadata()?.modified()?, path));
            }
        }
        files.sort_by_key(|f| std::cmp::Reverse(f.0)); // newest first
        for (i, (modified, path)) in files.iter().enumerate() {
            let old = now.duration_since(*modified).is_ok_and(|age| age > RETENTION);
            if old || i >= MAX_SESSIONS {
                fs::remove_file(path)?;
            }
        }
        seqs.clear(); // rebuilt from whatever files remain
        Ok(())
    }

    /// Deletes every session file (the config stays).
    pub fn clear(&self) -> io::Result<()> {
        let mut seqs = self.lock();
        seqs.clear();
        match fs::remove_dir_all(self.sessions()) {
            Err(e) if e.kind() != io::ErrorKind::NotFound => Err(e),
            _ => Ok(()),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::super::{Confidence, Source};
    use super::*;

    struct Tmp(PathBuf);
    impl Tmp {
        fn new(name: &str) -> Self {
            let p = std::env::temp_dir().join(format!("sonnet-fs-{name}-{}-{}", std::process::id(), super::super::now_ms()));
            Tmp(p)
        }
    }
    impl Drop for Tmp {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.0);
        }
    }

    fn ev(session: &str, kind: Kind) -> ActivityEvent {
        ActivityEvent {
            seq: 0,
            timestamp: 1,
            session_id: session.into(),
            platform: "windows".into(),
            kind,
            source: Source::ForegroundWindow,
            idle: false,
            app_name: Some("Notepad".into()),
            process_name: Some("notepad.exe".into()),
            window_title: Some("notes".into()),
            redacted: None,
            confidence: Confidence::Full,
        }
    }

    #[test]
    fn config_round_trips_and_falls_back_to_default() {
        let t = Tmp::new("config");
        let s = Store::new(t.0.clone());
        assert_eq!(s.load_config(), Config::default());
        assert!(!t.0.exists(), "nothing created before the first write");
        let c = Config { enabled: true, exclusions: vec!["discord.exe".into()] };
        s.save_config(&c).unwrap();
        assert_eq!(Store::new(t.0.clone()).load_config(), c);
        assert!(!t.0.join("config.json.tmp").exists());
        fs::write(t.0.join("config.json"), "{not json").unwrap();
        assert_eq!(s.load_config(), Config::default());
        fs::write(t.0.join("config.json"), r#"{"enabled":true,"exclusions":[],"extra":1}"#).unwrap();
        assert_eq!(s.load_config(), Config::default());
    }

    #[test]
    fn seq_continues_across_restarts_and_read_pages() {
        let t = Tmp::new("seq");
        let s = Store::new(t.0.clone());
        for _ in 0..3 {
            assert!(s.append(&mut ev("1", Kind::Context)).unwrap());
        }
        let s = Store::new(t.0.clone());
        let mut e = ev("1", Kind::Context);
        s.append(&mut e).unwrap();
        assert_eq!(e.seq, 4);
        let seqs = |after, limit| s.read("1", after, limit).unwrap().iter().map(|e| e.seq).collect::<Vec<_>>();
        assert_eq!(seqs(0, 10), [1, 2, 3, 4]);
        assert_eq!(seqs(1, 2), [2, 3]);
        assert_eq!(seqs(4, 10), Vec::<u64>::new());
        assert!(s.read("999", 0, 10).unwrap().is_empty());
        assert_eq!(s.read("1", 0, 1).unwrap()[0], ActivityEvent { seq: 1, ..ev("1", Kind::Context) });
    }

    #[test]
    fn corrupt_lines_are_skipped() {
        let t = Tmp::new("corrupt");
        let s = Store::new(t.0.clone());
        s.append(&mut ev("1", Kind::Start)).unwrap();
        let path = t.0.join("sessions").join("1.jsonl");
        let mut f = fs::OpenOptions::new().append(true).open(&path).unwrap();
        f.write_all(b"garbage\n\xff\xfe\n{\"seq\":9,\"part").unwrap(); // ends torn, no newline
        drop(f);
        let s = Store::new(t.0.clone()); // rebuild seq past the junk
        let mut e = ev("1", Kind::Context);
        s.append(&mut e).unwrap();
        assert_eq!(e.seq, 2);
        s.append(&mut ev("1", Kind::Context)).unwrap();
        let got: Vec<u64> = s.read("1", 0, 10).unwrap().iter().map(|e| e.seq).collect();
        assert_eq!(got, [1, 2, 3]);
    }

    #[test]
    fn cap_drops_context_but_keeps_markers() {
        let t = Tmp::new("cap");
        let s = Store::new(t.0.clone());
        s.lock().insert("1".into(), MAX_EVENTS_PER_SESSION - 1);
        assert!(s.append(&mut ev("1", Kind::Context)).unwrap());
        assert!(!s.append(&mut ev("1", Kind::Context)).unwrap());
        let mut stop = ev("1", Kind::Stop);
        assert!(s.append(&mut stop).unwrap());
        assert_eq!(stop.seq, MAX_EVENTS_PER_SESSION + 1);
        s.lock().insert("1".into(), MAX_EVENTS_PER_SESSION + MARKER_SLACK);
        assert!(!s.append(&mut ev("1", Kind::Stop)).unwrap());
    }

    #[test]
    fn prune_by_age_and_count() {
        let t = Tmp::new("prune");
        let s = Store::new(t.0.clone());
        let dir = t.0.join("sessions");
        fs::create_dir_all(&dir).unwrap();
        let base = SystemTime::UNIX_EPOCH + Duration::from_secs(1_700_000_000);
        for i in 0..MAX_SESSIONS + 5 {
            let f = fs::File::create(dir.join(format!("{i}.jsonl"))).unwrap();
            f.set_modified(base + Duration::from_secs(i as u64)).unwrap();
        }
        fs::write(dir.join("notes.txt"), "x").unwrap();
        s.prune(base + Duration::from_secs(1000)).unwrap();
        let left = |n: usize| dir.join(format!("{n}.jsonl")).exists();
        assert!((0..5).all(|i| !left(i)), "the oldest go");
        assert!((5..MAX_SESSIONS + 5).all(left));
        // age: 30 days after the newest, everything goes except other files
        s.prune(base + RETENTION + Duration::from_secs(MAX_SESSIONS as u64 + 10)).unwrap();
        assert!((0..MAX_SESSIONS + 5).all(|i| !left(i)));
        assert!(dir.join("notes.txt").exists());
        // a missing folder is fine
        Store::new(t.0.join("nope")).prune(SystemTime::now()).unwrap();
    }

    #[test]
    fn clear_removes_sessions_keeps_config() {
        let t = Tmp::new("clear");
        let s = Store::new(t.0.clone());
        let c = Config { enabled: true, exclusions: vec![] };
        s.save_config(&c).unwrap();
        s.append(&mut ev("1", Kind::Context)).unwrap();
        s.append(&mut ev("1", Kind::Context)).unwrap();
        s.clear().unwrap();
        assert!(s.read("1", 0, 10).unwrap().is_empty());
        assert_eq!(s.load_config(), c);
        let mut e = ev("1", Kind::Context);
        s.append(&mut e).unwrap();
        assert_eq!(e.seq, 1, "seqs reset");
        Store::new(t.0.join("nope")).clear().unwrap();
    }

    #[test]
    fn invalid_session_ids_are_rejected() {
        let t = Tmp::new("ids");
        let s = Store::new(t.0.clone());
        for bad in ["../x", "a/b", "a\\b", ""] {
            assert_eq!(s.append(&mut ev(bad, Kind::Context)).unwrap_err().kind(), io::ErrorKind::InvalidInput);
            assert_eq!(s.read(bad, 0, 10).unwrap_err().kind(), io::ErrorKind::InvalidInput);
        }
        assert!(!t.0.exists());
    }
}
