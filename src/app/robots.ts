import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Only production is indexable. Previews and staging stay out of search.
export default function robots(): MetadataRoute.Robots {
  const production = process.env.VERCEL_ENV === "production";
  return production
    ? { rules: [{ userAgent: "*", allow: "/", disallow: "/api/" }], sitemap: `${SITE_URL}/sitemap.xml` }
    : { rules: [{ userAgent: "*", disallow: "/" }] };
}
