// lib/cdn.ts

/** Devuelve /api/cdn?path=… */
export function cdnPath(path: string) {
  const clean = String(path || "").replace(/^\/+/, "");
  return `/api/cdn?path=${encodeURIComponent(clean)}`;
}

/** Absolutiza en server (Node/Edge). En build VERCEL_URL no existe; por eso añadimos fallback. */
export function toAbsolute(url: string) {
  if (typeof window !== "undefined") return url;
  const base =
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    (process.env.NEXT_PUBLIC_SITE_URL ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "") : null) ||
    // En build, a veces NEXT_PUBLIC_SITE_URL apunta fuera o no está listo: no confíes 100% en red.
    "http://127.0.0.1:3000";
  return new URL(url, base).toString();
}

type FetchOpts = { revalidate?: number; cache?: RequestCache };

/** Tercer fallback: leer de disco en build/Node (public/_cdn/...) */
async function tryFsRead(_path: string): Promise<Response | null> {
  try {
    const { readFile } = await import("node:fs/promises");
    const rel = String(_path).replace(/^\/+/, "");
    const full = `${process.cwd()}/public/_cdn/${rel}`;

    // Para JSON: léelo como texto (string)
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

async function fetchWithFallback(path: string, opts: FetchOpts = {}) {
  const isProd = process.env.NODE_ENV === "production";
  const init: RequestInit =
    isProd && opts.revalidate != null
      ? ({ next: { revalidate: opts.revalidate } } as any)
      : { cache: opts.cache ?? "no-store" };

  // 1) Intenta LOCAL por HTTP: /_cdn/...
  const localUrl = toAbsolute(`/_cdn/${String(path).replace(/^\/+/, "")}`);
  let res: Response | null = null;
  try {
    res = await fetch(localUrl, init);
  } catch {
    res = null;
  }
  if (res && res.ok) return res;

  // 2) Si falla HTTP local, intenta proxy /api/cdn
  const viaProxy = toAbsolute(cdnPath(path));
  try {
    const res2 = await fetch(viaProxy, init);
    if (res2.ok) return res2;
  } catch {
    // ignore
  }

  // 3) Si la red falla (401/404/5xx o no hay host) → lee de DISCO (public/_cdn)
  const fsRes = await tryFsRead(path);
  if (fsRes) return fsRes;

  // 4) Último recurso: devuelve la primera respuesta mala si existía; si no, 502 genérico
  if (res) return res;
  return new Response("CDN fetch failed", { status: 502 });
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

/** Para construir URLs absolutas desde componentes cliente/SSR */
export function toAbsoluteMaybe(url: string) {
  try {
    return toAbsolute(url);
  } catch {
    return url;
  }
}
