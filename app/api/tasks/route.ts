export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getSession() {
  return getServerSession(authOptions);
}

export async function GET() {
  const session = await getSession();
  const userId  = (session as any)?.userId as string | undefined;

  try {
    const tasks = await prisma.task.findMany({
      where:   userId ? { userId } : { userId: null },
      orderBy: [
        { priority:  "asc"  },  // 1=HIGH first, 3=LOW last
        { createdAt: "desc" },  // newest first within same priority
      ],
    });
    return NextResponse.json({ tasks });
  } catch (err) {
    console.error("Tasks GET error:", err);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session as any)?.userId as string | undefined;

  try {
    const body = await req.json();
    const { title, pillar, agentId, category, status, isDelegated, priority, dueDate } = body as {
      title:        string;
      pillar:       string;
      agentId:      string;
      category?:    string;   // Wealth | Health | Relate | Joy | CEO | COO | CFO | CTO
      status?:      string;
      isDelegated?: boolean;
      priority?:    number;   // 1=HIGH 2=MEDIUM 3=LOW
      dueDate?:     string;
    };

    if (!title || !pillar || !agentId) {
      return NextResponse.json({ error: "title, pillar, agentId required" }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        title,
        pillar,
        agentId,
        category:    category    ?? null,
        status:      status      ?? "PENDING",
        isDelegated: isDelegated ?? false,
        priority:    priority    ?? 2,
        dueDate:     dueDate     ? new Date(dueDate) : null,
        userId:      userId      ?? null,
      },
    });

    return NextResponse.json({ task });
  } catch (err) {
    console.error("Tasks POST error:", err);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session as any)?.userId as string | undefined;

  try {
    const body = await req.json();
    const { id, status, isDelegated, priority } = body as {
      id:           string;
      status?:      string;
      isDelegated?: boolean;
      priority?:    number;
    };

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    if (existing.userId && existing.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data: { status?: string; isDelegated?: boolean; priority?: number } = {};
    if (status      !== undefined) data.status      = status;
    if (isDelegated !== undefined) data.isDelegated = isDelegated;
    if (priority    !== undefined) data.priority    = priority;

    const task = await prisma.task.update({ where: { id }, data });
    return NextResponse.json({ task });
  } catch (err) {
    console.error("Tasks PATCH error:", err);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}
