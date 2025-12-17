"use client";

import * as React from "react";

export default function UnlockPage() {
  const [pass, setPass] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "loading" | "err">(
    "idle"
  );
  const search =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : null;
  const next = search?.get("next") || "/";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pass }),
      });
      if (!res.ok) throw new Error();
      window.location.href = next;
    } catch {
      setStatus("err");
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-2xl border bg-white shadow-[0_12px_30px_rgba(0,0,0,0.06)] overflow-hidden">
        {/* Barra dorada a ancho completo */}
        <div className="h-1 w-full bg-gradient-to-r from-transparent via-[hsl(var(--brand))] to-transparent" />

        {/* Contenido con padding */}
        <div className="p-6">
          <h1 className="text-xl font-semibold">Acceso privado</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Introduce la contraseña para ver la web.
          </p>

          <form onSubmit={onSubmit} className="mt-4 space-y-3">
            <input
              type="password"
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--brand)/0.35)]"
              placeholder="Contraseña"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              autoFocus
            />

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full inline-flex justify-center rounded-lg px-4 py-2 text-sm font-medium
                     bg-[hsl(var(--brand))] text-white hover:opacity-90 focus-visible:ring-2
                     focus-visible:ring-[hsl(var(--brand)/0.35)] transition cursor-pointer disabled:opacity-70"
            >
              Entrar
            </button>

            {status === "err" && (
              <p className="text-xs text-red-600">Contraseña incorrecta.</p>
            )}
          </form>
        </div>
      </div>
    </main>
  );
}
