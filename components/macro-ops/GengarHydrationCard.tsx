"use client";

import React, { useState } from "react";
import { Droplet, Plus, Sparkles, RotateCcw, CheckCircle2, Waves, ArrowUpRight } from "lucide-react";
import { DailySitrepLog } from "@/lib/commandTypes";

interface GengarHydrationCardProps {
  todayLog?: DailySitrepLog | null;
  dailyLog?: any;
  totals?: { water_oz?: number; calories?: number; protein?: number; carbs?: number; fat?: number };
  onQuickAddWater?: (deltaOz: number) => Promise<void>;
  onSetWater?: (totalOz: number) => Promise<void>;
}

export function GengarHydrationCard({
  todayLog,
  dailyLog,
  totals,
  onQuickAddWater,
  onSetWater,
}: GengarHydrationCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const [unitMode, setUnitMode] = useState<"oz" | "ml">("oz");
  const [isDancing, setIsDancing] = useState(false);
  const [splashLabel, setSplashLabel] = useState<string | null>(null);
  const danceTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerGengarDance = (label: string) => {
    setIsDancing(false);
    setSplashLabel(label);
    if (danceTimerRef.current) clearTimeout(danceTimerRef.current);
    requestAnimationFrame(() => {
      setIsDancing(true);
    });
    danceTimerRef.current = setTimeout(() => {
      setIsDancing(false);
      setSplashLabel(null);
    }, 1050);
  };

  // Target: 3.8L (~128.5 oz)
  const targetLiters = 3.8;
  const targetOz = 128.5;

  // Real-time Water in oz: from todayLog or live food entries
  const currentOz = Math.max(
    Number(todayLog?.water_oz || 0),
    Number(totals?.water_oz || 0)
  );

  // Convert current water_oz to Liters (0.0 if not logged)
  const currentLiters = currentOz > 0 ? +(currentOz / 33.814).toFixed(1) : 0.0;
  const progressPct = Math.min(100, Math.max(0, Math.round((currentOz / targetOz) * 100)));
  const remainingMl = Math.max(0, Math.round((targetLiters - currentLiters) * 1000));
  const remainingOz = Math.max(0, +(targetOz - currentOz).toFixed(1));

  // Liquid level inside Gengar vessel (0 to 100)
  const isEmpty = currentOz <= 0.05;
  const isFull = progressPct >= 100;

  // Add water in Milliliters
  const handleAddMl = async (ml: number) => {
    const deltaOz = +(ml / 29.5735).toFixed(1);
    triggerGengarDance(`+${ml}ml`);
    await handleAddOz(deltaOz, true);
  };

  // Add water in Ounces
  const handleAddOz = async (deltaOz: number, alreadyDanced = false) => {
    if (!onQuickAddWater && !onSetWater) return;
    if (!alreadyDanced && deltaOz > 0) {
      triggerGengarDance(`+${deltaOz}oz`);
    }
    setIsUpdating(true);
    try {
      if (onQuickAddWater) {
        await onQuickAddWater(deltaOz);
      } else if (onSetWater) {
        await onSetWater(+(currentOz + deltaOz).toFixed(1));
      }
    } finally {
      setIsUpdating(false);
    }
  };

  // Set total water directly
  const handleSetExact = async (valOz: number) => {
    if (!onSetWater && !onQuickAddWater) return;
    setIsUpdating(true);
    try {
      if (onSetWater) {
        await onSetWater(valOz);
      } else if (onQuickAddWater) {
        const diff = valOz - currentOz;
        await onQuickAddWater(diff);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  // Reset to 0
  const handleReset = async () => {
    if (confirm("Reset today's water intake back to 0 oz (empty)?")) {
      await handleSetExact(0);
    }
  };

  // Custom Input Submission (handles both "Add" and "Set")
  const handleCustomAction = async (action: "add" | "set") => {
    const val = parseFloat(customValue);
    if (isNaN(val) || val <= 0) return;

    const valOz = unitMode === "ml" ? +(val / 29.5735).toFixed(1) : val;

    if (action === "add") {
      await handleAddOz(valOz);
    } else {
      await handleSetExact(valOz);
    }
    setCustomValue("");
  };

  // Calculate SVG liquid height (120px tall mascot viewBox)
  // Masked height runs from y=105 (feet) up to y=15 (horns/ears) -> 90px fillable range
  const liquidY = 105 - (90 * (progressPct / 100));
  const liquidHeight = 90 * (progressPct / 100);

  return (
    <div
      className="p-4 rounded-2xl border transition-all duration-300 flex flex-col shadow-2xl relative overflow-hidden"
      style={{
        backgroundColor: "var(--glass-surface, #0d1120)",
        backdropFilter: "blur(var(--glass-blur, 26px)) saturate(185%)",
        WebkitBackdropFilter: "blur(var(--glass-blur, 26px)) saturate(185%)",
        borderColor: "var(--glass-border, rgba(255,255,255,0.12))",
        boxShadow: "inset 0 1px 0 0 var(--glass-specular, rgba(255,255,255,0.15)), var(--glass-shadow, rgba(0,0,0,0.5))",
      }}
    >
      {/* ── CARD HEADER: Retitled to WATER INTAKE ── */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
            <Droplet className="w-3.5 h-3.5 fill-cyan-400/20" />
          </div>
          <div>
            <h3
              className="font-mono font-medium text-xs uppercase tracking-wider flex items-center gap-2"
              style={{ color: "var(--glass-text-primary)" }}
            >
              <span>Water Intake</span>
              {isFull && (
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 font-medium uppercase animate-pulse">
                  Target Hit!
                </span>
              )}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleReset}
            disabled={isEmpty || isUpdating}
            className="p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition disabled:opacity-30 disabled:pointer-events-none"
            title="Reset water intake to 0 oz"
          >
            <RotateCcw size={12} />
          </button>
          <span className="font-mono text-[10px] text-cyan-300 font-bold uppercase px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-400/30">
            Target 3.8L / 128 oz
          </span>
        </div>
      </div>

      {/* ── GENGAR VESSEL & TELEMETRY HUB ── */}
      <div
        className="flex items-center gap-3 my-2 p-3 rounded-xl border transition-colors relative"
        style={{
          backgroundColor: "var(--glass-surface-elevated, #13182b)",
          borderColor: "var(--glass-border, rgba(255,255,255,0.08))",
        }}
      >
        {/* Interactive Gengar Hydro-Vessel */}
        <div
          className={`relative flex-shrink-0 w-28 h-28 rounded-2xl border flex items-center justify-center overflow-hidden transition-all duration-500 ${
            isEmpty
              ? "border-purple-500/20 bg-purple-950/10 shadow-none"
              : isFull
              ? "border-cyan-400 bg-cyan-950/20 shadow-[0_0_25px_rgba(0,240,255,0.35)]"
              : "border-cyan-500/40 bg-purple-950/20 shadow-[0_0_16px_rgba(56,189,248,0.25)]"
          }`}
        >
          {/* Floating Hydration Splash Bubble when Gengar dances */}
          {splashLabel && (
            <span className="absolute top-1 left-1/2 -translate-x-1/2 z-30 px-1.5 py-0.5 rounded-full bg-cyan-400 text-zinc-950 font-mono text-[9px] font-medium shadow-md animate-bounce pointer-events-none">
              {splashLabel}
            </span>
          )}

          {/* Custom SVG Gengar Hydro-Vessel */}
          <svg
            viewBox="0 0 120 120"
            className={`w-full h-full p-1 select-none transition-transform hover:scale-105 ${
              isDancing ? "animate-gengar-dance" : ""
            }`}
          >
            <defs>
              {/* Gengar Body Outline Silhouette ClipPath */}
              <clipPath id="gengar-body-mask">
                <path d="M 22 18 L 32 36 L 40 28 L 50 36 L 60 22 L 70 36 L 80 28 L 88 36 L 98 18 L 96 46 Q 108 58 106 78 Q 104 98 90 104 L 88 112 L 74 106 L 60 108 L 46 106 L 32 112 L 30 104 Q 16 98 14 78 Q 12 58 24 46 Z" />
              </clipPath>

              {/* Water Gradient */}
              <linearGradient id="gengar-water-grad" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#0284c7" />
                <stop offset="50%" stopColor="#00f0ff" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>

              {/* Liquid Wave Pattern */}
              <linearGradient id="wave-highlight" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
                <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.6" />
              </linearGradient>
            </defs>

            {/* Vessel Glass Void (Dark Translucent Ghost Silhouette) */}
            <path
              d="M 22 18 L 32 36 L 40 28 L 50 36 L 60 22 L 70 36 L 80 28 L 88 36 L 98 18 L 96 46 Q 108 58 106 78 Q 104 98 90 104 L 88 112 L 74 106 L 60 108 L 46 106 L 32 112 L 30 104 Q 16 98 14 78 Q 12 58 24 46 Z"
              fill={isEmpty ? "#120e24" : "#1a1236"}
              stroke={isEmpty ? "rgba(168, 85, 247, 0.25)" : "rgba(0, 240, 255, 0.4)"}
              strokeWidth="2"
              strokeDasharray={isEmpty ? "3 3" : undefined}
            />

            {/* Fluid Container (Masked by Gengar Body) */}
            <g clipPath="url(#gengar-body-mask)">
              {/* Measurement Volume Tier Lines */}
              <line x1="20" y1="82.5" x2="100" y2="82.5" stroke="rgba(255,255,255,0.08)" strokeDasharray="2 2" strokeWidth="1" />
              <line x1="20" y1="60" x2="100" y2="60" stroke="rgba(255,255,255,0.08)" strokeDasharray="2 2" strokeWidth="1" />
              <line x1="20" y1="37.5" x2="100" y2="37.5" stroke="rgba(255,255,255,0.08)" strokeDasharray="2 2" strokeWidth="1" />

              {/* Dynamic Rising Water Column */}
              {!isEmpty && (
                <g className="transition-all duration-700 ease-out">
                  {/* Rising Water Body */}
                  <rect
                    x="10"
                    y={liquidY}
                    width="100"
                    height={liquidHeight + 15}
                    fill="url(#gengar-water-grad)"
                    opacity="0.85"
                  />

                  {/* Surface Ripple Line */}
                  <ellipse
                    cx="60"
                    cy={liquidY}
                    rx="44"
                    ry="3.5"
                    fill="url(#wave-highlight)"
                    opacity="0.9"
                  />

                  {/* Dynamic Bubbles */}
                  <circle cx="45" cy={Math.min(100, liquidY + 18)} r="2" fill="#ffffff" opacity="0.6" className="animate-pulse" />
                  <circle cx="68" cy={Math.min(100, liquidY + 28)} r="1.5" fill="#ffffff" opacity="0.5" className="animate-pulse" />
                  <circle cx="56" cy={Math.min(100, liquidY + 12)} r="2.5" fill="#ffffff" opacity="0.7" className="animate-pulse" />
                </g>
              )}
            </g>

            {/* Gengar Face Features Overlay */}
            {/* Sinister Red Eyes */}
            <g opacity={isEmpty ? 0.25 : Math.min(1, 0.4 + (progressPct / 100) * 0.6)}>
              {/* Left Eye */}
              <polygon points="36,54 48,58 38,62" fill="#ef4444" />
              <circle cx="44" cy="57" r="1.5" fill="#ffffff" />

              {/* Right Eye */}
              <polygon points="84,54 72,58 82,62" fill="#ef4444" />
              <circle cx="76" cy="57" r="1.5" fill="#ffffff" />
            </g>

            {/* Iconic Wide Grin Teeth */}
            <g opacity={isEmpty ? 0.2 : Math.min(1, 0.35 + (progressPct / 100) * 0.65)}>
              <path
                d="M 34 76 Q 60 92 86 76 Q 60 84 34 76 Z"
                fill="#ffffff"
                stroke="#4c1d95"
                strokeWidth="1.2"
              />
              {/* Teeth Dividers */}
              <line x1="42" y1="77" x2="42" y2="82" stroke="#4c1d95" strokeWidth="1" />
              <line x1="51" y1="78" x2="51" y2="84" stroke="#4c1d95" strokeWidth="1" />
              <line x1="60" y1="79" x2="60" y2="85" stroke="#4c1d95" strokeWidth="1" />
              <line x1="69" y1="78" x2="69" y2="84" stroke="#4c1d95" strokeWidth="1" />
              <line x1="78" y1="77" x2="78" y2="82" stroke="#4c1d95" strokeWidth="1" />
            </g>

            {/* Crown Spikes Detail */}
            <path
              d="M 32 36 L 40 28 L 50 36 L 60 22 L 70 36 L 80 28 L 88 36"
              fill="none"
              stroke={isEmpty ? "rgba(168, 85, 247, 0.4)" : "#a855f7"}
              strokeWidth="1.5"
            />
          </svg>

          {/* Liquid Status Pill Badge */}
          <div
            className={`absolute bottom-1 right-1 z-20 px-1.5 py-0.5 rounded border font-mono text-[9px] font-bold leading-none ${
              isEmpty
                ? "bg-purple-950/80 text-purple-400 border-purple-500/30"
                : isFull
                ? "bg-cyan-500 text-zinc-950 border-cyan-400 shadow-[0_0_8px_#00f0ff]"
                : "bg-black/60 text-cyan-300 border-cyan-400/40"
            }`}
          >
            {isEmpty ? "EMPTY 0%" : `${progressPct}%`}
          </div>
        </div>

        {/* Volume & Increment Milestones Info */}
        <div className="flex-1 flex flex-col justify-center gap-1 font-mono">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span
                className="font-medium text-2xl tracking-tight"
                style={{ color: "var(--glass-text-primary)" }}
              >
                {currentLiters}
              </span>
              <span className="text-base font-medium text-cyan-500">/ {targetLiters} L</span>
              <span className="text-xs ml-1" style={{ color: "var(--glass-text-muted)" }}>
                ({currentOz > 0 ? `${currentOz.toFixed(0)} oz` : "0 oz"})
              </span>
            </div>
            <div className="text-[9px] text-zinc-400 uppercase font-semibold flex items-center gap-1 mt-0.5">
              {isEmpty ? (
                <span className="text-purple-400">● Gengar Empty · Log first water below</span>
              ) : isFull ? (
                <span className="text-emerald-400 flex items-center gap-1 font-bold">
                  <CheckCircle2 size={11} /> 100% Daily Optimal Reached!
                </span>
              ) : (
                <span className="text-cyan-300">
                  {remainingMl} mL ({remainingOz} oz) remaining to goal
                </span>
              )}
            </div>
          </div>

          {/* Increment Milestone Progress Track */}
          <div className="w-full h-2 rounded-full bg-black/30 mt-1.5 overflow-hidden border border-white/10 relative">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                isEmpty
                  ? "w-0"
                  : isFull
                  ? "bg-gradient-to-r from-cyan-400 via-sky-300 to-teal-300 shadow-[0_0_12px_#00f0ff]"
                  : "bg-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.7)]"
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Milestone Ticks: 25%, 50%, 75%, 100% */}
          <div className="grid grid-cols-4 text-[8px] text-zinc-500 font-mono mt-0.5 text-center">
            <span className={progressPct >= 25 ? "text-cyan-400 font-bold" : ""}>25% (1L)</span>
            <span className={progressPct >= 50 ? "text-cyan-400 font-bold" : ""}>50% (1.9L)</span>
            <span className={progressPct >= 75 ? "text-cyan-400 font-bold" : ""}>75% (2.8L)</span>
            <span className={progressPct >= 100 ? "text-emerald-400 font-bold" : ""}>100% (3.8L)</span>
          </div>
        </div>
      </div>

      {/* ── 1-TAP INCREMENT LOGGING BUTTONS (Non-blocking rapid tap!) ── */}
      <div className="grid grid-cols-4 gap-1.5 mt-1 font-mono">
        <button
          onClick={() => handleAddMl(250)}
          className="flex items-center justify-center gap-1 py-1.5 px-1 rounded-xl border text-[10px] font-medium uppercase transition active:scale-95 text-cyan-500 hover:bg-cyan-500/15"
          style={{
            backgroundColor: "var(--glass-surface-elevated)",
            borderColor: "rgba(6, 182, 212, 0.35)",
          }}
          title="Add 1 Glass (250 ml / ~8.5 oz)"
        >
          <Plus size={11} />
          <span>+250ml</span>
        </button>

        <button
          onClick={() => handleAddMl(500)}
          className="flex items-center justify-center gap-1 py-1.5 px-1 rounded-xl border text-[10px] font-medium uppercase transition active:scale-95 text-cyan-500 hover:bg-cyan-500/15"
          style={{
            backgroundColor: "var(--glass-surface-elevated)",
            borderColor: "rgba(6, 182, 212, 0.35)",
          }}
          title="Add Standard Flask (500 ml / ~16.9 oz)"
        >
          <Plus size={11} />
          <span>+500ml</span>
        </button>

        <button
          onClick={() => handleAddMl(1000)}
          className="flex items-center justify-center gap-1 py-1.5 px-1 rounded-xl border text-[10px] font-medium uppercase transition active:scale-95 text-cyan-500 hover:bg-cyan-500/15"
          style={{
            backgroundColor: "var(--glass-surface-elevated)",
            borderColor: "rgba(6, 182, 212, 0.35)",
          }}
          title="Add 1 Liter Hydro (1,000 ml / ~33.8 oz)"
        >
          <Plus size={11} />
          <span>+1000ml</span>
        </button>

        <button
          onClick={() => handleAddOz(32)}
          className="flex items-center justify-center gap-1 py-1.5 px-1 rounded-xl border text-[10px] font-medium uppercase transition active:scale-95 text-cyan-500 hover:bg-cyan-500/15"
          style={{
            backgroundColor: "var(--glass-surface-elevated)",
            borderColor: "rgba(6, 182, 212, 0.35)",
          }}
          title="Add 32 oz Hydro Flask"
        >
          <Plus size={11} />
          <span>+32oz</span>
        </button>
      </div>

      {/* ── CUSTOM WATER INPUT (CONNECTED DIRECTLY TO DB) ── */}
      <div className="flex items-center gap-1.5 mt-2.5 font-mono">
        <div className="relative flex-1">
          <input
            type="number"
            step="any"
            placeholder={`Log custom ${unitMode}...`}
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            className="w-full border rounded-xl pl-3 pr-12 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-400 transition"
            style={{
              backgroundColor: "var(--glass-surface-elevated, #13182b)",
              borderColor: "var(--glass-border, rgba(255,255,255,0.1))",
            }}
          />
          {/* Unit Toggle: oz vs ml */}
          <button
            type="button"
            onClick={() => setUnitMode(unitMode === "oz" ? "ml" : "oz")}
            className="absolute right-2 top-1.5 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-cyan-300 transition"
            title="Click to toggle units between oz and ml"
          >
            {unitMode}
          </button>
        </div>

        {/* Add button (+ delta) */}
        <button
          type="button"
          onClick={() => handleCustomAction("add")}
          disabled={!customValue || isUpdating}
          className="px-2.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-[11px] uppercase rounded-xl transition active:scale-95 disabled:opacity-40 flex items-center gap-1"
          title="Add this quantity to current total"
        >
          <Plus size={12} />
          <span>Add</span>
        </button>

        {/* Set button (= exact total) */}
        <button
          type="button"
          onClick={() => handleCustomAction("set")}
          disabled={!customValue || isUpdating}
          className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-zinc-200 border border-white/10 font-bold text-[11px] uppercase rounded-xl transition active:scale-95 disabled:opacity-40 flex items-center gap-1"
          title="Set total water to this exact amount"
        >
          <span>Set</span>
        </button>
      </div>
    </div>
  );
}
