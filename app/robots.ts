// app/robots.ts
import type { MetadataRoute } from "next";

const BASE = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/,"");
// Marca si debe indexarse. Mejor controlarlo por env.
const INDEXABLE = process.env.NEXT_PUBLIC_INDEXABLE === "true";
// Alternativa rápida: const INDEXABLE = BASE.includes("aureya.es");

export default function robots(): MetadataRoute.Robots {
  if (!INDEXABLE) {
    // Bloquea TODO en staging/desarrollo
    return {
      rules: { userAgent: "*", disallow: "/" },
      sitemap: `${BASE}/sitemap.xml`,
      host: BASE,
    };
  }
  // Producción indexable
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // opcional: disallow APIs internas
      // disallow: ["/api/"],
    },
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
