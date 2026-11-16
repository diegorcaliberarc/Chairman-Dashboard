"use client";

import React, { useMemo } from "react";
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
}: MacroSubheaderProps) {
  // Format selected date for display
  const formattedDate = useMemo(() => {
    try {
      const [y, m, d] = selectedDate.split("-").map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
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

  // Generate 7-day pill rail surrounding or anchored around current week
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
        else status = "pass";
      }

      return {
        label: labels[i],
        dateStr,
        dayNum: iter.getDate(),
        isSelected,
        isCurToday,
        status,
      };
    });
  }, [selectedDate, sitrepHistory]);

  const targetDeficitKcal = todayLog?.kcal_deficit ?? sitrepStats?.avgDeficit ?? -610;
  const grade = String(todayLog?.sitrep_grade || "pass").toLowerCase();

  return (
    <section className="w-full bg-surface border-b border-border px-4 lg:px-6 py-4 transition-colors">
      <div className="flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-4">
        {/* Date Navigation & Weekday Selector Strip */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {/* Date Picker Pill */}
          <div className="flex items-center gap-1.5 bg-background px-3 py-1 rounded-full border border-border">
            <button
              onClick={() => stepDate(-1)}
              className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              title="Previous Day"
              type="button"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-2 px-1">
              <span className="font-mono font-bold text-sm tracking-tight text-zinc-100">
                {formattedDate}
              </span>
              {isToday && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Today
                </span>
              )}
            </div>
            <button
              onClick={() => stepDate(1)}
              className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              title="Next Day"
              type="button"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Weekly Pill Rail */}
          <div className="flex items-center gap-1 bg-background p-1 rounded-full border border-border">
            {weekDays.map((d) => {
              return (
                <button
                  key={d.dateStr}
                  onClick={() => onDateChange(d.dateStr)}
                  type="button"
                  className={`flex flex-col items-center justify-center w-8 h-10 rounded-full transition-all text-xs font-mono font-bold ${
                    d.isSelected
                      ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/30"
                      : d.isCurToday
                      ? "bg-zinc-800 text-zinc-100 border border-emerald-500/40"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                  } ${d.status === "future" ? "opacity-40" : "opacity-100"}`}
                  title={`${d.dateStr} - Status: ${d.status.toUpperCase()}`}
                >
                  <span>{d.label}</span>
                  <span
                    className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                      d.isSelected
                        ? "bg-zinc-950"
                        : d.status === "pass"
                        ? "bg-emerald-400 shadow-sm shadow-emerald-400/50"
                        : d.status === "partial"
                        ? "bg-amber-400"
                        : d.status === "miss"
                        ? "bg-rose-400"
                        : "bg-zinc-600"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Telemetry Badges Strip & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Deficit Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background border border-border text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-zinc-400 uppercase text-[11px]">Deficit:</span>
            <span className="font-bold text-amber-300">
              {targetDeficitKcal > 0 ? `+${targetDeficitKcal}` : targetDeficitKcal} KCAL
            </span>
          </div>

          {/* Protocol Compliance Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background border border-border text-xs font-mono">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span className="text-zinc-400 uppercase text-[11px]">Protocol:</span>
            <span
              className={`font-bold uppercase ${
                grade === "pass"
                  ? "text-emerald-400"
                  : grade === "partial"
                  ? "text-amber-400"
                  : "text-rose-400"
              }`}
            >
              {grade === "pass" ? "Strict Compliance" : grade}
            </span>
          </div>

          {/* Sync Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background border border-border text-xs font-mono">
            <Watch size={14} className="text-cyan-400" />
            <span className="text-zinc-400 uppercase text-[11px]">Sync:</span>
            <span className="font-bold text-cyan-300">WHOOP · OURA SYNCED</span>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
            <button
              onClick={onOpenLogMeal}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-mono font-bold text-xs uppercase rounded-full shadow-lg shadow-emerald-500/20 active:scale-95 transition"
            >
              <Utensils size={14} />
              <span>+ Log Meal</span>
            </button>

            <button
              onClick={() => onQuickAddWater(16.9)} // ~500ml flask
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-cyan-400 border border-cyan-500/30 font-mono font-bold text-xs uppercase rounded-full active:scale-95 transition"
              title="Quick Add 500ml (16.9 oz) Water"
            >
              <Droplets size={14} />
              <span>+ Water</span>
            </button>

            <button
              onClick={onOpenDebrief}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-amber-500/30 font-mono font-bold text-xs uppercase rounded-full active:scale-95 transition"
              title="Open Evening Debrief"
            >
              <Moon size={14} />
              <span className="hidden md:inline">Debrief</span>
            </button>

            <button
              onClick={onRefresh}
              type="button"
              className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-border rounded-full transition"
              title="Refresh Telemetry"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin text-amber-400" : ""} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
