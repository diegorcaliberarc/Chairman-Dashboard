"use client";

import React, { useState } from "react";
import { Timer, Check, Plus, Minus } from "lucide-react";
import { DailySitrepLog } from "@/lib/commandTypes";

interface FastingCockpitCardProps {
  todayLog: DailySitrepLog | null;
  onUpdateFastingHours?: (hours: number) => Promise<void>;
}

export function FastingCockpitCard({
  todayLog,
  onUpdateFastingHours,
}: FastingCockpitCardProps) {
  const currentHours = todayLog?.fasting_hours ?? 14.25;
  const targetFastHours = 16.0;
  const progressPct = Math.min(100, (currentHours / targetFastHours) * 100);

  // Convert hours to "14h 15m"
  const wholeHours = Math.floor(currentHours);
  const minutes = Math.round((currentHours - wholeHours) * 60);

  // Fasting window countdown
  const hoursRemaining = Math.max(0, targetFastHours - currentHours);
  const remH = Math.floor(hoursRemaining);
  const remM = Math.round((hoursRemaining - remH) * 60);

  // SVG circular geometry
  const radius = 68;
  const circumference = 2 * Math.PI * radius; // ~427.25
  const strokeDashoffset = circumference - (circumference * progressPct) / 100;

  const [isUpdating, setIsUpdating] = useState(false);

  const handleAdjust = async (delta: number) => {
    if (!onUpdateFastingHours) return;
    const nextHours = Math.max(0, Math.min(24, +(currentHours + delta).toFixed(2)));
    setIsUpdating(true);
    try {
      await onUpdateFastingHours(nextHours);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border flex flex-col shadow-xl">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Timer size={18} className="text-amber-400" />
          <span className="font-mono font-bold text-xs uppercase tracking-wider text-zinc-100">
            16:8 Intermittent Fast
          </span>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 font-mono text-[10px] font-bold uppercase tracking-wider border border-amber-500/20">
          Zone 2 Oxidation
        </span>
      </div>

      {/* Circular Clock Graphic */}
      <div className="flex items-center justify-center my-4 relative">
        <svg className="w-44 h-44 -rotate-90 transform" viewBox="0 0 160 160">
          {/* Track Circle */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="transparent"
            stroke="currentColor"
            className="text-zinc-800"
            strokeWidth="8"
          />
          {/* Progress Arc */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="transparent"
            stroke="currentColor"
            className="text-amber-400 transition-all duration-700 ease-out"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>

        {/* Center Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
            Fasting Elapsed
          </span>
          <span className="font-mono text-3xl font-extrabold text-zinc-100 tracking-tight mt-0.5">
            {wholeHours}h {minutes}m
          </span>
          <span className="font-mono text-[10px] font-bold text-cyan-400 uppercase tracking-widest mt-1">
            {hoursRemaining <= 0
              ? "Window Open"
              : `Window in ${remH}h ${remM}m`}
          </span>
        </div>
      </div>

      {/* Quick Stepper Adjuster */}
      <div className="flex items-center justify-center gap-2 mb-3">
        <button
          onClick={() => handleAdjust(-0.5)}
          disabled={isUpdating}
          className="p-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-border text-xs transition"
          title="-30 mins"
        >
          <Minus size={13} />
        </button>
        <span className="font-mono text-[11px] text-zinc-400">
          Fast Log: <strong className="text-zinc-200">{currentHours}h</strong> / {targetFastHours}h
        </span>
        <button
          onClick={() => handleAdjust(0.5)}
          disabled={isUpdating}
          className="p-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-border text-xs transition"
          title="+30 mins"
        >
          <Plus size={13} />
        </button>
      </div>

      {/* Footer Info Grid */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border text-center">
        <div className="p-2 bg-background rounded-xl border border-border">
          <div className="font-mono text-[10px] text-zinc-400 uppercase">Fast Initiated</div>
          <div className="font-mono text-xs font-bold text-zinc-200 mt-0.5">20:30 PM</div>
        </div>
        <div className="p-2 bg-background rounded-xl border border-border">
          <div className="font-mono text-[10px] text-zinc-400 uppercase">Target Break</div>
          <div className="font-mono text-xs font-bold text-amber-300 mt-0.5">12:30 PM</div>
        </div>
      </div>
    </div>
  );
}
