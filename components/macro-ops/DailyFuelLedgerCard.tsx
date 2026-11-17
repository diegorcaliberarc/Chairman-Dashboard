"use client";

import React, { useState } from "react";
import {
  Utensils,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Coffee,
  Sun,
  Flame,
  Moon,
  Check,
  Sparkles,
  Mic,
} from "lucide-react";
import { FoodEntry } from "@/components/FoodFeedCard";

interface DailyFuelLedgerCardProps {
  entries: FoodEntry[];
  selectedDate: string;
  onOpenAddMeal: () => void;
  onOpenVoiceMeal?: () => void;
  onDeleteEntry?: (id: string) => Promise<void>;
  onConfirmPending?: (entry: any) => Promise<void>;
  onQuickLogMeal?: (meal: {
    name: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    meal_window: string;
  }) => Promise<void>;
}

export function DailyFuelLedgerCard({
  entries = [],
  selectedDate,
  onOpenAddMeal,
  onOpenVoiceMeal,
  onDeleteEntry,
  onConfirmPending,
  onQuickLogMeal,
}: DailyFuelLedgerCardProps) {
  // Inline Quick Add Form State
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [mealName, setMealName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [mealWindow, setMealWindow] = useState("lunch");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getMealIcon = (windowName?: string) => {
    switch (windowName?.toLowerCase()) {
      case "breakfast":
        return <Coffee size={16} className="text-amber-400" />;
      case "lunch":
        return <Sun size={16} className="text-cyan-400" />;
      case "pre_workout":
      case "snack":
        return <Flame size={16} className="text-emerald-400" />;
      case "dinner":
      default:
        return <Moon size={16} className="text-purple-400" />;
    }
  };

  const handleInlineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealName.trim() || !calories || !onQuickLogMeal) return;

    setIsSubmitting(true);
    try {
      await onQuickLogMeal({
        name: mealName.trim(),
        calories: Number(calories) || 0,
        protein_g: Number(protein) || 0,
        carbs_g: Number(carbs) || 0,
        fat_g: Number(fat) || 0,
        meal_window: mealWindow,
      });

      // Reset
      setMealName("");
      setCalories("");
      setProtein("");
      setCarbs("");
      setFat("");
      setShowInlineForm(false);
    } catch (err) {
      console.error("Failed to log fuel entry:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="p-4 sm:p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden flex flex-col group shadow-2xl"
      style={{
        backgroundColor: "var(--glass-surface)",
        backdropFilter: "blur(var(--glass-blur, 26px)) saturate(185%)",
        WebkitBackdropFilter: "blur(var(--glass-blur, 26px)) saturate(185%)",
        borderColor: "var(--glass-border)",
        boxShadow: "inset 0 1px 0 0 var(--glass-specular), var(--glass-shadow)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b" style={{ borderColor: "var(--glass-border)" }}>
        <div className="flex items-center gap-2">
          <Utensils className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
          <span className="font-mono font-bold text-xs uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
            Daily Fuel Ledger // Ingestion Registry
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onOpenVoiceMeal && (
            <button
              onClick={onOpenVoiceMeal}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-400/40 text-xs font-mono font-bold uppercase transition active:scale-95 shadow-sm"
              title="Speak to log meal with voice"
            >
              <Mic size={13} className="text-cyan-400 animate-pulse" />
              <span>Voice</span>
            </button>
          )}

          <button
            onClick={() => setShowInlineForm(!showInlineForm)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold uppercase transition active:scale-95"
          >
            <Plus size={13} />
            <span>{showInlineForm ? "Close Input" : "Quick Input"}</span>
          </button>

          <button
            onClick={onOpenAddMeal}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-mono font-bold uppercase transition active:scale-95 shadow-md shadow-emerald-500/20"
          >
            <Plus size={13} />
            <span>Full Log Modal</span>
          </button>
        </div>
      </div>

      {/* Inline Fast Food Input Form */}
      {showInlineForm && (
        <form
          onSubmit={handleInlineSubmit}
          className="mb-4 p-3 rounded-xl border font-mono text-xs space-y-3 transition-colors"
          style={{
            backgroundColor: "var(--glass-surface-elevated)",
            borderColor: "rgba(6, 182, 212, 0.4)",
          }}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-cyan-600 dark:text-cyan-400 uppercase text-[11px]">
              Direct Fuel Entry // {selectedDate}
            </span>
            <span className="text-[10px] text-zinc-500">Auto-saves to database</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2">
            <div className="md:col-span-2">
              <label className="block text-[10px] text-zinc-600 dark:text-zinc-400 mb-0.5">Meal / Food Name</label>
              <input
                type="text"
                placeholder="e.g. Ribeye Steak & Sweet Potato"
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
                required
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-[10px] text-zinc-600 dark:text-zinc-400 mb-0.5">Calories (kcal)</label>
              <input
                type="number"
                placeholder="550"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                required
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-[10px] text-cyan-600 dark:text-cyan-400 mb-0.5">Protein (g)</label>
              <input
                type="number"
                placeholder="45"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-[10px] text-rose-600 dark:text-rose-400 mb-0.5">Carbs (g)</label>
              <input
                type="number"
                placeholder="30"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-400"
              />
            </div>

            <div>
              <label className="block text-[10px] text-purple-600 dark:text-purple-400 mb-0.5">Fat (g)</label>
              <input
                type="number"
                placeholder="18"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-400"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-zinc-600 dark:text-zinc-400">Window:</label>
              <select
                value={mealWindow}
                onChange={(e) => setMealWindow(e.target.value)}
                className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-2 py-1 text-xs text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-cyan-400"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="pre_workout">Pre-Workout</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !mealName || !calories}
              className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold uppercase text-xs tracking-wider transition active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? "Logging..." : "Log Fuel Entry"}
            </button>
          </div>
        </form>
      )}

      {/* Entries List */}
      <div className="flex flex-col gap-2 font-mono">
        {entries.length === 0 ? (
          <div
            className="p-8 text-center rounded-xl border flex flex-col items-center justify-center gap-2 transition-colors"
            style={{
              backgroundColor: "var(--glass-surface-elevated)",
              borderColor: "var(--glass-border)",
            }}
          >
            <div
              className="w-10 h-10 rounded-full border flex items-center justify-center text-zinc-500"
              style={{
                backgroundColor: "var(--glass-surface)",
                borderColor: "var(--glass-border)",
              }}
            >
              <Utensils size={18} />
            </div>
            <div className="text-xs font-bold text-zinc-800 dark:text-zinc-300 uppercase tracking-wider">
              No Fuel Entries Logged For {selectedDate}
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-sm">
              Telemetry is in idle state with zero calories recorded. Click &ldquo;Quick Input&rdquo; above to record your first meal.
            </p>
          </div>
        ) : (
          entries.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border hover:border-cyan-500/40 transition group"
              style={{
                backgroundColor: "var(--glass-surface-elevated)",
                borderColor: "var(--glass-border)",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: "var(--glass-surface)",
                    borderColor: "var(--glass-border)",
                  }}
                >
                  {getMealIcon(item.meal_window)}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">{item.name}</span>
                    <span
                      className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border"
                      style={{
                        backgroundColor: "var(--glass-surface)",
                        borderColor: "var(--glass-border)",
                        color: "var(--glass-text-muted)",
                      }}
                    >
                      {item.meal_window || "Meal"}
                    </span>
                  </div>
                  {item.raw_input && (
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1">
                      {item.raw_input}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 justify-between sm:justify-end">
                {/* Macro Chips */}
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span
                    className="px-2 py-0.5 rounded border font-bold text-zinc-900 dark:text-zinc-100"
                    style={{
                      backgroundColor: "var(--glass-surface)",
                      borderColor: "var(--glass-border)",
                    }}
                  >
                    {item.calories} <span className="text-zinc-500 font-normal">kcal</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-bold">
                    P: {item.protein_g}g
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 font-bold">
                    C: {item.carbs_g}g
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 font-bold">
                    F: {item.fat_g}g
                  </span>
                </div>

                {/* Delete Button */}
                {onDeleteEntry && (
                  <button
                    onClick={() => onDeleteEntry(item.id)}
                    className="p-1 rounded text-zinc-400 hover:text-rose-500 transition"
                    title="Delete Entry"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
