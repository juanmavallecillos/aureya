// app/contacto/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageSquare, ShieldCheck, ArrowUpRight } from "lucide-react";
import ContactForm from "@/components/ContactForm";

export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
  const canonical = `${base}/contacto`;
  return {
    title: "Contacto · Aureya",
    description: "Escríbenos para consultas, colaboraciones o incidencias relacionadas con el comparador.",
    alternates: { canonical },
    openGraph: { url: canonical, title: "Contacto · Aureya", type: "website" },
    twitter: { card: "summary_large_image", title: "Contacto · Aureya" },
    robots: { index: true, follow: true },
  };
}

export default function ContactPage() {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "contacto@aureya.es";

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16">
      {/* Título + hairline */}
      <section className="pt-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Contacto</h1>
        <p className="mt-2 text-sm text-zinc-700">
          ¿Tienes una pregunta o propuesta? Te leemos.
        </p>
        <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-[hsl(var(--brand))] to-transparent" />
      </section>

      {/* Bloque SEO */}
      <section
        className="mt-4 rounded-lg pl-4 pr-3 py-3"
        style={{ borderLeft: "4px solid hsl(var(--brand))", background: "hsl(var(--brand) / 0.035)" }}
      >
        <h2 className="text-lg md:text-xl font-semibold text-zinc-900">Escríbenos</h2>
        <p className="mt-1 text-sm text-zinc-700">
          Resolvemos dudas del comparador, escuchamos feedback y valoramos colaboraciones con tiendas y creadores.
        </p>
      </section>

      {/* Grid dos columnas */}
      <section className="mt-6 grid gap-6 md:grid-cols-[1fr_340px] items-start">
        {/* Card Form bonita */}
        <div className="relative overflow-hidden rounded-2xl bg-white ring-1 ring-inset ring-zinc-200 shadow-sm transition-shadow hover:shadow-md">
          <div className="absolute inset-x-0 top-0 h-1 bg-[hsl(var(--brand)/0.9)]" />
          <div className="px-5 pt-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[hsl(var(--brand))]" />
              <h3 className="text-base md:text-lg font-semibold text-zinc-900">Formulario de contacto</h3>
            </div>
            <p className="mt-1 text-sm text-zinc-600">
              Te contestaremos lo antes posible. Si es una incidencia, incluye el SKU o la URL.
            </p>
          </div>
          <div className="p-5">
            <ContactForm />
          </div>
        </div>

        {/* Card Otras vías con iconos */}
        <aside className="relative overflow-hidden rounded-2xl bg-white ring-1 ring-inset ring-zinc-200 shadow-sm transition-shadow hover:shadow-md">
          <div className="absolute inset-x-0 top-0 h-1 bg-[hsl(var(--brand)/0.9)]" />
          <div className="p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[hsl(var(--brand))]" />
              <h3 className="text-base md:text-lg font-semibold text-zinc-900">Otras vías</h3>
            </div>
            <ul className="mt-3 space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 text-zinc-500" />
                <div>
                  <div className="text-zinc-900 font-medium">Email</div>
                  <a className="text-[hsl(var(--brand))] hover:underline" href={`mailto:${email}`}>
                    {email}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <ArrowUpRight className="mt-0.5 h-4 w-4 text-zinc-500" />
                <div>
                  <div className="text-zinc-900 font-medium">FAQ</div>
                  <Link className="text-[hsl(var(--brand))] hover:underline" href="/faq">
                    Consulta preguntas frecuentes
                  </Link>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <ArrowUpRight className="mt-0.5 h-4 w-4 text-zinc-500" />
                <div>
                  <div className="text-zinc-900 font-medium">Tiendas verificadas</div>
                  <Link className="text-[hsl(var(--brand))] hover:underline" href="/tiendas">
                    Ver listado de tiendas
                  </Link>
                </div>
              </li>
            </ul>
          </div>
        </aside>
      </section>
    </main>
  );
}
