"use client";
import { useEffect, useState } from "react";

/** Campos enriquecidos para páginas de tiendas (listado + ficha) */
export type DealerEntry = {
  /** id canónico del dealer (slug) */
  id: string;
  /** nombre legible de la tienda */
  label: string;

  /** URL del logotipo (SVG/PNG) optimizable con next/image si quieres */
  logo?: string;
  /** Imagen/avatar cuadrado para tarjetas (opcional) */
  image?: string;

  /** País en texto y/o ISO */
  country?: string;
  country_code?: string;

  /** Web principal (normalizamos website/url/base_url → website) */
  website?: string;

  /** ¿Envía a España? (opcional) */
  ships_to_es?: boolean;

  /** Chips opcionales para mostrar cobertura sin depender de ofertas */
  metals?: Array<"oro" | "plata" | "gold" | "silver" | string>;
  forms?: Array<"lingotes" | "monedas" | "bar" | "coin" | string>;

  /** Colores/rrss opcionales */
  brand_color?: string;
  social?: {
    twitter?: string;
    instagram?: string;
    facebook?: string;
    youtube?: string;
    tiktok?: string;
  };

  /** Cualquier otro campo libre del JSON */
  [key: string]: any;
};

/** Diccionario final: id → DealerEntry */
export type DealerMeta = Record<string, DealerEntry>;

/** Ruta del JSON servido por el publisher/CDN */
const CDN_DEALERS_PATH = "meta/dealers.json";

/** Memoria en sesión p/evitar refetch por cliente */
let MEMO: DealerMeta | null = null;

/** Normalizador: admite objeto {id:{...}} o array [{id,...}] y alinea claves */
function normalizeDealers(raw: unknown): DealerMeta {
  const out: DealerMeta = {};

  const coerce = (id: string, v: any): DealerEntry | null => {
    if (!id) return null;

    // Alinear alias de campos frecuentes
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
      // mantenemos el resto por si quieres usarlo después
      ...v,
    };

    // Limpieza mínima (evitar duplicados de alias ya normalizados)
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

  // Caso A: diccionario { "dealer-id": {...} }
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    for (const [id, v] of Object.entries(raw as Record<string, any>)) {
      const entry = coerce(id, v);
      if (entry) out[id] = entry;
    }
    return out;
  }

  // Caso B: array [{ id, ... }]
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
 * Hook para leer metadatos de tiendas desde la CDN con normalización de campos.
 * Devuelve siempre un diccionario por id.
 */
export function useDealerMeta(): DealerMeta {
  const [meta, setMeta] = useState<DealerMeta>(MEMO ?? {});

  useEffect(() => {
    if (MEMO) return;
    fetch(`/api/cdn?path=${encodeURIComponent(CDN_DEALERS_PATH)}`, {
      // si prefieres que cada carga ignore caché del navegador, descomenta:
      // cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const norm = normalizeDealers(data);
        MEMO = norm;
        setMeta(norm);
      })
      .catch(() => {
        // si falla, mantenemos objeto vacío; la UI puede degradar al slug
        MEMO = {};
        setMeta({});
      });
  }, []);

  return meta;
}
