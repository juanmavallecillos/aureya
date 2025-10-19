import { fetchJsonOrNullServer } from "@/lib/cdn-server";
import AllIndexTable from "@/components/AllIndexTable.server";
import MicroFAQ from "@/components/MicroFAQ";
import { getFaq, faqToJsonLd } from "@/lib/faqData";

export const revalidate = 300;

export default async function HomePage() {
  const manifest = await fetchJsonOrNullServer<any>("prices/index/manifest.json", { revalidate: 300 });

  if (!manifest) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Aureya</h1>
        <p className="mt-2 text-zinc-600">Estamos preparando los datos. Vuelve en unos minutos.</p>
      </main>
    );
  }
  const faqItems = getFaq("home");
  const faqLd = faqToJsonLd(faqItems);

  return (
    <main className="min-h-screen">
      {/* Contenedor único para H1, intro y tabla */}
      <div className="mx-auto max-w-6xl px-4 pt-6">
        {/* Hero */}
        <section>
          <h1 className="text-2xl font-semibold tracking-tight">Comparador de Oro y Plata</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Filtra por metal, formato, tamaño y tienda. Prima real sobre spot y mejor oferta al instante.
          </p>
        </section>

        {/* Intro SEO: más sutil, sin “card”, con acento Aureya */}
        <section
          className="mt-3 mb-3 rounded-lg pl-4 pr-3 py-3"
          style={{
            borderLeft: "4px solid hsl(var(--brand))",
            background: "hsl(var(--brand) / 0.05)", // quítalo si lo prefieres 100% blanco
          }}
        >
          <h2 className="text-lg md:text-xl font-semibold text-zinc-900">
            Mejores precios de oro y plata en España y Europa
          </h2>

          <p className="mt-1 text-sm text-zinc-700">
            Compara <strong>primas</strong> y precios reales de lingotes y monedas en tiendas europeas verificadas.
            Calculamos la prima frente al <em>spot</em> en €/g y €/oz y actualizamos con frecuencia para que veas
            ofertas reales en el momento. <span className="opacity-80">Cobertura actual: oro y plata
            <span className="opacity-60">; platino y paladio, próximamente.</span></span>
          </p>

          <p className="mt-2 text-sm text-zinc-700">Empieza por los tamaños más demandados o navega por formato:</p>

          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm">
            <a href="/oro/lingotes/1oz"   className="underline decoration-[hsl(var(--brand))] underline-offset-2 hover:text-zinc-900">Lingote de oro 1&nbsp;oz</a>
            <span aria-hidden className="text-zinc-400">•</span>
            <a href="/oro/lingotes/100g"  className="underline decoration-[hsl(var(--brand))] underline-offset-2 hover:text-zinc-900">Lingote de oro 100&nbsp;g</a>
            <span aria-hidden className="text-zinc-400">•</span>
            <a href="/oro/monedas"        className="underline decoration-[hsl(var(--brand))] underline-offset-2 hover:text-zinc-900">Monedas de oro</a>
            <span aria-hidden className="text-zinc-400">•</span>
            <a href="/plata/monedas/1oz"  className="underline decoration-[hsl(var(--brand))] underline-offset-2 hover:text-zinc-900">Monedas de plata 1&nbsp;oz</a>
            <span aria-hidden className="text-zinc-400">•</span>
            <a href="/plata/lingotes/1kg" className="underline decoration-[hsl(var(--brand))] underline-offset-2 hover:text-zinc-900">Lingote de plata 1&nbsp;kg</a>
          </div>

          <p className="mt-2 text-xs text-zinc-500">
            Nota: la prima se calcula sin incluir envío. No es asesoramiento financiero.
          </p>
        </section>

        {/* Tabla principal (mismo contenedor y ancho que el resto) */}
        <section className="mb-8">
          <AllIndexTable manifest={manifest} />
        </section>
      </div>

      {/* SEO copy ampliado: texto suelto, sin “card” */}
      <section
        aria-labelledby="guia-aureya"
        className="mx-auto max-w-4xl px-4 pb-14 text-sm text-zinc-700 leading-relaxed space-y-10"
      >
        <h2 id="guia-aureya" className="sr-only">Guía de compra de oro y plata</h2>

        {/* 1) Prima */}
        <article id="como-calculamos-la-prima">
          <h3 className="text-base font-semibold mb-2">Cómo calculamos la prima</h3>
          <p>
            La <strong>prima</strong> es la diferencia entre el precio de venta y el valor intrínseco del metal.
            Usamos esta fórmula:
          </p>
          <pre className="mt-2 text-xs bg-zinc-50 border rounded p-3 overflow-x-auto">
            Prima (%) = (Precio – Spot(€/g) × Peso(g)) / (Spot(€/g) × Peso(g)) × 100
          </pre>
          <ul className="list-disc pl-5 mt-3 space-y-1">
            <li><strong>Sin envío:</strong> la prima se calcula sin incluir gastos de envío.</li>
            <li><strong>Oro:</strong> comparamos frente a spot €/g actualizado.</li>
            <li><strong>Plata:</strong> por defecto usamos spot €/g; en contextos nacionales puede considerarse spot+IVA para evaluar el precio final.</li>
          </ul>
          <p className="mt-2 text-xs text-zinc-500">
            Aviso: No es asesoramiento financiero.
          </p>
        </article>

        {/* 2) Elección de tamaño/formato */}
        <article id="como-elegir-tamano">
          <h3 className="text-base font-semibold mb-2">Cómo elegir tamaño y formato</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Mejor prima</strong> en formatos grandes:
              <a className="ml-1 underline underline-offset-2 decoration-[hsl(var(--brand))]" href="/oro/lingotes/100g">lingote de oro 100&nbsp;g</a> y
              <a className="ml-1 underline underline-offset-2 decoration-[hsl(var(--brand))]" href="/plata/lingotes/1kg">lingote de plata 1&nbsp;kg</a>.
            </li>
            <li>
              <strong>Mejor liquidez</strong> en tamaños populares:
              <a className="ml-1 underline underline-offset-2 decoration-[hsl(var(--brand))]" href="/oro/lingotes/1oz">lingote de oro 1&nbsp;oz</a> y
              <a className="ml-1 underline underline-offset-2 decoration-[hsl(var(--brand))]" href="/plata/monedas/1oz">moneda de plata 1&nbsp;oz</a>.
            </li>
            <li>
              <strong>Formato</strong>: lingote (prima más baja) vs
              <a className="ml-1 underline underline-offset-2 decoration-[hsl(var(--brand))]" href="/oro/monedas">moneda</a> (mayor reconocimiento/coleccionismo).
            </li>
            <li>
              <strong>Marcas reconocidas</strong> (ejemplos): SEMPSA, PAMP, Argor-Heraeus, C&nbsp;Hafner.
            </li>
          </ul>
        </article>

        {/* 3) Procedencia y actualización de datos */}
        <article id="como-mantenemos-los-datos">
          <h3 className="text-base font-semibold mb-2">Cómo mantenemos los datos</h3>
          <p>
            Agregamos precios de varias tiendas y publicamos el <strong>mejor precio diario por SKU</strong>.
            El listado muestra la <em>prima frente a spot</em> y enlaza a la tienda oficial. Nuestro backend
            cachea y sirve los datos vía CDN para que veas cambios con rapidez.
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            Consejo: usa los filtros por formato, tamaño y tienda para detectar <em>primas fuera de rango</em> y oportunidades puntuales.
          </p>
        </article>
      </section>

      <section className=" mx-auto max-w-6xl px-4 pb-14">
        <div className="mx-auto max-w-[68ch]">
          <MicroFAQ items={faqItems}/>
        </div>
      </section>

      {/* FAQ JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
    </main>
  );
}
