// components/PriceChart.tsx
"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type Pt = { date: string; best_total_eur: number | null };

const eur = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);

const fmtTickDate = (iso: string) => {
  const d = new Date(iso);
  // Fallback por si llega algo no parseable
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" });
};

const fmtFullDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("es-ES", {
        weekday: "short",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
};

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const v = Number(payload[0].value);
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        padding: "8px 10px",
        boxShadow: "0 4px 10px rgba(0,0,0,0.06)",
        fontSize: 12,
        color: "#111827",
      }}
    >
      <div style={{ marginBottom: 4, color: "#4b5563" }}>{fmtFullDate(label || "")}</div>
      <div style={{ fontWeight: 600 }}>{eur(v)}</div>
    </div>
  );
}

export default function PriceChart({ data }: { data: Pt[] }) {
  const series = (data || [])
    .filter((d) => Number.isFinite(Number(d.best_total_eur)))
    .map((d) => ({ date: d.date, y: Number(d.best_total_eur) }));

  if (!series.length) {
    return (
      <div style={{ padding: 8, fontSize: 12, color: "#6b7280" }}>
        Sin datos históricos suficientes.
      </div>
    );
  }

  // Dominio Y con pequeño margen superior/inferior para que la línea respire
  const ys = series.map((s) => s.y);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const pad = Math.max(1, (maxY - minY) * 0.05);

  return (
    <div style={{ width: "100%", height: 280 }}>
      <ResponsiveContainer>
        <LineChart
          data={series}
          margin={{ top: 10, right: 14, bottom: 6, left: 6 }}
        >
          {/* Rejilla suave */}
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

          {/* Eje X: fechas */}
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: "#374151" }}
            tickMargin={8}
            minTickGap={24}
            tickFormatter={fmtTickDate}
            axisLine={{ stroke: "#e5e7eb" }}
            tickLine={{ stroke: "#e5e7eb" }}
          />

          {/* Eje Y: euros */}
          <YAxis
            tick={{ fontSize: 12, fill: "#374151" }}
            width={56}
            tickFormatter={(v: any) => eur(Number(v))}
            domain={[minY - pad, maxY + pad]}
            axisLine={{ stroke: "#e5e7eb" }}
            tickLine={{ stroke: "#e5e7eb" }}
          />

          {/* Tooltip personalizado */}
          <Tooltip content={<CustomTooltip />} />

          {/* Línea principal (color de marca si existe, si no, fallback) */}
          <defs>
            {/* Gradiente suave para la línea si quieres variar levemente */}
            <linearGradient id="brandStroke" x1="0" y1="0" x2="0" y2="1">
              {/* usa la var de marca si existe */}
              <stop offset="0%" stopColor="hsl(var(--brand, 45 95% 55%))" />
              <stop offset="100%" stopColor="hsl(var(--brand, 45 95% 55%))" />
            </linearGradient>
          </defs>

          <Line
            type="monotone"
            dataKey="y"
            stroke="url(#brandStroke)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
