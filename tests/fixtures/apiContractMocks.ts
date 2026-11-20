import type { ScorecardSnapshot } from "@features/kpi-scorecard";
import type {
  CalendarHabitDTO,
  CalendarHighlightSpanDTO,
  WorkPaySummaryDTO,
  WorkShiftConfigDTO,
  WorkShiftLogDTO,
  YearlyAppointmentDTO,
} from "@/lib/circadianTypes";
import { DEFAULT_GLASS_THEME } from "@/lib/glassTheme";
import {
  AarLesson,
  MissionFlowDraft,
  missionDraftToStrategicTree,
  synthesizeMissionFlowDfy,
} from "@/lib/missionFlowTypes";
import {
  ChecklistItem,
  ClarifyingQuestion,
  StrategicDomain,
  StrategicTree,
} from "@/lib/synthesisRoadmapTypes";
import type {
  PmsListDTO,
  PmsSpaceDTO,
  PmsStatusDTO,
  PmsTaskDTO,
} from "@/lib/pmsTypes";

const VALID_DOMAINS: readonly StrategicDomain[] = [
  "master",
  "dogs",
  "health",
  "wealth",
  "family",
  "happiness",
  "custom",
];

function toStrategicDomain(raw: unknown): StrategicDomain {
  return typeof raw === "string" &&
    (VALID_DOMAINS as readonly string[]).includes(raw)
    ? (raw as StrategicDomain)
    : "master";
}

export function buildAuthSessionMock() {
  return {
    user: {
      name: "Isolated Test Commander",
      email: "isolated@test.local",
    },
    userId: "isolated-user-01",
    role: "ADMIN" as const,
    expires: "2099-01-01T00:00:00.000Z",
  };
}

export function buildUiPreferencesMock() {
  return {
    ok: true,
    persisted: false,
    theme: DEFAULT_GLASS_THEME,
    presetId: DEFAULT_GLASS_THEME.presetId,
    colorMode: DEFAULT_GLASS_THEME.colorMode,
    wheelStops: DEFAULT_GLASS_THEME.wheelStops,
    gradAngle: DEFAULT_GLASS_THEME.gradAngle,
    glassBlur: DEFAULT_GLASS_THEME.glassBlur,
    glassOpacity: DEFAULT_GLASS_THEME.glassOpacity,
    palsVisible: true,
    palsScenario: "auto",
    preferences: null,
  };
}

export function buildCalendarOpsMock() {
  const habits: CalendarHabitDTO[] = [];
  const highlightSpans: CalendarHighlightSpanDTO[] = [];
  const shiftConfig: WorkShiftConfigDTO = {
    roleLabel: "Primary Operations & Engineering Shift",
    payPerShift: 320,
    hourlyRate: 40,
    hoursPerShift: 8,
    totalScheduledDays: 22,
    shiftsPerWeek: 5,
  };
  const shiftLogs: WorkShiftLogDTO[] = [];
  const paySummary: WorkPaySummaryDTO = {
    payRate: 320,
    daysWorked: 0,
    totalScheduledDays: 22,
    workedPct: 0,
    todayLogged: false,
    dailyShifts: 0,
    dailyPay: 0,
    dailyExpense: 0,
    weeklyShifts: 0,
    weeklyPay: 0,
    weeklyTargetPay: 1600,
    biWeeklyShifts: 0,
    biWeeklyPay: 0,
    biWeeklyTargetPay: 3200,
    monthlyShifts: 0,
    monthlyPay: 0,
    monthlyActualPaid: 0,
    scheduledMonthlyTotal: 7040,
    monthlyExpenseTotal: 0,
  };
  const appointments: YearlyAppointmentDTO[] = [];

  return {
    habits,
    highlightSpans,
    shiftConfig,
    shiftLogs,
    paySummary,
    appointments,
  };
}

export function buildCircadianRadarMock(dateStr = "2026-11-20") {
  return {
    date: dateStr,
    userId: "isolated-user-01",
    bucketCount: 96,
    layers: [],
  };
}

export function buildGoogleSyncMock() {
  return {
    success: false,
    connected: false,
    syncedCount: 0,
    totalGoogleEvents: 0,
    calendarsSynced: 0,
  };
}

export function buildKpiScorecardMock(): {
  ok: boolean;
  snapshots: ScorecardSnapshot[];
  streakCount: number;
  latest: ScorecardSnapshot | null;
} {
  return {
    ok: true,
    snapshots: [],
    streakCount: 0,
    latest: null,
  };
}

