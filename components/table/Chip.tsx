"use client";
export default function Chip({
  active, onClick, className, children,
}: { active?: boolean; onClick?: () => void; className?: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={[
        "px-3 py-1.5 rounded-full border text-sm transition-colors cursor-pointer select-none",
        active
          ? "bg-[hsl(var(--brand))] text-[hsl(var(--brand-ink))] border-[hsl(var(--brand))]"
          : "btn-ghost hover:bg-zinc-100 hover:border-zinc-300",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand)/0.35)]",
        className || "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
