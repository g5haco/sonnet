"use client";
// StatusMark, from React Bits: one ring that morphs in place between pending (dashed), running (a spinning arc,
// or a progress arc), done (check) and failed/cancelled (cross). Ported to TypeScript; the label/strike part
// is dropped (the task cards set their own text).

import { animate, useMotionValue, useReducedMotion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, type CSSProperties } from "react";
import "./status-mark.css";

export type Status = "pending" | "running" | "done" | "failed" | "cancelled";

const UI = { type: "spring", duration: 0.3, bounce: 0 } as const;
const MORPH = { duration: 0.3, ease: [0.77, 0, 0.175, 1] } as const;
const CHECK = "M7.5 12.25 10.5 15.25 16.75 8.75";
const CROSS = "M8.5 8.5 15.5 15.5M15.5 8.5 8.5 15.5";
const TEXT: Record<Status, string> = { pending: "Pending", running: "In progress", done: "Completed", failed: "Failed", cancelled: "Cancelled" };
const IDLE_DASH = 0.3;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function StatusMark({
  status = "pending",
  progress,
  color = "currentColor",
  doneColor = "var(--done)",
  errorColor = "var(--destructive)",
  size = 20,
  strokeWidth = 2,
  dashes = 8,
  spinDuration = 1100,
  arcLength = 0.68,
  drawDuration = 240,
  fillOpacity = 0.08,
  className = "",
}: {
  status?: Status;
  progress?: number; // 0..1 while running; leave out for an indeterminate spin
  color?: string;
  doneColor?: string;
  errorColor?: string;
  size?: number;
  strokeWidth?: number;
  dashes?: number;
  spinDuration?: number;
  arcLength?: number;
  drawDuration?: number;
  fillOpacity?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const r = 10 - strokeWidth / 2;
  const C = 2 * Math.PI * r;
  const P = C / Math.max(1, dashes);
  const determinate = status === "running" && Number.isFinite(progress);
  const indeterminate = status === "running" && !determinate;
  const solid = status === "running" || status === "done" || status === "failed";
  const targetArc = indeterminate ? arcLength : determinate ? clamp01(progress!) : 1;

  const mode = useMotionValue(solid ? 1 : 0);
  const arc = useMotionValue(targetArc);
  const travel = useMotionValue(0);
  const ringRef = useRef<SVGCircleElement>(null);
  const gen = useRef(0);

  // Dashes (idle) fuse into one arc (running/done) as `mode` goes 0 -> 1.
  useLayoutEffect(() => {
    const writeDash = () => {
      const m = mode.get();
      const a = arc.get();
      const dash = IDLE_DASH * P + (a * C - IDLE_DASH * P) * m;
      const gap = (1 - IDLE_DASH) * P + ((1 - a) * C - (1 - IDLE_DASH) * P) * m;
      ringRef.current?.setAttribute("stroke-dasharray", `${Math.max(0, dash)} ${Math.max(0, gap)}`);
    };
    writeDash();
    ringRef.current?.setAttribute("stroke-dashoffset", String(travel.get()));
    const offs = [
      mode.on("change", writeDash),
      arc.on("change", writeDash),
      travel.on("change", (v) => ringRef.current?.setAttribute("stroke-dashoffset", String(v))),
    ];
    return () => offs.forEach((off) => off());
  }, [C, P, mode, arc, travel]);

  useEffect(() => {
    const g = ++gen.current;
    if (reduce) {
      mode.jump(solid ? 1 : 0);
      arc.jump(targetArc);
      travel.jump(0);
      return;
    }
    if (mode.get() === 0) arc.jump(targetArc);
    const running = [animate(mode, solid ? 1 : 0, MORPH), animate(arc, targetArc, UI)];
    if (indeterminate) {
      const t0 = travel.get();
      running.push(animate(travel, [t0, t0 - C], { duration: spinDuration / 1000, ease: "linear", repeat: Infinity }));
    } else {
      const unit = determinate ? C : P;
      const settle = animate(travel, Math.floor(travel.get() / unit) * unit, UI);
      running.push(settle);
      settle.then(() => gen.current === g && travel.jump(0));
    }
    return () => running.forEach((a) => a.stop());
  }, [status, solid, determinate, indeterminate, targetArc, reduce, C, P, spinDuration, mode, arc, travel]);

  const spoken = TEXT[status] + (determinate ? `, ${Math.round(clamp01(progress!) * 100)}%` : "");

  return (
    <span
      className={`status-mark ${className}`}
      data-status={status}
      data-indeterminate={indeterminate ? "" : undefined}
      style={
        {
          "--sm-stroke": strokeWidth,
          "--sm-color": color,
          "--sm-done": doneColor,
          "--sm-error": errorColor,
          "--sm-fill": fillOpacity,
          "--sm-draw": `${drawDuration}ms`,
        } as CSSProperties
      }
    >
      <svg className="status-mark__glyph" viewBox="0 0 24 24" width={size} height={size} role="img" aria-label={spoken}>
        <circle className="status-mark__track" cx="12" cy="12" r={r} transform="rotate(-90 12 12)" />
        <circle ref={ringRef} className="status-mark__ring" cx="12" cy="12" r={r} transform="rotate(-90 12 12)" />
        <path className="status-mark__check" d={CHECK} pathLength={1} />
        <path className="status-mark__cross" d={CROSS} pathLength={1} />
      </svg>
    </span>
  );
}
