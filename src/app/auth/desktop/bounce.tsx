"use client";

import { useEffect } from "react";

// Hands the sign-in to the desktop app. The browser asks before opening it; the link is also here to click.
export function Bounce({ link }: { link: string }) {
  useEffect(() => {
    window.location.href = link;
  }, [link]);
  return (
    <a href={link} className="inline-flex min-h-11 items-center font-medium link">
      Open Sonnet
    </a>
  );
}
