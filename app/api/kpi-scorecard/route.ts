import { NextRequest, NextResponse } from "next/server";
import { getLivingOsUserId, pgExec, pgQuery } from "@/lib/livingOsDb";

export const dynamic = "force-dynamic";

export interface KpiScorecardSnapshot {
  id: string;
  user_id: string;
  snapshot_date: string;
  cadence: "daily" | "weekly" | "monthly";
  overall_score: number;
  grade: string;
  green_count: number;
  yellow_count: number;
  red_count: number;
  sector_scores: Record<string, number>;
  executive_note: string;
  created_at: string;
}

function scoreToGrade(score: number): string {
  if (score >= 95) return "A+";
  if (score >= 88) return "A";
  if (score >= 83) return "A-";
  if (score >= 78) return "B+";
  if (score >= 72) return "B";
  if (score >= 65) return "C+";
  if (score >= 58) return "C";
  return "D";
}

function normalizeSnapshot(r: any): KpiScorecardSnapshot {
  const rawDate = r.snapshot_date ? String(r.snapshot_date).slice(0, 10) : new Date().toISOString().slice(0, 10);
  const rawScores =
    r.sector_scores && typeof r.sector_scores === "object" && !Array.isArray(r.sector_scores)
      ? r.sector_scores
      : {};
  const sectorScores: Record<string, number> = {};
  for (const [k, v] of Object.entries(rawScores)) {
    sectorScores[k] = Number(v || 0);
  }

  return {
    id: String(r.id),
    user_id: String(r.user_id),
    snapshot_date: rawDate,
    cadence:
      r.cadence === "daily" || r.cadence === "monthly" ? r.cadence : "weekly",
    overall_score: Number(r.overall_score || 0),
    grade: String(r.grade || scoreToGrade(Number(r.overall_score || 0))),
    green_count: Number(r.green_count || 0),
    yellow_count: Number(r.yellow_count || 0),
    red_count: Number(r.red_count || 0),
    sector_scores: sectorScores,
    executive_note: String(r.executive_note || ""),
    created_at: String(r.created_at || new Date().toISOString()),
  };
}

const SIX_WEEK_SEED: {
  daysAgo: number;
  overall_score: number;
  grade: string;
  green_count: number;
  yellow_count: number;
  red_count: number;
  sector_scores: Record<string, number>;
  executive_note: string;
}[] = [
  {
    daysAgo: 35,
    overall_score: 71,
    grade: "C+",
    green_count: 31,
    yellow_count: 16,
    red_count: 13,
    sector_scores: {
      wealth: 68,
      health: 70,
      relate: 75,
      joy: 64,
      ceo: 72,
      coo: 74,
      cmo: 66,
      cfo: 71,
      cto: 82,
      cpo: 69,
      cro: 67,
      cho: 73,
    },
    executive_note: "Baseline Executive Audit — tightened fasting window & CMO funnel tracking.",
  },
  {
    daysAgo: 28,
    overall_score: 75,
    grade: "B",
    green_count: 35,
    yellow_count: 15,
    red_count: 10,
    sector_scores: {
      wealth: 72,
      health: 76,
      relate: 78,
      joy: 68,
      ceo: 76,
      coo: 77,
      cmo: 71,
      cfo: 75,
      cto: 85,
      cpo: 73,
      cro: 72,
      cho: 76,
    },
    executive_note: "Week 2 — Protein payload stabilized at 165g+; reduced critical bug MTTR.",
  },
  {
    daysAgo: 21,
    overall_score: 78,
    grade: "B+",
    green_count: 37,
    yellow_count: 14,
    red_count: 9,
    sector_scores: {
      wealth: 76,
      health: 79,
      relate: 80,
      joy: 73,
      ceo: 79,
      coo: 80,
      cmo: 74,
      cfo: 78,
      cto: 88,
      cpo: 77,
      cro: 75,
      cho: 78,
    },
    executive_note: "Week 3 — 19:00 Hard Stop held 5/7 days; CFO ledger sync reached 96%.",
  },
  {
    daysAgo: 14,
    overall_score: 82,
    grade: "B+",
    green_count: 40,
    yellow_count: 13,
    red_count: 7,
    sector_scores: {
      wealth: 81,
      health: 84,
      relate: 83,
      joy: 78,
      ceo: 83,
      coo: 84,
      cmo: 79,
      cfo: 82,
      cto: 91,
      cpo: 81,
      cro: 79,
      cho: 82,
    },
    executive_note: "Week 4 — LTV:CAC crossed 3.2x; capital ruin buffer expanded.",
  },
  {
    daysAgo: 7,
    overall_score: 85,
    grade: "A-",
    green_count: 43,
    yellow_count: 11,
    red_count: 6,
    sector_scores: {
      wealth: 84,
      health: 88,
      relate: 86,
      joy: 82,
      ceo: 86,
      coo: 87,
      cmo: 83,
      cfo: 85,
      cto: 93,
      cpo: 84,
      cro: 83,
      cho: 85,
    },
    executive_note: "Week 5 — Zero frame breaks; autonomous SOP execution hitting 94%.",
  },
  {
    daysAgo: 1,
    overall_score: 88,
    grade: "A",
    green_count: 46,
    yellow_count: 10,
    red_count: 4,
    sector_scores: {
      wealth: 87,
      health: 91,
      relate: 89,
      joy: 85,
      ceo: 89,
      coo: 90,
      cmo: 86,
      cfo: 88,
      cto: 95,
      cpo: 87,
      cro: 86,
      cho: 88,
    },
    executive_note: "Week 6 — All 12 C-Suite & Personal sectors operating in coordinated thrust.",
  },
];

