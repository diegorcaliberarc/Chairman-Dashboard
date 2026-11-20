"use client";

import React from "react";
import { Rocket } from "lucide-react";
import {
  ExecutionWorkMode,
  MissionFlowDraft,
  MissionWbsNode,
} from "@/lib/missionFlowTypes";

interface Stage4FragoDeployPanelProps {
  draft: MissionFlowDraft;
  isDeploying: boolean;
  onDeployMission: () => void;
  onUpdateNode: (id: string, patch: Partial<MissionWbsNode>) => void;
  onPatchDraft: (updater: (prev: MissionFlowDraft) => MissionFlowDraft) => void;
}

export function Stage4FragoDeployPanel({
  draft,
  isDeploying,
  onDeployMission,
  onUpdateNode,
  onPatchDraft,
}: Stage4FragoDeployPanelProps) {
  return (
    <div data-testid="mission-stage-panel-4" className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-medium text-white">
            Stage 4: Tactical Synchronization, 5-Paragraph FRAGO &amp; IF/THEN PACE Guardrails
          </h3>
          <p className="text-xs text-zinc-400">
            Sequence Passive-First tasks, separate Operator vs Build Mode, and deploy straight to Pristine PMS &amp; Calendar.
          </p>
        </div>
        <button
          type="button"
          data-testid="mission-deploy-btn"
          onClick={onDeployMission}
          disabled={isDeploying}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-300 to-cyan-400 text-zinc-950 font-mono text-xs font-medium uppercase tracking-wider shadow-xl hover:brightness-110 transition disabled:opacity-50"
        >
          <Rocket size={14} />
          <span>{isDeploying ? "Deploying..." : "Deploy Mission (PMS + Calendar + DAG)"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {draft.nodes.map((n) => (
          <div
            key={n.id}
            className="p-3.5 rounded-2xl border border-white/10 bg-[#0e1424] flex items-center justify-between gap-2 text-xs"
          >
            <div className="min-w-0">
              <div className="font-medium text-white truncate">{n.title}</div>
              <div className="text-[10px] font-mono text-zinc-400">
                Ceiling: {n.timeBoxCeilingMins}m · Exit: {n.exitCriteria}
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 font-mono">
              <select
                value={n.workMode}
                onChange={(e) =>
                  onUpdateNode(n.id, { workMode: e.target.value as ExecutionWorkMode })
                }
                className="px-2 py-1 rounded-lg bg-black/50 border border-white/10 text-[11px] text-cyan-300"
              >
                <option value="PASSIVE">PASSIVE FIRST</option>
                <option value="OPERATOR">OPERATOR</option>
                <option value="BUILD">BUILD MODE</option>
              </select>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-2xl border border-white/10 bg-[#0e1424] space-y-2.5">
        <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
          5-Paragraph Tactical FRAGO
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
          {(
            [
              ["situation", "1. Situation"],
              ["mission", "2. Mission"],
              ["execution", "3. Execution"],
              ["sustainment", "4. Sustainment"],
              ["command", "5. Command & Signal"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className={key === "execution" ? "md:col-span-2" : ""}>
              <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">
                {label}
              </label>
              <input
                type="text"
                value={draft.frago[key]}
                onChange={(e) =>
                  onPatchDraft((p) => ({ ...p, frago: { ...p.frago, [key]: e.target.value } }))
                }
                className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-zinc-200"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 rounded-2xl border border-white/10 bg-[#0e1424] space-y-2.5">
        <div className="text-xs font-mono text-amber-400 uppercase tracking-wider">
          Decision Support Matrix · IF [Trigger] → THEN [Action] (PACE)
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {draft.paceMatrix.map((rule) => (
            <div
              key={rule.tier}
              className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1.5 text-xs font-mono"
            >
              <div className="text-amber-300 font-medium">
                [{rule.tier}] {rule.label}
              </div>
              <input
                type="text"
                value={rule.ifTrigger}
                onChange={(e) =>
                  onPatchDraft((p) => ({
                    ...p,
                    paceMatrix: p.paceMatrix.map((r) =>
                      r.tier === rule.tier ? { ...r, ifTrigger: e.target.value } : r
                    ),
                  }))
                }
                placeholder="IF [Trigger]..."
                className="w-full px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] text-zinc-300"
              />
              <input
                type="text"
                value={rule.thenAction}
                onChange={(e) =>
                  onPatchDraft((p) => ({
                    ...p,
                    paceMatrix: p.paceMatrix.map((r) =>
                      r.tier === rule.tier ? { ...r, thenAction: e.target.value } : r
                    ),
                  }))
                }
                placeholder="THEN [Action]..."
                className="w-full px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] text-emerald-300"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
