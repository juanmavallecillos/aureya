// middleware.ts
import { NextResponse, type NextRequest } from "next/server";

const EXEMPT = [
  "/unlock",
  "/api/unlock",
  "/api/cdn",         // tu proxy al CDN
  "/_next",           // estáticos Next
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rutas exentas
  if (EXEMPT.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // Ya desbloqueado
  const cookie = req.cookies.get("aureya_pass");
  const pass = process.env.SITE_PASSCODE || "";
  const unlocked = cookie?.value && pass && cookie.value === pass;

  if (unlocked) {
    const res = NextResponse.next();
    // Seguridad adicional: asegura no indexar en este modo
    res.headers.set("x-robots-tag", "noindex, nofollow, noarchive");
    return res;
  }

  // Redirige a /unlock
  const url = req.nextUrl.clone();
  url.pathname = "/unlock";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    // protege todo excepto archivos estáticos en la raíz
    "/((?!.*\\.[\\w]+$).*)",
  ],
};
