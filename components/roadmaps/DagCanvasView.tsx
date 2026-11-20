"use client";

import React from "react";
import { StrategicTree } from "@/lib/synthesisRoadmapTypes";
import { useDagCanvasDragAndArrows } from "./hooks/useDagCanvasDragAndArrows";
import { DagTierColumn } from "./DagTierColumn";
import { DagGoalApexCard } from "./DagGoalApexCard";

interface DagCanvasViewProps {
  tree: StrategicTree;
  zoomScale: number;
  onNodeClick: (nodeId: string) => void;
  onLockGoal?: () => void;
}

export function DagCanvasView({
  tree,
  zoomScale,
  onNodeClick,
  onLockGoal,
}: DagCanvasViewProps) {
  const {
    containerRef,
    svgPaths,
    hasOffsets,
    resetOffsets,
    getOffsetStyle,
    handleNodePointerDown,
    handleNodePointerMove,
    handleNodePointerUp,
  } = useDagCanvasDragAndArrows(tree, zoomScale, onNodeClick);

  return (
    <div
      data-testid="dag-canvas-view"
      className="flex-1 relative bg-[#060911] overflow-x-auto min-h-[820px] flex items-stretch p-6 sm:p-8 select-none blueprint-dots"
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-20 w-[550px] h-[550px] bg-cyan-500/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 left-1/2 w-[600px] h-[450px] bg-amber-500/10 rounded-full blur-[150px]" />
        <div className="absolute -bottom-32 right-20 w-[550px] h-[550px] bg-cyan-400/10 rounded-full blur-[140px]" />
      </div>

      <div className="absolute top-4 left-6 sm:left-8 z-30 flex items-center gap-3 bg-[#0F1424]/90 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-full shadow-2xl text-[11px] font-mono">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span className="text-emerald-400 font-bold">HAVE</span>
        </div>
        <span className="text-white/20">|</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-amber-300 font-bold">IN PROGRESS</span>
        </div>
        <span className="text-white/20">|</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
          <span className="text-rose-400 font-bold">BLOCKED</span>
        </div>
        <span className="text-white/20 hidden md:inline">|</span>
        <span className="text-zinc-400 font-medium hidden md:inline">
          Drag any card freely like Miro · Click to open FRAGO &amp; PACE Dossier
        </span>
        {hasOffsets && (
          <button
            type="button"
            data-testid="dag-reset-layout-btn"
            onClick={resetOffsets}
            className="ml-2 px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/35 hover:bg-cyan-500/30 transition"
          >
            Reset Layout
          </button>
        )}
      </div>

      <div
        ref={containerRef}
        style={{ transform: `scale(${zoomScale})` }}
        className="relative w-[1840px] h-[780px] mx-auto transition-transform duration-200 origin-top-left"
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
          <defs>
            <marker id="arrowAmber" markerHeight="12" markerWidth="12" orient="auto" refX="9" refY="6">
              <path d="M 0 1 L 11 6 L 0 11 Z" fill="#f59e0b" stroke="#ffffff" strokeWidth="1" />
            </marker>
            <marker id="arrowCyan" markerHeight="12" markerWidth="12" orient="auto" refX="9" refY="6">
              <path d="M 0 1 L 11 6 L 0 11 Z" fill="#00f0ff" stroke="#ffffff" strokeWidth="1" />
            </marker>
            <marker id="arrowGoldBig" markerHeight="16" markerWidth="16" orient="auto" refX="12" refY="7">
              <path d="M 0 1 L 13 7 L 0 13 Z" fill="#fbbf24" stroke="#ffffff" strokeWidth="1.5" />
            </marker>
            <linearGradient id="gradAmber" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
            <linearGradient id="gradCyan" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00f0ff" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>

          {svgPaths.map((p, idx) => (
            <React.Fragment key={idx}>
              <path
                d={p.d}
                fill="none"
                stroke={
                  p.color === "amber"
                    ? "url(#gradAmber)"
                    : p.color === "gold"
                    ? "#fbbf24"
                    : "url(#gradCyan)"
                }
                strokeWidth={p.color === "gold" ? 5 : 3.5}
                strokeLinecap="round"
                strokeDasharray="12 6"
                markerEnd={p.marker}
                className={p.color === "amber" ? "flow-arrow-amber" : "flow-arrow-cyan"}
              />

              {p.label && p.midX !== undefined && p.midY !== undefined && (
                <g transform={`translate(${p.midX - 44}, ${p.midY - 10})`}>
                  <rect
                    width="88"
                    height="18"
                    rx="9"
                    fill="#070a13"
                    stroke={p.color === "amber" ? "#f59e0b" : "#00f0ff"}
                    strokeWidth="1.5"
                    className="comic-junction-pill"
                  />
                  <text
                    x="44"
                    y="12"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="8.5px"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {p.label}
                  </text>
                </g>
              )}
            </React.Fragment>
          ))}
        </svg>

        <div className="relative z-20 w-full h-full flex justify-between items-stretch">
          <DagTierColumn
            tierIndex={0}
            nodes={tree.tier0}
            getOffsetStyle={getOffsetStyle}
            onPointerDown={handleNodePointerDown}
            onPointerMove={handleNodePointerMove}
            onPointerUp={handleNodePointerUp}
          />
          <DagTierColumn
            tierIndex={1}
            nodes={tree.tier1}
            getOffsetStyle={getOffsetStyle}
            onPointerDown={handleNodePointerDown}
            onPointerMove={handleNodePointerMove}
            onPointerUp={handleNodePointerUp}
          />
          <DagTierColumn
            tierIndex={2}
            nodes={tree.tier2}
            getOffsetStyle={getOffsetStyle}
            onPointerDown={handleNodePointerDown}
            onPointerMove={handleNodePointerMove}
            onPointerUp={handleNodePointerUp}
          />
          <DagGoalApexCard
            goal={tree.tier3}
            offsetStyle={getOffsetStyle("goal")}
            onPointerDown={handleNodePointerDown}
            onPointerMove={handleNodePointerMove}
            onPointerUp={handleNodePointerUp}
            onLockGoal={onLockGoal}
          />
        </div>
      </div>
    </div>
  );
}
