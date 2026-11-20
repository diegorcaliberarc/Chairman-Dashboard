import {
  Activity,
  CircleDollarSign,
  LucideIcon,
  Sparkles,
  Users,
} from "lucide-react";

export interface Metric {
  id?: string;
  metricName: string;
  value: number;
  target: number;
  category: string;
}

export interface ScorecardSnapshot {
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

export type RagBucket = "GREEN" | "YELLOW" | "RED";
export type KpiViewMode = "matrix" | "cards" | "both";

export interface SectorStatusBadge {
  color: string;
  label: string;
}

export interface SectorEvaluatedItem {
  label: string;
  sub: string;
  targetDisplay: string;
  actualDisplay: string;
  variancePct: number;
  status: SectorStatusBadge;
  rawMetricName: string;
}

export interface EvaluatedKpiRow extends SectorEvaluatedItem {
  key: string;
  sectorId: string;
  sectorTitle: string;
  sectorColor: string;
  rag: RagBucket;
  statusLabel: string;
  rawMetricValue: number;
  rawMetricTarget: number;
  kpiPoints: number;
}

export interface SectorCategoryDef {
  id: string;
  title: string;
  icon: LucideIcon;
  color: string;
}

export interface ScorecardSummary {
  overallScore: number;
  liveComputedScore: number;
  grade: string;
  greenCount: number;
  yellowCount: number;
  redCount: number;
  sectorScores: Record<string, number>;
  overallTrend: number[];
}

export const CORE_PILLAR_CATEGORIES: SectorCategoryDef[] = [
  { id: "wealth", title: "WEALTH", icon: CircleDollarSign, color: "#D4AF37" },
  { id: "health", title: "HEALTH", icon: Activity, color: "#E05A3A" },
  { id: "relate", title: "RELATIONSHIPS", icon: Users, color: "#5B8FB9" },
  { id: "joy", title: "JOY", icon: Sparkles, color: "#B388EB" },
];

export const RAW_METRIC_DEFS: Record<
  string,
  { name: string; defaultVal: number; target: number }[]
> = {
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

export function classifyRag(statusObj: SectorStatusBadge): {
  rag: RagBucket;
  points: number;
} {
  if (statusObj.color.includes("emerald")) return { rag: "GREEN", points: 100 };
  if (statusObj.color.includes("yellow") || statusObj.color.includes("orange")) {
    return { rag: "YELLOW", points: 65 };
  }
  return { rag: "RED", points: 20 };
}

export function computeVariancePct(
  actual: number,
  target: number,
  direction: "higher" | "lower"
): number {
  if (target === 0) {
    if (direction === "higher") {
      if (actual > 0) return 100;
      if (actual === 0) return 0;
      return -100;
    }
    if (actual <= 0) return 0;
    return -Math.min(100, Math.round(actual * 15));
  }
  const raw =
    direction === "higher"
      ? ((actual - target) / Math.abs(target)) * 100
      : ((target - actual) / Math.abs(target)) * 100;
  return Math.max(-199, Math.min(250, Math.round(raw * 10) / 10));
}

export function scoreToLetterGrade(score: number): string {
  if (score >= 95) return "A+";
  if (score >= 88) return "A";
  if (score >= 83) return "A-";
  if (score >= 78) return "B+";
  if (score >= 72) return "B";
  if (score >= 65) return "C+";
  if (score >= 58) return "C";
  return "D";
}
