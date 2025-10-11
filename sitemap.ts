// app/sitemap.ts
import type { MetadataRoute } from "next";
import { productSlug } from "@/lib/slug";

/* ---------------- Config ---------------- */
const BASE = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");

/* ---------------- Tipos mínimos ---------------- */
type Offer = {
  sku: string;
  metal: string;
  form: string;
  weight_g: number;
  brand?: string | null;
  series?: string | null;
};
type AllOffersDoc = { updated_at?: string; offers?: Offer[] };
type DealersMap = Record<string, { label: string } | undefined>;

/* ---------------- Helpers ---------------- */
const OZ_TO_G = 31.1034768;
const toMetal = (m: string) => {
  const x = m?.toLowerCase?.() ?? "";
  if (x === "oro") return "gold";
  if (x === "plata") return "silver";
  return x;
};
const toForm = (f: string) => {
  const x = f?.toLowerCase?.() ?? "";
  if (["lingote", "lingotes", "bar"].includes(x)) return "bar";
  if (["moneda", "monedas", "coin"].includes(x)) return "coin";
  return x;
};
const bucketFromWeight = (g: number) => {
  if (Math.abs(g - OZ_TO_G) < 0.05) return "1oz";
  const specials = [1, 2, 2.5, 5, 10, 20, 50, 100, 250, 500, 1000];
  for (const s of specials) if (Math.abs(g - s) < 0.2) return `${s}g`;
  return `${Math.round(g)}g`;
};

// (Opcional) Si quisieras orden "real": descomenta esto y usa sort por gramos
// const bucketToGrams = (b: string) => (b === "1oz" ? OZ_TO_G : Number(b.replace("g", "")) || NaN);

/* ---------------- Fetch helpers ---------------- */
async function loadAllOffers(): Promise<AllOffersDoc | null> {
  try {
    const url = `${BASE}/api/cdn?path=${encodeURIComponent("prices/index/all_offers.json")}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function loadDealers(): Promise<DealersMap> {
  try {
    const url = `${BASE}/api/cdn?path=${encodeURIComponent("meta/dealers.json")}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return {};
    return res.json();
  } catch {
    return {};
  }
}

/* ---------------- Sitemap ---------------- */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [doc, dealersMap] = await Promise.all([loadAllOffers(), loadDealers()]);

  const offers: Offer[] = Array.isArray(doc?.offers) ? (doc!.offers as Offer[]) : [];
  const last = doc?.updated_at || new Date().toISOString();

  const out: MetadataRoute.Sitemap = [
    { url: `${BASE}/`,               lastModified: last, changeFrequency: "hourly", priority: 1.0 },
    { url: `${BASE}/oro`,            lastModified: last, changeFrequency: "daily",  priority: 0.9 },
    { url: `${BASE}/oro/lingotes`,   lastModified: last, changeFrequency: "daily",  priority: 0.8 },
    { url: `${BASE}/oro/monedas`,    lastModified: last, changeFrequency: "daily",  priority: 0.8 },
    { url: `${BASE}/plata`,          lastModified: last, changeFrequency: "daily",  priority: 0.9 },
    { url: `${BASE}/plata/lingotes`, lastModified: last, changeFrequency: "daily",  priority: 0.8 },
    { url: `${BASE}/plata/monedas`,  lastModified: last, changeFrequency: "daily",  priority: 0.8 },
    { url: `${BASE}/tiendas`,        lastModified: last, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/blog`,           lastModified: last, changeFrequency: "weekly", priority: 0.5 },
    { url: `${BASE}/sobre-nosotros`, lastModified: last, changeFrequency: "yearly", priority: 0.4 },
    { url: `${BASE}/contacto`,       lastModified: last, changeFrequency: "yearly", priority: 0.3 },
  ];

  /* ---- Productos: agrupa por SKU y construye slug ---- */
  const bySku = new Map<string, Offer>();
  for (const o of offers) {
    if (!bySku.has(o.sku)) bySku.set(o.sku, o);
  }
  for (const [sku, o] of bySku.entries()) {
    const slug = productSlug({
      metal: toMetal(o.metal),
      form: toForm(o.form),
      weight_g: o.weight_g,
      brand: o.brand ?? null,
      series: o.series ?? null,
      sku,
    });
    out.push({
      url: `${BASE}/producto/${slug}`,
      lastModified: last,
      changeFrequency: "hourly",
      priority: 0.8,
    });
  }

  /* ---- Categorías dinámicas: /[metal]/[form]/[bucket] ---- */
  const bucketsByKey = new Map<string, Set<string>>();
  for (const o of offers) {
    const metal = toMetal(o.metal);
    const form  = toForm(o.form);
    if (!metal || !form) continue;
    const key = `${metal}|${form}`;
    if (!bucketsByKey.has(key)) bucketsByKey.set(key, new Set());
    bucketsByKey.get(key)!.add(bucketFromWeight(Number(o.weight_g)));
  }

  for (const [key, set] of bucketsByKey.entries()) {
    const [metal, form] = key.split("|");
    const basePath =
      metal === "gold"
        ? (form === "bar" ? "/oro/lingotes" : "/oro/monedas")
        : metal === "silver"
        ? (form === "bar" ? "/plata/lingotes" : "/plata/monedas")
        : null;
    if (!basePath) continue;

    // Orden alfabético suficiente para sitemap (estable y simple)
    const buckets = Array.from(set).sort((a, b) => a.localeCompare(b));

    // Si prefieres orden "real" por gramos, usa esto en su lugar:
    // const buckets = Array.from(set).sort((a, b) => {
    //   const ga = bucketToGrams(a), gb = bucketToGrams(b);
    //   if (Number.isFinite(ga) && Number.isFinite(gb)) return ga - gb;
    //   return a.localeCompare(b);
    // });

    for (const b of buckets) {
      out.push({
        url: `${BASE}${basePath}/${b}`,
        lastModified: last,
        changeFrequency: "hourly",
        priority: 0.7,
      });
    }
  }

  /* ---- Tiendas dinámicas: /tiendas/[dealer] ---- */
  const dealerSlugs = Object.keys(dealersMap || {}).sort();
  for (const slug of dealerSlugs) {
    out.push({
      url: `${BASE}/tiendas/${slug}`,
      lastModified: last,
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }

  return out;
}
