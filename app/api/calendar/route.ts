import { getServerSession } from "next-auth/next";
import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

function getWeekBounds() {
  const today = new Date();
  const dow   = today.getDay();
  const off   = dow === 0 ? -6 : 1 - dow;
  const mon   = new Date(today);
  mon.setDate(today.getDate() + off);
  mon.setHours(0, 0, 0, 0);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 7);
  return { timeMin: mon.toISOString(), timeMax: sun.toISOString() };
}

function buildCalendar(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.calendar({ version: "v3", auth });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const token   = (session as any)?.accessToken as string | undefined;

  if (!session || !token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cal    = buildCalendar(token);
    const bounds = getWeekBounds();
    const res    = await cal.events.list({
      calendarId:   "primary",
      timeMin:      bounds.timeMin,
      timeMax:      bounds.timeMax,
      singleEvents: true,
      orderBy:      "startTime",
      maxResults:   2500,
    });

    return NextResponse.json({ events: res.data.items ?? [] });
  } catch (err) {
    console.error("Calendar GET error:", err);
    return NextResponse.json({ error: "Calendar fetch failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const token   = (session as any)?.accessToken as string | undefined;

  if (!session || !token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body  = await req.json();
  const { title, start, end } = body as { title: string; start: string; end: string };

  if (!title || !start || !end) {
    return NextResponse.json({ error: "title, start, end required" }, { status: 400 });
  }

  try {
    const cal = buildCalendar(token);
    const res = await cal.events.insert({
      calendarId:  "primary",
      requestBody: {
        summary: title,
        start:   { dateTime: start },
        end:     { dateTime: end },
      },
    });

    return NextResponse.json({ event: res.data });
  } catch (err) {
    console.error("Calendar POST error:", err);
    return NextResponse.json({ error: "Event creation failed" }, { status: 500 });
  }
}
