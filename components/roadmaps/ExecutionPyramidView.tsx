"use client";

import React, { useMemo } from "react";
import { StrategicTree, DagNode, NodeStatus } from "@/lib/synthesisRoadmapTypes";
import { ArrowRight, Trophy, CheckCircle2, Clock, AlertTriangle, Sparkles } from "lucide-react";
import {
  EditorialPyramidSilhouette,
  PyramidIllustrationKey,
  pickPyramidIllustration,
} from "./EditorialPyramidSilhouettes";

interface ExecutionPyramidViewProps {
  tree: StrategicTree;
  onNodeClick: (nodeId: string) => void;
  onLockGoal?: () => void;
}

interface PyramidPanelItem {
  id: string;
  targetNodeId: string;
  title: string;
  subtitle: string;
  status: NodeStatus;
  statusLabel: string;
  illustrationKey: PyramidIllustrationKey;
}

function statusPillStyle(status: NodeStatus) {
  if (status === "HAVE") {
    return {
      label: "DONE",
      cls: "bg-emerald-500/20 text-emerald-300 border-emerald-400/40",
      cardBorder: "border-emerald-500/40 hover:border-emerald-400",
      icon: <CheckCircle2 size={10} />,
    };
  }
  if (status === "BLOCKED") {
    return {
      label: "BLOCKED",
      cls: "bg-rose-500/20 text-rose-300 border-rose-400/40",
      cardBorder: "border-rose-500/45 hover:border-rose-400",
      icon: <AlertTriangle size={10} />,
    };
  }
  return {
    label: "IN PROGRESS",
    cls: "bg-amber-500/20 text-amber-300 border-amber-400/40",
    cardBorder: "border-amber-500/40 hover:border-amber-400",
    icon: <Clock size={10} />,
  };
}

