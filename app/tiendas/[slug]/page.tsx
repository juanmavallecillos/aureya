import type { Metadata } from "next";
import { fetchJsonOrNullServer as fetchJson } from "@/lib/cdn-server";
import AllIndexTable from "@/components/AllIndexTable.server";
import VerifiedBadge from "@/components/VerifiedBadge";
import Link from "next/link";
import {
  Building2,
  MapPin,
  Coins,
  Layers,
  Globe,
  ArrowUpRight,
  Instagram,
  Twitter,
  Facebook,
  Youtube,
} from "lucide-react";

/* ---------------- Tipos ---------------- */
type DealerEntry = {
  label: string;
  country?: string; // ISO-2: ES, FR...
  url?: string;
  verified?: boolean;

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
  social?: Partial<Record<"instagram" | "twitter" | "facebook" | "youtube" | "tiktok", string>>;
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

function prettyList(arr?: string[]) {
  if (!arr?.length) return "";
  return arr.join(", ");
}

type SocialKey = NonNullable<DealerEntry["social"]> extends infer S
  ? S extends Partial<Record<infer K, string>>
    ? K
    : never
  : never;

const SOCIAL_META: Record<
  SocialKey,
  { label: string; Icon: React.ElementType }
> = {
  instagram: { label: "Instagram", Icon: Instagram },
  twitter: { label: "Twitter / X", Icon: Twitter },
  facebook: { label: "Facebook", Icon: Facebook },
  youtube: { label: "YouTube", Icon: Youtube },
  tiktok: { label: "TikTok", Icon: Globe }, // lucide no trae TikTok oficial
};

/* ---------------- Metadata dinámica ---------------- */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const dealers = await loadDealers();
  const d = dealers[slug];
  if (!d) return { title: "Tienda no encontrada • Aureya" };

  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
  const canonical = `${base}/tiendas/${slug}`;

  const title = `${d.label} • Aureya`;
  const description =
    d.about || `Información y catálogo de ${d.label} en Aureya. Consulta sus ofertas de metales preciosos.`;
  const images = d.hero_image ? [{ url: d.hero_image }] : undefined;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, images, url: canonical },
    twitter: { card: "summary_large_image", title, description, images },
    robots: { index: true, follow: true },
  };
}

/* ---------------- UI Helpers ---------------- */
function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-700">
      {children}
    </span>
  );
}

