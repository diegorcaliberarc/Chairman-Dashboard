/**
 * Public Barrel — Guided Mission Flow Feature (`@features/mission-flow`)
 */
export { MissionFlowNavigatorModal } from "@/components/mission/MissionFlowNavigatorModal";
export {
  computeCriticalPath,
  computeMissionQuantification,
  synthesizeMissionFlowDfy,
  missionDraftToStrategicTree,
} from "@/lib/missionFlowTypes";
export type {
  MissionFlowDraft,
  MissionWbsNode,
  MissionCoPilotMode,
  AarLesson,
} from "@/lib/missionFlowTypes";
