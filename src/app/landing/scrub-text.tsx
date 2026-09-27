"use client";

// A paragraph that brightens word by word as it scrolls through the viewport, so the story is read at the
// pace it's scrolled. GSAP ScrollTrigger scrubs it; with reduced motion the text is simply shown in full.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

export function ScrubText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.querySelectorAll("span"),
        { opacity: 0.2 },
        { opacity: 1, stagger: 0.1, ease: "none", scrollTrigger: { trigger: el, start: "top 85%", end: "bottom 45%", scrub: true } },
      );
    }, el);
    return () => ctx.revert();
  }, []);
  return (
    <p ref={ref} className={className}>
      {text.split(" ").map((w, i) => (
        <span key={i}>{w} </span>
      ))}
    </p>
  );
}
