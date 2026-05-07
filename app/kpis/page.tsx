"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useSession, signIn, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Target, Settings, TrendingUp, Landmark, Terminal, Layers, CircleDollarSign, Activity, Users, Sparkles, Edit2, X, Save } from "lucide-react";

const CSS_3D = `
.perspective-1000 { perspective: 1000px; }
.preserve-3d { transform-style: preserve-3d; }
.backface-hidden { backface-visibility: hidden; }
.rotate-y-180 { transform: rotateY(180deg); }
`;

interface Metric {
  id?: string;
  metricName: string;
  value: number;
  target: number;
  category: string;
}

const CATEGORIES = [
  { id: "wealth", title: "WEALTH", icon: CircleDollarSign, color: "#D4AF37" },
  { id: "health", title: "HEALTH", icon: Activity, color: "#E05A3A" },
  { id: "relate", title: "RELATIONSHIPS", icon: Users, color: "#5B8FB9" },
  { id: "joy", title: "JOY", icon: Sparkles, color: "#B388EB" },
  { id: "ceo", title: "CEO", icon: Target, color: "#C9A961" },
  { id: "coo", title: "COO", icon: Settings, color: "#7B9EA8" },
  { id: "cmo", title: "CMO", icon: TrendingUp, color: "#A87B9E" },
  { id: "cfo", title: "CFO", icon: Landmark, color: "#8BA87B" },
  { id: "cto", title: "CTO", icon: Terminal, color: "#4A90E2" },
  { id: "cpo", title: "CPO", icon: Layers, color: "#F39C12" },
];

const RAW_METRIC_DEFS: Record<string, { name: string, defaultVal: number, target: number }[]> = {
  wealth: [
    { name: "income_guaranteed", defaultVal: 1, target: 0 },
    { name: "income_other", defaultVal: 0, target: 0 },
    { name: "expenses_base", defaultVal: 1, target: 0 },
    { name: "debt_monthly", defaultVal: 0, target: 0 },
    { name: "debt_total", defaultVal: 1, target: 0 },
    { name: "cash_liquid", defaultVal: 0, target: 0 },
    { name: "assets_productive", defaultVal: 0, target: 0 },
    { name: "interest_rate", defaultVal: 0, target: 0 },
  ],
  ceo: [
    { name: "ceo_fcf", defaultVal: 0, target: 0 },
    { name: "ceo_ruin_buffer", defaultVal: 0, target: 10 },
    { name: "ceo_buyback_rate", defaultVal: 0, target: 80 },
    { name: "ceo_logic_alignment", defaultVal: 0, target: 100 },
    { name: "ceo_autonomy_score", defaultVal: 0, target: 80 },
  ],
  cfo: [
    { name: "Liquidity", defaultVal: 0, target: 0 },
    { name: "Max Session Drawdown", defaultVal: 1, target: 0 },
  ],
  coo: [
    { name: "coo_mission_velocity", defaultVal: 0, target: 90 },
    { name: "coo_exception_rate", defaultVal: 0, target: 0 },
    { name: "coo_qa_fidelity", defaultVal: 0, target: 100 },
    { name: "coo_mttr_hours", defaultVal: 0, target: 4 },
    { name: "coo_sop_autonomy", defaultVal: 0, target: 90 },
  ],
  cmo: [{ name: "CAC", defaultVal: 0, target: 0 }, { name: "LTV", defaultVal: 0, target: 0 }],
  cto: [{ name: "Uptime", defaultVal: 99.9, target: 99.9 }],
  cpo: [{ name: "User Satisfaction", defaultVal: 100, target: 100 }],
  health: [
    { name: "health_protein", defaultVal: 0, target: 160 },
    { name: "health_energy", defaultVal: 0, target: 40 },
    { name: "health_fasting", defaultVal: 0, target: 18 },
    { name: "health_sleep", defaultVal: 0, target: 7 },
    { name: "health_strength", defaultVal: 0, target: 100 },
  ],
  relate: [
    { name: "rel_ttr_hours", defaultVal: 0, target: 2 },
    { name: "rel_survival_hours", defaultVal: 0, target: 0 },
    { name: "rel_decisions_total", defaultVal: 1, target: 0 },
    { name: "rel_decisions_silent", defaultVal: 0, target: 0 },
    { name: "rel_frame_breaks", defaultVal: 0, target: 0 },
    { name: "rel_armor_score", defaultVal: 10, target: 10 },
  ],
  joy: [
    { name: "joy_presence_days", defaultVal: 0, target: 7 },
    { name: "joy_hard_stop_days", defaultVal: 0, target: 5 },
    { name: "joy_whitespace_hours", defaultVal: 0, target: 14 },
    { name: "joy_doomscroll_hours", defaultVal: 0, target: 0 },
    { name: "joy_low_value_hours", defaultVal: 0, target: 0 },
  ],
};

