// components/PriceChart.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
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

/* ---------- Rango y rendimiento ---------- */
type RangeKey = "1w" | "1m" | "3m" | "6m" | "1y" | "5y" | "all";

const RANGE_LABEL: Record<RangeKey, string> = {
  "1w": "1S",
  "1m": "1M",
  "3m": "3M",
  "6m": "6M",
  "1y": "1A",
  "5y": "5A",
  all: "Todo",
};

// Días requeridos por rango (aprox)
const RANGE_DAYS: Record<Exclude<RangeKey, "all">, number> = {
  "1w": 7,
  "1m": 31,
  "3m": 93,
  "6m": 186,
  "1y": 366,
  "5y": 365 * 5 + 2,
};

const MAX_POINTS = 600;

function toPointArray(data: Pt[]) {
  return (data || [])
    .filter((d) => Number.isFinite(Number(d.best_total_eur)))
    .map((d) => ({ date: d.date, y: Number(d.best_total_eur) }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

function sampleEvery<T>(arr: T[], max: number): T[] {
  if (arr.length <= max) return arr;
  const step = Math.ceil(arr.length / max);
  const out: T[] = [];
  for (let i = 0; i < arr.length; i += step) out.push(arr[i]);
  if (out[out.length - 1] !== arr[arr.length - 1]) out.push(arr[arr.length - 1]);
  return out;
}

function daysBetween(a: Date, b: Date) {
  const ms = +b - +a;
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function filterByRange(series: { date: string; y: number }[], range: RangeKey) {
  if (!series.length) return series;
  if (range === "all") return series;

  const last = new Date(series[series.length - 1].date);
  if (Number.isNaN(last.getTime())) return series;

  const days = RANGE_DAYS[range];
  const from = new Date(last);
  from.setDate(last.getDate() - days);

  return series.filter((p) => {
    const d = new Date(p.date);
    return !Number.isNaN(d.getTime()) && d >= from && d <= last;
  });
}

/* ---------- Componente ---------- */
export default function PriceChart({ data }: { data: Pt[] }) {
  const [range, setRange] = useState<RangeKey>("1y");

  const baseSeries = useMemo(() => toPointArray(data), [data]);

  // Disponibilidad de rangos según span total de datos
  const availability = useMemo(() => {
    if (baseSeries.length < 2) {
      return {
        "1w": false,
        "1m": false,
        "3m": false,
        "6m": false,
        "1y": false,
        "5y": false,
        all: baseSeries.length > 0,
      } as Record<RangeKey, boolean>;
    }
    const first = new Date(baseSeries[0].date);
    const last = new Date(baseSeries[baseSeries.length - 1].date);
    if (Number.isNaN(first.getTime()) || Number.isNaN(last.getTime())) {
      return {
        "1w": false,
        "1m": false,
        "3m": false,
        "6m": false,
        "1y": false,
        "5y": false,
        all: false,
      } as Record<RangeKey, boolean>;
    }
    const totalDays = Math.max(0, daysBetween(first, last));
    const avail: Record<RangeKey, boolean> = {
      "1w": totalDays >= RANGE_DAYS["1w"],
      "1m": totalDays >= RANGE_DAYS["1m"],
      "3m": totalDays >= RANGE_DAYS["3m"],
      "6m": totalDays >= RANGE_DAYS["6m"],
      "1y": totalDays >= RANGE_DAYS["1y"],
      "5y": totalDays >= RANGE_DAYS["5y"],
      all: baseSeries.length > 0,
    };
    return avail;
  }, [baseSeries]);

  // Asegura que el rango activo sea válido
  useEffect(() => {
    if (!availability[range]) {
      // busca el mayor rango disponible empezando por 1y, 6m, 3m, 1m, 1w, all
      const order: RangeKey[] = ["1y", "6m", "3m", "1m", "1w", "all", "5y"];
      const fallback = order.find((k) => availability[k]) || "all";
      setRange(fallback);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availability]);

  const rangedSeries = useMemo(() => filterByRange(baseSeries, range), [baseSeries, range]);
  const series = useMemo(() => sampleEvery(rangedSeries, MAX_POINTS), [rangedSeries]);

  if (!baseSeries.length) {
    return (
      <div style={{ padding: 8, fontSize: 12, color: "#6b7280" }}>
        Sin datos históricos suficientes.
      </div>
    );
  }

  // Resumen del rango (usa la serie sin muestrear para precisión)
  const summary = useMemo(() => {
    if (rangedSeries.length < 2) return null;
    const start = rangedSeries[0];
    const end = rangedSeries[rangedSeries.length - 1];
    const abs = end.y - start.y;
    const pct = start.y ? (abs / start.y) * 100 : 0;
    return {
      start: start.y,
      end: end.y,
      abs,
      pct,
    };
  }, [rangedSeries]);

  // Dominio Y con margen
  const ys = series.map((s) => s.y);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const pad = Math.max(1, (maxY - minY) * 0.05);
  const domainY: [number, number] = [minY - pad, maxY + pad];

  const noDataInRange = rangedSeries.length === 0;

  // Render
  return (
    <div className="w-full">
      {/* Controles de rango */}
      <div className="mb-2 flex flex-wrap gap-2">
        {(Object.keys(RANGE_LABEL) as RangeKey[]).map((key) => {
          const label = RANGE_LABEL[key];
          const active = range === key;
          const enabled = availability[key];
          return (
            <button
              key={key}
              onClick={() => enabled && setRange(key)}
              className={[
                "px-2.5 py-1.5 rounded-lg text-xs border transition",
                enabled ? "cursor-pointer" : "cursor-not-allowed opacity-50",
                active && enabled
                  ? "border-transparent bg-[hsl(var(--brand)/0.12)] text-[hsl(var(--brand))] font-medium"
                  : enabled
                  ? "border-zinc-200 hover:bg-zinc-50 text-zinc-700"
                  : "border-zinc-200 text-zinc-500",
              ].join(" ")}
              aria-pressed={active}
              aria-disabled={!enabled}
              disabled={!enabled}
              title={
                enabled
                  ? `Ver ${label}`
                  : "No hay datos suficientes para este rango"
              }
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Resumen del rango */}
      {summary ? (
        <div className="mb-3 flex items-center gap-3 text-sm">
          <div className="rounded-lg border border-zinc-200 px-2.5 py-1.5">
            <span className="text-zinc-500 mr-1">Inicio:</span>
            <span className="font-medium">{eur(summary.start)}</span>
          </div>
          <div className="rounded-lg border border-zinc-200 px-2.5 py-1.5">
            <span className="text-zinc-500 mr-1">Actual:</span>
            <span className="font-medium">{eur(summary.end)}</span>
          </div>
          <div
            className={[
              "rounded-lg px-2.5 py-1.5 font-medium",
              summary.pct > 0
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : summary.pct < 0
                ? "bg-rose-50 text-rose-700 border border-rose-200"
                : "bg-zinc-50 text-zinc-700 border border-zinc-200",
            ].join(" ")}
          >
            {summary.pct > 0 ? "▲" : summary.pct < 0 ? "▼" : "•"}{" "}
            {summary.abs >= 0 ? "+" : ""}
            {eur(summary.abs)} ({summary.pct >= 0 ? "+" : ""}
            {summary.pct.toFixed(2)}%)
          </div>
        </div>
      ) : (
        <div className="mb-3 text-sm text-zinc-600">
          No hay suficientes datos para calcular variación en este rango.
        </div>
      )}

      {noDataInRange ? (
        <div className="rounded-lg border border-zinc-200 p-3 text-sm text-zinc-600">
          No hay datos en este rango. Prueba con un periodo mayor.
        </div>
      ) : (
        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer>
            <LineChart data={series} margin={{ top: 10, right: 14, bottom: 6, left: 6 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: "#374151" }}
                tickMargin={8}
                minTickGap={24}
                tickFormatter={fmtTickDate}
                axisLine={{ stroke: "#e5e7eb" }}
                tickLine={{ stroke: "#e5e7eb" }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#374151" }}
                width={72}
                tickFormatter={(v: any) => eur(Number(v))}
                domain={domainY}
                axisLine={{ stroke: "#e5e7eb" }}
                tickLine={{ stroke: "#e5e7eb" }}
              />
              <Tooltip content={<CustomTooltip />} />
              <defs>
                <linearGradient id="brandStroke" x1="0" y1="0" x2="0" y2="1">
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
      )}
    </div>
  );
}
