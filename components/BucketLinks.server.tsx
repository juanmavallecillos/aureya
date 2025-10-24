// components/BucketLinks.server.tsx
// SERVER COMPONENT — calcula los buckets desde el CDN y se los pasa al cliente

import BucketLinks from "./BucketLinks";
import { fetchJsonOrNullServer } from "@/lib/cdn-server";

type Offer = {
  metal?: string;
  form?: string;
  weight_g?: number;
  // opcional si el scraper ya lo añade
  bucket_label?: string;
  // permitimos acceso por índice dinámico
  [k: string]: any;
};
type AllOffersDoc = { offers?: Offer[] };

// Orden y lista fija de buckets (tal cual los quieres mostrar)
const FIXED_BUCKETS: string[] = [
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

// gramos “target” por bucket (para fallback por peso)
const BUCKET_TARGET_G: Record<string, number> = {
  "2g": 2,
  "2,5g": 2.5,
  "5g": 5,
  "1/4oz": 31.1034768 / 4, // ~7.776 g
  "10g": 10,
  "1/2oz": 31.1034768 / 2, // ~15.552 g
  "20g": 20,
  "25g": 25,
  "1oz": 31.1034768, // ~31.103 g
  "50g": 50,
  "100g": 100,
  "250g": 250,
  "500g": 500,
  "1kg": 1000,
};

// tolerancias en gramos para el match por peso
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

function pickBucketLabel(o: Offer): string | null {
  // 1) Preferir bucket_label si lo trae el backend/scraper y está en la lista fija
  const raw = (o.bucket_label ?? o["bucket_label"]) as string | undefined;
  if (raw && FIXED_BUCKETS.includes(raw)) return raw;

  // 2) Fallback por peso (aproximación a los targets con tolerancia)
  const w = Number(o.weight_g);
  if (!Number.isFinite(w) || w <= 0) return null;
  for (const label of FIXED_BUCKETS) {
    const target = BUCKET_TARGET_G[label];
    const tol = TOL_G[label] ?? 0.5;
    if (Math.abs(w - target) <= tol) return label;
  }
  return null;
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

  // 2) Normalizar, filtrar por metal/form y recoger buckets siguiendo la lista fija
  const wanted = new Set<string>();
  for (const o of raw) {
    const m = toMetalToken(o.metal);
    const f = toFormToken(o.form);
    if (m !== metal || f !== form) continue;
    const label = pickBucketLabel(o);
    if (label) wanted.add(label);
  }

  // 3) Ordenar exactamente como FIXED_BUCKETS y filtrar a los presentes
  const buckets = FIXED_BUCKETS.filter((b) => wanted.has(b));

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
