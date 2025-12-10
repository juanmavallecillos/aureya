// lib/cdn-server.ts  (SERVER-ONLY)
import "server-only";

/**
 * Base del CDN. Permite override por entorno.
 * Ej: NEXT_PUBLIC_CDN_BASE=https://staging-cdn.aureya.es
 */
const CDN_BASE =
  process.env.NEXT_PUBLIC_CDN_BASE?.replace(/\/+$/, "") ||
  "https://cdn.aureya.es";

/** Construye una URL ABSOLUTA al CDN desde una ruta relativa o una URL ya absoluta. */
function cdnUrl(pathOrUrl: string): string {
  if (!pathOrUrl) throw new Error("cdnUrl: pathOrUrl vacío");
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const clean = String(pathOrUrl).replace(/^\/+/, "");
  return `${CDN_BASE}/${clean}`;
}

/* ============================================================================
 * Opciones de fetch para helpers de servidor
 * ============================================================================
 */

export type FetchOpts = {
  /** Revalidate en segundos (Next data cache). */
  revalidate?: number;
  /** Tags para revalidateTag. */
  tags?: string[];
  /**
   * Control de caché explícito de Next.
   * Si se pasa `cache`, NO se aplica `next: { revalidate, tags }`.
   * Ejemplo típico: cache: "no-store"
   */
  cache?: RequestCache; // "default" | "no-store" | "force-cache" | ...
};

/** Fetch directo al CDN (sin proxy /api/cdn) y compatible con ISR. */
async function fetchFromCdn(path: string, opts: FetchOpts = {}) {
  const url = cdnUrl(path); // usa https://cdn.aureya.es/...

  const { revalidate, tags, cache } = opts;

  const init: RequestInit & {
    next?: { revalidate?: number; tags?: string[] };
  } = {};

  if (cache) {
    // Si especificas cache (p.ej. "no-store"), dejamos que eso mande.
    init.cache = cache;
  } else if (revalidate != null || (tags && tags.length)) {
    // Sin cache explícito: usamos sistema de Next (data cache) si hay revalidate/tags.
    const nextOpts: { revalidate?: number; tags?: string[] } = {};
    if (revalidate != null) nextOpts.revalidate = revalidate;
    if (tags && tags.length) nextOpts.tags = tags;
    init.next = nextOpts;
  } else {
    // Por defecto (ningún hint): no-store para leer siempre lo último del CDN.
    init.cache = "no-store";
  }

  return fetch(url, init);
}

/* =================================================================================
 * API pública (mantenemos nombres y tipos para evitar cambios en el resto del código)
 * ================================================================================= */

export async function fetchJsonServer<T>(
  path: string,
  opts: FetchOpts = {}
): Promise<T> {
  const res = await fetchFromCdn(path, opts);
  if (!res.ok)
    throw new Error(`CDN ${res.status} ${res.statusText} :: ${cdnUrl(path)}`);
  return (await res.json()) as T;
}

export async function fetchJsonOrNullServer<T>(
  path: string,
  opts: FetchOpts = {}
): Promise<T | null> {
  try {
    const res = await fetchFromCdn(path, opts);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch (err) {
    console.error(
      "[cdn] fetchJsonOrNullServer error:",
      (err as Error)?.message || err
    );
    return null;
  }
}

export async function fetchTextServer(
  path: string,
  opts: FetchOpts = {}
): Promise<string> {
  const res = await fetchFromCdn(path, opts);
  if (!res.ok)
    throw new Error(`CDN ${res.status} ${res.statusText} :: ${cdnUrl(path)}`);
  return await res.text();
}

/* =========================================================================
 * Helpers legacy (dejados por compatibilidad en caso de que los uses).
 * Ya no se usan en las funciones de fetch para evitar el proxy interno.
 * ========================================================================= */

/** (LEGACY) Antes devolvía /api/cdn?path=...  — Ahora devuelve ABSOLUTA del CDN. */
export function cdnPath(path: string) {
  return cdnUrl(path);
}

/** (LEGACY) Conservamos la semántica original para URLs del SITE, no del CDN. */
export function toAbsolute(url: string) {
  const base =
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    (process.env.NEXT_PUBLIC_SITE_URL
      ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "")
      : null) ||
    "http://127.0.0.1:3000";
  return new URL(url, base).toString();
}
