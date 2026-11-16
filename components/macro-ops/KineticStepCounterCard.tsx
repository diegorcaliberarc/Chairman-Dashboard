"use client";

import React, { useState } from "react";
import { Footprints, Plus, Minus } from "lucide-react";
import { DailySitrepLog } from "@/lib/commandTypes";

interface KineticStepCounterCardProps {
  todayLog: DailySitrepLog | null;
  onUpdateSteps?: (steps: number) => Promise<void>;
}

export function KineticStepCounterCard({
  todayLog,
  onUpdateSteps,
}: KineticStepCounterCardProps) {
  const steps = todayLog?.total_steps ?? 11420;
  const targetSteps = 12000;
  const pct = Math.min(100, Math.round((steps / targetSteps) * 100));
  const miles = todayLog?.miles ?? +(steps / 2100).toFixed(2);
  const pacingDelta = steps - 10000;

  // Mini circular SVG parameters (viewBox 0 0 40 40)
  const radius = 16;
  const circumference = 2 * Math.PI * radius; // ~100.53
  const strokeDashoffset = circumference - (circumference * pct) / 100;

  const [isUpdating, setIsUpdating] = useState(false);

  const handleAdjustSteps = async (delta: number) => {
    if (!onUpdateSteps) return;
    const nextSteps = Math.max(0, steps + delta);
    setIsUpdating(true);
    try {
      await onUpdateSteps(nextSteps);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border flex items-center justify-between shadow-xl">
      <div>
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-xs uppercase tracking-wider text-zinc-400">
            Kinetic Step Engine
          </span>
        </div>
        <div className="text-2xl sm:text-3xl font-mono font-extrabold text-zinc-100 tracking-tight mt-1">
          {steps.toLocaleString()}{" "}
          <span className="text-sm font-normal text-zinc-400">/ {targetSteps.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="font-mono text-[10px] font-bold text-emerald-300 uppercase">
            {pct}% Reached ({miles} mi · {pacingDelta >= 0 ? `+${pacingDelta.toLocaleString()}` : pacingDelta.toLocaleString()})
          </span>
        </div>

        {/* Quick Stepper */}
        <div className="flex items-center gap-1.5 mt-2">
          <button
            onClick={() => handleAdjustSteps(-500)}
            disabled={isUpdating}
            className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-border text-[10px] font-mono transition"
            title="-500 steps"
          >
            -500
          </button>
          <button
            onClick={() => handleAdjustSteps(500)}
            disabled={isUpdating}
            className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-border text-[10px] font-mono transition"
            title="+500 steps"
          >
            +500
          </button>
          <button
            onClick={() => handleAdjustSteps(1000)}
            disabled={isUpdating}
            className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-emerald-400 hover:text-emerald-300 border border-border text-[10px] font-mono font-bold transition"
            title="+1,000 steps"
          >
            +1k
          </button>
        </div>
      </div>

      {/* Mini SVG Step Ring */}
      <div className="w-16 h-16 relative flex items-center justify-center shrink-0">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 40 40">
          <circle
            cx="20"
            cy="20"
            r={radius}
            fill="transparent"
            stroke="currentColor"
            className="text-zinc-800"
            strokeWidth="4"
          />
          <circle
            cx="20"
            cy="20"
            r={radius}
            fill="transparent"
            stroke="currentColor"
            className="text-emerald-400 transition-all duration-700 ease-out"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
        <Footprints size={20} className="text-emerald-400 absolute" />
      </div>
    </div>
  );
}
