"use client";

import React, { useMemo } from "react";
import { PieChart, ShieldCheck } from "lucide-react";
import { DailySitrepLog } from "@/lib/commandTypes";

interface PolarAdherenceWheelCardProps {
  todayLog?: DailySitrepLog | null;
  dailyLog?: any;
  totals?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export function PolarAdherenceWheelCard({
  todayLog,
  dailyLog,
  totals,
}: PolarAdherenceWheelCardProps) {
  // Dynamically calculate scores (0 to 10 scale) strictly from real data
  const {
    hydrationScore,
    proteinScore,
    carbScore,
    fatScore,
    aggregateScore,
    adherencePct,
  } = useMemo(() => {
    const waterOz = todayLog?.water_oz || 0;
    const proteinG = totals?.protein || todayLog?.protein_g || 0;
    const carbsG = totals?.carbs || 0;
    const fatG = totals?.fat || 0;

    const protTarget = dailyLog?.protein_target_g || 190;
    const carbTarget = 220;
    const fatTarget = 65;
    const waterTargetOz = 128.5; // ~3.8L

    const wScore = Math.min(10, +(Math.max(0, (waterOz / waterTargetOz) * 10)).toFixed(1));
    const pScore = Math.min(10, +(Math.max(0, (proteinG / protTarget) * 10)).toFixed(1));
    const cScore = Math.min(10, +(Math.max(0, (carbsG / carbTarget) * 10)).toFixed(1));
    const fScore = Math.min(10, +(Math.max(0, (fatG / fatTarget) * 10)).toFixed(1));

    const totalScores = wScore + pScore + cScore + fScore;
    const agg = +(totalScores / 4).toFixed(1);
    const pct = Math.min(100, Math.round((agg / 10) * 100));

    return {
      hydrationScore: wScore,
      proteinScore: pScore,
      carbScore: cScore,
      fatScore: fScore,
      aggregateScore: agg,
      adherencePct: pct,
    };
  }, [todayLog, dailyLog, totals]);

  // Convert 1-10 score to radial radius (scale 10 = 100px)
  const rWater = Math.min(100, hydrationScore * 10);
  const rProtein = Math.min(100, proteinScore * 10);
  const rCarbs = Math.min(100, carbScore * 10);
  const rFats = Math.min(100, fatScore * 10);

  return (
    <div
      className="p-4 rounded-2xl border transition-all duration-300 flex flex-col relative group shadow-2xl"
      style={{
        backgroundColor: "var(--glass-surface)",
        backdropFilter: "blur(var(--glass-blur, 26px)) saturate(185%)",
        WebkitBackdropFilter: "blur(var(--glass-blur, 26px)) saturate(185%)",
        borderColor: "var(--glass-border)",
        boxShadow: "inset 0 1px 0 0 var(--glass-specular), var(--glass-shadow)",
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <PieChart className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
          <span className="font-mono font-bold text-xs uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
            Target Adherence &amp; Metabolic Score
          </span>
        </div>
        <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/25 text-cyan-600 dark:text-cyan-400 font-mono text-[10px] font-bold uppercase tracking-wider">
          Scale 1-10
        </span>
      </div>

      {/* Polar Wheel Coxcomb SVG Chart */}
      <div className="flex items-center justify-center my-3 relative">
        <svg className="w-56 h-56 -rotate-90 select-none overflow-visible" viewBox="-120 -120 240 240">
          <defs>
            <filter id="glow-rose-space" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-cyan-space" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Concentric Scale Rings */}
          <circle cx="0" cy="0" r="20" fill="transparent" stroke="currentColor" className="text-zinc-400/25 dark:text-white/10" strokeDasharray="2 2" strokeWidth="1" />
          <circle cx="0" cy="0" r="40" fill="transparent" stroke="currentColor" className="text-zinc-400/25 dark:text-white/10" strokeDasharray="2 2" strokeWidth="1" />
          <circle cx="0" cy="0" r="60" fill="transparent" stroke="currentColor" className="text-zinc-400/25 dark:text-white/10" strokeDasharray="2 2" strokeWidth="1" />
          <circle cx="0" cy="0" r="80" fill="transparent" stroke="currentColor" className="text-zinc-400/35 dark:text-white/20" strokeWidth="1.2" />
          <circle cx="0" cy="0" r="100" fill="transparent" stroke="currentColor" className="text-zinc-400/50 dark:text-white/30" strokeWidth="1.5" />

          {/* Radiating Axes (4 Quadrants) */}
          <line x1="-105" y1="0" x2="105" y2="0" stroke="currentColor" className="text-zinc-400/35 dark:text-white/20" strokeWidth="1.2" />
          <line x1="0" y1="-105" x2="0" y2="105" stroke="currentColor" className="text-zinc-400/35 dark:text-white/20" strokeWidth="1.2" />

          {/* Quadrant 1: Water (Score 0-10 -> Ice Blue / Sky) */}
          {rWater > 0 && (
            <path
              d={`M 0 0 L ${rWater} 0 A ${rWater} ${rWater} 0 0 1 0 ${rWater} Z`}
              fill="#38bdf8"
              fillOpacity="0.45"
              stroke="#38bdf8"
              strokeWidth="2"
              className="hover:fill-opacity-65 transition-all cursor-pointer"
            />
          )}

          {/* Quadrant 2: Protein (Score 0-10 -> Supernova Cyan) */}
          {rProtein > 0 && (
            <path
              d={`M 0 0 L 0 ${rProtein} A ${rProtein} ${rProtein} 0 0 1 -${rProtein} 0 Z`}
              fill="#06b6d4"
              fillOpacity="0.45"
              filter="url(#glow-cyan-space)"
              stroke="#06b6d4"
              strokeWidth="2"
              className="hover:fill-opacity-65 transition-all cursor-pointer"
            />
          )}

          {/* Quadrant 3: Carbohydrates (Score 0-10 -> Over-Limit Plasma Red / Rose) */}
          {rCarbs > 0 && (
            <path
              d={`M 0 0 L -${rCarbs} 0 A ${rCarbs} ${rCarbs} 0 0 1 0 -${rCarbs} Z`}
              fill="#f43f5e"
              fillOpacity="0.65"
              filter="url(#glow-rose-space)"
              stroke="#f43f5e"
              strokeWidth="2.5"
              className="hover:fill-opacity-80 transition-all cursor-pointer"
            />
          )}

          {/* Quadrant 4: Fats / Lipids (Score 0-10 -> Pulsing Violet) */}
          {rFats > 0 && (
            <path
              d={`M 0 0 L 0 -${rFats} A ${rFats} ${rFats} 0 0 1 ${rFats} 0 Z`}
              fill="#a855f7"
              fillOpacity="0.40"
              stroke="#a855f7"
              strokeWidth="2"
              className="hover:fill-opacity-65 transition-all cursor-pointer"
            />
          )}

          {/* Center Hub */}
          <circle cx="0" cy="0" r="18" fill="currentColor" className="text-zinc-100 dark:text-[#070a14]" stroke="currentColor" strokeWidth="1.5" />
        </svg>

        {/* Center Badge Floating */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
          <div
            className="px-2 py-0.5 rounded-full border shadow-lg text-center backdrop-blur-md"
            style={{
              backgroundColor: "var(--glass-surface-elevated)",
              borderColor: "var(--glass-border)",
            }}
          >
            <span className="font-mono text-xs font-black text-cyan-600 dark:text-cyan-400">
              {aggregateScore > 0 ? `${aggregateScore}` : "0.0"}
            </span>
            <span className="font-mono text-[8px] text-zinc-500 dark:text-zinc-400 block -mt-0.5">SCORE</span>
          </div>
        </div>
      </div>

      {/* Score Legend / Quadrants Status */}
      <div className="grid grid-cols-2 gap-2 text-xs font-mono border-t pt-3" style={{ borderColor: "var(--glass-border)" }}>
        {/* Water */}
        <div
          className="flex items-center justify-between p-1.5 rounded-lg border transition-colors"
          style={{
            backgroundColor: "var(--glass-surface-elevated)",
            borderColor: "var(--glass-border)",
          }}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            <span className="text-zinc-800 dark:text-zinc-200 font-semibold text-[11px]">Water</span>
          </div>
          <span className="font-bold text-sky-600 dark:text-sky-400">{hydrationScore}/10</span>
        </div>

        {/* Protein */}
        <div
          className="flex items-center justify-between p-1.5 rounded-lg border transition-colors"
          style={{
            backgroundColor: "var(--glass-surface-elevated)",
            borderColor: "var(--glass-border)",
          }}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-zinc-800 dark:text-zinc-200 font-semibold text-[11px]">Protein</span>
          </div>
          <span className="font-bold text-cyan-600 dark:text-cyan-400">{proteinScore}/10</span>
        </div>

        {/* Carbs */}
        <div
          className="flex items-center justify-between p-1.5 rounded-lg border transition-colors"
          style={{
            backgroundColor: "var(--glass-surface-elevated)",
            borderColor: "var(--glass-border)",
          }}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span className="text-zinc-800 dark:text-zinc-200 font-semibold text-[11px]">Carbs</span>
          </div>
          <span className="font-bold text-rose-600 dark:text-rose-400">{carbScore}/10</span>
        </div>

        {/* Lipids */}
        <div
          className="flex items-center justify-between p-1.5 rounded-lg border transition-colors"
          style={{
            backgroundColor: "var(--glass-surface-elevated)",
            borderColor: "var(--glass-border)",
          }}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            <span className="text-zinc-800 dark:text-zinc-200 font-semibold text-[11px]">Lipids</span>
          </div>
          <span className="font-bold text-purple-600 dark:text-purple-400">{fatScore}/10</span>
        </div>
      </div>

      <div className="mt-2 text-center text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
        Aggregate Telemetry Adherence: <span className="text-cyan-600 dark:text-cyan-400 font-bold">{adherencePct}%</span>
      </div>
    </div>
  );
}
