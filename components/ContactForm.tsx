"use client";

import * as React from "react";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Mail,
  User,
  FileText,
  Building2,
  Newspaper,
  BadgeAlert,
  Scale,
} from "lucide-react";
import clsx from "clsx";

type Props = { className?: string };

type Topic = "general" | "incidencia" | "tienda" | "colaboracion" | "legal";

type TopicDef = {
  key: Topic;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  hint: string;
};

const TOPICS: TopicDef[] = [
  {
    key: "general",
    label: "General",
    icon: FileText,
    hint: "Preguntas generales, feedback, sugerencias…",
  },
  {
    key: "incidencia",
    label: "Reportar incidencia / precio",
    icon: BadgeAlert,
    hint: "Precio incorrecto, enlace roto, duplicados…",
  },
  {
    key: "tienda",
    label: "Soy una tienda",
    icon: Building2,
    hint: "Alta, verificación, integraciones, datos…",
  },
  {
    key: "colaboracion",
    label: "Colaboración / prensa",
    icon: Newspaper,
    hint: "Afiliación, colaboración, prensa…",
  },
  {
    key: "legal",
    label: "Legal",
    icon: Scale,
    hint: "Privacidad, cookies, derechos, avisos…",
  },
];

function defaultMessageFor(topic: Topic) {
  switch (topic) {
    case "incidencia":
      return [
        "Hola, he detectado una incidencia:",
        "",
        "• Qué ocurre:",
        "• Dónde ocurre (URL o SKU):",
        "• Qué esperabas ver:",
        "",
        "Gracias.",
      ].join("\n");
    case "tienda":
      return [
        "Hola, soy una tienda y me interesa aparecer en Aureya.",
        "",
        "• Nombre de la tienda:",
        "• Web:",
        "• País y cobertura (envíos a España):",
        "• Catálogo (oro/plata/platino, lingotes/monedas):",
        "",
        "¿Cómo podemos empezar el proceso de verificación?",
      ].join("\n");
    case "colaboracion":
      return [
        "Hola, me gustaría hablar sobre una colaboración / prensa.",
        "",
        "• Quién soy / medio / perfil:",
        "• Propuesta:",
        "• Enlaces (web/redes):",
        "",
        "Gracias.",
      ].join("\n");
    case "legal":
      return [
        "Hola, tengo una consulta legal relacionada con Aureya.",
        "",
        "• Tema:",
        "• Detalles:",
        "",
        "Gracias.",
      ].join("\n");
    case "general":
    default:
      return [
        "Hola,",
        "",
        "Tengo una consulta / sugerencia sobre Aureya:",
        "",
        "• Mensaje:",
        "",
        "Gracias.",
      ].join("\n");
  }
}

