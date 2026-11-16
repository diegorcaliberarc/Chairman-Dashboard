"use client";

import React, { useState } from "react";
import { Scale, TrendingDown, Check, Edit2 } from "lucide-react";
import { DailySitrepLog } from "@/lib/commandTypes";

interface BodyMassTelemetryCardProps {
  todayLog: DailySitrepLog | null;
  sitrepHistory: DailySitrepLog[];
  targetWeightLbs?: number;
  onUpdateWeight?: (weightLbs: number) => Promise<void>;
}

export function BodyMassTelemetryCard({
  todayLog,
  sitrepHistory,
  targetWeightLbs = 155.0,
  onUpdateWeight,
}: BodyMassTelemetryCardProps) {
  const currentWeightLbs = todayLog?.morning_weight_lbs ?? 178.6;
  const currentWeightKg = (currentWeightLbs * 0.453592).toFixed(2);

  // Moving average delta
  const movingAvg = todayLog?.moving_avg_7d_lbs ?? currentWeightLbs;
  const deltaLbs = (currentWeightLbs - movingAvg).toFixed(1);
  const deltaKg = (+deltaLbs * 0.453592).toFixed(2);

  // Estimated DEXA Body Fat Equiv: base estimate
  const estBf = Math.max(9, Math.min(25, 12.0 + (currentWeightLbs - targetWeightLbs) * 0.18)).toFixed(1);

  // 7-day sparkline coordinates
  const last7Days = sitrepHistory.slice(0, 7).reverse();
  const weights = last7Days.map((d) => d.morning_weight_lbs).filter((w): w is number => w !== null);

  const points = weights.length >= 2 ? weights : [181.2, 180.5, 180.8, 179.9, 179.5, 179.0, 178.6];
  const minW = Math.min(...points) - 1;
  const maxW = Math.max(...points) + 1;
  const range = maxW - minW || 1;

  // Generate SVG path for 280x60 viewport
  const svgWidth = 280;
  const svgHeight = 60;
  const coords = points.map((w, idx) => {
    const x = Math.round((idx / (points.length - 1)) * svgWidth);
    const y = Math.round(svgHeight - 10 - ((w - minW) / range) * (svgHeight - 20));
    return { x, y };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x},${c.y}`).join(" ");
  const lastCoord = coords[coords.length - 1] || { x: 280, y: 14 };
  const areaPath = `${linePath} L ${lastCoord.x},${svgHeight} L 0,${svgHeight} Z`;

  // Inline Weight Quick Edit
  const [isEditing, setIsEditing] = useState(false);
  const [inputVal, setInputVal] = useState(String(currentWeightLbs));
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateWeight) return;
    const num = parseFloat(inputVal);
    if (isNaN(num) || num <= 0) return;
    setIsSaving(true);
    try {
      await onUpdateWeight(num);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border flex flex-col shadow-xl">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Scale size={18} className="text-zinc-400" />
          <span className="font-mono font-bold text-xs uppercase tracking-wider text-zinc-100">
            Body Mass Telemetry
          </span>
        </div>
        <span className="font-mono text-[10px] font-bold text-emerald-300 uppercase px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
          {+deltaLbs <= 0 ? `${deltaLbs} LBS 7D` : `+${deltaLbs} LBS 7D`}
        </span>
      </div>

      <div className="flex items-baseline justify-between mt-2 mb-2">
        <div>
          {isEditing ? (
            <form onSubmit={handleSave} className="flex items-center gap-2 my-1">
              <input
                type="number"
                step="0.1"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                autoFocus
                className="w-24 px-2 py-1 bg-background border border-emerald-500/50 rounded font-mono text-xl font-bold text-white focus:outline-none"
              />
              <span className="font-mono text-xs text-zinc-400">lbs</span>
              <button
                type="submit"
                disabled={isSaving}
                className="p-1.5 bg-emerald-500 text-zinc-950 rounded hover:bg-emerald-400 transition"
                title="Save Scale Weight"
              >
                <Check size={14} />
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditing(true)}>
              <div className="text-2xl sm:text-3xl font-mono font-extrabold text-zinc-100 tracking-tight">
                {currentWeightLbs} <span className="text-sm font-normal text-zinc-400">lbs</span>
                <span className="text-xs font-mono text-zinc-400 ml-2">({currentWeightKg} kg)</span>
              </div>
              <Edit2 size={13} className="text-zinc-500 group-hover:text-emerald-400 transition opacity-0 group-hover:opacity-100" />
            </div>
          )}
          <div className="font-mono text-xs text-zinc-400 mt-0.5">
            Fast-weighed 06:45 AM · Target: {targetWeightLbs} lbs
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-mono font-bold text-zinc-100">{estBf}%</div>
          <div className="font-mono text-[10px] text-zinc-400 uppercase">DEXA BF Equiv</div>
        </div>
      </div>

      {/* 7-Day Sparkline inline SVG */}
      <div className="w-full h-16 pt-2">
        <svg className="w-full h-full overflow-visible" viewBox="0 0 280 60">
          <defs>
            <linearGradient id="macroWeightGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path
            d={areaPath}
            fill="url(#macroWeightGrad)"
          />
          <path
            d={linePath}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle
            cx={lastCoord.x}
            cy={lastCoord.y}
            r="4"
            fill="#10b981"
            className="animate-ping opacity-75"
          />
          <circle
            cx={lastCoord.x}
            cy={lastCoord.y}
            r="4"
            fill="#08090C"
            stroke="#10b981"
            strokeWidth="2"
          />
        </svg>
      </div>
    </div>
  );
}
