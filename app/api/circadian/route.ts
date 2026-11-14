export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildDefaultCircadianEvents } from "@/lib/circadianDefaults";
import { EventDomain, MediaTypeEnum } from "@/lib/circadianTypes";

const VALID_DOMAINS: EventDomain[] = [
  "engineering",
  "physical_training",
  "nutrition",
  "family_pets",
  "logistics",
];

const VALID_MEDIA_TYPES: MediaTypeEnum[] = ["image", "video_loop"];

function projectRecurringToDate(event: any, targetDateStr?: string) {
  if (!targetDateStr || !event.isRecurring) return event;
  const [yStr, mStr, dStr] = targetDateStr.split("-");
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10) - 1;
  const d = parseInt(dStr, 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return event;

  const origStart = new Date(event.startTime);
  const origEnd = new Date(event.endTime);
  const durationMs = Math.max(15 * 60 * 1000, origEnd.getTime() - origStart.getTime());

  const projectedStart = new Date(
    y,
    m,
    d,
    origStart.getHours(),
    origStart.getMinutes(),
    0,
    0
  );
  const projectedEnd = new Date(projectedStart.getTime() + durationMs);

  return {
    ...event,
    startTime: projectedStart.toISOString(),
    endTime: projectedEnd.toISOString(),
  };
}

function eventOverlapsDate(start: Date, end: Date, targetDateStr: string, tz: string = "America/Denver"): boolean {
  try {
    const startStr = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(start);
    const endStr = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(end);
    return startStr <= targetDateStr && endStr >= targetDateStr;
  } catch {
    const targetMid = new Date(`${targetDateStr}T12:00:00Z`).getTime();
    return Math.abs(start.getTime() - targetMid) <= 18 * 60 * 60 * 1000;
  }
}

