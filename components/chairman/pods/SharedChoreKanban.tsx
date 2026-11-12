"use client";

import React, { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Plus,
  UserCheck,
} from "lucide-react";

export interface ChoreItem {
  id: string;
  pod_type: "couple" | "family" | "business_team";
  name: string;
  description: string | null;
  status_category: "unstarted" | "active" | "blocked" | "review" | "closed";
  priority: string;
  assignee: string;
  points: number;
  tags: string[];
}

interface SharedChoreKanbanProps {
  podType: "couple" | "family";
  chores: ChoreItem[];
  memberNames: string[];
  onCreateChore: (payload: {
    name: string;
    assignee: string;
    priority: string;
  }) => Promise<void>;
  onUpdateChore: (
    taskId: string,
    updates: { status_category?: string; assignee?: string }
  ) => Promise<void>;
}

const CHORE_COLUMNS: Array<{
  key: "unstarted" | "active" | "closed";
  label: string;
  accent: string;
}> = [
  { key: "unstarted", label: "Queued Chores", accent: "#3b82f6" },
  { key: "active", label: "In Progress", accent: "#f59e0b" },
  { key: "closed", label: "Verified Today", accent: "#10b981" },
];

const ASSIGNEE_COLORS: Record<string, string> = {
  Diego: "bg-blue-500/20 text-blue-200 border-blue-400/40",
  Elena: "bg-pink-500/20 text-pink-200 border-pink-400/40",
  Maximiliano: "bg-emerald-500/20 text-emerald-200 border-emerald-400/40",
};

