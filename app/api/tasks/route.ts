export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncTaskToCalendar } from "@/lib/calendarSync";

// 1. Safe Date Parsing Failsafe
const parseDateSafe = (val: any) => {
  if (!val || val === "null" || val === "undefined" || String(val).trim() === "") return null;
  const d = new Date(val);
  return isNaN(d.valueOf()) ? null : d;
};

// 2. Safe Integer Parsing Failsafe
const parseTimeSafe = (val: any) => {
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? 0 : parsed;
};

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
        { priority:  "desc" },
        { createdAt: "desc" },
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

  const { title, pillar, agentId, category, status, isDelegated, priority, startDate, dueDate, timeTracked, parentId } = body as {
    title:        string;
    pillar:       string;
    agentId:      string;
    category?:    string;
    status?:      string;
    isDelegated?: boolean;
    priority?:    string;
    startDate?:   string;
    dueDate?:     string;
    timeTracked?: number;
    parentId?:    string;
  };

  console.log("Tasks POST body:", { title, pillar, agentId, category, status, priority, parentId });

  if (!title || !pillar || !agentId) {
    return NextResponse.json({ error: "title, pillar, agentId required" }, { status: 400 });
  }

  try {
    const sanitizedData = {
      ...body,
      // Scrub empty strings from UUID foreign keys
      parentId: (body.parentId === "" || body.parentId === "null") ? null : body.parentId,
      agentId: (body.agentId === "" || body.agentId === "null") ? null : body.agentId,
      userId: (body.userId === "" || body.userId === "null") ? null : body.userId,

      startDate: parseDateSafe(body.startDate),
      dueDate: parseDateSafe(body.dueDate),
      timeTracked: parseTimeSafe(body.timeTracked),
      priority: (body.priority && typeof body.priority === 'string') ? body.priority : 'None',
      status: (body.status && typeof body.status === 'string') ? body.status : 'To Do'
    };

    const task = await prisma.task.create({
      data: sanitizedData,
    });

    console.log("Tasks POST: created task id =", task.id);
    
    if (task.startDate || task.dueDate) {
      try {
        await syncTaskToCalendar(userId!, task);
      } catch (calendarError) {
        console.error("Google Calendar sync failed, but task was created:", calendarError);
      }
    }

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
    const { id, status, isDelegated, priority, startDate, dueDate, timeTracked } = body as {
      id:           string;
      status?:      string;
      isDelegated?: boolean;
      priority?:    string;
      startDate?:   string | null;
      dueDate?:     string | null;
      timeTracked?: number;
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

    const sanitizedData = {
      ...body,
      ...(body.parentId !== undefined && { parentId: (body.parentId === "" || body.parentId === "null") ? null : body.parentId }),
      ...(body.agentId !== undefined && { agentId: (body.agentId === "" || body.agentId === "null") ? null : body.agentId }),
      ...(body.userId !== undefined && { userId: (body.userId === "" || body.userId === "null") ? null : body.userId }),
      ...(body.startDate !== undefined && { startDate: parseDateSafe(body.startDate) }),
      ...(body.dueDate !== undefined && { dueDate: parseDateSafe(body.dueDate) }),
      ...(body.timeTracked !== undefined && { timeTracked: parseTimeSafe(body.timeTracked) }),
      ...(body.priority !== undefined && { priority: (body.priority && typeof body.priority === 'string') ? body.priority : 'None' }),
      ...(body.status !== undefined && { status: (body.status && typeof body.status === 'string') ? body.status : 'To Do' }),
    };

    // Remove ID so we don't try to update the primary key
    delete sanitizedData.id;

    const task = await prisma.task.update({ where: { id }, data: sanitizedData });
    
    if (body.startDate !== undefined || body.dueDate !== undefined) {
      try {
        await syncTaskToCalendar(userId!, task);
      } catch (calendarError) {
        console.error("Google Calendar sync failed, but task was updated:", calendarError);
      }
    }

    return NextResponse.json({ task });
  } catch (err) {
    console.error("Tasks PATCH error:", err);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}
