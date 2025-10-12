"use client";
export type SortKey = "name" | "metal" | "form" | "bucket" | "dealer" | "price" | "premium";
export type SortDir = "asc" | "desc";

export default function SortableTh({
  label, k, activeKey, dir, onSort, alignRight, w,
}: {
  label: string; k: SortKey; activeKey: SortKey; dir: SortDir;
  onSort: (k: SortKey) => void; alignRight?: boolean; w?: string;
}) {
  const active = activeKey === k;
  const arrow = active ? (dir === "asc" ? "▲" : "▼") : "";
  const ariaSort = active ? (dir === "asc" ? "ascending" : "descending") : "none";
  return (
    <th
      scope="col"
      aria-sort={ariaSort as any}
      onClick={() => onSort(k)}
      className={[
        "th select-none cursor-pointer hover:bg-zinc-50 transition-colors",
        alignRight ? "text-right" : "text-left",
        w || "",
      ].join(" ")}
    >
      <span className="inline-flex items-center gap-1">
        {label}{arrow && <span className="text-xs text-zinc-500">{arrow}</span>}
      </span>
    </th>
  );
}