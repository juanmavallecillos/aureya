// lib/cdn.ts

/** Devuelve /api/cdn?path=… con el path saneado */
export function cdnPath(path: string) {
  const clean = String(path || "").replace(/^\/+/, "");
  return `/api/cdn?path=${encodeURIComponent(clean)}`;
}

/** Convierte a URL absoluta cuando corre en servidor (Node/Edge) */
export function toAbsolute(url: string) {
  if (typeof window !== "undefined") return url; // en cliente, relativa OK

  const base =
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    (process.env.NEXT_PUBLIC_SITE_URL ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "") : null) ||
    "http://127.0.0.1:3000";

  return new URL(url, base).toString();
}

type FetchOpts = {
  revalidate?: number;      // ISR en prod
  cache?: RequestCache;     // override si hace falta
};

async function fetchWithFallback(path: string, opts: FetchOpts = {}) {
  const isProd = process.env.NODE_ENV === "production";
  const init: RequestInit =
    isProd && opts.revalidate != null
      ? ({ next: { revalidate: opts.revalidate } } as any)
      : { cache: opts.cache ?? "no-store" };

  // ✅ 1) Primero intenta LOCAL /_cdn
  const localUrl = toAbsolute(`/_cdn/${String(path).replace(/^\/+/, "")}`);
  let res = await fetch(localUrl, init);

  // 2) Si local falla (404/401/5xx) → intenta proxy /api/cdn
  if (!res.ok) {
    const viaProxy = toAbsolute(cdnPath(path));
    const res2 = await fetch(viaProxy, init);
    if (res2.ok) return res2;  // si proxy funciona, devolvemos ese
    // si ambos fallan, nos quedamos con el primero para el mensaje/estado
  }

  return res;
}

export async function fetchJson<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const res = await fetchWithFallback(path, opts);
  if (!res.ok) throw new Error(`CDN ${res.status} ${path}`);
  return (await res.json()) as T;
}

export async function fetchJsonOrNull<T>(path: string, opts: FetchOpts = {}): Promise<T | null> {
  try {
    const res = await fetchWithFallback(path, opts);
    if (!res.ok) return null;           // ⬅️ cualquier no-OK → null
    return (await res.json()) as T;
  } catch {
    return null;                         // ⬅️ cualquier excepción → null
  }
}

export async function fetchText(path: string, opts: FetchOpts = {}): Promise<string> {
  const res = await fetchWithFallback(path, opts);
  if (!res.ok) throw new Error(`CDN ${res.status} ${path}`);
  return await res.text();
}