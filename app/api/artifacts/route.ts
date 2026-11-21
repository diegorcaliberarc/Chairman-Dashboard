import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { pgQuery, pgExec, getLivingOsUserId } from "@/lib/livingOsDb";

interface ArtifactRow {
  id: string;
  user_id: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  archived: boolean;
  accent: string;
  version: number;
  created_at: string;
  updated_at: string;
}

async function ensureArtifactsTable(): Promise<void> {
  await pgExec(`
    CREATE TABLE IF NOT EXISTS public.chairman_artifacts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Marketing',
      summary TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      archived BOOLEAN NOT NULL DEFAULT false,
      accent TEXT NOT NULL DEFAULT '#4984fd',
      version INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_chairman_artifacts_user
      ON public.chairman_artifacts(user_id, updated_at DESC);
  `);
}

function toClientArtifact(row: ArtifactRow) {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    summary: row.summary,
    content: row.content,
    archived: Boolean(row.archived),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    accent: row.accent || "#4984fd",
    version: Number(row.version || 1),
  };
}

async function generateArtifactMarkdown(
  title: string,
  category: string,
  summary: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const prompt = [
        `Draft a concise, executive-ready Markdown deliverable for "${title}" in category "${category}".`,
        summary ? `Brief / Goal: ${summary}` : "",
        "Include clear H2 sections, actionable bullet points, a compact milestone or KPI table, and next 7-day execution steps.",
      ]
        .filter(Boolean)
        .join("\n");
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      if (text) return text;
    } catch (err) {
      console.warn("Artifact AI generation fallback:", err);
    }
  }
  return [
    `# ${title}`,
    "",
    `> **Category:** ${category} | **Status:** Active Draft`,
    "",
    "## Executive Objective",
    summary || `Deliver a structured, high-leverage ${category.toLowerCase()} blueprint with measurable outcomes.`,
    "",
    "## Key Deliverables & Milestones",
    "| Phase | Owner | Deliverable | Target |",
    "| --- | --- | --- | --- |",
    "| Phase 1 — Scope | Chairman | Requirements & success criteria | Day 2 |",
    "| Phase 2 — Build | Operations | Core deliverable draft & QA | Day 5 |",
    "| Phase 3 — Ship | Executive | Review, publish & KPI tracking | Day 7 |",
    "",
    "## Next 7-Day Actions",
    "- Lock primary success metric and review cadence",
    "- Assign top 3 atomic tasks into `/pms`",
    "- Publish final version and archive superseded drafts",
  ].join("\n");
}

