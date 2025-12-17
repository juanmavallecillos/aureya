// app/api/unlock/route.ts
import { NextRequest, NextResponse } from "next/server";

const PASSCODES = (process.env.SITE_PASSCODES || "")
  .split(",")
  .map(p => p.trim())
  .filter(Boolean);

export async function POST(req: NextRequest) {
  try {
    const { pass } = (await req.json()) as { pass?: string };
    const provided = (pass || "").trim();

    // Si no hay contraseñas configuradas → acceso libre
    if (PASSCODES.length === 0) {
      return NextResponse.json({ ok: true, open: true }, { status: 200 });
    }

    if (!PASSCODES.includes(provided)) {
      return NextResponse.json({ ok: false, error: "invalid" }, { status: 401 });
    }

    // OK → set cookie
    const res = new NextResponse(null, { status: 204 });
    res.cookies.set("site-pass", "ok", {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });

    return res;
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
}

// (Opcional) Soporte GET ?pass=... por si quieres login vía URL también aquí
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const provided = (url.searchParams.get("pass") || "").trim();

  if (PASSCODES.length === 0) {
    return NextResponse.json({ ok: true, open: true }, { status: 200 });
  }

  if (!PASSCODES.includes(provided)) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true }, { status: 200 });
  res.cookies.set("site-pass", "ok", {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });

  return res;
}
