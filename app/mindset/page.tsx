"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { ExecutiveModuleShell } from "@/components/chairman/ExecutiveModuleShell";
import {
  Flame,
  ShieldAlert,
  Brain,
  TrendingUp,
  Activity,
  Utensils,
  CheckSquare,
  Clock,
  Send,
  Plus,
  Sparkles,
  CheckCircle2,
  Wind,
  Crosshair,
  Scale,
  Lock,
  RefreshCw,
  Mic,
  MicOff,
  History,
} from "lucide-react";

type MindsetMode =
  | "recalibration"
  | "accountability_audit"
  | "panic_reset"
  | "pre_market_pep_talk";

interface CounselContext {
  sleepAndHealth: {
    metricName: string;
    value: number;
    target: number;
    readinessPct: number;
    status: "OPTIMAL" | "MODERATE" | "DEPLETED";
  };
  nutrition: {
    consumedCalories: number;
    targetCalories: number;
    consumedProtein: number;
    targetProtein: number;
    waterOz: number;
  };
  trading: {
    accountName: string;
    dailyNetPnl: number;
    sessionLossCutoff: number;
    maxDrawdownLimit: number;
    circuitBreakerTripped: boolean;
    copierStatus: string;
  };
  workload: {
    pendingTasksCount: number;
    highPriorityCount: number;
    legacyPendingCount: number;
  };
  clock144: {
    denverTime: string;
    currentBlockIndex: number;
    minutesRemainingInBlock: number;
    entropyHardStopActive: boolean;
  };
}

interface MindsetSession {
  id: string;
  session_mode: MindsetMode;
  initial_user_state: string;
  diagnosed_friction_point: string | null;
  framework_applied: string | null;
  resolution_status: string;
  created_at: string;
}

interface MindsetMessage {
  id?: string;
  session_id?: string;
  sender_role: "user" | "commander" | string;
  content: string;
  created_at?: string;
}

const OPERATIONAL_MODES: {
  id: MindsetMode;
  label: string;
  tagline: string;
  accent: string;
  borderClass: string;
  icon: React.ReactNode;
  starterPrompt: string;
}[] = [
  {
    id: "recalibration",
    label: "Cognitive Recalibration",
    tagline: "Strip mental fog & lock onto the active 144-minute block",
    accent: "#38bdf8",
    borderClass: "border-sky-400/40 bg-sky-500/10",
    icon: <Brain className="w-4 h-4 text-sky-400" />,
    starterPrompt:
      "My attention is pulled across multiple workstreams right now. Run a 144 Logic Cognitive Recalibration and isolate my highest-leverage move for this block.",
  },
  {
    id: "accountability_audit",
    label: "Brutal Accountability Audit",
    tagline: "Zero-excuse mirror between stated ambition & daily output",
    accent: "#f59e0b",
    borderClass: "border-amber-400/45 bg-amber-500/10",
    icon: <Scale className="w-4 h-4 text-amber-400" />,
    starterPrompt:
      "Run a Brutal Accountability Audit on my current backlog, metabolic discipline, and execution pace today. Call out any disguised procrastination.",
  },
  {
    id: "panic_reset",
    label: "Ledge / Panic Reset",
    tagline: "Immediate sympathetic down-regulation & impulse freeze",
    accent: "#fb7185",
    borderClass: "border-rose-400/45 bg-rose-500/10",
    icon: <ShieldAlert className="w-4 h-4 text-rose-400" />,
    starterPrompt:
      "Sympathetic spike / tilt warning. Engage Ledge / Panic Reset immediately — freeze impulsive decisions and narrow my horizon to the next 15 minutes.",
  },
  {
    id: "pre_market_pep_talk",
    label: "Pre-Market Caliber Arc Lock-In",
    tagline: "MNQ/NQ 20-Account Execution Oath & -$250 Circuit Law",
    accent: "#34d399",
    borderClass: "border-emerald-400/45 bg-emerald-500/10",
    icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
    starterPrompt:
      "Deliver my Pre-Market Caliber Arc Lock-In briefing. Anchor me on A+ $ADD + CVD + Leader confluence and non-negotiable -$250 session loss discipline.",
  },
];

