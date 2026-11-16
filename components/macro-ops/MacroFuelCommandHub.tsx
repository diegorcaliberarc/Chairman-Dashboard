"use client";

import React from "react";
import { Flame, Dumbbell, Zap, Shield, Sparkles } from "lucide-react";
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
  // Extract values, favoring live food entry totals if available, falling back to SITREP log
  const caloriesEaten = totals?.calories || todayLog?.calories_eaten || 1840;
  const calorieTarget = dailyLog?.calorie_target || 2450;
  const kcalLeft = Math.max(0, calorieTarget - caloriesEaten);
  const energyPct = Math.min(100, Math.round((caloriesEaten / calorieTarget) * 100));

  const proteinG = totals?.protein || todayLog?.protein_g || 168;
  const proteinTarget = dailyLog?.protein_target_g || 190;
  const proteinLeft = Math.max(0, Math.round(proteinTarget - proteinG));
  const proteinPct = Math.min(100, Math.round((proteinG / proteinTarget) * 100));

  const carbsG = totals?.carbs || 185;
  const carbsTarget = 220;
  const carbsLeft = Math.max(0, Math.round(carbsTarget - carbsG));
  const carbsPct = Math.min(100, Math.round((carbsG / carbsTarget) * 100));

  const fatG = totals?.fat || 54;
  const fatTarget = 65;
  const fatLeft = Math.max(0, Math.round(fatTarget - fatG));
  const fatPct = Math.min(100, Math.round((fatG / fatTarget) * 100));

  const kcalBurned = todayLog?.kcal_burned || 1080;
  const weightLbs = todayLog?.morning_weight_lbs || 178;
  const massKg = (weightLbs * 0.453592).toFixed(1);
  const proteinPerKg = (proteinG / (weightLbs * 0.453592)).toFixed(1);

  return (
    <section className="w-full px-4 lg:px-6 py-6 bg-surface/50 border-b border-border">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Energy Deficit Fuel */}
        <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border relative overflow-hidden group hover:border-amber-500/40 transition-all shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="font-mono font-bold text-xs uppercase tracking-wider text-zinc-400">
                Energy Deficit Fuel
              </span>
            </div>
            <span className="font-mono text-[10px] font-bold text-amber-300 uppercase px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
              {energyPct}% Consumed
            </span>
          </div>

          <div className="flex items-baseline justify-between mt-2">
            <div>
              <div className="text-3xl sm:text-4xl font-mono font-extrabold text-zinc-100 tracking-tight">
                {caloriesEaten.toLocaleString()}
              </div>
              <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider mt-0.5">
                Kcal Ingested
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl sm:text-2xl font-mono font-bold text-amber-400 tracking-tight">
                {kcalLeft}
              </div>
              <div className="text-[11px] font-mono text-zinc-400 uppercase">
                Kcal Left / {calorieTarget}
              </div>
            </div>
          </div>

          {/* Machined Gauge Bar */}
          <div className="w-full h-2 rounded-full bg-zinc-900 mt-4 overflow-hidden p-0.5 border border-border">
            <div
              className="h-full rounded-full bg-amber-400 shadow-sm shadow-amber-400/50 transition-all duration-500"
              style={{ width: `${energyPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between font-mono text-[10px] text-zinc-400 mt-2">
            <span>BMR BASE: 1,980</span>
            <span className="text-amber-400 font-bold">BURN: +{kcalBurned}</span>
          </div>
        </div>

        {/* Card 2: Protein / Nitrogen Saturation */}
        <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border relative overflow-hidden group hover:border-cyan-500/40 transition-all shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span className="font-mono font-bold text-xs uppercase tracking-wider text-zinc-400">
                Protein Anabolism
              </span>
            </div>
            <span className="font-mono text-[10px] font-bold text-cyan-300 uppercase px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
              {proteinG >= proteinTarget ? "Target Exceeded" : "Leucine Met"}
            </span>
          </div>

          <div className="flex items-baseline justify-between mt-2">
            <div>
              <div className="text-3xl sm:text-4xl font-mono font-extrabold text-zinc-100 tracking-tight">
                {proteinG}
                <span className="text-lg font-normal text-zinc-400 ml-1">g</span>
              </div>
              <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider mt-0.5">
                Actual Intake
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl sm:text-2xl font-mono font-bold text-cyan-400 tracking-tight">
                {proteinLeft}
                <span className="text-xs font-normal text-zinc-400 ml-0.5">g</span>
              </div>
              <div className="text-[11px] font-mono text-zinc-400 uppercase">
                Left / {proteinTarget}g Target
              </div>
            </div>
          </div>

          {/* Progress Gauge */}
          <div className="w-full h-2 rounded-full bg-zinc-900 mt-4 overflow-hidden p-0.5 border border-border">
            <div
              className="h-full rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50 transition-all duration-500"
              style={{ width: `${proteinPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between font-mono text-[10px] text-zinc-400 mt-2">
            <span>{proteinPerKg}g / kg ({massKg}kg)</span>
            <span className="text-cyan-300 font-bold">OPTIMAL mTOR STIM</span>
          </div>
        </div>

        {/* Card 3: Carbohydrates / Glycogen Repletion */}
        <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border relative overflow-hidden group hover:border-emerald-500/40 transition-all shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="font-mono font-bold text-xs uppercase tracking-wider text-zinc-400">
                Carbohydrates
              </span>
            </div>
            <span className="font-mono text-[10px] font-bold text-emerald-300 uppercase px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
              Glycogen Zone
            </span>
          </div>

          <div className="flex items-baseline justify-between mt-2">
            <div>
              <div className="text-3xl sm:text-4xl font-mono font-extrabold text-zinc-100 tracking-tight">
                {carbsG}
                <span className="text-lg font-normal text-zinc-400 ml-1">g</span>
              </div>
              <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider mt-0.5">
                Glycogen Reload
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl sm:text-2xl font-mono font-bold text-emerald-400 tracking-tight">
                {carbsLeft}
                <span className="text-xs font-normal text-zinc-400 ml-0.5">g</span>
              </div>
              <div className="text-[11px] font-mono text-zinc-400 uppercase">
                Left / {carbsTarget}g Target
              </div>
            </div>
          </div>

          {/* Progress Gauge */}
          <div className="w-full h-2 rounded-full bg-zinc-900 mt-4 overflow-hidden p-0.5 border border-border">
            <div
              className="h-full rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50 transition-all duration-500"
              style={{ width: `${carbsPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between font-mono text-[10px] text-zinc-400 mt-2">
            <span>PRE-WORKOUT: ~75g</span>
            <span className="text-emerald-300 font-bold">POST-CADENCE: ~110g</span>
          </div>
        </div>

        {/* Card 4: Fats & Essential Lipids */}
        <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border relative overflow-hidden group hover:border-purple-500/40 transition-all shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
              <span className="font-mono font-bold text-xs uppercase tracking-wider text-zinc-400">
                Lipids & Fats
              </span>
            </div>
            <span className="font-mono text-[10px] font-bold text-purple-300 uppercase px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
              Endocrine Base
            </span>
          </div>

          <div className="flex items-baseline justify-between mt-2">
            <div>
              <div className="text-3xl sm:text-4xl font-mono font-extrabold text-zinc-100 tracking-tight">
                {fatG}
                <span className="text-lg font-normal text-zinc-400 ml-1">g</span>
              </div>
              <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider mt-0.5">
                Hormonal Support
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl sm:text-2xl font-mono font-bold text-purple-400 tracking-tight">
                {fatLeft}
                <span className="text-xs font-normal text-zinc-400 ml-0.5">g</span>
              </div>
              <div className="text-[11px] font-mono text-zinc-400 uppercase">
                Left / {fatTarget}g Target
              </div>
            </div>
          </div>

          {/* Progress Gauge */}
          <div className="w-full h-2 rounded-full bg-zinc-900 mt-4 overflow-hidden p-0.5 border border-border">
            <div
              className="h-full rounded-full bg-purple-400 shadow-sm shadow-purple-400/50 transition-all duration-500"
              style={{ width: `${fatPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between font-mono text-[10px] text-zinc-400 mt-2">
            <span>OMEGA-3 RATIO: 3:1</span>
            <span className="text-purple-300 font-bold">MCT/MONO: 38g</span>
          </div>
        </div>
      </div>
    </section>
  );
}
