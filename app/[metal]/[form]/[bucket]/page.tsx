// app/producto/[...slug]/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import PriceChart from "@/components/PriceChart";
import VerifiedBadge from "@/components/VerifiedBadge";
import ProductGallery from "@/components/ProductGallery";
import { fetchJson } from "@/lib/cdn";
import { productSlug, extractSkuFromSlugParam } from "@/lib/slug";

export const revalidate = 60;

/* ---------- Tipos ---------- */
type Offer = {
  dealer_id: string;
  price_eur: number | null;
  shipping_eur: number | null;
  total_eur: number | null;
  premium_pct?: number | null;
  stock?: string | null;
  buy_url?: string | null;
  scraped_at?: string | null;
};

type SkuDoc = {
  sku: string;
  meta: {
    brand?: string | null;
    series?: string | null;
    metal: string;
    form: string;
    weight_g: number;
  };
  spot: { eur_per_g: number; updated_at: string };
  updated_at: string;
  offers: Offer[];
  best?: { dealer_id: string; total_eur: number };
  // Compat con legacy (para JSON-LD si no hay media/index.json)
  images?: string[];
  image?: string;
};

type HistDoc = { sku: string; series: { date: string; best_total_eur: number | null }[] };
type DealersMap = Record<string, { label: string; verified?: boolean }>;
type MediaIndex = Record<string, string[]>;

const OZ_TO_G = 31.1034768;

/* ---------- Utils formato ---------- */
const fmtMoney = (v: unknown) =>
  Number.isFinite(Number(v))
    ? new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(Number(v))
    : "—";
const fmtPct = (v: unknown) => (Number.isFinite(Number(v)) ? `${Number(v).toFixed(2)}%` : "—");

/* ---------- Helpers ES ---------- */
const niceMetal = (m?: string) => {
  const x = (m || "").toLowerCase();
  if (x === "oro" || x === "gold") return "Oro";
  if (x === "plata" || x === "silver") return "Plata";
  if (x === "platino" || x === "platinum") return "Platino";
  if (x === "paladio" || x === "palladium") return "Paladio";
  return m || "";
};

const niceForm = (f?: string) => {
  const x = (f || "").toLowerCase();
  if (x === "lingote" || x === "lingotes" || x === "bar") return "Lingote";
  if (x === "moneda" || x === "monedas" || x === "coin") return "Moneda";
  return f || "";
};

/* ---------- Bucket desde gramos ---------- */
function bucketFromWeight(weight_g: unknown) {
  const w = Number(weight_g);
  if (!Number.isFinite(w)) return "";
  if (Math.abs(w - OZ_TO_G) < 0.06) return "1oz";
  const specials = [1, 2, 2.5, 5, 10, 20, 31.1035, 50, 100, 250, 500, 1000];
  for (const s of specials) if (Math.abs(w - s) < 0.25) return s === 1000 ? "1kg" : `${s}g`;
  return `${Math.round(w)}g`;
}

/* ---------- Título “bonito” ---------- */
function weightLabel(weight_g: unknown) {
  const b = bucketFromWeight(weight_g);
  if (b === "1oz") return "1oz";
  if (b === "1kg") return "1kg";
  if (b && b.endsWith("g")) return b;
  const w = Math.max(1, Math.round(Number(weight_g || 0)));
  return `${w} g`;
}

function titleName(meta?: SkuDoc["meta"]) {
  if (!meta) return "";
  const form = niceForm(meta.form);   // "Lingote" | "Moneda"
  const metal = niceMetal(meta.metal); // "Oro" | "Plata"...
  const brandOrSeries = meta.series || meta.brand || "";
  return `${form} de ${metal}${brandOrSeries ? ` ${brandOrSeries}` : ""}`;
}

/* ---------- Chip UI ---------- */
function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="
        inline-flex items-center gap-1 rounded-full
        border border-[hsl(var(--brand))]
        bg-[hsl(var(--brand)/0.10)] text-[hsl(var(--brand))]
        px-2.5 py-1 text-xs font-medium
      "
    >
      {children}
    </span>
  );
}

/* ---------- Helpers media ---------- */
const toCdn = (p: string) => `/api/cdn?path=${encodeURIComponent(p)}`;

// Agrupa variantes -600/-1200
function groupMediaVariants(paths: string[]) {
  const map = new Map<string, { w600?: string; w1200?: string; base: string }>();
  for (const p of paths) {
    const m = p.match(/(.+)-(600|1200)\.(webp|avif|jpe?g|png)$/i);
    if (!m) continue;
    const base = m[1];
    const size = m[2];
    const prev = map.get(base) || { base };
    if (size === "600") prev.w600 = p;
    if (size === "1200") prev.w1200 = p;
    map.set(base, prev);
  }
  return Array.from(map.values());
}

