/**
 * Public Barrel — Strategic Roadmap Feature (`@features/strategic-roadmap`)
 * Sibling features and pages import exclusively from this barrel, never deep internal paths.
 */
export { SynthesisHeaderStrip } from "@/components/roadmaps/SynthesisHeaderStrip";
export { CoPilotModeBar } from "@/components/roadmaps/CoPilotModeBar";
export { DagCanvasView } from "@/components/roadmaps/DagCanvasView";
export { ExecutionPyramidView } from "@/components/roadmaps/ExecutionPyramidView";
export { MobileDagAccordion } from "@/components/roadmaps/MobileDagAccordion";
export { TacticalDossierModal } from "@/components/roadmaps/TacticalDossierModal";
export { DoneWithYouModal } from "@/components/roadmaps/DoneWithYouModal";
export { ManualNodeBuilderModal } from "@/components/roadmaps/ManualNodeBuilderModal";
export { BackwardChainTracePanel } from "./components/BackwardChainTracePanel";
export { useRoadmapMachine } from "./hooks/useRoadmapMachine";
export { roadmapReducer } from "./state/roadmapMachineReducer";
export type {
  RoadmapMachineState,
  RoadmapModalState,
  RoadmapAsyncPhase,
  RoadmapViewMode,
} from "./state/roadmapMachineReducer";
export type {
  StrategicDomain,
  StrategicTree,
  CoPilotMode,
  PaceType,
  DagNode,
} from "@/lib/synthesisRoadmapTypes";
