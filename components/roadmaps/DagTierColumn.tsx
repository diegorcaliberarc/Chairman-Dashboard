"use client";

import React from "react";
import { DagNode, NodeStatus } from "@/lib/synthesisRoadmapTypes";
import { ArrowRight, FlaskConical, GitMerge, Rocket } from "lucide-react";

interface DagTierColumnProps {
  tierIndex: 0 | 1 | 2;
  nodes: DagNode[];
  getOffsetStyle: (nodeId: string) => React.CSSProperties;
  onPointerDown: (nodeId: string, e: React.PointerEvent) => void;
  onPointerMove: (nodeId: string, e: React.PointerEvent) => void;
  onPointerUp: (nodeId: string, e: React.PointerEvent) => void;
}

function getStatusStyles(status: NodeStatus) {
  switch (status) {
    case "HAVE":
      return {
        badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
        card: "border-emerald-500/40 shadow-[0_8px_32px_-8px_rgba(16,185,129,0.3)]",
        iconBg: "bg-emerald-500/20 text-emerald-400",
      };
    case "PROGRESS":
      return {
        badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
        card: "border-amber-400/50 shadow-[0_8px_32px_-8px_rgba(245,158,11,0.35)]",
        iconBg: "bg-amber-500/20 text-amber-400",
      };
    case "BLOCKED":
      return {
        badge: "bg-rose-500/15 text-rose-400 border-rose-500/30",
        card: "border-rose-500/40 shadow-[0_8px_32px_-8px_rgba(244,63,94,0.35)]",
        iconBg: "bg-rose-500/20 text-rose-400",
      };
    default:
      return {
        badge: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
        card: "border-cyan-400/40 shadow-[0_8px_32px_-8px_rgba(0,240,255,0.3)]",
        iconBg: "bg-cyan-500/20 text-cyan-400",
      };
  }
}

