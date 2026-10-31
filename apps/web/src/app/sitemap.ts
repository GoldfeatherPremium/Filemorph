import type { MetadataRoute } from "next";
import { TOOLS, SITE_URL } from "@filemorph/shared";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes = ["", "/tools", "/pricing", "/about", "/blog", "/privacy", "/terms", "/contact", "/faq"].map((p) => ({
    url: `${SITE_URL}${p}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.8,
  }));
  const toolRoutes = TOOLS.map((t) => ({
    url: `${SITE_URL}/tools/${t.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.9,
  }));
  return [...staticRoutes, ...toolRoutes];
}
