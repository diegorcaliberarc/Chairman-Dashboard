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
  const [autoStartVoice, setAutoStartVoice] = useState(false);

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

  // Fast in-memory cache for instant 0ms date switching
  const cacheRef = React.useRef<Record<string, { sitrep: any; nutrition: any }>>({});
  // Atomic water ref & sequence guard so rapid clicks accumulate reliably without stale closures
  const waterOzRef = React.useRef<number>(0);
  const waterSeqRef = React.useRef<number>(0);

  useEffect(() => {
    waterOzRef.current = Number(todayLog?.water_oz || 0);
  }, [todayLog?.water_oz, selectedDate]);

  // Unified fast parallel data loader
  const loadAllData = useCallback(async (targetDate: string, force = false) => {
    // If cached, apply instantly without blocking UI
    const cached = cacheRef.current[targetDate];
    if (cached && !force) {
      if (cached.sitrep) {
        setSitrepHistory(cached.sitrep.history || []);
        setTodayLog(cached.sitrep.todayLog || null);
        setTargetWeightLbs(cached.sitrep.targetWeightLbs || 155.0);
        setSitrepStats(cached.sitrep.stats || {});
      }
      if (cached.nutrition) {
        setDailyLog(cached.nutrition.dailyLog);
        setEntries(cached.nutrition.entries || []);
        setMealPlans(cached.nutrition.mealPlans || []);
      }
      setIsSitrepLoading(false);
      return;
    }

    setIsSitrepLoading(true);
    try {
      const [sitrepRes, nutritionRes] = await Promise.all([
        fetch(`/api/sitrep?date=${targetDate}&limit=30`),
        fetch(`/api/nutrition?date=${targetDate}&range=7D`),
      ]);

      let sitrepData = null;
      let nutritionData = null;

      if (sitrepRes.ok) {
        sitrepData = await sitrepRes.json();
        if (sitrepData.success) {
          setSitrepHistory(sitrepData.history || []);
          setTodayLog(sitrepData.todayLog || null);
          setTargetWeightLbs(sitrepData.targetWeightLbs || 155.0);
          setSitrepStats(sitrepData.stats || {});
        }
      }

      if (nutritionRes.ok) {
        nutritionData = await nutritionRes.json();
        setDailyLog(nutritionData.dailyLog);
        setEntries(nutritionData.entries || []);
        setMealPlans(nutritionData.mealPlans || []);
      }

      // Store in memory cache
      cacheRef.current[targetDate] = {
        sitrep: sitrepData,
        nutrition: nutritionData,
      };
    } catch (err) {
      console.error("Error loading Macro-Ops telemetry:", err);
    } finally {
      setIsSitrepLoading(false);
    }
  }, []);

  const loadSitrepData = useCallback(() => loadAllData(selectedDate, true), [loadAllData, selectedDate]);
  const loadNutritionData = useCallback(() => loadAllData(selectedDate, true), [loadAllData, selectedDate]);

  useEffect(() => {
    loadAllData(selectedDate);
  }, [loadAllData, selectedDate]);

  // Macro Totals calculated from live food entries
  const totals = useMemo(() => {
    if (!entries || entries.length === 0) return undefined;
    return entries.reduce(
      (acc, curr) => ({
        calories: acc.calories + (Number(curr.calories) || 0),
        protein: acc.protein + (Number(curr.protein_g) || 0),
        carbs: acc.carbs + (Number(curr.carbs_g) || 0),
        fat: acc.fat + (Number(curr.fat_g) || 0),
        water_oz: acc.water_oz + (Number(curr.water_oz) || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, water_oz: 0 }
    );
  }, [entries]);

  // Database persistence helpers
  const updateSitrepField = async (
    partial: Partial<DailySitrepLog> | Record<string, any>,
    expectedWaterSeq?: number
  ) => {
    try {
      const payload = {
        log_date: selectedDate,
        morning_weight_lbs: todayLog?.morning_weight_lbs ?? null,
        total_steps: todayLog?.total_steps ?? 0,
        calories_eaten: totals?.calories || todayLog?.calories_eaten || 0,
        kcal_burned: todayLog?.kcal_burned ?? 0,
        protein_g: totals?.protein || todayLog?.protein_g || 0,
        water_oz: waterOzRef.current,
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
        const data = await res.json();
        const savedLog = data.entry || data.log || data.todayLog;
        if (savedLog) {
          // If a newer water click happened while this request was in flight, keep the latest water_oz
          const mergedLog =
            expectedWaterSeq !== undefined && expectedWaterSeq < waterSeqRef.current
              ? { ...savedLog, water_oz: waterOzRef.current }
              : savedLog;
          setTodayLog(mergedLog);
          setSitrepHistory((prev) => {
            const idx = prev.findIndex((h) => h.log_date === selectedDate);
            if (idx >= 0) {
              const updated = [...prev];
              updated[idx] = mergedLog;
              return updated;
            }
            return [mergedLog, ...prev];
          });
        }
      }
    } catch (err) {
      console.error("Failed to update sitrep field:", err);
    }
  };

  const handleQuickAddWater = async (deltaOz: number) => {
    const seq = ++waterSeqRef.current;
    const nextWater = Math.max(0, +(waterOzRef.current + deltaOz).toFixed(1));
    waterOzRef.current = nextWater;

    // 1. Optimistic update immediately for zero-lag UI response
    setTodayLog((prev) =>
      prev
        ? { ...prev, water_oz: nextWater }
        : {
            id: "temp-sitrep",
            user_id: "",
            log_date: selectedDate,
            morning_weight_lbs: null,
            moving_avg_7d_lbs: null,
            total_steps: 0,
            miles: 0,
            calories_eaten: totals?.calories || 0,
            kcal_burned: 0,
            kcal_deficit: 0,
            protein_g: totals?.protein || 0,
            water_oz: nextWater,
            sleep_hours: null,
            recovery_score: null,
            lift_completed: false,
            cardio_completed: false,
            fasting_hours: null,
            sitrep_grade: "partial",
            notes: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
    );

    // Invalidate cached copy so fresh data persists
    delete cacheRef.current[selectedDate];

    // 2. Persist to sitrep database
    await updateSitrepField({ water_oz: nextWater }, seq);
  };

  const handleSetWater = async (totalOz: number) => {
    const seq = ++waterSeqRef.current;
    const nextWater = Math.max(0, +totalOz.toFixed(1));
    waterOzRef.current = nextWater;

    // 1. Optimistic update immediately for zero-lag UI response
    setTodayLog((prev) =>
      prev
        ? { ...prev, water_oz: nextWater }
        : {
            id: "temp-sitrep",
            user_id: "",
            log_date: selectedDate,
            morning_weight_lbs: null,
            moving_avg_7d_lbs: null,
            total_steps: 0,
            miles: 0,
            calories_eaten: totals?.calories || 0,
            kcal_burned: 0,
            kcal_deficit: 0,
            protein_g: totals?.protein || 0,
            water_oz: nextWater,
            sleep_hours: null,
            recovery_score: null,
            lift_completed: false,
            cardio_completed: false,
            fasting_hours: null,
            sitrep_grade: "partial",
            notes: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
    );

    delete cacheRef.current[selectedDate];
    await updateSitrepField({ water_oz: nextWater }, seq);
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
      eyebrow="Health & Nutrition"
      title="Nutrition & Hydration"
      subtitle="Daily macros, voice food logging, fasting rhythm, and water intake"
      accentColor="#06b6d4"
      fullBleed={true}
      headerActions={
        <div className="flex items-center gap-2">
          {/* Tab Switcher */}
          <div
            className="flex items-center p-1 rounded-xl text-xs font-mono border transition-colors"
            style={{
              backgroundColor: "var(--glass-surface-elevated)",
              borderColor: "var(--glass-border)",
            }}
          >
            <button
              onClick={() => setActiveTab("vitality")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-bold ${
                activeTab === "vitality"
                  ? "bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
              }`}
            >
              <Flame size={13} />
              <span>VITALITY COCKPIT</span>
            </button>

            <button
              onClick={() => setActiveTab("sitrep")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-bold ${
                activeTab === "sitrep"
                  ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
              }`}
            >
              <Activity size={13} />
              <span>SITREP &amp; RECHARTS</span>
            </button>

            <button
              onClick={() => setActiveTab("mealplan")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-bold ${
                activeTab === "mealplan"
                  ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
              }`}
            >
              <Utensils size={13} />
              <span>MEAL PROTOCOL</span>
            </button>
          </div>

          {/* Refresh */}
          <button
            onClick={() => loadAllData(selectedDate, true)}
            className="p-2 rounded-xl border transition-colors"
            style={{
              backgroundColor: "var(--glass-surface-elevated)",
              borderColor: "var(--glass-border)",
              color: "var(--glass-text-muted)",
            }}
            title="Refresh Telemetry"
          >
            <RefreshCw size={14} className={isSitrepLoading ? "animate-spin text-cyan-400" : ""} />
          </button>
        </div>
      }
    >
      <div className="min-h-screen bg-transparent text-[var(--glass-text-primary)] w-full transition-colors duration-300">
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
              onOpenLogMeal={() => {
                setAutoStartVoice(false);
                setIsMealModalOpen(true);
              }}
              onOpenVoiceLog={() => {
                setAutoStartVoice(true);
                setIsMealModalOpen(true);
              }}
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
                  totals={totals}
                  onQuickAddWater={handleQuickAddWater}
                  onSetWater={handleSetWater}
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
                  onOpenAddMeal={() => {
                    setAutoStartVoice(false);
                    setIsMealModalOpen(true);
                  }}
                  onOpenVoiceMeal={() => {
                    setAutoStartVoice(true);
                    setIsMealModalOpen(true);
                  }}
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
              <div
                className="p-5 rounded-2xl border shadow-2xl space-y-3 transition-colors"
                style={{
                  backgroundColor: "var(--glass-surface)",
                  borderColor: "var(--glass-border)",
                }}
              >
                <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--glass-border)" }}>
                  <div className="flex items-center gap-2">
                    <TrendingDown size={16} className="text-amber-400" />
                    <div>
                      <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
                        Weight Trajectory &amp; 7-Day Moving Average
                      </h4>
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                        Daily scale readings vs. trailing 7-day average against the {targetWeightLbs} lbs target line
                      </p>
                    </div>
                  </div>
                </div>
                <WeightTrajectoryChart data={sitrepHistory} targetWeightLbs={targetWeightLbs} />
              </div>

              <div
                className="p-5 rounded-2xl border shadow-2xl space-y-3 transition-colors"
                style={{
                  backgroundColor: "var(--glass-surface)",
                  borderColor: "var(--glass-border)",
                }}
              >
                <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--glass-border)" }}>
                  <div className="flex items-center gap-2">
                    <BarChart3 size={16} className="text-rose-400" />
                    <div>
                      <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
                        Caloric Energy Balance &amp; Deficit
                      </h4>
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                        Intake vs. expenditure with daily net deficit margin (target &ge; 350 kcal)
                      </p>
                    </div>
                  </div>
                </div>
                <CaloricBalanceChart data={sitrepHistory} />
              </div>
            </div>

            <div
              className="p-5 rounded-2xl border shadow-2xl space-y-3 transition-colors"
              style={{
                backgroundColor: "var(--glass-surface)",
                borderColor: "var(--glass-border)",
              }}
            >
              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--glass-border)" }}>
                <div className="flex items-center gap-2">
                  <Activity size={16} className="text-cyan-400" />
                  <div>
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
                      Physical Activity &amp; Protein Consistency
                    </h4>
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                      Step volume (miles) and protein intake against the 10,000 steps and 160g thresholds
                    </p>
                  </div>
                </div>
              </div>
              <MacroStepConsistencyChart data={sitrepHistory} />
            </div>

            <div
              className="p-5 rounded-2xl border shadow-2xl transition-colors"
              style={{
                backgroundColor: "var(--glass-surface)",
                borderColor: "var(--glass-border)",
              }}
            >
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
        autoStartVoice={autoStartVoice}
        onClose={() => {
          setIsMealModalOpen(false);
          setAutoStartVoice(false);
        }}
        selectedDate={selectedDate}
        onSaved={() => {
          loadNutritionData();
          loadSitrepData();
        }}
      />
    </ExecutiveModuleShell>
  );
}
