"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Calendar,
  Clock,
  Droplets,
  Flame,
  Plus,
  RefreshCw,
  Scale,
  Sparkles,
  Trash2,
  Utensils,
  Zap,
} from "lucide-react";
import { ExecutiveModuleShell } from "@/components/chairman/ExecutiveModuleShell";

interface FoodItemEntry {
  name: string;
  scale: number;
  grams: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  sodium_mg: number;
}

interface MealRecord {
  id: string;
  daily_log_id: string;
  name: string;
  meal_slot: string;
  logged_at: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  sodium_mg: number;
  weight_g: number;
  food_items: FoodItemEntry[];
}

interface DailyLogRecord {
  id: string;
  date: string;
  calorie_preset: string;
  target_calories: number;
  target_protein: number;
  target_carbs: number;
  target_fats: number;
  target_sodium_mg: number;
  consumed_calories: number;
  consumed_protein: number;
  consumed_carbs: number;
  consumed_fats: number;
  consumed_sodium_mg: number;
  total_water_fl_oz: number;
  total_weight_consumed_lbs: number;
}

interface PresetOption {
  key: string;
  label: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  sodiumMg: number;
}

interface StapleTemplate {
  id: string;
  name: string;
  prepTag: string;
  accent: string;
  baseGrams: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
  sodiumMg: number;
}

const STAPLE_TEMPLATES: StapleTemplate[] = [
  {
    id: "chicken_breast",
    name: "Air-Fried Chicken Breast",
    prepTag: "Lean Anabolic Anchor · 390°F 14m",
    accent: "#10b981",
    baseGrams: 200,
    calories: 330,
    proteinG: 62.0,
    carbsG: 0.0,
    fatsG: 7.2,
    sodiumMg: 380,
  },
  {
    id: "russet_potatoes",
    name: "Russet Potatoes",
    prepTag: "Potassium & Fast Glycogen · Air-Crisped",
    accent: "#f59e0b",
    baseGrams: 250,
    calories: 232,
    proteinG: 6.3,
    carbsG: 53.0,
    fatsG: 0.3,
    sodiumMg: 240,
  },
  {
    id: "jasmine_rice",
    name: "Jasmine White Rice",
    prepTag: "Low-Residue Clean Carb · Steamed",
    accent: "#38bdf8",
    baseGrams: 200,
    calories: 260,
    proteinG: 4.8,
    carbsG: 56.0,
    fatsG: 0.4,
    sodiumMg: 120,
  },
  {
    id: "steamed_broccoli",
    name: "Steamed Broccoli / Veg",
    prepTag: "Sulforaphane & Micronutrient Fiber",
    accent: "#22c55e",
    baseGrams: 150,
    calories: 52,
    proteinG: 4.2,
    carbsG: 10.8,
    fatsG: 0.6,
    sodiumMg: 65,
  },
  {
    id: "ribeye_steak",
    name: "Cast-Iron Ribeye Steak",
    prepTag: "Creatine, Zinc & Satiety · Reverse Sear",
    accent: "#ef4444",
    baseGrams: 225,
    calories: 610,
    proteinG: 54.0,
    carbsG: 0.0,
    fatsG: 43.0,
    sodiumMg: 520,
  },
];

const DEFAULT_PRESETS: PresetOption[] = [
  { key: "1250_cut", label: "1,250 Cut", calories: 1250, protein: 175, carbs: 65, fats: 32, sodiumMg: 2200 },
  { key: "1500_rest", label: "1,500 Rest Day", calories: 1500, protein: 180, carbs: 100, fats: 42, sodiumMg: 2300 },
  { key: "1750_training", label: "1,750 Training Day", calories: 1750, protein: 185, carbs: 145, fats: 48, sodiumMg: 2500 },
  { key: "2200_refeed", label: "2,200 Refeed", calories: 2200, protein: 185, carbs: 255, fats: 49, sodiumMg: 2800 },
];

const MEAL_SLOTS = ["Meal 1", "Meal 2", "Meal 3", "Intra / Snack"];
const PORTION_STEPS = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
const WATER_TARGET_OZ = 128;

function getTodayIso(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(
    n.getDate()
  ).padStart(2, "0")}`;
}

function getCurrentHHMM(): string {
  const n = new Date();
  return `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
}

function MacroRingCard({
  label,
  value,
  target,
  unit,
  color,
  subtext,
}: {
  label: string;
  value: number;
  target: number;
  unit: string;
  color: string;
  subtext: string;
}) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  const over = target > 0 && value > target;
  const strokeOffset = circumference - (Math.min(pct, 100) / 100) * circumference;

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 flex items-center gap-4 backdrop-blur-md">
      <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 88 88">
          <circle
            cx="44"
            cy="44"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="7"
          />
          <circle
            cx="44"
            cy="44"
            r={radius}
            fill="none"
            stroke={over ? "#f43f5e" : color}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeOffset}
            style={{ transition: "stroke-dashoffset 0.55s cubic-bezier(0.22, 1, 0.36, 1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xs font-bold font-mono text-white">{pct}%</span>
          <span className="text-[9px] uppercase tracking-wider text-zinc-400">{unit}</span>
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">
          {label}
        </div>
        <div className="mt-1 flex items-baseline gap-1.5 font-mono">
          <span className="text-xl font-bold text-white">{Math.round(value).toLocaleString()}</span>
          <span className="text-xs text-zinc-400">
            / {Math.round(target).toLocaleString()} {unit}
          </span>
        </div>
        <div className="mt-2 h-1.5 w-full rounded-full bg-white/[0.07] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, (value / Math.max(1, target)) * 100)}%`,
              backgroundColor: over ? "#f43f5e" : color,
            }}
          />
        </div>
        <div className="mt-1.5 text-[10px] text-zinc-400 truncate">{subtext}</div>
      </div>
    </div>
  );
}

