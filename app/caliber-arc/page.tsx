"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Lock,
  Plus,
  Radio,
  RefreshCw,
  ShieldAlert,
  Sliders,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  Unlock,
} from "lucide-react";
import { ExecutiveModuleShell } from "@/components/chairman/ExecutiveModuleShell";

interface TradingSession {
  id: string;
  session_date: string;
  account_name: string;
  starting_balance: number;
  ending_balance: number | null;
  daily_net_pnl: number;
  max_drawdown_limit: number;
  session_loss_cutoff: number;
  circuit_breaker_tripped: boolean;
  copier_status: string;
}

interface TradeRecord {
  id: string;
  session_id: string;
  instrument: "MNQ" | "NQ" | "MES" | "ES";
  direction: "LONG" | "SHORT";
  contracts: number;
  entry_price: number;
  exit_price: number;
  stop_loss_ticks: number;
  take_profit_ticks: number;
  entry_time: string;
  exit_time: string;
  gross_pnl: number;
  commissions: number;
  net_pnl: number;
  setup_name: string;
  market_add_at_entry: number | null;
  cvd_direction: string;
  leader_alignment: string;
  notes: string | null;
}

const POINT_MULTIPLIERS: Record<string, number> = {
  MNQ: 2,
  NQ: 20,
  MES: 5,
  ES: 50,
};

const PLAYBOOK_SETUPS = [
  "Opening Drive",
  "VWAP Reclaim",
  "Retest Short",
  "Breakdown Flush",
];

const CVD_OPTIONS = ["Bullish", "Bearish", "Bull Div", "Bear Div", "Absorption"];
const MICRO_BUFFER_THRESHOLD = 400;

function formatUsd(val: number, forceSign = false): string {
  const abs = Math.abs(val).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (val < 0) return `-$${abs}`;
  if (forceSign && val > 0) return `+$${abs}`;
  return `$${abs}`;
}

