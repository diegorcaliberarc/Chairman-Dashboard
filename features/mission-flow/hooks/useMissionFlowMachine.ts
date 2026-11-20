"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  MissionCoPilotMode,
  MissionFlowDraft,
  MissionWbsNode,
  computeCriticalPath,
  computeMissionQuantification,
  missionDraftToStrategicTree,
} from "@/lib/missionFlowTypes";
import { StrategicDomain, StrategicTree } from "@/lib/synthesisRoadmapTypes";
import {
  createMissionAcquisitionTask,
  deployMissionFlow,
  fetchMissionFlowLessons,
  saveMissionAarLesson,
} from "@/services/missionFlowClientService";
import {
  MissionStageIndex,
  createInitialMissionFlowState,
  missionFlowReducer,
} from "../state/missionFlowMachine";

export function useMissionFlowMachine(
  isOpen: boolean,
  initialDomain: StrategicDomain = "master",
  onMissionDeployed?: (tree: StrategicTree, draft: MissionFlowDraft) => void
) {
  const [state, dispatch] = useReducer(
    missionFlowReducer,
    initialDomain,
    createInitialMissionFlowState
  );
  const [brainDump, setBrainDump] = useState("");
  const [dwyConstraint, setDwyConstraint] = useState("");
  const [dwyTools, setDwyTools] = useState("");
  const [lessonSearch, setLessonSearch] = useState("");
  const [aarWorked, setAarWorked] = useState("");
  const [aarBroke, setAarBroke] = useState("");
  const [aarRule, setAarRule] = useState("");
  const asyncLockRef = useRef(false);
  const loadedWhenOpenRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      loadedWhenOpenRef.current = false;
      return;
    }
    if (loadedWhenOpenRef.current) return;
    loadedWhenOpenRef.current = true;

    const sevenDaysIso = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
    dispatch({
      type: "PATCH_DRAFT",
      updater: (prev) =>
        prev.endState.hardDeadline === "2026-12-31"
          ? { ...prev, endState: { ...prev.endState, hardDeadline: sevenDaysIso } }
          : prev,
    });

    void fetchMissionFlowLessons()
      .then((lessons) => dispatch({ type: "HYDRATE_LESSONS", lessons }))
      .catch(() => {});
  }, [isOpen]);

  const cpm = useMemo(() => computeCriticalPath(state.draft.nodes), [state.draft.nodes]);
  const quant = useMemo(() => computeMissionQuantification(state.draft), [state.draft]);

  const filteredLessons = useMemo(() => {
    const q = lessonSearch.trim().toLowerCase();
    if (!q) return state.lessons;
    return state.lessons.filter(
      (l) =>
        l.missionTitle.toLowerCase().includes(q) ||
        l.whatWorked.toLowerCase().includes(q) ||
        l.whatBroke.toLowerCase().includes(q) ||
        l.ruleChange.toLowerCase().includes(q)
    );
  }, [state.lessons, lessonSearch]);

  const createAcquisitionTask = useCallback(async (label: string) => {
    await createMissionAcquisitionTask(label);
    dispatch({
      type: "SHOW_TOAST",
      message: `Created Acquisition Task in Pristine PMS: "${label}"`,
    });
  }, []);

  const deployMission = useCallback(async () => {
    if (asyncLockRef.current) return;
    if (!state.draft.endState.title.trim()) {
      dispatch({ type: "DEPLOY_REJECT_MISSING_TITLE" });
      return;
    }
    asyncLockRef.current = true;
    dispatch({ type: "DEPLOY_START" });
    try {
      const res = await deployMissionFlow(state.draft);
      const updatedDraft: MissionFlowDraft = {
        ...state.draft,
        id: res.id || state.draft.id,
        deployedAt: res.deployedAt || new Date().toISOString(),
      };
      const tree = missionDraftToStrategicTree(updatedDraft);
      onMissionDeployed?.(tree, updatedDraft);
      dispatch({
        type: "DEPLOY_SUCCESS",
        updatedDraft,
        toastMsg: `Mission Deployed! Synced ${res.pmsSynced} PMS tasks & ${res.calendarSynced} Calendar blocks.`,
      });
    } catch {
      dispatch({
        type: "DEPLOY_ERROR",
        toastMsg: "Saved locally — check connection for PMS/Calendar sync.",
      });
    } finally {
      asyncLockRef.current = false;
    }
  }, [onMissionDeployed, state.draft]);

  const submitAar = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (asyncLockRef.current) return;
      if (!aarWorked.trim() && !aarBroke.trim() && !aarRule.trim()) return;
      asyncLockRef.current = true;
      dispatch({ type: "SAVE_AAR_START" });
      try {
        const lesson = await saveMissionAarLesson({
          missionTitle: state.draft.endState.title || "Completed Mission",
          domain: state.draft.endState.domain,
          whatWorked: aarWorked.trim(),
          whatBroke: aarBroke.trim(),
          ruleChange: aarRule.trim(),
        });
        if (lesson) {
          setAarWorked("");
          setAarBroke("");
          setAarRule("");
          dispatch({ type: "SAVE_AAR_SUCCESS", lesson });
        } else {
          dispatch({ type: "SAVE_AAR_FINISH" });
        }
      } catch {
        dispatch({ type: "SAVE_AAR_FINISH" });
      } finally {
        asyncLockRef.current = false;
      }
    },
    [aarBroke, aarRule, aarWorked, state.draft.endState.domain, state.draft.endState.title]
  );

  return {
    state,
    cpm,
    quant,
    filteredLessons,
    brainDump,
    setBrainDump,
    dwyConstraint,
    setDwyConstraint,
    dwyTools,
    setDwyTools,
    lessonSearch,
    setLessonSearch,
    aarWorked,
    setAarWorked,
    aarBroke,
    setAarBroke,
    aarRule,
    setAarRule,
    setStage: (stage: MissionStageIndex) => dispatch({ type: "SET_STAGE", stage }),
    nextStage: () => dispatch({ type: "NEXT_STAGE" }),
    prevStage: () => dispatch({ type: "PREV_STAGE" }),
    skipStage0: () => dispatch({ type: "SKIP_STAGE_0" }),
    setMode: (mode: MissionCoPilotMode) => dispatch({ type: "SET_MODE", mode }),
    runDfy: () => dispatch({ type: "RUN_DFY", prompt: brainDump }),
    applyDwyRefinement: () =>
      dispatch({
        type: "APPLY_DWY",
        fallbackTitle: brainDump,
        constraint: dwyConstraint,
        toolsCsv: dwyTools,
      }),
    patchDraft: (updater: (prev: MissionFlowDraft) => MissionFlowDraft) =>
      dispatch({ type: "PATCH_DRAFT", updater }),
    addWbsNode: () => dispatch({ type: "ADD_WBS_NODE", nodeId: `mf_n_${Date.now()}` }),
    updateWbsNode: (id: string, patch: Partial<MissionWbsNode>) =>
      dispatch({ type: "UPDATE_WBS_NODE", id, patch }),
    deleteWbsNode: (id: string) => dispatch({ type: "DELETE_WBS_NODE", id }),
    createAcquisitionTask,
    deployMission,
    submitAar,
    dismissToast: () => dispatch({ type: "DISMISS_TOAST" }),
  };
}
