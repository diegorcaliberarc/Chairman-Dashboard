import {
  AarLesson,
  MissionCoPilotMode,
  MissionFlowDraft,
  MissionWbsNode,
  computeMissionQuantification,
  pickMissionCoverImage,
  synthesizeMissionFlowDfy,
} from "@/lib/missionFlowTypes";
import { StrategicDomain } from "@/lib/synthesisRoadmapTypes";

export type MissionStageIndex = 0 | 1 | 2 | 3 | 4 | 5;
export type MissionAsyncPhase = "IDLE" | "DEPLOYING" | "SAVING_AAR";

export const MISSION_FLOW_STAGES: ReadonlyArray<{
  idx: MissionStageIndex;
  short: string;
  label: string;
}> = [
  { idx: 0, short: "0 · OOCEMR", label: "Strategic Crossroads (OOCEMR)" },
  { idx: 1, short: "1 · GOAL!!", label: "Visual End-State Lock" },
  { idx: 2, short: "2 · WBS 100%", label: "Backward-Chained DAG & WBS" },
  { idx: 3, short: "3 · BOM & CPM", label: "BOM Readiness & Critical Path" },
  { idx: 4, short: "4 · FRAGO/PACE", label: "Tactical Sync & Deploy" },
  { idx: 5, short: "5 · HUD & AAR", label: "Live Telemetry & AAR Vault" },
];

export interface MissionFlowMachineState {
  stage: MissionStageIndex;
  draft: MissionFlowDraft;
  asyncPhase: MissionAsyncPhase;
  lessons: AarLesson[];
  toast: { seq: number; message: string } | null;
}

export type MissionFlowEvent =
  | { type: "SET_STAGE"; stage: MissionStageIndex }
  | { type: "NEXT_STAGE" }
  | { type: "PREV_STAGE" }
  | { type: "SKIP_STAGE_0" }
  | { type: "SET_MODE"; mode: MissionCoPilotMode }
  | { type: "RUN_DFY"; prompt: string }
  | { type: "APPLY_DWY"; fallbackTitle: string; constraint: string; toolsCsv: string }
  | { type: "PATCH_DRAFT"; updater: (prev: MissionFlowDraft) => MissionFlowDraft }
  | { type: "ADD_WBS_NODE"; nodeId: string }
  | { type: "UPDATE_WBS_NODE"; id: string; patch: Partial<MissionWbsNode> }
  | { type: "DELETE_WBS_NODE"; id: string }
  | { type: "HYDRATE_LESSONS"; lessons: AarLesson[] }
  | { type: "DEPLOY_START" }
  | { type: "DEPLOY_REJECT_MISSING_TITLE" }
  | { type: "DEPLOY_SUCCESS"; updatedDraft: MissionFlowDraft; toastMsg: string }
  | { type: "DEPLOY_ERROR"; toastMsg: string }
  | { type: "SAVE_AAR_START" }
  | { type: "SAVE_AAR_SUCCESS"; lesson: AarLesson }
  | { type: "SAVE_AAR_FINISH" }
  | { type: "SHOW_TOAST"; message: string }
  | { type: "DISMISS_TOAST" };

export function createBlankMissionDraft(
  domain: StrategicDomain = "master",
  deadlineIso = "2026-12-31"
): MissionFlowDraft {
  return {
    mode: "dfy",
    oocemr: {
      skipped: false,
      outcome: "",
      options: [
        { id: "coa_1", label: "COA 1", upsides: "", downsides: "", timeCost: "", impactScore: 8, speedScore: 7, riskScore: 7, mitigation: "" },
        { id: "coa_2", label: "COA 2", upsides: "", downsides: "", timeCost: "", impactScore: 6, speedScore: 8, riskScore: 8, mitigation: "" },
        { id: "coa_3", label: "COA 3", upsides: "", downsides: "", timeCost: "", impactScore: 7, speedScore: 6, riskScore: 9, mitigation: "" },
      ],
      selectedOptionId: "coa_1",
      resolved: false,
    },
    endState: {
      domain,
      title: "",
      baselineValue: "0",
      targetValue: "100",
      unit: "%",
      hardDeadline: deadlineIso,
      commandersIntent: "",
      coverImageUrl: pickMissionCoverImage("", domain),
    },
    nodes: [],
    frago: { situation: "", mission: "", execution: "", sustainment: "", command: "" },
    paceMatrix: [
      { tier: "P", label: "Primary", ifTrigger: "Conditions green", thenAction: "" },
      { tier: "A", label: "Alternate", ifTrigger: "Primary dependency delayed >10m", thenAction: "" },
      { tier: "C", label: "Contingency", ifTrigger: "Window cut in half", thenAction: "" },
      { tier: "E", label: "Emergency", ifTrigger: "Hard abort / severe fatigue", thenAction: "" },
    ],
    activePace: "P",
  };
}

function clampStage(n: number): MissionStageIndex {
  return Math.max(0, Math.min(5, n)) as MissionStageIndex;
}

function nextToast(prev: MissionFlowMachineState["toast"], message: string) {
  return { seq: (prev?.seq ?? 0) + 1, message };
}

export function createInitialMissionFlowState(
  domain: StrategicDomain = "master"
): MissionFlowMachineState {
  return {
    stage: 0,
    draft: createBlankMissionDraft(domain),
    asyncPhase: "IDLE",
    lessons: [],
    toast: null,
  };
}

