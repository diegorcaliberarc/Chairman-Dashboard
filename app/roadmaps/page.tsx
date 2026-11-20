"use client";

import React from "react";
import { ExecutiveModuleShell } from "@/components/chairman/ExecutiveModuleShell";
import {
  BackwardChainTracePanel,
  CoPilotModeBar,
  DagCanvasView,
  DoneWithYouModal,
  ExecutionPyramidView,
  ManualNodeBuilderModal,
  MobileDagAccordion,
  SynthesisHeaderStrip,
  TacticalDossierModal,
  useRoadmapMachine,
} from "@features/strategic-roadmap";

export default function SynthesisRoadmapPage() {
  const {
    state,
    activeTree,
    selectedNodeId,
    activeNode,
    isSynthesizing,
    selectDomain,
    setViewMode,
    setCoPilotMode,
    setActivePace,
    zoomIn,
    zoomOut,
    zoomReset,
    triggerBackwardChain,
    closeBackwardChain,
    openDossier,
    openDwyInterview,
    openDiyBuilder,
    closeModal,
    synthesizeDfy,
    submitDwyAnswers,
    saveManualNode,
    toggleCheck,
    addCheck,
    lockGoal,
    verifyStep,
    dismissToast,
  } = useRoadmapMachine();

  return (
    <ExecutiveModuleShell
      moduleId="ROADMAPS"
      eyebrow="Operations & Planning"
      title="Strategic Roadmap"
      subtitle="Multi-branch planning, milestone dependencies, and execution briefs"
      accentColor="#00f0ff"
      fullBleed={true}
    >
      <div
        data-testid="roadmap-workspace-root"
        data-view-mode={state.viewMode}
        data-async-phase={state.asyncPhase}
        className="min-h-screen bg-[#060911] text-white flex flex-col selection:bg-cyan-400 selection:text-black relative"
      >
        {state.toast && (
          <div
            key={state.toast.seq}
            data-testid="roadmap-feedback-toast"
            className="fixed bottom-6 right-6 z-50 bg-[#0F1424]/95 border-2 border-cyan-400 px-5 py-3 rounded-2xl shadow-2xl text-xs font-mono text-cyan-300 flex items-center gap-3"
          >
            <span>⚡</span>
            <span>{state.toast.message}</span>
            <button
              type="button"
              data-testid="roadmap-toast-dismiss"
              onClick={dismissToast}
              className="text-zinc-400 hover:text-white ml-1"
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
        )}

        <SynthesisHeaderStrip
          currentDomain={state.currentDomain}
          onSelectDomain={selectDomain}
          title={activeTree.title}
          loeCount={activeTree.loeCount}
          audit={activeTree.audit}
          activePace={state.activePace}
          onSelectPace={setActivePace}
          zoomScale={state.zoomScale}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onZoomReset={zoomReset}
          onTriggerSynthesize={() => synthesizeDfy(activeTree.title)}
          onTriggerBackwardChain={triggerBackwardChain}
          isSynthesizing={isSynthesizing}
          roadmapViewMode={state.viewMode}
          onChangeRoadmapViewMode={setViewMode}
        />

        <CoPilotModeBar
          currentMode={state.coPilotMode}
          onChangeMode={setCoPilotMode}
          onSynthesizeDfy={synthesizeDfy}
          onStartDwyInterview={openDwyInterview}
          onOpenManualBuilder={openDiyBuilder}
          isProcessing={isSynthesizing}
        />

        {state.backwardChainOpen && (
          <BackwardChainTracePanel
            tree={activeTree}
            onSelectNode={openDossier}
            onClose={closeBackwardChain}
          />
        )}

        <main className="flex-1 flex flex-col relative w-full overflow-hidden">
          {state.viewMode === "pyramid" ? (
            <ExecutionPyramidView
              tree={activeTree}
              onNodeClick={openDossier}
              onLockGoal={lockGoal}
            />
          ) : (
            <>
              <div className="hidden lg:flex flex-1 w-full overflow-hidden">
                <DagCanvasView
                  tree={activeTree}
                  zoomScale={state.zoomScale}
                  onNodeClick={openDossier}
                  onLockGoal={lockGoal}
                />
              </div>

              <MobileDagAccordion
                tree={activeTree}
                onNodeClick={openDossier}
                onLockGoal={lockGoal}
              />
            </>
          )}
        </main>

        <TacticalDossierModal
          isOpen={selectedNodeId !== null}
          node={activeNode}
          goalNode={selectedNodeId === "goal" ? activeTree.tier3 : null}
          onClose={closeModal}
          onToggleCheck={toggleCheck}
          onAddCheck={addCheck}
          onVerifyStep={verifyStep}
        />

        <DoneWithYouModal
          isOpen={state.activeModal.kind === "DWY_INTERVIEW"}
          initialGoal={activeTree.title}
          onClose={closeModal}
          onSubmitAnswers={submitDwyAnswers}
          isProcessing={isSynthesizing}
        />

        <ManualNodeBuilderModal
          isOpen={state.activeModal.kind === "DIY_BUILDER"}
          domain={state.currentDomain}
          onClose={closeModal}
          onSaveNode={saveManualNode}
        />
      </div>
    </ExecutiveModuleShell>
  );
}
