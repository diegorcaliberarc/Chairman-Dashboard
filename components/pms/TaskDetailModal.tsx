"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  X,
  Calendar,
  Clock,
  Play,
  Pause,
  Tag,
  CheckSquare,
  Square,
  AlertCircle,
  Flag,
  User,
  Plus,
  Send,
  MessageSquare,
  History,
  GitCommit,
  Layers,
  ArrowRight,
  Hash,
  List,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code,
  Table as TableIcon,
  Sparkles,
  Paperclip,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { PmsTaskDTO, PmsStatusDTO } from "@/app/api/pms/route";

interface TaskDetailModalProps {
  task: PmsTaskDTO | null;
  statuses: PmsStatusDTO[];
  allTasks: PmsTaskDTO[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateTask: (taskId: string, patch: Partial<PmsTaskDTO>) => Promise<void>;
  onToggleChecklist: (taskId: string, checklistId: string, current: boolean) => Promise<void>;
  onAddChecklist: (taskId: string, name: string) => Promise<void>;
  onAddComment: (taskId: string, content: string) => Promise<void>;
  onAddDependency: (dependentTaskId: string, prereqTaskId: string, type: string) => Promise<void>;
  onAddSubtask: (parentTaskId: string, listId: string, name: string) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
}

export function TaskDetailModal({
  task,
  statuses,
  allTasks,
  isOpen,
  onClose,
  onUpdateTask,
  onToggleChecklist,
  onAddChecklist,
  onAddComment,
  onAddDependency,
  onAddSubtask,
  onDeleteTask,
}: TaskDetailModalProps) {
  // Local state for immediate responsiveness
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<string>("normal");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [timeEstimateMinutes, setTimeEstimateMinutes] = useState(0);

  // Live Stopwatch
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // New Items Drafts
  const [newChecklistText, setNewChecklistText] = useState("");
  const [newSubtaskText, setNewSubtaskText] = useState("");
  const [newCommentText, setNewCommentText] = useState("");
  const [depPrereqId, setDepPrereqId] = useState("");
  const [depType, setDepType] = useState<"blocking" | "waiting_on">("blocking");

  // Slash Command Palette State
  const [showSlashPalette, setShowSlashPalette] = useState(false);
  const [slashCursorPos, setSlashCursorPos] = useState<number>(0);
  const descTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Active right tab
  const [rightTab, setRightTab] = useState<"comments" | "activity">("comments");

  // Sync with prop changes
  useEffect(() => {
    if (task) {
      setName(task.name || "");
      setDescription(task.description || "");
      setPriority(task.priority || "normal");
      setStartDate(task.start_date ? task.start_date.substring(0, 10) : "");
      setDueDate(task.due_date ? task.due_date.substring(0, 10) : "");
      setTimeEstimateMinutes(task.time_estimate_minutes || 0);
    }
  }, [task]);

  // Live Timer Interval
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  if (!isOpen || !task) return null;

  const handleNameBlur = () => {
    if (name.trim() && name !== task.name) {
      onUpdateTask(task.id, { name: name.trim() });
    }
  };

  const handleDescBlur = () => {
    if (description !== task.description) {
      onUpdateTask(task.id, { description });
    }
  };

  const handleStatusChange = (statusId: string) => {
    onUpdateTask(task.id, { status_id: statusId });
  };

  const handlePriorityChange = (val: any) => {
    setPriority(val);
    onUpdateTask(task.id, { priority: val });
  };

  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    onUpdateTask(task.id, { start_date: val ? new Date(val).toISOString() : null });
  };

  const handleDueDateChange = (val: string) => {
    setDueDate(val);
    onUpdateTask(task.id, { due_date: val ? new Date(val).toISOString() : null });
  };

  const handleEstimateChange = (mins: number) => {
    setTimeEstimateMinutes(mins);
    onUpdateTask(task.id, { time_estimate_minutes: mins });
  };

