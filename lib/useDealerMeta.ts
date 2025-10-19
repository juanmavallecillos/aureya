// lib/useDealerMeta.ts
"use client";
import { useEffect, useState } from "react";
import { cdnUrl } from "@/lib/cdn";

/** ---------------- Tipos ---------------- */
export type DealerEntry = {
  id: string;
  label: string;
  logo?: string;
  image?: string;
  country?: string;
  country_code?: string;
  website?: string;
  ships_to_es?: boolean;
  metals?: Array<"oro" | "plata" | "gold" | "silver" | string>;
  forms?: Array<"lingotes" | "monedas" | "bar" | "coin" | string>;
  brand_color?: string;
  social?: {
    twitter?: string;
    instagram?: string;
    facebook?: string;
    youtube?: string;
    tiktok?: string;
  };
  [key: string]: any;
};
export type DealerMeta = Record<string, DealerEntry>;

const CDN_DEALERS_PATH = "meta/dealers.json";

/** Memoria en sesión para evitar refetch */
let MEMO: DealerMeta | null = null;

/** Normalizador */
function normalizeDealers(raw: unknown): DealerMeta {
  const out: DealerMeta = {};

  const coerce = (id: string, v: any): DealerEntry | null => {
    if (!id) return null;
    const website = v.website ?? v.url ?? v.base_url ?? undefined;
    const label = v.label ?? v.name ?? id;
    const entry: DealerEntry = {
      id,
      label,
      logo: v.logo ?? v.logo_url ?? undefined,
      image: v.image ?? v.avatar ?? undefined,
      country: v.country ?? undefined,
      country_code: v.country_code ?? v.cc ?? undefined,
      website,
      ships_to_es: v.ships_to_es ?? v.shipsToES ?? v.ships_es ?? undefined,
      metals: Array.isArray(v.metals) ? v.metals : undefined,
      forms: Array.isArray(v.forms) ? v.forms : undefined,
      brand_color: v.brand_color ?? v.brandColor ?? undefined,
      social: v.social ?? undefined,
      ...v,
    };
    delete (entry as any).url;
    delete (entry as any).base_url;
    delete (entry as any).name;
    delete (entry as any).logo_url;
    delete (entry as any).avatar;
    delete (entry as any).cc;
    delete (entry as any).shipsToES;
    delete (entry as any).ships_es;
    delete (entry as any).brandColor;
    return entry;
  };

  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    for (const [id, v] of Object.entries(raw as Record<string, any>)) {
      const entry = coerce(id, v);
      if (entry) out[id] = entry;
    }
    return out;
  }

  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (!item) continue;
      const id = item.id ?? item.slug ?? "";
      const entry = coerce(id, item);
      if (entry) out[entry.id] = entry;
    }
  }

  return out;
}

/**
 * Hook seguro: por defecto NO hace fetch en cliente.
 * - Si pasas `prefetched`, lo usa y memoiza.
 * - Si no hay datos y `allowClientFetch` es false → devuelve {} sin fetch (evita CORS).
 * - Si `allowClientFetch` es true → hace fetch al CDN (requiere CORS en CDN).
 */
export function useDealerMeta(
  prefetched?: DealerMeta | null,
  allowClientFetch: boolean = false
): DealerMeta {
  const [meta, setMeta] = useState<DealerMeta>(() => prefetched ?? MEMO ?? {});

  // Prefetch desde server
  useEffect(() => {
    if (prefetched && Object.keys(prefetched).length) {
      MEMO = prefetched;
      setMeta(prefetched);
    }
  }, [prefetched]);

  // Fetch en cliente (solo si se permite explícitamente)
  useEffect(() => {
    if (MEMO || meta && Object.keys(meta).length) return;
    if (!allowClientFetch) return; // 🔒 por defecto no fetchea en cliente

    const url = cdnUrl(CDN_DEALERS_PATH);
    fetch(url, { credentials: "omit", referrerPolicy: "no-referrer" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const norm = normalizeDealers(data);
        MEMO = norm;
        setMeta(norm);
      })
      .catch((err) => {
        console.error("[useDealerMeta] client fetch error:", err);
        MEMO = {};
        setMeta({});
      });
  }, [allowClientFetch, meta]);

  return meta;
}
