// app/[...unknown]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Página no encontrada • Aureya",
  description: "La ruta solicitada no existe.",
  robots: { index: false, follow: false },
};

export default function CatchAllNotFound() {
  // Mantiene la URL original y devuelve 404 renderizando app/not-found.tsx
  notFound();
}
