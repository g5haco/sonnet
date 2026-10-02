import type { NextConfig } from "next";

// The Content-Security-Policy is set per request in src/proxy.ts (it needs a fresh nonce), not here.

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
        ],
      },
    ];
  },
};

export default nextConfig;
