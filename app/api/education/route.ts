import { NextRequest, NextResponse } from "next/server";
import { getLivingOsUserId, pgExec, pgQuery } from "@/lib/livingOsDb";
import {
  CURRICULUM_CLASSES,
  ClassProgressRecord,
  calculateRankForXp,
  computeUnlockedBadges,
} from "@/lib/educationCurriculum";

export const dynamic = "force-dynamic";

interface UserProfileRow {
  user_id: string;
  xp: number;
  level: number;
  rank_title: string;
  streak_days: number;
  last_studied_at: string | null;
  unlocked_badges: string[] | string;
  updated_at: string | null;
}

interface XpLedgerRow {
  id: string;
  user_id: string;
  source_type: string;
  source_ref: string;
  xp_delta: number;
  note: string | null;
  created_at: string;
}

// Graceful degradation in-memory fallback store (Class 6 pattern) if DB is unreachable
const memoryFallbackStore = new Map<
  string,
  {
    profile: {
      user_id: string;
      xp: number;
      level: number;
      rank_title: string;
      streak_days: number;
      last_studied_at: string;
      unlocked_badges: string[];
      updated_at: string;
    };
    progress: Map<string, ClassProgressRecord>;
    ledger: XpLedgerRow[];
  }
>();

let tablesEnsured = false;

async function ensureEducationTables() {
  if (tablesEnsured) return;
  await pgExec(`
    CREATE TABLE IF NOT EXISTS education_user_profile (
      user_id TEXT PRIMARY KEY,
      xp INTEGER NOT NULL DEFAULT 0,
      level INTEGER NOT NULL DEFAULT 1,
      rank_title TEXT NOT NULL DEFAULT 'Zero-Code Orchestrator',
      streak_days INTEGER NOT NULL DEFAULT 1,
      last_studied_at TIMESTAMPTZ DEFAULT NOW(),
      unlocked_badges JSONB NOT NULL DEFAULT '[]'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pgExec(`
    CREATE TABLE IF NOT EXISTS education_class_progress (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      class_slug TEXT NOT NULL,
      tier TEXT NOT NULL DEFAULT 'beginner',
      is_completed BOOLEAN NOT NULL DEFAULT FALSE,
      quiz_score INTEGER NOT NULL DEFAULT 0,
      quiz_total INTEGER NOT NULL DEFAULT 3,
      lab_completed BOOLEAN NOT NULL DEFAULT FALSE,
      adr_notes TEXT NOT NULL DEFAULT '',
      xp_earned INTEGER NOT NULL DEFAULT 0,
      completed_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, class_slug)
    );
  `);
  await pgExec(`
    CREATE TABLE IF NOT EXISTS education_xp_ledger (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      source_type TEXT NOT NULL,
      source_ref TEXT NOT NULL,
      xp_delta INTEGER NOT NULL,
      note TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  tablesEnsured = true;
}

function parseBadges(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((x): x is string => typeof x === "string");
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed.filter((x): x is string => typeof x === "string")
        : [];
    } catch {
      return [];
    }
  }
  return [];
}

function computeNextStreak(lastStudiedIso: string | null | undefined, currentStreak: number): number {
  const safeStreak = Math.max(1, Number(currentStreak) || 1);
  if (!lastStudiedIso) return safeStreak;
  const prev = new Date(lastStudiedIso);
  if (Number.isNaN(prev.getTime())) return safeStreak;

  const now = new Date();
  const prevDay = Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth(), prev.getUTCDate());
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const diffDays = Math.round((today - prevDay) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return safeStreak;
  if (diffDays === 1) return safeStreak + 1;
  return 1;
}

function getOrCreateMemoryState(userId: string) {
  let entry = memoryFallbackStore.get(userId);
  if (!entry) {
    const now = new Date().toISOString();
    entry = {
      profile: {
        user_id: userId,
        xp: 0,
        level: 1,
        rank_title: "Zero-Code Orchestrator",
        streak_days: 1,
        last_studied_at: now,
        unlocked_badges: [],
        updated_at: now,
      },
      progress: new Map<string, ClassProgressRecord>(),
      ledger: [],
    };
    memoryFallbackStore.set(userId, entry);
  }
  return entry;
}

