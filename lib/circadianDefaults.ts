import { CircadianEventDTO } from "./circadianTypes";

export function buildDefaultCircadianEvents(baseDateStr?: string): CircadianEventDTO[] {
  // Parse YYYY-MM-DD in local-neutral noon anchor or today
  const base = baseDateStr ? new Date(`${baseDateStr}T00:00:00`) : new Date();
  const y = base.getFullYear();
  const m = base.getMonth();
  const d = base.getDate();

  const at = (hour: number, minute: number, dayOffset = 0) =>
    new Date(y, m, d + dayOffset, hour, minute, 0, 0).toISOString();

  return [
    {
      id: "default-cozier-rest",
      title: "Cozier Rest",
      description: "Deep REM & slow-wave cellular repair window before dawn emergence.",
      domain: "logistics",
      startTime: at(0, 0),
      endTime: at(7, 0),
      isRecurring: true,
      recurrenceRule: "FREQ=DAILY",
      mediaUrl: "/circadian/cozier-rest.jpg",
      mediaType: "image",
      mediaAspectRatio: "16:9",
      accentColor: "#60a5fa",
      quadrantSlot: 3,
      telemetrySource: "samsung_health",
      checklists: [
        { id: "chk-rest-1", label: "7h+ Sleep Architecture Lock", isCompleted: true, sortOrder: 0 },
        { id: "chk-rest-2", label: "66°F Thermal Blackout Protocol", isCompleted: true, sortOrder: 1 },
        { id: "chk-rest-3", label: "Dawn Hydration + Electrolytes", isCompleted: false, sortOrder: 2 },
      ],
    },
    {
      id: "default-gym-workout",
      title: "Gym Workout",
      description: "Heavy compound strength session in the garage gym during peak morning testosterone & cortisol alignment.",
      domain: "physical_training",
      startTime: at(8, 30),
      endTime: at(10, 0),
      isRecurring: true,
      recurrenceRule: "FREQ=DAILY",
      mediaUrl: "/circadian/gym-workout.jpg",
      mediaType: "image",
      mediaAspectRatio: "16:9",
      accentColor: "#fbbf24",
      quadrantSlot: 1,
      telemetrySource: "garmin",
      checklists: [
        { id: "chk-gym-1", label: "Barbell Compound Strength Sets", isCompleted: true, sortOrder: 0 },
        { id: "chk-gym-2", label: "Zone 2 Conditioning Finisher", isCompleted: false, sortOrder: 1 },
        { id: "chk-gym-3", label: "Renpho Telemetry Weigh-In", isCompleted: false, sortOrder: 2 },
      ],
    },
    {
      id: "default-saas-build",
      title: "SaaS Build",
      description: "High-leverage platform architecture, FastAPI/Next.js sprint execution, and zero-interruption deep work.",
      domain: "engineering",
      startTime: at(12, 0),
      endTime: at(17, 0),
      isRecurring: true,
      recurrenceRule: "FREQ=DAILY",
      mediaUrl: "/circadian/saas-build.jpg",
      mediaType: "image",
      mediaAspectRatio: "16:9",
      accentColor: "#f97316",
      quadrantSlot: 2,
      telemetrySource: "clickup",
      checklists: [
        { id: "chk-saas-1", label: "Core SaaS Architecture Sprint", isCompleted: false, sortOrder: 0 },
        { id: "chk-saas-2", label: "Supabase RLS & Telemetry Sync", isCompleted: false, sortOrder: 1 },
        { id: "chk-saas-3", label: "ClickUp Executive Queue Triage", isCompleted: true, sortOrder: 2 },
      ],
    },
    {
      id: "default-huskies-walk",
      title: "Nova & Astro Walk",
      description: "Sunset twilight walk with Nova & Astro — optic flow decompression and circadian dusk signaling.",
      domain: "family_pets",
      startTime: at(17, 30),
      endTime: at(18, 30),
      isRecurring: true,
      recurrenceRule: "FREQ=DAILY",
      mediaUrl: "/circadian/huskies-walk.jpg",
      mediaType: "image",
      mediaAspectRatio: "16:9",
      accentColor: "#10b981",
      quadrantSlot: 4,
      telemetrySource: "garmin",
      checklists: [
        { id: "chk-pack-1", label: "3-Mile Golden Hour Pack Walk", isCompleted: false, sortOrder: 0 },
        { id: "chk-pack-2", label: "Low-Angle Solar Dusk Exposure", isCompleted: false, sortOrder: 1 },
      ],
    },
    {
      id: "default-nutrition-refuel",
      title: "Protein Refuel & Fast Lock",
      description: "High-protein cast-iron dinner closing the 13:00–19:30 feeding window before 18h metabolic fast.",
      domain: "nutrition",
      startTime: at(18, 45),
      endTime: at(19, 45),
      isRecurring: true,
      recurrenceRule: "FREQ=DAILY",
      mediaUrl: "/circadian/nutrition-steak.jpg",
      mediaType: "image",
      mediaAspectRatio: "16:9",
      accentColor: "#ea580c",
      quadrantSlot: null,
      telemetrySource: "renpho",
      checklists: [
        { id: "chk-nut-1", label: "160g+ Protein Payload Complete", isCompleted: false, sortOrder: 0 },
        { id: "chk-nut-2", label: "19:30 Hard Stop & Fasting Lock", isCompleted: false, sortOrder: 1 },
      ],
    },
  ];
}

