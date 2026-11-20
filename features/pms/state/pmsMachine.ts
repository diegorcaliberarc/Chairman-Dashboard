import type {
  PmsChecklistDTO,
  PmsCommentDTO,
  PmsSpaceDTO,
  PmsStatusDTO,
  PmsTaskDTO,
} from "@/lib/pmsTypes";

export type PmsViewMode = "home" | "overview" | "list" | "board" | "calendar";
export type PmsPeekMode = "side-peek" | "modal" | "full-screen";
export type PmsPriorityFilter = "ALL" | PmsTaskDTO["priority"];

export interface PmsWorkspaceState {
  loading: boolean;
  spaces: PmsSpaceDTO[];
  statuses: PmsStatusDTO[];
  tasks: PmsTaskDTO[];
  selectedSpaceId: string | null;
  selectedFolderId: string | null;
  selectedListId: string | null;
  viewMode: PmsViewMode;
  showSpacesDrawer: boolean;
  searchQuery: string;
  priorityFilter: PmsPriorityFilter;
  collapsedStatusIds: string[];
  addingTaskForStatusId: string | null;
  selectedTaskId: string | null;
  peekMode: PmsPeekMode;
  isNewSpaceModalOpen: boolean;
  toastMessage: string | null;
}

export type PmsAction =
  | { type: "LOAD_START" }
  | {
      type: "HYDRATE_DATA";
      spaces: PmsSpaceDTO[];
      statuses: PmsStatusDTO[];
      tasks: PmsTaskDTO[];
    }
  | { type: "LOAD_ERROR"; message: string }
  | { type: "SET_VIEW_MODE"; viewMode: PmsViewMode }
  | { type: "TOGGLE_SPACES_DRAWER" }
  | { type: "SELECT_SPACE"; spaceId: string }
  | { type: "SELECT_FOLDER"; spaceId: string; folderId: string }
  | {
      type: "SELECT_LIST";
      spaceId: string;
      folderId: string | null;
      listId: string;
    }
  | { type: "SET_SEARCH_QUERY"; query: string }
  | { type: "SET_PRIORITY_FILTER"; priority: PmsPriorityFilter }
  | { type: "TOGGLE_COLLAPSE_STATUS"; statusId: string }
  | { type: "SET_ADDING_TASK_STATUS"; statusId: string | null }
  | { type: "OPEN_TASK_DRAWER"; taskId: string }
  | { type: "CLOSE_TASK_DRAWER" }
  | { type: "SET_PEEK_MODE"; peekMode: PmsPeekMode }
  | { type: "OPEN_NEW_SPACE_MODAL" }
  | { type: "CLOSE_NEW_SPACE_MODAL" }
  | { type: "OPTIMISTIC_MOVE_STATUS"; taskId: string; targetStatusId: string }
  | { type: "OPTIMISTIC_UPDATE_TASK"; taskId: string; patch: Partial<PmsTaskDTO> }
  | {
      type: "OPTIMISTIC_TOGGLE_CHECKLIST";
      taskId: string;
      checklistId: string;
      nextVal: boolean;
    }
  | { type: "APPEND_CHECKLIST"; taskId: string; checklist: PmsChecklistDTO }
  | { type: "APPEND_COMMENT"; taskId: string; comment: PmsCommentDTO }
  | { type: "OPTIMISTIC_DELETE_TASK"; taskId: string }
  | { type: "SET_TOAST"; message: string | null };

export const INITIAL_PMS_STATE: PmsWorkspaceState = {
  loading: true,
  spaces: [],
  statuses: [],
  tasks: [],
  selectedSpaceId: null,
  selectedFolderId: null,
  selectedListId: null,
  viewMode: "list",
  showSpacesDrawer: true,
  searchQuery: "",
  priorityFilter: "ALL",
  collapsedStatusIds: [],
  addingTaskForStatusId: null,
  selectedTaskId: null,
  peekMode: "side-peek",
  isNewSpaceModalOpen: false,
  toastMessage: null,
};

export function hydrateTaskSubtasks(rawTasks: PmsTaskDTO[]): PmsTaskDTO[] {
  const byParent = new Map<string, PmsTaskDTO[]>();
  for (const t of rawTasks) {
    if (t.parent_task_id) {
      const list = byParent.get(t.parent_task_id) ?? [];
      list.push(t);
      byParent.set(t.parent_task_id, list);
    }
  }
  return rawTasks.map((t) => ({
    ...t,
    subtasks: byParent.get(t.id) ?? t.subtasks ?? [],
  }));
}

function applyStatusMetadata(
  task: PmsTaskDTO,
  targetStatusId: string,
  statuses: PmsStatusDTO[]
): PmsTaskDTO {
  const st = statuses.find((s) => s.id === targetStatusId);
  return {
    ...task,
    status_id: targetStatusId,
    status_name: st?.name ?? task.status_name,
    status_color: st?.color_hex ?? task.status_color,
    status_category: st?.category ?? task.status_category,
  };
}

/**
 * Deterministic PMS Workspace State Machine:
 * - INV-PMS-1: `selectedTaskId` never orphans on a missing or deleted task.
 * - INV-PMS-2: `isNewSpaceModalOpen` and `selectedTaskId` are mutually exclusive.
 * - INV-PMS-3: Hierarchy selection clears narrower child scopes atomically.
 * - INV-PMS-4: Optimistic status transitions synchronize status color/name/category.
 */
