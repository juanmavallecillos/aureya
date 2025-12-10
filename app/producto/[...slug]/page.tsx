// app/producto/[...slug]/page.tsx
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import PriceChart from "@/components/PriceChart";
import VerifiedBadge from "@/components/VerifiedBadge";
import ProductGallery from "@/components/ProductGallery";
import {
  fetchJsonOrNullServer as fetchJsonOrNull,
  cdnPath,
} from "@/lib/cdn-server";
import { productSlug, extractSkuFromSlugParam } from "@/lib/slug";
import SkuOffersTable from "@/components/SkuOffersTable";

export const revalidate = 60;

/* ---------- Tipos ---------- */
type Offer = {
  dealer_id: string;
  price_eur: number | null;
  shipping_eur: number | null;
  total_eur: number | null;
  premium_pct?: number | null;
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
    // (opcional, si algún scraper/publisher ya lo añade)
    weight_label?: string | null; // p.ej. "1/2oz", "2,5g"
    weight_label_slug?: string | null; // p.ej. "1_2oz", "2_5g"
  };
  spot: { eur_per_g: number; updated_at: string };
  updated_at: string;
  offers: Offer[];
  best?: { dealer_id: string; total_eur: number };
  images?: string[];
  image?: string;
};

type HistDoc = {
  sku: string;
  series: { date: string; best_total_eur: number | null }[];
};
type DealersMap = Record<string, { label: string; verified?: boolean }>;

// Spot global (lo leemos desde meta/spot.json en el servidor)
type SpotDoc = {
  gold_eur_per_g?: number;
  silver_eur_per_g?: number;
  updated_at?: string;
};

const OZ_TO_G = 31.1034768;

/* ---------- Buckets fijos + tolerancias ---------- */
const BUCKETS_ORDER: string[] = [
  "2g",
  "2,5g",
  "5g",
  "1/4oz",
  "10g",
  "1/2oz",
  "20g",
  "25g",
  "1oz",
  "50g",
  "100g",
  "250g",
  "500g",
  "1kg",
];
const BUCKET_TARGET_G: Record<string, number> = {
  "2g": 2,
  "2,5g": 2.5,
  "5g": 5,
  "1/4oz": OZ_TO_G / 4, // ~7.776 g
  "10g": 10,
  "1/2oz": OZ_TO_G / 2, // ~15.552 g
  "20g": 20,
  "25g": 25,
  "1oz": OZ_TO_G,
  "50g": 50,
  "100g": 100,
  "250g": 250,
  "500g": 500,
  "1kg": 1000,
};
const TOL_G: Record<string, number> = {
  "2g": 0.2,
  "2,5g": 0.2,
  "5g": 0.3,
  "1/4oz": 0.25,
  "10g": 0.4,
  "1/2oz": 0.4,
  "20g": 0.6,
  "25g": 0.6,
  "1oz": 0.6,
  "50g": 1.0,
  "100g": 2.0,
  "250g": 3.0,
  "500g": 5.0,
  "1kg": 8.0,
};

/* ---------- Utils formato ---------- */
const fmtMoney = (v: unknown) =>
  Number.isFinite(Number(v))
    ? new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: "EUR",
      }).format(Number(v))
    : "—";
const fmtPct = (v: unknown) =>
  Number.isFinite(Number(v)) ? `${Number(v).toFixed(2)}%` : "—";

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

