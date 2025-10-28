"use client";

import { useMemo, useState } from "react";
import VerifiedBadge from "@/components/VerifiedBadge";
import PaginationControls from "@/components/table/PaginationControls";
import SortableThSku, {
  type SortKeySku,
  type SortDir,
} from "@/components/skuTable/SortableThSku";
import InfoBarSpot from "@/components/table/InfoBarSpot";
import InfoBarSpotCompact from "@/components/table/InfoBarSpotCompact";
import Link from "next/link";

/* ---------- Tipos ---------- */
type Offer = {
  dealer_id: string;
  price_eur: number | null; // producto (sin envío)
  shipping_eur: number | null; // envío
  total_eur: number | null; // producto + envío
  premium_pct?: number | null; // puede venir en JSON; si no, la calculamos
  buy_url?: string | null;
  scraped_at?: string | null;
};

type DealersMap = Record<string, { label: string; verified?: boolean }>;
type SpotDoc = {
  gold_eur_per_g?: number;
  silver_eur_per_g?: number;
  updated_at?: string;
};

/* ---------- Const ---------- */
const OZ_TO_G = 31.1034768;

/* ---------- Utils ---------- */
const isFiniteNum = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);

const toNumOrNull = (v: unknown): number | null => {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const fmtMoney = (v: unknown) =>
  Number.isFinite(Number(v))
    ? new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: "EUR",
      }).format(Number(v))
    : "—";
const fmtPct = (v: unknown) =>
  Number.isFinite(Number(v)) ? `${Number(v).toFixed(2)}%` : "—";
const premiumClass = (v: unknown) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return "text-zinc-700";
  if (n <= 5) return "text-emerald-600";
  if (n <= 10) return "text-amber-600";
  return "text-rose-600";
};

function normMetal(metal: string | undefined) {
  const x = (metal || "").toLowerCase();
  if (x === "oro" || x === "gold") return "gold";
  if (x === "plata" || x === "silver") return "silver";
  return x; // deja pasar otros metales si los hubiera
}

