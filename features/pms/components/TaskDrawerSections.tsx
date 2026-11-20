"use client";

import React, { useState } from "react";
import {
  CheckSquare,
  GitBranch,
  MessageSquare,
  Send,
  Square,
} from "lucide-react";
import type { PmsTaskDTO } from "@/lib/pmsTypes";

interface TaskDrawerSectionsProps {
  task: PmsTaskDTO;
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
}

export function TaskDrawerSections({
  task,
  onToggleChecklist,
  onAddChecklist,
  onAddSubtask,
  onAddComment,
}: TaskDrawerSectionsProps) {
  const [newSubtask, setNewSubtask] = useState("");
  const [newChecklist, setNewChecklist] = useState("");
  const [newComment, setNewComment] = useState("");

  const subtasks = task.subtasks ?? [];
  const doneChecks = task.checklists.filter((c) => c.is_completed).length;

  return (
    <div className="space-y-5">
      <section className="space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
          <GitBranch className="w-3.5 h-3.5 text-blue-400" />
          Subtasks ({subtasks.length})
        </span>
        <div className="space-y-1.5">
          {subtasks.map((st) => (
            <div
              key={st.id}
              className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#141622] border border-[#202433] text-xs"
            >
              <span className="truncate text-zinc-200">{st.name}</span>
              <span className="text-[10px] font-mono text-zinc-400">
                {st.status_name}
              </span>
            </div>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newSubtask.trim()) return;
            void onAddSubtask(task.id, task.list_id, newSubtask.trim());
            setNewSubtask("");
          }}
        >
          <input
            type="text"
            data-testid="pms-drawer-subtask-input"
            placeholder="+ Add subtask and press Enter..."
            value={newSubtask}
            onChange={(e) => setNewSubtask(e.target.value)}
            className="w-full px-3 py-1.5 bg-[#12141E] border border-[#202433] rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
          />
        </form>
      </section>

      <section className="space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
          Checklist ({doneChecks}/{task.checklists.length})
        </span>
        <div className="space-y-1">
          {task.checklists.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() =>
                void onToggleChecklist(task.id, item.id, item.is_completed)
              }
              className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#181B28] text-left text-xs"
            >
              {item.is_completed ? (
                <CheckSquare className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <Square className="w-4 h-4 text-zinc-500 flex-shrink-0" />
              )}
              <span
                className={
                  item.is_completed
                    ? "line-through text-zinc-500"
                    : "text-zinc-200"
                }
              >
                {item.name}
              </span>
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newChecklist.trim()) return;
            void onAddChecklist(task.id, newChecklist.trim());
            setNewChecklist("");
          }}
        >
          <input
            type="text"
            data-testid="pms-drawer-checklist-input"
            placeholder="+ Add checklist item and press Enter..."
            value={newChecklist}
            onChange={(e) => setNewChecklist(e.target.value)}
            className="w-full px-3 py-1.5 bg-[#12141E] border border-[#202433] rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
          />
        </form>
      </section>

      <section className="space-y-2 pt-2 border-t border-[#1E222F]">
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
          Comments ({task.comments.length})
        </span>
        <div className="space-y-2">
          {task.comments.map((cm) => (
            <div
              key={cm.id}
              className="p-2.5 rounded-lg bg-[#141622] border border-[#202433] text-xs space-y-1"
            >
              <p className="text-zinc-200 whitespace-pre-wrap">{cm.content}</p>
            </div>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newComment.trim()) return;
            void onAddComment(task.id, newComment.trim());
            setNewComment("");
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            data-testid="pms-drawer-comment-input"
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-1 px-3 py-1.5 bg-[#12141E] border border-[#202433] rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={!newComment.trim()}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </section>
    </div>
  );
}
