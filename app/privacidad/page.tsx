// app/privacidad/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, User, Database, Lock, Clock, Mail, AlertTriangle, FileText } from "lucide-react";

export const revalidate = 86400; // 24h

export async function generateMetadata(): Promise<Metadata> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://aureya.es").replace(/\/+$/, "");
  const canonical = `${base}/privacidad`;
  return {
    title: "Política de privacidad · Aureya",
    description:
      "Política de privacidad de Aureya. Información sobre tratamiento de datos personales, derechos del usuario y medidas de seguridad.",
    alternates: { canonical },
    openGraph: { url: canonical, title: "Política de privacidad · Aureya", type: "website" },
    twitter: { card: "summary_large_image", title: "Política de privacidad · Aureya" },
    robots: { index: true, follow: true },
  };
}

export default function PrivacyPolicyPage() {
  const site = (process.env.NEXT_PUBLIC_SITE_URL || "https://aureya.es").replace(/\/+$/, "");

  return (
    <main className="mx-auto max-w-4xl px-4 pb-16">
      {/* Título */}
      <section className="pt-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Política de privacidad</h1>
        <p className="mt-2 text-sm text-zinc-700">
          Información sobre cómo se tratan los datos personales en Aureya.
        </p>
        <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-[hsl(var(--brand))] to-transparent" />
      </section>

      {/* Intro */}
      <section className="mt-6 text-sm text-zinc-700 space-y-3">
        <p>
          Esta Política de privacidad describe cómo Aureya trata los datos personales de los usuarios,
          de conformidad con el Reglamento (UE) 2016/679 (RGPD) y la normativa española aplicable.
        </p>
        <p className="text-xs text-zinc-600">
          Resumen: Aureya no requiere registro de usuario para consultar precios. Solo tratamos datos si nos
          contactas (por email u otros canales) o si aceptas cookies no esenciales (ver cookies).
        </p>
      </section>

      {/* Responsable */}
      <section className="mt-8 space-y-2">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-[hsl(var(--brand))]" />
          <h2 className="text-lg font-semibold">Responsable del tratamiento</h2>
        </div>
        <ul className="text-sm text-zinc-700 space-y-1">
          <li>
            <strong>Nombre comercial:</strong> Aureya
          </li>
          <li>
            <strong>Sitio web:</strong> {site}
          </li>
          <li>
            <strong>Contacto:</strong> contacto@aureya.es
          </li>
        </ul>
        <p className="text-xs text-zinc-600">
          Si en el futuro Aureya se gestiona mediante sociedad o alta como autónomo, estos datos se actualizarán con
          la información fiscal correspondiente.
        </p>
      </section>

      {/* Qué datos recogemos */}
      <section className="mt-8 space-y-2">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-[hsl(var(--brand))]" />
          <h2 className="text-lg font-semibold">Datos personales que se recogen</h2>
        </div>

        <div className="text-sm text-zinc-700 space-y-3">
          <p>
            Aureya está diseñada para funcionar sin registro. Por defecto, no necesitas facilitar datos personales
            para navegar por el sitio.
          </p>

          <p>Podemos tratar datos personales en estos casos:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Si nos contactas:</strong> nombre (si lo incluyes), email, y el contenido del mensaje.
            </li>
            <li>
              <strong>Si aceptas cookies no esenciales:</strong> identificadores online (por ejemplo, cookies) y datos
              de uso/analítica, según la configuración de cookies.
            </li>
          </ul>

          <p className="text-xs text-zinc-600">
            Importante: los precios, ofertas y enlaces mostrados en Aureya provienen de tiendas de terceros. Cuando
            haces clic para ir a una tienda, esa tienda puede tratar tus datos según sus propias políticas.
          </p>
        </div>
      </section>

      {/* Finalidades */}
      <section className="mt-8 space-y-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-[hsl(var(--brand))]" />
          <h2 className="text-lg font-semibold">Finalidades del tratamiento</h2>
        </div>

        <div className="text-sm text-zinc-700 space-y-3">
          <p>Tratamos los datos personales únicamente para:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Responder a consultas, solicitudes de información o comunicaciones.</li>
            <li>Gestionar la relación con tiendas/partners (p. ej., verificaciones, incidencias, acuerdos).</li>
            <li>
              Mejorar el sitio y su rendimiento (solo si el usuario acepta cookies/tecnologías no esenciales, cuando
              aplique).
            </li>
          </ul>
        </div>
      </section>

      {/* Base legal */}
      <section className="mt-8 space-y-2">
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-[hsl(var(--brand))]" />
          <h2 className="text-lg font-semibold">Base legal del tratamiento</h2>
        </div>

        <div className="text-sm text-zinc-700 space-y-3">
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Consentimiento</strong>: cuando nos escribes voluntariamente o aceptas cookies no esenciales.
            </li>
            <li>
              <strong>Interés legítimo</strong>: seguridad del sitio, prevención de fraude/abuso y mantenimiento técnico
              (en la medida permitida por la ley).
            </li>
            <li>
              <strong>Cumplimiento legal</strong>: cuando exista una obligación normativa aplicable.
            </li>
          </ul>
        </div>
      </section>

      {/* Conservación */}
      <section className="mt-8 space-y-2">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-[hsl(var(--brand))]" />
          <h2 className="text-lg font-semibold">Conservación de los datos</h2>
        </div>

        <div className="text-sm text-zinc-700 space-y-3">
          <p>
            Conservaremos los datos personales el tiempo estrictamente necesario para cumplir la finalidad para la que
            se recabaron y, en su caso, durante los plazos exigidos por ley.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Consultas por email:</strong> mientras sea necesario para atender la solicitud y para el
              seguimiento razonable posterior.
            </li>
            <li>
              <strong>Datos de cookies:</strong> según los plazos indicados en la Política de cookies y/o configuración
              del navegador.
            </li>
          </ul>
        </div>
      </section>

      {/* Destinatarios / terceros */}
      <section className="mt-8 space-y-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-[hsl(var(--brand))]" />
          <h2 className="text-lg font-semibold">Destinatarios y transferencias</h2>
        </div>

        <div className="text-sm text-zinc-700 space-y-3">
          <p>
            Para operar el sitio, Aureya puede apoyarse en proveedores de infraestructura (por ejemplo hosting/CDN y
            servicios de email). Estos proveedores pueden tratar datos en calidad de encargados del tratamiento, bajo
            instrucciones de Aureya y con medidas de seguridad adecuadas.
          </p>
          <p>
            En caso de usar proveedores ubicados fuera del Espacio Económico Europeo o que impliquen transferencias
            internacionales, Aureya procurará aplicar garantías adecuadas (por ejemplo cláusulas contractuales tipo),
            cuando sea exigible.
          </p>
        </div>
      </section>

      {/* Derechos */}
      <section className="mt-8 space-y-2">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-[hsl(var(--brand))]" />
          <h2 className="text-lg font-semibold">Derechos del usuario</h2>
        </div>

        <div className="text-sm text-zinc-700 space-y-3">
          <p>
            Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación del tratamiento y
            portabilidad enviando una solicitud a <strong>contacto@aureya.es</strong>.
          </p>
          <p>
            También tienes derecho a retirar el consentimiento en cualquier momento (sin que ello afecte a la licitud
            del tratamiento previo).
          </p>
          <p className="text-xs text-zinc-600">
            Si consideras que tus derechos no han sido atendidos adecuadamente, puedes presentar una reclamación ante
            la Agencia Española de Protección de Datos (AEPD).
          </p>
        </div>
      </section>

      {/* Seguridad */}
      <section className="mt-8 space-y-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-[hsl(var(--brand))]" />
          <h2 className="text-lg font-semibold">Medidas de seguridad</h2>
        </div>

        <p className="text-sm text-zinc-700">
          Aureya aplica medidas técnicas y organizativas razonables para proteger los datos personales frente a accesos
          no autorizados, pérdida, alteración o divulgación. No obstante, ningún sistema es completamente infalible y
          no puede garantizarse una seguridad absoluta.
        </p>
      </section>

      {/* Cambios */}
      <section className="mt-8 space-y-2">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-[hsl(var(--brand))]" />
          <h2 className="text-lg font-semibold">Cambios en esta política</h2>
        </div>

        <p className="text-sm text-zinc-700">
          Aureya puede actualizar esta Política de privacidad para reflejar cambios legales o técnicos. La versión
          publicada en esta página será la vigente en cada momento.
        </p>
      </section>

      {/* Enlaces */}
      <section className="mt-10 text-sm text-zinc-700">
        <p>
          Para más información, consulta nuestro{" "}
          <Link href="/aviso-legal" className="text-[hsl(var(--brand))] hover:underline">
            Aviso legal
          </Link>{" "}
          y la{" "}
          <Link href="/cookies" className="text-[hsl(var(--brand))] hover:underline">
            Política de cookies
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
