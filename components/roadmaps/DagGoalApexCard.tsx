"use client";

import React from "react";
import { GoalClimax } from "@/lib/synthesisRoadmapTypes";

interface DagGoalApexCardProps {
  goal: GoalClimax;
  offsetStyle: React.CSSProperties;
  onPointerDown: (nodeId: string, e: React.PointerEvent) => void;
  onPointerMove: (nodeId: string, e: React.PointerEvent) => void;
  onPointerUp: (nodeId: string, e: React.PointerEvent) => void;
  onLockGoal?: () => void;
}

export function DagGoalApexCard({
  goal,
  offsetStyle,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onLockGoal,
}: DagGoalApexCardProps) {
  return (
    <div className="w-80 flex flex-col justify-center py-4">
      <div className="text-xs uppercase font-mono tracking-widest text-amber-400 font-black flex items-center gap-1.5 mb-2 pl-2">
        <span className="text-amber-400">🏆</span> TIER 3: FINAL DESTINATION
      </div>

      <div
        id="dag_node_goal"
        data-testid="dag-node-goal"
        style={offsetStyle}
        onPointerDown={(e) => onPointerDown("goal", e)}
        onPointerMove={(e) => onPointerMove("goal", e)}
        onPointerUp={(e) => onPointerUp("goal", e)}
        className="cursor-grab active:cursor-grabbing group flex flex-col items-center relative w-full select-none"
      >
        <div className="relative -mb-6 z-30">
          <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-cyan-400 text-white font-black text-base px-6 py-2 rounded-full uppercase tracking-widest shadow-2xl shadow-amber-500/50 rotate-2 flex items-center gap-2 border-2 border-white font-mono">
            <span className="animate-bounce">🏆</span> GOAL!!
          </div>
        </div>

        <div className="w-full bg-[#0E1322]/95 backdrop-blur-2xl p-6 pt-9 rounded-[2.5rem] border-2 border-amber-400 glow-goal-burst flex flex-col items-center text-center relative overflow-hidden group-hover:scale-105 transition-all duration-300 shadow-2xl">
          <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />

          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-200 p-0.5 shadow-xl shadow-amber-500/40 mb-3 flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-[#0A0D18] flex items-center justify-center text-amber-400 text-2xl">
              ⭐
            </div>
          </div>

          <span className="px-3 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black uppercase tracking-wider mb-2 font-mono">
            {goal.badge}
          </span>

          <h3 className="text-xl font-black text-white leading-tight mb-1.5">{goal.title}</h3>
          <p className="text-xs text-zinc-400 leading-relaxed mb-4 px-1">{goal.desc}</p>

          <div className="w-full bg-[#060911]/80 p-3 rounded-2xl flex items-center justify-between mb-4 border border-white/10 text-xs">
            <div className="text-left font-mono">
              <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">
                TRAJECTORY
              </span>
              <span className="text-sm font-black text-amber-400">{goal.rate} SYNTHESIZED</span>
            </div>
            <div className="text-right font-mono text-[10px] text-zinc-400">
              <div>{goal.metric1}</div>
              <div className="text-emerald-400 font-bold">{goal.metric2}</div>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onLockGoal?.();
            }}
            className="w-full py-2.5 rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-cyan-400 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/30 hover:brightness-110 active:scale-95 transition flex items-center justify-center gap-1.5"
          >
            <span>⚡ LOCK VECTOR COMPLETE</span>
          </button>
        </div>
      </div>
    </div>
  );
}
