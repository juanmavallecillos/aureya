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
} from "lucide-react";

export const revalidate = 86400; // 24h

export async function generateMetadata(): Promise<Metadata> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
  const canonical = `${base}/sobre-nosotros`;
  return {
    title: "Sobre nosotros · Aureya",
    description:
      "Aureya compara precios y primas de oro y plata en Europa con datos limpios, tiendas verificadas y una UX rápida.",
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
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Sobre nosotros</h1>
        <p className="mt-2 text-sm text-zinc-700">
          Transparencia, datos de calidad y una experiencia ultra-rápida para ayudarte a comprar bien.
        </p>
        <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-[hsl(var(--brand))] to-transparent" />
      </section>

      {/* Intro (bloque SEO) */}
      <section
        className="mt-4 rounded-lg pl-4 pr-3 py-3"
        style={{ borderLeft: "4px solid hsl(var(--brand))", background: "hsl(var(--brand) / 0.05)" }}
      >
        <h2 className="text-lg md:text-xl font-semibold text-zinc-900">Nuestra misión</h2>
        <p className="mt-1 text-sm text-zinc-700">
          Hacer sencillo comparar <strong>precio total</strong> y <strong>prima frente al spot</strong> en
          lingotes y monedas, con datos limpios de tiendas verificadas y un histórico claro para decidir.
        </p>
      </section>

      {/* Grid de “pilares” (cards premium) */}
      <section className="mt-6 grid gap-6 md:grid-cols-3">
        <article className="relative overflow-hidden rounded-2xl border bg-white shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
          <div className="absolute inset-x-0 top-0 h-1 bg-[hsl(var(--brand)/0.9)]" />
          <div className="p-5">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-[hsl(var(--brand))]" />
              <h3 className="text-base md:text-lg font-semibold text-zinc-900">Datos limpios</h3>
            </div>
            <p className="mt-2 text-sm text-zinc-700">
              Scrapers propios, normalización por formato/peso y validaciones anti-outliers para comparar
              manzanas con manzanas entre tiendas.
            </p>
          </div>
        </article>

        <article className="relative overflow-hidden rounded-2xl border bg-white shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
          <div className="absolute inset-x-0 top-0 h-1 bg-[hsl(var(--brand)/0.9)]" />
          <div className="p-5">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[hsl(var(--brand))]" />
              <h3 className="text-base md:text-lg font-semibold text-zinc-900">Primas claras</h3>
            </div>
            <p className="mt-2 text-sm text-zinc-700">
              Mostramos el <em>total</em> (producto + envío) y la prima sobre el spot por gramo. Nada de
              sorpresas al final del checkout.
            </p>
          </div>
        </article>

        <article className="relative overflow-hidden rounded-2xl border bg-white shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
          <div className="absolute inset-x-0 top-0 h-1 bg-[hsl(var(--brand)/0.9)]" />
          <div className="p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[hsl(var(--brand))]" />
              <h3 className="text-base md:text-lg font-semibold text-zinc-900">Tiendas verificadas</h3>
            </div>
            <p className="mt-2 text-sm text-zinc-700">
              Identificamos dealers con trayectoria, políticas claras y cobertura a España. Mostramos
              <strong> sello verificado</strong> cuando aplica.
            </p>
          </div>
        </article>
      </section>

      {/* Cómo trabajamos (pipeline visual) */}
      <section className="mt-8 grid gap-6 md:grid-cols-2">
        <article className="relative overflow-hidden rounded-2xl border bg-white shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
          <div className="absolute inset-x-0 top-0 h-1 bg-[hsl(var(--brand)/0.9)]" />
          <div className="p-5">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-[hsl(var(--brand))]" />
              <h3 className="text-base md:text-lg font-semibold text-zinc-900">Cómo trabajamos</h3>
            </div>
            <ul className="mt-3 space-y-2 text-sm text-zinc-700">
              <li>• Capturamos precios y stock con scrapers modulares.</li>
              <li>• Validamos contra spot y descartamos outliers por rango.</li>
              <li>• Publicamos JSON estático en CDN (SSR/ISR rápido y barato).</li>
              <li>• Mostramos histórico diario del mejor precio por SKU.</li>
            </ul>
          </div>
        </article>

        <article className="relative overflow-hidden rounded-2xl border bg-white shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
          <div className="absolute inset-x-0 top-0 h-1 bg-[hsl(var(--brand)/0.9)]" />
          <div className="p-5">
            <div className="flex items-center gap-2">
              <LineChart className="h-5 w-5 text-[hsl(var(--brand))]" />
              <h3 className="text-base md:text-lg font-semibold text-zinc-900">Rápido por diseño</h3>
            </div>
            <p className="mt-3 text-sm text-zinc-700">
              Core Web Vitals como objetivo: LCP &lt; 1.8s, INP &lt; 200ms. CDN, imágenes optimizadas y
              cachés con <code>stale-while-revalidate</code>.
            </p>
          </div>
        </article>
      </section>

      {/* Roadmap/Compromiso (mini CTA) */}
      <section className="mt-8 relative overflow-hidden rounded-2xl border bg-white shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
        <div className="absolute inset-x-0 top-0 h-1 bg-[hsl(var(--brand)/0.9)]" />
        <div className="p-5 md:p-6">
          <div className="flex items-center gap-2">
            <Blocks className="h-5 w-5 text-[hsl(var(--brand))]" />
            <h3 className="text-base md:text-lg font-semibold text-zinc-900">Compromiso de calidad</h3>
          </div>
          <p className="mt-2 text-sm text-zinc-700">
            Estamos construyendo un comparador honesto, útil y sostenible. Si detectas un precio extraño
            o una ficha mejorable, <Link href="/contacto" className="text-[hsl(var(--brand))] hover:underline">cuéntanoslo</Link>.
          </p>
          <div className="mt-3">
            <Link
              href="/tiendas"
              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium
                         bg-[hsl(var(--brand))] text-white hover:opacity-90 focus-visible:ring-2
                         focus-visible:ring-[hsl(var(--brand)/0.35)]"
            >
              Ver tiendas verificadas
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Nota legal breve */}
      <section className="mt-6 text-xs text-zinc-600">
        <p>
          Aureya no vende metales directamente (por ahora) ni ofrece asesoramiento financiero. La
          información puede cambiar y debe verificarse en la tienda antes de comprar.
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
              "Comparador de precios y primas de oro y plata en Europa. Datos limpios y tiendas verificadas.",
          }),
        }}
      />
    </main>
  );
}
