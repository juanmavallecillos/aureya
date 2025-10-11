// lib/cdn.ts

/** Construye la URL al proxy local del CDN (/api/cdn) y sanea el path */
export function cdnPath(path: string) {
  const clean = String(path || "").replace(/^\/+/, ""); // quita barras iniciales
  return `/api/cdn?path=${encodeURIComponent(clean)}`;
}

type FetchOpts = {
  /** Segundos de revalidación ISR en producción (en dev se usa no-store) */
  revalidate?: number;
  /** Forzar cache mode si necesitas override explícito */
  cache?: RequestCache;
};

/** Fetch JSON desde el CDN (vía /api/cdn). Lanza si !ok */
export async function fetchJson<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const url = cdnPath(path);
  const isProd = process.env.NODE_ENV === "production";

  const init: RequestInit =
    isProd && opts.revalidate != null
      ? ({ next: { revalidate: opts.revalidate } } as any)
      : { cache: opts.cache ?? "no-store" };

  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`CDN ${res.status} ${path}`);
  return (await res.json()) as T;
}

/** Igual que fetchJson pero devuelve null si 404 */
export async function fetchJsonOrNull<T>(path: string, opts: FetchOpts = {}): Promise<T | null> {
  try {
    return await fetchJson<T>(path, opts);
  } catch (e: any) {
    const msg = typeof e?.message === "string" ? e.message : "";
    if (msg.includes("CDN 404")) return null;
    throw e;
  }
}

/** Fetch texto plano desde el CDN (sitemaps, CSV, etc.) */
export async function fetchText(path: string, opts: FetchOpts = {}): Promise<string> {
  const url = cdnPath(path);
  const isProd = process.env.NODE_ENV === "production";

  const init: RequestInit =
    isProd && opts.revalidate != null
      ? ({ next: { revalidate: opts.revalidate } } as any)
      : { cache: opts.cache ?? "no-store" };

  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`CDN ${res.status} ${path}`);
  return await res.text();
}
