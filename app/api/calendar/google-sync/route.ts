import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function refreshGoogleAccessToken(refreshToken: string) {
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.access_token as string;
    }
  } catch (err) {
    console.error("Failed to refresh Google token:", err);
  }
  return null;
}

async function resolveGoogleCredentials(session: any) {
  let accessToken = (session as any)?.accessToken;
  let refreshToken = (session as any)?.refreshToken;

  // Try fetching from user_integrations table
  try {
    const rows: any = await prisma.$queryRawUnsafe(`
      SELECT access_token, refresh_token
      FROM public.user_integrations
      WHERE provider = 'google_calendar'
      ORDER BY updated_at DESC
      LIMIT 1
    `);
    if (rows && rows.length > 0) {
      if (!accessToken && rows[0].access_token) {
        accessToken = rows[0].access_token;
      }
      if (!refreshToken && rows[0].refresh_token) {
        refreshToken = rows[0].refresh_token;
      }
    }
  } catch (e) {
    console.warn("Could not query user_integrations:", e);
  }

  // Try Prisma Account table
  if (!accessToken || !refreshToken) {
    const account = await prisma.account.findFirst({
      where: { provider: "google" },
      orderBy: { id: "desc" },
    });
    if (account) {
      if (!accessToken && account.access_token) accessToken = account.access_token;
      if (!refreshToken && account.refresh_token) refreshToken = account.refresh_token;
    }
  }

  return { accessToken, refreshToken };
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    let { accessToken, refreshToken } = await resolveGoogleCredentials(session);

    if (!accessToken && !refreshToken) {
      return NextResponse.json(
        { error: "No Google account connected. Please connect Google Calendar.", connected: false },
        { status: 401 }
      );
    }

    // Time window: -60 days to +180 days
    const now = new Date();
    const timeMin = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();
    const timeMax = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString();

    let gcalRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&timeMin=${encodeURIComponent(
        timeMin
      )}&timeMax=${encodeURIComponent(timeMax)}&maxResults=250`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    // If 401 unauthorized and we have a refresh token, refresh and retry once
    if (gcalRes.status === 401 && refreshToken) {
      const refreshedToken = await refreshGoogleAccessToken(refreshToken);
      if (refreshedToken) {
        accessToken = refreshedToken;
        gcalRes = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&timeMin=${encodeURIComponent(
            timeMin
          )}&timeMax=${encodeURIComponent(timeMax)}&maxResults=250`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
      }
    }

    if (!gcalRes.ok) {
      const errText = await gcalRes.text();
      return NextResponse.json(
        { error: "Google Calendar API error", details: errText, connected: false },
        { status: gcalRes.status }
      );
    }

    const gcalData = await gcalRes.json();
    const items = gcalData.items || [];
    let upsertedCount = 0;

    for (const item of items) {
      if (!item.id || item.status === "cancelled") continue;

      const title = item.summary || "Untitled Google Event";
      const description = item.description || null;
      const allDay = Boolean(item.start?.date);
      const startTime = item.start?.dateTime || `${item.start?.date}T00:00:00Z`;
      const endTime = item.end?.dateTime || `${item.end?.date}T23:59:59Z`;
      const colorHex = item.colorId ? "#EC4899" : "#3B82F6";

      try {
        await prisma.$executeRawUnsafe(`
          INSERT INTO public.calendar_events (
            google_event_id, title, description, start_time, end_time,
            all_day, category, color_hex, updated_at
          )
          VALUES (
            $1, $2, $3, $4::timestamptz, $5::timestamptz,
            $6, 'google_sync'::calendar_category_enum, $7, NOW()
          )
          ON CONFLICT (google_event_id) DO UPDATE
          SET title = EXCLUDED.title,
              description = EXCLUDED.description,
              start_time = EXCLUDED.start_time,
              end_time = EXCLUDED.end_time,
              all_day = EXCLUDED.all_day,
              color_hex = EXCLUDED.color_hex,
              updated_at = NOW();
        `,
        item.id,
        title,
        description,
        startTime,
        endTime,
        allDay,
        colorHex
        );
        upsertedCount++;
      } catch (err) {
        console.warn(`Failed to upsert Google event ${item.id}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      connected: true,
      syncedCount: upsertedCount,
      totalGoogleEvents: items.length,
    });
  } catch (error: any) {
    console.error("GET /api/calendar/google-sync error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    let { accessToken, refreshToken } = await resolveGoogleCredentials(session);

    if (!accessToken && !refreshToken) {
      return NextResponse.json(
        { error: "No Google account connected", connected: false },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));

    // If caller wants to push an event to Google Calendar
    if (body.action === "push_event" && body.event) {
      const ev = body.event;
      const gcalPayload = {
        summary: ev.title,
        description: ev.description,
        start: {
          dateTime: ev.startTime || ev.start_time,
          timeZone: "America/Denver",
        },
        end: {
          dateTime: ev.endTime || ev.end_time,
          timeZone: "America/Denver",
        },
      };

      let pushRes = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(gcalPayload),
        }
      );

      if (pushRes.status === 401 && refreshToken) {
        const refreshedToken = await refreshGoogleAccessToken(refreshToken);
        if (refreshedToken) {
          accessToken = refreshedToken;
          pushRes = await fetch(
            "https://www.googleapis.com/calendar/v3/calendars/primary/events",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(gcalPayload),
            }
          );
        }
      }

      if (pushRes.ok) {
        const createdGEvent = await pushRes.json();
        return NextResponse.json({ success: true, googleEvent: createdGEvent });
      }
    }

    // Default POST action: trigger full sync
    return GET(req);
  } catch (error: any) {
    console.error("POST /api/calendar/google-sync error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
