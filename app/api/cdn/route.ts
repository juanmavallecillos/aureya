// app/api/cdn/route.ts
import { NextRequest } from "next/server";
import * as nodePath from "node:path";
import { promises as fs } from "node:fs";
import mime from "mime-types";

export const runtime = "nodejs";
export const revalidate = 0;
export const dynamic = "force-dynamic";

function cleanPath(p: string): string {
  const s = p.replace(/^\/+/, "");
  if (s.includes("..")) throw new Error("Invalid path");
  return s;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawPath = searchParams.get("path");
  if (!rawPath) {
    return new Response(JSON.stringify({ error: "Missing ?path" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const path = cleanPath(rawPath);
  const base = (process.env.NEXT_PUBLIC_CDN_BASE || "").trim();

  // A) Proxy a CDN externo
  if (base && /^https?:\/\//i.test(base)) {
    const url = `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;

    const ifNoneMatch = req.headers.get("if-none-match") || undefined;
    const ifModifiedSince = req.headers.get("if-modified-since") || undefined;

    const upstream = await fetch(url, {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
        ...(ifNoneMatch ? { "If-None-Match": ifNoneMatch } : {}),
        ...(ifModifiedSince ? { "If-Modified-Since": ifModifiedSince } : {}),
      },
    });

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
        }
      );
    }

    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
        "Cache-Control": "no-cache",
        ...(upstream.headers.get("ETag") ? { ETag: upstream.headers.get("ETag")! } : {}),
        ...(upstream.headers.get("Last-Modified")
          ? { "Last-Modified": upstream.headers.get("Last-Modified")! }
          : {}),
      },
    });
  }

  // B) Fallback local: public/_cdn/<path>
  try {
    const filePath = nodePath.join(process.cwd(), "public", "_cdn", path);
    const buf = await fs.readFile(filePath); // Buffer (subclase de Uint8Array)
    const stat = await fs.stat(filePath);
    const type = mime.lookup(filePath) || "application/octet-stream";

    const weakEtag = `W/"${stat.size.toString(16)}-${Math.floor(stat.mtimeMs)}"`;
    const ifNoneMatch = req.headers.get("if-none-match") || "";
    const ifModifiedSince = req.headers.get("if-modified-since") || "";
    const mtimeUTC = stat.mtime.toUTCString();

    const notModifiedByEtag = ifNoneMatch && ifNoneMatch === weakEtag;
    const notModifiedByDate = ifModifiedSince && new Date(ifModifiedSince) >= stat.mtime;

    if (notModifiedByEtag || notModifiedByDate) {
      return new Response(null, {
        status: 304,
        headers: {
          ETag: weakEtag,
          "Last-Modified": mtimeUTC,
          "Content-Type": String(type),
          "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
        },
      });
    }

    // ✅ Copia a un Uint8Array NUEVO (respaldo = ArrayBuffer), compatible con BlobPart
    const copy = Uint8Array.from(buf);
    const body = new Blob([copy]); // opcional: { type: String(type) }

    return new Response(body, {
      headers: {
        "Content-Type": String(type),
        ETag: weakEtag,
        "Last-Modified": mtimeUTC,
        "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
    });
  }
}