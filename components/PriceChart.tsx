// components/PriceChart.tsx
"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

type Pt = { date: string; best_total_eur: number | null };

export default function PriceChart({ data }: { data: Pt[] }) {
  const series = (data || [])
    .filter((d) => Number.isFinite(Number(d.best_total_eur)))
    .map((d) => ({ ...d, y: Number(d.best_total_eur) }));

  if (!series.length) {
    return <div style={{ padding: 8, fontSize: 12, color: "#6b7280" }}>Sin datos históricos suficientes.</div>;
  }

  // ✅ ancho/alto inline para no depender de Tailwind
  return (
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer>
        <LineChart data={series} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(v: any) =>
              new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(Number(v))
            }
            labelFormatter={(l) => `Fecha: ${l}`}
          />
          <Line type="monotone" dataKey="y" dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
