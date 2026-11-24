"use client";

import React from "react";
import { AlertOctagon, Flame, Footprints, ShieldCheck } from "lucide-react";
import type { DailyTelemetryPoint, DriftWarning } from "@/lib/commandTypes";
import { ExecutiveScorecardBox } from "../components/ExecutiveScorecardBox";

export interface TelemetryDriftBoxesProps {
  warnings: DriftWarning[];
  telemetrySeries: DailyTelemetryPoint[];
}

const DAILY_KCAL_TARGET = 1700;
const PROTEIN_FLOOR_G = 180;
const PROTEIN_CEIL_G = 190;
const DAILY_STEP_BASELINE = 10000;

export function TelemetryDriftBoxes({
  warnings,
  telemetrySeries,
}: TelemetryDriftBoxesProps) {
  const latest = telemetrySeries[telemetrySeries.length - 1] ?? null;

  const caloricWarning = warnings.find((w) => w.id === "drift-deficit");
  const neatWarning = warnings.find((w) => w.id === "drift-steps");
  const bottleneckWarnings = warnings.filter(
    (w) => w.id !== "drift-deficit" && w.id !== "drift-steps"
  );

  const latestCalories = latest?.caloriesEaten ?? 0;
  const latestProtein = latest?.proteinG ?? 0;
  const kcalDelta = latest ? latestCalories - DAILY_KCAL_TARGET : 0;
  const caloricDrifting =
    Boolean(caloricWarning) ||
    (latest !== null && (latestCalories > DAILY_KCAL_TARGET || latestProtein < PROTEIN_FLOOR_G));

  const latestSteps = latest?.totalSteps ?? 0;
  const avgSteps =
    telemetrySeries.length > 0
      ? Math.round(
          telemetrySeries.reduce((acc, row) => acc + row.totalSteps, 0) / telemetrySeries.length
        )
      : 0;
  const stepDelta = latest ? latestSteps - DAILY_STEP_BASELINE : 0;
  const neatSlipping = Boolean(neatWarning) || (latest !== null && latestSteps < DAILY_STEP_BASELINE);

  const caloricChartPoints = telemetrySeries.map((row) => ({
    label: row.date.slice(5),
    value: row.caloriesEaten,
  }));

  const neatChartPoints = telemetrySeries.map((row) => ({
    label: row.date.slice(5),
    value: row.totalSteps,
  }));

  return (
    <section
      data-testid="strategy-telemetry-alerts-grid"
      aria-label="Live Biometric Drift and NEAT Telemetry"
      className="space-y-3"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-stretch">
        <ExecutiveScorecardBox
          testId="strategy-card-caloric-drift"
          title="Caloric Deficit Drift Detected"
          subtitle={`Target ${DAILY_KCAL_TARGET.toLocaleString()} kcal · Protein ${PROTEIN_FLOOR_G}–${PROTEIN_CEIL_G}g`}
          badgeText={
            latest === null
              ? "NO LOG"
              : caloricDrifting
              ? `${kcalDelta >= 0 ? "+" : ""}${kcalDelta} kcal`
              : "ON TARGET"
          }
          badgeClassName={
            caloricDrifting
              ? "bg-amber-500/15 text-amber-300 border-amber-500/40"
              : "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
          }
          silhouette="caloric"
          primaryLabel="Latest Intake / Protein"
          primaryValue={
            latest ? `${latestCalories.toLocaleString()} kcal · ${latestProtein}g P` : "Awaiting Log"
          }
          targetText={`Deficit: ${latest ? `${latest.kcalDeficit} kcal` : "--"} | Floor: >= ${PROTEIN_FLOOR_G}g protein`}
          chartId="caloric-drift"
          chartPoints={caloricChartPoints}
          chartThreshold={DAILY_KCAL_TARGET}
          chartThresholdLabel="1,700 kcal"
          chartAccentHex={caloricDrifting ? "#f59e0b" : "#10b981"}
          chartMode="bar"
          borderAccentClassName={
            caloricDrifting
              ? "bg-amber-950/20 border-amber-500/35"
              : "bg-zinc-950/70 border-white/10"
          }
          footerLeft={
            <span className="inline-flex items-center gap-1">
              <Flame size={11} className="text-amber-400" />
              <span>{caloricWarning ? caloricWarning.currentValue : `${latestCalories} kcal`}</span>
            </span>
          }
          footerRight={
            caloricDrifting ? (
              <span className="inline-flex items-center gap-1 text-amber-300 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/25">
                DRIFT ALERT
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/25">
                <ShieldCheck size={10} />
                LOCKED IN
              </span>
            )
          }
        />

        <ExecutiveScorecardBox
          testId="strategy-card-neat-slippage"
          title="NEAT Slippage"
          subtitle={`Non-Exercise Activity · ${DAILY_STEP_BASELINE.toLocaleString()} step baseline`}
          badgeText={
            latest === null
              ? "NO LOG"
              : `${stepDelta >= 0 ? "+" : ""}${stepDelta.toLocaleString()}`
          }
          badgeClassName={
            neatSlipping
              ? "bg-sky-500/15 text-sky-300 border-sky-500/40"
              : "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
          }
          silhouette="neat"
          primaryLabel="Latest Steps / 7-Day Avg"
          primaryValue={
            latest ? `${latestSteps.toLocaleString()} / ${avgSteps.toLocaleString()}` : "Awaiting Log"
          }
          targetText={`Baseline: ${DAILY_STEP_BASELINE.toLocaleString()} steps/day`}
          chartId="neat-slippage"
          chartPoints={neatChartPoints}
          chartThreshold={DAILY_STEP_BASELINE}
          chartThresholdLabel="10k steps"
          chartAccentHex={neatSlipping ? "#38bdf8" : "#10b981"}
          chartMode="area"
          borderAccentClassName={
            neatSlipping
              ? "bg-sky-950/20 border-sky-500/35"
              : "bg-zinc-950/70 border-white/10"
          }
          footerLeft={
            <span className="inline-flex items-center gap-1">
              <Footprints size={11} className="text-sky-400" />
              <span>{neatWarning ? neatWarning.currentValue : `${avgSteps.toLocaleString()} avg`}</span>
            </span>
          }
          footerRight={
            neatSlipping ? (
              <span className="inline-flex items-center gap-1 text-sky-300 font-bold bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/25">
                SLIPPAGE
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/25">
                <ShieldCheck size={10} />
                ON PACE
              </span>
            )
          }
        />
      </div>

      {bottleneckWarnings.length > 0 && (
        <div className="space-y-2 font-mono text-xs">
          {bottleneckWarnings.map((w) => (
            <div
              key={w.id}
              className="px-3.5 py-2.5 rounded-xl bg-rose-950/35 border border-rose-500/35 text-rose-200 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2 min-w-0">
                <AlertOctagon size={14} className="text-rose-400 shrink-0" />
                <span className="font-bold truncate">{w.title}</span>
              </div>
              <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-rose-500/20 text-rose-200 shrink-0">
                {w.domain}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