export default function SkuOffersTable({
  offers,
  dealers,
  pageSizeDefault = 10,
  spotInitial = null,
  metal,
  weight_g,
}: {
  offers: Offer[];
  dealers: DealersMap;
  pageSizeDefault?: 10 | 25 | 50 | 100 | number;
  spotInitial?: SpotDoc | null;
  metal: string; // REQUERIDO para calcular prima
  weight_g: number; // REQUERIDO para calcular prima
}) {
  /* -------- Orden/Paginación -------- */
  const [sortKey, setSortKey] = useState<SortKeySku>("per_g");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [pageSize, setPageSize] = useState<number>(pageSizeDefault || 10);
  const [page, setPage] = useState<number>(1);

  const onSort = (k: SortKeySku) => {
    if (k === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir("asc");
    }
    setPage(1);
  };

  const getDealerLabel = (id: string) => dealers?.[id]?.label || id;
  const isDealerVerified = (id: string) => !!dealers?.[id]?.verified;

  /* -------- Spot (global) -------- */
  const spot = spotInitial;
  const goldEurPerG = spot?.gold_eur_per_g ?? null;
  const silverEurPerG = spot?.silver_eur_per_g ?? null;
  const goldEurPerOz = goldEurPerG != null ? goldEurPerG * OZ_TO_G : null;
  const silverEurPerOz = silverEurPerG != null ? silverEurPerG * OZ_TO_G : null;
  const effectiveUpdatedAt = spot?.updated_at ?? null;
  const spotLoading = !Boolean(spotInitial);

  // Elegimos spot €/g según metal normalizado
  const chosenSpotPerG = useMemo(() => {
    const m = normMetal(metal);
    if (m === "silver") return silverEurPerG ?? null;
    // por defecto oro
    return goldEurPerG ?? null;
  }, [metal, goldEurPerG, silverEurPerG]);

  // Valor intrínseco del SKU (€/g * gramos)
  const intrinsicValue = useMemo(() => {
    const w = Number(weight_g);
    const s = Number(chosenSpotPerG);
    if (!Number.isFinite(w) || w <= 0 || !Number.isFinite(s) || s <= 0)
      return null;
    return s * w;
  }, [weight_g, chosenSpotPerG]);

  // Mapeamos ofertas con "prima efectiva": la del JSON si viene, y si no, la calculada sin envío (price_eur)
  const offersWithPremium = useMemo(() => {
    return offers.map((o) => {
      const price_eur = toNumOrNull(o.price_eur);
      const total_eur = toNumOrNull(o.total_eur);
      const shipping_eur = toNumOrNull(o.shipping_eur);

      // Derivar precio de producto SIN envío
      const derivedPrice =
        price_eur ??
        (total_eur != null
          ? shipping_eur != null
            ? total_eur - shipping_eur
            : total_eur
          : null);

      // Prima del JSON solo si es realmente un número (no null/undefined)
      const jsonPremium = o.premium_pct;
      const hasJsonPremium = isFiniteNum(jsonPremium as number);

      // Cálculo de prima frente a valor intrínseco (spot €/g * gramos), SIN envío
      let computed: number | null = null;
      if (
        intrinsicValue != null &&
        intrinsicValue > 0 &&
        derivedPrice != null
      ) {
        computed = ((derivedPrice - intrinsicValue) / intrinsicValue) * 100;
      }

      const effectivePremium = hasJsonPremium
        ? (jsonPremium as number)
        : computed;

      // Precio por gramo (€/g) usando precio de producto sin envío
      const per_g =
        Number.isFinite(Number(weight_g)) && Number(weight_g) > 0 &&
        derivedPrice != null
          ? derivedPrice / Number(weight_g)
          : null;

      // Diferencia absoluta vs spot (€) usando precio sin envío
      const diff =
        intrinsicValue != null && derivedPrice != null
          ? derivedPrice - intrinsicValue
          : null;

      return {
        ...o,
        price_effective: derivedPrice,
        premium_computed: computed,
        premium_effective: effectivePremium,
        per_g,
        diff,
      };
    });
  }, [offers, intrinsicValue]);

  const sorted = useMemo(() => {
    const norm = [...offersWithPremium];

    const numAsc = (v: unknown) =>
      Number.isFinite(Number(v)) ? Number(v) : Number.POSITIVE_INFINITY;
    const str = (v: unknown) => String(v ?? "").toLowerCase();

    norm.sort((a, b) => {
      let va: number | string;
      let vb: number | string;

      switch (sortKey) {
        case "dealer":
          va = str(getDealerLabel(a.dealer_id));
          vb = str(getDealerLabel(b.dealer_id));
          break;
        case "price":
          va = numAsc(a.price_eur);
          vb = numAsc(b.price_eur);
          break;
        case "per_g":
          va = numAsc((a as any).per_g);
          vb = numAsc((b as any).per_g);
          break;
        case "diff":
          va = numAsc((a as any).diff);
          vb = numAsc((b as any).diff);
          break;
        case "premium":
          va = numAsc((a as any).premium_effective);
          vb = numAsc((b as any).premium_effective);
          break;
        default:
          va = numAsc(a.price_eur);
          vb = numAsc(b.price_eur);
      }

      const base =
        typeof va === "number" && typeof vb === "number"
          ? va - vb
          : String(va).localeCompare(String(vb));
      return sortDir === "asc" ? base : -base;
    });

    return norm;
  }, [offersWithPremium, dealers, sortKey, sortDir]);

  const totalRows = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const start = (page - 1) * pageSize;
  const end = Math.min(start + pageSize, totalRows);
  const pageRows = sorted.slice(start, end);

  /* --------------------------------- RENDER --------------------------------- */
  return (
    <>
      {/* DESKTOP */}
      <div className="hidden md:block card overflow-x-auto">
        <InfoBarSpot
          spotLoading={spotLoading}
          goldEurPerG={goldEurPerG}
          silverEurPerG={silverEurPerG}
          goldEurPerOz={goldEurPerOz}
          silverEurPerOz={silverEurPerOz}
          effectiveUpdatedAt={effectiveUpdatedAt}
        />

        <div className="px-3">
          <PaginationControls
            page={page}
            pageCount={totalPages}
            pageSize={pageSize as 10 | 25 | 50 | 100}
            onPageChange={setPage}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setPage(1);
            }}
            total={totalRows}
            start={start}
            end={end}
          />
        </div>

        <table className="table w-full min-w-[860px]">
          <thead className="thead">
            <tr>
              <SortableThSku
                label="Tienda"
                k="dealer"
                activeKey={sortKey}
                dir={sortDir}
                onSort={onSort}
                align="left"
                w="w-52"
              />
              <SortableThSku
                label="Precio"
                k="price"
                activeKey={sortKey}
                dir={sortDir}
                onSort={onSort}
                align="center"
                w="w-28"
              />
              <SortableThSku
                label="Dif. vs spot"
                k="diff"
                activeKey={sortKey}
                dir={sortDir}
                onSort={onSort}
                align="center"
                w="w-32"
              />
              <SortableThSku
                label="€/g"
                k="per_g"
                activeKey={sortKey}
                dir={sortDir}
                onSort={onSort}
                align="center"
                w="w-24"
              />
              <SortableThSku
                label="Premium"
                k="premium"
                activeKey={sortKey}
                dir={sortDir}
                onSort={onSort}
                align="center"
                w="w-32"
              />
              <th className="th text-left w-40">Comprar</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {pageRows.map((o, idx) => {
              const dealerLabel = getDealerLabel(o.dealer_id);
              const verified = isDealerVerified(o.dealer_id);
              const rowKey = `${o.dealer_id}|${o.buy_url ?? ""}|${
                o.total_eur ?? ""
              }|${o.scraped_at ?? ""}|${idx}`;

              const premiumToShow = (o as any).premium_effective as
                | number
                | null;

              return (
                <tr
                  key={rowKey}
                  className={[
                    idx % 2 === 0 ? "bg-white" : "bg-zinc-50/40",
                    idx === 0 && start === 0
                      ? "bg-[hsl(var(--brand)/0.08)]"
                      : "",
                    "hover:bg-zinc-50 transition-colors",
                  ].join(" ")}
                >
                  <td className="td px-4 py-2.5">
                    <Link
                      href={`/tiendas/${o.dealer_id}`}
                      className="inline-flex items-center gap-1.5 hover:underline decoration-[hsl(var(--brand))] underline-offset-2"
                      aria-label={`Ver ficha de ${dealerLabel}`}
                      title={`Ficha de ${dealerLabel}`}
                    >
                      <span className="font-medium">{dealerLabel}</span>
                      {verified ? (
                        <VerifiedBadge
                          size={16}
                          className="translate-y-[1px]"
                        />
                      ) : null}
                    </Link>
                  </td>
                  <td className="td text-center tabular-nums px-4 py-2.5">
                    {fmtMoney(o.price_eur)}
                  </td>
                  <td className="td text-center tabular-nums px-4 py-2.5">
                    {fmtMoney((o as any).diff)}
                  </td>
                  <td className="td text-center tabular-nums px-4 py-2.5">
                    {fmtMoney((o as any).per_g)}
                  </td>
                  <td
                    className={`td text-center tabular-nums px-4 py-2.5 ${premiumClass(
                      premiumToShow
                    )}`}
                  >
                    {fmtPct(premiumToShow)}
                  </td>
                  <td className="td text-left px-4 py-2.5">
                    {o.buy_url ? (
                      <div className="flex items-center gap-2">
                        {/* Botón principal: Comprar (texto negro) */}
                        <a
                          href={o.buy_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-9 items-center justify-center gap-1 rounded-lg px-3 text-sm font-medium btn-brand !text-black"
                          aria-label={`Comprar en ${dealerLabel}`}
                          title={`Comprar en ${dealerLabel}`}
                        >
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
                          Comprar
                        </a>

                        {/* Botón icono tienda → Ficha de tienda */}
                        <a
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
                        </a>
                      </div>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}

            {!pageRows.length && (
              <tr>
                <td colSpan={6} className="td text-center text-zinc-500 py-8">
                  No hay ofertas disponibles para este SKU.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="border-t bg-white px-3">
          <PaginationControls
            page={page}
            pageCount={totalPages}
            pageSize={pageSize as 10 | 25 | 50 | 100}
            onPageChange={setPage}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setPage(1);
            }}
            total={totalRows}
            start={start}
            end={end}
          />
        </div>

        <div className="px-3 py-2 text-xs text-zinc-600">
          Nota: el premium se muestra <strong>sin envío</strong>. El coste de
          envío exacto se confirma en la tienda.
        </div>
      </div>

      {/* MÓVIL */}
      <div className="md:hidden space-y-3">
        {/* Card SOLO Spot */}
        <div className="card p-3">
          <InfoBarSpotCompact
            spotLoading={spotLoading}
            goldEurPerG={goldEurPerG}
            silverEurPerG={silverEurPerG}
            goldEurPerOz={goldEurPerOz}
            silverEurPerOz={silverEurPerOz}
            effectiveUpdatedAt={effectiveUpdatedAt}
          />
        </div>

        {/* Card controles/paginación TOP */}
        <div className="card p-3 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-zinc-600">Ordenar:</span>

            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKeySku)}
              className="cursor-pointer rounded border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand)/0.35)]"
              aria-label="Ordenar por"
            >
              <option value="per_g">€/g</option>
              <option value="diff">Dif. vs spot</option>
              <option value="price">Precio</option>
              <option value="premium">Premium</option>
              <option value="dealer">Tienda</option>
            </select>

            <button
              onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
              className="cursor-pointer inline-flex items-center gap-1 rounded border px-2 py-1 text-sm hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand)/0.35)]"
              aria-label={`Cambiar dirección (${
                sortDir === "asc" ? "ascendente" : "descendente"
              })`}
              title={sortDir === "asc" ? "Ascendente" : "Descendente"}
            >
              {sortDir === "asc" ? "▲" : "▼"}
              <span className="text-xs text-zinc-600">
                {sortDir === "asc" ? "Asc" : "Desc"}
              </span>
            </button>

            <div className="ml-auto text-xs text-zinc-600">
              {totalRows
                ? `${start + 1}–${end} de ${totalRows}`
                : "0 resultados"}
            </div>
          </div>

          <PaginationControls
            page={page}
            pageCount={totalPages}
            pageSize={pageSize as 10 | 25 | 50 | 100}
            onPageChange={setPage}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setPage(1);
            }}
            total={totalRows}
            start={start}
            end={end}
          />
        </div>

        {/* Encabezado sutil tipo “tabla” */}
        <div className="px-3">
          <div className="rounded-lg bg-zinc-50 text-[11px] text-zinc-600 px-2 py-1.5">
            Tabla de ofertas · orden:{" "}
            <span className="font-medium">
              {
                (
                  ({
                    per_g: "€/g",
                    diff: "Dif. vs spot",
                    price: "Precio",
                    premium: "Premium",
                    dealer: "Tienda",
                  } as Record<SortKeySku, string>)
                )[sortKey]
              }
            </span>{" "}
            <span className="opacity-70">
              ({sortDir === "asc" ? "Asc" : "Desc"})
            </span>
          </div>
        </div>

        {/* Cards de ofertas */}
        {pageRows.map((o, idx) => {
          const dealerLabel = getDealerLabel(o.dealer_id);
          const verified = isDealerVerified(o.dealer_id);
          const key = `${o.dealer_id}|${o.buy_url ?? ""}|${o.total_eur ?? ""}|${
            o.scraped_at ?? ""
          }|${idx}`;
          const tone =
            idx === 0 && start === 0 ? "bg-[hsl(var(--brand)/0.06)]" : "";

          const premiumToShow = (o as any).premium_effective as number | null;

          return (
            <div key={key} className={`card p-4 ${tone}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-zinc-600">Tienda</div>
                  <div className="font-medium flex items-center gap-1">
                    <Link
                      href={`/tiendas/${o.dealer_id}`}
                      className="hover:underline decoration-[hsl(var(--brand))] underline-offset-2"
                      aria-label={`Ver ficha de ${dealerLabel}`}
                      title={`Ficha de ${dealerLabel}`}
                    >
                      {dealerLabel}
                    </Link>
                    {verified && (
                      <VerifiedBadge size={16} className="translate-y-[1px]" />
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {o.buy_url ? (
                    <>
                      <a
                        href={o.buy_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-9 items-center justify-center gap-1 rounded-lg px-3 text-sm font-medium btn-brand !text-black"
                        aria-label={`Comprar en ${dealerLabel}`}
                        title={`Comprar en ${dealerLabel}`}
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

                      <a
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
                      </a>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-zinc-500">Precio</div>
                  <div className="font-medium tabular-nums">
                    {fmtMoney(o.price_eur)}
                  </div>
                </div>
                <div>
                  <div className="text-zinc-500">€/g</div>
                  <div className="font-medium tabular-nums">
                    {fmtMoney((o as any).per_g)}
                  </div>
                </div>
                <div>
                  <div className="text-zinc-500">Dif. vs spot</div>
                  <div className="font-medium tabular-nums">
                    {fmtMoney((o as any).diff)}
                  </div>
                </div>
                <div>
                  <div className="text-zinc-500">Premium</div>
                  <div
                    className={`font-medium tabular-nums ${premiumClass(
                      premiumToShow
                    )}`}
                  >
                    {fmtPct(premiumToShow)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {!pageRows.length && (
          <div className="text-center text-zinc-500 px-3 py-8">
            No hay ofertas disponibles para este SKU.
          </div>
        )}

        {/* Paginación BOTTOM */}
        <div className="px-3">
          <PaginationControls
            page={page}
            pageCount={totalPages}
            pageSize={pageSize as 10 | 25 | 50 | 100}
            onPageChange={setPage}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setPage(1);
            }}
            total={totalRows}
            start={start}
            end={end}
          />
        </div>

        <div className="px-3 pb-2 text-xs text-zinc-600">
          <span className="opacity-80">Nota:</span> el premium se muestra{" "}
          <strong>sin envío</strong>.
        </div>
      </div>
    </>
  );
}
