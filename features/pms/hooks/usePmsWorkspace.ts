"use client";

import { useCallback, useEffect, useMemo, useReducer } from "react";
import type { PmsTaskDTO } from "@/lib/pmsTypes";
import {
  addPmsChecklist,
  addPmsComment,
  addPmsDependency,
  createPmsFolder,
  createPmsList,
  createPmsSpace,
  createPmsTask,
  deletePmsTask,
  executeUniversalPmsAiCommand,
  fetchPmsWorkspace,
  movePmsTaskStatus,
  togglePmsChecklist,
  updatePmsTask,
} from "@/services/pmsClientService";
import { INITIAL_PMS_STATE, pmsReducer } from "../state/pmsMachine";
import {
  selectCurrentFolder,
  selectCurrentList,
  selectCurrentSpace,
  selectFilteredTasks,
  selectSpaceStatuses,
} from "../state/pmsSelectors";

export function usePmsWorkspace() {
  const [state, dispatch] = useReducer(pmsReducer, INITIAL_PMS_STATE);

  const reloadWorkspace = useCallback(async () => {
    try {
      dispatch({ type: "LOAD_START" });
      const data = await fetchPmsWorkspace();
      dispatch({
        type: "HYDRATE_DATA",
        spaces: data.spaces,
        statuses: data.statuses,
        tasks: data.tasks,
      });
    } catch {
      dispatch({
        type: "LOAD_ERROR",
        message: "Unable to load Sovereign PMS workspace.",
      });
    }
  }, []);

  useEffect(() => {
    void reloadWorkspace();
  }, [reloadWorkspace]);

  const currentSpace = useMemo(() => selectCurrentSpace(state), [state]);
  const currentFolder = useMemo(
    () => selectCurrentFolder(state, currentSpace),
    [state, currentSpace]
  );
  const currentList = useMemo(
    () => selectCurrentList(state, currentSpace),
    [state, currentSpace]
  );
  const currentSpaceStatuses = useMemo(
    () => selectSpaceStatuses(state, currentSpace),
    [state, currentSpace]
  );
  const filteredTasks = useMemo(() => selectFilteredTasks(state), [state]);

  const selectedTask = useMemo(
    () => state.tasks.find((t) => t.id === state.selectedTaskId) ?? null,
    [state.tasks, state.selectedTaskId]
  );

  const breadcrumb = useMemo(() => {
    const parts = [currentSpace?.name ?? "Workspace"];
    if (currentFolder) parts.push(currentFolder.name);
    if (currentList) parts.push(currentList.name);
    return parts;
  }, [currentSpace, currentFolder, currentList]);

  const resolveTargetListId = useCallback((): string | null => {
    if (state.selectedListId) return state.selectedListId;
    if (currentFolder && currentFolder.lists.length > 0) {
      return currentFolder.lists[0].id;
    }
    if (currentSpace && currentSpace.lists.length > 0) {
      return currentSpace.lists[0].id;
    }
    if (
      currentSpace &&
      currentSpace.folders.length > 0 &&
      currentSpace.folders[0].lists.length > 0
    ) {
      return currentSpace.folders[0].lists[0].id;
    }
    return state.spaces[0]?.lists[0]?.id ?? null;
  }, [state.selectedListId, currentFolder, currentSpace, state.spaces]);

  const handleCreateSpace = useCallback(
    async (name: string, colorHex: string, icon: string) => {
      const ok = await createPmsSpace(name, colorHex, icon);
      if (ok) await reloadWorkspace();
    },
    [reloadWorkspace]
  );

  const handleCreateFolder = useCallback(
    async (spaceId: string, name: string) => {
      const ok = await createPmsFolder(spaceId, name);
      if (ok) await reloadWorkspace();
    },
    [reloadWorkspace]
  );

  const handleCreateList = useCallback(
    async (spaceId: string, folderId: string | null, name: string) => {
      const ok = await createPmsList(spaceId, folderId, name);
      if (ok) await reloadWorkspace();
    },
    [reloadWorkspace]
  );

  const handleCreateTask = useCallback(
    async (params: {
      name: string;
      statusId?: string;
      priority?: PmsTaskDTO["priority"];
      dueDate?: string | null;
    }) => {
      const cleanName = params.name.trim();
      const targetListId = resolveTargetListId();
      if (!cleanName || !targetListId) return;

      const created = await createPmsTask({
        name: cleanName,
        list_id: targetListId,
        status_id: params.statusId ?? currentSpaceStatuses[0]?.id,
        priority: params.priority ?? "normal",
        due_date: params.dueDate ?? null,
      });

      if (created) {
        dispatch({ type: "SET_ADDING_TASK_STATUS", statusId: null });
        await reloadWorkspace();
      }
    },
    [resolveTargetListId, currentSpaceStatuses, reloadWorkspace]
  );

  const handleMoveStatus = useCallback(
    async (taskId: string, targetStatusId: string) => {
      dispatch({ type: "OPTIMISTIC_MOVE_STATUS", taskId, targetStatusId });
      await movePmsTaskStatus(taskId, targetStatusId);
    },
    []
  );

  const handleStepStatus = useCallback(
    (task: PmsTaskDTO, direction: -1 | 1) => {
      const curIdx = currentSpaceStatuses.findIndex(
        (s) => s.id === task.status_id
      );
      if (curIdx === -1) return;
      const nextIdx = curIdx + direction;
      if (nextIdx >= 0 && nextIdx < currentSpaceStatuses.length) {
        void handleMoveStatus(task.id, currentSpaceStatuses[nextIdx].id);
      }
    },
    [currentSpaceStatuses, handleMoveStatus]
  );

  const handleUpdateTask = useCallback(
    async (taskId: string, patch: Partial<PmsTaskDTO>) => {
      dispatch({ type: "OPTIMISTIC_UPDATE_TASK", taskId, patch });
      await updatePmsTask(taskId, patch);
    },
    []
  );

  const handleToggleChecklist = useCallback(
    async (taskId: string, checklistId: string, current: boolean) => {
      const nextVal = !current;
      dispatch({
        type: "OPTIMISTIC_TOGGLE_CHECKLIST",
        taskId,
        checklistId,
        nextVal,
      });
      await togglePmsChecklist(checklistId, nextVal);
    },
    []
  );

  const handleAddChecklist = useCallback(async (taskId: string, name: string) => {
    const checklist = await addPmsChecklist(taskId, name);
    if (checklist) {
      dispatch({ type: "APPEND_CHECKLIST", taskId, checklist });
    }
  }, []);

  const handleAddComment = useCallback(
    async (taskId: string, content: string) => {
      const comment = await addPmsComment(taskId, content);
      if (comment) {
        dispatch({ type: "APPEND_COMMENT", taskId, comment });
      }
    },
    []
  );

  const handleAddDependency = useCallback(
    async (dependentTaskId: string, prereqTaskId: string, type: string) => {
      const dep = await addPmsDependency(dependentTaskId, prereqTaskId, type);
      if (dep) await reloadWorkspace();
    },
    [reloadWorkspace]
  );

  const handleAddSubtask = useCallback(
    async (parentTaskId: string, listId: string, name: string) => {
      const created = await createPmsTask({
        parent_task_id: parentTaskId,
        list_id: listId,
        name,
      });
      if (created) await reloadWorkspace();
    },
    [reloadWorkspace]
  );

  const handleDeleteTask = useCallback(async (taskId: string) => {
    dispatch({ type: "OPTIMISTIC_DELETE_TASK", taskId });
    await deletePmsTask(taskId);
  }, []);

  const handleRunAiCommand = useCallback(
    async (rawCommand: string) => {
      const cmd = rawCommand.trim();
      if (!cmd) return;
      try {
        const syncedAreas = await executeUniversalPmsAiCommand({
          command: cmd,
          targetListId: resolveTargetListId(),
          defaultStatusId: currentSpaceStatuses[0]?.id,
        });
        dispatch({
          type: "SET_TOAST",
          message: `Synced "${cmd}" → ${syncedAreas.join(" + ")}`,
        });
        await reloadWorkspace();
      } catch {
        dispatch({
          type: "SET_TOAST",
          message: "Could not sync AI command — check connection.",
        });
      }
    },
    [resolveTargetListId, currentSpaceStatuses, reloadWorkspace]
  );

  return {
    state,
    dispatch,
    currentSpace,
    currentFolder,
    currentList,
    currentSpaceStatuses,
    filteredTasks,
    selectedTask,
    breadcrumb,
    handleCreateSpace,
    handleCreateFolder,
    handleCreateList,
    handleCreateTask,
    handleMoveStatus,
    handleStepStatus,
    handleUpdateTask,
    handleToggleChecklist,
    handleAddChecklist,
    handleAddComment,
    handleAddDependency,
    handleAddSubtask,
    handleDeleteTask,
    handleRunAiCommand,
  };
}
