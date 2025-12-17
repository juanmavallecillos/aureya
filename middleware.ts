// middleware.ts
import { NextResponse, NextRequest } from "next/server";

/**
 * SITE_PASSCODES="Andorrano-V1,OtraPass"
 */
function getPasscodes(): string[] {
  return (process.env.SITE_PASSCODES || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

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
  "^/api/unlock($|/)",
  "^/api/revalidate($|/)",
  "^/unlock($|/)", // 👈 muy importante
];

function isBypassed(pathname: string) {
  return BYPASS.some((re) => new RegExp(re).test(pathname));
}

export function middleware(req: NextRequest) {
  const url = new URL(req.url);
  const { pathname } = url;

  // Rutas públicas
  if (isBypassed(pathname)) return NextResponse.next();

  const passcodes = getPasscodes();

  // Si no hay passcodes → web abierta
  if (!passcodes.length) return NextResponse.next();

  // Cookie válida (modelo limpio)
  const cookie = req.cookies.get("site-pass")?.value;
  if (cookie === "ok") return NextResponse.next();

  // Intento de login vía ?pass=...
  const provided = (url.searchParams.get("pass") || "").trim();
  if (provided && passcodes.includes(provided)) {
    const cleanUrl = new URL(url.pathname, url.origin);
    const res = NextResponse.redirect(cleanUrl);
    res.cookies.set("site-pass", "ok", {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });
    return res;
  }

  // APIs protegidas → 401
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Todo lo demás → pantalla de unlock
  return NextResponse.rewrite(new URL("/unlock", req.url));
}

export const config = { matcher: ["/:path*"] };
