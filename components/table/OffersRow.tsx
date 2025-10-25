// components/table/OffersRow.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { productSlug } from "@/lib/slug";

/** ⚠️ Copia mínima del tipo que usas en AllIndexTable */
export type Offer = {
  sku: string;
  dealer_id: string;
  metal: string;
  form: string;
  weight_g: number;
  brand?: string | null;
  series?: string | null;
  display_name?: string | null;
  price_eur: number | null;
  shipping_eur?: number | null;
  total_eur?: number | null;
  premium_pct?: number | null;
  premium_ex_ship_pct?: number | null;
  buy_url?: string | null;
  updated_at?: string | null;
};

/* ---------- Helpers locales (ligeros) ---------- */
const niceMetal: Record<string, string> = { gold: "Oro", silver: "Plata", platinum: "Platino", palladium: "Paladio" };
const niceForm: Record<string, string> = { bar: "Lingote", coin: "Moneda" };

const OZ_TO_G = 31.1034768;

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
  "1/4oz": OZ_TO_G / 4,   // ~7.776 g
  "10g": 10,
  "1/2oz": OZ_TO_G / 2,   // ~15.552 g
  "20g": 20,
  "25g": 25,
  "1oz": OZ_TO_G,         // ~31.103 g
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

export const bucketFromWeight = (weight_g: unknown): string => {
  const w = Number(weight_g);
  if (!Number.isFinite(w) || w <= 0) return "—";
  for (const label of BUCKETS_ORDER) {
    const target = BUCKET_TARGET_G[label];
    const tol = TOL_G[label] ?? 0.5;
    if (Math.abs(w - target) <= tol) return label;
  }
  return `${Math.round(w)}g`;
};

