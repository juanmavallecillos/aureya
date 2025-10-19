// components/BucketLinks.server.tsx
// SERVER COMPONENT — calcula los buckets desde el CDN y se los pasa al cliente

import BucketLinks from "./BucketLinks";
import { fetchJsonOrNullServer } from "@/lib/cdn-server";

type Offer = { metal?: string; form?: string; weight_g?: number };
type AllOffersDoc = { offers?: Offer[] };

const OZ_TO_G = 31.1034768;

function toMetalToken(m?: string) {
  const x = (m || "").toLowerCase();
  if (x === "oro") return "gold";
  if (x === "plata") return "silver";
  return x;
}
function toFormToken(f?: string) {
  const x = (f || "").toLowerCase();
  if (x === "lingote" || x === "lingotes" || x === "bar") return "bar";
  if (x === "moneda" || x === "monedas" || x === "coin") return "coin";
  return x;
}
function bucketFromWeight(weight_g: unknown) {
  const w = Number(weight_g);
  if (!Number.isFinite(w)) return "—";
  if (Math.abs(w - 31.1035) < 0.05) return "1oz";
  const specials = [1, 2, 2.5, 5, 10, 20, 50, 100, 250, 500, 1000];
  for (const s of specials) if (Math.abs(w - s) < 0.2) return `${s}g`;
  return `${Math.round(w)}g`;
}
function bucketToGrams(b: string): number {
  if (!b) return NaN;
  if (b === "1oz") return OZ_TO_G;
  if (b.endsWith("g")) {
    const n = Number(b.replace("g", ""));
    return Number.isFinite(n) ? n : NaN;
  }
  const n = Number(b);
  return Number.isFinite(n) ? n : NaN;
}
function sortBuckets(a: string, b: string) {
  const ga = bucketToGrams(a);
  const gb = bucketToGrams(b);
  if (Number.isFinite(ga) && Number.isFinite(gb)) return ga - gb;
  if (Number.isFinite(ga)) return -1;
  if (Number.isFinite(gb)) return 1;
  return a.localeCompare(b);
}

export default async function BucketLinksServer(props: {
  metal: "gold" | "silver";
  form: "bar" | "coin";
  baseHref: string; // p.ej. "/oro/lingotes"
  className?: string;
}) {
  const { metal, form, baseHref, className } = props;

  // 1) Leer índice desde CDN en servidor (cacheado por 2 h y con tag)
  const indexDoc =
    (await fetchJsonOrNullServer<AllOffersDoc>("prices/index/all_offers.json", {
      revalidate: 7200,
      tags: ["all_offers"],
    })) ?? { offers: [] };

  const raw = Array.isArray(indexDoc?.offers) ? indexDoc!.offers : [];

  // 2) Normalizar y filtrar
  const set = new Set<string>();
  for (const o of raw) {
    const m = toMetalToken(o.metal);
    const f = toFormToken(o.form);
    if (m !== metal || f !== form) continue;
    set.add(bucketFromWeight(o.weight_g));
  }

  // 3) Ordenar
  const buckets = Array.from(set).sort(sortBuckets);

  // 4) Pasar al componente cliente ya sin fetch
  return (
    <BucketLinks
      metal={metal}
      form={form}
      baseHref={baseHref}
      className={className}
      buckets={buckets}
    />
  );
}
