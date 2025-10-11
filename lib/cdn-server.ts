// lib/cdn-server.ts  (SERVER-ONLY)

// Reutilizamos algunas utilidades
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

type FetchOpts = { revalidate?: number; cache?: RequestInit["cache"] };

// ⬇️ FS fallback: usar 'fs/promises' (¡sin el esquema 'node:'!) y devolver string
async function tryFsRead(_path: string): Promise<Response | null> {
  try {
    const { readFile } = await import("fs/promises");
    const rel = String(_path).replace(/^\/+/, "");
    const full = `${process.cwd()}/public/_cdn/${rel}`;
    const text = await readFile(full, "utf8");
    return new Response(text, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
    });
  } catch {
    return null;
  }
}

// Orden: FS → /_cdn → /api/cdn
async function fetchWithFsAndNetwork(path: string, opts: FetchOpts = {}) {
  const isProd = process.env.NODE_ENV === "production";
  const init: RequestInit =
    isProd && opts.revalidate != null
      ? ({ next: { revalidate: opts.revalidate } } as any)
      : { cache: opts.cache ?? "no-store" };

  // 1) FS directo (build/SSR Node)
  const fsRes = await tryFsRead(path);
  if (fsRes && fsRes.ok) return fsRes;

  // 2) HTTP local /_cdn
  const localUrl = toAbsolute(`/_cdn/${String(path).replace(/^\/+/, "")}`);
  try {
    const res = await fetch(localUrl, init);
    if (res.ok) return res;
  } catch {
    /* ignore */
  }

  // 3) HTTP /api/cdn
  const viaProxy = toAbsolute(cdnPath(path));
  try {
    const res2 = await fetch(viaProxy, init);
    if (res2.ok) return res2;
    return res2;
  } catch {
    return new Response("CDN fetch failed", { status: 502 });
  }
}

export async function fetchJsonServer<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const res = await fetchWithFsAndNetwork(path, opts);
  if (!res.ok) throw new Error(`CDN ${res.status} ${path}`);
  return (await res.json()) as T;
}

export async function fetchJsonOrNullServer<T>(
  path: string,
  opts: FetchOpts = {}
): Promise<T | null> {
  try {
    const res = await fetchWithFsAndNetwork(path, opts);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchTextServer(path: string, opts: FetchOpts = {}): Promise<string> {
  const res = await fetchWithFsAndNetwork(path, opts);
  if (!res.ok) throw new Error(`CDN ${res.status} ${path}`);
  return await res.text();
}
