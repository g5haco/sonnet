"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// Scales a fixed design (a ring, cards, a big readout) to fill the space left in its widget, keeping its shape,
// so a bigger widget shows a bigger design instead of empty space. In a widget without a set height (the phone
// list) it stays at its natural size or smaller.
export function Fit({ children, max = 3, className }: { children: React.ReactNode; max?: number; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const b = box.current!;
    const i = inner.current!;
    const observer = new ResizeObserver(() => {
      if (!i.offsetWidth || !i.offsetHeight) return; // offsets ignore the transform: the natural size
      setScale(Math.min(max, b.clientWidth / i.offsetWidth, b.clientHeight / i.offsetHeight));
    });
    observer.observe(b);
    observer.observe(i);
    return () => observer.disconnect();
  }, [max]);

  return (
    <div ref={box} className={cn("grid min-h-0 flex-1 place-items-center overflow-hidden", className)}>
      <div ref={inner} className="w-max" style={{ transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  );
}
