// components/table/OfferMobileCard.tsx
import Link from "next/link";
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

/* ---------- Helpers locales ligeros (sin dependencias externas) ---------- */
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
  const tone = idx === 0 && page === 1 ? "bg-[hsl(var(--brand)/50)]" : "";

  return (
    <div className={`card p-4 ${tone}`}>
      <div className="text-xs text-zinc-600">
        {niceMetal[o.metal]} · {niceForm[o.form]} · {bucketFromWeight(o.weight_g)}
      </div>

      <div className="mt-1 font-medium">{displayName(o)}</div>

      <div className="mt-2 flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">{fmtMoney(o.price_eur)}</div>
          <div className={`text-xs ${premiumClass(premiumPct)}`}>
            Premium {fmtPct(premiumPct)}
          </div>
        </div>

        <a
          href={o.buy_url ?? "#"}
          target="_blank"
          rel="noreferrer"
          aria-label={`Comprar en ${dealerLabel}`}
          className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none btn-brand"
        >
          Comprar
        </a>
      </div>

      <div className="mt-2 flex items-center gap-2">
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
          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full whitespace-nowrap
            border border-[hsl(var(--brand))] text-[hsl(var(--brand))]
            bg-[hsl(var(--brand)/0.10)] hover:bg-[hsl(var(--brand)/0.16)]
            focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand)/0.35)]"
          title="Ver ficha (histórico y mejores ofertas)"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden>
            <path fill="currentColor" d="M11 7h2v2h-2V7Zm0 4h2v6h-2v-6Zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Z"/>
          </svg>
          Ficha
        </Link>
        <span className="text-xs text-zinc-600">Dealer: {dealerLabel}</span>
      </div>
    </div>
  );
}
