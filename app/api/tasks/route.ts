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
  } catch (err: any) {
    console.error("Tasks GET error:", err);
    return NextResponse.json({ error: "Failed to fetch tasks", detail: err?.message ?? String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    console.error("Tasks POST: no session — user not authenticated");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session as any)?.userId as string | undefined;
  console.log("Tasks POST: userId =", userId);

  let body: any;
  try {
    body = await req.json();
  } catch (parseErr) {
    console.error("Tasks POST: failed to parse request body:", parseErr);
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { title, pillar, agentId, category, status, isDelegated, priority, dueDate, parentId } = body as {
    title:        string;
    pillar:       string;
    agentId:      string;
    category?:    string;
    status?:      string;
    isDelegated?: boolean;
    priority?:    number;
    dueDate?:     string;
    parentId?:    string;
  };

  console.log("Tasks POST body:", { title, pillar, agentId, category, status, priority, parentId });

  if (!title || !pillar || !agentId) {
    return NextResponse.json({ error: "title, pillar, agentId required" }, { status: 400 });
  }

  try {
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
        parentId:    parentId    ?? null,
      },
    });

    console.log("Tasks POST: created task id =", task.id);
    return NextResponse.json({ task });
  } catch (err: any) {
    console.error("Tasks POST error — full detail:", err);
    const detail = err?.message ?? String(err);
    return NextResponse.json({ error: "Failed to create task", detail }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session as any)?.userId as string | undefined;

  try {
    const { id } = await req.json() as { id: string };
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing)               return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.userId && existing.userId !== userId)
                                 return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Cascade deletes subtasks via Prisma self-relation onDelete: Cascade
    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Tasks DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
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