const PROTOCOL_144_CARDS = [
  {
    title: "Break Paralysis by Analysis",
    mode: "recalibration" as MindsetMode,
    badge: "144 BLOCK DECOMPOSITION",
    description:
      "Collapses multi-project overwhelm into a single 30-minute physical shippable increment.",
    prompt:
      "Engage 144 Logic Protocol: Break Paralysis by Analysis. Force a binary choice and strip everything non-essential from my current 144-minute block.",
  },
  {
    title: "Neutralize Sunk-Cost / Revenge Trading",
    mode: "panic_reset" as MindsetMode,
    badge: "CIRCUIT BREAKER SHIELD",
    description:
      "Severs emotional attachment to red PnL or wasted hours. Enforces immediate capital & cognitive preservation.",
    prompt:
      "Engage 144 Logic Protocol: Neutralize Sunk-Cost / Revenge Trading. Sever attachment to prior losses or wasted blocks and lock my risk rules.",
  },
  {
    title: "19:00 Entropy Hard-Stop",
    mode: "recalibration" as MindsetMode,
    badge: "CIRCADIAN GUARDRAIL",
    description:
      "Blocks late-evening high-stakes decisions when prefrontal glycogen is depleted; shifts to Vault capture & recovery.",
    prompt:
      "Engage 144 Logic Protocol: 19:00 Entropy Hard-Stop. Audit whether I am making depleted evening decisions and transition me to structured shutdown.",
  },
  {
    title: "First-Principles Decomposition",
    mode: "accountability_audit" as MindsetMode,
    badge: "ROOT-CAUSE AXIOM",
    description:
      "Strips assumptions to physics-level constraints: what must actually be true for the objective to succeed today?",
    prompt:
      "Engage 144 Logic Protocol: First-Principles Decomposition. Strip my current bottleneck down to verifiable facts and one immediate engineering/business action.",
  },
];

