"use client";

import React, { useState } from "react";
import { Dumbbell, Bike, Flame, Check, CheckCircle2, Circle } from "lucide-react";
import { DailySitrepLog } from "@/lib/commandTypes";

interface ActiveStrainOutputCardProps {
  todayLog: DailySitrepLog | null;
  onToggleWorkout?: (field: "lift_completed" | "cardio_completed", value: boolean) => Promise<void>;
}

export function ActiveStrainOutputCard({
  todayLog,
  onToggleWorkout,
}: ActiveStrainOutputCardProps) {
  const liftCompleted = todayLog?.lift_completed ?? true;
  const cardioCompleted = todayLog?.cardio_completed ?? true;
  const kcalBurned = todayLog?.kcal_burned ?? 1080;

  // Approximate strain score based on activities
  const strainScore = (8.0 + (liftCompleted ? 4.8 : 0) + (cardioCompleted ? 3.6 : 0)).toFixed(1);

  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async (field: "lift_completed" | "cardio_completed", currentVal: boolean) => {
    if (!onToggleWorkout) return;
    setIsUpdating(true);
    try {
      await onToggleWorkout(field, !currentVal);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border flex flex-col shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Dumbbell size={18} className="text-emerald-400" />
          <span className="font-mono font-bold text-xs uppercase tracking-wider text-zinc-100">
            Active Strain & Output
          </span>
        </div>
        <span className="font-mono text-[10px] font-bold text-emerald-300 uppercase px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
          Strain: {strainScore}
        </span>
      </div>

      <div className="space-y-2.5">
        {/* Activity 1: Cardio / HIIT */}
        <div
          onClick={() => handleToggle("cardio_completed", cardioCompleted)}
          className={`p-3 rounded-xl border flex items-center justify-between transition cursor-pointer ${
            cardioCompleted
              ? "bg-background border-border hover:border-emerald-500/40"
              : "bg-surface/50 border-dashed border-zinc-700 opacity-60"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-zinc-900 border border-border flex items-center justify-center text-emerald-400 shrink-0">
              <Bike size={16} />
            </div>
            <div>
              <div className="font-mono text-xs sm:text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                <span>Peloton HIIT & Hills</span>
                {cardioCompleted && <Check size={12} className="text-emerald-400" />}
              </div>
              <div className="font-mono text-[10px] text-zinc-400">
                45 min · Zone 4 Max Effort
              </div>
            </div>
          </div>
          <div className="text-right pl-2">
            <div className="font-mono text-xs sm:text-sm font-extrabold text-emerald-400">
              -480 <span className="text-[10px] font-normal text-zinc-400">kcal</span>
            </div>
            <span className="font-mono text-[9px] text-zinc-400 uppercase">
              Avg HR: 158 bpm
            </span>
          </div>
        </div>

        {/* Activity 2: Resistance / Hypertrophy */}
        <div
          onClick={() => handleToggle("lift_completed", liftCompleted)}
          className={`p-3 rounded-xl border flex items-center justify-between transition cursor-pointer ${
            liftCompleted
              ? "bg-background border-border hover:border-cyan-500/40"
              : "bg-surface/50 border-dashed border-zinc-700 opacity-60"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-zinc-900 border border-border flex items-center justify-center text-cyan-400 shrink-0">
              <Dumbbell size={16} />
            </div>
            <div>
              <div className="font-mono text-xs sm:text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                <span>Tonal Hypertrophy: Upper Push</span>
                {liftCompleted && <Check size={12} className="text-cyan-400" />}
              </div>
              <div className="font-mono text-[10px] text-zinc-400">
                52 min · 14,200 kg Total Volume
              </div>
            </div>
          </div>
          <div className="text-right pl-2">
            <div className="font-mono text-xs sm:text-sm font-extrabold text-cyan-400">
              -340 <span className="text-[10px] font-normal text-zinc-400">kcal</span>
            </div>
            <span className="font-mono text-[9px] text-zinc-400 uppercase">
              Peak Power 480W
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
