/**
 * Types for the Unified Temporal Command & 3D Geospatial Engine
 */

export type HorizonLevel = "DAY" | "WEEK" | "MONTH" | "YEAR";
export type DayMode = "SOLAR_WHEEL" | "GEOSPATIAL_3D";

export interface ConcentricTelemetry {
  healthPct: number; // 0..100 (Garmin, steps, workouts)
  workPct: number;   // 0..100 (ClickUp tasks closed, shift pay)
  sleepPct: number;  // 0..100 (Sleep architecture consistency)
}

export interface DaySegment {
  isoDay: number; // 1 (Mon) .. 7 (Sun)
  dayName: string; // "MON", "TUE", etc.
  dateNum: number; // 9, 10, 11, etc.
  dateStr: string; // YYYY-MM-DD
  isActiveToday: boolean;
  isPast: boolean;
  statusColor: string; // #FF9900 (Active/Today), #0088FF (Past/Done), #99FF33 (Upcoming), #9D4EDD (Sprint)
  primaryFocus: string;
  domain: "physical_training" | "engineering" | "family_pets" | "logistics" | "nutrition";
  mediaUrl: string;
  iconName: string;
  telemetry: ConcentricTelemetry;
}

export interface MonthNode {
  dayOfMonth: number; // 1..31
  dateStr: string; // YYYY-MM-DD
  isCurrentMonth: boolean;
  isToday: boolean;
  isActiveWeek: boolean;
  isPast: boolean;
  status: "completed" | "active_today" | "active_week" | "upcoming" | "dimmed";
  statusColor: string;
  taskCount: number;
}

export interface SeasonCard {
  id: "winter" | "spring" | "summer" | "fall";
  title: string;
  months: string;
  subtitle: string;
  strategicImperative: string;
  accentColor: string;
  mediaUrl: string;
  isActiveCurrent: boolean;
}

export interface TacticalWaypoint {
  id: string;
  title: string;
  category: "home_base" | "outdoor_transit" | "school" | "store" | "gym" | "recon";
  timeWindow: string;
  minuteOfDay: number; // 0..1439
  lat: number;
  lng: number;
  elevation: number;
  status: "completed" | "active" | "upcoming";
  accentColor: string;
  mediaUrl: string;
  subtasks: string[];
  isHomeBaseHub?: boolean;
  homeRadialOffset?: { dx: number; dy: number; label: string; icon: string }[];
}

export interface RouteLeg {
  id: string;
  fromId: string;
  toId: string;
  startMinute: number;
  endMinute: number;
  pathCoordinates: [number, number][]; // [lng, lat]
  color: string;
  mode: "DRIVE" | "WALK" | "STATIONARY";
}

export interface WeatherRadarLayer {
  precipIntensity: number; // 0..1
  cloudCoverage: number; // 0..1
  radarSweepAngle: number;
  temperature: number; // F
  condition: string;
}

