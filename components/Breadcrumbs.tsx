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

/** ¿La ruta completa es una ruta “conocida”? (si no, no pintamos migas) */
function isKnownPath(pathname: string): boolean {
  if (pathname === "/") return true;

  // Raíces estáticas
  if (
    [
      "/oro", "/plata", "/tiendas", "/blog",
      "/sobre-nosotros", "/contacto", "/faq", "/guias",
      "/utilidades", "/producto"
    ].includes(pathname)
  ) return true;

  // /tiendas/[slug]
  if (/^\/tiendas\/[^/]+$/.test(pathname)) return true;

  // /producto/[slug]
  if (/^\/producto\/[^/]+$/.test(pathname)) return true;

  // /{oro|plata}/{lingotes|monedas}
  if (/^\/(oro|plata)\/(lingotes|monedas)$/.test(pathname)) return true;

  // /{oro|plata}/{lingotes|monedas}/{bucket}
  // bucket válido: "1oz" o "<n>g" (n admite decimales opcionales)
  if (/^\/(oro|plata)\/(lingotes|monedas)\/(1oz|[0-9]+(\.[0-9]+)?g)$/.test(pathname)) return true;

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

  let hrefAcc = "";
  const items = parts.map((seg, idx) => {
    hrefAcc += `/${seg}`;

    let label = STATIC_LABELS[seg] || titleize(seg);

    // /tiendas/[slug] → usar label real si lo tenemos
    if (parts[0] === "tiendas" && idx === 1 && dealerMeta[seg]?.label) {
      label = dealerMeta[seg]!.label;
    }

    return { label, href: hrefAcc, isLast: idx === parts.length - 1 };
  });

  return (
    <div className="mx-auto max-w-6xl px-4 text-left">
      <nav aria-label="breadcrumbs" className="pt-2">
        <ol className="flex flex-wrap items-center gap-2 text-[13px] leading-none text-zinc-500">
          <li>
            <Link href="/" className="hover:text-zinc-700">Inicio</Link>
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
