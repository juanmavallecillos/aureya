// components/AllIndexTable.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useDealerMeta } from "@/lib/useDealerMeta";
import { cdnPath, toAbsolute } from "@/lib/cdn";

// 🆕 componentes desacoplados
import FiltersBarCompact from "@/components/table/FiltersBarCompact";
import FiltersBar from "@/components/table/FiltersBar";
import TopActions from "@/components/table/TopActions";
import InfoBarSpot from "@/components/table/InfoBarSpot";
import PaginationControls from "@/components/table/PaginationControls";
import SortableTh, {
  type SortKey,
  type SortDir,
} from "@/components/table/SortableTh";
import OffersRow from "@/components/table/OffersRow";
import OfferMobileCard from "@/components/table/OfferMobileCard";
import InfoBarSpotCompact from "@/components/table/InfoBarSpotCompact";

// 🆕 util
import { timeAgo } from "@/lib/format";

/* ---------- Tipos ---------- */
type Offer = {
  sku: string;
  dealer_id: string;
  metal: string;
  form: string;
  weight_g: number;
  brand?: string | null;
  series?: string | null;
  display_name?: string | null;
  price_eur: number | null;
  shipping_eur: number | null;
  total_eur: number | null;
  premium_pct?: number | null;
  premium_ex_ship_pct?: number | null;
  buy_url?: string | null;
  updated_at?: string | null;
};
type AllOffersDoc = { updated_at: string; offers: Offer[] };
type ManifestLike = {
  metals?: string[];
  forms?: string[];
  buckets?: string[];
  dealers?: string[];
};
type SpotDoc = {
  gold_eur_per_g?: number;
  silver_eur_per_g?: number;
  updated_at?: string;
};

/* ---------- Const ---------- */
const OZ_TO_G = 31.1034768;

/* ---------- Helpers formato (puedes moverlos a lib/format si quieres) ---------- */
const fmtMoney = (v: unknown) =>
  Number.isFinite(Number(v))
    ? new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: "EUR",
      }).format(Number(v))
    : "—";

// Calcula premium vs spot (€/g) usando los datos de meta/spot.json.
// Si spot aún no está cargado, cae al premium del backend (ex envío si existe).
function premiumFromSpot(o: Offer, spot: SpotDoc | null): number {
  const fallback = o.premium_ex_ship_pct ?? o.premium_pct ?? NaN;
  if (!spot || !o.price_eur || !o.weight_g) return fallback;

  const metal = (o.metal || "").toLowerCase();
  const perG =
    metal === "gold"
      ? spot.gold_eur_per_g
      : metal === "silver"
      ? spot.silver_eur_per_g
      : undefined;

  if (!perG) return fallback;

  // Si quieres incluir IVA para plata, cambia a: const basePerG = metal === "silver" ? perG * 1.21 : perG;
  const basePerG = perG;

  const intrinsic = o.weight_g * basePerG;
  if (!Number.isFinite(intrinsic) || intrinsic <= 0) return fallback;

  return ((Number(o.price_eur) - intrinsic) / intrinsic) * 100;
}

/* ---------- Normalización ---------- */
const toMetalToken = (m?: string) => {
  const x = (m || "").toLowerCase();
  if (x === "oro") return "gold";
  if (x === "plata") return "silver";
  return x;
};
const toFormToken = (f?: string) => {
  const x = (f || "").toLowerCase();
  if (x === "lingote" || x === "lingotes" || x === "bar") return "bar";
  if (x === "moneda" || x === "monedas" || x === "coin") return "coin";
  return x;
};
const niceMetal: Record<string, string> = {
  gold: "Oro",
  silver: "Plata",
  platinum: "Platino",
  palladium: "Paladio",
};
const niceForm: Record<string, string> = { bar: "Lingote", coin: "Moneda" };

function bucketFromWeight(weight_g: unknown) {
  const w = Number(weight_g);
  if (!Number.isFinite(w)) return "—";
  if (Math.abs(w - 31.1035) < 0.05) return "1oz";
  const specials = [1, 2, 2.5, 5, 10, 20, 50, 100, 250, 500, 1000];
  for (const s of specials) if (Math.abs(w - s) < 0.2) return `${s}g`;
  return `${Math.round(w)}g`;
}
const bucketToGrams = (b: string): number => {
  if (!b) return NaN;
  if (b === "1oz") return OZ_TO_G;
  if (b.endsWith("g")) {
    const n = Number(b.replace("g", ""));
    return Number.isFinite(n) ? n : NaN;
  }
  const n = Number(b);
  return Number.isFinite(n) ? n : NaN;
};

