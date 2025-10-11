"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/* --- Dropdown controlado por estado (desktop) --- */
/* --- Dropdown controlado por estado (desktop) --- */
function DesktopDropdown({
  label,
  href,
  items,
  active,
}: {
  label: string;
  href: string;
  items: { href: string; label: string }[];
  active?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);

  // Cierre por blur con pequeño delay para permitir pasar el foco al panel
  let blurTimer: any;
  const onBlur = () => {
    blurTimer = setTimeout(() => setOpen(false), 80);
  };
  const onFocus = () => {
    if (blurTimer) clearTimeout(blurTimer);
    setOpen(true);
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
    >
      {/* Trigger */}
      <Link
        href={href}
        aria-haspopup="menu"
        aria-expanded={open}
        onFocus={onFocus}
        onBlur={onBlur}
        className={[
          "inline-flex items-center gap-1 px-2 py-1 link-brand-underline border-b-2 border-transparent transition-colors",
          active ? "is-active" : ""
        ].join(" ")}
      >
        <span>{label}</span>
        <svg
          className="h-4 w-4 opacity-70 transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path fill="currentColor" d="M7 10l5 5 5-5H7z" />
        </svg>
      </Link>

      {/* HITBOX puente (evita cierre al cruzar del trigger al panel) */}
      <div
        aria-hidden
        className={["absolute left-0 right-0 top-full", open ? "block" : "hidden"].join(" ")}
        style={{ height: 8 }}
      />

      {/* Panel (sin barra dorada superior) */}
      <div
        aria-hidden={!open}
        role="menu"
        onFocus={onFocus}
        onBlur={onBlur}
        className={[
          "absolute left-0 top-full z-50 min-w-[240px]",
          "mt-0 -translate-y-px",                             // pegado al trigger
          "rounded-2xl border border-zinc-200/80 bg-white/95 backdrop-blur-md",
          "shadow-[0_10px_30px_rgba(0,0,0,0.08)] ring-1 ring-black/5",
          "transition-all duration-150 ease-out origin-top",
          open
            ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
            : "opacity-0 translate-y-1 scale-95 pointer-events-none",
        ].join(" ")}
      >
        <ul className="p-2">
          {items.map((it, i) => (
            <li key={it.href}>
              <Link
                href={it.href}
                onClick={() => setOpen(false)}
                role="menuitem"
                className={[
                  "group relative flex items-center rounded-xl px-3 py-2",
                  "text-sm text-zinc-700 font-normal",                 // tamaño y peso base más suaves
                  "hover:bg-zinc-50 hover:text-zinc-900",
                  "transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand)/0.35)]",
                ].join(" ")}
              >
                {/* Acento dorado a la izquierda (sólo en hover/focus) */}
                <span
                  aria-hidden
                  className="absolute left-2 h-5 w-[2px] rounded-full bg-[hsl(var(--brand))]
                             opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition"
                />
                <span className="pl-3 leading-none font-normal
                                group-hover:font-medium group-focus-visible:font-medium">
                  {it.label}
                </span>
              </Link>

              {/* Separador suave entre ítems (no después del último) */}
              {i < items.length - 1 && (
                <div
                  className="mx-2 my-1 h-px bg-gradient-to-r from-transparent via-zinc-100 to-transparent"
                  aria-hidden
                />
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const tiendasActive = pathname?.startsWith("/tiendas");
  const oroActive = pathname?.startsWith("/oro");
  const plataActive = pathname?.startsWith("/plata");
  const aprenderActive = pathname?.startsWith("/guias") || pathname?.startsWith("/blog");
  const utilsActive = pathname?.startsWith("/utilidades");
  const aboutActive = pathname?.startsWith("/sobre-nosotros");
  const contActive = pathname?.startsWith("/contacto");

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2 md:gap-3">
          {/* Wordmark */}
          <span className="brand-wordmark text-xl md:text-2xl font-semibold md:font-bold tracking-tight leading-tight text-zinc-900">
            Aureya
          </span>

          {/* Punto dorado (ajuste óptico) */}
          <span
            aria-hidden
            className="hidden md:inline-block h-2 w-2 rounded-full md:translate-y-[1px]"
            style={{ backgroundColor: "hsl(var(--brand))" }}
          />

          {/* Slogan */}
          <span className="hidden md:inline text-sm text-zinc-600 leading-none md:translate-y-[1px]">
            Tu guía en metales preciosos
          </span>

          <span className="sr-only">Aureya — Comparador de Oro y Plata</span>
        </Link>

        {/* DESKTOP */}
        <nav className="hidden md:flex items-center gap-4 text-sm text-zinc-700">
          <Link
            href="/tiendas"
            className={[
              "px-2 py-1 link-brand-underline",
              tiendasActive ? "is-active" : ""
            ].join(" ")}
          >
            Tiendas
          </Link>

          <DesktopDropdown
            label="Oro"
            href="/oro"
            active={!!oroActive}
            items={[
              { href: "/oro/lingotes", label: "Lingotes de oro" },
              { href: "/oro/monedas", label: "Monedas de oro" },
            ]}
          />

          <DesktopDropdown
            label="Plata"
            href="/plata"
            active={!!plataActive}
            items={[
              { href: "/plata/lingotes", label: "Lingotes de plata" },
              { href: "/plata/monedas", label: "Monedas de plata" },
            ]}
          />

          {/* NUEVO: Utilidades (calculadoras) */}
          <DesktopDropdown
            label="Utilidades"
            href="/utilidades"
            active={!!utilsActive}
            items={[
              { href: "/utilidades/valorar-oro", label: "Valorar oro" },
              { href: "/utilidades/calculadora-inversion", label: "Calculadora de inversión" },
              { href: "/utilidades/conversor", label: "Conversor g ↔ oz ↔ €/g" },
            ]}
          />

          {/* NUEVO: Aprender = Guías + Blog */}
          <DesktopDropdown
            label="Aprender"
            href="/guias"
            active={!!aprenderActive}
            items={[
              { href: "/guias", label: "Guías" },
              { href: "/blog", label: "Blog" },
            ]}
          />

          <Link
            href="/sobre-nosotros"
            className={[
              "px-2 py-1 link-brand-underline",
              aboutActive ? "is-active" : ""
            ].join(" ")}
          >
            Sobre nosotros
          </Link>

          <Link
            href="/contacto"
            className={[
              "px-2 py-1 link-brand-underline",
              contActive ? "is-active" : ""
            ].join(" ")}
          >
            Contacto
          </Link>
        </nav>

        {/* BOTÓN MÓVIL */}
        <button
          className="md:hidden inline-flex items-center gap-2 rounded px-2 py-1 hover:bg-zinc-100"
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
        >
          <span className="text-sm">Menú</span>
          <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
            <path fill="currentColor" d="M4 6h16v2H4V6Zm0 5h16v2H4v-2Zm0 5h16v2H4v-2Z" />
          </svg>
        </button>
      </div>

      {/* hairline inferior */}
      <div
        className="h-px w-full bg-gradient-to-r from-transparent via-zinc-200 to-transparent"
        aria-hidden="true"
      />

      {/* MÓVIL */}
      {mobileOpen && (
        <div id="mobile-nav" className="md:hidden border-t bg-white shadow-sm">
          <nav className="mx-auto max-w-6xl px-4 py-4 grid gap-5 text-sm">
            {/* Tiendas */}
            <div>
              <Link
                href="/tiendas"
                onClick={() => setMobileOpen(false)}
                className="block font-medium mb-2 underline underline-offset-2"
              >
                Tiendas
              </Link>
            </div>

            {/* Oro */}
            <div>
              <Link
                href="/oro"
                onClick={() => setMobileOpen(false)}
                className="block font-medium mb-2 underline underline-offset-2"
              >
                Oro
              </Link>
              <div className="flex gap-2">
                <Link
                  href="/oro/lingotes"
                  onClick={() => setMobileOpen(false)}
                  className="px-2 py-1 rounded bg-zinc-50 hover:bg-zinc-100"
                >
                  Lingotes
                </Link>
                <Link
                  href="/oro/monedas"
                  onClick={() => setMobileOpen(false)}
                  className="px-2 py-1 rounded bg-zinc-50 hover:bg-zinc-100"
                >
                  Monedas
                </Link>
              </div>
            </div>

            {/* Plata */}
            <div>
              <Link
                href="/plata"
                onClick={() => setMobileOpen(false)}
                className="block font-medium mb-2 underline underline-offset-2"
              >
                Plata
              </Link>
              <div className="flex gap-2">
                <Link
                  href="/plata/lingotes"
                  onClick={() => setMobileOpen(false)}
                  className="px-2 py-1 rounded bg-zinc-50 hover:bg-zinc-100"
                >
                  Lingotes
                </Link>
                <Link
                  href="/plata/monedas"
                  onClick={() => setMobileOpen(false)}
                  className="px-2 py-1 rounded bg-zinc-50 hover:bg-zinc-100"
                >
                  Monedas
                </Link>
              </div>
            </div>

            {/* Utilidades */}
            <div>
              <Link
                href="/utilidades"
                onClick={() => setMobileOpen(false)}
                className="block font-medium mb-2 underline underline-offset-2"
              >
                Utilidades
              </Link>
              <div className="flex flex-wrap gap-2">
                <Link href="/utilidades/valorar-oro" onClick={() => setMobileOpen(false)} className="px-2 py-1 rounded bg-zinc-50 hover:bg-zinc-100">
                  Valorar oro
                </Link>
                <Link href="/utilidades/calculadora-inversion" onClick={() => setMobileOpen(false)} className="px-2 py-1 rounded bg-zinc-50 hover:bg-zinc-100">
                  Calculadora de inversión
                </Link>
                <Link href="/utilidades/conversor" onClick={() => setMobileOpen(false)} className="px-2 py-1 rounded bg-zinc-50 hover:bg-zinc-100">
                  Conversor
                </Link>
              </div>
            </div>

            {/* Aprender */}
            <div>
              <Link
                href="/guias"
                onClick={() => setMobileOpen(false)}
                className="block font-medium mb-2 underline underline-offset-2"
              >
                Aprender
              </Link>
              <div className="flex gap-2">
                <Link
                  href="/guias"
                  onClick={() => setMobileOpen(false)}
                  className="px-2 py-1 rounded bg-zinc-50 hover:bg-zinc-100"
                >
                  Guías
                </Link>
                <Link
                  href="/blog"
                  onClick={() => setMobileOpen(false)}
                  className="px-2 py-1 rounded bg-zinc-50 hover:bg-zinc-100"
                >
                  Blog
                </Link>
              </div>
            </div>

            <div className="h-px bg-zinc-200 my-2" />

            {/* Secundario */}
            <div className="flex items-center gap-4">
              <Link href="/sobre-nosotros" onClick={() => setMobileOpen(false)} className="hover:underline">
                Sobre nosotros
              </Link>
              <Link href="/contacto" onClick={() => setMobileOpen(false)} className="hover:underline">
                Contacto
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
