// app/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page-container py-14">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        {/* fondo decorativo sutil */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.035]"
          style={{
            background:
              "radial-gradient(1200px 400px at 20% -10%, hsl(var(--brand)), transparent 60%), radial-gradient(1000px 500px at 120% 40%, hsl(var(--brand)), transparent 60%)",
          }}
        />
        <div className="relative px-6 py-10 md:px-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2">
              <span className="text-xs font-medium tracking-wider uppercase text-[hsl(var(--brand))] bg-[hsl(var(--brand)/0.08)] px-2 py-1 rounded-full">
                Error 404
              </span>
            </div>
            <h1 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight">
              Página no encontrada
            </h1>
            <p className="mt-2 text-sm md:text-base text-zinc-600 max-w-prose">
              No hemos podido localizar esta ruta. Quizá el enlace ha cambiado o ya no existe.
              Puedes volver al inicio o explorar estas secciones recomendadas.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-medium
                           bg-[hsl(var(--brand))] text-[hsl(var(--brand-ink))]
                           hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand)/0.35)]"
              >
                Volver al inicio
                <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
                  <path fill="currentColor" d="M10 17l5-5-5-5v10Z" />
                </svg>
              </Link>
              <Link
                href="/contacto"
                className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-medium
                           border border-[hsl(var(--brand))] text-[hsl(var(--brand))]
                           hover:bg-[hsl(var(--brand)/0.08)]
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand)/0.35)]"
              >
                Informar de enlace roto
                <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
                  <path fill="currentColor" d="M12 3a9 9 0 1 0 .002 18.002A9 9 0 0 0 12 3Zm1 14h-2v-2h2v2Zm0-4h-2V7h2v6Z"/>
                </svg>
              </Link>
            </div>
          </div>

          {/* “404” grande con borde dorado */}
          <div className="shrink-0">
            <div className="relative">
              <div className="absolute -inset-2 rounded-2xl blur-xl opacity-30"
                   style={{ background: "conic-gradient(from 180deg at 50% 50%, hsl(var(--brand)), transparent 40%, hsl(var(--brand)) 80%)" }}
                   aria-hidden />
              <div className="relative rounded-2xl border border-[hsl(var(--brand)/0.45)] bg-white/80 backdrop-blur p-6">
                <div className="text-5xl md:text-6xl font-bold tracking-tighter
                                bg-clip-text text-transparent
                                bg-[linear-gradient(180deg,rgba(0,0,0,0.9),rgba(0,0,0,0.6))]">
                  404
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ENLACES RÁPIDOS */}
      <section className="mt-10">
        <h2 className="text-base font-semibold">Sigue explorando</h2>
        <p className="mt-1 text-sm text-zinc-600">Accesos directos a las áreas principales.</p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <CardLink
            href="/"
            title="Inicio"
            subtitle="Comparador de oro y plata"
            icon={
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                <path fill="currentColor" d="M12 3 4 9v12h6v-6h4v6h6V9l-8-6Z"/>
              </svg>
            }
          />
          <CardLink
            href="/oro"
            title="Oro"
            subtitle="Lingotes y monedas"
            icon={
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                <path fill="currentColor" d="M3 17h18v2H3v-2Zm2-4h14v2H5v-2Zm3-4h8v2H8V9Z"/>
              </svg>
            }
          />
          <CardLink
            href="/plata"
            title="Plata"
            subtitle="Lingotes y monedas"
            icon={
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                <path fill="currentColor" d="M12 2 1 7l11 5 9-4.09V17h2V7L12 2Zm0 9L1 7v10l11 5 11-5V9l-11 2Z"/>
              </svg>
            }
          />
          <CardLink
            href="/tiendas"
            title="Tiendas"
            subtitle="Directorio verificado"
            icon={
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                <path fill="currentColor" d="M4 6h16l-1 7a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5L4 6Zm2 13h12v2H6v-2Z"/>
              </svg>
            }
          />
          <CardLink
            href="/faq"
            title="FAQ"
            subtitle="Preguntas habituales"
            icon={
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                <path fill="currentColor" d="M11 18h2v-2h-2v2Zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm0 17.5c-4.14 0-7.5-3.36-7.5-7.5S7.86 4.5 12 4.5 19.5 7.86 19.5 12 16.14 19.5 12 19.5Zm0-13c-2.21 0-4 1.57-4 3.5h2c0-.83.9-1.5 2-1.5s2 .67 2 1.5c0 1-1 1.22-1.64 1.59-.62.36-1.36.8-1.36 1.91V15h2v-.5c0-.45.39-.66 1.1-1.07.86-.49 1.9-1.1 1.9-2.43C16 7.57 14.21 6.5 12 6.5Z"/>
              </svg>
            }
          />
          <CardLink
            href="/contacto"
            title="Contacto"
            subtitle="Escríbenos"
            icon={
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                <path fill="currentColor" d="M20 4H4v16h16V4Zm-2 4-6 3.99L6 8V6l6 3.99L18 6v2Z"/>
              </svg>
            }
          />
        </div>
      </section>
    </main>
  );
}

/* ---------- CardLink (tarjeta elegante con acento de marca) ---------- */
function CardLink({
  href,
  title,
  subtitle,
  icon,
}: {
  href: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group relative rounded-2xl border border-zinc-200 bg-white p-4
                 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-[0_6px_22px_rgba(0,0,0,0.08)]
                 transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand)/0.35)]"
    >
      {/* acento lateral en hover/focus */}
      <span
        aria-hidden
        className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-[3px] rounded-full
                   bg-[hsl(var(--brand))] opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition"
      />
      <div className="flex items-center gap-3">
        <div
          className="grid h-9 w-9 place-items-center rounded-xl border border-[hsl(var(--brand)/0.35)]
                     bg-[hsl(var(--brand)/0.08)] text-[hsl(var(--brand))]"
        >
          {icon}
        </div>
        <div>
          <div className="font-medium">{title}</div>
          <div className="text-xs text-zinc-600">{subtitle}</div>
        </div>
      </div>
    </Link>
  );
}
