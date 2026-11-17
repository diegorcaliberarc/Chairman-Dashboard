"use client";

import React, { useMemo } from "react";
import { GitFork, Sparkles, Utensils } from "lucide-react";
import { FoodEntry } from "@/components/FoodFeedCard";

interface MetabolicFlowSankeyCardProps {
  entries?: FoodEntry[];
  totalCalories?: number;
  totals?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  onOpenAddMeal?: () => void;
}

export function MetabolicFlowSankeyCard({
  entries = [],
  totalCalories = 0,
  totals,
  onOpenAddMeal,
}: MetabolicFlowSankeyCardProps) {
  const calories = totals?.calories || totalCalories || 0;
  const protein = totals?.protein || 0;
  const carbs = totals?.carbs || 0;
  const fat = totals?.fat || 0;

  const hasData = entries.length > 0 || calories > 0;

  return (
    <div
      className="p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden flex flex-col group shadow-2xl"
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
          <GitFork className="w-4 h-4 text-cyan-500 dark:text-cyan-400 animate-pulse" />
          <span className="font-mono font-bold text-xs uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
            Metabolic &amp; Nutrient Flow Spectrum
          </span>
        </div>
        <div
          className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border transition-colors"
          style={{
            backgroundColor: "var(--glass-surface-elevated)",
            borderColor: "rgba(6, 182, 212, 0.4)",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]"></span>
          <span className="font-mono text-[10px] text-zinc-800 dark:text-zinc-100 uppercase font-bold tracking-wider">
            {hasData ? `Dynamic Stream // ${calories.toLocaleString()} kcal` : "Standby // Awaiting Input"}
          </span>
        </div>
      </div>

      {/* Step ribbon matching reference */}
      <div
        className="grid grid-cols-4 gap-1 py-1.5 px-2 rounded-lg border mb-2 text-[10px] font-mono font-bold uppercase text-center transition-colors"
        style={{
          backgroundColor: "var(--glass-surface-elevated)",
          borderColor: "var(--glass-border)",
        }}
      >
        <div className="text-sky-600 dark:text-sky-400 truncate flex items-center justify-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
          01. INTAKE SOURCE
        </div>
        <div className="text-cyan-600 dark:text-cyan-400 truncate flex items-center justify-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
          02. MACRO PARTITION
        </div>
        <div className="text-amber-600 dark:text-amber-400 truncate flex items-center justify-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          03. CIRCADIAN TIMING
        </div>
        <div className="text-purple-600 dark:text-purple-400 truncate flex items-center justify-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
          04. PHYSIO RESULT
        </div>
      </div>

      {/* SVG Visual Representation of Sankey */}
      <div
        className="relative w-full h-[280px] rounded-xl border p-1 overflow-hidden select-none flex items-center justify-center transition-colors"
        style={{
          backgroundColor: "var(--glass-surface-elevated)",
          borderColor: "var(--glass-border)",
        }}
      >
        {!hasData ? (
          /* Clean Zero-Data Standby State */
          <div className="text-center p-6 flex flex-col items-center justify-center gap-2.5 font-mono">
            <div
              className="w-12 h-12 rounded-full border flex items-center justify-center text-cyan-500 dark:text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-colors"
              style={{
                backgroundColor: "var(--glass-surface)",
                borderColor: "var(--glass-border)",
              }}
            >
              <Utensils size={20} />
            </div>
            <div>
              <div className="text-sm font-bold text-zinc-900 dark:text-zinc-200 uppercase tracking-wider">
                Metabolic Stream Ready
              </div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400 max-w-md mt-1">
                Zero fuel logged yet for this cycle. Input your meals in the ledger below to generate live nutrient partition ribbons and bio-energetic flux.
              </div>
            </div>
            {onOpenAddMeal && (
              <button
                onClick={onOpenAddMeal}
                className="mt-1 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-700 dark:text-cyan-300 font-bold text-xs uppercase tracking-wider transition active:scale-95"
              >
                + Log First Meal
              </button>
            )}
          </div>
        ) : (
          /* Dynamic Active Sankey Diagram */
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 720 280">
            <defs>
              <linearGradient id="flow-prot-stream" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.65" />
              </linearGradient>
              <linearGradient id="flow-carb-stream" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0.6" />
              </linearGradient>
              <linearGradient id="flow-fat-stream" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.6" />
              </linearGradient>
            </defs>

            {/* Level 1 -> Level 2 Streams */}
            <path
              d="M 120 70 C 180 70, 180 50, 240 50 L 240 85 C 180 85, 180 100, 120 100 Z"
              fill="url(#flow-prot-stream)"
            />
            <path
              d="M 120 120 C 180 120, 180 140, 240 140 L 240 175 C 180 175, 180 150, 120 150 Z"
              fill="url(#flow-carb-stream)"
            />
            <path
              d="M 120 180 C 180 180, 180 220, 240 220 L 240 250 C 180 250, 180 200, 120 200 Z"
              fill="url(#flow-fat-stream)"
            />

            {/* Level 2 -> Level 3 Streams */}
            <path
              d="M 330 50 C 390 50, 390 60, 450 60 L 450 95 C 390 95, 390 85, 330 85 Z"
              fill="url(#flow-prot-stream)"
            />
            <path
              d="M 330 140 C 390 140, 390 150, 450 150 L 450 185 C 390 185, 390 175, 330 175 Z"
              fill="url(#flow-carb-stream)"
            />
            <path
              d="M 330 220 C 390 220, 390 230, 450 230 L 450 260 C 390 260, 390 250, 330 250 Z"
              fill="url(#flow-fat-stream)"
            />

            {/* Level 3 -> Level 4 Streams */}
            <path
              d="M 540 60 C 600 60, 600 70, 660 70 L 660 105 C 600 105, 600 95, 540 95 Z"
              fill="url(#flow-prot-stream)"
            />
            <path
              d="M 540 150 C 600 150, 600 160, 660 160 L 660 195 C 600 195, 600 185, 540 185 Z"
              fill="url(#flow-carb-stream)"
            />
            <path
              d="M 540 230 C 600 230, 600 240, 660 240 L 660 270 C 600 270, 600 260, 540 260 Z"
              fill="url(#flow-fat-stream)"
            />

            {/* Level 1 Nodes: Intake */}
            <g className="font-mono text-[9px] font-bold">
              <rect x="20" y="60" width="100" height="42" rx="6" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.2" />
              <text x="30" y="78" fill="#38bdf8">PROTEIN IN</text>
              <text x="30" y="93" fill="#e2e8f0">{protein}g</text>

              <rect x="20" y="115" width="100" height="42" rx="6" fill="#0f172a" stroke="#f43f5e" strokeWidth="1.2" />
              <text x="30" y="133" fill="#f43f5e">CARBS IN</text>
              <text x="30" y="148" fill="#e2e8f0">{carbs}g</text>

              <rect x="20" y="170" width="100" height="42" rx="6" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.2" />
              <text x="30" y="188" fill="#f59e0b">FATS IN</text>
              <text x="30" y="203" fill="#e2e8f0">{fat}g</text>
            </g>

            {/* Level 2 Nodes: Partition */}
            <g className="font-mono text-[9px] font-bold">
              <rect x="240" y="45" width="90" height="45" rx="6" fill="#0f172a" stroke="#06b6d4" strokeWidth="1.2" />
              <text x="250" y="63" fill="#06b6d4">ANABOLIC</text>
              <text x="250" y="78" fill="#e2e8f0">PROTEIN</text>

              <rect x="240" y="135" width="90" height="45" rx="6" fill="#0f172a" stroke="#a855f7" strokeWidth="1.2" />
              <text x="250" y="153" fill="#a855f7">GLYCOGEN</text>
              <text x="250" y="168" fill="#e2e8f0">RELOAD</text>

              <rect x="240" y="215" width="90" height="42" rx="6" fill="#0f172a" stroke="#10b981" strokeWidth="1.2" />
              <text x="250" y="233" fill="#10b981">CELLULAR</text>
              <text x="250" y="248" fill="#e2e8f0">LIPIDS</text>
            </g>

            {/* Level 3 Nodes: Circadian Timing */}
            <g className="font-mono text-[9px] font-bold">
              <rect x="450" y="55" width="90" height="45" rx="6" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.2" />
              <text x="460" y="73" fill="#f59e0b">NUTRIENT</text>
              <text x="460" y="88" fill="#e2e8f0">PEAK</text>

              <rect x="450" y="145" width="90" height="45" rx="6" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.2" />
              <text x="460" y="163" fill="#f59e0b">ENERGY</text>
              <text x="460" y="178" fill="#e2e8f0">BURN</text>

              <rect x="450" y="225" width="90" height="42" rx="6" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.2" />
              <text x="460" y="243" fill="#f59e0b">RECOVERY</text>
              <text x="460" y="258" fill="#e2e8f0">SYNC</text>
            </g>

            {/* Level 4 Nodes: Physio Result */}
            <g className="font-mono text-[9px] font-bold">
              <rect x="650" y="65" width="60" height="45" rx="6" fill="#0f172a" stroke="#a855f7" strokeWidth="1.2" />
              <text x="656" y="83" fill="#a855f7">LEAN</text>
              <text x="656" y="98" fill="#e2e8f0">MASS</text>

              <rect x="650" y="155" width="60" height="45" rx="6" fill="#0f172a" stroke="#a855f7" strokeWidth="1.2" />
              <text x="656" y="173" fill="#a855f7">DEFICIT</text>
              <text x="656" y="188" fill="#e2e8f0">HOLD</text>

              <rect x="650" y="235" width="60" height="42" rx="6" fill="#0f172a" stroke="#a855f7" strokeWidth="1.2" />
              <text x="656" y="253" fill="#a855f7">Z4</text>
              <text x="656" y="268" fill="#e2e8f0">RESTORE</text>
            </g>
          </svg>
        )}
      </div>
    </div>
  );
}
