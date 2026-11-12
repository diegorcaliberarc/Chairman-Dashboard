export type EventDomain =
  | "engineering"
  | "physical_training"
  | "nutrition"
  | "family_pets"
  | "logistics";

export type MediaTypeEnum = "image" | "video_loop";

export interface ChecklistItem {
  id: string;
  eventId?: string;
  label: string;
  isCompleted: boolean;
  sortOrder: number;
}

export interface CircadianEventDTO {
  id: string;
  userId?: string | null;
  title: string;
  description?: string | null;
  domain: EventDomain;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  isRecurring: boolean;
  recurrenceRule?: string | null;
  mediaUrl: string;
  mediaType: MediaTypeEnum;
  mediaAspectRatio: string;
  accentColor: string;
  quadrantSlot?: number | null; // 1: Top-Left, 2: Top-Right, 3: Bottom-Left, 4: Bottom-Right
  linkedTaskId?: string | null;
  telemetrySource?: string | null;
  checklists: ChecklistItem[];
  showOnWedge?: boolean; // Whether to feature as outer curved photo wedge
}

export const DOMAIN_CONFIG: Record<
  EventDomain,
  {
    label: string;
    shortLabel: string;
    color: string;
    glow: string;
    badgeBg: string;
  }
> = {
  physical_training: {
    label: "Health & Physical Training",
    shortLabel: "TRAINING",
    color: "#10b981",
    glow: "rgba(16, 185, 129, 0.45)",
    badgeBg: "rgba(16, 185, 129, 0.14)",
  },
  engineering: {
    label: "Deep Work & Software Engineering",
    shortLabel: "ENGINEERING",
    color: "#2563eb",
    glow: "rgba(37, 99, 235, 0.45)",
    badgeBg: "rgba(37, 99, 235, 0.14)",
  },
  nutrition: {
    label: "Nutrition & Fasting",
    shortLabel: "NUTRITION",
    color: "#f97316",
    glow: "rgba(249, 115, 22, 0.45)",
    badgeBg: "rgba(249, 115, 22, 0.14)",
  },
  family_pets: {
    label: "Family, Pets & Recovery",
    shortLabel: "RECOVERY & PACK",
    color: "#8b5cf6",
    glow: "rgba(139, 92, 246, 0.45)",
    badgeBg: "rgba(139, 92, 246, 0.14)",
  },
  logistics: {
    label: "Executive Logistics & Sleep",
    shortLabel: "CIRCADIAN REST",
    color: "#38bdf8",
    glow: "rgba(56, 189, 248, 0.45)",
    badgeBg: "rgba(56, 189, 248, 0.14)",
  },
};

export const MEDIA_PRESETS: {
  id: string;
  label: string;
  url: string;
  domain: EventDomain;
  accent: string;
}[] = [
  {
    id: "rest",
    label: "Cozier Rest (Deep Sleep)",
    url: "/circadian/cozier-rest.jpg",
    domain: "logistics",
    accent: "#60a5fa",
  },
  {
    id: "gym",
    label: "Garage Gym Squat Rack",
    url: "/circadian/gym-workout.jpg",
    domain: "physical_training",
    accent: "#fbbf24",
  },
  {
    id: "saas",
    label: "Dual-Monitor SaaS Build",
    url: "/circadian/saas-build.jpg",
    domain: "engineering",
    accent: "#f97316",
  },
  {
    id: "huskies",
    label: "Nova & Astro Sunset Walk",
    url: "/circadian/huskies-walk.jpg",
    domain: "family_pets",
    accent: "#10b981",
  },
  {
    id: "steak",
    label: "Cast-Iron Ribeye Refuel",
    url: "/circadian/nutrition-steak.jpg",
    domain: "nutrition",
    accent: "#ea580c",
  },
];
