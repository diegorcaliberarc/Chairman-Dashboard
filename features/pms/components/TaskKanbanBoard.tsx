"use client";

import React, { useState } from "react";
import {
  Calendar,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  GitBranch,
  Minimize2,
  Plus,
} from "lucide-react";
import type { PmsStatusDTO, PmsTaskDTO } from "@/lib/pmsTypes";

interface TaskKanbanBoardProps {
  statuses: PmsStatusDTO[];
  tasks: PmsTaskDTO[];
  collapsedStatusIds: string[];
  addingTaskForStatusId: string | null;
  onToggleCollapse: (statusId: string) => void;
  onSetAddingStatus: (statusId: string | null) => void;
  onCreateTask: (params: {
    name: string;
    statusId: string;
    priority?: PmsTaskDTO["priority"];
  }) => Promise<void>;
  onSelectTask: (taskId: string) => void;
  onMoveStatus: (taskId: string, targetStatusId: string) => Promise<void>;
  onStepStatus: (task: PmsTaskDTO, direction: -1 | 1) => void;
}

export function TaskKanbanBoard({
  statuses,
  tasks,
  collapsedStatusIds,
  addingTaskForStatusId,
  onToggleCollapse,
  onSetAddingStatus,
  onCreateTask,
  onSelectTask,
  onMoveStatus,
  onStepStatus,
}: TaskKanbanBoardProps) {
  const [draftByStatus, setDraftByStatus] = useState<Record<string, string>>({});
  const [dragOverStatusId, setDragOverStatusId] = useState<string | null>(null);

  const handleQuickAdd = async (statusId: string) => {
    const title = (draftByStatus[statusId] ?? "").trim();
    if (!title) return;
    await onCreateTask({ name: title, statusId, priority: "normal" });
    setDraftByStatus((prev) => ({ ...prev, [statusId]: "" }));
  };

  return (
    <div
      data-testid="pms-kanban-board-view"
      className="flex gap-3 h-full items-start overflow-x-auto pb-4"
    >
      {statuses.map((status) => {
        const columnTasks = tasks.filter((t) => t.status_id === status.id);
        const isCollapsed = collapsedStatusIds.includes(status.id);
        const isAdding = addingTaskForStatusId === status.id;
        const isDragOver = dragOverStatusId === status.id;

        if (isCollapsed) {
          return (
            <button
              key={status.id}
              type="button"
              data-testid={`pms-kanban-col-${status.id}`}
              onClick={() => onToggleCollapse(status.id)}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverStatusId(status.id);
              }}
              onDragLeave={() => setDragOverStatusId(null)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverStatusId(null);
                const draggedId = e.dataTransfer.getData("text/pms-task-id");
                if (draggedId) void onMoveStatus(draggedId, status.id);
              }}
              className={`w-11 min-w-11 h-full py-3 rounded-xl border flex flex-col items-center gap-3 transition ${
                isDragOver
                  ? "border-blue-500 bg-blue-500/15"
                  : "border-[#222630] bg-[#11131C] hover:bg-[#161926]"
              }`}
              title={`Expand ${status.name}`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: status.color_hex }}
              />
              <span className="px-1.5 py-0.5 rounded-full bg-[#1E2230] text-[10px] font-mono text-zinc-300">
                {columnTasks.length}
              </span>
              <span
                className="text-[11px] font-bold tracking-wider uppercase text-zinc-400"
                style={{ writingMode: "vertical-rl" }}
              >
                {status.name}
              </span>
            </button>
          );
        }

        return (
          <div
            key={status.id}
            data-testid={`pms-kanban-col-${status.id}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverStatusId(status.id);
            }}
            onDragLeave={() => setDragOverStatusId(null)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverStatusId(null);
              const draggedId = e.dataTransfer.getData("text/pms-task-id");
              if (draggedId) void onMoveStatus(draggedId, status.id);
            }}
            className={`w-[276px] min-w-[276px] max-h-full rounded-xl border flex flex-col overflow-hidden transition ${
              isDragOver
                ? "border-blue-500 ring-2 ring-blue-500/30 bg-[#131726]"
                : "border-[#222630] bg-[#11131C]"
            }`}
          >
            <div className="h-10 px-3 border-b border-[#1E222D] flex items-center justify-between bg-[#141624]">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: status.color_hex }}
                />
                <span className="text-xs font-bold tracking-wider text-zinc-200 uppercase truncate">
                  {status.name}
                </span>
                <span className="px-1.5 py-0.5 rounded-full bg-[#1E2230] text-[10px] font-mono text-zinc-400">
                  {columnTasks.length}
                </span>
              </div>

              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  data-testid={`pms-kanban-quickadd-btn-${status.id}`}
                  onClick={() => onSetAddingStatus(status.id)}
                  className="p-1 rounded text-zinc-400 hover:text-white hover:bg-[#202538] transition"
                  title="Add Task to Column"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  data-testid={`pms-kanban-collapse-${status.id}`}
                  onClick={() => onToggleCollapse(status.id)}
                  className="p-1 rounded text-zinc-400 hover:text-white hover:bg-[#202538] transition"
                  title="Collapse Column"
                >
                  <Minimize2 className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {columnTasks.map((task) => {
                const subtaskCount = task.subtasks?.length ?? 0;
                return (
                  <div
                    key={task.id}
                    data-testid={`pms-kanban-card-${task.id}`}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/pms-task-id", task.id);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onClick={() => onSelectTask(task.id)}
                    className="group w-full p-3 bg-[#161924] border border-[#222630] hover:border-blue-500/50 hover:bg-[#1A1E2B] rounded-lg cursor-grab active:cursor-grabbing transition shadow-sm space-y-2.5"
                  >
                    <h4 className="text-xs font-semibold text-zinc-100 group-hover:text-blue-300 transition line-clamp-2">
                      {task.name}
                    </h4>

                    <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                      {task.priority !== "none" && (
                        <span
                          className={`px-1.5 py-0.5 rounded font-medium flex items-center gap-1 ${
                            task.priority === "urgent"
                              ? "bg-rose-500/20 text-rose-300"
                              : task.priority === "high"
                                ? "bg-amber-500/20 text-amber-300"
                                : task.priority === "normal"
                                  ? "bg-blue-500/20 text-blue-300"
                                  : "bg-zinc-500/20 text-zinc-400"
                          }`}
                        >
                          <Flag className="w-2.5 h-2.5" />
                          {task.priority}
                        </span>
                      )}

                      {subtaskCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-[#202434] text-zinc-300 flex items-center gap-1">
                          <GitBranch className="w-2.5 h-2.5 text-blue-400" />
                          {subtaskCount}
                        </span>
                      )}

                      {task.checklists.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-[#202434] text-zinc-300 flex items-center gap-1">
                          <CheckSquare className="w-2.5 h-2.5 text-emerald-400" />
                          {task.checklists.filter((c) => c.is_completed).length}/
                          {task.checklists.length}
                        </span>
                      )}

                      {task.time_estimate_minutes > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-[#202434] text-zinc-400 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {task.time_estimate_minutes}m
                        </span>
                      )}

                      {task.due_date && (
                        <span className="px-1.5 py-0.5 rounded bg-[#202434] text-zinc-400 flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          {new Date(task.due_date).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      )}
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 flex items-center justify-between pt-1 border-t border-[#202534] transition">
                      <span className="text-[10px] text-zinc-500">
                        Drag or step:
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          title="Move Left"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStepStatus(task, -1);
                          }}
                          className="p-0.5 rounded hover:bg-[#282F44] text-zinc-400 hover:text-white"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          title="Move Right"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStepStatus(task, 1);
                          }}
                          className="p-0.5 rounded hover:bg-[#282F44] text-zinc-400 hover:text-white"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {isAdding && (
                <div className="p-2 bg-[#161924] border border-blue-500 rounded-lg space-y-2">
                  <input
                    type="text"
                    data-testid={`pms-kanban-quickadd-input-${status.id}`}
                    placeholder="What needs to be done?"
                    value={draftByStatus[status.id] ?? ""}
                    onChange={(e) =>
                      setDraftByStatus((prev) => ({
                        ...prev,
                        [status.id]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void handleQuickAdd(status.id);
                      if (e.key === "Escape") onSetAddingStatus(null);
                    }}
                    autoFocus
                    className="w-full px-2 py-1 bg-[#090A0F] border border-[#222634] rounded text-xs text-white placeholder-zinc-500 focus:outline-none"
                  />
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => onSetAddingStatus(null)}
                      className="px-2 py-0.5 text-[11px] text-zinc-400 hover:text-zinc-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleQuickAdd(status.id)}
                      className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-medium"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>

            {!isAdding && (
              <button
                type="button"
                onClick={() => onSetAddingStatus(status.id)}
                className="h-9 px-3 border-t border-[#1E222D] flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-[#161924] transition"
              >
                <Plus className="w-3 h-3" />
                <span>Add Task</span>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
