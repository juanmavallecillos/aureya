import type { Metadata } from "next";
import Link from "next/link";

/* =======================
   SEO estático
======================= */
export const metadata: Metadata = {
  title: "Metales de inversión • Aureya",
  description:
    "Explora metales de inversión en Aureya: oro y plata (próximamente platino y paladio). Compara primas sobre spot y encuentra el mejor precio.",
  openGraph: {
    title: "Metales de inversión • Aureya",
    description:
      "Explora metales de inversión en Aureya: oro y plata (próximamente platino y paladio).",
    type: "website",
  },
  alternates: { canonical: "/metales" },
  robots: { index: true, follow: true },
};

/* =======================
   Data local (cards)
======================= */
type MetalCard = {
  key: "gold" | "silver" | "platinum" | "palladium";
  label: string;
  href?: string; // si falta → “Próximamente”
  description: string;
  tone: string; // clases para la píldora de color
  shortcuts?: { href: string; label: string }[];
};

const METALS: MetalCard[] = [
  {
    key: "gold",
    label: "Oro",
    href: "/oro",
    description: "Lingotes y monedas de oro. Compara primas y disponibilidad.",
    tone: "bg-amber-50 text-amber-700 ring-amber-200",
    shortcuts: [
      { href: "/oro/lingotes", label: "Lingotes" },
      { href: "/oro/monedas", label: "Monedas" },
    ],
  },
  {
    key: "silver",
    label: "Plata",
    href: "/plata",
    description:
      "Lingotes y monedas de plata. Seguimiento de precios y mejores ofertas.",
    tone: "bg-zinc-50 text-zinc-700 ring-zinc-200",
    shortcuts: [
      { href: "/plata/lingotes", label: "Lingotes" },
      { href: "/plata/monedas", label: "Monedas" },
    ],
  },
  {
    key: "platinum",
    label: "Platino",
    description: "Añadiremos pronto comparativa de platino de inversión.",
    tone: "bg-violet-50 text-violet-700 ring-violet-200",
  },
  {
    key: "palladium",
    label: "Paladio",
    description: "Planeado para próximas iteraciones del comparador.",
    tone: "bg-sky-50 text-sky-700 ring-sky-200",
  },
];

/* =======================
   Página
======================= */
export default function MetalsPage() {
  // JSON-LD ItemList para SEO
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: METALS.map((m, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: m.label,
      url: m.href ? `https://aureya.es${m.href}` : "https://aureya.es/metales",
    })),
  };

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16">
      {/* HERO */}
      <section className="pt-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Metales de inversión
        </h1>
        <p className="mt-1 text-sm text-zinc-600 max-w-[70ch]">
          Selecciona un metal para ver su catálogo de <em>lingotes</em> y{" "}
          <em>monedas</em>, con primas frente al spot y actualización periódica
          de ofertas. Hoy dispones de <strong>oro</strong> y{" "}
          <strong>plata</strong>;<span className="whitespace-pre"> </span>
          <span className="text-zinc-700">platino</span> y{" "}
          <span className="text-zinc-700">paladio</span> llegarán pronto.
        </p>
        <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-[hsl(var(--brand))] to-transparent" />
      </section>

      {/* CARDS */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        {METALS.map((m) => {
          return (
            <div
              key={m.key}
              className={[
                "rounded-2xl border ring-1 ring-inset bg-white p-4",
                "border-zinc-200/80 ring-zinc-200 shadow-sm hover:shadow-md transition-shadow",
                m.href ? "" : "opacity-75",
              ].join(" ")}
            >
              {/* Cabecera: título enlazable + pill */}
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-zinc-900">
                  {m.href ? (
                    <Link
                      href={m.href}
                      className="hover:underline decoration-[hsl(var(--brand))] underline-offset-2"
                      aria-label={`Ir a ${m.label}`}
                    >
                      {m.label}
                    </Link>
                  ) : (
                    m.label
                  )}
                </h2>
                <span
                  className={[
                    "rounded-full px-2.5 py-0.5 text-[11px] ring-1",
                    m.tone,
                  ].join(" ")}
                >
                  {m.href ? "Disponible" : "Próximamente"}
                </span>
              </div>

              <p className="mt-1.5 text-sm text-zinc-700">{m.description}</p>

              {/* Atajos */}
              {m.shortcuts?.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {m.shortcuts.map((s) => (
                    <Link
                      key={s.href}
                      href={s.href}
                      className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs hover:bg-zinc-50"
                      aria-label={`${m.label}: ${s.label}`}
                    >
                      {s.label}
                      <svg
                        viewBox="0 0 24 24"
                        className="h-3.5 w-3.5"
                        aria-hidden
                      >
                        <path
                          fill="currentColor"
                          d="M10 6l6 6-6 6-1.4-1.4L12.2 12 8.6 7.4 10 6z"
                        />
                      </svg>
                    </Link>
                  ))}
                </div>
              ) : null}

              {/* CTA principal */}
              <div className="mt-4">
                {m.href ? (
                  <Link
                    href={m.href}
                    className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium btn-brand"
                  >
                    Explorar {m.label}
                    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                      <path
                        fill="currentColor"
                        d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3ZM5 5h6v2H7v10h10v-4h2v6H5V5Z"
                      />
                    </svg>
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium bg-zinc-100 text-zinc-700">
                    En preparación
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </section>

      {/* Bloque SEO breve (coherente con secciones) */}
      <section
        aria-label="Resumen SEO"
        className="mt-8 mb-2 rounded-lg pl-4 pr-3 py-3"
        style={{
          borderLeft: "4px solid hsl(var(--brand))",
          background: "hsl(var(--brand) / 0.05)",
        }}
      >
        <p className="text-sm text-zinc-700">
          En Aureya reunimos precios reales por metal y calculamos la{" "}
          <strong>prima frente al spot</strong> para que puedas comparar con
          claridad. Trabajamos con tiendas verificadas y actualizamos el índice
          con frecuencia.
        </p>
      </section>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        // @ts-ignore – string intencional para el DOM
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
      />
    </main>
  );
}
