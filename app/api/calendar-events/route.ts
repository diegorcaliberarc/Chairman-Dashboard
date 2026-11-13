import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/calendar-events?start=...&end=...&userId=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const userId = searchParams.get("userId");

    // Fetch from public.calendar_events
    let query = `
      SELECT id, user_id, google_event_id, title, description,
             start_time, end_time, all_day, category, workout_template_id,
             pms_task_id, color_hex, recurrence_rule, created_at, updated_at
      FROM public.calendar_events
      WHERE 1=1
    `;
    const params: any[] = [];

    if (userId) {
      query += ` AND user_id = $${params.length + 1}::uuid`;
      params.push(userId);
    }
    if (start) {
      query += ` AND end_time >= $${params.length + 1}::timestamptz`;
      params.push(start);
    }
    if (end) {
      query += ` AND start_time <= $${params.length + 1}::timestamptz`;
      params.push(end);
    }

    query += ` ORDER BY start_time ASC`;

    const events: any = await prisma.$queryRawUnsafe(query, ...params);
    return NextResponse.json({ events });
  } catch (error: any) {
    console.error("GET /api/calendar-events error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/calendar-events
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      title,
      description,
      startTime,
      endTime,
      allDay = false,
      category = "personal",
      colorHex = "#0969DA",
      workoutTemplateId,
      pmsTaskId,
      googleEventId,
      recurrenceRule,
    } = body;

    if (!title || !startTime || !endTime) {
      return NextResponse.json(
        { error: "title, startTime, and endTime are required" },
        { status: 400 }
      );
    }

    const insertSql = `
      INSERT INTO public.calendar_events (
        user_id, title, description, start_time, end_time, all_day,
        category, color_hex, workout_template_id, pms_task_id,
        google_event_id, recurrence_rule
      )
      VALUES (
        COALESCE($1::uuid, gen_random_uuid()), $2, $3, $4::timestamptz, $5::timestamptz,
        $6, $7::calendar_category_enum, $8, $9::uuid, $10::uuid, $11, $12
      )
      RETURNING *;
    `;

    const result: any = await prisma.$queryRawUnsafe(
      insertSql,
      userId || null,
      title,
      description || null,
      startTime,
      endTime,
      allDay,
      category,
      colorHex,
      workoutTemplateId || null,
      pmsTaskId || null,
      googleEventId || null,
      recurrenceRule || null
    );

    return NextResponse.json({ event: result[0] });
  } catch (error: any) {
    console.error("POST /api/calendar-events error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/calendar-events
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title, description, startTime, endTime, colorHex, category } = body;

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const updateSql = `
      UPDATE public.calendar_events
      SET title = COALESCE($2, title),
          description = COALESCE($3, description),
          start_time = COALESCE($4::timestamptz, start_time),
          end_time = COALESCE($5::timestamptz, end_time),
          color_hex = COALESCE($6, color_hex),
          category = COALESCE($7::calendar_category_enum, category),
          updated_at = NOW()
      WHERE id = $1::uuid
      RETURNING *;
    `;

    const result: any = await prisma.$queryRawUnsafe(
      updateSql,
      id,
      title || null,
      description || null,
      startTime || null,
      endTime || null,
      colorHex || null,
      category || null
    );

    return NextResponse.json({ event: result[0] });
  } catch (error: any) {
    console.error("PATCH /api/calendar-events error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/calendar-events
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    await prisma.$queryRawUnsafe(
      `DELETE FROM public.calendar_events WHERE id = $1::uuid`,
      id
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/calendar-events error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

