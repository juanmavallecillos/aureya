// components/SiteFooter.tsx
"use client";

import Link from "next/link";

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-zinc-950 text-zinc-300">
      {/* Línea de acento Aureya */}
      <div
        className="h-[3px] w-full"
        style={{ backgroundColor: "hsl(var(--brand))" }}
        aria-hidden="true"
      />

      <div className="page-container py-10">
        <div
          className="
            grid gap-10
            md:grid-cols-2 lg:grid-cols-4
            "
        >
          {/* Col 1: Marca */}
          <div>
            <div className="font-semibold text-white text-base">Aureya</div>
            <p className="mt-2 text-sm text-zinc-400 max-w-sm">
              Tu guía en metales preciosos. Compara precios y primas frente al spot en tiendas verificadas. Datos cacheados en CDN.
            </p>
          </div>

          {/* Col 2: Catálogo */}
          <div>
            <div className="text-sm font-medium text-white/90 mb-2">Catálogo</div>
            <ul className="space-y-1 text-sm">
              <li><Link href="/oro/lingotes" className="hover:text-white">Lingotes de oro</Link></li>
              <li><Link href="/oro/monedas"  className="hover:text-white">Monedas de oro</Link></li>
              <li><Link href="/plata/lingotes" className="hover:text-white">Lingotes de plata</Link></li>
              <li><Link href="/plata/monedas"  className="hover:text-white">Monedas de plata</Link></li>
              <li><Link href="/tiendas" className="hover:text-white">Tiendas verificadas</Link></li>
            </ul>
          </div>

          {/* Col 3: Aprender */}
          <div>
            <div className="text-sm font-medium text-white/90 mb-2">Aprender</div>
            <ul className="space-y-1 text-sm">
              <li><Link href="/guias" className="hover:text-white">Guías</Link></li>
              <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
              <li><Link href="/faq"  className="hover:text-white">FAQ</Link></li>
              <li><Link href="/como-funciona" className="hover:text-white">Cómo funciona</Link></li>
            </ul>
          </div>

          {/* Col 4: Soporte */}
          <div>
            <div className="text-sm font-medium text-white/90 mb-2">Soporte</div>
            <ul className="space-y-1 text-sm">
              <li><Link href="/sobre-nosotros" className="hover:text-white">Sobre nosotros</Link></li>
              <li><Link href="/contacto" className="hover:text-white">Contacto</Link></li>
              {/* Si más adelante publicas /estado, lo dejamos preparado: */}
              {/* <li><Link href="/estado" className="hover:text-white">Estado de datos</Link></li> */}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-10 h-px w-full bg-white/10" aria-hidden />

        {/* Barra legal inferior */}
        {/* Barra legal inferior (debajo de los links legales) */}
        <div className="mt-2 text-xs text-zinc-500 max-w-3xl md:block hidden">
            Aureya no vende metales preciosos ni gestiona pagos; comparamos información pública de terceros.
        </div>
        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-sm text-zinc-400">
          <div className="space-x-4">
            <Link href="/aviso-legal" className="hover:text-white">Aviso legal</Link>
            <Link href="/privacidad"  className="hover:text-white">Privacidad</Link>
            <Link href="/cookies"     className="hover:text-white">Cookies</Link>
          </div>

          <div className="md:text-right">
            © {year} Aureya
            <span
              className="ml-3 inline-block h-[2px] w-14 align-middle rounded-full"
              style={{ backgroundColor: "hsl(var(--brand))" }}
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
