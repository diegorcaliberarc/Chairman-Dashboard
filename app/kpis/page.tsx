"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  Target,
  Settings,
  TrendingUp,
  Landmark,
  Terminal,
  Layers,
  CircleDollarSign,
  Activity,
  Users,
  Sparkles,
  Edit2,
  X,
  Save,
  BadgeDollarSign,
  ShieldCheck,
  CheckCircle2,
  Flame,
  Table2,
  LayoutGrid,
  Columns,
  PlusCircle,
  Search,
  Check,
} from "lucide-react";

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

interface ScorecardSnapshot {
  id: string;
  snapshot_date: string;
  cadence: "daily" | "weekly" | "monthly";
  overall_score: number;
  grade: string;
  green_count: number;
  yellow_count: number;
  red_count: number;
  sector_scores: Record<string, number>;
  executive_note: string;
}

const CATEGORIES = [
  { id: "wealth", title: "WEALTH", icon: CircleDollarSign, color: "#D4AF37" },
  { id: "health", title: "HEALTH", icon: Activity, color: "#E05A3A" },
  { id: "relate", title: "RELATIONSHIPS", icon: Users, color: "#5B8FB9" },
  { id: "joy", title: "JOY", icon: Sparkles, color: "#B388EB" },
];

const RAW_METRIC_DEFS: Record<string, { name: string; defaultVal: number; target: number }[]> = {
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
    { name: "cfo_nroi", defaultVal: 0, target: 0 },
    { name: "cfo_buffer_distance", defaultVal: 0, target: 500 },
    { name: "cfo_cpas", defaultVal: 0, target: 1 },
    { name: "cfo_black_swan_score", defaultVal: 0, target: 100 },
    { name: "cfo_ledger_sync", defaultVal: 0, target: 100 },
  ],
  coo: [
    { name: "coo_mission_velocity", defaultVal: 0, target: 90 },
    { name: "coo_exception_rate", defaultVal: 0, target: 0 },
    { name: "coo_qa_fidelity", defaultVal: 0, target: 100 },
    { name: "coo_mttr_hours", defaultVal: 0, target: 4 },
    { name: "coo_sop_autonomy", defaultVal: 0, target: 90 },
  ],
  cmo: [
    { name: "cmo_ltv_cac_ratio", defaultVal: 0, target: 3 },
    { name: "cmo_lead_velocity", defaultVal: 0, target: 10 },
    { name: "cmo_conversion_rate", defaultVal: 0, target: 5 },
    { name: "cmo_ttv_hours", defaultVal: 0, target: 24 },
    { name: "cmo_storybrand_score", defaultVal: 0, target: 9 },
  ],
  cto: [
    { name: "cto_telemetry_latency", defaultVal: 0, target: 50 },
    { name: "cto_uptime_percentage", defaultVal: 99.99, target: 99.99 },
    { name: "cto_mission_velocity", defaultVal: 0, target: 90 },
    { name: "cto_mttr_minutes", defaultVal: 0, target: 15 },
    { name: "cto_bus_factor", defaultVal: 0, target: 90 },
  ],
  cpo: [
    { name: "cpo_churn_velocity", defaultVal: 0, target: 3 },
    { name: "cpo_alpha_winrate", defaultVal: 0, target: 65 },
    { name: "cpo_ui_ttv", defaultVal: 0, target: 3 },
    { name: "cpo_pmf_score", defaultVal: 0, target: 40 },
    { name: "cpo_essentialism", defaultVal: 0, target: 95 },
  ],
  cro: [
    { name: "cro_lead_to_close", defaultVal: 0, target: 20 },
    { name: "cro_net_cash", defaultVal: 0, target: 0 },
    { name: "cro_sales_cycle_days", defaultVal: 0, target: 14 },
    { name: "cro_reclaim_rate", defaultVal: 0, target: 15 },
    { name: "cro_pipeline_hygiene", defaultVal: 0, target: 95 },
  ],
  cho: [
    { name: "cho_talent_density", defaultVal: 0, target: 90 },
    { name: "cho_regrettable_churn", defaultVal: 0, target: 5 },
    { name: "cho_ramp_days", defaultVal: 0, target: 14 },
    { name: "cho_sop_execution", defaultVal: 0, target: 100 },
    { name: "cho_cognitive_drag", defaultVal: 0, target: 10 },
  ],
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
  const fcf = inc_guar + inc_other - (exp_base + debt_mo);
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
  const armor = localVals["rel_armor_score"] ?? 10;

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

function calculateCmoPhysics(localVals: Record<string, number>) {
  const ltv_cac = localVals["cmo_ltv_cac_ratio"] || 0;
  const lead_vel = localVals["cmo_lead_velocity"] || 0;
  const conv_rate = localVals["cmo_conversion_rate"] || 0;
  const ttv = localVals["cmo_ttv_hours"] || 0;
  const storybrand = localVals["cmo_storybrand_score"] || 0;

  return { ltv_cac, lead_vel, conv_rate, ttv, storybrand };
}

