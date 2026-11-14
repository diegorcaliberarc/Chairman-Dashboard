import { CircadianEventDTO } from "./circadianTypes";

export function buildDefaultCircadianEvents(_baseDateStr?: string): CircadianEventDTO[] {
  // Purged all hardcoded dummy data (Cozier Rest, Gym Workout, SaaS Build, Nova Walk, etc.)
  // The system relies strictly on authenticated Google Calendar and user-created events.
  return [];
}
