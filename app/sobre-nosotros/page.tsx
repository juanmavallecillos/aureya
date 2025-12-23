// app/sobre-nosotros/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import {
  Target,
  BarChart3,
  ShieldCheck,
  Server,
  LineChart,
  Blocks,
  ArrowRight,
  Info,
} from "lucide-react";

export const revalidate = 86400; // 24h

export async function generateMetadata(): Promise<Metadata> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
  const canonical = `${base}/sobre-nosotros`;
  return {
    title: "Sobre nosotros · Aureya",
    description:
      "Aureya es un comparador de precios y primas de oro y plata. Encuentra la mejor oferta (con envío), compara premium vs spot y consulta el histórico por producto.",
    alternates: { canonical },
    openGraph: { url: canonical, title: "Sobre nosotros · Aureya", type: "website" },
    twitter: { card: "summary_large_image", title: "Sobre nosotros · Aureya" },
    robots: { index: true, follow: true },
  };
}

export default function AboutPage() {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/, "");

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16">
      {/* Título + hairline */}
      <section className="pt-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Sobre Aureya</h1>
        <p className="mt-2 text-sm text-zinc-700">
          Un comparador para comprar <strong>oro y plata</strong> con más claridad:{" "}
          <strong>precio total</strong>, <strong>premium vs spot</strong> e <strong>histórico</strong>.
        </p>
        <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-[hsl(var(--brand))] to-transparent" />
      </section>

      {/* Intro (bloque SEO) */}
      <section
        className="mt-4 rounded-lg pl-4 pr-3 py-3"
        style={{ borderLeft: "4px solid hsl(var(--brand))", background: "hsl(var(--brand) / 0.05)" }}
      >
        <h2 className="text-lg md:text-xl font-semibold text-zinc-900">Qué te aporta Aureya</h2>
        <p className="mt-1 text-sm text-zinc-700">
          Aureya reúne ofertas de tiendas y las normaliza para que puedas comparar de verdad:{" "}
          <strong>total (producto + envío)</strong> cuando es posible, <strong>€/g</strong> y{" "}
          <strong>premium</strong> frente al spot. En cada ficha verás también el{" "}
          <strong>histórico del mejor precio diario</strong>.
        </p>
      </section>

      {/* Grid de “pilares” */}
      <section className="mt-6 grid gap-6 md:grid-cols-3">
        <article className="relative overflow-hidden rounded-2xl bg-white ring-1 ring-inset ring-zinc-200 shadow-sm transition-shadow hover:shadow-md">
          <div className="absolute inset-x-0 top-0 h-1 bg-[hsl(var(--brand)/0.9)]" />
          <div className="p-5">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-[hsl(var(--brand))]" />
              <h3 className="text-base md:text-lg font-semibold text-zinc-900">Comparar sin líos</h3>
            </div>
            <p className="mt-2 text-sm text-zinc-700">
              Ordenamos por <strong>precio real</strong> y métricas útiles. Si buscas “la más barata”,
              mira el <strong>total</strong>; si comparas tamaños, fíjate en <strong>€/g</strong>.
            </p>
          </div>
        </article>

        <article className="relative overflow-hidden rounded-2xl bg-white ring-1 ring-inset ring-zinc-200 shadow-sm transition-shadow hover:shadow-md">
          <div className="absolute inset-x-0 top-0 h-1 bg-[hsl(var(--brand)/0.9)]" />
          <div className="p-5">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[hsl(var(--brand))]" />
              <h3 className="text-base md:text-lg font-semibold text-zinc-900">Premium vs spot</h3>
            </div>
            <p className="mt-2 text-sm text-zinc-700">
              El <strong>premium</strong> indica cuánto pagas por encima del valor intrínseco del metal
              (según <em>spot</em>). Te ayuda a comparar entre productos, marcas y momentos.
            </p>
          </div>
        </article>

        <article className="relative overflow-hidden rounded-2xl bg-white ring-1 ring-inset ring-zinc-200 shadow-sm transition-shadow hover:shadow-md">
          <div className="absolute inset-x-0 top-0 h-1 bg-[hsl(var(--brand)/0.9)]" />
          <div className="p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[hsl(var(--brand))]" />
              <h3 className="text-base md:text-lg font-semibold text-zinc-900">Tiendas verificadas</h3>
            </div>
            <p className="mt-2 text-sm text-zinc-700">
              Señalamos tiendas con información clara y trayectoria. El sello <strong>verificado</strong>{" "}
              significa que la tienda ha sido revisada y que hay señales consistentes de fiabilidad,
              pero <strong>siempre</strong> debes confirmar condiciones finales en su web.
            </p>
          </div>
        </article>
      </section>

      {/* Cómo leer Aureya (útil para el usuario) */}
      <section className="mt-8 grid gap-6 md:grid-cols-2">
        <article className="relative overflow-hidden rounded-2xl bg-white ring-1 ring-inset ring-zinc-200 shadow-sm transition-shadow hover:shadow-md">
          <div className="absolute inset-x-0 top-0 h-1 bg-[hsl(var(--brand)/0.9)]" />
          <div className="p-5">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-[hsl(var(--brand))]" />
              <h3 className="text-base md:text-lg font-semibold text-zinc-900">Cómo leer una ficha</h3>
            </div>
            <ul className="mt-3 space-y-2 text-sm text-zinc-700">
              <li>• <strong>Mejor oferta</strong>: la combinación más barata disponible.</li>
              <li>• <strong>Precio</strong>: suele ser sin envío (según datos disponibles).</li>
              <li>• <strong>Total</strong>: producto + envío cuando se puede estimar.</li>
              <li>• <strong>€/g</strong>: útil para comparar tamaños diferentes.</li>
              <li>• <strong>Histórico</strong>: mejor precio diario detectado para ese SKU.</li>
            </ul>
            <p className="mt-3 text-xs text-zinc-600">
              Nota: algunos comercios confirman el envío en checkout; en esos casos el “total” puede ser
              orientativo.
            </p>
          </div>
        </article>

        <article className="relative overflow-hidden rounded-2xl bg-white ring-1 ring-inset ring-zinc-200 shadow-sm transition-shadow hover:shadow-md">
          <div className="absolute inset-x-0 top-0 h-1 bg-[hsl(var(--brand)/0.9)]" />
          <div className="p-5">
            <div className="flex items-center gap-2">
              <LineChart className="h-5 w-5 text-[hsl(var(--brand))]" />
              <h3 className="text-base md:text-lg font-semibold text-zinc-900">Histórico y alertas</h3>
            </div>
            <p className="mt-3 text-sm text-zinc-700">
              El histórico te sirve para saber si hoy estás comprando caro o barato para ese producto.
              En el futuro iremos añadiendo <strong>alertas</strong> y seguimiento de precios.
            </p>
            <p className="mt-3 text-sm text-zinc-700">
              Si ves algo raro (p. ej. un salto de precio),{" "}
              <Link href="/contacto" className="text-[hsl(var(--brand))] hover:underline">
                avísanos
              </Link>
              .
            </p>
          </div>
        </article>
      </section>

      {/* Cómo se actualizan los datos */}
      <section className="mt-8 relative overflow-hidden rounded-2xl bg-white ring-1 ring-inset ring-zinc-200 shadow-sm transition-shadow hover:shadow-md">
        <div className="absolute inset-x-0 top-0 h-1 bg-[hsl(var(--brand)/0.9)]" />
        <div className="p-5 md:p-6">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-[hsl(var(--brand))]" />
            <h3 className="text-base md:text-lg font-semibold text-zinc-900">Actualización de datos</h3>
          </div>
          <p className="mt-2 text-sm text-zinc-700">
            Los precios y el stock cambian a menudo. Aureya actualiza los datos de forma periódica y
            publica resultados en un <strong>CDN</strong> para que la web cargue rápido. En cada ficha
            verás la hora de “Actualizado”.
          </p>
          <p className="mt-3 text-sm text-zinc-700">
            Nuestro objetivo es ser <strong>discretos</strong> y eficientes: pocas peticiones y máxima
            reutilización de caché.
          </p>
        </div>
      </section>

      {/* Compromiso / CTA */}
      <section className="mt-8 relative overflow-hidden rounded-2xl bg-white ring-1 ring-inset ring-zinc-200 shadow-sm transition-shadow hover:shadow-md">
        <div className="absolute inset-x-0 top-0 h-1 bg-[hsl(var(--brand)/0.9)]" />
        <div className="p-5 md:p-6">
          <div className="flex items-center gap-2">
            <Blocks className="h-5 w-5 text-[hsl(var(--brand))]" />
            <h3 className="text-base md:text-lg font-semibold text-zinc-900">Transparencia y neutralidad</h3>
          </div>
          <p className="mt-2 text-sm text-zinc-700">
            Aureya no vende metales directamente (por ahora) ni ofrece asesoramiento financiero.
            Mostramos información para comparar, pero la compra siempre se hace en la tienda.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/tiendas"
              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium
                         bg-[hsl(var(--brand))] text-white hover:opacity-90 focus-visible:ring-2
                         focus-visible:ring-[hsl(var(--brand)/0.35)]"
            >
              Ver tiendas
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contacto"
              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium
                         border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50
                         focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand)/0.35)]"
            >
              Contacto
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Nota legal breve */}
      <section className="mt-6 text-xs text-zinc-600">
        <p>
          Los precios, disponibilidad y costes de envío pueden variar. Antes de comprar, revisa siempre
          la información final en la web del vendedor. Consulta también el{" "}
          <Link href="/aviso-legal" className="text-[hsl(var(--brand))] hover:underline">
            Aviso legal
          </Link>
          .
        </p>
      </section>

      {/* JSON-LD Organization */}
      <script
        type="application/ld+json"
        // @ts-ignore
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Aureya",
            url: base || undefined,
            description:
              "Comparador de precios y primas de oro y plata. Muestra precio total, premium vs spot e histórico por producto.",
          }),
        }}
      />
    </main>
  );
}
