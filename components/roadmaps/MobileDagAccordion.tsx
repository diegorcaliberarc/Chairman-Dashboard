"use client";

import React from "react";
import { StrategicTree, DagNode } from "@/lib/synthesisRoadmapTypes";
import { Rocket, GitMerge, FlaskConical, ChevronRight, CheckCircle2 } from "lucide-react";

interface MobileDagAccordionProps {
  tree: StrategicTree;
  onNodeClick: (nodeId: string) => void;
  onLockGoal?: () => void;
}

export function MobileDagAccordion({
  tree,
  onNodeClick,
  onLockGoal,
}: MobileDagAccordionProps) {
  return (
    <div className="flex flex-col gap-6 p-4 select-none lg:hidden">
      {/* Tier 0 Stream */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider pl-1">
          <Rocket size={14} />
          <span>Tier 0: Raw Inputs [HAVE]</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tree.tier0.map((node) => (
            <div
              key={node.id}
              onClick={() => onNodeClick(node.id)}
              className="bg-[#0E1322] border border-white/10 rounded-2xl p-4 flex flex-col justify-between cursor-pointer active:scale-98 transition shadow-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {node.statusText}
                </span>
                <span className="text-xs text-cyan-400 font-mono">PACE: [P]</span>
              </div>
              <h4 className="text-sm font-bold text-white mb-1">{node.title}</h4>
              <p className="text-xs text-zinc-400 font-mono mb-3">{node.sub}</p>
              <div className="flex items-center justify-between text-[11px] text-cyan-400 font-mono pt-2 border-t border-white/5">
                <span>View Dossier</span>
                <ChevronRight size={14} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Downward Conduit Arrow */}
      <div className="flex items-center justify-center -my-2 text-amber-400 font-bold">
        ↓ Converging into Sub-Assemblies ↓
      </div>

      {/* Tier 1 Stream */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-wider pl-1">
          <GitMerge size={14} />
          <span>Tier 1: Intermediate Sub-Assemblies</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tree.tier1.map((node) => (
            <div
              key={node.id}
              onClick={() => onNodeClick(node.id)}
              className="bg-[#0E1322] border border-white/10 rounded-2xl overflow-hidden cursor-pointer active:scale-98 transition shadow-lg"
            >
              {node.image && (
                <div className="h-28 w-full relative">
                  <img src={node.image} alt={node.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0E1322] via-transparent to-transparent" />
                </div>
              )}
              <div className="p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-sm font-bold text-white">{node.title}</h4>
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {node.statusText}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 font-mono mb-3">{node.sub}</p>
                <div className="flex items-center justify-between text-[11px] text-amber-400 font-mono pt-2 border-t border-white/5">
                  <span>FRAGO Ready</span>
                  <ChevronRight size={14} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Downward Conduit Arrow */}
      <div className="flex items-center justify-center -my-2 text-indigo-400 font-bold">
        ↓ Advancing to Integration Junctions ↓
      </div>

      {/* Tier 2 Stream */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider pl-1">
          <FlaskConical size={14} />
          <span>Tier 2: Integration & Tuning</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tree.tier2.map((node) => (
            <div
              key={node.id}
              onClick={() => onNodeClick(node.id)}
              className="bg-[#0E1322] border border-white/10 rounded-2xl overflow-hidden cursor-pointer active:scale-98 transition shadow-lg"
            >
              {node.image && (
                <div className="h-28 w-full relative">
                  <img src={node.image} alt={node.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0E1322] via-transparent to-transparent" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-sm font-bold text-white">{node.title}</h4>
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {node.statusText}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 font-mono mb-3">{node.sub}</p>
                <div className="flex items-center justify-between text-[11px] text-indigo-400 font-mono pt-2 border-t border-white/5">
                  <span>View Restrictions</span>
                  <ChevronRight size={14} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Downward Conduit Arrow */}
      <div className="flex items-center justify-center -my-2 text-amber-400 font-black">
        ⚡ TERMINAL CONVERGENCE ⚡
      </div>

      {/* Tier 3 Goal Climax */}
      <div
        onClick={() => onNodeClick("goal")}
        className="w-full bg-[#0E1322] border-2 border-amber-400 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center cursor-pointer active:scale-98 transition"
      >
        <div className="w-14 h-14 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center text-2xl font-bold mb-2">
          🏆
        </div>
        <span className="px-3 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black uppercase font-mono mb-2">
          {tree.tier3.badge}
        </span>
        <h3 className="text-lg font-black text-white mb-2">{tree.tier3.title}</h3>
        <p className="text-xs text-zinc-400 mb-4">{tree.tier3.desc}</p>

        <div className="w-full bg-[#060911] p-3 rounded-2xl flex items-center justify-between mb-4 border border-white/10 text-xs font-mono">
          <div className="text-left">
            <span className="text-[9px] text-zinc-400 uppercase block">Trajectory</span>
            <span className="text-amber-400 font-bold">{tree.tier3.rate} SYNTHESIZED</span>
          </div>
          <div className="text-right text-[10px] text-zinc-400">
            <div>{tree.tier3.metric1}</div>
            <div className="text-emerald-400 font-bold">{tree.tier3.metric2}</div>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onLockGoal) onLockGoal();
          }}
          className="w-full py-2.5 rounded-full bg-gradient-to-r from-amber-400 to-cyan-400 text-black font-black text-xs uppercase tracking-wider shadow-lg"
        >
          ⚡ Lock Vector Complete
        </button>
      </div>
    </div>
  );
}
