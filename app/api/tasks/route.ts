export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({ orderBy: { createdAt: "asc" } });
    return NextResponse.json({ tasks });
  } catch (err) {
    console.error("Tasks GET error:", err);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, pillar, agentId, status, isDelegated } = body as {
      title:       string;
      pillar:      string;
      agentId:     string;
      status?:     string;
      isDelegated?: boolean;
    };

    if (!title || !pillar || !agentId) {
      return NextResponse.json({ error: "title, pillar, agentId required" }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        title,
        pillar,
        agentId,
        status:      status      ?? "PENDING",
        isDelegated: isDelegated ?? false,
      },
    });

    return NextResponse.json({ task });
  } catch (err) {
    console.error("Tasks POST error:", err);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, isDelegated } = body as {
      id:           string;
      status?:      string;
      isDelegated?: boolean;
    };

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const data: { status?: string; isDelegated?: boolean } = {};
    if (status      !== undefined) data.status      = status;
    if (isDelegated !== undefined) data.isDelegated = isDelegated;

    const task = await prisma.task.update({ where: { id }, data });
    return NextResponse.json({ task });
  } catch (err) {
    console.error("Tasks PATCH error:", err);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}