export function ExecutionPyramidView({
  tree,
  onNodeClick,
  onLockGoal,
}: ExecutionPyramidViewProps) {
  const levels = useMemo(() => {
    const mapNode = (
      n: DagNode,
      fallbackIcon: PyramidIllustrationKey
    ): PyramidPanelItem => ({
      id: n.id,
      targetNodeId: n.id,
      title: n.title.toUpperCase(),
      subtitle: n.sub,
      status: n.status,
      statusLabel: n.statusText || n.status,
      illustrationKey: pickPyramidIllustration(`${n.title} ${n.sub}`, fallbackIcon),
    });

    const level1Items: PyramidPanelItem[] = tree.tier0.map((n, i) =>
      mapNode(n, i === 0 ? "log" : i === 1 ? "plan" : i === 2 ? "nutrition" : "calendar")
    );

    const level2Items: PyramidPanelItem[] = tree.tier1.map((n, i) =>
      mapNode(n, i === 0 ? "gym" : i === 1 ? "nutrition" : "action")
    );

    const level3Items: PyramidPanelItem[] = tree.tier2.map((n, i) =>
      mapNode(n, i === 0 ? "verify" : "calendar")
    );

    const anchorNode = tree.tier2[0] || tree.tier1[0] || tree.tier0[0];
    const secondAnchor = tree.tier2[1] || tree.tier1[1] || anchorNode;
    const totalChecks = [...tree.tier0, ...tree.tier1, ...tree.tier2].reduce(
      (acc, n) => acc + (n.checks?.length || 0),
      0
    );
    const doneChecks = [...tree.tier0, ...tree.tier1, ...tree.tier2].reduce(
      (acc, n) => acc + (n.checks?.filter((c) => c.completed).length || 0),
      0
    );
    const pct = totalChecks > 0 ? Math.round((doneChecks / totalChecks) * 100) : 0;

    const level4Items: PyramidPanelItem[] = [
      {
        id: "evolve_results",
        targetNodeId: anchorNode?.id || "goal",
        title: "SEE THE RESULTS & PROGRESS",
        subtitle: `${tree.tier3.metric1} · ${pct}% WBS Verified`,
        status: pct >= 70 ? "HAVE" : "PROGRESS",
        statusLabel: `${pct}% VERIFIED`,
        illustrationKey: "chart",
      },
      {
        id: "evolve_momentum",
        targetNodeId: secondAnchor?.id || "goal",
        title: "KEEP THE MOMENTUM GOING",
        subtitle: `${tree.audit.have} Have · ${tree.audit.acq} Active · ${tree.audit.blocked} Blocked`,
        status: tree.audit.blocked > 0 ? "BLOCKED" : "PROGRESS",
        statusLabel: tree.audit.blocked > 0 ? "CLEAR BLOCKERS" : "ON PACE",
        illustrationKey: "evolve",
      },
      {
        id: "evolve_adapt",
        targetNodeId: "goal",
        title: "MODIFY & ADAPT PLAN",
        subtitle: `PACE Guardrails & AAR Iteration → ${tree.tier3.rate}`,
        status: "PROGRESS",
        statusLabel: "ADAPT LOOP",
        illustrationKey: "plan",
      },
    ];

    return { level4Items, level3Items, level2Items, level1Items };
  }, [tree]);

  const renderTierFloor = (
    stepNum: string,
    bannerTitle: string,
    items: PyramidPanelItem[],
    widthClass: string,
    showAscendStairs = true
  ) => (
    <div
      data-testid={`pyramid-level-${Number(stepNum)}`}
      className={`relative mx-auto w-full ${widthClass} transition-all duration-300`}
    >
      <div className="hidden lg:flex flex-col items-end justify-center absolute -left-20 top-1/2 -translate-y-1/2 w-16 text-right select-none">
        <span className="text-[10px] font-mono tracking-widest text-amber-400/80 uppercase">
          STEP
        </span>
        <span className="text-2xl font-mono font-medium text-amber-300 leading-none">{stepNum}</span>
      </div>

      <div className="relative rounded-2xl border border-amber-400/30 bg-gradient-to-b from-[#161311]/95 via-[#0f1320]/95 to-[#0a0d17]/95 shadow-[0_14px_40px_rgba(0,0,0,0.55)] overflow-visible px-4 sm:px-6 pt-8 pb-5">
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 px-4 py-1 rounded-lg bg-gradient-to-r from-amber-500/95 via-amber-400 to-amber-500/95 text-zinc-950 font-mono text-[11px] sm:text-xs font-medium uppercase tracking-wider shadow-lg whitespace-nowrap max-w-[92%] truncate border border-amber-200/70">
          <span className="lg:hidden mr-1.5 opacity-75">STEP {stepNum} ·</span>
          {bannerTitle}
        </div>

        <div className="flex flex-col md:flex-row items-stretch justify-center gap-3">
          {items.map((item, idx) => {
            const st = statusPillStyle(item.status);
            return (
              <React.Fragment key={item.id}>
                <button
                  type="button"
                  data-testid={`pyramid-panel-${item.id}`}
                  onClick={() => onNodeClick(item.targetNodeId)}
                  className={`flex-1 min-w-0 text-left rounded-xl border ${st.cardBorder} bg-[#090d18]/90 hover:bg-[#11182b] p-3.5 transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between gap-2.5 group`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] font-mono text-amber-400/80 uppercase tracking-wider">
                      PANEL {idx + 1}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[9px] font-mono uppercase ${st.cls}`}
                    >
                      {st.icon}
                      {st.label}
                    </span>
                  </div>

                  <div className="py-1 text-amber-100/90 group-hover:text-amber-300 transition-colors">
                    <EditorialPyramidSilhouette kind={item.illustrationKey} />
                  </div>

                  <div className="text-center space-y-1">
                    <div className="text-[11px] font-mono font-medium uppercase tracking-wide text-amber-100 group-hover:text-white leading-snug">
                      {item.title}
                    </div>
                    <div className="text-[10px] font-mono text-zinc-400 line-clamp-2 leading-relaxed">
                      {item.subtitle}
                    </div>
                  </div>
                </button>

                {idx < items.length - 1 && (
                  <div className="flex items-center justify-center shrink-0 text-amber-400/80 py-1 md:py-0">
                    <ArrowRight size={18} className="rotate-90 md:rotate-0" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {showAscendStairs && (
          <div
            className="hidden md:flex items-center gap-1 absolute -top-4 right-5 z-20 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/40 text-[9px] font-mono text-amber-300 pointer-events-none"
            title="Ascend to next execution floor"
          >
            <span>▁▃▅▇</span>
            <span>▲</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div
      data-testid="execution-pyramid-view"
      className="w-full min-h-[820px] bg-gradient-to-b from-[#140d0a] via-[#090d18] to-[#060911] px-4 sm:px-8 lg:px-24 py-8 select-none overflow-x-hidden"
    >
      <div className="text-center max-w-3xl mx-auto mb-8 space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/35 text-amber-300 text-[10px] font-mono uppercase tracking-widest">
          <Sparkles size={11} />
          <span>The Pyramid of Execution · Live Synced with DAG</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif text-amber-100 tracking-tight">
          {tree.title}
        </h2>
        <p className="text-xs font-mono text-zinc-400">
          A sequential bottom-up story from foundation to mastery — click any panel to open its
          PARDO &amp; FMEA Dossier.
        </p>
      </div>

      <div className="max-w-6xl mx-auto flex flex-col items-center gap-7">
        <div data-testid="pyramid-level-5" className="relative w-full max-w-md mx-auto">
          <div className="hidden lg:flex flex-col items-end justify-center absolute -left-20 top-1/2 -translate-y-1/2 w-16 text-right select-none">
            <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase">
              STEP
            </span>
            <span className="text-2xl font-mono font-medium text-amber-300 leading-none">05</span>
          </div>

          <div
            data-testid="pyramid-panel-goal"
            onClick={() => onNodeClick("goal")}
            className="cursor-pointer group relative rounded-3xl border-2 border-amber-400/80 bg-gradient-to-b from-amber-500/25 via-amber-950/50 to-[#0e1322] p-6 text-center shadow-[0_0_50px_rgba(245,158,11,0.28)] hover:scale-[1.02] transition-all"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-400 text-zinc-950 font-mono text-[10px] font-medium uppercase tracking-wider mb-3">
              <Trophy size={12} />
              <span>LEVEL 5: COMPLETE — GOAL ACHIEVED</span>
            </div>

            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-200 flex items-center justify-center text-zinc-950 shadow-xl shadow-amber-500/40">
              <Trophy size={30} />
            </div>

            <h3 className="text-lg font-mono font-medium uppercase text-amber-100">
              {tree.tier3.title}
            </h3>
            <p className="text-xs text-zinc-300 mt-1 mb-4">{tree.tier3.desc}</p>

            <div className="flex items-center justify-center gap-3 text-[11px] font-mono text-amber-300 mb-4">
              <span>{tree.tier3.rate} SYNTHESIZED</span>
              <span>•</span>
              <span className="text-emerald-400">{tree.tier3.metric2}</span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onLockGoal?.();
              }}
              className="px-5 py-2 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-cyan-400 text-zinc-950 font-mono text-xs font-medium uppercase tracking-wider shadow-lg hover:brightness-110 transition"
            >
              ⚡ YOU ACTUALLY DID IT! LOCK COMPLETE
            </button>
          </div>
        </div>

        {renderTierFloor(
          "04",
          "LEVEL 4: EVOLVE — RESULTS & PROGRESS",
          levels.level4Items,
          "max-w-3xl",
          true
        )}
        {renderTierFloor(
          "03",
          "LEVEL 3: VERIFY — THE ROADMAP",
          levels.level3Items,
          "max-w-4xl",
          true
        )}
        {renderTierFloor(
          "02",
          "LEVEL 2: DAILY ACTION — THE WORK",
          levels.level2Items,
          "max-w-5xl",
          true
        )}
        {renderTierFloor(
          "01",
          "LEVEL 1: PREPARATION & FOUNDATION — SETTING UP",
          levels.level1Items,
          "max-w-6xl",
          false
        )}
      </div>
    </div>
  );
}
