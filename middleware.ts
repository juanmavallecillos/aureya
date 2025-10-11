// middleware.ts
import { NextResponse, NextRequest } from "next/server";

const PASS = (process.env.SITE_PASSCODE || "").trim();

const BYPASS = [
  "^/api/cdn($|/)",
  "^/_cdn($|/)",
  "^/favicon\\.ico$",
  "^/robots\\.txt$",
  "^/sitemap\\.xml$",
  "^/sitemap.*\\.xml$",
  "^/manifest\\.json$",
  "^/assets($|/)",
  "^/.*\\.(?:png|jpe?g|webp|avif|svg|ico|css|js|txt|map)$",
  "^/api/unlock($|/)", // opcional si usas el endpoint
];

function isBypassed(pathname: string) {
  return BYPASS.some((re) => new RegExp(re).test(pathname));
}

export function middleware(req: NextRequest) {
  const url = new URL(req.url);
  const { pathname } = url;

  if (isBypassed(pathname)) return NextResponse.next();
  if (!PASS) return NextResponse.next();

  // Cookie válida
  const cookie = req.cookies.get("site-pass");
  if (cookie?.value === PASS) return NextResponse.next();

  // Permitir ?pass=... (desde el formulario GET) → set cookie y redirigir limpio
  const pass = (url.searchParams.get("pass") || "").trim();
  if (pass && pass === PASS) {
    const res = NextResponse.redirect(new URL(url.pathname, url.origin));
    res.cookies.set("site-pass", PASS, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });
    return res;
  }

  // API => 401 JSON
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Página de unlock
  return NextResponse.rewrite(new URL("/unlock", req.url));
}

export const config = { matcher: ["/:path*"] };