export default function ContactForm({ className }: Props) {
  const [topic, setTopic] = React.useState<Topic>("general");

  const [name, setName] = React.useState("");
  const [from, setFrom] = React.useState("");
  const [msg, setMsg] = React.useState("");
  const [msgAuto, setMsgAuto] = React.useState(true); // true mientras no edite el usuario
  const [bot, setBot] = React.useState(""); // honeypot

  const [status, setStatus] = React.useState<"idle" | "loading" | "ok" | "err">(
    "idle"
  );
  const [error, setError] = React.useState<string | null>(null);

  // Inicializa mensaje plantilla al montar
  React.useEffect(() => {
    setMsg(defaultMessageFor("general"));
    setMsgAuto(true);
  }, []);

  function onPickTopic(t: Topic) {
    setTopic(t);

    // Solo sobreescribe si el usuario NO ha editado el mensaje
    setMsg((prev) => (msgAuto ? defaultMessageFor(t) : prev));
    setMsgAuto(true);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (bot) return;

    setStatus("loading");
    setError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, from, topic, msg, hp: bot }),
      });

      const json = await res.json().catch(() => ({}) as any);
      if (!res.ok || !json.ok)
        throw new Error(json?.error || "No se pudo enviar el mensaje");

      if (res.status === 429) {
        throw new Error(
          "Demasiados envíos. Espera unos minutos e inténtalo de nuevo."
        );
      }

      setStatus("ok");

      // Resetea
      setName("");
      setFrom("");
      setTopic("general");
      setMsg(defaultMessageFor("general"));
      setMsgAuto(true);
    } catch (err: any) {
      setStatus("err");
      setError(err?.message || "No se pudo enviar el mensaje");
    }
  }

  const disabled = status === "loading";
  const activeDef = TOPICS.find((t) => t.key === topic) || TOPICS[0];
  const ActiveIcon = activeDef.icon;

  return (
    <form
      onSubmit={onSubmit}
      className={clsx("space-y-4", className)}
      noValidate
    >
      {/* Honeypot */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        value={bot}
        onChange={(e) => setBot(e.target.value)}
        placeholder="No rellenar"
      />

      {/* Selector de temas */}
      <div className="space-y-2">
        <div className="text-sm text-zinc-700 font-medium">
          ¿En qué te ayudamos?
        </div>

        <div className="flex flex-wrap gap-2">
          {TOPICS.map((t) => {
            const Icon = t.icon;
            const active = t.key === topic;

            return (
              <button
                key={t.key}
                type="button"
                onClick={active ? undefined : () => onPickTopic(t.key)}
                disabled={active}
                className={clsx(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition",
                  active
                    ? "border-transparent bg-[hsl(var(--brand)/0.12)] text-[hsl(var(--brand))] font-medium cursor-default"
                    : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                )}
              >
                <Icon
                  className={clsx(
                    "h-4 w-4",
                    active ? "text-[hsl(var(--brand))]" : "text-zinc-500"
                  )}
                />
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="text-xs text-zinc-600 flex items-center gap-2">
          <ActiveIcon className="h-4 w-4 text-zinc-500" />
          <span>{activeDef.hint}</span>
        </div>
      </div>

      {/* Nombre + email */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="group">
          <label className="block text-sm text-zinc-700 mb-1">Nombre</label>
          <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-[hsl(var(--brand)/0.35)]">
            <User className="h-4 w-4 text-zinc-400" />
            <input
              className="w-full text-sm outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              disabled={disabled}
            />
          </div>
        </div>

        <div className="group">
          <label className="block text-sm text-zinc-700 mb-1">Email</label>
          <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-[hsl(var(--brand)/0.35)]">
            <Mail className="h-4 w-4 text-zinc-400" />
            <input
              type="email"
              required
              className="w-full text-sm outline-none"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      {/* Motivo (informativo) */}
      <div className="group">
        <label className="block text-sm text-zinc-700 mb-1">Motivo</label>
        <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2">
          <FileText className="h-4 w-4 text-zinc-400" />
          <div className="text-sm text-zinc-700">
            <span className="font-medium">{activeDef.label}</span>
            <span className="text-zinc-500"> · </span>
            <span className="text-zinc-500">{activeDef.hint}</span>
          </div>
        </div>
      </div>

      {/* Mensaje */}
      <div className="group">
        <label className="block text-sm text-zinc-700 mb-1">Mensaje</label>
        <textarea
          required
          rows={7}
          className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--brand)/0.35)]"
          value={msg}
          onChange={(e) => {
            setMsg(e.target.value);
            setMsgAuto(false);
          }}
          disabled={disabled}
        />
      </div>

      {/* Submit + feedback */}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={disabled}
          className={clsx(
            "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium",
            "bg-[hsl(var(--brand))] text-white hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand)/0.35)]",
            "transition cursor-pointer",
            disabled && "opacity-70 cursor-not-allowed"
          )}
        >
          {status === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : null}
          Enviar
        </button>

        {status === "ok" && (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
            <CheckCircle2 className="h-4 w-4" /> Mensaje enviado. ¡Gracias!
          </span>
        )}

        {status === "err" && (
          <span className="inline-flex items-center gap-1 text-xs text-red-600">
            <AlertCircle className="h-4 w-4" /> {error || "No se pudo enviar"}
          </span>
        )}
      </div>
      <p className="text-xs text-zinc-500">
        Al enviar aceptas nuestra{" "}
        <a
          href="/privacidad"
          className="text-[hsl(var(--brand))] hover:underline"
        >
          Política de privacidad
        </a>
        .
      </p>
    </form>
  );
}