export function SharedChoreKanban({
  podType,
  chores,
  memberNames,
  onCreateChore,
  onUpdateChore,
}: SharedChoreKanbanProps) {
  const [assigneeFilter, setAssigneeFilter] = useState<string>("ALL");
  const [newTitle, setNewTitle] = useState("");
  const [newAssignee, setNewAssignee] = useState(memberNames[0] || "Diego");
  const [newPriority, setNewPriority] = useState("normal");
  const [adding, setAdding] = useState(false);

  const visibleChores = chores.filter((c) => {
    if (c.pod_type === "business_team") return false;
    if (podType === "couple" && !c.tags.includes("pod:couple")) return false;
    if (assigneeFilter !== "ALL" && !c.assignee.includes(assigneeFilter)) {
      return false;
    }
    return true;
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      await onCreateChore({
        name: newTitle.trim(),
        assignee: newAssignee,
        priority: newPriority,
      });
      setNewTitle("");
    } finally {
      setAdding(false);
    }
  };

  const normalizeColumn = (
    cat: ChoreItem["status_category"]
  ): "unstarted" | "active" | "closed" => {
    if (cat === "closed") return "closed";
    if (cat === "active" || cat === "review") return "active";
    return "unstarted";
  };

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList size={16} className="text-emerald-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Shared Household Chore &amp; Logistics Kanban
            </h3>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Multi-member assignment chips persisted to PostgreSQL (`is_shared = true`).
          </p>
        </div>

        {/* Member Assignment Filter Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setAssigneeFilter("ALL")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
              assigneeFilter === "ALL"
                ? "bg-white/15 border-white/30 text-white"
                : "bg-black/30 border-white/10 text-zinc-400"
            }`}
          >
            All Members
          </button>
          {memberNames.map((m) => (
            <button
              key={m}
              onClick={() => setAssigneeFilter(m)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                assigneeFilter === m
                  ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-200"
                  : "bg-black/30 border-white/10 text-zinc-400 hover:text-white"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Chore Composer */}
      <form
        onSubmit={handleAdd}
        className="grid grid-cols-1 md:grid-cols-12 gap-2.5 bg-black/30 border border-white/[0.06] rounded-xl p-3"
      >
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add shared household chore, school task, or canine care item..."
          className="md:col-span-6 rounded-lg bg-[#090b11] border border-white/10 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
        />
        <select
          value={newAssignee}
          onChange={(e) => setNewAssignee(e.target.value)}
          className="md:col-span-2 rounded-lg bg-[#090b11] border border-white/10 px-2.5 py-1.5 text-xs text-zinc-200"
        >
          {memberNames.map((m) => (
            <option key={m} value={m} className="bg-[#090b11]">
              Assign: {m}
            </option>
          ))}
        </select>
        <select
          value={newPriority}
          onChange={(e) => setNewPriority(e.target.value)}
          className="md:col-span-2 rounded-lg bg-[#090b11] border border-white/10 px-2.5 py-1.5 text-xs text-zinc-200"
        >
          <option value="urgent" className="bg-[#090b11]">
            Urgent
          </option>
          <option value="high" className="bg-[#090b11]">
            High
          </option>
          <option value="normal" className="bg-[#090b11]">
            Normal
          </option>
        </select>
        <button
          type="submit"
          disabled={adding || !newTitle.trim()}
          className="md:col-span-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold flex items-center justify-center gap-1.5 py-1.5"
        >
          <Plus size={13} /> Assign Chore
        </button>
      </form>

      {/* 3-Column Household Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {CHORE_COLUMNS.map((col) => {
          const items = visibleChores.filter(
            (c) => normalizeColumn(c.status_category) === col.key
          );
          return (
            <div
              key={col.key}
              className="rounded-xl border border-white/[0.07] bg-black/30 p-3.5 space-y-2.5 min-h-[260px]"
            >
              <div className="flex items-center justify-between border-b border-white/[0.07] pb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: col.accent }}
                  />
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-100">
                    {col.label}
                  </span>
                </div>
                <span className="text-xs font-mono text-zinc-400">
                  {items.length}
                </span>
              </div>

              {items.length === 0 ? (
                <div className="py-8 text-center text-[11px] text-zinc-600">
                  No chores in column
                </div>
              ) : (
                items.map((item) => {
                  const firstName = item.assignee.split(" ")[0];
                  const chipStyle =
                    ASSIGNEE_COLORS[firstName] ||
                    "bg-purple-500/20 text-purple-200 border-purple-400/40";
                  const nextCol =
                    col.key === "unstarted"
                      ? "active"
                      : col.key === "active"
                      ? "closed"
                      : "unstarted";

                  return (
                    <div
                      key={item.id}
                      className="rounded-xl border border-white/[0.08] bg-[#0e121b] p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${chipStyle}`}
                        >
                          <UserCheck size={10} /> {item.assignee}
                        </span>
                        <select
                          value={firstName}
                          onChange={(e) =>
                            onUpdateChore(item.id, { assignee: e.target.value })
                          }
                          className="bg-black/50 border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-zinc-400"
                        >
                          {memberNames.map((m) => (
                            <option key={m} value={m} className="bg-[#090b11]">
                              Reassign: {m}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="text-xs font-semibold text-zinc-100 leading-snug">
                        {item.name}
                      </div>
                      {item.description && (
                        <p className="text-[11px] text-zinc-400 line-clamp-2">
                          {item.description}
                        </p>
                      )}

                      <div className="pt-1.5 border-t border-white/[0.06] flex items-center justify-between">
                        <span className="text-[10px] uppercase font-mono text-zinc-500">
                          {item.priority}
                        </span>
                        <button
                          onClick={() =>
                            onUpdateChore(item.id, { status_category: nextCol })
                          }
                          className="px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.14] text-[10.5px] font-semibold text-zinc-200 flex items-center gap-1"
                        >
                          {col.key === "closed" ? (
                            <>Requeue</>
                          ) : col.key === "active" ? (
                            <>
                              <CheckCircle2
                                size={11}
                                className="text-emerald-400"
                              />{" "}
                              Mark Done
                            </>
                          ) : (
                            <>
                              Start <ArrowRight size={11} />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
