import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function refreshGoogleAccessToken(refreshToken: string) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      console.warn("GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET missing in environment");
      return null;
    }

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });
    if (res.ok) {
      const data = await res.json();
      const newAccessToken = data.access_token as string;
      if (newAccessToken) {
        // Persist fresh access token to user_integrations
        try {
          await prisma.$executeRawUnsafe(
            `UPDATE public.user_integrations
             SET access_token = $1, updated_at = NOW()
             WHERE provider = 'google_calendar'`,
            newAccessToken
          );
        } catch (e) {
          console.warn("Could not update user_integrations with fresh token:", e);
        }

        // Persist fresh token to Prisma Account table
        try {
          await prisma.account.updateMany({
            where: { provider: "google" },
            data: { access_token: newAccessToken },
          });
        } catch (e) {
          console.warn("Could not update account table with fresh token:", e);
        }

        return newAccessToken;
      }
    } else {
      console.error("Failed to refresh Google token, status:", res.status, await res.text());
    }
  } catch (err) {
    console.error("Failed to refresh Google token exception:", err);
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

function inferCategoryAndColor(title: string, googleColorId?: string | null) {
  const t = (title || "").toLowerCase();
  if (t.includes("workout") || t.includes("gym") || t.includes("lift") || t.includes("training") || t.includes("run") || t.includes("exercise")) {
    return { category: "workout", colorHex: "#EF4444" };
  }
  if (t.includes("dinner") || t.includes("lunch") || t.includes("breakfast") || t.includes("meal") || t.includes("refuel") || t.includes("fast")) {
    return { category: "personal", colorHex: "#10B981" };
  }
  if (t.includes("sleep") || t.includes("rest") || t.includes("bed") || t.includes("shower") || t.includes("cozier")) {
    return { category: "personal", colorHex: "#8B5CF6" };
  }
  if (t.includes("nova") || t.includes("astro") || t.includes("dog") || t.includes("dogs") || t.includes("walk") || t.includes("pack") || t.includes("poop break") || t.includes("yard break")) {
    return { category: "personal", colorHex: "#22C55E" };
  }
  if (t.includes("max") || t.includes("school") || t.includes("family")) {
    return { category: "personal", colorHex: "#F59E0B" };
  }
  if (t.includes("trading") || t.includes("saas") || t.includes("board") || t.includes("clickup") || t.includes("work") || t.includes("review")) {
    return { category: "work", colorHex: "#3B82F6" };
  }

  // Google color IDs mapping
  const colorMap: Record<string, string> = {
    "1": "#7986CB", // Lavender
    "2": "#33B679", // Sage
    "3": "#8E24AA", // Grape
    "4": "#E67C73", // Flamingo
    "5": "#F6BF26", // Banana
    "6": "#F4511E", // Tangerine
    "7": "#039BE5", // Peacock
    "8": "#616161", // Graphite
    "9": "#3F51B5", // Blueberry
    "10": "#0B8043", // Basil
    "11": "#D50000", // Tomato
  };

  const colorHex = (googleColorId && colorMap[googleColorId]) || "#3B82F6";
  return { category: "google_sync", colorHex };
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

    // Time window: -30 days to +90 days around now
    const now = new Date();
    const timeMin = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const timeMax = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Discover all user calendars
    const calendarIds = new Set<string>();
    calendarIds.add("primary");

    let calListRes = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (calListRes.status === 401 && refreshToken) {
      const refreshedToken = await refreshGoogleAccessToken(refreshToken);
      if (refreshedToken) {
        accessToken = refreshedToken;
        calListRes = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      }
    }

    if (calListRes.ok) {
      const calListData = await calListRes.json();
      for (const cal of calListData.items || []) {
        if (cal.id && !cal.deleted) {
          calendarIds.add(cal.id);
        }
      }
    }

    let totalSynced = 0;
    let totalFound = 0;

    // 2. Fetch and paginate events for each calendar
    for (const calId of Array.from(calendarIds)) {
      let pageToken: string | undefined = undefined;
      let pageCount = 0;

      do {
        pageCount++;
        const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events`);
        url.searchParams.set("singleEvents", "true");
        url.searchParams.set("timeMin", timeMin);
        url.searchParams.set("timeMax", timeMax);
        url.searchParams.set("maxResults", "250");
        url.searchParams.set("orderBy", "startTime");
        if (pageToken) {
          url.searchParams.set("pageToken", pageToken);
        }

        let eventsRes = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (eventsRes.status === 401 && refreshToken) {
          const refreshedToken = await refreshGoogleAccessToken(refreshToken);
          if (refreshedToken) {
            accessToken = refreshedToken;
            eventsRes = await fetch(url.toString(), {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
          }
        }

        if (!eventsRes.ok) {
          break;
        }

        const eventsData = await eventsRes.json();
        const items = eventsData.items || [];
        totalFound += items.length;

        for (const item of items) {
          if (!item.id || item.status === "cancelled") continue;

          const title = item.summary || "Untitled Google Event";
          const description = item.description || null;
          const allDay = Boolean(item.start?.date);
          const startTime = item.start?.dateTime || `${item.start?.date}T00:00:00Z`;
          const endTime = item.end?.dateTime || `${item.end?.date}T23:59:59Z`;
          const { category, colorHex } = inferCategoryAndColor(title, item.colorId);

          try {
            await prisma.$executeRawUnsafe(
              `INSERT INTO public.calendar_events (
                google_event_id, title, description, start_time, end_time,
                all_day, category, color_hex, updated_at
              )
              VALUES (
                $1, $2, $3, $4::timestamptz, $5::timestamptz,
                $6, $7::calendar_category_enum, $8, NOW()
              )
              ON CONFLICT (google_event_id) DO UPDATE
              SET title = EXCLUDED.title,
                  description = EXCLUDED.description,
                  start_time = EXCLUDED.start_time,
                  end_time = EXCLUDED.end_time,
                  all_day = EXCLUDED.all_day,
                  color_hex = EXCLUDED.color_hex,
                  category = EXCLUDED.category,
                  updated_at = NOW();`,
              item.id,
              title,
              description,
              startTime,
              endTime,
              allDay,
              category,
              colorHex
            );
            totalSynced++;
          } catch (err) {
            console.warn(`Failed to upsert Google event ${item.id}:`, err);
          }
        }

        pageToken = eventsData.nextPageToken;
      } while (pageToken && pageCount < 20);
    }

    return NextResponse.json({
      success: true,
      connected: true,
      syncedCount: totalSynced,
      totalGoogleEvents: totalFound,
      calendarsSynced: calendarIds.size,
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
