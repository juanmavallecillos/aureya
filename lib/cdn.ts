// lib/cdn.ts
export async function fetchJson<T>(path: string, opts?: { revalidate?: number }): Promise<T> {
  const base = process.env.NEXT_PUBLIC_CDN_BASE!;
  const res = await fetch(`${base}${path}`, { next: { revalidate: opts?.revalidate ?? 60 } });
  if (!res.ok) throw new Error(`CDN ${res.status}`);
  return res.json() as Promise<T>;
}

export async function fetchJsonOrNull<T>(path: string, opts?: { revalidate?: number }): Promise<T | null> {
  try {
    return await fetchJson<T>(path, opts);
  } catch (e: any) {
    // Si el CDN responde 404, devolvemos null en lugar de lanzar
    if (typeof e?.message === "string" && e.message.includes("CDN 404")) return null;
    throw e;
  }
}
