// app/cookies/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Cookie, ShieldCheck, Sliders, Info, Mail } from "lucide-react";

export const revalidate = 86400; // 24h

export async function generateMetadata(): Promise<Metadata> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
  const canonical = `${base}/cookies`;
  return {
    title: "Política de cookies · Aureya",
    description:
      "Política de cookies de Aureya. Qué cookies se usan, para qué sirven y cómo gestionarlas.",
    alternates: { canonical },
    openGraph: { url: canonical, title: "Política de cookies · Aureya", type: "website" },
    twitter: { card: "summary_large_image", title: "Política de cookies · Aureya" },
    robots: { index: true, follow: true },
  };
}

export default function CookiesPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 pb-16">
      {/* Título */}
      <section className="pt-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Política de cookies</h1>
        <p className="mt-2 text-sm text-zinc-700">
          Información clara sobre qué cookies usamos en Aureya y cómo puedes gestionarlas.
        </p>
        <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-[hsl(var(--brand))] to-transparent" />
      </section>

      {/* Intro */}
      <section className="mt-6 text-sm text-zinc-700 space-y-3">
        <p>
          Una cookie es un pequeño archivo que un sitio web puede almacenar en tu dispositivo para
          recordar información técnica (por ejemplo, mantener una sesión o preferencias).
        </p>
        <p>
          En Aureya priorizamos una experiencia rápida y ligera. No usamos cookies con fines de
          publicidad comportamental ni vendemos datos a terceros.
        </p>
      </section>

      {/* Qué cookies usamos */}
      <section className="mt-8 space-y-2">
        <div className="flex items-center gap-2">
          <Cookie className="h-5 w-5 text-[hsl(var(--brand))]" />
          <h2 className="text-lg font-semibold">Qué cookies utiliza Aureya</h2>
        </div>

        <p className="text-sm text-zinc-700">
          Actualmente, Aureya puede utilizar cookies estrictamente necesarias para el funcionamiento
          del sitio, y en algunos entornos una cookie de acceso privado.
        </p>

        <ul className="mt-3 list-disc pl-5 text-sm text-zinc-700 space-y-2">
          <li>
            <strong>Cookies técnicas / necesarias:</strong> imprescindibles para que la web funcione
            correctamente (por ejemplo, carga de recursos, navegación y seguridad básica).
          </li>
          <li>
            <strong>Cookie de acceso privado (si aplica):</strong> en entornos cerrados al público,
            Aureya puede establecer una cookie para recordar que has introducido la contraseña y
            permitirte navegar sin volver a introducirla en cada página.
          </li>
        </ul>

        <p className="text-xs text-zinc-600 mt-2">
          Nota: si en el futuro activamos analítica (por ejemplo, medición de rendimiento o uso),
          actualizaremos esta política y, si corresponde, solicitaremos tu consentimiento.
        </p>
      </section>

      {/* Finalidad */}
      <section className="mt-8 space-y-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-[hsl(var(--brand))]" />
          <h2 className="text-lg font-semibold">Finalidad de las cookies</h2>
        </div>

        <ul className="mt-2 list-disc pl-5 text-sm text-zinc-700 space-y-1">
          <li>Garantizar el funcionamiento correcto del sitio.</li>
          <li>Mantener la seguridad y prevenir usos indebidos.</li>
          <li>(Si aplica) Recordar el acceso a un entorno privado mediante contraseña.</li>
        </ul>
      </section>

      {/* Cómo gestionarlas */}
      <section className="mt-8 space-y-2">
        <div className="flex items-center gap-2">
          <Sliders className="h-5 w-5 text-[hsl(var(--brand))]" />
          <h2 className="text-lg font-semibold">Cómo gestionar o desactivar cookies</h2>
        </div>

        <p className="text-sm text-zinc-700">
          Puedes permitir, bloquear o eliminar cookies desde la configuración de tu navegador. Ten en
          cuenta que, si desactivas cookies técnicas, algunas partes de la web pueden no funcionar
          correctamente.
        </p>

        <p className="text-sm text-zinc-700">
          Normalmente encontrarás estas opciones en <em>Configuración</em> → <em>Privacidad</em> →{" "}
          <em>Cookies</em> (la ruta exacta depende del navegador).
        </p>
      </section>

      {/* Más información */}
      <section className="mt-8 space-y-2">
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-[hsl(var(--brand))]" />
          <h2 className="text-lg font-semibold">Más información</h2>
        </div>

        <p className="text-sm text-zinc-700">
          Para más detalles sobre el tratamiento de datos personales, consulta nuestra{" "}
          <Link href="/privacidad" className="text-[hsl(var(--brand))] hover:underline">
            Política de privacidad
          </Link>{" "}
          y el{" "}
          <Link href="/aviso-legal" className="text-[hsl(var(--brand))] hover:underline">
            Aviso legal
          </Link>
          .
        </p>
      </section>

      {/* Contacto */}
      <section className="mt-8 space-y-2">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-[hsl(var(--brand))]" />
          <h2 className="text-lg font-semibold">Contacto</h2>
        </div>

        <p className="text-sm text-zinc-700">
          Si tienes dudas sobre esta Política de Cookies, escríbenos a{" "}
          <strong>contacto@aureya.es</strong>.
        </p>
      </section>

      {/* Pie */}
      <section className="mt-10 text-xs text-zinc-600">
        <p>Última actualización: {new Date().toLocaleDateString("es-ES")}.</p>
      </section>
    </main>
  );
}
