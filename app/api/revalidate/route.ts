// app/api/revalidate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({} as any));
  const tags = Array.isArray(body?.tags) ? body.tags : [];
  for (const t of tags) revalidateTag(t);
  return NextResponse.json({ ok: true, revalidated: tags });
}