export default function CaliberArcPage() {
  const [sessions, setSessions] = useState<TradingSession[]>([]);
  const [allTrades, setAllTrades] = useState<TradeRecord[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [mutating, setMutating] = useState<boolean>(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [analyticsScope, setAnalyticsScope] = useState<"session" | "all">("session");
  const [riskDrawerOpen, setRiskDrawerOpen] = useState<boolean>(false);

  // Risk edit inputs
  const [riskForm, setRiskForm] = useState({
    startingBalance: "50000",
    maxDrawdownLimit: "2000",
    sessionLossCutoff: "250",
    copierStatus: "Replikanto Synced",
  });

  // Trade logger form state
  const [instrument, setInstrument] = useState<"MNQ" | "NQ" | "MES" | "ES">("MNQ");
  const [direction, setDirection] = useState<"LONG" | "SHORT">("LONG");
  const [contracts, setContracts] = useState<string>("2");
  const [entryPrice, setEntryPrice] = useState<string>("20425.00");
  const [exitPrice, setExitPrice] = useState<string>("20445.50");
  const [stopLossTicks, setStopLossTicks] = useState<string>("200");
  const [commissions, setCommissions] = useState<string>("3.60");
  const [setupName, setSetupName] = useState<string>("VWAP Reclaim");
  const [marketAdd, setMarketAdd] = useState<string>("640");
  const [cvdDirection, setCvdDirection] = useState<string>("Bullish");
  const [nvdaDir, setNvdaDir] = useState<"▲" | "▬" | "▼">("▲");
  const [aaplDir, setAaplDir] = useState<"▲" | "▬" | "▼">("▲");
  const [msftDir, setMsftDir] = useState<"▲" | "▬" | "▼">("▲");
  const [notes, setNotes] = useState<string>("");

  const fetchTradingData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/trading", { cache: "no-store" });
      const data = await res.json();
      const loadedSessions: TradingSession[] = Array.isArray(data.sessions)
        ? data.sessions
        : [];
      setSessions(loadedSessions);
      setAllTrades(Array.isArray(data.trades) ? data.trades : []);
      if (loadedSessions.length > 0) {
        setActiveSessionId((prev) =>
          loadedSessions.some((s) => s.id === prev) ? prev : loadedSessions[0].id
        );
      }
    } catch (err) {
      console.error("Failed to load Caliber Arc data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTradingData();
  }, [fetchTradingData]);

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeSessionId) || sessions[0] || null,
    [sessions, activeSessionId]
  );

  useEffect(() => {
    if (activeSession) {
      setRiskForm({
        startingBalance: String(activeSession.starting_balance),
        maxDrawdownLimit: String(activeSession.max_drawdown_limit),
        sessionLossCutoff: String(activeSession.session_loss_cutoff),
        copierStatus: activeSession.copier_status || "Replikanto Synced",
      });
    }
  }, [activeSession]);

  const sessionTrades = useMemo(
    () =>
      activeSession
        ? allTrades.filter((t) => t.session_id === activeSession.id)
        : [],
    [allTrades, activeSession]
  );

  // Capital Preservation & Circuit Breaker Calculations
  const riskTelemetry = useMemo(() => {
    const startingBalance = Number(activeSession?.starting_balance ?? 50000);
    const dailyNetPnl = Number(activeSession?.daily_net_pnl ?? 0);
    const currentBalance = Number(
      activeSession?.ending_balance ?? startingBalance + dailyNetPnl
    );
    const maxDrawdownLimit = Number(activeSession?.max_drawdown_limit ?? 2000);
    const sessionLossCutoff = Math.abs(
      Number(activeSession?.session_loss_cutoff ?? 250)
    );
    const liquidationFloor = startingBalance - maxDrawdownLimit;
    const remainingBuffer = currentBalance - liquidationFloor;
    const microOnlyLocked = remainingBuffer < MICRO_BUFFER_THRESHOLD;
    const circuitBreakerTripped =
      dailyNetPnl <= -sessionLossCutoff ||
      Boolean(activeSession?.circuit_breaker_tripped);

    return {
      startingBalance,
      currentBalance,
      dailyNetPnl,
      maxDrawdownLimit,
      sessionLossCutoff,
      liquidationFloor,
      remainingBuffer,
      microOnlyLocked,
      circuitBreakerTripped,
    };
  }, [activeSession]);

  // Auto-downgrade NQ/ES to MNQ/MES if Micro-Only Lock activates
  useEffect(() => {
    if (riskTelemetry.microOnlyLocked) {
      if (instrument === "NQ") setInstrument("MNQ");
      if (instrument === "ES") setInstrument("MES");
    }
  }, [riskTelemetry.microOnlyLocked, instrument]);

  // Live trade preview PnL
  const previewPnl = useMemo(() => {
    const qty = Math.max(1, Math.round(Number(contracts || 1)));
    const ep = Number(entryPrice || 0);
    const xp = Number(exitPrice || 0);
    const comm = Math.max(0, Number(commissions || 0));
    const mult = POINT_MULTIPLIERS[instrument] || 2;
    const pts = direction === "SHORT" ? ep - xp : xp - ep;
    const gross = pts * mult * qty;
    const net = gross - comm;
    return {
      pts,
      ticks: Math.round(pts * 4),
      gross,
      net,
    };
  }, [instrument, direction, contracts, entryPrice, exitPrice, commissions]);

  // Intraday Equity Curve SVG coordinates
  const equityCurve = useMemo(() => {
    const startBal = riskTelemetry.startingBalance;
    const points: { idx: number; bal: number; label: string; delta: number }[] = [
      { idx: 0, bal: startBal, label: "Session Open", delta: 0 },
    ];
    let running = startBal;
    sessionTrades.forEach((tr, i) => {
      running = Number((running + Number(tr.net_pnl || 0)).toFixed(2));
      points.push({
        idx: i + 1,
        bal: running,
        label: `${tr.instrument} ${tr.direction}`,
        delta: Number(tr.net_pnl || 0),
      });
    });

    const floorLine = startBal - riskTelemetry.sessionLossCutoff;
    const vals = points.map((p) => p.bal).concat([startBal, floorLine]);
    const minVal = Math.min(...vals) - 60;
    const maxVal = Math.max(...vals) + 60;
    const span = Math.max(100, maxVal - minVal);

    const w = 680;
    const h = 195;
    const padX = 44;
    const padY = 22;
    const usableW = w - padX * 2;
    const usableH = h - padY * 2;

    const toX = (i: number) =>
      points.length === 1
        ? padX + usableW / 2
        : padX + (i / (points.length - 1)) * usableW;
    const toY = (v: number) => padY + usableH - ((v - minVal) / span) * usableH;

    const pathD = points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)} ${toY(p.bal).toFixed(1)}`)
      .join(" ");

    const areaD =
      points.length > 1
        ? `${pathD} L ${toX(points.length - 1).toFixed(1)} ${(padY + usableH).toFixed(
            1
          )} L ${toX(0).toFixed(1)} ${(padY + usableH).toFixed(1)} Z`
        : "";

    return {
      points,
      pathD,
      areaD,
      toX,
      toY,
      startY: toY(startBal),
      cutoffY: toY(floorLine),
      w,
      h,
    };
  }, [sessionTrades, riskTelemetry.startingBalance, riskTelemetry.sessionLossCutoff]);

  // Strategy Playbook Analytics
  const playbookStats = useMemo(() => {
    const source = analyticsScope === "session" ? sessionTrades : allTrades;
    const buckets: Record<
      string,
      {
        setup: string;
        trades: number;
        wins: number;
        losses: number;
        grossWin: number;
        grossLossAbs: number;
        netPnl: number;
      }
    > = {};

    for (const s of PLAYBOOK_SETUPS) {
      buckets[s] = {
        setup: s,
        trades: 0,
        wins: 0,
        losses: 0,
        grossWin: 0,
        grossLossAbs: 0,
        netPnl: 0,
      };
    }

    for (const tr of source) {
      const key = tr.setup_name || "Unclassified";
      if (!buckets[key]) {
        buckets[key] = {
          setup: key,
          trades: 0,
          wins: 0,
          losses: 0,
          grossWin: 0,
          grossLossAbs: 0,
          netPnl: 0,
        };
      }
      const net = Number(tr.net_pnl || 0);
      buckets[key].trades += 1;
      buckets[key].netPnl += net;
      if (net > 0) {
        buckets[key].wins += 1;
        buckets[key].grossWin += net;
      } else if (net < 0) {
        buckets[key].losses += 1;
        buckets[key].grossLossAbs += Math.abs(net);
      }
    }

    return Object.values(buckets).map((b) => {
      const winRate = b.trades > 0 ? (b.wins / b.trades) * 100 : 0;
      const profitFactor =
        b.grossLossAbs > 0
          ? b.grossWin / b.grossLossAbs
          : b.grossWin > 0
          ? 99.9
          : 0;
      const expectancy = b.trades > 0 ? b.netPnl / b.trades : 0;
      return {
        ...b,
        winRate,
        profitFactor,
        expectancy,
      };
    });
  }, [analyticsScope, sessionTrades, allTrades]);

  const handleLogTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;
    setErrorBanner(null);
    setMutating(true);
    try {
      const leaderAlignment = `NVDA ${nvdaDir} · AAPL ${aaplDir} · MSFT ${msftDir}`;
      const res = await fetch("/api/trading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "log_trade",
          sessionId: activeSession.id,
          instrument,
          direction,
          contracts: Number(contracts || 1),
          entryPrice: Number(entryPrice || 0),
          exitPrice: Number(exitPrice || 0),
          stopLossTicks: Number(stopLossTicks || 200),
          commissions: Number(commissions || 0),
          setupName,
          marketAddAtEntry: marketAdd === "" ? null : Number(marketAdd),
          cvdDirection,
          leaderAlignment,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorBanner(data.error || "Execution rejected by risk guard");
        return;
      }
      if (Array.isArray(data.sessions)) setSessions(data.sessions);
      if (Array.isArray(data.trades)) setAllTrades(data.trades);
      setNotes("");
    } finally {
      setMutating(false);
    }
  };

  const handleUpdateSessionRisk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;
    setMutating(true);
    try {
      const res = await fetch("/api/trading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_session",
          sessionId: activeSession.id,
          startingBalance: Number(riskForm.startingBalance),
          maxDrawdownLimit: Number(riskForm.maxDrawdownLimit),
          sessionLossCutoff: Number(riskForm.sessionLossCutoff),
          copierStatus: riskForm.copierStatus,
        }),
      });
      const data = await res.json();
      if (Array.isArray(data.sessions)) setSessions(data.sessions);
      if (Array.isArray(data.trades)) setAllTrades(data.trades);
      setRiskDrawerOpen(false);
    } finally {
      setMutating(false);
    }
  };

  const handleDeleteTrade = async (tradeId: string) => {
    setMutating(true);
    try {
      const res = await fetch(`/api/trading?tradeId=${encodeURIComponent(tradeId)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (Array.isArray(data.sessions)) setSessions(data.sessions);
      if (Array.isArray(data.trades)) setAllTrades(data.trades);
    } finally {
      setMutating(false);
    }
  };

  const cycleLeader = (cur: "▲" | "▬" | "▼"): "▲" | "▬" | "▼" =>
    cur === "▲" ? "▬" : cur === "▬" ? "▼" : "▲";

  return (
    <ExecutiveModuleShell
      moduleId="CALIBER_ARC"
      eyebrow="Section 10 · Quantitative Execution"
      title="Caliber Arc — Futures Execution & Risk Terminal"
      subtitle="Index futures cockpit (NQ / MNQ / ES / MES), capital preservation circuit breakers, and quantitative playbook ledger."
      accentColor="#06b6d4"
      headerActions={
        <div className="flex flex-wrap items-center gap-2">
          {/* Trade Copier Status Badges */}
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-400/30 text-[10px] font-mono font-bold text-emerald-300 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            NinjaTrader 8
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-400/30 text-[10px] font-mono font-bold text-cyan-300 flex items-center gap-1.5">
            <Radio size={11} />
            Bookmap L2
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-violet-500/15 border border-violet-400/35 text-[10px] font-mono font-bold text-violet-200">
            {activeSession?.copier_status || "Replikanto Synced"}
          </span>
          <button
            onClick={() => setRiskDrawerOpen((p) => !p)}
            className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 transition"
          >
            <Sliders size={13} className="text-cyan-400" />
            Risk Guard
          </button>
          <button
            onClick={fetchTradingData}
            disabled={loading || mutating}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 text-zinc-300 transition"
          >
            <RefreshCw size={13} className={loading || mutating ? "animate-spin text-cyan-400" : ""} />
          </button>
        </div>
      }
    >
      {/* HARD DAILY LOSS CIRCUIT BREAKER BANNER */}
      {riskTelemetry.circuitBreakerTripped && (
        <div className="rounded-2xl border-2 border-rose-500 bg-gradient-to-r from-rose-950/90 via-red-900/75 to-rose-950/90 p-5 shadow-[0_0_40px_rgba(244,63,94,0.35)] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-rose-500/25 border border-rose-400/60 flex items-center justify-center shrink-0">
              <AlertOctagon size={26} className="text-rose-300 animate-pulse" />
            </div>
            <div>
              <div className="text-xs md:text-sm font-black tracking-[0.2em] uppercase text-rose-200">
                SESSION TERMINATED — CIRCUIT BREAKER ACTIVE
              </div>
              <p className="text-xs text-rose-100/85 mt-1">
                Daily Net PnL ({formatUsd(riskTelemetry.dailyNetPnl, true)}) breached Hard Daily Loss Cutoff (-
                {formatUsd(riskTelemetry.sessionLossCutoff)}). Flatten all NinjaTrader / Replikanto DOM queues and step away from terminal.
              </p>
            </div>
          </div>
          <div className="font-mono text-right">
            <div className="text-[10px] uppercase tracking-wider text-rose-300">Kill-Switch State</div>
            <div className="text-lg font-black text-white">LOCKED · HALTED</div>
          </div>
        </div>
      )}

      {errorBanner && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-200 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertTriangle size={15} className="text-amber-400 shrink-0" />
            {errorBanner}
          </span>
          <button onClick={() => setErrorBanner(null)} className="text-zinc-400 hover:text-white">
            ×
          </button>
        </div>
      )}

      {/* Account Session Selector Bar */}
      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {sessions.map((s) => {
            const isSelected = s.id === activeSession?.id;
            const net = Number(s.daily_net_pnl || 0);
            return (
              <button
                key={s.id}
                onClick={() => setActiveSessionId(s.id)}
                className={`px-4 py-2.5 rounded-xl text-left transition-all border ${
                  isSelected
                    ? "bg-cyan-500/15 border-cyan-400/50 shadow-[0_0_24px_rgba(6,182,212,0.18)]"
                    : "bg-black/30 border-white/10 hover:bg-white/[0.05]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">{s.account_name}</span>
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      net >= 0
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-rose-500/15 text-rose-300"
                    }`}
                  >
                    {formatUsd(net, true)}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                  Bal: {formatUsd(Number(s.ending_balance ?? s.starting_balance))}
                </div>
              </button>
            );
          })}
        </div>

        {/* Order Sizing Authorization Badge */}
        <div
          className={`px-4 py-2.5 rounded-xl border flex items-center gap-3 ${
            riskTelemetry.microOnlyLocked
              ? "bg-amber-500/15 border-amber-400/50 text-amber-200"
              : "bg-emerald-500/10 border-emerald-400/35 text-emerald-200"
          }`}
        >
          {riskTelemetry.microOnlyLocked ? (
            <Lock size={18} className="text-amber-400 shrink-0" />
          ) : (
            <Unlock size={18} className="text-emerald-400 shrink-0" />
          )}
          <div>
            <div className="text-[9.5px] font-bold uppercase tracking-[0.16em] opacity-80">
              Authorized Contract Sizing
            </div>
            <div className="text-xs font-mono font-bold">
              {riskTelemetry.microOnlyLocked
                ? "MICRO CONTRACTS ONLY (MNQ / MES ONLY)"
                : "FULL & MICRO AUTHORIZED (NQ / MNQ / ES / MES)"}
            </div>
          </div>
        </div>
      </section>

      {/* Collapsible Risk Calibration Drawer */}
      {riskDrawerOpen && activeSession && (
        <form
          onSubmit={handleUpdateSessionRisk}
          className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end"
        >
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1">
              Starting Balance ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={riskForm.startingBalance}
              onChange={(e) => setRiskForm({ ...riskForm, startingBalance: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 font-mono text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1">
              Max Drawdown Limit ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={riskForm.maxDrawdownLimit}
              onChange={(e) => setRiskForm({ ...riskForm, maxDrawdownLimit: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 font-mono text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1">
              Daily Loss Cutoff ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={riskForm.sessionLossCutoff}
              onChange={(e) => setRiskForm({ ...riskForm, sessionLossCutoff: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 font-mono text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1">
              Copier Feed Status
            </label>
            <select
              value={riskForm.copierStatus}
              onChange={(e) => setRiskForm({ ...riskForm, copierStatus: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white"
            >
              <option value="Replikanto Synced">Replikanto Synced</option>
              <option value="NinjaTrader 8">NinjaTrader 8 Direct</option>
              <option value="Bookmap DOM">Bookmap DOM</option>
              <option value="Standalone Manual">Standalone Manual</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={mutating}
            className="py-2 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs uppercase tracking-wider transition"
          >
            Save Risk Guard
          </button>
        </form>
      )}

      {/* Capital Preservation HUD Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400">
            Session Balance
          </div>
          <div className="mt-1.5 font-mono text-2xl font-bold text-white">
            {formatUsd(riskTelemetry.currentBalance)}
          </div>
          <div className="mt-1 text-xs font-mono text-zinc-400">
            Start: {formatUsd(riskTelemetry.startingBalance)}
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400">
            Daily Net PnL
          </div>
          <div
            className={`mt-1.5 font-mono text-2xl font-bold flex items-center gap-1.5 ${
              riskTelemetry.dailyNetPnl >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {riskTelemetry.dailyNetPnl >= 0 ? (
              <TrendingUp size={20} />
            ) : (
              <TrendingDown size={20} />
            )}
            {formatUsd(riskTelemetry.dailyNetPnl, true)}
          </div>
          <div className="mt-1 text-xs font-mono text-zinc-400">
            Hard Loss Cutoff: -{formatUsd(riskTelemetry.sessionLossCutoff)}
          </div>
        </div>

        <div
          className={`rounded-2xl border p-4 ${
            riskTelemetry.microOnlyLocked
              ? "border-amber-400/40 bg-amber-500/[0.08]"
              : "border-white/[0.08] bg-white/[0.025]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-300">
              Drawdown Buffer Remaining
            </span>
            <ShieldAlert
              size={14}
              className={riskTelemetry.microOnlyLocked ? "text-amber-400" : "text-cyan-400"}
            />
          </div>
          <div className="mt-1.5 font-mono text-2xl font-bold text-white">
            {formatUsd(riskTelemetry.remainingBuffer)}
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.max(
                  0,
                  Math.min(
                    100,
                    (riskTelemetry.remainingBuffer /
                      Math.max(1, riskTelemetry.maxDrawdownLimit)) *
                      100
                  )
                )}%`,
                backgroundColor: riskTelemetry.microOnlyLocked ? "#f59e0b" : "#06b6d4",
              }}
            />
          </div>
          <div className="mt-1 text-[10px] font-mono text-zinc-400">
            Liq Floor: {formatUsd(riskTelemetry.liquidationFloor)} (&lt;$400 locks Micros)
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400">
            Session Execution Count
          </div>
          <div className="mt-1.5 font-mono text-2xl font-bold text-white">
            {sessionTrades.length} Trades
          </div>
          <div className="mt-1 text-xs font-mono text-zinc-400">
            {sessionTrades.filter((t) => Number(t.net_pnl) > 0).length}W ·{" "}
            {sessionTrades.filter((t) => Number(t.net_pnl) < 0).length}L
          </div>
        </div>
      </section>

      {/* Equity Curve SVG + Strategy Playbook Analytics */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Equity Curve SVG (7 cols) */}
        <div className="xl:col-span-7 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-400 flex items-center gap-1.5">
                <Activity size={13} /> Intraday Net PnL Equity Curve
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Trade-by-trade account mark-to-market vs. Hard Daily Loss Cutoff
              </p>
            </div>
            <span className="font-mono text-xs text-zinc-300">
              {activeSession?.account_name} · {activeSession?.session_date}
            </span>
          </div>

          <svg
            viewBox={`0 0 ${equityCurve.w} ${equityCurve.h}`}
            className="w-full h-auto rounded-xl bg-[#07090e] border border-white/[0.06]"
          >
            <defs>
              <linearGradient id="eqFillPos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id="eqFillNeg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Starting Balance Reference Line */}
            <line
              x1="44"
              y1={equityCurve.startY}
              x2={equityCurve.w - 44}
              y2={equityCurve.startY}
              stroke="rgba(255,255,255,0.18)"
              strokeDasharray="4 4"
            />
            <text
              x="50"
              y={Math.max(14, equityCurve.startY - 5)}
              fill="#9ca3af"
              fontSize="9.5"
              fontFamily="monospace"
            >
              Open {formatUsd(riskTelemetry.startingBalance)}
            </text>

            {/* Daily Loss Cutoff Line */}
            <line
              x1="44"
              y1={equityCurve.cutoffY}
              x2={equityCurve.w - 44}
              y2={equityCurve.cutoffY}
              stroke="#f43f5e"
              strokeWidth="1.2"
              strokeDasharray="3 3"
            />
            <text
              x={equityCurve.w - 50}
              y={Math.min(equityCurve.h - 6, equityCurve.cutoffY - 5)}
              fill="#fda4af"
              fontSize="9.5"
              fontFamily="monospace"
              textAnchor="end"
            >
              Circuit Breaker ({formatUsd(riskTelemetry.startingBalance - riskTelemetry.sessionLossCutoff)})
            </text>

            {/* Equity Area & Curve */}
            {equityCurve.areaD && (
              <path
                d={equityCurve.areaD}
                fill={riskTelemetry.dailyNetPnl >= 0 ? "url(#eqFillPos)" : "url(#eqFillNeg)"}
              />
            )}
            <path
              d={equityCurve.pathD}
              fill="none"
              stroke={riskTelemetry.dailyNetPnl >= 0 ? "#22d3ee" : "#fb7185"}
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {equityCurve.points.map((pt, i) => (
              <g key={i}>
                <circle
                  cx={equityCurve.toX(i)}
                  cy={equityCurve.toY(pt.bal)}
                  r="4.5"
                  fill={pt.delta >= 0 ? "#10b981" : "#f43f5e"}
                  stroke="#090b11"
                  strokeWidth="1.5"
                />
                <text
                  x={equityCurve.toX(i)}
                  y={equityCurve.h - 6}
                  fill="#9ca3af"
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  T{i}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* Strategy Playbook Analytics (5 cols) */}
        <div className="xl:col-span-5 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-400 flex items-center gap-1.5">
                  <BarChart3 size={13} /> Strategy Playbook Analytics
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Win Rate %, Profit Factor & Expectancy ($/trade)
                </p>
              </div>
              <div className="flex rounded-lg bg-black/40 p-0.5 border border-white/10 text-[11px]">
                <button
                  onClick={() => setAnalyticsScope("session")}
                  className={`px-2.5 py-1 rounded-md font-bold ${
                    analyticsScope === "session"
                      ? "bg-cyan-500/20 text-cyan-300"
                      : "text-zinc-400"
                  }`}
                >
                  Session
                </button>
                <button
                  onClick={() => setAnalyticsScope("all")}
                  className={`px-2.5 py-1 rounded-md font-bold ${
                    analyticsScope === "all" ? "bg-cyan-500/20 text-cyan-300" : "text-zinc-400"
                  }`}
                >
                  All Accounts
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              {playbookStats.map((pb) => (
                <div
                  key={pb.setup}
                  className="rounded-xl bg-black/35 border border-white/[0.07] p-3 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{pb.setup}</span>
                    <span
                      className={`text-xs font-mono font-bold ${
                        pb.netPnl >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {formatUsd(pb.netPnl, true)}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-[11px] font-mono pt-1">
                    <div>
                      <div className="text-[9px] text-zinc-500 uppercase">Trades</div>
                      <div className="text-zinc-200 font-bold">{pb.trades}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-zinc-500 uppercase">Win Rate</div>
                      <div className="text-cyan-300 font-bold">{pb.winRate.toFixed(0)}%</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-zinc-500 uppercase">Prof Factor</div>
                      <div className="text-amber-300 font-bold">
                        {pb.profitFactor >= 99 ? "∞" : pb.profitFactor.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] text-zinc-500 uppercase">Expectancy</div>
                      <div
                        className={`font-bold ${
                          pb.expectancy >= 0 ? "text-emerald-300" : "text-rose-300"
                        }`}
                      >
                        {formatUsd(pb.expectancy, true)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Execution Logger + Quantitative Trade Journal */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Quantitative Trade Logger (5 cols) */}
        <form
          onSubmit={handleLogTrade}
          className="xl:col-span-5 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 space-y-4"
        >
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-400 flex items-center gap-1.5">
              <Target size={13} /> Quantitative Trade Logger
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Automatic tick/point Gross & Net PnL ($2 MNQ · $20 NQ · $5 MES · $50 ES)
            </p>
          </div>

          {/* Instrument Buttons with Micro-Only Lock */}
          <div className="grid grid-cols-4 gap-2">
            {(["MNQ", "NQ", "MES", "ES"] as const).map((inst) => {
              const isFullSize = inst === "NQ" || inst === "ES";
              const locked = riskTelemetry.microOnlyLocked && isFullSize;
              const selected = instrument === inst;
              return (
                <button
                  key={inst}
                  type="button"
                  disabled={locked}
                  onClick={() => setInstrument(inst)}
                  className={`py-2 px-2 rounded-xl border font-mono text-xs font-bold transition flex flex-col items-center ${
                    locked
                      ? "bg-rose-950/30 border-rose-500/20 text-zinc-600 cursor-not-allowed"
                      : selected
                      ? "bg-cyan-500/20 border-cyan-400/60 text-cyan-200"
                      : "bg-black/35 border-white/10 text-zinc-300 hover:bg-white/[0.06]"
                  }`}
                >
                  <span className="flex items-center gap-1">
                    {locked && <Lock size={10} className="text-amber-400" />}
                    {inst}
                  </span>
                  <span className="text-[9px] opacity-75">${POINT_MULTIPLIERS[inst]}/pt</span>
                </button>
              );
            })}
          </div>

          {/* Direction & Contracts */}
          <div className="grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => setDirection("LONG")}
              className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 border transition ${
                direction === "LONG"
                  ? "bg-emerald-500/25 border-emerald-400/60 text-emerald-200"
                  : "bg-black/35 border-white/10 text-zinc-400"
              }`}
            >
              <ArrowUpRight size={14} /> LONG
            </button>
            <button
              type="button"
              onClick={() => setDirection("SHORT")}
              className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 border transition ${
                direction === "SHORT"
                  ? "bg-rose-500/25 border-rose-400/60 text-rose-200"
                  : "bg-black/35 border-white/10 text-zinc-400"
              }`}
            >
              <ArrowDownRight size={14} /> SHORT
            </button>
            <div>
              <input
                type="number"
                min="1"
                max="50"
                value={contracts}
                onChange={(e) => setContracts(e.target.value)}
                placeholder="Qty"
                className="w-full h-full px-3 py-2 rounded-xl bg-black/45 border border-white/10 font-mono text-xs text-white text-center"
                title="Contracts"
              />
            </div>
          </div>

          {/* Entry, Exit, Stop Ticks, Commissions */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1">
                Entry Price
              </label>
              <input
                type="number"
                step="0.25"
                required
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/45 border border-white/10 font-mono text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1">
                Exit Price
              </label>
              <input
                type="number"
                step="0.25"
                required
                value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/45 border border-white/10 font-mono text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1">
                Stop Loss (Ticks)
              </label>
              <input
                type="number"
                min="1"
                value={stopLossTicks}
                onChange={(e) => setStopLossTicks(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/45 border border-white/10 font-mono text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1">
                Commissions ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={commissions}
                onChange={(e) => setCommissions(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/45 border border-white/10 font-mono text-xs text-white"
              />
            </div>
          </div>

          {/* Setup, $ADD, CVD */}
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1">
                Playbook Setup
              </label>
              <select
                value={setupName}
                onChange={(e) => setSetupName(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl bg-black/45 border border-white/10 text-xs text-white"
              >
                {PLAYBOOK_SETUPS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1">
                NYSE $ADD
              </label>
              <input
                type="number"
                step="1"
                value={marketAdd}
                onChange={(e) => setMarketAdd(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl bg-black/45 border border-white/10 font-mono text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1">
                CVD Flow
              </label>
              <select
                value={cvdDirection}
                onChange={(e) => setCvdDirection(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl bg-black/45 border border-white/10 text-xs text-white"
              >
                {CVD_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mega-Cap Leader Alignment */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1.5">
              Mega-Cap Leader Alignment (Click to Cycle ▲ / ▬ / ▼)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { sym: "NVDA", val: nvdaDir, set: setNvdaDir },
                { sym: "AAPL", val: aaplDir, set: setAaplDir },
                { sym: "MSFT", val: msftDir, set: setMsftDir },
              ].map((ldr) => (
                <button
                  key={ldr.sym}
                  type="button"
                  onClick={() => ldr.set(cycleLeader(ldr.val))}
                  className="py-1.5 px-2.5 rounded-xl bg-black/45 border border-white/10 font-mono text-xs font-bold flex items-center justify-between text-white hover:border-white/25"
                >
                  <span>{ldr.sym}</span>
                  <span
                    className={
                      ldr.val === "▲"
                        ? "text-emerald-400"
                        : ldr.val === "▼"
                        ? "text-rose-400"
                        : "text-amber-300"
                    }
                  >
                    {ldr.val}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Execution thesis, DOM tape observation, or discipline note..."
            className="w-full px-3 py-2 rounded-xl bg-black/45 border border-white/10 text-xs text-white"
          />

          {/* Live PnL Preview Strip */}
          <div className="rounded-xl bg-black/50 border border-white/[0.08] p-3 flex items-center justify-between font-mono text-xs">
            <div>
              <span className="text-zinc-400">Delta: </span>
              <span className="text-white font-bold">
                {previewPnl.pts >= 0 ? "+" : ""}
                {previewPnl.pts.toFixed(2)} pts ({previewPnl.ticks}t)
              </span>
            </div>
            <div>
              <span className="text-zinc-400">Net PnL: </span>
              <span
                className={`font-bold ${
                  previewPnl.net >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {formatUsd(previewPnl.net, true)}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={mutating}
            className="w-full py-2.5 rounded-xl bg-cyan-500/25 hover:bg-cyan-500/35 border border-cyan-400/50 text-cyan-100 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 transition"
          >
            <Plus size={14} /> Journal Execution to {activeSession?.account_name}
          </button>
        </form>

        {/* Quantitative Execution Journal Table (7 cols) */}
        <div className="xl:col-span-7 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">
                Execution Ledger
              </div>
              <h2 className="text-sm font-bold text-white mt-0.5">
                {activeSession?.account_name} — {sessionTrades.length} Recorded Fills
              </h2>
            </div>
          </div>

          <div className="space-y-3">
            {sessionTrades.length === 0 ? (
              <div className="h-52 rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center text-xs text-zinc-400">
                No fills recorded in this session yet.
              </div>
            ) : (
              [...sessionTrades].reverse().map((tr) => {
                const net = Number(tr.net_pnl || 0);
                return (
                  <div
                    key={tr.id}
                    className="rounded-xl border border-white/[0.08] bg-black/35 p-3.5 space-y-2 hover:border-white/15 transition"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-400/30 font-mono text-xs font-bold text-cyan-200">
                          {tr.contracts}× {tr.instrument}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold ${
                            tr.direction === "LONG"
                              ? "bg-emerald-500/15 text-emerald-300"
                              : "bg-rose-500/15 text-rose-300"
                          }`}
                        >
                          {tr.direction}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-white/[0.06] text-[11px] font-semibold text-zinc-200">
                          {tr.setup_name || "Discretionary"}
                        </span>
                        <span className="text-[11px] font-mono text-zinc-400">
                          {Number(tr.entry_price).toFixed(2)} → {Number(tr.exit_price).toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right font-mono">
                          <div
                            className={`text-sm font-bold ${
                              net >= 0 ? "text-emerald-400" : "text-rose-400"
                            }`}
                          >
                            {formatUsd(net, true)}
                          </div>
                          <div className="text-[10px] text-zinc-500">
                            Gross {formatUsd(Number(tr.gross_pnl), true)} · Fee $
                            {Number(tr.commissions).toFixed(2)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteTrade(tr.id)}
                          disabled={mutating}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-zinc-400 pt-1 border-t border-white/[0.05]">
                      <span>SL: {tr.stop_loss_ticks}t</span>
                      <span>
                        $ADD:{" "}
                        <strong className="text-zinc-200">
                          {tr.market_add_at_entry !== null ? tr.market_add_at_entry : "—"}
                        </strong>
                      </span>
                      <span>
                        CVD: <strong className="text-cyan-300">{tr.cvd_direction || "—"}</strong>
                      </span>
                      <span>
                        Leaders: <strong className="text-zinc-200">{tr.leader_alignment}</strong>
                      </span>
                    </div>

                    {tr.notes && (
                      <p className="text-xs text-zinc-300/90 italic pt-0.5">“{tr.notes}”</p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>
    </ExecutiveModuleShell>
  );
}
