"use client";

import React, { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Utensils,
  Droplets,
  RefreshCw,
  Moon,
  Watch,
  ShieldCheck,
  Flame,
  Footprints,
  Timer,
} from "lucide-react";
import { DailySitrepLog } from "@/lib/commandTypes";

interface MacroSubheaderProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  todayLog: DailySitrepLog | null;
  sitrepStats: any;
  sitrepHistory: DailySitrepLog[];
  isLoading: boolean;
  onOpenLogMeal: () => void;
  onQuickAddWater: (deltaOz: number) => void;
  onOpenDebrief: () => void;
  onRefresh: () => void;
  onUpdateSteps?: (steps: number) => Promise<void>;
  onUpdateFastingHours?: (hours: number) => Promise<void>;
}

export function MacroSubheader({
  selectedDate,
  onDateChange,
  todayLog,
  sitrepStats,
  sitrepHistory,
  isLoading,
  onOpenLogMeal,
  onQuickAddWater,
  onOpenDebrief,
  onRefresh,
  onUpdateSteps,
  onUpdateFastingHours,
}: MacroSubheaderProps) {
  const [editingSteps, setEditingSteps] = useState(false);
  const [stepsInput, setStepsInput] = useState("");

  // Format selected date for display
  const formattedDate = useMemo(() => {
    try {
      const [y, m, d] = selectedDate.split("-").map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  const isToday = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return selectedDate === todayStr;
  }, [selectedDate]);

  // Navigate date backwards / forwards
  const stepDate = (days: number) => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const cur = new Date(y, m - 1, d);
    cur.setDate(cur.getDate() + days);
    const nextStr = cur.toISOString().slice(0, 10);
    onDateChange(nextStr);
  };

  // Generate 7-day pill rail surrounding current week
  const weekDays = useMemo(() => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const cur = new Date(y, m - 1, d);
    const dayOfWeek = cur.getDay(); // 0 is Sunday
    const startOfWeek = new Date(cur);
    startOfWeek.setDate(cur.getDate() - dayOfWeek);

    const todayStr = new Date().toISOString().slice(0, 10);
    const historyMap = new Map(sitrepHistory.map((h) => [h.log_date, h]));

    const labels = ["S", "M", "T", "W", "T", "F", "S"];
    return Array.from({ length: 7 }, (_, i) => {
      const iter = new Date(startOfWeek);
      iter.setDate(startOfWeek.getDate() + i);
      const dateStr = iter.toISOString().slice(0, 10);
      const isSelected = dateStr === selectedDate;
      const isCurToday = dateStr === todayStr;
      const log = historyMap.get(dateStr);
      const isFuture = dateStr > todayStr;

      let status: "pass" | "partial" | "miss" | "empty" | "future" = "empty";
      if (isFuture) {
        status = "future";
      } else if (log) {
        const g = String(log.sitrep_grade || "").toLowerCase();
        if (g === "pass") status = "pass";
        else if (g === "partial") status = "partial";
        else if (g === "miss") status = "miss";
      }

      return {
        dateStr,
        label: labels[i],
        dayNum: iter.getDate(),
        isSelected,
        isCurToday,
        status,
      };
    });
  }, [selectedDate, sitrepHistory]);

  const steps = todayLog?.total_steps || 0;
  const targetSteps = 12000;
  const stepPct = Math.min(100, Math.round((steps / targetSteps) * 100));

  const fastingHours = todayLog?.fasting_hours || 0;

  const handleStepsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(stepsInput, 10);
    if (!isNaN(val) && onUpdateSteps) {
      await onUpdateSteps(val);
      setEditingSteps(false);
      setStepsInput("");
    }
  };

  return (
    <section className="w-full bg-surface border-b border-border px-4 lg:px-6 py-3.5 transition-colors">
      <div className="flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-3">
        {/* Date Navigation & Weekday Selector Strip */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Picker Pill */}
          <div className="flex items-center gap-1 bg-background px-2.5 py-1 rounded-full border border-border">
            <button
              onClick={() => stepDate(-1)}
              className="w-6 h-6 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              title="Previous Day"
              type="button"
            >
              <ChevronLeft size={14} />
            </button>
            <div className="flex items-center gap-1.5 px-1 font-mono">
              <span className="font-bold text-xs tracking-tight text-zinc-100">
                {formattedDate}
              </span>
              {isToday && (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Today
                </span>
              )}
            </div>
            <button
              onClick={() => stepDate(1)}
              className="w-6 h-6 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              title="Next Day"
              type="button"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Weekly Pill Rail */}
          <div className="flex items-center gap-1 bg-background p-1 rounded-full border border-border">
            {weekDays.map((d) => (
              <button
                key={d.dateStr}
                onClick={() => onDateChange(d.dateStr)}
                type="button"
                className={`flex flex-col items-center justify-center w-7 h-9 rounded-full transition-all text-[11px] font-mono font-bold ${
                  d.isSelected
                    ? "bg-cyan-500 text-zinc-950 shadow-md shadow-cyan-500/30"
                    : d.isCurToday
                    ? "bg-zinc-800 text-zinc-100 border border-cyan-500/40"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                } ${d.status === "future" ? "opacity-40" : "opacity-100"}`}
                title={`${d.dateStr} - Status: ${d.status.toUpperCase()}`}
              >
                <span>{d.label}</span>
                <span
                  className={`w-1 h-1 rounded-full mt-0.5 ${
                    d.isSelected
                      ? "bg-zinc-950"
                      : d.status === "pass"
                      ? "bg-emerald-400"
                      : d.status === "partial"
                      ? "bg-amber-400"
                      : d.status === "miss"
                      ? "bg-rose-400"
                      : "bg-zinc-600"
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Compact 16:8 Fasting Telemetry Pill */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-background border border-border font-mono text-xs">
            <Timer size={13} className="text-amber-400" />
            <span className="text-zinc-400 text-[11px] uppercase">Fast 16:8:</span>
            <span className="font-bold text-amber-300">
              {fastingHours > 0 ? `${fastingHours}h Logged` : "0h / Ready"}
            </span>
            {onUpdateFastingHours && (
              <button
                onClick={() => onUpdateFastingHours(fastingHours >= 16 ? 0 : 16)}
                className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold border border-amber-500/20 transition"
              >
                {fastingHours >= 16 ? "Reset" : "+16h"}
              </button>
            )}
          </div>

          {/* Kinetic Step Engine Widget */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-background border border-border font-mono text-xs">
            <Footprints size={13} className="text-cyan-400" />
            <span className="text-zinc-400 text-[11px] uppercase">Steps:</span>
            {editingSteps ? (
              <form onSubmit={handleStepsSubmit} className="flex items-center gap-1">
                <input
                  type="number"
                  placeholder="Steps..."
                  value={stepsInput}
                  onChange={(e) => setStepsInput(e.target.value)}
                  autoFocus
                  className="w-20 bg-surface border border-cyan-400 rounded px-1.5 py-0.5 text-xs text-white"
                />
                <button
                  type="submit"
                  className="px-1.5 py-0.5 bg-cyan-400 text-zinc-950 font-bold text-[10px] rounded"
                >
                  OK
                </button>
              </form>
            ) : (
              <div
                onClick={() => {
                  setStepsInput(String(steps || ""));
                  setEditingSteps(true);
                }}
                className="cursor-pointer hover:underline flex items-center gap-1"
                title="Click to log steps"
              >
                <span className="font-bold text-cyan-300">{steps.toLocaleString()}</span>
                <span className="text-zinc-500 text-[10px]">/ 12k</span>
                <span className="text-[10px] text-zinc-400">({stepPct}%)</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Telemetry Actions */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            onClick={onOpenLogMeal}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-xs uppercase rounded-full shadow-lg shadow-cyan-500/20 active:scale-95 transition"
          >
            <Utensils size={13} />
            <span>+ Log Fuel</span>
          </button>

          <button
            onClick={() => onQuickAddWater(16.9)} // ~500ml
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-background hover:bg-zinc-800 text-sky-400 border border-sky-500/30 font-bold text-xs uppercase rounded-full active:scale-95 transition"
            title="Quick Add 500ml Flask"
          >
            <Droplets size={13} />
            <span>+500ml Water</span>
          </button>

          <button
            onClick={onOpenDebrief}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-background hover:bg-zinc-800 text-amber-300 border border-amber-500/30 font-bold text-xs uppercase rounded-full active:scale-95 transition"
          >
            <Moon size={13} />
            <span className="hidden md:inline">Debrief</span>
          </button>

          <button
            onClick={onRefresh}
            type="button"
            className="p-1.5 bg-background hover:bg-zinc-800 text-zinc-400 hover:text-white border border-border rounded-full transition"
            title="Refresh Telemetry"
          >
            <RefreshCw size={13} className={isLoading ? "animate-spin text-cyan-400" : ""} />
          </button>
        </div>
      </div>
    </section>
  );
}
