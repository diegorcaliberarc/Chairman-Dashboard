import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/titan/templates?userId=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    let query = `
      SELECT id, user_id, name, split_name, exercises, created_at, updated_at
      FROM public.titan_workout_templates
      WHERE 1=1
    `;
    const params: any[] = [];

    if (userId) {
      query += ` AND user_id = $${params.length + 1}::uuid`;
      params.push(userId);
    }

    query += ` ORDER BY name ASC`;

    const templates: any = await prisma.$queryRawUnsafe(query, ...params);
    return NextResponse.json({ templates });
  } catch (error: any) {
    console.error("GET /api/titan/templates error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/titan/templates
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, name, splitName, exercises = [] } = body;

    if (!name || !splitName) {
      return NextResponse.json(
        { error: "name and splitName are required" },
        { status: 400 }
      );
    }

    const insertSql = `
      INSERT INTO public.titan_workout_templates (
        user_id, name, split_name, exercises
      )
      VALUES (
        COALESCE($1::uuid, gen_random_uuid()),
        $2,
        $3,
        $4::jsonb
      )
      RETURNING *;
    `;

    const result: any = await prisma.$queryRawUnsafe(
      insertSql,
      userId || null,
      name,
      splitName,
      JSON.stringify(exercises)
    );

    return NextResponse.json({ template: result[0] });
  } catch (error: any) {
    console.error("POST /api/titan/templates error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

