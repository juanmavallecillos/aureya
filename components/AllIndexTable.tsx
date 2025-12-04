"use client";

import { useEffect, useMemo, useState } from "react";
import type { DealerMeta } from "@/lib/useDealerMeta";

import FiltersBarCompact from "@/components/table/FiltersBarCompact";
import TopActions from "@/components/table/TopActions";
import InfoBarSpot from "@/components/table/InfoBarSpot";
import PaginationControls from "@/components/table/PaginationControls";
import SortableTh, { type SortKey, type SortDir } from "@/components/table/SortableTh";
import OffersRow from "@/components/table/OffersRow";
import OfferMobileCard from "@/components/table/OfferMobileCard";
import InfoBarSpotCompact from "@/components/table/InfoBarSpotCompact";

/* ---------- Tipos ---------- */
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
  shipping_eur: number | null;
  total_eur: number | null;
  premium_pct?: number | null;
  premium_ex_ship_pct?: number | null;
  buy_url?: string | null;
  updated_at?: string | null;
  // puede venir del backend/scraper
  bucket_label?: string | null;
};
type AllOffersDoc = { updated_at: string; offers: Offer[] };

type ManifestLike = {
  metals?: string[];
  forms?: string[];
  buckets?: string[];
  dealers?: string[];
};
export type SpotDoc = {
  gold_eur_per_g?: number;
  silver_eur_per_g?: number;
  updated_at?: string;
};

/* ---------- Const ---------- */
const OZ_TO_G = 31.1034768;

// Lista fija tal cual quieres mostrarla
const FIXED_BUCKETS = [
  "1g",
  "1/20oz",
  "2g",
  "2,5g",
  "3g",
  "1/10oz",
  "5g",
  "1/4oz",
  "7,98g",
  "8g",
  "10g",
  "15g",
  "1/2oz",
  "20g",
  "25g",
  "30g",
  "1oz",
  "50g",
  "100g",
  "250g",
  "500g",
  "1kg",
] as const;
type FixedBucket = (typeof FIXED_BUCKETS)[number];

const BUCKET_TARGET_G: Record<FixedBucket, number> = {
  "1g": 1,
  "1/20oz": OZ_TO_G / 20,
  "2g": 2,
  "2,5g": 2.5,
  "3g": 3,
  "1/10oz": OZ_TO_G / 10,
  "5g": 5,
  "1/4oz": OZ_TO_G / 4,
  "7,98g": 7.98,
  "8g": 8,
  "10g": 10,
  "15g": 15,
  "1/2oz": OZ_TO_G / 2,
  "20g": 20,
  "25g": 25,
  "30g": 30,
  "1oz": OZ_TO_G,
  "50g": 50,
  "100g": 100,
  "250g": 250,
  "500g": 500,
  "1kg": 1000,
};
const TOL_G: Record<FixedBucket, number> = {
  "1g": 0.01,
  "1/20oz": 0.01,
  "2g": 0.01,
  "2,5g": 0.01,
  "3g": 0.01,
  "1/10oz": 0.01,
  "5g": 0.01,
  "1/4oz": 0.01,
  "7,98g": 0.01,
  "8g": 0.01,
  "10g": 0.01,
  "15g": 0.01,
  "1/2oz": 0.01,
  "20g": 0.01,
  "25g": 0.01,
  "30g": 0.01,
  "1oz": 0.01,
  "50g": 0.01,
  "100g": 0.01,
  "250g": 0.01,
  "500g": 0.01,
  "1kg": 0.01,
};

/* ---------- Helpers formato ---------- */
const fmtMoney = (v: unknown) =>
  Number.isFinite(Number(v))
    ? new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(Number(v))
    : "—";

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

const normalizeOffers = (raw: Offer[]) =>
  raw.map((o) => ({
    ...o,
    metal: toMetalToken(o.metal as any),
    form: toFormToken(o.form as any),
  }));

