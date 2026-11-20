import { AarLesson, MissionFlowDraft } from "@/lib/missionFlowTypes";
import { StrategicDomain } from "@/lib/synthesisRoadmapTypes";

export async function fetchMissionFlowLessons(): Promise<AarLesson[]> {
  const res = await fetch("/api/mission-flow", { cache: "no-store" });
  if (!res.ok) return [];
  const data = (await res.json()) as { lessons?: AarLesson[] };
  return Array.isArray(data.lessons) ? data.lessons : [];
}

export async function createMissionAcquisitionTask(label: string): Promise<void> {
  await fetch("/api/mission-flow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "create_acquisition_task", label }),
  });
}

export async function deployMissionFlow(draft: MissionFlowDraft): Promise<{
  id?: string;
  deployedAt?: string;
  pmsSynced: number;
  calendarSynced: number;
}> {
  const res = await fetch("/api/mission-flow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "deploy_mission", draft }),
  });
  if (!res.ok) {
    throw new Error(`Mission deploy returned HTTP ${res.status}`);
  }
  const data = (await res.json()) as {
    id?: string;
    deployedAt?: string;
    pmsSynced?: number;
    calendarSynced?: number;
  };
  return {
    id: data.id,
    deployedAt: data.deployedAt,
    pmsSynced: data.pmsSynced ?? 0,
    calendarSynced: data.calendarSynced ?? 0,
  };
}

export async function saveMissionAarLesson(payload: {
  missionTitle: string;
  domain: StrategicDomain;
  whatWorked: string;
  whatBroke: string;
  ruleChange: string;
}): Promise<AarLesson | null> {
  const res = await fetch("/api/mission-flow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "save_aar_lesson",
      ...payload,
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { lesson?: AarLesson };
  return data.lesson ?? null;
}
