import type { MetadataRoute } from "next";

// Only /login is public; everything else needs an account.
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: "https://www.ericwei.me/login" }];
}
