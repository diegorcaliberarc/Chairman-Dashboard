"use client";

import React, { useState } from "react";
import { Plus, Trash2, Check, Play, Info, Video, Sparkles } from "lucide-react";

export interface ExerciseSetItem {
  id: string;
  setNumber: number;
  prevWeight: number;
  prevReps: number;
  weightLbs: number | "";
  reps: number | "";
  rpe: number | "";
  isCompleted: boolean;
}

export interface SessionExercise {
  id: string;
  exerciseNumber: number;
  name: string;
  muscle: string;
  equipment: string;
  targetProtocol: string;
  targetWeightLbs: number;
  image: string;
  tips?: string;
  videoUrl?: string;
  sets: ExerciseSetItem[];
}

interface ExerciseDeckProps {
  exercises: SessionExercise[];
  onUpdateSet: (
    exerciseId: string,
    setIndex: number,
    field: keyof ExerciseSetItem,
    value: any
  ) => void;
  onToggleSetComplete: (exerciseId: string, setIndex: number) => void;
  onAddSet: (exerciseId: string) => void;
  onRemoveSet: (exerciseId: string, setIndex: number) => void;
  onAddExercise: () => void;
}

export function ExerciseDeck({
  exercises,
  onUpdateSet,
  onToggleSetComplete,
  onAddSet,
  onRemoveSet,
  onAddExercise,
}: ExerciseDeckProps) {
  const [activeVideoModal, setActiveVideoModal] = useState<SessionExercise | null>(null);

  return (
    <div className="space-y-6 select-none">
      {exercises.map((ex, exIndex) => {
        return (
          <article
            key={ex.id}
            className="bg-[#0F131C] border border-white/10 hover:border-zinc-500 rounded-2xl overflow-hidden transition-all shadow-xl backdrop-blur-xl"
          >
            <div className="p-5">
              <div className="flex flex-col lg:flex-row gap-5">
                {/* Exercise Image & Form Demo Launcher */}
                <div className="lg:w-52 h-44 relative rounded-xl overflow-hidden shrink-0 border border-white/10 group bg-black/60">
                  <img
                    src={ex.image}
                    alt={ex.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/20 flex flex-col justify-between p-2.5">
                    <span className="self-end bg-black/80 backdrop-blur-md text-cyan-300 text-[9px] font-mono px-2 py-0.5 rounded-md border border-cyan-400/40 font-bold">
                      ▶ 4K Form Demo
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveVideoModal(ex)}
                      className="w-full py-1.5 bg-black/75 hover:bg-black/90 backdrop-blur-sm text-white text-[10px] font-mono rounded-lg flex items-center justify-center gap-1.5 border border-white/20 transition active:scale-95"
                    >
                      <Play size={11} className="text-amber-400 fill-amber-400" />
                      <span>Form Tips & Demo</span>
                    </button>
                  </div>
                </div>

                {/* Exercise Details & Set Log */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-amber-400">
                          EXERCISE {String(ex.exerciseNumber || exIndex + 1).padStart(2, "0")}
                        </span>
                        <span className="text-[10px] font-mono bg-white/[0.06] border border-white/10 text-zinc-300 px-2 py-0.5 rounded-md">
                          {ex.equipment}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-display font-bold text-white mt-1 tracking-wide">
                        {ex.name}
                      </h3>
                      <p className="text-xs text-zinc-400 font-mono mt-0.5">
                        {ex.muscle} • {ex.targetProtocol}
                      </p>
                    </div>

                    <span className="text-xs font-mono text-cyan-300 border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 rounded-lg font-bold">
                      Target: {ex.targetWeightLbs > 0 ? `${ex.targetWeightLbs} lbs` : "Flexible"}
                    </span>
                  </div>

                  {/* Telemetry Set Logging Table */}
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-xs font-mono text-left">
                      <thead>
                        <tr className="text-zinc-500 border-b border-white/10 text-[11px]">
                          <th className="pb-2 font-medium w-12">SET</th>
                          <th className="pb-2 font-medium w-24">PREVIOUS</th>
                          <th className="pb-2 font-medium w-24">LBS</th>
                          <th className="pb-2 font-medium w-20">REPS</th>
                          <th className="pb-2 font-medium w-16">RPE</th>
                          <th className="pb-2 text-right font-medium pr-1">LOG STATUS</th>
                          <th className="pb-2 w-8"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-zinc-200">
                        {ex.sets.map((set, sIdx) => {
                          return (
                            <tr
                              key={set.id || sIdx}
                              className={`transition-colors ${
                                set.isCompleted ? "bg-cyan-500/[0.03]" : ""
                              }`}
                            >
                              <td className="py-2.5 text-amber-400 font-bold">
                                {set.setNumber}
                              </td>

                              <td className="py-2.5 text-zinc-400 font-mono text-[11px]">
                                {set.prevWeight > 0 ? `${set.prevWeight} × ${set.prevReps}` : "—"}
                              </td>

                              <td className="py-2.5">
                                <input
                                  type="number"
                                  min="0"
                                  placeholder={String(ex.targetWeightLbs || 135)}
                                  value={set.weightLbs}
                                  onChange={(e) =>
                                    onUpdateSet(
                                      ex.id,
                                      sIdx,
                                      "weightLbs",
                                      e.target.value === "" ? "" : Number(e.target.value)
                                    )
                                  }
                                  className="w-16 bg-[#080B14] border border-white/10 rounded-lg px-2 py-1 text-white font-mono text-xs focus:outline-none focus:border-amber-400/50"
                                />
                              </td>

                              <td className="py-2.5">
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="8"
                                  value={set.reps}
                                  onChange={(e) =>
                                    onUpdateSet(
                                      ex.id,
                                      sIdx,
                                      "reps",
                                      e.target.value === "" ? "" : Number(e.target.value)
                                    )
                                  }
                                  className="w-14 bg-[#080B14] border border-white/10 rounded-lg px-2 py-1 text-white font-mono text-xs focus:outline-none focus:border-amber-400/50"
                                />
                              </td>

                              <td className="py-2.5">
                                <input
                                  type="number"
                                  step="0.5"
                                  min="5"
                                  max="10"
                                  placeholder="9.0"
                                  value={set.rpe}
                                  onChange={(e) =>
                                    onUpdateSet(
                                      ex.id,
                                      sIdx,
                                      "rpe",
                                      e.target.value === "" ? "" : Number(e.target.value)
                                    )
                                  }
                                  className="w-12 bg-[#080B14] border border-white/10 rounded-lg px-1.5 py-1 text-zinc-300 font-mono text-xs focus:outline-none focus:border-amber-400/50"
                                />
                              </td>

                              <td className="py-2.5 text-right pr-1">
                                <button
                                  type="button"
                                  onClick={() => onToggleSetComplete(ex.id, sIdx)}
                                  className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg border font-semibold transition ${
                                    set.isCompleted
                                      ? "bg-cyan-500/20 border-cyan-400/40 text-cyan-300 shadow-[0_0_8px_rgba(0,240,255,0.2)]"
                                      : "bg-white/[0.03] border-white/10 text-zinc-400 hover:text-white hover:border-zinc-500"
                                  }`}
                                >
                                  <span
                                    className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[9px] ${
                                      set.isCompleted
                                        ? "bg-cyan-400 border-cyan-300 text-black font-extrabold"
                                        : "border-zinc-600"
                                    }`}
                                  >
                                    {set.isCompleted && "✓"}
                                  </span>
                                  <span>{set.isCompleted ? "Completed" : "In Progress"}</span>
                                </button>
                              </td>

                              <td className="py-2.5 text-right">
                                {ex.sets.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => onRemoveSet(ex.id, sIdx)}
                                    className="p-1 text-zinc-500 hover:text-red-400 transition"
                                    title="Delete Set"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Add Set Button */}
                  <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => onAddSet(ex.id)}
                      className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold text-amber-300 hover:text-amber-200 transition hover:bg-amber-400/10 px-2.5 py-1 rounded-lg"
                    >
                      <Plus size={13} />
                      <span>Add Set {ex.sets.length + 1}</span>
                    </button>

                    <div className="text-[11px] font-mono text-zinc-500">
                      Total Volume:{" "}
                      <span className="font-bold text-white">
                        {ex.sets
                          .reduce((sum, s) => {
                            if (s.isCompleted && typeof s.weightLbs === "number" && typeof s.reps === "number") {
                              return sum + s.weightLbs * s.reps;
                            }
                            return sum;
                          }, 0)
                          .toLocaleString()}{" "}
                        lbs
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </article>
        );
      })}

      {/* Add Another Exercise Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onAddExercise}
          className="w-full py-3.5 rounded-2xl border-2 border-dashed border-white/15 hover:border-amber-400/50 hover:bg-amber-500/5 text-zinc-400 hover:text-amber-300 font-mono text-xs font-semibold flex items-center justify-center gap-2 transition active:scale-[0.99]"
        >
          <Plus size={15} />
          <span>+ Add Exercise to Today's Routine</span>
        </button>
      </div>

      {/* Video / Form Tips Modal */}
      {activeVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl bg-[#090D18] border border-white/10 shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">
                  Form Protocol & Biomechanics
                </span>
                <h3 className="text-base font-bold text-white tracking-wide">
                  {activeVideoModal.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveVideoModal(null)}
                className="text-zinc-400 hover:text-white font-mono text-sm p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="rounded-xl overflow-hidden border border-white/10 aspect-video relative bg-black">
              <img
                src={activeVideoModal.image}
                alt={activeVideoModal.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-cyan-400/90 text-black flex items-center justify-center shadow-lg shadow-cyan-400/40">
                  <Play size={20} className="fill-black ml-1" />
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs font-mono space-y-2 text-zinc-300">
              <div className="text-amber-300 font-bold flex items-center gap-1.5">
                <Sparkles size={13} />
                <span>Hypertrophy Execution Cue</span>
              </div>
              <p className="leading-relaxed">
                {activeVideoModal.tips ||
                  "Maintain full eccentric control (3 seconds), pause for 1 second at maximum stretch to engage stretch-mediated hypertrophy, drive powerfully into peak contraction without joint lock."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveVideoModal(null)}
              className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-mono font-bold text-xs transition"
            >
              Ready to Lift
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
