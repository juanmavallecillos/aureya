"use client";

import React from "react";
import { Gem, Shapes, Ruler, Store } from "lucide-react";
import clsx from "clsx";
import Chip from "@/components/table/Chip";

type Counts = Record<string, number>;
type Labels = Record<string, string>;
type DealerMeta = Record<string, { label: string }>;

export interface FiltersBarProps {
  className?: string;

  // Facets visibility
  hideMetalFacet?: boolean;
  hideFormFacet?: boolean;
  hideBucketFacet?: boolean;
  hideDealerFacet?: boolean;

  // Data
  metals: string[];
  forms: string[];
  allBuckets: string[];
  allDealers: string[];

  // Selected
  selMetals: Set<string>;
  selForms: Set<string>;
  selBuckets: Set<string>;
  selDealers: Set<string>;

  // Setters
  setSelMetals: (s: Set<string>) => void;
  setSelForms: (s: Set<string>) => void;
  setSelBuckets: (s: Set<string>) => void;
  setSelDealers: (s: Set<string>) => void;

  // Counts/labels
  metalCounts: Counts;
  formCounts: Counts;
  bucketCounts: Counts;
  dealerCounts: Counts;

  niceMetal: Labels;
  niceForm: Labels;
  dealerMeta: DealerMeta;
}

const FacetCard: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ className, children }) => (
  <div
    className={clsx(
      // forzamos modo claro
      "rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm",
      className
    )}
  >
    {children}
  </div>
);

const FacetTitle: React.FC<{ icon: React.ReactNode; children: React.ReactNode }> = ({ icon, children }) => (
  <div className="mb-2 flex items-center gap-2">
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-zinc-200 bg-white">
      {icon}
    </span>
    <span className="text-xs font-medium tracking-wide text-zinc-700">{children}</span>
  </div>
);

const ScrollRow: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ className, children }) => (
  <div className={clsx("relative", className)}>
    {/* SIN fades laterales */}
    <div className="no-scrollbar -mx-1 flex items-center gap-2 overflow-x-auto px-1 py-0.5">
      {children}
    </div>
  </div>
);

// Chip base (claro)
const chipClass =
  "transition-all duration-150 rounded-full px-3 py-1.5 text-sm " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand)/0.35)]";

// Chip activo (dorado sutil)
const chipActiveClass = "";

function toggle<T>(setter: (s: Set<T>) => void, current: Set<T>, value: T) {
  const next = new Set(current);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  setter(next);
}

export default function FiltersBar({
  className,

  hideMetalFacet,
  hideFormFacet,
  hideBucketFacet,
  hideDealerFacet,

  metals,
  forms,
  allBuckets,
  allDealers,

  selMetals,
  selForms,
  selBuckets,
  selDealers,

  setSelMetals,
  setSelForms,
  setSelBuckets,
  setSelDealers,

  metalCounts,
  formCounts,
  bucketCounts,
  dealerCounts,

  niceMetal,
  niceForm,
  dealerMeta,
}: FiltersBarProps) {
  return (
    // contenedor normal (NO sticky)
    <div className={clsx("flex flex-col gap-3", className)}>
      {/* Metal */}
      {!hideMetalFacet && (
        <FacetCard>
          <FacetTitle icon={<Gem className="h-3.5 w-3.5 text-zinc-500" />}>Metal</FacetTitle>
          <ScrollRow>
            <Chip
              active={!selMetals.size}
              onClick={() => setSelMetals(new Set())}
              className={clsx(chipClass, !selMetals.size && chipActiveClass)}
            >
              Todos
            </Chip>
            {metals
              .filter((m) => selMetals.has(m) || (metalCounts[m] ?? 0) > 0)
              .map((m) => {
                const active = selMetals.has(m);
                return (
                  <Chip
                    key={m}
                    active={active}
                    onClick={() => toggle(setSelMetals, selMetals, m)}
                    className={clsx(chipClass, active && chipActiveClass)}
                    aria-pressed={active}
                  >
                    <span>
                        {(niceMetal[m] ?? m)} {metalCounts[m] ? `(${metalCounts[m]})` : ""}
                    </span>
                  </Chip>
                );
              })}
          </ScrollRow>
        </FacetCard>
      )}

      {/* Formato */}
      {!hideFormFacet && (
        <FacetCard>
          <FacetTitle icon={<Shapes className="h-3.5 w-3.5 text-zinc-500" />}>Formato</FacetTitle>
          <ScrollRow>
            <Chip
              active={!selForms.size}
              onClick={() => setSelForms(new Set())}
              className={clsx(chipClass, !selForms.size && chipActiveClass)}
            >
              Todos los formatos
            </Chip>
            {forms
              .filter((f) => selForms.has(f) || (formCounts[f] ?? 0) > 0)
              .map((f) => {
                const active = selForms.has(f);
                return (
                  <Chip
                    key={f}
                    active={active}
                    onClick={() => toggle(setSelForms, selForms, f)}
                    className={clsx(chipClass, active && chipActiveClass)}
                  >
                    {(niceForm[f] ?? f)} {formCounts[f] ? `(${formCounts[f]})` : ""}
                  </Chip>
                );
              })}
          </ScrollRow>
        </FacetCard>
      )}

      {/* Tamaño */}
      {!hideBucketFacet && (
        <FacetCard>
          <FacetTitle icon={<Ruler className="h-3.5 w-3.5 text-zinc-500" />}>Tamaño</FacetTitle>
          <ScrollRow>
            <Chip
              active={!selBuckets.size}
              onClick={() => setSelBuckets(new Set())}
              className={clsx(chipClass, !selBuckets.size && chipActiveClass)}
            >
              Todos los tamaños
            </Chip>
            {allBuckets
              .filter((b) => selBuckets.has(b) || (bucketCounts[b] ?? 0) > 0)
              .map((b) => {
                const active = selBuckets.has(b);
                return (
                  <Chip
                    key={b}
                    active={active}
                    onClick={() => toggle(setSelBuckets, selBuckets, b)}
                    className={clsx(chipClass, active && chipActiveClass)}
                  >
                    {b} {bucketCounts[b] ? `(${bucketCounts[b]})` : ""}
                  </Chip>
                );
              })}
          </ScrollRow>
        </FacetCard>
      )}

      {/* Tienda */}
      {!hideDealerFacet && (
        <FacetCard>
          <FacetTitle icon={<Store className="h-3.5 w-3.5 text-zinc-500" />}>Tienda</FacetTitle>
          <ScrollRow>
            <Chip
              active={!selDealers.size}
              onClick={() => setSelDealers(new Set())}
              className={clsx(chipClass, !selDealers.size && chipActiveClass)}
            >
              Todas las tiendas
            </Chip>
            {allDealers
              .filter((d) => selDealers.has(d) || (dealerCounts[d] ?? 0) > 0)
              .map((d) => {
                const meta = dealerMeta[d];
                if (!meta) return null;
                const active = selDealers.has(d);
                return (
                  <Chip
                    key={d}
                    active={active}
                    onClick={() => toggle(setSelDealers, selDealers, d)}
                    className={clsx(chipClass, active && chipActiveClass, "group")}
                  >
                    <span className="inline-flex items-center gap-1">
                      <span>{meta.label}</span>
                      {dealerCounts[d] ? <span className="opacity-70">({dealerCounts[d]})</span> : null}
                    </span>
                  </Chip>
                );
              })}
          </ScrollRow>
        </FacetCard>
      )}
    </div>
  );
}
