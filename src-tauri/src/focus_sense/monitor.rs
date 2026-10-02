//! The one monitor thread. It samples the foreground every `POLL`, applies the privacy rules, and hands
//! the sink an event whenever the context changes, between one `Start` and one `Stop`. It never locks
//! the `Monitor`, so joining it under that lock can't deadlock. Logs lifecycle only, never content.

use super::{
    now_ms, privacy,
    sensor::{self, Sensor},
    ActivityEvent, Confidence, Kind, Redaction, Sample, Source,
};
use std::{
    sync::{
        mpsc::{self, RecvTimeoutError},
        Arc, Mutex, MutexGuard, PoisonError,
    },
    thread::JoinHandle,
    time::Duration,
};

pub type Sink = Arc<dyn Fn(ActivityEvent) + Send + Sync>;
pub const POLL: Duration = Duration::from_millis(1000);

/// What the page sees of a running monitor. Times in ms since the epoch.
#[derive(serde::Serialize, Clone, Debug, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Running {
    pub session_id: String,
    pub started_at: u64,
    pub until: u64,
}

enum Msg {
    Stop,
    /// The same session asked again: new deadline and exclusions.
    Refresh(u64, Vec<String>),
}

struct Worker {
    running: Running,
    tx: mpsc::Sender<Msg>,
    thread: JoinHandle<()>,
}

impl Worker {
    /// Wakes the thread and waits for it, so its `Stop` is written. Prompt: the thread only blocks in a
    /// sample or in `recv_timeout`.
    fn finish(self) {
        let _ = self.tx.send(Msg::Stop);
        let _ = self.thread.join();
    }
}

#[derive(Default)]
pub struct Monitor(Mutex<Option<Worker>>);

impl Monitor {
    fn lock(&self) -> MutexGuard<'_, Option<Worker>> {
        self.0.lock().unwrap_or_else(PoisonError::into_inner)
    }

    /// Idempotent when `session_id` is already running (refreshes `until` and exclusions). A different
    /// session stops the old one first (its `Stop` written, its thread joined).
    pub fn start(&self, session_id: String, until: u64, exclusions: Vec<String>, sink: Sink) -> Result<(), String> {
        let sensor = sensor::platform_sensor().ok_or("not supported on this platform")?;
        self.start_with(session_id, until, exclusions, sink, sensor, POLL)
    }

    fn start_with(
        &self,
        session_id: String,
        until: u64,
        exclusions: Vec<String>,
        sink: Sink,
        sensor: Box<dyn Sensor>,
        poll: Duration,
    ) -> Result<(), String> {
        let mut slot = self.lock();
        if let Some(w) = slot.as_mut().filter(|w| w.running.session_id == session_id && !w.thread.is_finished()) {
            w.running.until = until;
            let _ = w.tx.send(Msg::Refresh(until, exclusions));
            return Ok(());
        }
        if let Some(old) = slot.take() {
            old.finish();
        }
        let (tx, rx) = mpsc::channel();
        let running = Running { session_id: session_id.clone(), started_at: now_ms(), until };
        let thread = std::thread::Builder::new()
            .name("focus-sense".into())
            .spawn(move || run(session_id, until, exclusions, sensor, poll, sink, rx))
            .map_err(|e| {
                log::warn!("focus sense: could not start the monitor thread: {e}");
                "could not start monitoring".to_string()
            })?;
        *slot = Some(Worker { running, tx, thread });
        Ok(())
    }

    /// Stops promptly. No-op if nothing runs.
    pub fn stop(&self) {
        let worker = self.lock().take();
        if let Some(w) = worker {
            w.finish();
        }
    }

    /// None when nothing runs, or the thread already expired.
    pub fn current(&self) -> Option<Running> {
        self.lock().as_ref().filter(|w| !w.thread.is_finished()).map(|w| w.running.clone())
    }
}

/// App exit: no orphan thread, and the session file gets its `Stop`.
impl Drop for Monitor {
    fn drop(&mut self) {
        self.stop();
    }
}

fn event(session_id: &str, kind: Kind, source: Source, s: Sample, redacted: Option<Redaction>, confidence: Confidence) -> ActivityEvent {
    ActivityEvent {
        seq: 0, // the store assigns it
        timestamp: now_ms(),
        session_id: session_id.to_string(),
        platform: sensor::PLATFORM.to_string(),
        kind,
        source,
        app_name: s.app_name,
        process_name: s.process_name,
        window_title: s.window_title,
        redacted,
        confidence,
    }
}

