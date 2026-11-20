import {
  SectorEvaluatedItem,
  SectorStatusBadge,
  computeVariancePct,
} from "../types";

const OPTIMAL: SectorStatusBadge = { color: "text-emerald-500", label: "✅ OPTIMAL" };
const WEAK: SectorStatusBadge = { color: "text-yellow-500", label: "⚠️ WEAK" };
const WARN: SectorStatusBadge = { color: "text-yellow-500", label: "⚠️ WARNING" };
const TOXIC: SectorStatusBadge = { color: "text-orange-500", label: "☢️ TOXIC" };
const CRITICAL: SectorStatusBadge = { color: "text-red-500", label: "🚨 CRITICAL" };

function formatUsd(val: number): string {
  return `$${val.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getWealthStatus(val: number, type: string): SectorStatusBadge {
  if (type === "oxygen") {
    if (val <= 15) return OPTIMAL;
    if (val <= 25) return WEAK;
    if (val <= 40) return TOXIC;
    return CRITICAL;
  }
  if (type === "fcf") {
    if (val > 0) return OPTIMAL;
    if (val === 0) return WEAK;
    if (val > -1000) return TOXIC;
    return CRITICAL;
  }
  if (type === "ruin") {
    if (val >= 6.0) return OPTIMAL;
    if (val >= 3.0) return WEAK;
    if (val >= 1.0) return TOXIC;
    return CRITICAL;
  }
  if (type === "entropy") {
    if (val <= 0) return OPTIMAL;
    if (val <= 5) return WEAK;
    if (val <= 12) return TOXIC;
    return CRITICAL;
  }
  if (val >= 2.0) return OPTIMAL;
  if (val >= 1.0) return WEAK;
  if (val >= 0.5) return TOXIC;
  return CRITICAL;
}

function getHealthStatus(val: number, type: string): SectorStatusBadge {
  if (type === "protein") {
    if (val >= 155) return OPTIMAL;
    if (val >= 140) return WARN;
    return CRITICAL;
  }
  if (type === "energy") return val <= 40 ? OPTIMAL : CRITICAL;
  if (type === "fasting") return val >= 18 ? OPTIMAL : CRITICAL;
  if (type === "sleep") {
    if (val >= 7) return OPTIMAL;
    if (val >= 6) return WARN;
    return CRITICAL;
  }
  if (val >= 100) return OPTIMAL;
  if (val >= 90) return WARN;
  return CRITICAL;
}

function getRelateStatus(val: number, type: string): SectorStatusBadge {
  if (type === "ttr") {
    if (val <= 2) return OPTIMAL;
    if (val <= 23) return WARN;
    return CRITICAL;
  }
  if (type === "thermal") return val <= 20 ? OPTIMAL : CRITICAL;
  if (type === "silent") {
    if (val >= 80) return OPTIMAL;
    if (val >= 50) return WARN;
    return CRITICAL;
  }
  if (type === "frame") {
    if (val === 0) return OPTIMAL;
    if (val === 1) return WARN;
    return CRITICAL;
  }
  if (val >= 8) return OPTIMAL;
  if (val >= 5) return WARN;
  return CRITICAL;
}

function getJoyStatus(val: number, type: string): SectorStatusBadge {
  if (type === "presence") {
    if (val === 7) return OPTIMAL;
    if (val >= 4) return WARN;
    return CRITICAL;
  }
  if (type === "hardstop") {
    if (val >= 5) return OPTIMAL;
    if (val >= 3) return WARN;
    return CRITICAL;
  }
  if (type === "whitespace") {
    if (val >= 14) return OPTIMAL;
    if (val >= 8) return WARN;
    return CRITICAL;
  }
  if (type === "doomscroll") return val <= 1 ? OPTIMAL : CRITICAL;
  if (val <= 2) return OPTIMAL;
  if (val <= 5) return WARN;
  return CRITICAL;
}

export function evaluatePersonalSector(
  sectorId: string,
  vals: Record<string, number>
): SectorEvaluatedItem[] | null {
  if (sectorId === "wealth") {
    const incGuar = vals.income_guaranteed || 1;
    const incOther = vals.income_other || 0;
    const expBase = vals.expenses_base || 1;
    const debtMo = vals.debt_monthly || 0;
    const debtTot = vals.debt_total || 1;
    const cash = vals.cash_liquid || 0;
    const assets = vals.assets_productive || 0;
    const intRate = vals.interest_rate || 0;

    const oxygenRatio = (debtMo / incGuar) * 100;
    const fcf = incGuar + incOther - (expBase + debtMo);
    const burn = expBase + debtMo || 1;
    const ruinRatio = cash / burn;
    const multiplier = assets / debtTot;

    return [
      {
        label: "THE OXYGEN RATIO",
        sub: "Friction vs. Thrust",
        targetDisplay: "≤ 15%",
        actualDisplay: `${oxygenRatio.toFixed(2)}%`,
        variancePct: computeVariancePct(oxygenRatio, 15, "lower"),
        status: getWealthStatus(oxygenRatio, "oxygen"),
        rawMetricName: "debt_monthly",
      },
      {
        label: "FREE CASH FLOW",
        sub: "Net Velocity",
        targetDisplay: "> $0",
        actualDisplay: formatUsd(fcf),
        variancePct: computeVariancePct(fcf, 0, "higher"),
        status: getWealthStatus(fcf, "fcf"),
        rawMetricName: "income_guaranteed",
      },
      {
        label: "RUIN RATIO",
        sub: "Capital Buffer",
        targetDisplay: "≥ 6.0x",
        actualDisplay: `${ruinRatio.toFixed(2)}x`,
        variancePct: computeVariancePct(ruinRatio, 6, "higher"),
        status: getWealthStatus(ruinRatio, "ruin"),
        rawMetricName: "cash_liquid",
      },
      {
        label: "ENTROPY RATE",
        sub: "Weighted Avg Interest",
        targetDisplay: "0.00%",
        actualDisplay: `${intRate.toFixed(2)}%`,
        variancePct: computeVariancePct(intRate, 0, "lower"),
        status: getWealthStatus(intRate, "entropy"),
        rawMetricName: "interest_rate",
      },
      {
        label: "MULTIPLIER",
        sub: "Assets / Debt",
        targetDisplay: "≥ 2.0x",
        actualDisplay: `${multiplier.toFixed(2)}x`,
        variancePct: computeVariancePct(multiplier, 2, "higher"),
        status: getWealthStatus(multiplier, "multiplier"),
        rawMetricName: "assets_productive",
      },
    ];
  }

  if (sectorId === "health") {
    const protein = vals.health_protein || 0;
    const energy = vals.health_energy || 0;
    const fasting = vals.health_fasting || 0;
    const sleep = vals.health_sleep || 0;
    const strength = vals.health_strength || 0;

    return [
      {
        label: "THE PROTEIN PAYLOAD",
        sub: "Tissue Preservation",
        targetDisplay: "≥ 155g",
        actualDisplay: `${protein}g`,
        variancePct: computeVariancePct(protein, 155, "higher"),
        status: getHealthStatus(protein, "protein"),
        rawMetricName: "health_protein",
      },
      {
        label: "THE ENERGY CAP",
        sub: "Fat + Carbs",
        targetDisplay: "≤ 40g",
        actualDisplay: `${energy}g`,
        variancePct: computeVariancePct(energy, 40, "lower"),
        status: getHealthStatus(energy, "energy"),
        rawMetricName: "health_energy",
      },
      {
        label: "FASTING INTEGRITY",
        sub: "13:00-19:00 Window",
        targetDisplay: "≥ 18h",
        actualDisplay: `${fasting}h`,
        variancePct: computeVariancePct(fasting, 18, "higher"),
        status: getHealthStatus(fasting, "fasting"),
        rawMetricName: "health_fasting",
      },
      {
        label: "SLEEP ARCHITECTURE",
        sub: "Cellular Repair",
        targetDisplay: "≥ 7h",
        actualDisplay: `${sleep}h`,
        variancePct: computeVariancePct(sleep, 7, "higher"),
        status: getHealthStatus(sleep, "sleep"),
        rawMetricName: "health_sleep",
      },
      {
        label: "STRENGTH RETENTION",
        sub: "Baseline vs Current",
        targetDisplay: "≥ 100%",
        actualDisplay: `${strength}%`,
        variancePct: computeVariancePct(strength, 100, "higher"),
        status: getHealthStatus(strength, "strength"),
        rawMetricName: "health_strength",
      },
    ];
  }

  if (sectorId === "relate") {
    const ttr = vals.rel_ttr_hours || 0;
    const survival = vals.rel_survival_hours || 0;
    const decTot = vals.rel_decisions_total || 1;
    const decSil = vals.rel_decisions_silent || 0;
    const frame = vals.rel_frame_breaks || 0;
    const armor = vals.rel_armor_score ?? 10;
    const thermalLoad = (survival / 168) * 100;
    const silentExec = (decSil / decTot) * 100;

    return [
      {
        label: "TIME TO REPAIR",
        sub: "Conflict Resolution",
        targetDisplay: "≤ 2h",
        actualDisplay: `${ttr}h`,
        variancePct: computeVariancePct(ttr, 2, "lower"),
        status: getRelateStatus(ttr, "ttr"),
        rawMetricName: "rel_ttr_hours",
      },
      {
        label: "THERMAL LOAD",
        sub: "Survival State",
        targetDisplay: "≤ 20%",
        actualDisplay: `${thermalLoad.toFixed(2)}%`,
        variancePct: computeVariancePct(thermalLoad, 20, "lower"),
        status: getRelateStatus(thermalLoad, "thermal"),
        rawMetricName: "rel_survival_hours",
      },
      {
        label: "SILENT EXECUTION",
        sub: "Cognitive Load Relief",
        targetDisplay: "≥ 80%",
        actualDisplay: `${silentExec.toFixed(2)}%`,
        variancePct: computeVariancePct(silentExec, 80, "higher"),
        status: getRelateStatus(silentExec, "silent"),
        rawMetricName: "rel_decisions_silent",
      },
      {
        label: "THE ANCHOR DELTA",
        sub: "Structural Integrity",
        targetDisplay: "0 Breaks",
        actualDisplay: `${frame} Breaks`,
        variancePct: computeVariancePct(frame, 0, "lower"),
        status: getRelateStatus(frame, "frame"),
        rawMetricName: "rel_frame_breaks",
      },
      {
        label: "ARMOR PERMEABILITY",
        sub: "Vulnerability Score",
        targetDisplay: "≥ 8/10",
        actualDisplay: `${armor}/10`,
        variancePct: computeVariancePct(armor, 8, "higher"),
        status: getRelateStatus(armor, "armor"),
        rawMetricName: "rel_armor_score",
      },
    ];
  }

  if (sectorId === "joy") {
    const presence = vals.joy_presence_days || 0;
    const hardStop = vals.joy_hard_stop_days || 0;
    const whitespace = vals.joy_whitespace_hours || 0;
    const doomscroll = vals.joy_doomscroll_hours || 0;
    const lowValue = vals.joy_low_value_hours || 0;

    return [
      {
        label: "AVATAR PRESENCE RATE",
        sub: "Deep Anchoring",
        targetDisplay: "7/7 Days",
        actualDisplay: `${presence}/7 Days`,
        variancePct: computeVariancePct(presence, 7, "higher"),
        status: getJoyStatus(presence, "presence"),
        rawMetricName: "joy_presence_days",
      },
      {
        label: "19:00 HARD STOP",
        sub: "System Depressurization",
        targetDisplay: "≥ 5/7 Days",
        actualDisplay: `${hardStop}/7 Days`,
        variancePct: computeVariancePct(hardStop, 5, "higher"),
        status: getJoyStatus(hardStop, "hardstop"),
        rawMetricName: "joy_hard_stop_days",
      },
      {
        label: "WHITE SPACE INTEGRITY",
        sub: "Creative Buffer",
        targetDisplay: "≥ 14h",
        actualDisplay: `${whitespace}h`,
        variancePct: computeVariancePct(whitespace, 14, "higher"),
        status: getJoyStatus(whitespace, "whitespace"),
        rawMetricName: "joy_whitespace_hours",
      },
      {
        label: "THE DOOMSCROLL TRIPWIRE",
        sub: "System Exhaustion / Entropy",
        targetDisplay: "≤ 1h",
        actualDisplay: `${doomscroll}h`,
        variancePct: computeVariancePct(doomscroll, 1, "lower"),
        status: getJoyStatus(doomscroll, "doomscroll"),
        rawMetricName: "joy_doomscroll_hours",
      },
      {
        label: "$10/HR DELEGATION RATIO",
        sub: "Opportunity Cost Limit",
        targetDisplay: "≤ 2h",
        actualDisplay: `${lowValue}h`,
        variancePct: computeVariancePct(lowValue, 2, "lower"),
        status: getJoyStatus(lowValue, "lowvalue"),
        rawMetricName: "joy_low_value_hours",
      },
    ];
  }

  return null;
}
