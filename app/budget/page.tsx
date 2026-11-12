"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Briefcase,
  CalendarDays,
  Check,
  Coins,
  DollarSign,
  PiggyBank,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { ExecutiveModuleShell } from "@/components/chairman/ExecutiveModuleShell";
import {
  BudgetEntryDTO,
  ConnectedMonthRollupDTO,
  WorkShiftConfigDTO,
} from "@/lib/circadianTypes";

function fmtUSD(val: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(val || 0);
}

function fmtUSDExact(val: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: val % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(val || 0);
}

export default function ConnectedBudgetPage() {
  const [selectedYear, setSelectedYear] = useState<number>(() =>
    new Date().getFullYear()
  );
  const [selectedMonth, setSelectedMonth] = useState<number>(
    () => new Date().getMonth() + 1
  );
  const [hoveredChartMonth, setHoveredChartMonth] = useState<number | null>(
    null
  );

  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [months, setMonths] = useState<ConnectedMonthRollupDTO[]>([]);
  const [entries, setEntries] = useState<BudgetEntryDTO[]>([]);
  const [shiftConfig, setShiftConfig] = useState<WorkShiftConfigDTO>({
    roleLabel: "Primary Operations & Engineering Shift",
    payPerShift: 320,
    hourlyRate: 40,
    hoursPerShift: 8,
    totalScheduledDays: 22,
    shiftsPerWeek: 5,
  });
  const [annualTotals, setAnnualTotals] = useState({
    anticipatedIncome: 0,
    actualIncome: 0,
    incomeVariance: 0,
    totalSpend: 0,
    annualExpenseCap: 0,
    totalSavings: 0,
    annualSavingsTarget: 0,
    netCashFlow: 0,
    totalShiftIncome: 0,
    totalAppointmentIncome: 0,
    totalCalendarSpend: 0,
    totalWorkedDays: 0,
    totalAppointments: 0,
  });

  // Target editor state for selectedMonth
  const [targetIncome, setTargetIncome] = useState<string>("8600");
  const [targetExpenseCap, setTargetExpenseCap] = useState<string>("4200");
  const [targetSavings, setTargetSavings] = useState<string>("2500");
  const [targetNotes, setTargetNotes] = useState<string>("");
  const [savedToast, setSavedToast] = useState<string | null>(null);

  // Add Entry form state
  const [entryType, setEntryType] = useState<"income" | "expense" | "savings">(
    "expense"
  );
  const [entryCategory, setEntryCategory] = useState<string>("Operations");
  const [entryLabel, setEntryLabel] = useState<string>("");
  const [entryPlanned, setEntryPlanned] = useState<string>("");
  const [entryActual, setEntryActual] = useState<string>("");
  const [ledgerFilter, setLedgerFilter] = useState<
    "all" | "income" | "expense" | "savings"
  >("all");
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editPlannedVal, setEditPlannedVal] = useState<string>("");
  const [editActualVal, setEditActualVal] = useState<string>("");

  const applyBudgetPayload = useCallback((data: any) => {
    if (Array.isArray(data.months)) setMonths(data.months);
    if (Array.isArray(data.entries)) setEntries(data.entries);
    if (data.shiftConfig) setShiftConfig(data.shiftConfig);
    if (data.annualTotals) setAnnualTotals(data.annualTotals);
  }, []);

  const fetchBudgetYear = useCallback(
    async (yr: number, isManualSync = false) => {
      if (isManualSync) setSyncing(true);
      else setLoading(true);
      try {
        const res = await fetch(`/api/budget?year=${yr}`);
        if (res.ok) {
          const data = await res.json();
          applyBudgetPayload(data);
          if (isManualSync) {
            setSavedToast(
              "Synchronized live Shift × Pay & Year Appointments from Calendar."
            );
            setTimeout(() => setSavedToast(null), 3500);
          }
        }
      } catch (err) {
        console.error("Failed to fetch connected budget:", err);
      } finally {
        setLoading(false);
        setSyncing(false);
      }
    },
    [applyBudgetPayload]
  );

  useEffect(() => {
    fetchBudgetYear(selectedYear);
  }, [selectedYear, fetchBudgetYear]);

  const activeMonthRollup = useMemo(
    () => months.find((m) => m.month === selectedMonth) ?? months[0] ?? null,
    [months, selectedMonth]
  );

  useEffect(() => {
    if (activeMonthRollup) {
      setTargetIncome(String(activeMonthRollup.targets.incomeTarget));
      setTargetExpenseCap(String(activeMonthRollup.targets.expenseCap));
      setTargetSavings(String(activeMonthRollup.targets.savingsTarget));
      setTargetNotes(activeMonthRollup.targets.notes || "");
    }
  }, [activeMonthRollup]);

  const postBudgetAction = async (payload: Record<string, any>) => {
    const res = await fetch("/api/budget", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year: selectedYear, ...payload }),
    });
    if (res.ok) {
      const data = await res.json();
      applyBudgetPayload(data);
      return true;
    }
    return false;
  };

  const handleSaveMonthTargets = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await postBudgetAction({
      action: "update_month_targets",
      month: selectedMonth,
      incomeTarget: Number(targetIncome) || 0,
      expenseCap: Number(targetExpenseCap) || 0,
      savingsTarget: Number(targetSavings) || 0,
      notes: targetNotes,
    });
    if (ok) {
      setSavedToast(
        `Saved ${activeMonthRollup?.monthLabel || ""} budget targets.`
      );
      setTimeout(() => setSavedToast(null), 3000);
    }
  };

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryLabel.trim()) return;
    const planned = Math.max(0, Number(entryPlanned) || 0);
    const actual =
      entryActual.trim() !== ""
        ? Math.max(0, Number(entryActual) || 0)
        : planned;
    await postBudgetAction({
      action: "create_entry",
      month: selectedMonth,
      entryType,
      category: entryCategory.trim() || "Operations",
      label: entryLabel.trim(),
      plannedAmount: planned,
      actualAmount: actual,
      linkedSource: "manual",
    });
    setEntryLabel("");
    setEntryPlanned("");
    setEntryActual("");
  };

  const selectedMonthEntries = useMemo(() => {
    return entries.filter((e) => {
      if (e.budgetMonth !== selectedMonth) return false;
      if (ledgerFilter !== "all" && e.entryType !== ledgerFilter) return false;
      return true;
    });
  }, [entries, selectedMonth, ledgerFilter]);

  // Chart scaling
  const chartMaxVal = useMemo(() => {
    if (months.length === 0) return 12000;
    const highest = Math.max(
      ...months.map((m) =>
        Math.max(
          m.totalAnticipatedIncome,
          m.totalActualIncome,
          m.totalActualSpend,
          1000
        )
      )
    );
    return Math.ceil(highest / 1000) * 1000 + 1000;
  }, [months]);

  const savingsRatePct =
    annualTotals.actualIncome > 0
      ? Math.round((annualTotals.netCashFlow / annualTotals.actualIncome) * 1000) /
        10
      : 0;

  const inspectedChartRollup = useMemo(() => {
    const m = hoveredChartMonth ?? selectedMonth;
    return months.find((x) => x.month === m) ?? activeMonthRollup;
  }, [hoveredChartMonth, selectedMonth, months, activeMonthRollup]);

  return (
    <ExecutiveModuleShell
      moduleId="BUDGET"
      eyebrow="Capital & Cashflow Telemetry"
      title="12-Month Connected Budget & Shift Ledger"
      subtitle="Synchronized annual budget powered by Calendar Work Shifts, Anticipated vs. Actual Appointment Pay & Daily Spend"
      accentColor="#10b981"
      headerActions={
        <>
          {/* Year Stepper */}
          <div className="flex items-center bg-[#12151f] border border-white/10 rounded-xl p-1">
            {[selectedYear - 1, selectedYear, selectedYear + 1].map((yr) => (
              <button
                key={yr}
                type="button"
                onClick={() => setSelectedYear(yr)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-colors ${
                  yr === selectedYear
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {yr}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => fetchBudgetYear(selectedYear, true)}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.07] hover:bg-white/12 border border-white/10 text-xs font-semibold text-zinc-100 transition-all"
          >
            <RefreshCw
              size={13}
              className={syncing ? "animate-spin text-emerald-400" : "text-emerald-400"}
            />
            Sync Calendar Feed
          </button>

          {/* 1-Click Sync Link back to /calendar */}
          <Link
            href="/calendar"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 text-black text-xs font-bold tracking-wider uppercase shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:brightness-110 transition-all"
          >
            <ArrowLeft size={13} strokeWidth={2.5} />
            Solar Calendar & Shifts
          </Link>
        </>
      }
    >
      {savedToast && (
        <div className="px-4 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/45 text-emerald-200 text-xs font-medium flex items-center gap-2">
          <Check size={14} className="text-emerald-400" />
          {savedToast}
        </div>
      )}

      {/* ── 1. ANNUAL TOTALS KPI STRIP ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="rounded-2xl bg-[#12151e]/95 backdrop-blur-xl border border-white/[0.08] p-4 shadow-lg">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            <span>Annual Anticipated Income</span>
            <CalendarDays size={14} className="text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-sky-300 mt-2">
            {fmtUSD(annualTotals.anticipatedIncome)}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">
            Scheduled Shifts + Appt Forecast + MRR
          </div>
        </div>

        <div className="rounded-2xl bg-[#12151e]/95 backdrop-blur-xl border border-white/[0.08] p-4 shadow-lg">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            <span>Annual Actual Income</span>
            <TrendingUp size={14} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-300 mt-2">
            {fmtUSD(annualTotals.actualIncome)}
          </div>
          <div className="text-[11px] font-mono mt-1 flex items-center gap-1.5">
            <span
              className={
                annualTotals.incomeVariance >= 0
                  ? "text-emerald-400"
                  : "text-amber-400"
              }
            >
              {annualTotals.incomeVariance >= 0 ? "+" : ""}
              {fmtUSD(annualTotals.incomeVariance)} vs forecast
            </span>
          </div>
        </div>

        <div className="rounded-2xl bg-[#12151e]/95 backdrop-blur-xl border border-white/[0.08] p-4 shadow-lg">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            <span>Annual Total Spend</span>
            <TrendingDown size={14} className="text-orange-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-orange-300 mt-2">
            {fmtUSD(annualTotals.totalSpend)}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">
            Cap: {fmtUSD(annualTotals.annualExpenseCap)} · Incl.{" "}
            {fmtUSD(annualTotals.totalCalendarSpend)} daily spend
          </div>
        </div>

        <div className="rounded-2xl bg-[#12151e]/95 backdrop-blur-xl border border-white/[0.08] p-4 shadow-lg">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            <span>Annual Net Cash Flow</span>
            <PiggyBank size={14} className="text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300 mt-2">
            {fmtUSD(annualTotals.netCashFlow)}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">
            Net Margin: <span className="text-emerald-300 font-mono">{savingsRatePct}%</span> · Saved {fmtUSD(annualTotals.totalSavings)}
          </div>
        </div>

        <div className="rounded-2xl bg-[#12151e]/95 backdrop-blur-xl border border-white/[0.08] p-4 shadow-lg">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            <span>Calendar Shift & Appt Sync</span>
            <Briefcase size={14} className="text-violet-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">
            {fmtUSD(
              annualTotals.totalShiftIncome + annualTotals.totalAppointmentIncome
            )}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">
            {annualTotals.totalWorkedDays} shift days ·{" "}
            {annualTotals.totalAppointments} appointments
          </div>
        </div>
      </div>

      {/* ── 2. 12-MONTH INTERACTIVE CASHFLOW COMPARISON CHART (JAN - DEC) ──────── */}
      <div className="rounded-2xl bg-[#12151e]/95 backdrop-blur-xl border border-white/[0.08] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.55)] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xs sm:text-sm font-bold tracking-[0.14em] uppercase text-zinc-100">
              12-Month Connected Cashflow Comparison ({selectedYear})
            </h2>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Anticipated Income vs. Actual Income vs. Total Spend & Net Free Cash Flow — click any month bar to inspect its ledger.
            </p>
          </div>

          {/* Live Legend + Hovered Month Readout */}
          <div className="flex flex-wrap items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1.5 text-zinc-300">
              <span className="w-2.5 h-2.5 rounded-sm bg-sky-400" />
              Anticipated
            </span>
            <span className="flex items-center gap-1.5 text-zinc-300">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
              Actual Income
            </span>
            <span className="flex items-center gap-1.5 text-zinc-300">
              <span className="w-2.5 h-2.5 rounded-sm bg-orange-400" />
              Total Spend
            </span>
            <span className="flex items-center gap-1.5 text-zinc-300">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-300" />
              Net Cash Flow
            </span>
          </div>
        </div>

        {/* Hovered / Active Month Telemetry Strip */}
        {inspectedChartRollup && (
          <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-[#181c28] border border-white/[0.07] text-xs">
            <span className="font-bold text-white uppercase tracking-wider">
              {inspectedChartRollup.monthLabel} {selectedYear}
            </span>
            <div className="flex flex-wrap items-center gap-4 font-mono text-[11px]">
              <span className="text-sky-300">
                Anticipated: {fmtUSDExact(inspectedChartRollup.totalAnticipatedIncome)}
              </span>
              <span className="text-emerald-300">
                Actual: {fmtUSDExact(inspectedChartRollup.totalActualIncome)}
              </span>
              <span className="text-orange-300">
                Spend: {fmtUSDExact(inspectedChartRollup.totalActualSpend)}
              </span>
              <span className="text-amber-300 font-bold">
                Net Cash Flow: {fmtUSDExact(inspectedChartRollup.netCashFlow)}
              </span>
            </div>
          </div>
        )}

        {/* Responsive Pure-SVG 12-Month Grouped Bar + Net Cashflow Line Chart */}
        <div className="w-full overflow-x-auto">
          <svg
            viewBox="0 0 1080 270"
            className="w-full min-w-[760px] h-auto select-none"
          >
            {/* Horizontal Y-Axis Gridlines */}
            {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
              const y = 225 - frac * 190;
              const labelVal = Math.round(chartMaxVal * frac);
              return (
                <g key={frac}>
                  <line
                    x1="58"
                    y1={y}
                    x2="1060"
                    y2={y}
                    stroke="rgba(255,255,255,0.07)"
                    strokeDasharray={frac === 0 ? undefined : "3 4"}
                  />
                  <text
                    x="50"
                    y={y + 4}
                    textAnchor="end"
                    fill="rgba(161,161,170,0.85)"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    ${Math.round(labelVal / 1000)}k
                  </text>
                </g>
              );
            })}

            {/* 12 Month Grouped Bars */}
            {months.map((m, idx) => {
              const groupX = 72 + idx * 82;
              const isSelected = m.month === selectedMonth;
              const hAnt = Math.max(
                3,
                (m.totalAnticipatedIncome / chartMaxVal) * 190
              );
              const hAct = Math.max(
                3,
                (m.totalActualIncome / chartMaxVal) * 190
              );
              const hSpd = Math.max(
                3,
                (m.totalActualSpend / chartMaxVal) * 190
              );

              return (
                <g
                  key={m.month}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredChartMonth(m.month)}
                  onMouseLeave={() => setHoveredChartMonth(null)}
                  onClick={() => setSelectedMonth(m.month)}
                >
                  {/* Selection Highlight Column */}
                  <rect
                    x={groupX - 8}
                    y={24}
                    width={68}
                    height={206}
                    rx={8}
                    fill={
                      isSelected
                        ? "rgba(16, 185, 129, 0.10)"
                        : "rgba(255, 255, 255, 0.01)"
                    }
                    stroke={
                      isSelected ? "rgba(16, 185, 129, 0.45)" : "transparent"
                    }
                  />

                  {/* Bar 1: Anticipated Income */}
                  <rect
                    x={groupX}
                    y={225 - hAnt}
                    width={14}
                    height={hAnt}
                    rx={3}
                    fill="#38bdf8"
                    opacity="0.82"
                  />

                  {/* Bar 2: Actual Income */}
                  <rect
                    x={groupX + 18}
                    y={225 - hAct}
                    width={14}
                    height={hAct}
                    rx={3}
                    fill="#10b981"
                  />

                  {/* Bar 3: Total Spend */}
                  <rect
                    x={groupX + 36}
                    y={225 - hSpd}
                    width={14}
                    height={hSpd}
                    rx={3}
                    fill="#f97316"
                    opacity="0.9"
                  />

                  {/* Month Label */}
                  <text
                    x={groupX + 25}
                    y={248}
                    textAnchor="middle"
                    fill={isSelected ? "#34d399" : "#d4d4d8"}
                    fontSize="11"
                    fontWeight={isSelected ? 700 : 500}
                  >
                    {m.monthShort}
                  </text>
                </g>
              );
            })}

            {/* Net Free Cash Flow Polyline Overlay */}
            {months.length === 12 && (
              <g className="pointer-events-none">
                <polyline
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="2.4"
                  points={months
                    .map((m, idx) => {
                      const cx = 72 + idx * 82 + 25;
                      const cy =
                        225 -
                        Math.max(
                          0,
                          Math.min(190, (m.netCashFlow / chartMaxVal) * 190)
                        );
                      return `${cx},${cy}`;
                    })
                    .join(" ")}
                />
                {months.map((m, idx) => {
                  const cx = 72 + idx * 82 + 25;
                  const cy =
                    225 -
                    Math.max(
                      0,
                      Math.min(190, (m.netCashFlow / chartMaxVal) * 190)
                    );
                  return (
                    <circle
                      key={`ncf-${m.month}`}
                      cx={cx}
                      cy={cy}
                      r={m.month === selectedMonth ? 5 : 3.5}
                      fill="#fef08a"
                      stroke="#d97706"
                      strokeWidth="1.6"
                    />
                  );
                })}
              </g>
            )}
          </svg>
        </div>

        {/* 12-Month Selector Matrix Pills */}
        <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-12 gap-2 pt-2 border-t border-white/[0.06]">
          {months.map((m) => {
            const active = m.month === selectedMonth;
            return (
              <button
                key={`sel-${m.month}`}
                type="button"
                onClick={() => setSelectedMonth(m.month)}
                className={`rounded-xl p-2.5 text-left border transition-all ${
                  active
                    ? "bg-emerald-500/15 border-emerald-400 text-white shadow-[0_0_16px_rgba(16,185,129,0.22)]"
                    : "bg-[#181c28] border-white/[0.06] hover:border-white/20 text-zinc-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase">
                    {m.monthShort}
                  </span>
                  <span className="text-[9px] font-mono text-zinc-400">
                    {m.workedDays}d
                  </span>
                </div>
                <div className="text-[10px] font-mono font-bold text-emerald-400 mt-1 truncate">
                  {fmtUSD(m.netCashFlow)}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 3. SELECTED MONTH CONNECTED CALENDAR FEED + MONTHLY TARGETS EDITOR ── */}
      {activeMonthRollup && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          {/* Connected Calendar Telemetry Card (7 cols) */}
          <div className="xl:col-span-7 rounded-2xl bg-[#12151e]/95 backdrop-blur-xl border border-white/[0.08] p-5 shadow-lg space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold tracking-[0.14em] uppercase text-emerald-300">
                  {activeMonthRollup.monthLabel} {selectedYear} · Connected Calendar Feed
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Auto-aggregated from Calendar Work Shifts (`shifts ×{" "}
                  {fmtUSDExact(shiftConfig.payPerShift)}`) & Year Appointments.
                </p>
              </div>

              <Link
                href="/calendar"
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/[0.07] hover:bg-white/12 border border-white/10 text-[11px] font-semibold text-sky-300 transition-colors"
              >
                Edit Shifts & Appts in Calendar
                <ArrowUpRight size={12} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Work Shifts Feed */}
              <div className="rounded-xl bg-[#181c28] border border-white/[0.07] p-3.5 space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-sky-300 flex items-center justify-between">
                  <span>Work Shift Pay</span>
                  <Briefcase size={12} />
                </div>
                <div className="text-lg font-bold font-mono text-white">
                  {fmtUSDExact(activeMonthRollup.shiftActualPay)}
                </div>
                <div className="text-[10.5px] font-mono text-zinc-400">
                  {activeMonthRollup.workedShifts} shifts /{" "}
                  {activeMonthRollup.scheduledDays} sched (
                  {fmtUSDExact(activeMonthRollup.shiftAnticipatedPay)})
                </div>
                <div className="text-[10px] font-mono text-orange-300">
                  Shift Daily Spend: -{fmtUSDExact(activeMonthRollup.shiftDailyExpenses)}
                </div>
              </div>

              {/* Appointments Feed */}
              <div className="rounded-xl bg-[#181c28] border border-white/[0.07] p-3.5 space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-violet-300 flex items-center justify-between">
                  <span>Appointment Pay</span>
                  <DollarSign size={12} />
                </div>
                <div className="text-lg font-bold font-mono text-emerald-300">
                  {fmtUSDExact(activeMonthRollup.apptActualPay)}
                </div>
                <div className="text-[10.5px] font-mono text-zinc-400">
                  Anticipated: {fmtUSDExact(activeMonthRollup.apptAnticipatedPay)} (
                  {activeMonthRollup.appointmentCount} appts)
                </div>
                <div className="text-[10px] font-mono text-orange-300">
                  Appt Money Used: -{fmtUSDExact(activeMonthRollup.apptDailyMoneyUsed)}
                </div>
              </div>

              {/* Combined Month Net Summary */}
              <div className="rounded-xl bg-[#181c28] border border-emerald-400/25 p-3.5 space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 flex items-center justify-between">
                  <span>Connected Net Cashflow</span>
                  <Wallet size={12} />
                </div>
                <div className="text-lg font-bold font-mono text-amber-300">
                  {fmtUSDExact(activeMonthRollup.netCashFlow)}
                </div>
                <div className="text-[10.5px] font-mono text-zinc-300">
                  In: {fmtUSDExact(activeMonthRollup.totalActualIncome)} · Out:{" "}
                  {fmtUSDExact(activeMonthRollup.totalActualSpend)}
                </div>
                <div className="text-[10px] font-mono text-emerald-400">
                  After {fmtUSDExact(activeMonthRollup.totalSavings)} Savings:{" "}
                  {fmtUSDExact(activeMonthRollup.freeCashFlowAfterSavings)}
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Targets Editor (5 cols) */}
          <form
            onSubmit={handleSaveMonthTargets}
            className="xl:col-span-5 rounded-2xl bg-[#12151e]/95 backdrop-blur-xl border border-white/[0.08] p-5 shadow-lg space-y-3.5"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold tracking-[0.14em] uppercase text-zinc-100">
                {activeMonthRollup.monthLabel} Targets & Guardrails
              </h3>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-[11px] font-bold uppercase tracking-wider transition-colors"
              >
                <Save size={12} />
                Save Targets
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[9.5px] uppercase text-sky-300 mb-1">
                  Income Target ($)
                </label>
                <input
                  type="number"
                  value={targetIncome}
                  onChange={(e) => setTargetIncome(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
                />
              </div>
              <div>
                <label className="block text-[9.5px] uppercase text-orange-300 mb-1">
                  Expense Cap ($)
                </label>
                <input
                  type="number"
                  value={targetExpenseCap}
                  onChange={(e) => setTargetExpenseCap(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
                />
              </div>
              <div>
                <label className="block text-[9.5px] uppercase text-emerald-300 mb-1">
                  Savings Target ($)
                </label>
                <input
                  type="number"
                  value={targetSavings}
                  onChange={(e) => setTargetSavings(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9.5px] uppercase text-zinc-400 mb-1">
                Executive Treasury Notes
              </label>
              <input
                type="text"
                value={targetNotes}
                onChange={(e) => setTargetNotes(e.target.value)}
                placeholder="Monthly allocation notes..."
                className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200"
              />
            </div>
          </form>
        </div>
      )}

      {/* ── 4. DETAILED MONTHLY LINE-ITEM LEDGER EDITOR ──────────────────────── */}
      <div className="rounded-2xl bg-[#12151e]/95 backdrop-blur-xl border border-white/[0.08] p-5 shadow-lg space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xs sm:text-sm font-bold tracking-[0.14em] uppercase text-zinc-100">
              {activeMonthRollup?.monthLabel} Detailed Budget Ledger
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Track planned vs. actual recurring income, operating expenses, and automated savings allocations.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-[#181c28] p-1 rounded-xl border border-white/[0.07]">
            {(["all", "income", "expense", "savings"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setLedgerFilter(tab)}
                className={`px-3 py-1 rounded-lg text-[11px] font-semibold uppercase transition-colors ${
                  ledgerFilter === tab
                    ? "bg-white/15 text-white"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Add Line Item Form */}
        <form
          onSubmit={handleAddEntry}
          className="grid grid-cols-1 sm:grid-cols-6 gap-2.5 p-3.5 rounded-xl bg-[#181c28] border border-white/[0.07] items-end"
        >
          <div>
            <label className="block text-[9.5px] uppercase text-zinc-400 mb-1">
              Type
            </label>
            <select
              value={entryType}
              onChange={(e) =>
                setEntryType(e.target.value as "income" | "expense" | "savings")
              }
              className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
              <option value="savings">Savings</option>
            </select>
          </div>

          <div>
            <label className="block text-[9.5px] uppercase text-zinc-400 mb-1">
              Category
            </label>
            <input
              type="text"
              value={entryCategory}
              onChange={(e) => setEntryCategory(e.target.value)}
              placeholder="e.g. Cloud / Housing"
              className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[9.5px] uppercase text-zinc-400 mb-1">
              Line Item Description
            </label>
            <input
              type="text"
              required
              value={entryLabel}
              onChange={(e) => setEntryLabel(e.target.value)}
              placeholder="e.g. Retainer Bonus / Equipment / ETF Sweep"
              className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-[9.5px] uppercase text-zinc-400 mb-1">
              Planned / Actual ($)
            </label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.01"
                required
                value={entryPlanned}
                onChange={(e) => setEntryPlanned(e.target.value)}
                placeholder="Plan"
                className="w-1/2 bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs font-mono text-white"
              />
              <input
                type="number"
                step="0.01"
                value={entryActual}
                onChange={(e) => setEntryActual(e.target.value)}
                placeholder="Actual"
                className="w-1/2 bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs font-mono text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            className="flex items-center justify-center gap-1 py-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold uppercase tracking-wider"
          >
            <Plus size={13} strokeWidth={2.5} />
            Add Item
          </button>
        </form>

        {/* Line Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3 text-right">Planned</th>
                <th className="py-2.5 px-3 text-right">Actual</th>
                <th className="py-2.5 px-3 text-right">Variance</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05] text-xs">
              {/* Auto-Synced Calendar Summary Rows */}
              {activeMonthRollup && ledgerFilter !== "savings" && (
                <>
                  {(ledgerFilter === "all" || ledgerFilter === "income") && (
                    <tr className="bg-sky-500/[0.05]">
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase bg-emerald-500/20 text-emerald-300">
                          income
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-sky-300">
                        Calendar Shifts
                      </td>
                      <td className="py-2.5 px-3 font-medium text-zinc-100">
                        Work Shifts ({activeMonthRollup.workedShifts} ×{" "}
                        {fmtUSDExact(shiftConfig.payPerShift)}/shift) — Synced
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-zinc-300">
                        {fmtUSDExact(activeMonthRollup.shiftAnticipatedPay)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-300">
                        {fmtUSDExact(activeMonthRollup.shiftActualPay)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-zinc-400">
                        {fmtUSDExact(
                          activeMonthRollup.shiftActualPay -
                            activeMonthRollup.shiftAnticipatedPay
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <Link
                          href="/calendar"
                          className="text-[10px] text-sky-300 hover:underline"
                        >
                          Calendar →
                        </Link>
                      </td>
                    </tr>
                  )}

                  {(ledgerFilter === "all" || ledgerFilter === "income") &&
                    (activeMonthRollup.apptAnticipatedPay > 0 ||
                      activeMonthRollup.apptActualPay > 0) && (
                      <tr className="bg-violet-500/[0.05]">
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase bg-emerald-500/20 text-emerald-300">
                            income
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-violet-300">
                          Appointments
                        </td>
                        <td className="py-2.5 px-3 font-medium text-zinc-100">
                          Calendar Appointments ({activeMonthRollup.appointmentCount}) — Anticipated vs. Actual
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-zinc-300">
                          {fmtUSDExact(activeMonthRollup.apptAnticipatedPay)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-300">
                          {fmtUSDExact(activeMonthRollup.apptActualPay)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-400">
                          {activeMonthRollup.apptActualPay -
                            activeMonthRollup.apptAnticipatedPay >=
                          0
                            ? "+"
                            : ""}
                          {fmtUSDExact(
                            activeMonthRollup.apptActualPay -
                              activeMonthRollup.apptAnticipatedPay
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Link
                            href="/calendar"
                            className="text-[10px] text-sky-300 hover:underline"
                          >
                            Calendar →
                          </Link>
                        </td>
                      </tr>
                    )}

                  {(ledgerFilter === "all" || ledgerFilter === "expense") &&
                    activeMonthRollup.shiftDailyExpenses +
                      activeMonthRollup.apptDailyMoneyUsed >
                      0 && (
                      <tr className="bg-orange-500/[0.05]">
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase bg-orange-500/20 text-orange-300">
                            expense
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-orange-300">
                          Daily Money Used
                        </td>
                        <td className="py-2.5 px-3 font-medium text-zinc-100">
                          Calendar Daily Spend (Shifts + Appointments)
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-zinc-300">
                          {fmtUSDExact(
                            activeMonthRollup.shiftDailyExpenses +
                              activeMonthRollup.apptDailyMoneyUsed
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-orange-300">
                          {fmtUSDExact(
                            activeMonthRollup.shiftDailyExpenses +
                              activeMonthRollup.apptDailyMoneyUsed
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-zinc-400">
                          $0
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Link
                            href="/calendar"
                            className="text-[10px] text-sky-300 hover:underline"
                          >
                            Calendar →
                          </Link>
                        </td>
                      </tr>
                    )}
                </>
              )}

              {/* Custom & Recurring Budget Entries */}
              {selectedMonthEntries.map((item) => {
                const isEditing = editingEntryId === item.id;
                const diff = item.actualAmount - item.plannedAmount;
                const badgeStyle =
                  item.entryType === "income"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : item.entryType === "savings"
                    ? "bg-amber-500/20 text-amber-300"
                    : "bg-rose-500/20 text-rose-300";

                return (
                  <tr key={item.id} className="hover:bg-white/[0.03]">
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase ${badgeStyle}`}
                      >
                        {item.entryType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-zinc-300">
                      {item.category}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-zinc-100">
                      {item.label}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-zinc-300">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editPlannedVal}
                          onChange={(e) => setEditPlannedVal(e.target.value)}
                          className="w-24 bg-black/60 border border-white/20 rounded px-2 py-0.5 text-right text-xs text-white"
                        />
                      ) : (
                        fmtUSDExact(item.plannedAmount)
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editActualVal}
                          onChange={(e) => setEditActualVal(e.target.value)}
                          className="w-24 bg-black/60 border border-emerald-400/40 rounded px-2 py-0.5 text-right text-xs text-white"
                        />
                      ) : (
                        fmtUSDExact(item.actualAmount)
                      )}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-mono ${
                        diff === 0
                          ? "text-zinc-500"
                          : item.entryType === "expense"
                          ? diff > 0
                            ? "text-rose-400"
                            : "text-emerald-400"
                          : diff >= 0
                          ? "text-emerald-400"
                          : "text-amber-400"
                      }`}
                    >
                      {diff > 0 ? "+" : ""}
                      {fmtUSDExact(diff)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {isEditing ? (
                          <button
                            type="button"
                            onClick={async () => {
                              await postBudgetAction({
                                action: "update_entry",
                                id: item.id,
                                plannedAmount: Number(editPlannedVal) || 0,
                                actualAmount: Number(editActualVal) || 0,
                              });
                              setEditingEntryId(null);
                            }}
                            className="px-2 py-0.5 rounded bg-emerald-500 text-black text-[10px] font-bold"
                          >
                            Save
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingEntryId(item.id);
                              setEditPlannedVal(String(item.plannedAmount));
                              setEditActualVal(String(item.actualAmount));
                            }}
                            className="px-2 py-0.5 rounded bg-white/[0.06] hover:bg-white/12 text-[10px] text-zinc-300"
                          >
                            Edit $
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            postBudgetAction({
                              action: "delete_entry",
                              id: item.id,
                            })
                          }
                          className="p-1 rounded text-zinc-500 hover:text-red-400"
                          title="Delete Entry"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {loading && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-zinc-500">
                    Loading 12-month connected ledger...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ExecutiveModuleShell>
  );
}
