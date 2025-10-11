import type { Metadata } from "next";
import Link from "next/link";
import AllIndexTable from "@/components/AllIndexTable";
import BucketLinks from "@/components/BucketLinks";
import MicroFAQ from "@/components/MicroFAQ";
import { getFaq, faqToJsonLd } from "@/lib/faqData";

export const metadata: Metadata = {
  title: "Monedas de oro • Aureya",
  description:
    "Compara precios y primas vs spot en monedas de oro. Tiendas verificadas, datos homogéneos y filtros por tamaño.",
  alternates: { canonical: "/oro/monedas" },
};

export default function MonedasOroPage() {
  // FAQ de la sección
  const faqItems = getFaq("oro-monedas");
  const faqLd = faqToJsonLd(faqItems);
  return (
    <main className="mx-auto max-w-6xl px-4 pb-16">
      {/* HERO */}
      <section className="pt-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Monedas de oro
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              Compara precios finales y prima frente al spot en monedas de oro
              de tiendas verificadas. Filtra por tamaño y encuentra el mejor total.
            </p>

            {/* Atajos a tamaños populares */}
            <BucketLinks metal="gold" form="coin" baseHref="/oro/monedas" className="mt-3" />
          </div>
        </div>

        {/* Línea de acento dorada */}
        <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-[hsl(var(--brand))] to-transparent" />
      </section>

      {/* SEO breve con borde lateral dorado */}
      <section
        aria-label="Resumen SEO"
        className="mt-3 mb-3 rounded-lg pl-4 pr-3 py-3"
        style={{
          borderLeft: "4px solid hsl(var(--brand))",
          background: "hsl(var(--brand) / 0.05)",
        }}
      >
        <p className="mt-1 text-sm text-zinc-700">
          Estandarizamos precios y calculamos la prima frente al spot para que compares
          monedas de oro con criterios homogéneos. Transparencia, seguridad y tiendas verificadas.
        </p>
      </section>

      {/* TABLA prefiltrada */}
      <section className="mt-5">
        <h2 className="text-lg font-semibold">Catálogo de monedas de oro</h2>
        <p className="text-sm text-zinc-600 mt-1">
          Ofertas presentes en Aureya para monedas de oro (filtra por tamaño).
        </p>
        <div className="mt-4">
          <AllIndexTable
            forceMetal="gold"
            forceForm="coin"
            hideMetalFacet
            hideFormFacet
          />
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