export default function CommandersCounselMindsetPage() {
  const [context, setContext] = useState<CounselContext | null>(null);
  const [sessions, setSessions] = useState<MindsetSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<MindsetMode>("recalibration");
  const [messages, setMessages] = useState<MindsetMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Physiological Sigh / Box Breathing Pacer for Panic Reset
  const [breathActive, setBreathActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState("Double Nasal Inhale (4s)");

  // Voice Dictation
  const [dictating, setDictating] = useState(false);
  const recRef = useRef<any>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  const fetchCounselData = useCallback(async (sessionId?: string | null) => {
    try {
      setLoading(true);
      const url = sessionId
        ? `/api/mindset?sessionId=${encodeURIComponent(sessionId)}`
        : "/api/mindset";
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();
      if (data.context) setContext(data.context);
      if (Array.isArray(data.sessions)) setSessions(data.sessions);
      if (data.activeSessionId !== undefined) {
        setActiveSessionId(data.activeSessionId);
        const found = (data.sessions || []).find(
          (s: MindsetSession) => s.id === data.activeSessionId
        );
        if (found) setSelectedMode(found.session_mode);
      }
      if (Array.isArray(data.messages)) setMessages(data.messages);
    } catch (err) {
      console.error("[Mindset] Load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCounselData();
  }, [fetchCounselData]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, submitting]);

  // Breathing cadence loop when active
  useEffect(() => {
    if (!breathActive) return;
    const phases = [
      "1. Deep Nasal Inhale (3s)",
      "2. Sharp Top-Off Inhale (1s)",
      "3. Long Controlled Exhale (6s)",
      "4. Calm Hold (2s)",
    ];
    let idx = 0;
    setBreathPhase(phases[0]);
    const timer = setInterval(() => {
      idx = (idx + 1) % phases.length;
      setBreathPhase(phases[idx]);
    }, 3000);
    return () => clearInterval(timer);
  }, [breathActive]);

  const dispatchCounsel = async (
    overrideText?: string,
    overrideMode?: MindsetMode,
    protocolTitle?: string,
    forceNewSession?: boolean
  ) => {
    const text = (overrideText !== undefined ? overrideText : input).trim();
    if (!text) return;

    const modeToUse = overrideMode || selectedMode;
    if (overrideMode) setSelectedMode(overrideMode);
    if (overrideText === undefined) setInput("");

    const targetSessionId = forceNewSession ? null : activeSessionId;
    if (forceNewSession) {
      setMessages([]);
      setActiveSessionId(null);
    }

    setSubmitting(true);
    setMessages((prev) => [
      ...prev,
      {
        sender_role: "user",
        content: text,
        created_at: new Date().toISOString(),
      },
    ]);

    try {
      const res = await fetch("/api/mindset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: targetSessionId,
          sessionMode: modeToUse,
          message: text,
          protocolCard: protocolTitle,
        }),
      });
      const data = await res.json();
      if (data.context) setContext(data.context);
      if (data.session) {
        setActiveSessionId(data.session.id);
        setSessions((prev) => {
          const filtered = prev.filter((s) => s.id !== data.session.id);
          return [data.session, ...filtered];
        });
      }
      if (Array.isArray(data.messages)) {
        setMessages(data.messages);
      } else if (data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            sender_role: "commander",
            content: data.reply,
            created_at: new Date().toISOString(),
          },
        ]);
      }
    } catch (err) {
      console.error("[Mindset] Dispatch error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const startNewSession = (mode?: MindsetMode) => {
    setActiveSessionId(null);
    setMessages([]);
    if (mode) setSelectedMode(mode);
  };

  const toggleDictation = () => {
    if (dictating) {
      recRef.current?.stop();
      setDictating(false);
      return;
    }
    const SpeechRec =
      typeof window !== "undefined"
        ? (window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition
        : null;
    if (!SpeechRec) return;
    const rec = new SpeechRec();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.onstart = () => setDictating(true);
    rec.onresult = (ev: any) => {
      const transcript = ev.results?.[0]?.[0]?.transcript || "";
      if (transcript) {
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      }
    };
    rec.onend = () => setDictating(false);
    rec.onerror = () => setDictating(false);
    recRef.current = rec;
    rec.start();
  };

  const activeSessionObj = sessions.find((s) => s.id === activeSessionId);

  return (
    <ExecutiveModuleShell
      moduleId="MINDSET"
      eyebrow="Section 23 · Psychological Calibration"
      title="The Commander's Counsel — 144 Logic Engine"
      subtitle="Live Biometric, Metabolic & Drawdown-Aware Executive Mindset Calibration (Shortcut: ⌘⇧M)"
      accentColor="#f59e0b"
      headerActions={
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setBreathActive((p) => !p)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border flex items-center gap-1.5 transition ${
              breathActive
                ? "bg-rose-500/25 border-rose-400 text-rose-100 animate-pulse"
                : "bg-white/[0.04] border-white/10 text-zinc-300 hover:text-white"
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            {breathActive ? breathPhase : "Physiological Sigh Pacer"}
          </button>

          <button
            onClick={() => startNewSession(selectedMode)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 flex items-center gap-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            New Counsel Session
          </button>
        </div>
      }
    >
      {/* 1. LIVE CONTEXTUAL BIOMETRIC & OPERATIONAL INGRESS BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Biometric / Sleep Baseline */}
        <div className="rounded-2xl border border-white/10 bg-[#0d121d]/90 p-4">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400">
            <span>Sleep & Biometric Baseline</span>
            <Activity className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="text-2xl font-mono font-bold text-white">
              {context ? `${context.sleepAndHealth.readinessPct}%` : "95%"}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                context?.sleepAndHealth.status === "DEPLETED"
                  ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                  : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
              }`}
            >
              {context?.sleepAndHealth.status || "OPTIMAL"}
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1 truncate">
            {context
              ? `${context.sleepAndHealth.metricName}: ${context.sleepAndHealth.value}/${context.sleepAndHealth.target}`
              : "Loading Scorecard telemetry..."}
          </p>
        </div>

        {/* Metabolic Fuel Ingress */}
        <div className="rounded-2xl border border-white/10 bg-[#0d121d]/90 p-4">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400">
            <span>MacroOps Glycogen & Protein</span>
            <Utensils className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="text-xl font-mono font-bold text-white">
              {context
                ? `${context.nutrition.consumedCalories} / ${context.nutrition.targetCalories} kcal`
                : "— / 1750 kcal"}
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            Protein:{" "}
            <strong className="text-emerald-300">
              {context?.nutrition.consumedProtein ?? 0}g
            </strong>{" "}
            / {context?.nutrition.targetProtein ?? 180}g · Water:{" "}
            {context?.nutrition.waterOz ?? 0} oz
          </p>
        </div>

        {/* Caliber Arc Drawdown & Circuit Breaker */}
        <div
          className={`rounded-2xl border p-4 ${
            context?.trading.circuitBreakerTripped
              ? "border-rose-500/50 bg-rose-950/25"
              : "border-white/10 bg-[#0d121d]/90"
          }`}
        >
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400">
            <span>Caliber Arc Circuit State</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span
              className={`text-2xl font-mono font-bold ${
                (context?.trading.dailyNetPnl ?? 0) < 0
                  ? "text-rose-400"
                  : "text-emerald-300"
              }`}
            >
              {context
                ? `${context.trading.dailyNetPnl >= 0 ? "+" : ""}$${context.trading.dailyNetPnl.toFixed(
                    0
                  )}`
                : "$0"}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border flex items-center gap-1 ${
                context?.trading.circuitBreakerTripped
                  ? "bg-rose-500/20 text-rose-200 border-rose-400/50"
                  : "bg-cyan-500/15 text-cyan-200 border-cyan-400/35"
              }`}
            >
              <Lock className="w-2.5 h-2.5" />
              {context?.trading.circuitBreakerTripped
                ? "BREAKER TRIPPED"
                : `-$${context?.trading.sessionLossCutoff ?? 250} GUARD ARMED`}
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1 truncate">
            {context?.trading.accountName || "Apex 50K Pod"} ·{" "}
            {context?.trading.copierStatus || "Replikanto Synced"}
          </p>
        </div>

        {/* 144-Minute Sovereign Block & Cognitive Backlog */}
        <div className="rounded-2xl border border-amber-400/25 bg-amber-500/[0.05] p-4">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.15em] text-amber-300">
            <span>144 Logic Clock & Load</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="text-xl font-mono font-bold text-white">
              Block #{context?.clock144.currentBlockIndex ?? 5}/10
            </span>
            <span className="text-xs font-mono text-amber-300">
              {context?.clock144.minutesRemainingInBlock ?? 72}m left
            </span>
          </div>
          <p className="text-[11px] text-zinc-300 mt-1 flex items-center justify-between">
            <span>
              <CheckSquare className="w-3 h-3 inline mr-1 text-amber-400" />
              {context?.workload.pendingTasksCount ?? 0} pending (
              {context?.workload.highPriorityCount ?? 0} high)
            </span>
            {context?.clock144.entropyHardStopActive && (
              <span className="text-[9.5px] font-bold text-rose-300 uppercase">
                19:00 STOP ACTIVE
              </span>
            )}
          </p>
        </div>
      </div>

      {/* 2. FOUR OPERATIONAL MODES SELECTOR */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
        {OPERATIONAL_MODES.map((m) => {
          const isSelected = selectedMode === m.id;
          return (
            <div
              key={m.id}
              onClick={() => setSelectedMode(m.id)}
              className={`cursor-pointer rounded-2xl p-4 border transition flex flex-col justify-between gap-3 ${
                isSelected
                  ? `${m.borderClass} shadow-lg`
                  : "border-white/10 bg-[#0d121d]/75 hover:border-white/20"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="p-2 rounded-xl bg-black/40 border border-white/10">
                    {m.icon}
                  </div>
                  {isSelected && (
                    <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider bg-white/15 text-white">
                      Active Mode
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-white mt-2.5">
                  {m.label}
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                  {m.tagline}
                </p>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  dispatchCounsel(m.starterPrompt, m.id, undefined, true);
                }}
                disabled={submitting}
                className="w-full py-1.5 rounded-lg bg-black/40 hover:bg-black/65 border border-white/10 text-[10.5px] font-bold uppercase tracking-wider text-zinc-200 transition"
              >
                Engage {m.label.split(" ")[0]} →
              </button>
            </div>
          );
        })}
      </div>

      {/* 3. INTERACTIVE 144 LOGIC MENTAL-RESET PROTOCOL CARDS */}
      <div className="rounded-2xl border border-white/10 bg-[#0b101b]/90 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-amber-300">
              144 Logic Rapid Mental-Reset Protocols (One-Click Intercept)
            </span>
          </div>
          <span className="text-[10.5px] text-zinc-500 font-mono hidden sm:inline">
            1,440 Min/Day = 10 × 144-Minute Sovereign Blocks
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {PROTOCOL_144_CARDS.map((card) => (
            <button
              key={card.title}
              onClick={() =>
                dispatchCounsel(card.prompt, card.mode, card.title, false)
              }
              disabled={submitting}
              className="text-left rounded-xl border border-white/10 hover:border-amber-400/45 bg-white/[0.025] hover:bg-amber-500/[0.07] p-3.5 transition flex flex-col justify-between gap-2.5 group"
            >
              <div>
                <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-cyan-300">
                  {card.badge}
                </span>
                <h4 className="text-xs font-bold text-white mt-1 group-hover:text-amber-200">
                  {card.title}
                </h4>
                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                  {card.description}
                </p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1">
                <Flame className="w-3 h-3" />
                Execute Protocol
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. MAIN COUNSEL CONSOLE + PERSISTED SESSION HISTORY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar: Session History Ledger */}
        <div className="lg:col-span-4 rounded-2xl border border-white/10 bg-[#0d121d]/90 p-4 flex flex-col max-h-[620px]">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-200">
              <History className="w-4 h-4 text-amber-400" />
              Counsel Session Ledger
            </div>
            <span className="text-[10px] font-mono text-zinc-500">
              {sessions.length} saved
            </span>
          </div>

          <div className="flex-1 overflow-y-auto mt-3 space-y-2 pr-1">
            {loading && sessions.length === 0 ? (
              <div className="text-xs text-zinc-500 py-8 text-center">
                Loading `public.mindset_sessions`...
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-xs text-zinc-500 py-8 text-center">
                No calibration sessions logged yet. Trigger a mode or protocol
                card above to begin.
              </div>
            ) : (
              sessions.map((s) => {
                const active = s.id === activeSessionId;
                return (
                  <button
                    key={s.id}
                    onClick={() => fetchCounselData(s.id)}
                    className={`w-full text-left rounded-xl p-3 border transition space-y-1.5 ${
                      active
                        ? "bg-amber-500/15 border-amber-400/45"
                        : "bg-white/[0.02] border-white/[0.06] hover:border-white/15"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded text-[9.5px] font-mono font-bold uppercase bg-black/50 text-amber-300 border border-amber-400/25">
                        {s.session_mode.replace(/_/g, " ")}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        {s.resolution_status}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-zinc-100 line-clamp-2">
                      {s.initial_user_state}
                    </p>
                    {s.diagnosed_friction_point && (
                      <p className="text-[10.5px] text-cyan-300/90 truncate">
                        Friction: {s.diagnosed_friction_point}
                      </p>
                    )}
                    <div className="text-[10px] text-zinc-500 font-mono">
                      {new Date(s.created_at).toLocaleString()}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Active Commander's Counsel Chamber */}
        <div className="lg:col-span-8 rounded-2xl border border-amber-400/25 bg-[#0d121d]/95 flex flex-col min-h-[520px] max-h-[620px] overflow-hidden">
          {/* Chamber Header */}
          <div className="px-5 py-3.5 border-b border-white/10 bg-gradient-to-r from-amber-500/10 via-transparent to-cyan-500/10 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-white">
                  Commander Persona ·{" "}
                  {selectedMode.replace(/_/g, " ").toUpperCase()}
                </span>
              </div>
              {activeSessionObj?.framework_applied && (
                <p className="text-[10.5px] font-mono text-cyan-300 mt-0.5">
                  Active Framework: {activeSessionObj.framework_applied}
                </p>
              )}
            </div>

            {activeSessionId && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                PostgreSQL Persisted
              </span>
            )}
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto py-10 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-400/35 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-amber-300" />
                </div>
                <h3 className="text-base font-bold text-white">
                  The Commander Is Standing By
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  State your current cognitive friction, trading mindset, or
                  execution bottleneck — or click any{" "}
                  <strong className="text-amber-300">144 Logic Protocol</strong>{" "}
                  above. Live Sleep, MacroOps, Caliber Arc PnL, and PMS task
                  telemetry are automatically injected into every assessment.
                </p>
              </div>
            ) : (
              messages.map((m, idx) => {
                const isUser = m.sender_role === "user";
                return (
                  <div
                    key={m.id || idx}
                    className={`flex flex-col ${
                      isUser ? "items-end" : "items-start"
                    }`}
                  >
                    <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1 px-1">
                      {isUser
                        ? "Chairman"
                        : "The Commander · 144 Logic Counsel"}
                    </div>
                    <div
                      className={`max-w-[90%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                        isUser
                          ? "bg-amber-500/20 border border-amber-400/35 text-white"
                          : "bg-black/50 border border-white/10 text-zinc-100"
                      }`}
                    >
                      <div className="prose prose-invert prose-xs max-w-none">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {submitting && (
              <div className="flex items-center gap-2 text-xs font-mono text-amber-300">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Commander synthesizing telemetry & 144 Logic framework...
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Counsel Input Bar */}
          <div className="p-4 border-t border-white/10 bg-black/50 flex items-center gap-2.5">
            <button
              onClick={toggleDictation}
              title="Voice Dictation"
              className={`p-2.5 rounded-xl border transition ${
                dictating
                  ? "bg-amber-500/30 border-amber-300 text-amber-200 animate-pulse"
                  : "bg-white/[0.05] border-white/10 text-zinc-300 hover:text-white"
              }`}
            >
              {dictating ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  dispatchCounsel();
                }
              }}
              placeholder={`Report state for ${selectedMode.replace(
                /_/g,
                " "
              )}...`}
              className="flex-1 rounded-xl bg-white/[0.04] border border-white/10 px-4 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-400/50"
            />

            <button
              onClick={() => dispatchCounsel()}
              disabled={submitting || !input.trim()}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-black text-xs font-extrabold uppercase tracking-wider hover:opacity-95 transition disabled:opacity-40 flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              Counsel
            </button>
          </div>
        </div>
      </div>
    </ExecutiveModuleShell>
  );
}
