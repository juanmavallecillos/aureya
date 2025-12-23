// app/contacto/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import {
  Mail,
  MessageSquare,
  ShieldCheck,
  ArrowUpRight,
  Bug,
  Handshake,
  Building2,
  Clock,
  Info,
} from "lucide-react";
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
          ¿Tienes una pregunta, has visto un precio raro o quieres colaborar? Te leemos.
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

      {/* Acciones rápidas */}
      <section className="mt-5">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/contacto?topic=incidencia"
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 hover:bg-zinc-50
                       focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand)/0.35)]"
          >
            <Bug className="h-4 w-4 text-[hsl(var(--brand))]" />
            Reportar incidencia / precio
          </Link>

          <Link
            href="/contacto?topic=tienda"
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 hover:bg-zinc-50
                       focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand)/0.35)]"
          >
            <Building2 className="h-4 w-4 text-[hsl(var(--brand))]" />
            Soy una tienda
          </Link>

          <Link
            href="/contacto?topic=colaboracion"
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 hover:bg-zinc-50
                       focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand)/0.35)]"
          >
            <Handshake className="h-4 w-4 text-[hsl(var(--brand))]" />
            Colaboración / prensa
          </Link>
        </div>
      </section>

      {/* Grid dos columnas */}
      <section className="mt-6 grid gap-6 md:grid-cols-[1fr_360px] items-start">
        {/* Form */}
        <div className="relative overflow-hidden rounded-2xl bg-white ring-1 ring-inset ring-zinc-200 shadow-sm transition-shadow hover:shadow-md">
          <div className="absolute inset-x-0 top-0 h-1 bg-[hsl(var(--brand)/0.9)]" />
          <div className="px-5 pt-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[hsl(var(--brand))]" />
              <h3 className="text-base md:text-lg font-semibold text-zinc-900">Formulario de contacto</h3>
            </div>
            <p className="mt-1 text-sm text-zinc-600">
              Te contestaremos lo antes posible. Si es una incidencia, incluye el SKU o la URL del producto.
            </p>
          </div>
          <div className="p-5">
            <ContactForm />
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Otras vías */}
          <div className="relative overflow-hidden rounded-2xl bg-white ring-1 ring-inset ring-zinc-200 shadow-sm transition-shadow hover:shadow-md">
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
                    <div className="text-zinc-900 font-medium">Tiendas</div>
                    <Link className="text-[hsl(var(--brand))] hover:underline" href="/tiendas">
                      Ver listado de tiendas
                    </Link>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Qué incluir */}
          <div
            className="rounded-2xl border border-zinc-200 bg-white p-5"
            style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.00), rgba(0,0,0,0.00))" }}
          >
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-[hsl(var(--brand))]" />
              <h3 className="text-base md:text-lg font-semibold text-zinc-900">Para ayudarte más rápido</h3>
            </div>
            <ul className="mt-3 space-y-2 text-sm text-zinc-700">
              <li>• <strong>SKU</strong> o URL de la ficha del producto.</li>
              <li>• Si es un precio extraño: <strong>tienda</strong>, <strong>importe</strong> y si incluía envío.</li>
              <li>• Si puedes: una <strong>captura</strong> o enlace directo al producto en la tienda.</li>
            </ul>
          </div>

          {/* Respuesta + privacidad */}
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-[hsl(var(--brand))]" />
              <h3 className="text-base md:text-lg font-semibold text-zinc-900">Tiempos y privacidad</h3>
            </div>
            <p className="mt-2 text-sm text-zinc-700">
              Normalmente respondemos en <strong>24–72h</strong> (laborables). Los datos que envíes se usan solo
              para gestionar tu consulta. Puedes leer más en{" "}
              <Link href="/privacidad" className="text-[hsl(var(--brand))] hover:underline">
                Privacidad
              </Link>
              .
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
