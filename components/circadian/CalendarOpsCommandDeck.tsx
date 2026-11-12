"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Briefcase,
  Calculator,
  CalendarRange,
  Check,
  CheckCircle2,
  Coins,
  DollarSign,
  Droplets,
  Footprints,
  Highlighter,
  Layers,
  ListOrdered,
  Palette,
  Plus,
  Shuffle,
  Sparkles,
  Trash2,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";
import {
  AppointmentCategory,
  CURATED_BLOCK_PALETTE,
  CalendarHabitDTO,
  CalendarHighlightSpanDTO,
  CircadianEventDTO,
  NestedSubtaskItem,
  SubtaskListStyle,
  WorkPaySummaryDTO,
  WorkShiftConfigDTO,
  YearlyAppointmentDTO,
  formatSubtaskMarker,
} from "@/lib/circadianTypes";
import { hhmmToMinutes, minutesToHHMM } from "@/lib/circadianMath";

const MONTH_NAMES_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function fmtMoney(val: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: val % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(val || 0);
}

interface CalendarOpsCommandDeckProps {
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  events: CircadianEventDTO[];
  selectedEventId: string | null;
  onSelectEvent: (id: string | null) => void;
  pendingTasksCount: number;
  habits: CalendarHabitDTO[];
  highlightSpans: CalendarHighlightSpanDTO[];
  shiftConfig: WorkShiftConfigDTO;
  paySummary: WorkPaySummaryDTO;
  appointments: YearlyAppointmentDTO[];
  busyAction: string | null;
  onAutoBatchTasks: () => Promise<void>;
  onRandomizeColors: () => Promise<void>;
  onRecolorEvent: (eventId: string, hex: string) => Promise<void>;
  onLogHabit: (habitId: string, opts: { delta?: number; value?: number }) => Promise<void>;
  onCreateHabit: (payload: {
    title: string;
    subtitle: string;
    unit: string;
    targetValue: number;
    ringColor: string;
  }) => Promise<void>;
  onDeleteHabit: (habitId: string) => Promise<void>;
  onCreateHighlightSpan: (payload: {
    label: string;
    spanType: "hours" | "multi_day";
    startMinute: number;
    endMinute: number;
    startDate?: string | null;
    endDate?: string | null;
    color: string;
    opacity: number;
  }) => Promise<void>;
  onToggleHighlightSpan: (spanId: string, isActive: boolean) => Promise<void>;
  onDeleteHighlightSpan: (spanId: string) => Promise<void>;
  onUpdateShiftConfig: (cfg: WorkShiftConfigDTO) => Promise<void>;
  onToggleTodayShift: () => Promise<void>;
  onCreateAppointment: (payload: Partial<YearlyAppointmentDTO>) => Promise<void>;
  onUpdateAppointment: (id: string, patch: Partial<YearlyAppointmentDTO>) => Promise<void>;
  onDeleteAppointment: (id: string) => Promise<void>;
}

