"use client";

import React from "react";
import type { DomainChartPoint } from "@/lib/commandTypes";
import { StrategySilhouette, type SilhouetteKey } from "./StrategySilhouetteRegistry";
import { CompactStrategyChart } from "./CompactStrategyChart";

export interface ExecutiveScorecardBoxProps {
  testId: string;
  title: string;
  subtitle: string;
  badgeText: string;
  badgeClassName: string;
  silhouette: SilhouetteKey;
  primaryLabel: string;
  primaryValue: string | number;
  targetText: string;
  chartId: string;
  chartPoints: DomainChartPoint[];
  chartThreshold?: number;
  chartThresholdLabel?: string;
  chartAccentHex?: string;
  chartMode?: "area" | "bar";
  footerLeft: React.ReactNode;
  footerRight: React.ReactNode;
  isSelected?: boolean;
  borderAccentClassName?: string;
  onClick?: () => void;
}

/**
 * Standardized compact metric & Executive Domain Scorecard shell (`CD-202`).
 * Guarantees identical grid geometry, non-AI SVG silhouette slot, and live chart container.
 */
export function ExecutiveScorecardBox({
  testId,
  title,
  subtitle,
  badgeText,
  badgeClassName,
  silhouette,
  primaryLabel,
  primaryValue,
  targetText,
  chartId,
  chartPoints,
  chartThreshold,
  chartThresholdLabel,
  chartAccentHex,
  chartMode = "area",
  footerLeft,
  footerRight,
  isSelected = false,
  borderAccentClassName,
  onClick,
}: ExecutiveScorecardBoxProps) {
  const baseBorder =
    borderAccentClassName ??
    (isSelected
      ? "bg-zinc-900/90 border-amber-500/50 ring-1 ring-amber-500/40"
      : "bg-zinc-950/70 border-white/10 hover:border-white/20 hover:bg-zinc-900/50");

  return (
    <article
      data-testid={testId}
      onClick={onClick}
      className={`h-full min-h-[228px] p-4 rounded-2xl border backdrop-blur-xl shadow-xl transition-all flex flex-col justify-between gap-3 relative overflow-hidden font-mono ${
        onClick ? "cursor-pointer" : ""
      } ${baseBorder}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <StrategySilhouette variant={silhouette} className="w-10 h-10 shrink-0" />
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider truncate">
              {title}
            </h4>
            <p className="text-[10px] text-zinc-400 truncate">{subtitle}</p>
          </div>
        </div>
        <span
          className={`shrink-0 px-2 py-1 rounded-lg border text-[11px] font-black tracking-wide ${badgeClassName}`}
        >
          {badgeText}
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between gap-2 text-[11px]">
          <span className="text-zinc-400 truncate">{primaryLabel}</span>
          <span className="text-sm font-black text-white shrink-0">{primaryValue}</span>
        </div>

        <CompactStrategyChart
          chartId={chartId}
          points={chartPoints}
          threshold={chartThreshold}
          thresholdLabel={chartThresholdLabel}
          accentHex={chartAccentHex}
          mode={chartMode}
        />

        <div className="text-[10px] text-zinc-500 truncate">{targetText}</div>
      </div>

      <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2 text-[10px]">
        <div className="min-w-0 truncate text-zinc-400">{footerLeft}</div>
        <div className="shrink-0">{footerRight}</div>
      </div>
    </article>
  );
}
