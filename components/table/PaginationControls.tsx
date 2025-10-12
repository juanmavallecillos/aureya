"use client";
type PageSize = 10 | 25 | 50 | 100;

export default function PaginationControls({
  page, pageCount, pageSize, onPageChange, onPageSizeChange, total, start, end,
}: {
  page: number; pageCount: number; pageSize: PageSize;
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: PageSize) => void;
  total: number; start: number; end: number;
}) {
  const prev = () => onPageChange(Math.max(1, page - 1));
  const next = () => onPageChange(Math.min(pageCount, page + 1));
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-2">
      <div className="text-xs text-zinc-600">
        Mostrando <span className="font-medium text-zinc-900">{total ? start + 1 : 0}</span>
        –<span className="font-medium text-zinc-900">{end}</span> de <span className="font-medium text-zinc-900">{total}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-xs">
          <span className="text-zinc-600">Filas</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value) as PageSize)}
            className="rounded-md border px-2 py-1 text-xs bg-white cursor-pointer"
            aria-label="Filas por página"
          >
            {[10,25,50,100].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={prev} disabled={page===1}
            className="rounded-md border px-2 py-1 text-xs disabled:opacity-50 bg-white hover:bg-zinc-50 cursor-pointer"
            aria-label="Página anterior">← Anterior</button>
          <div className="px-2 text-xs tabular-nums">
            <span className="font-medium">{page}</span><span className="text-zinc-500"> / {pageCount}</span>
          </div>
          <button onClick={next} disabled={page===pageCount}
            className="rounded-md border px-2 py-1 text-xs disabled:opacity-50 bg-white hover:bg-zinc-50 cursor-pointer"
            aria-label="Página siguiente">Siguiente →</button>
        </div>
      </div>
    </div>
  );
}
