// app/blog/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { fetchJson } from "@/lib/cdn";

export const revalidate = 600; // 10 min

type Post = {
  slug: string;               // ej: "como-comprar-oro-en-espana"
  title: string;              // ej: "Cómo comprar oro en España (guía 2025)"
  excerpt?: string | null;    // breve resumen
  date?: string | null;       // ISO string
  author?: string | null;     // opcional
  cover?: string | null;      // ej: "media/blog/como-comprar-oro/front-1200.webp"
  tags?: string[] | null;     // ej: ["oro","impuestos"]
};

type BlogIndex = {
  updated_at?: string;
  posts: Post[];
};

// Helpers
const toCdn = (p?: string | null) =>
  p ? (p.startsWith("/api/cdn?path=") ? p : `/api/cdn?path=${encodeURIComponent(p)}`) : "";

function fmtDate(d?: string | null) {
  if (!d) return "";
  const dt = new Date(d);
  return isNaN(+dt) ? "" : dt.toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" });
}

export async function generateMetadata(): Promise<Metadata> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
  const canonical = `${base}/blog`;
  return {
    title: "Blog · Aureya",
    description:
      "Guías y comparativas sobre oro, plata y metales preciosos: primas, impuestos, tiendas, inversión y más.",
    alternates: { canonical },
    openGraph: { url: canonical, title: "Blog · Aureya", type: "website" },
    twitter: { card: "summary_large_image", title: "Blog · Aureya" },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  };
}

export default async function BlogPage() {
  // Estructura esperada en el CDN:
  // /blog/index.json -> { updated_at, posts: [ { slug, title, excerpt, date, author, cover, tags } ] }
  const data = await fetchJson<BlogIndex>("/blog/index.json")
    .catch((): BlogIndex => ({ updated_at: "", posts: [] }));

  const posts = (data?.posts ?? []).slice().sort((a, b) => {
    const da = a.date ? +new Date(a.date) : 0;
    const db = b.date ? +new Date(b.date) : 0;
    return db - da;
  });

  const updatedStr = data?.updated_at
    ? new Date(data.updated_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
    : null;

  // JSON-LD Blog + ItemList
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/, "");
  const itemList = posts.map((p, i) => ({
    "@type": "ListItem",
    position: i + 1,
    url: base ? `${base}/blog/${p.slug}` : undefined,
  }));

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16">
      {/* Título + hairline */}
      <section className="pt-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Blog</h1>
        <p className="mt-2 text-sm text-zinc-700">
          Guías prácticas, comparativas y respuestas a preguntas frecuentes sobre inversión en metales
          preciosos: oro, plata y más.
        </p>
        <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-[hsl(var(--brand))] to-transparent" />
      </section>

      {/* Cabecera SEO estilo producto (full width) */}
      <section
        className="mt-4 rounded-lg pl-4 pr-3 py-3"
        style={{ borderLeft: "4px solid hsl(var(--brand))", background: "hsl(var(--brand) / 0.05)" }}
      >
        <h2 className="text-lg md:text-xl font-semibold text-zinc-900">
          Aprende a comparar primas, elegir formatos y optimizar tus compras
        </h2>
        <p className="mt-1 text-sm text-zinc-700">
          Reunimos lo esencial para decidir bien: cómo funcionan las <strong>primas</strong> sobre spot,
          diferencias entre <strong>lingotes</strong> y <strong>monedas</strong>, impuestos por país,
          y las mejores prácticas para comprar en tiendas verificadas.
        </p>
        {updatedStr && (
          <p className="mt-1 text-xs text-zinc-600">Actualizado: <span className="font-medium">{updatedStr}</span></p>
        )}
      </section>

      {/* Grid de artículos */}
      <section className="mt-6">
        {!posts.length && (
          <div className="rounded-xl border bg-white p-4 text-zinc-600">
            Aún no hay artículos publicados.
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => {
            const cover = toCdn(p.cover || "");
            return (
              <article
                key={p.slug}
                className="group overflow-hidden rounded-xl border bg-white shadow-[0_6px_20px_rgba(0,0,0,0.03)]"
              >
                {/* top bar dorada sutil */}
                <div className="h-1 w-full bg-[hsl(var(--brand)/0.9)]" />
                {/* cover */}
                {cover ? (
                  <div className="relative w-full aspect-[16/9] bg-white">
                    <Image
                      src={cover}
                      alt={p.title}
                      fill
                      sizes="(max-width: 1024px) 50vw, 33vw"
                      className="object-cover"
                      priority={false}
                    />
                  </div>
                ) : null}
                {/* body */}
                <div className="p-4">
                  <h3 className="text-base md:text-lg font-semibold text-zinc-900 group-hover:opacity-90">
                    <Link href={`/blog/${p.slug}`}>{p.title}</Link>
                  </h3>
                  <div className="mt-1 text-xs text-zinc-500">
                    {p.author ? <span className="mr-2">{p.author}</span> : null}
                    {p.date ? <time dateTime={p.date}>{fmtDate(p.date)}</time> : null}
                  </div>
                  {p.tags?.length ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {p.tags.slice(0, 4).map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center rounded-full border border-[hsl(var(--brand))]
                                     bg-[hsl(var(--brand)/0.10)] text-[hsl(var(--brand))] px-2 py-0.5 text-[11px] font-medium"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {p.excerpt ? (
                    <p className="mt-2 text-sm text-zinc-700 line-clamp-3">{p.excerpt}</p>
                  ) : null}

                  <div className="mt-3">
                    <Link
                      href={`/blog/${p.slug}`}
                      className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium
                                 bg-[hsl(var(--brand))] text-white hover:opacity-90 focus-visible:ring-2
                                 focus-visible:ring-[hsl(var(--brand)/0.35)]"
                      aria-label={`Leer: ${p.title}`}
                    >
                      Leer más
                      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                        <path
                          fill="currentColor"
                          d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3ZM5 5h6v2H7v10h10v-4h2v6H5V5Z"
                        />
                      </svg>
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* JSON-LD Blog + ItemList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            url: base ? `${base}/blog` : undefined,
            name: "Blog de Aureya",
            about:
              "Guías y comparativas sobre oro y plata: primas, spots, tiendas y fiscalidad.",
            mainEntity: {
              "@type": "ItemList",
              itemListElement: itemList,
            },
          }),
        }}
      />
    </main>
  );
}
