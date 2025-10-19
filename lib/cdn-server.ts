// lib/cdn-server.ts  (SERVER-ONLY)
import "server-only";

export function cdnPath(path: string) {
  const clean = String(path || "").replace(/^\/+/, "");
  return `/api/cdn?path=${encodeURIComponent(clean)}`;
}
export function toAbsolute(url: string) {
  const base =
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    (process.env.NEXT_PUBLIC_SITE_URL
      ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "")
      : null) ||
    "http://127.0.0.1:3000";
  return new URL(url, base).toString();
}

type FetchOpts = { revalidate?: number };

async function fetchViaProxy(path: string, opts: FetchOpts = {}) {
  const isProd = process.env.NODE_ENV === "production";
  const init: RequestInit =
    isProd && opts.revalidate != null
      ? ({ next: { revalidate: opts.revalidate } } as any)
      : { cache: "no-store" };

  const viaProxy = toAbsolute(cdnPath(path));
  const res = await fetch(viaProxy, init);
  return res;
}

export async function fetchJsonServer<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const res = await fetchViaProxy(path, opts);
  if (!res.ok) throw new Error(`CDN ${res.status} ${path}`);
  return (await res.json()) as T;
}
export async function fetchJsonOrNullServer<T>(path: string, opts: FetchOpts = {}): Promise<T | null> {
  try {
    const res = await fetchViaProxy(path, opts);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
export async function fetchTextServer(path: string, opts: FetchOpts = {}): Promise<string> {
  const res = await fetchViaProxy(path, opts);
  if (!res.ok) throw new Error(`CDN ${res.status} ${path}`);
  return await res.text();
}
