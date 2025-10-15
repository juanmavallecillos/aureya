"use client";

import { timeAgo } from "@/lib/format";

export default function InfoBarSpotCompact({
  spotLoading,
  goldEurPerG,
  silverEurPerG,
  goldEurPerOz,
  silverEurPerOz,
  effectiveUpdatedAt,
  className = "",
}: {
  spotLoading: boolean;
  goldEurPerG: number | null;
  silverEurPerG: number | null;
  goldEurPerOz: number | null;
  silverEurPerOz: number | null;
  effectiveUpdatedAt: string | null;
  className?: string; // para ajustar paddings/colores desde fuera
}) {
  const fmtMoney = (v: unknown) =>
    Number.isFinite(Number(v))
      ? new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(Number(v))
      : "—";

  return (
    <div className={["text-xs text-zinc-600", className].join(" ")}>
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-medium text-[hsl(var(--brand))]">Spot</span>
          {spotLoading ? (
            <span className="opacity-70">cargando…</span>
          ) : (
            <>
              <span>
                Oro: {fmtMoney(goldEurPerG)} /g
                {goldEurPerOz != null && <span> · {fmtMoney(goldEurPerOz)} /oz</span>}
              </span>
              <span>
                Plata: {fmtMoney(silverEurPerG)} /g
                {silverEurPerOz != null && <span> · {fmtMoney(silverEurPerOz)} /oz</span>}
              </span>
            </>
          )}
        </div>

        <div>
          <span className="font-medium text-[hsl(var(--brand))]">Actualizado</span>
          {": "}
          {effectiveUpdatedAt ? (
            <>
              <span title={new Date(effectiveUpdatedAt).toLocaleString("es-ES")}>
                {new Date(effectiveUpdatedAt).toLocaleTimeString("es-ES", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>{" "}
              <span className="opacity-70">({timeAgo(effectiveUpdatedAt)})</span>
            </>
          ) : (
            <span>—</span>
          )}
        </div>
      </div>
    </div>
  );
}