  // Stopwatch Formatting
  const formatTimer = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Slash Command Handler
  const handleDescKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "/") {
      setShowSlashPalette(true);
      setSlashCursorPos(e.currentTarget.selectionStart || 0);
    } else if (e.key === "Escape") {
      setShowSlashPalette(false);
    }
  };

  const insertSlashCommand = (template: string) => {
    const text = description;
    const before = text.substring(0, slashCursorPos);
    const after = text.substring(slashCursorPos + 1);
    const nextDesc = before + template + after;
    setDescription(nextDesc);
    setShowSlashPalette(false);
    onUpdateTask(task.id, { description: nextDesc });
    if (descTextareaRef.current) {
      descTextareaRef.current.focus();
    }
  };

  // Checklist handler
  const handleAddChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;
    await onAddChecklist(task.id, newChecklistText.trim());
    setNewChecklistText("");
  };

  // Subtask handler
  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskText.trim()) return;
    await onAddSubtask(task.id, task.list_id, newSubtaskText.trim());
    setNewSubtaskText("");
  };

  // Comment handler
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    await onAddComment(task.id, newCommentText.trim());
    setNewCommentText("");
  };

  // Dependency handler
  const handleAddDep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depPrereqId) return;
    if (depType === "blocking") {
      await onAddDependency(depPrereqId, task.id, "blocking");
    } else {
      await onAddDependency(task.id, depPrereqId, "blocking");
    }
    setDepPrereqId("");
  };

  const currentStatus = statuses.find((s) => s.id === task.status_id) || {
    name: task.status_name,
    color_hex: task.status_color,
  };

  const availablePrereqs = allTasks.filter((t) => t.id !== task.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-[90vw] max-w-[1280px] h-[85vh] bg-[#0E1017] border border-[#222634] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100">
        {/* Top Header Bar */}
        <div className="h-14 px-6 border-b border-[#1E222F] flex items-center justify-between bg-[#12141E]">
          {/* Breadcrumb Path */}
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="font-medium text-blue-400">{task.space_name}</span>
            {task.folder_name && (
              <>
                <span>/</span>
                <span>{task.folder_name}</span>
              </>
            )}
            <span>/</span>
            <span className="text-zinc-200">{task.list_name}</span>
            <span className="ml-3 px-2 py-0.5 rounded bg-[#1C202C] text-[11px] text-zinc-400 font-mono">
              ID: {task.id.substring(0, 8)}
            </span>
          </div>

          {/* Close & Delete */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDeleteTask(task.id)}
              title="Delete Task"
              className="p-2 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-[#1E222F] transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2-Column Split: 65% Left / 35% Right */}
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT COLUMN: 65% Main Canvas */}
          <div className="w-[65%] h-full border-r border-[#1E222F] overflow-y-auto p-6 space-y-6">
            {/* Title Input */}
            <div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={handleNameBlur}
                placeholder="Task title..."
                className="w-full text-2xl font-bold bg-transparent border-b border-transparent hover:border-[#222634] focus:border-blue-500 focus:outline-none py-1 text-white transition placeholder-zinc-600"
              />
            </div>

            {/* 2-Column Property Matrix (36px Row Height, 12px Gap) */}
            <div className="grid grid-cols-2 gap-3 p-4 bg-[#141622] border border-[#202433] rounded-xl text-xs">
              {/* Row 1: Status & Priority */}
              <div className="h-9 flex items-center justify-between px-2">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" /> Status
                </span>
                <select
                  value={task.status_id}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="px-2.5 py-1 rounded-md bg-[#1B1E2C] border border-[#2B3042] text-xs font-semibold focus:outline-none"
                  style={{ color: currentStatus.color_hex }}
                >
                  {statuses.map((s) => (
                    <option key={s.id} value={s.id} style={{ color: s.color_hex }}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="h-9 flex items-center justify-between px-2">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Flag className="w-3.5 h-3.5" /> Priority
                </span>
                <select
                  value={priority}
                  onChange={(e) => handlePriorityChange(e.target.value)}
                  className={`px-2.5 py-1 rounded-md bg-[#1B1E2C] border border-[#2B3042] text-xs font-medium focus:outline-none ${
                    priority === "urgent"
                      ? "text-rose-400"
                      : priority === "high"
                      ? "text-amber-400"
                      : priority === "normal"
                      ? "text-sky-400"
                      : "text-zinc-400"
                  }`}
                >
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="normal">Normal</option>
                  <option value="low">Low</option>
                  <option value="none">None</option>
                </select>
              </div>

              {/* Row 2: Start Date & Due Date */}
              <div className="h-9 flex items-center justify-between px-2">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Start Date
                </span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="px-2 py-0.5 rounded bg-[#1B1E2C] border border-[#2B3042] text-xs text-zinc-200 focus:outline-none"
                />
              </div>

              <div className="h-9 flex items-center justify-between px-2">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Due Date
                </span>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => handleDueDateChange(e.target.value)}
                  className="px-2 py-0.5 rounded bg-[#1B1E2C] border border-[#2B3042] text-xs text-zinc-200 focus:outline-none"
                />
              </div>

              {/* Row 3: Time Estimate & Live Track Time Stopwatch */}
              <div className="h-9 flex items-center justify-between px-2">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Estimate
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    step="15"
                    value={timeEstimateMinutes || ""}
                    onChange={(e) => handleEstimateChange(Number(e.target.value))}
                    placeholder="0"
                    className="w-16 px-2 py-0.5 rounded bg-[#1B1E2C] border border-[#2B3042] text-xs text-right text-zinc-200 focus:outline-none"
                  />
                  <span className="text-zinc-500 text-[11px]">mins</span>
                </div>
              </div>

              <div className="h-9 flex items-center justify-between px-2">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-400" /> Track Time
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-blue-300 font-semibold">
                    {formatTimer(elapsedSeconds)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsTimerRunning((r) => !r)}
                    className={`p-1 rounded-md transition ${
                      isTimerRunning
                        ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                        : "bg-blue-600/20 text-blue-400 hover:bg-blue-600/30"
                    }`}
                  >
                    {isTimerRunning ? (
                      <Pause className="w-3.5 h-3.5" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Description Canvas with 2-Column Floating Slash Command Palette */}
            <div className="relative space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Description
                </span>
                <span className="text-[11px] text-zinc-500">
                  Type <kbd className="px-1 py-0.5 bg-[#1B1E2C] rounded text-zinc-300">/</kbd> for
                  blocks
                </span>
              </div>

              <textarea
                ref={descTextareaRef}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleDescBlur}
                onKeyDown={handleDescKeyDown}
                rows={6}
                placeholder="Write description or type '/' for slash commands..."
                className="w-full px-4 py-3 bg-[#12141E] border border-[#202433] rounded-xl text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition leading-relaxed resize-none font-sans"
              />

              {/* Floating Two-Column Slash Palette (440px width, 380px max-height) */}
              {showSlashPalette && (
                <div className="absolute left-4 top-16 w-[440px] max-h-[380px] bg-[#141724] border border-[#282E42] rounded-xl shadow-2xl p-3 z-50 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                  <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2 px-1">
                    Slash Commands
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Column 1: Text & Lists (200px) */}
                    <div className="space-y-1">
                      <div className="text-[10px] text-zinc-500 font-semibold px-2 uppercase">
                        Text & Sizes
                      </div>
                      <button
                        onClick={() => insertSlashCommand("# ")}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-zinc-300 hover:text-white hover:bg-[#202538] transition"
                      >
                        <Heading1 className="w-3.5 h-3.5 text-blue-400" />
                        <span>Heading 1</span>
                      </button>
                      <button
                        onClick={() => insertSlashCommand("## ")}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-zinc-300 hover:text-white hover:bg-[#202538] transition"
                      >
                        <Heading2 className="w-3.5 h-3.5 text-blue-400" />
                        <span>Heading 2</span>
                      </button>
                      <button
                        onClick={() => insertSlashCommand("### ")}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-zinc-300 hover:text-white hover:bg-[#202538] transition"
                      >
                        <Heading3 className="w-3.5 h-3.5 text-blue-400" />
                        <span>Heading 3</span>
                      </button>
                      <button
                        onClick={() => insertSlashCommand("> ")}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-zinc-300 hover:text-white hover:bg-[#202538] transition"
                      >
                        <Quote className="w-3.5 h-3.5 text-amber-400" />
                        <span>Callout Quote</span>
                      </button>

                      <div className="text-[10px] text-zinc-500 font-semibold px-2 uppercase pt-2">
                        Formatting & Lists
                      </div>
                      <button
                        onClick={() => insertSlashCommand("- ")}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-zinc-300 hover:text-white hover:bg-[#202538] transition"
                      >
                        <List className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Bullet List</span>
                      </button>
                      <button
                        onClick={() => insertSlashCommand("1. ")}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-zinc-300 hover:text-white hover:bg-[#202538] transition"
                      >
                        <Hash className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Numbered List</span>
                      </button>
                      <button
                        onClick={() => insertSlashCommand("- [ ] ")}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-zinc-300 hover:text-white hover:bg-[#202538] transition"
                      >
                        <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Checklist</span>
                      </button>
                      <button
                        onClick={() => insertSlashCommand("```ts\n// Code snippet\n```")}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-zinc-300 hover:text-white hover:bg-[#202538] transition"
                      >
                        <Code className="w-3.5 h-3.5 text-purple-400" />
                        <span>Code Block</span>
                      </button>
                    </div>

                    {/* Column 2: Views & AI (200px) */}
                    <div className="space-y-1">
                      <div className="text-[10px] text-zinc-500 font-semibold px-2 uppercase">
                        Inline & Views
                      </div>
                      <button
                        onClick={() =>
                          insertSlashCommand(
                            "| Column 1 | Column 2 |\n|---|---|\n| Item A | Item B |"
                          )
                        }
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-zinc-300 hover:text-white hover:bg-[#202538] transition"
                      >
                        <TableIcon className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Markdown Table</span>
                      </button>
                      <button
                        onClick={() => insertSlashCommand("\n---\n")}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-zinc-300 hover:text-white hover:bg-[#202538] transition"
                      >
                        <Layers className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Divider</span>
                      </button>

                      <div className="text-[10px] text-zinc-500 font-semibold px-2 uppercase pt-2">
                        Embeddings & AI
                      </div>
                      <button
                        onClick={() =>
                          insertSlashCommand("✨ AI Directive: Optimize operational execution\n")
                        }
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-zinc-300 hover:text-white hover:bg-[#202538] transition"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>AI Directive</span>
                      </button>
                      <button
                        onClick={() => insertSlashCommand("[Attachment Link](https://...)")}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-zinc-300 hover:text-white hover:bg-[#202538] transition"
                      >
                        <Paperclip className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Attachment</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Subtasks Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Subtasks ({(task.subtasks || []).length})
                </span>
              </div>

              {/* Subtasks list */}
              <div className="space-y-1.5">
                {(task.subtasks || []).map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-[#141622] border border-[#202433] text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: st.status_color }} />
                      <span className="truncate text-zinc-200">{st.name}</span>
                    </div>
                    <span className="text-[11px] text-zinc-500 font-mono">
                      {st.status_name}
                    </span>
                  </div>
                ))}
              </div>

              {/* Add subtask inline input */}
              <form onSubmit={handleAddSubtask} className="flex gap-2">
                <input
                  type="text"
                  placeholder="+ Add new subtask and hit enter..."
                  value={newSubtaskText}
                  onChange={(e) => setNewSubtaskText(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-[#12141E] border border-[#202433] rounded-lg text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                />
              </form>
            </div>

            {/* Checklists Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Checklist ({task.checklists.filter((c) => c.is_completed).length}/
                  {task.checklists.length})
                </span>
              </div>

              <div className="space-y-1">
                {task.checklists.map((cl) => (
                  <div
                    key={cl.id}
                    onClick={() => onToggleChecklist(task.id, cl.id, cl.is_completed)}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#181B28] cursor-pointer text-xs group"
                  >
                    {cl.is_completed ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 flex-shrink-0" />
                    )}
                    <span
                      className={`truncate ${
                        cl.is_completed
                          ? "line-through text-zinc-500"
                          : "text-zinc-200"
                      }`}
                    >
                      {cl.name}
                    </span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddChecklist} className="flex gap-2">
                <input
                  type="text"
                  placeholder="+ Add checklist item and hit enter..."
                  value={newChecklistText}
                  onChange={(e) => setNewChecklistText(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-[#12141E] border border-[#202433] rounded-lg text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                />
              </form>
            </div>

            {/* Dependencies Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Dependencies & Blockers
                </span>
              </div>

              {/* Existing dependencies */}
              <div className="space-y-1.5">
                {task.dependencies.map((dep) => (
                  <div
                    key={dep.id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-[#141622] border border-[#202433] text-xs text-zinc-300"
                  >
                    <GitCommit className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-zinc-400">{dep.type.toUpperCase()}:</span>
                    <span className="text-white font-medium">
                      {dep.dependent_task_id === task.id
                        ? dep.prerequisite_task_name || dep.prerequisite_task_id
                        : dep.dependent_task_name || dep.dependent_task_id}
                    </span>
                  </div>
                ))}
              </div>

              {/* Add dependency form */}
              <form onSubmit={handleAddDep} className="flex gap-2">
                <select
                  value={depType}
                  onChange={(e) => setDepType(e.target.value as any)}
                  className="px-2.5 py-1.5 bg-[#12141E] border border-[#202433] rounded-lg text-xs text-zinc-300 focus:outline-none"
                >
                  <option value="blocking">Blocks</option>
                  <option value="waiting_on">Waiting On</option>
                </select>
                <select
                  value={depPrereqId}
                  onChange={(e) => setDepPrereqId(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 bg-[#12141E] border border-[#202433] rounded-lg text-xs text-zinc-300 focus:outline-none"
                >
                  <option value="">Select task...</option>
                  {availablePrereqs.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={!depPrereqId}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg text-xs font-medium transition"
                >
                  Link
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT COLUMN: 35% Activity Log & Comments Stream */}
          <div className="w-[35%] h-full bg-[#11131C] flex flex-col overflow-hidden">
            {/* Tab switch */}
            <div className="h-11 px-4 border-b border-[#1E222F] flex items-center gap-4 text-xs font-semibold">
              <button
                onClick={() => setRightTab("comments")}
                className={`h-full flex items-center gap-1.5 border-b-2 transition ${
                  rightTab === "comments"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" /> Comments ({task.comments.length})
              </button>
              <button
                onClick={() => setRightTab("activity")}
                className={`h-full flex items-center gap-1.5 border-b-2 transition ${
                  rightTab === "activity"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <History className="w-3.5 h-3.5" /> Activity
              </button>
            </div>

            {/* Stream View */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {rightTab === "comments" ? (
                <>
                  {task.comments.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 text-xs">
                      <MessageSquare className="w-8 h-8 mb-2 opacity-30" />
                      <span>No comments yet.</span>
                      <span>Start the conversation below.</span>
                    </div>
                  ) : (
                    task.comments.map((cm) => (
                      <div
                        key={cm.id}
                        className="p-3 rounded-xl bg-[#161924] border border-[#222736] space-y-1.5 text-xs"
                      >
                        <div className="flex items-center justify-between text-[11px] text-zinc-400">
                          <span className="font-semibold text-zinc-200">The Chairman</span>
                          <span className="text-zinc-500">
                            {new Date(cm.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-zinc-200 whitespace-pre-wrap leading-relaxed">
                          {cm.content}
                        </p>
                      </div>
                    ))
                  )}
                </>
              ) : (
                <div className="space-y-3 text-xs text-zinc-400">
                  <div className="flex items-start gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                    <div>
                      <p className="text-zinc-200">
                        Task created in <span className="text-blue-400">{task.list_name}</span>
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        {new Date(task.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5" />
                    <div>
                      <p className="text-zinc-200">
                        Current status: <span className="font-semibold">{task.status_name}</span>
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        {new Date(task.updated_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Comment Composer */}
            {rightTab === "comments" && (
              <form
                onSubmit={handleAddComment}
                className="p-3 border-t border-[#1E222F] bg-[#141622] flex gap-2"
              >
                <input
                  type="text"
                  placeholder="Write a comment... (@ to mention)"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  className="flex-1 px-3 py-2 bg-[#0D0F17] border border-[#222736] rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={!newCommentText.trim()}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-lg shadow-blue-500/10"
                >
                  <Send className="w-3 h-3" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
