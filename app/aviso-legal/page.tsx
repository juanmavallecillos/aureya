// app/aviso-legal/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Scale, FileText, Shield, AlertTriangle, Server } from "lucide-react";

export const revalidate = 86400; // 24h

export async function generateMetadata(): Promise<Metadata> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://aureya.es").replace(
    /\/+$/,
    ""
  );
  const canonical = `${base}/aviso-legal`;
  return {
    title: "Aviso legal · Aureya",
    description:
      "Aviso legal de Aureya. Información del titular, condiciones de uso y limitaciones de responsabilidad.",
    alternates: { canonical },
    openGraph: { url: canonical, title: "Aviso legal · Aureya", type: "website" },
    twitter: { card: "summary_large_image", title: "Aviso legal · Aureya" },
    robots: { index: true, follow: true },
  };
}

export default function LegalNoticePage() {
  // Si más adelante quieres mostrar el dominio en texto, úsalo desde env:
  const site = (process.env.NEXT_PUBLIC_SITE_URL || "https://aureya.es").replace(/\/+$/, "");

  return (
    <main className="mx-auto max-w-4xl px-4 pb-16">
      {/* Título */}
      <section className="pt-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Aviso legal</h1>
        <p className="mt-2 text-sm text-zinc-700">
          Información legal y condiciones generales de uso del sitio web Aureya.
        </p>
        <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-[hsl(var(--brand))] to-transparent" />
      </section>

      {/* Introducción */}
      <section className="mt-6 text-sm text-zinc-700 space-y-3">
        <p>
          En cumplimiento de la normativa aplicable, incluyendo la{" "}
          <strong>Ley 34/2002</strong>, de 11 de julio, de servicios de la sociedad de la información
          y de comercio electrónico (LSSI-CE), se facilitan a continuación los datos identificativos
          del responsable del sitio web, así como las condiciones de uso.
        </p>
      </section>

      {/* Titular */}
      <section className="mt-8 space-y-2">
        <div className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-[hsl(var(--brand))]" />
          <h2 className="text-lg font-semibold">Titular del sitio web</h2>
        </div>
        <ul className="text-sm text-zinc-700 space-y-1">
          <li>
            <strong>Nombre comercial:</strong> Aureya
          </li>
          <li>
            <strong>Correo electrónico de contacto:</strong> contacto@aureya.es
          </li>
          <li>
            <strong>Ámbito:</strong> España
          </li>
          <li>
            <strong>Actividad:</strong> plataforma informativa y comparador de precios de metales preciosos
          </li>
          <li>
            <strong>Sitio web:</strong> {site}
          </li>
        </ul>
        <p className="text-xs text-zinc-600">
          Nota: si más adelante Aureya se explota mediante sociedad o alta como autónomo, esta sección
          se actualizará con los datos fiscales correspondientes.
        </p>
      </section>

      {/* Objeto */}
      <section className="mt-8 space-y-2">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-[hsl(var(--brand))]" />
          <h2 className="text-lg font-semibold">Objeto del sitio web</h2>
        </div>
        <div className="text-sm text-zinc-700 space-y-3">
          <p>
            Aureya es una plataforma de carácter <strong>informativo</strong> cuyo objetivo es facilitar
            la comparación de precios, primas y evolución histórica de productos de inversión en metales
            preciosos ofrecidos por terceros (distribuidores y comercios externos).
          </p>
          <p>
            Aureya <strong>no vende</strong> productos, <strong>no intermedia</strong> en operaciones comerciales
            y <strong>no actúa como asesor</strong> financiero, fiscal ni de inversión.
          </p>
        </div>
      </section>

      {/* Naturaleza de la información */}
      <section className="mt-8 space-y-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-[hsl(var(--brand))]" />
          <h2 className="text-lg font-semibold">Naturaleza de la información</h2>
        </div>
        <div className="text-sm text-zinc-700 space-y-3">
          <p>
            Los precios, stocks, condiciones y demás información mostrada en Aureya provienen de fuentes externas y
            pueden variar con el tiempo. Por ello, Aureya no garantiza la exactitud absoluta ni la disponibilidad
            permanente de la información publicada.
          </p>
          <p>
            El usuario se compromete a <strong>verificar siempre</strong> en la web del distribuidor las condiciones
            finales antes de realizar cualquier compra (precio total, envío, disponibilidad, impuestos, etc.).
          </p>
        </div>
      </section>

      {/* Condiciones de uso */}
      <section className="mt-8 space-y-2">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-[hsl(var(--brand))]" />
          <h2 className="text-lg font-semibold">Condiciones de uso</h2>
        </div>
        <div className="text-sm text-zinc-700 space-y-3">
          <p>
            El acceso y uso de este sitio web atribuye la condición de usuario e implica la aceptación de este Aviso Legal.
            El usuario se compromete a utilizar el sitio web de forma lícita, responsable y conforme a la legislación vigente.
          </p>
          <p>
            Queda prohibido el uso del sitio web con fines ilícitos, así como cualquier actuación que pueda causar daños,
            impedir el funcionamiento normal del servicio o afectar a terceros.
          </p>
        </div>
      </section>

      {/* Limitación de responsabilidad */}
      <section className="mt-8 space-y-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-[hsl(var(--brand))]" />
          <h2 className="text-lg font-semibold">Limitación de responsabilidad</h2>
        </div>
        <div className="text-sm text-zinc-700 space-y-3">
          <p>
            Aureya no será responsable de las decisiones que el usuario adopte basándose en la información del sitio,
            ni de los daños o perjuicios derivados del uso de la misma.
          </p>
          <p>
            Aureya tampoco se responsabiliza de interrupciones del servicio, errores técnicos o incidencias derivadas
            de redes, sistemas de terceros o mantenimientos necesarios.
          </p>
        </div>
      </section>

      {/* Enlaces a terceros */}
      <section className="mt-8 space-y-2">
        <div className="flex items-center gap-2">
          <Server className="h-5 w-5 text-[hsl(var(--brand))]" />
          <h2 className="text-lg font-semibold">Enlaces a terceros</h2>
        </div>
        <div className="text-sm text-zinc-700 space-y-3">
          <p>
            Este sitio web puede incluir enlaces a páginas externas de terceros. Aureya no controla ni se hace responsable
            del contenido, funcionamiento, disponibilidad o políticas (incluida la privacidad) de dichos sitios.
          </p>
          <p>
            La inclusión de enlaces no implica relación comercial ni aprobación expresa por parte de Aureya,
            salvo que se indique lo contrario.
          </p>
        </div>
      </section>

      {/* Propiedad intelectual */}
      <section className="mt-8 space-y-2">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-[hsl(var(--brand))]" />
          <h2 className="text-lg font-semibold">Propiedad intelectual e industrial</h2>
        </div>
        <p className="text-sm text-zinc-700">
          Los contenidos del sitio web (textos, diseño, estructura y código) están protegidos por la normativa de propiedad
          intelectual e industrial. Queda prohibida su reproducción, distribución o modificación total o parcial sin autorización
          expresa del titular.
        </p>
      </section>

      {/* Legislación y jurisdicción */}
      <section className="mt-8 space-y-2">
        <div className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-[hsl(var(--brand))]" />
          <h2 className="text-lg font-semibold">Legislación aplicable y jurisdicción</h2>
        </div>
        <p className="text-sm text-zinc-700">
          La relación entre Aureya y el usuario se regirá por la legislación española. Para cualquier controversia que pudiera
          derivarse del acceso o uso del sitio web, las partes se someterán a los juzgados y tribunales competentes de España,
          salvo que la normativa de consumo establezca otro fuero imperativo.
        </p>
      </section>
        
      {/* Enlaces legales */}
      <section className="mt-10 text-sm text-zinc-700">
        <p>
          Para más información, consulta nuestra{" "}
          <Link href="/privacidad" className="text-[hsl(var(--brand))] hover:underline">
            Política de privacidad
          </Link>{" "}
          y{" "}
          <Link href="/cookies" className="text-[hsl(var(--brand))] hover:underline">
            Política de cookies
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