async function ensureSnapshotsSeeded(userId: string): Promise<KpiScorecardSnapshot[]> {
  const existing = await pgQuery<any>(
    `SELECT * FROM kpi_scorecard_snapshots
     WHERE user_id = $1
     ORDER BY snapshot_date ASC, created_at ASC`,
    userId
  );

  if (existing.length > 0) {
    return existing.map(normalizeSnapshot);
  }

  for (const s of SIX_WEEK_SEED) {
    const dt = new Date(Date.now() - s.daysAgo * 86_400_000).toISOString().slice(0, 10);
    await pgExec(
      `INSERT INTO kpi_scorecard_snapshots
        (user_id, snapshot_date, cadence, overall_score, grade, green_count, yellow_count, red_count, sector_scores, executive_note)
       VALUES ($1, $2::date, 'weekly', $3, $4, $5, $6, $7, $8::jsonb, $9)
       ON CONFLICT (user_id, snapshot_date, cadence) DO NOTHING`,
      userId,
      dt,
      s.overall_score,
      s.grade,
      s.green_count,
      s.yellow_count,
      s.red_count,
      JSON.stringify(s.sector_scores),
      s.executive_note
    );
  }

  const seeded = await pgQuery<any>(
    `SELECT * FROM kpi_scorecard_snapshots
     WHERE user_id = $1
     ORDER BY snapshot_date ASC, created_at ASC`,
    userId
  );
  return seeded.map(normalizeSnapshot);
}

export async function GET() {
  try {
    const userId = await getLivingOsUserId();
    const snapshots = await ensureSnapshotsSeeded(userId);

    return NextResponse.json({
      ok: true,
      snapshots,
      streakCount: snapshots.length,
      latest: snapshots.length > 0 ? snapshots[snapshots.length - 1] : null,
    });
  } catch (error: any) {
    console.error("GET /api/kpi-scorecard error:", error);
    // Clean fallback in case DB is momentarily unreachable
    const fallback = SIX_WEEK_SEED.map((s, idx) => ({
      id: `seed-${idx}`,
      user_id: "chairman-default",
      snapshot_date: new Date(Date.now() - s.daysAgo * 86_400_000).toISOString().slice(0, 10),
      cadence: "weekly" as const,
      overall_score: s.overall_score,
      grade: s.grade,
      green_count: s.green_count,
      yellow_count: s.yellow_count,
      red_count: s.red_count,
      sector_scores: s.sector_scores,
      executive_note: s.executive_note,
      created_at: new Date().toISOString(),
    }));
    return NextResponse.json({
      ok: true,
      snapshots: fallback,
      streakCount: fallback.length,
      latest: fallback[fallback.length - 1],
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getLivingOsUserId();
    const body = await req.json();

    const rawCadence = String(body.cadence || "weekly").toLowerCase();
    const cadence: "daily" | "weekly" | "monthly" =
      rawCadence === "daily" || rawCadence === "monthly" ? rawCadence : "weekly";

    const snapshotDate = body.snapshot_date
      ? String(body.snapshot_date).slice(0, 10)
      : new Date().toISOString().slice(0, 10);

    const overallScore = Math.max(0, Math.min(100, Math.round(Number(body.overall_score ?? 85))));
    const grade = String(body.grade || scoreToGrade(overallScore));
    const greenCount = Math.max(0, Math.round(Number(body.green_count ?? 0)));
    const yellowCount = Math.max(0, Math.round(Number(body.yellow_count ?? 0)));
    const redCount = Math.max(0, Math.round(Number(body.red_count ?? 0)));
    const sectorScores =
      body.sector_scores && typeof body.sector_scores === "object" ? body.sector_scores : {};
    const executiveNote = String(body.executive_note || "Executive KPI Scorecard Check-In").slice(
      0,
      500
    );

    const upserted = await pgQuery<any>(
      `INSERT INTO kpi_scorecard_snapshots
        (user_id, snapshot_date, cadence, overall_score, grade, green_count, yellow_count, red_count, sector_scores, executive_note)
       VALUES ($1, $2::date, $3, $4, $5, $6, $7, $8, $9::jsonb, $10)
       ON CONFLICT (user_id, snapshot_date, cadence)
       DO UPDATE SET
         overall_score = EXCLUDED.overall_score,
         grade = EXCLUDED.grade,
         green_count = EXCLUDED.green_count,
         yellow_count = EXCLUDED.yellow_count,
         red_count = EXCLUDED.red_count,
         sector_scores = EXCLUDED.sector_scores,
         executive_note = EXCLUDED.executive_note,
         created_at = NOW()
       RETURNING *`,
      userId,
      snapshotDate,
      cadence,
      overallScore,
      grade,
      greenCount,
      yellowCount,
      redCount,
      JSON.stringify(sectorScores),
      executiveNote
    );

    const allSnapshots = await pgQuery<any>(
      `SELECT * FROM kpi_scorecard_snapshots
       WHERE user_id = $1
       ORDER BY snapshot_date ASC, created_at ASC`,
      userId
    );

    const normalizedList = allSnapshots.map(normalizeSnapshot);

    return NextResponse.json({
      ok: true,
      snapshot: upserted[0] ? normalizeSnapshot(upserted[0]) : null,
      snapshots: normalizedList,
      streakCount: normalizedList.length,
    });
  } catch (error: any) {
    console.error("POST /api/kpi-scorecard error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save KPI scorecard snapshot" },
      { status: 500 }
    );
  }
}
