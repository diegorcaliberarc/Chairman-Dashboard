"use client";

import React, { useState } from "react";
import { DagNode, GoalClimax, ChecklistItem } from "@/lib/synthesisRoadmapTypes";
import { ShieldCheck, X } from "lucide-react";
import { DossierSyncFooter } from "./DossierSyncFooter";

interface TacticalDossierModalProps {
  isOpen: boolean;
  node: DagNode | null;
  goalNode: GoalClimax | null;
  onClose: () => void;
  onToggleCheck: (checkId: string) => void;
  onAddCheck?: (label: string) => void;
  onVerifyStep?: () => void;
}

export function TacticalDossierModal({
  isOpen,
  node,
  goalNode,
  onClose,
  onToggleCheck,
  onAddCheck,
  onVerifyStep,
}: TacticalDossierModalProps) {
  const [newCheckInput, setNewCheckInput] = useState("");

  if (!isOpen || (!node && !goalNode)) return null;

  const isGoal = !node && !!goalNode;
  const title = (isGoal ? goalNode?.title : node?.title) || "Tactical Node";
  const tierLabel = isGoal
    ? "TIER 3 // GOAL CLIMAX"
    : `TIER ${node?.tier ?? 0} // ${
        node?.tier === 0 ? "RAW INPUT" : node?.tier === 1 ? "SUB-ASSEMBLY" : "INTEGRATION"
      }`;
  const statusText = isGoal ? "CLIMAX DESTINATION" : node?.statusText || "100% READY";

  const frago = isGoal
    ? {
        task: "Terminal Synthesis Convergence",
        purpose: goalNode?.desc || "Complete operational victory",
        window: "Continuous Execution",
      }
    : node?.frago || {
        task: "Standard Execution",
        purpose: "Advance operational milestone",
        window: "Daily",
      };

  const pace = isGoal
    ? {
        p: "Permanent sovereign maintenance protocol",
        a: "Aggressive 2-week tuneup sprint",
        c: "Baseline defensive floor",
        e: "Emergency reset safeguard",
      }
    : node?.pace || {
        p: "Standard primary protocol",
        a: "Alternative agile variation",
        c: "Contingency minimum floor",
        e: "Emergency recovery lockout",
      };

  const res = isGoal
    ? {
        have: goalNode?.metric1 || "Target locked",
        need: goalNode?.metric2 || "Zero deficit",
        blocked: "None (Clear)",
      }
    : node?.res || {
        have: "Tools and baseline ready",
        need: "Daily execution focus",
        blocked: "None",
      };

  const checks: ChecklistItem[] = isGoal
    ? [
        { id: "g_c1", label: "Compliance & telemetry verified", completed: true },
        { id: "g_c2", label: "Cross-domain life synergy active", completed: true },
        { id: "g_c3", label: "Weekly progress snapshot archived", completed: false },
      ]
    : node?.checks || [];

  const handleAddCheckSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCheckInput.trim()) return;
    onAddCheck?.(newCheckInput.trim());
    setNewCheckInput("");
  };

  const completedCount = checks.filter((c) => c.completed).length;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all duration-200 select-none"
    >
      <div
        data-testid="pardo-fmea-dossier-drawer"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-[#0D1220]/95 border-2 border-cyan-400/50 rounded-3xl p-6 shadow-2xl glow-cyan flex flex-col gap-4 relative max-h-[92vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-400 to-indigo-500 p-0.5 shadow-lg shadow-cyan-400/30 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#080B14] rounded-2xl flex items-center justify-center text-cyan-400 font-bold text-xl">
                ⚡
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase font-mono bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
                  {tierLabel}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {statusText}
                </span>
              </div>
              <h3
                data-testid="pardo-fmea-dossier-title"
                className="text-base sm:text-lg font-black text-white"
              >
                {title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            data-testid="pardo-fmea-close-btn"
            aria-label="Close Tactical Dossier"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="bg-[#05070E]/80 p-3.5 rounded-2xl border border-white/5 flex flex-col gap-2">
          <div className="text-[10px] font-black uppercase tracking-wider text-amber-400 font-mono flex items-center gap-1.5">
            <span>⭐</span> FRAGO: OPERATIONAL DIRECTIVE
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div>
              <span className="text-zinc-400 text-[10px] block font-mono">MISSION TASK:</span>
              <span className="text-white font-semibold">{frago.task}</span>
            </div>
            <div>
              <span className="text-zinc-400 text-[10px] block font-mono">PURPOSE:</span>
              <span className="text-white font-semibold">{frago.purpose}</span>
            </div>
            <div>
              <span className="text-zinc-400 text-[10px] block font-mono">EXECUTION WINDOW:</span>
              <span className="text-cyan-400 font-mono font-bold">{frago.window}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="text-[10px] font-black uppercase tracking-wider text-cyan-400 font-mono flex items-center gap-1.5">
            <ShieldCheck size={13} /> PACE CONTINGENCY FALLBACK PROTOCOL
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-cyan-400/30">
              <span className="text-cyan-400 font-black block text-[10px] mb-0.5">[P] PRIMARY</span>
              <span className="text-white text-[11px] leading-tight block">{pace.p}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
              <span className="text-amber-400 font-black block text-[10px] mb-0.5">
                [A] ALTERNATE
              </span>
              <span className="text-zinc-300 text-[11px] leading-tight block">{pace.a}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
              <span className="text-indigo-400 font-black block text-[10px] mb-0.5">
                [C] CONTINGENCY
              </span>
              <span className="text-zinc-300 text-[11px] leading-tight block">{pace.c}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
              <span className="text-rose-400 font-black block text-[10px] mb-0.5">
                [E] EMERGENCY
              </span>
              <span className="text-zinc-300 text-[11px] leading-tight block">{pace.e}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-[10px] font-bold text-emerald-400 font-mono block">
              VERIFIED [HAVE]:
            </span>
            <span className="text-white font-medium text-[11px] block mt-0.5">{res.have}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <span className="text-[10px] font-bold text-amber-400 font-mono block">
              IN MOTION [NEED]:
            </span>
            <span className="text-white font-medium text-[11px] block mt-0.5">{res.need}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <span className="text-[10px] font-bold text-rose-400 font-mono block">
              CONSTRAINTS [BLOCKED]:
            </span>
            <span className="text-white font-medium text-[11px] block mt-0.5">{res.blocked}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-[10px] font-black uppercase tracking-wider text-zinc-400 font-mono flex items-center justify-between">
            <span>ACTIONABLE EXECUTION DRILLS</span>
            <span className="text-cyan-400 font-mono text-[10px]">
              {completedCount} of {checks.length} Completed
            </span>
          </div>

          <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
            {checks.map((chk) => (
              <label
                key={chk.id}
                className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 cursor-pointer transition text-xs"
              >
                <input
                  type="checkbox"
                  checked={chk.completed}
                  onChange={() => onToggleCheck(chk.id)}
                  className="rounded border-white/20 bg-black text-cyan-400 focus:ring-cyan-400 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                />
                <span
                  className={`font-medium ${
                    chk.completed ? "line-through text-zinc-500" : "text-white"
                  }`}
                >
                  {chk.label}
                </span>
              </label>
            ))}
          </div>

          <form onSubmit={handleAddCheckSubmit} className="flex items-center gap-2 mt-1">
            <input
              type="text"
              data-testid="pardo-fmea-add-drill-input"
              value={newCheckInput}
              onChange={(e) => setNewCheckInput(e.target.value)}
              placeholder="+ Add drill or task..."
              className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              data-testid="pardo-fmea-add-drill-btn"
              disabled={!newCheckInput.trim()}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs disabled:opacity-40 transition"
            >
              Add
            </button>
          </form>
        </div>

        <DossierSyncFooter
          title={title}
          checks={checks}
          domain={node?.domain || "all"}
          fragoWindow={frago.window}
          nodeImage={node?.image}
          onClose={onClose}
          onVerifyStep={onVerifyStep}
        />
      </div>
    </div>
  );
}
