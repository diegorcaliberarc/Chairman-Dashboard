"use client";

import React, { useState } from "react";
import {
  Utensils,
  Check,
  Sparkles,
  Clock,
  Plus,
  ArrowRight,
  Loader2,
  X,
  Zap,
} from "lucide-react";
import { resolveFoodImage } from "@/lib/foodImages";

export interface MealPlanItem {
  name: string;
  quantity_grams: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  cholesterol_mg: number;
  water_oz: number;
  image_key?: string;
}

export interface MealPlanRecord {
  id: string;
  plan_name: string;
  window_label: string;
  scheduled_time: string;
  items: MealPlanItem[] | string;
  is_active: boolean;
}

interface MealPlanCardProps {
  mealPlans: MealPlanRecord[];
  onMealLogged: () => Promise<void>;
  onPlanUpdated: () => Promise<void>;
}

export function MealPlanCard({
  mealPlans,
  onMealLogged,
  onPlanUpdated,
}: MealPlanCardProps) {
  const [loggingPlanId, setLoggingPlanId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // AI Modal State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Log all items from this meal block
  const handleLogMeal = async (planId: string) => {
    setLoggingPlanId(planId);
    try {
      const res = await fetch("/api/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "log_planned_meal",
          plan_id: planId,
        }),
      });

      if (!res.ok) throw new Error("Failed to log meal plan");
      const data = await res.json();
      setSuccessMsg(`Logged ${data.count} items into today's log!`);
      await onMealLogged();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error(err);
      setSuccessMsg(`Error: ${err.message}`);
    } finally {
      setLoggingPlanId(null);
    }
  };

  // Generate / Overwrite Plan with AI
  const handleGenerateAiPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const res = await fetch("/api/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_ai_plan",
          user_prompt: aiPrompt.trim(),
        }),
      });

      if (!res.ok) throw new Error("Failed to generate AI plan");
      await onPlanUpdated();
      setIsAiModalOpen(false);
      setAiPrompt("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="rounded-3xl bg-[#141418] border border-[#1E1E24] p-5 sm:p-6 shadow-[0_12px_36px_rgba(0,0,0,0.65)] space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1E1E24]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-2xl bg-emerald-500/10 text-emerald-400">
            <Utensils className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-100">
              Active Meal Plan (Cut Protocol)
            </h2>
            <p className="text-[11px] text-zinc-500 font-mono">
              Calibrated for 12:00 PM – 6:00 PM Fasting Window
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {successMsg && (
            <span className="text-xs font-mono text-emerald-400">{successMsg}</span>
          )}
          <button
            type="button"
            onClick={() => setIsAiModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#0A0A0C] hover:bg-[#1E1E24] border border-[#1E1E24] hover:border-amber-400/40 text-xs font-mono font-semibold text-zinc-200 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Update with AI</span>
          </button>
        </div>
      </div>

      {/* Meal Blocks Grid: Pre-Fast & Post-Fast */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mealPlans.map((plan) => {
          const rawItems = Array.isArray(plan.items)
            ? plan.items
            : typeof plan.items === "string"
            ? JSON.parse(plan.items)
            : [];
          const items: MealPlanItem[] = rawItems;

          const totalCal = items.reduce((acc, it) => acc + (Number(it.calories) || 0), 0);
          const totalProtein = items.reduce((acc, it) => acc + (Number(it.protein_g) || 0), 0);

          return (
            <div
              key={plan.id}
              className="p-4 rounded-2xl bg-[#0A0A0C] border border-[#1E1E24] flex flex-col justify-between space-y-3"
            >
              {/* Window Header */}
              <div className="flex items-center justify-between pb-2 border-b border-[#1E1E24]">
                <div>
                  <div className="text-xs font-bold text-zinc-100">
                    {plan.window_label}
                  </div>
                  <div className="flex items-center gap-1 text-[10.5px] font-mono text-zinc-500 mt-0.5">
                    <Clock className="w-3 h-3 text-zinc-400" />
                    <span>Target Time: {plan.scheduled_time}</span>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="text-xs font-extrabold text-emerald-400">{totalCal} kcal</div>
                  <div className="text-[10px] text-zinc-400">{totalProtein.toFixed(1)}g P</div>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                {items.map((item, idx) => {
                  const img = resolveFoodImage(item.image_key);
                  return (
                    <div
                      key={idx}
                      className="p-2 rounded-xl bg-[#141418] border border-[#1E1E24] flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={img.url}
                          alt={item.name}
                          className="w-8 h-8 rounded-lg object-cover"
                        />
                        <div>
                          <div className="text-[11.5px] font-bold text-zinc-200">
                            {item.name}
                          </div>
                          <div className="text-[10px] font-mono text-zinc-500">
                            {item.quantity_grams}g • {item.calories} kcal • {item.protein_g}g P
                          </div>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono text-zinc-400">
                        {item.quantity_grams}g
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* 1-Click "Log Planned Meal" Button */}
              <button
                type="button"
                onClick={() => handleLogMeal(plan.id)}
                disabled={loggingPlanId === plan.id}
                className="w-full py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loggingPlanId === plan.id ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Logging items...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log Planned Meal</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* AI Meal Plan Generator Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-[#141418] border border-[#1E1E24] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E1E24]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
                  Update Meal Plan with AI
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="p-1 rounded-lg text-zinc-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Instruct Gemini to calibrate your daily 1,700 kcal & 180g protein plan around your specific preferences or training day.
            </p>

            <form onSubmit={handleGenerateAiPlan} className="space-y-3">
              <textarea
                rows={3}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. Generate a 1,400 kcal high-protein flush plan for today with zero starchy carbs and extra chicken breast..."
                className="w-full p-3.5 rounded-2xl bg-[#0A0A0C] border border-[#1E1E24] text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-400/50 resize-none font-sans"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-mono text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating || !aiPrompt.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold font-mono disabled:opacity-40 transition-all"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Calibrating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate & Apply</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

