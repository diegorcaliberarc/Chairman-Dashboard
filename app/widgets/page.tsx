"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ExecutiveModuleShell } from "@/components/chairman/ExecutiveModuleShell";
import {
  Smartphone,
  Sun,
  Footprints,
  DollarSign,
  CheckCircle2,
  Circle,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Download,
  Sparkles,
  Plus,
  Layers,
  Code2,
  X,
  Activity,
  Clock,
  Wallet,
} from "lucide-react";

interface WidgetSubtask {
  id: string;
  roman: string;
  label: string;
  done: boolean;
}

interface WidgetPayload {
  ok: boolean;
  generatedAt: string;
  todayDate: string;
  solar: {
    phase: string;
    phaseTag: string;
    progressPct: number;
    sunrise: string;
    sunset: string;
    daylightRemaining: string;
    hardStopCountdown: string;
    currentTime24: string;
  };
  activeBlock: {
    id: string;
    source: "yearly_appointment" | "circadian_event" | "fallback";
    title: string;
    timeRange: string;
    category: string;
    accentColor: string;
    isLive: boolean;
    subtasks: WidgetSubtask[];
  };
  habits: {
    primary: {
      id: string;
      title: string;
      subtitle: string;
      unit: string;
      current: number;
      target: number;
      pct: number;
      ringColor: string;
    };
    rings: {
      id: string;
      title: string;
      subtitle: string;
      unit: string;
      current: number;
      target: number;
      pct: number;
      ringColor: string;
    }[];
  };
  shiftPay: {
    roleLabel: string;
    payPerShift: number;
    todayPay: number;
    weeklyPay: number;
    monthlyPay: number;
    daysWorked: number;
    totalScheduledDays: number;
    dailyMoneyUsed: number;
    netToday: number;
    todayStatus: "worked" | "scheduled" | "off";
  };
  kpi: {
    score: number;
    grade: string;
    greenCount: number;
    yellowCount: number;
    redCount: number;
    totalKpis: number;
  };
  pals: {
    mood: string;
    headline: string;
    bondScore: number;
    dittoState: string;
    gengarState: string;
    statusNote: string;
  };
}

const FALLBACK_PAYLOAD: WidgetPayload = {
  ok: true,
  generatedAt: new Date().toISOString(),
  todayDate: new Date().toISOString().slice(0, 10),
  solar: {
    phase: "Solar Zenith",
    phaseTag: "DEEP ARCHITECTURE BLOCK",
    progressPct: 54.2,
    sunrise: "06:18",
    sunset: "19:42",
    daylightRemaining: "6h 14m",
    hardStopCountdown: "5h 32m to 19:00 Stop",
    currentTime24: "13:28",
  },
  activeBlock: {
    id: "default-exec-block",
    source: "fallback",
    title: "Executive Deep-Work & Mobile Telemetry",
    timeRange: "09:00 – 12:00",
    category: "engineering",
    accentColor: "#38bdf8",
    isLive: true,
    subtasks: [
      { id: "s1", roman: "I", label: "Audit Caliber Arc NQ/MNQ Risk Guardrails", done: true },
      { id: "s2", roman: "II", label: "Sync Weight-Loss Walk & Shift Pay Ledger", done: false },
      { id: "s3", roman: "III", label: "Review CMO Viral Hooks & Gaming Signals", done: false },
    ],
  },
  habits: {
    primary: {
      id: "default-walk-habit",
      title: "Weight-Loss Daily Walk",
      subtitle: "Zone-2 Fat Oxidation Ring",
      unit: "steps",
      current: 7840,
      target: 10000,
      pct: 78.4,
      ringColor: "#10b981",
    },
    rings: [
      {
        id: "default-walk-habit",
        title: "Weight-Loss Daily Walk",
        subtitle: "Zone-2 Fat Oxidation Ring",
        unit: "steps",
        current: 7840,
        target: 10000,
        pct: 78.4,
        ringColor: "#10b981",
      },
      {
        id: "ring-protein",
        title: "Protein Payload",
        subtitle: "180g Lean Target",
        unit: "g",
        current: 148,
        target: 180,
        pct: 82.2,
        ringColor: "#38bdf8",
      },
      {
        id: "ring-focus",
        title: "Deep Work Blocks",
        subtitle: "Zero-Entropy Hours",
        unit: "hrs",
        current: 3.5,
        target: 4,
        pct: 87.5,
        ringColor: "#a855f7",
      },
    ],
  },
  shiftPay: {
    roleLabel: "Primary Shift / Executive Ops",
    payPerShift: 320,
    todayPay: 320,
    weeklyPay: 1600,
    monthlyPay: 5760,
    daysWorked: 18,
    totalScheduledDays: 22,
    dailyMoneyUsed: 44.5,
    netToday: 275.5,
    todayStatus: "worked",
  },
  kpi: {
    score: 88,
    grade: "A",
    greenCount: 44,
    yellowCount: 11,
    redCount: 5,
    totalKpis: 60,
  },
  pals: {
    mood: "Hyper-Synced",
    headline: "Ditto & Gengar Co-Op Boost",
    bondScore: 93,
    dittoState: "Happy Blob · Synced",
    gengarState: "Shadow Grin · Guarding",
    statusNote: "Walk 78% · Net +$276 · KPI A",
  },
};

