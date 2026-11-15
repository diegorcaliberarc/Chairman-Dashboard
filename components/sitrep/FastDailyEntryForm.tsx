"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Save,
  CheckCircle2,
  Calendar,
  Sparkles,
  Dumbbell,
  Activity,
  Footprints,
} from "lucide-react";
import { DailySitrepLog } from "@/lib/commandTypes";

interface FastDailyEntryFormProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  existingLog: DailySitrepLog | null;
  onSaved: () => void;
}

export function FastDailyEntryForm({
  selectedDate,
  onDateChange,
  existingLog,
  onSaved,
}: FastDailyEntryFormProps) {
  const [weight, setWeight] = useState<string>("");
  const [steps, setSteps] = useState<string>("");
  const [eaten, setEaten] = useState<string>("");
  const [burned, setBurned] = useState<string>("");
  const [protein, setProtein] = useState<string>("");
  const [water, setWater] = useState<string>("");
  const [sleep, setSleep] = useState<string>("");
  const [fasting, setFasting] = useState<string>("");
  const [lift, setLift] = useState<boolean>(false);
  const [cardio, setCardio] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [savedToast, setSavedToast] = useState<boolean>(false);

  // Hydrate fields when selected date or existingLog changes
  useEffect(() => {
    if (existingLog) {
      setWeight(existingLog.morning_weight_lbs !== null ? String(existingLog.morning_weight_lbs) : "");
      setSteps(existingLog.total_steps ? String(existingLog.total_steps) : "");
      setEaten(existingLog.calories_eaten ? String(existingLog.calories_eaten) : "");
      setBurned(existingLog.kcal_burned ? String(existingLog.kcal_burned) : "");
      setProtein(existingLog.protein_g ? String(existingLog.protein_g) : "");
      setWater(existingLog.water_oz ? String(existingLog.water_oz) : "");
      setSleep(existingLog.sleep_hours !== null ? String(existingLog.sleep_hours) : "");
      setFasting(existingLog.fasting_hours !== null ? String(existingLog.fasting_hours) : "");
      setLift(Boolean(existingLog.lift_completed));
      setCardio(Boolean(existingLog.cardio_completed));
      setNotes(existingLog.notes || "");
    } else {
      setWeight("");
      setSteps("");
      setEaten("");
      setBurned("");
      setProtein("");
      setWater("");
      setSleep("");
      setFasting("");
      setLift(false);
      setCardio(false);
      setNotes("");
    }
  }, [existingLog, selectedDate]);

  // Auto-calculated fields
  const parsedSteps = parseInt(steps || "0", 10);
  const calculatedMiles = (parsedSteps / 2100).toFixed(2);
  const parsedEaten = parseInt(eaten || "0", 10);
  const parsedBurned = parseInt(burned || "0", 10);
  const netDeficit = parsedBurned - parsedEaten;

  // Date Stepper controls
  const handlePrevDay = () => {
    const d = new Date(selectedDate + "T12:00:00Z");
    d.setDate(d.getDate() - 1);
    onDateChange(d.toISOString().slice(0, 10));
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate + "T12:00:00Z");
    d.setDate(d.getDate() + 1);
    onDateChange(d.toISOString().slice(0, 10));
  };

  const handleToday = () => {
    onDateChange(new Date().toISOString().slice(0, 10));
  };

  const isToday = selectedDate === new Date().toISOString().slice(0, 10);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/sitrep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          log_date: selectedDate,
          morning_weight_lbs: weight ? parseFloat(weight) : null,
          total_steps: parsedSteps,
          calories_eaten: parsedEaten,
          kcal_burned: parsedBurned,
          protein_g: protein ? parseFloat(protein) : 0,
          water_oz: water ? parseFloat(water) : 0,
          sleep_hours: sleep ? parseFloat(sleep) : null,
          fasting_hours: fasting ? parseFloat(fasting) : null,
          lift_completed: lift,
          cardio_completed: cardio,
          notes: notes.trim() || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to save sitrep log");
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 2400);
      onSaved();
    } catch (err) {
      console.error("Save error:", err);
      alert("Error saving daily SITREP entry. Check console.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-5 rounded-2xl bg-zinc-950/70 border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden space-y-4"
    >
      {/* Top Header with Date Stepper */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
            Fast Daily SITREP Entry
          </h3>
          {existingLog && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Logged
            </span>
          )}
        </div>

        {/* Date Stepper: < Yesterday | Today | Tomorrow > */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900/90 border border-white/10 text-zinc-300 font-mono text-xs">
          <button
            type="button"
            onClick={handlePrevDay}
            className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition"
            title="Yesterday"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            onClick={handleToday}
            className={`px-2 py-0.5 rounded font-bold transition text-[11px] ${
              isToday ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "hover:text-white"
            }`}
          >
            {isToday ? "Today" : selectedDate}
          </button>
          <button
            type="button"
            onClick={handleNextDay}
            className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition"
            title="Tomorrow"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Grid Inputs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Morning Weight */}
        <div>
          <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
            Morning Weight (lbs)
          </label>
          <input
            type="number"
            step="0.1"
            placeholder="e.g. 165.2"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-zinc-900/80 border border-white/10 text-white font-mono text-sm placeholder-zinc-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
          />
        </div>

        {/* Steps & Auto-Calculated Miles */}
        <div>
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
            <span>Total Steps</span>
            <span className="text-cyan-400 lowercase">{calculatedMiles} mi</span>
          </div>
          <div className="relative">
            <input
              type="number"
              placeholder="e.g. 10500"
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-900/80 border border-white/10 text-white font-mono text-sm placeholder-zinc-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
            />
          </div>
        </div>

        {/* Calories Eaten */}
        <div>
          <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
            Calories Eaten (kcal)
          </label>
          <input
            type="number"
            placeholder="e.g. 2100"
            value={eaten}
            onChange={(e) => setEaten(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-zinc-900/80 border border-white/10 text-white font-mono text-sm placeholder-zinc-600 focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 transition"
          />
        </div>

        {/* Kcal Burned & Net Deficit Badge */}
        <div>
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
            <span>Kcal Burned</span>
            <span className={netDeficit >= 350 ? "text-emerald-400 font-bold" : "text-amber-400"}>
              {netDeficit > 0 ? `+${netDeficit} def` : `${netDeficit} def`}
            </span>
          </div>
          <input
            type="number"
            placeholder="e.g. 2600"
            value={burned}
            onChange={(e) => setBurned(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-zinc-900/80 border border-white/10 text-white font-mono text-sm placeholder-zinc-600 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition"
          />
        </div>

        {/* Protein (g) */}
        <div>
          <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
            Protein (g)
          </label>
          <input
            type="number"
            step="0.5"
            placeholder="e.g. 165"
            value={protein}
            onChange={(e) => setProtein(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-zinc-900/80 border border-white/10 text-white font-mono text-sm placeholder-zinc-600 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition"
          />
        </div>

        {/* Water (oz) */}
        <div>
          <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
            Water (oz)
          </label>
          <input
            type="number"
            placeholder="e.g. 120"
            value={water}
            onChange={(e) => setWater(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-zinc-900/80 border border-white/10 text-white font-mono text-sm placeholder-zinc-600 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition"
          />
        </div>

        {/* Sleep Hours */}
        <div>
          <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
            Sleep Duration (hrs)
          </label>
          <input
            type="number"
            step="0.25"
            placeholder="e.g. 7.5"
            value={sleep}
            onChange={(e) => setSleep(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-zinc-900/80 border border-white/10 text-white font-mono text-sm placeholder-zinc-600 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition"
          />
        </div>

        {/* Fasting Duration */}
        <div>
          <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
            Fasting Window (hrs)
          </label>
          <input
            type="number"
            step="0.5"
            placeholder="e.g. 16.0"
            value={fasting}
            onChange={(e) => setFasting(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-zinc-900/80 border border-white/10 text-white font-mono text-sm placeholder-zinc-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
          />
        </div>
      </div>

      {/* Routine Checkboxes + Notes + Submit Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-xs font-mono text-zinc-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={lift}
              onChange={(e) => setLift(e.target.checked)}
              className="rounded bg-zinc-900 border-white/20 text-amber-500 focus:ring-amber-500"
            />
            <Dumbbell size={14} className={lift ? "text-amber-400" : "text-zinc-500"} />
            <span>Heavy Lift Done</span>
          </label>

          <label className="flex items-center gap-2 text-xs font-mono text-zinc-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={cardio}
              onChange={(e) => setCardio(e.target.checked)}
              className="rounded bg-zinc-900 border-white/20 text-cyan-500 focus:ring-cyan-500"
            />
            <Activity size={14} className={cardio ? "text-cyan-400" : "text-zinc-500"} />
            <span>Zone-2 Cardio Done</span>
          </label>
        </div>

        <div className="flex items-center gap-2.5 ml-auto">
          <input
            type="text"
            placeholder="Daily debrief notes, energy levels..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-64 px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-white/10 text-white font-mono text-xs placeholder-zinc-600 focus:outline-none focus:border-amber-400 transition"
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold font-mono text-xs tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 transition disabled:opacity-50"
          >
            {savedToast ? (
              <>
                <CheckCircle2 size={14} className="text-zinc-950" />
                <span>SAVED!</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>{isSubmitting ? "UPSERTING..." : "COMMIT SITREP"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
