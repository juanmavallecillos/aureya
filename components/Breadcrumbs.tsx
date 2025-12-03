// components/Breadcrumbs.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDealerMeta } from "@/lib/useDealerMeta";

const STATIC_LABELS: Record<string, string> = {
  oro: "Oro",
  plata: "Plata",
  blog: "Blog",
  "sobre-nosotros": "Sobre nosotros",
  contacto: "Contacto",
  tiendas: "Tiendas",
  lingotes: "Lingotes",
  monedas: "Monedas",
  faq: "FAQ",
  guias: "Guías",
  utilidades: "Utilidades",
  producto: "Producto",
};

function titleize(slug: string) {
  return decodeURIComponent(slug)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function cap(word: string) {
  if (!word) return word;
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function shouldUpperToken(t: string) {
  // Acrónimos / marcas cortas: SEMPSA, RCM, etc.
  // Si el token es alfanumérico y corto (2–6), lo ponemos en MAYÚSCULAS
  return /^[a-z0-9]+$/i.test(t) && t.length >= 2 && t.length <= 6;
}

/** Convierte tokens de marca/serie a una presentación agradable */
function formatBrand(tokens: string[]) {
  return tokens
    .filter(Boolean)
    .map((t) => (shouldUpperToken(t) ? t.toUpperCase() : cap(t)))
    .join(" ")
    .trim();
}

/** Intenta derivar un título "Lingote de Oro SEMPSA · 20g" desde /producto/[slug] */
function productTitleFromSlug(fullSlug: string): string {
  // slug esperado: "lingote-oro-20g-sempsa--AU-20G-SEMPSA"
  const [human] = fullSlug.split("--"); // parte antes del SKU
  const tokens = (human || "").split("-").filter(Boolean);

  let form = "";
  let metal = "";
  let weight = "";
  const brandTokens: string[] = [];

  const isForm = (t: string) => ["lingote", "moneda"].includes(t);
  const isMetal = (t: string) => ["oro", "plata", "platino", "paladio"].includes(t);
  const isWeight = (t: string) => /^\d+(\.\d+)?(g|kg|oz)$/i.test(t);

  for (const t of tokens) {
    if (!form && isForm(t)) {
      form = t;
      continue;
    }
    if (!metal && isMetal(t)) {
      metal = t;
      continue;
    }
    if (!weight && isWeight(t)) {
      weight = t;
      continue;
    }
    brandTokens.push(t);
  }

  const brand = formatBrand(brandTokens);
  const formLabel = form ? cap(form) : "";
  const metalLabel = metal ? cap(metal) : "";

  // Construcción: "Lingote de Oro {BRAND} · {weight}"
  const left = [formLabel, metalLabel ? `de ${metalLabel}` : ""]
    .filter(Boolean)
    .join(" ");

  const right = weight ? ` · ${weight}` : "";
  const brandPart = brand ? ` ${brand}` : "";

  const result = `${left}${brandPart}${right}`.trim();
  // Fallback si no se pudo interpretar nada
  return result || titleize(human || fullSlug);
}

/** ¿La ruta completa es una ruta “conocida”? (si no, no pintamos migas) */
function isKnownPath(pathname: string): boolean {
  if (pathname === "/") return true;

  // Raíces estáticas
  if (
    [
      "/oro",
      "/plata",
      "/tiendas",
      "/blog",
      "/sobre-nosotros",
      "/contacto",
      "/faq",
      "/guias",
      "/utilidades",
      "/producto",
    ].includes(pathname)
  )
    return true;

  // /tiendas/[slug]
  if (/^\/tiendas\/[^/]+$/.test(pathname)) return true;

  // /producto/[slug]
  if (/^\/producto\/[^/]+$/.test(pathname)) return true;

  // /{oro|plata}/{lingotes|monedas}
  if (/^\/(oro|plata)\/(lingotes|monedas)$/.test(pathname)) return true;

  // /{oro|plata}/{lingotes|monedas}/{bucket}
  // bucket válido: "1oz" o "<n>g" (n admite decimales opcionales)
  if (
    /^\/(oro|plata)\/(lingotes|monedas)\/(1oz|[0-9]+(?:\.[0-9]+)?g|[0-9]+(?:\.[0-9]+)?kg)$/
      .test(pathname)
  ) return true;

  return false;
}

/** ¿Este acumulado lo enlazamos? (evita links a segmentos inventados) */
function isLinkable(href: string): boolean {
  return isKnownPath(href);
}

export default function Breadcrumbs() {
  const pathname = usePathname();
  const dealerMeta = useDealerMeta();

  if (!pathname || pathname === "/") return null;

  // Si la ruta NO es conocida (como /oro/lingote/test), no mostramos migas.
  if (!isKnownPath(pathname)) return null;

  const parts = pathname.split("/").filter(Boolean);
  if (!parts.length) return null;

  let items: { label: string; href: string; isLast: boolean }[] = [];

  // 🎯 Caso especial: /producto/[slug] → "Inicio / {Nombre interpretado}"
  if (parts[0] === "producto" && parts[1]) {
    const pretty = productTitleFromSlug(parts[1]);
    items = [
      {
        label: pretty,
        href: pathname, // no enlazamos el último
        isLast: true,
      },
    ];
  } else {
    // Comportamiento normal
    let hrefAcc = "";
    items = parts.map((seg, idx) => {
      hrefAcc += `/${seg}`;

      let label = STATIC_LABELS[seg] || titleize(seg);

      // /tiendas/[slug] → usar label real si lo tenemos
      if (parts[0] === "tiendas" && idx === 1 && dealerMeta[seg]?.label) {
        label = dealerMeta[seg]!.label;
      }

      return { label, href: hrefAcc, isLast: idx === parts.length - 1 };
    });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 text-left">
      <nav aria-label="breadcrumbs" className="pt-2">
        <ol className="flex flex-wrap items-center gap-2 text-[13px] leading-none text-zinc-500">
          <li>
            <Link href="/" className="hover:text-zinc-700">
              Inicio
            </Link>
          </li>
          {items.map((it) => {
            const linkable = isLinkable(it.href) && !it.isLast;
            return (
              <li key={it.href} className="flex items-center gap-2">
                <span className="text-zinc-300">/</span>
                {it.isLast ? (
                  <span className="relative text-zinc-700">
                    {it.label}
                    <span className="absolute left-0 -bottom-[2px] h-px w-full bg-[hsl(var(--brand))]" />
                  </span>
                ) : linkable ? (
                  <Link href={it.href} className="hover:text-zinc-700">
                    {it.label}
                  </Link>
                ) : (
                  <span className="text-zinc-600">{it.label}</span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <div
        className="mt-2 h-px w-full bg-[linear-gradient(to_right,transparent,hsla(var(--brand),0.28),transparent)]"
        aria-hidden
      />
    </div>
  );
}
