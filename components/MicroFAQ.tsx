// components/MicroFAQ.tsx
"use client";

import { useId, useRef, useState, useEffect } from "react";
import Link from "next/link";
import clsx from "clsx";

export type FaqItem = {
  q: string;
  a: React.ReactNode;   // contenido visible en la web
  aText?: string;       // (opcional) texto llano para JSON-LD
};

export default function MicroFAQ({
  title = "FAQ",
  items,
  className,
  defaultOpen = [],
}: {
  title?: string;
  items: FaqItem[];
  className?: string;
  /** índices abiertos por defecto */
  defaultOpen?: number[];
}) {
  return (
    <section
      role="region"
      aria-labelledby="faq-title"
      className={clsx(
        "w-full overflow-hidden rounded-2xl bg-white ring-1 ring-inset ring-zinc-200 shadow-sm",
        className
      )}
    >
      {/* Cabecera limpia con punto de marca */}
      <div className="flex items-center gap-2 px-5 py-3 md:py-4 select-none">
        <span
          aria-hidden
          className="inline-block h-2 w-2 rounded-full"
          style={{ backgroundColor: "hsl(var(--brand))" }}
        />
        <h2 id="faq-title" className="text-base md:text-lg font-semibold tracking-tight text-zinc-900">
          {title}
        </h2>
      </div>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-200 to-transparent" aria-hidden />

      {/* Lista */}
      <div>
        {items.map((it, i) => (
          <FAQRow key={i} index={i} q={it.q} defaultOpen={defaultOpen.includes(i)}>
            {it.a}
          </FAQRow>
        ))}
      </div>
    </section>
  );
}

function FAQRow({
  q,
  children,
  defaultOpen,
  index,
}: {
  q: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  index: number;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const rowId = useId();

  // Si está abierto por defecto, deja el contenedor en auto
  useEffect(() => {
    if (open && wrapperRef.current) {
      wrapperRef.current.style.height = "auto";
    }
  }, [open]);

  const toggle = () => {
    const wrapper = wrapperRef.current;
    const inner = innerRef.current;
    if (!wrapper || !inner) {
      setOpen((v) => !v);
      return;
    }
    const onEnd = (e: TransitionEvent) => {
      if (e.propertyName !== "height") return;
      wrapper.removeEventListener("transitionend", onEnd);
      if (!open) wrapper.style.height = "auto";
    };

    // Cerrar
    if (open) {
      if (
        getComputedStyle(wrapper).height === "auto" ||
        wrapper.style.height === "" ||
        wrapper.style.height === "auto"
      ) {
        wrapper.style.height = `${wrapper.scrollHeight}px`;
      }
      // force reflow
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      wrapper.offsetHeight;
      wrapper.style.height = "0px";
      wrapper.addEventListener("transitionend", onEnd);
      setOpen(false);
      return;
    }

    // Abrir
    wrapper.style.height = "0px";
    // force reflow
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    wrapper.offsetHeight;
    wrapper.style.height = `${inner.scrollHeight}px`;
    wrapper.addEventListener("transitionend", onEnd);
    setOpen(true);
  };

  return (
    <div className="relative">
      {/* Barra lateral de marca solo cuando está abierto */}
      <div
        aria-hidden
        className={clsx(
          "absolute left-0 top-0 h-full w-[3px] rounded-r",
          open ? "bg-[hsl(var(--brand))]" : "bg-transparent"
        )}
      />

      {/* Pregunta */}
      <button
        id={`faq-button-${rowId}`}
        onClick={toggle}
        aria-expanded={open}
        aria-controls={`faq-panel-${rowId}`}
        className={clsx(
          "w-full pl-5 pr-4 py-3 md:py-4 flex items-center justify-between gap-3 cursor-pointer select-none",
          "text-zinc-900 hover:bg-zinc-50 transition-colors outline-none focus-visible:ring-2",
          "focus-visible:ring-[hsl(var(--brand)/0.35)]"
        )}
      >
        <span className="font-medium text-left">{q}</span>
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className={clsx(
            "h-4 w-4 shrink-0 text-zinc-600 transition-transform duration-300",
            open && "rotate-180"
          )}
        >
          <path fill="currentColor" d="M7 10l5 5 5-5H7z" />
        </svg>
      </button>

      {/* Separador (solo cuando está cerrado) */}
      {!open && (
        <div className="mx-5 h-px bg-zinc-200/70" aria-hidden />
      )}

      {/* Respuesta */}
      <div
        id={`faq-panel-${rowId}`}
        role="region"
        aria-labelledby={`faq-button-${rowId}`}
        ref={wrapperRef}
        className={clsx("overflow-hidden transition-[height] duration-300 ease-out")}
        style={{ height: open ? "auto" : "0px" }}
      >
        <div
          ref={innerRef}
          className={clsx(
            "pl-5 pr-4 py-3 md:py-4 leading-relaxed text-sm text-zinc-800",
            "bg-[hsl(var(--brand)/0.04)] ring-1 ring-inset ring-[hsl(var(--brand)/0.18)] rounded-r-2xl",
            "transition-opacity duration-200",
            open ? "opacity-100" : "opacity-0"
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/** Enlaces en línea con subrayado dorado */
export function InlineLink(props: React.ComponentProps<typeof Link>) {
  return (
    <Link
      {...props}
      className="underline underline-offset-2 decoration-[hsl(var(--brand))] hover:opacity-90"
    />
  );
}
