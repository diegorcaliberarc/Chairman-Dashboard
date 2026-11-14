import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const isValidUuid = (id?: string | null): boolean =>
  typeof id === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    if (isValidUuid(id)) {
      const result: any = await prisma.$queryRawUnsafe(
        `SELECT * FROM public.calendar_events WHERE id = $1::uuid`,
        id
      );
      if (!result || result.length === 0) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json({ event: result[0] });
    }
    const circ = await prisma.circadianEvent.findUnique({
      where: { id },
      include: { checklists: true },
    });
    if (!circ) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ event: circ });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await req.json();
    const title = body.title;
    const description = body.description;
    const startTime = body.startTime || body.start_time;
    const endTime = body.endTime || body.end_time;
    const colorHex = body.colorHex || body.color_hex;
    const category = body.category;

    if (isValidUuid(id)) {
      const updateSql = `
        UPDATE public.calendar_events
        SET title = COALESCE($2, title),
            description = COALESCE($3, description),
            start_time = COALESCE($4::timestamptz, start_time),
            end_time = COALESCE($5::timestamptz, end_time),
            color_hex = COALESCE($6, color_hex),
            category = COALESCE($7::calendar_category_enum, category),
            updated_at = NOW()
        WHERE id = $1::uuid
        RETURNING *;
      `;
      const result: any = await prisma.$queryRawUnsafe(
        updateSql,
        id,
        title || null,
        description || null,
        startTime || null,
        endTime || null,
        colorHex || null,
        category || null
      );
      return NextResponse.json({ event: result[0] });
    } else {
      const updated = await prisma.circadianEvent.update({
        where: { id },
        data: {
          title: title || undefined,
          description: description !== undefined ? description : undefined,
          startTime: startTime ? new Date(startTime) : undefined,
          endTime: endTime ? new Date(endTime) : undefined,
          accentColor: colorHex || undefined,
        },
      });
      return NextResponse.json({ event: updated });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    if (isValidUuid(id)) {
      await prisma.$queryRawUnsafe(
        `DELETE FROM public.calendar_events WHERE id = $1::uuid`,
        id
      );
    } else {
      await prisma.circadianEvent.deleteMany({
        where: { id },
      });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
