import type { MetadataRoute } from "next";

// Public: the landing page ("/" when signed out) and /login; everything else needs an account.
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: "https://www.ericwei.me/" }, { url: "https://www.ericwei.me/login" }];
}
