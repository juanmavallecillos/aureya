"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/* =========================
   NUEVO: Mega dropdown “Metales” (2 columnas: Oro / Plata)
   ========================= */
type MenuGroup = {
  label: string; // "Oro" | "Plata" (escala a platino, etc.)
  baseHref: string; // "/oro" | "/plata"
  items: { href: string; label: string }[];
};

function DesktopMegaDropdown({
  label,
  href,
  groups,
  active,
}: {
  label: string;
  href: string;
  groups: MenuGroup[];
  active?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);

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
          active ? "is-active" : "",
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

      {/* Hitbox puente */}
      <div
        aria-hidden
        className={["absolute left-0 right-0 top-full", open ? "block" : "hidden"].join(" ")}
        style={{ height: 8 }}
      />

      {/* Panel mega */}
      <div
        aria-hidden={!open}
        role="menu"
        onFocus={onFocus}
        onBlur={onBlur}
        className={[
          "absolute left-0 top-full z-50 w-[520px] max-w-[min(90vw,640px)]",
          "mt-0 -translate-y-px",
          "rounded-2xl border border-zinc-200/80 bg-white/95 backdrop-blur-md",
          "shadow-[0_10px_30px_rgba(0,0,0,0.08)] ring-1 ring-black/5",
          "transition-all duration-150 ease-out origin-top",
          open
            ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
            : "opacity-0 translate-y-1 scale-95 pointer-events-none",
        ].join(" ")}
      >
        <div className="grid grid-cols-2 gap-2 p-3">
          {groups.map((g) => (
            <div key={g.baseHref} className="rounded-xl p-2">
              {/* Cabecera de grupo (clicable al índice del metal) */}
              <Link
                href={g.baseHref}
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-2 px-2 py-1.5 rounded-lg text-[15px] font-medium hover:bg-zinc-50 text-zinc-900"
              >
                <span>{g.label}</span>
                <svg className="h-4 w-4 opacity-60" viewBox="0 0 24 24" aria-hidden>
                  <path fill="currentColor" d="M10 6l6 6-6 6-1.4-1.4L12.2 12 8.6 7.4 10 6z" />
                </svg>
              </Link>

              {/* Items */}
              <ul className="mt-1 space-y-1">
                {g.items.map((it) => (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      onClick={() => setOpen(false)}
                      className={[
                        "group flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm",
                        "text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50 transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand)/0.35)]",
                      ].join(" ")}
                    >
                      <span
                        aria-hidden
                        className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--brand))] opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition"
                      />
                      <span>{it.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* =========================
   NUEVO: Acordeón móvil agrupado para “Metales”
   ========================= */
function MobileAccordionGroup({
  label,
  href,
  groups,
  openByDefault,
  isActive,
  onNavigate,
}: {
  label: string;
  href?: string;
  groups: MenuGroup[];
  openByDefault?: boolean;
  isActive: (p: string) => boolean;
  onNavigate: () => void;
}) {
  const [open, setOpen] = useState(!!openByDefault);
  const toggle = () => setOpen((o) => !o);

  const anyChildActive =
    groups.some((g) => isActive(g.baseHref) || g.items.some((it) => isActive(it.href))) ||
    (href ? isActive(href) : false);

  return (
    <div>
      <div className="flex items-center justify-between">
        {/* Título con enlace a /metales */}
        <Link
          href={href ?? "#"}
          onClick={onNavigate}
          className={[
            "block rounded-lg px-3 py-2",
            anyChildActive
              ? "bg-[hsl(var(--brand)/0.10)] text-[hsl(var(--brand))] font-medium"
              : "hover:bg-zinc-50",
          ].join(" ")}
          aria-label={label}
        >
          {label}
        </Link>

        {/* Chevron para abrir/cerrar el acordeón */}
        <button
          onClick={toggle}
          className="rounded p-2 hover:bg-zinc-100"
          aria-expanded={open}
          aria-controls={`acc-${label}`}
          aria-label={`Desplegar ${label}`}
        >
          <svg
            className="h-4 w-4 transition-transform"
            style={{ transform: open ? "rotate(180deg)" : "none" }}
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path fill="currentColor" d="M7 10l5 5 5-5H7z" />
          </svg>
        </button>
      </div>

      <div
        id={`acc-${label}`}
        className={[
          "grid overflow-hidden transition-[grid-template-rows,opacity] duration-150 ease-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        ].join(" ")}
      >
        <div className="min-h-0">
          <div className="px-3 pb-2 pt-1 space-y-3">
            {groups.map((g) => (
              <div key={g.baseHref}>
                <Link
                  href={g.baseHref}
                  onClick={onNavigate}
                  className={[
                    "inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-sm",
                    isActive(g.baseHref)
                      ? "bg-[hsl(var(--brand)/0.12)] text-[hsl(var(--brand))] font-medium"
                      : "bg-zinc-50 hover:bg-zinc-100 text-zinc-800",
                  ].join(" ")}
                >
                  <span className="font-medium">{g.label}</span>
                  <svg className="h-4 w-4 opacity-60" viewBox="0 0 24 24" aria-hidden>
                    <path fill="currentColor" d="M10 6l6 6-6 6-1.4-1.4L12.2 12 8.6 7.4 10 6z" />
                  </svg>
                </Link>

                <div className="mt-2 flex flex-wrap gap-2">
                  {g.items.map((it) => (
                    <Link
                      key={it.href}
                      href={it.href}
                      onClick={onNavigate}
                      className={[
                        "px-3 py-1.5 rounded-lg text-sm",
                        isActive(it.href)
                          ? "bg-[hsl(var(--brand)/0.12)] text-[hsl(var(--brand))] font-medium"
                          : "bg-zinc-50 hover:bg-zinc-100 text-zinc-800",
                      ].join(" ")}
                    >
                      {it.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================
   Header
   ========================= */
export default function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const rawPathname = usePathname();
  // Normaliza: si viene vacío/undefined en producción, trátalo como "/"
  const pathname = rawPathname && rawPathname.length > 0 ? rawPathname : "/";
  const normalize = (p: string) => (p === "/" ? "/" : p.replace(/\/+$/, ""));
  const isActive = (p: string) => {
    const cur = normalize(pathname);
    const tgt = normalize(p);
    if (tgt === "/") return cur === "/";
    return cur === tgt || cur.startsWith(tgt + "/");
  };

  const inicioActive = isActive("/");
  const tiendasActive = isActive("/tiendas");
  const metalesActive = isActive("/oro") || isActive("/plata") || isActive("/metales");
  const aboutActive = isActive("/sobre-nosotros");
  const contActive = isActive("/contacto");

  // 🔒: bloquea scroll cuando está abierto
  useEffect(() => {
    if (mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [mobileOpen]);
  // 🔁: cierra al cambiar de ruta
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // ⎋: cierra con Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const metalGroups: MenuGroup[] = [
    {
      label: "Oro",
      baseHref: "/oro",
      items: [
        { href: "/oro/lingotes", label: "Lingotes de oro" },
        { href: "/oro/monedas", label: "Monedas de oro" },
      ],
    },
    {
      label: "Plata",
      baseHref: "/plata",
      items: [
        { href: "/plata/lingotes", label: "Lingotes de plata" },
        { href: "/plata/monedas", label: "Monedas de plata" },
      ],
    },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2 md:gap-3">
          {/* Wordmark */}
          <span className="brand-wordmark text-xl md:text-2xl font-semibold md:font-bold tracking-tight leading-tight text-zinc-900">
            Aureya
          </span>

          {/* Punto dorado */}
          <span
            aria-hidden
            className="inline-block h-1.5 w-1.5 md:h-2 md:w-2 rounded-full relative top-[2px] md:translate-y-[1px]"
            style={{ backgroundColor: "hsl(var(--brand))" }}
          />

          {/* Slogan */}
          <span className="hidden md:inline text-sm text-zinc-600 leading-none md:translate-y-[2px]">
            Tu guía en metales preciosos
          </span>

          <span className="sr-only">Aureya — Comparador de Oro y Plata</span>
        </Link>

        {/* DESKTOP */}
        <nav className="hidden md:flex items-center gap-4 text-sm text-zinc-700">
          <Link
            href="/"
            className={["px-2 py-1 link-brand-underline", inicioActive ? "is-active" : ""].join(
              " "
            )}
          >
            Inicio
          </Link>

          <Link
            href="/tiendas"
            className={["px-2 py-1 link-brand-underline", tiendasActive ? "is-active" : ""].join(
              " "
            )}
          >
            Tiendas
          </Link>

          {/* METALES (mega dropdown) */}
          <DesktopMegaDropdown
            label="Metales"
            href="/metales"
            active={!!metalesActive}
            groups={metalGroups}
          />

          <Link
            href="/sobre-nosotros"
            className={["px-2 py-1 link-brand-underline", aboutActive ? "is-active" : ""].join(
              " "
            )}
          >
            Sobre nosotros
          </Link>

          <Link
            href="/contacto"
            className={["px-2 py-1 link-brand-underline", contActive ? "is-active" : ""].join(
              " "
            )}
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
          aria-label="Abrir menú"
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
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />

          {/* Sheet */}
          <div
            id="mobile-nav"
            className="fixed inset-x-0 top-0 z-50 origin-top animate-in fade-in slide-in-from-top duration-150
                      bg-white shadow-lg md:hidden"
            role="dialog"
            aria-modal="true"
          >
            {/* Header del sheet */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <span className="text-base font-medium">Menú</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded p-2 hover:bg-zinc-100"
                aria-label="Cerrar menú"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
                  <path
                    fill="currentColor"
                    d="M18.3 5.7 12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7 4.3 4.3 10.6 10.6 16.9 4.3z"
                  />
                </svg>
              </button>
            </div>

            {/* Contenido */}
            <nav className="max-h-[80vh] overflow-y-auto px-4 py-4 grid gap-5 text-sm">
              {/* Inicio */}
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className={[
                  "block rounded-lg px-3 py-2",
                  isActive("/")
                    ? "bg-[hsl(var(--brand)/0.10)] text-[hsl(var(--brand))] font-medium"
                    : "hover:bg-zinc-50",
                ].join(" ")}
              >
                Inicio
              </Link>

              {/* Tiendas */}
              <Link
                href="/tiendas"
                onClick={() => setMobileOpen(false)}
                className={[
                  "block rounded-lg px-3 py-2",
                  isActive("/tiendas")
                    ? "bg-[hsl(var(--brand)/0.10)] text-[hsl(var(--brand))] font-medium"
                    : "hover:bg-zinc-50",
                ].join(" ")}
              >
                Tiendas
              </Link>

              {/* METALES (acordeón agrupado) */}
              <MobileAccordionGroup
                label="Metales"
                href="/metales"
                groups={metalGroups}
                openByDefault={isActive("/oro") || isActive("/plata")}
                isActive={isActive}
                onNavigate={() => setMobileOpen(false)}
              />

              <div className="h-px bg-zinc-200 my-1" />

              {/* Secundario */}
              <div className="grid gap-2">
                <Link
                  href="/sobre-nosotros"
                  onClick={() => setMobileOpen(false)}
                  className={[
                    "block rounded-lg px-3 py-2",
                    isActive("/sobre-nosotros")
                      ? "bg-[hsl(var(--brand)/0.10)] text-[hsl(var(--brand))] font-medium"
                      : "hover:bg-zinc-50",
                  ].join(" ")}
                >
                  Sobre nosotros
                </Link>
                <Link
                  href="/contacto"
                  onClick={() => setMobileOpen(false)}
                  className={[
                    "block rounded-lg px-3 py-2",
                    isActive("/contacto")
                      ? "bg-[hsl(var(--brand)/0.10)] text-[hsl(var(--brand))] font-medium"
                      : "hover:bg-zinc-50",
                  ].join(" ")}
                >
                  Contacto
                </Link>
              </div>

              {/* (Opcional) Futuro: Utilidades / Blog */}
              {/* <div className="h-px bg-zinc-200 my-1" />
              <Link href="/utilidades" ...>Utilidades</Link>
              <Link href="/blog" ...>Blog</Link> */}
            </nav>
          </div>
        </>
      )}
    </header>
  );
}