// Premium vs spot
function premiumFromSpot(o: Offer, spot: SpotDoc | null): number {
  const fallback = o.premium_ex_ship_pct ?? o.premium_pct ?? NaN;
  if (!spot || !o.price_eur || !o.weight_g) return fallback;

  const metal = (o.metal || "").toLowerCase();
  const perG = metal === "gold" ? spot.gold_eur_per_g : metal === "silver" ? spot.silver_eur_per_g : undefined;
  if (!perG) return fallback;

  const intrinsic = o.weight_g * perG;
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
const niceMetal: Record<string, string> = { gold: "Oro", silver: "Plata", platinum: "Platino", palladium: "Paladio" };
const niceForm: Record<string, string> = { bar: "Lingote", coin: "Moneda" };

/* ---------- Buckets (fijos) ---------- */
function bucketFromWeightFixed(weight_g: unknown): FixedBucket | string {
  const w = Number(weight_g);
  if (!Number.isFinite(w) || w <= 0) return "—";
  for (const label of FIXED_BUCKETS) {
    const target = BUCKET_TARGET_G[label];
    const tol = TOL_G[label];
    if (Math.abs(w - target) <= tol) return label;
  }
  // fallback (no debería ocurrir con nuestros tamaños)
  return `${Math.round(w)}g`;
}
function bucketToGramsFixed(b: string): number {
  if (!b) return NaN;
  if ((FIXED_BUCKETS as readonly string[]).includes(b)) {
    return BUCKET_TARGET_G[b as FixedBucket];
  }
  // compat: "1000g"
  if (/^\d+g$/i.test(b)) {
    const n = Number(b.replace(/g$/i, ""));
    return Number.isFinite(n) ? n : NaN;
  }
  // compat: "1oz", "1/2oz", etc.
  if (/oz$/i.test(b)) {
    const frac = b.replace(/oz$/i, "");
    if (frac.includes("/")) {
      const [num, den] = frac.split("/").map(Number);
      if (Number.isFinite(num) && Number.isFinite(den) && den !== 0) return (num / den) * OZ_TO_G;
    } else {
      const n = Number(frac);
      if (Number.isFinite(n)) return n * OZ_TO_G;
    }
  }
  return NaN;
}
function bucketLabelOf(o: Offer): string {
  const raw = (o as any).bucket_label as string | undefined;
  if (raw && (FIXED_BUCKETS as readonly string[]).includes(raw)) return raw;
  return String(bucketFromWeightFixed(o.weight_g));
}

/* ---------- Nombre a mostrar (Marca/Serie) ---------- */
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

/* ---------- Orden ---------- */
const nextDir = (d?: SortDir): SortDir => (d === "asc" ? "desc" : "asc");
const sortLabel = (key: SortKey, dir: SortDir) => (key === "premium" ? "prem" : key) + (dir === "asc" ? "Asc" : "Desc");

/* ---------- Colores premium ---------- */
function premiumClass(pct: unknown) {
  const v = Number(pct);
  if (!Number.isFinite(v)) return "text-zinc-700";
  if (v <= 5) return "text-emerald-600";
  if (v <= 10) return "text-amber-600";
  return "text-rose-600";
}

/* ---------- Main ---------- */
export type AllIndexProps = {
  dealerMeta: DealerMeta;
  spotInitial?: SpotDoc | null;
  offersInitial?: Offer[];
  indexUpdatedAtInitial?: string | null;
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
  dealerMeta: dealerMetaFromServer,
  spotInitial,
  offersInitial = [],
  indexUpdatedAtInitial = null,
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
  const indexUpdatedAt = indexUpdatedAtInitial ?? null;
  const loading = false;

  const baseOffers = useMemo(() => {
    const norm = normalizeOffers(offersInitial || []);
    return dedupeMode === "none" ? norm : dedupeByKey(norm);
  }, [offersInitial, dedupeMode]);

  // SPOT
  const [spot, setSpot] = useState<SpotDoc | null>(spotInitial ?? null);
  const [spotLoading, setSpotLoading] = useState<boolean>(!Boolean(spotInitial));

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

  const dealerMeta = dealerMetaFromServer;

  /* ---------- Derivados spot (€/oz) ---------- */
  const goldEurPerG = spot?.gold_eur_per_g ?? null;
  const silverEurPerG = spot?.silver_eur_per_g ?? null;
  const goldEurPerOz = goldEurPerG != null ? goldEurPerG * OZ_TO_G : null;
  const silverEurPerOz = silverEurPerG != null ? silverEurPerG * OZ_TO_G : null;
  const spotUpdatedAt = spot?.updated_at || null;
  const effectiveUpdatedAt = spotUpdatedAt || indexUpdatedAt || null;

  /* ---------- Opciones de facetas ---------- */
  const metals = useMemo(() => {
    if (manifest?.metals?.length) return Array.from(new Set(manifest.metals.map(toMetalToken)));
    return Array.from(new Set(baseOffers.map((o) => o.metal).filter(Boolean))).sort();
  }, [baseOffers, manifest]);

  const forms = useMemo(() => {
    const base = manifest?.forms?.length
      ? Array.from(new Set(manifest.forms.map(toFormToken)))
      : Array.from(new Set(baseOffers.map((o) => o.form).filter(Boolean))).sort();
    return forceForm ? base.filter((f) => f === forceForm) : base;
  }, [baseOffers, manifest, forceForm]);

  const allBuckets = useMemo<string[]>(() => {
    // Normaliza posibles buckets del manifest (por compatibilidad: 8g -> 1/4oz, 16g -> 1/2oz, 1000g -> 1kg...)
    const mapManifest = (arr: string[]) => {
      const out = new Set<string>();
      for (const label of arr) {
        if ((FIXED_BUCKETS as readonly string[]).includes(label)) {
          out.add(label);
          continue;
        }
        // intenta convertir "1000g" / "8g" / "16g" / "31g"...
        const g = Number(String(label).replace(/g$/i, ""));
        if (Number.isFinite(g)) {
          const mapped = bucketFromWeightFixed(g);
          if ((FIXED_BUCKETS as readonly string[]).includes(mapped as any)) out.add(String(mapped));
        }
      }
      return Array.from(out);
    };

    let base: string[] = [];
    if (manifest?.buckets?.length) base = mapManifest(manifest.buckets);
    else base = Array.from(new Set(baseOffers.map((o) => String(bucketLabelOf(o)))));

    // ordenar exactamente como FIXED_BUCKETS
    return FIXED_BUCKETS.filter((b) => base.includes(b));
  }, [baseOffers, manifest?.buckets]);

  const allDealers = useMemo(() => {
    if (manifest?.dealers?.length) return manifest.dealers;
    return Array.from(new Set(baseOffers.map((o) => o.dealer_id).filter(Boolean))).sort();
  }, [baseOffers, manifest]);

  /* ---------- URL <-> estado ---------- */
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const csv = (v: string | null) => new Set((v || "").split(",").filter(Boolean));

    setSelMetals(forceMetal ? new Set([forceMetal]) : csv(sp.get("metal")));
    setSelForms(forceForm ? new Set([forceForm]) : csv(sp.get("form")));
    setSelBuckets(forceBuckets?.length ? new Set(forceBuckets) : csv(sp.get("bucket")));
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
      : ["metal", "form", "bucket", "dealer"].some((k) => sortParam.startsWith(k))
      ? (sortParam.replace(/(Asc|Desc)$/, "") as SortKey)
      : "price";
    const dir: SortDir = sortParam.endsWith("Desc") ? "desc" : "asc";
    setSortKey(key);
    setSortDir(dir);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceDealer, forceMetal, forceForm, forceBuckets?.join(",")]);

  useEffect(() => {
    const sp = new URLSearchParams();

    if (!forceMetal && selMetals.size) sp.set("metal", Array.from(selMetals).join(","));
    if (!forceForm && selForms.size) sp.set("form", Array.from(selForms).join(","));
    if (!forceBuckets?.length && selBuckets.size) sp.set("bucket", Array.from(selBuckets).join(","));
    if (q) sp.set("q", q);
    if (!forceDealer && selDealers.size) sp.set("dealer", Array.from(selDealers).join(","));

    const compatSort = sortLabel(sortKey, sortDir);
    if (compatSort !== "priceAsc") sp.set("sort", compatSort);

    const qs = sp.toString();
    const current = window.location.search.replace(/^\?/, "");
    if (current === qs) return;
    const url = qs ? `?${qs}` : window.location.pathname;
    window.history.replaceState(null, "", url);
  }, [selMetals, selForms, selBuckets, selDealers, q, sortKey, sortDir, forceDealer, forceMetal, forceForm, forceBuckets]);

  /* ---------- Filtro + orden ---------- */
  const textPass = (o: Offer) =>
    !q ||
    `${o.sku} ${o.brand ?? ""} ${o.series ?? ""} ${displayName(o)}`.toLowerCase().includes(q.toLowerCase());

  const comparator = (a: Offer, b: Offer) => {
    const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : Number.POSITIVE_INFINITY);
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
        const aLab = bucketLabelOf(a);
        const bLab = bucketLabelOf(b);
        const ga = bucketToGramsFixed(String(aLab));
        const gb = bucketToGramsFixed(String(bLab));
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
    const base = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb));
    return sortDir === "asc" ? base : -base;
  };

  const filtered = useMemo(() => {
    return [...baseOffers]
      .filter((o) => {
        if (!textPass(o)) return false;
        if (selMetals.size && !selMetals.has(o.metal)) return false;
        if (selForms.size && !selForms.has(o.form)) return false;
        const b = String(bucketLabelOf(o));
        if (selBuckets.size && !selBuckets.has(b)) return false;
        if (selDealers.size && !selDealers.has(o.dealer_id)) return false;
        return true;
      })
      .sort(comparator);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selMetals, selForms, selBuckets, selDealers, q, sortKey, sortDir, dealerMeta, spot]);

  const filtersSignature = useMemo(() => {
    const s = (set: Set<string>) => Array.from(set).sort().join(",");
    return [`m:${s(selMetals)}`, `f:${s(selForms)}`, `b:${s(selBuckets)}`, `d:${s(selDealers)}`, `q:${q}`, `o:${sortKey}|${sortDir}`].join("|");
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
      for (const o of baseOffers) {
        if (!textPass(o)) continue;
        if (o.metal !== m) continue;
        if (selForms.size && !selForms.has(o.form)) continue;
        const b = String(bucketLabelOf(o));
        if (selBuckets.size && !selBuckets.has(b)) continue;
        if (selDealers.size && !selDealers.has(o.dealer_id)) continue;
        c++;
      }
      out[m] = c;
    }
    return out;
  }, [baseOffers, metals, selForms, selBuckets, selDealers, q]);

  const formCounts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const f of forms) {
      let c = 0;
      for (const o of baseOffers) {
        if (!textPass(o)) continue;
        if (o.form !== f) continue;
        if (selMetals.size && !selMetals.has(o.metal)) continue;
        const b = String(bucketLabelOf(o));
        if (selBuckets.size && !selBuckets.has(b)) continue;
        if (selDealers.size && !selDealers.has(o.dealer_id)) continue;
        c++;
      }
      out[f] = c;
    }
    return out;
  }, [baseOffers, forms, selMetals, selBuckets, selDealers, q]);

  const bucketCounts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const b0 of allBuckets) {
      let c = 0;
      for (const o of baseOffers) {
        if (!textPass(o)) continue;
        const b = String(bucketLabelOf(o));
        if (b !== b0) continue;
        if (selMetals.size && !selMetals.has(o.metal)) continue;
        if (selForms.size && !selForms.has(o.form)) continue;
        if (selDealers.size && !selDealers.has(o.dealer_id)) continue;
        c++;
      }
      out[b0] = c;
    }
    return out;
  }, [baseOffers, allBuckets, selMetals, selForms, selDealers, q]);

  const dealerCounts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const d of allDealers) {
      let c = 0;
      for (const o of baseOffers) {
        if (!textPass(o)) continue;
        if (o.dealer_id !== d) continue;
        if (selMetals.size && !selMetals.has(o.metal)) continue;
        if (selForms.size && !selForms.has(o.form)) continue;
        const b = String(bucketLabelOf(o));
        if (selBuckets.size && !selBuckets.has(b)) continue;
        c++;
      }
      out[d] = c;
    }
    return out;
  }, [baseOffers, allDealers, selMetals, selForms, selBuckets, q]);

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
        if (prev.size === target.size && Array.from(prev).every((x) => target.has(x))) return prev;
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
  }, [formCounts, metalCounts, bucketCounts, forceMetal, forceForm, forceBuckets]);
  useEffect(() => {
    if (forceDealer) {
      setSelDealers((prev) => {
        if (prev.size === 1 && prev.has(forceDealer)) return prev;
        return new Set([forceDealer]);
      });
      return;
    }
    if (forceDealer) {
      setPage(1);
    }
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

  const onSort = (k: SortKey) => (k === sortKey ? setSortDir(nextDir(sortDir)) : (setSortKey(k), setSortDir("asc")));

  /* ---------- Render ---------- */
  return (
    <div className="space-y-3">
      <FiltersBarCompact
        hideMetalFacet={hideMetalFacet}
        hideFormFacet={hideFormFacet}
        hideBucketFacet={hideBucketFacet}
        hideDealerFacet={hideDealerFacet}
        metals={metals}
        forms={forms}
        allBuckets={allBuckets}
        allDealers={allDealers}
        selMetals={selMetals}
        selForms={selForms}
        selBuckets={selBuckets}
        selDealers={selDealers}
        setSelMetals={setSelMetals}
        setSelForms={setSelForms}
        setSelBuckets={setSelBuckets}
        setSelDealers={setSelDealers}
        metalCounts={metalCounts}
        formCounts={formCounts}
        bucketCounts={bucketCounts}
        dealerCounts={dealerCounts}
        niceMetal={niceMetal}
        niceForm={niceForm}
        dealerMeta={dealerMeta}
      />

      {/* Tabla (desktop) */}
      <div className="hidden md:block card overflow-x-auto">
        <TopActions q={q} onQ={setQ} onReset={resetAll} />
        <InfoBarSpot
          spotLoading={spotLoading}
          goldEurPerG={goldEurPerG}
          silverEurPerG={silverEurPerG}
          goldEurPerOz={goldEurPerOz}
          silverEurPerOz={silverEurPerOz}
          effectiveUpdatedAt={effectiveUpdatedAt}
        />

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
                  <SortableTh label="Metal" k="metal" align="center" w="w-24" activeKey={sortKey} dir={sortDir} onSort={onSort} />
                  <SortableTh label="Formato" k="form" align="center" w="w-28" activeKey={sortKey} dir={sortDir} onSort={onSort} />
                  <SortableTh label="Tamaño" k="bucket" align="center" w="w-24" activeKey={sortKey} dir={sortDir} onSort={onSort} />
                  <SortableTh label="Marca / Serie" k="name" align="left" activeKey={sortKey} dir={sortDir} onSort={onSort} />
                  <th className="th !text-center w-24">Ficha</th>
                  <SortableTh label="Precio" k="price" align="center" w="w-36" activeKey={sortKey} dir={sortDir} onSort={onSort} />
                  <SortableTh label="Premium (s/envío)" k="premium" align="center" w="w-28" activeKey={sortKey} dir={sortDir} onSort={onSort} />
                  <th className="th text-left w-40">Comprar en</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pageRows.map((o, idx) => {
                  const key = `${o.sku}|${o.dealer_id}|${o.buy_url ?? o.price_eur ?? idx}`;
                  const dealerLabel = dealerMeta[o.dealer_id]?.label ?? o.dealer_id;
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
                    <td colSpan={8} className="td text-center text-zinc-500 py-10">
                      Sin resultados con los filtros actuales.
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

            <div className="px-3">
              <div className="px-3 py-2 text-xs text-zinc-600">
                <span className="opacity-80">Nota:</span> Envío no incluido (<span className="whitespace-nowrap">≈12 €</span> península).
              </div>
            </div>
          </>
        )}
      </div>

      {/* Cards (mobile) */}
      <div className="md:hidden grid grid-cols-1 gap-3">
        <div className="card p-3">
          <div className="relative">
            <svg aria-hidden viewBox="0 0 24 24" className="absolute left-2 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500 pointer-events-none">
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

        {!loading && (
          <div className="card p-3 space-y-2">
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
                aria-label={`Cambiar dirección (${sortDir === "asc" ? "ascendente" : "descendente"})`}
                title={sortDir === "asc" ? "Ascendente" : "Descendente"}
              >
                {sortDir === "asc" ? "▲" : "▼"}
                <span className="text-xs text-zinc-600">{sortDir === "asc" ? "Asc" : "Desc"}</span>
              </button>

              <div className="ml-auto text-xs text-zinc-600">{totalRows ? `${start + 1}–${end} de ${totalRows}` : "0 resultados"}</div>
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
        )}

        <div className="px-3">
          <div className="rounded-lg bg-zinc-50 text-[11px] text-zinc-600 px-2 py-1.5">
            Tabla de ofertas · orden: <span className="font-medium">
              {{
                price: "Precio",
                premium: "Premium",
                name: "Marca/Serie",
                metal: "Metal",
                form: "Formato",
                bucket: "Tamaño",
                dealer: "Tienda",
              }[sortKey]}
            </span>{" "}
            <span className="opacity-70">({sortDir === "asc" ? "Asc" : "Desc"})</span>
          </div>
        </div>

        {loading ? (
          <div className="card p-4 text-sm text-zinc-600">Cargando…</div>
        ) : (
          pageRows.map((o, idx) => {
            const key = `${o.sku}|${o.dealer_id}|${o.buy_url ?? o.price_eur ?? idx}`;
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

        {!loading && !pageRows.length && <div className="text-center text-zinc-500">Sin resultados con los filtros actuales.</div>}

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

        {!loading && (
          <div className="px-3 py-2 text-xs text-zinc-600">
            <span className="opacity-80">Nota:</span> Envío no incluido (<span className="whitespace-nowrap">≈12 €</span> península).
          </div>
        )}
      </div>
    </div>
  );
}