export async function GET() {
  try {
    await ensureArtifactsTable();
    const userId = await getLivingOsUserId();
    const rows = await pgQuery<ArtifactRow>(
      `SELECT id, user_id, title, category, summary, content,
              archived, accent, version, created_at, updated_at
       FROM public.chairman_artifacts
       WHERE user_id = $1
       ORDER BY updated_at DESC`,
      [userId]
    );
    return NextResponse.json({ artifacts: rows.map(toClientArtifact) });
  } catch (err) {
    console.error("GET /api/artifacts error:", err);
    return NextResponse.json(
      { error: "Failed to load artifacts", artifacts: [] },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureArtifactsTable();
    const userId = await getLivingOsUserId();
    const body = (await req.json()) as Record<string, unknown>;

    if (body.action === "generate_ai") {
      const title =
        typeof body.title === "string" && body.title.trim()
          ? body.title.trim()
          : "Executive Deliverable";
      const category =
        typeof body.category === "string" && body.category.trim()
          ? body.category.trim()
          : "Report & Preview";
      const summary = typeof body.summary === "string" ? body.summary.trim() : "";
      const content = await generateArtifactMarkdown(title, category, summary);
      return NextResponse.json({ content });
    }

    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) {
      return NextResponse.json({ error: "Artifact title is required" }, { status: 400 });
    }
    const id =
      typeof body.id === "string" && body.id.trim()
        ? body.id.trim()
        : `art_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const category =
      typeof body.category === "string" && body.category.trim()
        ? body.category.trim()
        : "Marketing";
    const summary =
      typeof body.summary === "string" && body.summary.trim()
        ? body.summary.trim()
        : `${category} deliverable`;
    const content = typeof body.content === "string" ? body.content.trim() : "";
    const archived = body.archived === true;
    const accent =
      typeof body.accent === "string" && body.accent.trim()
        ? body.accent.trim()
        : "#4984fd";

    const rows = await pgQuery<ArtifactRow>(
      `INSERT INTO public.chairman_artifacts
        (id, user_id, title, category, summary, content, archived, accent, version)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1)
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title,
         category = EXCLUDED.category,
         summary = EXCLUDED.summary,
         content = EXCLUDED.content,
         archived = EXCLUDED.archived,
         accent = EXCLUDED.accent,
         version = public.chairman_artifacts.version + 1,
         updated_at = NOW()
       RETURNING id, user_id, title, category, summary, content,
                 archived, accent, version, created_at, updated_at`,
      [id, userId, title, category, summary, content, archived, accent]
    );
    return NextResponse.json({ artifact: toClientArtifact(rows[0]) }, { status: 201 });
  } catch (err) {
    console.error("POST /api/artifacts error:", err);
    return NextResponse.json({ error: "Failed to save artifact" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await ensureArtifactsTable();
    const userId = await getLivingOsUserId();
    const body = (await req.json()) as Record<string, unknown>;
    const id = typeof body.id === "string" ? body.id.trim() : "";
    if (!id) {
      return NextResponse.json({ error: "Artifact id is required" }, { status: 400 });
    }

    const updates: string[] = ["updated_at = NOW()"];
    const params: unknown[] = [];
    let bumpVersion = false;

    if (typeof body.title === "string") {
      const trimmed = body.title.trim();
      if (!trimmed) {
        return NextResponse.json({ error: "Artifact title cannot be empty" }, { status: 400 });
      }
      params.push(trimmed);
      updates.push(`title = $${params.length}`);
      bumpVersion = true;
    }
    if (typeof body.category === "string") {
      params.push(body.category.trim());
      updates.push(`category = $${params.length}`);
    }
    if (typeof body.summary === "string") {
      params.push(body.summary.trim());
      updates.push(`summary = $${params.length}`);
      bumpVersion = true;
    }
    if (typeof body.content === "string") {
      params.push(body.content.trim());
      updates.push(`content = $${params.length}`);
      bumpVersion = true;
    }
    if (typeof body.archived === "boolean") {
      params.push(body.archived);
      updates.push(`archived = $${params.length}`);
    }
    if (typeof body.accent === "string") {
      params.push(body.accent.trim());
      updates.push(`accent = $${params.length}`);
    }
    if (bumpVersion) {
      updates.push("version = version + 1");
    }

    params.push(id, userId);
    const rows = await pgQuery<ArtifactRow>(
      `UPDATE public.chairman_artifacts
       SET ${updates.join(", ")}
       WHERE id = $${params.length - 1} AND user_id = $${params.length}
       RETURNING id, user_id, title, category, summary, content,
                 archived, accent, version, created_at, updated_at`,
      params
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
    }
    return NextResponse.json({ artifact: toClientArtifact(rows[0]) });
  } catch (err) {
    console.error("PATCH /api/artifacts error:", err);
    return NextResponse.json({ error: "Failed to update artifact" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await ensureArtifactsTable();
    const userId = await getLivingOsUserId();
    const id = req.nextUrl.searchParams.get("id")?.trim() || "";
    if (!id) {
      return NextResponse.json({ error: "Artifact id is required" }, { status: 400 });
    }
    await pgExec(
      `DELETE FROM public.chairman_artifacts WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    return NextResponse.json({ deleted: true, id });
  } catch (err) {
    console.error("DELETE /api/artifacts error:", err);
    return NextResponse.json({ error: "Failed to delete artifact" }, { status: 500 });
  }
}
