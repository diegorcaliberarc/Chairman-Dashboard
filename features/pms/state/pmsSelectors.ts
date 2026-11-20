import type {
  PmsFolderDTO,
  PmsListDTO,
  PmsSpaceDTO,
  PmsStatusDTO,
  PmsTaskDTO,
} from "@/lib/pmsTypes";
import type { PmsWorkspaceState } from "./pmsMachine";

export function selectCurrentSpace(
  state: PmsWorkspaceState
): PmsSpaceDTO | null {
  return (
    state.spaces.find((s) => s.id === state.selectedSpaceId) ??
    state.spaces[0] ??
    null
  );
}

export function selectCurrentFolder(
  state: PmsWorkspaceState,
  space: PmsSpaceDTO | null
): PmsFolderDTO | null {
  if (!space || !state.selectedFolderId) return null;
  return space.folders.find((f) => f.id === state.selectedFolderId) ?? null;
}

export function selectCurrentList(
  state: PmsWorkspaceState,
  space: PmsSpaceDTO | null
): PmsListDTO | null {
  if (!space || !state.selectedListId) return null;
  const direct = space.lists.find((l) => l.id === state.selectedListId);
  if (direct) return direct;
  for (const folder of space.folders) {
    const match = folder.lists.find((l) => l.id === state.selectedListId);
    if (match) return match;
  }
  return null;
}

export function selectSpaceStatuses(
  state: PmsWorkspaceState,
  space: PmsSpaceDTO | null
): PmsStatusDTO[] {
  if (!space) return [];
  const list = state.statuses.filter((st) => st.space_id === space.id);
  if (list.length > 0) return list;
  return [
    {
      id: "s1",
      space_id: space.id,
      name: "NOT STARTED",
      category: "not_started",
      color_hex: "#64748B",
      sort_order: 0,
    },
    {
      id: "s2",
      space_id: space.id,
      name: "TO DO",
      category: "not_started",
      color_hex: "#3B82F6",
      sort_order: 1,
    },
    {
      id: "s3",
      space_id: space.id,
      name: "IN PROGRESS",
      category: "active",
      color_hex: "#F59E0B",
      sort_order: 2,
    },
    {
      id: "s4",
      space_id: space.id,
      name: "REVIEW",
      category: "active",
      color_hex: "#A855F7",
      sort_order: 3,
    },
    {
      id: "s5",
      space_id: space.id,
      name: "COMPLETE",
      category: "closed",
      color_hex: "#10B981",
      sort_order: 4,
    },
  ];
}

export function selectFilteredTasks(state: PmsWorkspaceState): PmsTaskDTO[] {
  return state.tasks.filter((t) => {
    if (t.parent_task_id) return false;
    if (state.selectedListId && t.list_id !== state.selectedListId) return false;
    if (
      state.selectedFolderId &&
      !state.selectedListId &&
      t.folder_id !== state.selectedFolderId
    ) {
      return false;
    }
    if (
      state.selectedSpaceId &&
      !state.selectedFolderId &&
      !state.selectedListId &&
      t.space_id !== state.selectedSpaceId
    ) {
      return false;
    }
    if (state.priorityFilter !== "ALL" && t.priority !== state.priorityFilter) {
      return false;
    }
    if (state.searchQuery.trim()) {
      const q = state.searchQuery.toLowerCase();
      const hitTitle = t.name.toLowerCase().includes(q);
      const hitDesc = (t.description ?? "").toLowerCase().includes(q);
      const hitTags = t.tags.some((tg) => tg.toLowerCase().includes(q));
      if (!hitTitle && !hitDesc && !hitTags) return false;
    }
    return true;
  });
}
