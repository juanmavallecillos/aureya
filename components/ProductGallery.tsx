"use client";

import Image from "next/image";
import * as React from "react";
import clsx from "clsx";

type Props = {
  images: string[];
  altBase: string;
  className?: string;
};

function toCdnUrl(path: string) {
  if (!path) return "";
  if (path.startsWith("/api/cdn?path=")) return path;
  const clean = path.startsWith("/") ? path.slice(1) : path;
  return `/api/cdn?path=${encodeURIComponent(clean)}`;
}

export default function ProductGallery({ images, altBase, className }: Props) {
  const normalized = React.useMemo(
    () => (images ?? []).map(toCdnUrl).filter(Boolean),
    [images]
  );

  const [baseIndex, setBaseIndex] = React.useState(0);      // selección del usuario
  const [displayIndex, setDisplayIndex] = React.useState(0); // lo que realmente se ve

  React.useEffect(() => {
    setBaseIndex(0);
    setDisplayIndex(0);
  }, [normalized.join("|")]);

  const hasHoverSwap = normalized.length >= 2;

  const handleMouseEnter = () => {
    if (!hasHoverSwap) return;
    if (baseIndex === 0) setDisplayIndex(1); // swap a reverso
  };

  const handleMouseLeave = () => {
    setDisplayIndex(baseIndex); // vuelve a la seleccionada
  };

  const onDotSelect = (idx: number) => {
    setBaseIndex(idx);
    setDisplayIndex(idx);
  };

  if (!normalized.length) return null;

  return (
    <div className={clsx("w-full", className)}>
      <div
        className={clsx(
          // Contenedor estable y centrado
          "relative w-full overflow-hidden rounded-xl bg-white",
          // Altura estable por relación de aspecto; no se moverá al hacer scroll
          "aspect-[4/3] md:aspect-[3/4]",
          // Centrado perfecto del contenido
          "grid place-items-center"
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Image
          src={normalized[displayIndex] ?? normalized[0]}
          alt={`${altBase} — imagen ${displayIndex + 1}`}
          fill
          sizes="(max-width: 768px) 100vw, 360px"
          priority={false}
          // Total estabilidad dentro del frame
          className="object-contain object-center"
          // Evita efectos que pudieran causar reflujo visual
          placeholder="empty"
        />
      </div>

      {normalized.length > 1 && (
        <div
          className="mt-3 flex items-center justify-center gap-2 select-none"
          aria-label="Selector de imagen"
        >
          {normalized.map((_, idx) => {
            const active = idx === displayIndex; // <- ahora refleja lo que se ve
            return (
              <button
                key={idx}
                type="button"
                aria-label={`Ver imagen ${idx + 1}`}
                aria-pressed={active}
                onClick={() => onDotSelect(idx)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onDotSelect(idx);
                  }
                }}
                className={clsx(
                  "h-2.5 w-2.5 rounded-full transition",
                  active
                    ? "bg-[hsl(var(--brand))] shadow-sm"
                    : "bg-zinc-300 hover:bg-zinc-400"
                )}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
