// app/api/cdn/route.ts
import { NextRequest } from "next/server";

export const revalidate = 0;                  // No ISR
export const dynamic = "force-dynamic";       // No caché en server/edge

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path");
  if (!path) {
    return new Response(JSON.stringify({ error: "Missing ?path" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const base = process.env.NEXT_PUBLIC_CDN_BASE;
  if (!base) {
    return new Response(JSON.stringify({ error: "Missing NEXT_PUBLIC_CDN_BASE" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Join limpio sin dobles barras (salvo tras http(s)://)
  const url = `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;

  // Propaga cabeceras condicionales del cliente para 304 baratas
  const ifNoneMatch = req.headers.get("if-none-match") || undefined;
  const ifModifiedSince = req.headers.get("if-modified-since") || undefined;

  const upstream = await fetch(url, {
    // importantísimo: evita caches intermedias en el runtime
    cache: "no-store",
    headers: {
      "Cache-Control": "no-cache",
      ...(ifNoneMatch ? { "If-None-Match": ifNoneMatch } : {}),
      ...(ifModifiedSince ? { "If-Modified-Since": ifModifiedSince } : {}),
    },
  });

  // Si el CDN dice 304, devolvemos 304 sin cuerpo
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

  if (!upstream.ok) {
    return new Response(
      JSON.stringify({ error: "CDN fetch failed", status: upstream.status }),
      {
        status: 502,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
      },
    );
  }

  // Pasamos el cuerpo tal cual y preservamos cabeceras útiles
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
      // Clave: el navegador revalida SIEMPRE con este endpoint (no se queda pegado)
      "Cache-Control": "no-cache",
      ...(upstream.headers.get("ETag") ? { ETag: upstream.headers.get("ETag")! } : {}),
      ...(upstream.headers.get("Last-Modified")
        ? { "Last-Modified": upstream.headers.get("Last-Modified")! }
        : {}),
    },
  });
}
