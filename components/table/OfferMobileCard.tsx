// components/table/OfferMobileCard.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { productSlug } from "@/lib/slug";

/** Copiamos el tipo mínimo compatible con AllIndexTable */
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

/* ---------- Helpers locales ligeros ---------- */
const niceMetal: Record<string, string> = { gold: "Oro", silver: "Plata", platinum: "Platino", palladium: "Paladio" };
const niceForm: Record<string, string> = { bar: "Lingote", coin: "Moneda" };

const bucketFromWeight = (weight_g: unknown) => {
  const w = Number(weight_g);
  if (!Number.isFinite(w)) return "—";
  if (Math.abs(w - 31.1035) < 0.05) return "1oz";
  const specials = [1, 2, 2.5, 5, 10, 20, 50, 100, 250, 500, 1000];
  for (const s of specials) if (Math.abs(w - s) < 0.2) return `${s}g`;
  return `${Math.round(w)}g`;
};

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
function premiumTone(pct: unknown) {
  const v = Number(pct);
  if (!Number.isFinite(v)) return "bg-zinc-100 text-zinc-700";
  if (v <= 5) return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (v <= 10) return "bg-amber-50 text-amber-700 ring-amber-200";
  return "bg-rose-50 text-rose-700 ring-rose-200";
}

/* ---------- Componente ---------- */
export default function OfferMobileCard({
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
  const isTop = idx === 0 && page === 1;

  const pathname = usePathname();
  const isDealerPage =
    !!pathname &&
    (pathname.startsWith(`/tienda/${o.dealer_id}`) || pathname.startsWith(`/tiendas/${o.dealer_id}`));

  return (
    <div
      className={[
        "rounded-2xl bg-white ring-1 ring-inset ring-zinc-200 shadow-sm p-4",
        "transition-shadow",
        isTop ? "shadow-md ring-[hsl(var(--brand)/0.45)]" : "hover:shadow-md",
      ].join(" ")}
    >
      {/* Meta: metal / formato / tamaño */}
      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
        <span className="rounded-full px-2 py-0.5 bg-zinc-50 ring-1 ring-inset ring-zinc-200 text-zinc-700">
          {niceMetal[o.metal]}
        </span>
        <span className="rounded-full px-2 py-0.5 bg-zinc-50 ring-1 ring-inset ring-zinc-200 text-zinc-700">
          {niceForm[o.form]}
        </span>
        <span className="rounded-full px-2 py-0.5 bg-zinc-50 ring-1 ring-inset ring-zinc-200 text-zinc-700">
          {bucketFromWeight(o.weight_g)}
        </span>
      </div>

      {/* Título */}
      <div className="mt-1.5 font-medium text-zinc-900 leading-snug line-clamp-2">
        {displayName(o)}
      </div>

      {/* Precio + premium + CTA */}
      <div className="mt-2 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="text-lg font-semibold text-zinc-900">{fmtMoney(o.price_eur)}</div>
          <div className="mt-1 inline-flex items-center gap-1">
            <span
              className={[
                "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ring-1 ring-inset",
                premiumTone(premiumPct),
              ].join(" ")}
            >
              Premium {fmtPct(premiumPct)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {o.buy_url ? (
            <a
              href={o.buy_url}
              target="_blank"
              rel="noreferrer"
              aria-label={`Comprar en ${dealerLabel}`}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium
                       bg-[hsl(var(--brand))] text-white hover:opacity-90 focus:outline-none
                       focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand)/0.35)] whitespace-nowrap"
            >
              Comprar
            </a>
          ) : (
            <span className="inline-flex items-center rounded-lg px-3 py-2 text-sm text-zinc-400 ring-1 ring-inset ring-zinc-200">
              Sin enlace
            </span>
          )}

          {/* Botón icono tienda (oculto en la ficha de esa tienda) */}
          {!isDealerPage && (
            <Link
              href={`/tiendas/${o.dealer_id}`}
              className="inline-flex items-center justify-center rounded-md border border-zinc-200 bg-white px-2.5 py-2 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand)/0.35)]"
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
      </div>

      {/* Acciones secundarias y dealer */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <Link
          href={`/producto/${productSlug({
            metal: o.metal,
            form: o.form,
            weight_g: Number(o.weight_g),
            brand: o.brand ?? null,
            series: o.series ?? null,
            sku: o.sku,
          })}`}
          aria-label={`Ver ficha de ${o.sku}`}
          className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs
                     border-[hsl(var(--brand))] text-[hsl(var(--brand))]
                     bg-[hsl(var(--brand)/0.10)] hover:bg-[hsl(var(--brand)/0.16)]
                     focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand)/0.35)]"
          title="Ver ficha (histórico y mejores ofertas)"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden>
            <path fill="currentColor" d="M11 7h2v2h-2V7Zm0 4h2v6h-2v-6Zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Z"/>
          </svg>
          Ficha
        </Link>

        <span className="text-[11px] text-zinc-600 truncate">
          Dealer: <span className="font-medium text-zinc-800">{dealerLabel}</span>
        </span>
      </div>
    </div>
  );
}
