"use client";

export type SortKey = "name" | "metal" | "form" | "bucket" | "dealer" | "price" | "premium";
export type SortDir = "asc" | "desc";

type Align = "left" | "center" | "right";

export default function SortableTh({
  label,
  k,
  activeKey,
  dir,
  onSort,
  align,               // "left" | "center" | "right"
  w,
}: {
  label: string;
  k: SortKey;
  activeKey: SortKey;
  dir: SortDir;
  onSort: (k: SortKey) => void;
  align?: Align;
  w?: string;
}) {
  const active = activeKey === k;
  const arrow = active ? (dir === "asc" ? "▲" : "▼") : "";
  const ariaSort = active ? (dir === "asc" ? "ascending" : "descending") : "none";

  return (
    <th
      scope="col"
      aria-sort={ariaSort as any}
      onClick={() => onSort(k)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onSort(k); }}
      role="button"
      tabIndex={0}
      className={[
        "th select-none cursor-pointer hover:bg-zinc-50 transition-colors",
        align === "left"   ? "text-left"   : "",
        align === "center" ? "text-center" : "",
        align === "right"  ? "text-right"  : "",
        w || "",
      ].join(" ")}
    >
      {/* Ocupa todo el ancho para poder centrar con flex */}
      <span
        className={[
          "flex w-full items-center gap-1",
          align === "left"   ? "justify-start" : "",
          align === "center" ? "justify-center" : "",
          align === "right"  ? "justify-end" : "",
        ].join(" ")}
      >
        <span>{label}</span>
        {arrow && <span className="text-xs text-zinc-500">{arrow}</span>}
      </span>
    </th>
  );
}
