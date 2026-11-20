"use client";

import React, { useMemo } from "react";
import { ArrowRight, Plus } from "lucide-react";
import type { PmsSpaceDTO, PmsStatusDTO, PmsTaskDTO } from "@/lib/pmsTypes";

interface PmsOverviewPanelProps {
  tasks: PmsTaskDTO[];
  statuses: PmsStatusDTO[];
}

export function PmsOverviewPanel({ tasks, statuses }: PmsOverviewPanelProps) {
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status_category === "closed").length;
    const active = tasks.filter((t) => t.status_category === "active").length;
    const totalEstHours = Math.round(
      tasks.reduce((acc, t) => acc + (t.time_estimate_minutes || 0), 0) / 60
    );
    return { total, completed, active, totalEstHours };
  }, [tasks]);

  return (
    <div
      data-testid="pms-overview-panel"
      className="h-full overflow-y-auto space-y-6"
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#11131C] border border-[#222630] space-y-1">
          <span className="text-xs text-zinc-400">Total Tasks</span>
          <div className="text-2xl font-bold text-white">{stats.total}</div>
        </div>
        <div className="p-4 rounded-xl bg-[#11131C] border border-[#222630] space-y-1">
          <span className="text-xs text-blue-400">Active In Flight</span>
          <div className="text-2xl font-bold text-blue-300">{stats.active}</div>
        </div>
        <div className="p-4 rounded-xl bg-[#11131C] border border-[#222630] space-y-1">
          <span className="text-xs text-emerald-400">Completed</span>
          <div className="text-2xl font-bold text-emerald-300">
            {stats.completed}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-[#11131C] border border-[#222630] space-y-1">
          <span className="text-xs text-amber-400">Estimated Effort</span>
          <div className="text-2xl font-bold text-amber-300">
            {stats.totalEstHours} hrs
          </div>
        </div>
      </div>

      <div className="p-5 rounded-xl bg-[#11131C] border border-[#222630] space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
          <span>Execution Breakdown</span>
          <span className="text-zinc-500 font-mono">
            {stats.total} total items
          </span>
        </div>

        <div className="w-full h-3 rounded-full bg-[#181B26] overflow-hidden flex">
          {statuses.map((st) => {
            const count = tasks.filter((t) => t.status_id === st.id).length;
            const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
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
          {statuses.map((st) => {
            const count = tasks.filter((t) => t.status_id === st.id).length;
            return (
              <div
                key={st.id}
                className="flex items-center gap-1.5 text-xs text-zinc-400"
              >
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
  );
}

interface PmsHomePanelProps {
  spaces: PmsSpaceDTO[];
  tasks: PmsTaskDTO[];
  onOpenNewSpaceModal: () => void;
  onSelectSpaceToBoard: (spaceId: string) => void;
}

export function PmsHomePanel({
  spaces,
  tasks,
  onOpenNewSpaceModal,
  onSelectSpaceToBoard,
}: PmsHomePanelProps) {
  return (
    <div
      data-testid="pms-home-panel"
      className="p-4 max-w-6xl mx-auto space-y-6 overflow-y-auto h-full"
    >
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2
            className="text-lg font-medium"
            style={{ color: "var(--glass-text-primary)" }}
          >
            Universal Home Dashboard
          </h2>
          <p className="text-xs" style={{ color: "var(--glass-text-muted)" }}>
            All active spaces &amp; tasks interconnected across Operations,
            Health, Wealth, and Family.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenNewSpaceModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#4984fd] text-white text-xs font-medium hover:bg-blue-500 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Space</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {spaces.map((sp) => {
          const spTasks = tasks.filter(
            (t) => t.space_id === sp.id && !t.parent_task_id
          );
          const doneCount = spTasks.filter(
            (t) => t.status_category === "closed"
          ).length;
          return (
            <button
              key={sp.id}
              type="button"
              onClick={() => onSelectSpaceToBoard(sp.id)}
              className="text-left p-4 rounded-2xl border transition hover:border-[#4984fd]/50 space-y-2"
              style={{
                backgroundColor: "var(--glass-surface-elevated)",
                borderColor: "var(--glass-border)",
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-sm font-medium flex items-center gap-2"
                  style={{ color: "var(--glass-text-primary)" }}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: sp.color_hex || "#4984fd" }}
                  />
                  {sp.name}
                </span>
                <ArrowRight className="w-3.5 h-3.5 opacity-60" />
              </div>
              <div
                className="text-xs font-mono"
                style={{ color: "var(--glass-text-muted)" }}
              >
                {spTasks.length} tasks · {doneCount} completed
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
