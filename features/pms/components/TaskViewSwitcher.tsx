"use client";

import React from "react";
import {
  CalendarDays,
  Columns3,
  Filter,
  Home as HomeIcon,
  LayoutDashboard,
  List as ListIcon,
  PanelLeft,
  Plus,
  Search,
} from "lucide-react";
import type { PmsPriorityFilter, PmsViewMode } from "../state/pmsMachine";

interface TaskViewSwitcherProps {
  breadcrumb: string[];
  showSpacesDrawer: boolean;
  viewMode: PmsViewMode;
  searchQuery: string;
  priorityFilter: PmsPriorityFilter;
  onToggleSpacesDrawer: () => void;
  onSelectViewMode: (mode: PmsViewMode) => void;
  onSearchChange: (q: string) => void;
  onPriorityFilterChange: (priority: PmsPriorityFilter) => void;
  onTriggerQuickAdd: () => void;
}

const VIEW_TABS: ReadonlyArray<{
  id: PmsViewMode;
  label: string;
  testId: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "home", label: "Home", testId: "pms-view-home", icon: HomeIcon },
  {
    id: "overview",
    label: "Overview",
    testId: "pms-view-overview",
    icon: LayoutDashboard,
  },
  { id: "list", label: "List", testId: "pms-view-list", icon: ListIcon },
  { id: "board", label: "Board", testId: "pms-view-board", icon: Columns3 },
  {
    id: "calendar",
    label: "Calendar",
    testId: "pms-view-calendar",
    icon: CalendarDays,
  },
];

export function TaskViewSwitcher({
  breadcrumb,
  showSpacesDrawer,
  viewMode,
  searchQuery,
  priorityFilter,
  onToggleSpacesDrawer,
  onSelectViewMode,
  onSearchChange,
  onPriorityFilterChange,
  onTriggerQuickAdd,
}: TaskViewSwitcherProps) {
  return (
    <div
      data-testid="pms-view-switcher"
      className="min-h-11 px-4 py-1.5 border-b flex flex-wrap items-center justify-between gap-2"
      style={{
        backgroundColor: "var(--glass-surface-elevated)",
        borderColor: "var(--glass-border)",
      }}
    >
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          data-testid="pms-toggle-spaces-btn"
          onClick={onToggleSpacesDrawer}
          className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition"
          style={{ color: "var(--glass-text-muted)" }}
          title={showSpacesDrawer ? "Hide Spaces Drawer" : "Show Spaces Drawer"}
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        <div
          className="flex items-center gap-1.5 text-xs font-medium"
          style={{ color: "var(--glass-text-muted)" }}
        >
          {breadcrumb.map((part, idx) => (
            <React.Fragment key={`${part}-${idx}`}>
              {idx > 0 && <span className="opacity-50">/</span>}
              <span
                style={{
                  color:
                    idx === breadcrumb.length - 1
                      ? "var(--glass-text-primary)"
                      : "var(--glass-text-muted)",
                }}
              >
                {part}
              </span>
            </React.Fragment>
          ))}
        </div>

        <div
          className="h-4 w-px"
          style={{ backgroundColor: "var(--glass-border)" }}
        />

        <div className="flex items-center gap-1 text-xs">
          {VIEW_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = viewMode === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                data-testid={tab.testId}
                aria-pressed={active}
                onClick={() => onSelectViewMode(tab.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition ${
                  active
                    ? "bg-[#4984fd]/15 text-[#4984fd] font-semibold"
                    : "opacity-75 hover:opacity-100"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            data-testid="pms-search-input"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 pr-3 py-1 bg-[#090A0F] border border-[#222634] rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500 w-44 transition"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-zinc-500" />
          <select
            data-testid="pms-priority-filter"
            value={priorityFilter}
            onChange={(e) =>
              onPriorityFilterChange(e.target.value as PmsPriorityFilter)
            }
            className="px-2 py-1 bg-[#090A0F] border border-[#222634] rounded-lg text-xs text-zinc-300 focus:outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>
        </div>

        <button
          type="button"
          data-testid="pms-add-task-btn"
          onClick={onTriggerQuickAdd}
          className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-500/20 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Task</span>
        </button>
      </div>
    </div>
  );
}