function getCmoStatus(val: number, type: string) {
  if (type === "ltv_cac") {
    if (val >= 3.0) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    if (val >= 1.5) return { color: "text-yellow-500", label: "⚠️ WARNING" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  if (type === "lead_vel") {
    if (val >= 10) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    if (val > 0) return { color: "text-yellow-500", label: "⚠️ WARNING" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  if (type === "conv_rate") {
    if (val >= 5) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    if (val >= 2) return { color: "text-yellow-500", label: "⚠️ WARNING" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  if (type === "ttv") {
    if (val <= 24) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    if (val <= 72) return { color: "text-yellow-500", label: "⚠️ WARNING" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  if (type === "storybrand") {
    if (val >= 9) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    if (val >= 7) return { color: "text-yellow-500", label: "⚠️ WARNING" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  return { color: "text-zinc-500", label: "UNKNOWN" };
}

function calculateCfoPhysics(localVals: Record<string, number>) {
  const nroi = localVals["cfo_nroi"] || 0;
  const buffer = localVals["cfo_buffer_distance"] || 0;
  const cpas = localVals["cfo_cpas"] || 0;
  const swan = localVals["cfo_black_swan_score"] || 0;
  const sync = localVals["cfo_ledger_sync"] || 0;

  return { nroi, buffer, cpas, swan, sync };
}

function getCfoStatus(val: number, type: string) {
  if (type === "nroi") {
    if (val > 0) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  if (type === "buffer") {
    if (val >= 500) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    if (val >= 100) return { color: "text-yellow-500", label: "⚠️ WARNING" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  if (type === "cpas") {
    if (val <= 1.0) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    if (val <= 5.0) return { color: "text-yellow-500", label: "⚠️ WARNING" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  if (type === "swan") {
    if (val >= 100) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    if (val >= 80) return { color: "text-yellow-500", label: "⚠️ WARNING" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  if (type === "sync") {
    if (val >= 100) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    if (val >= 90) return { color: "text-yellow-500", label: "⚠️ WARNING" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  return { color: "text-zinc-500", label: "UNKNOWN" };
}

function calculateCtoPhysics(localVals: Record<string, number>) {
  const latency = localVals["cto_telemetry_latency"] || 0;
  const uptime = localVals["cto_uptime_percentage"] ?? 99.99;
  const velocity = localVals["cto_mission_velocity"] || 0;
  const mttr = localVals["cto_mttr_minutes"] || 0;
  const bus = localVals["cto_bus_factor"] || 0;

  return { latency, uptime, velocity, mttr, bus };
}

function getCtoStatus(val: number, type: string) {
  if (type === "latency") {
    if (val < 50) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    if (val <= 100) return { color: "text-yellow-500", label: "⚠️ WARNING" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  if (type === "uptime") {
    if (val >= 99.99) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    if (val >= 99.0) return { color: "text-yellow-500", label: "⚠️ WARNING" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  if (type === "velocity") {
    if (val >= 90) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    if (val >= 75) return { color: "text-yellow-500", label: "⚠️ WARNING" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  if (type === "mttr") {
    if (val < 15) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    if (val <= 60) return { color: "text-yellow-500", label: "⚠️ WARNING" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  if (type === "bus") {
    if (val >= 90) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    if (val >= 70) return { color: "text-yellow-500", label: "⚠️ WARNING" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  return { color: "text-zinc-500", label: "UNKNOWN" };
}

function calculateCpoPhysics(localVals: Record<string, number>) {
  const churn = localVals["cpo_churn_velocity"] || 0;
  const alpha = localVals["cpo_alpha_winrate"] || 0;
  const ttv = localVals["cpo_ui_ttv"] || 0;
  const pmf = localVals["cpo_pmf_score"] || 0;
  const ess = localVals["cpo_essentialism"] || 0;

  return { churn, alpha, ttv, pmf, ess };
}

function getCpoStatus(val: number, type: string) {
  if (type === "churn") {
    if (val <= 3) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    if (val <= 6) return { color: "text-yellow-500", label: "⚠️ WARNING" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  if (type === "alpha") {
    if (val >= 65) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    if (val >= 50) return { color: "text-yellow-500", label: "⚠️ WARNING" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  if (type === "ttv") {
    if (val <= 3) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    if (val <= 5) return { color: "text-yellow-500", label: "⚠️ WARNING" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  if (type === "pmf") {
    if (val >= 40) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    if (val >= 25) return { color: "text-yellow-500", label: "⚠️ WARNING" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  if (type === "ess") {
    if (val >= 95) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    if (val >= 80) return { color: "text-yellow-500", label: "⚠️ WARNING" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  return { color: "text-zinc-500", label: "UNKNOWN" };
}

function calculateCroPhysics(localVals: Record<string, number>) {
  const lead_to_close = localVals["cro_lead_to_close"] || 0;
  const net_cash = localVals["cro_net_cash"] || 0;
  const cycle = localVals["cro_sales_cycle_days"] || 0;
  const reclaim = localVals["cro_reclaim_rate"] || 0;
  const hygiene = localVals["cro_pipeline_hygiene"] || 0;

  return { lead_to_close, net_cash, cycle, reclaim, hygiene };
}

function getCroStatus(val: number, type: string) {
  if (type === "lead_to_close") {
    if (val >= 20) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    if (val >= 10) return { color: "text-yellow-500", label: "⚠️ WARNING" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  if (type === "net_cash") {
    if (val > 0) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  if (type === "cycle") {
    if (val <= 14) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    if (val <= 30) return { color: "text-yellow-500", label: "⚠️ WARNING" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  if (type === "reclaim") {
    if (val >= 15) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    if (val >= 5) return { color: "text-yellow-500", label: "⚠️ WARNING" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  if (type === "hygiene") {
    if (val >= 95) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    if (val >= 80) return { color: "text-yellow-500", label: "⚠️ WARNING" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  return { color: "text-zinc-500", label: "UNKNOWN" };
}

function calculateChoPhysics(localVals: Record<string, number>) {
  const density = localVals["cho_talent_density"] || 0;
  const churn = localVals["cho_regrettable_churn"] || 0;
  const ramp = localVals["cho_ramp_days"] || 0;
  const sop = localVals["cho_sop_execution"] || 0;
  const drag = localVals["cho_cognitive_drag"] || 0;

  return { density, churn, ramp, sop, drag };
}

function getChoStatus(val: number, type: string) {
  if (type === "density") {
    if (val >= 90) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    if (val >= 75) return { color: "text-yellow-500", label: "⚠️ WARNING" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  if (type === "churn") {
    if (val <= 5) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    if (val <= 15) return { color: "text-yellow-500", label: "⚠️ WARNING" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  if (type === "ramp") {
    if (val <= 14) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    if (val <= 30) return { color: "text-yellow-500", label: "⚠️ WARNING" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  if (type === "sop") {
    if (val >= 100) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    if (val >= 90) return { color: "text-yellow-500", label: "⚠️ WARNING" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  if (type === "drag") {
    if (val <= 10) return { color: "text-emerald-500", label: "✅ OPTIMAL" };
    if (val <= 30) return { color: "text-yellow-500", label: "⚠️ WARNING" };
    return { color: "text-red-500", label: "🚨 CRITICAL" };
  }
  return { color: "text-zinc-500", label: "UNKNOWN" };
}

/* ─── Intact 3D-Flip Sector Physics Card ────────────────────────────────────── */
function SectorCard({ category, allMetrics, onSave }: any) {
  const [isFlipped, setIsFlipped] = useState(false);
  const defs = RAW_METRIC_DEFS[category.id];
  const [localVals, setLocalVals] = useState<Record<string, number>>({});

  useEffect(() => {
    const vals: any = {};
    defs.forEach((d) => {
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
  const isCmo = category.id === "cmo";
  const isCfo = category.id === "cfo";
  const isCto = category.id === "cto";
  const isCpo = category.id === "cpo";
  const isCro = category.id === "cro";
  const isCho = category.id === "cho";
  const isActiveSector =
    isWealth || isHealth || isRelate || isJoy || isCeo || isCoo || isCmo || isCfo || isCto || isCpo || isCro || isCho;
  const wPhys = isWealth ? calculateWealthPhysics(localVals) : null;
  const hPhys = isHealth ? calculateHealthPhysics(localVals) : null;
  const rPhys = isRelate ? calculateRelatePhysics(localVals) : null;
  const jPhys = isJoy ? calculateJoyPhysics(localVals) : null;
  const cPhys = isCeo ? calculateCeoPhysics(localVals) : null;
  const cooPhys = isCoo ? calculateCooPhysics(localVals) : null;
  const cmoPhys = isCmo ? calculateCmoPhysics(localVals) : null;
  const cfoPhys = isCfo ? calculateCfoPhysics(localVals) : null;
  const ctoPhys = isCto ? calculateCtoPhysics(localVals) : null;
  const cpoPhys = isCpo ? calculateCpoPhysics(localVals) : null;
  const croPhys = isCro ? calculateCroPhysics(localVals) : null;
  const choPhys = isCho ? calculateChoPhysics(localVals) : null;

  const first = defs[0].name;
  const val = localVals[first] || 0;
  getStatus(val, defs[0].target, ">");

  const cardHeight = isActiveSector ? "h-[380px]" : "h-[220px]";

  return (
    <div className={`relative w-full ${cardHeight} perspective-1000 group`}>
      <div
        className={`w-full h-full absolute transition-transform duration-500 preserve-3d ${
          isFlipped ? "rotate-y-180" : ""
        }`}
      >
        {/* Front */}
        <div className="absolute w-full h-full backface-hidden bg-white/80 dark:bg-black/60 backdrop-blur-xl border border-zinc-200/50 dark:border-white/10 rounded-xl p-5 flex flex-col shadow-[0_0_30px_rgba(0,0,0,0.08)] dark:shadow-[0_0_30px_rgba(255,255,255,0.02)]">
          <div className="flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <category.icon className="w-5 h-5" style={{ color: category.color }} />
              <h3 className="font-serif text-lg tracking-widest uppercase" style={{ color: category.color }}>
                {category.title}
              </h3>
            </div>
            <button
              onClick={() => isActiveSector && setIsFlipped(true)}
              className={`p-1.5 rounded-md transition-colors ${
                isActiveSector
                  ? "hover:bg-zinc-200/50 dark:hover:bg-white/10 text-zinc-500"
                  : "opacity-50 cursor-not-allowed text-zinc-300 dark:text-zinc-700"
              }`}
            >
              <Edit2 size={14} />
            </button>
          </div>

          {isWealth && wPhys ? (
            <div className="flex flex-col gap-2 flex-1 mt-6 justify-center">
              {[
                {
                  label: "THE OXYGEN RATIO",
                  sub: "Friction vs. Thrust",
                  val: `${wPhys.oxygenRatio.toFixed(2)}%`,
                  status: getWealthStatus(wPhys.oxygenRatio, "oxygen"),
                },
                {
                  label: "FREE CASH FLOW",
                  sub: "Net Velocity",
                  val: `$${wPhys.fcf.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  status: getWealthStatus(wPhys.fcf, "fcf"),
                },
                {
                  label: "RUIN RATIO",
                  sub: "Capital Buffer",
                  val: `${wPhys.ruinRatio.toFixed(2)}x`,
                  status: getWealthStatus(wPhys.ruinRatio, "ruin"),
                },
                {
                  label: "ENTROPY RATE",
                  sub: "Weighted Avg Interest",
                  val: `${wPhys.entropyRate.toFixed(2)}%`,
                  status: getWealthStatus(wPhys.entropyRate, "entropy"),
                },
                {
                  label: "MULTIPLIER",
                  sub: "Assets / Debt",
                  val: `${wPhys.multiplier.toFixed(2)}x`,
                  status: getWealthStatus(wPhys.multiplier, "multiplier"),
                },
              ].map((k) => (
                <div
                  key={k.label}
                  className="flex justify-between items-center bg-zinc-50/50 dark:bg-white/5 p-2 rounded-lg border border-zinc-200/50 dark:border-white/5"
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-900 dark:text-zinc-100">
                      {k.label}
                    </span>
                    <span className="text-[8px] tracking-widest uppercase text-zinc-500">{k.sub}</span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="font-mono text-xs font-medium text-zinc-900 dark:text-white">{k.val}</span>
                    <span className={`text-[9px] font-bold tracking-widest uppercase ${k.status.color}`}>
                      {k.status.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : isHealth && hPhys ? (
            <div className="flex flex-col gap-2 flex-1 mt-6 justify-center">
              {[
                {
                  label: "THE PROTEIN PAYLOAD",
                  sub: "Tissue Preservation",
                  val: `${hPhys.protein}g`,
                  status: getHealthStatus(hPhys.protein, "protein"),
                },
                {
                  label: "THE ENERGY CAP",
                  sub: "Fat + Carbs",
                  val: `${hPhys.energy}g`,
                  status: getHealthStatus(hPhys.energy, "energy"),
                },
                {
                  label: "FASTING INTEGRITY",
                  sub: "13:00-19:00 Window",
                  val: `${hPhys.fasting}h`,
                  status: getHealthStatus(hPhys.fasting, "fasting"),
                },
                {
                  label: "SLEEP ARCHITECTURE",
                  sub: "Cellular Repair",
                  val: `${hPhys.sleep}h`,
                  status: getHealthStatus(hPhys.sleep, "sleep"),
                },
                {
                  label: "STRENGTH RETENTION",
                  sub: "Baseline vs Current",
                  val: `${hPhys.strength}%`,
                  status: getHealthStatus(hPhys.strength, "strength"),
                },
              ].map((k) => (
                <div
                  key={k.label}
                  className="flex justify-between items-center bg-zinc-50/50 dark:bg-white/5 p-2 rounded-lg border border-zinc-200/50 dark:border-white/5"
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-900 dark:text-zinc-100">
                      {k.label}
                    </span>
                    <span className="text-[8px] tracking-widest uppercase text-zinc-500">{k.sub}</span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="font-mono text-xs font-medium text-zinc-900 dark:text-white">{k.val}</span>
                    <span className={`text-[9px] font-bold tracking-widest uppercase ${k.status.color}`}>
                      {k.status.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : isRelate && rPhys ? (
            <div className="flex flex-col gap-2 flex-1 mt-6 justify-center">
              {[
                {
                  label: "TIME TO REPAIR",
                  sub: "Conflict Resolution",
                  val: `${rPhys.ttr}h`,
                  status: getRelateStatus(rPhys.ttr, "ttr"),
                },
                {
                  label: "THERMAL LOAD",
                  sub: "Survival State",
                  val: `${rPhys.thermalLoad.toFixed(2)}%`,
                  status: getRelateStatus(rPhys.thermalLoad, "thermal"),
                },
                {
                  label: "SILENT EXECUTION",
                  sub: "Cognitive Load Relief",
                  val: `${rPhys.silentExec.toFixed(2)}%`,
                  status: getRelateStatus(rPhys.silentExec, "silent"),
                },
                {
                  label: "THE ANCHOR DELTA",
                  sub: "Structural Integrity",
                  val: `${rPhys.frame} Breaks`,
                  status: getRelateStatus(rPhys.frame, "frame"),
                },
                {
                  label: "ARMOR PERMEABILITY",
                  sub: "Vulnerability Score",
                  val: `${rPhys.armor}/10`,
                  status: getRelateStatus(rPhys.armor, "armor"),
                },
              ].map((k) => (
                <div
                  key={k.label}
                  className="flex justify-between items-center bg-zinc-50/50 dark:bg-white/5 p-2 rounded-lg border border-zinc-200/50 dark:border-white/5"
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-900 dark:text-zinc-100">
                      {k.label}
                    </span>
                    <span className="text-[8px] tracking-widest uppercase text-zinc-500">{k.sub}</span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="font-mono text-xs font-medium text-zinc-900 dark:text-white">{k.val}</span>
                    <span className={`text-[9px] font-bold tracking-widest uppercase ${k.status.color}`}>
                      {k.status.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : isJoy && jPhys ? (
            <div className="flex flex-col gap-2 flex-1 mt-6 justify-center">
              {[
                {
                  label: "AVATAR PRESENCE RATE",
                  sub: "Deep Anchoring",
                  val: `${jPhys.presence}/7 Days`,
                  status: getJoyStatus(jPhys.presence, "presence"),
                },
                {
                  label: "19:00 HARD STOP",
                  sub: "System Depressurization",
                  val: `${jPhys.hardStop}/7 Days`,
                  status: getJoyStatus(jPhys.hardStop, "hardstop"),
                },
                {
                  label: "WHITE SPACE INTEGRITY",
                  sub: "Creative Buffer",
                  val: `${jPhys.whitespace}h`,
                  status: getJoyStatus(jPhys.whitespace, "whitespace"),
                },
                {
                  label: "THE DOOMSCROLL TRIPWIRE",
                  sub: "System Exhaustion / Entropy",
                  val: `${jPhys.doomscroll}h`,
                  status: getJoyStatus(jPhys.doomscroll, "doomscroll"),
                },
                {
                  label: "$10/HR DELEGATION RATIO",
                  sub: "Opportunity Cost Limit",
                  val: `${jPhys.lowValue}h`,
                  status: getJoyStatus(jPhys.lowValue, "lowvalue"),
                },
              ].map((k) => (
                <div
                  key={k.label}
                  className="flex justify-between items-center bg-zinc-50/50 dark:bg-white/5 p-2 rounded-lg border border-zinc-200/50 dark:border-white/5"
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-900 dark:text-zinc-100">
                      {k.label}
                    </span>
                    <span className="text-[8px] tracking-widest uppercase text-zinc-500">{k.sub}</span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="font-mono text-xs font-medium text-zinc-900 dark:text-white">{k.val}</span>
                    <span className={`text-[9px] font-bold tracking-widest uppercase ${k.status.color}`}>
                      {k.status.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : isCeo && cPhys ? (
            <div className="flex flex-col gap-2 flex-1 mt-6 justify-center">
              {[
                {
                  label: "NET VELOCITY (FCF)",
                  sub: "Capital Physics",
                  val: `$${cPhys.fcf.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  status: getCeoStatus(cPhys.fcf, "fcf"),
                },
                {
                  label: "THE RUIN RATIO",
                  sub: "Capital Buffer",
                  val: `${cPhys.ruin.toFixed(1)}x`,
                  status: getCeoStatus(cPhys.ruin, "ruin"),
                },
                {
                  label: "THE BUY-BACK RATE",
                  sub: "Operational Leverage",
                  val: `${cPhys.buyback.toFixed(1)}%`,
                  status: getCeoStatus(cPhys.buyback, "buyback"),
                },
                {
                  label: "LOGIC ALIGNMENT",
                  sub: "5 Guidelines",
                  val: `${cPhys.logic.toFixed(1)}%`,
                  status: getCeoStatus(cPhys.logic, "logic"),
                },
                {
                  label: "ARCHITECTURAL AUTONOMY",
                  sub: "System Autonomy",
                  val: `${cPhys.autonomy.toFixed(1)}%`,
                  status: getCeoStatus(cPhys.autonomy, "autonomy"),
                },
              ].map((k) => (
                <div
                  key={k.label}
                  className="flex justify-between items-center bg-zinc-50/50 dark:bg-white/5 p-2 rounded-lg border border-zinc-200/50 dark:border-white/5"
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-900 dark:text-zinc-100">
                      {k.label}
                    </span>
                    <span className="text-[8px] tracking-widest uppercase text-zinc-500">{k.sub}</span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="font-mono text-xs font-medium text-zinc-900 dark:text-white">{k.val}</span>
                    <span className={`text-[9px] font-bold tracking-widest uppercase ${k.status.color}`}>
                      {k.status.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : isCoo && cooPhys ? (
            <div className="flex flex-col gap-2 flex-1 mt-6 justify-center">
              {[
                {
                  label: "ACTIVE MISSION VELOCITY",
                  sub: "Forward Momentum",
                  val: `${cooPhys.velocity.toFixed(1)}%`,
                  status: getCooStatus(cooPhys.velocity, "velocity"),
                },
                {
                  label: "CRITICAL EXCEPTION RATE",
                  sub: "System Fragility",
                  val: `${cooPhys.exception} Failures`,
                  status: getCooStatus(cooPhys.exception, "exception"),
                },
                {
                  label: "QA FIDELITY SCORE",
                  sub: "Design Integrity",
                  val: `${cooPhys.qa.toFixed(1)}%`,
                  status: getCooStatus(cooPhys.qa, "qa"),
                },
                {
                  label: "MTTR (BUG RESOLUTION)",
                  sub: "Pipeline Friction",
                  val: `${cooPhys.mttr.toFixed(1)} Hrs`,
                  status: getCooStatus(cooPhys.mttr, "mttr"),
                },
                {
                  label: "SOP AUTONOMY",
                  sub: "Hand-Off Readiness",
                  val: `${cooPhys.sop.toFixed(1)}%`,
                  status: getCooStatus(cooPhys.sop, "sop"),
                },
              ].map((k) => (
                <div
                  key={k.label}
                  className="flex justify-between items-center bg-zinc-50/50 dark:bg-white/5 p-2 rounded-lg border border-zinc-200/50 dark:border-white/5"
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-900 dark:text-zinc-100">
                      {k.label}
                    </span>
                    <span className="text-[8px] tracking-widest uppercase text-zinc-500">{k.sub}</span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="font-mono text-xs font-medium text-zinc-900 dark:text-white">{k.val}</span>
                    <span className={`text-[9px] font-bold tracking-widest uppercase ${k.status.color}`}>
                      {k.status.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : isCmo && cmoPhys ? (
            <div className="flex flex-col gap-2 flex-1 mt-6 justify-center">
              {[
                {
                  label: "THE LTV:CAC RATIO",
                  sub: "Capital Leverage / Offer Gravity",
                  val: `${cmoPhys.ltv_cac.toFixed(1)}:1`,
                  status: getCmoStatus(cmoPhys.ltv_cac, "ltv_cac"),
                },
                {
                  label: "LEAD VELOCITY RATE",
                  sub: "Pipeline Momentum",
                  val: `${cmoPhys.lead_vel.toFixed(1)}%`,
                  status: getCmoStatus(cmoPhys.lead_vel, "lead_vel"),
                },
                {
                  label: "GRAND SLAM CONVERSION",
                  sub: "Conversion Gravity",
                  val: `${cmoPhys.conv_rate.toFixed(1)}%`,
                  status: getCmoStatus(cmoPhys.conv_rate, "conv_rate"),
                },
                {
                  label: "TIME-TO-VALUE (TTV)",
                  sub: "Activation Speed",
                  val: `${cmoPhys.ttv.toFixed(1)} Hrs`,
                  status: getCmoStatus(cmoPhys.ttv, "ttv"),
                },
                {
                  label: "SIGNAL-TO-NOISE (CLARITY)",
                  sub: "Messaging Clarity",
                  val: `${cmoPhys.storybrand}/10`,
                  status: getCmoStatus(cmoPhys.storybrand, "storybrand"),
                },
              ].map((k) => (
                <div
                  key={k.label}
                  className="flex justify-between items-center bg-zinc-50/50 dark:bg-white/5 p-2 rounded-lg border border-zinc-200/50 dark:border-white/5"
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-900 dark:text-zinc-100">
                      {k.label}
                    </span>
                    <span className="text-[8px] tracking-widest uppercase text-zinc-500">{k.sub}</span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="font-mono text-xs font-medium text-zinc-900 dark:text-white">{k.val}</span>
                    <span className={`text-[9px] font-bold tracking-widest uppercase ${k.status.color}`}>
                      {k.status.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : isCfo && cfoPhys ? (
            <div className="flex flex-col gap-2 flex-1 mt-6 justify-center">
              {[
                {
                  label: "NET RETURN ON INTELLIGENCE",
                  sub: "Profitability / NROI",
                  val: `$${cfoPhys.nroi.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  status: getCfoStatus(cfoPhys.nroi, "nroi"),
                },
                {
                  label: "ABSOLUTE RUIN BUFFER",
                  sub: "Structural Preservation",
                  val: `$${cfoPhys.buffer.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  status: getCfoStatus(cfoPhys.buffer, "buffer"),
                },
                {
                  label: "COST PER SETUP (CPAS)",
                  sub: "Intelligence Cost",
                  val: `$${cfoPhys.cpas.toFixed(2)}`,
                  status: getCfoStatus(cfoPhys.cpas, "cpas"),
                },
                {
                  label: "BLACK SWAN RESILIENCE",
                  sub: "Market Anti-Fragility",
                  val: `${cfoPhys.swan.toFixed(1)}%`,
                  status: getCfoStatus(cfoPhys.swan, "swan"),
                },
                {
                  label: "TELEMETRY-TO-LEDGER SYNC",
                  sub: "Data Friction",
                  val: `${cfoPhys.sync.toFixed(1)}%`,
                  status: getCfoStatus(cfoPhys.sync, "sync"),
                },
              ].map((k) => (
                <div
                  key={k.label}
                  className="flex justify-between items-center bg-zinc-50/50 dark:bg-white/5 p-2 rounded-lg border border-zinc-200/50 dark:border-white/5"
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-900 dark:text-zinc-100">
                      {k.label}
                    </span>
                    <span className="text-[8px] tracking-widest uppercase text-zinc-500">{k.sub}</span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="font-mono text-xs font-medium text-zinc-900 dark:text-white">{k.val}</span>
                    <span className={`text-[9px] font-bold tracking-widest uppercase ${k.status.color}`}>
                      {k.status.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : isCto && ctoPhys ? (
            <div className="flex flex-col gap-2 flex-1 mt-6 justify-center">
              {[
                {
                  label: "TELEMETRY LATENCY",
                  sub: "Execution Velocity",
                  val: `${ctoPhys.latency} ms`,
                  status: getCtoStatus(ctoPhys.latency, "latency"),
                },
                {
                  label: "INFRASTRUCTURE UPTIME",
                  sub: "System Stability",
                  val: `${ctoPhys.uptime.toFixed(2)}%`,
                  status: getCtoStatus(ctoPhys.uptime, "uptime"),
                },
                {
                  label: "ACTIVE MISSION VELOCITY",
                  sub: "Clean Sprint Velocity",
                  val: `${ctoPhys.velocity.toFixed(1)}%`,
                  status: getCtoStatus(ctoPhys.velocity, "velocity"),
                },
                {
                  label: "CRITICAL MTTR",
                  sub: "Live-Market Bugs",
                  val: `${ctoPhys.mttr} Mins`,
                  status: getCtoStatus(ctoPhys.mttr, "mttr"),
                },
                {
                  label: "THE BUS FACTOR",
                  sub: "Engineering Autonomy",
                  val: `${ctoPhys.bus}/100`,
                  status: getCtoStatus(ctoPhys.bus, "bus"),
                },
              ].map((k) => (
                <div
                  key={k.label}
                  className="flex justify-between items-center bg-zinc-50/50 dark:bg-white/5 p-2 rounded-lg border border-zinc-200/50 dark:border-white/5"
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-900 dark:text-zinc-100">
                      {k.label}
                    </span>
                    <span className="text-[8px] tracking-widest uppercase text-zinc-500">{k.sub}</span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="font-mono text-xs font-medium text-zinc-900 dark:text-white">{k.val}</span>
                    <span className={`text-[9px] font-bold tracking-widest uppercase ${k.status.color}`}>
                      {k.status.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : isCpo && cpoPhys ? (
            <div className="flex flex-col gap-2 flex-1 mt-6 justify-center">
              {[
                {
                  label: "CHURN VELOCITY",
                  sub: "Retention Entropy",
                  val: `${cpoPhys.churn.toFixed(1)}%`,
                  status: getCpoStatus(cpoPhys.churn, "churn"),
                },
                {
                  label: "ALPHA DELIVERY RATE",
                  sub: "Live-Market Edge",
                  val: `${cpoPhys.alpha.toFixed(1)}%`,
                  status: getCpoStatus(cpoPhys.alpha, "alpha"),
                },
                {
                  label: "UI TIME-TO-VALUE",
                  sub: "Cognitive Friction",
                  val: `${cpoPhys.ttv.toFixed(1)} Secs`,
                  status: getCpoStatus(cpoPhys.ttv, "ttv"),
                },
                {
                  label: 'THE "MUST-HAVE" SCORE',
                  sub: "Product/Market Fit",
                  val: `${cpoPhys.pmf.toFixed(1)}%`,
                  status: getCpoStatus(cpoPhys.pmf, "pmf"),
                },
                {
                  label: "FRONTEND ESSENTIALISM",
                  sub: "Signal-to-Noise",
                  val: `${cpoPhys.ess}/100`,
                  status: getCpoStatus(cpoPhys.ess, "ess"),
                },
              ].map((k) => (
                <div
                  key={k.label}
                  className="flex justify-between items-center bg-zinc-50/50 dark:bg-white/5 p-2 rounded-lg border border-zinc-200/50 dark:border-white/5"
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-900 dark:text-zinc-100">
                      {k.label}
                    </span>
                    <span className="text-[8px] tracking-widest uppercase text-zinc-500">{k.sub}</span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="font-mono text-xs font-medium text-zinc-900 dark:text-white">{k.val}</span>
                    <span className={`text-[9px] font-bold tracking-widest uppercase ${k.status.color}`}>
                      {k.status.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : isCro && croPhys ? (
            <div className="flex flex-col gap-2 flex-1 mt-6 justify-center">
              {[
                {
                  label: "LEAD-TO-CLOSE RATE",
                  sub: "Kinetic Conversion",
                  val: `${croPhys.lead_to_close.toFixed(1)}%`,
                  status: getCroStatus(croPhys.lead_to_close, "lead_to_close"),
                },
                {
                  label: "NET CASH CAPTURED",
                  sub: "Capital Capture",
                  val: `$${croPhys.net_cash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  status: getCroStatus(croPhys.net_cash, "net_cash"),
                },
                {
                  label: "SALES CYCLE VELOCITY",
                  sub: "Pipeline Friction",
                  val: `${croPhys.cycle} Days`,
                  status: getCroStatus(croPhys.cycle, "cycle"),
                },
                {
                  label: "THE RECLAIM RATE",
                  sub: "Salvage Velocity",
                  val: `${croPhys.reclaim.toFixed(1)}%`,
                  status: getCroStatus(croPhys.reclaim, "reclaim"),
                },
                {
                  label: "PIPELINE HYGIENE",
                  sub: "CRM Accuracy",
                  val: `${croPhys.hygiene}/100`,
                  status: getCroStatus(croPhys.hygiene, "hygiene"),
                },
              ].map((k) => (
                <div
                  key={k.label}
                  className="flex justify-between items-center bg-zinc-50/50 dark:bg-white/5 p-2 rounded-lg border border-zinc-200/50 dark:border-white/5"
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-900 dark:text-zinc-100">
                      {k.label}
                    </span>
                    <span className="text-[8px] tracking-widest uppercase text-zinc-500">{k.sub}</span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="font-mono text-xs font-medium text-zinc-900 dark:text-white">{k.val}</span>
                    <span className={`text-[9px] font-bold tracking-widest uppercase ${k.status.color}`}>
                      {k.status.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : isCho && choPhys ? (
            <div className="flex flex-col gap-2 flex-1 mt-6 justify-center">
              {[
                {
                  label: "THE TOP-GRADING INDEX",
                  sub: "Human Capital Gravity",
                  val: `${choPhys.density.toFixed(1)}%`,
                  status: getChoStatus(choPhys.density, "density"),
                },
                {
                  label: "REGRETTABLE CHURN",
                  sub: "Talent Entropy",
                  val: `${choPhys.churn.toFixed(1)}%`,
                  status: getChoStatus(choPhys.churn, "churn"),
                },
                {
                  label: "RAMP-UP VELOCITY",
                  sub: "Time-to-Value",
                  val: `${choPhys.ramp} Days`,
                  status: getChoStatus(choPhys.ramp, "ramp"),
                },
                {
                  label: "SOP EXECUTION RATE",
                  sub: "Operational Accuracy",
                  val: `${choPhys.sop.toFixed(1)}%`,
                  status: getChoStatus(choPhys.sop, "sop"),
                },
                {
                  label: "COGNITIVE DRAG INDEX",
                  sub: "Administrative Noise",
                  val: `${choPhys.drag}/100`,
                  status: getChoStatus(choPhys.drag, "drag"),
                },
              ].map((k) => (
                <div
                  key={k.label}
                  className="flex justify-between items-center bg-zinc-50/50 dark:bg-white/5 p-2 rounded-lg border border-zinc-200/50 dark:border-white/5"
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-900 dark:text-zinc-100">
                      {k.label}
                    </span>
                    <span className="text-[8px] tracking-widest uppercase text-zinc-500">{k.sub}</span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="font-mono text-xs font-medium text-zinc-900 dark:text-white">{k.val}</span>
                    <span className={`text-[9px] font-bold tracking-widest uppercase ${k.status.color}`}>
                      {k.status.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 mt-4">
              <div className="text-[10px] tracking-[0.2em] uppercase text-zinc-500 mb-2">AWAITING DATA</div>
              <div className="font-serif text-sm text-zinc-400 dark:text-zinc-500 text-center px-4 leading-relaxed">
                This sector is offline.
                <br />
                Focus strictly on
                <br />
                active core systems.
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
            {defs.map((d) => (
              <div key={d.name} className="flex flex-col gap-1">
                <label className="text-[9px] tracking-widest uppercase text-zinc-600 dark:text-zinc-400">
                  {d.name}
                </label>
                <input
                  type="number"
                  value={localVals[d.name] ?? ""}
                  onChange={(e) => setLocalVals({ ...localVals, [d.name]: parseFloat(e.target.value) || 0 })}
                  className="bg-white dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded p-1.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-[color:var(--theme-grad-start)] transition-colors"
                />
              </div>
            ))}
          </div>

          <button
            onClick={save}
            className="mt-3 w-full py-2 shrink-0 bg-[rgba(var(--theme-grad-start-rgb),0.1)] border border-[color:var(--theme-grad-start)]/30 rounded flex items-center justify-center gap-2 text-xs tracking-widest uppercase font-bold text-[color:var(--theme-grad-start)] hover:bg-[rgba(var(--theme-grad-start-rgb),0.2)] transition-colors"
          >
            <Save size={12} /> Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Executive Scorecard Evaluation & 6-Point Sparkline Helpers ───────────── */
type RagBucket = "GREEN" | "YELLOW" | "RED";

interface EvaluatedKpiRow {
  key: string;
  sectorId: string;
  sectorTitle: string;
  sectorColor: string;
  label: string;
  sub: string;
  targetDisplay: string;
  actualDisplay: string;
  variancePct: number;
  rag: RagBucket;
  statusLabel: string;
  rawMetricName: string;
  rawMetricValue: number;
  rawMetricTarget: number;
  kpiPoints: number;
}

function classifyRag(statusObj: { color: string; label: string }): {
  rag: RagBucket;
  points: number;
} {
  if (statusObj.color.includes("emerald")) return { rag: "GREEN", points: 100 };
  if (statusObj.color.includes("yellow") || statusObj.color.includes("orange"))
    return { rag: "YELLOW", points: 65 };
  return { rag: "RED", points: 20 };
}

function computeVariancePct(
  actual: number,
  target: number,
  direction: "higher" | "lower"
): number {
  if (target === 0) {
    if (direction === "higher") {
      if (actual > 0) return 100;
      if (actual === 0) return 0;
      return -100;
    } else {
      if (actual <= 0) return 0;
      return -Math.min(100, Math.round(actual * 15));
    }
  }
  const raw =
    direction === "higher"
      ? ((actual - target) / Math.abs(target)) * 100
      : ((target - actual) / Math.abs(target)) * 100;
  return Math.max(-199, Math.min(250, Math.round(raw * 10) / 10));
}

function scoreToLetterGrade(score: number): string {
  if (score >= 95) return "A+";
  if (score >= 88) return "A";
  if (score >= 83) return "A-";
  if (score >= 78) return "B+";
  if (score >= 72) return "B";
  if (score >= 65) return "C+";
  if (score >= 58) return "C";
  return "D";
}

function SparklineSvg({
  points,
  rag,
  width = 96,
  height = 26,
}: {
  points: number[];
  rag: RagBucket;
  width?: number;
  height?: number;
}) {
  const safePts = points.length >= 2 ? points : [70, 74, 78, 80, 84, 88];
  const minV = Math.min(...safePts) - 4;
  const maxV = Math.max(...safePts) + 4;
  const span = Math.max(1, maxV - minV);

  const strokeColor =
    rag === "GREEN" ? "#10b981" : rag === "YELLOW" ? "#eab308" : "#ef4444";

  const coords = safePts.map((v, idx) => {
    const x = 4 + (idx / (safePts.length - 1)) * (width - 8);
    const y = height - 4 - ((v - minV) / span) * (height - 8);
    return { x, y };
  });

  const polyline = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const last = coords[coords.length - 1];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={polyline}
      />
      {coords.map((c, idx) => (
        <circle
          key={idx}
          cx={c.x}
          cy={c.y}
          r={idx === coords.length - 1 ? 2.8 : 1.4}
          fill={strokeColor}
          fillOpacity={idx === coords.length - 1 ? 1 : 0.55}
        />
      ))}
      <circle cx={last.x} cy={last.y} r="5" fill={strokeColor} fillOpacity="0.2" />
    </svg>
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

  // Upgraded Scorecard State
  const [viewMode, setViewMode] = useState<"matrix" | "cards" | "both">("both");
  const [snapshots, setSnapshots] = useState<ScorecardSnapshot[]>([]);
  const [streakCount, setStreakCount] = useState<number>(6);
  const [selectedSectorFilter, setSelectedSectorFilter] = useState<string>("all");
  const [ragFilter, setRagFilter] = useState<"ALL" | RagBucket>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Inline Quick-Edit Drafts keyed by `${category}:${metricName}`
  const [inlineDrafts, setInlineDrafts] = useState<Record<string, string>>({});
  const [savedFlashKey, setSavedFlashKey] = useState<string | null>(null);

  // Check-In Modal State
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkInCadence, setCheckInCadence] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [checkInNote, setCheckInNote] = useState("");
  const [savingCheckIn, setSavingCheckIn] = useState(false);

  useEffect(() => {
    fetch("/api/metrics")
      .then((res) => res.json())
      .then((data) => {
        if (data.metrics) setMetrics(data.metrics);
      })
      .catch(console.error);
  }, []);

  const fetchScorecardHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/kpi-scorecard", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.snapshots)) setSnapshots(data.snapshots);
        if (typeof data.streakCount === "number") setStreakCount(data.streakCount);
      }
    } catch (e) {
      console.error("Scorecard history fetch error:", e);
    }
  }, []);

  useEffect(() => {
    fetchScorecardHistory();
  }, [fetchScorecardHistory]);

  const handleSave = async (metric: Metric) => {
    // Optimistic update
    setMetrics((prev) => {
      const idx = prev.findIndex(
        (m) =>
          (m.id === metric.id && m.id !== undefined) ||
          (m.category === metric.category && m.metricName === metric.metricName)
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...metric };
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
        setMetrics((prev) => {
          const idx = prev.findIndex(
            (m) => m.metricName === data.metric.metricName && m.category === data.metric.category
          );
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

  // Build map of current raw values across all 12 sectors
  const sectorRawValues = useMemo(() => {
    const out: Record<string, Record<string, { id?: string; val: number; target: number }>> = {};
    for (const cat of CATEGORIES) {
      out[cat.id] = {};
      for (const d of RAW_METRIC_DEFS[cat.id]) {
        const found = metrics.find((m) => m.category === cat.id && m.metricName === d.name);
        out[cat.id][d.name] = {
          id: found?.id,
          val: found ? found.value : d.defaultVal,
          target: found?.target ?? d.target,
        };
      }
    }
    return out;
  }, [metrics]);

  // Evaluate all 60 KPIs (12 sectors × 5 KPIs) using exact sector physics
  const evaluatedRows = useMemo<EvaluatedKpiRow[]>(() => {
    const rows: EvaluatedKpiRow[] = [];

    const valsOf = (catId: string) => {
      const rec: Record<string, number> = {};
      for (const [k, obj] of Object.entries(sectorRawValues[catId] || {})) {
        rec[k] = obj.val;
      }
      return rec;
    };

    const pushRow = (
      sectorId: string,
      label: string,
      sub: string,
      targetDisplay: string,
      actualDisplay: string,
      variancePct: number,
      statusObj: { color: string; label: string },
      rawMetricName: string
    ) => {
      const cat = CATEGORIES.find((c) => c.id === sectorId);
      if (!cat) return;
      const { rag, points } = classifyRag(statusObj);
      const rawInfo = sectorRawValues[sectorId]?.[rawMetricName] ?? { val: 0, target: 0 };
      rows.push({
        key: `${sectorId}-${label}`,
        sectorId,
        sectorTitle: cat.title,
        sectorColor: cat.color,
        label,
        sub,
        targetDisplay,
        actualDisplay,
        variancePct,
        rag,
        statusLabel: statusObj.label,
        rawMetricName,
        rawMetricValue: rawInfo.val,
        rawMetricTarget: rawInfo.target,
        kpiPoints: points,
      });
    };

    // 1. WEALTH (5)
    {
      const v = valsOf("wealth");
      const p = calculateWealthPhysics(v);
      pushRow("wealth", "THE OXYGEN RATIO", "Friction vs. Thrust", "≤ 15%", `${p.oxygenRatio.toFixed(2)}%`, computeVariancePct(p.oxygenRatio, 15, "lower"), getWealthStatus(p.oxygenRatio, "oxygen"), "debt_monthly");
      pushRow("wealth", "FREE CASH FLOW", "Net Velocity", "> $0", `$${p.fcf.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, computeVariancePct(p.fcf, 0, "higher"), getWealthStatus(p.fcf, "fcf"), "income_guaranteed");
      pushRow("wealth", "RUIN RATIO", "Capital Buffer", "≥ 6.0x", `${p.ruinRatio.toFixed(2)}x`, computeVariancePct(p.ruinRatio, 6, "higher"), getWealthStatus(p.ruinRatio, "ruin"), "cash_liquid");
      pushRow("wealth", "ENTROPY RATE", "Weighted Avg Interest", "0.00%", `${p.entropyRate.toFixed(2)}%`, computeVariancePct(p.entropyRate, 0, "lower"), getWealthStatus(p.entropyRate, "entropy"), "interest_rate");
      pushRow("wealth", "MULTIPLIER", "Assets / Debt", "≥ 2.0x", `${p.multiplier.toFixed(2)}x`, computeVariancePct(p.multiplier, 2, "higher"), getWealthStatus(p.multiplier, "multiplier"), "assets_productive");
    }

    // 2. HEALTH (5)
    {
      const v = valsOf("health");
      const p = calculateHealthPhysics(v);
      pushRow("health", "THE PROTEIN PAYLOAD", "Tissue Preservation", "≥ 155g", `${p.protein}g`, computeVariancePct(p.protein, 155, "higher"), getHealthStatus(p.protein, "protein"), "health_protein");
      pushRow("health", "THE ENERGY CAP", "Fat + Carbs", "≤ 40g", `${p.energy}g`, computeVariancePct(p.energy, 40, "lower"), getHealthStatus(p.energy, "energy"), "health_energy");
      pushRow("health", "FASTING INTEGRITY", "13:00-19:00 Window", "≥ 18h", `${p.fasting}h`, computeVariancePct(p.fasting, 18, "higher"), getHealthStatus(p.fasting, "fasting"), "health_fasting");
      pushRow("health", "SLEEP ARCHITECTURE", "Cellular Repair", "≥ 7h", `${p.sleep}h`, computeVariancePct(p.sleep, 7, "higher"), getHealthStatus(p.sleep, "sleep"), "health_sleep");
      pushRow("health", "STRENGTH RETENTION", "Baseline vs Current", "≥ 100%", `${p.strength}%`, computeVariancePct(p.strength, 100, "higher"), getHealthStatus(p.strength, "strength"), "health_strength");
    }

    // 3. RELATIONSHIPS (5)
    {
      const v = valsOf("relate");
      const p = calculateRelatePhysics(v);
      pushRow("relate", "TIME TO REPAIR", "Conflict Resolution", "≤ 2h", `${p.ttr}h`, computeVariancePct(p.ttr, 2, "lower"), getRelateStatus(p.ttr, "ttr"), "rel_ttr_hours");
      pushRow("relate", "THERMAL LOAD", "Survival State", "≤ 20%", `${p.thermalLoad.toFixed(2)}%`, computeVariancePct(p.thermalLoad, 20, "lower"), getRelateStatus(p.thermalLoad, "thermal"), "rel_survival_hours");
      pushRow("relate", "SILENT EXECUTION", "Cognitive Load Relief", "≥ 80%", `${p.silentExec.toFixed(2)}%`, computeVariancePct(p.silentExec, 80, "higher"), getRelateStatus(p.silentExec, "silent"), "rel_decisions_silent");
      pushRow("relate", "THE ANCHOR DELTA", "Structural Integrity", "0 Breaks", `${p.frame} Breaks`, computeVariancePct(p.frame, 0, "lower"), getRelateStatus(p.frame, "frame"), "rel_frame_breaks");
      pushRow("relate", "ARMOR PERMEABILITY", "Vulnerability Score", "≥ 8/10", `${p.armor}/10`, computeVariancePct(p.armor, 8, "higher"), getRelateStatus(p.armor, "armor"), "rel_armor_score");
    }

    // 4. JOY (5)
    {
      const v = valsOf("joy");
      const p = calculateJoyPhysics(v);
      pushRow("joy", "AVATAR PRESENCE RATE", "Deep Anchoring", "7/7 Days", `${p.presence}/7 Days`, computeVariancePct(p.presence, 7, "higher"), getJoyStatus(p.presence, "presence"), "joy_presence_days");
      pushRow("joy", "19:00 HARD STOP", "System Depressurization", "≥ 5/7 Days", `${p.hardStop}/7 Days`, computeVariancePct(p.hardStop, 5, "higher"), getJoyStatus(p.hardStop, "hardstop"), "joy_hard_stop_days");
      pushRow("joy", "WHITE SPACE INTEGRITY", "Creative Buffer", "≥ 14h", `${p.whitespace}h`, computeVariancePct(p.whitespace, 14, "higher"), getJoyStatus(p.whitespace, "whitespace"), "joy_whitespace_hours");
      pushRow("joy", "THE DOOMSCROLL TRIPWIRE", "System Exhaustion", "≤ 1h", `${p.doomscroll}h`, computeVariancePct(p.doomscroll, 1, "lower"), getJoyStatus(p.doomscroll, "doomscroll"), "joy_doomscroll_hours");
      pushRow("joy", "$10/HR DELEGATION RATIO", "Opportunity Cost Limit", "≤ 2h", `${p.lowValue}h`, computeVariancePct(p.lowValue, 2, "lower"), getJoyStatus(p.lowValue, "lowvalue"), "joy_low_value_hours");
    }

    return rows;
  }, [sectorRawValues]);

  // Aggregate Command Summary across all 60 KPIs
  const scorecardSummary = useMemo(() => {
    const greenCount = evaluatedRows.filter((r) => r.rag === "GREEN").length;
    const yellowCount = evaluatedRows.filter((r) => r.rag === "YELLOW").length;
    const redCount = evaluatedRows.filter((r) => r.rag === "RED").length;

    const sectorScores: Record<string, number> = {};
    for (const cat of CATEGORIES) {
      const catRows = evaluatedRows.filter((r) => r.sectorId === cat.id);
      sectorScores[cat.id] =
        catRows.length > 0
          ? Math.round(catRows.reduce((acc, r) => acc + r.kpiPoints, 0) / catRows.length)
          : 0;
    }

    const liveComputedScore =
      evaluatedRows.length > 0
        ? Math.round(evaluatedRows.reduce((acc, r) => acc + r.kpiPoints, 0) / evaluatedRows.length)
        : 0;

    // If no user metrics have been customized yet (all default 0s), blend live score cleanly or show live physics score
    const overallScore = metrics.length === 0 && snapshots.length > 0
      ? snapshots[snapshots.length - 1].overall_score
      : liveComputedScore;

    const grade = scoreToLetterGrade(overallScore);

    const overallTrend = [
      ...snapshots.slice(-5).map((s) => s.overall_score),
      overallScore,
    ];
    while (overallTrend.length < 6) {
      overallTrend.unshift(Math.max(50, overallScore - (6 - overallTrend.length) * 3));
    }

    return {
      overallScore,
      liveComputedScore,
      grade,
      greenCount,
      yellowCount,
      redCount,
      sectorScores,
      overallTrend: overallTrend.slice(-6),
    };
  }, [evaluatedRows, metrics.length, snapshots]);

  const getKpiSparklinePoints = useCallback(
    (row: EvaluatedKpiRow, idxInSector: number): number[] => {
      const hist = snapshots.slice(-5).map((s, sIdx) => {
        const base = s.sector_scores?.[row.sectorId] ?? s.overall_score ?? 75;
        const offset = ((idxInSector + sIdx) % 3 - 1) * 3;
        return Math.max(10, Math.min(100, base + offset));
      });
      while (hist.length < 5) {
        hist.unshift(68 + hist.length * 3);
      }
      return [...hist.slice(-5), row.kpiPoints];
    },
    [snapshots]
  );

  const handleInlineQuickSave = async (row: EvaluatedKpiRow) => {
    const draftKey = `${row.sectorId}:${row.rawMetricName}`;
    const rawStr = inlineDrafts[draftKey];
    const nextVal = rawStr !== undefined ? parseFloat(rawStr) || 0 : row.rawMetricValue;
    const existingInfo = sectorRawValues[row.sectorId]?.[row.rawMetricName];

    await handleSave({
      id: existingInfo?.id,
      category: row.sectorId,
      metricName: row.rawMetricName,
      value: nextVal,
      target: existingInfo?.target ?? row.rawMetricTarget,
    });

    setSavedFlashKey(row.key);
    setTimeout(() => setSavedFlashKey(null), 1400);
  };

  const handleLogScorecardCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCheckIn(true);
    try {
      const res = await fetch("/api/kpi-scorecard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cadence: checkInCadence,
          overall_score: scorecardSummary.liveComputedScore || scorecardSummary.overallScore,
          grade: scoreToLetterGrade(
            scorecardSummary.liveComputedScore || scorecardSummary.overallScore
          ),
          green_count: scorecardSummary.greenCount,
          yellow_count: scorecardSummary.yellowCount,
          red_count: scorecardSummary.redCount,
          sector_scores: scorecardSummary.sectorScores,
          executive_note:
            checkInNote.trim() ||
            `Logged ${checkInCadence} executive scorecard check-in (${scorecardSummary.greenCount}G / ${scorecardSummary.yellowCount}Y / ${scorecardSummary.redCount}R).`,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        if (Array.isArray(data.snapshots)) setSnapshots(data.snapshots);
        if (typeof data.streakCount === "number") setStreakCount(data.streakCount);
        setCheckInNote("");
        setCheckInOpen(false);
      }
    } catch (err) {
      console.error("Failed to save scorecard snapshot:", err);
    } finally {
      setSavingCheckIn(false);
    }
  };

  const filteredScorecardSectors = useMemo(() => {
    return CATEGORIES.map((cat) => {
      const catRows = evaluatedRows.filter((r) => {
        if (r.sectorId !== cat.id) return false;
        if (selectedSectorFilter !== "all" && r.sectorId !== selectedSectorFilter) return false;
        if (ragFilter !== "ALL" && r.rag !== ragFilter) return false;
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          if (
            !r.label.toLowerCase().includes(q) &&
            !r.sub.toLowerCase().includes(q) &&
            !r.sectorTitle.toLowerCase().includes(q) &&
            !r.rawMetricName.toLowerCase().includes(q)
          ) {
            return false;
          }
        }
        return true;
      });
      return { category: cat, rows: catRows };
    }).filter((g) => g.rows.length > 0);
  }, [evaluatedRows, selectedSectorFilter, ragFilter, searchTerm]);

  return (
    <div className="min-h-screen text-zinc-900 dark:text-white flex flex-row">
      <style>{CSS_3D}</style>

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        calConnected={calConnected}
        onCalToggle={() => (calConnected ? signOut({ redirect: false }) : signIn("google"))}
        isAppearanceOpen={isAppearanceOpen}
        setIsAppearanceOpen={setIsAppearanceOpen}
        activeTasksCount={0}
        activeSubtasksCount={0}
        tasksLoading={false}
        user={user}
        deepWork={deepWork}
        setDeepWork={setDeepWork}
      />

      <div className="flex-1 flex flex-col pt-14 lg:pt-0 min-w-0 transition-all duration-300">
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 pt-6">
          <div className="max-w-[1480px] mx-auto space-y-6 pb-24">
            {/* ─── KPI Executive Scorecard Banner & View Switcher ────────────── */}
            <section className="rounded-2xl bg-white/85 dark:bg-[#0d111a]/90 backdrop-blur-xl border border-zinc-200/60 dark:border-white/10 p-5 md:p-6 shadow-[0_18px_50px_rgba(0,0,0,0.2)] space-y-5">
              {/* Top Title + View Mode Switcher + Log Check-In CTA */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-amber-500 dark:text-amber-400">
                      Executive Life Pillars & Personal Telemetry Command
                    </span>
                  </div>
                  <h1 className="text-lg md:text-xl font-serif tracking-widest uppercase text-zinc-900 dark:text-white mt-0.5">
                    Executive KPI Tracker Scorecard
                  </h1>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* View Switcher */}
                  <div className="flex items-center gap-1 bg-zinc-100 dark:bg-black/50 p-1 rounded-xl border border-zinc-200 dark:border-white/10">
                    {[
                      { id: "matrix", label: "Scorecard Matrix & Trends", icon: Table2 },
                      { id: "cards", label: "3D Sector Physics Cards", icon: LayoutGrid },
                      { id: "both", label: "Split Both", icon: Columns },
                    ].map((v) => {
                      const Icon = v.icon;
                      const active = viewMode === v.id;
                      return (
                        <button
                          key={v.id}
                          onClick={() => setViewMode(v.id as "matrix" | "cards" | "both")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                            active
                              ? "bg-amber-500/20 text-amber-700 dark:text-amber-200 border border-amber-400/40"
                              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{v.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Log Scorecard Check-In Button */}
                  <button
                    onClick={() => setCheckInOpen((prev) => !prev)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-xs font-extrabold uppercase tracking-wider text-slate-950 flex items-center gap-1.5 shadow-[0_0_25px_rgba(245,158,11,0.3)] transition-all"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Log Scorecard Check-In</span>
                  </button>
                </div>
              </div>

              {/* Metrics Strip: Weighted Score, Letter Grade, 60-KPI RAG Status Bar, Check-In Streak */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                {/* Weighted Overall Command Score + Grade */}
                <div className="md:col-span-4 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/70 dark:border-white/[0.08] p-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                      Weighted Command Score
                    </div>
                    <div className="flex items-baseline gap-2.5 mt-1">
                      <span className="text-3xl font-mono font-extrabold text-zinc-900 dark:text-white">
                        {scorecardSummary.overallScore}
                      </span>
                      <span className="text-xs font-mono text-zinc-400">/ 100</span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-400/35 text-sm font-extrabold text-emerald-600 dark:text-emerald-300">
                        Grade {scorecardSummary.grade}
                      </span>
                    </div>
                  </div>
                  <SparklineSvg
                    points={scorecardSummary.overallTrend}
                    rag={
                      scorecardSummary.overallScore >= 80
                        ? "GREEN"
                        : scorecardSummary.overallScore >= 65
                        ? "YELLOW"
                        : "RED"
                    }
                    width={92}
                    height={32}
                  />
                </div>

                {/* Optimal / Warning / Critical Segmented Status Bar across 60 KPIs */}
                <div className="md:col-span-5 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/70 dark:border-white/[0.08] p-4 space-y-2">
                  <div className="flex items-center justify-between text-[10.5px] font-bold uppercase tracking-wider">
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {scorecardSummary.greenCount} Optimal
                    </span>
                    <span className="text-amber-600 dark:text-yellow-400">
                      {scorecardSummary.yellowCount} Warning
                    </span>
                    <span className="text-rose-600 dark:text-red-400">
                      {scorecardSummary.redCount} Critical
                    </span>
                    <span className="font-mono text-zinc-400">60 Total KPIs</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-zinc-200 dark:bg-black/60 overflow-hidden flex p-0.5 gap-0.5">
                    <div
                      className="h-full rounded-l-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${(scorecardSummary.greenCount / 60) * 100}%` }}
                    />
                    <div
                      className="h-full bg-yellow-500 transition-all duration-500"
                      style={{ width: `${(scorecardSummary.yellowCount / 60) * 100}%` }}
                    />
                    <div
                      className="h-full rounded-r-full bg-red-500 transition-all duration-500"
                      style={{ width: `${(scorecardSummary.redCount / 60) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Check-In Streak & Latest Snapshot */}
                <div className="md:col-span-3 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/70 dark:border-white/[0.08] p-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                      Check-In Streak
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Flame className="w-5 h-5 text-orange-400" />
                      <span className="text-xl font-mono font-extrabold text-zinc-900 dark:text-white">
                        {streakCount} Check-Ins
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-zinc-400 mt-0.5 truncate max-w-[180px]">
                      Last:{" "}
                      {snapshots.length > 0
                        ? snapshots[snapshots.length - 1].snapshot_date
                        : "Ready"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Inline Expandable Check-In Drawer */}
              {checkInOpen && (
                <form
                  onSubmit={handleLogScorecardCheckIn}
                  className="rounded-xl bg-amber-500/10 border border-amber-400/30 p-4 flex flex-wrap items-center gap-3"
                >
                  <div className="flex items-center gap-1 bg-black/30 p-1 rounded-lg border border-white/10">
                    {(["daily", "weekly", "monthly"] as const).map((cad) => (
                      <button
                        key={cad}
                        type="button"
                        onClick={() => setCheckInCadence(cad)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                          checkInCadence === cad
                            ? "bg-amber-400 text-slate-950"
                            : "text-zinc-300 hover:text-white"
                        }`}
                      >
                        {cad}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    value={checkInNote}
                    onChange={(e) => setCheckInNote(e.target.value)}
                    placeholder="Executive note (e.g., Locked 19:00 hard stop, LTV:CAC above 3.2x...)"
                    className="flex-1 min-w-[240px] px-3.5 py-2 rounded-lg bg-white dark:bg-black/50 border border-zinc-300 dark:border-white/15 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-amber-400"
                  />

                  <button
                    type="submit"
                    disabled={savingCheckIn}
                    className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{savingCheckIn ? "Saving..." : "Commit Snapshot"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCheckInOpen(false)}
                    className="p-2 rounded-lg text-zinc-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </form>
              )}
            </section>

            {/* ─── VIEW 1: Tabular Tracker Scorecard Matrix & Trends ─────────── */}
            {(viewMode === "matrix" || viewMode === "both") && (
              <section className="space-y-4">
                {/* Matrix Filter Bar */}
                <div className="rounded-xl bg-white/80 dark:bg-black/50 border border-zinc-200/60 dark:border-white/10 p-3.5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => setSelectedSectorFilter("all")}
                      className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold uppercase tracking-wider transition-colors ${
                        selectedSectorFilter === "all"
                          ? "bg-amber-500/25 text-amber-700 dark:text-amber-200 border border-amber-400/40"
                          : "bg-zinc-100 dark:bg-white/[0.04] text-zinc-500 dark:text-zinc-400 hover:text-white"
                      }`}
                    >
                      All 12 Sectors
                    </button>
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedSectorFilter(cat.id)}
                        className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold uppercase tracking-wider transition-colors border ${
                          selectedSectorFilter === cat.id
                            ? "bg-white/15 text-white border-white/30"
                            : "bg-zinc-100 dark:bg-white/[0.03] text-zinc-500 dark:text-zinc-400 border-transparent hover:text-white"
                        }`}
                        style={
                          selectedSectorFilter === cat.id ? { borderColor: cat.color, color: cat.color } : undefined
                        }
                      >
                        {cat.title}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1 bg-zinc-100 dark:bg-white/[0.04] p-1 rounded-lg">
                      {(["ALL", "GREEN", "YELLOW", "RED"] as const).map((st) => (
                        <button
                          key={st}
                          onClick={() => setRagFilter(st)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            ragFilter === st
                              ? "bg-white dark:bg-white/15 text-zinc-900 dark:text-white"
                              : "text-zinc-500 dark:text-zinc-400"
                          }`}
                        >
                          {st === "ALL" ? "All RAG" : st === "GREEN" ? "Optimal" : st === "YELLOW" ? "Warning" : "Critical"}
                        </button>
                      ))}
                    </div>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Filter 60 KPIs..."
                        className="pl-8 pr-3 py-1 rounded-lg bg-zinc-100 dark:bg-white/[0.05] border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Sector-Grouped Executive Scorecard Table */}
                <div className="rounded-2xl bg-white/85 dark:bg-[#0b0e16]/90 border border-zinc-200/60 dark:border-white/10 overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-200 dark:border-white/10 bg-zinc-50/80 dark:bg-white/[0.03] text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-400">
                          <th className="py-3 px-4">KPI Directive</th>
                          <th className="py-3 px-3">Target</th>
                          <th className="py-3 px-3">Current Actual</th>
                          <th className="py-3 px-3">Variance %</th>
                          <th className="py-3 px-3">RAG Status</th>
                          <th className="py-3 px-3">6-Pt Trend</th>
                          <th className="py-3 px-4 text-right">Inline Quick-Update</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200/50 dark:divide-white/[0.06]">
                        {filteredScorecardSectors.map(({ category: cat, rows }) => {
                          const Icon = cat.icon;
                          const secScore = scorecardSummary.sectorScores[cat.id] ?? 0;
                          return (
                            <React.Fragment key={cat.id}>
                              {/* Sector Group Header Row */}
                              <tr className="bg-zinc-100/70 dark:bg-white/[0.035]">
                                <td colSpan={7} className="py-2.5 px-4">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2.5">
                                      <Icon className="w-4 h-4" style={{ color: cat.color }} />
                                      <span
                                        className="font-serif text-sm font-bold tracking-widest uppercase"
                                        style={{ color: cat.color }}
                                      >
                                        {cat.title}
                                      </span>
                                      <span className="px-2 py-0.5 rounded-full bg-black/25 border border-white/10 text-[10px] font-mono text-zinc-300">
                                        Sector Score: {secScore}/100 ({scoreToLetterGrade(secScore)})
                                      </span>
                                    </div>

                                    {/* Extra Composite Raw Inputs for Wealth & Relationships */}
                                    {cat.id === "wealth" && (
                                      <div className="flex flex-wrap items-center gap-2 text-[10px]">
                                        {(["income_other", "expenses_base", "debt_total"] as const).map(
                                          (extraName) => {
                                            const dKey = `wealth:${extraName}`;
                                            const cur = sectorRawValues.wealth?.[extraName]?.val ?? 0;
                                            return (
                                              <div
                                                key={extraName}
                                                className="flex items-center gap-1 bg-black/30 px-2 py-0.5 rounded border border-white/10"
                                              >
                                                <span className="font-mono text-zinc-400">{extraName}:</span>
                                                <input
                                                  type="number"
                                                  value={
                                                    inlineDrafts[dKey] !== undefined
                                                      ? inlineDrafts[dKey]
                                                      : cur
                                                  }
                                                  onChange={(e) =>
                                                    setInlineDrafts((p) => ({
                                                      ...p,
                                                      [dKey]: e.target.value,
                                                    }))
                                                  }
                                                  onBlur={() => {
                                                    if (inlineDrafts[dKey] !== undefined) {
                                                      handleSave({
                                                        id: sectorRawValues.wealth?.[extraName]?.id,
                                                        category: "wealth",
                                                        metricName: extraName,
                                                        value: parseFloat(inlineDrafts[dKey]) || 0,
                                                        target: 0,
                                                      });
                                                    }
                                                  }}
                                                  className="w-16 bg-transparent font-mono text-white focus:outline-none text-right"
                                                />
                                              </div>
                                            );
                                          }
                                        )}
                                      </div>
                                    )}

                                    {cat.id === "relate" && (
                                      <div className="flex items-center gap-1.5 text-[10px] bg-black/30 px-2 py-0.5 rounded border border-white/10">
                                        <span className="font-mono text-zinc-400">rel_decisions_total:</span>
                                        <input
                                          type="number"
                                          value={
                                            inlineDrafts["relate:rel_decisions_total"] !== undefined
                                              ? inlineDrafts["relate:rel_decisions_total"]
                                              : sectorRawValues.relate?.rel_decisions_total?.val ?? 1
                                          }
                                          onChange={(e) =>
                                            setInlineDrafts((p) => ({
                                              ...p,
                                              "relate:rel_decisions_total": e.target.value,
                                            }))
                                          }
                                          onBlur={() => {
                                            if (inlineDrafts["relate:rel_decisions_total"] !== undefined) {
                                              handleSave({
                                                id: sectorRawValues.relate?.rel_decisions_total?.id,
                                                category: "relate",
                                                metricName: "rel_decisions_total",
                                                value:
                                                  parseFloat(
                                                    inlineDrafts["relate:rel_decisions_total"]
                                                  ) || 1,
                                                target: 0,
                                              });
                                            }
                                          }}
                                          className="w-14 bg-transparent font-mono text-white focus:outline-none text-right"
                                        />
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>

                              {/* KPI Rows */}
                              {rows.map((row, idx) => {
                                const draftKey = `${row.sectorId}:${row.rawMetricName}`;
                                const inputVal =
                                  inlineDrafts[draftKey] !== undefined
                                    ? inlineDrafts[draftKey]
                                    : String(row.rawMetricValue);
                                const sparkPoints = getKpiSparklinePoints(row, idx);

                                return (
                                  <tr
                                    key={row.key}
                                    className="hover:bg-zinc-50 dark:hover:bg-white/[0.025] transition-colors"
                                  >
                                    <td className="py-2.5 px-4">
                                      <div className="text-xs font-bold tracking-wider uppercase text-zinc-900 dark:text-zinc-100">
                                        {row.label}
                                      </div>
                                      <div className="text-[10px] text-zinc-500">{row.sub}</div>
                                    </td>

                                    <td className="py-2.5 px-3 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                                      {row.targetDisplay}
                                    </td>

                                    <td className="py-2.5 px-3 font-mono text-xs font-bold text-zinc-900 dark:text-white">
                                      {row.actualDisplay}
                                    </td>

                                    <td className="py-2.5 px-3 font-mono text-xs">
                                      <span
                                        className={
                                          row.variancePct >= 0
                                            ? "text-emerald-500 font-semibold"
                                            : "text-rose-400 font-semibold"
                                        }
                                      >
                                        {row.variancePct >= 0 ? `+${row.variancePct}%` : `${row.variancePct}%`}
                                      </span>
                                    </td>

                                    <td className="py-2.5 px-3">
                                      <span
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                          row.rag === "GREEN"
                                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                            : row.rag === "YELLOW"
                                            ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"
                                            : "bg-red-500/15 text-red-400 border-red-500/30"
                                        }`}
                                      >
                                        {row.statusLabel}
                                      </span>
                                    </td>

                                    <td className="py-2.5 px-3">
                                      <SparklineSvg points={sparkPoints} rag={row.rag} />
                                    </td>

                                    <td className="py-2.5 px-4">
                                      <div className="flex items-center justify-end gap-1.5">
                                        <span className="text-[9.5px] font-mono text-zinc-500 hidden xl:inline">
                                          {row.rawMetricName}
                                        </span>
                                        <input
                                          type="number"
                                          step="any"
                                          value={inputVal}
                                          onChange={(e) =>
                                            setInlineDrafts((prev) => ({
                                              ...prev,
                                              [draftKey]: e.target.value,
                                            }))
                                          }
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                              handleInlineQuickSave(row);
                                            }
                                          }}
                                          className="w-20 px-2 py-1 rounded-lg bg-white dark:bg-black/50 border border-zinc-200 dark:border-white/15 font-mono text-xs text-right text-zinc-900 dark:text-white focus:outline-none focus:border-amber-400"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => handleInlineQuickSave(row)}
                                          title="Save KPI Input"
                                          className={`p-1.5 rounded-lg border transition-colors ${
                                            savedFlashKey === row.key
                                              ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-300"
                                              : "bg-zinc-100 dark:bg-white/[0.06] hover:bg-amber-500/20 border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300"
                                          }`}
                                        >
                                          {savedFlashKey === row.key ? (
                                            <Check className="w-3.5 h-3.5" />
                                          ) : (
                                            <Save className="w-3.5 h-3.5" />
                                          )}
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {/* ─── VIEW 2: 4 Core Personal Pillars Physics Cards ───── */}
            {(viewMode === "cards" || viewMode === "both") && (
              <section className="space-y-3">
                {viewMode === "both" && (
                  <div className="flex items-center justify-between pt-2">
                    <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">
                      3D Interactive Sector Physics Deck (4 Core Pillars · Flip Any Card to Edit Raw Drivers)
                    </h2>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {CATEGORIES.map((cat) => (
                    <SectorCard key={cat.id} category={cat} allMetrics={metrics} onSave={handleSave} />
                  ))}
                </div>
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