/* ======================================================================================
   SEO dinámico
====================================================================================== */
export async function generateMetadata(
  { params }: { params: { slug: string[] } }
): Promise<Metadata> {
  const { slug } = params;
  const sku = extractSkuFromSlugParam(slug);

  const data = await fetchJson<SkuDoc>(`/prices/sku/${sku}.json`).catch(() => null);
  const meta = data?.meta;
  if (!meta) return { title: sku };

  const title = `${titleName(meta)} · ${weightLabel(meta.weight_g)}`;

  const prettySlug = productSlug({
    metal: meta.metal,
    form: meta.form,
    weight_g: meta.weight_g,
    brand: meta.brand ?? null,
    series: meta.series ?? null,
    sku,
  });

  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
  const canonical = `${base}/producto/${prettySlug}`;

  return {
    title,
    description: `Mejores ofertas, prima y evolución de precio para ${titleName(meta)} (${weightLabel(meta.weight_g)}). Datos actualizados y tiendas verificadas.`,
    alternates: { canonical },
    openGraph: {
      url: canonical,
      title,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: `Mejores ofertas de ${titleName(meta)} (${weightLabel(meta.weight_g)}).`,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
  };
}

/* ======================================================================================
   Página
====================================================================================== */
export default async function ProductPage(
  { params }: { params: { slug: string[] } }
) {
  const { slug } = params;
  const sku = extractSkuFromSlugParam(slug);

  // 1) Datos por SKU
  const data = await fetchJson<SkuDoc>(`/prices/sku/${sku}.json`).catch(() => null);
  if (!data?.meta) redirect("/");

  // 2) Slug canónico (redirect si no coincide)
  const canonicalSlug = productSlug({
    metal: data.meta.metal,
    form: data.meta.form,
    weight_g: data.meta.weight_g,
    brand: data.meta.brand ?? null,
    series: data.meta.series ?? null,
    sku: data.sku,
  });
  const requested = slug.at(-1) || "";
  if (!requested.includes("--") || requested !== canonicalSlug) {
    redirect(`/producto/${canonicalSlug}`);
  }

  // 3) Histórico
  const history = await fetchJson<HistDoc>(`/history/${sku}.json`).catch(() => ({ sku, series: [] }));

  // 4) Dealers
  const dealers = await fetchJson<DealersMap>("/meta/dealers.json").catch(() => ({} as DealersMap));
  const getDealerLabel = (id: string) => dealers?.[id]?.label || id;
  const isDealerVerified = (id: string) => !!dealers?.[id]?.verified;

  // 5) Ofertas ordenadas
  const offers = Array.isArray(data?.offers)
    ? [...data.offers]
        .filter((o) => o?.total_eur != null)
        .sort((a, b) => Number(a.total_eur) - Number(b.total_eur))
    : [];
  const best = offers[0] || null;

  // 6) Derivados
  const nameForTitle = titleName(data.meta);            // ej. "Lingote de Oro Sempsa"
  const weightLbl = weightLabel(data.meta.weight_g);    // ej. "1oz" o "100 g"
  const bucket = bucketFromWeight(data.meta.weight_g);
  const spotPerG = data.spot?.eur_per_g ?? null;
  const spotPerOz = spotPerG != null ? spotPerG * OZ_TO_G : null;

  const updatedAt = data?.updated_at ? new Date(data.updated_at) : null;
  const updatedStr = updatedAt
    ? updatedAt.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
    : "—";

  /* 7) GALERÍA desde media/index.json (hover-swap)
        - En dev: no-store
        - En prod: ISR revalidate: 300
  */
  const isDev = process.env.NODE_ENV !== "production";
  const BASE = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
  const mediaUrl = `${BASE}/api/cdn?path=${encodeURIComponent("media/index.json")}`;

  const mediaRes = await fetch(
    mediaUrl,
    isDev ? { cache: "no-store" } : { next: { revalidate: 300 } }
  );
  const mediaIdx: MediaIndex = mediaRes.ok ? await mediaRes.json() : {};

  const mediaPaths = Array.isArray(mediaIdx?.[data.sku]) ? mediaIdx[data.sku] : [];
  const pairs = groupMediaVariants(mediaPaths);

  // Seleccionamos hasta 2 imágenes (anverso/reverso) y generamos URLs vía /api/cdn
  const galleryImages: string[] = pairs
    .slice(0, 2)
    .map((g) => g.w1200 || g.w600) // prioriza 1200 si existe
    .filter(Boolean)
    .map((p) => toCdn(p as string));

  // Para JSON-LD si no hay índice/galería
  const jsonImages =
    galleryImages.length
      ? galleryImages
      : (data.images && data.images.length ? data.images : data.image ? [data.image] : []);

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16">
      {/* HERO */}
      <section className="pt-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              {nameForTitle} · {weightLbl}
            </h1>

            {/* Chips de contexto */}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Chip>{niceMetal(data.meta.metal)}</Chip>
              <Chip>{niceForm(data.meta.form)}</Chip>
              {bucket && <Chip>{bucket}</Chip>}
              <span className="text-sm text-zinc-600 ml-1">
                Actualizado: <span className="font-medium">{updatedStr}</span>
                {updatedAt && <span className="opacity-70"> ({updatedAt.toLocaleDateString("es-ES")})</span>}
              </span>
            </div>
          </div>

          {/* Derecha: Galería centrada */}
          {galleryImages.length ? (
            <div className="md:pl-0 self-center">
              <ProductGallery
                images={galleryImages}
                altBase={nameForTitle || data.sku}
                className="max-w-[360px] mx-auto"
              />
            </div>
          ) : null}
        </div>

        {/* Hairline dorado sutil */}
        <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-[hsl(var(--brand))] to-transparent" />
      </section>

      {/* Intro SEO */}
      <section
        className="mt-4 rounded-lg pl-4 pr-3 py-3"
        style={{
          borderLeft: "4px solid hsl(var(--brand))",
          background: "hsl(var(--brand) / 0.05)",
        }}
      >
        <h2 className="text-lg md:text-xl font-semibold text-zinc-900">
          Mejor precio y prima frente al <em>spot</em>
        </h2>
        <p className="mt-1 text-sm text-zinc-700">
          Esta ficha muestra <strong>mejor oferta</strong>, histórico diario y todas las ofertas
          disponibles para este SKU en tiendas verificadas. Calculamos la <strong>prima</strong> sobre
          el valor intrínseco (€/g y €/oz) para comparar de forma homogénea.
        </p>
      </section>

      {/* Info bar: spot */}
      <div className="mt-4 text-xs text-zinc-700 bg-white border rounded-lg overflow-hidden">
        <div className="px-3 py-2 flex flex-wrap items-center gap-x-5 gap-y-1">
          <span className="font-medium text-[hsl(var(--brand))]">Spot</span>
          <span>€/g: <strong>{spotPerG != null ? fmtMoney(spotPerG) : "—"}</strong></span>
          <span>€/oz: <strong>{spotPerOz != null ? fmtMoney(spotPerOz) : "—"}</strong></span>
          <span className="opacity-70">Fuente: meta/spot.json del SKU</span>
        </div>
      </div>

      {/* Mejor oferta */}
      <section className="mt-6">
        <div className="rounded-xl border shadow-[0_6px_20px_rgba(0,0,0,0.04)] bg-white overflow-hidden">
          <div
            className="px-4 py-3 border-b text-sm font-semibold text-zinc-900"
            style={{ background: "hsl(var(--brand) / 0.06)" }}
          >
            Mejor oferta
          </div>

          {best ? (
            <div className="p-4 md:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="text-2xl font-bold text-zinc-900 leading-none">
                {fmtMoney(best.total_eur)}
              </div>

              <div className="flex-1 grid sm:grid-cols-3 gap-2 text-sm text-zinc-700">
                <div className="flex items-center gap-2">
                  <div>
                    <div className="text-zinc-500">Tienda</div>
                    <div className="font-medium flex items-center gap-1">
                      {getDealerLabel(best.dealer_id)}
                      {isDealerVerified(best.dealer_id) && (
                        <VerifiedBadge size={18} className="translate-y-[1px]" />
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-zinc-500">Precio</div>
                  <div className="font-medium">{fmtMoney(best.price_eur)}</div>
                </div>
                <div>
                  <div className="text-zinc-500">Envío</div>
                  <div className="font-medium">{fmtMoney(best.shipping_eur)}</div>
                </div>
                <div>
                  <div className="text-zinc-500">Prima</div>
                  <div className="font-medium">{fmtPct(best.premium_pct)}</div>
                </div>
                <div>
                  <div className="text-zinc-500">Stock</div>
                  <div className="font-medium">{best.stock ?? "—"}</div>
                </div>
                <div>
                  <div className="text-zinc-500">Extraído</div>
                  <div className="font-medium">
                    {best.scraped_at
                      ? new Date(best.scraped_at).toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </div>
                </div>
              </div>

              {best.buy_url && (
                <a
                  href={best.buy_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium
                             bg-[hsl(var(--brand))] text-white hover:opacity-90 focus:outline-none
                             focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand)/0.35)]"
                  aria-label={`Comprar en ${getDealerLabel(best.dealer_id)}`}
                >
                  Comprar
                  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                    <path
                      fill="currentColor"
                      d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3ZM5 5h6v2H7v10h10v-4h2v6H5V5Z"
                    />
                  </svg>
                </a>
              )}
            </div>
          ) : (
            <div className="p-4 text-sm text-zinc-600">No hay ofertas activas ahora mismo.</div>
          )}
        </div>
      </section>

      {/* Histórico */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">Histórico (mejor precio diario)</h2>
        <div className="mt-3 rounded-xl border bg-white p-3 md:p-4">
          <PriceChart data={history?.series ?? []} />
        </div>
      </section>

      {/* Tabla de ofertas */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">Todas las ofertas para este SKU</h2>
        <p className="text-sm text-zinc-600 mt-1">
          Ordenadas por <em>total</em> (precio + envío). La primera fila coincide con la mejor oferta.
        </p>

        <div className="mt-3 overflow-x-auto rounded-xl border bg-white">
          <table className="min-w-[860px] w-full text-sm">
            <thead className="bg-zinc-50 text-zinc-600">
              <tr>
                <th className="th text-left w-52 px-4 py-2.5">Tienda</th>
                <th className="th text-right w-28 px-4 py-2.5">Precio</th>
                <th className="th text-right w-28 px-4 py-2.5">Envío</th>
                <th className="th text-right w-32 px-4 py-2.5">Total</th>
                <th className="th text-right w-32 px-4 py-2.5">Prima</th>
                <th className="th text-center w-28 px-4 py-2.5">Stock</th>
                <th className="th text-right w-40 px-4 py-2.5">Comprar</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {offers.map((o, idx) => {
                const dealerLabel = getDealerLabel(o.dealer_id);
                const verified = isDealerVerified(o.dealer_id);
                return (
                  <tr
                    key={`${o.dealer_id}-${o.buy_url ?? idx}`}
                    className={[
                      idx % 2 === 0 ? "bg-white" : "bg-zinc-50/40",
                      idx === 0 ? "bg-[hsl(var(--brand)/0.08)]" : "",
                      "hover:bg-zinc-50 transition-colors",
                    ].join(" ")}
                  >
                    <td className="td px-4 py-2.5">
                      <div className="inline-flex items-center gap-1.5">
                        <span className="font-medium">{dealerLabel}</span>
                        {verified ? <VerifiedBadge size={16} className="translate-y-[1px]" /> : null}
                      </div>
                    </td>
                    <td className="td text-right tabular-nums px-4 py-2.5">{fmtMoney(o.price_eur)}</td>
                    <td className="td text-right tabular-nums px-4 py-2.5">{fmtMoney(o.shipping_eur)}</td>
                    <td className="td text-right tabular-nums font-semibold text-zinc-900 px-4 py-2.5">
                      {fmtMoney(o.total_eur)}
                    </td>
                    <td className="td text-right tabular-nums px-4 py-2.5">{fmtPct(o.premium_pct)}</td>
                    <td className="td text-center px-4 py-2.5">{o.stock ?? "—"}</td>
                    <td className="td text-right px-4 py-2.5">
                      {o.buy_url ? (
                        <a
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium
                                     bg-[hsl(var(--brand))] text-white hover:opacity-90
                                     focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand)/0.35)]"
                          href={o.buy_url}
                          aria-label="Comprar"
                          title={`Comprar en ${dealerLabel}`}
                        >
                          Comprar
                          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                            <path
                              fill="currentColor"
                              d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3ZM5 5h6v2H7v10h10v-4h2v6H5V5Z"
                            />
                          </svg>
                        </a>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!offers.length && (
                <tr>
                  <td colSpan={7} className="td text-center text-zinc-500 py-8">
                    No hay ofertas disponibles para este SKU.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="px-3 py-2 text-xs text-zinc-600">
            Nota: la prima se muestra sin envío. El coste de envío exacto se confirma en la tienda.
          </div>
        </div>
      </section>

      {/* JSON-LD (incluye imágenes si existen) */}
      {(() => {
        const base = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/, "");
        const productUrl = base ? `${base}/producto/${canonicalSlug}` : undefined;
        const jsonLd: Record<string, any> = {
          "@context": "https://schema.org",
          "@type": "Product",
          name: `${nameForTitle} · ${weightLbl}`,
          sku: data.sku,
          brand: data.meta.brand ? { "@type": "Brand", name: data.meta.brand } : undefined,
          category: `${data.meta.metal}/${data.meta.form}`,
          url: productUrl,
          ...(jsonImages && jsonImages.length ? { image: jsonImages } : {}),
          offers: offers.length
            ? {
                "@type": "AggregateOffer",
                priceCurrency: "EUR",
                lowPrice: Number(offers[0]?.total_eur ?? 0).toFixed(2),
                offerCount: offers.length,
              }
            : undefined,
        };
        return (
          <script
            type="application/ld+json"
            // @ts-ignore JSON para el DOM
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        );
      })()}
    </main>
  );
}
