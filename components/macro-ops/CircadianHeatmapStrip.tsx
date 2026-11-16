"use client";

import React from "react";
import { CalendarRange, Sparkles } from "lucide-react";
import { DailySitrepLog } from "@/lib/commandTypes";
import { FoodEntry } from "@/components/FoodFeedCard";

interface CircadianHeatmapStripProps {
  todayLog?: DailySitrepLog | null;
  entries?: FoodEntry[];
}

export function CircadianHeatmapStrip({ todayLog, entries }: CircadianHeatmapStripProps) {
  // 12 2-hour synchronous intervals
  const intervals = [
    "12a", "2a", "4a", "6a", "8a", "10a",
    "12p", "2p", "4p", "6p", "8p", "10p"
  ];

  // Pre-calculated orbital density matrices
  const stepDensity = [0, 0, 0, 2, 6, 8, 3, 4, 11, 7, 2, 0];
  const proteinDensity = [0, 0, 0, 0, 0, 0, 10, 1, 12, 2, 8, 0];
  const carbDensity = [0, 0, 0, 0, 0, 0, 7, 0, 14, 4, 2, 0];
  const fiberDensity = [0, 0, 0, 0, 0, 0, 8, 0, 3, 0, 9, 0];
  const hydrationDensity = [0, 0, 0, 3, 6, 5, 8, 9, 10, 6, 4, 1];

  const getCellClass = (value: number, type: "cyan" | "sky" | "rose" | "purple") => {
    if (value === 0) {
      return "bg-surface/40 text-zinc-600 border border-transparent";
    }

    if (type === "cyan") {
      if (value >= 10) return "bg-cyan-400 border border-white text-zinc-950 font-bold shadow-[0_0_12px_rgba(6,182,212,0.6)]";
      if (value >= 7) return "bg-cyan-500/70 border border-cyan-400 text-zinc-950 font-bold shadow-[0_0_8px_rgba(6,182,212,0.4)]";
      if (value >= 4) return "bg-cyan-500/40 border border-cyan-500/50 text-cyan-300 font-bold";
      return "bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-semibold";
    }

    if (type === "sky") {
      if (value >= 10) return "bg-sky-400 border border-white text-zinc-950 font-bold shadow-[0_0_12px_rgba(56,189,248,0.6)]";
      if (value >= 7) return "bg-sky-500/70 border border-sky-400 text-zinc-950 font-bold shadow-[0_0_8px_rgba(56,189,248,0.4)]";
      if (value >= 4) return "bg-sky-500/40 border border-sky-500/50 text-sky-300 font-bold";
      return "bg-sky-500/20 border border-sky-500/30 text-sky-400 font-semibold";
    }

    if (type === "rose") {
      if (value >= 10) return "bg-rose-500 border border-white text-white font-bold shadow-[0_0_12px_rgba(244,63,94,0.7)]";
      if (value >= 7) return "bg-rose-500/70 border border-rose-400 text-white font-bold shadow-[0_0_8px_rgba(244,63,94,0.4)]";
      if (value >= 4) return "bg-rose-500/40 border border-rose-500/50 text-rose-300 font-bold";
      return "bg-rose-500/20 border border-rose-500/30 text-rose-400 font-semibold";
    }

    // purple
    if (value >= 8) return "bg-purple-400 border border-white text-zinc-950 font-bold shadow-[0_0_12px_rgba(168,85,247,0.5)]";
    if (value >= 5) return "bg-purple-500/60 border border-purple-400 text-zinc-950 font-bold";
    if (value >= 3) return "bg-purple-500/40 border border-purple-500/50 text-purple-300 font-bold";
    return "bg-purple-500/20 border border-purple-500/30 text-purple-400 font-semibold";
  };

  return (
    <section className="w-full p-4 rounded-2xl bg-surface/80 border border-border backdrop-blur-xl relative overflow-hidden group shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          <CalendarRange className="w-4 h-4 text-cyan-400" />
          <span className="font-mono font-bold text-xs uppercase tracking-widest text-zinc-100">
            Circadian Kinetic & Ingestion Heatmap Spectrum
          </span>
          <span className="font-mono text-zinc-500 text-xs hidden md:inline">
            // 24h Synchronous Density Matrix
          </span>
        </div>

        {/* Gradient Scale Legend */}
        <div className="flex items-center gap-2 bg-background/80 px-3 py-1 rounded-lg border border-border">
          <span className="font-mono text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
            Intensity:
          </span>
          <span className="font-mono text-[9px] text-zinc-500">0</span>
          <div className="w-24 h-2 rounded-full overflow-hidden bg-gradient-to-r from-zinc-800 via-sky-500 via-purple-500 to-cyan-400"></div>
          <span className="font-mono text-[9px] text-cyan-400 font-bold">10+</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="min-w-[760px] flex flex-col gap-1.5 select-none font-mono">
          {/* Column Header Time Labels */}
          <div className="grid grid-cols-[140px_repeat(12,1fr)] items-center text-center text-[10px] font-semibold text-zinc-400 pb-1 border-b border-border/60">
            <div className="text-left text-[9px] uppercase tracking-wider pl-1 font-mono text-zinc-500">
              Vector Track
            </div>
            {intervals.map((intv) => (
              <div key={intv}>{intv}</div>
            ))}
          </div>

          {/* Row 1: Kinetic Steps Density */}
          <div className="grid grid-cols-[140px_repeat(12,1fr)] items-center gap-1.5">
            <div className="flex items-center gap-1.5 text-xs text-zinc-200 pl-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]"></span>
              <span className="font-bold text-[11px] truncate uppercase tracking-wider">Kinetic Steps</span>
            </div>
            {stepDensity.map((val, idx) => (
              <div
                key={`step-${idx}`}
                className={`h-6 rounded-md flex items-center justify-center text-[10px] transition-all ${getCellClass(val, "cyan")}`}
              >
                {val}
              </div>
            ))}
          </div>

          {/* Row 2: Protein Pacing */}
          <div className="grid grid-cols-[140px_repeat(12,1fr)] items-center gap-1.5">
            <div className="flex items-center gap-1.5 text-xs text-zinc-200 pl-1">
              <span className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.8)]"></span>
              <span className="font-bold text-[11px] truncate uppercase tracking-wider">Protein Pacing</span>
            </div>
            {proteinDensity.map((val, idx) => (
              <div
                key={`protein-${idx}`}
                className={`h-6 rounded-md flex items-center justify-center text-[10px] transition-all ${getCellClass(val, "sky")}`}
              >
                {val}
              </div>
            ))}
          </div>

          {/* Row 3: Carbohydrates */}
          <div className="grid grid-cols-[140px_repeat(12,1fr)] items-center gap-1.5">
            <div className="flex items-center gap-1.5 text-xs text-zinc-200 pl-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]"></span>
              <span className="font-bold text-[11px] truncate uppercase tracking-wider">Carbohydrates</span>
            </div>
            {carbDensity.map((val, idx) => (
              <div
                key={`carb-${idx}`}
                className={`h-6 rounded-md flex items-center justify-center text-[10px] transition-all ${getCellClass(val, "rose")}`}
              >
                {val}
              </div>
            ))}
          </div>

          {/* Row 4: Whole Foods & Fiber */}
          <div className="grid grid-cols-[140px_repeat(12,1fr)] items-center gap-1.5">
            <div className="flex items-center gap-1.5 text-xs text-zinc-200 pl-1">
              <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_6px_rgba(168,85,247,0.8)]"></span>
              <span className="font-bold text-[11px] truncate uppercase tracking-wider">Whole Foods / Fiber</span>
            </div>
            {fiberDensity.map((val, idx) => (
              <div
                key={`fiber-${idx}`}
                className={`h-6 rounded-md flex items-center justify-center text-[10px] transition-all ${getCellClass(val, "purple")}`}
              >
                {val}
              </div>
            ))}
          </div>

          {/* Row 5: Hydration Flux */}
          <div className="grid grid-cols-[140px_repeat(12,1fr)] items-center gap-1.5">
            <div className="flex items-center gap-1.5 text-xs text-zinc-200 pl-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]"></span>
              <span className="font-bold text-[11px] truncate uppercase tracking-wider">Hydration Flux</span>
            </div>
            {hydrationDensity.map((val, idx) => (
              <div
                key={`hydration-${idx}`}
                className={`h-6 rounded-md flex items-center justify-center text-[10px] transition-all ${getCellClass(val, "cyan")}`}
              >
                {val}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
