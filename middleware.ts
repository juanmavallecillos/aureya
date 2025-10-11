// middleware.ts
import { NextResponse, NextRequest } from "next/server";

const PASS = process.env.SITE_PASSCODE || "";

// Rutas que NO deben protegerse (necesarias para build/SSR y assets)
const BYPASS = [
  "^/api/cdn($|/)",        // proxy CDN
  "^/_cdn($|/)",           // estáticos CDN local (public/_cdn)
  "^/favicon\\.ico$",
  "^/robots\\.txt$",
  "^/sitemap\\.xml$",
  "^/sitemap.*\\.xml$",
  "^/manifest\\.json$",
  "^/assets($|/)",         // si usas /assets
  "^/.*\\.(?:png|jpe?g|webp|avif|svg|ico|css|js|txt|map)$",
];

function isBypassed(pathname: string) {
  return BYPASS.some((re) => new RegExp(re).test(pathname));
}

export function middleware(req: NextRequest) {
  const { pathname } = new URL(req.url);

  // ✅ No se protege lo bypassed
  if (isBypassed(pathname)) return NextResponse.next();

  // Si no hay passcode, deja pasar todo
  if (!PASS) return NextResponse.next();

  // Cookie válida
  const cookie = req.cookies.get("site-pass");
  if (cookie?.value === PASS) return NextResponse.next();

  // Permitir ?pass=... una vez (setea cookie y redirige limpio)
  const url = new URL(req.url);
  const pass = url.searchParams.get("pass");
  if (pass === PASS) {
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

  // Respuesta para API vs páginas
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.rewrite(new URL("/unlock", req.url));
}

// ⚠️ Aplica a todo. El bypass se hace dentro por regex.
export const config = {
  matcher: ["/:path*"],
};
