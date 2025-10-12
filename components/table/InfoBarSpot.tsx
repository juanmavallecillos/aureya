"use client";
import { timeAgo } from "@/lib/format";

export default function InfoBarSpot({
  spotLoading, goldEurPerG, silverEurPerG, goldEurPerOz, silverEurPerOz, effectiveUpdatedAt,
}: {
  spotLoading: boolean;
  goldEurPerG: number|null; silverEurPerG: number|null;
  goldEurPerOz: number|null; silverEurPerOz: number|null;
  effectiveUpdatedAt: string|null;
}) {
  const money = (v: number|null) =>
    v==null ? "—" : new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR"}).format(v);
  return (
    <div className="px-3 py-2 text-xs text-zinc-700 bg-white border-b flex flex-wrap items-center gap-x-4 gap-y-1">
      <div className="flex items-center gap-3">
        <span className="font-medium text-[hsl(var(--brand))]">Spot</span>
        {spotLoading ? <span className="opacity-70">cargando…</span> : (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>Oro: {money(goldEurPerG)} /g · {goldEurPerOz!=null ? `${money(goldEurPerOz)} /oz` : "—"}</span>
            <span>Plata: {money(silverEurPerG)} /g · {silverEurPerOz!=null ? `${money(silverEurPerOz)} /oz` : "—"}</span>
          </div>
        )}
      </div>
      <div className="hidden sm:block h-3 w-px bg-zinc-200" aria-hidden />
      <div>
        <span className="font-medium text-[hsl(var(--brand))]">Actualizado</span>{": "}
        {effectiveUpdatedAt
          ? (<>
              <span title={new Date(effectiveUpdatedAt).toLocaleString("es-ES")}>
                {new Date(effectiveUpdatedAt).toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"})}
              </span>{" "}
              <span className="opacity-70">({timeAgo(effectiveUpdatedAt)})</span>
            </>)
          : <span>—</span>}
      </div>
    </div>
  );
}
