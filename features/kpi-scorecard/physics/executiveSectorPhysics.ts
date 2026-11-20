import {
  SectorEvaluatedItem,
  SectorStatusBadge,
  computeVariancePct,
} from "../types";
import { evaluatePersonalSector } from "./personalSectorPhysics";

const OPTIMAL: SectorStatusBadge = { color: "text-emerald-500", label: "✅ OPTIMAL" };
const WARN: SectorStatusBadge = { color: "text-yellow-500", label: "⚠️ WARNING" };
const CRITICAL: SectorStatusBadge = { color: "text-red-500", label: "🚨 CRITICAL" };

function bandHigher(val: number, optMin: number, warnMin?: number): SectorStatusBadge {
  if (val >= optMin) return OPTIMAL;
  if (warnMin !== undefined && val >= warnMin) return WARN;
  return CRITICAL;
}

function bandLower(val: number, optMax: number, warnMax?: number): SectorStatusBadge {
  if (val <= optMax) return OPTIMAL;
  if (warnMax !== undefined && val <= warnMax) return WARN;
  return CRITICAL;
}

function formatUsd(val: number): string {
  return `$${val.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function evaluateExecutiveSector(
  sectorId: string,
  vals: Record<string, number>
): SectorEvaluatedItem[] | null {
  switch (sectorId) {
    case "ceo": {
      const fcf = vals.ceo_fcf || 0;
      const ruin = vals.ceo_ruin_buffer || 0;
      const buyback = vals.ceo_buyback_rate || 0;
      const logic = vals.ceo_logic_alignment || 0;
      const autonomy = vals.ceo_autonomy_score || 0;
      return [
        { label: "NET VELOCITY (FCF)", sub: "Capital Physics", targetDisplay: "> $0", actualDisplay: formatUsd(fcf), variancePct: computeVariancePct(fcf, 0, "higher"), status: fcf > 0 ? OPTIMAL : CRITICAL, rawMetricName: "ceo_fcf" },
        { label: "THE RUIN RATIO", sub: "Capital Buffer", targetDisplay: "≥ 10.0x", actualDisplay: `${ruin.toFixed(1)}x`, variancePct: computeVariancePct(ruin, 10, "higher"), status: bandHigher(ruin, 10, 4), rawMetricName: "ceo_ruin_buffer" },
        { label: "THE BUY-BACK RATE", sub: "Operational Leverage", targetDisplay: "≥ 80%", actualDisplay: `${buyback.toFixed(1)}%`, variancePct: computeVariancePct(buyback, 80, "higher"), status: bandHigher(buyback, 80, 50), rawMetricName: "ceo_buyback_rate" },
        { label: "LOGIC ALIGNMENT", sub: "5 Guidelines", targetDisplay: "100%", actualDisplay: `${logic.toFixed(1)}%`, variancePct: computeVariancePct(logic, 100, "higher"), status: bandHigher(logic, 100), rawMetricName: "ceo_logic_alignment" },
        { label: "ARCHITECTURAL AUTONOMY", sub: "System Autonomy", targetDisplay: "≥ 80%", actualDisplay: `${autonomy.toFixed(1)}%`, variancePct: computeVariancePct(autonomy, 80, "higher"), status: bandHigher(autonomy, 80, 50), rawMetricName: "ceo_autonomy_score" },
      ];
    }
    case "coo": {
      const vel = vals.coo_mission_velocity || 0;
      const exc = vals.coo_exception_rate || 0;
      const qa = vals.coo_qa_fidelity || 0;
      const mttr = vals.coo_mttr_hours || 0;
      const sop = vals.coo_sop_autonomy || 0;
      return [
        { label: "ACTIVE MISSION VELOCITY", sub: "Forward Momentum", targetDisplay: "≥ 90%", actualDisplay: `${vel.toFixed(1)}%`, variancePct: computeVariancePct(vel, 90, "higher"), status: bandHigher(vel, 90, 75), rawMetricName: "coo_mission_velocity" },
        { label: "CRITICAL EXCEPTION RATE", sub: "System Fragility", targetDisplay: "0 Failures", actualDisplay: `${exc} Failures`, variancePct: computeVariancePct(exc, 0, "lower"), status: exc === 0 ? OPTIMAL : CRITICAL, rawMetricName: "coo_exception_rate" },
        { label: "QA FIDELITY SCORE", sub: "Design Integrity", targetDisplay: "100%", actualDisplay: `${qa.toFixed(1)}%`, variancePct: computeVariancePct(qa, 100, "higher"), status: bandHigher(qa, 100), rawMetricName: "coo_qa_fidelity" },
        { label: "MTTR (BUG RESOLUTION)", sub: "Pipeline Friction", targetDisplay: "≤ 4.0 Hrs", actualDisplay: `${mttr.toFixed(1)} Hrs`, variancePct: computeVariancePct(mttr, 4, "lower"), status: bandLower(mttr, 4, 12), rawMetricName: "coo_mttr_hours" },
        { label: "SOP AUTONOMY", sub: "Hand-Off Readiness", targetDisplay: "≥ 90%", actualDisplay: `${sop.toFixed(1)}%`, variancePct: computeVariancePct(sop, 90, "higher"), status: bandHigher(sop, 90, 70), rawMetricName: "coo_sop_autonomy" },
      ];
    }
    case "cmo": {
      const ltv = vals.cmo_ltv_cac_ratio || 0;
      const lead = vals.cmo_lead_velocity || 0;
      const conv = vals.cmo_conversion_rate || 0;
      const ttv = vals.cmo_ttv_hours || 0;
      const sb = vals.cmo_storybrand_score || 0;
      return [
        { label: "THE LTV:CAC RATIO", sub: "Capital Leverage", targetDisplay: "≥ 3.0:1", actualDisplay: `${ltv.toFixed(1)}:1`, variancePct: computeVariancePct(ltv, 3, "higher"), status: bandHigher(ltv, 3, 1.5), rawMetricName: "cmo_ltv_cac_ratio" },
        { label: "LEAD VELOCITY RATE", sub: "Pipeline Momentum", targetDisplay: "≥ 10%", actualDisplay: `${lead.toFixed(1)}%`, variancePct: computeVariancePct(lead, 10, "higher"), status: lead >= 10 ? OPTIMAL : lead > 0 ? WARN : CRITICAL, rawMetricName: "cmo_lead_velocity" },
        { label: "GRAND SLAM CONVERSION", sub: "Conversion Gravity", targetDisplay: "≥ 5.0%", actualDisplay: `${conv.toFixed(1)}%`, variancePct: computeVariancePct(conv, 5, "higher"), status: bandHigher(conv, 5, 2), rawMetricName: "cmo_conversion_rate" },
        { label: "TIME-TO-VALUE (TTV)", sub: "Activation Speed", targetDisplay: "≤ 24 Hrs", actualDisplay: `${ttv.toFixed(1)} Hrs`, variancePct: computeVariancePct(ttv, 24, "lower"), status: bandLower(ttv, 24, 72), rawMetricName: "cmo_ttv_hours" },
        { label: "SIGNAL-TO-NOISE (CLARITY)", sub: "Messaging Clarity", targetDisplay: "≥ 9/10", actualDisplay: `${sb}/10`, variancePct: computeVariancePct(sb, 9, "higher"), status: bandHigher(sb, 9, 7), rawMetricName: "cmo_storybrand_score" },
      ];
    }
    case "cfo": {
      const nroi = vals.cfo_nroi || 0;
      const buf = vals.cfo_buffer_distance || 0;
      const cpas = vals.cfo_cpas || 0;
      const swan = vals.cfo_black_swan_score || 0;
      const sync = vals.cfo_ledger_sync || 0;
      return [
        { label: "NET RETURN ON INTELLIGENCE", sub: "Profitability / NROI", targetDisplay: "> $0", actualDisplay: formatUsd(nroi), variancePct: computeVariancePct(nroi, 0, "higher"), status: nroi > 0 ? OPTIMAL : CRITICAL, rawMetricName: "cfo_nroi" },
        { label: "ABSOLUTE RUIN BUFFER", sub: "Structural Preservation", targetDisplay: "≥ $500", actualDisplay: formatUsd(buf), variancePct: computeVariancePct(buf, 500, "higher"), status: bandHigher(buf, 500, 100), rawMetricName: "cfo_buffer_distance" },
        { label: "COST PER SETUP (CPAS)", sub: "Intelligence Cost", targetDisplay: "≤ $1.00", actualDisplay: `$${cpas.toFixed(2)}`, variancePct: computeVariancePct(cpas, 1, "lower"), status: bandLower(cpas, 1, 5), rawMetricName: "cfo_cpas" },
        { label: "BLACK SWAN RESILIENCE", sub: "Market Anti-Fragility", targetDisplay: "100%", actualDisplay: `${swan.toFixed(1)}%`, variancePct: computeVariancePct(swan, 100, "higher"), status: bandHigher(swan, 100, 80), rawMetricName: "cfo_black_swan_score" },
        { label: "TELEMETRY-TO-LEDGER SYNC", sub: "Data Friction", targetDisplay: "100%", actualDisplay: `${sync.toFixed(1)}%`, variancePct: computeVariancePct(sync, 100, "higher"), status: bandHigher(sync, 100, 90), rawMetricName: "cfo_ledger_sync" },
      ];
    }
    case "cto": {
      const lat = vals.cto_telemetry_latency || 0;
      const up = vals.cto_uptime_percentage ?? 99.99;
      const vel = vals.cto_mission_velocity || 0;
      const mttr = vals.cto_mttr_minutes || 0;
      const bus = vals.cto_bus_factor || 0;
      return [
        { label: "TELEMETRY LATENCY", sub: "Execution Velocity", targetDisplay: "< 50 ms", actualDisplay: `${lat} ms`, variancePct: computeVariancePct(lat, 50, "lower"), status: lat < 50 ? OPTIMAL : lat <= 100 ? WARN : CRITICAL, rawMetricName: "cto_telemetry_latency" },
        { label: "INFRASTRUCTURE UPTIME", sub: "System Stability", targetDisplay: "≥ 99.99%", actualDisplay: `${up.toFixed(2)}%`, variancePct: computeVariancePct(up, 99.99, "higher"), status: bandHigher(up, 99.99, 99), rawMetricName: "cto_uptime_percentage" },
        { label: "ACTIVE MISSION VELOCITY", sub: "Clean Sprint Velocity", targetDisplay: "≥ 90%", actualDisplay: `${vel.toFixed(1)}%`, variancePct: computeVariancePct(vel, 90, "higher"), status: bandHigher(vel, 90, 75), rawMetricName: "cto_mission_velocity" },
        { label: "CRITICAL MTTR", sub: "Live-Market Bugs", targetDisplay: "< 15 Mins", actualDisplay: `${mttr} Mins`, variancePct: computeVariancePct(mttr, 15, "lower"), status: mttr < 15 ? OPTIMAL : mttr <= 60 ? WARN : CRITICAL, rawMetricName: "cto_mttr_minutes" },
        { label: "THE BUS FACTOR", sub: "Engineering Autonomy", targetDisplay: "≥ 90/100", actualDisplay: `${bus}/100`, variancePct: computeVariancePct(bus, 90, "higher"), status: bandHigher(bus, 90, 70), rawMetricName: "cto_bus_factor" },
      ];
    }
    case "cpo": {
      const churn = vals.cpo_churn_velocity || 0;
      const alpha = vals.cpo_alpha_winrate || 0;
      const ttv = vals.cpo_ui_ttv || 0;
      const pmf = vals.cpo_pmf_score || 0;
      const ess = vals.cpo_essentialism || 0;
      return [
        { label: "CHURN VELOCITY", sub: "Retention Entropy", targetDisplay: "≤ 3.0%", actualDisplay: `${churn.toFixed(1)}%`, variancePct: computeVariancePct(churn, 3, "lower"), status: bandLower(churn, 3, 6), rawMetricName: "cpo_churn_velocity" },
        { label: "ALPHA DELIVERY RATE", sub: "Live-Market Edge", targetDisplay: "≥ 65%", actualDisplay: `${alpha.toFixed(1)}%`, variancePct: computeVariancePct(alpha, 65, "higher"), status: bandHigher(alpha, 65, 50), rawMetricName: "cpo_alpha_winrate" },
        { label: "UI TIME-TO-VALUE", sub: "Cognitive Friction", targetDisplay: "≤ 3.0 Secs", actualDisplay: `${ttv.toFixed(1)} Secs`, variancePct: computeVariancePct(ttv, 3, "lower"), status: bandLower(ttv, 3, 5), rawMetricName: "cpo_ui_ttv" },
        { label: 'THE "MUST-HAVE" SCORE', sub: "Product/Market Fit", targetDisplay: "≥ 40%", actualDisplay: `${pmf.toFixed(1)}%`, variancePct: computeVariancePct(pmf, 40, "higher"), status: bandHigher(pmf, 40, 25), rawMetricName: "cpo_pmf_score" },
        { label: "FRONTEND ESSENTIALISM", sub: "Signal-to-Noise", targetDisplay: "≥ 95/100", actualDisplay: `${ess}/100`, variancePct: computeVariancePct(ess, 95, "higher"), status: bandHigher(ess, 95, 80), rawMetricName: "cpo_essentialism" },
      ];
    }
    case "cro": {
      const ltc = vals.cro_lead_to_close || 0;
      const cash = vals.cro_net_cash || 0;
      const cyc = vals.cro_sales_cycle_days || 0;
      const rec = vals.cro_reclaim_rate || 0;
      const hyg = vals.cro_pipeline_hygiene || 0;
      return [
        { label: "LEAD-TO-CLOSE RATE", sub: "Kinetic Conversion", targetDisplay: "≥ 20%", actualDisplay: `${ltc.toFixed(1)}%`, variancePct: computeVariancePct(ltc, 20, "higher"), status: bandHigher(ltc, 20, 10), rawMetricName: "cro_lead_to_close" },
        { label: "NET CASH CAPTURED", sub: "Capital Capture", targetDisplay: "> $0", actualDisplay: formatUsd(cash), variancePct: computeVariancePct(cash, 0, "higher"), status: cash > 0 ? OPTIMAL : CRITICAL, rawMetricName: "cro_net_cash" },
        { label: "SALES CYCLE VELOCITY", sub: "Pipeline Friction", targetDisplay: "≤ 14 Days", actualDisplay: `${cyc} Days`, variancePct: computeVariancePct(cyc, 14, "lower"), status: bandLower(cyc, 14, 30), rawMetricName: "cro_sales_cycle_days" },
        { label: "THE RECLAIM RATE", sub: "Salvage Velocity", targetDisplay: "≥ 15%", actualDisplay: `${rec.toFixed(1)}%`, variancePct: computeVariancePct(rec, 15, "higher"), status: bandHigher(rec, 15, 5), rawMetricName: "cro_reclaim_rate" },
        { label: "PIPELINE HYGIENE", sub: "CRM Accuracy", targetDisplay: "≥ 95/100", actualDisplay: `${hyg}/100`, variancePct: computeVariancePct(hyg, 95, "higher"), status: bandHigher(hyg, 95, 80), rawMetricName: "cro_pipeline_hygiene" },
      ];
    }
    case "cho": {
      const den = vals.cho_talent_density || 0;
      const churn = vals.cho_regrettable_churn || 0;
      const ramp = vals.cho_ramp_days || 0;
      const sop = vals.cho_sop_execution || 0;
      const drag = vals.cho_cognitive_drag || 0;
      return [
        { label: "THE TOP-GRADING INDEX", sub: "Human Capital Gravity", targetDisplay: "≥ 90%", actualDisplay: `${den.toFixed(1)}%`, variancePct: computeVariancePct(den, 90, "higher"), status: bandHigher(den, 90, 75), rawMetricName: "cho_talent_density" },
        { label: "REGRETTABLE CHURN", sub: "Talent Entropy", targetDisplay: "≤ 5.0%", actualDisplay: `${churn.toFixed(1)}%`, variancePct: computeVariancePct(churn, 5, "lower"), status: bandLower(churn, 5, 15), rawMetricName: "cho_regrettable_churn" },
        { label: "RAMP-UP VELOCITY", sub: "Time-to-Value", targetDisplay: "≤ 14 Days", actualDisplay: `${ramp} Days`, variancePct: computeVariancePct(ramp, 14, "lower"), status: bandLower(ramp, 14, 30), rawMetricName: "cho_ramp_days" },
        { label: "SOP EXECUTION RATE", sub: "Operational Accuracy", targetDisplay: "100%", actualDisplay: `${sop.toFixed(1)}%`, variancePct: computeVariancePct(sop, 100, "higher"), status: bandHigher(sop, 100, 90), rawMetricName: "cho_sop_execution" },
        { label: "COGNITIVE DRAG INDEX", sub: "Administrative Noise", targetDisplay: "≤ 10/100", actualDisplay: `${drag}/100`, variancePct: computeVariancePct(drag, 10, "lower"), status: bandLower(drag, 10, 30), rawMetricName: "cho_cognitive_drag" },
      ];
    }
    default:
      return null;
  }
}

export function evaluateSectorItems(
  sectorId: string,
  vals: Record<string, number>
): SectorEvaluatedItem[] {
  return (
    evaluatePersonalSector(sectorId, vals) ||
    evaluateExecutiveSector(sectorId, vals) ||
    []
  );
}