export function CalendarOpsCommandDeck({
  selectedDate,
  onSelectDate,
  events,
  selectedEventId,
  onSelectEvent,
  pendingTasksCount,
  habits,
  highlightSpans,
  shiftConfig,
  paySummary,
  appointments,
  busyAction,
  onAutoBatchTasks,
  onRandomizeColors,
  onRecolorEvent,
  onLogHabit,
  onCreateHabit,
  onDeleteHabit,
  onCreateHighlightSpan,
  onToggleHighlightSpan,
  onDeleteHighlightSpan,
  onUpdateShiftConfig,
  onToggleTodayShift,
  onCreateAppointment,
  onUpdateAppointment,
  onDeleteAppointment,
}: CalendarOpsCommandDeckProps) {
  // Color Studio state
  const [colorTargetEventId, setColorTargetEventId] = useState<string>(() =>
    events[0]?.id || ""
  );

  useEffect(() => {
    if (selectedEventId) {
      setColorTargetEventId(selectedEventId);
    } else if (events.length > 0 && !events.some((e) => e.id === colorTargetEventId)) {
      setColorTargetEventId(events[0].id);
    }
  }, [selectedEventId, events, colorTargetEventId]);

  // Highlight Span Creator state
  const [showSpanCreator, setShowSpanCreator] = useState(false);
  const [spanLabel, setSpanLabel] = useState("08:00 – 14:00 Deep Architecture Lock");
  const [spanType, setSpanType] = useState<"hours" | "multi_day">("hours");
  const [spanStartHHMM, setSpanStartHHMM] = useState("08:00");
  const [spanEndHHMM, setSpanEndHHMM] = useState("14:00");
  const [spanStartDate, setSpanStartDate] = useState(selectedDate);
  const [spanEndDate, setSpanEndDate] = useState(selectedDate);
  const [spanColor, setSpanColor] = useState("#f59e0b");
  const [spanOpacity, setSpanOpacity] = useState(0.2);

  // Habit Creator & Custom Input state
  const [showHabitCreator, setShowHabitCreator] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState("");
  const [newHabitSubtitle, setNewHabitSubtitle] = useState(
    "Full-circle 360° daily consistency target"
  );
  const [newHabitUnit, setNewHabitUnit] = useState("steps");
  const [newHabitTarget, setNewHabitTarget] = useState("10000");
  const [newHabitColor, setNewHabitColor] = useState("#10b981");
  const [customHabitInputs, setCustomHabitInputs] = useState<Record<string, string>>({});

  // Work Shift Rate Editor state
  const [cfgDraft, setCfgDraft] = useState<WorkShiftConfigDTO>(shiftConfig);
  useEffect(() => {
    setCfgDraft(shiftConfig);
  }, [shiftConfig]);

  // Year Appointments Filter & Creator state
  const [apptFilterMode, setApptFilterMode] = useState<
    "all" | "day" | number
  >("all");
  const [showApptCreator, setShowApptCreator] = useState(false);
  const [apptTitle, setApptTitle] = useState("");
  const [apptCategory, setApptCategory] = useState<AppointmentCategory>("work");
  const [apptDate, setApptDate] = useState(selectedDate);
  const [apptStart, setApptStart] = useState("07:00");
  const [apptEnd, setApptEnd] = useState("08:00");
  const [apptColor, setApptColor] = useState("#38bdf8");
  const [apptSpent, setApptSpent] = useState("0");
  const [apptAnticipated, setApptAnticipated] = useState("320");
  const [apptActual, setApptActual] = useState("320");
  const [apptStyle, setApptStyle] = useState<SubtaskListStyle>("roman");
  const [apptFirstSubtask, setApptFirstSubtask] = useState("");
  const [newApptSubtaskInputs, setNewApptSubtaskInputs] = useState<
    Record<string, string>
  >({});
  const [editingFinanceApptId, setEditingFinanceApptId] = useState<string | null>(
    null
  );
  const [financeDraft, setFinanceDraft] = useState<{
    dailyMoneyUsed: string;
    anticipatedPay: string;
    actualPay: string;
  }>({ dailyMoneyUsed: "0", anticipatedPay: "0", actualPay: "0" });

  useEffect(() => {
    setApptDate(selectedDate);
  }, [selectedDate]);

  // 12-Month Appointment Rollup Matrix
  const monthRollups = useMemo(() => {
    return MONTH_NAMES_SHORT.map((name, idx) => {
      const mNum = idx + 1;
      const mStr = String(mNum).padStart(2, "0");
      const items = appointments.filter(
        (a) => a.appointmentDate.slice(5, 7) === mStr
      );
      const anticipated = items.reduce((s, a) => s + a.anticipatedPay, 0);
      const actual = items.reduce((s, a) => s + a.actualPay, 0);
      const spent = items.reduce((s, a) => s + a.dailyMoneyUsed, 0);
      return {
        month: mNum,
        name,
        count: items.length,
        anticipated,
        actual,
        spent,
      };
    });
  }, [appointments]);

  const annualApptTotals = useMemo(() => {
    const anticipated = appointments.reduce((s, a) => s + a.anticipatedPay, 0);
    const actual = appointments.reduce((s, a) => s + a.actualPay, 0);
    const spent = appointments.reduce((s, a) => s + a.dailyMoneyUsed, 0);
    return {
      anticipated,
      actual,
      variance: actual - anticipated,
      spent,
    };
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    if (apptFilterMode === "day") {
      return appointments.filter((a) => a.appointmentDate === selectedDate);
    }
    if (typeof apptFilterMode === "number") {
      const mStr = String(apptFilterMode).padStart(2, "0");
      return appointments.filter((a) => a.appointmentDate.slice(5, 7) === mStr);
    }
    // Sort today's appointments to the very top in "all" view so user immediately sees today's 07:00 Go to Work + full year
    return [...appointments].sort((a, b) => {
      const aToday = a.appointmentDate === selectedDate ? 0 : 1;
      const bToday = b.appointmentDate === selectedDate ? 0 : 1;
      if (aToday !== bToday) return aToday - bToday;
      return a.appointmentDate.localeCompare(b.appointmentDate);
    });
  }, [appointments, apptFilterMode, selectedDate]);

  const selectedYear = selectedDate.slice(0, 4);

  const renderHabitIcon = (iconName: string, color: string) => {
    if (iconName === "droplets") return <Droplets size={16} style={{ color }} />;
    if (iconName === "zap") return <Zap size={16} style={{ color }} />;
    return <Footprints size={16} style={{ color }} />;
  };

  return (
    <section className="px-6 pb-16 space-y-6">
      {/* ── ROW 1: TASK BATCHING, COLOR RANDOMIZER/SWATCH STUDIO & LONG-PERIOD HIGHLIGHTS ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Batching & Curated Color Studio (7 cols) */}
        <div className="xl:col-span-7 rounded-2xl bg-[#12151e]/95 backdrop-blur-xl border border-white/[0.08] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.55)] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Palette size={15} className="text-amber-400" />
                <h2 className="text-xs font-bold tracking-[0.14em] uppercase text-zinc-100">
                  Task Batching & Block Color Studio
                </h2>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Auto-batch pending tasks into focused calendar blocks, color-code wedges, or randomize harmonious palettes.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onAutoBatchTasks}
                disabled={busyAction === "auto_batch"}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:brightness-110 text-white text-[11px] font-bold tracking-wider uppercase shadow-[0_0_20px_rgba(56,189,248,0.28)] transition-all disabled:opacity-60"
              >
                <Layers size={13} />
                {busyAction === "auto_batch"
                  ? "Batching..."
                  : `Auto-Batch Pending Tasks${
                      pendingTasksCount > 0 ? ` (${pendingTasksCount})` : ""
                    }`}
              </button>

              <button
                type="button"
                onClick={onRandomizeColors}
                disabled={busyAction === "randomize_colors"}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:brightness-110 text-white text-[11px] font-bold tracking-wider uppercase shadow-[0_0_20px_rgba(139,92,246,0.28)] transition-all disabled:opacity-60"
              >
                <Shuffle size={13} />
                {busyAction === "randomize_colors"
                  ? "Randomizing..."
                  : "Randomize Block Colors"}
              </button>
            </div>
          </div>

          {/* Block Selector Pills */}
          <div className="space-y-2.5 pt-1 border-t border-white/[0.06]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-[0.12em] uppercase text-zinc-400">
                1. Choose Calendar Block to Color-Code
              </span>
              <span className="text-[10px] text-zinc-500">
                Updates Solar Dial wedge + orbital ribbon + Agenda live
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {events.map((ev) => {
                const isTarget = colorTargetEventId === ev.id;
                return (
                  <button
                    key={`col-chip-${ev.id}`}
                    type="button"
                    onClick={() => {
                      setColorTargetEventId(ev.id);
                      onSelectEvent(ev.id);
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-medium border transition-all ${
                      isTarget
                        ? "bg-white/15 text-white border-white/35 shadow"
                        : "bg-[#181c28] text-zinc-300 border-white/[0.06] hover:border-white/20"
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: ev.accentColor }}
                    />
                    <span className="truncate max-w-[150px]">{ev.title}</span>
                  </button>
                );
              })}
            </div>

            {/* 12 Curated Harmonious Hex Swatches */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[10px] font-bold tracking-[0.12em] uppercase text-zinc-400 mr-1">
                2. Apply Swatch:
              </span>
              {CURATED_BLOCK_PALETTE.map((sw) => {
                const activeEv = events.find((e) => e.id === colorTargetEventId);
                const isCurrent =
                  activeEv?.accentColor?.toLowerCase() === sw.hex.toLowerCase();
                return (
                  <button
                    key={sw.hex}
                    type="button"
                    title={`${sw.name} (${sw.hex})`}
                    onClick={() => {
                      if (colorTargetEventId) {
                        onRecolorEvent(colorTargetEventId, sw.hex);
                      }
                    }}
                    className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-115 flex items-center justify-center ${
                      isCurrent
                        ? "border-white scale-110 shadow-[0_0_12px_rgba(255,255,255,0.6)]"
                        : "border-black/40"
                    }`}
                    style={{ backgroundColor: sw.hex }}
                  >
                    {isCurrent && <Check size={11} className="text-black" strokeWidth={3} />}
                  </button>
                );
              })}

              <label
                className="ml-1 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/[0.06] hover:bg-white/10 border border-white/10 text-[10px] text-zinc-300 cursor-pointer"
                title="Pick custom hex color"
              >
                <input
                  type="color"
                  value={
                    events.find((e) => e.id === colorTargetEventId)?.accentColor ||
                    "#38bdf8"
                  }
                  onChange={(e) => {
                    if (colorTargetEventId) {
                      onRecolorEvent(colorTargetEventId, e.target.value);
                    }
                  }}
                  className="w-4 h-4 bg-transparent border-0 cursor-pointer"
                />
                Custom Hex
              </label>
            </div>
          </div>
        </div>

        {/* Long-Period Highlight Spans Manager (5 cols) */}
        <div className="xl:col-span-5 rounded-2xl bg-[#12151e]/95 backdrop-blur-xl border border-white/[0.08] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.55)] flex flex-col justify-between gap-3">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Highlighter size={15} className="text-sky-400" />
                <h2 className="text-xs font-bold tracking-[0.14em] uppercase text-zinc-100">
                  Long-Period Section Highlights
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowSpanCreator((v) => !v)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.07] hover:bg-white/12 border border-white/10 text-[10px] font-semibold text-amber-300 transition-colors"
              >
                <Plus size={11} />
                {showSpanCreator ? "Close" : "New Span"}
              </button>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Illuminate extended hour arcs or multi-day sprint windows directly on the 360° dial.
            </p>

            {showSpanCreator && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!spanLabel.trim()) return;
                  await onCreateHighlightSpan({
                    label: spanLabel.trim(),
                    spanType,
                    startMinute: hhmmToMinutes(spanStartHHMM),
                    endMinute: hhmmToMinutes(spanEndHHMM),
                    startDate: spanType === "multi_day" ? spanStartDate : null,
                    endDate: spanType === "multi_day" ? spanEndDate : null,
                    color: spanColor,
                    opacity: spanOpacity,
                  });
                  setShowSpanCreator(false);
                }}
                className="mt-3 p-3 rounded-xl bg-[#181c28] border border-white/10 space-y-2.5"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={spanLabel}
                    onChange={(e) => setSpanLabel(e.target.value)}
                    placeholder="Highlight label..."
                    className="sm:col-span-2 bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400/50"
                  />
                  <select
                    value={spanType}
                    onChange={(e) =>
                      setSpanType(e.target.value as "hours" | "multi_day")
                    }
                    className="bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-zinc-200"
                  >
                    <option value="hours">Hours Window</option>
                    <option value="multi_day">Multi-Day Span</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-center">
                  <div>
                    <label className="block text-[9px] uppercase text-zinc-400 mb-0.5">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={spanStartHHMM}
                      onChange={(e) => setSpanStartHHMM(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase text-zinc-400 mb-0.5">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={spanEndHHMM}
                      onChange={(e) => setSpanEndHHMM(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase text-zinc-400 mb-0.5">
                      Glow Color
                    </label>
                    <input
                      type="color"
                      value={spanColor}
                      onChange={(e) => setSpanColor(e.target.value)}
                      className="w-full h-7 bg-black/40 border border-white/10 rounded-lg px-1 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase text-zinc-400 mb-0.5">
                      Intensity ({Math.round(spanOpacity * 100)}%)
                    </label>
                    <input
                      type="range"
                      min={0.08}
                      max={0.4}
                      step={0.02}
                      value={spanOpacity}
                      onChange={(e) => setSpanOpacity(Number(e.target.value))}
                      className="w-full accent-amber-400"
                    />
                  </div>
                </div>

                {spanType === "multi_day" && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] uppercase text-zinc-400 mb-0.5">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={spanStartDate}
                        onChange={(e) => setSpanStartDate(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase text-zinc-400 mb-0.5">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={spanEndDate}
                        onChange={(e) => setSpanEndDate(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs text-white"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold uppercase tracking-wider"
                >
                  Activate Highlight Span on Dial
                </button>
              </form>
            )}

            <div className="mt-3 space-y-2 max-h-44 overflow-y-auto pr-1">
              {highlightSpans.map((sp) => (
                <div
                  key={sp.id}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#181c28] border border-white/[0.06]"
                >
                  <div className="min-w-0 flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => onToggleHighlightSpan(sp.id, !sp.isActive)}
                      className={`w-8 h-4.5 rounded-full p-0.5 transition-colors flex items-center ${
                        sp.isActive ? "justify-end" : "justify-start bg-zinc-700"
                      }`}
                      style={
                        sp.isActive ? { backgroundColor: sp.color } : undefined
                      }
                      title="Toggle section highlight on Solar Dial"
                    >
                      <span className="w-3.5 h-3.5 rounded-full bg-white shadow" />
                    </button>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-zinc-100 truncate">
                        {sp.label}
                      </div>
                      <div className="text-[10px] font-mono text-zinc-400">
                        {minutesToHHMM(sp.startMinute)}–
                        {minutesToHHMM(sp.endMinute)}
                        {sp.spanType === "multi_day" && sp.startDate
                          ? ` · Multi-Day (${sp.startDate.slice(5)} → ${
                              sp.endDate?.slice(5) || ""
                            })`
                          : " · Daily Arc"}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteHighlightSpan(sp.id)}
                    className="p-1 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-white/5 transition-colors"
                    title="Remove Highlight"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── ROW 2: FULL-CIRCLE 360° HABIT TRACKER RINGS + WORK SHIFT × PAY CALCULATOR ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Full-Circle 360° Habit Tracker Rings (6 cols) */}
        <div className="xl:col-span-6 rounded-2xl bg-[#12151e]/95 backdrop-blur-xl border border-white/[0.08] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.55)] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Footprints size={15} className="text-emerald-400" />
                <h2 className="text-xs font-bold tracking-[0.14em] uppercase text-zinc-100">
                  Full-Circle 360° Habit Tracker Rings
                </h2>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Concentric 360° completion rings synced around the Solar Dial — closes into a glowing full circle at 100%!
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowHabitCreator((v) => !v)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/35 text-[10.5px] font-bold uppercase tracking-wider text-emerald-300 transition-colors"
            >
              <Plus size={12} />
              {showHabitCreator ? "Cancel" : "Add 360° Habit"}
            </button>
          </div>

          {showHabitCreator && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newHabitTitle.trim()) return;
                await onCreateHabit({
                  title: newHabitTitle.trim(),
                  subtitle: newHabitSubtitle.trim(),
                  unit: newHabitUnit.trim() || "steps",
                  targetValue: Math.max(1, Number(newHabitTarget) || 10000),
                  ringColor: newHabitColor,
                });
                setNewHabitTitle("");
                setShowHabitCreator(false);
              }}
              className="p-3.5 rounded-xl bg-[#181c28] border border-white/10 grid grid-cols-1 sm:grid-cols-4 gap-2.5"
            >
              <input
                type="text"
                value={newHabitTitle}
                onChange={(e) => setNewHabitTitle(e.target.value)}
                placeholder="e.g. Evening Treadmill Incline Walk"
                className="sm:col-span-2 bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
              <input
                type="number"
                value={newHabitTarget}
                onChange={(e) => setNewHabitTarget(e.target.value)}
                placeholder="Target (10000)"
                className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={newHabitUnit}
                  onChange={(e) => setNewHabitUnit(e.target.value)}
                  placeholder="steps / mi"
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white"
                />
                <input
                  type="color"
                  value={newHabitColor}
                  onChange={(e) => setNewHabitColor(e.target.value)}
                  className="w-8 h-8 rounded bg-transparent border-0 shrink-0 cursor-pointer"
                />
              </div>
              <button
                type="submit"
                className="sm:col-span-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold uppercase tracking-wider"
              >
                Create 360° Habit Ring
              </button>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {habits.map((h) => {
              const r = 42;
              const circ = 2 * Math.PI * r;
              const clamped = Math.max(0, Math.min(100, h.pct));
              const isComplete = clamped >= 99.9;
              const dash = (clamped / 100) * circ;
              const quickDelta =
                h.unit === "steps"
                  ? 1000
                  : h.unit === "oz"
                  ? 20
                  : h.unit === "hrs"
                  ? 1
                  : Math.max(1, Math.round(h.targetValue * 0.25));

              return (
                <div
                  key={h.id}
                  className="relative rounded-2xl bg-[#181c28] border p-3.5 flex flex-col items-center text-center transition-all"
                  style={{
                    borderColor: isComplete
                      ? `${h.ringColor}99`
                      : "rgba(255,255,255,0.07)",
                    boxShadow: isComplete
                      ? `0 0 28px ${h.ringColor}28`
                      : undefined,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => onDeleteHabit(h.id)}
                    className="absolute top-2.5 right-2.5 text-zinc-600 hover:text-red-400 transition-colors"
                    title="Delete Habit"
                  >
                    <Trash2 size={12} />
                  </button>

                  {/* Pure 1:1 360° SVG Habit Ring */}
                  <div className="relative w-24 h-24 mb-2">
                    <svg
                      viewBox="0 0 104 104"
                      preserveAspectRatio="xMidYMid meet"
                      className="w-full h-full"
                    >
                      <circle
                        cx="52"
                        cy="52"
                        r={r}
                        fill="none"
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth="7"
                      />
                      {isComplete && (
                        <circle
                          cx="52"
                          cy="52"
                          r={r}
                          fill="none"
                          stroke={h.ringColor}
                          strokeWidth="13"
                          opacity="0.22"
                        />
                      )}
                      {clamped > 0 && (
                        <circle
                          cx="52"
                          cy="52"
                          r={r}
                          fill="none"
                          stroke={h.ringColor}
                          strokeWidth="7.5"
                          strokeLinecap="round"
                          strokeDasharray={
                            isComplete
                              ? undefined
                              : `${dash.toFixed(2)} ${circ.toFixed(2)}`
                          }
                          transform="rotate(-90 52 52)"
                        />
                      )}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      {renderHabitIcon(h.iconName, h.ringColor)}
                      <span
                        className="text-xs font-bold text-white font-mono mt-0.5"
                        style={{ fontVariantNumeric: "tabular-nums" }}
                      >
                        {Math.round(h.pct)}%
                      </span>
                      <span className="text-[8.5px] uppercase tracking-wider text-zinc-400">
                        {isComplete ? "360° LOCK" : `${Math.round((h.pct / 100) * 360)}°`}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs font-bold text-zinc-100 line-clamp-1">
                    {h.title}
                  </div>
                  <div className="text-[10.5px] font-mono text-zinc-300 mt-0.5">
                    {h.currentValue.toLocaleString()} /{" "}
                    {h.targetValue.toLocaleString()} {h.unit}
                  </div>
                  <p className="text-[9.5px] text-zinc-500 line-clamp-1 mt-0.5 mb-2.5">
                    {h.subtitle}
                  </p>

                  {/* Quick Step Increment & Full Circle Lock Controls */}
                  <div className="w-full grid grid-cols-2 gap-1.5 mt-auto">
                    <button
                      type="button"
                      onClick={() => onLogHabit(h.id, { delta: quickDelta })}
                      className="px-2 py-1 rounded-lg bg-white/[0.08] hover:bg-white/15 text-[10px] font-mono font-semibold text-white transition-colors"
                    >
                      +{quickDelta.toLocaleString()} {h.unit}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onLogHabit(h.id, {
                          value: isComplete ? 0 : h.targetValue,
                        })
                      }
                      className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors"
                      style={{
                        backgroundColor: `${h.ringColor}24`,
                        color: h.ringColor,
                        border: `1px solid ${h.ringColor}55`,
                      }}
                    >
                      {isComplete ? "Reset" : "Close 360°"}
                    </button>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const raw = Number(customHabitInputs[h.id]);
                      if (!isNaN(raw) && raw >= 0) {
                        onLogHabit(h.id, { value: raw });
                        setCustomHabitInputs((p) => ({ ...p, [h.id]: "" }));
                      }
                    }}
                    className="w-full flex items-center gap-1 mt-1.5"
                  >
                    <input
                      type="number"
                      step="any"
                      value={customHabitInputs[h.id] || ""}
                      onChange={(e) =>
                        setCustomHabitInputs((p) => ({
                          ...p,
                          [h.id]: e.target.value,
                        }))
                      }
                      placeholder={`Set ${h.unit}...`}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white placeholder:text-zinc-500"
                    />
                    <button
                      type="submit"
                      className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-[10px] font-semibold text-zinc-200"
                    >
                      Set
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        </div>

        {/* Work Days & Shift × Pay Calculator (6 cols) */}
        <div className="xl:col-span-6 rounded-2xl bg-[#12151e]/95 backdrop-blur-xl border border-white/[0.08] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.55)] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Calculator size={15} className="text-emerald-400" />
                <h2 className="text-xs font-bold tracking-[0.14em] uppercase text-zinc-100">
                  Work Days & Shift × Pay Calculator
                </h2>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Live{" "}
                <span className="font-mono text-emerald-300">
                  Shifts × {fmtMoney(paySummary.payRate)}/shift
                </span>{" "}
                engine across Daily, Weekly, Bi-Weekly & Monthly horizons.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onToggleTodayShift}
                disabled={busyAction === "toggle_shift"}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider border transition-all ${
                  paySummary.todayLogged
                    ? "bg-emerald-500/20 border-emerald-400/60 text-emerald-200"
                    : "bg-amber-500 text-black border-amber-400"
                }`}
              >
                <CheckCircle2 size={13} />
                {paySummary.todayLogged
                  ? "Today's Shift Logged ✓"
                  : "Log Today's Shift"}
              </button>

              <Link
                href="/budget"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/[0.07] hover:bg-white/12 border border-white/10 text-[10.5px] font-semibold text-sky-300 transition-colors"
              >
                <Wallet size={12} />
                12-Mo Budget
                <ArrowUpRight size={11} />
              </Link>
            </div>
          </div>

          {/* Days Worked Progress Bar: e.g. 16 / 22 Days Worked (72.7%) */}
          <div className="p-3.5 rounded-xl bg-[#181c28] border border-white/[0.07] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-zinc-100 flex items-center gap-1.5">
                <Briefcase size={13} className="text-sky-400" />
                {paySummary.daysWorked} / {paySummary.totalScheduledDays} Days
                Worked
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-[10px] font-mono text-emerald-300">
                  {paySummary.workedPct}%
                </span>
              </span>
              <span className="text-[11px] font-mono text-zinc-400">
                Remaining:{" "}
                {Math.max(
                  0,
                  paySummary.totalScheduledDays - paySummary.daysWorked
                )}{" "}
                days
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-black/50 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-400 via-emerald-400 to-amber-400 transition-all duration-500"
                style={{
                  width: `${Math.min(100, paySummary.workedPct)}%`,
                }}
              />
            </div>
          </div>

          {/* 4-Horizon Shift × Pay Formula Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              {
                horizon: "Daily Pay",
                formula: `${paySummary.dailyShifts} × ${fmtMoney(
                  paySummary.payRate
                )}`,
                total: paySummary.dailyPay,
                sub:
                  paySummary.dailyShifts > 0
                    ? `1 shift = ${fmtMoney(paySummary.payRate)}`
                    : `Next shift: ${fmtMoney(paySummary.payRate)}`,
                accent: "#38bdf8",
              },
              {
                horizon: "Weekly Pay",
                formula: `${paySummary.weeklyShifts} × ${fmtMoney(
                  paySummary.payRate
                )}`,
                total: paySummary.weeklyPay,
                sub: `Target: ${fmtMoney(paySummary.weeklyTargetPay)}`,
                accent: "#10b981",
              },
              {
                horizon: "Bi-Weekly Pay",
                formula: `${paySummary.biWeeklyShifts} × ${fmtMoney(
                  paySummary.payRate
                )}`,
                total: paySummary.biWeeklyPay,
                sub: `14d Target: ${fmtMoney(paySummary.biWeeklyTargetPay)}`,
                accent: "#8b5cf6",
              },
              {
                horizon: "Monthly Pay",
                formula: `${paySummary.monthlyShifts} × ${fmtMoney(
                  paySummary.payRate
                )}`,
                total: paySummary.monthlyPay,
                sub: `of ${fmtMoney(paySummary.scheduledMonthlyTotal)} sched`,
                accent: "#f59e0b",
              },
            ].map((card) => (
              <div
                key={card.horizon}
                className="rounded-xl bg-[#181c28] border border-white/[0.07] p-3 flex flex-col justify-between"
              >
                <span className="text-[9.5px] font-bold uppercase tracking-wider text-zinc-400">
                  {card.horizon}
                </span>
                <div
                  className="text-base font-bold font-mono mt-1"
                  style={{
                    color: card.accent,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {fmtMoney(card.total)}
                </div>
                <div className="text-[10px] font-mono text-zinc-300 mt-0.5">
                  {card.formula}
                </div>
                <div className="text-[9.5px] text-zinc-500 mt-0.5 truncate">
                  {card.sub}
                </div>
              </div>
            ))}
          </div>

          {/* Editable Shift Rate & Schedule Parameters */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onUpdateShiftConfig(cfgDraft);
            }}
            className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-end pt-2 border-t border-white/[0.06]"
          >
            <div>
              <label className="block text-[9px] uppercase text-zinc-400 mb-0.5">
                $ / Hour
              </label>
              <input
                type="number"
                step="0.5"
                value={cfgDraft.hourlyRate}
                onChange={(e) => {
                  const hr = Math.max(0, Number(e.target.value));
                  setCfgDraft((p) => ({
                    ...p,
                    hourlyRate: hr,
                    payPerShift: Math.round(hr * p.hoursPerShift * 100) / 100,
                  }));
                }}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs font-mono text-white"
              />
            </div>
            <div>
              <label className="block text-[9px] uppercase text-zinc-400 mb-0.5">
                Hrs / Shift
              </label>
              <input
                type="number"
                step="0.5"
                value={cfgDraft.hoursPerShift}
                onChange={(e) => {
                  const hrs = Math.max(0.5, Number(e.target.value));
                  setCfgDraft((p) => ({
                    ...p,
                    hoursPerShift: hrs,
                    payPerShift: Math.round(p.hourlyRate * hrs * 100) / 100,
                  }));
                }}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs font-mono text-white"
              />
            </div>
            <div>
              <label className="block text-[9px] uppercase text-emerald-400 mb-0.5">
                $ / Shift
              </label>
              <input
                type="number"
                step="1"
                value={cfgDraft.payPerShift}
                onChange={(e) =>
                  setCfgDraft((p) => ({
                    ...p,
                    payPerShift: Math.max(0, Number(e.target.value)),
                  }))
                }
                className="w-full bg-black/40 border border-emerald-400/35 rounded-lg px-2 py-1.5 text-xs font-mono text-emerald-300"
              />
            </div>
            <div>
              <label className="block text-[9px] uppercase text-zinc-400 mb-0.5">
                Sched Days/Mo
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={cfgDraft.totalScheduledDays}
                onChange={(e) =>
                  setCfgDraft((p) => ({
                    ...p,
                    totalScheduledDays: Math.max(1, Number(e.target.value)),
                  }))
                }
                className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs font-mono text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full py-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-[11px] font-bold uppercase tracking-wider transition-colors"
            >
              Recalculate
            </button>
          </form>
        </div>
      </div>

      {/* ── ROW 3: FULL-YEAR APPOINTMENTS ENGINE (12-MONTH MATRIX + FINANCIAL TELEMETRY + ROMAN/BULLET SUBTASKS) ── */}
      <div className="rounded-2xl bg-[#12151e]/95 backdrop-blur-xl border border-white/[0.08] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.6)] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <CalendarRange size={16} className="text-amber-400" />
              <h2 className="text-xs sm:text-sm font-bold tracking-[0.14em] uppercase text-zinc-100">
                {selectedYear} Full-Year Appointments, Daily Spend & Anticipated vs. Actual Pay
              </h2>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              12-month appointment matrix with attached daily money used, anticipated pay, actual pay variance, and Roman-numeral (`I, II, III, IV`) or bullet (`•`) nested subtasks.
            </p>
          </div>

          {/* Annual Financial KPI Pills + Add Appointment Button */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="px-3 py-1.5 rounded-xl bg-[#181c28] border border-white/[0.07] text-[11px]">
              <span className="text-zinc-400 mr-1.5">Anticipated:</span>
              <span className="font-mono font-bold text-sky-300">
                {fmtMoney(annualApptTotals.anticipated)}
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-[#181c28] border border-white/[0.07] text-[11px]">
              <span className="text-zinc-400 mr-1.5">Actual Paid:</span>
              <span className="font-mono font-bold text-emerald-300">
                {fmtMoney(annualApptTotals.actual)}
              </span>
              <span
                className={`ml-1.5 text-[10px] font-mono ${
                  annualApptTotals.variance >= 0
                    ? "text-emerald-400"
                    : "text-rose-400"
                }`}
              >
                ({annualApptTotals.variance >= 0 ? "+" : ""}
                {fmtMoney(annualApptTotals.variance)})
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-[#181c28] border border-white/[0.07] text-[11px]">
              <span className="text-zinc-400 mr-1.5">Money Used:</span>
              <span className="font-mono font-bold text-orange-300">
                {fmtMoney(annualApptTotals.spent)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowApptCreator((v) => !v)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-black text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all"
            >
              <Plus size={14} strokeWidth={2.5} />
              {showApptCreator ? "Close Form" : "Add Year Appointment"}
            </button>
          </div>
        </div>

        {/* 12-Month Interactive Mini-Month Heatmap Matrix (Jan - Dec) */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-zinc-400">
              12-Month Year Matrix (Click any month to filter)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setApptFilterMode("all")}
                className={`px-2.5 py-1 rounded-lg text-[10.5px] font-semibold transition-colors ${
                  apptFilterMode === "all"
                    ? "bg-amber-400 text-black"
                    : "bg-[#181c28] text-zinc-300 hover:bg-white/10"
                }`}
              >
                All 12 Months ({appointments.length})
              </button>
              <button
                type="button"
                onClick={() => setApptFilterMode("day")}
                className={`px-2.5 py-1 rounded-lg text-[10.5px] font-semibold transition-colors ${
                  apptFilterMode === "day"
                    ? "bg-sky-400 text-black"
                    : "bg-[#181c28] text-zinc-300 hover:bg-white/10"
                }`}
              >
                Selected Day ({selectedDate})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-12 gap-2">
            {monthRollups.map((m) => {
              const isSelectedMonth = apptFilterMode === m.month;
              return (
                <button
                  key={m.name}
                  type="button"
                  onClick={() =>
                    setApptFilterMode(isSelectedMonth ? "all" : m.month)
                  }
                  className={`rounded-xl p-2.5 text-left border transition-all ${
                    isSelectedMonth
                      ? "bg-amber-400/15 border-amber-400 text-white shadow-[0_0_18px_rgba(251,191,36,0.2)]"
                      : "bg-[#181c28] border-white/[0.06] hover:border-white/20 text-zinc-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase">
                      {m.name}
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-white/10 text-[9.5px] font-mono text-zinc-200">
                      {m.count}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-emerald-400 mt-1.5 truncate">
                    +{fmtMoney(m.actual)}
                  </div>
                  <div className="text-[9.5px] font-mono text-orange-300/85 truncate">
                    -{fmtMoney(m.spent)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Create New Year Appointment Form */}
        {showApptCreator && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!apptTitle.trim()) return;
              const initialSubs: NestedSubtaskItem[] = apptFirstSubtask.trim()
                ? [
                    {
                      id: `sub-${Date.now()}`,
                      label: apptFirstSubtask.trim(),
                      timeWindow: `${apptStart}–${apptEnd}`,
                      isCompleted: false,
                    },
                  ]
                : [];
              await onCreateAppointment({
                title: apptTitle.trim(),
                category: apptCategory,
                appointmentDate: apptDate,
                startTime: apptStart,
                endTime: apptEnd,
                accentColor: apptColor,
                dailyMoneyUsed: Math.max(0, Number(apptSpent) || 0),
                anticipatedPay: Math.max(0, Number(apptAnticipated) || 0),
                actualPay: Math.max(0, Number(apptActual) || 0),
                subtaskStyle: apptStyle,
                subtasks: initialSubs,
              });
              setApptTitle("");
              setApptFirstSubtask("");
              setShowApptCreator(false);
            }}
            className="p-4 rounded-2xl bg-[#181c28] border border-amber-400/30 space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
              <div className="lg:col-span-2">
                <label className="block text-[9.5px] uppercase text-zinc-400 mb-1">
                  Appointment / Block Title
                </label>
                <input
                  type="text"
                  required
                  value={apptTitle}
                  onChange={(e) => setApptTitle(e.target.value)}
                  placeholder="e.g. Go to Work / Client Architecture Review"
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[9.5px] uppercase text-zinc-400 mb-1">
                  Category
                </label>
                <select
                  value={apptCategory}
                  onChange={(e) =>
                    setApptCategory(e.target.value as AppointmentCategory)
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white"
                >
                  <option value="work">Work Shift</option>
                  <option value="client">Client Deliverable</option>
                  <option value="financial">Financial / Tax</option>
                  <option value="medical">Medical / Health</option>
                  <option value="personal">Personal / Pack</option>
                </select>
              </div>
              <div>
                <label className="block text-[9.5px] uppercase text-zinc-400 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={apptDate}
                  onChange={(e) => setApptDate(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[9.5px] uppercase text-zinc-400 mb-1">
                  Start – End
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="time"
                    value={apptStart}
                    onChange={(e) => setApptStart(e.target.value)}
                    className="w-1/2 bg-black/40 border border-white/10 rounded-lg px-1.5 py-1.5 text-xs text-white"
                  />
                  <input
                    type="time"
                    value={apptEnd}
                    onChange={(e) => setApptEnd(e.target.value)}
                    className="w-1/2 bg-black/40 border border-white/10 rounded-lg px-1.5 py-1.5 text-xs text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[9.5px] uppercase text-zinc-400 mb-1">
                  Subtask Style & Color
                </label>
                <div className="flex items-center gap-1.5">
                  <select
                    value={apptStyle}
                    onChange={(e) =>
                      setApptStyle(e.target.value as SubtaskListStyle)
                    }
                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white"
                  >
                    <option value="roman">Roman (I, II, III)</option>
                    <option value="bullets">Bullets (•)</option>
                  </select>
                  <input
                    type="color"
                    value={apptColor}
                    onChange={(e) => setApptColor(e.target.value)}
                    className="w-8 h-8 rounded bg-transparent border-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end">
              <div>
                <label className="block text-[9.5px] uppercase text-orange-300 mb-1">
                  Money Used That Day ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={apptSpent}
                  onChange={(e) => setApptSpent(e.target.value)}
                  className="w-full bg-black/40 border border-orange-400/30 rounded-lg px-2.5 py-1.5 text-xs font-mono text-orange-200"
                />
              </div>
              <div>
                <label className="block text-[9.5px] uppercase text-sky-300 mb-1">
                  Anticipated Pay Block ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={apptAnticipated}
                  onChange={(e) => setApptAnticipated(e.target.value)}
                  className="w-full bg-black/40 border border-sky-400/30 rounded-lg px-2.5 py-1.5 text-xs font-mono text-sky-200"
                />
              </div>
              <div>
                <label className="block text-[9.5px] uppercase text-emerald-300 mb-1">
                  Actual Pay Block ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={apptActual}
                  onChange={(e) => setApptActual(e.target.value)}
                  className="w-full bg-black/40 border border-emerald-400/30 rounded-lg px-2.5 py-1.5 text-xs font-mono text-emerald-200"
                />
              </div>
              <div>
                <label className="block text-[9.5px] uppercase text-zinc-400 mb-1">
                  First Nested Subtask (Optional)
                </label>
                <input
                  type="text"
                  value={apptFirstSubtask}
                  onChange={(e) => setApptFirstSubtask(e.target.value)}
                  placeholder="e.g. 07:00–07:20 Morning queue check"
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold uppercase tracking-wider"
              >
                Save Appointment & Sync to 12-Month Budget
              </button>
            </div>
          </form>
        )}

        {/* Appointment Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          {filteredAppointments.map((appt) => {
            const delta = appt.actualPay - appt.anticipatedPay;
            const isTodayAppt = appt.appointmentDate === selectedDate;
            const isEditingFin = editingFinanceApptId === appt.id;

            return (
              <div
                key={appt.id}
                className={`rounded-2xl bg-[#181c28] border p-4 space-y-3 transition-all ${
                  isTodayAppt
                    ? "border-sky-400/50 shadow-[0_0_24px_rgba(56,189,248,0.12)]"
                    : "border-white/[0.07]"
                }`}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: appt.accentColor }}
                      />
                      <button
                        type="button"
                        onClick={() => onSelectDate(appt.appointmentDate)}
                        className="px-2 py-0.5 rounded-md bg-white/[0.07] hover:bg-white/12 text-[10px] font-mono text-zinc-200 transition-colors"
                        title="Jump Solar Dial to this appointment date"
                      >
                        {appt.appointmentDate} · {appt.startTime}–{appt.endTime}
                      </button>
                      <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider bg-white/[0.05] text-zinc-300">
                        {appt.category}
                      </span>
                      {isTodayAppt && (
                        <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-400/40">
                          Selected Day
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-white mt-1.5">
                      {appt.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateAppointment(appt.id, {
                          subtaskStyle:
                            appt.subtaskStyle === "roman" ? "bullets" : "roman",
                        })
                      }
                      className="px-2 py-1 rounded-lg bg-white/[0.07] hover:bg-white/12 border border-white/10 text-[10px] font-mono font-bold text-amber-300 transition-colors"
                      title="Toggle Roman Numerals (I, II, III) vs Bullet Points (•)"
                    >
                      {appt.subtaskStyle === "roman"
                        ? "Roman: I, II"
                        : "Bullets: •"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (isEditingFin) {
                          setEditingFinanceApptId(null);
                        } else {
                          setEditingFinanceApptId(appt.id);
                          setFinanceDraft({
                            dailyMoneyUsed: String(appt.dailyMoneyUsed),
                            anticipatedPay: String(appt.anticipatedPay),
                            actualPay: String(appt.actualPay),
                          });
                        }
                      }}
                      className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/12 text-emerald-300 transition-colors"
                      title="Edit Financial Telemetry"
                    >
                      <DollarSign size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteAppointment(appt.id)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-white/5 transition-colors"
                      title="Delete Appointment"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Financial Telemetry Pills: Money Used + Anticipated Pay + Actual Pay & Delta */}
                {isEditingFin ? (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      await onUpdateAppointment(appt.id, {
                        dailyMoneyUsed: Math.max(
                          0,
                          Number(financeDraft.dailyMoneyUsed) || 0
                        ),
                        anticipatedPay: Math.max(
                          0,
                          Number(financeDraft.anticipatedPay) || 0
                        ),
                        actualPay: Math.max(
                          0,
                          Number(financeDraft.actualPay) || 0
                        ),
                      });
                      setEditingFinanceApptId(null);
                    }}
                    className="grid grid-cols-4 gap-2 items-end p-2.5 rounded-xl bg-black/35 border border-emerald-400/30"
                  >
                    <div>
                      <label className="block text-[9px] uppercase text-orange-300 mb-0.5">
                        Money Used $
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={financeDraft.dailyMoneyUsed}
                        onChange={(e) =>
                          setFinanceDraft((p) => ({
                            ...p,
                            dailyMoneyUsed: e.target.value,
                          }))
                        }
                        className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-xs font-mono text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase text-sky-300 mb-0.5">
                        Anticipated $
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={financeDraft.anticipatedPay}
                        onChange={(e) =>
                          setFinanceDraft((p) => ({
                            ...p,
                            anticipatedPay: e.target.value,
                          }))
                        }
                        className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-xs font-mono text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase text-emerald-300 mb-0.5">
                        Actual Paid $
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={financeDraft.actualPay}
                        onChange={(e) =>
                          setFinanceDraft((p) => ({
                            ...p,
                            actualPay: e.target.value,
                          }))
                        }
                        className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-xs font-mono text-white"
                      />
                    </div>
                    <button
                      type="submit"
                      className="py-1.5 rounded bg-emerald-500 text-black text-[10.5px] font-bold uppercase"
                    >
                      Save $
                    </button>
                  </form>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-black/30 border border-white/[0.05] px-2.5 py-2">
                      <div className="text-[9px] uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                        <Coins size={10} className="text-orange-400" />
                        Money Used
                      </div>
                      <div className="text-xs font-mono font-bold text-orange-300 mt-0.5">
                        {fmtMoney(appt.dailyMoneyUsed)}
                      </div>
                    </div>

                    <div className="rounded-xl bg-black/30 border border-white/[0.05] px-2.5 py-2">
                      <div className="text-[9px] uppercase tracking-wider text-zinc-400">
                        Anticipated Pay
                      </div>
                      <div className="text-xs font-mono font-bold text-sky-300 mt-0.5">
                        {fmtMoney(appt.anticipatedPay)}
                      </div>
                    </div>

                    <div className="rounded-xl bg-black/30 border border-white/[0.05] px-2.5 py-2">
                      <div className="text-[9px] uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                        <span>Actual Pay</span>
                        {(appt.anticipatedPay > 0 || appt.actualPay > 0) && (
                          <span
                            className={`font-mono text-[9px] ${
                              delta >= 0 ? "text-emerald-400" : "text-rose-400"
                            }`}
                          >
                            {delta >= 0 ? "+" : ""}
                            {fmtMoney(delta)}
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-mono font-bold text-emerald-300 mt-0.5 flex items-center gap-1">
                        <TrendingUp size={11} />
                        {fmtMoney(appt.actualPay)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Nested Subtasks with Roman Numerals (I, II, III, IV) or Bullets (•) */}
                <div className="pt-1 border-t border-white/[0.06] space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-zinc-400">
                    <span className="font-bold uppercase tracking-wider flex items-center gap-1">
                      <ListOrdered size={11} className="text-amber-400" />
                      Nested Block Subtasks
                    </span>
                    <span className="font-mono">
                      {appt.subtasks.filter((s) => s.isCompleted).length}/
                      {appt.subtasks.length} complete
                    </span>
                  </div>

                  {appt.subtasks.map((sub, idx) => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => {
                        const updated = appt.subtasks.map((s) =>
                          s.id === sub.id
                            ? { ...s, isCompleted: !s.isCompleted }
                            : s
                        );
                        onUpdateAppointment(appt.id, { subtasks: updated });
                      }}
                      className="w-full flex items-start gap-2 text-left px-2 py-1 rounded-lg hover:bg-white/[0.04] transition-colors"
                    >
                      <span
                        className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border shrink-0 transition-colors ${
                          sub.isCompleted
                            ? "bg-amber-400 border-amber-400 text-black"
                            : "border-zinc-600"
                        }`}
                      >
                        {sub.isCompleted && <Check size={10} strokeWidth={3} />}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-amber-300 shrink-0 min-w-[24px]">
                        {formatSubtaskMarker(idx, appt.subtaskStyle)}
                      </span>
                      <span
                        className={`text-xs flex-1 ${
                          sub.isCompleted
                            ? "line-through text-zinc-500"
                            : "text-zinc-200"
                        }`}
                      >
                        {sub.label}
                      </span>
                      {sub.timeWindow && (
                        <span className="px-1.5 py-0.5 rounded bg-white/[0.06] text-[9.5px] font-mono text-sky-300 shrink-0">
                          {sub.timeWindow}
                        </span>
                      )}
                    </button>
                  ))}

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const text = (newApptSubtaskInputs[appt.id] || "").trim();
                      if (!text) return;
                      const nextSubs: NestedSubtaskItem[] = [
                        ...appt.subtasks,
                        {
                          id: `sub-${Date.now()}`,
                          label: text,
                          isCompleted: false,
                        },
                      ];
                      onUpdateAppointment(appt.id, { subtasks: nextSubs });
                      setNewApptSubtaskInputs((p) => ({ ...p, [appt.id]: "" }));
                    }}
                    className="flex items-center gap-1.5 pt-1"
                  >
                    <input
                      type="text"
                      value={newApptSubtaskInputs[appt.id] || ""}
                      onChange={(e) =>
                        setNewApptSubtaskInputs((p) => ({
                          ...p,
                          [appt.id]: e.target.value,
                        }))
                      }
                      placeholder={`+ Add subtask (${
                        appt.subtaskStyle === "roman" ? "I, II, III..." : "•"
                      })`}
                      className="flex-1 bg-black/35 border border-white/10 rounded-lg px-2.5 py-1 text-[11px] text-white placeholder:text-zinc-500"
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-[10.5px] font-semibold text-zinc-200"
                    >
                      Add
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
