"use client";
// ThoughtLine, from React Bits: a breathing, shimmering "thinking" line with a live clock that freezes into
// "Thought for 4.2s", and a trace of steps beneath it. Ported to TypeScript on lucide icons; trimmed to the
// props the chat uses (it inherits the text color and size).

import { Check, ChevronDown, Sparkles } from "lucide-react";
import { animate, useReducedMotion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import "./thought-line.css";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;
const GLYPH_DONE = 0.55;
const PERIOD = 1.6; // one breath, seconds
const DEPTH = 0.45; // how far the glyph dims at the trough
const SETTLE = 0.35; // settle crossfade, seconds

const fmt = (ds: number) => (ds < 600 ? `${(ds / 10).toFixed(1)}s` : `${Math.floor(ds / 600)}m ${((ds % 600) / 10).toFixed(1)}s`);
const spoken = (ds: number) =>
  ds < 600 ? `${(ds / 10).toFixed(1)} seconds` : `${Math.floor(ds / 600)} minutes ${((ds % 600) / 10).toFixed(1)} seconds`;

export function ThoughtLine({
  label = "Thinking…",
  doneLabel = "Thought for",
  steps = [],
  working = true,
  elapsed,
}: {
  label?: string;
  doneLabel?: string;
  steps?: string[];
  working?: boolean;
  elapsed?: number; // seconds, controlled: the internal clock doesn't run
}) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(working);
  // Opens while working, folds when it settles (adjusted during render, not in an effect).
  const [was, setWas] = useState(working);
  if (was !== working) {
    setWas(working);
    setOpen(working);
  }
  const hasTrace = steps.length > 0;
  const period = reduce ? PERIOD * 1.5 : PERIOD;
  const trough = 1 - (reduce ? 0.2 : DEPTH);
  const sheen = !reduce;

  const glyphRef = useRef<HTMLSpanElement>(null);
  const breathRef = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<HTMLSpanElement>(null);
  const stackRef = useRef<HTMLSpanElement>(null);
  const workRef = useRef<HTMLSpanElement>(null);
  const doneRef = useRef<HTMLSpanElement>(null);
  const prevWorking = useRef(working);

  // The breath: the glyph (and the label, when there's no sheen) dims and brightens; settled, the glyph rests dim.
  useEffect(() => {
    const glyphEl = glyphRef.current;
    const breathEl = breathRef.current;
    if (!breathEl) return;
    const loop = (el: Element, delay: number) =>
      animate(el, { opacity: [trough, 1, trough] }, { duration: period, ease: EASE_IN_OUT, repeat: Infinity, delay });
    let cancelled = false;
    const running: { stop: () => void }[] = [];
    if (working) {
      if (sheen) running.push(animate(breathEl, { opacity: 1 }, { duration: 0.2, ease: EASE_OUT }));
      if (glyphEl) {
        const lead = animate(glyphEl, { opacity: trough }, { duration: 0.2, ease: EASE_OUT });
        running.push(lead);
        lead.then(() => {
          if (cancelled) return;
          running.push(loop(glyphEl, 0));
          if (!sheen) running.push(loop(breathEl, 0.14));
        });
      }
    } else {
      if (glyphEl) running.push(animate(glyphEl, { opacity: working ? 1 : GLYPH_DONE }, { duration: SETTLE, ease: EASE_OUT }));
      running.push(animate(breathEl, { opacity: 1 }, { duration: SETTLE, ease: EASE_OUT }));
    }
    return () => {
      cancelled = true;
      running.forEach((a) => a.stop());
    };
  }, [working, period, trough, sheen]);

  // The clock: written straight to the DOM every 100ms, no re-renders.
  useLayoutEffect(() => {
    const paint = (ds: number) => {
      if (timerRef.current) timerRef.current.textContent = fmt(ds);
    };
    if (elapsed != null) return paint(Math.round(elapsed * 10));
    if (!working) return;
    const startedAt = performance.now();
    paint(0);
    const id = setInterval(() => paint(Math.floor((performance.now() - startedAt) / 100)), 100);
    return () => clearInterval(id);
  }, [working, elapsed]);

  // The timer glides to sit right after whichever label is showing.
  useLayoutEffect(() => {
    const t = timerRef.current;
    const stack = stackRef.current;
    if (!t || !stack) return;
    const place = (glide: boolean) => {
      const active = working ? workRef.current : doneRef.current;
      if (!active) return;
      if (!glide) t.style.transition = "none";
      t.style.transform = `translateX(${active.offsetWidth - stack.offsetWidth}px)`;
      if (!glide) {
        void t.offsetWidth;
        t.style.transition = "";
      }
    };
    place(prevWorking.current !== working);
    prevWorking.current = working;
    const ro = new ResizeObserver(() => place(false));
    if (workRef.current) ro.observe(workRef.current);
    if (doneRef.current) ro.observe(doneRef.current);
    return () => ro.disconnect();
  }, [working, label, doneLabel]);

  const announce = working ? label : elapsed != null ? `${doneLabel} ${spoken(Math.round(elapsed * 10))}` : doneLabel;

  return (
    <div
      className="thought-line"
      data-working={working ? "" : undefined}
      data-open={open && hasTrace ? "" : undefined}
    >
      <button
        type="button"
        className="thought-line__head focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        data-toggle={hasTrace ? "" : undefined}
        aria-expanded={hasTrace ? open : undefined}
        tabIndex={hasTrace ? 0 : -1}
        onClick={() => hasTrace && setOpen((v) => !v)}
      >
        <span ref={glyphRef} className="thought-line__glyph" aria-hidden="true">
          <Sparkles strokeWidth={2} />
        </span>
        <span ref={stackRef} className="thought-line__label" aria-hidden="true">
          <span ref={workRef} className="thought-line__text" data-active={working ? "" : undefined}>
            <span ref={breathRef} className="thought-line__breath" data-shimmer={sheen ? "" : undefined}>
              {label}
            </span>
          </span>
          <span ref={doneRef} className="thought-line__text thought-line__text--done" data-active={working ? undefined : ""}>
            {doneLabel}
          </span>
        </span>
        <span ref={timerRef} className="thought-line__timer" data-done={working ? undefined : ""} aria-hidden="true">
          0.0s
        </span>
        <span className="thought-line__chevron" data-on={hasTrace ? "" : undefined} aria-hidden="true">
          <ChevronDown className="size-[1em]" strokeWidth={2.2} />
        </span>
        <span className="sr-only" role="status">
          {announce}
        </span>
      </button>
      {hasTrace && (
        <div className="thought-line__trace" data-open={open ? "" : undefined} aria-hidden={!open}>
          <div className="thought-line__fold">
            <div className="thought-line__steps">
              {steps.map((text, i) => {
                const done = !working || i < steps.length - 1;
                return (
                  <div key={`${i}-${text}`} className="thought-line__step" data-done={done ? "" : undefined}>
                    <span className="thought-line__mark" aria-hidden="true">
                      {done ? <Check className="size-[1em]" strokeWidth={2.5} /> : <i className="thought-line__pulse" />}
                    </span>
                    <span className="thought-line__step-text">{text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
