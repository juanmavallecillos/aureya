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
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  // new URL maneja bien paths como "/api/...":
  return new URL(url, base).toString();
}

type FetchOpts = {
  revalidate?: number;      // ISR en prod
  cache?: RequestCache;     // override si hace falta
};

export async function fetchJson<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const rel = cdnPath(path);
  const url = toAbsolute(rel);                 // 👈 clave: absoluta en server
  const isProd = process.env.NODE_ENV === "production";

  const init: RequestInit =
    isProd && opts.revalidate != null
      ? ({ next: { revalidate: opts.revalidate } } as any)
      : { cache: opts.cache ?? "no-store" };

  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`CDN ${res.status} ${path}`);
  return (await res.json()) as T;
}

export async function fetchJsonOrNull<T>(path: string, opts: FetchOpts = {}): Promise<T | null> {
  try {
    return await fetchJson<T>(path, opts);
  } catch (e: any) {
    const msg = typeof e?.message === "string" ? e.message : "";
    if (msg.includes("CDN 404")) return null;
    throw e;
  }
}

export async function fetchText(path: string, opts: FetchOpts = {}): Promise<string> {
  const rel = cdnPath(path);
  const url = toAbsolute(rel);                 // 👈 también aquí
  const isProd = process.env.NODE_ENV === "production";

  const init: RequestInit =
    isProd && opts.revalidate != null
      ? ({ next: { revalidate: opts.revalidate } } as any)
      : { cache: opts.cache ?? "no-store" };

  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`CDN ${res.status} ${path}`);
  return await res.text();
}
