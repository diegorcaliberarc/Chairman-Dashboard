import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/titan/sessions?date=...&userId=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");

    let query = `
      SELECT s.id, s.user_id, s.template_id, s.scheduled_date, s.status,
             s.started_at, s.completed_at, s.total_volume_lbs, s.notes, s.created_at,
             t.name as template_name, t.split_name
      FROM public.titan_workout_sessions s
      LEFT JOIN public.titan_workout_templates t ON s.template_id = t.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (userId) {
      query += ` AND s.user_id = $${params.length + 1}::uuid`;
      params.push(userId);
    }
    if (date) {
      query += ` AND s.scheduled_date = $${params.length + 1}::date`;
      params.push(date);
    }
    if (status) {
      query += ` AND s.status = $${params.length + 1}::workout_status_enum`;
      params.push(status);
    }

    query += ` ORDER BY s.scheduled_date DESC, s.created_at DESC`;

    const sessions: any = await prisma.$queryRawUnsafe(query, ...params);

    // Fetch sets for these sessions
    if (sessions.length > 0) {
      const sessionIds = sessions.map((s: any) => `'${s.id}'`).join(",");
      const setsQuery = `
        SELECT l.id, l.session_id, l.exercise_id, l.set_number, l.reps,
               l.weight_lbs, l.is_completed, l.rpe, l.created_at,
               e.name as exercise_name, e.muscle_group, e.equipment
        FROM public.titan_set_logs l
        JOIN public.titan_exercises e ON l.exercise_id = e.id
        WHERE l.session_id IN (${sessionIds})
        ORDER BY l.session_id, l.exercise_id, l.set_number ASC;
      `;
      const sets: any = await prisma.$queryRawUnsafe(setsQuery);

      const setsBySession: Record<string, any[]> = {};
      for (const set of sets) {
        if (!setsBySession[set.session_id]) setsBySession[set.session_id] = [];
        setsBySession[set.session_id].push(set);
      }

      for (const s of sessions) {
        s.sets = setsBySession[s.id] || [];
      }
    }

    return NextResponse.json({ sessions });
  } catch (error: any) {
    console.error("GET /api/titan/sessions error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/titan/sessions
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      templateId,
      scheduledDate,
      status = "in_progress",
      notes,
    } = body;

    const dateToUse = scheduledDate || new Date().toISOString().split("T")[0];

    const insertSql = `
      INSERT INTO public.titan_workout_sessions (
        user_id, template_id, scheduled_date, status, started_at, notes
      )
      VALUES (
        COALESCE($1::uuid, gen_random_uuid()),
        $2::uuid,
        $3::date,
        $4::workout_status_enum,
        NOW(),
        $5
      )
      RETURNING *;
    `;

    const result: any = await prisma.$queryRawUnsafe(
      insertSql,
      userId || null,
      templateId || null,
      dateToUse,
      status,
      notes || null
    );

    return NextResponse.json({ session: result[0] });
  } catch (error: any) {
    console.error("POST /api/titan/sessions error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/titan/sessions
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, totalVolumeLbs, notes, completed } = body;

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    let updateSql = `
      UPDATE public.titan_workout_sessions
      SET status = COALESCE($2::workout_status_enum, status),
          total_volume_lbs = COALESCE($3, total_volume_lbs),
          notes = COALESCE($4, notes)
    `;
    const params: any[] = [id, status || null, totalVolumeLbs || null, notes || null];

    if (completed) {
      updateSql += `, completed_at = NOW(), status = 'completed'::workout_status_enum`;
    }

    updateSql += ` WHERE id = $1::uuid RETURNING *;`;

    const result: any = await prisma.$queryRawUnsafe(updateSql, ...params);
    return NextResponse.json({ session: result[0] });
  } catch (error: any) {
    console.error("PATCH /api/titan/sessions error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