/* ---------- Nombre a mostrar (Marca/Serie) ---------- */
const tailFromSku = (sku: string) => {
  const parts = (sku || "").split("-");
  return parts.length > 2 ? parts.slice(2).join(" ") : "";
};
const toTitle = (s: string) =>
  s
    .toLowerCase()
    .replace(/[_\-]+/g, " ")
    .replace(/\b([a-z])/g, (m) => m.toUpperCase());

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

/* ---------- Orden ---------- */
const nextDir = (d?: SortDir): SortDir => (d === "asc" ? "desc" : "asc");
const sortLabel = (key: SortKey, dir: SortDir) =>
  (key === "premium" ? "prem" : key) + (dir === "asc" ? "Asc" : "Desc");

/* ---------- Colores premium ---------- */
function premiumClass(pct: unknown) {
  const v = Number(pct);
  if (!Number.isFinite(v)) return "text-zinc-700";
  if (v <= 5) return "text-emerald-600";
  if (v <= 10) return "text-amber-600";
  return "text-rose-600";
}

/* ---------- Main ---------- */
type AllIndexProps = {
  manifest?: ManifestLike;
  forceDealer?: string;
  hideDealerFacet?: boolean;
  forceMetal?: "gold" | "silver";
  hideMetalFacet?: boolean;
  forceForm?: "bar" | "coin";
  hideFormFacet?: boolean;
  forceBuckets?: string[];
  hideBucketFacet?: boolean;
  forceSku?: string;
  dedupeMode?: "key" | "none";
};

