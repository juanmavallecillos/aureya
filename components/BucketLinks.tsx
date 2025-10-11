// components/BucketLinks.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { cdnPath, toAbsolute } from "@/lib/cdn";

/* --- Tipos mínimos del índice --- */
type Offer = { metal: string; form: string; weight_g: number };
type AllOffersDoc = { offers: Offer[] };

/* --- Normalizaciones iguales que en la tabla --- */
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
const bucketFromWeight = (weight_g: unknown) => {
  const w = Number(weight_g);
  if (!Number.isFinite(w)) return "—";
  // 1 oz exacta a la cabeza
  if (Math.abs(w - 31.1035) < 0.05) return "1oz";
  const specials = [1, 2, 2.5, 5, 10, 20, 50, 100, 250, 500, 1000];
  for (const s of specials) if (Math.abs(w - s) < 0.2) return `${s}g`;
  return `${Math.round(w)}g`;
};
const OZ_TO_G = 31.1034768;
const bucketToGrams = (b: string): number => {
  if (!b) return NaN;
  if (b === "1oz") return OZ_TO_G;
  if (b.endsWith("g")) {
    const n = Number(b.replace("g", ""));
    return Number.isFinite(n) ? n : NaN;
  }
  // fallback por si llega "100" sin sufijo
  const n = Number(b);
  return Number.isFinite(n) ? n : NaN;
};
const sortBuckets = (a: string, b: string) => {
  const ga = bucketToGrams(a);
  const gb = bucketToGrams(b);
  if (Number.isFinite(ga) && Number.isFinite(gb)) return ga - gb;
  if (Number.isFinite(ga)) return -1;
  if (Number.isFinite(gb)) return 1;
  return a.localeCompare(b);
};

type Props = {
  /** metal normalizado: "gold" | "silver" */
  metal: "gold" | "silver";
  /** formato normalizado: "bar" | "coin" */
  form: "bar" | "coin";
  /** base del href para construir /[metal]/[form]/[bucket] */
  baseHref: string; // p.ej. "/oro/lingotes"
  className?: string;
};

export default function BucketLinks({ metal, form, baseHref, className }: Props) {
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const url = toAbsolute(cdnPath("prices/index/all_offers.json"));

    setLoading(true);
    fetch(url, { cache: "no-store" })
      .then((r) => r.json())
      .then((doc: AllOffersDoc) => {
        if (!mounted) return;
        const raw = Array.isArray(doc?.offers) ? doc.offers : [];
        const norm = raw.map((o) => ({
          metal: toMetalToken(o.metal),
          form: toFormToken(o.form),
          weight_g: Number(o.weight_g),
        }));
        setOffers(norm);
      })
      .catch(() => {
        if (mounted) setOffers([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const buckets = useMemo(() => {
    if (!offers) return [];
    const set = new Set<string>();
    for (const o of offers) {
      if (o.metal !== metal) continue;
      if (o.form !== form) continue;
      set.add(bucketFromWeight(o.weight_g));
    }
    return Array.from(set).sort(sortBuckets);
  }, [offers, metal, form]);

  if (loading) {
    return (
      <div className={className}>
        <ul className="flex flex-wrap gap-2 text-sm opacity-70">
          <li className="rounded-full border px-3 py-1.5">Cargando tamaños…</li>
        </ul>
      </div>
    );
  }

  if (!buckets.length) {
    return (
      <div className={className}>
        <ul className="flex flex-wrap gap-2 text-sm opacity-70">
          <li>No hay tamaños disponibles ahora mismo.</li>
        </ul>
      </div>
    );
  }

  return (
    <nav aria-label="Tamaños disponibles" className={className}>
      <ul className="flex flex-wrap gap-2 text-sm">
        {buckets.map((b) => (
          <li key={b}>
            <Link
              href={`${baseHref}/${b}`}
              className="underline decoration-[hsl(var(--brand))] underline-offset-[3px] hover:opacity-90"
            >
              {b}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