export function DagTierColumn({
  tierIndex,
  nodes,
  getOffsetStyle,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: DagTierColumnProps) {
  const headerMeta =
    tierIndex === 0
      ? {
          widthCls: "w-64",
          gapCls: "gap-6",
          dotCls: "bg-cyan-400 animate-ping",
          textCls: "text-cyan-400",
          label: "TIER 0: RAW INPUTS [HAVE]",
        }
      : tierIndex === 1
      ? {
          widthCls: "w-72",
          gapCls: "gap-8",
          dotCls: "bg-amber-400",
          textCls: "text-amber-400",
          label: "TIER 1: SUB-ASSEMBLIES",
        }
      : {
          widthCls: "w-72",
          gapCls: "gap-8",
          dotCls: "bg-indigo-400",
          textCls: "text-indigo-400",
          label: "TIER 2: INTEGRATION / TUNING",
        };

  return (
    <div className={`${headerMeta.widthCls} flex flex-col justify-around py-4`}>
      <div
        className={`text-xs uppercase font-mono tracking-widest ${headerMeta.textCls} font-bold flex items-center gap-1.5 mb-2 pl-2`}
      >
        <span className={`w-2 h-2 rounded-full ${headerMeta.dotCls}`} />
        {headerMeta.label}
      </div>

      <div className={`flex flex-col ${headerMeta.gapCls}`}>
        {nodes.map((node) => {
          const styles = getStatusStyles(node.status);
          return (
            <div
              key={node.id}
              id={`dag_node_${node.id}`}
              data-testid={`dag-node-${node.id}`}
              style={getOffsetStyle(node.id)}
              onPointerDown={(e) => onPointerDown(node.id, e)}
              onPointerMove={(e) => onPointerMove(node.id, e)}
              onPointerUp={(e) => onPointerUp(node.id, e)}
              className="cursor-grab active:cursor-grabbing group flex flex-col relative select-none"
            >
              {tierIndex === 0 && (
                <div className="relative -mb-3 ml-3 z-30 flex items-center">
                  <span className="bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 text-white font-black text-[10px] px-3 py-0.5 rounded-full uppercase tracking-wider shadow-md -rotate-2 flex items-center gap-1 border border-white font-mono">
                    <Rocket size={11} /> START!!
                  </span>
                </div>
              )}

              {tierIndex === 1 && (
                <div className="relative -mb-2.5 ml-4 z-30">
                  <span className="bg-gradient-to-r from-cyan-500 to-primary text-black font-black text-[10px] px-3 py-0.5 rounded-full uppercase tracking-wider shadow-md border border-white/40 flex items-center gap-1 font-mono">
                    <GitMerge size={11} /> SUB-ASSEMBLY
                  </span>
                </div>
              )}

              {tierIndex === 2 && (
                <div className="relative -mb-2.5 ml-4 z-30">
                  <span className="bg-gradient-to-r from-indigo-400 to-purple-400 text-black font-black text-[10px] px-3 py-0.5 rounded-full uppercase tracking-wider shadow-md border border-white/40 flex items-center gap-1 font-mono">
                    <FlaskConical size={11} /> SYNTHESIS JUNCTION
                  </span>
                </div>
              )}

              <div
                className={`w-full bg-[#0E1322]/95 backdrop-blur-xl p-3.5 rounded-2xl border ${styles.card} group-hover:scale-105 group-hover:brightness-110 transition-all duration-200`}
              >
                {tierIndex !== 0 && node.image && (
                  <div
                    className={`relative w-full ${
                      tierIndex === 2 ? "h-24" : "h-20"
                    } rounded-xl overflow-hidden mb-2 border border-white/10`}
                  >
                    <img
                      src={node.image}
                      alt={node.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0C101C] via-transparent to-transparent" />
                    {tierIndex === 1 ? (
                      <div className="absolute bottom-1 left-2 text-[10px] font-bold text-white font-mono">
                        {node.status === "PROGRESS" ? "IN PROGRESS" : "VERIFIED"}
                      </div>
                    ) : (
                      <div className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full bg-black/80 border border-white/10 text-[9px] font-mono text-cyan-400 font-bold">
                        REACTION 46-C
                      </div>
                    )}
                  </div>
                )}

                {tierIndex === 0 ? (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`px-2 py-0.5 rounded-full border ${styles.badge} font-mono font-bold text-[9px] uppercase tracking-wider`}
                      >
                        {node.statusText}
                      </span>
                      <div
                        className={`w-7 h-7 rounded-lg ${styles.iconBg} flex items-center justify-center font-bold text-xs`}
                      >
                        ⚡
                      </div>
                    </div>
                    <h4 className="text-xs font-black text-white leading-tight group-hover:text-cyan-400 transition">
                      {node.title}
                    </h4>
                  </>
                ) : (
                  <div className="flex items-center justify-between mb-1.5">
                    <h4 className="text-xs font-black text-white leading-tight group-hover:text-cyan-400 transition">
                      {node.title}
                    </h4>
                    <span
                      className={`px-2 py-0.5 rounded-full border ${styles.badge} font-mono font-bold text-[9px] uppercase`}
                    >
                      {node.statusText}
                    </span>
                  </div>
                )}

                <p className="text-[11px] text-zinc-400 font-mono mt-1 leading-snug">{node.sub}</p>

                <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                  {tierIndex === 0 && (
                    <>
                      <span className="flex items-center gap-1 text-cyan-400 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> VERIFIED
                      </span>
                      <span className="text-white/70">PACE: [P]</span>
                    </>
                  )}
                  {tierIndex === 1 && (
                    <>
                      <span className="text-amber-400 font-semibold flex items-center gap-1">
                        <ArrowRight size={11} /> Converging
                      </span>
                      <span className="text-cyan-400 font-bold">FRAGO Ready</span>
                    </>
                  )}
                  {tierIndex === 2 && (
                    <>
                      <span className="text-rose-400 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />{" "}
                        {node.status === "BLOCKED" ? "RESTRICTIONS" : "ACTIVE"}
                      </span>
                      <span className="text-white font-bold">CLICK TO AUDIT</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
