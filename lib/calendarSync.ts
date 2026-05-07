import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

export async function syncTaskToCalendar(userId: string, task: { id: string, title: string, startDate?: string | Date | null, dueDate?: string | Date | null }) {
  if (!task.startDate && !task.dueDate) return;

  // Retrieve user's access token from the database
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" }
  });

  if (!account || !account.access_token) {
    console.error("No Google account found for user or missing access_token");
    return;
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  
  oauth2Client.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token,
  });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const start = task.startDate ? new Date(task.startDate) : new Date(task.dueDate as string | Date);
  const end = task.dueDate ? new Date(task.dueDate) : new Date(start.getTime() + 24 * 60 * 60 * 1000);

  // If no time component is provided, create an all-day event
  const isAllDay = start.getHours() === 0 && start.getMinutes() === 0;

  const event: any = {
    summary: `[Task] ${task.title}`,
    description: `Auto-synced from Chairman Dashboard. Task ID: ${task.id}`,
    start: isAllDay ? { date: start.toISOString().split('T')[0] } : { dateTime: start.toISOString() },
    end: isAllDay ? { date: end.toISOString().split('T')[0] } : { dateTime: end.toISOString() },
  };

  try {
    const res = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
    });
    console.log("Calendar event created: ", res.data.htmlLink);
  } catch (err) {
    console.error("Failed to sync to Google Calendar:", err);
  }
}