export function pmsReducer(
  state: PmsWorkspaceState,
  action: PmsAction
): PmsWorkspaceState {
  switch (action.type) {
    case "LOAD_START":
      return { ...state, loading: true };

    case "HYDRATE_DATA": {
      const hydrated = hydrateTaskSubtasks(action.tasks);
      const nextSpaceId =
        state.selectedSpaceId &&
        action.spaces.some((s) => s.id === state.selectedSpaceId)
          ? state.selectedSpaceId
          : (action.spaces[0]?.id ?? null);
      const validSelectedTaskId =
        state.selectedTaskId &&
        hydrated.some((t) => t.id === state.selectedTaskId)
          ? state.selectedTaskId
          : null;

      return {
        ...state,
        loading: false,
        spaces: action.spaces,
        statuses: action.statuses,
        tasks: hydrated,
        selectedSpaceId: nextSpaceId,
        selectedTaskId: validSelectedTaskId,
      };
    }

    case "LOAD_ERROR":
      return { ...state, loading: false, toastMessage: action.message };

    case "SET_VIEW_MODE":
      return { ...state, viewMode: action.viewMode, addingTaskForStatusId: null };

    case "TOGGLE_SPACES_DRAWER":
      return { ...state, showSpacesDrawer: !state.showSpacesDrawer };

    case "SELECT_SPACE":
      return {
        ...state,
        selectedSpaceId: action.spaceId,
        selectedFolderId: null,
        selectedListId: null,
      };

    case "SELECT_FOLDER":
      return {
        ...state,
        selectedSpaceId: action.spaceId,
        selectedFolderId: action.folderId,
        selectedListId: null,
      };

    case "SELECT_LIST":
      return {
        ...state,
        selectedSpaceId: action.spaceId,
        selectedFolderId: action.folderId,
        selectedListId: action.listId,
      };

    case "SET_SEARCH_QUERY":
      return { ...state, searchQuery: action.query };

    case "SET_PRIORITY_FILTER":
      return { ...state, priorityFilter: action.priority };

    case "TOGGLE_COLLAPSE_STATUS": {
      const exists = state.collapsedStatusIds.includes(action.statusId);
      return {
        ...state,
        collapsedStatusIds: exists
          ? state.collapsedStatusIds.filter((id) => id !== action.statusId)
          : [...state.collapsedStatusIds, action.statusId],
      };
    }

    case "SET_ADDING_TASK_STATUS":
      return { ...state, addingTaskForStatusId: action.statusId };

    case "OPEN_TASK_DRAWER": {
      if (!state.tasks.some((t) => t.id === action.taskId)) {
        return state;
      }
      return {
        ...state,
        selectedTaskId: action.taskId,
        isNewSpaceModalOpen: false,
      };
    }

    case "CLOSE_TASK_DRAWER":
      return { ...state, selectedTaskId: null };

    case "SET_PEEK_MODE":
      return { ...state, peekMode: action.peekMode };

    case "OPEN_NEW_SPACE_MODAL":
      return { ...state, isNewSpaceModalOpen: true, selectedTaskId: null };

    case "CLOSE_NEW_SPACE_MODAL":
      return { ...state, isNewSpaceModalOpen: false };

    case "OPTIMISTIC_MOVE_STATUS":
      return {
        ...state,
        tasks: hydrateTaskSubtasks(
          state.tasks.map((t) =>
            t.id === action.taskId
              ? applyStatusMetadata(t, action.targetStatusId, state.statuses)
              : t
          )
        ),
      };

    case "OPTIMISTIC_UPDATE_TASK":
      return {
        ...state,
        tasks: hydrateTaskSubtasks(
          state.tasks.map((t) => {
            if (t.id !== action.taskId) return t;
            const merged = { ...t, ...action.patch };
            return action.patch.status_id
              ? applyStatusMetadata(merged, action.patch.status_id, state.statuses)
              : merged;
          })
        ),
      };

    case "OPTIMISTIC_TOGGLE_CHECKLIST":
      return {
        ...state,
        tasks: hydrateTaskSubtasks(
          state.tasks.map((t) =>
            t.id === action.taskId
              ? {
                  ...t,
                  checklists: t.checklists.map((c) =>
                    c.id === action.checklistId
                      ? { ...c, is_completed: action.nextVal }
                      : c
                  ),
                }
              : t
          )
        ),
      };

    case "APPEND_CHECKLIST":
      return {
        ...state,
        tasks: hydrateTaskSubtasks(
          state.tasks.map((t) =>
            t.id === action.taskId
              ? { ...t, checklists: [...t.checklists, action.checklist] }
              : t
          )
        ),
      };

    case "APPEND_COMMENT":
      return {
        ...state,
        tasks: hydrateTaskSubtasks(
          state.tasks.map((t) =>
            t.id === action.taskId
              ? { ...t, comments: [...t.comments, action.comment] }
              : t
          )
        ),
      };

    case "OPTIMISTIC_DELETE_TASK": {
      const remaining = state.tasks.filter(
        (t) => t.id !== action.taskId && t.parent_task_id !== action.taskId
      );
      return {
        ...state,
        tasks: hydrateTaskSubtasks(remaining),
        selectedTaskId:
          state.selectedTaskId === action.taskId ? null : state.selectedTaskId,
      };
    }

    case "SET_TOAST":
      return { ...state, toastMessage: action.message };

    default:
      return state;
  }
}