/**
 * Deterministic 6-stage state machine for the Guided Mission Flow Navigator:
 * - Enforces stage bounds [0..5]
 * - Enforces single-flight async transitions (DEPLOYING / SAVING_AAR)
 * - Redirects to Stage 1 when DEPLOY is attempted without an end-state title
 */
export function missionFlowReducer(
  state: MissionFlowMachineState,
  event: MissionFlowEvent
): MissionFlowMachineState {
  switch (event.type) {
    case "SET_STAGE":
      return { ...state, stage: clampStage(event.stage) };
    case "NEXT_STAGE":
      return { ...state, stage: clampStage(state.stage + 1) };
    case "PREV_STAGE":
      return { ...state, stage: clampStage(state.stage - 1) };
    case "SKIP_STAGE_0":
      return {
        ...state,
        stage: 1,
        draft: { ...state.draft, oocemr: { ...state.draft.oocemr, skipped: true } },
      };
    case "SET_MODE":
      return { ...state, draft: { ...state.draft, mode: event.mode } };
    case "RUN_DFY": {
      const trimmed = event.prompt.trim();
      if (!trimmed) return state;
      const generated = synthesizeMissionFlowDfy(trimmed, state.draft.endState.domain);
      return {
        ...state,
        draft: generated,
        stage: 1,
        toast: nextToast(state.toast, `Synthesized all 6 quantified stages for "${trimmed}"!`),
      };
    }
    case "APPLY_DWY": {
      const base = state.draft.endState.title || event.fallbackTitle.trim() || "Tactical Mission";
      const generated = synthesizeMissionFlowDfy(base, state.draft.endState.domain);
      generated.mode = "dwy";
      if (event.constraint.trim()) {
        generated.frago.situation += ` Hard constraint: ${event.constraint.trim()}.`;
      }
      if (event.toolsCsv.trim() && generated.nodes[0]) {
        generated.nodes[0].bomItems = event.toolsCsv
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
      return {
        ...state,
        draft: generated,
        toast: nextToast(state.toast, "Refined mission graph with your constraints & tools!"),
      };
    }
    case "PATCH_DRAFT":
      return { ...state, draft: event.updater(state.draft) };
    case "ADD_WBS_NODE": {
      const quant = computeMissionQuantification(state.draft);
      const remainingWeight = Math.max(0, 100 - quant.wbsCoveragePct);
      const count = state.draft.nodes.length;
      const newNode: MissionWbsNode = {
        id: event.nodeId,
        loe: `LOE ${count + 1}`,
        tier: count === 0 ? 0 : count < 3 ? 1 : 2,
        title: "New WBS Deliverable",
        deliverable: "Define concrete measurable output",
        scopeWeightPct: remainingWeight > 0 ? remainingWeight : 15,
        durationMins: 30,
        dependsOn: count > 0 ? [state.draft.nodes[count - 1].id] : [],
        bomStatus: "HAVE",
        bomItems: [],
        workMode: "BUILD",
        isPassiveFirst: false,
        timeBoxCeilingMins: 35,
        exitCriteria: "Deliverable verified complete",
        completed: false,
        thumbnailUrl: state.draft.endState.coverImageUrl,
      };
      return {
        ...state,
        draft: { ...state.draft, nodes: [...state.draft.nodes, newNode] },
      };
    }
    case "UPDATE_WBS_NODE":
      return {
        ...state,
        draft: {
          ...state.draft,
          nodes: state.draft.nodes.map((n) => (n.id === event.id ? { ...n, ...event.patch } : n)),
        },
      };
    case "DELETE_WBS_NODE":
      return {
        ...state,
        draft: {
          ...state.draft,
          nodes: state.draft.nodes.filter((n) => n.id !== event.id),
        },
      };
    case "HYDRATE_LESSONS":
      return { ...state, lessons: event.lessons };
    case "DEPLOY_REJECT_MISSING_TITLE":
      return {
        ...state,
        stage: 1,
        toast: nextToast(state.toast, "Enter a Mission Goal Title in Stage 1 before deploying."),
      };
    case "DEPLOY_START":
      if (state.asyncPhase !== "IDLE") return state;
      return { ...state, asyncPhase: "DEPLOYING" };
    case "DEPLOY_SUCCESS":
      return {
        ...state,
        asyncPhase: "IDLE",
        draft: event.updatedDraft,
        stage: 5,
        toast: nextToast(state.toast, event.toastMsg),
      };
    case "DEPLOY_ERROR":
      return {
        ...state,
        asyncPhase: "IDLE",
        toast: nextToast(state.toast, event.toastMsg),
      };
    case "SAVE_AAR_START":
      if (state.asyncPhase !== "IDLE") return state;
      return { ...state, asyncPhase: "SAVING_AAR" };
    case "SAVE_AAR_SUCCESS":
      return {
        ...state,
        asyncPhase: "IDLE",
        lessons: [event.lesson, ...state.lessons],
        toast: nextToast(state.toast, "AAR saved to your searchable Lesson Vault!"),
      };
    case "SAVE_AAR_FINISH":
      return { ...state, asyncPhase: "IDLE" };
    case "SHOW_TOAST":
      return { ...state, toast: nextToast(state.toast, event.message) };
    case "DISMISS_TOAST":
      return { ...state, toast: null };
    default:
      return state;
  }
}
