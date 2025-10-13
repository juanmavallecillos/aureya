"use client";

import * as React from "react";
import { Loader2, CheckCircle2, AlertCircle, Mail, User, FileText } from "lucide-react";
import clsx from "clsx";

type Props = { className?: string };

export default function ContactForm({ className }: Props) {
  const [name, setName] = React.useState("");
  const [from, setFrom] = React.useState("");
  const [topic, setTopic] = React.useState("consulta");
  const [msg, setMsg] = React.useState("");
  const [bot, setBot] = React.useState(""); // honeypot

  const [status, setStatus] = React.useState<"idle"|"loading"|"ok"|"err">("idle");
  const [error, setError] = React.useState<string | null>(null);

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
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json?.error || "No se pudo enviar el mensaje");
      }
      setStatus("ok");
      setName(""); setFrom(""); setTopic("consulta"); setMsg("");
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
            onChange={(e) => setTopic(e.target.value)}
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
          onChange={(e) => setMsg(e.target.value)}
          placeholder="Cuéntanos en qué podemos ayudarte"
          disabled={disabled}
        />
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
