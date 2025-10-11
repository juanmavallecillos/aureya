// middleware.ts
import { NextResponse, NextRequest } from "next/server";

const PASS = process.env.SITE_PASSCODE || ""; // si lo usas
const BYPASS = [
  // Rutas que NO deben protegerse (necesarias en build/SSR)
  "^/api/cdn($|/)",       // proxy CDN
  "^/_cdn($|/)",          // estáticos del CDN local en /public/_cdn
  "^/favicon\\.ico$",
  "^/robots\\.txt$",
  "^/sitemap\\.xml$",
  "^/sitemap.*\\.xml$",   // por si tienes varios
  "^/manifest\\.json$",
  "^/assets($|/)",        // si tienes assets
  "^/.*\\.(?:png|jpe?g|webp|avif|svg|ico|css|js|txt)$",
];

function isBypassed(pathname: string) {
  return BYPASS.some((re) => new RegExp(re).test(pathname));
}

export function middleware(req: NextRequest) {
  const { pathname } = new URL(req.url);

  // ✅ No proteger estas rutas
  if (isBypassed(pathname)) return NextResponse.next();

  // Si no tienes lock, deja pasar todo
  if (!PASS) return NextResponse.next();

  // Tu lógica actual de unlock (cookie, header, query…)
  const cookie = req.cookies.get("site-pass");
  if (cookie?.value === PASS) return NextResponse.next();

  // Por comodidad, permite ?pass=... una vez (setea cookie y redirige limpio)
  const url = new URL(req.url);
  const pass = url.searchParams.get("pass");
  if (pass === PASS) {
    const res = NextResponse.redirect(new URL(url.pathname, url.origin));
    res.cookies.set("site-pass", PASS, {
      httpOnly: true,
      sameSite: "lax",     // ✅ en minúsculas
      maxAge: 60 * 60 * 24 * 7,
      path: "/",           // (recomendado)
      secure: process.env.NODE_ENV === "production", // (recomendado)
    });
    return res;
  }

  // Página de unlock minimal o 401 JSON si es API
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Renderiza una página sencilla (o redirige a /unlock si la tienes)
  return NextResponse.rewrite(new URL("/unlock", req.url));
}

// ⚠️ Matcher: protege TODO salvo lo listado arriba
export const config = {
  matcher: [
    // Aplica a todo, middleware internamente hace bypass por regex
    "/:path*",
  ],
};
