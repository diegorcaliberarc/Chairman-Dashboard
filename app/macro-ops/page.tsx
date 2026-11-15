"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ExecutiveModuleShell } from "@/components/chairman/ExecutiveModuleShell";
import { TopKpiStrip } from "@/components/sitrep/TopKpiStrip";
import { FastDailyEntryForm } from "@/components/sitrep/FastDailyEntryForm";
import { WeightTrajectoryChart } from "@/components/sitrep/WeightTrajectoryChart";
import { CaloricBalanceChart } from "@/components/sitrep/CaloricBalanceChart";
import { MacroStepConsistencyChart } from "@/components/sitrep/MacroStepConsistencyChart";
import { SitrepHistoryTable } from "@/components/sitrep/SitrepHistoryTable";
import { QuickDebriefDrawer } from "@/components/sitrep/QuickDebriefDrawer";
import { FastingTimerCard } from "@/components/FastingTimerCard";
import { FoodLoggerCard } from "@/components/FoodLoggerCard";
import { FoodFeedCard, FoodEntry } from "@/components/FoodFeedCard";
import { MealPlanCard, MealPlanRecord } from "@/components/MealPlanCard";
import { MacroTelemetryCard } from "@/components/MacroTelemetryCard";
import { DailySitrepLog } from "@/lib/commandTypes";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Activity,
  Utensils,
  Moon,
  Sparkles,
  TrendingDown,
  BarChart3,
  ListFilter,
  ShieldCheck,
} from "lucide-react";

function getTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function MacroOpsPage() {
  const [activeTab, setActiveTab] = useState<"sitrep" | "nutrition">("sitrep");
  const [selectedDate, setSelectedDate] = useState<string>(getTodayIso());
  const [isDebriefOpen, setIsDebriefOpen] = useState(false);

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

  // Nutrition state (Legacy support)
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

  // Load legacy nutrition data
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
      console.error("Error loading legacy nutrition:", e);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadSitrepData();
    loadNutritionData();
  }, [loadSitrepData, loadNutritionData]);

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
  };

  return (
    <ExecutiveModuleShell
      moduleId="MACRO_OPS"
      eyebrow="Objective 155 Sovereign Telemetry"
      title="Daily SITREP & Biometric Console"
      subtitle="15-Column Biometric Tracker, 7-Day Moving Average Trigger, Caloric Deficit & Mission Grades"
      accentColor="#f59e0b"
      headerActions={
        <div className="flex items-center gap-2">
          {/* Tab Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-zinc-900 border border-white/10 text-xs font-mono">
            <button
              onClick={() => setActiveTab("sitrep")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-bold ${
                activeTab === "sitrep"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Activity size={13} />
              <span>SITREP & RECHARTS</span>
            </button>
            <button
              onClick={() => setActiveTab("nutrition")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-bold ${
                activeTab === "nutrition"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Utensils size={13} />
              <span>FOOD LEDGER</span>
            </button>
          </div>

          {/* Quick Debrief Button */}
          <button
            onClick={() => setIsDebriefOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold font-mono text-xs tracking-wider shadow-lg active:scale-95 transition"
          >
            <Moon size={13} />
            <span>QUICK DEBRIEF</span>
          </button>

          {/* Refresh */}
          <button
            onClick={() => {
              loadSitrepData();
              loadNutritionData();
            }}
            className="p-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white hover:border-zinc-700 transition"
            title="Refresh Telemetry"
          >
            <RefreshCw size={14} className={isSitrepLoading ? "animate-spin text-amber-400" : ""} />
          </button>
        </div>
      }
    >
      <div className="min-h-screen bg-[#07090E] text-zinc-100 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {activeTab === "sitrep" ? (
          <>
            {/* 1. TOP KPI STRIP */}
            <TopKpiStrip stats={sitrepStats} todayLog={todayLog} />

            {/* 2. FAST DAILY ENTRY FORM (DATE STEPPER + 1-CLICK UPSERT) */}
            <FastDailyEntryForm
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
              existingLog={todayLog}
              onSaved={loadSitrepData}
            />

            {/* 3. RECHARTS TREND DECK (3 EXPANDED TELEMETRY CHARTS) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Weight Trajectory vs 7-Day Moving Avg vs 155 Target */}
              <div className="p-5 rounded-2xl bg-zinc-950/60 border border-white/10 backdrop-blur-xl shadow-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <TrendingDown size={16} className="text-amber-400" />
                    <div>
                      <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                        Weight Trajectory & 7-Day Moving Average
                      </h4>
                      <p className="text-[11px] text-zinc-400">
                        Daily scale readings vs. trailing 7-day average against the {targetWeightLbs} lbs target line
                      </p>
                    </div>
                  </div>
                </div>
                <WeightTrajectoryChart data={sitrepHistory} targetWeightLbs={targetWeightLbs} />
              </div>

              {/* Caloric Energy Balance & Net Deficit */}
              <div className="p-5 rounded-2xl bg-zinc-950/60 border border-white/10 backdrop-blur-xl shadow-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <BarChart3 size={16} className="text-rose-400" />
                    <div>
                      <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                        Caloric Energy Balance & Deficit
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

            {/* Step Count & Protein Consistency */}
            <div className="p-5 rounded-2xl bg-zinc-950/60 border border-white/10 backdrop-blur-xl shadow-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Activity size={16} className="text-cyan-400" />
                  <div>
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                      Physical Activity & Protein Consistency
                    </h4>
                    <p className="text-[11px] text-zinc-400">
                      Step volume (miles) and protein intake against the 10,000 steps and 160g thresholds
                    </p>
                  </div>
                </div>
              </div>
              <MacroStepConsistencyChart data={sitrepHistory} />
            </div>

            {/* 4. SORTABLE HISTORICAL TELEMETRY TABLE WITH CSV EXPORT */}
            <div className="p-5 rounded-2xl bg-zinc-950/60 border border-white/10 backdrop-blur-xl shadow-2xl">
              <SitrepHistoryTable
                data={sitrepHistory}
                onRefresh={loadSitrepData}
                onEditItem={(item) => setSelectedDate(item.log_date)}
              />
            </div>
          </>
        ) : (
          /* NUTRITIONAL LEDGER & FOOD LOGGER TAB */
          <div className="space-y-6">
            <FastingTimerCard />
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
    </ExecutiveModuleShell>
  );
}
