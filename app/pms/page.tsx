"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertOctagon,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Clock,
  CloudDownload,
  Columns3,
  Database,
  FileJson,
  Filter,
  FolderKanban,
  GitBranch,
  Layers,
  ListTree,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Square,
  Tag,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { ExecutiveModuleShell } from "@/components/chairman/ExecutiveModuleShell";

type PmsStatusCategory =
  | "open"
  | "unstarted"
  | "active"
  | "blocked"
  | "review"
  | "closed";

interface ChecklistItem {
  id: string;
  task_id: string;
  name: string;
  is_completed: boolean;
  sort_order: number;
}

interface PmsList {
  id: string;
  name: string;
  space_name: string;
  original_clickup_list_id: string | null;
}

interface PmsTask {
  id: string;
  list_id: string;
  parent_task_id: string | null;
  original_clickup_id: string | null;
  name: string;
  markdown_description: string | null;
  status: string;
  status_category: PmsStatusCategory;
  priority: string;
  due_date: string | null;
  time_estimate_minutes: number;
  tags: string[];
  is_shared: boolean;
  is_closed: boolean;
  list_name?: string;
  space_name?: string;
  checklists: ChecklistItem[];
}

const COLUMNS: Array<{
  key: PmsStatusCategory;
  title: string;
  subtitle: string;
  accent: string;
  badgeBg: string;
}> = [
  {
    key: "open",
    title: "Ice Box / Ideas",
    subtitle: "Backlog & Exploratory R&D",
    accent: "#64748b",
    badgeBg: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  },
  {
    key: "unstarted",
    title: "Active Sprint Queue",
    subtitle: "Scoped & Ready for Dispatch",
    accent: "#3b82f6",
    badgeBg: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  },
  {
    key: "active",
    title: "Active Execution",
    subtitle: "In-Flight Deep Work",
    accent: "#f59e0b",
    badgeBg: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
  {
    key: "blocked",
    title: "Dependency Hold",
    subtitle: "External Wait / Blocker",
    accent: "#f43f5e",
    badgeBg: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  },
  {
    key: "review",
    title: "Verification Gate",
    subtitle: "QA Audit & Sign-Off",
    accent: "#a855f7",
    badgeBg: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  },
  {
    key: "closed",
    title: "Closed / Verified",
    subtitle: "Sovereign Ledger Sealed",
    accent: "#10b981",
    badgeBg: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
];

const PRIORITY_STYLES: Record<string, string> = {
  urgent: "bg-rose-500/20 text-rose-300 border-rose-500/40",
  high: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  normal: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  low: "bg-zinc-500/15 text-zinc-400 border-zinc-600/30",
};

function formatEstimate(mins: number): string {
  if (!mins || mins <= 0) return "—";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function SovereignPmsPage() {
  const [lists, setLists] = useState<PmsList[]>([]);
  const [tasks, setTasks] = useState<PmsTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [selectedListId, setSelectedListId] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [expandedTaskIds, setExpandedTaskIds] = useState<Record<string, boolean>>({});
  const [subtaskDrafts, setSubtaskDrafts] = useState<Record<string, string>>({});
  const [checklistDrafts, setChecklistDrafts] = useState<Record<string, string>>({});

  // Composer Modal
  const [composerOpen, setComposerOpen] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskListId, setNewTaskListId] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState<PmsStatusCategory>("unstarted");
  const [newTaskPriority, setNewTaskPriority] = useState("high");
  const [newTaskEstimate, setNewTaskEstimate] = useState("60");
  const [newTaskTags, setNewTaskTags] = useState("sovereign, sprint");
  const [newTaskChecklists, setNewTaskChecklists] = useState("");
  const [newTaskShared, setNewTaskShared] = useState(false);
  const [submittingTask, setSubmittingTask] = useState(false);

  // ClickUp Ingestion Modal
  const [ingestOpen, setIngestOpen] = useState(false);
  const [ingestTab, setIngestTab] = useState<"token" | "export">("token");
  const [clickupToken, setClickupToken] = useState("");
  const [exportFormat, setExportFormat] = useState<"json" | "csv">("json");
  const [rawExportText, setRawExportText] = useState("");
  const [ingesting, setIngesting] = useState(false);
  const [ingestFeedback, setIngestFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const loadPms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pms", { cache: "no-store" });
      const data = await res.json();
      if (data.lists) {
        setLists(data.lists);
        if (!newTaskListId && data.lists[0]?.id) {
          setNewTaskListId(data.lists[0].id);
        }
      }
      if (data.tasks) {
        setTasks(data.tasks);
      }
    } catch (err) {
      console.error("Failed to fetch PMS:", err);
    } finally {
      setLoading(false);
    }
  }, [newTaskListId]);

  useEffect(() => {
    loadPms();
  }, [loadPms]);

  const subtasksByParent = useMemo(() => {
    const map = new Map<string, PmsTask[]>();
    for (const t of tasks) {
      if (t.parent_task_id) {
        const arr = map.get(t.parent_task_id) || [];
        arr.push(t);
        map.set(t.parent_task_id, arr);
      }
    }
    return map;
  }, [tasks]);

  const filteredRootTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tasks.filter((t) => {
      if (t.parent_task_id) return false;
      if (selectedListId !== "ALL" && t.list_id !== selectedListId) return false;
      if (priorityFilter !== "ALL" && t.priority !== priorityFilter) return false;
      if (q) {
        const children = subtasksByParent.get(t.id) || [];
        const matchSelf =
          t.name.toLowerCase().includes(q) ||
          (t.markdown_description || "").toLowerCase().includes(q) ||
          (t.original_clickup_id || "").toLowerCase().includes(q) ||
          t.tags.some((tg) => tg.toLowerCase().includes(q));
        const matchChild = children.some((c) => c.name.toLowerCase().includes(q));
        if (!matchSelf && !matchChild) return false;
      }
      return true;
    });
  }, [tasks, selectedListId, priorityFilter, searchQuery, subtasksByParent]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const active = tasks.filter((t) => t.status_category === "active").length;
    const blocked = tasks.filter((t) => t.status_category === "blocked").length;
    const review = tasks.filter((t) => t.status_category === "review").length;
    const closed = tasks.filter((t) => t.status_category === "closed").length;
    const clickupSynced = tasks.filter((t) => !!t.original_clickup_id).length;
    const totalMins = tasks
      .filter((t) => t.status_category !== "closed")
      .reduce((acc, t) => acc + (t.time_estimate_minutes || 0), 0);
    return { total, active, blocked, review, closed, clickupSynced, totalMins };
  }, [tasks]);

  const moveTaskStatus = async (taskId: string, nextCategory: PmsStatusCategory) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status_category: nextCategory,
              is_closed: nextCategory === "closed",
            }
          : t
      )
    );
    await fetch("/api/pms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "move_status",
        task_id: taskId,
        status_category: nextCategory,
      }),
    });
  };

  const stepTaskColumn = (task: PmsTask, delta: -1 | 1) => {
    const idx = COLUMNS.findIndex((c) => c.key === task.status_category);
    const nextIdx = idx + delta;
    if (nextIdx >= 0 && nextIdx < COLUMNS.length) {
      moveTaskStatus(task.id, COLUMNS[nextIdx].key);
    }
  };

  const toggleChecklist = async (
    taskId: string,
    checklistId: string,
    current: boolean
  ) => {
    const nextVal = !current;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              checklists: t.checklists.map((cl) =>
                cl.id === checklistId ? { ...cl, is_completed: nextVal } : cl
              ),
            }
          : t
      )
    );
    await fetch("/api/pms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "toggle_checklist",
        checklist_id: checklistId,
        is_completed: nextVal,
      }),
    });
  };

  const addInlineChecklist = async (taskId: string) => {
    const label = (checklistDrafts[taskId] || "").trim();
    if (!label) return;
    setChecklistDrafts((p) => ({ ...p, [taskId]: "" }));
    const res = await fetch("/api/pms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "add_checklist",
        task_id: taskId,
        name: label,
      }),
    });
    const data = await res.json();
    if (data.checklist) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, checklists: [...t.checklists, data.checklist] }
            : t
        )
      );
    }
  };

  const addInlineSubtask = async (parentTask: PmsTask) => {
    const name = (subtaskDrafts[parentTask.id] || "").trim();
    if (!name) return;
    setSubtaskDrafts((p) => ({ ...p, [parentTask.id]: "" }));
    await fetch("/api/pms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create_task",
        name,
        list_id: parentTask.list_id,
        parent_task_id: parentTask.id,
        status_category: "unstarted",
        priority: parentTask.priority,
        time_estimate_minutes: 30,
        tags: ["subtask"],
      }),
    });
    await loadPms();
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;
    setSubmittingTask(true);
    try {
      await fetch("/api/pms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_task",
          name: newTaskName.trim(),
          markdown_description: newTaskDesc.trim(),
          list_id: newTaskListId || lists[0]?.id,
          status_category: newTaskCategory,
          priority: newTaskPriority,
          time_estimate_minutes: Number(newTaskEstimate) || 0,
          tags: newTaskTags
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          is_shared: newTaskShared,
          checklists: newTaskChecklists
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });
      setNewTaskName("");
      setNewTaskDesc("");
      setNewTaskChecklists("");
      setComposerOpen(false);
      await loadPms();
    } finally {
      setSubmittingTask(false);
    }
  };

  const deleteTask = async (taskId: string) => {
    setTasks((prev) =>
      prev.filter((t) => t.id !== taskId && t.parent_task_id !== taskId)
    );
    await fetch(`/api/pms?taskId=${encodeURIComponent(taskId)}`, {
      method: "DELETE",
    });
  };

  const runSampleClickUpImport = async () => {
    setIngesting(true);
    setIngestFeedback(null);
    try {
      const res = await fetch("/api/pms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ingest_clickup_payload",
          format: "sample",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      setIngestFeedback({
        type: "success",
        message: `Idempotent ClickUp Sync Complete: ${data.importedLists} Lists mapped, ${data.upsertedTasks} Tasks upserted (ON CONFLICT DO UPDATE), ${data.linkedSubtasks} Subtask hierarchies linked.`,
      });
      await loadPms();
    } catch (err: any) {
      setIngestFeedback({
        type: "error",
        message: err?.message || "Failed to simulate ClickUp import",
      });
    } finally {
      setIngesting(false);
    }
  };

  const runLiveTokenImport = async () => {
    if (!clickupToken.trim()) return;
    setIngesting(true);
    setIngestFeedback(null);
    try {
      const res = await fetch("/api/pms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ingest_clickup_token",
          apiToken: clickupToken.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ClickUp token sync failed");
      setIngestFeedback({
        type: "success",
        message: `Live ClickUp Workspace Synced: ${data.importedLists} Lists, ${data.upsertedTasks} Tasks & ${data.linkedSubtasks} Subtasks ingested cleanly.`,
      });
      await loadPms();
    } catch (err: any) {
      setIngestFeedback({
        type: "error",
        message: err?.message || "ClickUp token ingestion failed",
      });
    } finally {
      setIngesting(false);
    }
  };

  const runPayloadImport = async () => {
    if (!rawExportText.trim()) return;
    setIngesting(true);
    setIngestFeedback(null);
    try {
      const res = await fetch("/api/pms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ingest_clickup_payload",
          format: exportFormat,
          rawPayload: rawExportText,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payload ingestion failed");
      setIngestFeedback({
        type: "success",
        message: `Export Ingested (${exportFormat.toUpperCase()}): ${data.importedLists} Lists, ${data.upsertedTasks} Tasks upserted, ${data.linkedSubtasks} Subtasks linked.`,
      });
      await loadPms();
    } catch (err: any) {
      setIngestFeedback({
        type: "error",
        message: err?.message || "Failed to parse ClickUp export",
      });
    } finally {
      setIngesting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.name.toLowerCase().endsWith(".csv")) {
      setExportFormat("csv");
    } else {
      setExportFormat("json");
    }
    const reader = new FileReader();
    reader.onload = () => {
      setRawExportText(String(reader.result || ""));
    };
    reader.readAsText(file);
  };

  const renderTaskCard = (task: PmsTask) => {
    const subtasks = subtasksByParent.get(task.id) || [];
    const doneSubtasks = subtasks.filter((s) => s.status_category === "closed").length;
    const doneChecks = task.checklists.filter((c) => c.is_completed).length;
    const isExpanded = Boolean(expandedTaskIds[task.id]);
    const colIndex = COLUMNS.findIndex((c) => c.key === task.status_category);

    return (
      <div
        key={task.id}
        className="rounded-xl border border-white/[0.08] bg-[#0e121b]/95 p-3.5 shadow-lg hover:border-white/20 transition-all space-y-2.5"
      >
        {/* Top Metadata Row */}
        <div className="flex items-center justify-between gap-1.5 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`px-2 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wider border ${
                PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.normal
              }`}
            >
              {task.priority}
            </span>
            {task.original_clickup_id && (
              <span
                title={`Idempotent ClickUp Key: ${task.original_clickup_id}`}
                className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
              >
                CU:{task.original_clickup_id.slice(0, 11)}
              </span>
            )}
            {task.is_shared && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Share2 size={9} /> POD
              </span>
            )}
          </div>

          <button
            onClick={() => deleteTask(task.id)}
            title="Delete Sovereign Task"
            className="text-zinc-600 hover:text-rose-400 transition-colors p-0.5"
          >
            <Trash2 size={12} />
          </button>
        </div>

        {/* Title & List Breadcrumb */}
        <div>
          <div className="text-[10px] text-zinc-500 font-medium truncate">
            {task.space_name} • {task.list_name}
          </div>
          <h4 className="text-xs font-semibold text-zinc-100 leading-snug mt-0.5">
            {task.name}
          </h4>
          {task.markdown_description && (
            <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
              {task.markdown_description}
            </p>
          )}
        </div>

        {/* Tags & Time Estimate */}
        <div className="flex items-center justify-between gap-2 flex-wrap text-[10px]">
          <div className="flex items-center gap-1 flex-wrap">
            {task.tags.slice(0, 3).map((tg) => (
              <span
                key={tg}
                className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.07] text-zinc-300 flex items-center gap-1"
              >
                <Tag size={8} className="text-zinc-500" />
                {tg}
              </span>
            ))}
          </div>
          <span className="text-zinc-400 font-mono flex items-center gap-1">
            <Clock size={10} className="text-blue-400" />
            {formatEstimate(task.time_estimate_minutes)}
          </span>
        </div>

        {/* Subtask & Checklist Summary Toggle */}
        <div className="pt-1 border-t border-white/[0.06] flex items-center justify-between gap-2">
          <button
            onClick={() =>
              setExpandedTaskIds((p) => ({ ...p, [task.id]: !p[task.id] }))
            }
            className="flex items-center gap-2 text-[10.5px] text-zinc-300 hover:text-white transition-colors"
          >
            {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            <span className="flex items-center gap-1">
              <GitBranch size={11} className="text-blue-400" />
              {doneSubtasks}/{subtasks.length} Subtasks
            </span>
            <span className="text-zinc-600">•</span>
            <span className="flex items-center gap-1">
              <CheckSquare size={11} className="text-emerald-400" />
              {doneChecks}/{task.checklists.length} Checks
            </span>
          </button>

          {/* Status Quick-Mover */}
          <div className="flex items-center gap-1">
            <button
              disabled={colIndex <= 0}
              onClick={() => stepTaskColumn(task, -1)}
              title="Move Left"
              className="p-1 rounded bg-white/[0.05] hover:bg-white/[0.12] disabled:opacity-25 text-zinc-300"
            >
              <ArrowLeft size={11} />
            </button>
            <button
              disabled={colIndex >= COLUMNS.length - 1}
              onClick={() => stepTaskColumn(task, 1)}
              title="Advance Gate"
              className="p-1 rounded bg-white/[0.05] hover:bg-white/[0.12] disabled:opacity-25 text-zinc-300"
            >
              <ArrowRight size={11} />
            </button>
          </div>
        </div>

        {/* Expanded Subtask Tree & Checklists */}
        {isExpanded && (
          <div className="pt-2 border-t border-white/[0.07] space-y-3 bg-black/30 -mx-3.5 -mb-3.5 p-3 rounded-b-xl">
            {/* Checklists */}
            <div className="space-y-1.5">
              <div className="text-[9.5px] font-bold uppercase tracking-wider text-zinc-400">
                Verification Checklists
              </div>
              {task.checklists.map((cl) => (
                <button
                  key={cl.id}
                  onClick={() => toggleChecklist(task.id, cl.id, cl.is_completed)}
                  className="w-full flex items-center gap-2 text-left text-[11px] py-0.5 hover:text-white transition-colors"
                >
                  {cl.is_completed ? (
                    <CheckSquare size={13} className="text-emerald-400 shrink-0" />
                  ) : (
                    <Square size={13} className="text-zinc-500 shrink-0" />
                  )}
                  <span
                    className={
                      cl.is_completed ? "line-through text-zinc-500" : "text-zinc-200"
                    }
                  >
                    {cl.name}
                  </span>
                </button>
              ))}
              <div className="flex items-center gap-1.5 pt-1">
                <input
                  value={checklistDrafts[task.id] || ""}
                  onChange={(e) =>
                    setChecklistDrafts((p) => ({ ...p, [task.id]: e.target.value }))
                  }
                  onKeyDown={(e) => e.key === "Enter" && addInlineChecklist(task.id)}
                  placeholder="+ Add checklist step..."
                  className="flex-1 bg-white/[0.04] border border-white/10 rounded px-2 py-1 text-[10.5px] text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500/50"
                />
                <button
                  onClick={() => addInlineChecklist(task.id)}
                  className="px-2 py-1 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Subtask Hierarchy */}
            <div className="space-y-1.5 pt-1 border-t border-white/[0.06]">
              <div className="text-[9.5px] font-bold uppercase tracking-wider text-zinc-400">
                Subtask Tree ({subtasks.length})
              </div>
              {subtasks.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between gap-2 bg-white/[0.03] border border-white/[0.06] rounded-lg px-2 py-1.5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          sub.status_category === "closed"
                            ? "bg-emerald-400"
                            : sub.status_category === "active"
                            ? "bg-amber-400"
                            : "bg-blue-400"
                        }`}
                      />
                      <span
                        className={`text-[11px] truncate ${
                          sub.status_category === "closed"
                            ? "line-through text-zinc-500"
                            : "text-zinc-200"
                        }`}
                      >
                        {sub.name}
                      </span>
                    </div>
                  </div>
                  <select
                    value={sub.status_category}
                    onChange={(e) =>
                      moveTaskStatus(sub.id, e.target.value as PmsStatusCategory)
                    }
                    className="bg-[#090b11] border border-white/10 rounded px-1.5 py-0.5 text-[9.5px] text-zinc-300"
                  >
                    {COLUMNS.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.key}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
              <div className="flex items-center gap-1.5 pt-1">
                <input
                  value={subtaskDrafts[task.id] || ""}
                  onChange={(e) =>
                    setSubtaskDrafts((p) => ({ ...p, [task.id]: e.target.value }))
                  }
                  onKeyDown={(e) => e.key === "Enter" && addInlineSubtask(task)}
                  placeholder="+ Spawn child subtask..."
                  className="flex-1 bg-white/[0.04] border border-white/10 rounded px-2 py-1 text-[10.5px] text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500/50"
                />
                <button
                  onClick={() => addInlineSubtask(task)}
                  className="px-2 py-1 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 text-[10px] font-semibold"
                >
                  Spawn
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <ExecutiveModuleShell
      moduleId="PMS"
      eyebrow="Section 12 • Sovereign Execution"
      title="Sovereign PMS & ClickUp Ingestion Engine"
      subtitle="Zero-SaaS Dependency PostgreSQL Task Ledger, Subtask Trees & Idempotent ClickUp Migrator"
      accentColor="#3b82f6"
      headerActions={
        <>
          <button
            onClick={() => {
              setIngestFeedback(null);
              setIngestOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-400/30 text-indigo-200 text-xs font-semibold flex items-center gap-2 transition-all"
          >
            <CloudDownload size={14} />
            ClickUp Ingestion Engine
          </button>
          <button
            onClick={() => setComposerOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
          >
            <Plus size={14} />
            New Sovereign Task
          </button>
        </>
      }
    >
      {/* Executive Telemetry Strip */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          {
            label: "Total Sovereign Tasks",
            value: stats.total,
            sub: `${lists.length} Active Lists`,
            color: "text-blue-400",
          },
          {
            label: "Active Execution",
            value: stats.active,
            sub: "In-Flight Deep Work",
            color: "text-amber-400",
          },
          {
            label: "Dependency Hold",
            value: stats.blocked,
            sub: "Blocked / External",
            color: "text-rose-400",
          },
          {
            label: "Verification Gate",
            value: stats.review,
            sub: "Pending QA Sign-off",
            color: "text-purple-400",
          },
          {
            label: "Remaining Effort",
            value: formatEstimate(stats.totalMins),
            sub: "Open Queue Budget",
            color: "text-cyan-400",
          },
          {
            label: "ClickUp Migrated",
            value: stats.clickupSynced,
            sub: "Idempotent Key Locked",
            color: "text-emerald-400",
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 backdrop-blur-md"
          >
            <div className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
              {kpi.label}
            </div>
            <div className={`text-2xl font-bold mt-1 font-mono ${kpi.color}`}>
              {kpi.value}
            </div>
            <div className="text-[10.5px] text-zinc-500 mt-0.5">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Filter & View Switcher Toolbar */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl bg-black/40 p-1 border border-white/10">
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === "kanban"
                  ? "bg-blue-600 text-white shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Columns3 size={13} /> 6-Column Kanban
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === "list"
                  ? "bg-blue-600 text-white shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <ListTree size={13} /> Hierarchical List
            </button>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setSelectedListId("ALL")}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                selectedListId === "ALL"
                  ? "bg-white/10 border-white/25 text-white"
                  : "bg-white/[0.02] border-white/[0.07] text-zinc-400 hover:text-white"
              }`}
            >
              All Spaces ({lists.length})
            </button>
            {lists.map((lst) => (
              <button
                key={lst.id}
                onClick={() => setSelectedListId(lst.id)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all ${
                  selectedListId === lst.id
                    ? "bg-blue-500/20 border-blue-400/40 text-blue-200"
                    : "bg-white/[0.02] border-white/[0.07] text-zinc-400 hover:text-white"
                }`}
              >
                {lst.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks, tags, cu_id..."
              className="pl-8 pr-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500/50 w-52"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5">
            <Filter size={12} className="text-zinc-400" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-transparent text-xs text-zinc-200 focus:outline-none"
            >
              <option value="ALL" className="bg-[#090b11]">
                All Priorities
              </option>
              <option value="urgent" className="bg-[#090b11]">
                Urgent Only
              </option>
              <option value="high" className="bg-[#090b11]">
                High Priority
              </option>
              <option value="normal" className="bg-[#090b11]">
                Normal
              </option>
              <option value="low" className="bg-[#090b11]">
                Low
              </option>
            </select>
          </div>

          <button
            onClick={loadPms}
            title="Refresh PostgreSQL Ledger"
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-zinc-300"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading && tasks.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-400">
          <Loader2 size={28} className="animate-spin text-blue-400" />
          <span className="text-xs tracking-widest uppercase">
            Hydrating Sovereign PMS from Supabase PostgreSQL...
          </span>
        </div>
      ) : viewMode === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3.5 items-start">
          {COLUMNS.map((col) => {
            const colTasks = filteredRootTasks.filter(
              (t) => t.status_category === col.key
            );
            return (
              <div
                key={col.key}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3 flex flex-col gap-3 min-h-[540px]"
              >
                <div className="pb-2.5 border-b border-white/[0.07] flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: col.accent }}
                      />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-100">
                        {col.title}
                      </h3>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      {col.subtitle}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${col.badgeBg}`}
                  >
                    {colTasks.length}
                  </span>
                </div>

                <div className="flex flex-col gap-2.5">
                  {colTasks.length === 0 ? (
                    <div className="py-10 text-center text-[11px] text-zinc-600 border border-dashed border-white/[0.06] rounded-xl">
                      Zero tasks in gate
                    </div>
                  ) : (
                    colTasks.map((t) => renderTaskCard(t))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Hierarchical List View */
        <div className="space-y-4">
          {COLUMNS.map((col) => {
            const colTasks = filteredRootTasks.filter(
              (t) => t.status_category === col.key
            );
            if (colTasks.length === 0) return null;
            return (
              <div
                key={col.key}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden"
              >
                <div className="px-4 py-3 bg-white/[0.03] border-b border-white/[0.07] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: col.accent }}
                    />
                    <span className="text-xs font-bold uppercase tracking-wider text-white">
                      {col.title}
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      — {col.subtitle}
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${col.badgeBg}`}
                  >
                    {colTasks.length} Root Tasks
                  </span>
                </div>

                <div className="divide-y divide-white/[0.06]">
                  {colTasks.map((task) => {
                    const subs = subtasksByParent.get(task.id) || [];
                    const expanded = Boolean(expandedTaskIds[task.id]);
                    return (
                      <div key={task.id} className="p-4 hover:bg-white/[0.015]">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <button
                              onClick={() =>
                                setExpandedTaskIds((p) => ({
                                  ...p,
                                  [task.id]: !p[task.id],
                                }))
                              }
                              className="p-1 rounded hover:bg-white/10 text-zinc-400"
                            >
                              {expanded ? (
                                <ChevronDown size={15} />
                              ) : (
                                <ChevronRight size={15} />
                              )}
                            </button>
                            <span
                              className={`px-2 py-0.5 rounded text-[9.5px] font-bold uppercase border ${
                                PRIORITY_STYLES[task.priority] ||
                                PRIORITY_STYLES.normal
                              }`}
                            >
                              {task.priority}
                            </span>
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-zinc-100 truncate">
                                {task.name}
                              </div>
                              <div className="text-[11px] text-zinc-500 flex items-center gap-2 flex-wrap">
                                <span>
                                  {task.space_name} / {task.list_name}
                                </span>
                                {task.original_clickup_id && (
                                  <span className="font-mono text-indigo-300">
                                    • {task.original_clickup_id}
                                  </span>
                                )}
                                <span>• {subs.length} subtasks</span>
                                <span>
                                  • {task.checklists.filter((c) => c.is_completed).length}/
                                  {task.checklists.length} checks
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <span className="text-xs font-mono text-zinc-400">
                              {formatEstimate(task.time_estimate_minutes)}
                            </span>
                            <select
                              value={task.status_category}
                              onChange={(e) =>
                                moveTaskStatus(
                                  task.id,
                                  e.target.value as PmsStatusCategory
                                )
                              }
                              className="bg-[#0d111a] border border-white/15 rounded-lg px-2.5 py-1 text-xs text-zinc-200"
                            >
                              {COLUMNS.map((c) => (
                                <option key={c.key} value={c.key}>
                                  {c.title}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {expanded && (
                          <div className="mt-3 pl-9 space-y-2">
                            {subs.map((s) => (
                              <div
                                key={s.id}
                                className="flex items-center justify-between bg-black/30 border border-white/[0.06] rounded-xl px-3 py-2 text-xs"
                              >
                                <div className="flex items-center gap-2">
                                  <GitBranch size={12} className="text-blue-400" />
                                  <span className="text-zinc-200">{s.name}</span>
                                  {s.original_clickup_id && (
                                    <span className="text-[10px] font-mono text-indigo-400">
                                      ({s.original_clickup_id})
                                    </span>
                                  )}
                                </div>
                                <select
                                  value={s.status_category}
                                  onChange={(e) =>
                                    moveTaskStatus(
                                      s.id,
                                      e.target.value as PmsStatusCategory
                                    )
                                  }
                                  className="bg-[#090b11] border border-white/10 rounded px-2 py-0.5 text-[11px] text-zinc-300"
                                >
                                  {COLUMNS.map((c) => (
                                    <option key={c.key} value={c.key}>
                                      {c.title}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Task Composer Modal */}
      {composerOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-2xl border border-white/15 bg-[#0c1018] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <FolderKanban size={18} className="text-blue-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                  Create Sovereign PMS Task
                </h2>
              </div>
              <button
                onClick={() => setComposerOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3.5">
              <div>
                <label className="text-[11px] text-zinc-400 font-semibold block mb-1">
                  Task Title
                </label>
                <input
                  required
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  placeholder="e.g., Harden Supabase pgQuery Connection Pooler"
                  className="w-full rounded-xl bg-black/50 border border-white/10 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-zinc-400 font-semibold block mb-1">
                    Target List
                  </label>
                  <select
                    value={newTaskListId}
                    onChange={(e) => setNewTaskListId(e.target.value)}
                    className="w-full rounded-xl bg-black/50 border border-white/10 px-3 py-2 text-xs text-white"
                  >
                    {lists.map((l) => (
                      <option key={l.id} value={l.id} className="bg-[#0c1018]">
                        {l.space_name} — {l.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-zinc-400 font-semibold block mb-1">
                    Initial Gate Column
                  </label>
                  <select
                    value={newTaskCategory}
                    onChange={(e) =>
                      setNewTaskCategory(e.target.value as PmsStatusCategory)
                    }
                    className="w-full rounded-xl bg-black/50 border border-white/10 px-3 py-2 text-xs text-white"
                  >
                    {COLUMNS.map((c) => (
                      <option key={c.key} value={c.key} className="bg-[#0c1018]">
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-zinc-400 font-semibold block mb-1">
                    Priority
                  </label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value)}
                    className="w-full rounded-xl bg-black/50 border border-white/10 px-3 py-2 text-xs text-white"
                  >
                    <option value="urgent" className="bg-[#0c1018]">
                      Urgent
                    </option>
                    <option value="high" className="bg-[#0c1018]">
                      High
                    </option>
                    <option value="normal" className="bg-[#0c1018]">
                      Normal
                    </option>
                    <option value="low" className="bg-[#0c1018]">
                      Low
                    </option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-zinc-400 font-semibold block mb-1">
                    Estimate (Minutes)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newTaskEstimate}
                    onChange={(e) => setNewTaskEstimate(e.target.value)}
                    className="w-full rounded-xl bg-black/50 border border-white/10 px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-zinc-400 font-semibold block mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    value={newTaskTags}
                    onChange={(e) => setNewTaskTags(e.target.value)}
                    className="w-full rounded-xl bg-black/50 border border-white/10 px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 font-semibold block mb-1">
                  Markdown Operational Spec
                </label>
                <textarea
                  rows={2}
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  placeholder="Acceptance criteria, architectural context..."
                  className="w-full rounded-xl bg-black/50 border border-white/10 px-3.5 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 font-semibold block mb-1">
                  Checklist Items (one per line)
                </label>
                <textarea
                  rows={3}
                  value={newTaskChecklists}
                  onChange={(e) => setNewTaskChecklists(e.target.value)}
                  placeholder={"Verify PostgreSQL constraint\nRun verification test"}
                  className="w-full rounded-xl bg-black/50 border border-white/10 px-3.5 py-2 text-xs text-white font-mono"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newTaskShared}
                  onChange={(e) => setNewTaskShared(e.target.checked)}
                  className="rounded border-white/20"
                />
                Expose task to Shared Pod Collective (`is_shared = true`)
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setComposerOpen(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-xs text-zinc-300 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTask}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white flex items-center gap-2"
                >
                  {submittingTask && <Loader2 size={13} className="animate-spin" />}
                  Commit to Sovereign PMS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* One-Click ClickUp Ingestion Modal */}
      {ingestOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-indigo-500/30 bg-[#0b0f19] p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Database size={18} className="text-indigo-400" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                    Automated ClickUp Ingestion & Sovereign Cutover Engine
                  </h2>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Idempotent <code className="text-indigo-300">ON CONFLICT (original_clickup_id) DO UPDATE</code> pipeline — safely re-runnable with zero duplicate rows.
                </p>
              </div>
              <button
                onClick={() => setIngestOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Instant Zero-Credential Simulation Card */}
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.07] p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <Sparkles size={14} /> Zero-Credential Instant Verification
                </div>
                <p className="text-[11px] text-zinc-300 mt-0.5">
                  Simulate importing a multi-space ClickUp Workspace (Spaces → Lists → Tasks → Subtasks + Checklists) with status translation.
                </p>
              </div>
              <button
                onClick={runSampleClickUpImport}
                disabled={ingesting}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shrink-0 shadow-lg shadow-emerald-600/20"
              >
                {ingesting ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Sparkles size={13} />
                )}
                Simulate Sample ClickUp Workspace Import
              </button>
            </div>

            {/* Mode Tabs */}
            <div className="flex gap-2 border-b border-white/10 pb-2">
              <button
                onClick={() => setIngestTab("token")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  ingestTab === "token"
                    ? "bg-indigo-600 text-white"
                    : "text-zinc-400 hover:text-white bg-white/[0.03]"
                }`}
              >
                1. ClickUp Personal API Token (pk_...)
              </button>
              <button
                onClick={() => setIngestTab("export")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  ingestTab === "export"
                    ? "bg-indigo-600 text-white"
                    : "text-zinc-400 hover:text-white bg-white/[0.03]"
                }`}
              >
                2. JSON / CSV Export Upload
              </button>
            </div>

            {ingestTab === "token" ? (
              <div className="space-y-3.5">
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.07] p-3 text-[11px] text-zinc-300 space-y-1">
                  <div className="font-semibold text-indigo-300 flex items-center gap-1.5">
                    <Layers size={12} /> Traversal & Intelligent Status Mapping:
                  </div>
                  <p className="text-zinc-400">
                    Fetches <code className="text-zinc-200">/api/v2/team → space → folder/list → task?subtasks=true&include_closed=true</code> and maps custom statuses into <code className="text-zinc-200">open | unstarted | active | blocked | review | closed</code>.
                  </p>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                    ClickUp Personal API Token
                  </label>
                  <input
                    type="password"
                    value={clickupToken}
                    onChange={(e) => setClickupToken(e.target.value)}
                    placeholder="pk_84920194_XXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                    className="w-full rounded-xl bg-black/50 border border-white/15 px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  onClick={runLiveTokenImport}
                  disabled={ingesting || !clickupToken.trim()}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold flex items-center justify-center gap-2"
                >
                  {ingesting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <CloudDownload size={14} />
                  )}
                  Execute Live ClickUp API Ingestion
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="inline-flex rounded-lg bg-black/40 p-1 border border-white/10">
                    <button
                      onClick={() => setExportFormat("json")}
                      className={`px-3 py-1 rounded text-xs font-semibold ${
                        exportFormat === "json"
                          ? "bg-indigo-600 text-white"
                          : "text-zinc-400"
                      }`}
                    >
                      ClickUp JSON
                    </button>
                    <button
                      onClick={() => setExportFormat("csv")}
                      className={`px-3 py-1 rounded text-xs font-semibold ${
                        exportFormat === "csv"
                          ? "bg-indigo-600 text-white"
                          : "text-zinc-400"
                      }`}
                    >
                      ClickUp CSV
                    </button>
                  </div>

                  <label className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs text-zinc-200 cursor-pointer flex items-center gap-1.5">
                    <Upload size={13} /> Upload .json / .csv File
                    <input
                      type="file"
                      accept=".json,.csv,text/csv,application/json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <textarea
                  rows={6}
                  value={rawExportText}
                  onChange={(e) => setRawExportText(e.target.value)}
                  placeholder={
                    exportFormat === "json"
                      ? '[{"id":"868a991","name":"Migrate Auth","status":"in progress","priority":"high","list_name":"Sprint 12"}]'
                      : "Task ID,Task Name,Status,Priority,List Name,Space Name\n868a991,Migrate Auth,in progress,high,Sprint 12,Engineering"
                  }
                  className="w-full rounded-xl bg-black/50 border border-white/15 p-3 text-xs font-mono text-zinc-200 focus:outline-none focus:border-indigo-500"
                />

                <button
                  onClick={runPayloadImport}
                  disabled={ingesting || !rawExportText.trim()}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold flex items-center justify-center gap-2"
                >
                  {ingesting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <FileJson size={14} />
                  )}
                  Ingest & Upsert Export Payload
                </button>
              </div>
            )}

            {ingestFeedback && (
              <div
                className={`rounded-xl p-3.5 border text-xs flex items-start gap-2.5 ${
                  ingestFeedback.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-200"
                }`}
              >
                {ingestFeedback.type === "success" ? (
                  <ShieldCheck size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertOctagon size={16} className="text-rose-400 shrink-0 mt-0.5" />
                )}
                <span>{ingestFeedback.message}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </ExecutiveModuleShell>
  );
}
