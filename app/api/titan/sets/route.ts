import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// POST /api/titan/sets - log or update set
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      sessionId,
      exerciseId,
      setNumber,
      reps = 0,
      weightLbs = 0,
      isCompleted = false,
      rpe,
    } = body;

    if (!sessionId || !exerciseId || setNumber === undefined) {
      return NextResponse.json(
        { error: "sessionId, exerciseId, and setNumber are required" },
        { status: 400 }
      );
    }

    const insertSql = `
      INSERT INTO public.titan_set_logs (
        session_id, exercise_id, set_number, reps, weight_lbs, is_completed, rpe
      )
      VALUES (
        $1::uuid, $2::uuid, $3, $4, $5, $6, $7
      )
      RETURNING *;
    `;

    const result: any = await prisma.$queryRawUnsafe(
      insertSql,
      sessionId,
      exerciseId,
      setNumber,
      reps,
      weightLbs,
      isCompleted,
      rpe || null
    );

    return NextResponse.json({ set: result[0] });
  } catch (error: any) {
    console.error("POST /api/titan/sets error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/titan/sets - update set (reps, weight, completion)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, reps, weightLbs, isCompleted, rpe } = body;

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const updateSql = `
      UPDATE public.titan_set_logs
      SET reps = COALESCE($2, reps),
          weight_lbs = COALESCE($3, weight_lbs),
          is_completed = COALESCE($4, is_completed),
          rpe = COALESCE($5, rpe)
      WHERE id = $1::uuid
      RETURNING *;
    `;

    const result: any = await prisma.$queryRawUnsafe(
      updateSql,
      id,
      reps !== undefined ? reps : null,
      weightLbs !== undefined ? weightLbs : null,
      isCompleted !== undefined ? isCompleted : null,
      rpe !== undefined ? rpe : null
    );

    return NextResponse.json({ set: result[0] });
  } catch (error: any) {
    console.error("PATCH /api/titan/sets error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/titan/sets
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    await prisma.$queryRawUnsafe(
      `DELETE FROM public.titan_set_logs WHERE id = $1::uuid`,
      id
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/titan/sets error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

