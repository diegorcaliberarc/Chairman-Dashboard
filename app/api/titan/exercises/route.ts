import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/titan/exercises
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const muscle = searchParams.get("muscle");
    const userId = searchParams.get("userId");

    let query = `
      SELECT id, user_id, name, muscle_group, equipment, default_sets, default_reps, created_at
      FROM public.titan_exercises
      WHERE 1=1
    `;
    const params: any[] = [];

    if (userId) {
      query += ` AND user_id = $${params.length + 1}::uuid`;
      params.push(userId);
    }
    if (muscle && muscle !== "all") {
      query += ` AND muscle_group = $${params.length + 1}::muscle_group_enum`;
      params.push(muscle);
    }

    query += ` ORDER BY name ASC`;

    const exercises: any = await prisma.$queryRawUnsafe(query, ...params);
    return NextResponse.json({ exercises });
  } catch (error: any) {
    console.error("GET /api/titan/exercises error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/titan/exercises
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      name,
      muscleGroup,
      equipment,
      defaultSets = 3,
      defaultReps = 10,
    } = body;

    if (!name || !muscleGroup) {
      return NextResponse.json(
        { error: "name and muscleGroup are required" },
        { status: 400 }
      );
    }

    const insertSql = `
      INSERT INTO public.titan_exercises (
        user_id, name, muscle_group, equipment, default_sets, default_reps
      )
      VALUES (
        COALESCE($1::uuid, gen_random_uuid()), $2, $3::muscle_group_enum, $4, $5, $6
      )
      RETURNING *;
    `;

    const result: any = await prisma.$queryRawUnsafe(
      insertSql,
      userId || null,
      name,
      muscleGroup,
      equipment || null,
      defaultSets,
      defaultReps
    );

    return NextResponse.json({ exercise: result[0] });
  } catch (error: any) {
    console.error("POST /api/titan/exercises error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/titan/exercises
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    await prisma.$queryRawUnsafe(
      `DELETE FROM public.titan_exercises WHERE id = $1::uuid`,
      id
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/titan/exercises error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

