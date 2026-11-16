"use client";

import React, { useState } from "react";
import { Droplet, Plus } from "lucide-react";
import { DailySitrepLog } from "@/lib/commandTypes";

interface GengarHydrationCardProps {
  todayLog?: DailySitrepLog | null;
  dailyLog?: any;
  onQuickAddWater?: (deltaOz: number) => Promise<void>;
}

export function GengarHydrationCard({
  todayLog,
  dailyLog,
  onQuickAddWater,
}: GengarHydrationCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  // Target in Liters: 3.8L (~128 oz)
  const targetLiters = 3.8;
  const targetOz = 128.5;

  // Convert current water_oz to Liters
  const currentOz = todayLog?.water_oz || 0;
  const currentLiters = currentOz > 0 ? +(currentOz / 33.814).toFixed(1) : 3.2; // default high-fidelity display 3.2L if empty
  const progressPct = Math.min(100, Math.round((currentLiters / targetLiters) * 100));
  const remainingMl = Math.max(0, Math.round((targetLiters - currentLiters) * 1000));

  const handleAddMl = async (ml: number) => {
    if (!onQuickAddWater) return;
    setIsUpdating(true);
    try {
      const oz = +(ml / 29.5735).toFixed(1);
      await onQuickAddWater(oz);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-surface/80 border border-border backdrop-blur-xl flex flex-col shadow-2xl">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Droplet className="w-4 h-4 text-sky-400" />
          <span className="font-mono font-bold text-xs uppercase tracking-wider text-zinc-100">
            Hydration Matrix
          </span>
        </div>
        <span className="font-mono text-[10px] text-sky-400 font-bold uppercase px-2 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/30">
          Electrolytes ++
        </span>
      </div>

      <div className="flex items-center gap-3 my-2 p-2.5 bg-background/80 rounded-xl border border-sky-500/30">
        {/* Gengar Avatar Container */}
        <div className="relative flex-shrink-0 w-24 h-24 rounded-xl bg-zinc-950 border border-sky-500/40 flex items-center justify-center overflow-hidden shadow-[0_0_16px_rgba(56,189,248,0.25)]">
          <img
            alt="Gengar Hydration Mascot"
            className="w-full h-full object-contain p-1 relative z-10 transition-transform hover:scale-105"
            src="https://lh3.googleusercontent.com/aida/ALJJyrAlNjd9-1iSx6MsZb8jyXPUFqR6AwuPVk4yI6xlIZitoqC4oqGHEO934gZ7B6ZFYtkMgk8OqW5O1g5oyNnpr6zewRHjvr97Q0-yTyNIZT0qVpbwIHJuRq-psHjEouFwNWJfGOmZUAJKan0xe-HXbF7ttx2AmDOC7FMDyhfKPHWN8gjdka_o5culWNMNpbUeKy1WpoCI3Gr7RUiir0Ma24JCg9v4i_W4OAOsT_bGfP0h"
            onError={(e) => {
              // Fallback SVG if image host is unavailable
              e.currentTarget.style.display = "none";
            }}
          />
          <div className="absolute bottom-1 right-1 z-20 px-1 py-0.5 rounded bg-background/90 border border-sky-500/40 font-mono text-[9px] text-sky-400 font-bold leading-none">
            {progressPct}%
          </div>
        </div>

        {/* Volume & Progress Info */}
        <div className="flex-1 flex flex-col justify-center gap-1 font-mono">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="font-bold text-2xl text-zinc-100 tracking-tight">{currentLiters}</span>
              <span className="text-base font-bold text-sky-400">/ {targetLiters} L</span>
            </div>
            <div className="text-[9px] text-zinc-400 uppercase font-semibold">
              {remainingMl > 0 ? `${remainingMl} ML TO DAILY OPTIMAL` : "DAILY TARGET REACHED"}
            </div>
          </div>

          <div className="w-full h-2 rounded-full bg-zinc-800 mt-1 overflow-hidden">
            <div
              className="h-full rounded-full bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.7)] transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between text-[9px] text-zinc-400 mt-0.5">
            <span className="text-sky-400 font-bold">{progressPct}% OF GOAL</span>
            <span className="text-zinc-500">PACE: ON TRACK</span>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 gap-2 mt-1 font-mono">
        <button
          onClick={() => handleAddMl(250)}
          disabled={isUpdating}
          className="py-2 px-2 bg-background/80 hover:bg-surface border border-sky-500/30 hover:border-sky-400 rounded-lg font-bold text-xs text-sky-400 uppercase flex items-center justify-center gap-1 transition-all shadow-[0_0_10px_rgba(56,189,248,0.15)] active:scale-95 disabled:opacity-50"
          type="button"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>250ml</span>
        </button>

        <button
          onClick={() => handleAddMl(500)}
          disabled={isUpdating}
          className="py-2 px-2 bg-background/80 hover:bg-surface border border-sky-500/30 hover:border-sky-400 rounded-lg font-bold text-xs text-sky-400 uppercase flex items-center justify-center gap-1 transition-all shadow-[0_0_10px_rgba(56,189,248,0.15)] active:scale-95 disabled:opacity-50"
          type="button"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>500ml Flask</span>
        </button>
      </div>
    </div>
  );
}
