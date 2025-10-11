// app/api/unlock/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { pass } = await req.json().catch(() => ({} as { pass?: string }));
  const expected = process.env.SITE_PASSCODE || "";

  if (!expected || pass !== expected) {
    // Mantén el no-index en modo protegido
    return NextResponse.json({ ok: false }, {
      status: 401,
      headers: { "x-robots-tag": "noindex, nofollow, noarchive" },
    });
  }

  const res = NextResponse.json({ ok: true });
  // Doble cinturón anti-index
  res.headers.set("x-robots-tag", "noindex, nofollow, noarchive");
  // Settea cookie para que el middleware te deje pasar
  res.cookies.set("aureya_pass", expected, {
    path: "/",
    httpOnly: false,     // si prefieres, pon true; el middleware solo lee la cookie
    sameSite: "lax",
    secure: true,
    maxAge: 60 * 60 * 24 * 7, // 7 días
  });
  return res;
}
