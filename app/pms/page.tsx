"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Filter,
  Columns3,
  List as ListIcon,
  LayoutDashboard,
  Calendar,
  Layers,
  ChevronRight,
  ChevronLeft,
  Clock,
  Flag,
  CheckCircle2,
  AlertCircle,
  Folder,
  CheckSquare,
  Sparkles,
  Loader2,
  Trash2,
  ArrowRight,
  TrendingUp,
  BarChart3,
  CalendarDays,
  Network,
} from "lucide-react";
import {
  PmsSpaceDTO,
  PmsFolderDTO,
  PmsListDTO,
  PmsStatusDTO,
  PmsTaskDTO,
} from "@/app/api/pms/route";
import { PmsSidebarRail } from "@/components/pms/PmsSidebarRail";
import { PmsHierarchySidebar } from "@/components/pms/PmsHierarchySidebar";
import { TaskDetailModal } from "@/components/pms/TaskDetailModal";
import { NewSpaceModal } from "@/components/pms/NewSpaceModal";

type ViewMode = "board" | "list" | "overview";

export default function SovereignPmsPage() {
  // Navigation & Data States
  const [spaces, setSpaces] = useState<PmsSpaceDTO[]>([]);
  const [statuses, setStatuses] = useState<PmsStatusDTO[]>([]);
  const [tasks, setTasks] = useState<PmsTaskDTO[]>([]);
  const [loading, setLoading] = useState(true);

  // Hierarchy Selection
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);

  // Rail & View States
  const [activeRailSection, setActiveRailSection] = useState("dashboards");
  const [viewMode, setViewMode] = useState<ViewMode>("board");
  const [showAddViewMenu, setShowAddViewMenu] = useState(false);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  // Modals
  const [isNewSpaceModalOpen, setIsNewSpaceModalOpen] = useState(false);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<PmsTaskDTO | null>(null);

  // Quick Inline Add Task in Board
  const [inlineTaskNameByStatus, setInlineTaskNameByStatus] = useState<Record<string, string>>({});
  const [addingTaskForStatusId, setAddingTaskForStatusId] = useState<string | null>(null);

  // Fetch Full PMS Hierarchy
  const loadPmsData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/pms", { cache: "no-store" });
      const data = await res.json();
      if (data.spaces) {
        setSpaces(data.spaces);
        // Default to first space if none selected
        if (!selectedSpaceId && data.spaces.length > 0) {
          setSelectedSpaceId(data.spaces[0].id);
        }
      }
      if (data.statuses) {
        setStatuses(data.statuses);
      }
      if (data.tasks) {
        setTasks(data.tasks);
      }
    } catch (err) {
      console.error("Failed to fetch PMS:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedSpaceId]);

  useEffect(() => {
    loadPmsData();
  }, [loadPmsData]);

  // Selected Scope Details
  const currentSpace = useMemo(
    () => spaces.find((s) => s.id === selectedSpaceId) || spaces[0] || null,
    [spaces, selectedSpaceId]
  );

  const currentFolder = useMemo(() => {
    if (!currentSpace || !selectedFolderId) return null;
    return currentSpace.folders.find((f) => f.id === selectedFolderId) || null;
  }, [currentSpace, selectedFolderId]);

  const currentList = useMemo(() => {
    if (!currentSpace || !selectedListId) return null;
    const direct = currentSpace.lists.find((l) => l.id === selectedListId);
    if (direct) return direct;
    for (const f of currentSpace.folders) {
      const match = f.lists.find((l) => l.id === selectedListId);
      if (match) return match;
    }
    return null;
  }, [currentSpace, selectedListId]);

  // Filter Statuses for Current Space
  const currentSpaceStatuses = useMemo(() => {
    if (!currentSpace) return [];
    const spaceStatuses = statuses.filter((st) => st.space_id === currentSpace.id);
    if (spaceStatuses.length > 0) return spaceStatuses;
    // Fallback default set if empty
    return [
      { id: "s1", space_id: currentSpace.id, name: "NOT STARTED", category: "not_started" as const, color_hex: "#64748B", sort_order: 0 },
      { id: "s2", space_id: currentSpace.id, name: "TO DO", category: "not_started" as const, color_hex: "#3B82F6", sort_order: 1 },
      { id: "s3", space_id: currentSpace.id, name: "IN PROGRESS", category: "active" as const, color_hex: "#F59E0B", sort_order: 2 },
      { id: "s4", space_id: currentSpace.id, name: "REVIEW", category: "active" as const, color_hex: "#A855F7", sort_order: 3 },
      { id: "s5", space_id: currentSpace.id, name: "COMPLETE", category: "closed" as const, color_hex: "#10B981", sort_order: 4 },
    ];
  }, [currentSpace, statuses]);

  // Filter Tasks by Active Scope & Filters
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Scope filter
      if (selectedListId && t.list_id !== selectedListId) return false;
      if (selectedFolderId && !selectedListId && t.folder_id !== selectedFolderId) return false;
      if (selectedSpaceId && !selectedFolderId && !selectedListId && t.space_id !== selectedSpaceId) {
        return false;
      }

      // Priority filter
      if (priorityFilter !== "ALL" && t.priority !== priorityFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.name.toLowerCase().includes(q);
        const matchDesc = (t.description || "").toLowerCase().includes(q);
        const matchTags = t.tags.some((tg) => tg.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchTags) return false;
      }

      return true;
    });
  }, [tasks, selectedSpaceId, selectedFolderId, selectedListId, priorityFilter, searchQuery]);

  // Actions
  const handleSelectSpace = (spaceId: string) => {
    setSelectedSpaceId(spaceId);
    setSelectedFolderId(null);
    setSelectedListId(null);
  };

  const handleSelectFolder = (spaceId: string, folderId: string) => {
    setSelectedSpaceId(spaceId);
    setSelectedFolderId(folderId);
    setSelectedListId(null);
  };

  const handleSelectList = (spaceId: string, folderId: string | null, listId: string) => {
    setSelectedSpaceId(spaceId);
    setSelectedFolderId(folderId);
    setSelectedListId(listId);
  };

  const handleCreateSpace = async (name: string, colorHex: string, icon: string) => {
    const res = await fetch("/api/pms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create_space", name, color_hex: colorHex, icon }),
    });
    if (res.ok) {
      await loadPmsData();
    }
  };

  const handleCreateFolder = async (spaceId: string, name: string) => {
    const res = await fetch("/api/pms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create_folder", space_id: spaceId, name }),
    });
    if (res.ok) {
      await loadPmsData();
    }
  };

  const handleCreateList = async (spaceId: string, folderId: string | null, name: string) => {
    const res = await fetch("/api/pms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create_list", space_id: spaceId, folder_id: folderId, name }),
    });
    if (res.ok) {
      await loadPmsData();
    }
  };

  const handleCreateTaskInline = async (statusId: string) => {
    const title = (inlineTaskNameByStatus[statusId] || "").trim();
    if (!title || !currentSpace) return;

    // Pick target list
    let targetListId = selectedListId;
    if (!targetListId) {
      if (currentFolder && currentFolder.lists.length > 0) {
        targetListId = currentFolder.lists[0].id;
      } else if (currentSpace.lists.length > 0) {
        targetListId = currentSpace.lists[0].id;
      } else if (currentSpace.folders.length > 0 && currentSpace.folders[0].lists.length > 0) {
        targetListId = currentSpace.folders[0].lists[0].id;
      }
    }

    if (!targetListId) return;

    const res = await fetch("/api/pms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create_task",
        name: title,
        list_id: targetListId,
        status_id: statusId,
        priority: "normal",
      }),
    });

    if (res.ok) {
      setInlineTaskNameByStatus((prev) => ({ ...prev, [statusId]: "" }));
      setAddingTaskForStatusId(null);
      await loadPmsData();
    }
  };

  const handleMoveStatus = async (taskId: string, targetStatusId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const st = statuses.find((s) => s.id === targetStatusId);
          return {
            ...t,
            status_id: targetStatusId,
            status_name: st?.name || t.status_name,
            status_color: st?.color_hex || t.status_color,
            status_category: st?.category || t.status_category,
          };
        }
        return t;
      })
    );

    await fetch("/api/pms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "move_status", task_id: taskId, status_id: targetStatusId }),
    });
  };

  const handleStepStatus = (task: PmsTaskDTO, direction: -1 | 1) => {
    const curIdx = currentSpaceStatuses.findIndex((s) => s.id === task.status_id);
    if (curIdx === -1) return;
    const nextIdx = curIdx + direction;
    if (nextIdx >= 0 && nextIdx < currentSpaceStatuses.length) {
      handleMoveStatus(task.id, currentSpaceStatuses[nextIdx].id);
    }
  };

  const handleUpdateTask = async (taskId: string, patch: Partial<PmsTaskDTO>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t))
    );
    if (selectedTaskForDetail?.id === taskId) {
      setSelectedTaskForDetail((prev) => (prev ? { ...prev, ...patch } : null));
    }

    await fetch("/api/pms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_task", task_id: taskId, ...patch }),
    });
  };

  const handleToggleChecklist = async (taskId: string, checklistId: string, current: boolean) => {
    const nextVal = !current;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            checklists: t.checklists.map((c) =>
              c.id === checklistId ? { ...c, is_completed: nextVal } : c
            ),
          };
        }
        return t;
      })
    );

    if (selectedTaskForDetail?.id === taskId) {
      setSelectedTaskForDetail((prev) =>
        prev
          ? {
              ...prev,
              checklists: prev.checklists.map((c) =>
                c.id === checklistId ? { ...c, is_completed: nextVal } : c
              ),
            }
          : null
      );
    }

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

  const handleAddChecklist = async (taskId: string, name: string) => {
    const res = await fetch("/api/pms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add_checklist", task_id: taskId, name }),
    });
    const data = await res.json();
    if (data.checklist) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, checklists: [...t.checklists, data.checklist] } : t
        )
      );
      if (selectedTaskForDetail?.id === taskId) {
        setSelectedTaskForDetail((prev) =>
          prev ? { ...prev, checklists: [...prev.checklists, data.checklist] } : null
        );
      }
    }
  };

  const handleAddComment = async (taskId: string, content: string) => {
    const res = await fetch("/api/pms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add_comment", task_id: taskId, content }),
    });
    const data = await res.json();
    if (data.comment) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, comments: [...t.comments, data.comment] } : t
        )
      );
      if (selectedTaskForDetail?.id === taskId) {
        setSelectedTaskForDetail((prev) =>
          prev ? { ...prev, comments: [...prev.comments, data.comment] } : null
        );
      }
    }
  };

  const handleAddDependency = async (dependentTaskId: string, prereqTaskId: string, type: string) => {
    const res = await fetch("/api/pms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "add_dependency",
        dependent_task_id: dependentTaskId,
        prerequisite_task_id: prereqTaskId,
        type,
      }),
    });
    const data = await res.json();
    if (data.dependency) {
      await loadPmsData();
    }
  };

  const handleAddSubtask = async (parentTaskId: string, listId: string, name: string) => {
    await fetch("/api/pms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create_task",
        parent_task_id: parentTaskId,
        list_id: listId,
        name,
      }),
    });
    await loadPmsData();
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (selectedTaskForDetail?.id === taskId) {
      setSelectedTaskForDetail(null);
    }
    await fetch(`/api/pms?taskId=${encodeURIComponent(taskId)}`, { method: "DELETE" });
  };

  // Breadcrumb Label
  const breadcrumb = useMemo(() => {
    const parts = [currentSpace?.name || "Workspace"];
    if (currentFolder) parts.push(currentFolder.name);
    if (currentList) parts.push(currentList.name);
    return parts;
  }, [currentSpace, currentFolder, currentList]);

  // Overview Stats
  const overviewStats = useMemo(() => {
    const total = filteredTasks.length;
    const completed = filteredTasks.filter((t) => t.status_category === "closed").length;
    const active = filteredTasks.filter((t) => t.status_category === "active").length;
    const totalEstHours = Math.round(
      filteredTasks.reduce((acc, t) => acc + (t.time_estimate_minutes || 0), 0) / 60
    );
    const totalChecklists = filteredTasks.reduce((acc, t) => acc + t.checklists.length, 0);
    const completedChecklists = filteredTasks.reduce(
      (acc, t) => acc + t.checklists.filter((c) => c.is_completed).length,
      0
    );
    return { total, completed, active, totalEstHours, totalChecklists, completedChecklists };
  }, [filteredTasks]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#090A0F] font-sans text-zinc-100 select-none">
      {/* 1. Left Icon Rail (56px) */}
      <PmsSidebarRail
        activeSection={activeRailSection}
        onSelectSection={setActiveRailSection}
      />

      {/* 2. Space Hierarchy Sidebar (240px) */}
      <PmsHierarchySidebar
        spaces={spaces}
        selectedSpaceId={selectedSpaceId}
        selectedFolderId={selectedFolderId}
        selectedListId={selectedListId}
        onSelectSpace={handleSelectSpace}
        onSelectFolder={handleSelectFolder}
        onSelectList={handleSelectList}
        onOpenNewSpaceModal={() => setIsNewSpaceModalOpen(true)}
        onCreateFolder={handleCreateFolder}
        onCreateList={handleCreateList}
      />

      {/* 3. Fluid Main Canvas (calc(100vw - 296px)) */}
      <main className="flex-1 flex flex-col h-full bg-[#0D0F17] overflow-hidden">
        {/* Persistent View Tabs Bar (40px Height) */}
        <div className="h-10 px-4 border-b border-[#1E222D] flex items-center justify-between bg-[#11131C]">
          {/* Breadcrumb Path & Tabs */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
              {breadcrumb.map((b, i) => (
                <React.Fragment key={b + i}>
                  {i > 0 && <span className="text-zinc-600">/</span>}
                  <span
                    className={
                      i === breadcrumb.length - 1
                        ? "text-zinc-100 font-semibold"
                        : "text-zinc-400"
                    }
                  >
                    {b}
                  </span>
                </React.Fragment>
              ))}
            </div>

            <div className="h-4 w-px bg-[#222634]" />

            {/* View Tabs */}
            <div className="flex items-center gap-1 text-xs">
              <button
                onClick={() => setViewMode("overview")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition ${
                  viewMode === "overview"
                    ? "bg-blue-600/20 text-blue-400 font-medium"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Overview</span>
              </button>

              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition ${
                  viewMode === "list"
                    ? "bg-blue-600/20 text-blue-400 font-medium"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <ListIcon className="w-3.5 h-3.5" />
                <span>List</span>
              </button>

              <button
                onClick={() => setViewMode("board")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition ${
                  viewMode === "board"
                    ? "bg-blue-600/20 text-blue-400 font-medium"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Columns3 className="w-3.5 h-3.5" />
                <span>Board</span>
              </button>

              {/* + View Modal Button */}
              <div className="relative">
                <button
                  onClick={() => setShowAddViewMenu((prev) => !prev)}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-zinc-400 hover:text-white transition text-xs"
                >
                  <Plus className="w-3 h-3" />
                  <span>View</span>
                </button>

                {showAddViewMenu && (
                  <div className="absolute left-0 top-8 w-44 bg-[#141724] border border-[#282E42] rounded-xl shadow-2xl py-1.5 z-50 text-xs text-zinc-300">
                    <button
                      onClick={() => setShowAddViewMenu(false)}
                      className="w-full px-3 py-1.5 text-left hover:bg-[#202538] flex items-center gap-2"
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-blue-400" /> Gantt
                    </button>
                    <button
                      onClick={() => setShowAddViewMenu(false)}
                      className="w-full px-3 py-1.5 text-left hover:bg-[#202538] flex items-center gap-2"
                    >
                      <CalendarDays className="w-3.5 h-3.5 text-amber-400" /> Calendar
                    </button>
                    <button
                      onClick={() => setShowAddViewMenu(false)}
                      className="w-full px-3 py-1.5 text-left hover:bg-[#202538] flex items-center gap-2"
                    >
                      <Columns3 className="w-3.5 h-3.5 text-emerald-400" /> Table
                    </button>
                    <button
                      onClick={() => setShowAddViewMenu(false)}
                      className="w-full px-3 py-1.5 text-left hover:bg-[#202538] flex items-center gap-2"
                    >
                      <Network className="w-3.5 h-3.5 text-purple-400" /> Mind Map
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Toolbar Controls */}
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 bg-[#090A0F] border border-[#222634] rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500 w-44 transition"
              />
            </div>

            {/* Priority Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-zinc-500" />
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-2 py-1 bg-[#090A0F] border border-[#222634] rounded-lg text-xs text-zinc-300 focus:outline-none"
              >
                <option value="ALL">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Add Task Primary CTA */}
            <button
              onClick={() => {
                if (currentSpaceStatuses.length > 0) {
                  setAddingTaskForStatusId(currentSpaceStatuses[0].id);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-500/20 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Task</span>
            </button>
          </div>
        </div>

        {/* View Content Canvas */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : viewMode === "board" ? (
            /* CLEAN KANBAN BOARD: 272px Columns, 12px Gap, Crisp 1px #222630 Borders */
            <div className="flex gap-3 h-full items-start pb-4">
              {currentSpaceStatuses.map((status) => {
                const columnTasks = filteredTasks.filter((t) => t.status_id === status.id);
                const isAdding = addingTaskForStatusId === status.id;

                return (
                  <div
                    key={status.id}
                    className="w-[272px] min-w-[272px] max-h-full bg-[#11131C] border border-[#222630] rounded-xl flex flex-col overflow-hidden"
                  >
                    {/* Column Header */}
                    <div className="h-10 px-3 border-b border-[#1E222D] flex items-center justify-between bg-[#141624]">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: status.color_hex }}
                        />
                        <span className="text-xs font-bold tracking-wider text-zinc-200 uppercase">
                          {status.name}
                        </span>
                        <span className="px-1.5 py-0.5 rounded-full bg-[#1E2230] text-[10px] font-mono text-zinc-400">
                          {columnTasks.length}
                        </span>
                      </div>

                      <button
                        onClick={() => setAddingTaskForStatusId(status.id)}
                        className="p-1 rounded text-zinc-400 hover:text-white hover:bg-[#202538] transition"
                        title="Add Task to Status"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Column Cards Container */}
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                      {columnTasks.map((task) => (
                        <div
                          key={task.id}
                          onClick={() => setSelectedTaskForDetail(task)}
                          className="group w-[256px] p-3 bg-[#161924] border border-[#222630] hover:border-blue-500/50 hover:bg-[#1A1E2B] rounded-lg cursor-pointer transition shadow-sm space-y-2.5"
                        >
                          {/* Task Name */}
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="text-xs font-semibold text-zinc-100 group-hover:text-blue-300 transition line-clamp-2">
                              {task.name}
                            </h4>
                          </div>

                          {/* Badges Row */}
                          <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                            {/* Priority Badge */}
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

                            {/* Checklist Counter */}
                            {task.checklists.length > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-[#202434] text-zinc-300 flex items-center gap-1">
                                <CheckSquare className="w-2.5 h-2.5 text-emerald-400" />
                                {task.checklists.filter((c) => c.is_completed).length}/
                                {task.checklists.length}
                              </span>
                            )}

                            {/* Estimate */}
                            {task.time_estimate_minutes > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-[#202434] text-zinc-400 flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                {task.time_estimate_minutes}m
                              </span>
                            )}

                            {/* Due Date */}
                            {task.due_date && (
                              <span className="px-1.5 py-0.5 rounded bg-[#202434] text-zinc-400 flex items-center gap-1">
                                <Calendar className="w-2.5 h-2.5 text-zinc-400" />
                                {new Date(task.due_date).toLocaleDateString([], {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            )}
                          </div>

                          {/* Quick Step Controls on Hover */}
                          <div className="opacity-0 group-hover:opacity-100 flex items-center justify-between pt-1 border-t border-[#202534] transition">
                            <span className="text-[10px] text-zinc-500">Move status:</span>
                            <div className="flex items-center gap-1">
                              <button
                                title="Move Left"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStepStatus(task, -1);
                                }}
                                className="p-0.5 rounded hover:bg-[#282F44] text-zinc-400 hover:text-white"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                              <button
                                title="Move Right"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStepStatus(task, 1);
                                }}
                                className="p-0.5 rounded hover:bg-[#282F44] text-zinc-400 hover:text-white"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Inline Task Creator Form */}
                      {isAdding && (
                        <div className="w-[256px] p-2 bg-[#161924] border border-blue-500 rounded-lg space-y-2">
                          <input
                            type="text"
                            placeholder="What needs to be done?"
                            value={inlineTaskNameByStatus[status.id] || ""}
                            onChange={(e) =>
                              setInlineTaskNameByStatus((prev) => ({
                                ...prev,
                                [status.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleCreateTaskInline(status.id);
                              if (e.key === "Escape") setAddingTaskForStatusId(null);
                            }}
                            autoFocus
                            className="w-full px-2 py-1 bg-[#090A0F] border border-[#222634] rounded text-xs text-white placeholder-zinc-500 focus:outline-none"
                          />
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => setAddingTaskForStatusId(null)}
                              className="px-2 py-0.5 text-[11px] text-zinc-400 hover:text-zinc-200"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleCreateTaskInline(status.id)}
                              className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-medium"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Inline + Add Task Button at Bottom */}
                    {!isAdding && (
                      <button
                        onClick={() => setAddingTaskForStatusId(status.id)}
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
          ) : viewMode === "list" ? (
            /* TABULAR LIST VIEW */
            <div className="h-full bg-[#11131C] border border-[#222630] rounded-xl overflow-hidden flex flex-col">
              <div className="h-9 px-4 border-b border-[#1E222D] grid grid-cols-12 gap-2 text-[11px] font-bold text-zinc-400 uppercase tracking-wider items-center bg-[#141624]">
                <div className="col-span-5">Task Name</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Priority</div>
                <div className="col-span-2">Due Date</div>
                <div className="col-span-1 text-right">Estimate</div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-[#1B1F2C]">
                {filteredTasks.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-xs text-zinc-500">
                    No tasks found in this scope.
                  </div>
                ) : (
                  filteredTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTaskForDetail(task)}
                      className="h-10 px-4 grid grid-cols-12 gap-2 items-center hover:bg-[#161926] cursor-pointer text-xs transition"
                    >
                      <div className="col-span-5 flex items-center gap-2 truncate font-medium text-zinc-200">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: task.status_color }}
                        />
                        <span className="truncate">{task.name}</span>
                        {task.checklists.length > 0 && (
                          <span className="text-[10px] text-zinc-500 font-mono">
                            [{task.checklists.filter((c) => c.is_completed).length}/
                            {task.checklists.length}]
                          </span>
                        )}
                      </div>

                      <div className="col-span-2">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-semibold"
                          style={{
                            backgroundColor: `${task.status_color}20`,
                            color: task.status_color,
                          }}
                        >
                          {task.status_name}
                        </span>
                      </div>

                      <div className="col-span-2">
                        <span className="capitalize text-zinc-400">{task.priority}</span>
                      </div>

                      <div className="col-span-2 text-zinc-400">
                        {task.due_date
                          ? new Date(task.due_date).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                            })
                          : "—"}
                      </div>

                      <div className="col-span-1 text-right text-zinc-400 font-mono">
                        {task.time_estimate_minutes > 0
                          ? `${task.time_estimate_minutes}m`
                          : "—"}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* EXECUTIVE OVERVIEW VIEW */
            <div className="h-full overflow-y-auto space-y-6">
              {/* Executive Stat Cards */}
              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-[#11131C] border border-[#222630] space-y-1">
                  <span className="text-xs text-zinc-400">Total Tasks</span>
                  <div className="text-2xl font-bold text-white">{overviewStats.total}</div>
                </div>

                <div className="p-4 rounded-xl bg-[#11131C] border border-[#222630] space-y-1">
                  <span className="text-xs text-blue-400">Active In Flight</span>
                  <div className="text-2xl font-bold text-blue-300">
                    {overviewStats.active}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#11131C] border border-[#222630] space-y-1">
                  <span className="text-xs text-emerald-400">Completed</span>
                  <div className="text-2xl font-bold text-emerald-300">
                    {overviewStats.completed}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#11131C] border border-[#222630] space-y-1">
                  <span className="text-xs text-amber-400">Estimated Effort</span>
                  <div className="text-2xl font-bold text-amber-300">
                    {overviewStats.totalEstHours} hrs
                  </div>
                </div>
              </div>

              {/* Status Breakdown Bar */}
              <div className="p-5 rounded-xl bg-[#11131C] border border-[#222630] space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
                  <span>Execution Breakdown</span>
                  <span className="text-zinc-500 font-mono">
                    {overviewStats.total} total items
                  </span>
                </div>

                <div className="w-full h-3 rounded-full bg-[#181B26] overflow-hidden flex">
                  {currentSpaceStatuses.map((st) => {
                    const count = filteredTasks.filter((t) => t.status_id === st.id).length;
                    const pct = overviewStats.total > 0 ? (count / overviewStats.total) * 100 : 0;
                    if (pct === 0) return null;
                    return (
                      <div
                        key={st.id}
                        style={{ width: `${pct}%`, backgroundColor: st.color_hex }}
                        title={`${st.name}: ${count} (${Math.round(pct)}%)`}
                      />
                    );
                  })}
                </div>

                <div className="flex flex-wrap gap-4 pt-1">
                  {currentSpaceStatuses.map((st) => {
                    const count = filteredTasks.filter((t) => t.status_id === st.id).length;
                    return (
                      <div key={st.id} className="flex items-center gap-1.5 text-xs text-zinc-400">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: st.color_hex }}
                        />
                        <span>{st.name}:</span>
                        <span className="font-semibold text-zinc-200">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 4. Task Detail Modal (90vw, 85vh, 65% / 35%) */}
      <TaskDetailModal
        task={selectedTaskForDetail}
        statuses={currentSpaceStatuses}
        allTasks={tasks}
        isOpen={!!selectedTaskForDetail}
        onClose={() => setSelectedTaskForDetail(null)}
        onUpdateTask={handleUpdateTask}
        onToggleChecklist={handleToggleChecklist}
        onAddChecklist={handleAddChecklist}
        onAddComment={handleAddComment}
        onAddDependency={handleAddDependency}
        onAddSubtask={handleAddSubtask}
        onDeleteTask={handleDeleteTask}
      />

      {/* 5. New Space Creator Modal */}
      <NewSpaceModal
        isOpen={isNewSpaceModalOpen}
        onClose={() => setIsNewSpaceModalOpen(false)}
        onCreateSpace={handleCreateSpace}
      />
    </div>
  );
}