export default function AllIndexTable({
  manifest,
  forceDealer,
  hideDealerFacet,
  forceMetal,
  hideMetalFacet,
  forceForm,
  hideFormFacet,
  forceBuckets,
  hideBucketFacet,
  forceSku,
  dedupeMode = "key",
}: AllIndexProps) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [indexUpdatedAt, setIndexUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // SPOT
  const [spot, setSpot] = useState<SpotDoc | null>(null);
  const [spotLoading, setSpotLoading] = useState(true);

  // MULTI: metal, formato, tiendas, tamaños
  const [selMetals, setSelMetals] = useState<Set<string>>(new Set());
  const [selForms, setSelForms] = useState<Set<string>>(new Set());
  const [selDealers, setSelDealers] = useState<Set<string>>(new Set());
  const [selBuckets, setSelBuckets] = useState<Set<string>>(new Set());

  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("price");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Paginación (default 10)
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  const dealerMeta = useDealerMeta();

  /* ---------- Carga índice ---------- */
  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);

    const dedupeByKey = (arr: Offer[]) => {
      const seen = new Set<string>();
      const unique: Offer[] = [];
      for (const o of arr) {
        const idTail = o.buy_url ? o.buy_url : String(o.price_eur ?? "");
        const key = `${o.sku}|${o.dealer_id}|${idTail}`;
        if (seen.has(key)) continue;
        seen.add(key);
        unique.push(o);
      }
      return unique;
    };

    const load = async () => {
      try {
        // --- MODO FICHA (SKU): lee /prices/sku/{SKU}.json ---
        if (forceSku) {
          const url = toAbsolute(cdnPath(`prices/sku/${forceSku}.json`));
          const r = await fetch(url, { cache: "no-store", signal: ac.signal });
          if (!r.ok) throw new Error(`CDN ${r.status}`);

          const doc: {
            updated_at?: string;
            updatedAt?: string;
            offers?: Offer[];
          } = await r.json();
          setIndexUpdatedAt(doc?.updated_at || doc?.updatedAt || null);

          const raw = Array.isArray(doc?.offers) ? doc.offers : [];
          const norm = raw.map((o) => ({
            ...o,
            metal: toMetalToken(o.metal as any),
            form: toFormToken(o.form as any),
          }));

          setOffers(dedupeMode === "none" ? norm : dedupeByKey(norm));
          return;
        }

        // --- MODO ÍNDICE: lee /prices/index/all_offers.json ---
        const url = toAbsolute(cdnPath("prices/index/all_offers.json"));
        const r = await fetch(url, { cache: "no-store", signal: ac.signal });
        if (!r.ok) throw new Error(`CDN ${r.status}`);

        const doc: AllOffersDoc = await r.json();
        setIndexUpdatedAt(doc?.updated_at || null);

        const raw = Array.isArray(doc?.offers) ? doc.offers : [];
        const norm = raw.map((o) => ({
          ...o,
          metal: toMetalToken(o.metal),
          form: toFormToken(o.form),
        }));

        setOffers(dedupeMode === "none" ? norm : dedupeByKey(norm));
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.error("all_offers fetch error:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    load();
    return () => ac.abort();
  }, [forceSku, dedupeMode]);

  /* ---------- Carga spot ---------- */
  useEffect(() => {
    const ac = new AbortController();
    const url = toAbsolute(cdnPath("meta/spot.json"));

    setSpotLoading(true);
    fetch(url, { cache: "no-store", signal: ac.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((doc: SpotDoc | null) => setSpot(doc))
      .catch((err) => {
        if (err?.name !== "AbortError") console.error("spot fetch error:", err);
        setSpot(null);
      })
      .finally(() => setSpotLoading(false));

    return () => ac.abort();
  }, []);

  /* ---------- Derivados spot (€/oz) ---------- */
  const goldEurPerG = spot?.gold_eur_per_g ?? null;
  const silverEurPerG = spot?.silver_eur_per_g ?? null;
  const goldEurPerOz = goldEurPerG != null ? goldEurPerG * OZ_TO_G : null;
  const silverEurPerOz = silverEurPerG != null ? silverEurPerG * OZ_TO_G : null;
  const spotUpdatedAt = spot?.updated_at || null;
  const effectiveUpdatedAt = spotUpdatedAt || indexUpdatedAt || null;

  /* ---------- Opciones de facetas ---------- */
  const metals = useMemo(() => {
    if (manifest?.metals?.length)
      return Array.from(new Set(manifest.metals.map(toMetalToken)));
    return Array.from(
      new Set(offers.map((o) => o.metal).filter(Boolean))
    ).sort();
  }, [offers, manifest]);

  const forms = useMemo(() => {
    const base = manifest?.forms?.length
      ? Array.from(new Set(manifest.forms.map(toFormToken)))
      : Array.from(new Set(offers.map((o) => o.form).filter(Boolean))).sort();
    return forceForm ? base.filter((f) => f === forceForm) : base;
  }, [offers, manifest, forceForm]);

  const allBuckets = useMemo<string[]>(() => {
    const base = manifest?.buckets?.length
      ? [...manifest.buckets]
      : Array.from(new Set(offers.map((o) => bucketFromWeight(o.weight_g))));
    base.sort((a, b) => {
      const ga = bucketToGrams(a);
      const gb = bucketToGrams(b);
      if (Number.isFinite(ga) && Number.isFinite(gb)) return ga - gb;
      if (Number.isFinite(ga)) return -1;
      if (Number.isFinite(gb)) return 1;
      return a.localeCompare(b);
    });
    return base;
  }, [offers, manifest?.buckets]);

  const allDealers = useMemo(() => {
    if (manifest?.dealers?.length) return manifest.dealers;
    return Array.from(
      new Set(offers.map((o) => o.dealer_id).filter(Boolean))
    ).sort();
  }, [offers, manifest]);

  /* ---------- URL <-> estado ---------- */
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const csv = (v: string | null) =>
      new Set((v || "").split(",").filter(Boolean));

    setSelMetals(forceMetal ? new Set([forceMetal]) : csv(sp.get("metal")));
    setSelForms(forceForm ? new Set([forceForm]) : csv(sp.get("form")));
    setSelBuckets(
      forceBuckets?.length ? new Set(forceBuckets) : csv(sp.get("bucket"))
    );
    setQ(sp.get("q") || "");

    if (forceDealer) setSelDealers(new Set([forceDealer]));
    else setSelDealers(csv(sp.get("dealer")));

    const sortParam = (sp.get("sort") as string) || "priceAsc";
    const key: SortKey = sortParam.startsWith("prem")
      ? "premium"
      : sortParam.startsWith("price")
      ? "price"
      : sortParam.startsWith("name")
      ? "name"
      : ["metal", "form", "bucket", "dealer"].some((k) =>
          sortParam.startsWith(k)
        )
      ? (sortParam.replace(/(Asc|Desc)$/, "") as SortKey)
      : "price";
    const dir: SortDir = sortParam.endsWith("Desc") ? "desc" : "asc";
    setSortKey(key);
    setSortDir(dir);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    forceDealer,
    forceMetal,
    forceForm,
    forceBuckets?.join(","),
  ]);

  useEffect(() => {
    const sp = new URLSearchParams();

    if (!forceMetal && selMetals.size)
      sp.set("metal", Array.from(selMetals).join(","));
    if (!forceForm && selForms.size)
      sp.set("form", Array.from(selForms).join(","));
    if (!forceBuckets?.length && selBuckets.size)
      sp.set("bucket", Array.from(selBuckets).join(","));
    if (q) sp.set("q", q);
    if (!forceDealer && selDealers.size)
      sp.set("dealer", Array.from(selDealers).join(","));

    const compatSort = sortLabel(sortKey, sortDir);
    if (compatSort !== "priceAsc") sp.set("sort", compatSort);

    const qs = sp.toString();
    const current = window.location.search.replace(/^\?/, "");
    if (current === qs) return;
    const url = qs ? `?${qs}` : window.location.pathname;
    window.history.replaceState(null, "", url);
  }, [
    selMetals,
    selForms,
    selBuckets,
    selDealers,
    q,
    sortKey,
    sortDir,
    forceDealer,
    forceMetal,
    forceForm,
    forceBuckets,
  ]);

  /* ---------- Filtro + orden ---------- */
  const textPass = (o: Offer) =>
    !q ||
    `${o.sku} ${o.brand ?? ""} ${o.series ?? ""} ${displayName(o)}`
      .toLowerCase()
      .includes(q.toLowerCase());

  const comparator = (a: Offer, b: Offer) => {
    const num = (v: unknown) =>
      Number.isFinite(Number(v)) ? Number(v) : Number.POSITIVE_INFINITY;
    const bucketA = bucketFromWeight(a.weight_g);
    const bucketB = bucketFromWeight(b.weight_g);
    let va: string | number;
    let vb: string | number;
    switch (sortKey) {
      case "name":
        va = displayName(a).toLowerCase();
        vb = displayName(b).toLowerCase();
        break;
      case "metal":
        va = a.metal;
        vb = b.metal;
        break;
      case "form":
        va = a.form;
        vb = b.form;
        break;
      case "bucket": {
        const ga = bucketToGrams(bucketA);
        const gb = bucketToGrams(bucketB);
        va = Number.isFinite(ga) ? ga : Number.POSITIVE_INFINITY;
        vb = Number.isFinite(gb) ? gb : Number.POSITIVE_INFINITY;
        break;
      }
      case "dealer": {
        const la = dealerMeta[a.dealer_id]?.label ?? a.dealer_id;
        const lb = dealerMeta[b.dealer_id]?.label ?? b.dealer_id;
        va = la.toLowerCase();
        vb = lb.toLowerCase();
        break;
      }
      case "price":
        va = num(a.price_eur);
        vb = num(b.price_eur);
        break;
      case "premium": {
        const pa = premiumFromSpot(a, spot);
        const pb = premiumFromSpot(b, spot);
        va = Number.isFinite(pa) ? pa : Number.POSITIVE_INFINITY;
        vb = Number.isFinite(pb) ? pb : Number.POSITIVE_INFINITY;
        break;
      }
      default:
        va = num(a.price_eur);
        vb = num(b.price_eur);
        break;
    }
    const base =
      typeof va === "number" && typeof vb === "number"
        ? va - vb
        : String(va).localeCompare(String(vb));
    return sortDir === "asc" ? base : -base;
  };

  const filtered = useMemo(() => {
    return [...offers]
      .filter((o) => {
        if (!textPass(o)) return false;
        if (selMetals.size && !selMetals.has(o.metal)) return false;
        if (selForms.size && !selForms.has(o.form)) return false;
        const b = bucketFromWeight(o.weight_g);
        if (selBuckets.size && !selBuckets.has(b)) return false;
        if (selDealers.size && !selDealers.has(o.dealer_id)) return false;
        return true;
      })
      .sort(comparator);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    offers,
    selMetals,
    selForms,
    selBuckets,
    selDealers,
    q,
    sortKey,
    sortDir,
    dealerMeta,
    spot,
  ]);

  const filtersSignature = useMemo(() => {
    const s = (set: Set<string>) => Array.from(set).sort().join(",");
    return [
      `m:${s(selMetals)}`,
      `f:${s(selForms)}`,
      `b:${s(selBuckets)}`,
      `d:${s(selDealers)}`,
      `q:${q}`,
      `o:${sortKey}|${sortDir}`,
    ].join("|");
  }, [selMetals, selForms, selBuckets, selDealers, q, sortKey, sortDir]);

  /* ---------- Paginación ---------- */
  const totalRows = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  useEffect(() => {
    if (page !== 1) setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize, filtersSignature]);
  const start = (page - 1) * pageSize;
  const end = Math.min(start + pageSize, totalRows);
  const pageRows = filtered.slice(start, end);

  /* ---------- CONTADORES + AUTO-LIMPIEZA ---------- */
  const metalCounts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const m of metals) {
      let c = 0;
      for (const o of offers) {
        if (!textPass(o)) continue;
        if (o.metal !== m) continue;
        if (selForms.size && !selForms.has(o.form)) continue;
        const b = bucketFromWeight(o.weight_g);
        if (selBuckets.size && !selBuckets.has(b)) continue;
        if (selDealers.size && !selDealers.has(o.dealer_id)) continue;
        c++;
      }
      out[m] = c;
    }
    return out;
  }, [offers, metals, selForms, selBuckets, selDealers, q]);

  const formCounts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const f of forms) {
      let c = 0;
      for (const o of offers) {
        if (!textPass(o)) continue;
        if (o.form !== f) continue;
        if (selMetals.size && !selMetals.has(o.metal)) continue;
        const b = bucketFromWeight(o.weight_g);
        if (selBuckets.size && !selBuckets.has(b)) continue;
        if (selDealers.size && !selDealers.has(o.dealer_id)) continue;
        c++;
      }
      out[f] = c;
    }
    return out;
  }, [offers, forms, selMetals, selBuckets, selDealers, q]);

  const bucketCounts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const b0 of allBuckets) {
      let c = 0;
      for (const o of offers) {
        if (!textPass(o)) continue;
        const b = bucketFromWeight(o.weight_g);
        if (b !== b0) continue;
        if (selMetals.size && !selMetals.has(o.metal)) continue;
        if (selForms.size && !selForms.has(o.form)) continue;
        if (selDealers.size && !selDealers.has(o.dealer_id)) continue;
        c++;
      }
      out[b0] = c;
    }
    return out;
  }, [offers, allBuckets, selMetals, selForms, selDealers, q]);

  const dealerCounts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const d of allDealers) {
      let c = 0;
      for (const o of offers) {
        if (!textPass(o)) continue;
        if (o.dealer_id !== d) continue;
        if (selMetals.size && !selMetals.has(o.metal)) continue;
        if (selForms.size && !selForms.has(o.form)) continue;
        const b = bucketFromWeight(o.weight_g);
        if (selBuckets.size && !selBuckets.has(b)) continue;
        c++;
      }
      out[d] = c;
    }
    return out;
  }, [offers, allDealers, selMetals, selForms, selBuckets, q]);

  useEffect(() => {
    setSelForms((prev) => {
      if (forceForm) {
        if (prev.size === 1 && prev.has(forceForm)) return prev;
        return new Set([forceForm]);
      }
      let changed = false;
      const next = new Set(prev);
      for (const f of Array.from(next)) {
        if ((formCounts[f] ?? 0) === 0) {
          next.delete(f);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    setSelMetals((prev) => {
      if (forceMetal) {
        if (prev.size === 1 && prev.has(forceMetal)) return prev;
        return new Set([forceMetal]);
      }
      let changed = false;
      const next = new Set(prev);
      for (const m of Array.from(next)) {
        if ((metalCounts[m] ?? 0) === 0) {
          next.delete(m);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    setSelBuckets((prev) => {
      if (forceBuckets?.length) {
        const target = new Set(forceBuckets);
        if (
          prev.size === target.size &&
          Array.from(prev).every((x) => target.has(x))
        )
          return prev;
        return target;
      }
      let changed = false;
      const next = new Set(prev);
      for (const b of Array.from(next)) {
        if ((bucketCounts[b] ?? 0) === 0) {
          next.delete(b);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [
    formCounts,
    metalCounts,
    bucketCounts,
    forceMetal,
    forceForm,
    forceBuckets,
  ]);
  useEffect(() => {
    // Si estamos en /tienda/{dealer}, fijamos el filtro y evitamos podas
    if (forceDealer) {
      setSelDealers((prev) => {
        if (prev.size === 1 && prev.has(forceDealer)) return prev;
        return new Set([forceDealer]);
      });
      return;
    }
    // Modo normal: poda dealers sin resultados
    if (forceDealer) { setPage(1); /* junto al setSelDealers(...) */ }
    setSelDealers((prev) => {
      let changed = false;
      const next = new Set(prev);
      for (const d of Array.from(next)) {
        if ((dealerCounts[d] ?? 0) === 0) {
          next.delete(d);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [dealerCounts, forceDealer]);

  /* ---------- Helpers UI ---------- */
  const resetAll = () => {
    setSelMetals(forceMetal ? new Set([forceMetal]) : new Set());
    setSelForms(forceForm ? new Set([forceForm]) : new Set());
    setSelBuckets(forceBuckets?.length ? new Set(forceBuckets) : new Set());
    setSelDealers(forceDealer ? new Set([forceDealer]) : new Set());
    setQ("");
    setSortKey("price");
    setSortDir("asc");
    setPage(1);
  };

  const onSort = (k: SortKey) =>
    k === sortKey
      ? setSortDir(nextDir(sortDir))
      : (setSortKey(k), setSortDir("asc"));

  /* ---------- Render ---------- */
  return (
    <div className="space-y-3">
      <FiltersBarCompact
        // visibility (opcional)
        hideMetalFacet={hideMetalFacet}
        hideFormFacet={hideFormFacet}
        hideBucketFacet={hideBucketFacet}
        hideDealerFacet={hideDealerFacet}
        // data
        metals={metals}
        forms={forms}
        allBuckets={allBuckets}
        allDealers={allDealers}
        // selected
        selMetals={selMetals}
        selForms={selForms}
        selBuckets={selBuckets}
        selDealers={selDealers}
        // setters
        setSelMetals={setSelMetals}
        setSelForms={setSelForms}
        setSelBuckets={setSelBuckets}
        setSelDealers={setSelDealers}
        // counts / labels
        metalCounts={metalCounts}
        formCounts={formCounts}
        bucketCounts={bucketCounts}
        dealerCounts={dealerCounts}
        niceMetal={niceMetal}
        niceForm={niceForm}
        dealerMeta={dealerMeta}
      />

      {/* Tabla (desktop) con acciones y paginación arriba */}
      <div className="hidden md:block card overflow-x-auto">
        {/* 🆕 Top bar: buscador + filas + limpiar */}
        <TopActions q={q} onQ={setQ} onReset={resetAll} />

        {/* 🆕 Info spot */}
        <InfoBarSpot
          spotLoading={spotLoading}
          goldEurPerG={goldEurPerG}
          silverEurPerG={silverEurPerG}
          goldEurPerOz={goldEurPerOz}
          silverEurPerOz={silverEurPerOz}
          effectiveUpdatedAt={effectiveUpdatedAt}
        />

        {/* 🆕 Paginación TOP */}
        {!loading && (
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
        )}

        {loading ? (
          <div className="p-6 text-sm text-zinc-600">Cargando…</div>
        ) : (
          <>
            <table className="table w-full">
              <thead className="thead">
                <tr>
                  <SortableTh
                    label="Metal"
                    k="metal"
                    align="center"
                    w="w-24"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={onSort}
                  />
                  <SortableTh
                    label="Formato"
                    k="form"
                    align="center"
                    w="w-28"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={onSort}
                  />
                  <SortableTh
                    label="Tamaño"
                    k="bucket"
                    align="center"
                    w="w-24"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={onSort}
                  />
                  <SortableTh
                    label="Marca / Serie"
                    k="name"
                    align="left"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={onSort}
                  />
                  <th className="th !text-center w-24">Ficha</th>
                  <SortableTh
                    label="Precio"
                    k="price"
                    align="center"
                    w="w-36"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={onSort}
                  />
                  <SortableTh
                    label="Premium (s/envío)"
                    k="premium"
                    align="center"
                    w="w-28"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={onSort}
                  />
                  <th className="th text-left w-40">Comprar en</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pageRows.map((o, idx) => {
                  const key = `${o.sku}|${o.dealer_id}|${
                    o.buy_url ?? o.price_eur ?? idx
                  }`;
                  const dealerLabel =
                    dealerMeta[o.dealer_id]?.label ?? o.dealer_id;
                  const prem = premiumFromSpot(o, spot);

                  return (
                    <OffersRow
                      key={key}
                      offer={o}
                      idx={idx}
                      page={page}
                      dealerLabel={dealerLabel}
                      premiumPct={Number.isFinite(prem) ? prem : null}
                    />
                  );
                })}
                {!pageRows.length && (
                  <tr>
                    <td
                      colSpan={8}
                      className="td text-center text-zinc-500 py-10"
                    >
                      Sin resultados con los filtros actuales.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* 🆕 Paginación BOTTOM */}
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

            {/* Nota de envío debajo de la tabla */}
            <div className="px-3">
              <div className="px-3 py-2 text-xs text-zinc-600">
                <span className="opacity-80">Nota:</span> Envío no incluido (
                <span className="whitespace-nowrap">≈12 €</span> península).
              </div>
            </div>
          </>
        )}
      </div>

      {/* Cards (mobile) */}
      <div className="md:hidden grid grid-cols-1 gap-3">
        {/* Buscador */}
        <div className="card p-3">
          <div className="relative">
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="absolute left-2 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500 pointer-events-none"
            >
              <path
                fill="currentColor"
                d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16a6.471 6.471 0 0 0 4.23-1.57l.27.28v.79L20 21.5 21.5 20l-6-6Zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14Z"
              />
            </svg>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar marca/serie…"
              className="w-full rounded-lg border pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--brand)/0.35)]"
            />
          </div>
        </div>

        {/* Info bar (mobile) */}
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

        {/* Controles (mobile): ordenar + paginación TOP */}
        {!loading && (
          <div className="card p-3 space-y-2">
            {/* Ordenar */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-zinc-600">Ordenar:</span>
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="cursor-pointer rounded border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand)/0.35)]"
                aria-label="Ordenar por"
              >
                <option value="price">Precio</option>
                <option value="premium">Premium (s/envío)</option>
                <option value="name">Marca / Serie</option>
                <option value="metal">Metal</option>
                <option value="form">Formato</option>
                <option value="bucket">Tamaño</option>
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

            {/* Paginación TOP (mismo componente que desktop) */}
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
        )}

        {/* Encabezado sutil tipo “tabla” */}
        <div className="px-3">
          <div className="rounded-lg bg-zinc-50 text-[11px] text-zinc-600 px-2 py-1.5">
            Tabla de ofertas · orden:{" "}
            <span className="font-medium">
              {
                (
                  {
                    price: "Precio",
                    premium: "Premium",
                    name: "Marca/Serie",
                    metal: "Metal",
                    form: "Formato",
                    bucket: "Tamaño",
                    dealer: "Tienda",
                  } as Record<SortKey, string>
                )[sortKey]
              }
            </span>{" "}
            <span className="opacity-70">
              ({sortDir === "asc" ? "Asc" : "Desc"})
            </span>
          </div>
        </div>

        {loading ? (
          <div className="card p-4 text-sm text-zinc-600">Cargando…</div>
        ) : (
          pageRows.map((o, idx) => {
            const key = `${o.sku}|${o.dealer_id}|${
              o.buy_url ?? o.price_eur ?? idx
            }`;
            const dealerLabel = dealerMeta[o.dealer_id]?.label ?? o.dealer_id;
            const prem = premiumFromSpot(o, spot);

            return (
              <OfferMobileCard
                key={key}
                offer={o}
                idx={idx}
                page={page}
                dealerLabel={dealerLabel}
                premiumPct={Number.isFinite(prem) ? prem : null}
              />
            );
          })
        )}

        {!loading && !pageRows.length && (
          <div className="text-center text-zinc-500">
            Sin resultados con los filtros actuales.
          </div>
        )}

        {/* Paginación BOTTOM (mismo componente que desktop) */}
        {!loading && (
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
        )}

        {/* Nota de envío debajo del listado móvil */}
        {!loading && (
          <div className="px-3 py-2 text-xs text-zinc-600">
            <span className="opacity-80">Nota:</span> Envío no incluido (
            <span className="whitespace-nowrap">≈12 €</span> península).
          </div>
        )}
      </div>
    </div>
  );
}
