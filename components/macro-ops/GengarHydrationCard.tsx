"use client";

import React, { useState } from "react";
import { Droplet, Plus, Sparkles } from "lucide-react";
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
  const [customOz, setCustomOz] = useState("");

  // Target in Liters: 3.8L (~128.5 oz)
  const targetLiters = 3.8;
  const targetOz = 128.5;

  // Convert current water_oz to Liters (0.0 if not logged)
  const currentOz = todayLog?.water_oz || 0;
  const currentLiters = currentOz > 0 ? +(currentOz / 33.814).toFixed(1) : 0.0;
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

  const handleCustomAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(customOz);
    if (!val || isNaN(val) || !onQuickAddWater) return;
    setIsUpdating(true);
    try {
      await onQuickAddWater(val);
      setCustomOz("");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      className="p-4 rounded-2xl border transition-all duration-300 flex flex-col shadow-2xl"
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
          <Droplet className="w-4 h-4 text-sky-500 dark:text-sky-400" />
          <span className="font-mono font-bold text-xs uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
            Cellular Hydration Matrix
          </span>
        </div>
        <span className="font-mono text-[10px] text-sky-600 dark:text-sky-400 font-bold uppercase px-2 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/30">
          Target 3.8L
        </span>
      </div>

      <div
        className="flex items-center gap-3 my-2 p-2.5 rounded-xl border transition-colors"
        style={{
          backgroundColor: "var(--glass-surface-elevated)",
          borderColor: "var(--glass-border)",
        }}
      >
        {/* Gengar Avatar Container */}
        <div
          className="relative flex-shrink-0 w-24 h-24 rounded-xl border flex items-center justify-center overflow-hidden shadow-[0_0_16px_rgba(56,189,248,0.25)]"
          style={{
            backgroundColor: "var(--glass-bg-base)",
            borderColor: "rgba(56, 189, 248, 0.4)",
          }}
        >
          <img
            alt="Gengar Hydration Mascot"
            className="w-full h-full object-contain p-1 relative z-10 transition-transform hover:scale-105"
            src="https://lh3.googleusercontent.com/aida/ALJJyrAlNjd9-1iSx6MsZb8jyXPUFqR6AwuPVk4yI6xlIZitoqC4oqGHEO934gZ7B6ZFYtkMgk8OqW5O1g5oyNnpr6zewRHjvr97Q0-yTyNIZT0qVpbwIHJuRq-psHjEouFwNWJfGOmZUAJKan0xe-HXbF7ttx2AmDOC7FMDyhfKPHWN8gjdka_o5culWNMNpbUeKy1WpoCI3Gr7RUiir0Ma24JCg9v4i_W4OAOsT_bGfP0h"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <div
            className="absolute bottom-1 right-1 z-20 px-1 py-0.5 rounded border font-mono text-[9px] text-sky-600 dark:text-sky-400 font-bold leading-none"
            style={{
              backgroundColor: "var(--glass-surface-elevated)",
              borderColor: "rgba(56, 189, 248, 0.4)",
            }}
          >
            {progressPct}%
          </div>
        </div>

        {/* Volume & Progress Info */}
        <div className="flex-1 flex flex-col justify-center gap-1 font-mono">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="font-bold text-2xl text-zinc-900 dark:text-zinc-100 tracking-tight">{currentLiters}</span>
              <span className="text-base font-bold text-sky-600 dark:text-sky-400">/ {targetLiters} L</span>
            </div>
            <div className="text-[9px] text-zinc-500 dark:text-zinc-400 uppercase font-semibold">
              {currentLiters === 0
                ? "NO HYDRATION LOGGED TODAY"
                : remainingMl > 0
                ? `${remainingMl} ML TO DAILY OPTIMAL`
                : "DAILY TARGET REACHED"}
            </div>
          </div>

          <div className="w-full h-2 rounded-full bg-black/10 dark:bg-white/10 mt-1 overflow-hidden border border-black/5 dark:border-white/10">
            <div
              className="h-full rounded-full bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.7)] transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between text-[9px] text-zinc-500 dark:text-zinc-400 mt-0.5">
            <span className="text-sky-600 dark:text-sky-400 font-bold">{progressPct}% OF GOAL</span>
            <span className="text-zinc-500">
              {currentOz > 0 ? `${currentOz.toFixed(0)} oz recorded` : "Awaiting input"}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-3 gap-2 mt-1 font-mono">
        <button
          onClick={() => handleAddMl(250)}
          disabled={isUpdating}
          className="flex items-center justify-center gap-1 py-2 px-1.5 rounded-xl border text-[10px] font-bold uppercase transition active:scale-95 disabled:opacity-50 text-sky-700 dark:text-sky-300 hover:bg-sky-500/10"
          style={{
            backgroundColor: "var(--glass-surface-elevated)",
            borderColor: "rgba(56, 189, 248, 0.3)",
          }}
        >
          <Plus size={11} />
          <span>+250ml</span>
        </button>

        <button
          onClick={() => handleAddMl(500)}
          disabled={isUpdating}
          className="flex items-center justify-center gap-1 py-2 px-1.5 rounded-xl border text-[10px] font-bold uppercase transition active:scale-95 disabled:opacity-50 text-sky-700 dark:text-sky-300 hover:bg-sky-500/10"
          style={{
            backgroundColor: "var(--glass-surface-elevated)",
            borderColor: "rgba(56, 189, 248, 0.3)",
          }}
        >
          <Plus size={11} />
          <span>+500ml</span>
        </button>

        <button
          onClick={() => handleAddMl(1000)}
          disabled={isUpdating}
          className="flex items-center justify-center gap-1 py-2 px-1.5 rounded-xl border text-[10px] font-bold uppercase transition active:scale-95 disabled:opacity-50 text-sky-700 dark:text-sky-300 hover:bg-sky-500/10"
          style={{
            backgroundColor: "var(--glass-surface-elevated)",
            borderColor: "rgba(56, 189, 248, 0.3)",
          }}
        >
          <Plus size={11} />
          <span>+1000ml</span>
        </button>
      </div>

      {/* Inline Custom Water Input */}
      <form onSubmit={handleCustomAdd} className="flex items-center gap-1.5 mt-2 font-mono">
        <input
          type="number"
          step="any"
          placeholder="Log Custom oz..."
          value={customOz}
          onChange={(e) => setCustomOz(e.target.value)}
          className="flex-1 border rounded-lg px-2.5 py-1 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-sky-400 transition"
          style={{
            backgroundColor: "var(--glass-surface-elevated)",
            borderColor: "var(--glass-border)",
          }}
        />
        <button
          type="submit"
          disabled={!customOz || isUpdating}
          className="px-3 py-1 bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold text-xs rounded-lg transition active:scale-95 disabled:opacity-40"
        >
          Add
        </button>
      </form>
    </div>
  );
}
