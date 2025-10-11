// components/DealerBadge.tsx
"use client";

import { dealerLabel } from "@/lib/dealers";

export default function DealerBadge({ id }: { id?: string }) {
  const label = dealerLabel(id);
  return (
    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium">
      {label}
    </span>
  );
}