fn run(
    session_id: String,
    mut until: u64,
    mut exclusions: Vec<String>,
    mut sensor: Box<dyn Sensor>,
    poll: Duration,
    sink: Sink,
    rx: mpsc::Receiver<Msg>,
) {
    log::info!("focus sense: monitoring started (session {session_id})");
    let marker = |kind| event(&session_id, kind, Source::Monitor, Sample::default(), None, Confidence::None);
    sink(marker(Kind::Start));
    let mut last = None;
    let reason = loop {
        if now_ms() >= until {
            break "expired";
        }
        let seen = privacy::apply(sensor.sample(), &exclusions);
        if last.as_ref() != Some(&seen) {
            let (s, r) = seen.clone();
            let c = privacy::confidence(&s, r);
            sink(event(&session_id, Kind::Context, Source::ForegroundWindow, s, r, c));
            last = Some(seen);
        }
        match rx.recv_timeout(poll.min(Duration::from_millis(until.saturating_sub(now_ms())))) {
            Ok(Msg::Refresh(u, e)) => (until, exclusions) = (u, e),
            Ok(Msg::Stop) | Err(RecvTimeoutError::Disconnected) => break "stopped",
            Err(RecvTimeoutError::Timeout) => {}
        }
    };
    sink(marker(Kind::Stop));
    log::info!("focus sense: monitoring {reason} (session {session_id})");
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Instant;

    const FAST: Duration = Duration::from_millis(10);
    const FAR: u64 = 60 * 60 * 1000;

    /// Plays its samples in order, then repeats the last.
    struct Script(Vec<Sample>, usize);

    impl Sensor for Script {
        fn sample(&mut self) -> Sample {
            let s = self.0[self.1.min(self.0.len() - 1)].clone();
            self.1 += 1;
            s
        }
    }

    fn app(process: &str, title: &str) -> Sample {
        Sample { has_window: true, process_name: Some(process.into()), app_name: None, window_title: Some(title.into()) }
    }

    fn script(samples: Vec<Sample>) -> Box<dyn Sensor> {
        Box::new(Script(samples, 0))
    }

    type Log = Arc<Mutex<Vec<ActivityEvent>>>;

    fn collector() -> (Sink, Log) {
        let log: Log = Arc::default();
        let l = log.clone();
        (Arc::new(move |e| l.lock().unwrap().push(e)), log)
    }

    fn kinds(log: &Log) -> Vec<(String, Kind)> {
        log.lock().unwrap().iter().map(|e| (e.session_id.clone(), e.kind)).collect()
    }

    fn wait() {
        std::thread::sleep(Duration::from_millis(150));
    }

    #[test]
    fn start_context_changes_then_one_stop() {
        let (sink, log) = collector();
        let m = Monitor::default();
        let a = app("a.exe", "A");
        m.start_with("s".into(), now_ms() + FAR, vec![], sink, script(vec![a.clone(), a.clone(), a, app("b.exe", "B")]), FAST).unwrap();
        wait();
        assert_eq!(m.current().map(|r| r.session_id), Some("s".into()));
        m.stop();
        assert_eq!(m.current(), None);
        let s = |k| ("s".to_string(), k);
        assert_eq!(kinds(&log), vec![s(Kind::Start), s(Kind::Context), s(Kind::Context), s(Kind::Stop)]);
        let events = log.lock().unwrap();
        assert_eq!(events[1].process_name.as_deref(), Some("a.exe"));
        assert_eq!(events[2].window_title.as_deref(), Some("B"));
        assert_eq!((events[2].source, events[2].confidence, events[2].seq), (Source::ForegroundWindow, Confidence::Full, 0));
        assert_eq!((events[0].source, events[0].confidence, events[0].process_name.clone()), (Source::Monitor, Confidence::None, None));
        drop(events);
        m.stop(); // no-op
        assert_eq!(kinds(&log).len(), 4);
    }

    #[test]
    fn stop_wakes_the_thread_promptly() {
        let (sink, log) = collector();
        let m = Monitor::default();
        m.start_with("s".into(), now_ms() + FAR, vec![], sink, script(vec![app("a.exe", "A")]), Duration::from_secs(10)).unwrap();
        wait();
        let t = Instant::now();
        m.stop();
        assert!(t.elapsed() < Duration::from_millis(500));
        assert_eq!(m.current(), None);
        assert_eq!(kinds(&log).last().map(|k| k.1), Some(Kind::Stop));
    }

    #[test]
    fn same_session_is_idempotent_and_another_replaces_it() {
        let (sink, log) = collector();
        let m = Monitor::default();
        let until = now_ms() + FAR;
        m.start_with("one".into(), until, vec![], sink.clone(), script(vec![app("a.exe", "A")]), FAST).unwrap();
        m.start_with("one".into(), until + 5, vec![], sink.clone(), script(vec![app("a.exe", "A")]), FAST).unwrap();
        wait();
        assert_eq!(m.current().map(|r| r.until), Some(until + 5));
        m.start_with("two".into(), until, vec![], sink, script(vec![app("a.exe", "A")]), FAST).unwrap();
        wait();
        m.stop();
        let k = |s: &str, k| (s.to_string(), k);
        assert_eq!(
            kinds(&log),
            vec![k("one", Kind::Start), k("one", Kind::Context), k("one", Kind::Stop), k("two", Kind::Start), k("two", Kind::Context), k("two", Kind::Stop)]
        );
    }

    #[test]
    fn expires_on_its_own() {
        let (sink, log) = collector();
        let m = Monitor::default();
        m.start_with("s".into(), now_ms() + 50, vec![], sink, script(vec![app("a.exe", "A")]), FAST).unwrap();
        std::thread::sleep(Duration::from_millis(300));
        assert_eq!(m.current(), None);
        let k = kinds(&log);
        assert_eq!(k.last().map(|k| k.1), Some(Kind::Stop));
        assert_eq!(k.iter().filter(|k| k.1 == Kind::Stop).count(), 1);
        m.stop();
        assert_eq!(kinds(&log).len(), k.len(), "no second Stop");
    }

    #[test]
    fn exclusions_apply_and_refresh() {
        let (sink, log) = collector();
        let m = Monitor::default();
        let until = now_ms() + FAR;
        m.start_with("s".into(), until, vec!["discord.exe".into()], sink.clone(), script(vec![app("Discord.exe", "secret")]), FAST).unwrap();
        wait();
        m.start_with("s".into(), until, vec![], sink, script(vec![app("unused.exe", "")]), FAST).unwrap();
        wait();
        m.stop();
        let events = log.lock().unwrap();
        assert_eq!(events.len(), 4);
        let e = &events[1];
        assert_eq!((e.redacted, e.process_name.clone(), e.window_title.clone(), e.confidence), (Some(Redaction::Excluded), None, None, Confidence::Full));
        assert_eq!((events[2].redacted, events[2].window_title.as_deref()), (None, Some("secret")));
    }
}
