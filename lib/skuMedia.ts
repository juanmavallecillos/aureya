// lib/skuMedia.ts
import { cdnPath, toAbsolute } from "@/lib/cdn";

/** Devuelve rutas proxied (/api/cdn?path=...) para las imágenes del SKU. */
export async function fetchSkuImages(sku: string): Promise<string[]> {
  // Lee el índice global de media
  const url = toAbsolute(cdnPath("media/index.json"));
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) return [];

  // Estructura esperada: { [sku]: string[] } o { [sku]: { front, back, extra } }
  const idx = (await r.json()) as
    | Record<string, string[]>
    | Record<string, { front?: string; back?: string; extra?: string[] }>;

  const entry = (idx as any)?.[sku];
  if (!entry) return [];

  const paths = Array.isArray(entry)
    ? entry
    : [entry.front, entry.back, ...(entry.extra ?? [])];

  // Normaliza a /api/cdn?path=...
  return paths
    .filter(Boolean)
    .map((p) => {
      const clean = p!.startsWith("/") ? p!.slice(1) : p!;
      return `/api/cdn?path=${encodeURIComponent(clean)}`;
    });
}
