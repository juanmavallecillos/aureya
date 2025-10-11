"use client";

export default function DealerCell({ label, logo }: { label: string; logo?: string }) {
  return (
    <div className="flex items-center gap-2">
      {/* {logo ? <img src={logo} alt="" className="h-4 w-4 rounded-sm" loading="lazy" /> : null} */}
      <span className="truncate max-w-[160px]" title={label}>{label}</span>
    </div>
  );
}
