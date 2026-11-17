"use client";

import React from "react";
import { Flame, Layers, TrendingUp, Zap } from "lucide-react";

interface TitanKpiScorecardProps {
  sessionVolumeLbs: number;
  completedSets: number;
  totalSets: number;
  weeklyTonnageLbs?: number;
  hypertrophyScore?: number;
}

export function TitanKpiScorecard({
  sessionVolumeLbs,
  completedSets,
  totalSets,
  weeklyTonnageLbs = 0,
  hypertrophyScore = 0,
}: TitanKpiScorecardProps) {
  const percentCompleted = totalSets > 0 ? Math.min(100, Math.round((completedSets / totalSets) * 100)) : 0;
  const stimulus = hypertrophyScore > 0 ? hypertrophyScore : percentCompleted > 0 ? Math.min(100, Math.round(percentCompleted * 0.98)) : 0;

  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 select-none">
      {/* 1. Total Session Volume */}
      <div className="bg-[#0F131C] border border-white/10 p-4 rounded-2xl flex items-center justify-between shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center text-lg">
            🔥
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase text-zinc-400 tracking-wider">
              Total Session Volume
            </div>
            <div className="text-xl font-mono font-extrabold text-white mt-0.5" style={{ fontVariantNumeric: "tabular-nums" }}>
              {sessionVolumeLbs.toLocaleString()}{" "}
              <span className="text-xs font-normal text-zinc-500">lbs</span>
            </div>
          </div>
        </div>
        <span
          className={`text-[10px] font-mono px-2 py-0.5 rounded-lg font-bold border ${
            sessionVolumeLbs > 0
              ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
              : "bg-white/5 text-zinc-500 border-white/10"
          }`}
        >
          {sessionVolumeLbs > 0 ? "+4.2%" : "Ready"}
        </span>
      </div>

      {/* 2. Sets Completed */}
      <div className="bg-[#0F131C] border border-white/10 p-4 rounded-2xl flex items-center justify-between shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center text-lg">
            🥞
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase text-zinc-400 tracking-wider">
              Sets Completed
            </div>
            <div className="text-xl font-mono font-extrabold text-white mt-0.5" style={{ fontVariantNumeric: "tabular-nums" }}>
              {completedSets} / {totalSets}{" "}
              <span className="text-xs font-bold text-cyan-300">({percentCompleted}%)</span>
            </div>
          </div>
        </div>
        <div className="w-16 h-2 bg-zinc-800 rounded-full overflow-hidden border border-white/5">
          <div
            className="h-full bg-cyan-400 rounded-full transition-all duration-300 shadow-[0_0_8px_#00f0ff]"
            style={{ width: `${percentCompleted}%` }}
          />
        </div>
      </div>

      {/* 3. Weekly Tonnage */}
      <div className="bg-[#0F131C] border border-white/10 p-4 rounded-2xl flex items-center justify-between shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-lg">
            📈
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase text-zinc-400 tracking-wider">
              Weekly Tonnage
            </div>
            <div className="text-xl font-mono font-extrabold text-white mt-0.5" style={{ fontVariantNumeric: "tabular-nums" }}>
              {weeklyTonnageLbs > 0 ? weeklyTonnageLbs.toLocaleString() : sessionVolumeLbs.toLocaleString()}{" "}
              <span className="text-xs font-normal text-zinc-500">lbs</span>
            </div>
          </div>
        </div>
        <span
          className={`text-[10px] font-mono px-2 py-0.5 rounded-lg font-bold border ${
            weeklyTonnageLbs > 0 || sessionVolumeLbs > 0
              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
              : "bg-white/5 text-zinc-500 border-white/10"
          }`}
        >
          {weeklyTonnageLbs > 0 || sessionVolumeLbs > 0 ? "On Pace" : "Standby"}
        </span>
      </div>

      {/* 4. Hypertrophy Stimulus Index */}
      <div className="bg-[#0F131C] border border-white/10 p-4 rounded-2xl flex items-center justify-between shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center text-lg">
            ⚡
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase text-zinc-400 tracking-wider">
              Hypertrophy Stimulus
            </div>
            <div className="text-xl font-mono font-extrabold text-white mt-0.5" style={{ fontVariantNumeric: "tabular-nums" }}>
              {stimulus > 0 ? `${stimulus}%` : "0%"}{" "}
              <span className="text-xs font-normal text-purple-400">
                {stimulus >= 85 ? "Optimal" : stimulus > 0 ? "Active" : "Pending"}
              </span>
            </div>
          </div>
        </div>
        <span
          className={`text-[10px] font-mono px-2 py-0.5 rounded-lg font-bold border ${
            stimulus >= 80
              ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
              : "bg-white/5 text-zinc-500 border-white/10"
          }`}
        >
          {stimulus >= 80 ? "Peak Zone" : "Building"}
        </span>
      </div>
    </section>
  );
}
