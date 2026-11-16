"use client";

import React from "react";
import { PieChart } from "lucide-react";

interface PolarAdherenceWheelCardProps {
  hydrationScore?: number;
  proteinScore?: number;
  carbScore?: number;
  fatScore?: number;
  aggregateScore?: number;
  adherencePct?: number;
}

export function PolarAdherenceWheelCard({
  hydrationScore = 8.4,
  proteinScore = 8.8,
  carbScore = 9.5,
  fatScore = 4.2,
  aggregateScore = 7.7,
  adherencePct = 82,
}: PolarAdherenceWheelCardProps) {
  // Convert 1-10 score to radial radius (scale 10 = 100px)
  const rWater = Math.min(100, Math.max(10, hydrationScore * 10));
  const rProtein = Math.min(100, Math.max(10, proteinScore * 10));
  const rCarbs = Math.min(100, Math.max(10, carbScore * 10));
  const rFats = Math.min(100, Math.max(10, fatScore * 10));

  return (
    <div className="p-4 rounded-2xl bg-surface/80 border border-border backdrop-blur-xl flex flex-col relative group shadow-2xl">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <PieChart className="w-4 h-4 text-cyan-400" />
          <span className="font-mono font-bold text-xs uppercase tracking-wider text-zinc-100">
            Target Adherence &amp; Metabolic Score
          </span>
        </div>
        <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 font-mono text-[10px] font-bold uppercase tracking-wider">
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
          <circle cx="0" cy="0" r="20" fill="transparent" stroke="rgba(255, 255, 255, 0.08)" strokeDasharray="2 2" strokeWidth="1" />
          <circle cx="0" cy="0" r="40" fill="transparent" stroke="rgba(255, 255, 255, 0.08)" strokeDasharray="2 2" strokeWidth="1" />
          <circle cx="0" cy="0" r="60" fill="transparent" stroke="rgba(255, 255, 255, 0.08)" strokeDasharray="2 2" strokeWidth="1" />
          <circle cx="0" cy="0" r="80" fill="transparent" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.2" />
          <circle cx="0" cy="0" r="100" fill="transparent" stroke="rgba(255, 255, 255, 0.22)" strokeWidth="1.5" />

          {/* Radiating Axes (4 Quadrants) */}
          <line x1="-105" y1="0" x2="105" y2="0" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.2" />
          <line x1="0" y1="-105" x2="0" y2="105" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.2" />

          {/* Quadrant 1: Water (Score 8.4/10 -> Ice Blue / Sky) */}
          <path
            d={`M 0 0 L ${rWater} 0 A ${rWater} ${rWater} 0 0 1 0 ${rWater} Z`}
            fill="#38bdf8"
            fillOpacity="0.45"
            stroke="#38bdf8"
            strokeWidth="2"
            className="hover:fill-opacity-65 transition-all cursor-pointer"
          />

          {/* Quadrant 2: Protein (Score 8.8/10 -> Supernova Cyan) */}
          <path
            d={`M 0 0 L 0 ${rProtein} A ${rProtein} ${rProtein} 0 0 1 -${rProtein} 0 Z`}
            fill="#06b6d4"
            fillOpacity="0.45"
            filter="url(#glow-cyan-space)"
            stroke="#06b6d4"
            strokeWidth="2"
            className="hover:fill-opacity-65 transition-all cursor-pointer"
          />

          {/* Quadrant 3: Carbohydrates (Score 9.5/10 -> Over-Limit Plasma Red / Rose) */}
          <path
            d={`M 0 0 L -${rCarbs} 0 A ${rCarbs} ${rCarbs} 0 0 1 0 -${rCarbs} Z`}
            fill="#f43f5e"
            fillOpacity="0.65"
            filter="url(#glow-rose-space)"
            stroke="#f43f5e"
            strokeWidth="2.5"
            className="hover:fill-opacity-80 transition-all cursor-pointer"
          />

          {/* Quadrant 4: Fats / Lipids (Score 4.2/10 -> Pulsing Violet Below Threshold) */}
          <path
            d={`M 0 0 L 0 -${rFats} A ${rFats} ${rFats} 0 0 1 ${rFats} 0 Z`}
            fill="#a855f7"
            fillOpacity="0.5"
            stroke="#a855f7"
            strokeWidth="2"
            className="animate-pulse cursor-pointer hover:fill-opacity-70 transition-all"
          />

          {/* Center Bullseye Hub */}
          <circle cx="0" cy="0" r="14" fill="#090D18" stroke="#06b6d4" strokeWidth="1.5" />
          <circle cx="0" cy="0" r="4" fill="#06b6d4" />
        </svg>

        {/* Center Badge Floating */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-10 h-10 rounded-lg bg-surface/90 backdrop-blur-md border border-cyan-500/50 flex items-center justify-center font-mono font-bold text-xs text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.4)]">
            {aggregateScore}
          </div>
        </div>
      </div>

      {/* Score Legend / Quadrants Status */}
      <div className="space-y-1.5 pt-2 border-t border-border text-xs font-mono">
        {/* Water Score */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-background/70 border border-border">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-sky-400"></span>
            <span className="font-semibold text-zinc-100">Hydration Volume</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sky-400 text-sm">{hydrationScore}</span>
            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 font-semibold border border-sky-500/30">
              Optimal
            </span>
          </div>
        </div>

        {/* Protein Score */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-background/70 border border-cyan-500/30">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]"></span>
            <span className="font-semibold text-zinc-100">Protein Saturation</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-cyan-400 text-sm">{proteinScore}</span>
            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30">
              Anabolic
            </span>
          </div>
        </div>

        {/* Carbs Over-limit Score */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-rose-500/5 border border-rose-500/40">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"></span>
            <span className="font-semibold text-zinc-100">Carbohydrate Load</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-rose-400 text-sm">{carbScore}</span>
            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-rose-500 text-white font-bold tracking-wider animate-pulse">
              Over-Limit
            </span>
          </div>
        </div>

        {/* Lipids Low / Deficit Score */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-purple-500/5 border border-purple-500/40">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-purple-400 animate-pulse"></span>
            <span className="font-semibold text-zinc-100">Lipids &amp; Healthy Fats</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-purple-400 text-sm">{fatScore}</span>
            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold tracking-wider">
              Low // Deficit
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500 mt-2 pt-1 border-t border-border">
        <span>RADIAL RANGE: 1 - 10</span>
        <span className="text-cyan-400 uppercase font-bold tracking-wider">
          Aggregate Adherence: {adherencePct}%
        </span>
      </div>
    </div>
  );
}
