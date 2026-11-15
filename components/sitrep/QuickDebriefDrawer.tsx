"use client";

import React, { useState } from "react";
import { X, Moon, Flame, CheckCircle2, Save, Dumbbell, Activity, ShieldCheck } from "lucide-react";
import { DailySitrepLog } from "@/lib/commandTypes";

interface QuickDebriefDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  existingLog: DailySitrepLog | null;
  onSaved: () => void;
}

export function QuickDebriefDrawer({
  isOpen,
  onClose,
  selectedDate,
  existingLog,
  onSaved,
}: QuickDebriefDrawerProps) {
  const [steps, setSteps] = useState(existingLog ? String(existingLog.total_steps || "") : "");
  const [eaten, setEaten] = useState(existingLog ? String(existingLog.calories_eaten || "") : "");
  const [burned, setBurned] = useState(existingLog ? String(existingLog.kcal_burned || "") : "");
  const [protein, setProtein] = useState(existingLog ? String(existingLog.protein_g || "") : "");
  const [water, setWater] = useState(existingLog ? String(existingLog.water_oz || "") : "");
  const [sleep, setSleep] = useState(existingLog?.sleep_hours !== null && existingLog?.sleep_hours !== undefined ? String(existingLog.sleep_hours) : "");
  const [lift, setLift] = useState(Boolean(existingLog?.lift_completed));
  const [cardio, setCardio] = useState(Boolean(existingLog?.cardio_completed));
  const [notes, setNotes] = useState(existingLog?.notes || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleQuickSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/sitrep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          log_date: selectedDate,
          morning_weight_lbs: existingLog?.morning_weight_lbs ?? null,
          total_steps: parseInt(steps || "0", 10),
          calories_eaten: parseInt(eaten || "0", 10),
          kcal_burned: parseInt(burned || "0", 10),
          protein_g: parseFloat(protein || "0"),
          water_oz: parseFloat(water || "0"),
          sleep_hours: sleep ? parseFloat(sleep) : null,
          lift_completed: lift,
          cardio_completed: cardio,
          notes: notes.trim() || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to save quick debrief");
      onSaved();
      onClose();
    } catch (err) {
      console.error("Quick debrief error:", err);
      alert("Error saving debrief. Check console.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-md h-full bg-zinc-950 border-l border-white/10 shadow-2xl p-6 flex flex-col justify-between overflow-y-auto font-mono">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Moon size={18} className="text-amber-400" />
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Evening SITREP Debrief
                </h3>
                <p className="text-[11px] text-zinc-400">{selectedDate}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleQuickSave} className="space-y-4 mt-5">
            {/* Steps & Miles */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-zinc-400 mb-1">
                Final Step Count
              </label>
              <input
                type="number"
                placeholder="10,000+"
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white text-sm focus:border-cyan-400 focus:outline-none"
              />
            </div>

            {/* Calories In / Out */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-zinc-400 mb-1">
                  Calories In
                </label>
                <input
                  type="number"
                  placeholder="e.g. 2100"
                  value={eaten}
                  onChange={(e) => setEaten(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white text-sm focus:border-rose-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-zinc-400 mb-1">
                  Kcal Burned
                </label>
                <input
                  type="number"
                  placeholder="e.g. 2600"
                  value={burned}
                  onChange={(e) => setBurned(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white text-sm focus:border-emerald-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Protein & Water */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-zinc-400 mb-1">
                  Protein (g)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 165"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white text-sm focus:border-indigo-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-zinc-400 mb-1">
                  Water (oz)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 120"
                  value={water}
                  onChange={(e) => setWater(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white text-sm focus:border-sky-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Sleep */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-zinc-400 mb-1">
                Sleep (hrs)
              </label>
              <input
                type="number"
                step="0.25"
                placeholder="e.g. 7.5"
                value={sleep}
                onChange={(e) => setSleep(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white text-sm focus:border-purple-400 focus:outline-none"
              />
            </div>

            {/* Toggles */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={lift}
                  onChange={(e) => setLift(e.target.checked)}
                  className="rounded bg-zinc-900 border-white/20 text-amber-500"
                />
                <Dumbbell size={14} className={lift ? "text-amber-400" : "text-zinc-500"} />
                <span>Heavy Strength Training Completed</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cardio}
                  onChange={(e) => setCardio(e.target.checked)}
                  className="rounded bg-zinc-900 border-white/20 text-cyan-500"
                />
                <Activity size={14} className={cardio ? "text-cyan-400" : "text-zinc-500"} />
                <span>Zone-2 Incline Walk / Cardio Completed</span>
              </label>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-zinc-400 mb-1">
                Daily Lessons / Friction
              </label>
              <textarea
                rows={3}
                placeholder="What went well, any nutritional slips..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs focus:border-amber-400 focus:outline-none font-sans"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold uppercase tracking-wider text-xs shadow-xl active:scale-95 transition disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
            >
              <Save size={14} />
              <span>{isSubmitting ? "COMMITING..." : "COMMIT EVENING SITREP"}</span>
            </button>
          </form>
        </div>

        <div className="pt-4 border-t border-white/10 text-[10px] text-zinc-500 text-center">
          Hydrating directly to Supabase `daily_sitrep_logs` with auto-computed 7D moving avg & PASS grade trigger.
        </div>
      </div>
    </div>
  );
}
