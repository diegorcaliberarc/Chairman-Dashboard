"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Edit3,
  Send,
  Loader2,
  Plus,
  Flame,
  Droplets,
  Dumbbell,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { CanonicalFoodImageKey } from "@/lib/foodImages";

interface FoodLoggerCardProps {
  logDate: string;
  onEntriesAdded: () => Promise<void>;
}

interface StapleQuickAdd {
  name: string;
  quantity_grams: number;
  weight_lbs: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  cholesterol_mg: number;
  water_oz: number;
  image_key: CanonicalFoodImageKey;
}

const STAPLES: StapleQuickAdd[] = [
  {
    name: "100g Cooked Chicken Breast",
    quantity_grams: 100,
    weight_lbs: 0.22,
    calories: 165,
    protein_g: 31.0,
    carbs_g: 0.0,
    fat_g: 3.6,
    cholesterol_mg: 85,
    water_oz: 0,
    image_key: "chicken_breast",
  },
  {
    name: "100g Air-Fried Russet Potato",
    quantity_grams: 100,
    weight_lbs: 0.22,
    calories: 93,
    protein_g: 2.5,
    carbs_g: 21.2,
    fat_g: 0.1,
    cholesterol_mg: 0,
    water_oz: 0,
    image_key: "russet_potato",
  },
  {
    name: "1 Scoop Whey Isolate",
    quantity_grams: 32,
    weight_lbs: 0.07,
    calories: 120,
    protein_g: 25.0,
    carbs_g: 2.0,
    fat_g: 1.0,
    cholesterol_mg: 15,
    water_oz: 12,
    image_key: "whey_shake",
  },
  {
    name: "32 oz Pure Water",
    quantity_grams: 946,
    weight_lbs: 2.08,
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    cholesterol_mg: 0,
    water_oz: 32,
    image_key: "water",
  },
];

