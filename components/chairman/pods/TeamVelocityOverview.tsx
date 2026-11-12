"use client";

import React, { useMemo, useState } from "react";
import {
  AlertOctagon,
  CheckCircle2,
  Cpu,
  Gauge,
  Lock,
  Plus,
  ShieldAlert,
  Zap,
} from "lucide-react";
import type { PodMemberInfo } from "./MemberAccountabilityCard";
import type { ChoreItem } from "./SharedChoreKanban";

interface TeamVelocityOverviewProps {
  members: PodMemberInfo[];
  sprintTasks: ChoreItem[];
  onCreateSprintTask: (payload: {
    name: string;
    assignee: string;
    priority: string;
    points: number;
  }) => Promise<void>;
  onUpdateSprintTask: (
    taskId: string,
    updates: { status_category?: string; assignee?: string }
  ) => Promise<void>;
}

export function TeamVelocityOverview({
  members,
  sprintTasks,
  onCreateSprintTask,
  onUpdateSprintTask,
}: TeamVelocityOverviewProps) {
  const [taskTitle, setTaskTitle] = useState("");
  const [assignee, setAssignee] = useState(
    members[0]?.display_alias || "Diego • Principal Architect"
  );
  const [points, setPoints] = useState(5);
  const [priority, setPriority] = useState("high");
  const [submitting, setSubmitting] = useState(false);

  const bizTasks = useMemo(
    () => sprintTasks.filter((t) => t.pod_type === "business_team"),
    [sprintTasks]
  );

  const metrics = useMemo(() => {
    const committedPts = bizTasks.reduce((s, t) => s + (t.points || 3), 0);
    const completedPts = bizTasks
      .filter((t) => t.status_category === "closed")
      .reduce((s, t) => s + (t.points || 3), 0);
    const blockers = bizTasks.filter((t) => t.status_category === "blocked");
    const inFlight = bizTasks.filter(
      (t) => t.status_category === "active" || t.status_category === "review"
    );
    const pct =
      committedPts > 0 ? Math.round((completedPts / committedPts) * 100) : 0;
    return { committedPts, completedPts, blockers, inFlight, pct };
  }, [bizTasks]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    setSubmitting(true);
    try {
      await onCreateSprintTask({
        name: taskTitle.trim(),
        assignee,
        priority,
        points,
      });
      setTaskTitle("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* STRICT ZERO-TRUST CORPORATE FIREWALL PROOF BANNER */}
      <div className="rounded-2xl border border-cyan-500/35 bg-gradient-to-r from-cyan-950/40 via-[#0b1220] to-[#0a0d14] p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-400/35 flex items-center justify-center text-cyan-300">
            <Lock size={18} />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-cyan-300">
              Tier 3 Boundary Shield Enforced — Pristine Tech Team
            </div>
            <p className="text-xs text-zinc-300 mt-0.5">
              Zero personal biometrics, zero private ledgers, zero MacroOps nutrition, and zero Futures PnL cross into this workspace.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10.5px] font-mono">
          <span className="px-2.5 py-1 rounded-lg bg-black/50 border border-emerald-500/30 text-emerald-300">
            BIOMETRICS: 0 EXPOSED
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-black/50 border border-emerald-500/30 text-emerald-300">
            FINANCES: 0 EXPOSED
          </span>
        </div>
      </div>

      {/* Sprint Velocity KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
          <div className="text-[10px] uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Gauge size={12} className="text-cyan-400" /> Committed Velocity
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {metrics.committedPts} pts
          </div>
          <div className="text-[11px] text-zinc-500 mt-0.5">
            {bizTasks.length} Engineering Deliverables
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
          <div className="text-[10px] uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Zap size={12} className="text-amber-400" /> Active / QA Gate
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300 mt-1">
            {metrics.inFlight.length}
          </div>
          <div className="text-[11px] text-zinc-500 mt-0.5">
            In-Flight Sprint Execution
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
          <div className="text-[10px] uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <AlertOctagon size={12} className="text-rose-400" /> Dependency Blockers
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400 mt-1">
            {metrics.blockers.length}
          </div>
          <div className="text-[11px] text-zinc-500 mt-0.5">
            Requires Escalation Unblock
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
          <div className="text-[10px] uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <CheckCircle2 size={12} className="text-emerald-400" /> Burnup Verified
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {metrics.completedPts} pts ({metrics.pct}%)
          </div>
          <div className="text-[11px] text-zinc-500 mt-0.5">
            Merged &amp; Verified in Prod
          </div>
        </div>
      </div>

      {/* Team Member Engineering Status Strip (Strictly Work-Scoped) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {members.map((m) => (
          <div
            key={m.id}
            className="rounded-xl border border-white/[0.08] bg-[#0c1019] p-3.5 space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white truncate">
                {m.display_alias}
              </span>
              <span className="px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 text-[9.5px] uppercase font-bold">
                {m.role}
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 truncate">
              {m.current_status || "Active Sprint Focus"}
            </div>
            <div className="text-[10.5px] font-mono text-zinc-300 pt-1 border-t border-white/[0.06] flex items-center justify-between">
              <span>Shipped Today: {m.today_completed_tasks_count}</span>
              <span className="text-emerald-400">{m.active_streak_days}d cadence</span>
            </div>
          </div>
        ))}
      </div>

      {/* Sprint Deliverable & Blocker Grid */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu size={16} className="text-cyan-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Pristine Tech Team — Sprint Velocity &amp; Blocker Ledger
            </h3>
          </div>
        </div>

        <form
          onSubmit={handleAdd}
          className="grid grid-cols-1 md:grid-cols-12 gap-2.5 bg-black/35 border border-white/[0.07] rounded-xl p-3"
        >
          <input
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="Dispatch engineering sprint deliverable or log blocker..."
            className="md:col-span-5 rounded-lg bg-[#090b11] border border-white/10 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
          />
          <select
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            className="md:col-span-3 rounded-lg bg-[#090b11] border border-white/10 px-2.5 py-1.5 text-xs text-zinc-200"
          >
            {members.map((m) => (
              <option key={m.id} value={m.display_alias} className="bg-[#090b11]">
                {m.display_alias}
              </option>
            ))}
          </select>
          <select
            value={points}
            onChange={(e) => setPoints(Number(e.target.value))}
            className="md:col-span-2 rounded-lg bg-[#090b11] border border-white/10 px-2.5 py-1.5 text-xs text-zinc-200"
          >
            {[1, 2, 3, 5, 8, 13].map((pt) => (
              <option key={pt} value={pt} className="bg-[#090b11]">
                {pt} Story Pts
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={submitting || !taskTitle.trim()}
            className="md:col-span-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-bold flex items-center justify-center gap-1.5 py-1.5"
          >
            <Plus size={13} /> Add Sprint Item
          </button>
        </form>

        <div className="space-y-2">
          {bizTasks.map((t) => {
            const isBlocked = t.status_category === "blocked";
            return (
              <div
                key={t.id}
                className={`rounded-xl border p-3.5 flex flex-wrap items-center justify-between gap-3 ${
                  isBlocked
                    ? "border-rose-500/40 bg-rose-950/20"
                    : "border-white/[0.08] bg-[#0c1018]"
                }`}
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {isBlocked && (
                      <span className="px-2 py-0.5 rounded bg-rose-500/25 text-rose-200 border border-rose-400/40 text-[10px] font-bold uppercase flex items-center gap-1">
                        <ShieldAlert size={11} /> Blocker
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 text-[10px] font-mono font-bold">
                      {t.points} PTS
                    </span>
                    <span className="text-xs font-semibold text-white">
                      {t.name}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400 flex items-center gap-2">
                    <span className="text-zinc-300 font-medium">{t.assignee}</span>
                    {t.description && <span>• {t.description}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={t.status_category}
                    onChange={(e) =>
                      onUpdateSprintTask(t.id, { status_category: e.target.value })
                    }
                    className="bg-[#090b11] border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200"
                  >
                    <option value="unstarted">Sprint Queue</option>
                    <option value="active">Active Execution</option>
                    <option value="blocked">Dependency Blocker</option>
                    <option value="review">Code Review / QA</option>
                    <option value="closed">Merged / Verified</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
