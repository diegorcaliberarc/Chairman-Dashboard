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
} from "lucide-react";
import { FoodEntry } from "@/components/FoodFeedCard";

interface DailyFuelLedgerCardProps {
  entries: FoodEntry[];
  selectedDate: string;
  onOpenAddMeal: () => void;
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
    <div className="p-4 sm:p-5 rounded-2xl bg-surface/80 border border-border backdrop-blur-xl relative overflow-hidden flex flex-col group shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Utensils className="w-4 h-4 text-cyan-400" />
          <span className="font-mono font-bold text-xs uppercase tracking-wider text-zinc-100">
            Daily Fuel Ledger // Ingestion Registry
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInlineForm(!showInlineForm)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold uppercase transition active:scale-95"
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
          className="mb-4 p-3 rounded-xl bg-background/90 border border-cyan-500/30 font-mono text-xs space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-cyan-400 uppercase text-[11px]">
              Direct Fuel Entry // {selectedDate}
            </span>
            <span className="text-[10px] text-zinc-500">Auto-saves to database</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2">
            <div className="md:col-span-2">
              <label className="block text-[10px] text-zinc-400 mb-0.5">Meal / Food Name</label>
              <input
                type="text"
                placeholder="e.g. Ribeye Steak & Sweet Potato"
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
                required
                className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-[10px] text-zinc-400 mb-0.5">Calories (kcal)</label>
              <input
                type="number"
                placeholder="550"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                required
                className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-[10px] text-cyan-400 mb-0.5">Protein (g)</label>
              <input
                type="number"
                placeholder="45"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-[10px] text-rose-400 mb-0.5">Carbs (g)</label>
              <input
                type="number"
                placeholder="30"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-400"
              />
            </div>

            <div>
              <label className="block text-[10px] text-purple-400 mb-0.5">Fat (g)</label>
              <input
                type="number"
                placeholder="18"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-400"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-zinc-400">Window:</label>
              <select
                value={mealWindow}
                onChange={(e) => setMealWindow(e.target.value)}
                className="bg-surface border border-border rounded-lg px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-cyan-400"
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
          <div className="p-8 text-center rounded-xl bg-background/60 border border-border/80 flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-zinc-500">
              <Utensils size={18} />
            </div>
            <div className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
              No Fuel Entries Logged For {selectedDate}
            </div>
            <p className="text-[11px] text-zinc-500 max-w-sm">
              Telemetry is in idle state with zero calories recorded. Click &ldquo;Quick Input&rdquo; above to record your first meal.
            </p>
          </div>
        ) : (
          entries.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-background/80 border border-border hover:border-cyan-500/40 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center flex-shrink-0">
                  {getMealIcon(item.meal_window)}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-zinc-100">{item.name}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-surface text-zinc-400 border border-border">
                      {item.meal_window || "Meal"}
                    </span>
                  </div>
                  {item.raw_input && (
                    <div className="text-[10px] text-zinc-500 mt-0.5 line-clamp-1">
                      {item.raw_input}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 justify-between sm:justify-end">
                {/* Macro Chips */}
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-surface border border-border font-bold text-zinc-100">
                    {item.calories} <span className="text-zinc-500 font-normal">kcal</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold">
                    P: {item.protein_g}g
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold">
                    C: {item.carbs_g}g
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold">
                    F: {item.fat_g}g
                  </span>
                </div>

                {/* Delete Button */}
                {onDeleteEntry && (
                  <button
                    onClick={() => onDeleteEntry(item.id)}
                    className="p-1 rounded text-zinc-500 hover:text-rose-400 transition"
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
