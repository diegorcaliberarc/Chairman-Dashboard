import type {
  CommandAarLog,
  CommandFrago,
  CommandNorthStar,
  DailyTelemetryPoint,
  DomainScorecardItem,
  DriftWarning,
  StrategyChatMutationReceipt,
} from "@/lib/commandTypes";

export interface CommandDeckSnapshot {
  northStars: CommandNorthStar[];
  fragos: Record<string, CommandFrago>;
  aarLogs: CommandAarLog[];
  scorecards: DomainScorecardItem[];
  driftWarnings: DriftWarning[];
  telemetrySeries: DailyTelemetryPoint[];
}

export async function fetchStrategyCommandDeck(
  weekStartDate: string
): Promise<CommandDeckSnapshot> {
  const [cmdRes, scRes] = await Promise.all([
    fetch(`/api/command?weekStart=${encodeURIComponent(weekStartDate)}`, { cache: "no-store" }),
    fetch("/api/scorecard", { cache: "no-store" }),
  ]);

  let northStars: CommandNorthStar[] = [];
  let fragos: Record<string, CommandFrago> = {};
  let aarLogs: CommandAarLog[] = [];
  let scorecards: DomainScorecardItem[] = [];
  let driftWarnings: DriftWarning[] = [];
  let telemetrySeries: DailyTelemetryPoint[] = [];

  if (cmdRes.ok) {
    const cmdData = (await cmdRes.json()) as {
      success?: boolean;
      northStars?: CommandNorthStar[];
      fragos?: Record<string, CommandFrago>;
      aarLogs?: CommandAarLog[];
    };
    if (cmdData.success) {
      northStars = cmdData.northStars ?? [];
      fragos = cmdData.fragos ?? {};
      aarLogs = cmdData.aarLogs ?? [];
    }
  }

  if (scRes.ok) {
    const scData = (await scRes.json()) as {
      success?: boolean;
      scorecards?: DomainScorecardItem[];
      driftWarnings?: DriftWarning[];
      telemetrySeries?: DailyTelemetryPoint[];
    };
    if (scData.success) {
      scorecards = scData.scorecards ?? [];
      driftWarnings = scData.driftWarnings ?? [];
      telemetrySeries = scData.telemetrySeries ?? [];
    }
  }

  return {
    northStars,
    fragos,
    aarLogs,
    scorecards,
    driftWarnings,
    telemetrySeries,
  };
}

export async function submitStrategyChatMutation(
  prompt: string,
  weekStartDate: string
): Promise<StrategyChatMutationReceipt> {
  const res = await fetch("/api/command/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, weekStart: weekStartDate }),
  });

  const payload = (await res.json()) as Partial<StrategyChatMutationReceipt> & { error?: string };
  if (!res.ok || !payload.success) {
    throw new Error(payload.error || "Unable to apply state mutation.");
  }

  return payload as StrategyChatMutationReceipt;
}
