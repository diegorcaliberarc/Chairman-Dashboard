"use client";

import React, { useState } from "react";
import { CommandPhase, SequenceType, PhaseStatus, ReferenceStripItem } from "@/lib/commandTypes";
import {
  ArrowRight,
  Plus,
  AlertOctagon,
  Layers,
  CheckCircle2,
  Clock,
  ExternalLink,
  Edit3,
  Trash2,
  Calendar,
  Sparkles,
} from "lucide-react";

interface PhasesTransitionSequenceProps {
  northStarId: string;
  phases: CommandPhase[];
  onSavePhase: (phase: Partial<CommandPhase>) => void;
  onDeletePhase: (phaseId: string) => void;
}

export function PhasesTransitionSequence({
  northStarId,
  phases,
  onSavePhase,
  onDeletePhase,
}: PhasesTransitionSequenceProps) {
  const [editingPhase, setEditingPhase] = useState<Partial<CommandPhase> | null>(null);

  const sortedPhases = [...phases].sort((a, b) => a.phase_number - b.phase_number);

  const handleCreateNew = () => {
    setEditingPhase({
      north_star_id: northStarId,
      phase_number: sortedPhases.length + 1,
      title: "",
      description: "",
      status: "not_started",
      sequence_type: sortedPhases.length === 0 ? "bottleneck" : "tag_team",
      target_completion_date: null,
      reference_strips: [],
    });
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPhase) return;
    onSavePhase(editingPhase);
    setEditingPhase(null);
  };

  return (
    <div className="flex-1 flex flex-col justify-between space-y-3 font-mono">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-white">
            Phases of Transition
          </span>
          <span className="text-[10px] text-zinc-400 px-2 py-0.5 rounded bg-white/5 border border-white/10">
            {sortedPhases.length} Phases Connected
          </span>
        </div>

        <button
          onClick={handleCreateNew}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-[11px] font-bold text-zinc-200 hover:text-white transition"
        >
          <Plus size={12} />
          <span>Add Phase</span>
        </button>
      </div>

      {/* Horizontal Connected Sequential Phases */}
      {sortedPhases.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 rounded-2xl bg-zinc-950/40 border border-white/5 border-dashed text-center space-y-2">
          <Layers size={24} className="text-zinc-500" />
          <div className="text-xs font-bold text-zinc-300">No Phases of Transition Defined</div>
          <p className="text-[11px] text-zinc-500 max-w-xs font-sans">
            Break down this North Star into sequential milestones. Tag each step as BOTTLENECK (must complete first) or TAG-TEAM (can stack).
          </p>
          <button
            onClick={handleCreateNew}
            className="mt-2 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold"
          >
            Create Phase 1
          </button>
        </div>
      ) : (
        <div className="flex items-stretch gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin">
          {sortedPhases.map((phase, idx) => {
            const isBottleneck = phase.sequence_type === "bottleneck";
            const isCompleted = phase.status === "completed";
            const isInProgress = phase.status === "in_progress";

            return (
              <React.Fragment key={phase.id}>
                {/* Phase Card */}
                <div
                  className={`w-64 shrink-0 rounded-2xl p-4 flex flex-col justify-between border backdrop-blur-xl transition shadow-xl relative overflow-hidden group ${
                    isBottleneck
                      ? "bg-rose-950/20 border-rose-500/30 hover:border-rose-500/50"
                      : "bg-zinc-950/60 border-white/10 hover:border-white/20"
                  }`}
                >
                  {/* Top Badges */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        Phase {phase.phase_number}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={() => setEditingPhase(phase)}
                          className="p-1 rounded text-zinc-400 hover:text-white"
                          title="Edit Phase"
                        >
                          <Edit3 size={11} />
                        </button>
                        <button
                          onClick={() => onDeletePhase(phase.id)}
                          className="p-1 rounded text-zinc-400 hover:text-rose-400"
                          title="Delete Phase"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>

                    {/* Bottleneck vs Tag-Team Tag */}
                    <div className="mb-2">
                      {isBottleneck ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9px] font-black uppercase tracking-wider animate-pulse">
                          <AlertOctagon size={10} />
                          BOTTLENECK (DO FIRST)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-300 border border-sky-500/30 text-[9px] font-bold uppercase tracking-wider">
                          <Layers size={10} />
                          TAG-TEAM (STACKABLE)
                        </span>
                      )}
                    </div>

                    {/* Title & Description */}
                    <h4 className="text-xs font-bold text-white tracking-wide leading-snug line-clamp-2">
                      {phase.title}
                    </h4>
                    {phase.description && (
                      <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 font-sans">
                        {phase.description}
                      </p>
                    )}
                  </div>

                  {/* Attached Reference Strips */}
                  <div className="mt-3 pt-2.5 border-t border-white/5 space-y-2">
                    {phase.reference_strips && phase.reference_strips.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-[9px] text-zinc-500 uppercase tracking-wider">
                          Reference Strips
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {phase.reference_strips.map((refItem, rIdx) => (
                            <a
                              key={rIdx}
                              href={refItem.url || "#"}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[10px] text-zinc-300 truncate max-w-[190px] border border-white/5"
                            >
                              <ExternalLink size={9} />
                              <span className="truncate">{refItem.title}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Status & Deadline */}
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1">
                      <span
                        className={`font-bold uppercase ${
                          isCompleted
                            ? "text-emerald-400"
                            : isInProgress
                            ? "text-amber-400"
                            : "text-zinc-500"
                        }`}
                      >
                        {phase.status.replace("_", " ")}
                      </span>

                      {phase.target_completion_date && (
                        <span className="flex items-center gap-1 text-zinc-500">
                          <Calendar size={10} />
                          {phase.target_completion_date}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Connector Arrow */}
                {idx < sortedPhases.length - 1 && (
                  <div className="flex items-center justify-center text-zinc-600 shrink-0">
                    <ArrowRight size={16} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* Edit Phase Modal */}
      {editingPhase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-zinc-950 border border-white/15 rounded-2xl p-5 shadow-2xl space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="font-bold text-white uppercase tracking-wider">
                {editingPhase.id ? "Edit Phase" : "Create Phase"}
              </span>
              <button
                onClick={() => setEditingPhase(null)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase">Phase #</label>
                  <input
                    type="number"
                    value={editingPhase.phase_number || 1}
                    onChange={(e) =>
                      setEditingPhase({ ...editingPhase, phase_number: Number(e.target.value) })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-white text-xs"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] text-zinc-400 uppercase">Sequence Type</label>
                  <select
                    value={editingPhase.sequence_type || "bottleneck"}
                    onChange={(e) =>
                      setEditingPhase({
                        ...editingPhase,
                        sequence_type: e.target.value as SequenceType,
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-white text-xs font-mono"
                  >
                    <option value="bottleneck">BOTTLENECK (DO FIRST)</option>
                    <option value="tag_team">TAG-TEAM (STACKABLE)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 uppercase">Title</label>
                <input
                  type="text"
                  placeholder="Phase title..."
                  value={editingPhase.title || ""}
                  onChange={(e) => setEditingPhase({ ...editingPhase, title: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-white text-xs"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 uppercase">Description / Deliverable</label>
                <textarea
                  rows={2}
                  placeholder="Exit criteria for this phase..."
                  value={editingPhase.description || ""}
                  onChange={(e) => setEditingPhase({ ...editingPhase, description: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-white text-xs font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase">Status</label>
                  <select
                    value={editingPhase.status || "not_started"}
                    onChange={(e) =>
                      setEditingPhase({ ...editingPhase, status: e.target.value as PhaseStatus })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-white text-xs"
                  >
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase">Target Date</label>
                  <input
                    type="date"
                    value={editingPhase.target_completion_date || ""}
                    onChange={(e) =>
                      setEditingPhase({
                        ...editingPhase,
                        target_completion_date: e.target.value || null,
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-white text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingPhase(null)}
                  className="px-3 py-1 rounded bg-zinc-800 text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold"
                >
                  Save Phase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
