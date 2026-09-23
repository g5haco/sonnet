"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

// Reduced motion, in one place: every GSAP tween still lands on its final state, just instantly.
// matchMedia reverts this automatically if the preference is switched off.
if (typeof window !== "undefined") {
  gsap.matchMedia().add("(prefers-reduced-motion: reduce)", () => {
    gsap.globalTimeline.timeScale(100);
    return () => gsap.globalTimeline.timeScale(1);
  });
}

export { gsap, useGSAP };
