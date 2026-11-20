import {
  CoPilotMode,
  DagNode,
  PaceType,
  StrategicDomain,
  StrategicTree,
} from "@/lib/synthesisRoadmapTypes";
import { DEFAULT_STRATEGIC_TREES } from "@/lib/defaultStrategicTrees";

export type RoadmapViewMode = "dag" | "pyramid";
export type RoadmapAsyncPhase = "IDLE" | "SYNTHESIZING_DAG" | "ERROR_RECOVERY";

export type RoadmapModalState =
  | { kind: "NONE" }
  | { kind: "DOSSIER"; nodeId: string }
  | { kind: "DWY_INTERVIEW" }
  | { kind: "DIY_BUILDER" };

export interface RoadmapMachineState {
  currentDomain: StrategicDomain;
  strategicTrees: Record<string, StrategicTree>;
  viewMode: RoadmapViewMode;
  coPilotMode: CoPilotMode;
  activePace: PaceType;
  zoomScale: number;
  backwardChainOpen: boolean;
  asyncPhase: RoadmapAsyncPhase;
  activeModal: RoadmapModalState;
  toast: { seq: number; message: string } | null;
}

export type RoadmapEvent =
  | { type: "HYDRATE_TREES"; trees: Record<string, StrategicTree> }
  | { type: "SELECT_DOMAIN"; domain: StrategicDomain }
  | { type: "SET_VIEW_MODE"; viewMode: RoadmapViewMode }
  | { type: "SET_COPILOT_MODE"; mode: CoPilotMode }
  | { type: "SET_PACE"; pace: PaceType }
  | { type: "ZOOM_IN" }
  | { type: "ZOOM_OUT" }
  | { type: "ZOOM_RESET" }
  | { type: "TOGGLE_BACKWARD_CHAIN"; summaryToast?: string }
  | { type: "CLOSE_BACKWARD_CHAIN" }
  | { type: "OPEN_DOSSIER"; nodeId: string }
  | { type: "OPEN_DWY_INTERVIEW" }
  | { type: "OPEN_DIY_BUILDER" }
  | { type: "CLOSE_MODAL" }
  | { type: "SYNTHESIZE_START" }
  | { type: "SYNTHESIZE_SUCCESS"; domain: StrategicDomain; tree: StrategicTree; toastMsg: string }
  | { type: "SYNTHESIZE_ERROR"; toastMsg: string }
  | { type: "MISSION_DEPLOYED"; domain: StrategicDomain; tree: StrategicTree }
  | { type: "ADD_MANUAL_NODE"; node: DagNode }
  | { type: "TOGGLE_CHECK"; checkId: string }
  | { type: "ADD_CHECK"; checkId: string; label: string }
  | { type: "SHOW_TOAST"; message: string }
  | { type: "DISMISS_TOAST" };

export const INITIAL_ROADMAP_STATE: RoadmapMachineState = {
  currentDomain: "master",
  strategicTrees: DEFAULT_STRATEGIC_TREES,
  viewMode: "dag",
  coPilotMode: "dfy",
  activePace: "P",
  zoomScale: 1.0,
  backwardChainOpen: false,
  asyncPhase: "IDLE",
  activeModal: { kind: "NONE" },
  toast: null,
};

export function resolveRoadmapTree(
  trees: Record<string, StrategicTree>,
  domain: StrategicDomain
): StrategicTree {
  return trees[domain] || DEFAULT_STRATEGIC_TREES[domain] || DEFAULT_STRATEGIC_TREES.master;
}

/**
 * INV-1 Guard: Ensures DRAWER_INSPECTING never orphans onto a nonexistent node
 * when switching domains or replacing a tree via synthesis.
 */
function sanitizeModalForTree(
  modal: RoadmapModalState,
  tree: StrategicTree
): RoadmapModalState {
  if (modal.kind !== "DOSSIER") return modal;
  if (modal.nodeId === "goal") return modal;
  const exists = [...tree.tier0, ...tree.tier1, ...tree.tier2].some(
    (n) => n.id === modal.nodeId
  );
  return exists ? modal : { kind: "NONE" };
}

function recomputeAudit(tree: StrategicTree): StrategicTree {
  const all = [...tree.tier0, ...tree.tier1, ...tree.tier2];
  return {
    ...tree,
    audit: {
      have: all.filter((n) => n.status === "HAVE").length,
      acq: all.filter((n) => n.status === "PROGRESS").length,
      blocked: all.filter((n) => n.status === "BLOCKED").length,
    },
  };
}

function nextToast(prev: RoadmapMachineState["toast"], message: string) {
  return { seq: (prev?.seq ?? 0) + 1, message };
}