/* ---------------- Página (Server Component) ---------------- */
export default async function DealerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const dealers = await loadDealers();
  const d = dealers[slug];

  if (!d) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-2xl font-semibold">Tienda no encontrada</h1>
        <p className="text-sm text-zinc-600 mt-2">No hemos localizado esta tienda en nuestro directorio.</p>
        <div className="mt-4">
          <Link href="/tiendas" className="text-[hsl(var(--brand))] hover:underline">
            Volver a tiendas
          </Link>
        </div>
      </main>
    );
  }

  const country = countryName(d.country);

  // JSON-LD
  const sameAs = Object.values(d.social || {}).filter(Boolean) as string[];
  const orgLd: any = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: d.label,
    ...(d.url ? { url: d.url } : {}),
    ...(d.hero_image ? { logo: d.hero_image } : {}),
    ...(sameAs.length ? { sameAs } : {}),
    ...(d.founded_year ? { foundingDate: String(d.founded_year) } : {}),
    ...(country ? { address: { "@type": "PostalAddress", addressCountry: country } } : {}),
  };

  const hasAnyInfo =
    d.about ||
    d.headquarters ||
    d.shipping ||
    d.payments?.length ||
    d.returns ||
    d.physical_stores?.length ||
    (d.social && Object.values(d.social).some(Boolean));

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16">
      {/* HERO */}
      <section className="pt-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{d.label}</h1>
              {d.verified ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--brand)/0.08)] px-3 py-1 text-xs text-zinc-800">
                  <VerifiedBadge size={16} className="translate-y-[1px]" />
                  <span className="font-medium">Verificada</span>
                </span>
              ) : null}
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              {country ? (
                <Chip>
                  <MapPin className="h-3.5 w-3.5 text-zinc-500" />
                  {country}
                </Chip>
              ) : null}

              {d.metals?.length ? (
                <Chip>
                  <Coins className="h-3.5 w-3.5 text-zinc-500" />
                  {prettyList(d.metals)}
                </Chip>
              ) : null}

              {d.forms?.length ? (
                <Chip>
                  <Layers className="h-3.5 w-3.5 text-zinc-500" />
                  {prettyList(d.forms)}
                </Chip>
              ) : null}

              {d.founded_year ? (
                <Chip>
                  <Building2 className="h-3.5 w-3.5 text-zinc-500" />
                  Desde {d.founded_year}
                </Chip>
              ) : null}
            </div>

            {d.url ? (
              <div className="mt-4">
                <a
                  href={d.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium
                             bg-[hsl(var(--brand))] text-white hover:opacity-90 focus-visible:ring-2
                             focus-visible:ring-[hsl(var(--brand)/0.35)]"
                >
                  Ir a la web
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>
            ) : null}
          </div>

          {/* Logo / Hero image */}
          {d.hero_image ? (
            <div className="relative w-full md:w-72 h-20 md:h-24 rounded-2xl overflow-hidden ring-1 ring-inset ring-zinc-200 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={d.hero_image}
                alt={d.label}
                className="w-full h-full object-contain p-3"
                loading="lazy"
              />
            </div>
          ) : null}
        </div>

        <div className="mt-5 h-px w-full bg-gradient-to-r from-transparent via-[hsl(var(--brand))] to-transparent" />
      </section>

      {/* INFO */}
      {hasAnyInfo ? (
        <section className="mt-8 space-y-6">
          {/* Sobre */}
          {d.about || d.founded_year || d.headquarters ? (
            <article className="relative overflow-hidden rounded-2xl bg-white ring-1 ring-inset ring-zinc-200 shadow-sm">
              <div className="absolute inset-x-0 top-0 h-1 bg-[hsl(var(--brand)/0.9)]" />
              <div className="p-5 md:p-6">
                <div className="flex items-center gap-2">
                  <span className="text-[hsl(var(--brand))]">
                    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5">
                      <path
                        fill="currentColor"
                        d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z"
                      />
                    </svg>
                  </span>
                  <h2 className="text-lg font-semibold">Sobre {d.label}</h2>
                </div>

                {d.about ? (
                  <p className="mt-3 text-sm text-zinc-700 leading-relaxed">{d.about}</p>
                ) : null}

                {d.headquarters || d.founded_year || d.metals?.length || d.forms?.length ? (
                  <ul className="mt-4 grid gap-2 sm:grid-cols-2 text-sm text-zinc-700">
                    {d.headquarters ? (
                      <li className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
                        <div className="text-xs text-zinc-500">Sede</div>
                        <div className="font-medium text-zinc-900">{d.headquarters}</div>
                      </li>
                    ) : null}
                    {d.founded_year ? (
                      <li className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
                        <div className="text-xs text-zinc-500">Año de fundación</div>
                        <div className="font-medium text-zinc-900">{d.founded_year}</div>
                      </li>
                    ) : null}
                    {d.metals?.length ? (
                      <li className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
                        <div className="text-xs text-zinc-500">Metales</div>
                        <div className="font-medium text-zinc-900">{d.metals.join(", ")}</div>
                      </li>
                    ) : null}
                    {d.forms?.length ? (
                      <li className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
                        <div className="text-xs text-zinc-500">Formatos</div>
                        <div className="font-medium text-zinc-900">{d.forms.join(", ")}</div>
                      </li>
                    ) : null}
                  </ul>
                ) : null}
              </div>
            </article>
          ) : null}

          {/* Operativa */}
          {d.shipping || d.payments?.length || d.returns ? (
            <article className="relative overflow-hidden rounded-2xl bg-white ring-1 ring-inset ring-zinc-200 shadow-sm">
              <div className="absolute inset-x-0 top-0 h-1 bg-[hsl(var(--brand)/0.9)]" />
              <div className="p-5 md:p-6">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 text-[hsl(var(--brand))]">
                    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5">
                      <path
                        fill="currentColor"
                        d="M3 7h12v10H3V7Zm14 2h2l2 3v5h-4V9Zm-1 10H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v13Zm3 0h2v-6h-2v6Z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold">Operativa</h2>
                </div>

                <div className="mt-4 grid gap-3">
                  {d.shipping ? (
                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50/60 px-4 py-3">
                      <div className="font-medium text-zinc-900">Envíos</div>
                      <p className="mt-1 text-sm text-zinc-700 leading-relaxed">{d.shipping}</p>
                    </div>
                  ) : null}

                  {d.payments?.length ? (
                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50/60 px-4 py-3">
                      <div className="font-medium text-zinc-900">Pagos</div>
                      <p className="mt-1 text-sm text-zinc-700">{d.payments.join(", ")}</p>
                    </div>
                  ) : null}

                  {d.returns ? (
                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50/60 px-4 py-3">
                      <div className="font-medium text-zinc-900">Devoluciones</div>
                      <p className="mt-1 text-sm text-zinc-700 leading-relaxed">{d.returns}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          ) : null}

          {/* Redes */}
          {d.social && Object.values(d.social).some(Boolean) ? (
            <article className="relative overflow-hidden rounded-2xl bg-white ring-1 ring-inset ring-zinc-200 shadow-sm">
              <div className="absolute inset-x-0 top-0 h-1 bg-[hsl(var(--brand)/0.9)]" />
              <div className="p-5 md:p-6">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-[hsl(var(--brand))]" />
                  <h2 className="text-lg font-semibold">Redes</h2>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  {Object.entries(d.social).map(([k, v]) => {
                    if (!v) return null;
                    const key = k as SocialKey;
                    const meta = SOCIAL_META[key] || { label: k, Icon: Globe };
                    const Icon = meta.Icon;

                    return (
                      <a
                        key={k}
                        href={v}
                        target="_blank"
                        rel="noreferrer"
                        className="
                          inline-flex items-center gap-2
                          rounded-full border border-zinc-200 bg-white
                          px-4 py-2 text-sm font-medium text-zinc-900
                          hover:bg-[hsl(var(--brand)/0.05)]
                          hover:border-[hsl(var(--brand)/0.35)]
                          hover:shadow-sm
                          transition
                        "
                      >
                        <Icon className="h-4 w-4 text-[hsl(var(--brand))]" />
                        <span>{meta.label}</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            </article>
          ) : null}

          {/* Tiendas físicas */}
          {d.physical_stores?.length ? (
            <article className="relative overflow-hidden rounded-2xl bg-white ring-1 ring-inset ring-zinc-200 shadow-sm">
              <div className="absolute inset-x-0 top-0 h-1 bg-[hsl(var(--brand)/0.9)]" />
              <div className="p-5 md:p-6">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 text-[hsl(var(--brand))]">
                    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5">
                      <path
                        fill="currentColor"
                        d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold">Tiendas físicas</h2>
                </div>

                <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {d.physical_stores.map((s, i) => (
                    <li key={i} className="rounded-2xl border border-zinc-200 bg-white p-4">
                      <div className="font-semibold text-zinc-900">{s.city}</div>
                      {s.address ? <div className="mt-1 text-sm text-zinc-600">{s.address}</div> : null}
                      {s.mapUrl ? (
                        <a
                          href={s.mapUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-sm text-[hsl(var(--brand))] hover:underline"
                        >
                          Ver en mapa <span aria-hidden>↗</span>
                        </a>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ) : null}
        </section>
      ) : null}

      {/* CATÁLOGO */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold">Catálogo de {d.label}</h2>
        <p className="text-sm text-zinc-600 mt-1">A continuación, ofertas de {d.label} presentes en Aureya.</p>
        <div className="mt-4">
          <AllIndexTable forceDealer={slug} hideDealerFacet />
        </div>
      </section>

      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
    </main>
  );
}
