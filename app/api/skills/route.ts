import { NextRequest, NextResponse } from "next/server";
import { pgQuery, pgExec, getLivingOsUserId } from "@/lib/livingOsDb";

export interface SkillRow {
  id: string;
  user_id: string;
  name: string;
  description: string;
  category: string;
  instructions: string;
  enabled: boolean;
  created_by_me: boolean;
  accent: string;
  created_at: string;
  updated_at: string;
}

async function ensureSkillsTable(): Promise<void> {
  await pgExec(`
    CREATE TABLE IF NOT EXISTS public.chairman_skills (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT 'Operations',
      instructions TEXT NOT NULL DEFAULT '',
      enabled BOOLEAN NOT NULL DEFAULT true,
      created_by_me BOOLEAN NOT NULL DEFAULT true,
      accent TEXT NOT NULL DEFAULT '#4984fd',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_chairman_skills_user
      ON public.chairman_skills(user_id, created_at DESC);
  `);
}

function toClientSkill(row: SkillRow) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    instructions: row.instructions,
    enabled: Boolean(row.enabled),
    createdByMe: Boolean(row.created_by_me),
    createdAt: row.created_at,
    accent: row.accent || "#4984fd",
  };
}

export async function GET() {
  try {
    await ensureSkillsTable();
    const userId = await getLivingOsUserId();
    const rows = await pgQuery<SkillRow>(
      `SELECT id, user_id, name, description, category, instructions,
              enabled, created_by_me, accent, created_at, updated_at
       FROM public.chairman_skills
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
    return NextResponse.json({ skills: rows.map(toClientSkill) });
  } catch (err) {
    console.error("GET /api/skills error:", err);
    return NextResponse.json(
      { error: "Failed to load skills", skills: [] },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureSkillsTable();
    const userId = await getLivingOsUserId();
    const body = (await req.json()) as Record<string, unknown>;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ error: "Skill name is required" }, { status: 400 });
    }
    const id =
      typeof body.id === "string" && body.id.trim()
        ? body.id.trim()
        : `skill_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const description =
      typeof body.description === "string" && body.description.trim()
        ? body.description.trim()
        : "Custom reusable workflow skill";
    const category =
      typeof body.category === "string" && body.category.trim()
        ? body.category.trim()
        : "Operations";
    const instructions =
      typeof body.instructions === "string" ? body.instructions.trim() : "";
    const enabled = body.enabled !== false;
    const accent =
      typeof body.accent === "string" && body.accent.trim()
        ? body.accent.trim()
        : "#4984fd";

    const rows = await pgQuery<SkillRow>(
      `INSERT INTO public.chairman_skills
        (id, user_id, name, description, category, instructions, enabled, created_by_me, accent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         description = EXCLUDED.description,
         category = EXCLUDED.category,
         instructions = EXCLUDED.instructions,
         enabled = EXCLUDED.enabled,
         accent = EXCLUDED.accent,
         updated_at = NOW()
       RETURNING id, user_id, name, description, category, instructions,
                 enabled, created_by_me, accent, created_at, updated_at`,
      [id, userId, name, description, category, instructions, enabled, accent]
    );
    return NextResponse.json({ skill: toClientSkill(rows[0]) }, { status: 201 });
  } catch (err) {
    console.error("POST /api/skills error:", err);
    return NextResponse.json({ error: "Failed to save skill" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await ensureSkillsTable();
    const userId = await getLivingOsUserId();
    const body = (await req.json()) as Record<string, unknown>;
    const id = typeof body.id === "string" ? body.id.trim() : "";
    if (!id) {
      return NextResponse.json({ error: "Skill id is required" }, { status: 400 });
    }

    const updates: string[] = ["updated_at = NOW()"];
    const params: unknown[] = [];

    if (typeof body.name === "string") {
      const trimmed = body.name.trim();
      if (!trimmed) {
        return NextResponse.json({ error: "Skill name cannot be empty" }, { status: 400 });
      }
      params.push(trimmed);
      updates.push(`name = $${params.length}`);
    }
    if (typeof body.description === "string") {
      params.push(body.description.trim());
      updates.push(`description = $${params.length}`);
    }
    if (typeof body.category === "string") {
      params.push(body.category.trim());
      updates.push(`category = $${params.length}`);
    }
    if (typeof body.instructions === "string") {
      params.push(body.instructions.trim());
      updates.push(`instructions = $${params.length}`);
    }
    if (typeof body.enabled === "boolean") {
      params.push(body.enabled);
      updates.push(`enabled = $${params.length}`);
    }
    if (typeof body.accent === "string") {
      params.push(body.accent.trim());
      updates.push(`accent = $${params.length}`);
    }

    params.push(id, userId);
    const rows = await pgQuery<SkillRow>(
      `UPDATE public.chairman_skills
       SET ${updates.join(", ")}
       WHERE id = $${params.length - 1} AND user_id = $${params.length}
       RETURNING id, user_id, name, description, category, instructions,
                 enabled, created_by_me, accent, created_at, updated_at`,
      params
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    }
    return NextResponse.json({ skill: toClientSkill(rows[0]) });
  } catch (err) {
    console.error("PATCH /api/skills error:", err);
    return NextResponse.json({ error: "Failed to update skill" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await ensureSkillsTable();
    const userId = await getLivingOsUserId();
    const id = req.nextUrl.searchParams.get("id")?.trim() || "";
    if (!id) {
      return NextResponse.json({ error: "Skill id is required" }, { status: 400 });
    }
    await pgExec(
      `DELETE FROM public.chairman_skills WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    return NextResponse.json({ deleted: true, id });
  } catch (err) {
    console.error("DELETE /api/skills error:", err);
    return NextResponse.json({ error: "Failed to delete skill" }, { status: 500 });
  }
}
