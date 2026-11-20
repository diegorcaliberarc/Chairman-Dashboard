"use client";

import React, { useState } from "react";
import {
  Calendar,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Clock,
  Flag,
  GitBranch,
  GripVertical,
  Plus,
} from "lucide-react";
import type { PmsStatusDTO, PmsTaskDTO } from "@/lib/pmsTypes";

interface GroupedTaskListProps {
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
  onUpdateTask: (taskId: string, patch: Partial<PmsTaskDTO>) => Promise<void>;
}

const PRIORITY_STYLES: Record<PmsTaskDTO["priority"], string> = {
  urgent: "text-rose-400 bg-rose-500/15 border-rose-500/30",
  high: "text-amber-400 bg-amber-500/15 border-amber-500/30",
  normal: "text-sky-400 bg-sky-500/15 border-sky-500/30",
  low: "text-zinc-400 bg-zinc-500/15 border-zinc-500/30",
  none: "text-zinc-500 bg-zinc-500/10 border-zinc-700/40",
};

export function GroupedTaskList({
  statuses,
  tasks,
  collapsedStatusIds,
  addingTaskForStatusId,
  onToggleCollapse,
  onSetAddingStatus,
  onCreateTask,
  onSelectTask,
  onMoveStatus,
  onUpdateTask,
}: GroupedTaskListProps) {
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
      data-testid="pms-grouped-list-view"
      className="h-full overflow-y-auto space-y-4 pr-1 pb-6"
    >
      {statuses.map((status) => {
        const groupTasks = tasks.filter((t) => t.status_id === status.id);
        const isCollapsed = collapsedStatusIds.includes(status.id);
        const isAdding = addingTaskForStatusId === status.id;
        const isDragOver = dragOverStatusId === status.id;

        return (
          <section
            key={status.id}
            data-testid={`pms-list-group-${status.id}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverStatusId(status.id);
            }}
            onDragLeave={() => setDragOverStatusId(null)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverStatusId(null);
              const draggedId = e.dataTransfer.getData("text/pms-task-id");
              if (draggedId) {
                void onMoveStatus(draggedId, status.id);
              }
            }}
            className={`rounded-xl border overflow-hidden transition ${
              isDragOver
                ? "border-blue-500 ring-2 ring-blue-500/30 bg-[#131726]"
                : "border-[#222630] bg-[#11131C]"
            }`}
          >
            <div className="h-10 px-3 bg-[#141624] border-b border-[#1E222D] flex items-center justify-between">
              <button
                type="button"
                data-testid={`pms-list-group-toggle-${status.id}`}
                onClick={() => onToggleCollapse(status.id)}
                className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-zinc-200 hover:text-white"
              >
                {isCollapsed ? (
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                )}
                <span
                  className="px-2 py-0.5 rounded-md text-[11px] font-bold"
                  style={{
                    backgroundColor: `${status.color_hex}25`,
                    color: status.color_hex,
                  }}
                >
                  {status.name}
                </span>
                <span className="px-1.5 py-0.5 rounded-full bg-[#1E2230] text-[10px] font-mono text-zinc-400">
                  {groupTasks.length}
                </span>
              </button>

              <button
                type="button"
                data-testid={`pms-list-quickadd-btn-${status.id}`}
                onClick={() => onSetAddingStatus(status.id)}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-zinc-400 hover:text-white hover:bg-[#1E2230] transition"
              >
                <Plus className="w-3 h-3" />
                <span>Add Task</span>
              </button>
            </div>

            {!isCollapsed && (
              <div>
                <div className="hidden md:grid grid-cols-12 gap-2 px-4 h-8 items-center text-[10px] font-semibold uppercase tracking-wider text-zinc-500 border-b border-[#1A1E2A] bg-[#0F111A]">
                  <div className="col-span-5">Task &amp; Tags</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Priority</div>
                  <div className="col-span-2">Due Date</div>
                  <div className="col-span-1 text-right">Est.</div>
                </div>

                <div className="divide-y divide-[#1A1E2A]">
                  {groupTasks.length === 0 && !isAdding && (
                    <div className="px-4 py-3 text-xs text-zinc-500">
                      No tasks in {status.name}. Drag a task here or click + Add Task.
                    </div>
                  )}

                  {groupTasks.map((task) => {
                    const doneChecks = task.checklists.filter(
                      (c) => c.is_completed
                    ).length;
                    const subtaskCount = task.subtasks?.length ?? 0;

                    return (
                      <div
                        key={task.id}
                        data-testid={`pms-list-task-${task.id}`}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/pms-task-id", task.id);
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        onClick={() => onSelectTask(task.id)}
                        className="group grid grid-cols-12 gap-2 px-4 py-2.5 items-center hover:bg-[#161926] cursor-pointer text-xs transition"
                      >
                        <div className="col-span-12 md:col-span-5 flex items-center gap-2 min-w-0">
                          <GripVertical className="w-3.5 h-3.5 text-zinc-600 opacity-0 group-hover:opacity-100 flex-shrink-0 cursor-grab" />
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: status.color_hex }}
                          />
                          <button
                            type="button"
                            data-testid={`pms-list-task-title-${task.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectTask(task.id);
                            }}
                            className="truncate font-medium text-zinc-100 group-hover:text-blue-300 text-left"
                          >
                            {task.name}
                          </button>
                          {subtaskCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-[#1E2230] text-[10px] text-zinc-400 flex items-center gap-0.5 flex-shrink-0">
                              <GitBranch className="w-2.5 h-2.5" />
                              {subtaskCount}
                            </span>
                          )}
                          {task.checklists.length > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-[#1E2230] text-[10px] text-zinc-400 flex items-center gap-0.5 flex-shrink-0">
                              <CheckSquare className="w-2.5 h-2.5 text-emerald-400" />
                              {doneChecks}/{task.checklists.length}
                            </span>
                          )}
                          {task.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="hidden lg:inline-flex px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 text-[10px] flex-shrink-0"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>

                        <div className="col-span-4 md:col-span-2">
                          <select
                            aria-label={`Status for ${task.name}`}
                            value={task.status_id}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) =>
                              void onMoveStatus(task.id, e.target.value)
                            }
                            className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#181C2A] border border-[#282E42] focus:outline-none"
                            style={{ color: status.color_hex }}
                          >
                            {statuses.map((st) => (
                              <option key={st.id} value={st.id}>
                                {st.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="col-span-4 md:col-span-2">
                          <select
                            aria-label={`Priority for ${task.name}`}
                            value={task.priority}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) =>
                              void onUpdateTask(task.id, {
                                priority: e.target
                                  .value as PmsTaskDTO["priority"],
                              })
                            }
                            className={`px-2 py-0.5 rounded border text-[10px] font-medium capitalize focus:outline-none ${PRIORITY_STYLES[task.priority]}`}
                          >
                            <option value="urgent">Urgent</option>
                            <option value="high">High</option>
                            <option value="normal">Normal</option>
                            <option value="low">Low</option>
                            <option value="none">None</option>
                          </select>
                        </div>

                        <div className="col-span-3 md:col-span-2 flex items-center gap-1 text-zinc-400">
                          <Calendar className="w-3 h-3 text-zinc-500" />
                          <span>
                            {task.due_date
                              ? new Date(task.due_date).toLocaleDateString([], {
                                  month: "short",
                                  day: "numeric",
                                })
                              : "—"}
                          </span>
                        </div>

                        <div className="col-span-1 text-right text-zinc-400 font-mono flex items-center justify-end gap-1">
                          {task.time_estimate_minutes > 0 ? (
                            <>
                              <Clock className="w-2.5 h-2.5 text-zinc-500" />
                              <span>{task.time_estimate_minutes}m</span>
                            </>
                          ) : (
                            <span>—</span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {isAdding ? (
                    <div className="px-4 py-2 bg-[#141724] flex items-center gap-2">
                      <Flag className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                      <input
                        type="text"
                        data-testid={`pms-list-quickadd-input-${status.id}`}
                        placeholder={`New task in ${status.name}...`}
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
                        className="flex-1 px-2.5 py-1 bg-[#090A0F] border border-blue-500 rounded-md text-xs text-white placeholder-zinc-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        data-testid={`pms-list-quickadd-submit-${status.id}`}
                        onClick={() => void handleQuickAdd(status.id)}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-[11px] font-semibold"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => onSetAddingStatus(null)}
                        className="px-2 py-1 text-[11px] text-zinc-400 hover:text-zinc-200"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSetAddingStatus(status.id)}
                      className="w-full h-8 px-4 flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-zinc-200 hover:bg-[#151824] transition"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Quick add task to {status.name}</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
