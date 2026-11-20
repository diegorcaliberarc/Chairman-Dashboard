"use client";

import React from "react";
import {
  BomBucket,
  MissionFlowDraft,
  MissionWbsNode,
  computeCriticalPath,
  computeMissionQuantification,
} from "@/lib/missionFlowTypes";

interface Stage3BomCpmPanelProps {
  draft: MissionFlowDraft;
  cpm: ReturnType<typeof computeCriticalPath>;
  quant: ReturnType<typeof computeMissionQuantification>;
  onUpdateNode: (id: string, patch: Partial<MissionWbsNode>) => void;
  onCreateAcquisitionTask: (label: string) => void;
}

export function Stage3BomCpmPanel({
  draft,
  cpm,
  quant,
  onUpdateNode,
  onCreateAcquisitionTask,
}: Stage3BomCpmPanelProps) {
  return (
    <div data-testid="mission-stage-panel-3" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-medium text-white">
            Stage 3: BOM Readiness Audit &amp; Critical Path Isolation (CPM)
          </h3>
          <p className="text-xs text-zinc-400">
            Glowing amber rows mark Slack = 0 Critical Path (Main Effort). Minimum Time-to-Completion:{" "}
            <span className="text-amber-300 font-mono">{cpm.totalMinDurationMins} mins</span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            HAVE: {quant.haveCount}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30">
            NEED: {quant.needCount}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/30">
            BLOCKED: {quant.blockedCount}
          </span>
        </div>
      </div>

      <div className="space-y-2.5">
        {draft.nodes.map((node) => {
          const m = cpm.metrics[node.id];
          const isCrit = m?.isCritical;
          return (
            <div
              key={node.id}
              className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 transition ${
                isCrit
                  ? "border-amber-400/75 bg-amber-500/10 shadow-[0_0_24px_rgba(245,158,11,0.18)]"
                  : "border-white/10 bg-[#0e1424]/80"
              }`}
            >
              <div className="space-y-1 min-w-[220px]">
                <div className="flex items-center gap-2">
                  {isCrit && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-400 text-zinc-950 font-mono text-[9px] font-medium uppercase">
                      CRITICAL PATH · SLACK 0
                    </span>
                  )}
                  <span className="text-sm font-medium text-white">{node.title}</span>
                </div>
                <div className="text-[11px] font-mono text-zinc-400">
                  ES: {m?.es ?? 0}m · EF: {m?.ef ?? 0}m · LS: {m?.ls ?? 0}m · LF: {m?.lf ?? 0}m · Slack:{" "}
                  <span className={isCrit ? "text-amber-300" : "text-cyan-300"}>{m?.slack ?? 0}m</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {(["HAVE", "NEED", "BLOCKED"] as BomBucket[]).map((bucket) => (
                  <button
                    key={bucket}
                    type="button"
                    onClick={() => onUpdateNode(node.id, { bomStatus: bucket })}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition ${
                      node.bomStatus === bucket
                        ? bucket === "HAVE"
                          ? "bg-emerald-500 text-zinc-950 border-emerald-400"
                          : bucket === "NEED"
                          ? "bg-amber-400 text-zinc-950 border-amber-300"
                          : "bg-rose-500 text-white border-rose-400"
                        : "bg-black/40 text-zinc-400 border-white/10 hover:text-white"
                    }`}
                  >
                    {bucket}
                  </button>
                ))}

                {node.bomStatus === "NEED" && (
                  <button
                    type="button"
                    onClick={() => onCreateAcquisitionTask(node.title)}
                    className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/35 text-[11px] font-mono hover:bg-cyan-500/30 transition"
                  >
                    + Create Acquisition Task
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
