"use client";

import React from "react";
import clsx from "clsx";
import { Gem, Shapes, Ruler, Store } from "lucide-react";
import Chip from "@/components/table/Chip";

type Counts = Record<string, number>;
type Labels = Record<string, string>;
type DealerMeta = Record<string, { label: string }>;

export interface FiltersBarCompactProps {
  className?: string;

  // visibility
  hideMetalFacet?: boolean;
  hideFormFacet?: boolean;
  hideBucketFacet?: boolean;
  hideDealerFacet?: boolean;

  // data
  metals: string[];
  forms: string[];
  allBuckets: string[];
  allDealers: string[];

  // selected
  selMetals: Set<string>;
  selForms: Set<string>;
  selBuckets: Set<string>;
  selDealers: Set<string>;

  // setters
  setSelMetals: (s: Set<string>) => void;
  setSelForms: (s: Set<string>) => void;
  setSelBuckets: (s: Set<string>) => void;
  setSelDealers: (s: Set<string>) => void;

  // counts / labels
  metalCounts: Counts;
  formCounts: Counts;
  bucketCounts: Counts;
  dealerCounts: Counts;

  niceMetal: Labels;
  niceForm: Labels;
  dealerMeta: DealerMeta;
}

function toggle<T>(setter: (s: Set<T>) => void, current: Set<T>, value: T) {
  const next = new Set(current);
  next.has(value) ? next.delete(value) : next.add(value);
  setter(next);
}

const Row = ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
  <div className={clsx("rounded-xl border border-zinc-200 bg-white px-3 py-2 shadow-sm", className)}>
    {children}
  </div>
);

const Title = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="mb-1.5 flex items-center gap-1.5">
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-zinc-200">
      {icon}
    </span>
    <span className="text-[11px] font-medium tracking-wide text-zinc-700">{children}</span>
  </div>
);

export default function FiltersBarCompact(props: FiltersBarCompactProps) {
  const {
    className,
    hideMetalFacet, hideFormFacet, hideBucketFacet, hideDealerFacet,
    metals, forms, allBuckets, allDealers,
    selMetals, selForms, selBuckets, selDealers,
    setSelMetals, setSelForms, setSelBuckets, setSelDealers,
    metalCounts, formCounts, bucketCounts, dealerCounts,
    niceMetal, niceForm, dealerMeta,
  } = props;

  const showMetal = !hideMetalFacet;
  const showForm  = !hideFormFacet;

  const topRowGridClass = clsx(
    "grid grid-cols-1 gap-2.5",
    showMetal && showForm ? "md:grid-cols-2" : "md:grid-cols-1"
  );

  return (
    <div className={clsx("flex flex-col gap-2.5", className)}>
      {/* Metal + Formato */}
      <div className={topRowGridClass}>
        {showMetal && (
          <Row>
            <Title icon={<Gem className="h-3.5 w-3.5 text-zinc-500" />}>Metal</Title>
            <div className="flex flex-wrap items-center gap-1.5">
              <Chip active={!selMetals.size} onClick={() => setSelMetals(new Set())} className="px-2.5 py-1 text-xs">
                Todos
              </Chip>
              {metals
                .filter(m => selMetals.has(m) || (metalCounts[m] ?? 0) > 0)
                .map(m => {
                  const active = selMetals.has(m);
                  return (
                    <Chip
                      key={m}
                      active={active}
                      onClick={() => toggle(setSelMetals, selMetals, m)}
                      className="px-2.5 py-1 text-xs"
                      aria-pressed={active}
                    >
                      {(niceMetal[m] ?? m)} {metalCounts[m] ? `(${metalCounts[m]})` : ""}
                    </Chip>
                  );
                })}
            </div>
          </Row>
        )}

        {showForm && (
          <Row>
            <Title icon={<Shapes className="h-3.5 w-3.5 text-zinc-500" />}>Formato</Title>
            <div className="flex flex-wrap items-center gap-1.5">
              <Chip active={!selForms.size} onClick={() => setSelForms(new Set())} className="px-2.5 py-1 text-xs">
                Todos
              </Chip>
              {forms
                .filter(f => selForms.has(f) || (formCounts[f] ?? 0) > 0)
                .map(f => {
                  const active = selForms.has(f);
                  return (
                    <Chip
                      key={f}
                      active={active}
                      onClick={() => toggle(setSelForms, selForms, f)}
                      className="px-2.5 py-1 text-xs"
                      aria-pressed={active}
                    >
                      {(niceForm[f] ?? f)} {formCounts[f] ? `(${formCounts[f]})` : ""}
                    </Chip>
                  );
                })}
            </div>
          </Row>
        )}
      </div>

      {/* Tamaño — sin scroll, con wrap */}
      {!hideBucketFacet && (
        <Row>
          <Title icon={<Ruler className="h-3.5 w-3.5 text-zinc-500" />}>Tamaño</Title>
          <div className="flex flex-wrap items-center gap-1.5">
            <Chip
              active={!selBuckets.size}
              onClick={() => setSelBuckets(new Set())}
              className="px-2.5 py-1 text-xs"
            >
              Todos
            </Chip>
            {allBuckets
              .filter(b => selBuckets.has(b) || (bucketCounts[b] ?? 0) > 0)
              .map(b => {
                const active = selBuckets.has(b);
                return (
                  <Chip
                    key={b}
                    active={active}
                    onClick={() => toggle(setSelBuckets, selBuckets, b)}
                    className="px-2.5 py-1 text-xs"
                    aria-pressed={active}
                  >
                    {b} {bucketCounts[b] ? `(${bucketCounts[b]})` : ""}
                  </Chip>
                );
              })}
          </div>
        </Row>
      )}

      {/* Tienda — sin scroll, con wrap */}
      {!hideDealerFacet && (
        <Row>
          <Title icon={<Store className="h-3.5 w-3.5 text-zinc-500" />}>Tienda</Title>
          <div className="flex flex-wrap items-center gap-1.5">
            <Chip
              active={!selDealers.size}
              onClick={() => setSelDealers(new Set())}
              className="px-2.5 py-1 text-xs"
            >
              Todas
            </Chip>
            {allDealers
              .filter(d => selDealers.has(d) || (dealerCounts[d] ?? 0) > 0)
              .map(d => {
                const meta = dealerMeta[d]; if (!meta) return null;
                const active = selDealers.has(d);
                return (
                  <Chip
                    key={d}
                    active={active}
                    onClick={() => toggle(setSelDealers, selDealers, d)}
                    className="px-2.5 py-1 text-xs"
                    aria-pressed={active}
                  >
                    <span className="inline-flex items-center gap-1">
                      <span>{meta.label}</span>
                      {dealerCounts[d] ? <span className="opacity-70">({dealerCounts[d]})</span> : null}
                    </span>
                  </Chip>
                );
              })}
          </div>
        </Row>
      )}
    </div>
  );
}
