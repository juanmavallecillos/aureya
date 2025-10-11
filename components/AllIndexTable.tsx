// components/AllIndexTable.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useDealerMeta } from "@/lib/useDealerMeta";
import { productSlug } from "@/lib/slug";


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
type ManifestLike = { metals?: string[]; forms?: string[]; buckets?: string[]; dealers?: string[] };
type SpotDoc = { gold_eur_per_g?: number; silver_eur_per_g?: number; updated_at?: string };

/* ---------- Const ---------- */
const OZ_TO_G = 31.1034768;

/* ---------- Helpers formato ---------- */
const fmtMoney = (v: unknown) =>
  Number.isFinite(Number(v))
    ? new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(Number(v))
    : "—";
const fmtPct = (v: unknown) => (Number.isFinite(Number(v)) ? `${Number(v).toFixed(2)}%` : "—");

// Calcula premium vs spot (€/g) usando los datos de meta/spot.json.
// Si spot aún no está cargado, cae al premium del backend (ex envío si existe).
function premiumFromSpot(o: Offer, spot: SpotDoc | null): number {
  // Fallback al premium del backend si aún no hay spot o faltan datos mínimos
  const fallback = o.premium_ex_ship_pct ?? o.premium_pct ?? NaN;
  if (!spot || !o.price_eur || !o.weight_g) return fallback;

  const metal = (o.metal || "").toLowerCase();
  const perG =
    metal === "gold"   ? spot.gold_eur_per_g :
    metal === "silver" ? spot.silver_eur_per_g :
    undefined;

  if (!perG) return fallback;

  // Si quieres incluir IVA para plata, cambia esta línea a: const basePerG = metal === "silver" ? perG * 1.21 : perG;
  const basePerG = perG;

  const intrinsic = o.weight_g * basePerG;
  if (!Number.isFinite(intrinsic) || intrinsic <= 0) return fallback;

  return ((Number(o.price_eur) - intrinsic) / intrinsic) * 100;
}

