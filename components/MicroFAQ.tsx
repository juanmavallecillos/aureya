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
        // Contenedor con borde sutil y sombra suave
        "w-full overflow-hidden rounded-2xl border border-zinc-200/70 bg-white shadow-[0_2px_14px_rgba(0,0,0,0.04)]",
        className
      )}
    >
      {/* Cabecera dorada (sin esquinas internas) */}
      <div
        className="px-5 py-3 md:py-4 flex items-center gap-3 text-white select-none"
        style={{
          background:
            "linear-gradient(180deg, hsl(var(--brand)) 0%, hsl(var(--brand)/0.92) 100%)",
        }}
      >
        <span
          aria-hidden
          className="grid h-6 w-6 md:h-7 md:w-7 place-items-center rounded-full bg-white/20"
        >
          <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 md:h-5 md:w-5">
            <path
              fill="currentColor"
              d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2Zm0 15a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Zm2.1-7.4c-.24-.72-.85-1.27-1.6-1.45-.86-.2-1.8.04-2.41.69-.47.49-.74 1.14-.77 1.82l-.01.13h2.01c.02-.31.14-.6.35-.82.18-.19.43-.31.69-.35.2-.03.41 0 .6.09.22.1.4.28.5.5.14.3.12.65-.05.94-.11.2-.28.36-.48.46-.47.24-.9.58-1.27 1-.41.47-.68 1.05-.77 1.67l-.05.35h1.98c.09-.33.28-.64.54-.88.2-.19.44-.35.7-.47.48-.23.9-.58 1.22-1.02.44-.6.55-1.4.27-2.14Z"
            />
          </svg>
        </span>
        <h2
          id="faq-title"
          className="text-base md:text-lg font-semibold tracking-wide"
          // la cabecera usa tu Playfair como display si lo deseas:
          // style={{ fontFamily: "var(--font-serif)" }}
        >
          {title}
        </h2>
      </div>

      {/* Lista (zebra antracita) */}
      <div className="divide-y divide-zinc-200/70">
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
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      wrapper.offsetHeight;
      wrapper.style.height = "0px";
      wrapper.addEventListener("transitionend", onEnd);
      setOpen(false);
      return;
    }

    // Abrir
    wrapper.style.height = "0px";
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    wrapper.offsetHeight;
    wrapper.style.height = `${inner.scrollHeight}px`;
    wrapper.addEventListener("transitionend", onEnd);
    setOpen(true);
  };

  return (
    <div
      className={clsx(
        index % 2 === 0 ? "bg-zinc-900" : "bg-zinc-800",
        "relative overflow-hidden"
      )}
    >
      {/* Pregunta */}
      <button
        id={`faq-button-${rowId}`}
        onClick={toggle}
        aria-expanded={open}
        aria-controls={`faq-panel-${rowId}`}
        className={clsx(
          "w-full px-5 py-3 md:py-4 flex items-center justify-between gap-3 cursor-pointer select-none",
          "text-white transition-colors outline-none",
          "hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand)/0.35)]",
          open ? "rounded-t-xl" : "rounded-none"
        )}
      >
        <span className="font-medium text-left">{q}</span>
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className={clsx(
            "h-4 w-4 shrink-0 text-white/80 transition-transform duration-300",
            open && "rotate-180"
          )}
        >
          <path fill="currentColor" d="M7 10l5 5 5-5H7z" />
        </svg>
      </button>

      {/* Respuesta (cajón blanco con borde de marca) */}
      <div
        id={`faq-panel-${rowId}`}
        role="region"
        aria-labelledby={`faq-button-${rowId}`}
        ref={wrapperRef}
        className={clsx(
          "overflow-hidden transition-[height] duration-300 ease-out",
          "border-t border-[hsl(var(--brand))/0.25]"
        )}
        style={{ height: open ? "auto" : "0px" }}
      >
        <div
          ref={innerRef}
          className={clsx(
            "px-5 py-4 md:py-5 bg-white text-zinc-900 leading-relaxed",
            "border-l-2 border-[hsl(var(--brand))]",
            "shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)]",
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
