export type LifeDomain = "health" | "wealth" | "relationships" | "happiness";

export type PhaseStatus = "not_started" | "in_progress" | "completed" | "blocked";

export type SequenceType = "bottleneck" | "tag_team";

export type PaceTier = "primary" | "alternate" | "contingency" | "emergency";

export type SitrepGrade = "pass" | "partial" | "miss";

export type ScorecardGrade = "A" | "B" | "C" | "D" | "F";

export type FailureClassification =
  | "planning"
  | "execution"
  | "adversity"
  | "drift"
  | "unforeseen";

export interface CommandNorthStar {
  id: string;
  user_id: string;
  domain: LifeDomain;
  title: string;
  vision_statement: string;
  target_metric_label: string;
  target_metric_value: number;
  current_metric_value: number;
  metric_unit: string;
  target_date: string | null;
  cover_image_url: string | null;
  created_at?: string;
  updated_at?: string;
  phases?: CommandPhase[];
}

export interface ReferenceStripItem {
  id: string;
  title: string;
  url?: string;
  imageUrl?: string;
  type?: "link" | "doc" | "image";
}

export interface CommandPhase {
  id: string;
  user_id: string;
  north_star_id: string;
  phase_number: number;
  title: string;
  description: string | null;
  status: PhaseStatus;
  sequence_type: SequenceType;
  target_completion_date: string | null;
  reference_strips: ReferenceStripItem[];
  created_at?: string;
  updated_at?: string;
}

export interface PacePlans {
  primary: string;
  alternate: string;
  contingency: string;
  emergency: string;
}

export interface CommandFrago {
  id: string;
  user_id: string;
  domain: LifeDomain;
  week_start_date: string;
  situation: string;
  mission: string;
  execution: string;
  sustainment: string;
  command_signal: string;
  active_pace_tier: PaceTier;
  pace_plans: PacePlans;
  created_at?: string;
  updated_at?: string;
}

export interface DailySitrepLog {
  id: string;
  user_id: string;
  log_date: string;
  morning_weight_lbs: number | null;
  moving_avg_7d_lbs: number | null;
  total_steps: number;
  miles: number;
  calories_eaten: number;
  kcal_burned: number;
  kcal_deficit: number;
  protein_g: number;
  water_oz: number;
  sleep_hours: number | null;
  recovery_score: number | null;
  lift_completed: boolean;
  cardio_completed: boolean;
  fasting_hours: number | null;
  sitrep_grade: SitrepGrade;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CommandAarLog {
  id: string;
  user_id: string;
  week_start_date: string;
  domain: LifeDomain;
  audited_grade: ScorecardGrade;
  what_happened: string;
  what_went_wrong: string;
  root_cause: string;
  failure_classification: FailureClassification;
  lessons_learned: string;
  actionable_fix: string;
  pms_tasks_created: Array<{ title: string; priority: string; taskId?: string }>;
  created_at?: string;
  updated_at?: string;
}

export interface DomainChartPoint {
  label: string;
  value: number;
}

export interface DailyTelemetryPoint {
  date: string;
  caloriesEaten: number;
  proteinG: number;
  kcalDeficit: number;
  totalSteps: number;
  sleepHours: number;
  recoveryScore: number;
}

export interface StrategyChatMutationReceipt {
  success: boolean;
  mutationType: "sitrep_telemetry" | "north_star_metric" | "pms_task";
  summary: string;
  updatedFields: Record<string, string | number>;
  timestamp: string;
}

export interface DomainScorecardItem {
  domain: LifeDomain;
  title: string;
  leadKpiLabel: string;
  leadKpiValue: string | number;
  leadKpiTarget: string | number;
  leadKpiAdherencePct: number;
  lagKpiLabel: string;
  lagKpiValue: string | number;
  grade: ScorecardGrade;
  trend: "up" | "down" | "neutral";
  bottleneckActive: boolean;
  bottleneckTitle?: string;
  activePace: PaceTier;
  chartPoints?: DomainChartPoint[];
  chartTarget?: number;
}

export interface DriftWarning {
  id: string;
  domain: LifeDomain;
  severity: "critical" | "warning" | "advisory";
  title: string;
  message: string;
  metric: string;
  currentValue: number | string;
  threshold: number | string;
}
