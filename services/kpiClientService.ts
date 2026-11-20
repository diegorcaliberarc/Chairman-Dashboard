import type { Metric, ScorecardSnapshot } from "@features/kpi-scorecard";

export async function fetchKpiMetrics(): Promise<Metric[]> {
  const res = await fetch("/api/metrics", { cache: "no-store" });
  if (!res.ok) return [];
  const data = (await res.json()) as { metrics?: Metric[] };
  return Array.isArray(data.metrics) ? data.metrics : [];
}

export async function patchKpiMetric(metric: Metric): Promise<Metric | null> {
  const res = await fetch("/api/metrics", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(metric),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { metric?: Metric };
  return data.metric ?? null;
}

export async function fetchScorecardSnapshots(): Promise<{
  snapshots: ScorecardSnapshot[];
  streakCount: number;
}> {
  const res = await fetch("/api/kpi-scorecard", { cache: "no-store" });
  if (!res.ok) {
    return { snapshots: [], streakCount: 0 };
  }
  const data = (await res.json()) as {
    snapshots?: ScorecardSnapshot[];
    streakCount?: number;
  };
  return {
    snapshots: Array.isArray(data.snapshots) ? data.snapshots : [],
    streakCount: typeof data.streakCount === "number" ? data.streakCount : 0,
  };
}

export async function postScorecardCheckIn(payload: {
  cadence: "daily" | "weekly" | "monthly";
  overall_score: number;
  grade: string;
  green_count: number;
  yellow_count: number;
  red_count: number;
  sector_scores: Record<string, number>;
  executive_note: string;
}): Promise<{
  ok: boolean;
  snapshots: ScorecardSnapshot[];
  streakCount: number;
}> {
  const res = await fetch("/api/kpi-scorecard", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    return { ok: false, snapshots: [], streakCount: 0 };
  }
  const data = (await res.json()) as {
    ok?: boolean;
    snapshots?: ScorecardSnapshot[];
    streakCount?: number;
  };
  return {
    ok: Boolean(data.ok),
    snapshots: Array.isArray(data.snapshots) ? data.snapshots : [],
    streakCount: typeof data.streakCount === "number" ? data.streakCount : 0,
  };
}
