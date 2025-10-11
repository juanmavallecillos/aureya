// lib/cdn.ts  (CLIENT-SAFE: no usa 'fs')

/** /api/cdn?path=… */
export function cdnPath(path: string) {
  const clean = String(path || "").replace(/^\/+/, "");
  return `/api/cdn?path=${encodeURIComponent(clean)}`;
}

/** Absolutiza en server; en cliente devuelve tal cual */
export function toAbsolute(url: string) {
  if (typeof window !== "undefined") return url;
  const base =
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    (process.env.NEXT_PUBLIC_SITE_URL
      ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "")
      : null) ||
    "http://127.0.0.1:3000";
  return new URL(url, base).toString();
}

type FetchOpts = { revalidate?: number; cache?: RequestCache };

// Cliente/SSR: intenta primero /_cdn (estático), luego /api/cdn (proxy)
async function fetchWithFallback(path: string, opts: FetchOpts = {}) {
  const isProd = process.env.NODE_ENV === "production";
  const init: RequestInit =
    isProd && opts.revalidate != null
      ? ({ next: { revalidate: opts.revalidate } } as any)
      : { cache: opts.cache ?? "no-store" };

  // 1) /_cdn
  const localUrl = toAbsolute(`/_cdn/${String(path).replace(/^\/+/, "")}`);
  try {
    const res = await fetch(localUrl, init);
    if (res.ok) return res;
  } catch {
    /* ignore */
  }

  // 2) /api/cdn
  const viaProxy = toAbsolute(cdnPath(path));
  try {
    const res2 = await fetch(viaProxy, init);
    if (res2.ok) return res2;
    return res2; // devolver respuesta (aunque sea 4xx/5xx) para diagnóstico
  } catch {
    return new Response("CDN fetch failed", { status: 502 });
  }
}

export async function fetchJson<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const res = await fetchWithFallback(path, opts);
  if (!res.ok) throw new Error(`CDN ${res.status} ${path}`);
  return (await res.json()) as T;
}

export async function fetchJsonOrNull<T>(path: string, opts: FetchOpts = {}): Promise<T | null> {
  try {
    const res = await fetchWithFallback(path, opts);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchText(path: string, opts: FetchOpts = {}): Promise<string> {
  const res = await fetchWithFallback(path, opts);
  if (!res.ok) throw new Error(`CDN ${res.status} ${path}`);
  return await res.text();
}
