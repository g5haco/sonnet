"use client";
// Aceternity's container scroll animation, on `motion/react` (framer-motion's current package, already installed)
// and the app's tokens instead of fixed grays. Reduced motion: no tilt or scale, the card just sits flat.
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useEffect, useRef, useState } from "react";

export function ContainerScroll({ titleComponent, children }: { titleComponent: React.ReactNode; children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const [isMobile, setIsMobile] = useState(false);
  const still = useReducedMotion();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const rotate = useTransform(scrollYProgress, [0, 1], still ? [0, 0] : [20, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], still ? [1, 1] : isMobile ? [0.9, 1] : [1.05, 1]);
  const translate = useTransform(scrollYProgress, [0, 1], still ? [0, 0] : [0, -100]);

  return (
    <div className="relative flex h-[62rem] items-center justify-center p-2 md:h-[80rem] md:p-20" ref={containerRef}>
      <div className="relative w-full py-10 md:py-40" style={{ perspective: "1000px" }}>
        <motion.div style={{ translateY: translate }} className="mx-auto max-w-5xl text-center">
          {titleComponent}
        </motion.div>
        <Card rotate={rotate} scale={scale}>
          {children}
        </Card>
      </div>
    </div>
  );
}

function Card({ rotate, scale, children }: { rotate: MotionValue<number>; scale: MotionValue<number>; children: React.ReactNode }) {
  return (
    <motion.div
      style={{
        rotateX: rotate,
        scale,
        boxShadow:
          "0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003",
      }}
      className="mx-auto mt-10 h-[36rem] w-full max-w-5xl rounded-[30px] border-4 border-foreground/15 bg-card p-2 md:h-[40rem] md:p-4"
    >
      <div className="h-full w-full overflow-hidden rounded-2xl bg-background">{children}</div>
    </motion.div>
  );
}
