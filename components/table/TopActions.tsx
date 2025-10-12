"use client";
export default function TopActions({
  q, onQ, pageSize, onPageSize, onReset,
}: {
  q: string; onQ: (v: string) => void;
  pageSize: number; onPageSize: (n: number) => void;
  onReset: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 border-b bg-zinc-50">
      <div className="relative w-full max-w-xs">
        <svg aria-hidden viewBox="0 0 24 24" className="absolute left-2 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500 pointer-events-none">
          <path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16a6.471 6.471 0 0 0 4.23-1.57l.27.28v.79L20 21.5 21.5 20l-6-6Z"/>
        </svg>
        <input
          value={q}
          onChange={(e)=>onQ(e.target.value)}
          placeholder="Buscar marca/serie…"
          className="w-full rounded-lg border pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--brand)/0.35)]"
        />
      </div>
      <div className="flex items-center gap-3">
        <label className="text-xs text-zinc-600">
          Filas:{" "}
          <select
            value={pageSize}
            onChange={(e)=>onPageSize(Number(e.target.value))}
            className="border rounded px-2 py-1 text-xs bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand)/0.35)]"
            aria-label="Filas por página"
          >
            {[10,25,50,100].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <button onClick={onReset} className="btn btn-ghost cursor-pointer hover:bg-zinc-100 link-brand-underline" title="Restablecer filtros">
          Limpiar
        </button>
      </div>
    </div>
  );
}
