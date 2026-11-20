"use client";

import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  Calendar,
  Clock,
  Eye,
  Flag,
  Layers,
  Maximize2,
  PanelRight,
  Pencil,
  SquareSplitHorizontal,
  Trash2,
  X,
} from "lucide-react";
import type { PmsStatusDTO, PmsTaskDTO } from "@/lib/pmsTypes";
import type { PmsPeekMode } from "../state/pmsMachine";
import { TaskDrawerSections } from "./TaskDrawerSections";

interface TaskDetailDrawerProps {
  task: PmsTaskDTO | null;
  statuses: PmsStatusDTO[];
  peekMode: PmsPeekMode;
  onChangePeekMode: (mode: PmsPeekMode) => void;
  onClose: () => void;
  onUpdateTask: (taskId: string, patch: Partial<PmsTaskDTO>) => Promise<void>;
  onToggleChecklist: (
    taskId: string,
    checklistId: string,
    current: boolean
  ) => Promise<void>;
  onAddChecklist: (taskId: string, name: string) => Promise<void>;
  onAddSubtask: (
    parentTaskId: string,
    listId: string,
    name: string
  ) => Promise<void>;
  onAddComment: (taskId: string, content: string) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
}

export function TaskDetailDrawer({
  task,
  statuses,
  peekMode,
  onChangePeekMode,
  onClose,
  onUpdateTask,
  onToggleChecklist,
  onAddChecklist,
  onAddSubtask,
  onAddComment,
  onDeleteTask,
}: TaskDetailDrawerProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [descMode, setDescMode] = useState<"edit" | "preview">("edit");

  useEffect(() => {
    if (task) {
      setTitle(task.name);
      setDescription(task.description ?? "");
    }
  }, [task]);

  useEffect(() => {
    if (!task) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [task, onClose]);

  if (!task) return null;

  const containerClass =
    peekMode === "side-peek"
      ? "fixed top-0 right-0 bottom-0 w-full md:w-[540px] lg:w-[620px] border-l border-[#222634] shadow-2xl"
      : peekMode === "modal"
        ? "fixed top-[6%] left-[8%] right-[8%] bottom-[6%] rounded-2xl border border-[#222634] shadow-2xl"
        : "fixed inset-3 rounded-xl border border-[#222634] shadow-2xl";

  return (
    <div className="fixed inset-0 z-50">
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 bg-black/55 backdrop-blur-[2px]"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={task.name}
        data-testid="pms-task-drawer"
        data-peek-mode={peekMode}
        className={`${containerClass} z-50 bg-[#0E1017] text-zinc-100 flex flex-col overflow-hidden transition-all duration-200`}
      >
        <header className="h-12 px-4 border-b border-[#1E222F] bg-[#12141E] flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 truncate">
            <span className="text-blue-400 font-medium">{task.space_name}</span>
            <span>/</span>
            <span className="text-zinc-200 truncate">{task.list_name}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              data-testid="pms-drawer-peek-side"
              onClick={() => onChangePeekMode("side-peek")}
              title="Side Peek"
              className={`p-1.5 rounded-md transition ${
                peekMode === "side-peek"
                  ? "bg-blue-600/25 text-blue-300"
                  : "text-zinc-400 hover:text-white hover:bg-[#1E222F]"
              }`}
            >
              <PanelRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              data-testid="pms-drawer-peek-modal"
              onClick={() => onChangePeekMode("modal")}
              title="Modal Peek"
              className={`p-1.5 rounded-md transition ${
                peekMode === "modal"
                  ? "bg-blue-600/25 text-blue-300"
                  : "text-zinc-400 hover:text-white hover:bg-[#1E222F]"
              }`}
            >
              <SquareSplitHorizontal className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              data-testid="pms-drawer-peek-full"
              onClick={() => onChangePeekMode("full-screen")}
              title="Full Screen"
              className={`p-1.5 rounded-md transition ${
                peekMode === "full-screen"
                  ? "bg-blue-600/25 text-blue-300"
                  : "text-zinc-400 hover:text-white hover:bg-[#1E222F]"
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              data-testid="pms-drawer-delete-btn"
              onClick={() => void onDeleteTask(task.id)}
              title="Delete Task"
              className="p-1.5 rounded-md text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              data-testid="pms-drawer-close-btn"
              onClick={onClose}
              title="Close Drawer"
              className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-[#1E222F] transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <input
            type="text"
            data-testid="pms-drawer-title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => {
              const trimmed = title.trim();
              if (trimmed && trimmed !== task.name) {
                void onUpdateTask(task.id, { name: trimmed });
              }
            }}
            className="w-full text-xl font-bold bg-transparent border-b border-transparent hover:border-[#24283A] focus:border-blue-500 focus:outline-none pb-1 text-white"
          />

          <div className="grid grid-cols-2 gap-2.5 p-3.5 bg-[#141622] border border-[#202433] rounded-xl text-xs">
            <label className="flex items-center justify-between gap-2">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> Status
              </span>
              <select
                data-testid="pms-drawer-status-select"
                value={task.status_id}
                onChange={(e) =>
                  void onUpdateTask(task.id, { status_id: e.target.value })
                }
                className="px-2 py-1 rounded bg-[#1B1E2C] border border-[#2B3042] text-xs font-semibold focus:outline-none"
                style={{ color: task.status_color }}
              >
                {statuses.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center justify-between gap-2">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5" /> Priority
              </span>
              <select
                data-testid="pms-drawer-priority-select"
                value={task.priority}
                onChange={(e) =>
                  void onUpdateTask(task.id, {
                    priority: e.target.value as PmsTaskDTO["priority"],
                  })
                }
                className="px-2 py-1 rounded bg-[#1B1E2C] border border-[#2B3042] text-xs text-zinc-200 focus:outline-none"
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
                <option value="none">None</option>
              </select>
            </label>

            <label className="flex items-center justify-between gap-2">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Due Date
              </span>
              <input
                type="date"
                data-testid="pms-drawer-due-input"
                value={task.due_date ? task.due_date.slice(0, 10) : ""}
                onChange={(e) =>
                  void onUpdateTask(task.id, {
                    due_date: e.target.value
                      ? new Date(`${e.target.value}T12:00:00.000Z`).toISOString()
                      : null,
                  })
                }
                className="px-2 py-0.5 rounded bg-[#1B1E2C] border border-[#2B3042] text-xs text-zinc-200 focus:outline-none"
              />
            </label>

            <label className="flex items-center justify-between gap-2">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Est. (min)
              </span>
              <input
                type="number"
                min={0}
                step={15}
                value={task.time_estimate_minutes || ""}
                onChange={(e) =>
                  void onUpdateTask(task.id, {
                    time_estimate_minutes: Number(e.target.value) || 0,
                  })
                }
                className="w-20 px-2 py-0.5 rounded bg-[#1B1E2C] border border-[#2B3042] text-xs text-right text-zinc-200 focus:outline-none"
              />
            </label>
          </div>

          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Markdown Description
              </span>
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setDescMode("edit")}
                  className={`px-2 py-0.5 rounded flex items-center gap-1 ${
                    descMode === "edit"
                      ? "bg-blue-600/25 text-blue-300"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <Pencil className="w-3 h-3" /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => setDescMode("preview")}
                  className={`px-2 py-0.5 rounded flex items-center gap-1 ${
                    descMode === "preview"
                      ? "bg-blue-600/25 text-blue-300"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <Eye className="w-3 h-3" /> Preview
                </button>
              </div>
            </div>

            {descMode === "edit" ? (
              <textarea
                data-testid="pms-drawer-desc-input"
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => {
                  if (description !== (task.description ?? "")) {
                    void onUpdateTask(task.id, { description });
                  }
                }}
                placeholder="Write Markdown notes, specs, acceptance criteria..."
                className="w-full px-3.5 py-2.5 bg-[#12141E] border border-[#202433] rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500 resize-y leading-relaxed"
              />
            ) : (
              <div className="min-h-[108px] px-3.5 py-2.5 bg-[#12141E] border border-[#202433] rounded-xl text-xs text-zinc-200 prose prose-invert prose-sm max-w-none">
                {description.trim() ? (
                  <ReactMarkdown>{description}</ReactMarkdown>
                ) : (
                  <span className="text-zinc-500">No description yet.</span>
                )}
              </div>
            )}
          </section>

          <TaskDrawerSections
            task={task}
            onToggleChecklist={onToggleChecklist}
            onAddChecklist={onAddChecklist}
            onAddSubtask={onAddSubtask}
            onAddComment={onAddComment}
          />
        </div>
      </aside>
    </div>
  );
}