export function FoodLoggerCard({ logDate, onEntriesAdded }: FoodLoggerCardProps) {
  const [activeTab, setActiveTab] = useState<"ai" | "manual">("ai");

  // AI Tab State
  const [aiInput, setAiInput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiStatusMsg, setAiStatusMsg] = useState<string | null>(null);

  // Manual Tab State
  const [manualName, setManualName] = useState("");
  const [manualGrams, setManualGrams] = useState(150);
  const [manualCalories, setManualCalories] = useState(250);
  const [manualProtein, setManualProtein] = useState(30);
  const [manualCarbs, setManualCarbs] = useState(15);
  const [manualFat, setManualFat] = useState(5);
  const [manualCholesterol, setManualCholesterol] = useState(45);
  const [manualWaterOz, setManualWaterOz] = useState(0);
  const [manualImageKey, setManualImageKey] = useState<CanonicalFoodImageKey>("default_food");
  const [isManualLoading, setIsManualLoading] = useState(false);

  // Quick Staple Adding State
  const [addingStapleIdx, setAddingStapleIdx] = useState<number | null>(null);

  // Submit AI Food String
  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim() || isAiLoading) return;

    setIsAiLoading(true);
    setAiStatusMsg(null);
    try {
      const res = await fetch("/api/parse-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: aiInput.trim(), log_date: logDate }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to parse food");

      setAiStatusMsg(`Successfully logged ${data.count || 1} item(s)!`);
      setAiInput("");
      await onEntriesAdded();
      setTimeout(() => setAiStatusMsg(null), 3000);
    } catch (err: any) {
      setAiStatusMsg(`Error: ${err.message}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Submit Manual Food Item
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || isManualLoading) return;

    setIsManualLoading(true);
    try {
      const res = await fetch("/api/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_entry",
          log_date: logDate,
          name: manualName.trim(),
          quantity_grams: manualGrams,
          calories: manualCalories,
          protein_g: manualProtein,
          carbs_g: manualCarbs,
          fat_g: manualFat,
          cholesterol_mg: manualCholesterol,
          water_oz: manualWaterOz,
          image_key: manualImageKey,
          is_estimated: false,
        }),
      });

      if (!res.ok) throw new Error("Failed to create entry");

      setManualName("");
      await onEntriesAdded();
    } catch (err) {
      console.error(err);
    } finally {
      setIsManualLoading(false);
    }
  };

  // 1-Tap Quick Staple Add
  const handleAddStaple = async (staple: StapleQuickAdd, idx: number) => {
    setAddingStapleIdx(idx);
    try {
      const res = await fetch("/api/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_entry",
          log_date: logDate,
          ...staple,
          is_estimated: false,
        }),
      });
      if (res.ok) {
        await onEntriesAdded();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAddingStapleIdx(null);
    }
  };

  return (
    <div className="rounded-3xl bg-[#141418] border border-[#1E1E24] p-5 sm:p-6 shadow-[0_12px_36px_rgba(0,0,0,0.65)] space-y-5">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1E1E24]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-2xl bg-amber-500/10 text-amber-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-100">
              Natural Language AI Food Logger
            </h2>
            <p className="text-[11px] text-zinc-500 font-mono">
              Type or dictate foods with grams, ounces & water
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-[#0A0A0C] p-1 rounded-2xl border border-[#1E1E24] text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveTab("ai")}
            className={`px-3 py-1 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === "ai"
                ? "bg-[#1E1E24] text-emerald-400 font-bold shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>AI Parser</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`px-3 py-1 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === "manual"
                ? "bg-[#1E1E24] text-emerald-400 font-bold shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Edit3 className="w-3 h-3 text-blue-400" />
            <span>Manual & Staples</span>
          </button>
        </div>
      </div>

      {/* ── TAB A: AI TEXT / VOICE INPUT ── */}
      {activeTab === "ai" && (
        <form onSubmit={handleAiSubmit} className="space-y-3">
          <div className="relative">
            <textarea
              rows={3}
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              placeholder="e.g., 157g cooked chicken breast, 80g air-fried russet potato, 300g lettuce, 40oz water..."
              className="w-full p-4 rounded-2xl bg-[#0A0A0C] border border-[#1E1E24] text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-400/50 font-sans resize-none transition-all"
            />
          </div>

          <div className="flex items-center justify-between">
            {aiStatusMsg ? (
              <span className="text-xs font-mono text-emerald-400">{aiStatusMsg}</span>
            ) : (
              <span className="text-[11px] font-mono text-zinc-500">
                Gemini extracts exact grams, USDA macros, cholesterol & physical lbs.
              </span>
            )}

            <button
              type="submit"
              disabled={isAiLoading || !aiInput.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black text-xs font-bold font-mono transition-all disabled:opacity-40 cursor-pointer shadow-md"
            >
              {isAiLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Parsing...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Log Food</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ── TAB B: MANUAL ENTRY & 1-TAP QUICK STAPLES ── */}
      {activeTab === "manual" && (
        <div className="space-y-4">
          {/* 1-Tap Frequent Staples Grid */}
          <div className="space-y-2">
            <span className="text-[10.5px] font-mono uppercase text-zinc-500 block">
              1-Tap Quick Staples
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {STAPLES.map((staple, idx) => (
                <button
                  key={staple.name}
                  type="button"
                  onClick={() => handleAddStaple(staple, idx)}
                  disabled={addingStapleIdx === idx}
                  className="p-2.5 rounded-2xl bg-[#0A0A0C] border border-[#1E1E24] hover:border-emerald-500/40 text-left transition-all group flex flex-col justify-between"
                >
                  <div className="text-[11px] font-bold text-zinc-200 group-hover:text-emerald-300 transition-colors truncate">
                    {staple.name}
                  </div>
                  <div className="mt-1 text-[10px] font-mono text-zinc-500">
                    {staple.calories} kcal • {staple.protein_g}g P
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[9px] font-mono text-emerald-400/80">
                    <span>+ Quick Add</span>
                    {addingStapleIdx === idx && <Loader2 className="w-3 h-3 animate-spin" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Manual Input Form */}
          <form onSubmit={handleManualSubmit} className="p-3.5 rounded-2xl bg-[#0A0A0C] border border-[#1E1E24] space-y-3">
            <span className="text-[10.5px] font-mono uppercase text-zinc-400 block font-bold">
              Custom Item Entry
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="col-span-2">
                <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">
                  Food Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Grass-Fed Sirloin"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-[#141418] border border-[#1E1E24] text-xs text-zinc-100 focus:outline-none focus:border-emerald-400/50 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">
                  Grams
                </label>
                <input
                  type="number"
                  value={manualGrams}
                  onChange={(e) => setManualGrams(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-xl bg-[#141418] border border-[#1E1E24] text-xs text-zinc-100 focus:outline-none focus:border-emerald-400/50 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">
                  Calories
                </label>
                <input
                  type="number"
                  value={manualCalories}
                  onChange={(e) => setManualCalories(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-xl bg-[#141418] border border-[#1E1E24] text-xs text-zinc-100 focus:outline-none focus:border-emerald-400/50 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">
                  Protein (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={manualProtein}
                  onChange={(e) => setManualProtein(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-xl bg-[#141418] border border-[#1E1E24] text-xs text-zinc-100 focus:outline-none focus:border-emerald-400/50 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">
                  Carbs (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={manualCarbs}
                  onChange={(e) => setManualCarbs(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-xl bg-[#141418] border border-[#1E1E24] text-xs text-zinc-100 focus:outline-none focus:border-emerald-400/50 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">
                  Fat (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={manualFat}
                  onChange={(e) => setManualFat(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-xl bg-[#141418] border border-[#1E1E24] text-xs text-zinc-100 focus:outline-none focus:border-emerald-400/50 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">
                  Cholesterol (mg)
                </label>
                <input
                  type="number"
                  value={manualCholesterol}
                  onChange={(e) => setManualCholesterol(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-xl bg-[#141418] border border-[#1E1E24] text-xs text-zinc-100 focus:outline-none focus:border-emerald-400/50 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isManualLoading || !manualName.trim()}
                className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold font-mono transition-all disabled:opacity-40"
              >
                {isManualLoading ? "Adding..." : "Add Manual Entry"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
