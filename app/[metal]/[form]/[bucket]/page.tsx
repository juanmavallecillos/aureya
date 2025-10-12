// app/[metal]/[form]/[bucket]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AllIndexTable from "@/components/AllIndexTable";
import { fetchJsonServer as fetchJson } from "@/lib/cdn-server";

/* ---------------- Normalización de segmentos ---------------- */
const toMetalToken = (m?: string) => {
  const x = (m || "").toLowerCase();
  if (x === "oro" || x === "gold") return "gold";
  if (x === "plata" || x === "silver") return "silver";
  return "";
};
const toFormToken = (f?: string) => {
  const x = (f || "").toLowerCase();
  if (["lingote", "lingotes", "bar"].includes(x)) return "bar";
  if (["moneda", "monedas", "coin"].includes(x)) return "coin";
  return "";
};
// bucket: aceptamos “1oz” tal cual y “100g/1kg/…” tal cual.
// Si viniera “1kg” lo canonizamos a “1000g”; “100” -> “100g”.
const normalizeBucket = (b?: string) => {
  const x = (b || "").toLowerCase();
  if (!x) return "";
  if (x === "1oz" || x.endsWith("oz")) return x; // oz tal cual
  if (x === "1kg") return "1000g";
  return x.endsWith("g") ? x : `${x}g`;
};

const niceMetal: Record<string, string> = { gold: "Oro", silver: "Plata" };
const niceForm: Record<string, string> = { bar: "Lingotes", coin: "Monedas" };

/* ---------------- Helpers bucket válidos ---------------- */
type OfferLite = { metal: string; form: string; weight_g: number };
type AllIndexDoc = { offers?: OfferLite[] };

const OZ_TO_G = 31.1034768;
const bucketFromWeight = (g: number) => {
  if (Math.abs(g - OZ_TO_G) < 0.05) return "1oz";
  const specials = [1, 2, 2.5, 5, 10, 20, 50, 100, 250, 500, 1000];
  for (const s of specials) if (Math.abs(g - s) < 0.2) return `${s}g`;
  return `${Math.round(g)}g`;
};

async function isValidBucket(
  metal: "gold" | "silver",
  form: "bar" | "coin",
  bucket: string
) {
  const doc = await fetchJson<AllIndexDoc>("/prices/index/all_offers.json"); // vía proxy /api/cdn
  const offers = Array.isArray(doc?.offers) ? doc!.offers! : [];

  const set = new Set<string>();
  for (const o of offers) {
    const m = toMetalToken(o.metal); // <-- normalizamos "oro"/"gold"
    const f = toFormToken(o.form); // <-- normalizamos "lingotes"/"bar"
    if (m === metal && f === form) {
      const b = bucketFromWeight(Number(o.weight_g));
      set.add(b);
    }
  }

  return set.has(bucket);
}

/* ------- metadata “404” para evitar títulos engañosos ------- */
const notFoundMeta = (): Metadata => ({
  title: "Página no encontrada • Aureya",
  description: "La ruta solicitada no existe.",
  robots: { index: false, follow: false },
});

/* ---------------- Metadata dinámica ---------------- */
export async function generateMetadata(
  { params }: { params: Promise<{ metal: string; form: string; bucket: string }> }
): Promise<Metadata> {
  const { metal: metalRaw, form: formRaw, bucket: bucketRaw } = await params;

  const metal = toMetalToken(metalRaw) as "gold" | "silver";
  const form = toFormToken(formRaw) as "bar" | "coin";
  const bucket = normalizeBucket(bucketRaw);

  // Validación también en metadata para no mostrar títulos erróneos
  if (!metal || !form || !bucket) return notFoundMeta();
  const ok = await isValidBucket(metal, form, bucket);
  if (!ok) return notFoundMeta();

  const h1Metal = niceMetal[metal];
  const h1Form = niceForm[form];
  const title = `${h1Form.slice(0, -1)} de ${h1Metal.toLowerCase()} ${bucket} • Aureya`;
  const description = `Compara precios y primas vs spot para ${h1Form.toLowerCase()} de ${h1Metal.toLowerCase()} ${bucket}. Tiendas verificadas y datos claros.`;

  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { card: "summary", title, description },
  };
}

/* ---------------- Página (Server Component) ---------------- */
export default async function CategoryBucketPage(
  { params }: { params: Promise<{ metal: string; form: string; bucket: string }> }
) {
  const { metal: metalRaw, form: formRaw, bucket: bucketRaw } = await params;

  const metal = toMetalToken(metalRaw) as "gold" | "silver";
  const form = toFormToken(formRaw) as "bar" | "coin";
  const bucket = normalizeBucket(bucketRaw);

  // Validación estricta
  if (!metal || !form || !bucket) notFound();
  const ok = await isValidBucket(metal, form, bucket);
  if (!ok) notFound();

  const h1Metal = niceMetal[metal];
  const h1Form = niceForm[form];

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16">
      {/* HERO */}
      <section className="pt-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {h1Form.slice(0, -1)} de {h1Metal.toLowerCase()} {bucket.toLowerCase()}
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              Lista curada con {h1Form.toLowerCase()} de {h1Metal.toLowerCase()} {bucket.toLowerCase()}. 
              Compara precios finales y primas frente al spot en tiendas verificadas.
            </p>
          </div>
        </div>

        <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-[hsl(var(--brand))] to-transparent" />
      </section>

      {/* SEO breve */}
      <section
        aria-label="Resumen SEO"
        className="mt-3 mb-3 rounded-lg pl-4 pr-3 py-3"
        style={{
          borderLeft: "4px solid hsl(var(--brand))",
          background: "hsl(var(--brand) / 0.05)",
        }}
      >
        <p className="mt-1 text-sm text-zinc-700">
          Comparamos precios totales y calculamos la prima frente al spot en tiempo casi real.
          El catálogo prioriza tiendas verificadas y datos homogéneos por tamaño ({bucket.toLowerCase()}).
        </p>
      </section>

      {/* TABLA prefiltrada */}
      <section className="mt-5">
        <h2 className="text-lg font-semibold">
          Catálogo: {h1Form.slice(0, -1)} de {h1Metal.toLowerCase()} {bucket.toLowerCase()}
        </h2>
        <p className="text-sm text-zinc-600 mt-1">
          Ofertas presentes en Aureya para esta combinación de metal, formato y tamaño.
        </p>
        <div className="mt-4">
          <AllIndexTable
            forceMetal={metal}
            forceForm={form}
            forceBuckets={[bucket]} // único bucket
            hideMetalFacet
            hideFormFacet
            hideBucketFacet
            dedupeMode="none"
          />
        </div>
      </section>
    </main>
  );
}
