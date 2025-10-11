"use client";

import Link from "next/link";
import VerifiedBadge from "@/components/VerifiedBadge";

export type DealerMetaItem = {
  label: string;          // requerido
  country?: string;       // ISO-2 (ES, FR…)
  url?: string;           // web oficial
  verified?: boolean;     // opcional
};

const niceMetal: Record<string, string> = {
  gold: "Oro",
  silver: "Plata",
  platinum: "Platino",
  palladium: "Paladio",
};

const niceForm: Record<string, string> = {
  bar: "Lingotes",
  coin: "Monedas",
};

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs
                 bg-white/70 border-zinc-200 text-zinc-700"
    >
      {children}
    </span>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium
                 bg-[hsl(var(--brand)/0.10)] text-[hsl(var(--brand))] border border-[hsl(var(--brand)/0.25)]"
    >
      {children}
    </span>
  );
}

function normalizeUrl(maybeUrl?: string) {
  if (!maybeUrl) return null;
  try {
    return new URL(maybeUrl).toString();
  } catch {
    try {
      return new URL(`https://${maybeUrl}`).toString();
    } catch {
      return null;
    }
  }
}

export default function DealerCard({
  slug,
  meta,
  offersCount = 0,
  metals = [],
  forms = [],
}: {
  slug: string;
  meta: DealerMetaItem;
  offersCount?: number;
  metals?: string[];
  forms?: string[];
}) {
  if (!meta?.label) return null;
  const isVerified = meta.verified ?? true;

  return (
    <article
      className="
        group relative overflow-hidden rounded-2xl border border-zinc-200/70 bg-white
        shadow-[0_4px_20px_rgba(0,0,0,0.06)]
        hover:shadow-[0_10px_28px_rgba(0,0,0,0.10)]
        transition-shadow
      "
    >
      {/* filete superior dorado */}
      <div className="h-1 w-full bg-[hsl(var(--brand))]" aria-hidden />

      <div className="p-4 md:p-5">
        {/* Cabecera: nombre + verificado */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg md:text-xl font-semibold tracking-tight text-zinc-900">
            {meta.label}
          </h3>

          {isVerified && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600">
              <VerifiedBadge size={18} className="translate-y-[1px]" />
              <span className="hidden sm:inline">Verificada</span>
            </span>
          )}
        </div>

        {/* País + ofertas */}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {meta.country && <Pill>{meta.country.toUpperCase()}</Pill>}
          <Pill>
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
              <path
                fill="currentColor"
                d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2Zm10 0c-1.1 0-1.99.9-1.99 2S15.9 22 17 22s2-.9 2-2-.9-2-2-2ZM7.16 14h9.59c.75 0 1.41-.41 1.75-1.03l3.58-6.49a.99.99 0 0 0-.87-1.48H6.21L5.27 2H2v2h2l3.6 7.59-1.35 2.44C5.52 14.37 6.23 15 7.1 15H19v-2H7.42l.74-1.34Z"
              />
            </svg>
            {offersCount} ofertas
          </Pill>
        </div>

        {/* Chips de catálogo */}
        {(metals.length > 0 || forms.length > 0) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {metals.map((m) => (
              <Tag key={`m-${m}`}>{niceMetal[m] ?? m}</Tag>
            ))}
            {forms.map((f) => (
              <Tag key={`f-${f}`}>{niceForm[f] ?? f}</Tag>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Link
            href={`/tiendas/${slug}`}
            className="
              inline-flex items-center gap-1 rounded-lg px-3.5 py-2 text-sm font-medium
              bg-[hsl(var(--brand))] text-[hsl(var(--brand-ink))]
              hover:opacity-90 focus:outline-none focus-visible:ring-2
              focus-visible:ring-[hsl(var(--brand)/0.35)]
            "
            aria-label={`Ver ficha de la tienda ${meta.label}`}
          >
            Ver ficha de la tienda
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
              <path
                fill="currentColor"
                d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3ZM5 5h6v2H7v10h10v-4h2v6H5V5Z"
              />
            </svg>
          </Link>

          {meta.url && (
            <a
              href={normalizeUrl(meta.url) ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-lg px-3.5 py-2 text-sm font-medium
                         border border-zinc-200 hover:bg-zinc-50"
              aria-label={`Ir a la web oficial de ${meta.label}`}
            >
              Web oficial
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                <path fill="currentColor" d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3Z" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