function getStatus(val: number, target: number, operator: "<" | ">") {
  if (operator === "<") {
    if (val <= target) return "GREEN";
    if (val <= target * 1.5) return "YELLOW";
    return "RED";
  } else {
    if (val >= target) return "GREEN";
    if (val >= target * 0.8) return "YELLOW";
    return "RED";
  }
}

function calculateWealthPhysics(localVals: Record<string, number>) {
  const inc_guar = localVals["income_guaranteed"] || 1;
  const inc_other = localVals["income_other"] || 0;
  const exp_base = localVals["expenses_base"] || 1;
  const debt_mo = localVals["debt_monthly"] || 0;
  const debt_tot = localVals["debt_total"] || 1;
  const cash = localVals["cash_liquid"] || 0;
  const assets = localVals["assets_productive"] || 0;
  const int_rate = localVals["interest_rate"] || 0;

  const oxygenRatio = (debt_mo / inc_guar) * 100;
  const fcf = (inc_guar + inc_other) - (exp_base + debt_mo);
  const burn = exp_base + debt_mo || 1;
  const ruinRatio = cash / burn;
  const entropyRate = int_rate;
  const multiplier = assets / debt_tot;

  return { oxygenRatio, fcf, ruinRatio, entropyRate, multiplier };
}

function getWealthStatus(val: number, type: string) {
  if (type === "oxygen") {
    if (val <= 15) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    if (val <= 25) return { color: "text-yellow-500", label: "⚠️ WEAK" };
    if (val <= 40) return { color: "text-orange-500", label: "☢️ TOXIC" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  if (type === "fcf") {
    if (val > 0) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    if (val === 0) return { color: "text-yellow-500", label: "⚠️ WEAK" };
    if (val > -1000) return { color: "text-orange-500", label: "☢️ TOXIC" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  if (type === "ruin") {
    if (val >= 6.0) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    if (val >= 3.0) return { color: "text-yellow-500", label: "⚠️ WEAK" };
    if (val >= 1.0) return { color: "text-orange-500", label: "☢️ TOXIC" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  if (type === "entropy") {
    if (val <= 0) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    if (val <= 5) return { color: "text-yellow-500", label: "⚠️ WEAK" };
    if (val <= 12) return { color: "text-orange-500", label: "☢️ TOXIC" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  if (type === "multiplier") {
    if (val >= 2.0) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    if (val >= 1.0) return { color: "text-yellow-500", label: "⚠️ WEAK" };
    if (val >= 0.5) return { color: "text-orange-500", label: "☢️ TOXIC" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  return { color: "text-zinc-500", label: "UNKNOWN" };
}

function calculateHealthPhysics(localVals: Record<string, number>) {
  const protein = localVals["health_protein"] || 0;
  const energy = localVals["health_energy"] || 0;
  const fasting = localVals["health_fasting"] || 0;
  const sleep = localVals["health_sleep"] || 0;
  const strength = localVals["health_strength"] || 0;

  return { protein, energy, fasting, sleep, strength };
}

function getHealthStatus(val: number, type: string) {
  if (type === "protein") {
    if (val >= 155) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    if (val >= 140) return { color: "text-yellow-500", label: "⚠️ WARNING" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  if (type === "energy") {
    if (val <= 40) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  if (type === "fasting") {
    if (val >= 18) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  if (type === "sleep") {
    if (val >= 7) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    if (val >= 6) return { color: "text-yellow-500", label: "⚠️ WARNING" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  if (type === "strength") {
    if (val >= 100) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    if (val >= 90) return { color: "text-yellow-500", label: "⚠️ WARNING" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  return { color: "text-zinc-500", label: "UNKNOWN" };
}

function calculateRelatePhysics(localVals: Record<string, number>) {
  const ttr = localVals["rel_ttr_hours"] || 0;
  const survival = localVals["rel_survival_hours"] || 0;
  const dec_tot = localVals["rel_decisions_total"] || 1;
  const dec_sil = localVals["rel_decisions_silent"] || 0;
  const frame = localVals["rel_frame_breaks"] || 0;
  const armor = localVals["rel_armor_score"] || 0;

  const thermalLoad = (survival / 168) * 100;
  const silentExec = (dec_sil / dec_tot) * 100;

  return { ttr, thermalLoad, silentExec, frame, armor };
}

function getRelateStatus(val: number, type: string) {
  if (type === "ttr") {
    if (val <= 2) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    if (val <= 23) return { color: "text-yellow-500", label: "⚠️ WARNING" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  if (type === "thermal") {
    if (val <= 20) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  if (type === "silent") {
    if (val >= 80) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    if (val >= 50) return { color: "text-yellow-500", label: "⚠️ WARNING" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  if (type === "frame") {
    if (val === 0) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    if (val === 1) return { color: "text-yellow-500", label: "⚠️ WARNING" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  if (type === "armor") {
    if (val >= 8) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    if (val >= 5) return { color: "text-yellow-500", label: "⚠️ WARNING" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  return { color: "text-zinc-500", label: "UNKNOWN" };
}

function calculateJoyPhysics(localVals: Record<string, number>) {
  const presence = localVals["joy_presence_days"] || 0;
  const hardStop = localVals["joy_hard_stop_days"] || 0;
  const whitespace = localVals["joy_whitespace_hours"] || 0;
  const doomscroll = localVals["joy_doomscroll_hours"] || 0;
  const lowValue = localVals["joy_low_value_hours"] || 0;

  return { presence, hardStop, whitespace, doomscroll, lowValue };
}

function getJoyStatus(val: number, type: string) {
  if (type === "presence") {
    if (val === 7) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    if (val >= 4) return { color: "text-yellow-500", label: "⚠️ WARNING" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  if (type === "hardstop") {
    if (val >= 5) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    if (val >= 3) return { color: "text-yellow-500", label: "⚠️ WARNING" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  if (type === "whitespace") {
    if (val >= 14) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    if (val >= 8) return { color: "text-yellow-500", label: "⚠️ WARNING" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  if (type === "doomscroll") {
    if (val <= 1) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  if (type === "lowvalue") {
    if (val <= 2) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    if (val <= 5) return { color: "text-yellow-500", label: "⚠️ WARNING" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  return { color: "text-zinc-500", label: "UNKNOWN" };
}

function calculateCeoPhysics(localVals: Record<string, number>) {
  const fcf = localVals["ceo_fcf"] || 0;
  const ruin = localVals["ceo_ruin_buffer"] || 0;
  const buyback = localVals["ceo_buyback_rate"] || 0;
  const logic = localVals["ceo_logic_alignment"] || 0;
  const autonomy = localVals["ceo_autonomy_score"] || 0;

  return { fcf, ruin, buyback, logic, autonomy };
}

function getCeoStatus(val: number, type: string) {
  if (type === "fcf") {
    if (val > 0) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  if (type === "ruin") {
    if (val >= 10) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    if (val >= 4) return { color: "text-yellow-500", label: "⚠️ WARNING" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  if (type === "buyback") {
    if (val >= 80) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    if (val >= 50) return { color: "text-yellow-500", label: "⚠️ WARNING" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  if (type === "logic") {
    if (val >= 100) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  if (type === "autonomy") {
    if (val >= 80) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    if (val >= 50) return { color: "text-yellow-500", label: "⚠️ WARNING" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  return { color: "text-zinc-500", label: "UNKNOWN" };
}

function calculateCooPhysics(localVals: Record<string, number>) {
  const velocity = localVals["coo_mission_velocity"] || 0;
  const exception = localVals["coo_exception_rate"] || 0;
  const qa = localVals["coo_qa_fidelity"] || 0;
  const mttr = localVals["coo_mttr_hours"] || 0;
  const sop = localVals["coo_sop_autonomy"] || 0;

  return { velocity, exception, qa, mttr, sop };
}

function getCooStatus(val: number, type: string) {
  if (type === "velocity") {
    if (val >= 90) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    if (val >= 75) return { color: "text-yellow-500", label: "⚠️ WARNING" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  if (type === "exception") {
    if (val === 0) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  if (type === "qa") {
    if (val >= 100) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  if (type === "mttr") {
    if (val <= 4) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    if (val <= 12) return { color: "text-yellow-500", label: "⚠️ WARNING" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  if (type === "sop") {
    if (val >= 90) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    if (val >= 70) return { color: "text-yellow-500", label: "⚠️ WARNING" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  return { color: "text-zinc-500", label: "UNKNOWN" };
}

function SectorCard({ category, allMetrics, onSave }: any) {
  const [isFlipped, setIsFlipped] = useState(false);
  const defs = RAW_METRIC_DEFS[category.id];
  const [localVals, setLocalVals] = useState<Record<string, number>>({});
  
  useEffect(() => {
    const vals: any = {};
    defs.forEach(d => {
      const m = allMetrics.find((m: any) => m.category === category.id && m.metricName === d.name);
      vals[d.name] = m ? m.value : d.defaultVal;
    });
    setLocalVals(vals);
  }, [allMetrics, category.id, defs, isFlipped]);

  const save = async () => {
    for (const d of defs) {
      const m = allMetrics.find((m: any) => m.category === category.id && m.metricName === d.name);
      if (!m || m.value !== localVals[d.name]) {
        await onSave({
          id: m?.id,
          category: category.id,
          metricName: d.name,
          value: localVals[d.name],
          target: m?.target ?? d.target,
        });
      }
    }
    setIsFlipped(false);
  };

  const isWealth = category.id === "wealth";
  const isHealth = category.id === "health";
  const isRelate = category.id === "relate";
  const isJoy = category.id === "joy";
  const isCeo = category.id === "ceo";
  const isCoo = category.id === "coo";
  const isActiveSector = isWealth || isHealth || isRelate || isJoy || isCeo || isCoo;
  const wPhys = isWealth ? calculateWealthPhysics(localVals) : null;
  const hPhys = isHealth ? calculateHealthPhysics(localVals) : null;
  const rPhys = isRelate ? calculateRelatePhysics(localVals) : null;
  const jPhys = isJoy ? calculateJoyPhysics(localVals) : null;
  const cPhys = isCeo ? calculateCeoPhysics(localVals) : null;
  const cooPhys = isCoo ? calculateCooPhysics(localVals) : null;

  let primaryLabel = "Core Score";
  let primaryValue = "0";
  let status = "RED";

  if (category.id === "cfo") {
    const liq = localVals["Liquidity"] || 0;
    const dd = localVals["Max Session Drawdown"] || 1;
    const mos = liq / dd;
    primaryLabel = "Margin of Safety";
    primaryValue = `${mos.toFixed(1)}x`;
    status = getStatus(mos, 5, ">");
  } else {
    const first = defs[0].name;
    const val = localVals[first] || 0;
    primaryLabel = first;
    primaryValue = val.toString();
    status = getStatus(val, defs[0].target, ">");
  }

  const statusColors = {
    GREEN: "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]",
    YELLOW: "bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]",
    RED: "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]",
  };

  const cardHeight = isActiveSector ? "h-[380px]" : "h-[220px]";

  return (
    <div className={`relative w-full ${cardHeight} perspective-1000 group`}>
      <div className={`w-full h-full absolute transition-transform duration-500 preserve-3d ${isFlipped ? "rotate-y-180" : ""}`}>
        {/* Front */}
        <div className="absolute w-full h-full backface-hidden bg-white/80 dark:bg-black/60 backdrop-blur-xl border border-zinc-200/50 dark:border-white/10 rounded-xl p-5 flex flex-col shadow-[0_0_30px_rgba(0,0,0,0.08)] dark:shadow-[0_0_30px_rgba(255,255,255,0.02)]">
          <div className="flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <category.icon className="w-5 h-5" style={{ color: category.color }} />
              <h3 className="font-serif text-lg tracking-widest uppercase" style={{ color: category.color }}>{category.title}</h3>
            </div>
            <button onClick={() => isActiveSector && setIsFlipped(true)} className={`p-1.5 rounded-md transition-colors ${isActiveSector ? "hover:bg-zinc-200/50 dark:hover:bg-white/10 text-zinc-500" : "opacity-50 cursor-not-allowed text-zinc-300 dark:text-zinc-700"}`}>
              <Edit2 size={14} />
            </button>
          </div>
          
          {isWealth && wPhys ? (
            <div className="flex flex-col gap-2 flex-1 mt-6 justify-center">
              {[
                { label: "THE OXYGEN RATIO", sub: "Friction vs. Thrust", val: `${wPhys.oxygenRatio.toFixed(2)}%`, status: getWealthStatus(wPhys.oxygenRatio, "oxygen") },
                { label: "FREE CASH FLOW", sub: "Net Velocity", val: `$${wPhys.fcf.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, status: getWealthStatus(wPhys.fcf, "fcf") },
                { label: "RUIN RATIO", sub: "Capital Buffer", val: `${wPhys.ruinRatio.toFixed(2)}x`, status: getWealthStatus(wPhys.ruinRatio, "ruin") },
                { label: "ENTROPY RATE", sub: "Weighted Avg Interest", val: `${wPhys.entropyRate.toFixed(2)}%`, status: getWealthStatus(wPhys.entropyRate, "entropy") },
                { label: "MULTIPLIER", sub: "Assets / Debt", val: `${wPhys.multiplier.toFixed(2)}x`, status: getWealthStatus(wPhys.multiplier, "multiplier") },
              ].map(k => (
                <div key={k.label} className="flex justify-between items-center bg-zinc-50/50 dark:bg-white/5 p-2 rounded-lg border border-zinc-200/50 dark:border-white/5">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-900 dark:text-zinc-100">{k.label}</span>
                    <span className="text-[8px] tracking-widest uppercase text-zinc-500">{k.sub}</span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="font-mono text-xs font-medium text-zinc-900 dark:text-white">{k.val}</span>
                    <span className={`text-[9px] font-bold tracking-widest uppercase ${k.status.color}`}>{k.status.label}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : isHealth && hPhys ? (
            <div className="flex flex-col gap-2 flex-1 mt-6 justify-center">
              {[
                { label: "THE PROTEIN PAYLOAD", sub: "Tissue Preservation", val: `${hPhys.protein}g`, status: getHealthStatus(hPhys.protein, "protein") },
                { label: "THE ENERGY CAP", sub: "Fat + Carbs", val: `${hPhys.energy}g`, status: getHealthStatus(hPhys.energy, "energy") },
                { label: "FASTING INTEGRITY", sub: "13:00-19:00 Window", val: `${hPhys.fasting}h`, status: getHealthStatus(hPhys.fasting, "fasting") },
                { label: "SLEEP ARCHITECTURE", sub: "Cellular Repair", val: `${hPhys.sleep}h`, status: getHealthStatus(hPhys.sleep, "sleep") },
                { label: "STRENGTH RETENTION", sub: "Baseline vs Current", val: `${hPhys.strength}%`, status: getHealthStatus(hPhys.strength, "strength") },
              ].map(k => (
                <div key={k.label} className="flex justify-between items-center bg-zinc-50/50 dark:bg-white/5 p-2 rounded-lg border border-zinc-200/50 dark:border-white/5">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-900 dark:text-zinc-100">{k.label}</span>
                    <span className="text-[8px] tracking-widest uppercase text-zinc-500">{k.sub}</span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="font-mono text-xs font-medium text-zinc-900 dark:text-white">{k.val}</span>
                    <span className={`text-[9px] font-bold tracking-widest uppercase ${k.status.color}`}>{k.status.label}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : isRelate && rPhys ? (
            <div className="flex flex-col gap-2 flex-1 mt-6 justify-center">
              {[
                { label: "TIME TO REPAIR", sub: "Conflict Resolution", val: `${rPhys.ttr}h`, status: getRelateStatus(rPhys.ttr, "ttr") },
                { label: "THERMAL LOAD", sub: "Survival State", val: `${rPhys.thermalLoad.toFixed(2)}%`, status: getRelateStatus(rPhys.thermalLoad, "thermal") },
                { label: "SILENT EXECUTION", sub: "Cognitive Load Relief", val: `${rPhys.silentExec.toFixed(2)}%`, status: getRelateStatus(rPhys.silentExec, "silent") },
                { label: "THE ANCHOR DELTA", sub: "Structural Integrity", val: `${rPhys.frame} Breaks`, status: getRelateStatus(rPhys.frame, "frame") },
                { label: "ARMOR PERMEABILITY", sub: "Vulnerability Score", val: `${rPhys.armor}/10`, status: getRelateStatus(rPhys.armor, "armor") },
              ].map(k => (
                <div key={k.label} className="flex justify-between items-center bg-zinc-50/50 dark:bg-white/5 p-2 rounded-lg border border-zinc-200/50 dark:border-white/5">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-900 dark:text-zinc-100">{k.label}</span>
                    <span className="text-[8px] tracking-widest uppercase text-zinc-500">{k.sub}</span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="font-mono text-xs font-medium text-zinc-900 dark:text-white">{k.val}</span>
                    <span className={`text-[9px] font-bold tracking-widest uppercase ${k.status.color}`}>{k.status.label}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : isJoy && jPhys ? (
            <div className="flex flex-col gap-2 flex-1 mt-6 justify-center">
              {[
                { label: "AVATAR PRESENCE RATE", sub: "Deep Anchoring", val: `${jPhys.presence}/7 Days`, status: getJoyStatus(jPhys.presence, "presence") },
                { label: "19:00 HARD STOP", sub: "System Depressurization", val: `${jPhys.hardStop}/7 Days`, status: getJoyStatus(jPhys.hardStop, "hardstop") },
                { label: "WHITE SPACE INTEGRITY", sub: "Creative Buffer", val: `${jPhys.whitespace}h`, status: getJoyStatus(jPhys.whitespace, "whitespace") },
                { label: "THE DOOMSCROLL TRIPWIRE", sub: "System Exhaustion / Entropy", val: `${jPhys.doomscroll}h`, status: getJoyStatus(jPhys.doomscroll, "doomscroll") },
                { label: "$10/HR DELEGATION RATIO", sub: "Opportunity Cost Limit", val: `${jPhys.lowValue}h`, status: getJoyStatus(jPhys.lowValue, "lowvalue") },
              ].map(k => (
                <div key={k.label} className="flex justify-between items-center bg-zinc-50/50 dark:bg-white/5 p-2 rounded-lg border border-zinc-200/50 dark:border-white/5">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-900 dark:text-zinc-100">{k.label}</span>
                    <span className="text-[8px] tracking-widest uppercase text-zinc-500">{k.sub}</span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="font-mono text-xs font-medium text-zinc-900 dark:text-white">{k.val}</span>
                    <span className={`text-[9px] font-bold tracking-widest uppercase ${k.status.color}`}>{k.status.label}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : isCeo && cPhys ? (
            <div className="flex flex-col gap-2 flex-1 mt-6 justify-center">
              {[
                { label: "NET VELOCITY (FCF)", sub: "Capital Physics", val: `$${cPhys.fcf.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, status: getCeoStatus(cPhys.fcf, "fcf") },
                { label: "THE RUIN RATIO", sub: "Capital Buffer", val: `${cPhys.ruin.toFixed(1)}x`, status: getCeoStatus(cPhys.ruin, "ruin") },
                { label: "THE BUY-BACK RATE", sub: "Operational Leverage", val: `${cPhys.buyback.toFixed(1)}%`, status: getCeoStatus(cPhys.buyback, "buyback") },
                { label: "LOGIC ALIGNMENT", sub: "5 Guidelines", val: `${cPhys.logic.toFixed(1)}%`, status: getCeoStatus(cPhys.logic, "logic") },
                { label: "ARCHITECTURAL AUTONOMY", sub: "System Autonomy", val: `${cPhys.autonomy.toFixed(1)}%`, status: getCeoStatus(cPhys.autonomy, "autonomy") },
              ].map(k => (
                <div key={k.label} className="flex justify-between items-center bg-zinc-50/50 dark:bg-white/5 p-2 rounded-lg border border-zinc-200/50 dark:border-white/5">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-900 dark:text-zinc-100">{k.label}</span>
                    <span className="text-[8px] tracking-widest uppercase text-zinc-500">{k.sub}</span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="font-mono text-xs font-medium text-zinc-900 dark:text-white">{k.val}</span>
                    <span className={`text-[9px] font-bold tracking-widest uppercase ${k.status.color}`}>{k.status.label}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : isCoo && cooPhys ? (
            <div className="flex flex-col gap-2 flex-1 mt-6 justify-center">
              {[
                { label: "ACTIVE MISSION VELOCITY", sub: "Forward Momentum", val: `${cooPhys.velocity.toFixed(1)}%`, status: getCooStatus(cooPhys.velocity, "velocity") },
                { label: "CRITICAL EXCEPTION RATE", sub: "System Fragility", val: `${cooPhys.exception} Failures`, status: getCooStatus(cooPhys.exception, "exception") },
                { label: "QA FIDELITY SCORE", sub: "Design Integrity", val: `${cooPhys.qa.toFixed(1)}%`, status: getCooStatus(cooPhys.qa, "qa") },
                { label: "MTTR (BUG RESOLUTION)", sub: "Pipeline Friction", val: `${cooPhys.mttr.toFixed(1)} Hrs`, status: getCooStatus(cooPhys.mttr, "mttr") },
                { label: "SOP AUTONOMY", sub: "Hand-Off Readiness", val: `${cooPhys.sop.toFixed(1)}%`, status: getCooStatus(cooPhys.sop, "sop") },
              ].map(k => (
                <div key={k.label} className="flex justify-between items-center bg-zinc-50/50 dark:bg-white/5 p-2 rounded-lg border border-zinc-200/50 dark:border-white/5">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-900 dark:text-zinc-100">{k.label}</span>
                    <span className="text-[8px] tracking-widest uppercase text-zinc-500">{k.sub}</span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="font-mono text-xs font-medium text-zinc-900 dark:text-white">{k.val}</span>
                    <span className={`text-[9px] font-bold tracking-widest uppercase ${k.status.color}`}>{k.status.label}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 mt-4">
              <div className="text-[10px] tracking-[0.2em] uppercase text-zinc-500 mb-2">AWAITING DATA</div>
              <div className="font-serif text-sm text-zinc-400 dark:text-zinc-500 text-center px-4 leading-relaxed">
                This sector is offline.<br/>Focus strictly on<br/>active core systems.
              </div>
            </div>
          )}
        </div>

        {/* Back (Edit Mode) */}
        <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-zinc-50 dark:bg-[#0E0F14] border border-zinc-200/50 dark:border-white/10 rounded-xl p-5 flex flex-col shadow-[0_0_30px_rgba(0,0,0,0.08)] dark:shadow-[0_0_30px_rgba(255,255,255,0.02)]">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-200/50 dark:border-white/10 shrink-0">
            <h3 className="text-[10px] font-bold tracking-widest uppercase text-zinc-500">Update Metrics</h3>
            <button onClick={() => setIsFlipped(false)} className="p-1 rounded hover:bg-red-500/10 text-red-400">
              <X size={14} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 scrollbar-hide">
            {defs.map(d => (
              <div key={d.name} className="flex flex-col gap-1">
                <label className="text-[9px] tracking-widest uppercase text-zinc-600 dark:text-zinc-400">{d.name}</label>
                <input 
                  type="number" 
                  value={localVals[d.name] ?? ""} 
                  onChange={(e) => setLocalVals({...localVals, [d.name]: parseFloat(e.target.value) || 0})}
                  className="bg-white dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded p-1.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-[color:var(--theme-grad-start)] transition-colors"
                />
              </div>
            ))}
          </div>

          <button onClick={save} className="mt-3 w-full py-2 shrink-0 bg-[rgba(var(--theme-grad-start-rgb),0.1)] border border-[color:var(--theme-grad-start)]/30 rounded flex items-center justify-center gap-2 text-xs tracking-widest uppercase font-bold text-[color:var(--theme-grad-start)] hover:bg-[rgba(var(--theme-grad-start-rgb),0.2)] transition-colors">
            <Save size={12} /> Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default function KPIsPage() {
  const { data: session } = useSession();
  const user = session?.user;
  const calConnected = !!(session as any)?.accessToken;
  const [metrics, setMetrics] = useState<Metric[]>([]);

  const [activeTab, setActiveTab] = useState("KPI");
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);
  const [deepWork, setDeepWork] = useState(false);
  const [novaOpen, setNovaOpen] = useState(false);

  useEffect(() => {
    fetch("/api/metrics")
      .then(res => res.json())
      .then(data => {
        if (data.metrics) setMetrics(data.metrics);
      })
      .catch(console.error);
  }, []);

  const handleSave = async (metric: Metric) => {
    // Optimistic update
    setMetrics(prev => {
      const idx = prev.findIndex(m => m.id === metric.id && m.id !== undefined);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = metric;
        return next;
      }
      return [...prev, metric];
    });

    try {
      const res = await fetch("/api/metrics", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metric),
      });
      const data = await res.json();
      if (data.metric) {
        setMetrics(prev => {
          const idx = prev.findIndex(m => m.metricName === data.metric.metricName && m.category === data.metric.category);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = data.metric;
            return next;
          }
          return [...prev, data.metric];
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen text-zinc-900 dark:text-white flex flex-row">
      <style>{CSS_3D}</style>
      
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        calConnected={calConnected} 
        onCalToggle={() => calConnected ? signOut({ redirect: false }) : signIn("google")}
        isAppearanceOpen={isAppearanceOpen} 
        setIsAppearanceOpen={setIsAppearanceOpen} 
        activeTasksCount={0}
        activeSubtasksCount={0}
        tasksLoading={false}
        user={user}
        deepWork={deepWork}
        setDeepWork={setDeepWork}
        novaOpen={novaOpen}
        setNovaOpen={setNovaOpen}
      />

      <div className="flex-1 flex flex-col ml-64 min-w-0">
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-8">
          <div className="max-w-[1440px] mx-auto">
            
            <div className="mb-8 border-b border-zinc-200/50 dark:border-white/10 pb-4">
              <h1 className="text-2xl font-bold tracking-[0.1em] text-zinc-900 dark:text-white flex items-center gap-3">
                <Activity className="text-[color:var(--theme-grad-start)]" size={24} />
                GOVERNANCE ENGINE
              </h1>
              <p className="text-xs text-zinc-500 tracking-widest uppercase mt-2">Physics-based KPI tracking & Vital Signs</p>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-24">
              {CATEGORIES.map(cat => (
                <SectorCard key={cat.id} category={cat} allMetrics={metrics} onSave={handleSave} />
              ))}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