export function buildMissionFlowGetMock(): {
  success: boolean;
  missions: Array<{
    id: string;
    domain: StrategicDomain;
    title: string;
    payload: MissionFlowDraft;
    status: string;
    createdAt: string;
    updatedAt: string;
  }>;
  lessons: AarLesson[];
} {
  return {
    success: true,
    missions: [],
    lessons: [],
  };
}

export function buildMissionFlowPostMock(body: Record<string, unknown>) {
  const action = typeof body.action === "string" ? body.action : "deploy_mission";

  if (action === "create_acquisition_task") {
    return { success: true };
  }

  if (action === "save_aar_lesson") {
    const lesson: AarLesson = {
      id: "isolated-aar-01",
      missionTitle:
        typeof body.missionTitle === "string" && body.missionTitle.trim()
          ? body.missionTitle
          : "Isolated Test Mission",
      domain: toStrategicDomain(body.domain),
      whatWorked:
        typeof body.whatWorked === "string"
          ? body.whatWorked
          : "Deterministic state machine",
      whatBroke: typeof body.whatBroke === "string" ? body.whatBroke : "None",
      ruleChange:
        typeof body.ruleChange === "string"
          ? body.ruleChange
          : "Maintain isolation",
      createdAt: "2026-11-20T00:00:00.000Z",
    };
    return {
      success: true,
      lesson,
    };
  }

  const draft = (body.draft ?? null) as MissionFlowDraft | null;
  const nodeCount = Array.isArray(draft?.nodes) ? draft.nodes.length : 3;
  return {
    success: true,
    id: "isolated-mission-01",
    deployedAt:
      action === "deploy_mission"
        ? "2026-11-20T00:00:00.000Z"
        : (draft?.deployedAt ?? null),
    pmsSynced: action === "deploy_mission" ? nodeCount : 0,
    calendarSynced: action === "deploy_mission" ? nodeCount : 0,
  };
}

export function buildRoadmapsSynthesizeMock(body: Record<string, unknown>):
  | {
      success: true;
      tree: StrategicTree;
      source: "deterministic" | "dwy_refined";
    }
  | {
      success: true;
      questions: ClarifyingQuestion[];
    }
  | {
      success: true;
      message: string;
      createdTasks: Array<{ checkId: string; taskId: string; title: string }>;
    }
  | {
      success: true;
      message: string;
      event: {
        id: string;
        title: string;
        startTime: string;
        endTime: string;
      };
    } {
  const action = typeof body.action === "string" ? body.action : "dfy";
  const domain = toStrategicDomain(body.domain);
  const goalPrompt =
    typeof body.goalPrompt === "string" && body.goalPrompt.trim()
      ? body.goalPrompt.trim()
      : "Autonomous Execution";

  if (action === "dwy_init") {
    const questions: ClarifyingQuestion[] = [
      {
        id: "q_target",
        question: `What is your quantitative target for "${goalPrompt}"?`,
        description: "Exact measurable target and completion window.",
        placeholder: "Target metric & date...",
        suggestedAnswers: ["155 lbs @ 8% body fat in 90 days"],
      },
      {
        id: "q_inventory",
        question: "What verified resources do you already have?",
        description: "Maps to Tier 0 [HAVE] cards.",
        placeholder: "Tools, assets, baseline data...",
        suggestedAnswers: ["Verified workspace and baseline telemetry"],
      },
      {
        id: "q_constraints",
        question: "What are your primary constraints or bottlenecks?",
        description: "Maps to [NEED]/[BLOCKED] audit badges and PACE fallbacks.",
        placeholder: "Time or supply constraints...",
        suggestedAnswers: ["Strict 22:00 evening hard stop"],
      },
    ];
    return { success: true, questions };
  }

  if (action === "sync_pms") {
    const nodeTitle =
      typeof body.nodeTitle === "string" ? body.nodeTitle : "DAG Node";
    const checks = Array.isArray(body.checks)
      ? (body.checks as ChecklistItem[])
      : [];
    const createdTasks = checks.map((chk, idx) => ({
      checkId: chk.id || `chk_${idx}`,
      taskId: `isolated-pms-task-${idx + 1}`,
      title: `[${nodeTitle}] ${chk.label || "Subtask"}`,
    }));
    return {
      success: true,
      message: `Synced ${createdTasks.length} subtasks to Sovereign PMS!`,
      createdTasks,
    };
  }

  if (action === "sync_calendar") {
    const nodeTitle =
      typeof body.nodeTitle === "string" ? body.nodeTitle : "DAG Node";
    return {
      success: true,
      message: `Scheduled "${nodeTitle}" onto Circadian Solar Arc!`,
      event: {
        id: "isolated-circadian-ev-01",
        title: `[DAG] ${nodeTitle}`,
        startTime: "2026-11-20T09:00:00.000Z",
        endTime: "2026-11-20T10:30:00.000Z",
      },
    };
  }

  const draft = synthesizeMissionFlowDfy(goalPrompt, domain);
  const tree: StrategicTree = {
    ...missionDraftToStrategicTree(draft),
    id: "synth_isolated_01",
  };

  return {
    success: true,
    tree,
    source: action === "dwy_refine" ? "dwy_refined" : "deterministic",
  };
}

