"use client";

import React, { useState } from "react";
import { X, Sparkles, Utensils, Check, Plus } from "lucide-react";

interface QuickMealLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  onSaved: () => void;
}

export function QuickMealLogModal({
  isOpen,
  onClose,
  selectedDate,
  onSaved,
}: QuickMealLogModalProps) {
  const [activeMode, setActiveMode] = useState<"ai" | "manual">("ai");
  const [naturalText, setNaturalText] = useState("");
  const [name, setName] = useState("");
  const [mealWindow, setMealWindow] = useState("lunch");
  const [calories, setCalories] = useState("");
  const [proteinG, setProteinG] = useState("");
  const [carbsG, setCarbsG] = useState("");
  const [fatG, setFatG] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAiParse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!naturalText.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/parse-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: naturalText }),
      });
      if (!res.ok) throw new Error("Failed to parse food");
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        // Save items directly to nutrition API
        for (const item of data.items) {
          await fetch("/api/nutrition", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "add_entry",
              date: selectedDate,
              entry: {
                name: item.name,
                meal_window: mealWindow,
                raw_input: naturalText,
                quantity_grams: item.quantity_grams || 250,
                weight_lbs: +((item.quantity_grams || 250) * 0.00220462).toFixed(2),
                calories: item.calories,
                protein_g: item.protein_g,
                carbs_g: item.carbs_g,
                fat_g: item.fat_g,
                is_estimated: true,
              },
            }),
          });
        }
        onSaved();
        onClose();
      } else {
        setError("Could not parse macros. Please enter manually.");
        setActiveMode("manual");
      }
    } catch (err: any) {
      setError(err.message || "Failed to parse meal");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_entry",
          date: selectedDate,
          entry: {
            name: name.trim(),
            meal_window: mealWindow,
            raw_input: `${name.trim()} (${mealWindow})`,
            quantity_grams: 300,
            weight_lbs: 0.66,
            calories: parseInt(calories || "0", 10),
            protein_g: parseFloat(proteinG || "0"),
            carbs_g: parseFloat(carbsG || "0"),
            fat_g: parseFloat(fatG || "0"),
            is_estimated: false,
          },
        }),
      });
      if (!res.ok) throw new Error("Failed to save entry");
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-background">
          <div className="flex items-center gap-2">
            <Utensils size={18} className="text-emerald-400" />
            <h3 className="font-mono font-bold text-sm text-zinc-100 uppercase tracking-wider">
              Log Nutritional Intake
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="flex border-b border-border bg-background/50 p-2 gap-2 text-xs font-mono">
          <button
            onClick={() => setActiveMode("ai")}
            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 font-bold ${
              activeMode === "ai"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Sparkles size={14} />
            <span>AI Natural Language</span>
          </button>
          <button
            onClick={() => setActiveMode("manual")}
            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 font-bold ${
              activeMode === "manual"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Plus size={14} />
            <span>Manual Entry</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 font-mono text-xs">
              {error}
            </div>
          )}

          {activeMode === "ai" ? (
            <form onSubmit={handleAiParse} className="space-y-4">
              <div>
                <label className="block font-mono text-xs text-zinc-400 uppercase mb-1.5">
                  Describe what you ate:
                </label>
                <textarea
                  value={naturalText}
                  onChange={(e) => setNaturalText(e.target.value)}
                  rows={4}
                  placeholder="e.g. 250g grilled wild salmon, 1 cup steamed quinoa, 1 avocado, drizzle olive oil"
                  className="w-full bg-background border border-border rounded-xl p-3 font-mono text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 resize-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-mono text-xs text-zinc-400 uppercase mb-1.5">
                  Meal Window:
                </label>
                <select
                  value={mealWindow}
                  onChange={(e) => setMealWindow(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl p-2.5 font-mono text-xs text-zinc-200 focus:outline-none"
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
                disabled={isSubmitting || !naturalText.trim()}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-mono font-bold text-xs uppercase rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition active:scale-95"
              >
                {isSubmitting ? (
                  <span>Analyzing Macros with AI...</span>
                ) : (
                  <>
                    <Sparkles size={15} />
                    <span>Parse & Log Meal</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block font-mono text-xs text-zinc-400 uppercase mb-1.5">
                  Meal Name:
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Steak & Sweet Potato"
                  className="w-full bg-background border border-border rounded-xl p-2.5 font-mono text-xs text-zinc-100 focus:outline-none focus:border-emerald-500/50"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-xs text-zinc-400 uppercase mb-1.5">
                    Calories (kcal):
                  </label>
                  <input
                    type="number"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    placeholder="650"
                    className="w-full bg-background border border-border rounded-xl p-2.5 font-mono text-xs text-zinc-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-mono text-xs text-zinc-400 uppercase mb-1.5">
                    Protein (g):
                  </label>
                  <input
                    type="number"
                    value={proteinG}
                    onChange={(e) => setProteinG(e.target.value)}
                    placeholder="55"
                    className="w-full bg-background border border-border rounded-xl p-2.5 font-mono text-xs text-zinc-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-xs text-zinc-400 uppercase mb-1.5">
                    Carbs (g):
                  </label>
                  <input
                    type="number"
                    value={carbsG}
                    onChange={(e) => setCarbsG(e.target.value)}
                    placeholder="45"
                    className="w-full bg-background border border-border rounded-xl p-2.5 font-mono text-xs text-zinc-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-mono text-xs text-zinc-400 uppercase mb-1.5">
                    Fat (g):
                  </label>
                  <input
                    type="number"
                    value={fatG}
                    onChange={(e) => setFatG(e.target.value)}
                    placeholder="18"
                    className="w-full bg-background border border-border rounded-xl p-2.5 font-mono text-xs text-zinc-100 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-xs text-zinc-400 uppercase mb-1.5">
                  Meal Window:
                </label>
                <select
                  value={mealWindow}
                  onChange={(e) => setMealWindow(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl p-2.5 font-mono text-xs text-zinc-200 focus:outline-none"
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
                disabled={isSubmitting || !name.trim()}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-mono font-bold text-xs uppercase rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition active:scale-95"
              >
                <Check size={15} />
                <span>Save to Fuel Ledger</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
