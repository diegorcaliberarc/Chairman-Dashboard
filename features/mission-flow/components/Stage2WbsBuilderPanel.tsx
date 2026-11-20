"use client";

import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { MissionFlowDraft, MissionWbsNode } from "@/lib/missionFlowTypes";

interface Stage2WbsBuilderPanelProps {
  draft: MissionFlowDraft;
  wbsCoveragePct: number;
  onAddNode: () => void;
  onUpdateNode: (id: string, patch: Partial<MissionWbsNode>) => void;
  onDeleteNode: (id: string) => void;
}

export function Stage2WbsBuilderPanel({
  draft,
  wbsCoveragePct,
  onAddNode,
  onUpdateNode,
  onDeleteNode,
}: Stage2WbsBuilderPanelProps) {
  return (
    <div data-testid="mission-stage-panel-2" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-medium text-white">
            Stage 2: Backward-Chained DAG &amp; WBS Decomposition (100% Rule)
          </h3>
          <p className="text-xs text-zinc-400">
            Decompose backward from GOAL!! into parallel Lines of Effort (LOEs) down to START!! leaf inputs.
          </p>
        </div>
        <button
          type="button"
          data-testid="mission-add-wbs-node-btn"
          onClick={onAddNode}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500 text-zinc-950 text-xs font-mono font-medium"
        >
          <Plus size={14} />
          <span>Add WBS Node</span>
        </button>
      </div>

      <div className="p-4 rounded-2xl border border-white/10 bg-[#0e1424] space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-zinc-300">WBS 100% Rule Scope Coverage Meter</span>
          <span
            className={
              wbsCoveragePct === 100
                ? "text-emerald-400 font-medium"
                : "text-amber-400 font-medium"
            }
          >
            {wbsCoveragePct}% / 100%{" "}
            {wbsCoveragePct === 100 ? "✓ Exact 100% Scope Locked" : "(Adjust weights to total 100%)"}
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-black/60 overflow-hidden border border-white/10">
          <div
            className={`h-full transition-all duration-300 ${
              wbsCoveragePct === 100 ? "bg-emerald-400" : "bg-amber-400"
            }`}
            style={{ width: `${Math.min(100, wbsCoveragePct)}%` }}
          />
        </div>
      </div>

      {draft.nodes.length === 0 ? (
        <div className="py-10 text-center text-xs font-mono text-zinc-400 rounded-2xl border border-dashed border-white/15">
          No WBS nodes yet. Click &quot;Add WBS Node&quot; above or run Done For You to decompose automatically.
        </div>
      ) : (
        <div className="space-y-2.5">
          {draft.nodes.map((node) => (
            <div
              key={node.id}
              data-testid={`mission-wbs-row-${node.id}`}
              className="p-3.5 rounded-2xl border border-white/10 bg-[#0e1424]/90 grid grid-cols-1 md:grid-cols-12 gap-3 items-center text-xs"
            >
              <div className="md:col-span-3 space-y-1">
                <input
                  type="text"
                  value={node.loe}
                  onChange={(e) => onUpdateNode(node.id, { loe: e.target.value })}
                  className="w-full bg-transparent text-[10px] font-mono text-cyan-400 uppercase focus:outline-none"
                />
                <input
                  type="text"
                  value={node.title}
                  onChange={(e) => onUpdateNode(node.id, { title: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white"
                />
              </div>
              <div className="md:col-span-4">
                <input
                  type="text"
                  value={node.deliverable}
                  onChange={(e) => onUpdateNode(node.id, { deliverable: e.target.value })}
                  placeholder="Concrete deliverable..."
                  className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-zinc-300"
                />
              </div>
              <div className="md:col-span-2 flex items-center gap-1.5 font-mono">
                <select
                  value={node.tier}
                  onChange={(e) =>
                    onUpdateNode(node.id, { tier: Number(e.target.value) as 0 | 1 | 2 })
                  }
                  className="px-2 py-1.5 rounded-lg bg-black/40 border border-white/10 text-zinc-200"
                >
                  <option value={0}>Tier 0 (Start)</option>
                  <option value={1}>Tier 1 (Work)</option>
                  <option value={2}>Tier 2 (Verify)</option>
                </select>
              </div>
              <div className="md:col-span-2 flex items-center gap-1.5 font-mono">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={node.scopeWeightPct}
                  onChange={(e) =>
                    onUpdateNode(node.id, { scopeWeightPct: Number(e.target.value) || 0 })
                  }
                  className="w-16 px-2 py-1.5 rounded-lg bg-black/40 border border-white/10 text-amber-300"
                />
                <span className="text-zinc-400">%</span>
                <input
                  type="number"
                  min={5}
                  value={node.durationMins}
                  onChange={(e) =>
                    onUpdateNode(node.id, { durationMins: Number(e.target.value) || 15 })
                  }
                  className="w-16 px-2 py-1.5 rounded-lg bg-black/40 border border-white/10 text-cyan-300"
                />
                <span className="text-zinc-400">m</span>
              </div>
              <div className="md:col-span-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => onDeleteNode(node.id)}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