/* ---------- Bucket y etiquetas desde gramos ---------- */
function bucketFromWeight(weight_g: unknown): string {
  const w = Number(weight_g);
  if (!Number.isFinite(w) || w <= 0) return "";
  for (const label of BUCKETS_ORDER) {
    const target = BUCKET_TARGET_G[label];
    const tol = TOL_G[label] ?? 0.5;
    if (Math.abs(w - target) <= tol) return label;
  }
  // fallback (gramos redondeados)
  const n = Math.round(w);
  return n === 1000 ? "1kg" : `${n}g`;
}
function weightLabelFromWeight(weight_g: unknown): string {
  // label de UI: respeta "1/4oz", "1/2oz", "2,5g", etc.
  const b = bucketFromWeight(weight_g);
  return b || "—";
}
function weightLabelSlug(label?: string | null): string {
  const s = (label || "").trim();
  if (!s) return "";
  return s.replace(/\//g, "_").replace(/,/g, "_").toLowerCase();
}

function weightLabel(weight_g: unknown) {
  // para títulos/SEO
  const b = bucketFromWeight(weight_g);
  if (!b) return "—";
  // ya viene en el formato deseado (incluye 1/4oz, 1/2oz, etc.)
  return b;
}

function titleName(meta?: SkuDoc["meta"]) {
  if (!meta) return "";
  const form = niceForm(meta.form);
  const metal = niceMetal(meta.metal);
  const brandOrSeries = meta.series || meta.brand || "";
  return `${form} de ${metal}${brandOrSeries ? ` ${brandOrSeries}` : ""}`;
}

/* ---------- Título legible ---------- */
function displayName(meta?: SkuDoc["meta"]) {
  if (!meta) return "";
  const parts = [meta.series, meta.brand].filter(Boolean);
  if (parts.length) return parts.join(" — ");
  return `${niceForm(meta.form)} ${niceMetal(meta.metal)}`;
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

/* ---------- Helpers media (CDN) ---------- */

/**
 * Dada un SKU, comprueba si existen front-600.webp y back-600.webp
 * en el CDN, siguiendo la convención:
 *   media/{SKU}/front-600.webp
 *   media/{SKU}/back-600.webp
 *
 * Devuelve un array de paths relativos (no URLs absolutas), en orden:
 * front primero (si existe), luego back (si existe).
 */
async function getSkuGalleryImages(sku: string): Promise<string[]> {
  const candidates = [
    `media/${sku}/front-600.webp`,
    `media/${sku}/back-600.webp`,
  ];

  const result: string[] = [];

  // HEAD contra el CDN para ver si existe el fichero
  for (const relPath of candidates) {
    const url = cdnPath(relPath);
    try {
      const res = await fetch(url, {
        method: "HEAD",
        // cacheo razonable: no hace falta comprobar en cada request
        next: { revalidate: 3600, tags: [`media:${sku}`] },
      });
      if (res.ok) {
        result.push(relPath);
      }
    } catch {
      // si falla el fetch, simplemente lo ignoramos
    }
  }

  return result;
}


/* ======================================================================================
   SEO dinámico
====================================================================================== */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const sku = extractSkuFromSlugParam(slug);

  const data = await fetchJsonOrNull<SkuDoc>(`/prices/sku/${sku}.json`, {
    cache: "no-store",
  });
  const meta = data?.meta;
  if (!meta) return { title: sku };

  const name = displayName(meta);
  const weightLbl = meta.weight_label || weightLabelFromWeight(meta.weight_g);
  const weightLblSlug = meta.weight_label_slug || weightLabelSlug(weightLbl);
  const title = `${titleName(meta)} · ${weightLbl}`;

  const prettySlug = productSlug({
    metal: meta.metal,
    form: meta.form,
    weight_g: meta.weight_g,
    weight_label: weightLbl,
    weight_label_slug: weightLblSlug,
    brand: meta.brand ?? null,
    series: meta.series ?? null,
    sku,
  });

  const base = (
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ).replace(/\/+$/, "");
  const canonical = `${base}/producto/${prettySlug}`;

  return {
    title,
    description: `Mejores ofertas, premium y evolución de precio para ${name} (${weightLbl}). Datos actualizados y tiendas verificadas.`,
    alternates: { canonical },
    openGraph: { url: canonical, title, type: "website" },
    twitter: {
      card: "summary_large_image",
      title,
      description: `Mejores ofertas de ${name} (${weightLbl}).`,
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
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const sku = extractSkuFromSlugParam(slug);

  // 1) Datos por SKU
  const data = await fetchJsonOrNull<SkuDoc>(`/prices/sku/${sku}.json`, {
    revalidate: 7200,
    tags: [`sku:${sku}`],
  });
  if (!data?.meta) redirect("/");

  // 2) Slug canónico (redirect si no coincide)
  const weightLbl =
    data.meta.weight_label || weightLabelFromWeight(data.meta.weight_g);
  const weightLblSlug =
    data.meta.weight_label_slug || weightLabelSlug(weightLbl);

  // 2) Slug canónico (redirect si no coincide realmente)
  const canonicalSlug = productSlug({
    metal: data.meta.metal,
    form: data.meta.form,
    weight_g: data.meta.weight_g,
    weight_label: weightLbl,
    weight_label_slug: weightLblSlug,
    brand: data.meta.brand ?? null,
    series: data.meta.series ?? null,
    sku: data.sku, // mantener literal
  });

  const requested = slug.at(-1) || "";

  // Extraemos ambos SKU para comparar solo esa parte
  const requestedSku = requested.split("--").at(-1)?.replaceAll("/", "_");
  const canonicalSku = canonicalSlug.split("--").at(-1)?.replaceAll("/", "_");

  // Redirige solo si difiere la parte previa al SKU (forma/metal/peso), no el SKU
  const requestedPrefix = requested.split("--").at(0);
  const canonicalPrefix = canonicalSlug.split("--").at(0);

  if (
    requestedPrefix !== canonicalPrefix &&
    requestedSku === canonicalSku // el SKU es el mismo (solo / vs _)
  ) {
    redirect(`/producto/${canonicalSlug}`);
  }

  // 3) Histórico
  const history = (await fetchJsonOrNull<HistDoc>(`/history/${sku}.json`, {
    cache: "no-store",
  }).catch(() => ({ sku, series: [] as HistDoc["series"] }))) ?? {
    sku,
    series: [],
  };

  // 4) Dealers
  const dealers =
    (await fetchJsonOrNull<DealersMap>("/meta/dealers.json", {
      revalidate: 86400, // 24 h
      tags: ["dealers"],
    }).catch(() => ({} as DealersMap))) ?? ({} as DealersMap);

  const getDealerLabel = (id: string) => dealers?.[id]?.label || id;
  const isDealerVerified = (id: string) => !!dealers?.[id]?.verified;

  // 5) Ofertas
  const offers = Array.isArray(data?.offers)
    ? data.offers.filter((o) => o?.total_eur != null)
    : [];
  const best =
    [...offers].sort((a, b) => Number(a.total_eur) - Number(b.total_eur))[0] ||
    null;

  // 6) Derivados de la ficha
  const updatedAt = data?.updated_at ? new Date(data.updated_at) : null;
  const updatedStr = updatedAt
    ? updatedAt.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  // 7) Spot GLOBAL (servidor) → prop a la tabla
  const spot = await fetchJsonOrNull<SpotDoc>("meta/spot.json", {
    cache: "no-store",
  });

  /* 8) GALERÍA */

  // Intentamos usar la convención estándar del CDN:
  // media/{SKU}/front-600.webp
  // media/{SKU}/back-600.webp
  const galleryImages = await getSkuGalleryImages(data.sku);

  // Para JSON-LD, si no hay imágenes en el CDN con esa convención,
  // seguimos cayendo al campo images/image del JSON de producto.
  const jsonImagesAbs = (
    galleryImages.length
      ? galleryImages
      : data.images?.length
      ? data.images
      : data.image
      ? [data.image]
      : []
  ).map((p) => cdnPath(p)); // URLs absolutas/proxy para JSON-LD

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16">
      {/* ENCABEZADO */}
      <section className="pt-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              {titleName(data.meta)} · {weightLbl}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Chip>{niceMetal(data.meta.metal)}</Chip>
              <Chip>{niceForm(data.meta.form)}</Chip>
              {weightLbl && <Chip>{weightLbl}</Chip>}
              <span className="text-sm text-zinc-600 ml-1">
                Actualizado: <span className="font-medium">{updatedStr}</span>
                {updatedAt && (
                  <span className="opacity-70">
                    {" "}
                    ({updatedAt.toLocaleDateString("es-ES")})
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-[hsl(var(--brand))] to-transparent" />
      </section>

      {/* BLOQUE SEO */}
      <section
        className="mt-4 rounded-lg pl-4 pr-3 py-3"
        style={{
          borderLeft: "4px solid hsl(var(--brand))",
          background: "hsl(var(--brand) / 0.05)",
        }}
      >
        <h2 className="text-lg md:text-xl font-semibold text-zinc-900">
          Mejor precio y premium frente al <em>spot</em>
        </h2>
        <p className="mt-1 text-sm text-zinc-700">
          Esta ficha muestra <strong>mejor oferta</strong>, histórico diario y
          todas las ofertas disponibles para este SKU en tiendas verificadas.
          Calculamos el <strong>premium</strong> sobre el valor intrínseco (€/g y
          €/oz) para comparar de forma homogénea.
        </p>
      </section>

      {/* GRID: izquierda (Mejor oferta + Histórico) / derecha (Galería) */}
      <section className="mt-4 grid gap-6 md:grid-cols-[1fr_360px] items-start">
        {/* Izquierda */}
        <div className="space-y-6">
          {/* Mejor oferta */}
          <div className="relative overflow-hidden rounded-2xl border border-zinc-200/70 bg-white shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
            <div className="absolute inset-x-0 top-0 h-1 bg-[hsl(var(--brand)/0.9)]" />
            <div className="px-4 py-3 border-b text-sm font-semibold text-zinc-900">
              Mejor oferta
            </div>

            {best ? (
              (() => {
                // Spot €/g según metal
                const spotPerGram =
                  data.meta.metal.toLowerCase() === "plata" ||
                  data.meta.metal.toLowerCase() === "silver"
                    ? spot?.silver_eur_per_g ?? 0
                    : spot?.gold_eur_per_g ?? 0;

                const weightG = Number(data.meta.weight_g ?? 0);

                // Precio del producto SIN envío (si price_eur no viene, lo derivamos)
                const productPrice = Number.isFinite(Number(best.price_eur))
                  ? Number(best.price_eur)
                  : Number.isFinite(Number(best.total_eur))
                  ? Number(best.total_eur) - Number(best.shipping_eur ?? 0)
                  : null;

                // Intrínseco y métricas
                const intrinsicValue = spotPerGram * weightG; // €/g * g
                const pricePerG =
                  productPrice != null && weightG > 0
                    ? productPrice / weightG
                    : null;

                // Premium (sin envío)
                const computedPremiumPct =
                  intrinsicValue > 0 && productPrice != null
                    ? ((productPrice - intrinsicValue) / intrinsicValue) * 100
                    : null;

                const premiumToShow =
                  best.premium_pct ?? computedPremiumPct ?? null;

                return (
                  <>
                    <div className="p-4 md:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                      {/* Total grande */}
                      <div className="shrink-0">
                        <div className="text-[22px] md:text-2xl font-extrabold leading-none text-zinc-900">
                          {fmtMoney(best.total_eur)}
                        </div>
                      </div>

                      {/* Datos clave */}
                      <div className="flex-1 grid sm:grid-cols-3 gap-3 text-sm text-zinc-700">
                        <div>
                          <div className="text-zinc-500">Tienda</div>
                          <div className="font-medium flex items-center gap-1">
                            {getDealerLabel(best.dealer_id)}
                            {isDealerVerified(best.dealer_id) && (
                              <VerifiedBadge
                                size={18}
                                className="translate-y-[1px]"
                              />
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="text-zinc-500">Precio</div>
                          <div className="font-medium">
                            {fmtMoney(productPrice)}
                          </div>
                        </div>

                        <div>
                          <div className="text-zinc-500">Premium</div>
                          <div className="font-medium">
                            {fmtPct(premiumToShow)}
                          </div>
                        </div>

                        <div>
                          <div className="text-zinc-500">€/g</div>
                          <div className="font-medium tabular-nums">
                            {pricePerG != null && Number.isFinite(pricePerG)
                              ? `${pricePerG.toFixed(2)} €/g`
                              : "—"}
                          </div>
                        </div>
                      </div>

                      {/* CTA */}
                      {best.buy_url && (
                        <a
                          href={best.buy_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-1 rounded-lg px-4 py-2 text-sm font-medium
                         bg-[hsl(var(--brand))] text-white hover:opacity-90 focus-visible:ring-2
                         focus-visible:ring-[hsl(var(--brand)/0.35)] w-full sm:w-auto"
                          aria-label={`Comprar en ${getDealerLabel(
                            best.dealer_id
                          )}`}
                        >
                          Comprar
                          <svg
                            viewBox="0 0 24 24"
                            className="h-4 w-4"
                            aria-hidden
                          >
                            <path
                              fill="currentColor"
                              d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3ZM5 5h6v2H7v10h10v-4h2v6H5V5Z"
                            />
                          </svg>
                        </a>
                      )}
                    </div>

                    {/* Nota de envío */}
                    <div className="px-4 pb-4 -mt-2 text-xs text-zinc-600">
                      Nota: el envío se confirma en la tienda.
                    </div>
                  </>
                );
              })()
            ) : (
              <div className="p-4 text-sm text-zinc-600">
                No hay ofertas activas ahora mismo.
              </div>
            )}
          </div>

          {/* Histórico */}
          <div className="relative overflow-hidden rounded-2xl border border-zinc-200/70 bg-white shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
            <div className="absolute inset-x-0 top-0 h-1 bg-[hsl(var(--brand)/0.9)]" />
            <div className="p-3 md:p-4">
              <h2 className="text-base md:text-lg font-semibold mb-2">
                Histórico (mejor precio diario)
              </h2>
              <PriceChart data={history?.series ?? []} />
            </div>
          </div>
        </div>

        {/* Derecha: Galería */}
        <div className="md:pl-0 self-center md:self-start md:sticky md:top-24">
          {galleryImages.length > 0 && (
            <div className="relative overflow-hidden rounded-2xl border border-zinc-200/70 bg-white shadow-[0_12px_30px_rgba(0,0,0,0.06)] p-3">
              <div className="absolute inset-x-0 top-0 h-1 bg-[hsl(var(--brand)/0.9)]" />
              <ProductGallery
                images={galleryImages}
                altBase={displayName(data.meta) || data.sku}
                className="max-w-[360px] mx-auto"
              />
            </div>
          )}
        </div>
      </section>

      {/* Tabla de ofertas */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">
          Todas las ofertas para este SKU
        </h2>
        <p className="text-sm text-zinc-600 mt-1">
          Ordenadas por <em>precio €/g más barato</em>. La primera fila
          coincide con la mejor oferta.
        </p>

        <div className="mt-3">
          <SkuOffersTable
            offers={offers}
            dealers={dealers}
            pageSizeDefault={10}
            spotInitial={spot}
            metal={data.meta.metal}
            weight_g={data.meta.weight_g}
          />
        </div>
      </section>

      {/* JSON-LD */}
      {(() => {
        const base = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(
          /\/+$/,
          ""
        );
        const canonicalSlug = productSlug({
          metal: data.meta.metal,
          form: data.meta.form,
          weight_g: data.meta.weight_g,
          weight_label: weightLbl,
          weight_label_slug: weightLblSlug,
          brand: data.meta.brand ?? null,
          series: data.meta.series ?? null,
          sku: data.sku,
        });
        const productUrl = base
          ? `${base}/producto/${canonicalSlug}`
          : undefined;
        const jsonLd: Record<string, any> = {
          "@context": "https://schema.org",
          "@type": "Product",
          name: `${titleName(data.meta)} · ${weightLbl}`,
          sku: data.sku,
          brand: data.meta.brand
            ? { "@type": "Brand", name: data.meta.brand }
            : undefined,
          category: `${data.meta.metal}/${data.meta.form}`,
          url: productUrl,
          ...(jsonImagesAbs.length ? { image: jsonImagesAbs } : {}),
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
