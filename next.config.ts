import type { NextConfig } from "next";

// Report-only for now: the browser logs what this would block, and nothing is blocked. Enforce it (rename the
// header to Content-Security-Policy) once a week of real use shows no violations.
// ponytail: 'unsafe-inline' scripts because Next's inline bootstrap needs it without per-request nonces.
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:", // Canvas descriptions embed images from school domains
  "font-src 'self' data:",
  `connect-src 'self' ${supabase} ${supabase.replace(/^http/, "ws")}`,
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // 90 for the landing page screenshots, where text in the UI has to stay crisp.
  images: { qualities: [75, 90] },
  // Keep a visited tab for 30s so switching back is instant. Saves call revalidatePath, which clears
  // this cache, so edits still show right away.
  experimental: { staleTimes: { dynamic: 30 } },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Microphone stays allowed for chat dictation.
          { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(self)" },
          { key: "Content-Security-Policy-Report-Only", value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