/* ─── Crisp Pixel-Art Ditto + Gengar Companion Badge ───────────────────────── */
function DittoGengarPixelBadge({
  compact = false,
  mood,
  bondScore,
}: {
  compact?: boolean;
  mood: string;
  bondScore: number;
}) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border border-fuchsia-400/25 bg-fuchsia-500/10 ${
        compact ? "px-2 py-0.5" : "px-2.5 py-1"
      }`}
      title={`${mood} · Bond ${bondScore}%`}
    >
      {/* Ditto + Gengar Mini Pixel SVG */}
      <svg
        width={compact ? 26 : 30}
        height={compact ? 14 : 16}
        viewBox="0 0 30 16"
        shapeRendering="crispEdges"
        className="shrink-0"
      >
        {/* Ditto (Left — Soft Lavender Squish Blob) */}
        <rect x="3" y="4" width="6" height="2" fill="#e879f9" />
        <rect x="2" y="6" width="9" height="6" fill="#f0abfc" />
        <rect x="1" y="9" width="11" height="3" fill="#e879f9" />
        <rect x="4" y="7" width="1" height="1" fill="#1e1b4b" />
        <rect x="8" y="7" width="1" height="1" fill="#1e1b4b" />
        <rect x="5" y="9" width="3" height="1" fill="#701a75" />

        {/* Sync Spark Heart in Center */}
        <rect x="14" y="5" width="2" height="2" fill="#fb7185" />

        {/* Gengar (Right — Spiky Violet Shadow Pal with Red Eyes & White Grin) */}
        <rect x="18" y="2" width="2" height="2" fill="#7e22ce" />
        <rect x="25" y="2" width="2" height="2" fill="#7e22ce" />
        <rect x="21" y="3" width="3" height="1" fill="#9333ea" />
        <rect x="18" y="4" width="9" height="8" fill="#7e22ce" />
        <rect x="17" y="6" width="11" height="6" fill="#6b21a8" />
        {/* Crimson Eyes */}
        <rect x="19" y="6" width="2" height="2" fill="#f43f5e" />
        <rect x="24" y="6" width="2" height="2" fill="#f43f5e" />
        {/* Mischievous White Grin */}
        <rect x="19" y="9" width="7" height="2" fill="#f8fafc" />
        <rect x="21" y="9" width="1" height="2" fill="#581c87" />
        <rect x="23" y="9" width="1" height="2" fill="#581c87" />
      </svg>

      <span className="text-[9.5px] font-bold tracking-wider uppercase text-fuchsia-200 whitespace-nowrap">
        {compact ? `${bondScore}%` : `${mood} · ${bondScore}%`}
      </span>
    </div>
  );
}

/* ─── Mini 24h Solar Arc SVG ───────────────────────────────────────────────── */
function MiniSolarArc({
  progressPct,
  width = 110,
  height = 38,
  accent = "#fbbf24",
}: {
  progressPct: number;
  width?: number;
  height?: number;
  accent?: string;
}) {
  const clamped = Math.max(0, Math.min(100, progressPct)) / 100;
  const padX = 8;
  const startX = padX;
  const endX = width - padX;
  const baseY = height - 6;
  const peakY = 7;

  // Quadratic bezier point at t = clamped
  const ctrlX = width / 2;
  const ctrlY = -peakY + 4;
  const t = clamped;
  const sunX = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * ctrlX + t * t * endX;
  const sunY = (1 - t) * (1 - t) * baseY + 2 * (1 - t) * t * ctrlY + t * t * baseY;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <line
        x1={startX}
        y1={baseY}
        x2={endX}
        y2={baseY}
        stroke="rgba(255,255,255,0.14)"
        strokeWidth="1"
        strokeDasharray="2 2"
      />
      <path
        d={`M ${startX} ${baseY} Q ${ctrlX} ${ctrlY} ${endX} ${baseY}`}
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d={`M ${startX} ${baseY} Q ${ctrlX} ${ctrlY} ${endX} ${baseY}`}
        fill="none"
        stroke={accent}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeDasharray="200"
        strokeDashoffset={200 - 200 * clamped}
      />
      <circle cx={sunX} cy={sunY} r="5.5" fill={accent} fillOpacity="0.28" />
      <circle cx={sunX} cy={sunY} r="3.2" fill={accent} />
    </svg>
  );
}

/* ─── Full-Circle 360° Habit Ring SVG ──────────────────────────────────────── */
function HabitCircleRing({
  pct,
  size = 56,
  stroke = 5.5,
  color = "#10b981",
  label,
  sublabel,
}: {
  pct: number;
  size?: number;
  stroke?: number;
  color?: string;
  label: string;
  sublabel?: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, pct));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.11)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center leading-none">
        <span className="text-[11px] font-extrabold text-white font-mono">{label}</span>
        {sublabel && <span className="text-[7.5px] uppercase tracking-wider text-white/60 mt-0.5">{sublabel}</span>}
      </div>
    </div>
  );
}

/* ─── 1. iPhone Small Widget (2×2 Liquid Glass Squircle) ───────────────────── */
function IOSWidgetSmall({
  data,
  onToggleSubtask,
  onAddSteps,
}: {
  data: WidgetPayload;
  onToggleSubtask: (idx: number) => void;
  onAddSteps: (delta: number) => void;
}) {
  const walk = data.habits.primary;
  return (
    <div className="w-[232px] h-[232px] rounded-[32px] p-4 relative overflow-hidden select-none bg-gradient-to-br from-white/[0.17] via-slate-900/75 to-slate-950/90 backdrop-blur-2xl border border-white/25 shadow-[0_22px_50px_rgba(0,0,0,0.55),inset_0_1px_1px_rgba(255,255,255,0.42)] flex flex-col justify-between text-white">
      {/* Liquid Glass Specular Glare */}
      <div className="pointer-events-none absolute -top-12 -left-12 w-40 h-40 rounded-full bg-sky-400/20 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-12 -right-10 w-36 h-36 rounded-full bg-fuchsia-500/15 blur-2xl" />

      {/* Top Row: Solar Arc + 360° Walk Ring */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.14em] text-amber-300">
            <Sun className="w-3 h-3" />
            <span className="truncate max-w-[105px]">{data.solar.phase}</span>
          </div>
          <MiniSolarArc progressPct={data.solar.progressPct} width={96} height={30} />
          <span className="text-[8.5px] font-mono text-white/65 -mt-0.5">
            {data.solar.currentTime24} · {Math.round(data.solar.progressPct)}% Solar
          </span>
        </div>

        <button
          onClick={() => onAddSteps(500)}
          title="Tap to +500 Walk Steps"
          className="hover:scale-105 active:scale-95 transition-transform"
        >
          <HabitCircleRing
            pct={walk.pct}
            size={54}
            stroke={5}
            color={walk.ringColor}
            label={`${Math.round(walk.pct)}%`}
            sublabel="Walk"
          />
        </button>
      </div>

      {/* Middle: Current Block + Roman Subtasks I, II */}
      <div className="relative z-10 my-1 bg-black/25 border border-white/10 rounded-2xl px-2.5 py-2">
        <div className="flex items-center justify-between gap-1 mb-1">
          <span className="text-[9.5px] font-semibold text-white truncate">{data.activeBlock.title}</span>
          <span className="text-[8px] font-mono text-sky-300 shrink-0">{data.activeBlock.timeRange.split("–")[0]}</span>
        </div>
        <div className="space-y-1">
          {data.activeBlock.subtasks.slice(0, 2).map((s, idx) => (
            <button
              key={s.id}
              onClick={() => onToggleSubtask(idx)}
              className="w-full flex items-center gap-1.5 text-left group"
            >
              {s.done ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
              ) : (
                <Circle className="w-3 h-3 text-white/40 group-hover:text-sky-300 shrink-0" />
              )}
              <span className="text-[8.5px] font-serif font-bold text-sky-300 w-3.5 shrink-0">{s.roman}.</span>
              <span
                className={`text-[9px] truncate ${
                  s.done ? "line-through text-white/45" : "text-white/90"
                }`}
              >
                {s.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom: Shift Pay Pill + Tiny Ditto+Gengar Pixel Badge */}
      <div className="relative z-10 flex items-center justify-between gap-1.5">
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-[9px] font-mono font-bold text-emerald-300">
          <span>+${Math.round(data.shiftPay.todayPay)}</span>
          <span className="text-white/40">|</span>
          <span className="text-rose-300">-${Math.round(data.shiftPay.dailyMoneyUsed)}</span>
        </div>
        <DittoGengarPixelBadge compact mood={data.pals.mood} bondScore={data.pals.bondScore} />
      </div>
    </div>
  );
}

/* ─── 2. iPhone Big Widget (4×4 Liquid Glass Squircle) ─────────────────────── */
function IOSWidgetLarge({
  data,
  onToggleSubtask,
  onAddSteps,
}: {
  data: WidgetPayload;
  onToggleSubtask: (idx: number) => void;
  onAddSteps: (delta: number) => void;
}) {
  const walk = data.habits.primary;
  return (
    <div className="w-full max-w-[392px] min-h-[392px] rounded-[32px] p-5 relative overflow-hidden select-none bg-gradient-to-br from-white/[0.18] via-[#0c1424]/85 to-[#060913]/95 backdrop-blur-3xl border border-white/25 shadow-[0_28px_70px_rgba(0,0,0,0.65),inset_0_1.5px_1px_rgba(255,255,255,0.45)] flex flex-col justify-between text-white">
      {/* Liquid Glass Specular Highlights */}
      <div className="pointer-events-none absolute -top-20 -left-16 w-60 h-60 rounded-full bg-sky-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-12 w-56 h-56 rounded-full bg-purple-500/20 blur-3xl" />

      {/* Header: Solar Arc + Habit 360° Ring */}
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-300/30 text-[9px] font-bold tracking-[0.14em] uppercase text-amber-200 flex items-center gap-1">
              <Sun className="w-3 h-3 text-amber-300" />
              {data.solar.phase}
            </span>
            <span className="text-[10px] font-mono text-white/60">{data.solar.currentTime24}</span>
          </div>
          <p className="text-[9.5px] tracking-[0.12em] uppercase text-sky-200/75 mt-1.5 font-semibold">
            {data.solar.phaseTag}
          </p>
          <div className="mt-1 flex items-center gap-2.5">
            <MiniSolarArc progressPct={data.solar.progressPct} width={138} height={36} />
            <div className="text-[9px] text-white/65 font-mono leading-tight">
              <div>{Math.round(data.solar.progressPct)}% Arc</div>
              <div className="text-amber-300/90">{data.solar.daylightRemaining}</div>
            </div>
          </div>
        </div>

        {/* 360° Habit Walk Ring + Step Quick Tap */}
        <div className="flex flex-col items-center bg-white/[0.06] border border-white/15 rounded-2xl px-3 py-2">
          <HabitCircleRing
            pct={walk.pct}
            size={64}
            stroke={6}
            color={walk.ringColor}
            label={`${Math.round(walk.pct)}%`}
            sublabel="Steps"
          />
          <div className="text-[9px] font-mono text-emerald-300 mt-1 font-semibold">
            {walk.current.toLocaleString()} / {(walk.target / 1000).toFixed(0)}k
          </div>
          <button
            onClick={() => onAddSteps(1000)}
            className="mt-1 px-2 py-0.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-400/30 text-[8.5px] font-bold text-emerald-200 transition-colors flex items-center gap-0.5"
          >
            <Plus className="w-2.5 h-2.5" /> 1k Steps
          </button>
        </div>
      </div>

      {/* Center: Active Block + Roman Numeral Subtasks (I, II, III) */}
      <div className="relative z-10 my-3 rounded-2xl bg-black/30 border border-white/15 p-3.5 backdrop-blur-md">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="w-2 h-2 rounded-full shrink-0 animate-pulse"
              style={{ backgroundColor: data.activeBlock.accentColor }}
            />
            <h4 className="text-xs font-bold tracking-wide text-white truncate">{data.activeBlock.title}</h4>
          </div>
          <span className="text-[9.5px] font-mono px-2 py-0.5 rounded-md bg-white/10 text-sky-200 shrink-0">
            {data.activeBlock.timeRange}
          </span>
        </div>

        <div className="space-y-1.5">
          {data.activeBlock.subtasks.slice(0, 3).map((sub, idx) => (
            <button
              key={sub.id}
              onClick={() => onToggleSubtask(idx)}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.07] transition-colors text-left"
            >
              {sub.done ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-white/40 shrink-0" />
              )}
              <span className="text-[10px] font-serif font-bold text-sky-300 w-5 shrink-0">{sub.roman}.</span>
              <span
                className={`text-[11px] flex-1 truncate ${
                  sub.done ? "line-through text-white/45" : "text-white/95"
                }`}
              >
                {sub.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom: Shift Pay & Daily Spend Pills + KPI Score + Ditto/Gengar Pixel Badge */}
      <div className="relative z-10 space-y-2.5">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-emerald-500/12 border border-emerald-400/25 px-2.5 py-2">
            <div className="text-[8.5px] uppercase tracking-wider text-emerald-200/75 font-semibold">Shift Pay</div>
            <div className="text-xs font-mono font-bold text-emerald-300 mt-0.5">
              +${data.shiftPay.todayPay.toFixed(0)}
              <span className="text-[9px] text-white/55 font-normal"> /d</span>
            </div>
            <div className="text-[8.5px] font-mono text-white/60">
              ${data.shiftPay.weeklyPay.toLocaleString()} wk
            </div>
          </div>

          <div className="rounded-2xl bg-rose-500/12 border border-rose-400/25 px-2.5 py-2">
            <div className="text-[8.5px] uppercase tracking-wider text-rose-200/75 font-semibold">Daily Spend</div>
            <div className="text-xs font-mono font-bold text-rose-300 mt-0.5">
              -${data.shiftPay.dailyMoneyUsed.toFixed(0)}
            </div>
            <div className="text-[8.5px] font-mono text-emerald-300/90">
              Net +${data.shiftPay.netToday.toFixed(0)}
            </div>
          </div>

          <div className="rounded-2xl bg-sky-500/12 border border-sky-400/25 px-2.5 py-2">
            <div className="text-[8.5px] uppercase tracking-wider text-sky-200/75 font-semibold">Command KPI</div>
            <div className="text-xs font-mono font-bold text-sky-200 mt-0.5">
              {data.kpi.grade} · {data.kpi.score}
            </div>
            <div className="text-[8.5px] font-mono text-white/60">
              {data.shiftPay.daysWorked}/{data.shiftPay.totalScheduledDays} Shifts
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-0.5">
          <DittoGengarPixelBadge mood={data.pals.mood} bondScore={data.pals.bondScore} />
          <span className="text-[9px] text-white/60 font-mono truncate max-w-[165px]">
            {data.solar.hardStopCountdown}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── 3. Android Small Widget (2×2 Material You Tonal Surface) ─────────────── */
function AndroidWidgetSmall({
  data,
  onToggleSubtask,
  onAddSteps,
}: {
  data: WidgetPayload;
  onToggleSubtask: (idx: number) => void;
  onAddSteps: (delta: number) => void;
}) {
  const walk = data.habits.primary;
  const firstSub = data.activeBlock.subtasks[0];

  return (
    <div className="w-[232px] h-[232px] rounded-[28px] p-4 bg-[#131c24] border border-[#2f4556]/70 shadow-[0_20px_45px_rgba(0,0,0,0.5)] flex flex-col justify-between text-[#e1f3ff] select-none relative overflow-hidden">
      {/* Material You Dynamic Tonal Top Pill + Scalloped Badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="px-2.5 py-1 rounded-full bg-[#1e3344] text-[#93d5ff] text-[9.5px] font-bold tracking-wide flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm rotate-45 bg-[#5eead4]" />
          <span>{data.solar.currentTime24}</span>
          <span className="opacity-60">·</span>
          <span>KPI {data.kpi.grade}</span>
        </div>

        <button
          onClick={() => onAddSteps(500)}
          title="Material You Quick Step +500"
          className="px-2 py-1 rounded-full bg-[#17382e] hover:bg-[#1f4b3e] text-[#6ee7b7] text-[9px] font-bold font-mono transition-colors"
        >
          +500
        </button>
      </div>

      {/* Center Tonal Split: Habit Walk Ring + Shift Day Pay */}
      <div className="flex items-center gap-2.5 my-1">
        <div className="bg-[#1b2a36] rounded-[22px] p-2 flex items-center justify-center">
          <HabitCircleRing
            pct={walk.pct}
            size={56}
            stroke={6}
            color="#5eead4"
            label={`${Math.round(walk.pct)}%`}
            sublabel="Walk"
          />
        </div>

        <div className="flex-1 bg-[#1b2a36] rounded-[22px] p-2.5 flex flex-col justify-center">
          <span className="text-[8.5px] uppercase tracking-wider text-[#93d5ff]/75 font-bold">Shift Today</span>
          <span className="text-sm font-extrabold font-mono text-[#6ee7b7] leading-tight mt-0.5">
            ${data.shiftPay.todayPay.toFixed(0)}
          </span>
          <span className="text-[8.5px] font-mono text-[#cbd5e1] mt-0.5">
            {data.shiftPay.daysWorked}/{data.shiftPay.totalScheduledDays}d · -${data.shiftPay.dailyMoneyUsed.toFixed(0)}
          </span>
        </div>
      </div>

      {/* Bottom Interactive Tonal Pill: Next Appointment + Roman Subtask I */}
      <div className="rounded-[20px] bg-[#213547] px-3 py-2">
        <div className="text-[9.5px] font-bold text-[#e2f2ff] truncate">{data.activeBlock.title}</div>
        {firstSub && (
          <button
            onClick={() => onToggleSubtask(0)}
            className="mt-1 w-full flex items-center gap-1.5 text-left"
          >
            <span
              className={`w-3.5 h-3.5 rounded-md flex items-center justify-center text-[9px] font-bold shrink-0 ${
                firstSub.done
                  ? "bg-[#5eead4] text-[#0b1f1a]"
                  : "border border-[#93d5ff]/50 text-transparent"
              }`}
            >
              ✓
            </span>
            <span className="text-[9px] font-bold text-[#93d5ff] shrink-0">{firstSub.roman}.</span>
            <span
              className={`text-[9px] truncate ${
                firstSub.done ? "line-through text-[#93d5ff]/50" : "text-[#e2f2ff]"
              }`}
            >
              {firstSub.label}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── 4. Android Big Widget (4×4 Material You Dynamic Tonal Hub) ────────────── */
function AndroidWidgetLarge({
  data,
  onToggleSubtask,
  onAddSteps,
  onToggleShiftToday,
}: {
  data: WidgetPayload;
  onToggleSubtask: (idx: number) => void;
  onAddSteps: (delta: number) => void;
  onToggleShiftToday: () => void;
}) {
  const walk = data.habits.primary;

  return (
    <div className="w-full max-w-[392px] min-h-[392px] rounded-[32px] p-5 bg-[#111921] border border-[#2b4254]/75 shadow-[0_28px_65px_rgba(0,0,0,0.6)] flex flex-col justify-between text-[#e4f3ff] select-none">
      {/* Top Bar: Pixel At-a-Glance Pill + Ditto/Gengar Companion */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1c2d3c] text-[#a5dcff]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8]" />
          <span className="text-[10.5px] font-bold tracking-wide">{data.solar.phase}</span>
          <span className="text-[10px] font-mono opacity-75">{Math.round(data.solar.progressPct)}%</span>
        </div>

        <DittoGengarPixelBadge mood={data.pals.mood} bondScore={data.pals.bondScore} />
      </div>

      {/* Middle Row: Habit Walk Ring Tile + Work Shift Earnings (Day / Week / Month) */}
      <div className="grid grid-cols-12 gap-2.5 my-3">
        {/* Habit Walk 360° Tonal Tile */}
        <div className="col-span-5 rounded-[24px] bg-[#162d28] border border-[#265348]/70 p-3 flex flex-col items-center justify-between">
          <div className="w-full flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-[#6ee7b7]">
            <span>Walk Ring</span>
            <Footprints className="w-3.5 h-3.5" />
          </div>
          <div className="my-1.5">
            <HabitCircleRing
              pct={walk.pct}
              size={68}
              stroke={6.5}
              color="#34d399"
              label={`${Math.round(walk.pct)}%`}
              sublabel="Steps"
            />
          </div>
          <div className="text-[9.5px] font-mono text-[#a7f3d0] font-semibold">
            {walk.current.toLocaleString()} / {(walk.target / 1000).toFixed(0)}k
          </div>
          <button
            onClick={() => onAddSteps(1000)}
            className="mt-1.5 w-full py-1 rounded-full bg-[#244f44] hover:bg-[#2d6456] text-[9.5px] font-bold text-[#a7f3d0] transition-colors"
          >
            +1,000 Steps
          </button>
        </div>

        {/* Work Shift Earnings Matrix (Day / Week / Month + Toggle) */}
        <div className="col-span-7 rounded-[24px] bg-[#192734] border border-[#2b4257]/70 p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#93d5ff]">
              Shift × Pay Telemetry
            </span>
            <button
              onClick={onToggleShiftToday}
              className={`px-2 py-0.5 rounded-full text-[8.5px] font-bold uppercase tracking-wider transition-colors ${
                data.shiftPay.todayStatus === "worked"
                  ? "bg-[#1f4d3d] text-[#6ee7b7]"
                  : "bg-[#3a2e1e] text-[#fcd34d]"
              }`}
              title="Toggle Today Shift Worked Status"
            >
              {data.shiftPay.todayStatus === "worked" ? "✓ Worked" : "Scheduled"}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5 my-2">
            <div className="rounded-2xl bg-[#111c26] p-2">
              <div className="text-[8px] uppercase text-[#94a3b8]">Day</div>
              <div className="text-xs font-mono font-extrabold text-[#6ee7b7]">
                ${data.shiftPay.todayPay.toFixed(0)}
              </div>
            </div>
            <div className="rounded-2xl bg-[#111c26] p-2">
              <div className="text-[8px] uppercase text-[#94a3b8]">Week</div>
              <div className="text-xs font-mono font-extrabold text-[#93d5ff]">
                ${(data.shiftPay.weeklyPay / 1000).toFixed(1)}k
              </div>
            </div>
            <div className="rounded-2xl bg-[#111c26] p-2">
              <div className="text-[8px] uppercase text-[#94a3b8]">Month</div>
              <div className="text-xs font-mono font-extrabold text-[#c4b5fd]">
                ${(data.shiftPay.monthlyPay / 1000).toFixed(1)}k
              </div>
            </div>
          </div>

          {/* Scalloped / Pill Progress Bar for Scheduled Days */}
          <div>
            <div className="flex items-center justify-between text-[9px] font-mono text-[#cbd5e1] mb-1">
              <span>
                {data.shiftPay.daysWorked}/{data.shiftPay.totalScheduledDays} Shifts
              </span>
              <span className="text-rose-300">Spend -${data.shiftPay.dailyMoneyUsed.toFixed(0)}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#0f1720] overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#38bdf8] to-[#34d399] transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round((data.shiftPay.daysWorked / Math.max(1, data.shiftPay.totalScheduledDays)) * 100)
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Tonal Card: Next Appointment + Interactive Quick-Check Roman Subtasks */}
      <div className="rounded-[24px] bg-[#1a2938] border border-[#2e4861]/70 p-3.5">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="min-w-0">
            <div className="text-[8.5px] uppercase tracking-widest text-[#7dd3fc] font-bold">
              Active Block · Interactive Quick-Check
            </div>
            <div className="text-xs font-bold text-white truncate">{data.activeBlock.title}</div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-[#111c26] text-[9.5px] font-mono text-[#93d5ff] shrink-0">
            {data.activeBlock.timeRange}
          </span>
        </div>

        <div className="space-y-1.5">
          {data.activeBlock.subtasks.slice(0, 3).map((sub, idx) => (
            <button
              key={sub.id}
              onClick={() => onToggleSubtask(idx)}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-[#121e29] hover:bg-[#162635] transition-colors text-left"
            >
              <span
                className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] font-extrabold shrink-0 transition-colors ${
                  sub.done
                    ? "bg-[#38bdf8] text-[#08131c]"
                    : "border-2 border-[#64748b] text-transparent"
                }`}
              >
                ✓
              </span>
              <span className="text-[10px] font-serif font-bold text-[#7dd3fc] w-5 shrink-0">{sub.roman}.</span>
              <span
                className={`text-[11px] flex-1 truncate ${
                  sub.done ? "line-through text-[#94a3b8]" : "text-[#f1f5f9]"
                }`}
              >
                {sub.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Inner View (Uses SearchParams) ───────────────────────────────────── */
function WidgetsInnerView() {
  const searchParams = useSearchParams();
  const embedMode = searchParams.get("embed"); // ios-small | ios-large | android-small | android-large

  const [data, setData] = useState<WidgetPayload>(FALLBACK_PAYLOAD);
  const [loading, setLoading] = useState(true);
  const [platformView, setPlatformView] = useState<"both" | "ios" | "android">("both");
  const [backdropTheme, setBackdropTheme] = useState<"obsidian" | "solar" | "monet">("obsidian");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [origin, setOrigin] = useState("http://localhost:3000");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const fetchTelemetry = useCallback(async () => {
    try {
      const tzOffset = new Date().getTimezoneOffset();
      const res = await fetch(`/api/widgets?tzOffset=${tzOffset}`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json?.ok) setData(json);
      }
    } catch (e) {
      console.error("Widget fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTelemetry();
    const timer = setInterval(fetchTelemetry, 30_000);
    return () => clearInterval(timer);
  }, [fetchTelemetry]);

  const handleToggleSubtask = async (idx: number) => {
    // Optimistic update
    setData((prev) => {
      const nextSubs = prev.activeBlock.subtasks.map((s, i) =>
        i === idx ? { ...s, done: !s.done } : s
      );
      return {
        ...prev,
        activeBlock: { ...prev.activeBlock, subtasks: nextSubs },
      };
    });

    try {
      const targetSub = data.activeBlock.subtasks[idx];
      await fetch("/api/widgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_subtask",
          source: data.activeBlock.source,
          blockId: data.activeBlock.id,
          subtaskIndex: idx,
          subtaskId: targetSub?.id,
        }),
      });
      await fetchTelemetry();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddSteps = async (delta: number) => {
    setData((prev) => {
      const cur = Math.max(0, prev.habits.primary.current + delta);
      const pct = Math.min(100, Math.round((cur / Math.max(1, prev.habits.primary.target)) * 1000) / 10);
      return {
        ...prev,
        habits: {
          ...prev.habits,
          primary: { ...prev.habits.primary, current: cur, pct },
        },
      };
    });

    try {
      await fetch("/api/widgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "increment_steps", delta }),
      });
      await fetchTelemetry();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleShiftToday = async () => {
    setData((prev) => {
      const nextStatus = prev.shiftPay.todayStatus === "worked" ? "scheduled" : "worked";
      const todayPay = nextStatus === "worked" ? prev.shiftPay.payPerShift : 0;
      return {
        ...prev,
        shiftPay: {
          ...prev.shiftPay,
          todayStatus: nextStatus,
          todayPay,
          netToday: todayPay - prev.shiftPay.dailyMoneyUsed,
        },
      };
    });

    try {
      await fetch("/api/widgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_shift_today" }),
      });
      await fetchTelemetry();
    } catch (e) {
      console.error(e);
    }
  };

  const copyText = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const scriptableCode = useMemo(() => {
    return `// Chairman OS — iOS 18 Liquid Glass Scriptable Widget (Small & Large)
// Paste into Scriptable App on iPhone -> Add Scriptable Widget to Home Screen
const API_URL = "${origin}/api/widgets";
const req = new Request(API_URL);
req.timeoutInterval = 8;
const d = await req.loadJSON();

const w = new ListWidget();
const grad = new LinearGradient();
grad.colors = [new Color("#0f172a"), new Color("#090d16"), new Color("#171129")];
grad.locations = [0, 0.55, 1];
w.backgroundGradient = grad;
w.setPadding(14, 16, 14, 16);

const isSmall = config.widgetFamily === "small";

// Header: Solar Phase + Walk %
const top = w.addStack();
top.layoutHorizontally();
top.centerAlignContent();
const phaseTxt = top.addText("☀ " + d.solar.phase.toUpperCase());
phaseTxt.font = Font.boldSystemFont(isSmall ? 9 : 11);
phaseTxt.textColor = new Color("#fbbf24");
top.addSpacer();
const walkTxt = top.addText("🚶 " + Math.round(d.habits.primary.pct) + "%");
walkTxt.font = Font.boldMonospacedSystemFont(isSmall ? 10 : 12);
walkTxt.textColor = new Color("#34d399");

w.addSpacer(8);

// Active Block Title
const blk = w.addText(d.activeBlock.title);
blk.font = Font.boldSystemFont(isSmall ? 12 : 14);
blk.textColor = Color.white();
blk.lineLimit = 1;

w.addSpacer(4);

// Roman Numeral Subtasks (I, II, III)
const maxSubs = isSmall ? 2 : 3;
for (let i = 0; i < Math.min(maxSubs, d.activeBlock.subtasks.length); i++) {
  const s = d.activeBlock.subtasks[i];
  const row = w.addText((s.done ? "✓ " : "○ ") + s.roman + ". " + s.label);
  row.font = Font.systemFont(isSmall ? 10 : 11);
  row.textColor = s.done ? new Color("#94a3b8") : new Color("#e2e8f0");
  row.lineLimit = 1;
}

w.addSpacer();

// Footer: Shift Pay + KPI + Ditto & Gengar Mood
const foot = w.addStack();
foot.layoutHorizontally();
const pay = foot.addText("+$" + Math.round(d.shiftPay.todayPay) + " · Net $" + Math.round(d.shiftPay.netToday));
pay.font = Font.boldMonospacedSystemFont(isSmall ? 9 : 11);
pay.textColor = new Color("#6ee7b7");
foot.addSpacer();
if (!isSmall) {
  const pals = foot.addText("🟣👻 " + d.pals.mood + " · KPI " + d.kpi.grade);
  pals.font = Font.boldSystemFont(10);
  pals.textColor = new Color("#f0abfc");
}

w.url = "${origin}/widgets";
Script.setWidget(w);
Script.complete();`;
  }, [origin]);

  const kwgtFormulaPack = useMemo(() => {
    return `# Android KWGT (Kustom Widget) Live JSON Configuration
# 1. Global Variable 'chair_url' -> ${origin}/api/widgets
# 2. Bind Text / Progress Layers with these Kode formulas:

Solar Phase:       $wg("${origin}/api/widgets", json, .solar.phase)$
Solar Arc %:       $wg("${origin}/api/widgets", json, .solar.progressPct)$
Walk Steps %:      $wg("${origin}/api/widgets", json, .habits.primary.pct)$
Walk Steps Count:  $wg("${origin}/api/widgets", json, .habits.primary.current)$
Active Block:      $wg("${origin}/api/widgets", json, .activeBlock.title)$
Subtask I:         $wg("${origin}/api/widgets", json, .activeBlock.subtasks[0].roman)$. $wg("${origin}/api/widgets", json, .activeBlock.subtasks[0].label)$
Subtask II:        $wg("${origin}/api/widgets", json, .activeBlock.subtasks[1].roman)$. $wg("${origin}/api/widgets", json, .activeBlock.subtasks[1].label)$
Subtask III:       $wg("${origin}/api/widgets", json, .activeBlock.subtasks[2].roman)$. $wg("${origin}/api/widgets", json, .activeBlock.subtasks[2].label)$
Shift Pay (Day):   $$wg("${origin}/api/widgets", json, .shiftPay.todayPay)$
Shift Pay (Week):  $$wg("${origin}/api/widgets", json, .shiftPay.weeklyPay)$
KPI Command Grade: $wg("${origin}/api/widgets", json, .kpi.grade)$ ($wg("${origin}/api/widgets", json, .kpi.score)$)
Ditto & Gengar:    $wg("${origin}/api/widgets", json, .pals.headline)$`;
  }, [origin]);

  /* ─── MODE 1: Chromeless Standalone Mobile Widget Mode (?embed=...) ────────── */
  if (
    embedMode === "ios-small" ||
    embedMode === "ios-large" ||
    embedMode === "android-small" ||
    embedMode === "android-large"
  ) {
    return (
      <div className="min-h-screen w-full bg-[#05070d] flex flex-col items-center justify-center p-4 relative group">
        {embedMode === "ios-small" && (
          <IOSWidgetSmall
            data={data}
            onToggleSubtask={handleToggleSubtask}
            onAddSteps={handleAddSteps}
          />
        )}
        {embedMode === "ios-large" && (
          <IOSWidgetLarge
            data={data}
            onToggleSubtask={handleToggleSubtask}
            onAddSteps={handleAddSteps}
          />
        )}
        {embedMode === "android-small" && (
          <AndroidWidgetSmall
            data={data}
            onToggleSubtask={handleToggleSubtask}
            onAddSteps={handleAddSteps}
          />
        )}
        {embedMode === "android-large" && (
          <AndroidWidgetLarge
            data={data}
            onToggleSubtask={handleToggleSubtask}
            onAddSteps={handleAddSteps}
            onToggleShiftToday={handleToggleShiftToday}
          />
        )}

        {/* Subtle Hover-Only Studio Return Pill so Standalone Framing stays 100% Clean */}
        <a
          href="/widgets"
          className="opacity-0 group-hover:opacity-100 transition-opacity fixed bottom-3 right-3 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-[10px] font-mono text-white/80 backdrop-blur-md"
        >
          Exit Standalone Widget
        </a>
      </div>
    );
  }

  const wallpaperBg =
    backdropTheme === "solar"
      ? "bg-[radial-gradient(circle_at_25%_20%,rgba(245,158,11,0.22),transparent_55%),radial-gradient(circle_at_80%_75%,rgba(236,72,153,0.18),transparent_55%),linear-gradient(145deg,#0f172a,#090b12)]"
      : backdropTheme === "monet"
      ? "bg-[radial-gradient(circle_at_20%_25%,rgba(52,211,153,0.20),transparent_55%),radial-gradient(circle_at_80%_75%,rgba(56,189,248,0.22),transparent_55%),linear-gradient(145deg,#0b1922,#080d14)]"
      : "bg-[radial-gradient(circle_at_20%_15%,rgba(56,189,248,0.20),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(168,85,247,0.18),transparent_55%),linear-gradient(145deg,#0b101d,#06080f)]";

  /* ─── MODE 2: Interactive Mobile Widget Studio ─────────────────────────────── */
  return (
    <ExecutiveModuleShell
      moduleId="WIDGETS"
      eyebrow="Mobile Telemetry Companion"
      title="iPhone & Android Widgets (Big & Small)"
      subtitle="Live iOS 18 Liquid Glass & Android 15 Material You home-screen widgets synced to Solar Calendar, Habits & Shift Pay"
      accentColor="#38bdf8"
      headerActions={
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchTelemetry}
            className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs text-zinc-200 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${loading ? "animate-spin" : ""}`} />
            <span>Sync Live</span>
          </button>

          <button
            onClick={() => setDrawerOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-xs font-bold tracking-wider uppercase text-sky-200 flex items-center gap-1.5 transition-colors shadow-[0_0_20px_rgba(56,189,248,0.2)]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install & Native Sync</span>
          </button>
        </div>
      }
    >
      {/* Top Studio Control Bar & Live Telemetry Strip */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-4 flex flex-wrap items-center justify-between gap-4">
        {/* Platform Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/[0.07]">
          {[
            { id: "both", label: "Side-by-Side Both" },
            { id: "ios", label: "iPhone (iOS 18 Liquid Glass)" },
            { id: "android", label: "Android (Material You / Pixel)" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPlatformView(tab.id as "both" | "ios" | "android")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                platformView === tab.id
                  ? "bg-sky-500/25 text-sky-200 border border-sky-400/40 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Wallpaper Backdrop + Quick Test Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 bg-black/35 px-2.5 py-1 rounded-xl border border-white/[0.06]">
            <span>Wallpaper:</span>
            {(
              [
                { id: "obsidian", label: "NorthPeak Glass" },
                { id: "solar", label: "Solar Titanium" },
                { id: "monet", label: "Pixel Monet" },
              ] as const
            ).map((w) => (
              <button
                key={w.id}
                onClick={() => setBackdropTheme(w.id)}
                className={`px-2 py-0.5 rounded-md text-[10.5px] font-medium transition-colors ${
                  backdropTheme === w.id
                    ? "bg-white/15 text-white"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => handleAddSteps(1000)}
            className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 text-[11px] font-semibold text-emerald-300 flex items-center gap-1 transition-colors"
          >
            <Footprints className="w-3.5 h-3.5" />
            <span>+1k Walk Steps</span>
          </button>
        </div>
      </div>

      {/* Live Connected Source Telemetry Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-400/25 flex items-center justify-center text-amber-300">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-400">Circadian Solar Arc</div>
            <div className="text-sm font-bold text-white">
              {data.solar.phase} · {Math.round(data.solar.progressPct)}%
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-400/25 flex items-center justify-center text-emerald-300">
            <Footprints className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-400">360° Habit Ring</div>
            <div className="text-sm font-bold text-white font-mono">
              {data.habits.primary.current.toLocaleString()} / {data.habits.primary.target.toLocaleString()}{" "}
              {data.habits.primary.unit}
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-400/25 flex items-center justify-center text-sky-300">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-400">Shift × Pay Net</div>
            <div className="text-sm font-bold text-white font-mono">
              +${data.shiftPay.todayPay.toFixed(0)} Day · ${data.shiftPay.weeklyPay.toLocaleString()} Wk
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-fuchsia-500/15 border border-fuchsia-400/25 flex items-center justify-center text-fuchsia-300">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-400">KPI & Pixel Pals</div>
            <div className="text-sm font-bold text-white">
              Grade {data.kpi.grade} ({data.kpi.score}) · {data.pals.bondScore}% Bond
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Device Canvas */}
      <div
        className={`grid gap-6 ${
          platformView === "both" ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1 max-w-3xl mx-auto"
        }`}
      >
        {/* ─── iPhone (iOS 18 Liquid Glass) Suite ─────────────────────────────── */}
        {(platformView === "both" || platformView === "ios") && (
          <section className={`rounded-3xl border border-white/15 p-6 ${wallpaperBg} relative overflow-hidden`}>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-sky-300" />
                  <h2 className="text-sm font-bold tracking-[0.14em] uppercase text-white">
                    iPhone · iOS 18 Liquid Glass
                  </h2>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Authentic squircle geometry · Specular glass rim · Interactive Roman subtasks
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <a
                  href="/widgets?embed=ios-small"
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-mono text-sky-200 flex items-center gap-1 transition-colors"
                >
                  <span>2×2 WebAPK</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="/widgets?embed=ios-large"
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-mono text-sky-200 flex items-center gap-1 transition-colors"
                >
                  <span>4×4 WebAPK</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="flex flex-col items-center gap-6">
              {/* Small 2×2 Preview */}
              <div className="w-full flex flex-col items-center">
                <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/50 mb-2.5">
                  iPhone Small Widget (2×2 Home Screen)
                </span>
                <IOSWidgetSmall
                  data={data}
                  onToggleSubtask={handleToggleSubtask}
                  onAddSteps={handleAddSteps}
                />
              </div>

              {/* Big 4×4 Preview */}
              <div className="w-full flex flex-col items-center">
                <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/50 mb-2.5">
                  iPhone Big Widget (4×4 Interactive Stack)
                </span>
                <IOSWidgetLarge
                  data={data}
                  onToggleSubtask={handleToggleSubtask}
                  onAddSteps={handleAddSteps}
                />
              </div>
            </div>
          </section>
        )}

        {/* ─── Android (Android 15 Material You / Pixel) Suite ────────────────── */}
        {(platformView === "both" || platformView === "android") && (
          <section className={`rounded-3xl border border-white/15 p-6 ${wallpaperBg} relative overflow-hidden`}>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-300" />
                  <h2 className="text-sm font-bold tracking-[0.14em] uppercase text-white">
                    Android 15 · Material You / Pixel
                  </h2>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Dynamic tonal surfaces · Day/Week/Month Shift matrix · Live quick-check toggles
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <a
                  href="/widgets?embed=android-small"
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-mono text-emerald-200 flex items-center gap-1 transition-colors"
                >
                  <span>2×2 WebAPK</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="/widgets?embed=android-large"
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-mono text-emerald-200 flex items-center gap-1 transition-colors"
                >
                  <span>4×4 WebAPK</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="flex flex-col items-center gap-6">
              {/* Small 2×2 Preview */}
              <div className="w-full flex flex-col items-center">
                <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/50 mb-2.5">
                  Android Small Widget (2×2 Tonal Tile)
                </span>
                <AndroidWidgetSmall
                  data={data}
                  onToggleSubtask={handleToggleSubtask}
                  onAddSteps={handleAddSteps}
                />
              </div>

              {/* Big 4×4 Preview */}
              <div className="w-full flex flex-col items-center">
                <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/50 mb-2.5">
                  Android Big Widget (4×2 / 4×4 Command Hub)
                </span>
                <AndroidWidgetLarge
                  data={data}
                  onToggleSubtask={handleToggleSubtask}
                  onAddSteps={handleAddSteps}
                  onToggleShiftToday={handleToggleShiftToday}
                />
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Inline Native Sync Quick-Access Card + Slide-Over Install Drawer */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-bold tracking-[0.14em] uppercase text-white">
              Native Home-Screen Polling Endpoint Ready
            </h3>
          </div>
          <p className="text-xs text-zinc-400">
            Endpoint <code className="text-sky-300 bg-sky-500/10 px-1.5 py-0.5 rounded">{origin}/api/widgets</code>{" "}
            serves real-time JSON for iOS Scriptable, Android KWGT, and standalone PWA WebAPK frames.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => copyText("api-url", `${origin}/api/widgets`)}
            className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-mono text-zinc-200 flex items-center gap-1.5"
          >
            {copiedKey === "api-url" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy JSON URL</span>
          </button>

          <button
            onClick={() => setDrawerOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/35 text-xs font-bold text-sky-200 flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Open Scriptable & KWGT Drawer</span>
          </button>
        </div>
      </div>

      {/* ─── Install & Native Sync Slide-Over Drawer ─────────────────────────── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-[#0b0f19] border-l border-white/15 h-full overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-sky-400">
                  Native Home-Screen Deployment
                </span>
                <h2 className="text-base font-bold uppercase tracking-wider text-white mt-0.5">
                  Install & Native Sync Drawer
                </h2>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 1. PWA Chromeless Launch Links */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                1. PWA Add-to-Home-Screen Launch Links (Chromeless Embeds)
              </h3>
              <p className="text-xs text-zinc-400">
                Open any link on iPhone Safari (Share → Add to Home Screen) or Android Chrome (Install App) for an instant interactive widget view.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { id: "ios-small", title: "iPhone Small (2×2)", badge: "iOS 18 Glass" },
                  { id: "ios-large", title: "iPhone Big (4×4)", badge: "iOS 18 Glass" },
                  { id: "android-small", title: "Android Small (2×2)", badge: "Material You" },
                  { id: "android-large", title: "Android Big (4×4)", badge: "Material You" },
                ].map((item) => {
                  const fullUrl = `${origin}/widgets?embed=${item.id}`;
                  return (
                    <div
                      key={item.id}
                      className="rounded-xl bg-white/[0.04] border border-white/10 p-3 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white">{item.title}</div>
                        <div className="text-[10px] font-mono text-sky-300 truncate">{fullUrl}</div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => copyText(item.id, fullUrl)}
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-200"
                          title="Copy Launch Link"
                        >
                          {copiedKey === item.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <a
                          href={fullUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300"
                          title="Open Chromeless Widget"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. iOS Scriptable JS Script */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                  2. iOS Scriptable Native Home-Screen JS (Small & Big Auto-Detect)
                </h3>
                <button
                  onClick={() => copyText("scriptable", scriptableCode)}
                  className="px-3 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/35 text-[11px] font-bold text-sky-200 flex items-center gap-1.5"
                >
                  {copiedKey === "scriptable" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied Script!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Scriptable JS</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="rounded-xl bg-black/70 border border-white/10 p-3.5 text-[11px] font-mono text-sky-200/90 overflow-x-auto max-h-64">
                {scriptableCode}
              </pre>
            </div>

            {/* 3. Android KWGT JSON Data URL & Kode Pack */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                  3. Android KWGT JSON Data URL & Kode Bindings
                </h3>
                <button
                  onClick={() => copyText("kwgt", kwgtFormulaPack)}
                  className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/35 text-[11px] font-bold text-emerald-200 flex items-center gap-1.5"
                >
                  {copiedKey === "kwgt" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied KWGT Pack!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy KWGT Formulas</span>
                    </>
                  )}
                </button>
              </div>
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-400/25 px-3 py-2 flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono text-emerald-200 truncate">{origin}/api/widgets</span>
                <button
                  onClick={() => copyText("kwgt-url", `${origin}/api/widgets`)}
                  className="text-[10.5px] font-bold text-emerald-300 hover:underline shrink-0"
                >
                  {copiedKey === "kwgt-url" ? "Copied!" : "Copy Data URL"}
                </button>
              </div>
              <pre className="rounded-xl bg-black/70 border border-white/10 p-3.5 text-[11px] font-mono text-emerald-200/90 overflow-x-auto max-h-56">
                {kwgtFormulaPack}
              </pre>
            </div>
          </div>
        </div>
      )}
    </ExecutiveModuleShell>
  );
}

export default function WidgetsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#090b11] flex items-center justify-center text-xs font-mono text-sky-300">
          Syncing Mobile Telemetry Companion...
        </div>
      }
    >
      <WidgetsInnerView />
    </Suspense>
  );
}
