"use client";

import React from "react";
import { StrategicTree } from "@/lib/synthesisRoadmapTypes";

interface BackwardChainTracePanelProps {
  tree: StrategicTree;
  onSelectNode: (nodeId: string) => void;
  onClose: () => void;
}

export function BackwardChainTracePanel({
  tree,
  onSelectNode,
  onClose,
}: BackwardChainTracePanelProps) {
  return (
    <div
      data-testid="roadmap-backward-chain-panel"
      className="mx-4 sm:mx-6 mt-3 p-4 rounded-2xl border border-amber-400/40 bg-amber-950/30 backdrop-blur-xl text-xs space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-mono text-amber-300 uppercase tracking-wider">
          <span>↺ Backward Chaining Dependency Trace</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30">
            Goal ➔ Tier 2 ➔ Tier 1 ➔ Tier 0
          </span>
        </div>
        <button
          type="button"
          data-testid="roadmap-backward-chain-close-btn"
          onClick={onClose}
          className="text-zinc-400 hover:text-white px-2 py-0.5 rounded-lg bg-white/5"
        >
          Close ✕
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 font-mono">
        <div className="p-2.5 rounded-xl bg-black/40 border border-amber-400/30">
          <div className="text-[10px] text-amber-400 uppercase mb-1">Step 1 · Target Goal</div>
          <div className="text-white font-medium">{tree.tier3.title}</div>
        </div>

        <div className="p-2.5 rounded-xl bg-black/40 border border-white/10">
          <div className="text-[10px] text-cyan-400 uppercase mb-1">
            Step 2 · Integration ({tree.tier2.length})
          </div>
          <div className="space-y-1">
            {tree.tier2.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => onSelectNode(n.id)}
                className="block w-full text-left truncate text-zinc-200 hover:text-cyan-300"
              >
                • {n.title} ({n.status})
              </button>
            ))}
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-black/40 border border-white/10">
          <div className="text-[10px] text-indigo-400 uppercase mb-1">
            Step 3 · Sub-Assemblies ({tree.tier1.length})
          </div>
          <div className="space-y-1">
            {tree.tier1.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => onSelectNode(n.id)}
                className="block w-full text-left truncate text-zinc-200 hover:text-cyan-300"
              >
                • {n.title} ({n.status})
              </button>
            ))}
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-black/40 border border-white/10">
          <div className="text-[10px] text-emerald-400 uppercase mb-1">
            Step 4 · Raw Inputs ({tree.tier0.length})
          </div>
          <div className="space-y-1">
            {tree.tier0.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => onSelectNode(n.id)}
                className="block w-full text-left truncate text-zinc-200 hover:text-cyan-300"
              >
                • {n.title} ({n.status})
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
