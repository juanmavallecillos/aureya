import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { fetchJson } from "@/lib/cdn";

export const revalidate = 3600; // 1h

type PostDoc = {
  slug: string;
  title: string;
  excerpt?: string | null;
  date?: string | null;          // ISO
  author?: string | null;
  cover?: string | null;         // p.ej. media/blog/slug/cover-1200.webp
  tags?: string[] | null;
  reading_minutes?: number | null;
  body_html: string;             // HTML ya sanitizado desde el publisher
};

const toCdn = (p?: string | null) =>
  p ? (p.startsWith("/api/cdn?path=") ? p : `/api/cdn?path=${encodeURIComponent(p)}`) : "";

function fmtDate(d?: string | null) {
  if (!d) return "";
  const dt = new Date(d);
  return isNaN(+dt) ? "" : dt.toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await fetchJson<PostDoc>(`/blog/${slug}.json`).catch(() => null);
  if (!data) return { title: "Artículo no encontrado · Aureya" };

  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
  const canonical = `${base}/blog/${slug}`;

  return {
    title: `${data.title} · Aureya`,
    description: data.excerpt || undefined,
    alternates: { canonical },
    openGraph: { url: canonical, title: data.title, type: "article", images: data.cover ? [toCdn(data.cover)] : undefined },
    twitter: { card: "summary_large_image", title: data.title, description: data.excerpt || undefined },
    robots: { index: true, follow: true },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await fetchJson<PostDoc>(`/blog/${slug}.json`).catch(() => null);
  if (!data) return notFound();

  const cover = toCdn(data.cover);
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/, "");
  const url = base ? `${base}/blog/${slug}` : undefined;

  return (
    <main className="mx-auto max-w-3xl px-4 pb-16">
      {/* Breadcrumb mini */}
      <nav className="pt-6 text-sm">
        <Link href="/blog" className="text-zinc-600 hover:underline">Blog</Link>
        <span className="mx-1 text-zinc-400">/</span>
        <span className="text-zinc-900">{data.title}</span>
      </nav>

      {/* Título + meta */}
      <header className="mt-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{data.title}</h1>
        <div className="mt-2 text-xs text-zinc-600 flex flex-wrap gap-3">
          {data.date ? <time dateTime={data.date}>{fmtDate(data.date)}</time> : null}
          {data.author ? <span>Por {data.author}</span> : null}
          {data.reading_minutes ? <span>⏱ {data.reading_minutes} min</span> : null}
        </div>
        <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-[hsl(var(--brand))] to-transparent" />
      </header>

      {/* Cover */}
      {cover ? (
        <div className="mt-4 overflow-hidden rounded-xl border bg-white">
          <div className="relative w-full aspect-[16/9] bg-white">
            <Image src={cover} alt={data.title} fill sizes="100vw" className="object-cover" />
          </div>
        </div>
      ) : null}

      {/* Cuerpo */}
      <article
        className="prose prose-zinc max-w-none prose-h2:mt-8 prose-h2:scroll-mt-24 prose-img:rounded-lg
                   prose-a:text-[hsl(var(--brand))] prose-strong:text-zinc-900
                   mt-6 rounded-xl border bg-white p-5 md:p-7"
        dangerouslySetInnerHTML={{ __html: data.body_html }}
      />

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        // @ts-ignore
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: data.title,
            datePublished: data.date || undefined,
            author: data.author ? { "@type": "Person", name: data.author } : undefined,
            image: cover || undefined,
            mainEntityOfPage: url,
          }),
        }}
      />
    </main>
  );
}
