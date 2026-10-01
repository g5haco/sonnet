import type { MetadataRoute } from "next";

// Public: the landing page ("/" when signed out), /login and the legal pages; everything else needs an account.
export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "login", "privacy", "terms"].map((path) => ({ url: `https://www.ericwei.me/${path}` }));
}
