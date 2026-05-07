import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    // Allow fetching without user ID if there's no auth, but filter if user exists
    const metrics = await prisma.scorecard.findMany({
      where: userId ? { userId } : undefined,
    });
    
    return NextResponse.json({ metrics });
  } catch (error: any) {
    console.error("GET metrics error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    const body = await req.json();
    const { id, metricName, value, target, category } = body;
    
    if (id) {
      // Update existing metric
      const updated = await prisma.scorecard.update({
        where: { id },
        data: { value, target },
      });
      return NextResponse.json({ metric: updated });
    } else {
      // Create new metric if no ID provided
      const newMetric = await prisma.scorecard.create({
        data: {
          metricName,
          value,
          target: target ?? 0,
          category,
          userId,
        },
      });
      return NextResponse.json({ metric: newMetric });
    }
  } catch (error: any) {
    console.error("PATCH metrics error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