export function buildPmsWorkspaceMock(): {
  spaces: PmsSpaceDTO[];
  lists: PmsListDTO[];
  statuses: PmsStatusDTO[];
  tasks: PmsTaskDTO[];
} {
  const spaceId = "iso-space-ops";
  const listId = "iso-list-sprint";
  const statuses: PmsStatusDTO[] = [
    { id: "st-todo", space_id: spaceId, name: "TO DO", category: "not_started", color_hex: "#3B82F6", sort_order: 0 },
    { id: "st-prog", space_id: spaceId, name: "IN PROGRESS", category: "active", color_hex: "#F59E0B", sort_order: 1 },
    { id: "st-rev", space_id: spaceId, name: "REVIEW", category: "active", color_hex: "#A855F7", sort_order: 2 },
    { id: "st-done", space_id: spaceId, name: "COMPLETE", category: "closed", color_hex: "#10B981", sort_order: 3 },
  ];
  const lists: PmsListDTO[] = [
    { id: listId, space_id: spaceId, folder_id: null, name: "Q4 Sprint", space_name: "Sovereign Ops" },
  ];
  const spaces: PmsSpaceDTO[] = [
    {
      id: spaceId,
      workspace_id: "iso-ws-01",
      name: "Sovereign Ops",
      color_hex: "#4984fd",
      icon: "cpu",
      is_private: false,
      folders: [],
      lists,
      statuses,
    },
  ];
  const tasks: PmsTaskDTO[] = [
    {
      id: "iso-task-1",
      list_id: listId,
      space_id: spaceId,
      folder_id: null,
      parent_task_id: null,
      name: "Ship ClickUp-Style Grouped List & Board",
      description: "## Spec\n- Collapsible status groups\n- Slide-over inspector",
      status_id: "st-todo",
      status_name: "TO DO",
      status_category: "not_started",
      status_color: "#3B82F6",
      priority: "high",
      start_date: "2026-11-20T09:00:00.000Z",
      due_date: "2026-11-22T12:00:00.000Z",
      time_estimate_ms: 5400000,
      time_estimate_minutes: 90,
      tags: ["sovereign", "pms"],
      sort_order: 0,
      created_at: "2026-11-20T08:00:00.000Z",
      updated_at: "2026-11-20T08:00:00.000Z",
      space_name: "Sovereign Ops",
      list_name: "Q4 Sprint",
      folder_name: null,
      checklists: [
        { id: "iso-chk-1", task_id: "iso-task-1", name: "Verify DnD status sync", is_completed: false, sort_order: 0 },
      ],
      comments: [],
      dependencies: [],
      subtasks: [],
    },
    {
      id: "iso-task-2",
      list_id: listId,
      space_id: spaceId,
      folder_id: null,
      parent_task_id: null,
      name: "Audit Production Telemetry Gates",
      description: "Ensure zero console errors across all routes.",
      status_id: "st-prog",
      status_name: "IN PROGRESS",
      status_category: "active",
      status_color: "#F59E0B",
      priority: "urgent",
      start_date: null,
      due_date: "2026-11-24T12:00:00.000Z",
      time_estimate_ms: 3600000,
      time_estimate_minutes: 60,
      tags: ["ops"],
      sort_order: 1,
      created_at: "2026-11-20T08:30:00.000Z",
      updated_at: "2026-11-20T08:30:00.000Z",
      space_name: "Sovereign Ops",
      list_name: "Q4 Sprint",
      folder_name: null,
      checklists: [],
      comments: [],
      dependencies: [],
      subtasks: [],
    },
  ];
  return { spaces, lists, statuses, tasks };
}
