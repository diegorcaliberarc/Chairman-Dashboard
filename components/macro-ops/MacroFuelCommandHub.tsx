"use client";

import React from "react";
import { Flame, Dumbbell, Zap, Shield } from "lucide-react";
import { DailySitrepLog } from "@/lib/commandTypes";

interface MacroFuelCommandHubProps {
  todayLog: DailySitrepLog | null;
  dailyLog?: any;
  totals?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export function MacroFuelCommandHub({
  todayLog,
  dailyLog,
  totals,
}: MacroFuelCommandHubProps) {
  // Extract real values strictly, zeroing out when no entries exist
  const caloriesEaten = totals?.calories ?? todayLog?.calories_eaten ?? 0;
  const calorieTarget = dailyLog?.calorie_target || 2250;
  const kcalLeft = Math.max(0, calorieTarget - caloriesEaten);
  const energyPct = Math.min(100, Math.round((caloriesEaten / calorieTarget) * 100));

  const proteinG = totals?.protein ?? todayLog?.protein_g ?? 0;
  const proteinTarget = dailyLog?.protein_target_g || 185;
  const proteinLeft = Math.max(0, Math.round(proteinTarget - proteinG));
  const proteinPct = Math.min(100, Math.round((proteinG / proteinTarget) * 100));

  const carbsG = totals?.carbs ?? 0;
  const carbsTarget = 220;
  const carbsLeft = Math.max(0, Math.round(carbsTarget - carbsG));
  const carbsPct = Math.min(100, Math.round((carbsG / carbsTarget) * 100));

  const fatG = totals?.fat ?? 0;
  const fatTarget = 55;
  const fatLeft = Math.max(0, Math.round(fatTarget - fatG));
  const fatPct = Math.min(100, Math.round((fatG / fatTarget) * 100));

  const kcalBurned = todayLog?.kcal_burned || 0;
  const weightLbs = todayLog?.morning_weight_lbs || 0;
  const massKg = weightLbs > 0 ? (weightLbs * 0.453592).toFixed(1) : "0.0";
  const proteinPerKg =
    weightLbs > 0 && proteinG > 0
      ? (proteinG / (weightLbs * 0.453592)).toFixed(1)
      : "0.0";

  return (
    <section className="w-full px-4 lg:px-6 py-4 bg-transparent border-b" style={{ borderColor: "var(--glass-border)" }}>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Energy Deficit Fuel */}
        <div
          className="p-4 sm:p-5 rounded-2xl border relative overflow-hidden group transition-all duration-300 shadow-xl hover:shadow-2xl"
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
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="font-mono font-bold text-xs uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Energy Deficit Fuel
              </span>
            </div>
            <span className="font-mono text-[10px] font-bold text-amber-600 dark:text-amber-300 uppercase px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
              {energyPct}% Consumed
            </span>
          </div>

          <div className="flex items-baseline justify-between mt-2">
            <div>
              <div className="text-3xl sm:text-4xl font-mono font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
                {caloriesEaten.toLocaleString()}
              </div>
              <div className="text-xs font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mt-0.5">
                Kcal Ingested
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl sm:text-2xl font-mono font-bold text-amber-600 dark:text-amber-400 tracking-tight">
                {kcalLeft}
              </div>
              <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 uppercase">
                Kcal Left / {calorieTarget}
              </div>
            </div>
          </div>

          {/* Machined Gauge Bar */}
          <div className="w-full h-2 rounded-full bg-black/10 dark:bg-white/10 mt-4 overflow-hidden p-0.5 border border-black/5 dark:border-white/10">
            <div
              className="h-full rounded-full bg-amber-400 shadow-sm shadow-amber-400/50 transition-all duration-500"
              style={{ width: `${energyPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between font-mono text-[10px] text-zinc-500 dark:text-zinc-400 mt-2">
            <span>BMR BASE: 1,980</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">BURN: +{kcalBurned}</span>
          </div>
        </div>

        {/* Card 2: Protein / Nitrogen Saturation */}
        <div
          className="p-4 sm:p-5 rounded-2xl border relative overflow-hidden group transition-all duration-300 shadow-xl hover:shadow-2xl"
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
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span className="font-mono font-bold text-xs uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Protein Anabolism
              </span>
            </div>
            <span className="font-mono text-[10px] font-bold text-cyan-600 dark:text-cyan-300 uppercase px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
              {proteinPct}% Saturation
            </span>
          </div>

          <div className="flex items-baseline justify-between mt-2">
            <div>
              <div className="text-3xl sm:text-4xl font-mono font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
                {proteinG}g
              </div>
              <div className="text-xs font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mt-0.5">
                Current Ingestion
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl sm:text-2xl font-mono font-bold text-cyan-600 dark:text-cyan-400 tracking-tight">
                {proteinLeft}g
              </div>
              <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 uppercase">
                Grams Left / {proteinTarget}g
              </div>
            </div>
          </div>

          <div className="w-full h-2 rounded-full bg-black/10 dark:bg-white/10 mt-4 overflow-hidden p-0.5 border border-black/5 dark:border-white/10">
            <div
              className="h-full rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50 transition-all duration-500"
              style={{ width: `${proteinPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between font-mono text-[10px] text-zinc-500 dark:text-zinc-400 mt-2">
            <span>BIO AVAIL: BV 94+</span>
            <span className="text-cyan-600 dark:text-cyan-400 font-bold">{proteinPerKg}g / kg BM</span>
          </div>
        </div>

        {/* Card 3: Carbohydrates / Glycogen Repletion */}
        <div
          className="p-4 sm:p-5 rounded-2xl border relative overflow-hidden group transition-all duration-300 shadow-xl hover:shadow-2xl"
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
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <span className="font-mono font-bold text-xs uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Glycogen Repletion
              </span>
            </div>
            <span className="font-mono text-[10px] font-bold text-rose-600 dark:text-rose-300 uppercase px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
              {carbsPct}% Replete
            </span>
          </div>

          <div className="flex items-baseline justify-between mt-2">
            <div>
              <div className="text-3xl sm:text-4xl font-mono font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
                {carbsG}g
              </div>
              <div className="text-xs font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mt-0.5">
                Carbs Ingested
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl sm:text-2xl font-mono font-bold text-rose-600 dark:text-rose-400 tracking-tight">
                {carbsLeft}g
              </div>
              <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 uppercase">
                Grams Left / {carbsTarget}g
              </div>
            </div>
          </div>

          <div className="w-full h-2 rounded-full bg-black/10 dark:bg-white/10 mt-4 overflow-hidden p-0.5 border border-black/5 dark:border-white/10">
            <div
              className="h-full rounded-full bg-rose-400 shadow-sm shadow-rose-400/50 transition-all duration-500"
              style={{ width: `${carbsPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between font-mono text-[10px] text-zinc-500 dark:text-zinc-400 mt-2">
            <span>FIBER DENSITY: LOW GI</span>
            <span className="text-rose-600 dark:text-rose-400 font-bold">{carbsG > 0 ? "IN SINK" : "FASTING"}</span>
          </div>
        </div>

        {/* Card 4: Fats & Essential Lipids */}
        <div
          className="p-4 sm:p-5 rounded-2xl border relative overflow-hidden group transition-all duration-300 shadow-xl hover:shadow-2xl"
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
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
              <span className="font-mono font-bold text-xs uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Lipids &amp; Hormones
              </span>
            </div>
            <span className="font-mono text-[10px] font-bold text-purple-600 dark:text-purple-300 uppercase px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
              {fatPct}% Allowance
            </span>
          </div>

          <div className="flex items-baseline justify-between mt-2">
            <div>
              <div className="text-3xl sm:text-4xl font-mono font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
                {fatG}g
              </div>
              <div className="text-xs font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mt-0.5">
                Lipids Consumed
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl sm:text-2xl font-mono font-bold text-purple-600 dark:text-purple-400 tracking-tight">
                {fatLeft}g
              </div>
              <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 uppercase">
                Grams Left / {fatTarget}g
              </div>
            </div>
          </div>

          <div className="w-full h-2 rounded-full bg-black/10 dark:bg-white/10 mt-4 overflow-hidden p-0.5 border border-black/5 dark:border-white/10">
            <div
              className="h-full rounded-full bg-purple-400 shadow-sm shadow-purple-400/50 transition-all duration-500"
              style={{ width: `${fatPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between font-mono text-[10px] text-zinc-500 dark:text-zinc-400 mt-2">
            <span>OMEGA 3:6 BALANCED</span>
            <span className="text-purple-600 dark:text-purple-400 font-bold">{fatG > 0 ? "SATURATED" : "IDLE"}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
