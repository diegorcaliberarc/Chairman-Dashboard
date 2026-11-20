import type {
  PmsChecklistDTO,
  PmsCommentDTO,
  PmsDependencyDTO,
  PmsListDTO,
  PmsSpaceDTO,
  PmsStatusDTO,
  PmsTaskDTO,
} from "@/lib/pmsTypes";

export interface PmsWorkspacePayload {
  spaces: PmsSpaceDTO[];
  lists: PmsListDTO[];
  statuses: PmsStatusDTO[];
  tasks: PmsTaskDTO[];
}

export interface CreateTaskPayload {
  name: string;
  list_id: string;
  status_id?: string;
  parent_task_id?: string | null;
  priority?: PmsTaskDTO["priority"];
  due_date?: string | null;
  description?: string | null;
}

export async function fetchPmsWorkspace(): Promise<PmsWorkspacePayload> {
  const res = await fetch("/api/pms", { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`PMS fetch failed with HTTP ${res.status}`);
  }
  const data = (await res.json()) as Partial<PmsWorkspacePayload>;
  return {
    spaces: Array.isArray(data.spaces) ? data.spaces : [],
    lists: Array.isArray(data.lists) ? data.lists : [],
    statuses: Array.isArray(data.statuses) ? data.statuses : [],
    tasks: Array.isArray(data.tasks) ? data.tasks : [],
  };
}

export async function createPmsSpace(
  name: string,
  colorHex: string,
  icon: string
): Promise<boolean> {
  const res = await fetch("/api/pms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "create_space",
      name,
      color_hex: colorHex,
      icon,
    }),
  });
  return res.ok;
}

export async function createPmsFolder(
  spaceId: string,
  name: string
): Promise<boolean> {
  const res = await fetch("/api/pms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "create_folder",
      space_id: spaceId,
      name,
    }),
  });
  return res.ok;
}

export async function createPmsList(
  spaceId: string,
  folderId: string | null,
  name: string
): Promise<boolean> {
  const res = await fetch("/api/pms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "create_list",
      space_id: spaceId,
      folder_id: folderId,
      name,
    }),
  });
  return res.ok;
}

export async function createPmsTask(
  payload: CreateTaskPayload
): Promise<PmsTaskDTO | null> {
  const res = await fetch("/api/pms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "create_task",
      ...payload,
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { task?: PmsTaskDTO };
  return data.task ?? null;
}

export async function movePmsTaskStatus(
  taskId: string,
  statusId: string
): Promise<boolean> {
  const res = await fetch("/api/pms", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "move_status",
      task_id: taskId,
      status_id: statusId,
    }),
  });
  return res.ok;
}

export async function updatePmsTask(
  taskId: string,
  patch: Partial<PmsTaskDTO>
): Promise<boolean> {
  const res = await fetch("/api/pms", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "update_task",
      task_id: taskId,
      ...patch,
    }),
  });
  return res.ok;
}

export async function togglePmsChecklist(
  checklistId: string,
  isCompleted: boolean
): Promise<boolean> {
  const res = await fetch("/api/pms", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "toggle_checklist",
      checklist_id: checklistId,
      is_completed: isCompleted,
    }),
  });
  return res.ok;
}

export async function addPmsChecklist(
  taskId: string,
  name: string
): Promise<PmsChecklistDTO | null> {
  const res = await fetch("/api/pms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "add_checklist", task_id: taskId, name }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { checklist?: PmsChecklistDTO };
  return data.checklist ?? null;
}

export async function addPmsComment(
  taskId: string,
  content: string
): Promise<PmsCommentDTO | null> {
  const res = await fetch("/api/pms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "add_comment", task_id: taskId, content }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { comment?: PmsCommentDTO };
  return data.comment ?? null;
}

export async function addPmsDependency(
  dependentTaskId: string,
  prerequisiteTaskId: string,
  type: string
): Promise<PmsDependencyDTO | null> {
  const res = await fetch("/api/pms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "add_dependency",
      dependent_task_id: dependentTaskId,
      prerequisite_task_id: prerequisiteTaskId,
      type,
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { dependency?: PmsDependencyDTO };
  return data.dependency ?? null;
}

export async function deletePmsTask(taskId: string): Promise<boolean> {
  const res = await fetch(`/api/pms?taskId=${encodeURIComponent(taskId)}`, {
    method: "DELETE",
  });
  return res.ok;
}

export async function executeUniversalPmsAiCommand(params: {
  command: string;
  targetListId: string | null;
  defaultStatusId?: string;
}): Promise<string[]> {
  const { command, targetListId, defaultStatusId } = params;
  const lower = command.toLowerCase();
  const priority: PmsTaskDTO["priority"] =
    lower.includes("urgent") || lower.includes("asap")
      ? "urgent"
      : lower.includes("high")
        ? "high"
        : "normal";

  if (targetListId) {
    await createPmsTask({
      name: command,
      list_id: targetListId,
      status_id: defaultStatusId,
      priority,
    });
  }

  const syncedAreas: string[] = ["PMS"];
  const todayIso = new Date().toISOString().split("T")[0];

  const waterMatch = lower.match(
    /(\d+(?:\.\d+)?)\s*(oz|ml|liter|liters|l)\b.*water|water.*?(\d+(?:\.\d+)?)\s*(oz|ml)/i
  );
  const stepsMatch = lower.match(/(\d[\d,]*)\s*steps/i);
  if (
    waterMatch ||
    stepsMatch ||
    lower.includes("health") ||
    lower.includes("workout")
  ) {
    const patch: Record<string, string | number | boolean> = {
      log_date: todayIso,
      notes: `Synced from PMS: ${command}`,
    };
    if (stepsMatch) {
      patch.total_steps = parseInt(stepsMatch[1].replace(/,/g, ""), 10);
    }
    if (lower.includes("workout") || lower.includes("lift")) {
      patch.lift_completed = true;
    }
    await fetch("/api/sitrep", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    syncedAreas.push("Health & Sitrep");
  }

  if (
    lower.includes("ate ") ||
    lower.includes("eat ") ||
    lower.includes("meal") ||
    lower.includes("chicken") ||
    lower.includes("protein")
  ) {
    await fetch("/api/parse-food", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: command, date: todayIso }),
    }).catch(() => undefined);
    syncedAreas.push("Nutrition");
  }

  return syncedAreas;
}
