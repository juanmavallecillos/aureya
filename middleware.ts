// middleware.ts
import { NextResponse, type NextRequest } from "next/server";

const EXEMPT = ["/unlock", "/api/unlock", "/api/cdn", "/_next", "/favicon.ico", "/robots.txt", "/sitemap.xml"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ➜ No proteger en desarrollo o si no hay passcode
  const isDev = process.env.NODE_ENV === "development";
  const pass = process.env.SITE_PASSCODE || "";
  if (isDev || !pass) return NextResponse.next();

  // Rutas exentas
  if (EXEMPT.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    const res = NextResponse.next();
    res.headers.set("x-robots-tag", "noindex, nofollow, noarchive");
    return res;
  }

  // Cookie ya desbloqueada
  const cookie = req.cookies.get("aureya_pass");
  const unlocked = cookie?.value === pass;
  if (unlocked) {
    const res = NextResponse.next();
    res.headers.set("x-robots-tag", "noindex, nofollow, noarchive");
    return res;
  }

  // Redirige a /unlock
  const url = req.nextUrl.clone();
  url.pathname = "/unlock";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/((?!.*\\.[\\w]+$).*)"] };
