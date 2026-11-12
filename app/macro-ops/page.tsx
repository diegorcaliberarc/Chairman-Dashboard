"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ExecutiveModuleShell } from "@/components/chairman/ExecutiveModuleShell";
import { MacroTelemetryCard } from "@/components/MacroTelemetryCard";
import { FastingTimerCard } from "@/components/FastingTimerCard";
import { FoodLoggerCard } from "@/components/FoodLoggerCard";
import { FoodFeedCard, FoodEntry } from "@/components/FoodFeedCard";
import { MealPlanCard, MealPlanRecord } from "@/components/MealPlanCard";
import { TrendChartsCard, TrendDataPoint } from "@/components/TrendChartsCard";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Utensils,
  Sparkles,
} from "lucide-react";

function getTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function MacroOpsPage() {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayIso());
  const [selectedRange, setSelectedRange] = useState<"7D" | "30D" | "All">("30D");

  // Server Data
  const [dailyLog, setDailyLog] = useState<any>(null);
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlanRecord[]>([]);
  const [trends, setTrends] = useState<TrendDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch Nutrition Data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/nutrition?date=${selectedDate}&range=${selectedRange}`);
      if (!res.ok) throw new Error("Failed to load nutrition data");
      const data = await res.json();
      setDailyLog(data.dailyLog);
      setEntries(data.entries || []);
      setMealPlans(data.mealPlans || []);
      setTrends(data.trends || []);
    } catch (err) {
      console.error("Error loading nutrition:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, selectedRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Aggregate macros from today's entries
  const aggregatedMacros = useMemo(() => {
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;
    let cholesterol = 0;
    let waterOz = 0;
    let totalMassLbs = 0;

    entries.forEach((e) => {
      calories += Number(e.calories) || 0;
      protein += Number(e.protein_g) || 0;
      carbs += Number(e.carbs_g) || 0;
      fat += Number(e.fat_g) || 0;
      cholesterol += Number(e.cholesterol_mg) || 0;
      waterOz += Number(e.water_oz) || 0;
      totalMassLbs += Number(e.weight_lbs) || 0;
    });

    return {
      calories,
      protein: Number(protein.toFixed(1)),
      carbs: Number(carbs.toFixed(1)),
      fat: Number(fat.toFixed(1)),
      cholesterol: Math.round(cholesterol),
      waterOz: Number(waterOz.toFixed(1)),
      totalMassLbs: Number(totalMassLbs.toFixed(2)),
    };
  }, [entries]);

  // Date Navigation Handlers
  const handlePrevDay = () => {
    const cur = new Date(selectedDate + "T12:00:00Z");
    cur.setDate(cur.getDate() - 1);
    setSelectedDate(cur.toISOString().split("T")[0]);
  };

  const handleNextDay = () => {
    const cur = new Date(selectedDate + "T12:00:00Z");
    cur.setDate(cur.getDate() + 1);
    setSelectedDate(cur.toISOString().split("T")[0]);
  };

  const handleToday = () => {
    setSelectedDate(getTodayIso());
  };

  // Update Biometrics Handler
  const handleUpdateBiometrics = async (weight: number | null, steps: number) => {
    await fetch("/api/nutrition", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_biometrics",
        log_date: selectedDate,
        morning_weight_lbs: weight,
        steps_count: steps,
      }),
    });
    await loadData();
  };

  const isToday = selectedDate === getTodayIso();

  return (
    <ExecutiveModuleShell
      moduleId="MACRO_OPS"
      eyebrow="Nutrition & Recomposition"
      title="MacroOps Metabolic Engine"
      subtitle="High-Speed Food Logging, Intermittent Fasting Protocol & Body Recomposition Analytics"
      accentColor="#10b981"
      headerActions={
        <div className="flex items-center gap-2">
          {/* Date Selector Navigation */}
          <div className="flex items-center gap-1 bg-[#141418] p-1 rounded-2xl border border-[#1E1E24] text-xs font-mono">
            <button
              type="button"
              onClick={handlePrevDay}
              className="p-1 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800"
              title="Previous Day"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleToday}
              className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition-colors ${
                isToday ? "bg-emerald-500/20 text-emerald-400" : "text-zinc-300 hover:text-white"
              }`}
            >
              {isToday ? "Today" : selectedDate}
            </button>

            <button
              type="button"
              onClick={handleNextDay}
              className="p-1 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800"
              title="Next Day"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={loadData}
            title="Refresh Data"
            className="p-2 rounded-2xl bg-[#141418] border border-[#1E1E24] text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-emerald-400" : ""}`} />
          </button>
        </div>
      }
    >
      <div className="min-h-screen bg-[#0A0A0C] text-zinc-100 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* ====================================================================
         * CARD 1: DAILY COMMAND & MACRO TELEMETRY
         * ================================================================== */}
        <MacroTelemetryCard
          calorieTarget={Number(dailyLog?.calorie_target) || 1700}
          consumedCalories={aggregatedMacros.calories}
          proteinTarget={Number(dailyLog?.protein_target_g) || 180}
          consumedProtein={aggregatedMacros.protein}
          consumedCarbs={aggregatedMacros.carbs}
          consumedFat={aggregatedMacros.fat}
          cholesterolCap={Number(dailyLog?.cholesterol_cap_mg) || 255}
          consumedCholesterol={aggregatedMacros.cholesterol}
          waterTargetOz={Number(dailyLog?.water_target_oz) || 128}
          consumedWaterOz={aggregatedMacros.waterOz}
          totalMassLbs={aggregatedMacros.totalMassLbs}
          morningWeightLbs={dailyLog?.morning_weight_lbs ? Number(dailyLog.morning_weight_lbs) : null}
          stepsCount={Number(dailyLog?.steps_count) || 0}
          onUpdateBiometrics={handleUpdateBiometrics}
        />

        {/* ====================================================================
         * CARD 2: FASTING & FEEDING WINDOW TIMER (12:00 PM - 6:00 PM LOCKED)
         * ================================================================== */}
        <FastingTimerCard />

        {/* ====================================================================
         * CARD 3: NATURAL LANGUAGE AI FOOD LOGGER (TEXT / VOICE / STAPLES)
         * ================================================================== */}
        <FoodLoggerCard
          logDate={selectedDate}
          onEntriesAdded={loadData}
        />

        {/* ====================================================================
         * CARD 4: VISUAL FOOD LOG FEED (MATCHED PHOTOGRAPHY & INLINE EDIT)
         * ================================================================== */}
        <FoodFeedCard
          entries={entries}
          onEntryUpdated={loadData}
          onEntryDeleted={loadData}
        />

        {/* ====================================================================
         * CARD 5: ACTIVE MEAL PLAN & AI PLAN GENERATOR
         * ================================================================== */}
        <MealPlanCard
          mealPlans={mealPlans}
          onMealLogged={loadData}
          onPlanUpdated={loadData}
        />

        {/* ====================================================================
         * CARD 6: PERFORMANCE & BODY COMPOSITION TRENDS (RECHARTS)
         * ================================================================== */}
        <TrendChartsCard
          trends={trends}
          selectedRange={selectedRange}
          onRangeChange={(r) => setSelectedRange(r)}
        />
      </div>
    </ExecutiveModuleShell>
  );
}
