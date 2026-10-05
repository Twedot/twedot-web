import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://twedot.com";
  const now = new Date();

  return [
    {
      url: base,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${base}/login`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
  ];
}
