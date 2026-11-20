/**
 * Public Barrel — Executive KPI Scorecard Feature (`@features/kpi-scorecard`)
 * External modules and pages must import exclusively from this barrel.
 */
export { ScorecardHeroBanner } from "./components/ScorecardHeroBanner";
export { ScorecardMatrixTable } from "./components/ScorecardMatrixTable";
export { SectorPhysicsCard } from "./components/SectorPhysicsCard";
export { SparklineSvg } from "./components/SparklineSvg";
export { useKpiScorecard } from "./hooks/useKpiScorecard";
export { evaluateSectorItems } from "./physics/executiveSectorPhysics";
export {
  CORE_PILLAR_CATEGORIES,
  RAW_METRIC_DEFS,
  classifyRag,
  computeVariancePct,
  scoreToLetterGrade,
} from "./types";
export type {
  EvaluatedKpiRow,
  KpiViewMode,
  Metric,
  RagBucket,
  ScorecardSnapshot,
  ScorecardSummary,
  SectorCategoryDef,
  SectorEvaluatedItem,
  SectorStatusBadge,
} from "./types";
