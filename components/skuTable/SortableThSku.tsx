"use client";

export type SortKeySku =
  | "dealer"
  | "price"
  | "shipping"
  | "total"
  | "premium"
  | "stock";

export type SortDir = "asc" | "desc";

type Align = "left" | "center" | "right";

export default function SortableThSku({
  label,
  k,
  activeKey,
  dir,
  onSort,
  align = "left",
  w,
}: {
  label: string;
  k: SortKeySku;
  activeKey: SortKeySku;
  dir: SortDir;
  onSort: (k: SortKeySku) => void;
  align?: Align;
  /** clase tailwind opcional para ancho fijo, p. ej. "w-32" */
  w?: string;
}) {
  const active = activeKey === k;
  const arrow = active ? (dir === "asc" ? "▲" : "▼") : "";
  const ariaSort: "ascending" | "descending" | "none" = active
    ? dir === "asc"
      ? "ascending"
      : "descending"
    : "none";

  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      role="button"
      tabIndex={0}
      onClick={() => onSort(k)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSort(k);
      }}
      className={[
        "th select-none cursor-pointer hover:bg-zinc-50 transition-colors",
        align === "left" ? "text-left" : "",
        align === "center" ? "text-center" : "",
        align === "right" ? "text-right" : "",
        w || "",
      ].join(" ")}
    >
      {/* Wrapper para alinear contenido + icono */}
      <span
        className={[
          "flex w-full items-center gap-1",
          align === "left" ? "justify-start" : "",
          align === "center" ? "justify-center" : "",
          align === "right" ? "justify-end" : "",
        ].join(" ")}
      >
        <span>{label}</span>
        {arrow && <span className="text-xs text-zinc-500">{arrow}</span>}
      </span>
    </th>
  );
}
