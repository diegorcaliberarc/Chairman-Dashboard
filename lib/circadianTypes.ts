export type EventDomain =
  | "engineering"
  | "physical_training"
  | "nutrition"
  | "family_pets"
  | "logistics";

export type MediaTypeEnum = "image" | "video_loop";

export type SubtaskListStyle = "roman" | "bullets";

export interface ChecklistItem {
  id: string;
  eventId?: string;
  label: string;
  isCompleted: boolean;
  sortOrder: number;
  timeWindow?: string;
}

export interface NestedSubtaskItem {
  id: string;
  label: string;
  timeWindow?: string;
  isCompleted: boolean;
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
  subtaskStyle?: SubtaskListStyle;
  dailyMoneyUsed?: number;
  anticipatedPay?: number;
  actualPay?: number;
  isHighlightedSpan?: boolean;
}

export interface CalendarHabitDTO {
  id: string;
  title: string;
  subtitle: string;
  unit: string;
  targetValue: number;
  currentValue: number;
  pct: number;
  ringColor: string;
  iconName: string;
  sortOrder: number;
}

export interface CalendarHighlightSpanDTO {
  id: string;
  label: string;
  spanType: "hours" | "multi_day";
  startMinute: number;
  endMinute: number;
  startDate?: string | null;
  endDate?: string | null;
  color: string;
  opacity: number;
  isActive: boolean;
}

export interface WorkShiftConfigDTO {
  roleLabel: string;
  payPerShift: number;
  hourlyRate: number;
  hoursPerShift: number;
  totalScheduledDays: number;
  shiftsPerWeek: number;
}

export interface WorkShiftLogDTO {
  id: string;
  workDate: string;
  shiftsCount: number;
  payRateOverride?: number | null;
  anticipatedPay: number;
  actualPay: number;
  dailyExpense: number;
  status: "worked" | "scheduled" | "off";
  notes: string;
  subtaskStyle: SubtaskListStyle;
  subtasks: NestedSubtaskItem[];
}

export interface WorkPaySummaryDTO {
  payRate: number;
  daysWorked: number;
  totalScheduledDays: number;
  workedPct: number;
  todayLogged: boolean;
  dailyShifts: number;
  dailyPay: number;
  dailyExpense: number;
  weeklyShifts: number;
  weeklyPay: number;
  weeklyTargetPay: number;
  biWeeklyShifts: number;
  biWeeklyPay: number;
  biWeeklyTargetPay: number;
  monthlyShifts: number;
  monthlyPay: number;
  monthlyActualPaid: number;
  scheduledMonthlyTotal: number;
  monthlyExpenseTotal: number;
}

export type AppointmentCategory =
  | "work"
  | "client"
  | "medical"
  | "personal"
  | "financial";

export interface YearlyAppointmentDTO {
  id: string;
  title: string;
  category: AppointmentCategory;
  appointmentDate: string; // YYYY-MM-DD
  startTime: string;       // HH:MM
  endTime: string;         // HH:MM
  accentColor: string;
  dailyMoneyUsed: number;
  anticipatedPay: number;
  actualPay: number;
  subtaskStyle: SubtaskListStyle;
  subtasks: NestedSubtaskItem[];
  notes: string;
}

export interface BudgetMonthDTO {
  id?: string;
  budgetYear: number;
  budgetMonth: number; // 1..12
  incomeTarget: number;
  expenseCap: number;
  savingsTarget: number;
  notes: string;
}

export interface BudgetEntryDTO {
  id: string;
  budgetYear: number;
  budgetMonth: number;
  entryDate: string;
  entryType: "income" | "expense" | "savings";
  category: string;
  label: string;
  plannedAmount: number;
  actualAmount: number;
  linkedSource: "manual" | "shift" | "appointment" | "life_ops";
}

export interface ConnectedMonthRollupDTO {
  month: number; // 1..12
  monthShort: string;
  monthLabel: string;
  targets: BudgetMonthDTO;
  workedDays: number;
  workedShifts: number;
  scheduledDays: number;
  shiftAnticipatedPay: number;
  shiftActualPay: number;
  shiftDailyExpenses: number;
  appointmentCount: number;
  apptAnticipatedPay: number;
  apptActualPay: number;
  apptDailyMoneyUsed: number;
  manualPlannedIncome: number;
  manualActualIncome: number;
  manualPlannedExpense: number;
  manualActualExpense: number;
  manualPlannedSavings: number;
  manualActualSavings: number;
  totalAnticipatedIncome: number;
  totalActualIncome: number;
  totalActualSpend: number;
  totalSavings: number;
  netCashFlow: number;
  freeCashFlowAfterSavings: number;
  incomeVariance: number;
}

/**
 * Convert 1-based positive integer into classic Roman Numerals (I, II, III, IV, V...)
 */
export function toRomanNumeral(num: number): string {
  const n = Math.max(1, Math.min(3999, Math.floor(num)));
  const pairs: Array<[number, string]> = [
    [1000, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let rem = n;
  let out = "";
  for (const [val, sym] of pairs) {
    while (rem >= val) {
      out += sym;
      rem -= val;
    }
  }
  return out;
}

export function formatSubtaskMarker(
  indexZeroBased: number,
  style: SubtaskListStyle = "roman"
): string {
  return style === "roman" ? `${toRomanNumeral(indexZeroBased + 1)}.` : "•";
}

export const CURATED_BLOCK_PALETTE: Array<{ hex: string; name: string }> = [
  { hex: "#10b981", name: "Emerald Pulse" },
  { hex: "#38bdf8", name: "Solar Cerulean" },
  { hex: "#f59e0b", name: "Chairman Amber" },
  { hex: "#8b5cf6", name: "Astral Violet" },
  { hex: "#f97316", name: "Forge Tangerine" },
  { hex: "#06b6d4", name: "Cryo Cyan" },
  { hex: "#ec4899", name: "Neon Rose" },
  { hex: "#2563eb", name: "Deep Cobalt" },
  { hex: "#eab308", name: "Apex Gold" },
  { hex: "#14b8a6", name: "Bio Teal" },
  { hex: "#f43f5e", name: "Crimson Spark" },
  { hex: "#84cc16", name: "Kinetic Lime" },
];

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
