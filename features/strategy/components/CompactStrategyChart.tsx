"use client";

import React from "react";
import type { DomainChartPoint } from "@/lib/commandTypes";

export interface CompactStrategyChartProps {
  chartId: string;
  points: DomainChartPoint[];
  threshold?: number;
  thresholdLabel?: string;
  accentHex?: string;
  mode?: "area" | "bar";
}

const VIEW_W = 240;
const VIEW_H = 64;
const PAD_X = 8;
const PAD_Y = 8;

export function CompactStrategyChart({
  chartId,
  points,
  threshold,
  thresholdLabel,
  accentHex = "#f59e0b",
  mode = "area",
}: CompactStrategyChartProps) {
  if (!points || points.length === 0) {
    return (
      <div
        data-testid={`strategy-chart-${chartId}`}
        className="h-16 w-full rounded-xl bg-zinc-900/70 border border-white/5 flex items-center justify-center text-[10px] font-mono text-zinc-500"
      >
        Awaiting live telemetry logs
      </div>
    );
  }

  const values = points.map((p) => p.value);
  const allNums = threshold !== undefined ? [...values, threshold] : values;
  const maxVal = Math.max(...allNums, 1);
  const minVal = Math.min(...allNums, 0);
  const span = Math.max(maxVal - minVal, 1);

  const usableW = VIEW_W - PAD_X * 2;
  const usableH = VIEW_H - PAD_Y * 2;

  const toY = (val: number) => PAD_Y + usableH - ((val - minVal) / span) * usableH;

  const coords = points.map((p, idx) => {
    const x =
      points.length === 1
        ? VIEW_W / 2
        : PAD_X + (idx / (points.length - 1)) * usableW;
    return { x, y: toY(p.value), label: p.label, value: p.value };
  });

  const linePath = coords
    .map((c, idx) => `${idx === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`)
    .join(" ");

  const areaPath =
    coords.length > 1
      ? `${linePath} L${coords[coords.length - 1].x.toFixed(1)},${(VIEW_H - PAD_Y).toFixed(1)} L${coords[0].x.toFixed(1)},${(VIEW_H - PAD_Y).toFixed(1)} Z`
      : "";

  const thresholdY = threshold !== undefined ? toY(threshold) : null;
  const barWidth = Math.max(8, Math.min(22, usableW / Math.max(points.length, 1) - 6));

  return (
    <div
      data-testid={`strategy-chart-${chartId}`}
      className="relative h-16 w-full rounded-xl bg-zinc-900/60 border border-white/5 px-1.5 py-1 overflow-hidden"
    >
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="none"
        className="w-full h-full overflow-visible"
        role="img"
        aria-label={`${chartId} telemetry chart`}
      >
        {thresholdY !== null && (
          <line
            x1={PAD_X}
            y1={thresholdY}
            x2={VIEW_W - PAD_X}
            y2={thresholdY}
            stroke="rgba(244, 244, 245, 0.35)"
            strokeWidth="1"
            strokeDasharray="4 3"
          />
        )}

        {mode === "bar" ? (
          coords.map((c) => {
            const barH = Math.max(3, VIEW_H - PAD_Y - c.y);
            return (
              <rect
                key={`${c.label}-${c.x}`}
                x={c.x - barWidth / 2}
                y={c.y}
                width={barWidth}
                height={barH}
                rx={3}
                fill={accentHex}
                fillOpacity={0.75}
              />
            );
          })
        ) : (
          <>
            {areaPath && <path d={areaPath} fill={accentHex} fillOpacity={0.14} />}
            <path d={linePath} fill="none" stroke={accentHex} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {coords.map((c) => (
              <circle key={`${c.label}-${c.x}`} cx={c.x} cy={c.y} r="2.6" fill={accentHex} />
            ))}
          </>
        )}
      </svg>

      {thresholdLabel && (
        <span className="pointer-events-none absolute top-1 right-2 text-[9px] font-mono text-zinc-400">
          {thresholdLabel}
        </span>
      )}
    </div>
  );
}
