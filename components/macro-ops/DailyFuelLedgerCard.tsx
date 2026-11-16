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
} from "lucide-react";
import { FoodEntry } from "@/components/FoodFeedCard";

interface DailyFuelLedgerCardProps {
  entries: FoodEntry[];
  selectedDate: string;
  onOpenAddMeal: () => void;
  onDeleteEntry?: (id: string) => Promise<void>;
  onConfirmPending?: (entry: FoodEntry) => Promise<void>;
}

export function DailyFuelLedgerCard({
  entries,
  selectedDate,
  onOpenAddMeal,
  onDeleteEntry,
  onConfirmPending,
}: DailyFuelLedgerCardProps) {
  // If no entries are logged yet, provide structured defaults or empty state
  const defaultMeals: Array<Partial<FoodEntry> & { isPending?: boolean }> = [
    {
      id: "mock-1",
      name: "Avocado Tartine & Organic Poached Eggs",
      meal_window: "breakfast",
      raw_input: "07:15 AM · 2 Slices Sourdough, Pasture Eggs, EVOO",
      calories: 480,
      protein_g: 26,
      carbs_g: 42,
      fat_g: 18,
      is_estimated: false,
    },
    {
      id: "mock-2",
      name: "Sous-Vide Wagyu Flank & Microgreen Salad",
      meal_window: "lunch",
      raw_input: "12:45 PM · 250g Beef, Sweet Potato, Chimichurri",
      calories: 690,
      protein_g: 62,
      carbs_g: 48,
      fat_g: 22,
      is_estimated: false,
    },
    {
      id: "mock-3",
      name: "Whey Isolate Hydrolysate & Nitro Cold Brew",
      meal_window: "pre_workout",
      raw_input: "16:15 PM · 1.5 Scoops, 1 Banana, Creatine 5g",
      calories: 210,
      protein_g: 38,
      carbs_g: 28,
      fat_g: 2,
      is_estimated: false,
    },
    {
      id: "mock-4",
      name: "Mediterranean Branzino & Grilled Asparagus",
      meal_window: "dinner",
      raw_input: "Scheduled for 19:30 PM · 220g Fish, Steamed Greens",
      calories: 460,
      protein_g: 42,
      carbs_g: 12,
      fat_g: 12,
      isPending: true,
      is_estimated: true,
    },
  ];

  const displayList = entries.length > 0 ? entries : defaultMeals;

  const getMealIcon = (windowName?: string) => {
    switch (windowName?.toLowerCase()) {
      case "breakfast":
        return <Coffee size={18} className="text-amber-400" />;
      case "lunch":
        return <Sun size={18} className="text-cyan-400" />;
      case "pre_workout":
      case "snack":
        return <Flame size={18} className="text-emerald-400" />;
      case "dinner":
      default:
        return <Moon size={18} className="text-purple-400" />;
    }
  };

  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const handleConfirm = async (item: any) => {
    setConfirmingId(item.id);
    try {
      if (onConfirmPending) {
        await onConfirmPending(item);
      }
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border flex flex-col shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Utensils size={18} className="text-zinc-400" />
          <span className="font-mono font-bold text-sm text-zinc-100 uppercase tracking-wider">
            Daily Fuel Ledger
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider">
            {displayList.length} Meals Programmed
          </span>
          <button
            onClick={onOpenAddMeal}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-background hover:bg-zinc-800 border border-border text-xs font-mono font-bold text-emerald-400 transition"
          >
            <Plus size={13} />
            <span>Add Meal</span>
          </button>
        </div>
      </div>

      {/* Meal Rows */}
      <div className="space-y-2.5">
        {displayList.map((meal, idx) => {
          const isPending = (meal as any).isPending;
          return (
            <div
              key={meal.id || `meal-${idx}`}
              className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                isPending
                  ? "bg-surface/60 border-dashed border-zinc-700 hover:border-zinc-500"
                  : "bg-background border-border hover:border-zinc-600"
              }`}
            >
              {/* Left Details */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-border flex items-center justify-center shrink-0">
                  {getMealIcon(meal.meal_window)}
                </div>

                <div>
                  <div className="font-mono text-xs sm:text-sm font-bold text-zinc-100 flex items-center gap-2">
                    <span>{meal.name}</span>
                    {isPending && (
                      <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400 font-mono text-[9px] uppercase tracking-wider">
                        Pending
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-[11px] text-zinc-400 mt-0.5 line-clamp-1">
                    {meal.raw_input || `${meal.quantity_grams || 300}g · Verified Whole Food`}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] font-mono">
                    <span className="text-cyan-400 font-bold">{meal.protein_g}g P</span>
                    <span className="text-zinc-600">•</span>
                    <span className="text-emerald-400">{meal.carbs_g}g C</span>
                    <span className="text-zinc-600">•</span>
                    <span className="text-purple-400">{meal.fat_g}g F</span>
                  </div>
                </div>
              </div>

              {/* Right Calories & Action */}
              <div className="text-right pl-3 shrink-0 flex flex-col items-end gap-1">
                <div className="font-mono text-sm sm:text-base font-extrabold text-zinc-100">
                  {meal.calories}
                  <span className="text-[10px] font-normal text-zinc-400 ml-1">kcal</span>
                </div>

                {isPending ? (
                  <button
                    onClick={() => handleConfirm(meal)}
                    disabled={confirmingId === meal.id}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-mono text-[10px] font-bold uppercase shadow-sm shadow-emerald-500/30 transition active:scale-95"
                  >
                    Confirm Eaten
                  </button>
                ) : (
                  <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 font-semibold">
                    <CheckCircle2 size={12} />
                    <span>VERIFIED</span>
                    {onDeleteEntry && meal.id && !meal.id.startsWith("mock") && (
                      <button
                        onClick={() => onDeleteEntry(meal.id!)}
                        className="p-1 text-zinc-500 hover:text-rose-400 transition ml-1"
                        title="Delete Entry"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
