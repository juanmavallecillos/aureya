import type { Metadata } from "next";
import Link from "next/link";
import AllIndexTable from "@/components/AllIndexTable";
import MicroFAQ from "@/components/MicroFAQ";
import { getFaq, faqToJsonLd } from "@/lib/faqData";

export const metadata: Metadata = {
  title: "Oro de inversión • Aureya",
  description:
    "Compara precios de oro de inversión en tiendas verificadas: lingotes y monedas. Prima vs spot y disponibilidad en un vistazo.",
};

export default async function OroPage() {
  // FAQ de la sección
  const faqItems = getFaq("oro");
  const faqLd = faqToJsonLd(faqItems);
  return (
    <main className="mx-auto max-w-6xl px-4 pb-16">
      {/* HERO */}
      <section className="pt-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Oro de inversión
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              Lingotes y monedas de oro en tiendas verificadas. Compara primas sobre spot
              y encuentra el mejor precio final.
            </p>

            {/* Atajos */}
            <nav aria-label="Atajos de categoría" className="mt-3">
              <ul className="flex flex-wrap gap-3 text-sm">
                <li>
                  <Link
                    href="/oro/lingotes"
                    className="underline decoration-[hsl(var(--brand))] underline-offset-[3px] hover:opacity-90"
                  >
                    Lingotes de oro
                  </Link>
                </li>
                <li>
                  <Link
                    href="/oro/monedas"
                    className="underline decoration-[hsl(var(--brand))] underline-offset-[3px] hover:opacity-90"
                  >
                    Monedas de oro
                  </Link>
                </li>
                <li>
                  <Link
                    href="/oro/lingotes/100g"
                    className="underline decoration-[hsl(var(--brand))] underline-offset-[3px] hover:opacity-90"
                  >
                    Lingotes 100 g
                  </Link>
                </li>
                <li>
                  <Link
                    href="/oro/monedas/1oz"
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
          En Aureya agregamos ofertas reales de oro de inversión y calculamos la prima frente
          al spot para ayudarte a decidir con datos claros. Trabajamos con tiendas verificadas
          y actualizaciones frecuentes para priorizar transparencia y seguridad.
        </p>
      </section>

      {/* TABLA (sin prefiltrar aún, lo haremos después) */}
      <section className="mt-5">
        <h2 className="text-lg font-semibold">Catálogo de oro</h2>
        <p className="text-sm text-zinc-600 mt-1">
          Ofertas presentes en Aureya para oro de inversión.
        </p>
        <div className="mt-4">
          <AllIndexTable forceMetal="gold" hideMetalFacet />
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