// Convierte etiqueta humana -> parte de slug
//  - "1/2oz" -> "1_2oz"
//  - "1/4oz" -> "1_4oz"
//  - "2,5g"  -> "2_5g"
const toBucketSlug = (label: string): string =>
  label.replace(/\//g, "_").replace(/,/g, "_").toLowerCase();

// Normaliza SKU para URL: "/" -> "_" y "oz" -> "OZ"
const toSkuUrl = (sku: string): string =>
  (sku || "").replace(/\//g, "_").replace(/oz/gi, "OZ");

const tailFromSku = (sku: string) => {
  const parts = (sku || "").split("-");
  return parts.length > 2 ? parts.slice(2).join(" ") : "";
};
const toTitle = (s: string) =>
  s.toLowerCase().replace(/[_\-]+/g, " ").replace(/\b([a-z])/g, (m) => m.toUpperCase());

function displayName(o: Offer): string {
  if (o.display_name) return o.display_name;
  const brand = (o.brand || "").trim();
  const series = (o.series || "").trim();
  if (series) return brand ? `${series} — ${brand}` : series;
  if (o.form === "coin") {
    const tail = toTitle(tailFromSku(o.sku));
    if (tail && brand) return `${tail} — ${brand}`;
    if (tail) return tail;
    if (brand) return brand;
    return "Moneda";
  }
  if (brand) return brand;
  const tail = toTitle(tailFromSku(o.sku));
  return tail || "Lingote";
}

const fmtMoney = (v: unknown) =>
  Number.isFinite(Number(v))
    ? new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(Number(v))
    : "—";
const fmtPct = (v: unknown) => (Number.isFinite(Number(v)) ? `${Number(v).toFixed(2)}%` : "—");

function premiumClass(pct: unknown) {
  const v = Number(pct);
  if (!Number.isFinite(v)) return "text-zinc-700";
  if (v <= 5) return "text-emerald-600";
  if (v <= 10) return "text-amber-600";
  return "text-rose-600";
}

/* ---------- Componente ---------- */
export default function OffersRow({
  offer,
  idx,
  page,
  dealerLabel,
  premiumPct,
}: {
  offer: Offer;
  idx: number;
  page: number;
  dealerLabel: string;
  premiumPct: number | null | undefined;
}) {
  const o = offer;
  const pathname = usePathname();
  const isDealerPage =
    !!pathname &&
    (pathname.startsWith(`/tienda/${o.dealer_id}`) || pathname.startsWith(`/tiendas/${o.dealer_id}`));

  // 🆕 Etiquetas de tamaño para URL y SKU
  const bucketLabel = bucketFromWeight(o.weight_g);     // p.ej. "1/2oz"
  const bucketSlug  = toBucketSlug(bucketLabel);        // p.ej. "1_2oz"
  const skuForUrl   = toSkuUrl(o.sku);                  // p.ej. "AU-1_2OZ-HAFNER"

  return (
    <tr
      className={[
        idx % 2 === 0 ? "bg-white" : "bg-zinc-50/30",
        idx === 0 && page === 1 ? "bg-[hsl(var(--brand)/0.08)]" : "",
        "hover:bg-zinc-50 transition-colors"
      ].join(" ")}
    >
      <td className="td text-center text-zinc-800">{niceMetal[o.metal] ?? o.metal}</td>
      <td className="td text-center text-zinc-800">{niceForm[o.form] ?? o.form}</td>
      <td className="td text-center text-zinc-800">{bucketLabel}</td>

      <td className="td">
        <div className="flex min-w-0 items-center gap-2">
          <span className="font-medium truncate max-w-[460px] text-zinc-900" title={displayName(o)}>
            {displayName(o)}
          </span>
        </div>
      </td>

      <td className="td">
        <div className="flex w-full justify-center">
          <Link
            href={`/producto/${productSlug({
              metal: o.metal,
              form: o.form,
              weight_g: Number(o.weight_g),
              // 🆕 pistas para el helper del slug:
              // - weight_label: humana ("1/2oz") por si quieres mostrarla en la ficha
              // - weight_label_slug: lista para URL ("1_2oz")
              weight_label: bucketLabel,
              weight_label_slug: bucketSlug,
              brand: o.brand ?? null,
              series: o.series ?? null,
              // 🆕 SKU con "_" y "OZ" en mayúsculas
              sku: skuForUrl,
            })}`}
            aria-label={`Ver ficha de ${skuForUrl}`}
            className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs
            border border-[hsl(var(--brand))] text-[hsl(var(--brand))]
            bg-[hsl(var(--brand)/0.12)] hover:bg-[hsl(var(--brand)/0.18)]
            focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand)/0.35)]"
            title="Ver ficha (histórico y mejores ofertas)"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
              <path fill="currentColor" d="M12 5c-5 0-9 4.5-9 7s4 7 9 7 9-4.5 9-7-4-7-9-7Zm0 12c-2.8 0-5-2.24-5-5s2.2-5 5-5 5 2.24 5 5-2.2 5-5 5Zm0-8a3 3 0 1 0 .002 6.002A3 3 0 0 0 12 9Z"/>
            </svg>
            <span>Ver</span>
          </Link>
        </div>
      </td>

      <td className="td text-center whitespace-nowrap tabular-nums font-semibold text-zinc-900">
        {fmtMoney(o.price_eur)}
      </td>

      <td className={`td text-center whitespace-nowrap tabular-nums ${premiumClass(premiumPct)}`}>
        {fmtPct(premiumPct)}
      </td>

      <td className="td text-left">
        {o.buy_url ? (
          <div
            className="flex items-center gap-2 justify-end w-[228px]"
          >
            <a
              href={o.buy_url}
              target="_blank"
              rel="noreferrer"
              aria-label={`Comprar en ${dealerLabel}`}
              title={`Comprar en ${dealerLabel}`}
              className="inline-flex h-9 items-center justify-center gap-1 rounded-lg px-3 text-sm font-medium
                        focus:outline-none btn-brand whitespace-nowrap flex-1"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                <path fill="currentColor" d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3ZM5 5h6v2H7v10h10v-4h2v6H5V5Z"/>
              </svg>
              {dealerLabel}
            </a>

            {!isDealerPage && (
              <Link
                href={`/tiendas/${o.dealer_id}`}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-200
                          bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-800
                          focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand)/0.35)]"
                aria-label={`Ver ficha de la tienda ${dealerLabel}`}
                title="Ficha de tienda"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                  aria-hidden
                >
                  <path d="M3 9l1.5-6h15L21 9" />
                  <path d="M4 9h16v11H4z" />
                  <path d="M9 14v6" />
                  <path d="M15 14v6" />
                  <path d="M9 9V4h6v5" />
                </svg>
              </Link>
            )}
          </div>
        ) : (
          <span className="text-zinc-400">—</span>
        )}
      </td>
    </tr>
  );
}