function inferDomainAndMedia(title: string, category?: string) {
  const t = (title || "").toLowerCase();
  if (
    t.includes("workout") ||
    t.includes("gym") ||
    t.includes("training") ||
    t.includes("lift") ||
    t.includes("exercise") ||
    t.includes("run") ||
    category === "workout"
  ) {
    return { domain: "physical_training" as const, mediaUrl: "/circadian/gym-workout.jpg", color: "#FF9900" };
  }
  if (
    t.includes("dinner") ||
    t.includes("lunch") ||
    t.includes("breakfast") ||
    t.includes("meal") ||
    t.includes("refuel") ||
    t.includes("fast") ||
    t.includes("protein") ||
    t.includes("eat")
  ) {
    return { domain: "nutrition" as const, mediaUrl: "/circadian/nutrition-steak.jpg", color: "#10B981" };
  }
  if (
    t.includes("walk") ||
    t.includes("dog") ||
    t.includes("dogs") ||
    t.includes("huskies") ||
    t.includes("nova") ||
    t.includes("astro") ||
    t.includes("poop break") ||
    t.includes("yard break") ||
    t.includes("park") ||
    t.includes("max") ||
    t.includes("school")
  ) {
    return { domain: "family_pets" as const, mediaUrl: "/circadian/huskies-walk.jpg", color: "#99FF33" };
  }
  if (
    t.includes("rest") ||
    t.includes("sleep") ||
    t.includes("bed") ||
    t.includes("cozier") ||
    t.includes("shower") ||
    t.includes("prep") ||
    t.includes("wake up") ||
    t.includes("trash")
  ) {
    return { domain: "logistics" as const, mediaUrl: "/circadian/cozier-rest.jpg", color: "#A855F7" };
  }
  return { domain: "engineering" as const, mediaUrl: "/circadian/saas-build.jpg", color: "#38BDF8" };
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = ((session as any)?.userId as string | undefined) ?? null;

  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date") || undefined;
  const tz = searchParams.get("tz") || "America/Denver";

  try {
    const whereClause = userId ? { userId } : { userId: null };
    const existing = await prisma.circadianEvent.findMany({
      where: whereClause,
      include: {
        checklists: {
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { startTime: "asc" },
    });

    let filtered: any[] = existing.map((ev) => ({
      ...ev,
      startTime: ev.startTime.toISOString(),
      endTime: ev.endTime.toISOString(),
    }));

    if (dateStr) {
      filtered = filtered
        .filter((ev) => {
          if (ev.isRecurring) return true;
          const s = new Date(ev.startTime);
          const e = new Date(ev.endTime);
          return eventOverlapsDate(s, e, dateStr, tz);
        })
        .map((ev) => projectRecurringToDate(ev, dateStr));
    }

    // Hydrate directly from public.calendar_events
    try {
      const calRows: any = await prisma.$queryRawUnsafe(`
        SELECT id, user_id, google_event_id, title, description,
               start_time, end_time, all_day, category, color_hex, recurrence_rule
        FROM public.calendar_events
        ORDER BY start_time ASC
      `);

      if (Array.isArray(calRows) && calRows.length > 0) {
        for (const row of calRows) {
          if (filtered.some((f) => f.id === row.id || (row.google_event_id && f.telemetrySource === row.google_event_id))) {
            continue;
          }
          const s = new Date(row.start_time);
          const e = new Date(row.end_time);

          if (dateStr && !row.recurrence_rule && !row.all_day) {
            const matches = eventOverlapsDate(s, e, dateStr, tz);
            if (!matches) {
              continue;
            }
          }

          const inferred = inferDomainAndMedia(row.title, row.category);
          filtered.push({
            id: row.id,
            userId: row.user_id,
            title: row.title,
            description: row.description || "",
            domain: inferred.domain,
            startTime: s.toISOString(),
            endTime: e.toISOString(),
            isRecurring: Boolean(row.recurrence_rule),
            recurrenceRule: row.recurrence_rule,
            allDay: Boolean(row.all_day),
            mediaUrl: inferred.mediaUrl,
            mediaType: "image" as any,
            mediaAspectRatio: "16:9",
            accentColor: row.color_hex || inferred.color,
            quadrantSlot: null,
            telemetrySource: row.google_event_id ? "google_calendar" : null,
            checklists: [],
            linkedTaskId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }
    } catch (e) {
      console.warn("Could not query public.calendar_events in circadian GET:", e);
    }

    // Sort events by startTime
    filtered.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    return NextResponse.json({ events: filtered });
  } catch (err: any) {
    console.error("Circadian GET error:", err?.message ?? err);
    return NextResponse.json({ events: [] });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = ((session as any)?.userId as string | undefined) ?? null;

  try {
    const body = await req.json();
    const {
      title,
      description,
      domain = "engineering",
      startTime,
      endTime,
      isRecurring = true,
      recurrenceRule = "FREQ=DAILY",
      mediaUrl = "/circadian/saas-build.jpg",
      mediaType = "image",
      mediaAspectRatio = "16:9",
      accentColor = "#2563eb",
      quadrantSlot = null,
      linkedTaskId = null,
      telemetrySource = null,
      checklists = [],
    } = body;

    if (!title || !startTime || !endTime) {
      return NextResponse.json(
        { error: "title, startTime, and endTime are required" },
        { status: 400 }
      );
    }

    const start = new Date(startTime);
    let end = new Date(endTime);
    if (end <= start) {
      // Handle midnight wrap-around automatically
      end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
    }

    const safeDomain: EventDomain = VALID_DOMAINS.includes(domain)
      ? domain
      : "engineering";
    const safeMediaType: MediaTypeEnum = VALID_MEDIA_TYPES.includes(mediaType)
      ? mediaType
      : "image";
    const safeSlot =
      typeof quadrantSlot === "number" && quadrantSlot >= 1 && quadrantSlot <= 4
        ? quadrantSlot
        : null;

    const created = await prisma.circadianEvent.create({
      data: {
        userId,
        title: String(title).slice(0, 120),
        description: description ? String(description) : null,
        domain: safeDomain,
        startTime: start,
        endTime: end,
        isRecurring: Boolean(isRecurring),
        recurrenceRule: recurrenceRule ? String(recurrenceRule) : null,
        mediaUrl: String(mediaUrl),
        mediaType: safeMediaType,
        mediaAspectRatio: String(mediaAspectRatio || "16:9"),
        accentColor: String(accentColor || "#2563eb").slice(0, 9),
        quadrantSlot: safeSlot,
        linkedTaskId: linkedTaskId ? String(linkedTaskId) : null,
        telemetrySource: telemetrySource ? String(telemetrySource) : null,
        checklists: {
          create: Array.isArray(checklists)
            ? checklists
                .filter((c: any) => c && c.label)
                .map((c: any, idx: number) => ({
                  label: String(c.label).slice(0, 255),
                  isCompleted: Boolean(c.isCompleted),
                  sortOrder: idx,
                }))
            : [],
        },
      },
      include: {
        checklists: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return NextResponse.json({
      event: {
        ...created,
        startTime: created.startTime.toISOString(),
        endTime: created.endTime.toISOString(),
      },
    });
  } catch (err: any) {
    console.error("Circadian POST error:", err);
    return NextResponse.json(
      { error: "Failed to create circadian event", detail: err?.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = ((session as any)?.userId as string | undefined) ?? null;

  try {
    const body = await req.json();

    // Action 1: Toggle a checklist item
    if (body.action === "toggle_checklist" && body.checklistId) {
      const item = await prisma.circadianEventChecklist.findUnique({
        where: { id: body.checklistId },
        include: { event: true },
      });
      if (!item) {
        return NextResponse.json({ error: "Checklist item not found" }, { status: 404 });
      }
      if (item.event.userId && item.event.userId !== userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const updatedItem = await prisma.circadianEventChecklist.update({
        where: { id: body.checklistId },
        data: {
          isCompleted:
            typeof body.isCompleted === "boolean"
              ? body.isCompleted
              : !item.isCompleted,
        },
      });
      return NextResponse.json({ checklist: updatedItem });
    }

    // Action 2: Add a checklist item directly to an event
    if (body.action === "add_checklist" && body.eventId && body.label) {
      const ev = await prisma.circadianEvent.findUnique({
        where: { id: body.eventId },
        include: { checklists: true },
      });
      if (!ev) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }
      if (ev.userId && ev.userId !== userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const createdItem = await prisma.circadianEventChecklist.create({
        data: {
          eventId: body.eventId,
          label: String(body.label).slice(0, 255),
          isCompleted: false,
          sortOrder: ev.checklists.length,
        },
      });
      return NextResponse.json({ checklist: createdItem });
    }

    // Action 3: Full event update
    const { id } = body;
    if (!id) {
      return NextResponse.json({ error: "Event id required" }, { status: 400 });
    }

    const existing = await prisma.circadianEvent.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    if (existing.userId && existing.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data: any = {};
    if (body.title !== undefined) data.title = String(body.title).slice(0, 120);
    if (body.description !== undefined)
      data.description = body.description ? String(body.description) : null;
    if (body.domain && VALID_DOMAINS.includes(body.domain))
      data.domain = body.domain;
    if (body.startTime && body.endTime) {
      const s = new Date(body.startTime);
      let e = new Date(body.endTime);
      if (e <= s) e = new Date(e.getTime() + 24 * 60 * 60 * 1000);
      data.startTime = s;
      data.endTime = e;
    }
    if (body.isRecurring !== undefined) data.isRecurring = Boolean(body.isRecurring);
    if (body.mediaUrl !== undefined) data.mediaUrl = String(body.mediaUrl);
    if (body.mediaType && VALID_MEDIA_TYPES.includes(body.mediaType))
      data.mediaType = body.mediaType;
    if (body.accentColor !== undefined)
      data.accentColor = String(body.accentColor).slice(0, 9);
    if (body.quadrantSlot !== undefined) {
      data.quadrantSlot =
        typeof body.quadrantSlot === "number" &&
        body.quadrantSlot >= 1 &&
        body.quadrantSlot <= 4
          ? body.quadrantSlot
          : null;
    }
    if (body.telemetrySource !== undefined) {
      data.telemetrySource = body.telemetrySource
        ? String(body.telemetrySource)
        : null;
    }

    if (Array.isArray(body.checklists)) {
      await prisma.circadianEventChecklist.deleteMany({ where: { eventId: id } });
      data.checklists = {
        create: body.checklists
          .filter((c: any) => c && c.label)
          .map((c: any, idx: number) => ({
            label: String(c.label).slice(0, 255),
            isCompleted: Boolean(c.isCompleted),
            sortOrder: idx,
          })),
      };
    }

    const updated = await prisma.circadianEvent.update({
      where: { id },
      data,
      include: {
        checklists: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return NextResponse.json({
      event: {
        ...updated,
        startTime: updated.startTime.toISOString(),
        endTime: updated.endTime.toISOString(),
      },
    });
  } catch (err: any) {
    console.error("Circadian PATCH error:", err);
    return NextResponse.json(
      { error: "Failed to update circadian event", detail: err?.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = ((session as any)?.userId as string | undefined) ?? null;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const existing = await prisma.circadianEvent.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (existing.userId && existing.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.circadianEvent.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Circadian DELETE error:", err);
    return NextResponse.json(
      { error: "Failed to delete circadian event" },
      { status: 500 }
    );
  }
}

