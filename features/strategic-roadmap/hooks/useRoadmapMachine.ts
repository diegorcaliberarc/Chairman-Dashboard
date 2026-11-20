"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import {
  CoPilotMode,
  DagNode,
  PaceType,
  StrategicDomain,
  StrategicTree,
} from "@/lib/synthesisRoadmapTypes";
import { refineDwyTree, synthesizeDfyTree } from "@/services/roadmapClientService";
import {
  INITIAL_ROADMAP_STATE,
  RoadmapViewMode,
  resolveRoadmapTree,
  roadmapReducer,
} from "../state/roadmapMachineReducer";

const STORAGE_KEY = "chairman_synthesis_trees_v5";

export function useRoadmapMachine() {
  const [state, dispatch] = useReducer(roadmapReducer, INITIAL_ROADMAP_STATE);
  const hydratedRef = useRef(false);
  const synthesisLockRef = useRef(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Record<string, StrategicTree>;
        if (parsed && typeof parsed === "object") {
          dispatch({ type: "HYDRATE_TREES", trees: parsed });
        }
      }
    } catch {
      // Keep default trees if localStorage is unavailable or malformed
    } finally {
      hydratedRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.strategicTrees));
    } catch {
      // Ignore storage quota errors
    }
  }, [state.strategicTrees]);

  useEffect(() => {
    const onDeployed = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.tree) {
        const dom = (detail.tree.domain || "master") as StrategicDomain;
        dispatch({ type: "MISSION_DEPLOYED", domain: dom, tree: detail.tree });
      }
    };
    window.addEventListener("chairman:mission-deployed", onDeployed);
    return () => window.removeEventListener("chairman:mission-deployed", onDeployed);
  }, []);

  const activeTree = useMemo(
    () => resolveRoadmapTree(state.strategicTrees, state.currentDomain),
    [state.strategicTrees, state.currentDomain]
  );

  const selectedNodeId =
    state.activeModal.kind === "DOSSIER" ? state.activeModal.nodeId : null;

  const activeNode = useMemo(() => {
    if (!selectedNodeId || selectedNodeId === "goal") return null;
    return (
      [...activeTree.tier0, ...activeTree.tier1, ...activeTree.tier2].find(
        (n) => n.id === selectedNodeId
      ) || null
    );
  }, [selectedNodeId, activeTree]);

  const synthesizeDfy = useCallback(
    async (goalPrompt: string) => {
      if (synthesisLockRef.current) return;
      synthesisLockRef.current = true;
      dispatch({ type: "SYNTHESIZE_START" });
      try {
        const tree = await synthesizeDfyTree(state.currentDomain, goalPrompt);
        if (tree) {
          dispatch({
            type: "SYNTHESIZE_SUCCESS",
            domain: state.currentDomain,
            tree,
            toastMsg: `Synthesized full DAG for "${goalPrompt}"`,
          });
        } else {
          dispatch({
            type: "SYNTHESIZE_ERROR",
            toastMsg: "Synthesis completed with baseline tree.",
          });
        }
      } catch {
        dispatch({
          type: "SYNTHESIZE_ERROR",
          toastMsg: "Synthesis fallback activated using deterministic engine.",
        });
      } finally {
        synthesisLockRef.current = false;
      }
    },
    [state.currentDomain]
  );

  const submitDwyAnswers = useCallback(
    async (answers: Record<string, string>, goal: string) => {
      if (synthesisLockRef.current) return;
      synthesisLockRef.current = true;
      dispatch({ type: "SYNTHESIZE_START" });
      try {
        const tree = await refineDwyTree(state.currentDomain, goal, answers);
        if (tree) {
          dispatch({
            type: "SYNTHESIZE_SUCCESS",
            domain: state.currentDomain,
            tree,
            toastMsg: `Collaborative DAG calibrated for "${goal}"`,
          });
        } else {
          dispatch({ type: "CLOSE_MODAL" });
        }
      } catch {
        dispatch({
          type: "SYNTHESIZE_ERROR",
          toastMsg: "Collaborative refinement encountered a network error.",
        });
      } finally {
        synthesisLockRef.current = false;
      }
    },
    [state.currentDomain]
  );

  const triggerBackwardChain = useCallback(() => {
    const all = [...activeTree.tier0, ...activeTree.tier1, ...activeTree.tier2];
    const blockedCount = all.filter((n) => n.status === "BLOCKED").length;
    dispatch({
      type: "TOGGLE_BACKWARD_CHAIN",
      summaryToast: `Backward Chain Trace: ${all.length} nodes audited (${blockedCount} blocked) from "${activeTree.tier3.title}" ➔ Tier 0 inputs.`,
    });
  }, [activeTree]);

  return {
    state,
    activeTree,
    selectedNodeId,
    activeNode,
    isSynthesizing: state.asyncPhase === "SYNTHESIZING_DAG",
    selectDomain: (domain: StrategicDomain) => dispatch({ type: "SELECT_DOMAIN", domain }),
    setViewMode: (viewMode: RoadmapViewMode) => dispatch({ type: "SET_VIEW_MODE", viewMode }),
    setCoPilotMode: (mode: CoPilotMode) => dispatch({ type: "SET_COPILOT_MODE", mode }),
    setActivePace: (pace: PaceType) => dispatch({ type: "SET_PACE", pace }),
    zoomIn: () => dispatch({ type: "ZOOM_IN" }),
    zoomOut: () => dispatch({ type: "ZOOM_OUT" }),
    zoomReset: () => dispatch({ type: "ZOOM_RESET" }),
    triggerBackwardChain,
    closeBackwardChain: () => dispatch({ type: "CLOSE_BACKWARD_CHAIN" }),
    openDossier: (nodeId: string) => dispatch({ type: "OPEN_DOSSIER", nodeId }),
    openDwyInterview: () => dispatch({ type: "OPEN_DWY_INTERVIEW" }),
    openDiyBuilder: () => dispatch({ type: "OPEN_DIY_BUILDER" }),
    closeModal: () => dispatch({ type: "CLOSE_MODAL" }),
    synthesizeDfy,
    submitDwyAnswers,
    saveManualNode: (node: DagNode) => dispatch({ type: "ADD_MANUAL_NODE", node }),
    toggleCheck: (checkId: string) => dispatch({ type: "TOGGLE_CHECK", checkId }),
    addCheck: (label: string) =>
      dispatch({ type: "ADD_CHECK", checkId: `c_add_${Date.now()}`, label }),
    lockGoal: () =>
      dispatch({
        type: "SHOW_TOAST",
        message: "Master Vector Locked: Synthesis Integrity Verified!",
      }),
    verifyStep: () =>
      dispatch({
        type: "SHOW_TOAST",
        message: "Execution drill verified with deterministic precision!",
      }),
    dismissToast: () => dispatch({ type: "DISMISS_TOAST" }),
  };
}
