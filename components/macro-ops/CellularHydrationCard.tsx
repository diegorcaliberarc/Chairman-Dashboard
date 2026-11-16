"use client";

import React from "react";
import { Droplets, Plus } from "lucide-react";
import { DailySitrepLog } from "@/lib/commandTypes";

interface CellularHydrationCardProps {
  todayLog: DailySitrepLog | null;
  dailyLog?: any;
  onQuickAddWater: (deltaOz: number) => void;
}

export function CellularHydrationCard({
  todayLog,
  dailyLog,
  onQuickAddWater,
}: CellularHydrationCardProps) {
  // Database stores water_oz
  const waterOz = todayLog?.water_oz ?? 108.2;
  const targetOz = dailyLog?.water_target_oz ?? 128; // ~3.8 Liters

  const litersCurrent = (waterOz * 0.0295735).toFixed(1);
  const litersTarget = (targetOz * 0.0295735).toFixed(1);

  const pct = Math.min(100, Math.round((waterOz / targetOz) * 100));

  // 8 segmented cylinders
  const totalSegments = 8;
  const filledSegments = (pct / 100) * totalSegments;

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border flex flex-col shadow-xl">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Droplets size={18} className="text-cyan-400" />
          <span className="font-mono font-bold text-xs uppercase tracking-wider text-zinc-100">
            Hydration Matrix
          </span>
        </div>
        <span className="font-mono text-[10px] font-bold text-cyan-300 uppercase px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
          Electrolytes ++
        </span>
      </div>

      <div className="flex items-baseline justify-between mb-2">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl sm:text-4xl font-mono font-extrabold text-zinc-100 tracking-tight">
            {litersCurrent}
          </span>
          <span className="font-mono text-sm font-semibold text-cyan-400">
            / {litersTarget} L
          </span>
          <span className="font-mono text-xs text-zinc-400">
            ({Math.round(waterOz)} oz)
          </span>
        </div>
        <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
          {pct}% DONE
        </span>
      </div>

      {/* Segmented Hydration Cylinders (Waterllama style) */}
      <div className="grid grid-cols-8 gap-1.5 my-3">
        {Array.from({ length: totalSegments }, (_, i) => {
          const isFull = i + 1 <= filledSegments;
          const isPartial = !isFull && i < filledSegments;
          return (
            <div
              key={i}
              className={`h-9 rounded-md transition-all duration-300 ${
                isFull
                  ? "bg-cyan-400 shadow-sm shadow-cyan-400/50"
                  : isPartial
                  ? "bg-cyan-500/40 border border-cyan-500/50"
                  : "bg-zinc-800/80 border border-border"
              }`}
              title={`Segment ${i + 1}/${totalSegments}`}
            />
          );
        })}
      </div>

      {/* Quick Add Water Buttons */}
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => onQuickAddWater(8.45)} // 250 ml = ~8.45 oz
          type="button"
          className="flex-1 py-2 px-2 bg-background hover:bg-zinc-900 border border-border hover:border-cyan-500/40 rounded-xl font-mono text-xs font-bold text-cyan-400 uppercase flex items-center justify-center gap-1 active:scale-95 transition"
        >
          <Plus size={13} /> 250ml
        </button>
        <button
          onClick={() => onQuickAddWater(16.9)} // 500 ml = ~16.9 oz
          type="button"
          className="flex-1 py-2 px-2 bg-background hover:bg-zinc-900 border border-border hover:border-cyan-500/40 rounded-xl font-mono text-xs font-bold text-cyan-400 uppercase flex items-center justify-center gap-1 active:scale-95 transition"
        >
          <Plus size={13} /> 500ml Flask
        </button>
      </div>
    </div>
  );
}
