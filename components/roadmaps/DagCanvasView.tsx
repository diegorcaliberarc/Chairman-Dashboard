"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { StrategicTree, DagNode, NodeStatus } from "@/lib/synthesisRoadmapTypes";
import { Sparkles, CheckCircle2, AlertCircle, ArrowRight, Award, Rocket, GitMerge, FlaskConical, Layers } from "lucide-react";

interface DagCanvasViewProps {
  tree: StrategicTree;
  zoomScale: number;
  onNodeClick: (nodeId: string) => void;
  onLockGoal?: () => void;
}

export function DagCanvasView({ tree, zoomScale, onNodeClick, onLockGoal }: DagCanvasViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgPaths, setSvgPaths] = useState<
    Array<{
      d: string;
      color: string;
      marker: string;
      label?: string;
      midX?: number;
      midY?: number;
    }>
  >([]);

  // Miro-style freeform drag offsets per node ID
  const [nodeOffsets, setNodeOffsets] = useState<Record<string, { x: number; y: number }>>({});
  const dragStateRef = useRef<{
    nodeId: string;
    startClientX: number;
    startClientY: number;
    origX: number;
    origY: number;
    moved: boolean;
  } | null>(null);

  const handleNodePointerDown = (nodeId: string, e: React.PointerEvent) => {
    // Allow dragging from anywhere on the card except explicit buttons
    if ((e.target as HTMLElement).closest("button")) return;
    const cur = nodeOffsets[nodeId] || { x: 0, y: 0 };
    dragStateRef.current = {
      nodeId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      origX: cur.x,
      origY: cur.y,
      moved: false,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleNodePointerMove = (nodeId: string, e: React.PointerEvent) => {
    const ds = dragStateRef.current;
    if (!ds || ds.nodeId !== nodeId) return;
    const dx = (e.clientX - ds.startClientX) / zoomScale;
    const dy = (e.clientY - ds.startClientY) / zoomScale;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      ds.moved = true;
    }
    if (ds.moved) {
      setNodeOffsets((prev) => ({
        ...prev,
        [nodeId]: { x: ds.origX + dx, y: ds.origY + dy },
      }));
    }
  };

  const handleNodePointerUp = (nodeId: string, e: React.PointerEvent) => {
    const ds = dragStateRef.current;
    if (!ds || ds.nodeId !== nodeId) return;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    const wasDragged = ds.moved;
    dragStateRef.current = null;
    if (!wasDragged) {
      onNodeClick(nodeId);
    }
  };

  const getOffsetStyle = (nodeId: string): React.CSSProperties => {
    const off = nodeOffsets[nodeId];
    if (!off || (off.x === 0 && off.y === 0)) return {};
    return { transform: `translate3d(${off.x}px, ${off.y}px, 0)`, zIndex: 40 };
  };

  // Function to calculate smooth bezier curves between connected nodes
  const calculateConnections = useCallback(() => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const paths: Array<{
      d: string;
      color: string;
      marker: string;
      label?: string;
      midX?: number;
      midY?: number;
    }> = [];

    tree.arrows.forEach((conn) => {
      const fromEl = document.getElementById(`dag_node_${conn.from}`);
      const toEl =
        conn.to === "goal"
          ? document.getElementById("dag_node_goal")
          : document.getElementById(`dag_node_${conn.to}`);

      if (!fromEl || !toEl) return;

      const fromRect = fromEl.getBoundingClientRect();
      const toRect = toEl.getBoundingClientRect();

      // Relative coordinates accounting for container position and zoom scale
      const startX = (fromRect.right - containerRect.left) / zoomScale;
      const startY = (fromRect.top + fromRect.height / 2 - containerRect.top) / zoomScale;
      const endX = (toRect.left - containerRect.left) / zoomScale;
      const endY = (toRect.top + toRect.height / 2 - containerRect.top) / zoomScale;

      const dx = endX - startX;
      const cp1X = startX + dx * 0.45;
      const cp1Y = startY;
      const cp2X = startX + dx * 0.55;
      const cp2Y = endY;

      const d = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;

      paths.push({
        d,
        color: conn.color,
        marker:
          conn.color === "amber"
            ? "url(#arrowAmber)"
            : conn.color === "gold"
            ? "url(#arrowGoldBig)"
            : "url(#arrowCyan)",
        label: conn.label,
        midX: (startX + endX) / 2,
        midY: (startY + endY) / 2 - 12,
      });
    });

    setSvgPaths(paths);
  }, [tree, zoomScale, nodeOffsets]);

  useEffect(() => {
    const timer = setTimeout(calculateConnections, 20);
    window.addEventListener("resize", calculateConnections);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", calculateConnections);
    };
  }, [calculateConnections]);

  const getStatusStyles = (status: NodeStatus) => {
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
  };

  return (
    <div
      data-testid="dag-canvas-view"
      className="flex-1 relative bg-[#060911] overflow-x-auto min-h-[820px] flex items-stretch p-6 sm:p-8 select-none blueprint-dots"
    >
      {/* 1. Ambient Background Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-20 w-[550px] h-[550px] bg-cyan-500/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 left-1/2 w-[600px] h-[450px] bg-amber-500/10 rounded-full blur-[150px]" />
        <div className="absolute -bottom-32 right-20 w-[550px] h-[550px] bg-cyan-400/10 rounded-full blur-[140px]" />
      </div>

      {/* 2. Floating Legend Bar */}
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
        {Object.keys(nodeOffsets).length > 0 && (
          <button
            type="button"
            onClick={() => setNodeOffsets({})}
            className="ml-2 px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/35 hover:bg-cyan-500/30 transition"
          >
            Reset Layout
          </button>
        )}
      </div>

      {/* 3. Scalable Inner DAG Canvas */}
      <div
        ref={containerRef}
        style={{ transform: `scale(${zoomScale})` }}
        className="relative w-[1840px] h-[780px] mx-auto transition-transform duration-200 origin-top-left"
      >
        {/* SVG Dynamic Conduits Layer */}
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

        {/* 4 Multi-Tier Columns of the DAG */}
        <div className="relative z-20 w-full h-full flex justify-between items-stretch">
          {/* TIER 0: START / RAW INPUTS [HAVE] */}
          <div className="w-64 flex flex-col justify-around py-4">
            <div className="text-xs uppercase font-mono tracking-widest text-cyan-400 font-bold flex items-center gap-1.5 mb-2 pl-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              TIER 0: RAW INPUTS [HAVE]
            </div>

            <div className="flex flex-col gap-6">
              {tree.tier0.map((node) => {
                const styles = getStatusStyles(node.status);
                return (
                  <div
                    key={node.id}
                    id={`dag_node_${node.id}`}
                    data-testid={`dag-node-${node.id}`}
                    style={getOffsetStyle(node.id)}
                    onPointerDown={(e) => handleNodePointerDown(node.id, e)}
                    onPointerMove={(e) => handleNodePointerMove(node.id, e)}
                    onPointerUp={(e) => handleNodePointerUp(node.id, e)}
                    className="cursor-grab active:cursor-grabbing group flex flex-col relative select-none"
                  >
                    {/* Dr. Stone START!! Comic Tag */}
                    <div className="relative -mb-3 ml-3 z-30 flex items-center">
                      <span className="bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 text-white font-black text-[10px] px-3 py-0.5 rounded-full uppercase tracking-wider shadow-md -rotate-2 flex items-center gap-1 border border-white font-mono">
                        <Rocket size={11} /> START!!
                      </span>
                    </div>

                    {/* Card Body */}
                    <div
                      className={`w-full bg-[#0E1322]/95 backdrop-blur-xl p-3.5 rounded-2xl border ${styles.card} group-hover:scale-105 group-hover:brightness-110 transition-all duration-200`}
                    >
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
                      <p className="text-[11px] text-zinc-400 font-mono mt-1 leading-snug">
                        {node.sub}
                      </p>

                      <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                        <span className="flex items-center gap-1 text-cyan-400 font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> VERIFIED
                        </span>
                        <span className="text-white/70">PACE: [P]</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TIER 1: INTERMEDIATE SUB-ASSEMBLIES */}
          <div className="w-72 flex flex-col justify-around py-4">
            <div className="text-xs uppercase font-mono tracking-widest text-amber-400 font-bold flex items-center gap-1.5 mb-2 pl-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              TIER 1: SUB-ASSEMBLIES
            </div>

            <div className="flex flex-col gap-8">
              {tree.tier1.map((node) => {
                const styles = getStatusStyles(node.status);
                return (
                  <div
                    key={node.id}
                    id={`dag_node_${node.id}`}
                    data-testid={`dag-node-${node.id}`}
                    style={getOffsetStyle(node.id)}
                    onPointerDown={(e) => handleNodePointerDown(node.id, e)}
                    onPointerMove={(e) => handleNodePointerMove(node.id, e)}
                    onPointerUp={(e) => handleNodePointerUp(node.id, e)}
                    className="cursor-grab active:cursor-grabbing group flex flex-col relative select-none"
                  >
                    <div className="relative -mb-2.5 ml-4 z-30">
                      <span className="bg-gradient-to-r from-cyan-500 to-primary text-black font-black text-[10px] px-3 py-0.5 rounded-full uppercase tracking-wider shadow-md border border-white/40 flex items-center gap-1 font-mono">
                        <GitMerge size={11} /> SUB-ASSEMBLY
                      </span>
                    </div>

                    <div
                      className={`w-full bg-[#0E1322]/95 backdrop-blur-xl p-3.5 rounded-2xl border ${styles.card} group-hover:scale-105 group-hover:brightness-110 transition-all duration-200`}
                    >
                      {node.image && (
                        <div className="relative w-full h-20 rounded-xl overflow-hidden mb-2 border border-white/10">
                          <img
                            src={node.image}
                            alt={node.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0C101C] via-transparent to-transparent" />
                          <div className="absolute bottom-1 left-2 text-[10px] font-bold text-white font-mono">
                            {node.status === "PROGRESS" ? "IN PROGRESS" : "VERIFIED"}
                          </div>
                        </div>
                      )}

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

                      <p className="text-[11px] text-zinc-400 font-mono leading-snug">{node.sub}</p>

                      <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-400">
                        <span className="text-amber-400 font-mono font-semibold flex items-center gap-1">
                          <ArrowRight size={11} /> Converging
                        </span>
                        <span className="font-mono text-cyan-400 font-bold">FRAGO Ready</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TIER 2: ADVANCED INTEGRATION & SYNTHESIS */}
          <div className="w-72 flex flex-col justify-around py-4">
            <div className="text-xs uppercase font-mono tracking-widest text-indigo-400 font-bold flex items-center gap-1.5 mb-2 pl-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              TIER 2: INTEGRATION / TUNING
            </div>

            <div className="flex flex-col gap-8">
              {tree.tier2.map((node) => {
                const styles = getStatusStyles(node.status);
                return (
                  <div
                    key={node.id}
                    id={`dag_node_${node.id}`}
                    data-testid={`dag-node-${node.id}`}
                    style={getOffsetStyle(node.id)}
                    onPointerDown={(e) => handleNodePointerDown(node.id, e)}
                    onPointerMove={(e) => handleNodePointerMove(node.id, e)}
                    onPointerUp={(e) => handleNodePointerUp(node.id, e)}
                    className="cursor-grab active:cursor-grabbing group flex flex-col relative select-none"
                  >
                    <div className="relative -mb-2.5 ml-4 z-30">
                      <span className="bg-gradient-to-r from-indigo-400 to-purple-400 text-black font-black text-[10px] px-3 py-0.5 rounded-full uppercase tracking-wider shadow-md border border-white/40 flex items-center gap-1 font-mono">
                        <FlaskConical size={11} /> SYNTHESIS JUNCTION
                      </span>
                    </div>

                    <div
                      className={`w-full bg-[#0E1322]/95 backdrop-blur-xl p-3.5 rounded-2xl border ${styles.card} group-hover:scale-105 group-hover:brightness-110 transition-all duration-200`}
                    >
                      {node.image && (
                        <div className="relative w-full h-24 rounded-xl overflow-hidden mb-2 border border-white/10">
                          <img
                            src={node.image}
                            alt={node.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0C101C] via-transparent to-transparent" />
                          <div className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full bg-black/80 border border-white/10 text-[9px] font-mono text-cyan-400 font-bold">
                            REACTION 46-C
                          </div>
                        </div>
                      )}

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

                      <p className="text-[11px] text-zinc-400 font-mono leading-snug">{node.sub}</p>

                      <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                        <span className="text-rose-400 font-mono font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />{" "}
                          {node.status === "BLOCKED" ? "RESTRICTIONS" : "ACTIVE"}
                        </span>
                        <span className="text-white font-mono font-bold">CLICK TO AUDIT</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TIER 3: JAGGED STARBURST GOAL!! CLIMAX */}
          <div className="w-80 flex flex-col justify-center py-4">
            <div className="text-xs uppercase font-mono tracking-widest text-amber-400 font-black flex items-center gap-1.5 mb-2 pl-2">
              <span className="text-amber-400">🏆</span> TIER 3: FINAL DESTINATION
            </div>

            <div
              id="dag_node_goal"
              data-testid="dag-node-goal"
              style={getOffsetStyle("goal")}
              onPointerDown={(e) => handleNodePointerDown("goal", e)}
              onPointerMove={(e) => handleNodePointerMove("goal", e)}
              onPointerUp={(e) => handleNodePointerUp("goal", e)}
              className="cursor-grab active:cursor-grabbing group flex flex-col items-center relative w-full select-none"
            >
              {/* Explosive Dr. Stone GOAL!! Comic Pill */}
              <div className="relative -mb-6 z-30">
                <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-cyan-400 text-white font-black text-base px-6 py-2 rounded-full uppercase tracking-widest shadow-2xl shadow-amber-500/50 rotate-2 flex items-center gap-2 border-2 border-white font-mono">
                  <span className="animate-bounce">🏆</span> GOAL!!
                </div>
              </div>

              {/* Goal Glowing Capsule */}
              <div className="w-full bg-[#0E1322]/95 backdrop-blur-2xl p-6 pt-9 rounded-[2.5rem] border-2 border-amber-400 glow-goal-burst flex flex-col items-center text-center relative overflow-hidden group-hover:scale-105 transition-all duration-300 shadow-2xl">
                <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />

                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-200 p-0.5 shadow-xl shadow-amber-500/40 mb-3 flex items-center justify-center">
                  <div className="w-full h-full rounded-full bg-[#0A0D18] flex items-center justify-center text-amber-400 text-2xl">
                    ⭐
                  </div>
                </div>

                <span className="px-3 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black uppercase tracking-wider mb-2 font-mono">
                  {tree.tier3.badge}
                </span>

                <h3 className="text-xl font-black text-white leading-tight mb-1.5">
                  {tree.tier3.title}
                </h3>

                <p className="text-xs text-zinc-400 leading-relaxed mb-4 px-1">
                  {tree.tier3.desc}
                </p>

                <div className="w-full bg-[#060911]/80 p-3 rounded-2xl flex items-center justify-between mb-4 border border-white/10 text-xs">
                  <div className="text-left font-mono">
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">
                      TRAJECTORY
                    </span>
                    <span className="text-sm font-black text-amber-400">
                      {tree.tier3.rate} SYNTHESIZED
                    </span>
                  </div>
                  <div className="text-right font-mono text-[10px] text-zinc-400">
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
                  className="w-full py-2.5 rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-cyan-400 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/30 hover:brightness-110 active:scale-95 transition flex items-center justify-center gap-1.5"
                >
                  <span>⚡ LOCK VECTOR COMPLETE</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
