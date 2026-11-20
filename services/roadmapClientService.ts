import {
  ChecklistItem,
  StrategicDomain,
  StrategicTree,
} from "@/lib/synthesisRoadmapTypes";

interface SynthesizeResponse {
  success?: boolean;
  tree?: StrategicTree;
  message?: string;
}

export async function synthesizeDfyTree(
  domain: StrategicDomain,
  goalPrompt: string
): Promise<StrategicTree | null> {
  const res = await fetch("/api/roadmaps/synthesize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "dfy",
      goalPrompt,
      domain,
    }),
  });
  if (!res.ok) {
    throw new Error(`Synthesis endpoint returned HTTP ${res.status}`);
  }
  const data = (await res.json()) as SynthesizeResponse;
  return data.success && data.tree ? data.tree : null;
}

export async function refineDwyTree(
  domain: StrategicDomain,
  goalPrompt: string,
  answers: Record<string, string>
): Promise<StrategicTree | null> {
  const res = await fetch("/api/roadmaps/synthesize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "dwy_refine",
      goalPrompt,
      answers,
      domain,
    }),
  });
  if (!res.ok) {
    throw new Error(`DWY synthesis endpoint returned HTTP ${res.status}`);
  }
  const data = (await res.json()) as SynthesizeResponse;
  return data.success && data.tree ? data.tree : null;
}

export async function syncDossierToPms(payload: {
  nodeTitle: string;
  checks: ChecklistItem[];
  domain: string;
}): Promise<string> {
  const res = await fetch("/api/roadmaps/synthesize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "sync_pms",
      ...payload,
    }),
  });
  const data = (await res.json()) as SynthesizeResponse;
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to sync subtasks to Sovereign PMS");
  }
  return data.message || "Synced subtasks to Sovereign PMS!";
}

export async function scheduleDossierOnCalendar(payload: {
  nodeTitle: string;
  fragoWindow: string;
  nodeImage?: string;
  domain: string;
}): Promise<string> {
  const res = await fetch("/api/roadmaps/synthesize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "sync_calendar",
      ...payload,
    }),
  });
  const data = (await res.json()) as SynthesizeResponse;
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to schedule on Solar Arc Calendar");
  }
  return data.message || "Scheduled on Circadian Solar Arc!";
}
