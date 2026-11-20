"use client";

import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Rocket,
  Sparkles,
  Wrench,
  X,
} from "lucide-react";
import { MissionFlowDraft } from "@/lib/missionFlowTypes";
import { StrategicDomain, StrategicTree } from "@/lib/synthesisRoadmapTypes";
import {
  MISSION_FLOW_STAGES,
  Stage0OocemrPanel,
  Stage1EndStatePanel,
  Stage2WbsBuilderPanel,
  Stage3BomCpmPanel,
  Stage4FragoDeployPanel,
  Stage5HudAarPanel,
  useMissionFlowMachine,
} from "@features/mission-flow";

interface MissionFlowNavigatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDomain?: StrategicDomain;
  onMissionDeployed?: (tree: StrategicTree, draft: MissionFlowDraft) => void;
}

export function MissionFlowNavigatorModal({
  isOpen,
  onClose,
  initialDomain = "master",
  onMissionDeployed,
}: MissionFlowNavigatorModalProps) {
  const {
    state,
    cpm,
    quant,
    filteredLessons,
    brainDump,
    setBrainDump,
    dwyConstraint,
    setDwyConstraint,
    dwyTools,
    setDwyTools,
    lessonSearch,
    setLessonSearch,
    aarWorked,
    setAarWorked,
    aarBroke,
    setAarBroke,
    aarRule,
    setAarRule,
    setStage,
    nextStage,
    prevStage,
    skipStage0,
    setMode,
    runDfy,
    applyDwyRefinement,
    patchDraft,
    addWbsNode,
    updateWbsNode,
    deleteWbsNode,
    createAcquisitionTask,
    deployMission,
    submitAar,
    dismissToast,
  } = useMissionFlowMachine(isOpen, initialDomain, onMissionDeployed);

  if (!isOpen) return null;

  const { stage, draft, asyncPhase, toast } = state;

  return (
    <div
      data-testid="mission-flow-modal"
      data-active-stage={stage}
      data-async-phase={asyncPhase}
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
    >
      <div className="relative w-full max-w-6xl max-h-[94vh] flex flex-col rounded-3xl border border-white/15 bg-[#080b14] text-zinc-100 shadow-2xl overflow-hidden">
        {toast && (
          <div
            key={toast.seq}
            data-testid="mission-flow-toast"
            className="pointer-events-none absolute bottom-16 right-6 z-50 px-4 py-2.5 rounded-xl bg-cyan-500 text-zinc-950 font-mono text-xs font-medium shadow-2xl flex items-center gap-2"
          >
            <span>⚡ {toast.message}</span>
            <button
              type="button"
              onClick={dismissToast}
              className="pointer-events-auto text-zinc-900 hover:text-black ml-1"
              aria-label="Dismiss toast"
            >
              ✕
            </button>
          </div>
        )}

        <div className="px-4 sm:px-6 py-3.5 border-b border-white/10 bg-[#0d1220] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-amber-400 flex items-center justify-center text-zinc-950">
              <Rocket size={16} />
            </div>
            <div>
              <h2 className="text-sm font-medium text-white tracking-tight">
                Guided Mission Flow Navigator &amp; Quantified Execution Engine
              </h2>
              <p className="text-[11px] font-mono text-zinc-400">
                OOCEMR · JP 5-0 · WBS 100% · BOM · CPM Critical Path · FRAGO · PACE · AAR Vault
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center p-0.5 rounded-xl bg-black/50 border border-white/10 text-[11px] font-mono">
              {(
                [
                  { id: "dfy", label: "Done For You", icon: Sparkles },
                  { id: "dwy", label: "Done With You", icon: HelpCircle },
                  { id: "diy", label: "Do It Yourself", icon: Wrench },
                ] as const
              ).map((m) => {
                const Icon = m.icon;
                const active = draft.mode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    data-testid={`mission-mode-${m.id}`}
                    onClick={() => setMode(m.id)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition ${active
                      ? "bg-cyan-500 text-zinc-950 font-medium"
                      : "text-zinc-400 hover:text-white"
                      }`}
                  >
                    <Icon size={12} />
                    <span className="hidden sm:inline">{m.label}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              data-testid="mission-close-btn"
              aria-label="Close Mission Flow Navigator"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {draft.mode === "dfy" && (
          <div className="px-4 sm:px-6 py-2.5 bg-cyan-950/30 border-b border-cyan-500/20 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            <input
              type="text"
              data-testid="mission-dfy-input"
              value={brainDump}
              onChange={(e) => setBrainDump(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runDfy()}
              placeholder="Brain dump any mission (e.g. 'Reset the kitchen in 60 minutes', 'Get down to 155 lbs', 'Ship EquipSyncs billing by Sunday')..."
              className="flex-1 px-3.5 py-2 rounded-xl bg-black/50 border border-cyan-500/30 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 font-mono"
            />
            <button
              type="button"
              data-testid="mission-dfy-run-btn"
              onClick={runDfy}
              disabled={!brainDump.trim()}
              className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-zinc-950 font-mono text-xs font-medium uppercase tracking-wider flex items-center justify-center gap-1.5 transition disabled:opacity-40"
            >
              <Sparkles size={13} />
              <span>Run All 6 Stages (DFY)</span>
            </button>
          </div>
        )}

        {draft.mode === "dwy" && (
          <div className="px-4 sm:px-6 py-2.5 bg-amber-950/25 border-b border-amber-500/20 grid grid-cols-1 md:grid-cols-3 gap-2 shrink-0 text-xs font-mono">
            <input
              type="text"
              data-testid="mission-dwy-constraint-input"
              value={dwyConstraint}
              onChange={(e) => setDwyConstraint(e.target.value)}
              placeholder="Hard time anchor or constraint? (e.g. 60m ceiling)"
              className="px-3 py-1.5 rounded-xl bg-black/50 border border-amber-500/30 text-white placeholder-zinc-500"
            />
            <input
              type="text"
              data-testid="mission-dwy-tools-input"
              value={dwyTools}
              onChange={(e) => setDwyTools(e.target.value)}
              placeholder="Tools / resources on hand (comma-separated)..."
              className="px-3 py-1.5 rounded-xl bg-black/50 border border-amber-500/30 text-white placeholder-zinc-500"
            />
            <button
              type="button"
              data-testid="mission-dwy-calibrate-btn"
              onClick={applyDwyRefinement}
              className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-medium uppercase tracking-wider transition"
            >
              Calibrate Flow Side-by-Side
            </button>
          </div>
        )}

        <div className="px-4 sm:px-6 py-2.5 border-b border-white/10 bg-[#0a0e1a] flex items-center gap-1.5 overflow-x-auto shrink-0">
          {MISSION_FLOW_STAGES.map((s) => {
            const active = stage === s.idx;
            return (
              <button
                key={s.idx}
                type="button"
                data-testid={`mission-stage-tab-${s.idx}`}
                onClick={() => setStage(s.idx)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-mono shrink-0 transition border ${active
                  ? "bg-amber-400/20 text-amber-300 border-amber-400/50 font-medium"
                  : "bg-white/[0.03] text-zinc-400 border-white/5 hover:text-white"
                  }`}
              >
                {s.short}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {stage === 0 && (
            <Stage0OocemrPanel
              draft={draft}
              onPatchDraft={patchDraft}
              onSkipStage0={skipStage0}
            />
          )}
          {stage === 1 && <Stage1EndStatePanel draft={draft} onPatchDraft={patchDraft} />}
          {stage === 2 && (
            <Stage2WbsBuilderPanel
              draft={draft}
              wbsCoveragePct={quant.wbsCoveragePct}
              onAddNode={addWbsNode}
              onUpdateNode={updateWbsNode}
              onDeleteNode={deleteWbsNode}
            />
          )}
          {stage === 3 && (
            <Stage3BomCpmPanel
              draft={draft}
              cpm={cpm}
              quant={quant}
              onUpdateNode={updateWbsNode}
              onCreateAcquisitionTask={createAcquisitionTask}
            />
          )}
          {stage === 4 && (
            <Stage4FragoDeployPanel
              draft={draft}
              isDeploying={asyncPhase === "DEPLOYING"}
              onDeployMission={deployMission}
              onUpdateNode={updateWbsNode}
              onPatchDraft={patchDraft}
            />
          )}
          {stage === 5 && (
            <Stage5HudAarPanel
              draft={draft}
              cpm={cpm}
              quant={quant}
              lessonsCount={state.lessons.length}
              filteredLessons={filteredLessons}
              lessonSearch={lessonSearch}
              onChangeLessonSearch={setLessonSearch}
              aarWorked={aarWorked}
              onChangeAarWorked={setAarWorked}
              aarBroke={aarBroke}
              onChangeAarBroke={setAarBroke}
              aarRule={aarRule}
              onChangeAarRule={setAarRule}
              isSavingAar={asyncPhase === "SAVING_AAR"}
              onSubmitAar={submitAar}
              onUpdateNode={updateWbsNode}
              onPatchDraft={patchDraft}
            />
          )}
        </div>

        <div className="px-4 sm:px-6 py-3 border-t border-white/10 bg-[#0d1220] flex items-center justify-between shrink-0">
          <button
            type="button"
            data-testid="mission-prev-stage-btn"
            onClick={prevStage}
            disabled={stage === 0}
            className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl border border-white/10 text-xs font-mono text-zinc-300 hover:text-white disabled:opacity-30"
          >
            <ChevronLeft size={14} />
            <span>Back</span>
          </button>

          <div className="text-[11px] font-mono text-zinc-400">
            Stage {stage} of 5 · {MISSION_FLOW_STAGES[stage].label}
          </div>

          <button
            type="button"
            data-testid="mission-next-stage-btn"
            onClick={nextStage}
            disabled={stage === 5}
            className="flex items-center gap-1 px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-mono text-xs font-medium disabled:opacity-30"
          >
            <span>Next Stage</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
