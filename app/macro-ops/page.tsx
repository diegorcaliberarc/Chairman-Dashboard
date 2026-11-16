"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ExecutiveModuleShell } from "@/components/chairman/ExecutiveModuleShell";
import { TopKpiStrip } from "@/components/sitrep/TopKpiStrip";
import { FastDailyEntryForm } from "@/components/sitrep/FastDailyEntryForm";
import { WeightTrajectoryChart } from "@/components/sitrep/WeightTrajectoryChart";
import { CaloricBalanceChart } from "@/components/sitrep/CaloricBalanceChart";
import { MacroStepConsistencyChart } from "@/components/sitrep/MacroStepConsistencyChart";
import { SitrepHistoryTable } from "@/components/sitrep/SitrepHistoryTable";
import { QuickDebriefDrawer } from "@/components/sitrep/QuickDebriefDrawer";
import { FoodLoggerCard } from "@/components/FoodLoggerCard";
import { FoodFeedCard, FoodEntry } from "@/components/FoodFeedCard";
import { MealPlanCard, MealPlanRecord } from "@/components/MealPlanCard";
import { DailySitrepLog } from "@/lib/commandTypes";

// Modular Orbital Metabolic / Phoenix Executive Telemetry HUD Components
import { MacroSubheader } from "@/components/macro-ops/MacroSubheader";
import { CircadianHeatmapStrip } from "@/components/macro-ops/CircadianHeatmapStrip";
import { MacroFuelCommandHub } from "@/components/macro-ops/MacroFuelCommandHub";
import { PolarAdherenceWheelCard } from "@/components/macro-ops/PolarAdherenceWheelCard";
import { GengarHydrationCard } from "@/components/macro-ops/GengarHydrationCard";
import { MetabolicFlowSankeyCard } from "@/components/macro-ops/MetabolicFlowSankeyCard";
import { DailyFuelLedgerCard } from "@/components/macro-ops/DailyFuelLedgerCard";
import { QuickMealLogModal } from "@/components/macro-ops/QuickMealLogModal";

import {
  Activity,
  Flame,
  Utensils,
  Moon,
  RefreshCw,
  TrendingDown,
  BarChart3,
} from "lucide-react";

function getTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function MacroOpsPage() {
  const [activeTab, setActiveTab] = useState<"vitality" | "sitrep" | "mealplan">("vitality");
  const [selectedDate, setSelectedDate] = useState<string>(getTodayIso());
  const [isDebriefOpen, setIsDebriefOpen] = useState(false);
  const [isMealModalOpen, setIsMealModalOpen] = useState(false);

  // SITREP Live State
  const [sitrepHistory, setSitrepHistory] = useState<DailySitrepLog[]>([]);
  const [todayLog, setTodayLog] = useState<DailySitrepLog | null>(null);
  const [targetWeightLbs, setTargetWeightLbs] = useState<number>(155.0);
  const [sitrepStats, setSitrepStats] = useState<any>({
    currentWeight: null,
    weightDelta: null,
    movingAvg: null,
    targetWeightLbs: 155.0,
    distanceToTarget: null,
    passRatePct: 0,
    avgDeficit: 0,
    avgProtein: 0,
    avgSteps: 0,
  });
  const [isSitrepLoading, setIsSitrepLoading] = useState(true);

  // Nutrition state
  const [dailyLog, setDailyLog] = useState<any>(null);
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlanRecord[]>([]);

  // Load SITREP data
  const loadSitrepData = useCallback(async () => {
    setIsSitrepLoading(true);
    try {
      const res = await fetch(`/api/sitrep?date=${selectedDate}&limit=60`);
      if (!res.ok) throw new Error("Failed to load SITREP telemetry");
      const data = await res.json();
      if (data.success) {
        setSitrepHistory(data.history || []);
        setTodayLog(data.todayLog || null);
        setTargetWeightLbs(data.targetWeightLbs || 155.0);
        setSitrepStats(data.stats || {});
      }
    } catch (err) {
      console.error("Error loading SITREP:", err);
    } finally {
      setIsSitrepLoading(false);
    }
  }, [selectedDate]);

  // Load nutrition data
  const loadNutritionData = useCallback(async () => {
    try {
      const res = await fetch(`/api/nutrition?date=${selectedDate}&range=30D`);
      if (res.ok) {
        const data = await res.json();
        setDailyLog(data.dailyLog);
        setEntries(data.entries || []);
        setMealPlans(data.mealPlans || []);
      }
    } catch (e) {
      console.error("Error loading nutrition:", e);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadSitrepData();
    loadNutritionData();
  }, [loadSitrepData, loadNutritionData]);

  // Macro Totals calculated from live food entries
  const totals = useMemo(() => {
    if (!entries || entries.length === 0) return undefined;
    return entries.reduce(
      (acc, curr) => ({
        calories: acc.calories + (Number(curr.calories) || 0),
        protein: acc.protein + (Number(curr.protein_g) || 0),
        carbs: acc.carbs + (Number(curr.carbs_g) || 0),
        fat: acc.fat + (Number(curr.fat_g) || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [entries]);

  // Database persistence helpers
  const updateSitrepField = async (partial: Partial<DailySitrepLog> | Record<string, any>) => {
    try {
      const payload = {
        log_date: selectedDate,
        morning_weight_lbs: todayLog?.morning_weight_lbs ?? null,
        total_steps: todayLog?.total_steps ?? 0,
        calories_eaten: totals?.calories || todayLog?.calories_eaten || 0,
        kcal_burned: todayLog?.kcal_burned ?? 0,
        protein_g: totals?.protein || todayLog?.protein_g || 0,
        water_oz: todayLog?.water_oz ?? 0,
        sleep_hours: todayLog?.sleep_hours ?? null,
        recovery_score: todayLog?.recovery_score ?? null,
        lift_completed: todayLog?.lift_completed ?? false,
        cardio_completed: todayLog?.cardio_completed ?? false,
        fasting_hours: todayLog?.fasting_hours ?? null,
        notes: todayLog?.notes ?? null,
        ...partial,
      };

      const res = await fetch("/api/sitrep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await loadSitrepData();
      }
    } catch (err) {
      console.error("Failed to update sitrep field:", err);
    }
  };

  const handleQuickAddWater = async (deltaOz: number) => {
    const currentWater = todayLog?.water_oz || 0;
    const nextWater = +(currentWater + deltaOz).toFixed(1);
    await updateSitrepField({ water_oz: nextWater });
  };

  const handleUpdateSteps = async (steps: number) => {
    await updateSitrepField({ total_steps: steps });
  };

  const handleUpdateFastingHours = async (hours: number) => {
    await updateSitrepField({ fasting_hours: hours });
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      const res = await fetch(`/api/nutrition?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await loadNutritionData();
        await loadSitrepData();
      }
    } catch (err) {
      console.error("Failed to delete entry:", err);
    }
  };

  const handleQuickLogMeal = async (meal: {
    name: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    meal_window: string;
  }) => {
    try {
      await fetch("/api/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_entry",
          date: selectedDate,
          entry: {
            name: meal.name,
            meal_window: meal.meal_window,
            raw_input: `${meal.name} · ${meal.calories} kcal`,
            quantity_grams: 250,
            weight_lbs: 0.55,
            calories: meal.calories,
            protein_g: meal.protein_g,
            carbs_g: meal.carbs_g,
            fat_g: meal.fat_g,
            is_estimated: false,
          },
        }),
      });

      // Update SITREP totals
      const newCalories = (todayLog?.calories_eaten || 0) + meal.calories;
      const newProtein = (todayLog?.protein_g || 0) + meal.protein_g;
      await updateSitrepField({
        calories_eaten: newCalories,
        protein_g: newProtein,
      });

      await loadNutritionData();
      await loadSitrepData();
    } catch (err) {
      console.error("Failed to quick log meal:", err);
    }
  };

  const handleConfirmPending = async (entry: any) => {
    try {
      await fetch("/api/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_entry",
          date: selectedDate,
          entry: {
            name: entry.name,
            meal_window: entry.meal_window || "dinner",
            raw_input: entry.raw_input || entry.name,
            quantity_grams: entry.quantity_grams || 300,
            weight_lbs: 0.66,
            calories: entry.calories || 460,
            protein_g: entry.protein_g || 42,
            carbs_g: entry.carbs_g || 12,
            fat_g: entry.fat_g || 12,
            is_estimated: false,
          },
        }),
      });

      // Update SITREP totals
      const newCalories = (todayLog?.calories_eaten || 0) + (entry.calories || 460);
      const newProtein = (todayLog?.protein_g || 0) + (entry.protein_g || 42);
      await updateSitrepField({
        calories_eaten: newCalories,
        protein_g: newProtein,
      });

      await loadNutritionData();
      await loadSitrepData();
    } catch (err) {
      console.error("Failed to confirm pending meal:", err);
    }
  };

  return (
    <ExecutiveModuleShell
      moduleId="MACRO_OPS"
      eyebrow="ORBITAL METABOLIC // PHOENIX EXECUTIVE TELEMETRY HUD"
      title="Orbital Metabolic & Phoenix Bio-Telemetry OS"
      subtitle="Real-Time Nitrogen Saturation, Circadian Glycogen Flux, Kinetic Steps & Cellular Homeostasis"
      accentColor="#06b6d4"
      headerActions={
        <div className="flex items-center gap-2">
          {/* Tab Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-surface border border-border text-xs font-mono">
            <button
              onClick={() => setActiveTab("vitality")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-bold ${
                activeTab === "vitality"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Flame size={13} />
              <span>VITALITY COCKPIT</span>
            </button>

            <button
              onClick={() => setActiveTab("sitrep")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-bold ${
                activeTab === "sitrep"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Activity size={13} />
              <span>SITREP &amp; RECHARTS</span>
            </button>

            <button
              onClick={() => setActiveTab("mealplan")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-bold ${
                activeTab === "mealplan"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Utensils size={13} />
              <span>MEAL PROTOCOL</span>
            </button>
          </div>

          {/* Quick Fuel Entry Modal Button */}
          <button
            onClick={() => setIsMealModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold font-mono text-xs tracking-wider shadow-lg shadow-cyan-500/20 active:scale-95 transition"
          >
            <Utensils size={13} />
            <span>+ LOG FUEL</span>
          </button>

          {/* Quick Debrief Button */}
          <button
            onClick={() => setIsDebriefOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold font-mono text-xs tracking-wider shadow-lg active:scale-95 transition"
          >
            <Moon size={13} />
            <span className="hidden sm:inline">DEBRIEF</span>
          </button>

          {/* Refresh */}
          <button
            onClick={() => {
              loadSitrepData();
              loadNutritionData();
            }}
            className="p-2 rounded-xl bg-surface border border-border text-zinc-400 hover:text-white hover:border-zinc-700 transition"
            title="Refresh Telemetry"
          >
            <RefreshCw size={14} className={isSitrepLoading ? "animate-spin text-cyan-400" : ""} />
          </button>
        </div>
      }
    >
      <div className="min-h-screen bg-background text-zinc-100 w-full">
        {activeTab === "vitality" ? (
          <div className="space-y-4">
            {/* 1. SUBHEADER: 7-DAY PILL RAIL + COMPACT FASTING PILL + KINETIC STEP ENGINE */}
            <MacroSubheader
              selectedDate={selectedDate}
              onDateChange={(date) => setSelectedDate(date)}
              todayLog={todayLog}
              sitrepStats={sitrepStats}
              sitrepHistory={sitrepHistory}
              isLoading={isSitrepLoading}
              onOpenLogMeal={() => setIsMealModalOpen(true)}
              onQuickAddWater={handleQuickAddWater}
              onOpenDebrief={() => setIsDebriefOpen(true)}
              onRefresh={() => {
                loadSitrepData();
                loadNutritionData();
              }}
              onUpdateSteps={handleUpdateSteps}
              onUpdateFastingHours={handleUpdateFastingHours}
            />

            {/* 2. ACTIVITY & METABOLIC HEATMAP STRIP (12 Intervals × 5 Vector Tracks) */}
            <div className="px-4 lg:px-6">
              <CircadianHeatmapStrip
                todayLog={todayLog}
                entries={entries}
              />
            </div>

            {/* 3. MACRO FUEL COMMAND HUB (4 EQUAL CARDS - ZERO DUMMY DEFAULTS) */}
            <MacroFuelCommandHub
              todayLog={todayLog}
              dailyLog={dailyLog}
              totals={totals}
            />

            {/* 4. MAIN BODY GRID: 12-COLUMN ARCHITECTURE */}
            <div className="w-full px-4 lg:px-6 pb-8 grid grid-cols-1 xl:grid-cols-12 gap-6">
              {/* LEFT COLUMN: POLAR WHEEL + GENGAR HYDRATION (4 COLS) */}
              <div className="xl:col-span-4 flex flex-col gap-6">
                <PolarAdherenceWheelCard
                  todayLog={todayLog}
                  dailyLog={dailyLog}
                  totals={totals}
                />
                <GengarHydrationCard
                  todayLog={todayLog}
                  dailyLog={dailyLog}
                  onQuickAddWater={handleQuickAddWater}
                />
              </div>

              {/* RIGHT EXPANDED SECTION: SANKEY SPECTRUM + DAILY FUEL LEDGER (8 COLS) */}
              <div className="xl:col-span-8 flex flex-col gap-6">
                <MetabolicFlowSankeyCard
                  entries={entries}
                  totalCalories={totals?.calories || todayLog?.calories_eaten || 0}
                  totals={totals}
                  onOpenAddMeal={() => setIsMealModalOpen(true)}
                />
                <DailyFuelLedgerCard
                  entries={entries}
                  selectedDate={selectedDate}
                  onOpenAddMeal={() => setIsMealModalOpen(true)}
                  onDeleteEntry={handleDeleteEntry}
                  onConfirmPending={handleConfirmPending}
                  onQuickLogMeal={handleQuickLogMeal}
                />
              </div>
            </div>
          </div>
        ) : activeTab === "sitrep" ? (
          /* SITREP & EXPANDED RECHARTS DECK + 15-COLUMN TABLE */
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
            <TopKpiStrip stats={sitrepStats} todayLog={todayLog} />

            <FastDailyEntryForm
              selectedDate={selectedDate}
              onDateChange={(d) => setSelectedDate(d)}
              existingLog={todayLog}
              onSaved={loadSitrepData}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-surface border border-border shadow-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <TrendingDown size={16} className="text-amber-400" />
                    <div>
                      <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                        Weight Trajectory &amp; 7-Day Moving Average
                      </h4>
                      <p className="text-[11px] text-zinc-400">
                        Daily scale readings vs. trailing 7-day average against the {targetWeightLbs} lbs target line
                      </p>
                    </div>
                  </div>
                </div>
                <WeightTrajectoryChart data={sitrepHistory} targetWeightLbs={targetWeightLbs} />
              </div>

              <div className="p-5 rounded-2xl bg-surface border border-border shadow-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <BarChart3 size={16} className="text-rose-400" />
                    <div>
                      <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                        Caloric Energy Balance &amp; Deficit
                      </h4>
                      <p className="text-[11px] text-zinc-400">
                        Intake vs. expenditure with daily net deficit margin (target &ge; 350 kcal)
                      </p>
                    </div>
                  </div>
                </div>
                <CaloricBalanceChart data={sitrepHistory} />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-surface border border-border shadow-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Activity size={16} className="text-cyan-400" />
                  <div>
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                      Physical Activity &amp; Protein Consistency
                    </h4>
                    <p className="text-[11px] text-zinc-400">
                      Step volume (miles) and protein intake against the 10,000 steps and 160g thresholds
                    </p>
                  </div>
                </div>
              </div>
              <MacroStepConsistencyChart data={sitrepHistory} />
            </div>

            <div className="p-5 rounded-2xl bg-surface border border-border shadow-2xl">
              <SitrepHistoryTable
                data={sitrepHistory}
                onRefresh={loadSitrepData}
                onEditItem={(item) => setSelectedDate(item.log_date)}
              />
            </div>
          </div>
        ) : (
          /* MEAL PROTOCOL TAB */
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
            <FoodLoggerCard logDate={selectedDate} onEntriesAdded={loadNutritionData} />
            <FoodFeedCard entries={entries} onEntryUpdated={loadNutritionData} onEntryDeleted={loadNutritionData} />
            <MealPlanCard mealPlans={mealPlans} onMealLogged={loadNutritionData} onPlanUpdated={loadNutritionData} />
          </div>
        )}
      </div>

      {/* QUICK DEBRIEF DRAWER */}
      <QuickDebriefDrawer
        isOpen={isDebriefOpen}
        onClose={() => setIsDebriefOpen(false)}
        selectedDate={selectedDate}
        existingLog={todayLog}
        onSaved={loadSitrepData}
      />

      {/* QUICK MEAL LOG MODAL */}
      <QuickMealLogModal
        isOpen={isMealModalOpen}
        onClose={() => setIsMealModalOpen(false)}
        selectedDate={selectedDate}
        onSaved={() => {
          loadNutritionData();
          loadSitrepData();
        }}
      />
    </ExecutiveModuleShell>
  );
}
