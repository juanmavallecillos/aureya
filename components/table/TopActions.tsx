"use client";

type Props = {
  q: string;
  onQ: (v: string) => void;
  onReset: () => void;
};

export default function TopActions({ q, onQ, onReset }: Props) {
  const clearSearch = () => onQ("");

  return (
    <div
      className="
        flex flex-col gap-3 md:flex-row md:items-center md:justify-between
        p-3 border-b bg-white
      "
    >
      {/* Buscador */}
      <div className="relative w-full md:max-w-sm">
        {/* Icono lupa con cristal blanco */}
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500 pointer-events-none"
        >
          {/* ‘Cristal’ */}
          <circle cx="11" cy="11" r="6.5" fill="#fff" stroke="currentColor" strokeWidth="1.8" />
          {/* Mango */}
          <path d="M16.6 16.6L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>

        <input
          value={q}
          onChange={(e) => onQ(e.target.value)}
          placeholder="Buscar marca o serie…"
          className="
            w-full rounded-full border border-zinc-300 bg-white
            pl-10 pr-10 py-2 text-sm
            outline-none transition
            focus:border-[hsl(var(--brand))]
            focus:ring-2 focus:ring-[hsl(var(--brand)/0.25)]
          "
          aria-label="Buscar marca o serie"
        />

        {/* Botón borrar búsqueda */}
        {!!q && (
          <button
            type="button"
            onClick={clearSearch}
            className="
              absolute right-2 top-1/2 -translate-y-1/2
              inline-flex h-7 w-7 items-center justify-center
              rounded-full text-zinc-500 hover:bg-zinc-100
              focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand)/0.35)]
              cursor-pointer
            "
            aria-label="Borrar búsqueda"
            title="Borrar búsqueda"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
              <path
                fill="currentColor"
                d="M12 10.586 16.95 5.636 18.364 7.05 13.414 12l4.95 4.95-1.414 1.414L12 13.414l-4.95 4.95-1.414-1.414L10.586 12 5.636 7.05 7.05 5.636 12 10.586Z"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onReset}
          className="
            inline-flex items-center gap-2 rounded-full
            border border-[hsl(var(--brand))] bg-[hsl(var(--brand)/0.06)]
            px-4 py-2 text-sm font-medium text-[hsl(var(--brand))]
            hover:bg-[hsl(var(--brand)/0.12)]
            focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand)/0.35)]
            cursor-pointer
          "
          title="Restablecer todos los filtros"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
            <path
              fill="currentColor"
              d="M12 6V3L8 7l4 4V8c2.76 0 5 2.24 5 5a5 5 0 1 1-9.9 1h-2.02A7 7 0 1 0 12 6Z"
            />
          </svg>
          Limpiar filtros
        </button>
      </div>
    </div>
  );
}
