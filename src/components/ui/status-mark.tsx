"use client";
// StatusMark, from React Bits, trimmed to what the task cards use: a spinning arc (running) that closes into a
// ring and draws a check (done) or a cross (failed). Ported to TypeScript on motion.

import { animate, useMotionValue, useReducedMotion } from "motion/react";
import { useEffect, useLayoutEffect, useRef } from "react";
import "./status-mark.css";

export type Status = "running" | "done" | "failed";

const UI = { type: "spring", duration: 0.3, bounce: 0 } as const;
const CHECK = "M7.5 12.25 10.5 15.25 16.75 8.75";
const CROSS = "M8.5 8.5 15.5 15.5M15.5 8.5 8.5 15.5";
const TEXT: Record<Status, string> = { running: "In progress", done: "Completed", failed: "Failed" };
const R = 9; // radius in the 24-unit box (stroke 2)
const C = 2 * Math.PI * R;
const ARC = 0.68; // share of the ring the spinning arc covers
const SPIN = 1.1; // seconds per turn

export function StatusMark({ status, size = 20, className = "" }: { status: Status; size?: number; className?: string }) {
  const reduce = useReducedMotion();
  const arc = useMotionValue(status === "running" ? ARC : 1);
  const travel = useMotionValue(0);
  const ringRef = useRef<SVGCircleElement>(null);

  useLayoutEffect(() => {
    const ring = ringRef.current;
    const dash = (a: number) => ring?.setAttribute("stroke-dasharray", `${a * C} ${(1 - a) * C}`);
    const offset = (v: number) => ring?.setAttribute("stroke-dashoffset", String(v));
    dash(arc.get());
    offset(travel.get());
    const offs = [arc.on("change", dash), travel.on("change", offset)];
    return () => offs.forEach((off) => off());
  }, [arc, travel]);

  // Running: the arc spins. Settled: it closes into a full ring and the spin eases to a stop.
  useEffect(() => {
    const running = status === "running";
    if (reduce) {
      arc.jump(running ? ARC : 1);
      travel.jump(0);
      return;
    }
    const anims = [animate(arc, running ? ARC : 1, UI)];
    const t0 = travel.get();
    anims.push(
      running
        ? animate(travel, [t0, t0 - C], { duration: SPIN, ease: "linear", repeat: Infinity })
        : animate(travel, Math.floor(t0 / C) * C, UI),
    );
    return () => anims.forEach((a) => a.stop());
  }, [status, reduce, arc, travel]);

  return (
    <span className={`status-mark ${className}`} data-status={status}>
      <svg className="status-mark__glyph" viewBox="0 0 24 24" width={size} height={size} role="img" aria-label={TEXT[status]}>
        <circle className="status-mark__track" cx="12" cy="12" r={R} transform="rotate(-90 12 12)" />
        <circle ref={ringRef} className="status-mark__ring" cx="12" cy="12" r={R} transform="rotate(-90 12 12)" />
        <path className="status-mark__check" d={CHECK} pathLength={1} />
        <path className="status-mark__cross" d={CROSS} pathLength={1} />
      </svg>
    </span>
  );
}