/* ---------- Tiempo: “hace X” ---------- */
function timeAgo(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(+d)) return "";
  const diffSec = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (diffSec < 60) return `hace ${diffSec}s`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `hace ${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  return `hace ${diffD} día${diffD === 1 ? "" : "s"}`;
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

/* ---------- UI Chip ---------- */
function Chip({
  active,
  onClick,
  children,
  className,
}: { active?: boolean; onClick?: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={[
        "px-3 py-1.5 rounded-full border text-sm transition-colors cursor-pointer select-none",
        active
          ? "bg-[hsl(var(--brand))] text-[hsl(var(--brand-ink))] border-[hsl(var(--brand))]"
          : "btn-ghost hover:bg-zinc-100 hover:border-zinc-300",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand)/0.35)]",
        className || "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

/* ---------- Orden ---------- */
type SortKey = "name" | "metal" | "form" | "bucket" | "dealer" | "price" | "premium";
type SortDir = "asc" | "desc";
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
  /** Fuerza el filtrado a un único dealer (no depende de la URL). */
  forceDealer?: string;
  /** Oculta el bloque de chips "Tienda" (útil en la ficha de tienda). */
  hideDealerFacet?: boolean;
  /** Fuerza el filtrado a un único metal (no depende de la URL). */
  forceMetal?: "gold" | "silver";
  /** Oculta el bloque de chips "Metal" (útil en páginas de metal). */
  hideMetalFacet?: boolean;
  /** Fuerza el formato (lingote/moneda). */
  forceForm?: "bar" | "coin";
  /** Oculta el facet de formato. */
  hideFormFacet?: boolean;
  /** Fuerza uno o varios buckets (ej. ["100g"] o ["1oz"]). */
  forceBuckets?: string[];
  /** Oculta el facet de tamaño. */
  hideBucketFacet?: boolean;
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
    setLoading(true);
    fetch(`/api/cdn?path=${encodeURIComponent("prices/index/all_offers.json")}`, {
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((doc: AllOffersDoc) => {
        setIndexUpdatedAt(doc?.updated_at || null);
        const raw = Array.isArray(doc?.offers) ? doc.offers : [];
        const norm = raw.map((o) => ({ ...o, metal: toMetalToken(o.metal), form: toFormToken(o.form) }));
        const seen = new Set<string>();
        const unique: Offer[] = [];
        for (const o of norm) {
          const idTail = o.buy_url ? o.buy_url : String(o.price_eur ?? "");
          const key = `${o.sku}|${o.dealer_id}|${idTail}`;
          if (seen.has(key)) continue;
          seen.add(key);
          unique.push(o);
        }
        setOffers(unique);
      })
      .finally(() => setLoading(false));
  }, []);

  /* ---------- Carga spot ---------- */
  useEffect(() => {
    setSpotLoading(true);
    fetch(`/api/cdn?path=${encodeURIComponent("meta/spot.json")}`, {
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((doc: SpotDoc | null) => setSpot(doc))
      .catch(() => setSpot(null))
      .finally(() => setSpotLoading(false));
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
    if (manifest?.metals?.length) return Array.from(new Set(manifest.metals.map(toMetalToken)));
    return Array.from(new Set(offers.map((o) => o.metal).filter(Boolean))).sort();
  }, [offers, manifest]);

  const forms = useMemo(() => {
    const base = manifest?.forms?.length
      ? Array.from(new Set(manifest.forms.map(toFormToken)))
      : Array.from(new Set(offers.map((o) => o.form).filter(Boolean))).sort();
    return forceForm ? base.filter(f => f === forceForm) : base;
  }, [offers, manifest, forceForm]);

  // arriba ya tienes OZ_TO_G y bucketToGrams

  const allBuckets = useMemo<string[]>(() => {
    // Construye la base: o bien los buckets del manifest, o bien deduce de ofertas
    const base = manifest?.buckets?.length
      ? [...manifest.buckets]
      : Array.from(new Set(offers.map((o) => bucketFromWeight(o.weight_g))));

    // Orden real por gramos (1oz = 31.1035 g)
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
    return Array.from(new Set(offers.map((o) => o.dealer_id).filter(Boolean))).sort();
  }, [offers, manifest]);

  /* ---------- URL <-> estado ---------- */
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const csv = (v: string | null) => new Set((v || "").split(",").filter(Boolean));

    setSelMetals(forceMetal ? new Set([forceMetal]) : csv(sp.get("metal")));
    setSelForms(forceForm ? new Set([forceForm]) : csv(sp.get("form")));
    setSelBuckets(forceBuckets?.length ? new Set(forceBuckets) : csv(sp.get("bucket")));
    setQ(sp.get("q") || "");

    // dealer: si hay forceDealer, ignoramos lo que venga en la URL y lo forzamos
    if (forceDealer) {
      setSelDealers(new Set([forceDealer]));
    } else {
      setSelDealers(csv(sp.get("dealer")));
    }


    const sortParam = (sp.get("sort") as string) || "priceAsc";
    const key: SortKey =
      sortParam.startsWith("prem") ? "premium" :
      sortParam.startsWith("price") ? "price" :
      sortParam.startsWith("name") ? "name" :
      (["metal","form","bucket","dealer"].some(k=>sortParam.startsWith(k)) ? (sortParam.replace(/(Asc|Desc)$/,"") as SortKey) : "price");
    const dir: SortDir = sortParam.endsWith("Desc") ? "desc" : "asc";
    setSortKey(key); setSortDir(dir);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const sp = new URLSearchParams();

    if (!forceMetal && selMetals.size)  sp.set("metal",  Array.from(selMetals).join(","));
    if (!forceForm && selForms.size)    sp.set("form",   Array.from(selForms).join(","));
    if (!(forceBuckets?.length) && selBuckets.size) sp.set("bucket", Array.from(selBuckets).join(","));
    if (q)               sp.set("q", q);

    // Importante: si forceDealer está activo, NO escribimos "dealer" en la URL
    // (el filtrado por tienda está bloqueado dentro del componente).
    if (!forceDealer && selDealers.size) {
      sp.set("dealer", Array.from(selDealers).join(","));
    }

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
    !q || `${o.sku} ${o.brand ?? ""} ${o.series ?? ""} ${displayName(o)}`.toLowerCase().includes(q.toLowerCase());

  const comparator = (a: Offer, b: Offer) => {
    const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : Number.POSITIVE_INFINITY);
    const bucketA = bucketFromWeight(a.weight_g);
    const bucketB = bucketFromWeight(b.weight_g);
    let va: string | number; let vb: string | number;
    switch (sortKey) {
      case "name":    va = displayName(a).toLowerCase(); vb = displayName(b).toLowerCase(); break;
      case "metal":   va = a.metal; vb = b.metal; break;
      case "form":    va = a.form; vb = b.form; break;
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
        va = la.toLowerCase(); vb = lb.toLowerCase();
        break;
      }
      case "price":   va = num(a.price_eur); vb = num(b.price_eur); break;
      case "premium": {
        const pa = premiumFromSpot(a, spot);
        const pb = premiumFromSpot(b, spot);
        va = Number.isFinite(pa) ? pa : Number.POSITIVE_INFINITY;
        vb = Number.isFinite(pb) ? pb : Number.POSITIVE_INFINITY;
        break;
      }
      default:        va = num(a.price_eur); vb = num(b.price_eur); break;
    }
    const base = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb));
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
  }, [offers, selMetals, selForms, selBuckets, selDealers, q, sortKey, sortDir, dealerMeta, spot]);

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
    setSelForms(prev => {
      if (forceForm) {
        if (prev.size === 1 && prev.has(forceForm)) return prev;
        return new Set([forceForm]);
      }
      let changed = false; const next = new Set(prev);
      for (const f of Array.from(next)) {
        if ((formCounts[f] ?? 0) === 0) { next.delete(f); changed = true; }
      }
      return changed ? next : prev;
    });
    setSelMetals(prev => {
      if (forceMetal) {
        if (prev.size === 1 && prev.has(forceMetal)) return prev;
        return new Set([forceMetal]);
      }
      let changed = false; 
      const next = new Set(prev);
      for (const m of Array.from(next)) {
        if ((metalCounts[m] ?? 0) === 0) { next.delete(m); changed = true; }
      }
      return changed ? next : prev;
    });
    setSelBuckets(prev => {
      if (forceBuckets?.length) {
        const target = new Set(forceBuckets);
        // Evita recrear si ya coincide
        if (prev.size === target.size && Array.from(prev).every(x => target.has(x))) return prev;
        return target;
      }
      let changed = false; const next = new Set(prev);
      for (const b of Array.from(next)) {
        if ((bucketCounts[b] ?? 0) === 0) { next.delete(b); changed = true; }
      }
      return changed ? next : prev;
    });
  }, [formCounts, metalCounts, bucketCounts, forceMetal, forceForm, forceBuckets]);

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

  const toggleSet = (setter: (s: Set<string>) => void, current: Set<string>, value: string) => {
    const next = new Set(current); next.has(value) ? next.delete(value) : next.add(value); setter(next);
  };
  const clickSort = (key: SortKey) => (key === sortKey ? setSortDir(nextDir(sortDir)) : (setSortKey(key), setSortDir("asc")));

  const ThSortable = ({ label, k, alignRight, w }: { label: string; k: SortKey; alignRight?: boolean; w?: string }) => {
    const active = sortKey === k; const dirArrow = active ? (sortDir === "asc" ? "▲" : "▼") : "";
    const ariaSort = active ? (sortDir === "asc" ? "ascending" : "descending") : "none";
    return (
      <th
        scope="col"
        aria-sort={ariaSort as any}
        onClick={() => clickSort(k)}
        className={[
          "th select-none cursor-pointer hover:bg-zinc-50 transition-colors",
          alignRight ? "text-right" : "text-left",
          w || ""
        ].join(" ")}
      >
        <span className="inline-flex items-center gap-1">{label}{dirArrow && <span className="text-xs text-zinc-500">{dirArrow}</span>}</span>
      </th>
    );
  };

  const BtnBuy = ({ href, label }: { href?: string | null; label: string }) =>
    href ? (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        aria-label={`Comprar en ${label}`}
        className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none btn-brand whitespace-nowrap"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden><path fill="currentColor" d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3ZM5 5h6v2H7v10h10v-4h2v6H5V5Z"/></svg>
        {`${label}`}
      </a>
    ) : (
      <span className="text-zinc-400">—</span>
    );

  const BtnView = ({
    sku,
    slugData,
  }: {
    sku: string;
    slugData: { metal: string; form: string; weight_g: number; brand?: string | null; series?: string | null };
  }) => (
    <Link
      href={`/producto/${productSlug({ ...slugData, sku })}`}
      aria-label={`Ver ficha de ${sku}`}
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
  );

  const InfoBar = () => (
    <div className="px-3 py-2 text-xs text-zinc-700 bg-white border-b flex flex-wrap items-center gap-x-4 gap-y-1">
      {/* SPOT primero: €/g y €/oz */}
      <div className="flex items-center gap-3">
        <span className="font-medium text-[hsl(var(--brand))]">Spot</span>
        {spotLoading ? (
          <span className="opacity-70">cargando…</span>
        ) : (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>
              Oro: {fmtMoney(goldEurPerG)} /g · {goldEurPerOz != null ? `${fmtMoney(goldEurPerOz)} /oz` : "—"}
            </span>
            <span>
              Plata: {fmtMoney(silverEurPerG)} /g · {silverEurPerOz != null ? `${fmtMoney(silverEurPerOz)} /oz` : "—"}
            </span>
          </div>
        )}
      </div>

      <div className="hidden sm:block h-3 w-px bg-zinc-200" aria-hidden />

      {/* Actualizado (de meta/spot.json; fallback: índice) */}
      <div>
        <span className="font-medium text-[hsl(var(--brand))]">Actualizado</span>{": "}
        {effectiveUpdatedAt ? (
          <>
            <span title={new Date(effectiveUpdatedAt).toLocaleString("es-ES")}>
              {new Date(effectiveUpdatedAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
            </span>{" "}
            <span className="opacity-70">({timeAgo(effectiveUpdatedAt)})</span>
          </>
        ) : <span>—</span>}
      </div>
    </div>
  );

  const NoteShipping = () => (
    <div className="px-3 py-2 text-xs text-zinc-600">
      <span className="opacity-80">Nota:</span> Envío no incluido (<span className="whitespace-nowrap">≈12 €</span> península).
    </div>
  );

  /* ---------- Render ---------- */
  return (
    <div className="space-y-3">
      {/* Metal */}
      {!hideMetalFacet && (
        <div className="card p-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-zinc-600 px-1">Metal</span>
            <Chip active={!selMetals.size} onClick={() => setSelMetals(new Set())}>Todos</Chip>
            {metals
              .filter((m) => selMetals.has(m) || (metalCounts[m] ?? 0) > 0)
              .map((m) => (
                <Chip key={m} active={selMetals.has(m)} onClick={() => toggleSet(setSelMetals, selMetals, m)}>
                  {niceMetal[m] ?? m} {metalCounts[m] ? `(${metalCounts[m]})` : ""}
                </Chip>
            ))}
          </div>
        </div>
      )}

      {/* Formato */}
      {!hideFormFacet && (
        <div className="card p-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-zinc-600 px-1">Formato</span>
            <Chip active={!selForms.size} onClick={() => setSelForms(new Set())}>Todos los formatos</Chip>
            {forms.filter((f) => selForms.has(f) || (formCounts[f] ?? 0) > 0).map((f) => (
              <Chip key={f} active={selForms.has(f)} onClick={() => toggleSet(setSelForms, selForms, f)}>
                {niceForm[f] ?? f} {formCounts[f] ? `(${formCounts[f]})` : ""}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {/* Tamaño */}
      {!hideBucketFacet && (
        <div className="card p-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs text-zinc-600 px-1 shrink-0">Tamaño</span>
            <Chip active={!selBuckets.size} onClick={() => setSelBuckets(new Set())}>
              Todos los tamaños
            </Chip>
            {allBuckets
              .filter((b) => selBuckets.has(b) || (bucketCounts[b] ?? 0) > 0)
              .map((b) => (
                <Chip
                  key={b}
                  active={selBuckets.has(b)}
                  onClick={() => toggleSet(setSelBuckets, selBuckets, b)}
                >
                  {b} {bucketCounts[b] ? `(${bucketCounts[b]})` : ""}
                </Chip>
              ))}
          </div>
        </div>
      )}

      {/* Tienda */}
      {!hideDealerFacet && (
        <div className="card p-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs text-zinc-600 px-1 shrink-0">Tienda</span>
            <Chip active={!selDealers.size} onClick={() => setSelDealers(new Set())}>Todas las tiendas</Chip>
            {allDealers
              .filter((d) => selDealers.has(d) || (dealerCounts[d] ?? 0) > 0)
              .map((d) => {
                const meta = dealerMeta[d];
                if (!meta) return null;
                const active = selDealers.has(d);
                return (
                  <Chip
                    key={d}
                    active={active}
                    onClick={() => toggleSet(setSelDealers, selDealers, d)}
                    className="group"
                  >
                    <span className="inline-flex items-center gap-1">
                      <span>{meta.label}</span>
                      {dealerCounts[d] ? <span className="opacity-70">({dealerCounts[d]})</span> : null}
                    </span>
                  </Chip>
                );
              })}
          </div>
        </div>
      )}

      {/* Tabla (desktop) con buscador integrado */}
      <div className="hidden md:block card overflow-x-auto">
        <div className="flex items-center justify-between gap-3 p-3 border-b bg-zinc-50">
          {/* Buscador */}
          <div className="relative w-full max-w-xs">
            <svg aria-hidden viewBox="0 0 24 24" className="absolute left-2 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500 pointer-events-none">
              <path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16a6.471 6.471 0 0 0 4.23-1.57l.27.28v.79L20 21.5 21.5 20l-6-6Zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14Z"/>
            </svg>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar marca/serie…"
              className="w-full rounded-lg border pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--brand)/0.35)]"
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Filas por página */}
            <label className="text-xs text-zinc-600">
              Filas:{" "}
              <select
                value={pageSize}
                onChange={(e) => { const n = Number(e.target.value); setPageSize(n); setPage(1); }}
                className="border rounded px-2 py-1 text-xs bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand)/0.35)]"
                aria-label="Filas por página"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </label>

            <button onClick={resetAll} className="btn btn-ghost cursor-pointer hover:bg-zinc-100 link-brand-underline" title="Restablecer filtros">
              Limpiar
            </button>
          </div>
        </div>

        {/* Info bar */}
        <InfoBar />

        {loading ? (
          <div className="p-6 text-sm text-zinc-600">Cargando…</div>
        ) : (
          <>
            <table className="table w-full">
              <thead className="thead">
                <tr>
                  <ThSortable label="Metal"   k="metal"   w="w-24" />
                  <ThSortable label="Formato" k="form"    w="w-28" />
                  <ThSortable label="Tamaño"  k="bucket"  w="w-24" />
                  <ThSortable label="Marca / Serie" k="name" />
                  <th className="th text-center w-24">Ficha</th>
                  <ThSortable label="Precio"  k="price"   alignRight w="w-36" />
                  <ThSortable label="Premium (s/envío)" k="premium" alignRight w="w-28" />
                  <th className="th text-right w-40">Comprar en</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pageRows.map((o, idx) => {
                  const key = `${o.sku}|${o.dealer_id}|${o.buy_url ?? o.price_eur ?? idx}`;
                  const info = dealerMeta[o.dealer_id];
                  const dealerLabel = info?.label ?? o.dealer_id;

                  return (
                    <tr
                      key={key}
                      className={[
                        // zebra (suave)
                        idx % 2 === 0 ? "bg-white" : "bg-zinc-50/30",
                        idx === 0 && page === 1 ? "bg-[hsl(var(--brand)/0.08)]" : "",
                        "hover:bg-zinc-50 transition-colors"
                      ].join(" ")}
                    >
                      <td className="td text-center text-zinc-800">{niceMetal[o.metal] ?? o.metal}</td>
                      <td className="td text-center text-zinc-800">{niceForm[o.form] ?? o.form}</td>
                      <td className="td text-center text-zinc-800">{bucketFromWeight(o.weight_g)}</td>
                      <td className="td">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="font-medium truncate max-w-[460px] text-zinc-900" title={displayName(o)}>
                            {displayName(o)}
                          </span>
                        </div>
                      </td>
                      <td className="td text-center">
                        <BtnView
                          sku={o.sku}
                          slugData={{
                            metal: o.metal,
                            form: o.form,
                            weight_g: Number(o.weight_g),
                            brand: o.brand ?? null,
                            series: o.series ?? null,
                          }}
                        />
                      </td>
                      <td className="td text-right whitespace-nowrap tabular-nums font-semibold text-zinc-900">{fmtMoney(o.price_eur)}</td>
                      <td className={`td text-right whitespace-nowrap tabular-nums ${premiumClass(premiumFromSpot(o, spot))}`}>
                        {fmtPct(premiumFromSpot(o, spot))}
                      </td>
                      <td className="td text-right">
                        <BtnBuy href={o.buy_url} label={dealerLabel} />
                      </td>
                    </tr>
                  );
                })}
                {!pageRows.length && (
                  <tr><td colSpan={8} className="td text-center text-zinc-500 py-10">Sin resultados con los filtros actuales.</td></tr>
                )}
              </tbody>
            </table>

            {/* Footer de paginación */}
            <div className="flex items-center justify-between px-3 py-2 border-t bg-white text-sm">
              <div className="text-zinc-600">
                Mostrando <span className="font-medium">{totalRows ? start + 1 : 0}</span>–<span className="font-medium">{end}</span> de <span className="font-medium">{totalRows}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="btn btn-ghost hover:bg-zinc-100 px-3 py-1 rounded disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  aria-label="Página anterior"
                >
                  ← Anterior
                </button>
                <span className="text-zinc-600">Página {page} de {totalPages}</span>
                <button
                  className="btn btn-ghost hover:bg-zinc-100 px-3 py-1 rounded disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  aria-label="Página siguiente"
                >
                  Siguiente →
                </button>
              </div>
            </div>

            {/* Nota de envío debajo de la tabla */}
            <NoteShipping />
          </>
        )}
      </div>

      {/* Cards (mobile) */}
      <div className="md:hidden grid grid-cols-1 gap-3">
        {/* Buscador */}
        <div className="card p-3">
          <div className="relative">
            <svg aria-hidden viewBox="0 0 24 24" className="absolute left-2 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500 pointer-events-none">
              <path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16a6.471 6.471 0 0 0 4.23-1.57l.27.28v.79L20 21.5 21.5 20l-6-6Zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14Z"/>
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
        <div className="card p-3 text-xs text-zinc-600">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-medium">Spot</span>
              {spotLoading ? (
                <span className="opacity-70">cargando…</span>
              ) : (
                <>
                  <span>
                    Oro: {fmtMoney(goldEurPerG)} /g
                    {goldEurPerOz != null && <span> · {fmtMoney(goldEurPerOz)} /oz</span>}
                  </span>
                  <span>
                    Plata: {fmtMoney(silverEurPerG)} /g
                    {silverEurPerOz != null && <span> · {fmtMoney(silverEurPerOz)} /oz</span>}
                  </span>
                </>
              )}
            </div>
            <div>
              <span className="font-medium">Actualizado</span>{": "}
              {effectiveUpdatedAt ? (
                <>
                  <span title={new Date(effectiveUpdatedAt).toLocaleString("es-ES")}>
                    {new Date(effectiveUpdatedAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                  </span>{" "}
                  <span className="opacity-70">({timeAgo(effectiveUpdatedAt)})</span>
                </>
              ) : <span>—</span>}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="card p-4 text-sm text-zinc-600">Cargando…</div>
        ) : pageRows.map((o, idx) => {
          const key = `${o.sku}|${o.dealer_id}|${o.buy_url ?? o.price_eur ?? idx}`;
          const info = dealerMeta[o.dealer_id];
          const dealerLabel = info?.label ?? o.dealer_id;

          return (
            <div key={key} className={`card p-4 ${idx === 0 && page === 1 ? "bg-[hsl(var(--brand)/50)]" : ""}`}>
              <div className="text-xs text-zinc-600">
                {niceMetal[o.metal]} · {niceForm[o.form]} · {bucketFromWeight(o.weight_g)}
              </div>
              <div className="mt-1 font-medium">{displayName(o)}</div>

              <div className="mt-2 flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold">{fmtMoney(o.price_eur)}</div>
                  <div className="text-xs text-zinc-600">
                    Premium {fmtPct(premiumFromSpot(o, spot))}
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
                {/* En móvil mantenemos el enlace tipo “pill” */}
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
        })}
        {!loading && !pageRows.length && <div className="text-center text-zinc-500">Sin resultados con los filtros actuales.</div>}

        {/* Paginación móvil */}
        {!loading && (
          <div className="flex items-center justify-between p-2 text-sm">
            <div className="text-zinc-600">
              Mostrando <span className="font-medium">{totalRows ? start + 1 : 0}</span>–<span className="font-medium">{end}</span> de <span className="font-medium">{totalRows}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="btn btn-ghost hover:bg-zinc-100 px-3 py-1 rounded disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                aria-label="Página anterior"
              >
                ←
              </button>
              <span className="text-zinc-600"> {page}/{totalPages} </span>
              <button
                className="btn btn-ghost hover:bg-zinc-100 px-3 py-1 rounded disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                aria-label="Página siguiente"
              >
                →
              </button>
            </div>
          </div>
        )}

        {/* Nota de envío debajo del listado móvil */}
        {!loading && <NoteShipping />}
      </div>
    </div>
  );
}
