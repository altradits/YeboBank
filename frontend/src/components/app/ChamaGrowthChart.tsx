"use client";

import { useState, useId } from "react";
import { useRate } from "@/lib/rate-context";

export type ChartSeries = {
  key: string;
  label: string;
  color: string;
  points: { label: string; valueSats: number }[];
};

interface ChamaGrowthChartProps {
  title?: string;
  series: ChartSeries[];
  defaultSeriesKey?: string;
  currencyMode?: "KES" | "USD" | "sats";
  showRange?: boolean;
}

// Compact form for y-axis tick labels (no unit prefix, no sats suffix).
function axisLabel(val: number): string {
  const abs = Math.abs(val);
  if (abs >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000)     return `${(val / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000)         return `${(val / 1_000).toFixed(0)}K`;
  return `${Math.round(val)}`;
}

// Exact (no abbreviation) form for hover tooltips — uses en-KE locale comma grouping.
function exact(val: number, unit: "KES" | "USD" | "sats"): string {
  const body = Math.round(val).toLocaleString("en-KE");
  if (unit === "sats") return `${body} sats`;
  if (unit === "USD")  return `$${body}`;
  return `KES ${body}`;
}

// Round up to a visually clean axis max.
function niceMax(v: number): number {
  if (v <= 0) return 10;
  const mag = Math.pow(10, Math.floor(Math.log10(v / 3)));
  return Math.ceil(v / mag) * mag;
}

export default function ChamaGrowthChart({
  title,
  series,
  defaultSeriesKey,
  currencyMode = "KES",
  showRange: showRangeProp = true,
}: ChamaGrowthChartProps) {
  const rate    = useRate();
  const chartId = useId();

  const [activeKey,    setActiveKey]    = useState(defaultSeriesKey ?? series[0]?.key ?? "");
  const [unit,         setUnit]         = useState<"KES" | "USD" | "sats">(currencyMode);
  const [range,        setRange]        = useState<"6M" | "1Y" | "All">("1Y");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const currentSeries = series.find((s) => s.key === activeKey) ?? series[0];

  if (!currentSeries || currentSeries.points.length < 2) {
    return (
      <div className="barchart">
        {title && <p className="barchart-title">{title}</p>}
        <p className="growth-chart-empty">Not enough history yet.</p>
      </div>
    );
  }

  const allPts = currentSeries.points;
  const pts =
    range === "6M" ? allPts.slice(-6) :
    range === "1Y" ? allPts.slice(-12) :
    allPts;

  const showRange = allPts.length >= 7;

  function toDisplay(sats: number): number {
    if (unit === "sats") return sats;
    if (unit === "KES")  return sats * rate.kesPerSat;
    return (sats / 1e8) * rate.btcUsd;
  }

  const displayVals = pts.map((p) => toDisplay(p.valueSats));
  const maxVal = Math.max(...displayVals, 1);
  const axMax  = niceMax(maxVal);

  // SVG layout
  const W      = 480;
  const padL   = 36;  // y-axis labels
  const padR   = 10;
  const padT   = 10;  // minimal top margin — no persistent bar labels
  const padB   = 24;  // x-axis labels
  const H      = 180;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const n       = pts.length;
  const spacing = innerW / n;
  const barW    = Math.max(6, spacing * 0.6);

  function bx(i: number)   { return padL + i * spacing + (spacing - barW) / 2; }
  function bh(val: number) { return val === 0 ? 0 : Math.max(2, (val / axMax) * innerH); }
  function by(val: number) { return padT + innerH - bh(val); }

  const cornerR = Math.min(5, barW * 0.25);

  function barPath(i: number, val: number): string {
    const x = bx(i);
    const h = bh(val);
    if (h === 0) return "";
    const y = by(val);
    const w = barW;
    const r = h < cornerR * 2 ? 0 : cornerR;
    return [
      `M${x.toFixed(1)},${(y + h).toFixed(1)}`,
      `L${x.toFixed(1)},${(y + r).toFixed(1)}`,
      r > 0 ? `Q${x.toFixed(1)},${y.toFixed(1)} ${(x + r).toFixed(1)},${y.toFixed(1)}` : "",
      `L${(x + w - r).toFixed(1)},${y.toFixed(1)}`,
      r > 0 ? `Q${(x + w).toFixed(1)},${y.toFixed(1)} ${(x + w).toFixed(1)},${(y + r).toFixed(1)}` : "",
      `L${(x + w).toFixed(1)},${(y + h).toFixed(1)}`,
      "Z",
    ].filter(Boolean).join(" ");
  }

  const GRID_COUNT = 4;
  const gridLines  = Array.from({ length: GRID_COUNT + 1 }, (_, i) => (i / GRID_COUNT) * axMax);

  // Skip x labels when too many bars to keep them legible
  const labelStep = n > 14 ? 3 : n > 9 ? 2 : 1;

  const barColor = currentSeries.color;

  return (
    <div className="barchart">
      {/* Controls */}
      <div className="barchart-controls">
        {title && <span className="barchart-title">{title}</span>}
        <div className="barchart-toggles">
          {series.length > 1 && (
            <div className="seg" role="group" aria-label="Series">
              {series.map((s) => (
                <button
                  key={s.key}
                  aria-pressed={activeKey === s.key}
                  className={activeKey === s.key ? "on" : ""}
                  onClick={() => setActiveKey(s.key)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}

          <div className="seg" role="group" aria-label="Currency">
            {(["KES", "USD", "sats"] as const).map((u) => (
              <button
                key={u}
                aria-pressed={unit === u}
                className={unit === u ? "on" : ""}
                onClick={() => setUnit(u)}
              >
                {u}
              </button>
            ))}
          </div>

          {showRangeProp && showRange && (
            <div className="seg" role="group" aria-label="Range">
              {(["6M", "1Y", "All"] as const).map((r) => (
                <button
                  key={r}
                  aria-pressed={range === r}
                  className={range === r ? "on" : ""}
                  onClick={() => setRange(r)}
                >
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ display: "block", overflow: "visible" }}
        role="img"
        aria-label={title ?? "Bar chart"}
      >
        {/* Gridlines + y-axis labels */}
        {gridLines.map((g, gi) => {
          const gy = padT + innerH - (g / axMax) * innerH;
          return (
            <g key={`grid-${chartId}-${gi}`}>
              <line
                x1={padL} y1={gy}
                x2={padL + innerW} y2={gy}
                stroke="var(--border)" strokeWidth="0.8"
              />
              <text
                x={padL - 4} y={gy + 3.5}
                textAnchor="end"
                fontSize="8.5"
                fill="var(--soft)"
              >
                {axisLabel(g)}
              </text>
            </g>
          );
        })}

        {/* Bars + hit targets + labels */}
        {pts.map((pt, i) => {
          const dv     = displayVals[i];
          const barTop = by(dv);
          const d      = barPath(i, dv);
          if (!d) return null;

          const isHovered = hoveredIndex === i;
          const bMid      = bx(i) + barW / 2;

          // Approximate natural text width at fontSize 7.5 (~4.4px per char).
          // Only apply textLength compression when the text would overflow the bar.
          const tipLabel = exact(dv, unit);
          const approxW  = tipLabel.length * 4.4;
          const labelY   = Math.max(8, barTop - 3);

          return (
            <g key={`bar-${chartId}-${i}`}>
              {/* Bar */}
              <path
                d={d}
                fill={barColor}
                stroke="var(--gold)"
                strokeWidth="1.2"
                className="barchart-bar"
                style={{ animationDelay: `${i * 0.04}s` }}
              />

              {/* Full-column hit target — easier to hover than the bar on dense charts */}
              <rect
                x={padL + i * spacing}
                y={padT}
                width={spacing}
                height={innerH}
                fill="transparent"
                style={{ cursor: "default" }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />

              {/* Hover label — no frame, compresses to fit bar width when needed */}
              {isHovered && (
                <text
                  x={bMid}
                  y={labelY}
                  textAnchor="middle"
                  fontSize="7.5"
                  fontWeight="500"
                  fill="var(--muted)"
                  style={{ pointerEvents: "none" }}
                  {...(approxW > barW - 2
                    ? { textLength: barW - 2, lengthAdjust: "spacingAndGlyphs" as const }
                    : {})}
                >
                  {tipLabel}
                </text>
              )}
            </g>
          );
        })}

        {/* X-axis labels */}
        {pts.map((pt, i) => {
          if (i % labelStep !== 0) return null;
          return (
            <text
              key={`xlabel-${chartId}-${i}`}
              x={bx(i) + barW / 2}
              y={H - 5}
              textAnchor="middle"
              fontSize="9"
              fill="var(--soft)"
            >
              {pt.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
