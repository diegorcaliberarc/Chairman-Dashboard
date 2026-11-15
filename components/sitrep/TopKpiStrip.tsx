"use client";

import React from "react";
import { Scale, TrendingDown, Flame, Droplets, Trophy, CheckCircle2, AlertTriangle, ShieldAlert } from "lucide-react";
import { DailySitrepLog, SitrepGrade } from "@/lib/commandTypes";

interface TopKpiStripProps {
  stats: {
    currentWeight: number | null;
    weightDelta: number | null;
    movingAvg: number | null;
    targetWeightLbs: number;
    distanceToTarget: number | null;
    passRatePct: number;
    avgDeficit: number;
    avgProtein: number;
    avgSteps: number;
  };
  todayLog: DailySitrepLog | null;
}

export function TopKpiStrip({ stats, todayLog }: TopKpiStripProps) {
  const grade: SitrepGrade = todayLog?.sitrep_grade || "miss";
  const isPass = grade === "pass";
  const isPartial = grade === "partial";

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {/* 1. Morning Weight Card */}
      <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-white/10 backdrop-blur-xl relative overflow-hidden group hover:border-sky-500/30 transition">
        <div className="flex items-center justify-between text-zinc-400 mb-1.5">
          <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Morning Scale</span>
          <Scale size={14} className="text-sky-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black font-mono text-white tracking-tight">
            {stats.currentWeight ? `${stats.currentWeight}` : "—"}
          </span>
          <span className="text-xs text-zinc-400 font-mono">lbs</span>
        </div>
        <div className="text-[11px] mt-1 font-mono">
          {stats.weightDelta !== null ? (
            <span className={stats.weightDelta <= 0 ? "text-emerald-400" : "text-amber-400"}>
              {stats.weightDelta > 0 ? `+${stats.weightDelta}` : stats.weightDelta} lbs vs prev
            </span>
          ) : (
            <span className="text-zinc-500">Awaiting scale weigh-in</span>
          )}
        </div>
      </div>

      {/* 2. 7-Day Moving Avg Card */}
      <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-white/10 backdrop-blur-xl relative overflow-hidden group hover:border-amber-500/30 transition">
        <div className="flex items-center justify-between text-zinc-400 mb-1.5">
          <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">7-Day Moving Avg</span>
          <TrendingDown size={14} className="text-amber-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black font-mono text-amber-300 tracking-tight">
            {stats.movingAvg ? `${stats.movingAvg}` : "—"}
          </span>
          <span className="text-xs text-zinc-400 font-mono">lbs</span>
        </div>
        <div className="text-[11px] mt-1 font-mono text-zinc-400">
          {stats.distanceToTarget !== null ? (
            <span className={stats.distanceToTarget <= 0 ? "text-emerald-400 font-semibold" : "text-amber-400 font-semibold"}>
              {stats.distanceToTarget > 0 ? `+${stats.distanceToTarget}` : stats.distanceToTarget} lbs to target ({stats.targetWeightLbs})
            </span>
          ) : (
            <span className="text-zinc-500">Target: {stats.targetWeightLbs} lbs</span>
          )}
        </div>
      </div>

      {/* 3. Caloric Deficit Card */}
      <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-white/10 backdrop-blur-xl relative overflow-hidden group hover:border-emerald-500/30 transition">
        <div className="flex items-center justify-between text-zinc-400 mb-1.5">
          <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Net Deficit</span>
          <Flame size={14} className="text-rose-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span
            className={`text-2xl font-black font-mono tracking-tight ${
              (todayLog?.kcal_deficit ?? stats.avgDeficit) >= 350
                ? "text-emerald-400"
                : (todayLog?.kcal_deficit ?? stats.avgDeficit) > 0
                ? "text-amber-400"
                : "text-rose-400"
            }`}
          >
            {todayLog ? (todayLog.kcal_deficit > 0 ? `+${todayLog.kcal_deficit}` : todayLog.kcal_deficit) : stats.avgDeficit > 0 ? `+${stats.avgDeficit}` : stats.avgDeficit}
          </span>
          <span className="text-xs text-zinc-400 font-mono">kcal</span>
        </div>
        <div className="text-[11px] mt-1 font-mono text-zinc-400">
          7D Avg: <span className="text-zinc-200 font-bold">{stats.avgDeficit} kcal</span> (target &ge; 350)
        </div>
      </div>

      {/* 4. Protein & Hydration Card */}
      <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-white/10 backdrop-blur-xl relative overflow-hidden group hover:border-indigo-500/30 transition">
        <div className="flex items-center justify-between text-zinc-400 mb-1.5">
          <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Protein & Fuel</span>
          <Droplets size={14} className="text-cyan-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black font-mono text-indigo-300 tracking-tight">
            {todayLog?.protein_g ?? stats.avgProtein}
          </span>
          <span className="text-xs text-zinc-400 font-mono">g</span>
          <span className="text-xs text-zinc-500 font-mono ml-auto">
            {todayLog?.water_oz ?? 0} oz H2O
          </span>
        </div>
        <div className="text-[11px] mt-1 font-mono text-zinc-400">
          7D Steps: <span className="text-cyan-300 font-bold">{stats.avgSteps.toLocaleString()}</span> / 10k
        </div>
      </div>

      {/* 5. Daily Mission Grade Badge */}
      <div className={`col-span-2 md:col-span-1 p-3.5 rounded-2xl border backdrop-blur-xl relative overflow-hidden flex flex-col justify-between ${
        isPass
          ? "bg-emerald-950/30 border-emerald-500/30"
          : isPartial
          ? "bg-amber-950/30 border-amber-500/30"
          : "bg-rose-950/30 border-rose-500/30"
      }`}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-zinc-300">
            Daily SITREP Grade
          </span>
          <Trophy size={14} className={isPass ? "text-emerald-400" : isPartial ? "text-amber-400" : "text-rose-400"} />
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-2xl font-black font-mono tracking-wider uppercase ${
              isPass ? "text-emerald-300" : isPartial ? "text-amber-300" : "text-rose-300"
            }`}
          >
            {grade}
          </span>
          <span className="text-xs text-zinc-400 font-mono">
            {isPass ? "All Targets Met" : isPartial ? "Partial Pass" : "Action Needed"}
          </span>
        </div>
        <div className="text-[10px] mt-1 font-mono text-zinc-400">
          7D Pass Rate: <span className="text-white font-bold">{stats.passRatePct}%</span>
        </div>
      </div>
    </div>
  );
}
