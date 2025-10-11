import type { Metadata } from "next";
import { fetchJson } from "@/lib/cdn";
import AllIndexTable from "@/components/AllIndexTable";
import VerifiedBadge from "@/components/VerifiedBadge";

/* ---------------- Tipos ---------------- */
type DealerEntry = {
  label: string;
  country?: string;        // ISO-2: ES, FR...
  url?: string;
  verified?: boolean;

  // SEO / contenido opcional
  about?: string;
  founded_year?: number;
  headquarters?: string;
  metals?: string[];
  forms?: string[];

  hero_image?: string;
  gallery?: string[];

  physical_stores?: { city: string; address?: string; mapUrl?: string }[];
  shipping?: string;
  payments?: string[];
  returns?: string;
  social?: Partial<Record<"instagram"|"twitter"|"facebook"|"youtube"|"tiktok", string>>;
};
type DealersMap = Record<string, DealerEntry>;

/* ---------------- Helpers ---------------- */
async function loadDealers(): Promise<DealersMap> {
  const dealers = await fetchJson<DealersMap>("/meta/dealers.json");
  return dealers || {};
}
function countryName(code?: string) {
  if (!code) return "";
  const map: Record<string, string> = { ES: "España", FR: "Francia", PT: "Portugal" };
  return map[code.toUpperCase()] || code;
}

/* ---------------- Metadata dinámica ---------------- */
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const dealers = await loadDealers();
  const d = dealers[slug];
  if (!d) return { title: "Tienda no encontrada • Aureya" };

  const title = `${d.label} • Aureya`;
  const description =
    d.about ||
    `Información y catálogo de ${d.label} en Aureya. Consulta su oferta de metales preciosos.`;
  const images = d.hero_image ? [{ url: d.hero_image }] : undefined;

  return {
    title,
    description,
    openGraph: { title, description, images },
    twitter: { card: "summary_large_image", title, description, images },
  };
}

/* ---------------- Página (Server Component) ---------------- */
export default async function DealerPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const dealers = await loadDealers();
  const d = dealers[slug];

  if (!d) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-2xl font-semibold">Tienda no encontrada</h1>
        <p className="text-sm text-zinc-600 mt-2">
          No hemos localizado esta tienda en nuestro directorio.
        </p>
      </main>
    );
  }

  const country = countryName(d.country);

  // JSON-LD Organization / Store (mínimo útil + opcional)
  const sameAs = Object.values(d.social || {}).filter(Boolean) as string[];
  const orgLd: any = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": d.label,
    ...(d.url ? { "url": d.url } : {}),
    ...(d.hero_image ? { "logo": d.hero_image } : {}),
    ...(sameAs.length ? { "sameAs": sameAs } : {}),
    ...(d.founded_year ? { "foundingDate": String(d.founded_year) } : {}),
    ...(country ? { "address": { "@type": "PostalAddress", "addressCountry": country } } : {}),
  };

  const hasAnyInfo =
    d.about || d.headquarters || d.shipping || d.payments?.length || d.returns || d.physical_stores?.length;

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16">
      {/* HERO */}
      <section className="pt-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{d.label}</h1>
            <div className="mt-1 text-sm text-zinc-600 flex items-center gap-2">
              {country && <span>{country}</span>}
              {d.verified && (
                <span className="inline-flex items-center gap-2">
                  <VerifiedBadge size={18} className="translate-y-[1px]" />
                  <span className="font-medium">Tienda verificada</span>
                </span>
              )}
            </div>
            {d.url && (
              <div className="mt-3">
                <a
                  href={d.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium bg-[hsl(var(--brand))] text-white hover:opacity-90"
                >
                  Ir a la web
                  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                    <path fill="currentColor" d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3ZM5 5h6v2H7v10h10v-4h2v6H5V5Z"/>
                  </svg>
                </a>
              </div>
            )}
          </div>

          {d.hero_image && (
            <div className="relative w-full md:w-64 h-28 md:h-32 rounded-lg overflow-hidden border bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={d.hero_image}
                alt={d.label}
                className="w-full h-full object-contain"
                loading="lazy"
              />
            </div>
          )}
        </div>

        <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-[hsl(var(--brand))] to-transparent" />
      </section>

      {/* INFO SEO (condicional) */}
      {hasAnyInfo && (
        <section className="mt-8 grid md:grid-cols-2 gap-8">
          {/* Sobre la tienda */}
          {(d.about || d.founded_year || d.headquarters) && (
            <div>
              <h2 className="text-lg font-semibold">Sobre {d.label}</h2>
              {d.about && <p className="mt-2 text-sm text-zinc-700">{d.about}</p>}
              <ul className="mt-3 text-sm text-zinc-700 space-y-1">
                {d.founded_year && <li><strong>Año de fundación:</strong> {d.founded_year}</li>}
                {d.headquarters && <li><strong>Sede:</strong> {d.headquarters}</li>}
                {d.metals?.length && <li><strong>Metales:</strong> {d.metals.join(", ")}</li>}
                {d.forms?.length && <li><strong>Formatos:</strong> {d.forms.join(", ")}</li>}
              </ul>
            </div>
          )}

          {/* Envíos / pagos / devoluciones */}
          {(d.shipping || d.payments?.length || d.returns) && (
            <div>
              <h2 className="text-lg font-semibold">Operativa</h2>
              {d.shipping && (
                <p className="mt-2 text-sm text-zinc-700"><strong>Envíos:</strong> {d.shipping}</p>
              )}
              {d.payments?.length && (
                <p className="mt-2 text-sm text-zinc-700">
                  <strong>Pagos:</strong> {d.payments.join(", ")}
                </p>
              )}
              {d.returns && (
                <p className="mt-2 text-sm text-zinc-700"><strong>Devoluciones:</strong> {d.returns}</p>
              )}
            </div>
          )}

          {/* Tiendas físicas */}
          {d.physical_stores?.length ? (
            <div className="md:col-span-2">
              <h2 className="text-lg font-semibold">Tiendas físicas</h2>
              <ul className="mt-2 grid sm:grid-cols-2 gap-3">
                {d.physical_stores.map((s, i) => (
                  <li key={i} className="border rounded-lg p-3 text-sm">
                    <div className="font-medium">{s.city}</div>
                    {s.address && <div className="text-zinc-600 mt-1">{s.address}</div>}
                    {s.mapUrl && (
                      <a href={s.mapUrl} target="_blank" rel="noreferrer" className="text-[hsl(var(--brand))] hover:underline mt-1 inline-block">
                        Ver en mapa
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Redes */}
          {d.social && Object.values(d.social).some(Boolean) ? (
            <div className="md:col-span-2">
              <h2 className="text-lg font-semibold">Redes sociales</h2>
              <div className="mt-2 flex flex-wrap gap-2 text-sm">
                {Object.entries(d.social).map(([k, v]) =>
                  v ? (
                    <a
                      key={k}
                      href={v}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-full border hover:bg-zinc-50"
                    >
                      {k}
                    </a>
                  ) : null
                )}
              </div>
            </div>
          ) : null}
        </section>
      )}

      {/* CATÁLOGO (tabla filtrada) */}
    <section className="mt-10">
    <h2 className="text-lg font-semibold">Catálogo de {d.label}</h2>
    <p className="text-sm text-zinc-600 mt-1">
        A continuación, ofertas de {d.label} presentes en Aureya.
    </p>
    <div className="mt-4">
        <AllIndexTable forceDealer={slug} hideDealerFacet />
    </div>
    </section>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }}
      />
    </main>
  );
}
