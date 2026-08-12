import type { MetadataRoute } from "next";

const BASE = "https://virafold.ai";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private, session-gated, or machine-only surfaces.
        disallow: ["/api/", "/dashboard", "/admin", "/reset", "/forgot"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
