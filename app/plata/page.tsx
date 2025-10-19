import type { Metadata } from "next";
import Link from "next/link";
import AllIndexTable from "@/components/AllIndexTable.server";
import MicroFAQ from "@/components/MicroFAQ";
import { getFaq, faqToJsonLd } from "@/lib/faqData";

export const metadata: Metadata = {
  title: "Plata de inversión • Aureya",
  description:
    "Compara precios de plata de inversión en tiendas verificadas: lingotes y monedas. Prima vs spot y disponibilidad.",
};

export default async function PlataPage() {
  // FAQ de la sección
  const faqItems = getFaq("plata");
  const faqLd = faqToJsonLd(faqItems);
  return (
    <main className="mx-auto max-w-6xl px-4 pb-16">
      {/* HERO */}
      <section className="pt-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Plata de inversión
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              Lingotes y monedas de plata en tiendas verificadas. Compara primas sobre spot
              y disponibilidad en cada oferta.
            </p>

            {/* Atajos */}
            <nav aria-label="Atajos de categoría" className="mt-3">
              <ul className="flex flex-wrap gap-3 text-sm">
                <li>
                  <Link
                    href="/plata/lingotes"
                    className="underline decoration-[hsl(var(--brand))] underline-offset-[3px] hover:opacity-90"
                  >
                    Lingotes de plata
                  </Link>
                </li>
                <li>
                  <Link
                    href="/plata/monedas"
                    className="underline decoration-[hsl(var(--brand))] underline-offset-[3px] hover:opacity-90"
                  >
                    Monedas de plata
                  </Link>
                </li>
                <li>
                  <Link
                    href="/plata/lingotes/1kg"
                    className="underline decoration-[hsl(var(--brand))] underline-offset-[3px] hover:opacity-90"
                  >
                    Lingotes 1 kg
                  </Link>
                </li>
                <li>
                  <Link
                    href="/plata/monedas/1oz"
                    className="underline decoration-[hsl(var(--brand))] underline-offset-[3px] hover:opacity-90"
                  >
                    Monedas 1 oz
                  </Link>
                </li>
              </ul>
            </nav>
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
          Centralizamos precios finales y stock para comparar plata de inversión con criterios
          homogéneos. Calculamos la prima frente al spot y priorizamos tiendas verificadas para
          una decisión de compra informada.
        </p>
      </section>

      {/* TABLA (sin prefiltrar aún, lo haremos después) */}
      <section className="mt-5">
        <h2 className="text-lg font-semibold">Catálogo de plata</h2>
        <p className="text-sm text-zinc-600 mt-1">
          Ofertas presentes en Aureya para plata de inversión.
        </p>
        <div className="mt-4">
          <AllIndexTable forceMetal="silver" hideMetalFacet />
        </div>
      </section>
      <section className="mx-auto max-w-[68ch] mt-10">
        <MicroFAQ items={faqItems} />
        <script
          type="application/ld+json"
          // @ts-ignore JSON string para el DOM
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
      </section>
    </main>
  );
}
