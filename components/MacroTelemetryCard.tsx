"use client";

import React, { useState } from "react";
import {
  Flame,
  Dumbbell,
  Droplets,
  Scale,
  Footprints,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Sparkles,
} from "lucide-react";

interface MacroTelemetryCardProps {
  calorieTarget: number;
  consumedCalories: number;
  proteinTarget: number;
  consumedProtein: number;
  consumedCarbs: number;
  consumedFat: number;
  cholesterolCap: number;
  consumedCholesterol: number;
  waterTargetOz: number;
  consumedWaterOz: number;
  totalMassLbs: number;
  morningWeightLbs: number | null;
  stepsCount: number;
  onUpdateBiometrics: (weight: number | null, steps: number) => Promise<void>;
}

export function MacroTelemetryCard({
  calorieTarget = 1700,
  consumedCalories = 0,
  proteinTarget = 180,
  consumedProtein = 0,
  consumedCarbs = 0,
  consumedFat = 0,
  cholesterolCap = 255,
  consumedCholesterol = 0,
  waterTargetOz = 128,
  consumedWaterOz = 0,
  totalMassLbs = 0,
  morningWeightLbs = null,
  stepsCount = 0,
  onUpdateBiometrics,
}: MacroTelemetryCardProps) {
  const [weightInput, setWeightInput] = useState<string>(
    morningWeightLbs ? String(morningWeightLbs) : ""
  );
  const [stepsInput, setStepsInput] = useState<string>(String(stepsCount || ""));
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const caloriesRemaining = Math.max(0, calorieTarget - consumedCalories);
  const isDeficitHit = consumedCalories <= calorieTarget;
  const isProteinHit = consumedProtein >= proteinTarget;
  const isCholesterolWarning = consumedCholesterol > cholesterolCap;
  const proteinPercent = Math.min(100, Math.round((consumedProtein / proteinTarget) * 100));
  const caloriePercent = Math.min(100, Math.round((consumedCalories / calorieTarget) * 100));
  const waterPercent = Math.min(100, Math.round((consumedWaterOz / waterTargetOz) * 100));

  const handleSaveBiometrics = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const w = weightInput ? parseFloat(weightInput) : null;
      const s = stepsInput ? parseInt(stepsInput, 10) : 0;
      await onUpdateBiometrics(w, s);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2200);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-3xl bg-[#141418] border border-[#1E1E24] p-5 sm:p-6 shadow-[0_12px_36px_rgba(0,0,0,0.65)] space-y-6">
      {/* ── Top Bar: Biometrics Quick Logger ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1E1E24]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-2xl bg-[#1E1E24] text-emerald-400">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-100">
              Daily Macro & Biometric Telemetry
            </h2>
            <p className="text-[11px] text-zinc-500 font-mono">
              1,700 kcal Cut Protocol • 155.0 lbs Target
            </p>
          </div>
        </div>

        {/* Morning Weight & Steps Input Form */}
        <form onSubmit={handleSaveBiometrics} className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#0A0A0C] border border-[#1E1E24] text-xs">
            <Scale className="w-3.5 h-3.5 text-zinc-400" />
            <input
              type="number"
              step="0.1"
              placeholder="Morning Weight"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              className="w-20 bg-transparent text-zinc-100 font-mono font-bold focus:outline-none placeholder:text-zinc-600 text-xs"
            />
            <span className="text-[10px] text-zinc-500 font-mono">lbs</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#0A0A0C] border border-[#1E1E24] text-xs">
            <Footprints className="w-3.5 h-3.5 text-zinc-400" />
            <input
              type="number"
              placeholder="Steps"
              value={stepsInput}
              onChange={(e) => setStepsInput(e.target.value)}
              className="w-16 bg-transparent text-zinc-100 font-mono font-bold focus:outline-none placeholder:text-zinc-600 text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className={`px-3 py-1.5 rounded-2xl text-xs font-semibold font-mono transition-all ${
              saveSuccess
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "bg-[#1E1E24] hover:bg-zinc-700 text-zinc-200 border border-zinc-700"
            }`}
          >
            {isSaving ? "Saving..." : saveSuccess ? "Logged ✓" : "Log Bio"}
          </button>
        </form>
      </div>

      {/* ── Key Metrics Grid: Remaining Calories & Protein Floor ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Calories Remaining */}
        <div className="p-4 rounded-2xl bg-[#0A0A0C] border border-[#1E1E24] flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Remaining Budget</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold font-mono tracking-tight text-zinc-100">
              {caloriesRemaining.toLocaleString()}
            </span>
            <span className="text-xs text-zinc-500 ml-1 font-mono">/ {calorieTarget} kcal</span>
          </div>
          <div className="w-full bg-[#1E1E24] h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                isDeficitHit ? "bg-emerald-400" : "bg-red-400"
              }`}
              style={{ width: `${caloriePercent}%` }}
            />
          </div>
          <div className="mt-1.5 text-[10.5px] font-mono text-zinc-500 flex justify-between">
            <span>Eaten: {consumedCalories} kcal</span>
            <span className={isDeficitHit ? "text-emerald-400" : "text-red-400 font-bold"}>
              {isDeficitHit ? "In Deficit" : "Over Target"}
            </span>
          </div>
        </div>

        {/* Metric 2: Protein Floor */}
        <div className="p-4 rounded-2xl bg-[#0A0A0C] border border-[#1E1E24] flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Protein Floor</span>
            <Dumbbell className={`w-4 h-4 ${isProteinHit ? "text-emerald-400" : "text-zinc-500"}`} />
          </div>
          <div className="my-2 flex items-baseline justify-between">
            <div>
              <span
                className={`text-3xl font-extrabold font-mono tracking-tight ${
                  isProteinHit ? "text-emerald-400" : "text-zinc-100"
                }`}
              >
                {consumedProtein.toFixed(1)}
              </span>
              <span className="text-xs text-zinc-500 ml-1 font-mono">/ {proteinTarget}g</span>
            </div>
            {isProteinHit && (
              <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3" /> Target Met
              </span>
            )}
          </div>
          <div className="w-full bg-[#1E1E24] h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400 transition-all duration-500"
              style={{ width: `${proteinPercent}%` }}
            />
          </div>
          <div className="mt-1.5 text-[10.5px] font-mono text-zinc-500 flex justify-between">
            <span>Progress: {proteinPercent}%</span>
            <span>Target: 180.0g</span>
          </div>
        </div>

        {/* Metric 3: Hydration */}
        <div className="p-4 rounded-2xl bg-[#0A0A0C] border border-[#1E1E24] flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Hydration Intake</span>
            <Droplets className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold font-mono tracking-tight text-zinc-100">
              {consumedWaterOz.toFixed(0)}
            </span>
            <span className="text-xs text-zinc-500 ml-1 font-mono">/ {waterTargetOz} oz</span>
          </div>
          <div className="w-full bg-[#1E1E24] h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-400 transition-all duration-500"
              style={{ width: `${waterPercent}%` }}
            />
          </div>
          <div className="mt-1.5 text-[10.5px] font-mono text-zinc-500 flex justify-between">
            <span>{Math.round(consumedWaterOz * 29.57)} ml</span>
            <span>1 Gallon Goal</span>
          </div>
        </div>

        {/* Metric 4: Ingested Physical Mass (lbs) */}
        <div className="p-4 rounded-2xl bg-[#0A0A0C] border border-[#1E1E24] flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Physical Mass Ingested</span>
            <Scale className="w-4 h-4 text-purple-400" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold font-mono tracking-tight text-purple-300">
              {totalMassLbs.toFixed(2)}
            </span>
            <span className="text-xs text-zinc-500 ml-1 font-mono">lbs</span>
          </div>
          <div className="w-full bg-[#1E1E24] h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-400 transition-all duration-500"
              style={{ width: `${Math.min(100, (totalMassLbs / 10) * 100)}%` }}
            />
          </div>
          <div className="mt-1.5 text-[10px] font-mono text-zinc-500">
            Solid Food + Hydration Water Weight
          </div>
        </div>
      </div>

      {/* ── Sub-Macro Pills: Carbs, Fat, Cholesterol Cap ── */}
      <div className="grid grid-cols-3 gap-3 pt-1">
        <div className="p-3 rounded-2xl bg-[#0A0A0C] border border-[#1E1E24] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-zinc-500 block">Carbohydrates</span>
            <span className="text-sm font-extrabold font-mono text-zinc-200">{consumedCarbs.toFixed(1)}g</span>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">Fast Fuel</span>
        </div>

        <div className="p-3 rounded-2xl bg-[#0A0A0C] border border-[#1E1E24] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-zinc-500 block">Dietary Fats</span>
            <span className="text-sm font-extrabold font-mono text-zinc-200">{consumedFat.toFixed(1)}g</span>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">Hormonal</span>
        </div>

        <div
          className={`p-3 rounded-2xl border flex items-center justify-between ${
            isCholesterolWarning
              ? "bg-amber-500/10 border-amber-500/40"
              : "bg-[#0A0A0C] border-[#1E1E24]"
          }`}
        >
          <div>
            <span className="text-[10px] font-mono uppercase text-zinc-500 block">
              Cholesterol Cap
            </span>
            <span
              className={`text-sm font-extrabold font-mono ${
                isCholesterolWarning ? "text-amber-400" : "text-zinc-200"
              }`}
            >
              {consumedCholesterol} <span className="text-[10px] text-zinc-500 font-normal">/ {cholesterolCap}mg</span>
            </span>
          </div>
          {isCholesterolWarning && (
            <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
}
