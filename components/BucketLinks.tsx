// components/BucketLinks.tsx
"use client";

import Link from "next/link";

type Props = {
  /** metal normalizado: "gold" | "silver" */
  metal: "gold" | "silver";
  /** formato normalizado: "bar" | "coin" */
  form: "bar" | "coin";
  /** base del href para construir /[metal]/[form]/[bucket] */
  baseHref: string; // p.ej. "/oro/lingotes"
  className?: string;
  /** buckets ya calculados en server */
  buckets?: string[];
};

export default function BucketLinks({ baseHref, className, buckets = [] }: Props) {
  if (!buckets.length) {
    return (
      <div className={className}>
        <ul className="flex flex-wrap gap-2 text-sm opacity-70">
          <li>No hay tamaños disponibles ahora mismo.</li>
        </ul>
      </div>
    );
  }

  return (
    <nav aria-label="Tamaños disponibles" className={className}>
      <ul className="flex flex-wrap gap-2 text-sm">
        {buckets.map((b) => (
          <li key={b}>
            <Link
              href={`${baseHref}/${b}`}
              className="underline decoration-[hsl(var(--brand))] underline-offset-[3px] hover:opacity-90"
            >
              {b}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
