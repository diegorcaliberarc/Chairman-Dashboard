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

  // Forcefully remove database-controlled fields to prevent binary format crashes
  if (req.method === 'POST') {
    delete body.id; 
  }
  delete body.createdAt;
  delete body.updatedAt;

  // Force boolean casting for completed state to prevent string ("false") crashes
  if (typeof body.completed === 'string') {
    body.completed = body.completed === 'true';
  }
  if (typeof body.isDelegated === 'string') {
    body.isDelegated = body.isDelegated === 'true';
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
    const sanitizedData: any = {
      title: body.title,
      userId: userId || null, // ensure task is linked to user
      
      // 1. STRINGS & ENUMS (Pass through safely for C-Suite and Domains)
      agentId: body.agentId, 
      category: body.category,
      pillar: body.pillar,
      status: body.status || "PENDING",
      priority: body.priority || "Normal",

      // 2. BOOLEANS
      isDelegated: body.isDelegated === true || body.isDelegated === "true",

      // 3. DATES & INTEGERS
      startDate: parseDateSafe(body.startDate),
      dueDate: parseDateSafe(body.dueDate),
      timeTracked: parseTimeSafe(body.timeTracked),

      // 4. STRICT UUID FOREIGN KEYS (Vaporize empty strings to null)
      parentId: (!body.parentId || body.parentId === "" || body.parentId === "null" || body.parentId === "undefined") ? null : body.parentId,
    };

    console.log("FINAL PRISMA PAYLOAD:", JSON.stringify(sanitizedData, null, 2));

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

    // Forcefully remove database-controlled fields to prevent binary format crashes
    if (req.method === 'POST') {
      delete body.id; 
    }
    delete body.createdAt;
    delete body.updatedAt;

    // Force boolean casting for completed state to prevent string ("false") crashes
    if (typeof body.completed === 'string') {
      body.completed = body.completed === 'true';
    }
    if (typeof body.isDelegated === 'string') {
      body.isDelegated = body.isDelegated === 'true';
    }
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

    const sanitizedData: any = {};
    if (body.title !== undefined) sanitizedData.title = body.title;
    if (body.agentId !== undefined) sanitizedData.agentId = body.agentId;
    if (body.category !== undefined) sanitizedData.category = body.category;
    if (body.pillar !== undefined) sanitizedData.pillar = body.pillar;
    if (body.status !== undefined) sanitizedData.status = body.status;
    if (body.priority !== undefined) sanitizedData.priority = body.priority;
    if (body.isDelegated !== undefined) sanitizedData.isDelegated = body.isDelegated === true || body.isDelegated === "true";
    if (body.startDate !== undefined) sanitizedData.startDate = parseDateSafe(body.startDate);
    if (body.dueDate !== undefined) sanitizedData.dueDate = parseDateSafe(body.dueDate);
    if (body.timeTracked !== undefined) sanitizedData.timeTracked = parseTimeSafe(body.timeTracked);
    if (body.parentId !== undefined) {
      sanitizedData.parentId = (!body.parentId || body.parentId === "" || body.parentId === "null" || body.parentId === "undefined") ? null : body.parentId;
    }

    console.log("FINAL PRISMA PAYLOAD:", JSON.stringify(sanitizedData, null, 2));

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
