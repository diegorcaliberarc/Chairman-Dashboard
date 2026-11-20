export interface PmsSpaceDTO {
  id: string;
  workspace_id: string;
  name: string;
  color_hex: string;
  icon: string;
  is_private: boolean;
  folders: PmsFolderDTO[];
  lists: PmsListDTO[];
  statuses: PmsStatusDTO[];
}

export interface PmsFolderDTO {
  id: string;
  space_id: string;
  name: string;
  lists: PmsListDTO[];
}

export interface PmsListDTO {
  id: string;
  space_id: string;
  folder_id: string | null;
  name: string;
  space_name?: string;
  folder_name?: string;
}

export interface PmsStatusDTO {
  id: string;
  space_id: string;
  name: string;
  category: "not_started" | "active" | "done" | "closed";
  color_hex: string;
  sort_order: number;
}

export interface PmsChecklistDTO {
  id: string;
  task_id: string;
  name: string;
  is_completed: boolean;
  sort_order: number;
}

export interface PmsCommentDTO {
  id: string;
  task_id: string;
  user_id: string | null;
  content: string;
  created_at: string;
}

export interface PmsDependencyDTO {
  id: string;
  dependent_task_id: string;
  prerequisite_task_id: string;
  type: string;
  prerequisite_task_name?: string;
  dependent_task_name?: string;
}

export interface PmsTaskDTO {
  id: string;
  list_id: string;
  space_id: string;
  folder_id: string | null;
  parent_task_id: string | null;
  name: string;
  description: string | null;
  status_id: string;
  status_name: string;
  status_category: "not_started" | "active" | "done" | "closed";
  status_color: string;
  priority: "urgent" | "high" | "normal" | "low" | "none";
  start_date: string | null;
  due_date: string | null;
  time_estimate_ms: number;
  time_estimate_minutes: number;
  tags: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
  space_name: string;
  list_name: string;
  folder_name: string | null;
  checklists: PmsChecklistDTO[];
  comments: PmsCommentDTO[];
  dependencies: PmsDependencyDTO[];
  subtasks?: PmsTaskDTO[];
}
