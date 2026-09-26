"use client";
import dynamic from "next/dynamic";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";

// Client-only: the demo's sample dates are relative to the visitor's today.
const Demo = dynamic(() => import("./demo"), {
  ssr: false,
  loading: () => <div className="h-full motion-safe:animate-pulse bg-card" />,
});

export function HeroDemo({ title }: { title: React.ReactNode }) {
  return (
    <ContainerScroll titleComponent={title}>
      <Demo />
    </ContainerScroll>
  );
}
