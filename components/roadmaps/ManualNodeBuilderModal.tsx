"use client";

import React, { useState } from "react";
import { DagNode, NodeStatus, StrategicDomain } from "@/lib/synthesisRoadmapTypes";
import { resolveNodeVisual } from "@/lib/roadmapVisuals";
import { X, Plus, Layers, ShieldCheck, Check } from "lucide-react";

interface ManualNodeBuilderModalProps {
  isOpen: boolean;
  domain: StrategicDomain;
  onClose: () => void;
  onSaveNode: (node: DagNode) => void;
}

export function ManualNodeBuilderModal({
  isOpen,
  domain,
  onClose,
  onSaveNode,
}: ManualNodeBuilderModalProps) {
  const [tier, setTier] = useState<0 | 1 | 2>(0);
  const [title, setTitle] = useState("");
  const [sub, setSub] = useState("");
  const [status, setStatus] = useState<NodeStatus>("HAVE");
  const [task, setTask] = useState("");
  const [purpose, setPurpose] = useState("");
  const [windowTime, setWindowTime] = useState("");

  const [paceP, setPaceP] = useState("");
  const [paceA, setPaceA] = useState("");
  const [paceC, setPaceC] = useState("");
  const [paceE, setPaceE] = useState("");

  const [resHave, setResHave] = useState("");
  const [resNeed, setResNeed] = useState("");
  const [resBlocked, setResBlocked] = useState("None");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newNode: DagNode = {
      id: `manual_${Date.now()}`,
      tier,
      domain,
      title: title.trim(),
      sub: sub.trim() || "Manual operational pod",
      status,
      statusText:
        status === "HAVE"
          ? "100% READY"
          : status === "PROGRESS"
          ? "IN PROGRESS"
          : "RESTRICTIONS",
      icon: tier === 0 ? "bolt" : tier === 1 ? "construction" : "biotech",
      image: resolveNodeVisual(title, sub, domain),
      frago: {
        task: task.trim() || title.trim(),
        purpose: purpose.trim() || "Operational execution directive",
        window: windowTime.trim() || "Daily",
      },
      pace: {
        p: paceP.trim() || "Standard primary execution protocol",
        a: paceA.trim() || "Alternative agile variation",
        c: paceC.trim() || "Contingency baseline floor",
        e: paceE.trim() || "Emergency reset safeguard",
      },
      res: {
        have: resHave.trim() || "Equipment verified",
        need: resNeed.trim() || "Daily focus",
        blocked: resBlocked.trim() || "None",
      },
      checks: [
        { id: `c_man_${Date.now()}_1`, label: "Execution step verified", completed: false },
      ],
    };

    onSaveNode(newNode);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-[#0C101C]/95 border-2 border-white/20 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 relative max-h-[92vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <h3 className="text-base font-black text-white">Manual Node Creator (Do It Yourself)</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 text-xs">
          {/* Tier Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-zinc-400 font-mono text-[10px] uppercase font-bold">
              Select DAG Tier:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTier(0)}
                className={`p-2.5 rounded-xl border text-center transition font-mono ${
                  tier === 0
                    ? "bg-cyan-400/20 border-cyan-400 text-cyan-300 font-bold"
                    : "bg-white/[0.04] border-white/5 text-zinc-400 hover:text-white"
                }`}
              >
                <div className="font-bold">Tier 0</div>
                <div className="text-[9px] opacity-75">Raw Inputs [HAVE]</div>
              </button>

              <button
                type="button"
                onClick={() => setTier(1)}
                className={`p-2.5 rounded-xl border text-center transition font-mono ${
                  tier === 1
                    ? "bg-amber-400/20 border-amber-400 text-amber-300 font-bold"
                    : "bg-white/[0.04] border-white/5 text-zinc-400 hover:text-white"
                }`}
              >
                <div className="font-bold">Tier 1</div>
                <div className="text-[9px] opacity-75">Sub-Assembly</div>
              </button>

              <button
                type="button"
                onClick={() => setTier(2)}
                className={`p-2.5 rounded-xl border text-center transition font-mono ${
                  tier === 2
                    ? "bg-indigo-400/20 border-indigo-400 text-indigo-300 font-bold"
                    : "bg-white/[0.04] border-white/5 text-zinc-400 hover:text-white"
                }`}
              >
                <div className="font-bold">Tier 2</div>
                <div className="text-[9px] opacity-75">Integration Junction</div>
              </button>
            </div>
          </div>

          {/* Title & Subtitle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="text-zinc-400 font-mono text-[10px] uppercase font-bold block mb-1">
                Node Title:
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Incline Smith Press..."
                className="w-full bg-[#05070E] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="text-zinc-400 font-mono text-[10px] uppercase font-bold block mb-1">
                Subtitle / Spec:
              </label>
              <input
                type="text"
                value={sub}
                onChange={(e) => setSub(e.target.value)}
                placeholder="e.g. Pyramid Overload 4x8..."
                className="w-full bg-[#05070E] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Status Radio */}
          <div>
            <label className="text-zinc-400 font-mono text-[10px] uppercase font-bold block mb-1">
              Readiness Status:
            </label>
            <div className="flex gap-2">
              {(["HAVE", "PROGRESS", "BLOCKED"] as NodeStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatus(st)}
                  className={`px-3 py-1.5 rounded-xl font-mono text-[11px] font-bold border transition ${
                    status === st
                      ? st === "HAVE"
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-400"
                        : st === "PROGRESS"
                        ? "bg-amber-500/20 text-amber-300 border-amber-400"
                        : "bg-rose-500/20 text-rose-400 border-rose-400"
                      : "bg-white/[0.04] text-zinc-400 border-white/5"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* FRAGO Inputs */}
          <div className="bg-[#05070E]/60 p-3 rounded-2xl border border-white/5 flex flex-col gap-2">
            <span className="text-amber-400 font-mono text-[10px] font-bold uppercase">
              FRAGO Directives:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="Mission Task..."
                className="bg-[#0A0D18] border border-white/10 rounded-xl px-2.5 py-1.5 text-white"
              />
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Purpose..."
                className="bg-[#0A0D18] border border-white/10 rounded-xl px-2.5 py-1.5 text-white"
              />
              <input
                type="text"
                value={windowTime}
                onChange={(e) => setWindowTime(e.target.value)}
                placeholder="Execution Window (e.g. 0800 HRS)..."
                className="bg-[#0A0D18] border border-white/10 rounded-xl px-2.5 py-1.5 text-white"
              />
            </div>
          </div>

          {/* PACE Fallback Inputs */}
          <div className="bg-[#05070E]/60 p-3 rounded-2xl border border-white/5 flex flex-col gap-2">
            <span className="text-cyan-400 font-mono text-[10px] font-bold uppercase">
              PACE Protocol (P / A / C / E):
            </span>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={paceP}
                onChange={(e) => setPaceP(e.target.value)}
                placeholder="[P] Primary plan..."
                className="bg-[#0A0D18] border border-white/10 rounded-xl px-2.5 py-1.5 text-white"
              />
              <input
                type="text"
                value={paceA}
                onChange={(e) => setPaceA(e.target.value)}
                placeholder="[A] Alternate variant..."
                className="bg-[#0A0D18] border border-white/10 rounded-xl px-2.5 py-1.5 text-white"
              />
              <input
                type="text"
                value={paceC}
                onChange={(e) => setPaceC(e.target.value)}
                placeholder="[C] Contingency floor..."
                className="bg-[#0A0D18] border border-white/10 rounded-xl px-2.5 py-1.5 text-white"
              />
              <input
                type="text"
                value={paceE}
                onChange={(e) => setPaceE(e.target.value)}
                placeholder="[E] Emergency safeguard..."
                className="bg-[#0A0D18] border border-white/10 rounded-xl px-2.5 py-1.5 text-white"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/10 text-zinc-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-cyan-400 text-black font-extrabold uppercase tracking-wider hover:bg-cyan-300"
            >
              Add Node to Canvas
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
