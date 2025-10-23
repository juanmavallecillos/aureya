// app/tiendas/page.tsx
import DealerCard from "@/components/DealerCard";
import MicroFAQ from "@/components/MicroFAQ";
import { fetchJsonOrNullServer as fetchJsonOrNull } from "@/lib/cdn-server";
import type { DealerMeta } from "@/lib/useDealerMeta";
import { getFaq, faqToJsonLd } from "@/lib/faqData";
import type { Metadata } from "next";

type Offer = { dealer_id: string; metal?: string; form?: string };

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Tiendas verificadas de oro y plata • Aureya",
  description:
    "Directorio de tiendas verificadas de oro y plata en España y Europa. Compara precios finales y primas frente al spot en lingotes y monedas.",
  alternates: { canonical: "/tiendas" },
  openGraph: {
    title: "Tiendas verificadas de oro y plata • Aureya",
    description:
      "Listado de dealers verificados. Catálogo filtrado por tienda, metal y formato.",
  },
  twitter: { card: "summary" },
};

// normalizaciones consistentes con el resto de la app
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

export default async function TiendasPage() {
  // 1) Metadatos de tiendas
  const dealersMeta =
    (await fetchJsonOrNull<DealerMeta>("meta/dealers.json", {
      revalidate: 300,                 // 5 min
      tags: ["dealers"],
    })) ?? {};

  // 2) Índice global de ofertas
  const allOffersDoc =
    (await fetchJsonOrNull<{ offers: Offer[] }>("prices/index/all_offers.json", {
      revalidate: 300,                 // 5 min
      tags: ["all_offers"],
    })) ?? { offers: [] };

  const offers = Array.isArray(allOffersDoc.offers) ? allOffersDoc.offers : [];

  // 3) Agrupar por dealer_id
  type Agg = { offersCount: number; metals: Set<string>; forms: Set<string> };
  const agg: Record<string, Agg> = {};
  for (const o of offers) {
    const id = o?.dealer_id?.toLowerCase?.() || o?.dealer_id || "";
    if (!id) continue;
    if (!agg[id]) agg[id] = { offersCount: 0, metals: new Set(), forms: new Set() };
    agg[id].offersCount++;
    if (o.metal) agg[id].metals.add(toMetalToken(o.metal));
    if (o.form) agg[id].forms.add(toFormToken(o.form));
  }

  // 4) Tarjetas SOLO para tiendas presentes en dealers.json
  const cards = Object.entries(dealersMeta)
    .map(([slugRaw, meta]) => {
      const slug = slugRaw.toLowerCase();
      const a = agg[slug];
      return {
        slug,
        meta,
        offersCount: a?.offersCount ?? 0,
        metals: a ? Array.from(a.metals) : [],
        forms: a ? Array.from(a.forms) : [],
      };
    })
    .sort((a, b) => (a.meta.label || "").localeCompare(b.meta.label || ""));

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: cards.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `/tiendas/${c.slug}`,
      name: c.meta.label,
    })),
  };

  // FAQ
  const faqItems = getFaq("tiendas");
  const faqLd = faqToJsonLd(faqItems);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      {/* HEADER */}
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Tiendas verificadas</h1>
        <p className="text-sm text-zinc-600 mt-1">
          Explora comercios con presencia en España y Europa. Entra a la ficha de cada tienda
          para ver su catálogo filtrado (oro, plata, lingotes, monedas), mejores precios y
          detalles de operativa.
        </p>
      </header>
      <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-[hsl(var(--brand))] to-transparent" />

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
          En Aureya centralizamos ofertas públicas de casas y mayoristas de metales preciosos.
          Mostramos <strong>precio final</strong> y <strong>prima frente al <em>spot</em></strong> para
          comparar de forma homogénea entre tiendas verificadas.
        </p>
        <p className="mt-2 text-sm text-zinc-700">
          Servimos vía CDN para cargas rápidas. Consulta condiciones de envío y pago en cada ficha
          de tienda.
        </p>
      </section>

      {/* GRID de tiendas */}
      <section className="mt-5 grid gap-4 md:grid-cols-2">
        {cards.map(({ slug, meta, offersCount, metals, forms }) => (
          <DealerCard
            key={slug}
            slug={slug}
            meta={{
              label: meta.label,
              country: meta.country,
              url: meta.url,
              verified: meta.verified,
            }}
            offersCount={offersCount}
            metals={metals}
            forms={forms}
          />
        ))}
      </section>

      {/* Enlaces útiles */}
      <p className="mt-6 text-xs text-zinc-500">
        Consejo: también puedes empezar por las categorías más populares:{" "}
        <a href="/oro/lingotes/1oz" className="underline underline-offset-2 hover:text-zinc-900">
          lingote de oro 1 oz
        </a>{" "}
        ·{" "}
        <a href="/oro/lingotes/100g" className="underline underline-offset-2 hover:text-zinc-900">
          lingote de oro 100 g
        </a>{" "}
        ·{" "}
        <a href="/plata/monedas/1oz" className="underline underline-offset-2 hover:text-zinc-900">
          monedas de plata 1 oz
        </a>
        .
      </p>

      {/* FAQ */}
      <section className="mx-auto max-w-[68ch] pb-14 pt-10">
        <MicroFAQ items={faqItems} />
        <script
          type="application/ld+json"
          // @ts-ignore JSON string para el DOM
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
      </section>

      {/* JSON-LD ItemList */}
      <script
        type="application/ld+json"
        // @ts-ignore: JSON string expected by the DOM
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
      />
    </main>
  );
}
