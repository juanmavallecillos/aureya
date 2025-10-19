// lib/cdn.ts — CLIENT-SAFE (para componentes con "use client")
// Lee directo del CDN si NEXT_PUBLIC_CDN_BASE está definida; si no, usa /api/cdn.

export const CDN_BASE =
  (process.env.NEXT_PUBLIC_CDN_BASE?.replace(/\/+$/, "")) || ""; // sin barra final

/** URL absoluta del CDN desde ruta relativa o URL ya absoluta */
export function cdnUrl(pathOrUrl: string): string {
  if (!pathOrUrl) throw new Error("cdnUrl: pathOrUrl vacío");
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl; // ya absoluta
  const clean = String(pathOrUrl).replace(/^\/+/, "");
  return CDN_BASE
    ? `${CDN_BASE}/${clean}`
    : `/api/cdn?path=${encodeURIComponent(clean)}`; // fallback a proxy
}

/** Compat: alias histórico */
export const cdnPath = (path: string) => cdnUrl(path);

/** Compat: mantiene firma original de toAbsolute (útil para URLs del SITE) */
export function toAbsolute(url: string) {
  if (/^https?:\/\//i.test(url)) return url;      // ya absoluta
  if (typeof window !== "undefined") return url;  // el navegador resuelve
  const base =
    (process.env.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "")) ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    "http://127.0.0.1:3000";
  return new URL(url, base!).toString();
}

/* ============================
 * Fetch helpers (CLIENT)
 * ============================ */

type FetchOpts = { revalidate?: number }; // se ignora en cliente

async function fetchViaCdn(pathOrUrl: string, _opts: FetchOpts = {}) {
  // Importante: en cliente no usamos next.revalidate ni cache:'no-store'
  // para dejar que el CDN y el navegador gestionen la caché.
  const url = cdnUrl(pathOrUrl);
  return fetch(url); // puedes pasar init si alguna vez lo necesitas
}

export async function fetchJson<T>(pathOrUrl: string, opts: FetchOpts = {}): Promise<T> {
  const res = await fetchViaCdn(pathOrUrl, opts);
  if (!res.ok) throw new Error(`CDN ${res.status} ${res.statusText} :: ${cdnUrl(pathOrUrl)}`);
  return (await res.json()) as T;
}

export async function fetchJsonOrNull<T>(
  pathOrUrl: string,
  opts: FetchOpts = {}
): Promise<T | null> {
  try {
    const res = await fetchViaCdn(pathOrUrl, opts);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchText(pathOrUrl: string, opts: FetchOpts = {}): Promise<string> {
  const res = await fetchViaCdn(pathOrUrl, opts);
  if (!res.ok) throw new Error(`CDN ${res.status} ${res.statusText} :: ${cdnUrl(pathOrUrl)}`);
  return await res.text();
}

/** Syntactic sugar para imágenes/media del CDN: next/image src={cdnMedia('logos/x.svg')} */
export const cdnMedia = (p: string) => cdnUrl(p);