export function roadmapReducer(
  state: RoadmapMachineState,
  event: RoadmapEvent
): RoadmapMachineState {
  switch (event.type) {
    case "HYDRATE_TREES": {
      const nextTree = resolveRoadmapTree(event.trees, state.currentDomain);
      return {
        ...state,
        strategicTrees: event.trees,
        activeModal: sanitizeModalForTree(state.activeModal, nextTree),
      };
    }
    case "SELECT_DOMAIN": {
      const nextTree = resolveRoadmapTree(state.strategicTrees, event.domain);
      return {
        ...state,
        currentDomain: event.domain,
        activeModal: sanitizeModalForTree(state.activeModal, nextTree),
      };
    }
    case "SET_VIEW_MODE":
      return { ...state, viewMode: event.viewMode };
    case "SET_COPILOT_MODE":
      return { ...state, coPilotMode: event.mode };
    case "SET_PACE":
      return { ...state, activePace: event.pace };
    case "ZOOM_IN":
      return { ...state, zoomScale: Math.min(1.4, Number((state.zoomScale + 0.1).toFixed(2))) };
    case "ZOOM_OUT":
      return { ...state, zoomScale: Math.max(0.65, Number((state.zoomScale - 0.1).toFixed(2))) };
    case "ZOOM_RESET":
      return { ...state, zoomScale: 1.0 };
    case "TOGGLE_BACKWARD_CHAIN":
      return {
        ...state,
        backwardChainOpen: !state.backwardChainOpen,
        toast: event.summaryToast ? nextToast(state.toast, event.summaryToast) : state.toast,
      };
    case "CLOSE_BACKWARD_CHAIN":
      return { ...state, backwardChainOpen: false };
    case "OPEN_DOSSIER": {
      const tree = resolveRoadmapTree(state.strategicTrees, state.currentDomain);
      return {
        ...state,
        activeModal: sanitizeModalForTree({ kind: "DOSSIER", nodeId: event.nodeId }, tree),
      };
    }
    case "OPEN_DWY_INTERVIEW":
      return { ...state, activeModal: { kind: "DWY_INTERVIEW" } };
    case "OPEN_DIY_BUILDER":
      return { ...state, activeModal: { kind: "DIY_BUILDER" } };
    case "CLOSE_MODAL":
      return { ...state, activeModal: { kind: "NONE" } };
    case "SYNTHESIZE_START":
      if (state.asyncPhase === "SYNTHESIZING_DAG") return state;
      return { ...state, asyncPhase: "SYNTHESIZING_DAG" };
    case "SYNTHESIZE_SUCCESS": {
      const nextTrees = { ...state.strategicTrees, [event.domain]: event.tree };
      const closeDwy =
        state.activeModal.kind === "DWY_INTERVIEW" ? { kind: "NONE" as const } : state.activeModal;
      return {
        ...state,
        asyncPhase: "IDLE",
        strategicTrees: nextTrees,
        activeModal: sanitizeModalForTree(closeDwy, event.tree),
        toast: nextToast(state.toast, event.toastMsg),
      };
    }
    case "SYNTHESIZE_ERROR":
      return {
        ...state,
        asyncPhase: "ERROR_RECOVERY",
        activeModal:
          state.activeModal.kind === "DWY_INTERVIEW" ? { kind: "NONE" } : state.activeModal,
        toast: nextToast(state.toast, event.toastMsg),
      };
    case "MISSION_DEPLOYED": {
      const nextTrees = { ...state.strategicTrees, [event.domain]: event.tree };
      return {
        ...state,
        currentDomain: event.domain,
        strategicTrees: nextTrees,
        activeModal: sanitizeModalForTree(state.activeModal, event.tree),
      };
    }
    case "ADD_MANUAL_NODE": {
      const base = resolveRoadmapTree(state.strategicTrees, state.currentDomain);
      const next: StrategicTree = {
        ...base,
        tier0: event.node.tier === 0 ? [...base.tier0, event.node] : [...base.tier0],
        tier1: event.node.tier === 1 ? [...base.tier1, event.node] : [...base.tier1],
        tier2: event.node.tier === 2 ? [...base.tier2, event.node] : [...base.tier2],
        arrows: [...base.arrows],
      };
      if (event.node.tier === 2) {
        next.arrows.push({
          from: event.node.id,
          to: "goal",
          label: "MANUAL CLIMAX",
          color: "gold",
        });
      } else if (event.node.tier === 0 && next.tier1[0]) {
        next.arrows.push({
          from: event.node.id,
          to: next.tier1[0].id,
          label: "INPUT ➔ ASSEMBLY",
          color: "cyan",
        });
      }
      const audited = recomputeAudit(next);
      return {
        ...state,
        strategicTrees: { ...state.strategicTrees, [state.currentDomain]: audited },
        activeModal: { kind: "NONE" },
        toast: nextToast(state.toast, `Added "${event.node.title}" to Tier ${event.node.tier}!`),
      };
    }
    case "TOGGLE_CHECK": {
      if (state.activeModal.kind !== "DOSSIER") return state;
      const targetId = state.activeModal.nodeId;
      const base = resolveRoadmapTree(state.strategicTrees, state.currentDomain);
      const mapChecks = (list: DagNode[]) =>
        list.map((n) =>
          n.id === targetId
            ? {
                ...n,
                checks: n.checks.map((c) =>
                  c.id === event.checkId ? { ...c, completed: !c.completed } : c
                ),
              }
            : n
        );
      return {
        ...state,
        strategicTrees: {
          ...state.strategicTrees,
          [state.currentDomain]: {
            ...base,
            tier0: mapChecks(base.tier0),
            tier1: mapChecks(base.tier1),
            tier2: mapChecks(base.tier2),
          },
        },
      };
    }
    case "ADD_CHECK": {
      if (state.activeModal.kind !== "DOSSIER") return state;
      const targetId = state.activeModal.nodeId;
      const base = resolveRoadmapTree(state.strategicTrees, state.currentDomain);
      const appendChecks = (list: DagNode[]) =>
        list.map((n) =>
          n.id === targetId
            ? {
                ...n,
                checks: [...n.checks, { id: event.checkId, label: event.label, completed: false }],
              }
            : n
        );
      return {
        ...state,
        strategicTrees: {
          ...state.strategicTrees,
          [state.currentDomain]: {
            ...base,
            tier0: appendChecks(base.tier0),
            tier1: appendChecks(base.tier1),
            tier2: appendChecks(base.tier2),
          },
        },
      };
    }
    case "SHOW_TOAST":
      return { ...state, toast: nextToast(state.toast, event.message) };
    case "DISMISS_TOAST":
      return { ...state, toast: null };
    default:
      return state;
  }
}
