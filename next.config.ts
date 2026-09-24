import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep a visited tab for 30s so switching back is instant. Saves call revalidatePath, which clears
  // this cache, so edits still show right away.
  experimental: { staleTimes: { dynamic: 30 } },
};

export default nextConfig;
