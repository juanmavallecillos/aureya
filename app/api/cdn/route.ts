// app/api/cdn/route.ts
import { NextRequest } from "next/server";

export const revalidate = 0;
export const dynamic = "force-dynamic";

function cleanJoin(base: string, path: string) {
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const path = searchParams.get("path");
  if (!path) {
    return new Response(JSON.stringify({ error: "Missing ?path" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const base = (process.env.NEXT_PUBLIC_CDN_BASE || "").trim();
  const ifNoneMatch = req.headers.get("if-none-match") || undefined;
  const ifModifiedSince = req.headers.get("if-modified-since") || undefined;

  // helper: intenta fetch y devuelve Response | null
  async function tryFetch(url: string) {
    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
        ...(ifNoneMatch ? { "If-None-Match": ifNoneMatch } : {}),
        ...(ifModifiedSince ? { "If-Modified-Since": ifModifiedSince } : {}),
      },
    });
    return res;
  }

  // 1) Si tenemos CDN_BASE, intentamos upstream
  if (base) {
    const upstreamUrl = cleanJoin(base, path);
    const upstream = await tryFetch(upstreamUrl).catch(() => null as any);

    if (upstream) {
      // 304 passthrough
      if (upstream.status === 304) {
        return new Response(null, {
          status: 304,
          headers: {
            "Cache-Control": "no-cache",
            ...(upstream.headers.get("ETag") ? { ETag: upstream.headers.get("ETag")! } : {}),
            ...(upstream.headers.get("Last-Modified")
              ? { "Last-Modified": upstream.headers.get("Last-Modified")! }
              : {}),
          },
        });
      }

      // ✅ si es OK devolvemos tal cual
      if (upstream.ok) {
        return new Response(upstream.body, {
          status: upstream.status,
          headers: {
            "Content-Type": upstream.headers.get("Content-Type") ?? "application/octet-stream",
            "Cache-Control": "no-cache",
            ...(upstream.headers.get("ETag") ? { ETag: upstream.headers.get("ETag")! } : {}),
            ...(upstream.headers.get("Last-Modified")
              ? { "Last-Modified": upstream.headers.get("Last-Modified")! }
              : {}),
          },
        });
      }

      // ❌ Si es 401/403/404/5xx -> caeremos a fallback local más abajo
      if ([401, 403, 404, 500, 502, 503, 504].includes(upstream.status)) {
        // seguimos al fallback local
      } else {
        // otros códigos raros: devolvemos error
        return new Response(
          JSON.stringify({ error: "CDN fetch failed", status: upstream.status }),
          { status: 502, headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" } }
        );
      }
    }
  }

  // 2) Fallback local: intenta servir desde /_cdn (carpeta public/_cdn del proyecto)
  // Construimos una URL absoluta al mismo host
  const localUrl = cleanJoin(origin, cleanJoin("_cdn", path));
  const local = await tryFetch(localUrl).catch(() => null as any);
  if (local && local.ok) {
    return new Response(local.body, {
      status: 200,
      headers: {
        "Content-Type": local.headers.get("Content-Type") ?? "application/octet-stream",
        "Cache-Control": "no-cache",
        ...(local.headers.get("ETag") ? { ETag: local.headers.get("ETag")! } : {}),
        ...(local.headers.get("Last-Modified")
          ? { "Last-Modified": local.headers.get("Last-Modified")! }
          : {}),
      },
    });
  }

  // 3) Nada funcionó
  return new Response(
    JSON.stringify({ error: "CDN fetch failed", status: local?.status ?? 502 }),
    { status: 502, headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" } }
  );
}
