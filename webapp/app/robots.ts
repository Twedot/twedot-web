import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/login", "/verify"],
        disallow: [
          "/stories",
          "/nearby",
          "/channels/",
          "/profile",
          "/settings",
          "/wallet",
          "/analytics",
          "/ads",
          "/inbox",
          "/create-post",
          "/complete-profile",
        ],
      },
    ],
    sitemap: "https://twedot.com/sitemap.xml",
  };
}