function calculateClassXp(
  isCompleted: boolean,
  quizScore: number,
  quizTotal: number,
  labCompleted: boolean
): number {
  const safeTotal = Math.max(1, quizTotal || 3);
  const clampedScore = Math.max(0, Math.min(safeTotal, quizScore || 0));
  const lessonPart = isCompleted ? 100 : 0;
  const quizPart = Math.round((clampedScore / safeTotal) * 150);
  const labPart = labCompleted ? 200 : 0;
  return lessonPart + quizPart + labPart;
}

async function fetchFullUserStateFromDb(userId: string) {
  await ensureEducationTables();

  await pgExec(
    `INSERT INTO education_user_profile (user_id, xp, level, rank_title, streak_days, unlocked_badges)
     VALUES ($1, 0, 1, 'Zero-Code Orchestrator', 1, '[]'::jsonb)
     ON CONFLICT (user_id) DO NOTHING`,
    userId
  );

  const profiles = await pgQuery<UserProfileRow>(
    `SELECT user_id, xp, level, rank_title, streak_days, last_studied_at, unlocked_badges, updated_at
     FROM education_user_profile
     WHERE user_id = $1
     LIMIT 1`,
    userId
  );

  const progress = await pgQuery<ClassProgressRecord>(
    `SELECT class_slug, tier, is_completed, quiz_score, quiz_total, lab_completed, adr_notes, xp_earned, completed_at, updated_at
     FROM education_class_progress
     WHERE user_id = $1
     ORDER BY class_slug ASC`,
    userId
  );

  const ledger = await pgQuery<XpLedgerRow>(
    `SELECT id, user_id, source_type, source_ref, xp_delta, note, created_at
     FROM education_xp_ledger
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 25`,
    userId
  );

  const rawProfile = profiles[0];
  const unlockedBadges = parseBadges(rawProfile?.unlocked_badges);

  return {
    profile: {
      user_id: userId,
      xp: Number(rawProfile?.xp ?? 0),
      level: Number(rawProfile?.level ?? 1),
      rank_title: rawProfile?.rank_title ?? "Zero-Code Orchestrator",
      streak_days: Number(rawProfile?.streak_days ?? 1),
      last_studied_at: rawProfile?.last_studied_at ?? new Date().toISOString(),
      unlocked_badges: unlockedBadges,
      updated_at: rawProfile?.updated_at ?? new Date().toISOString(),
    },
    progress,
    ledger,
    degradedFallback: false,
  };
}

export async function GET() {
  const userId = await getLivingOsUserId();

  try {
    const state = await fetchFullUserStateFromDb(userId);
    return NextResponse.json({ ok: true, ...state });
  } catch (err: unknown) {
    const mem = getOrCreateMemoryState(userId);
    return NextResponse.json({
      ok: true,
      profile: mem.profile,
      progress: Array.from(mem.progress.values()),
      ledger: mem.ledger.slice(0, 25),
      degradedFallback: true,
      warning: err instanceof Error ? err.message : "Database unavailable; serving resilient cache state",
    });
  }
}

