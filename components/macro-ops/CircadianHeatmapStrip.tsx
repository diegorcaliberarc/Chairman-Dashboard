"use client";

import React, { useMemo } from "react";
import { CalendarRange } from "lucide-react";
import { DailySitrepLog } from "@/lib/commandTypes";
import { FoodEntry } from "@/components/FoodFeedCard";

interface CircadianHeatmapStripProps {
  todayLog?: DailySitrepLog | null;
  entries?: FoodEntry[];
}

export function CircadianHeatmapStrip({ todayLog, entries = [] }: CircadianHeatmapStripProps) {
  // 12 2-hour synchronous intervals: 00:00 to 22:00
  const intervals = [
    "12a", "2a", "4a", "6a", "8a", "10a",
    "12p", "2p", "4p", "6p", "8p", "10p"
  ];

  // Dynamically compute vector densities from real database records (0 if no data)
  const { stepDensity, proteinDensity, carbDensity, fiberDensity, hydrationDensity } = useMemo(() => {
    const steps = new Array(12).fill(0);
    const protein = new Array(12).fill(0);
    const carbs = new Array(12).fill(0);
    const fiber = new Array(12).fill(0);
    const hydration = new Array(12).fill(0);

    // Map food entries into intervals based on meal window or timestamp
    entries.forEach((e) => {
      const windowName = (e.meal_window || "").toLowerCase();
      let slot = 6; // default 12p
      if (windowName.includes("breakfast")) slot = 4; // 8a
      else if (windowName.includes("morning")) slot = 3; // 6a
      else if (windowName.includes("lunch")) slot = 6; // 12p
      else if (windowName.includes("pre") || windowName.includes("snack")) slot = 8; // 4p
      else if (windowName.includes("dinner")) slot = 9; // 6p
      else if (windowName.includes("post") || windowName.includes("night")) slot = 10; // 8p

      const pG = Number(e.protein_g) || 0;
      const cG = Number(e.carbs_g) || 0;

      // Scale 0-15 intensity based on grams
      protein[slot] = Math.min(15, protein[slot] + Math.round(pG / 4));
      carbs[slot] = Math.min(15, carbs[slot] + Math.round(cG / 5));
      fiber[slot] = Math.min(15, fiber[slot] + Math.max(1, Math.round(cG / 15)));
    });

    // Map total steps from todayLog across daytime active hours if logged
    const totalSteps = todayLog?.total_steps || 0;
    if (totalSteps > 0) {
      // Distribute steps across active daytime slots (6a to 8p: slots 3, 4, 5, 6, 7, 8, 9, 10)
      const activeSlots = [3, 4, 5, 6, 7, 8, 9, 10];
      const intensity = Math.min(14, Math.max(1, Math.round((totalSteps / 12000) * 10)));
      activeSlots.forEach((s) => {
        steps[s] = intensity;
      });
    }

    // Map water from todayLog
    const waterOz = todayLog?.water_oz || 0;
    if (waterOz > 0) {
      const waterSlots = [3, 4, 5, 6, 7, 8, 9, 10];
      const intensity = Math.min(14, Math.max(1, Math.round((waterOz / 128) * 10)));
      waterSlots.forEach((s) => {
        hydration[s] = intensity;
      });
    }

    return {
      stepDensity: steps,
      proteinDensity: protein,
      carbDensity: carbs,
      fiberDensity: fiber,
      hydrationDensity: hydration,
    };
  }, [entries, todayLog]);

  const getCellClass = (value: number, type: "cyan" | "sky" | "rose" | "purple") => {
    if (value === 0) {
      return "bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-transparent";
    }

    if (type === "cyan") {
      if (value >= 10) return "bg-cyan-400 border border-white text-zinc-950 font-bold shadow-[0_0_12px_rgba(6,182,212,0.6)]";
      if (value >= 7) return "bg-cyan-500/70 border border-cyan-400 text-zinc-950 font-bold shadow-[0_0_8px_rgba(6,182,212,0.4)]";
      if (value >= 4) return "bg-cyan-500/40 border border-cyan-500/50 text-cyan-800 dark:text-cyan-300 font-bold";
      return "bg-cyan-500/20 border border-cyan-500/30 text-cyan-700 dark:text-cyan-400 font-semibold";
    }

    if (type === "sky") {
      if (value >= 10) return "bg-sky-400 border border-white text-zinc-950 font-bold shadow-[0_0_12px_rgba(56,189,248,0.6)]";
      if (value >= 7) return "bg-sky-500/70 border border-sky-400 text-zinc-950 font-bold shadow-[0_0_8px_rgba(56,189,248,0.4)]";
      if (value >= 4) return "bg-sky-500/40 border border-sky-500/50 text-sky-800 dark:text-sky-300 font-bold";
      return "bg-sky-500/20 border border-sky-500/30 text-sky-700 dark:text-sky-400 font-semibold";
    }

    if (type === "rose") {
      if (value >= 10) return "bg-rose-500 border border-white text-white font-bold shadow-[0_0_12px_rgba(244,63,94,0.7)]";
      if (value >= 7) return "bg-rose-500/70 border border-rose-400 text-white font-bold shadow-[0_0_8px_rgba(244,63,94,0.4)]";
      if (value >= 4) return "bg-rose-500/40 border border-rose-500/50 text-rose-800 dark:text-rose-300 font-bold";
      return "bg-rose-500/20 border border-rose-500/30 text-rose-700 dark:text-rose-400 font-semibold";
    }

    // purple
    if (value >= 8) return "bg-purple-400 border border-white text-zinc-950 font-bold shadow-[0_0_12px_rgba(168,85,247,0.5)]";
    if (value >= 5) return "bg-purple-500/60 border border-purple-400 text-zinc-950 font-bold";
    if (value >= 3) return "bg-purple-500/40 border border-purple-500/50 text-purple-800 dark:text-purple-300 font-bold";
    return "bg-purple-500/20 border border-purple-500/30 text-purple-700 dark:text-purple-400 font-semibold";
  };

  return (
    <section
      className="w-full p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden group shadow-xl"
      style={{
        backgroundColor: "var(--glass-surface)",
        backdropFilter: "blur(var(--glass-blur, 26px)) saturate(185%)",
        WebkitBackdropFilter: "blur(var(--glass-blur, 26px)) saturate(185%)",
        borderColor: "var(--glass-border)",
        boxShadow: "inset 0 1px 0 0 var(--glass-specular), var(--glass-shadow)",
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2.5 border-b" style={{ borderColor: "var(--glass-border)" }}>
        <div className="flex items-center gap-2">
          <CalendarRange className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
          <span className="font-mono font-bold text-xs uppercase tracking-widest text-zinc-900 dark:text-zinc-100">
            Circadian Kinetic &amp; Ingestion Heatmap Spectrum
          </span>
          <span className="font-mono text-zinc-500 dark:text-zinc-400 text-xs hidden md:inline">
            {"// 24h Synchronous Density Matrix"}
          </span>
        </div>

        {/* Gradient Scale Legend */}
        <div
          className="flex items-center gap-2 px-3 py-1 rounded-lg border transition-colors"
          style={{
            backgroundColor: "var(--glass-surface-elevated)",
            borderColor: "var(--glass-border)",
          }}
        >
          <span className="font-mono text-[10px] text-zinc-600 dark:text-zinc-400 font-semibold uppercase tracking-wider">
            Intensity:
          </span>
          <span className="font-mono text-[9px] text-zinc-500">0</span>
          <div className="w-24 h-2 rounded-full overflow-hidden bg-gradient-to-r from-zinc-400 dark:from-zinc-800 via-sky-500 via-purple-500 to-cyan-400"></div>
          <span className="font-mono text-[9px] text-cyan-600 dark:text-cyan-400 font-bold">10+</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="min-w-[760px] flex flex-col gap-1.5 select-none font-mono">
          {/* Column Header Time Labels */}
          <div
            className="grid grid-cols-[140px_repeat(12,1fr)] items-center text-center text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 pb-1 border-b"
            style={{ borderColor: "var(--glass-border)" }}
          >
            <div className="text-left text-[9px] uppercase tracking-wider pl-1 font-mono text-zinc-500">
              Vector Track
            </div>
            {intervals.map((intv) => (
              <div key={intv}>{intv}</div>
            ))}
          </div>

          {/* Row 1: Kinetic Steps Density */}
          <div className="grid grid-cols-[140px_repeat(12,1fr)] items-center gap-1.5">
            <div className="flex items-center gap-1.5 text-xs text-zinc-800 dark:text-zinc-200 pl-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]"></span>
              <span className="font-bold text-[11px] truncate uppercase tracking-wider">Kinetic Steps</span>
            </div>
            {stepDensity.map((val, idx) => (
              <div
                key={`step-${idx}`}
                className={`h-7 rounded flex items-center justify-center text-[10px] transition-all ${getCellClass(
                  val,
                  "cyan"
                )}`}
              >
                {val > 0 ? val : ""}
              </div>
            ))}
          </div>

          {/* Row 2: Protein Synthesis */}
          <div className="grid grid-cols-[140px_repeat(12,1fr)] items-center gap-1.5">
            <div className="flex items-center gap-1.5 text-xs text-zinc-800 dark:text-zinc-200 pl-1">
              <span className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.8)]"></span>
              <span className="font-bold text-[11px] truncate uppercase tracking-wider">Protein Pacing</span>
            </div>
            {proteinDensity.map((val, idx) => (
              <div
                key={`prot-${idx}`}
                className={`h-7 rounded flex items-center justify-center text-[10px] transition-all ${getCellClass(
                  val,
                  "sky"
                )}`}
              >
                {val > 0 ? val : ""}
              </div>
            ))}
          </div>

          {/* Row 3: Carbs & Glycogen Refuel */}
          <div className="grid grid-cols-[140px_repeat(12,1fr)] items-center gap-1.5">
            <div className="flex items-center gap-1.5 text-xs text-zinc-800 dark:text-zinc-200 pl-1">
              <span className="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.8)]"></span>
              <span className="font-bold text-[11px] truncate uppercase tracking-wider">Carbohydrates</span>
            </div>
            {carbDensity.map((val, idx) => (
              <div
                key={`carb-${idx}`}
                className={`h-7 rounded flex items-center justify-center text-[10px] transition-all ${getCellClass(
                  val,
                  "rose"
                )}`}
              >
                {val > 0 ? val : ""}
              </div>
            ))}
          </div>

          {/* Row 4: Whole Foods & Fiber */}
          <div className="grid grid-cols-[140px_repeat(12,1fr)] items-center gap-1.5">
            <div className="flex items-center gap-1.5 text-xs text-zinc-800 dark:text-zinc-200 pl-1">
              <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_6px_rgba(168,85,247,0.8)]"></span>
              <span className="font-bold text-[11px] truncate uppercase tracking-wider">Fiber Density</span>
            </div>
            {fiberDensity.map((val, idx) => (
              <div
                key={`fib-${idx}`}
                className={`h-7 rounded flex items-center justify-center text-[10px] transition-all ${getCellClass(
                  val,
                  "purple"
                )}`}
              >
                {val > 0 ? val : ""}
              </div>
            ))}
          </div>

          {/* Row 5: Hydration Flux */}
          <div className="grid grid-cols-[140px_repeat(12,1fr)] items-center gap-1.5">
            <div className="flex items-center gap-1.5 text-xs text-zinc-800 dark:text-zinc-200 pl-1">
              <span className="w-2 h-2 rounded-full bg-sky-300 shadow-[0_0_6px_rgba(125,211,252,0.8)]"></span>
              <span className="font-bold text-[11px] truncate uppercase tracking-wider">Hydration Flux</span>
            </div>
            {hydrationDensity.map((val, idx) => (
              <div
                key={`hyd-${idx}`}
                className={`h-7 rounded flex items-center justify-center text-[10px] transition-all ${getCellClass(
                  val,
                  "sky"
                )}`}
              >
                {val > 0 ? val : ""}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
