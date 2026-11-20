"use client";

import React from "react";
import {
  CheckCircle2,
  Columns,
  Flame,
  LayoutGrid,
  PlusCircle,
  Table2,
  X,
} from "lucide-react";
import { KpiViewMode, ScorecardSnapshot, ScorecardSummary } from "../types";
import { SparklineSvg } from "./SparklineSvg";

interface ScorecardHeroBannerProps {
  viewMode: KpiViewMode;
  onChangeViewMode: (mode: KpiViewMode) => void;
  summary: ScorecardSummary;
  totalKpisCount: number;
  streakCount: number;
  snapshots: ScorecardSnapshot[];
  checkInOpen: boolean;
  onToggleCheckIn: () => void;
  onCloseCheckIn: () => void;
  checkInCadence: "daily" | "weekly" | "monthly";
  onChangeCadence: (cadence: "daily" | "weekly" | "monthly") => void;
  checkInNote: string;
  onChangeNote: (note: string) => void;
  savingCheckIn: boolean;
  onSubmitCheckIn: (e: React.FormEvent) => void;
}

const VIEW_MODES: Array<{ id: KpiViewMode; label: string; icon: typeof Table2 }> = [
  { id: "matrix", label: "Scorecard Matrix & Trends", icon: Table2 },
  { id: "cards", label: "3D Sector Physics Cards", icon: LayoutGrid },
  { id: "both", label: "Split Both", icon: Columns },
];

export function ScorecardHeroBanner({
  viewMode,
  onChangeViewMode,
  summary,
  totalKpisCount,
  streakCount,
  snapshots,
  checkInOpen,
  onToggleCheckIn,
  onCloseCheckIn,
  checkInCadence,
  onChangeCadence,
  checkInNote,
  onChangeNote,
  savingCheckIn,
  onSubmitCheckIn,
}: ScorecardHeroBannerProps) {
  const denom = Math.max(1, totalKpisCount);

  return (
    <section className="rounded-2xl bg-white/85 dark:bg-[#0d111a]/90 backdrop-blur-xl border border-zinc-200/60 dark:border-white/10 p-5 md:p-6 shadow-[0_18px_50px_rgba(0,0,0,0.2)] space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-amber-500 dark:text-amber-400">
              Executive Life Pillars &amp; Personal Telemetry Command
            </span>
          </div>
          <h1 className="text-lg md:text-xl font-serif tracking-widest uppercase text-zinc-900 dark:text-white mt-0.5">
            Executive KPI Tracker Scorecard
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-black/50 p-1 rounded-xl border border-zinc-200 dark:border-white/10">
            {VIEW_MODES.map((v) => {
              const Icon = v.icon;
              const active = viewMode === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  data-testid={`kpi-view-${v.id}`}
                  onClick={() => onChangeViewMode(v.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    active
                      ? "bg-amber-500/20 text-amber-700 dark:text-amber-200 border border-amber-400/40"
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{v.label}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            data-testid="kpi-log-checkin-btn"
            onClick={onToggleCheckIn}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-xs font-extrabold uppercase tracking-wider text-slate-950 flex items-center gap-1.5 shadow-[0_0_25px_rgba(245,158,11,0.3)] transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Log Scorecard Check-In</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div className="md:col-span-4 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/70 dark:border-white/[0.08] p-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              Weighted Command Score
            </div>
            <div className="flex items-baseline gap-2.5 mt-1">
              <span
                data-testid="kpi-overall-score"
                className="text-3xl font-mono font-extrabold text-zinc-900 dark:text-white"
              >
                {summary.overallScore}
              </span>
              <span className="text-xs font-mono text-zinc-400">/ 100</span>
              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-400/35 text-sm font-extrabold text-emerald-600 dark:text-emerald-300">
                Grade {summary.grade}
              </span>
            </div>
          </div>
          <SparklineSvg
            points={summary.overallTrend}
            rag={
              summary.overallScore >= 80
                ? "GREEN"
                : summary.overallScore >= 65
                ? "YELLOW"
                : "RED"
            }
            width={92}
            height={32}
          />
        </div>

        <div className="md:col-span-5 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/70 dark:border-white/[0.08] p-4 space-y-2">
          <div className="flex items-center justify-between text-[10.5px] font-bold uppercase tracking-wider">
            <span className="text-emerald-600 dark:text-emerald-400">
              {summary.greenCount} Optimal
            </span>
            <span className="text-amber-600 dark:text-yellow-400">
              {summary.yellowCount} Warning
            </span>
            <span className="text-rose-600 dark:text-red-400">{summary.redCount} Critical</span>
            <span className="font-mono text-zinc-400">{totalKpisCount} Total KPIs</span>
          </div>
          <div className="w-full h-3 rounded-full bg-zinc-200 dark:bg-black/60 overflow-hidden flex p-0.5 gap-0.5">
            <div
              className="h-full rounded-l-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${(summary.greenCount / denom) * 100}%` }}
            />
            <div
              className="h-full bg-yellow-500 transition-all duration-500"
              style={{ width: `${(summary.yellowCount / denom) * 100}%` }}
            />
            <div
              className="h-full rounded-r-full bg-red-500 transition-all duration-500"
              style={{ width: `${(summary.redCount / denom) * 100}%` }}
            />
          </div>
        </div>

        <div className="md:col-span-3 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/70 dark:border-white/[0.08] p-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              Check-In Streak
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <Flame className="w-5 h-5 text-orange-400" />
              <span className="text-xl font-mono font-extrabold text-zinc-900 dark:text-white">
                {streakCount} Check-Ins
              </span>
            </div>
            <div className="text-[10px] font-mono text-zinc-400 mt-0.5 truncate max-w-[180px]">
              Last:{" "}
              {snapshots.length > 0 ? snapshots[snapshots.length - 1].snapshot_date : "Ready"}
            </div>
          </div>
        </div>
      </div>

      {checkInOpen && (
        <form
          data-testid="kpi-checkin-form"
          onSubmit={onSubmitCheckIn}
          className="rounded-xl bg-amber-500/10 border border-amber-400/30 p-4 flex flex-wrap items-center gap-3"
        >
          <div className="flex items-center gap-1 bg-black/30 p-1 rounded-lg border border-white/10">
            {(["daily", "weekly", "monthly"] as const).map((cad) => (
              <button
                key={cad}
                type="button"
                data-testid={`kpi-checkin-cadence-${cad}`}
                onClick={() => onChangeCadence(cad)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                  checkInCadence === cad
                    ? "bg-amber-400 text-slate-950"
                    : "text-zinc-300 hover:text-white"
                }`}
              >
                {cad}
              </button>
            ))}
          </div>

          <input
            type="text"
            data-testid="kpi-checkin-note-input"
            value={checkInNote}
            onChange={(e) => onChangeNote(e.target.value)}
            placeholder="Executive note (e.g., Locked 19:00 hard stop, LTV:CAC above 3.2x...)"
            className="flex-1 min-w-[240px] px-3.5 py-2 rounded-lg bg-white dark:bg-black/50 border border-zinc-300 dark:border-white/15 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-amber-400"
          />

          <button
            type="submit"
            data-testid="kpi-checkin-submit-btn"
            disabled={savingCheckIn}
            className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{savingCheckIn ? "Saving..." : "Commit Snapshot"}</span>
          </button>

          <button
            type="button"
            data-testid="kpi-checkin-close-btn"
            onClick={onCloseCheckIn}
            className="p-2 rounded-lg text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </form>
      )}
    </section>
  );
}
