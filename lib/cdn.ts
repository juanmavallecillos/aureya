// lib/cdn.ts — compatible con el código anterior (cdnPath/toAbsolute)
// Usa cdn.aureya.es si NEXT_PUBLIC_CDN_BASE está definida; si no, /api/cdn.

const CDN_BASE = (process.env.NEXT_PUBLIC_CDN_BASE ?? "").replace(/\/+$/, ""); // sin barra final

/** Nuevo nombre canónico (si quieres usarlo de ahora en adelante). */
export function cdnUrl(path: string) {
  const clean = String(path || "").replace(/^\/+/, "");
  return CDN_BASE ? `${CDN_BASE}/${clean}` : `/api/cdn?path=${encodeURIComponent(clean)}`;
}

/** Compatibilidad: antiguas llamadas siguen funcionando. */
export function cdnPath(path: string) {
  return cdnUrl(path);
}

/** Compatibilidad: mantenemos la firma original. */
export function toAbsolute(url: string) {
  // Si ya es absoluta, no tocamos.
  if (/^https?:\/\//i.test(url)) return url;
  // En cliente, devolvemos tal cual (Next resuelve relativo).
  if (typeof window !== "undefined") return url;
  // En SSR, resolvemos contra SITE_URL/VERCEL_URL o localhost.
  const base = process.env.NEXT_PUBLIC_CDN_BASE;
    // (process.env.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "")) ||
    // (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    // "http://127.0.0.1:3000";
  return new URL(url, base).toString();
}

type FetchOpts = { revalidate?: number };

async function fetchViaCdn(path: string, opts: FetchOpts = {}) {
  const isProd = process.env.NODE_ENV === "production";
  const init: RequestInit =
    isProd && opts.revalidate != null
      ? ({ next: { revalidate: opts.revalidate } } as any)
      : { cache: "no-store" };
  return fetch(cdnUrl(path), init);
}

export async function fetchJson<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const res = await fetchViaCdn(path, opts);
  if (!res.ok) throw new Error(`CDN ${res.status} ${path}`);
  return (await res.json()) as T;
}

export async function fetchJsonOrNull<T>(path: string, opts: FetchOpts = {}): Promise<T | null> {
  try {
    const res = await fetchViaCdn(path, opts);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchText(path: string, opts: FetchOpts = {}): Promise<string> {
  const res = await fetchViaCdn(path, opts);
  if (!res.ok) throw new Error(`CDN ${res.status} ${path}`);
  return await res.text();
}
