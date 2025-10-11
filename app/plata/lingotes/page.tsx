import type { Metadata } from "next";
import Link from "next/link";
import AllIndexTable from "@/components/AllIndexTable";
import BucketLinks from "@/components/BucketLinks";
import MicroFAQ from "@/components/MicroFAQ";
import { getFaq, faqToJsonLd } from "@/lib/faqData";

export const metadata: Metadata = {
  title: "Lingotes de plata • Aureya",
  description:
    "Compara precios y primas vs spot en lingotes de plata. Tiendas verificadas, datos homogéneos y filtros por tamaño.",
  alternates: { canonical: "/plata/lingotes" },
};

export default function LingotesPlataPage() {
  // FAQ de la sección
  const faqItems = getFaq("plata-lingotes");
  const faqLd = faqToJsonLd(faqItems);
  return (
    <main className="mx-auto max-w-6xl px-4 pb-16">
      {/* HERO */}
      <section className="pt-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Lingotes de plata
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              Compara precios finales y prima frente al spot en lingotes de plata
              de tiendas verificadas. Filtra por tamaño y encuentra el mejor total.
            </p>

            {/* Atajos a tamaños populares */}
            <BucketLinks metal="silver" form="bar" baseHref="/plata/lingotes" className="mt-3" />
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
          Agregamos precios y calculamos la prima frente al spot para comparar lingotes
          de plata con criterios homogéneos por tamaño. Priorizamos transparencia y tiendas verificadas.
        </p>
      </section>

      {/* TABLA prefiltrada */}
      <section className="mt-5">
        <h2 className="text-lg font-semibold">Catálogo de lingotes de plata</h2>
        <p className="text-sm text-zinc-600 mt-1">
          Ofertas presentes en Aureya para lingotes de plata (filtra por tamaño).
        </p>
        <div className="mt-4">
          <AllIndexTable
            forceMetal="silver"
            forceForm="bar"
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
