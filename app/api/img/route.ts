// app/api/img/route.ts
import { NextRequest } from "next/server";

/**
 * Proxy muy simple para imágenes remotas.
 * Evita hotlinking/Referer-blocking y nos permite cachear de forma controlada.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const src = searchParams.get("src");

  if (!src) {
    return new Response("Missing ?src", { status: 400 });
  }

  // Seguridad mínima: solo permitir http/https
  try {
    const u = new URL(src);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      return new Response("Invalid protocol", { status: 400 });
    }
  } catch {
    return new Response("Invalid URL", { status: 400 });
  }

  try {
    // Hacemos fetch sin enviar Referer para evitar bloqueos
    const res = await fetch(src, {
      // Importante: forzar modo "no-store" aquí si no quieres caching en edge;
      // en general, dejamos que el CDN/frontend maneje el cacheo.
      cache: "no-store",
      headers: {
        // Algunos servidores bloquean si detectan user-agent "node".
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
        // Evita enviar Referer al origen
        Referer: "",
      },
    });

    if (!res.ok || !res.body) {
      return new Response("Upstream error", { status: 502 });
    }

    // Copiamos el content-type si existe
    const contentType = res.headers.get("content-type") ?? "image/*";

    // Cache-Control para el navegador/CDN (ajusta a tu gusto)
    const cacheHeaders = {
      "Content-Type": contentType,
      // 1 día con stale-while-revalidate
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    };

    return new Response(res.body, {
      status: 200,
      headers: cacheHeaders,
    });
  } catch (err) {
    return new Response("Fetch error", { status: 500 });
  }
}