export default function MacroOpsPage() {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayIso);
  const [dailyLog, setDailyLog] = useState<DailyLogRecord | null>(null);
  const [meals, setMeals] = useState<MealRecord[]>([]);
  const [presets, setPresets] = useState<PresetOption[]>(DEFAULT_PRESETS);
  const [loading, setLoading] = useState<boolean>(true);
  const [mutating, setMutating] = useState<boolean>(false);

  // Meal builder state
  const [selectedSlot, setSelectedSlot] = useState<string>("Meal 1");
  const [mealTimeHHMM, setMealTimeHHMM] = useState<string>(getCurrentHHMM);
  const [scales, setScales] = useState<Record<string, number>>({
    chicken_breast: 1.0,
    russet_potatoes: 1.0,
    jasmine_rice: 1.0,
    steamed_broccoli: 1.0,
    ribeye_steak: 1.0,
  });
  const [plateTray, setPlateTray] = useState<FoodItemEntry[]>([]);
  const [plateCustomTitle, setPlateCustomTitle] = useState<string>("");
  const [builderTab, setBuilderTab] = useState<"staples" | "custom">("staples");

  // Custom meal inputs
  const [customMeal, setCustomMeal] = useState({
    name: "",
    calories: "450",
    proteinG: "45",
    carbsG: "35",
    fatsG: "12",
    sodiumMg: "420",
    weightG: "340",
  });

  // Hovered meal on Circadian Digestion SVG
  const [activeMealHoverId, setActiveMealHoverId] = useState<string | null>(null);
  const [nowHourFloat, setNowHourFloat] = useState<number>(13.5);

  useEffect(() => {
    const updateClock = () => {
      const n = new Date();
      setNowHourFloat(n.getHours() + n.getMinutes() / 60);
    };
    updateClock();
    const id = setInterval(updateClock, 30000);
    return () => clearInterval(id);
  }, []);

  const fetchNutrition = useCallback(async (dateStr: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/nutrition?date=${encodeURIComponent(dateStr)}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (data.dailyLog) setDailyLog(data.dailyLog);
      if (Array.isArray(data.meals)) setMeals(data.meals);
      if (Array.isArray(data.presets) && data.presets.length > 0) {
        setPresets(data.presets);
      }
    } catch (err) {
      console.error("Failed to fetch MacroOps data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNutrition(selectedDate);
  }, [selectedDate, fetchNutrition]);

  const applyPayload = (data: any) => {
    if (data?.dailyLog) setDailyLog(data.dailyLog);
    if (Array.isArray(data?.meals)) setMeals(data.meals);
  };

  const handleSetPreset = async (presetKey: string) => {
    setMutating(true);
    try {
      const res = await fetch("/api/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set_preset",
          date: selectedDate,
          presetKey,
        }),
      });
      const data = await res.json();
      applyPayload(data);
    } finally {
      setMutating(false);
    }
  };

  const handleAddWater = async (deltaFlOz: number) => {
    setMutating(true);
    try {
      const res = await fetch("/api/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_water",
          date: selectedDate,
          deltaFlOz,
        }),
      });
      const data = await res.json();
      applyPayload(data);
    } finally {
      setMutating(false);
    }
  };

  const buildTimestampFromInput = () => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const [hh, mm] = mealTimeHHMM.split(":").map(Number);
    return new Date(y, (m || 1) - 1, d || 1, hh || 12, mm || 0, 0).toISOString();
  };

  const computeScaledStaple = (t: StapleTemplate, mult: number): FoodItemEntry => ({
    name: t.name,
    scale: mult,
    grams: Math.round(t.baseGrams * mult),
    calories: Math.round(t.calories * mult),
    protein_g: Number((t.proteinG * mult).toFixed(1)),
    carbs_g: Number((t.carbsG * mult).toFixed(1)),
    fats_g: Number((t.fatsG * mult).toFixed(1)),
    sodium_mg: Math.round(t.sodiumMg * mult),
  });

  const handleQuickLogStaple = async (t: StapleTemplate) => {
    const mult = scales[t.id] ?? 1.0;
    const item = computeScaledStaple(t, mult);
    setMutating(true);
    try {
      const res = await fetch("/api/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "log_meal",
          date: selectedDate,
          name: `${t.name} (${mult}x · ${item.grams}g)`,
          mealSlot: selectedSlot,
          loggedAt: buildTimestampFromInput(),
          calories: item.calories,
          proteinG: item.protein_g,
          carbsG: item.carbs_g,
          fatsG: item.fats_g,
          sodiumMg: item.sodium_mg,
          weightG: item.grams,
          foodItems: [item],
        }),
      });
      const data = await res.json();
      applyPayload(data);
    } finally {
      setMutating(false);
    }
  };

  const handleAddToPlateTray = (t: StapleTemplate) => {
    const mult = scales[t.id] ?? 1.0;
    const item = computeScaledStaple(t, mult);
    setPlateTray((prev) => [...prev, item]);
  };

  const handleCommitPlateTray = async () => {
    if (plateTray.length === 0) return;
    const totals = plateTray.reduce(
      (acc, i) => ({
        grams: acc.grams + i.grams,
        calories: acc.calories + i.calories,
        protein: acc.protein + i.protein_g,
        carbs: acc.carbs + i.carbs_g,
        fats: acc.fats + i.fats_g,
        sodium: acc.sodium + i.sodium_mg,
      }),
      { grams: 0, calories: 0, protein: 0, carbs: 0, fats: 0, sodium: 0 }
    );

    const autoTitle =
      plateCustomTitle.trim() ||
      `${selectedSlot}: ${plateTray.map((p) => p.name.split(" ")[0]).join(" + ")}`;

    setMutating(true);
    try {
      const res = await fetch("/api/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "log_meal",
          date: selectedDate,
          name: autoTitle.slice(0, 100),
          mealSlot: selectedSlot,
          loggedAt: buildTimestampFromInput(),
          calories: totals.calories,
          proteinG: Number(totals.protein.toFixed(1)),
          carbsG: Number(totals.carbs.toFixed(1)),
          fatsG: Number(totals.fats.toFixed(1)),
          sodiumMg: totals.sodium,
          weightG: totals.grams,
          foodItems: plateTray,
        }),
      });
      const data = await res.json();
      applyPayload(data);
      setPlateTray([]);
      setPlateCustomTitle("");
    } finally {
      setMutating(false);
    }
  };

  const handleLogCustomMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMeal.name.trim()) return;
    setMutating(true);
    try {
      const res = await fetch("/api/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "log_meal",
          date: selectedDate,
          name: customMeal.name.trim(),
          mealSlot: selectedSlot,
          loggedAt: buildTimestampFromInput(),
          calories: Number(customMeal.calories || 0),
          proteinG: Number(customMeal.proteinG || 0),
          carbsG: Number(customMeal.carbsG || 0),
          fatsG: Number(customMeal.fatsG || 0),
          sodiumMg: Number(customMeal.sodiumMg || 0),
          weightG: Number(customMeal.weightG || 100),
          foodItems: [
            {
              name: customMeal.name.trim(),
              scale: 1,
              grams: Number(customMeal.weightG || 100),
              calories: Number(customMeal.calories || 0),
              protein_g: Number(customMeal.proteinG || 0),
              carbs_g: Number(customMeal.carbsG || 0),
              fats_g: Number(customMeal.fatsG || 0),
              sodium_mg: Number(customMeal.sodiumMg || 0),
            },
          ],
        }),
      });
      const data = await res.json();
      applyPayload(data);
      setCustomMeal((prev) => ({ ...prev, name: "" }));
    } finally {
      setMutating(false);
    }
  };

  const handleDeleteMeal = async (mealId: string) => {
    setMutating(true);
    try {
      const res = await fetch(
        `/api/nutrition?mealId=${encodeURIComponent(mealId)}&date=${encodeURIComponent(
          selectedDate
        )}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      applyPayload(data);
    } finally {
      setMutating(false);
    }
  };

  // Physical weight calculations (exact formula: grams/453.592 + fl_oz*0.0652)
  const physicalMetrics = useMemo(() => {
    const solidGrams = meals.reduce((sum, m) => sum + Number(m.weight_g || 0), 0);
    const solidLbs = solidGrams / 453.592;
    const waterFlOz = Number(dailyLog?.total_water_fl_oz || 0);
    const waterLbs = waterFlOz * 0.0652;
    const totalLbs = solidLbs + waterLbs;
    return {
      solidGrams,
      solidLbs,
      waterFlOz,
      waterLbs,
      totalLbs,
    };
  }, [meals, dailyLog]);

  // Circadian SVG curve points (insulin sensitivity peaks 08:30–13:00, tapers late evening)
  const insulinCurvePath = useMemo(() => {
    const width = 920;
    const height = 190;
    const padX = 36;
    const usableW = width - padX * 2;
    const pts: string[] = [];
    for (let h = 0; h <= 24; h += 0.5) {
      const x = padX + (h / 24) * usableW;
      // Physiological circadian insulin sensitivity profile
      const morningPeak = Math.exp(-Math.pow((h - 10.5) / 4.2, 2)) * 0.78;
      const postWorkout = Math.exp(-Math.pow((h - 15.0) / 3.0, 2)) * 0.32;
      const baseline = 0.16;
      const norm = Math.min(0.96, baseline + morningPeak + postWorkout);
      const y = height - 28 - norm * 130;
      pts.push(`${h === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    return pts.join(" ");
  }, []);

  const consumedCal = Number(dailyLog?.consumed_calories || 0);
  const targetCal = Number(dailyLog?.target_calories || 1750);
  const remainingCal = targetCal - consumedCal;
  const sodiumConsumed = Number(dailyLog?.consumed_sodium_mg || 0);
  const sodiumTarget = Number(dailyLog?.target_sodium_mg || 2500);
  const waterOz = Number(dailyLog?.total_water_fl_oz || 0);

  return (
    <ExecutiveModuleShell
      moduleId="MACRO_OPS"
      eyebrow="Section 09 · Metabolic Engine"
      title="MacroOps — Nutrition & Biometric Fuel"
      subtitle="Real-time macro rings, physical intake mass (lbs), dynamic staple scaling, and circadian digestion arcs."
      accentColor="#10b981"
      headerActions={
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs">
            <Calendar size={13} className="text-emerald-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-zinc-100 font-mono text-xs focus:outline-none"
            />
          </div>
          <button
            onClick={() => fetchNutrition(selectedDate)}
            disabled={loading || mutating}
            className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 transition"
          >
            <RefreshCw size={13} className={loading || mutating ? "animate-spin text-emerald-400" : "text-zinc-400"} />
            Sync
          </button>
        </div>
      }
    >
      {/* Calorie Cycling 1-Click Presets */}
      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-400 flex items-center gap-1.5">
            <Zap size={12} /> Calorie Cycling Protocol
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            One-click macro target recalibration persisted to Supabase PostgreSQL
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {presets.map((preset) => {
            const active = dailyLog?.calorie_preset === preset.key;
            return (
              <button
                key={preset.key}
                onClick={() => handleSetPreset(preset.key)}
                disabled={mutating}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold tracking-wider transition-all border ${
                  active
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                    : "bg-white/[0.03] text-zinc-300 border-white/10 hover:bg-white/[0.07]"
                }`}
              >
                <div>{preset.label}</div>
                <div className="text-[10px] font-mono font-normal opacity-80 mt-0.5">
                  {preset.protein}P · {preset.carbs}C · {preset.fats}F
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Primary Macro Rings */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MacroRingCard
          label="Daily Calories"
          value={consumedCal}
          target={targetCal}
          unit="kcal"
          color="#10b981"
          subtext={
            remainingCal >= 0
              ? `${remainingCal.toLocaleString()} kcal remaining in budget`
              : `${Math.abs(remainingCal).toLocaleString()} kcal surplus over target`
          }
        />
        <MacroRingCard
          label="Protein Synthesis"
          value={Number(dailyLog?.consumed_protein || 0)}
          target={Number(dailyLog?.target_protein || 185)}
          unit="g"
          color="#38bdf8"
          subtext="Muscle preservation & thermic anchor"
        />
        <MacroRingCard
          label="Carbohydrates"
          value={Number(dailyLog?.consumed_carbs || 0)}
          target={Number(dailyLog?.target_carbs || 145)}
          unit="g"
          color="#f59e0b"
          subtext="Glycogen & CNS output fuel"
        />
        <MacroRingCard
          label="Dietary Fats"
          value={Number(dailyLog?.consumed_fats || 0)}
          target={Number(dailyLog?.target_fats || 48)}
          unit="g"
          color="#a855f7"
          subtext="Endocrine & lipid-soluble baseline"
        />
      </section>

      {/* Hydration + Sodium + Physical Consumed Mass (lbs) Telemetry Row */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Total Consumed Physical Weight Metric (lbs) */}
        <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/[0.09] via-white/[0.02] to-transparent p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-400 flex items-center gap-1.5">
                <Scale size={13} /> Total Consumed Physical Mass
              </div>
              <div className="mt-2 flex items-baseline gap-2 font-mono">
                <span className="text-3xl font-bold text-white">
                  {physicalMetrics.totalLbs.toFixed(2)}
                </span>
                <span className="text-sm font-semibold text-emerald-300">lbs ingested</span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-400/30 text-[10px] font-mono text-emerald-300">
              Gut + Fluid Load
            </span>
          </div>

          <div className="mt-4 space-y-2">
            <div className="h-2.5 w-full rounded-full bg-black/40 overflow-hidden flex border border-white/10">
              <div
                className="h-full bg-amber-400 transition-all duration-500"
                style={{
                  width: `${
                    physicalMetrics.totalLbs > 0
                      ? (physicalMetrics.solidLbs / physicalMetrics.totalLbs) * 100
                      : 50
                  }%`,
                }}
                title="Solid Food Mass"
              />
              <div
                className="h-full bg-sky-400 transition-all duration-500"
                style={{
                  width: `${
                    physicalMetrics.totalLbs > 0
                      ? (physicalMetrics.waterLbs / physicalMetrics.totalLbs) * 100
                      : 50
                  }%`,
                }}
                title="Fluid Mass"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              <div className="rounded-xl bg-black/30 border border-white/[0.06] p-2.5">
                <div className="text-[10px] uppercase tracking-wider text-amber-300">
                  Solid Food Weight
                </div>
                <div className="font-mono font-bold text-white mt-0.5">
                  {physicalMetrics.solidLbs.toFixed(2)} lbs{" "}
                  <span className="text-zinc-400 font-normal">
                    ({Math.round(physicalMetrics.solidGrams)}g)
                  </span>
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">grams / 453.592</div>
              </div>
              <div className="rounded-xl bg-black/30 border border-white/[0.06] p-2.5">
                <div className="text-[10px] uppercase tracking-wider text-sky-300">
                  Hydration Mass
                </div>
                <div className="font-mono font-bold text-white mt-0.5">
                  {physicalMetrics.waterLbs.toFixed(2)} lbs{" "}
                  <span className="text-zinc-400 font-normal">
                    ({Math.round(physicalMetrics.waterFlOz)} oz)
                  </span>
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">fl_oz × 0.0652</div>
              </div>
            </div>
          </div>
        </div>

        {/* Hydration Tank */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-sky-400 flex items-center gap-1.5">
                <Droplets size={13} /> Hydration & Plasma Volume
              </div>
              <span className="text-xs font-mono text-sky-300">
                {Math.round((waterOz / WATER_TARGET_OZ) * 100)}% of 1 Gal
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2 font-mono">
              <span className="text-3xl font-bold text-white">{waterOz.toFixed(0)}</span>
              <span className="text-xs text-zinc-400">/ {WATER_TARGET_OZ} fl oz</span>
            </div>
            <div className="mt-3 h-2.5 w-full rounded-full bg-white/[0.07] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-300 transition-all duration-500"
                style={{ width: `${Math.min(100, (waterOz / WATER_TARGET_OZ) * 100)}%` }}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleAddWater(8)}
              disabled={mutating}
              className="flex-1 py-2 px-3 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/35 text-sky-200 font-mono text-xs font-bold transition"
            >
              +8 oz
            </button>
            <button
              onClick={() => handleAddWater(16)}
              disabled={mutating}
              className="flex-1 py-2 px-3 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/45 text-sky-100 font-mono text-xs font-bold transition"
            >
              +16 oz
            </button>
            <button
              onClick={() => handleAddWater(32)}
              disabled={mutating}
              className="py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 text-zinc-200 font-mono text-xs font-semibold transition"
            >
              +32 oz
            </button>
            <button
              onClick={() => handleAddWater(-8)}
              disabled={mutating || waterOz <= 0}
              className="py-2 px-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-zinc-400 font-mono text-xs transition disabled:opacity-40"
            >
              -8
            </button>
          </div>
        </div>

        {/* Sodium & Electrolyte Retention */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-400 flex items-center gap-1.5">
                <Flame size={13} /> Sodium & Osmotic Balance
              </div>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  sodiumConsumed > sodiumTarget
                    ? "text-rose-300 border-rose-500/40 bg-rose-500/10"
                    : "text-emerald-300 border-emerald-500/30 bg-emerald-500/10"
                }`}
              >
                {sodiumConsumed > sodiumTarget ? "HIGH RETENTION RISK" : "OSMOTIC NOMINAL"}
              </span>
            </div>

            <div className="mt-2 flex items-baseline gap-2 font-mono">
              <span className="text-3xl font-bold text-white">
                {sodiumConsumed.toLocaleString()}
              </span>
              <span className="text-xs text-zinc-400">
                / {sodiumTarget.toLocaleString()} mg Na+
              </span>
            </div>

            <div className="mt-3 h-2.5 w-full rounded-full bg-white/[0.07] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (sodiumConsumed / Math.max(1, sodiumTarget)) * 100)}%`,
                  backgroundColor: sodiumConsumed > sodiumTarget ? "#f43f5e" : "#f59e0b",
                }}
              />
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-black/30 border border-white/[0.06] p-3 text-xs text-zinc-300 flex items-center justify-between">
            <span>Na+ / Water Ratio</span>
            <span className="font-mono font-bold text-amber-300">
              {waterOz > 0 ? `${Math.round(sodiumConsumed / waterOz)} mg / fl oz` : "—"}
            </span>
          </div>
        </div>
      </section>

      {/* Circadian Digestion & Insulin Sensitivity Curve */}
      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-400 flex items-center gap-1.5">
              <Activity size={13} /> Circadian Digestion & Insulin Sensitivity Timeline
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Morning insulin sensitivity peak, 18h intermittent fasting window (18:00–12:00), and 3.5h gastric clearance arcs
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1.5 text-indigo-300">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500/35 border border-indigo-400/50" />
              18h Fasting Window
            </span>
            <span className="flex items-center gap-1.5 text-emerald-300">
              <span className="w-4 h-0.5 bg-emerald-400 inline-block" />
              Insulin Sensitivity
            </span>
            <span className="flex items-center gap-1.5 text-amber-300">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
              3.5h Digestion Arc
            </span>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <svg
            viewBox="0 0 920 205"
            className="w-full min-w-[680px] h-auto select-none rounded-xl bg-[#07090e] border border-white/[0.06]"
          >
            <defs>
              <linearGradient id="fastingGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.03" />
              </linearGradient>
              <linearGradient id="feedingGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.14" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id="digestionArcGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.55" />
                <stop offset="65%" stopColor="#10b981" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
              </linearGradient>
            </defs>

            {/* 18h Fasting Zones: 00:00-12:00 and 18:00-24:00 */}
            <rect x="36" y="14" width={((12 / 24) * 848).toFixed(1)} height="150" fill="url(#fastingGrad)" />
            <rect
              x={(36 + (12 / 24) * 848).toFixed(1)}
              y="14"
              width={((6 / 24) * 848).toFixed(1)}
              height="150"
              fill="url(#feedingGrad)"
            />
            <rect
              x={(36 + (18 / 24) * 848).toFixed(1)}
              y="14"
              width={((6 / 24) * 848).toFixed(1)}
              height="150"
              fill="url(#fastingGrad)"
            />

            {/* Zone labels */}
            <text x="50" y="30" fill="#a5b4fc" fontSize="9.5" fontWeight="700" letterSpacing="1.2">
              AUTOPHAGY / FASTING (00:00–12:00)
            </text>
            <text
              x={36 + (12 / 24) * 848 + 12}
              y="30"
              fill="#6ee7b7"
              fontSize="9.5"
              fontWeight="700"
              letterSpacing="1.2"
            >
              6H ANABOLIC FEEDING WINDOW
            </text>
            <text
              x={36 + (18 / 24) * 848 + 12}
              y="30"
              fill="#a5b4fc"
              fontSize="9.5"
              fontWeight="700"
              letterSpacing="1.2"
            >
              EVENING FAST (18:00+)
            </text>

            {/* Morning Insulin Sensitivity Peak Marker */}
            <text
              x={36 + (9.6 / 24) * 848}
              y="52"
              fill="#34d399"
              fontSize="9"
              fontWeight="600"
              textAnchor="middle"
            >
              ▲ Peak Insulin Sensitivity
            </text>

            {/* Hour Grid Lines */}
            {[0, 3, 6, 9, 12, 15, 18, 21, 24].map((hr) => {
              const x = 36 + (hr / 24) * 848;
              return (
                <g key={hr}>
                  <line
                    x1={x}
                    y1="14"
                    x2={x}
                    y2="164"
                    stroke="rgba(255,255,255,0.07)"
                    strokeDasharray={hr === 12 || hr === 18 ? "3 3" : undefined}
                  />
                  <text
                    x={x}
                    y="184"
                    fill="#9ca3af"
                    fontSize="10"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {String(hr).padStart(2, "0")}:00
                  </text>
                </g>
              );
            })}

            {/* Insulin Sensitivity Curve */}
            <path
              d={insulinCurvePath}
              fill="none"
              stroke="#10b981"
              strokeWidth="2.4"
              strokeLinecap="round"
            />

            {/* 3.5h Active Digestion Arcs for Each Logged Meal */}
            {meals.map((meal) => {
              const dt = new Date(meal.logged_at);
              const startHr = dt.getHours() + dt.getMinutes() / 60;
              const endHr = Math.min(24, startHr + 3.5);
              const x1 = 36 + (startHr / 24) * 848;
              const x2 = 36 + (endHr / 24) * 848;
              const midX = (x1 + x2) / 2;
              const peakHeight = Math.min(115, 55 + (Number(meal.calories || 300) / 800) * 55);
              const baseY = 164;
              const ctrlY = baseY - peakHeight;
              const isHovered = activeMealHoverId === meal.id;

              return (
                <g
                  key={meal.id}
                  onMouseEnter={() => setActiveMealHoverId(meal.id)}
                  onMouseLeave={() => setActiveMealHoverId(null)}
                  className="cursor-pointer"
                >
                  <path
                    d={`M ${x1.toFixed(1)} ${baseY} Q ${midX.toFixed(1)} ${ctrlY.toFixed(
                      1
                    )} ${x2.toFixed(1)} ${baseY} Z`}
                    fill="url(#digestionArcGrad)"
                    stroke={isHovered ? "#fbbf24" : "#f59e0b"}
                    strokeWidth={isHovered ? "2" : "1.2"}
                  />
                  <circle
                    cx={x1}
                    cy={baseY - 4}
                    r={isHovered ? 6 : 4.5}
                    fill="#fbbf24"
                    stroke="#090b11"
                    strokeWidth="1.5"
                  />
                  <text
                    x={midX}
                    y={Math.max(44, baseY - peakHeight * 0.55)}
                    fill="#fef3c7"
                    fontSize="9.5"
                    fontFamily="monospace"
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    {meal.meal_slot} · {meal.calories}kcal
                  </text>
                </g>
              );
            })}

            {/* Current Time Marker */}
            {selectedDate === getTodayIso() && (
              <g>
                <line
                  x1={36 + (nowHourFloat / 24) * 848}
                  y1="14"
                  x2={36 + (nowHourFloat / 24) * 848}
                  y2="164"
                  stroke="#f43f5e"
                  strokeWidth="1.6"
                  strokeDasharray="4 3"
                />
                <circle
                  cx={36 + (nowHourFloat / 24) * 848}
                  cy="18"
                  r="4"
                  fill="#f43f5e"
                />
              </g>
            )}
          </svg>
        </div>

        {activeMealHoverId && (
          <div className="mt-3 rounded-xl bg-amber-500/10 border border-amber-400/30 px-4 py-2.5 text-xs flex flex-wrap items-center justify-between gap-2">
            {(() => {
              const m = meals.find((x) => x.id === activeMealHoverId);
              if (!m) return null;
              const t = new Date(m.logged_at);
              const clearTime = new Date(t.getTime() + 3.5 * 3600 * 1000);
              return (
                <>
                  <span className="font-semibold text-amber-200">
                    {m.meal_slot}: {m.name} ({Math.round(Number(m.weight_g))}g solid)
                  </span>
                  <span className="font-mono text-zinc-200">
                    Ingested{" "}
                    {t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} → 3.5h
                    Gastric Clearance{" "}
                    {clearTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </>
              );
            })()}
          </div>
        )}
      </section>

      {/* Main Split: Staple Meal Slot Builder + Logged Meals Ledger */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left 7 Cols: Meal Slot Builder & Staple Templates */}
        <div className="xl:col-span-7 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-400 flex items-center gap-1.5">
                <Utensils size={13} /> Meal Slot Builder & Staple Templates
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Scale Chairman staples (0.5x–2.0x) for 1-click logging or multi-item plate assembly
              </p>
            </div>

            <div className="flex rounded-xl bg-black/40 p-1 border border-white/10 text-xs">
              <button
                onClick={() => setBuilderTab("staples")}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  builderTab === "staples"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Staple Scaler
              </button>
              <button
                onClick={() => setBuilderTab("custom")}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  builderTab === "custom"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Custom Meal
              </button>
            </div>
          </div>

          {/* Slot & Time Selector */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-black/30 border border-white/[0.06]">
            <div className="flex flex-wrap items-center gap-1.5">
              {MEAL_SLOTS.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                    selectedSlot === slot
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/40"
                      : "bg-white/[0.03] text-zinc-400 border-transparent hover:text-zinc-200"
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs">
              <Clock size={13} className="text-zinc-400" />
              <span className="text-zinc-400">Timestamp:</span>
              <input
                type="time"
                value={mealTimeHHMM}
                onChange={(e) => setMealTimeHHMM(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/10 text-white font-mono text-xs focus:outline-none"
              />
            </div>
          </div>

          {builderTab === "staples" ? (
            <div className="space-y-3">
              {STAPLE_TEMPLATES.map((t) => {
                const mult = scales[t.id] ?? 1.0;
                const scaled = computeScaledStaple(t, mult);
                return (
                  <div
                    key={t.id}
                    className="rounded-xl border border-white/[0.07] bg-black/30 p-3.5 flex flex-col gap-3 hover:border-white/15 transition"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: t.accent }}
                          />
                          <h3 className="text-sm font-bold text-white">{t.name}</h3>
                          <span className="px-2 py-0.5 rounded-md bg-white/[0.06] font-mono text-[10px] text-zinc-300">
                            {scaled.grams}g ({(scaled.grams / 453.592).toFixed(2)} lbs)
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5">{t.prepTag}</p>
                      </div>

                      <div className="text-right font-mono">
                        <div className="text-sm font-bold text-emerald-300">
                          {scaled.calories} kcal
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          {scaled.protein_g}g P · {scaled.carbs_g}g C · {scaled.fats_g}g F ·{" "}
                          {scaled.sodium_mg}mg Na
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/[0.05]">
                      <div className="flex flex-wrap items-center gap-1">
                        {PORTION_STEPS.map((step) => (
                          <button
                            key={step}
                            type="button"
                            onClick={() =>
                              setScales((prev) => ({ ...prev, [t.id]: step }))
                            }
                            className={`px-2 py-1 rounded-md font-mono text-[11px] transition ${
                              mult === step
                                ? "bg-emerald-500/25 text-emerald-200 border border-emerald-400/50 font-bold"
                                : "bg-white/[0.04] text-zinc-400 hover:text-white"
                            }`}
                          >
                            {step}x
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleAddToPlateTray(t)}
                          className="px-2.5 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-[11px] font-semibold text-zinc-200 transition"
                        >
                          + Plate Tray
                        </button>
                        <button
                          type="button"
                          disabled={mutating}
                          onClick={() => handleQuickLogStaple(t)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-[11px] font-bold text-emerald-200 flex items-center gap-1 transition"
                        >
                          <Plus size={12} /> 1-Click Log
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Composite Plate Tray */}
              {plateTray.length > 0 && (
                <div className="rounded-xl border border-emerald-400/35 bg-emerald-500/[0.08] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                      <Sparkles size={13} /> Active Plate Assembly ({plateTray.length} items)
                    </span>
                    <button
                      type="button"
                      onClick={() => setPlateTray([])}
                      className="text-[11px] text-zinc-400 hover:text-rose-300"
                    >
                      Clear Tray
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {plateTray.map((item, idx) => (
                      <span
                        key={`${item.name}-${idx}`}
                        className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-xs font-mono text-zinc-200 flex items-center gap-1.5"
                      >
                        {item.name} ({item.scale}x · {item.grams}g)
                        <button
                          type="button"
                          onClick={() =>
                            setPlateTray((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="text-zinc-400 hover:text-rose-400"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={plateCustomTitle}
                      onChange={(e) => setPlateCustomTitle(e.target.value)}
                      placeholder="Optional plate title (e.g., Post-Lift Chicken & Rice)"
                      className="flex-1 min-w-[200px] px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={mutating}
                      onClick={handleCommitPlateTray}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition"
                    >
                      Commit Composite Meal
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleLogCustomMeal} className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-zinc-400 mb-1">
                  Meal Name
                </label>
                <input
                  type="text"
                  required
                  value={customMeal.name}
                  onChange={(e) => setCustomMeal({ ...customMeal, name: e.target.value })}
                  placeholder="e.g., Wild Salmon, Avocado & Sourdough Plate"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm text-white focus:outline-none focus:border-emerald-400/50"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { key: "calories", label: "Calories (kcal)" },
                  { key: "proteinG", label: "Protein (g)" },
                  { key: "carbsG", label: "Carbs (g)" },
                  { key: "fatsG", label: "Fats (g)" },
                  { key: "sodiumMg", label: "Sodium (mg)" },
                  { key: "weightG", label: "Solid Weight (grams)" },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1">
                      {field.label}
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      value={(customMeal as any)[field.key]}
                      onChange={(e) =>
                        setCustomMeal({ ...customMeal, [field.key]: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-sm font-mono text-white focus:outline-none focus:border-emerald-400/50"
                    />
                  </div>
                ))}
              </div>

              <button
                type="submit"
                disabled={mutating}
                className="w-full py-2.5 rounded-xl bg-emerald-500/25 hover:bg-emerald-500/35 border border-emerald-400/50 text-emerald-200 font-bold text-xs uppercase tracking-widest transition"
              >
                Log Custom Meal to {selectedSlot}
              </button>
            </form>
          )}
        </div>

        {/* Right 5 Cols: Daily Logged Meals Ledger */}
        <div className="xl:col-span-5 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">
                Daily Intake Ledger
              </div>
              <h2 className="text-sm font-bold text-white mt-0.5">
                {meals.length} Logged {meals.length === 1 ? "Meal" : "Meals"} ({selectedDate})
              </h2>
            </div>
            <span className="text-xs font-mono text-emerald-300">
              {Math.round(physicalMetrics.solidGrams)}g solid
            </span>
          </div>

          <div className="space-y-3 flex-1">
            {meals.length === 0 ? (
              <div className="h-48 rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center text-center p-6">
                <Utensils size={24} className="text-zinc-600 mb-2" />
                <div className="text-xs font-semibold text-zinc-400">
                  Fasting State Active — Zero Solid Meals Logged
                </div>
                <div className="text-[11px] text-zinc-500 mt-1">
                  Select a staple template on the left to log your fast-breaker.
                </div>
              </div>
            ) : (
              meals.map((meal) => {
                const dt = new Date(meal.logged_at);
                const mealLbs = Number(meal.weight_g || 0) / 453.592;
                return (
                  <div
                    key={meal.id}
                    className="rounded-xl border border-white/[0.08] bg-black/35 p-3.5 space-y-2 hover:border-white/15 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-400/30 text-[10px] font-bold text-emerald-300">
                            {meal.meal_slot}
                          </span>
                          <span className="text-[11px] font-mono text-zinc-400">
                            {dt.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-white mt-1">{meal.name}</h3>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteMeal(meal.id)}
                        disabled={mutating}
                        title="Delete meal"
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="grid grid-cols-5 gap-1.5 pt-1 text-center font-mono text-[11px]">
                      <div className="rounded-lg bg-white/[0.03] py-1">
                        <div className="text-emerald-300 font-bold">{meal.calories}</div>
                        <div className="text-[9px] text-zinc-500">kcal</div>
                      </div>
                      <div className="rounded-lg bg-white/[0.03] py-1">
                        <div className="text-sky-300 font-bold">{Number(meal.protein_g)}g</div>
                        <div className="text-[9px] text-zinc-500">PRO</div>
                      </div>
                      <div className="rounded-lg bg-white/[0.03] py-1">
                        <div className="text-amber-300 font-bold">{Number(meal.carbs_g)}g</div>
                        <div className="text-[9px] text-zinc-500">CARB</div>
                      </div>
                      <div className="rounded-lg bg-white/[0.03] py-1">
                        <div className="text-purple-300 font-bold">{Number(meal.fats_g)}g</div>
                        <div className="text-[9px] text-zinc-500">FAT</div>
                      </div>
                      <div className="rounded-lg bg-white/[0.03] py-1">
                        <div className="text-zinc-200 font-bold">{mealLbs.toFixed(2)}</div>
                        <div className="text-[9px] text-zinc-500">lbs</div>
                      </div>
                    </div>

                    {Array.isArray(meal.food_items) && meal.food_items.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {meal.food_items.map((fi, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded bg-white/[0.04] text-[10px] text-zinc-400 font-mono"
                          >
                            {fi.name} ({fi.grams}g)
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>
    </ExecutiveModuleShell>
  );
}