export async function POST(req: NextRequest) {
  const userId = await getLivingOsUserId();

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  const action = String(body.action || "");
  const classSlug = typeof body.classSlug === "string" ? body.classSlug : "";
  const matchedClass = CURRICULUM_CLASSES.find((c) => c.slug === classSlug);

  if (
    action !== "reset_progress" &&
    (!classSlug || !matchedClass)
  ) {
    return NextResponse.json(
      { ok: false, error: "Valid classSlug is required for this action" },
      { status: 422 }
    );
  }

  // Primary PostgreSQL Execution Path
  try {
    await ensureEducationTables();

    if (action === "reset_progress") {
      await pgExec(`DELETE FROM education_class_progress WHERE user_id = $1`, userId);
      await pgExec(`DELETE FROM education_xp_ledger WHERE user_id = $1`, userId);
      await pgExec(
        `INSERT INTO education_user_profile (user_id, xp, level, rank_title, streak_days, last_studied_at, unlocked_badges, updated_at)
         VALUES ($1, 0, 1, 'Zero-Code Orchestrator', 1, NOW(), '[]'::jsonb, NOW())
         ON CONFLICT (user_id) DO UPDATE SET
           xp = 0,
           level = 1,
           rank_title = 'Zero-Code Orchestrator',
           streak_days = 1,
           last_studied_at = NOW(),
           unlocked_badges = '[]'::jsonb,
           updated_at = NOW()`,
        userId
      );

      const state = await fetchFullUserStateFromDb(userId);
      return NextResponse.json({
        ok: true,
        xpAwarded: 0,
        message: "Academy progress reset to Level 1: Zero-Code Orchestrator.",
        ...state,
      });
    }

    const targetClass = matchedClass!;

    // Ensure profile exists
    await pgExec(
      `INSERT INTO education_user_profile (user_id, xp, level, rank_title, streak_days, unlocked_badges)
       VALUES ($1, 0, 1, 'Zero-Code Orchestrator', 1, '[]'::jsonb)
       ON CONFLICT (user_id) DO NOTHING`,
      userId
    );

    const existingProfiles = await pgQuery<UserProfileRow>(
      `SELECT user_id, xp, level, rank_title, streak_days, last_studied_at, unlocked_badges, updated_at
       FROM education_user_profile WHERE user_id = $1 LIMIT 1`,
      userId
    );
    const currentProfile = existingProfiles[0];

    const existingRows = await pgQuery<ClassProgressRecord>(
      `SELECT class_slug, tier, is_completed, quiz_score, quiz_total, lab_completed, adr_notes, xp_earned, completed_at, updated_at
       FROM education_class_progress
       WHERE user_id = $1 AND class_slug = $2
       LIMIT 1`,
      userId,
      targetClass.slug
    );
    const existing = existingRows[0];

    let isCompleted = existing?.is_completed ?? false;
    let quizScore = Number(existing?.quiz_score ?? 0);
    let quizTotal = Number(existing?.quiz_total ?? targetClass.quiz.length);
    let labCompleted = existing?.lab_completed ?? false;
    let adrNotes = existing?.adr_notes ?? "";
    const prevClassXp = Number(existing?.xp_earned ?? 0);

    let ledgerNote = "";
    let sourceType = action;

    if (action === "complete_lesson") {
      isCompleted = true;
      sourceType = "lesson_complete";
      ledgerNote = `Completed Class ${targetClass.classNumber}: ${targetClass.shortTitle}`;
    } else if (action === "submit_quiz") {
      const incomingScore = Math.max(
        0,
        Math.min(targetClass.quiz.length, Number(body.quizScore ?? 0))
      );
      const incomingTotal = Math.max(1, Number(body.quizTotal ?? targetClass.quiz.length));
      quizTotal = incomingTotal;
      quizScore = Math.max(quizScore, incomingScore);
      if (incomingScore >= Math.ceil(incomingTotal * 0.66)) {
        isCompleted = true;
      }
      sourceType = "quiz_mastery";
      ledgerNote = `Architecture Quiz (${incomingScore}/${incomingTotal}) — Class ${targetClass.classNumber}`;
    } else if (action === "submit_lab") {
      const incomingNotes = typeof body.adrNotes === "string" ? body.adrNotes.trim() : "";
      if (incomingNotes.length < 20) {
        return NextResponse.json(
          {
            ok: false,
            error: "Please write a substantive Spec-First ADR defense (at least 20 characters) before submitting.",
          },
          { status: 422 }
        );
      }
      adrNotes = incomingNotes;
      labCompleted = true;
      isCompleted = true;
      sourceType = "adr_lab_defense";
      ledgerNote = `Defended Spec-First ADR Lab — Class ${targetClass.classNumber}: ${targetClass.adrLab.title}`;
    } else {
      return NextResponse.json(
        { ok: false, error: `Unsupported action: ${action}` },
        { status: 400 }
      );
    }

    const newClassXp = calculateClassXp(isCompleted, quizScore, quizTotal, labCompleted);
    const xpDelta = Math.max(0, newClassXp - prevClassXp);

    await pgExec(
      `INSERT INTO education_class_progress
        (user_id, class_slug, tier, is_completed, quiz_score, quiz_total, lab_completed, adr_notes, xp_earned, completed_at, updated_at)
       VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, CASE WHEN $4 THEN NOW() ELSE NULL END, NOW())
       ON CONFLICT (user_id, class_slug) DO UPDATE SET
        tier = EXCLUDED.tier,
        is_completed = EXCLUDED.is_completed,
        quiz_score = EXCLUDED.quiz_score,
        quiz_total = EXCLUDED.quiz_total,
        lab_completed = EXCLUDED.lab_completed,
        adr_notes = EXCLUDED.adr_notes,
        xp_earned = EXCLUDED.xp_earned,
        completed_at = COALESCE(education_class_progress.completed_at, EXCLUDED.completed_at),
        updated_at = NOW()`,
      userId,
      targetClass.slug,
      targetClass.tier,
      isCompleted,
      quizScore,
      quizTotal,
      labCompleted,
      adrNotes,
      newClassXp
    );

    if (xpDelta > 0) {
      await pgExec(
        `INSERT INTO education_xp_ledger (user_id, source_type, source_ref, xp_delta, note)
         VALUES ($1, $2, $3, $4, $5)`,
        userId,
        sourceType,
        targetClass.slug,
        xpDelta,
        ledgerNote
      );
    }

    const allProgress = await pgQuery<ClassProgressRecord>(
      `SELECT class_slug, tier, is_completed, quiz_score, quiz_total, lab_completed, adr_notes, xp_earned, completed_at, updated_at
       FROM education_class_progress
       WHERE user_id = $1`,
      userId
    );

    const summedXp = allProgress.reduce((acc, r) => acc + Number(r.xp_earned || 0), 0);
    const totalXp = Math.max(summedXp, Number(currentProfile?.xp || 0) + xpDelta);
    const rankSpec = calculateRankForXp(totalXp);
    const nextStreak = computeNextStreak(
      currentProfile?.last_studied_at,
      Number(currentProfile?.streak_days ?? 1)
    );
    const existingBadges = parseBadges(currentProfile?.unlocked_badges);
    const updatedBadges = computeUnlockedBadges(totalXp, allProgress, existingBadges);

    await pgExec(
      `UPDATE education_user_profile
       SET xp = $2,
           level = $3,
           rank_title = $4,
           streak_days = $5,
           last_studied_at = NOW(),
           unlocked_badges = $6::jsonb,
           updated_at = NOW()
       WHERE user_id = $1`,
      userId,
      totalXp,
      rankSpec.level,
      rankSpec.rankTitle,
      nextStreak,
      JSON.stringify(updatedBadges)
    );

    const state = await fetchFullUserStateFromDb(userId);
    return NextResponse.json({
      ok: true,
      xpAwarded: xpDelta,
      message:
        xpDelta > 0
          ? `+${xpDelta} XP earned! ${ledgerNote}`
          : "Progress & notes saved (XP already claimed for this milestone).",
      ...state,
    });
  } catch (err: unknown) {
    // Resilient In-Memory Fallback so API never 500s
    const mem = getOrCreateMemoryState(userId);
    const nowIso = new Date().toISOString();

    if (action === "reset_progress") {
      mem.progress.clear();
      mem.ledger = [];
      mem.profile = {
        user_id: userId,
        xp: 0,
        level: 1,
        rank_title: "Zero-Code Orchestrator",
        streak_days: 1,
        last_studied_at: nowIso,
        unlocked_badges: [],
        updated_at: nowIso,
      };
      return NextResponse.json({
        ok: true,
        xpAwarded: 0,
        profile: mem.profile,
        progress: [],
        ledger: [],
        degradedFallback: true,
      });
    }

    const targetClass = matchedClass!;
    const existing = mem.progress.get(targetClass.slug);
    let isCompleted = existing?.is_completed ?? false;
    let quizScore = existing?.quiz_score ?? 0;
    let quizTotal = existing?.quiz_total ?? targetClass.quiz.length;
    let labCompleted = existing?.lab_completed ?? false;
    let adrNotes = existing?.adr_notes ?? "";
    const prevClassXp = existing?.xp_earned ?? 0;
    let ledgerNote = "";

    if (action === "complete_lesson") {
      isCompleted = true;
      ledgerNote = `Completed Class ${targetClass.classNumber}: ${targetClass.shortTitle}`;
    } else if (action === "submit_quiz") {
      const incomingScore = Math.max(
        0,
        Math.min(targetClass.quiz.length, Number(body.quizScore ?? 0))
      );
      const incomingTotal = Math.max(1, Number(body.quizTotal ?? targetClass.quiz.length));
      quizTotal = incomingTotal;
      quizScore = Math.max(quizScore, incomingScore);
      if (incomingScore >= Math.ceil(incomingTotal * 0.66)) {
        isCompleted = true;
      }
      ledgerNote = `Architecture Quiz (${incomingScore}/${incomingTotal}) — Class ${targetClass.classNumber}`;
    } else if (action === "submit_lab") {
      const incomingNotes = typeof body.adrNotes === "string" ? body.adrNotes.trim() : "";
      if (incomingNotes.length < 20) {
        return NextResponse.json(
          { ok: false, error: "Please write at least 20 characters for your ADR defense." },
          { status: 422 }
        );
      }
      adrNotes = incomingNotes;
      labCompleted = true;
      isCompleted = true;
      ledgerNote = `Defended Spec-First ADR Lab — Class ${targetClass.classNumber}`;
    }

    const newClassXp = calculateClassXp(isCompleted, quizScore, quizTotal, labCompleted);
    const xpDelta = Math.max(0, newClassXp - prevClassXp);

    mem.progress.set(targetClass.slug, {
      class_slug: targetClass.slug,
      tier: targetClass.tier,
      is_completed: isCompleted,
      quiz_score: quizScore,
      quiz_total: quizTotal,
      lab_completed: labCompleted,
      adr_notes: adrNotes,
      xp_earned: newClassXp,
      completed_at: isCompleted ? existing?.completed_at ?? nowIso : null,
      updated_at: nowIso,
    });

    if (xpDelta > 0) {
      mem.ledger.unshift({
        id: `mem-${Date.now()}`,
        user_id: userId,
        source_type: action,
        source_ref: targetClass.slug,
        xp_delta: xpDelta,
        note: ledgerNote,
        created_at: nowIso,
      });
    }

    const allProgress = Array.from(mem.progress.values());
    const totalXp = allProgress.reduce((sum, r) => sum + r.xp_earned, 0);
    const rankSpec = calculateRankForXp(totalXp);
    const nextStreak = computeNextStreak(mem.profile.last_studied_at, mem.profile.streak_days);
    const badges = computeUnlockedBadges(totalXp, allProgress, mem.profile.unlocked_badges);

    mem.profile = {
      user_id: userId,
      xp: totalXp,
      level: rankSpec.level,
      rank_title: rankSpec.rankTitle,
      streak_days: nextStreak,
      last_studied_at: nowIso,
      unlocked_badges: badges,
      updated_at: nowIso,
    };

    return NextResponse.json({
      ok: true,
      xpAwarded: xpDelta,
      message: xpDelta > 0 ? `+${xpDelta} XP earned!` : "Saved in fallback store.",
      profile: mem.profile,
      progress: allProgress,
      ledger: mem.ledger.slice(0, 25),
      degradedFallback: true,
      warning: err instanceof Error ? err.message : "Database fallback active",
    });
  }
}
