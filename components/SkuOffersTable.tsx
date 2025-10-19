// components/SkuOffersTable.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
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
  price_eur: number | null;
  shipping_eur: number | null;
  total_eur: number | null;
  premium_pct?: number | null;
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

export default function SkuOffersTable({
  offers,
  dealers,
  pageSizeDefault = 10,
  spotInitial = null,
}: {
  offers: Offer[];
  dealers: DealersMap;
  pageSizeDefault?: 10 | 25 | 50 | 100 | number;
  spotInitial?: SpotDoc | null;
}) {
  /* -------- Orden/Paginación -------- */
  const [sortKey, setSortKey] = useState<SortKeySku>("total");
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

  const sorted = useMemo(() => {
    const norm = [...offers];

    const num = (v: unknown) =>
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
          va = num(a.price_eur);
          vb = num(b.price_eur);
          break;
        case "shipping":
          va = num(a.shipping_eur);
          vb = num(b.shipping_eur);
          break;
        case "total":
          va = num(a.total_eur);
          vb = num(b.total_eur);
          break;
        case "premium":
          va = num(a.premium_pct);
          vb = num(b.premium_pct);
          break;
        default:
          va = num(a.total_eur);
          vb = num(b.total_eur);
      }

      const base =
        typeof va === "number" && typeof vb === "number"
          ? va - vb
          : String(va).localeCompare(String(vb));
      return sortDir === "asc" ? base : -base;
    });

    return norm;
  }, [offers, dealers, sortKey, sortDir]);

  const totalRows = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const start = (page - 1) * pageSize;
  const end = Math.min(start + pageSize, totalRows);
  const pageRows = sorted.slice(start, end);

  /* -------- Spot (global) -------- */
  // const [spot, setSpot] = useState<SpotDoc | null>(null);
  // const [spotLoading, setSpotLoading] = useState<boolean>(true);

  // useEffect(() => {
  //   const ac = new AbortController();
  //   const url = toAbsolute(cdnPath("meta/spot.json"));

  //   setSpotLoading(true);
  //   fetch(url, { cache: "no-store", signal: ac.signal })
  //     .then((r) => (r.ok ? r.json() : null))
  //     .then((doc: SpotDoc | null) => setSpot(doc))
  //     .catch((err) => {
  //       if (err?.name !== "AbortError") console.error("spot fetch error:", err);
  //       setSpot(null);
  //     })
  //     .finally(() => setSpotLoading(false));

  //   return () => ac.abort();
  // }, []);

  const [spot] = useState<SpotDoc | null>(spotInitial);
  const [spotLoading] = useState<boolean>(!Boolean(spotInitial));
  const goldEurPerG = spot?.gold_eur_per_g ?? null;
  const silverEurPerG = spot?.silver_eur_per_g ?? null;
  const goldEurPerOz = goldEurPerG != null ? goldEurPerG * OZ_TO_G : null;
  const silverEurPerOz = silverEurPerG != null ? silverEurPerG * OZ_TO_G : null;
  const effectiveUpdatedAt = spot?.updated_at ?? null;

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
                label="Envío"
                k="shipping"
                activeKey={sortKey}
                dir={sortDir}
                onSort={onSort}
                align="center"
                w="w-28"
              />
              <SortableThSku
                label="Total"
                k="total"
                activeKey={sortKey}
                dir={sortDir}
                onSort={onSort}
                align="center"
                w="w-32"
              />
              <SortableThSku
                label="Prima"
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
                      {verified ? <VerifiedBadge size={16} className="translate-y-[1px]" /> : null}
                    </Link>
                  </td>
                  <td className="td text-center tabular-nums px-4 py-2.5">
                    {fmtMoney(o.price_eur)}
                  </td>
                  <td className="td text-center tabular-nums px-4 py-2.5">
                    {fmtMoney(o.shipping_eur)}
                  </td>
                  <td className="td text-center tabular-nums font-semibold text-zinc-900 px-4 py-2.5">
                    {fmtMoney(o.total_eur)}
                  </td>
                  <td
                    className={`td text-center tabular-nums px-4 py-2.5 ${premiumClass(
                      o.premium_pct
                    )}`}
                  >
                    {fmtPct(o.premium_pct)}
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
                          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
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
                <td colSpan={7} className="td text-center text-zinc-500 py-8">
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
          Nota: la prima se muestra sin envío. El coste de envío exacto se
          confirma en la tienda.
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
              <option value="total">Total</option>
              <option value="price">Precio</option>
              <option value="shipping">Envío</option>
              <option value="premium">Prima</option>
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
                  {
                    total: "Total",
                    price: "Precio",
                    shipping: "Envío",
                    premium: "Prima",
                    dealer: "Tienda",
                  } as Record<SortKeySku, string>
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
                    {verified && <VerifiedBadge size={16} className="translate-y-[1px]" />}
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
                        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
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
                  <div className="text-zinc-500">Envío</div>
                  <div className="font-medium tabular-nums">
                    {fmtMoney(o.shipping_eur)}
                  </div>
                </div>
                <div>
                  <div className="text-zinc-500">Total</div>
                  <div className="font-semibold tabular-nums text-zinc-900">
                    {fmtMoney(o.total_eur)}
                  </div>
                </div>
                <div>
                  <div className="text-zinc-500">Prima</div>
                  <div
                    className={`font-medium tabular-nums ${premiumClass(
                      o.premium_pct
                    )}`}
                  >
                    {fmtPct(o.premium_pct)}
                  </div>
                </div>
                <div>
                  <div className="text-zinc-500">Extraído</div>
                  <div className="font-medium">
                    {o.scraped_at
                      ? new Date(o.scraped_at).toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
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
          <span className="opacity-80">Nota:</span> la prima se muestra sin
          envío.
        </div>
      </div>
    </>
  );
}
