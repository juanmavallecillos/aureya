"use client";

import * as React from "react";
import { Loader2, CheckCircle2, AlertCircle, Mail, User, FileText } from "lucide-react";
import clsx from "clsx";

type Props = { className?: string };

type Topic = "consulta" | "colaboracion" | "incidencia" | "legal";

function topicFromSearch(v: string | null): Topic {
  const x = (v || "").toLowerCase().trim();
  if (x === "consulta" || x === "colaboracion" || x === "incidencia" || x === "legal") return x;
  return "consulta";
}

function defaultMessageFor(topic: Topic, ctx?: { sku?: string; url?: string }) {
  const sku = (ctx?.sku || "").trim();
  const url = (ctx?.url || "").trim();

  const tail =
    (sku || url)
      ? `\n\nDetalles (opcional):\n${sku ? `- SKU: ${sku}\n` : ""}${url ? `- URL: ${url}` : ""}`.trimEnd()
      : "";

  switch (topic) {
    case "incidencia":
      return [
        "Hola, he detectado una incidencia:",
        "",
        "- ¿Qué has visto exactamente?",
        "- ¿En qué página/SKU ocurre?",
        "- ¿Qué esperabas ver?",
        "",
        "Si puedes, añade una captura o el enlace al producto.",
        tail ? `\n\n${tail}` : "",
      ].join("\n").trim();

    case "colaboracion":
      return [
        "Hola, me gustaría hablar sobre una posible colaboración.",
        "",
        "- ¿Eres una tienda, creador/a o medio?",
        "- ¿Qué propuesta tienes en mente?",
        "- ¿Dónde podemos ver tu web/perfil?",
        "",
        "Gracias 🙂",
      ].join("\n").trim();

    case "legal":
      return [
        "Hola, tengo una consulta legal relacionada con Aureya.",
        "",
        "- Tema:",
        "- Detalles:",
        "",
        "Gracias.",
      ].join("\n").trim();

    case "consulta":
    default:
      return [
        "Hola,",
        "",
        "Tengo una consulta sobre Aureya:",
        "",
        "- Mi pregunta es:",
        "",
        "Gracias.",
      ].join("\n").trim();
  }
}

export default function ContactForm({ className }: Props) {
  const [name, setName] = React.useState("");
  const [from, setFrom] = React.useState("");
  const [topic, setTopic] = React.useState<Topic>("consulta");
  const [msg, setMsg] = React.useState("");
  const [msgAuto, setMsgAuto] = React.useState(true); // 👈 controla si el mensaje es “plantilla”
  const [bot, setBot] = React.useState(""); // honeypot

  const [status, setStatus] = React.useState<"idle" | "loading" | "ok" | "err">("idle");
  const [error, setError] = React.useState<string | null>(null);

  // Inicializa desde query params (solo una vez)
  React.useEffect(() => {
    const sp = new URLSearchParams(window.location.search);

    const t = topicFromSearch(sp.get("topic"));
    const sku = sp.get("sku") || "";
    const url = sp.get("url") || "";

    setTopic(t);
    setMsg(defaultMessageFor(t, { sku, url }));
    setMsgAuto(true);
  }, []);

  // Si el usuario cambia el topic y el mensaje sigue siendo auto, actualiza plantilla
  React.useEffect(() => {
    if (!msgAuto) return;
    setMsg(defaultMessageFor(topic));
  }, [topic, msgAuto]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (bot) return; // trap

    setStatus("loading");
    setError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, from, topic, msg }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        throw new Error(json?.error || "No se pudo enviar el mensaje");
      }

      setStatus("ok");
      setName("");
      setFrom("");
      setTopic("consulta");
      setMsg(defaultMessageFor("consulta"));
      setMsgAuto(true);
    } catch (err: any) {
      setStatus("err");
      setError(err?.message || "No se pudo enviar el mensaje");
    }
  }

  const disabled = status === "loading";

  return (
    <form onSubmit={onSubmit} className={clsx("space-y-4", className)} noValidate>
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

      {/* Filas */}
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

      <div className="group">
        <label className="block text-sm text-zinc-700 mb-1">Motivo</label>
        <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-[hsl(var(--brand)/0.35)]">
          <FileText className="h-4 w-4 text-zinc-400" />
          <select
            className="cursor-pointer w-full text-sm outline-none bg-transparent"
            value={topic}
            onChange={(e) => {
              setTopic(e.target.value as Topic);
              // si estaba en auto, seguirá en auto y la plantilla se actualizará por el effect
              // si no estaba en auto, no tocamos msg
            }}
            disabled={disabled}
          >
            <option value="consulta">Consulta general</option>
            <option value="colaboracion">Colaboración</option>
            <option value="incidencia">Incidencia</option>
            <option value="legal">Legal</option>
          </select>
        </div>
      </div>

      <div className="group">
        <label className="block text-sm text-zinc-700 mb-1">Mensaje</label>
        <textarea
          required
          rows={6}
          className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--brand)/0.35)]"
          value={msg}
          onChange={(e) => {
            setMsg(e.target.value);
            setMsgAuto(false); // 👈 en cuanto escribe, deja de ser plantilla
          }}
          placeholder="Cuéntanos en qué podemos ayudarte"
          disabled={disabled}
        />

        {/* Opcional: botón pequeño para restaurar plantilla */}
        <div className="mt-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setMsg(defaultMessageFor(topic));
              setMsgAuto(true);
            }}
            className="text-xs text-zinc-500 hover:text-[hsl(var(--brand))] hover:underline"
            disabled={disabled}
          >
            Restaurar sugerencia
          </button>
          <span className="text-[11px] text-zinc-500">
            {msgAuto ? "Sugerencia activa" : "Mensaje personalizado"}
          </span>
        </div>
      </div>

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
          {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
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
    </form>
  );
}
