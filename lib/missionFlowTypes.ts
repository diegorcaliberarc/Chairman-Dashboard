import { StrategicDomain, StrategicTree, PaceType } from "./synthesisRoadmapTypes";

export type MissionCoPilotMode = "dfy" | "dwy" | "diy";
export type BomBucket = "HAVE" | "NEED" | "BLOCKED";
export type ExecutionWorkMode = "OPERATOR" | "BUILD" | "PASSIVE";

export interface OocemrOption {
  id: string;
  label: string;
  upsides: string;
  downsides: string;
  timeCost: string;
  impactScore: number; // 1..10
  speedScore: number; // 1..10
  riskScore: number; // 1..10 (higher = safer)
  mitigation: string;
}

export interface OocemrState {
  skipped: boolean;
  outcome: string;
  options: OocemrOption[];
  selectedOptionId: string | null;
  resolved: boolean;
}

export interface MissionEndState {
  domain: StrategicDomain;
  title: string;
  baselineValue: string;
  targetValue: string;
  unit: string;
  hardDeadline: string;
  commandersIntent: string;
  coverImageUrl: string;
}

export interface MissionWbsNode {
  id: string;
  loe: string; // Line of Effort branch name
  tier: 0 | 1 | 2;
  title: string;
  deliverable: string;
  scopeWeightPct: number; // All children should sum to 100% (WBS 100% Rule)
  durationMins: number;
  dependsOn: string[];
  bomStatus: BomBucket;
  bomItems: string[];
  workMode: ExecutionWorkMode;
  isPassiveFirst: boolean;
  timeBoxCeilingMins: number;
  exitCriteria: string;
  completed: boolean;
  thumbnailUrl: string;
}

export interface CpmNodeMetrics {
  nodeId: string;
  es: number; // Earliest Start (mins)
  ef: number; // Earliest Finish (mins)
  ls: number; // Latest Start (mins)
  lf: number; // Latest Finish (mins)
  slack: number; // LS - ES (0 = Critical Path / Main Effort)
  isCritical: boolean;
}

export interface FragoDocument {
  situation: string;
  mission: string;
  execution: string;
  sustainment: string;
  command: string;
}

export interface PaceRule {
  tier: PaceType;
  label: string;
  ifTrigger: string;
  thenAction: string;
}

export interface AarLesson {
  id: string;
  missionTitle: string;
  domain: StrategicDomain;
  whatWorked: string;
  whatBroke: string;
  ruleChange: string;
  createdAt: string;
}

export interface MissionFlowDraft {
  id?: string;
  mode: MissionCoPilotMode;
  oocemr: OocemrState;
  endState: MissionEndState;
  nodes: MissionWbsNode[];
  frago: FragoDocument;
  paceMatrix: PaceRule[];
  activePace: PaceType;
  deployedAt?: string | null;
}

export function pickMissionCoverImage(title: string, domain: StrategicDomain): string {
  const t = `${title} ${domain}`.toLowerCase();
  if (t.includes("kitchen") || t.includes("home") || t.includes("clean") || t.includes("family")) {
    return "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=900&q=80";
  }
  if (t.includes("155") || t.includes("weight") || t.includes("cut") || t.includes("gym") || t.includes("health") || t.includes("workout")) {
    return "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=80";
  }
  if (t.includes("dog") || t.includes("pack") || t.includes("puppy")) {
    return "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=900&q=80";
  }
  if (t.includes("billing") || t.includes("saas") || t.includes("ship") || t.includes("wealth") || t.includes("code") || t.includes("mrr")) {
    return "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=80";
  }
  return "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=900&q=80";
}

/**
 * Computes Critical Path Method (CPM): ES, EF, LS, LF, Slack, and Total Minimum Duration.
 * Any node with Slack === 0 is on the Critical Path (Main Effort).
 */
export function computeCriticalPath(nodes: MissionWbsNode[]): {
  metrics: Record<string, CpmNodeMetrics>;
  totalMinDurationMins: number;
  criticalNodeIds: string[];
} {
  const map = new Map<string, MissionWbsNode>();
  nodes.forEach((n) => map.set(n.id, n));

  const es: Record<string, number> = {};
  const ef: Record<string, number> = {};

  // Forward pass (up to N passes to resolve topological order)
  nodes.forEach((n) => {
    es[n.id] = 0;
    ef[n.id] = Math.max(1, n.durationMins || 15);
  });

  for (let pass = 0; pass < Math.max(1, nodes.length); pass++) {
    for (const n of nodes) {
      let maxPredEf = 0;
      for (const depId of n.dependsOn) {
        if (ef[depId] !== undefined) {
          maxPredEf = Math.max(maxPredEf, ef[depId]);
        }
      }
      es[n.id] = maxPredEf;
      ef[n.id] = maxPredEf + Math.max(1, n.durationMins || 15);
    }
  }

  const totalMinDurationMins = nodes.reduce((max, n) => Math.max(max, ef[n.id] || 0), 0);

  // Backward pass
  const lf: Record<string, number> = {};
  const ls: Record<string, number> = {};
  nodes.forEach((n) => {
    lf[n.id] = totalMinDurationMins;
    ls[n.id] = totalMinDurationMins - Math.max(1, n.durationMins || 15);
  });

  for (let pass = 0; pass < Math.max(1, nodes.length); pass++) {
    for (const n of nodes) {
      const successors = nodes.filter((other) => other.dependsOn.includes(n.id));
      if (successors.length > 0) {
        const minSuccLs = Math.min(...successors.map((s) => ls[s.id]));
        lf[n.id] = minSuccLs;
      } else {
        lf[n.id] = totalMinDurationMins;
      }
      ls[n.id] = lf[n.id] - Math.max(1, n.durationMins || 15);
    }
  }

  const metrics: Record<string, CpmNodeMetrics> = {};
  const criticalNodeIds: string[] = [];

  for (const n of nodes) {
    const slack = Math.max(0, Math.round((ls[n.id] ?? 0) - (es[n.id] ?? 0)));
    const isCritical = slack === 0;
    if (isCritical) criticalNodeIds.push(n.id);
    metrics[n.id] = {
      nodeId: n.id,
      es: Math.round(es[n.id] ?? 0),
      ef: Math.round(ef[n.id] ?? 0),
      ls: Math.round(ls[n.id] ?? 0),
      lf: Math.round(lf[n.id] ?? 0),
      slack,
      isCritical,
    };
  }

  return { metrics, totalMinDurationMins, criticalNodeIds };
}

export function computeMissionQuantification(draft: MissionFlowDraft) {
  const totalNodes = draft.nodes.length;
  const haveCount = draft.nodes.filter((n) => n.bomStatus === "HAVE").length;
  const needCount = draft.nodes.filter((n) => n.bomStatus === "NEED").length;
  const blockedCount = draft.nodes.filter((n) => n.bomStatus === "BLOCKED").length;
  const completedCount = draft.nodes.filter((n) => n.completed).length;

  const wbsCoveragePct = draft.nodes.reduce((sum, n) => sum + (Number(n.scopeWeightPct) || 0), 0);
  const scopeCompletionPct = totalNodes > 0 ? Math.round((completedCount / totalNodes) * 100) : 0;

  // Readiness Score: weighted by BOM HAVE ratio (70%) + zero-blocker bonus (30%)
  const haveRatio = totalNodes > 0 ? haveCount / totalNodes : 0;
  const unblockedRatio = totalNodes > 0 ? (totalNodes - blockedCount) / totalNodes : 1;
  const readinessScore = Math.round((haveRatio * 0.7 + unblockedRatio * 0.3) * 100);

  const velocity: "Ahead" | "On Pace" | "Behind" =
    scopeCompletionPct >= 65
      ? "Ahead"
      : blockedCount > 1
      ? "Behind"
      : "On Pace";

  return {
    totalNodes,
    haveCount,
    needCount,
    blockedCount,
    completedCount,
    wbsCoveragePct,
    scopeCompletionPct,
    readinessScore,
    velocity,
  };
}

/**
 * Generates a full quantified 6-stage MissionFlowDraft from a raw brain dump (Done For You mode)
 */
export function synthesizeMissionFlowDfy(
  rawPrompt: string,
  domain: StrategicDomain = "master"
): MissionFlowDraft {
  const cleanTitle = rawPrompt.trim() || "Execute High-Leverage Mission";
  const cover = pickMissionCoverImage(cleanTitle, domain);
  const deadline = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  const n1: MissionWbsNode = {
    id: "mf_n1",
    loe: "LOE 1 · Foundation & Passive Triggers",
    tier: 0,
    title: "Trigger Passive & Parallel Processes",
    deliverable: "Start background runs, prep materials, clear workspace friction",
    scopeWeightPct: 20,
    durationMins: 15,
    dependsOn: [],
    bomStatus: "HAVE",
    bomItems: ["Checklist", "Timer / Workspace"],
    workMode: "PASSIVE",
    isPassiveFirst: true,
    timeBoxCeilingMins: 15,
    exitCriteria: "All passive/background processes actively running",
    completed: false,
    thumbnailUrl: cover,
  };

  const n2: MissionWbsNode = {
    id: "mf_n2",
    loe: "LOE 2 · Core Execution",
    tier: 1,
    title: `Core Main Effort: ${cleanTitle.slice(0, 36)}`,
    deliverable: "Complete primary 80/20 deliverable without context switching",
    scopeWeightPct: 40,
    durationMins: 45,
    dependsOn: ["mf_n1"],
    bomStatus: "HAVE",
    bomItems: ["Primary Tools", "Focused 45m Block"],
    workMode: "BUILD",
    isPassiveFirst: false,
    timeBoxCeilingMins: 50,
    exitCriteria: "Core deliverable built and functionally complete",
    completed: false,
    thumbnailUrl: cover,
  };

  const n3: MissionWbsNode = {
    id: "mf_n3",
    loe: "LOE 3 · Support & Resource Acquisition",
    tier: 1,
    title: "Resolve Missing Supplies / Dependencies",
    deliverable: "Close any resource or external input gaps in parallel",
    scopeWeightPct: 20,
    durationMins: 25,
    dependsOn: ["mf_n1"],
    bomStatus: "NEED",
    bomItems: ["Missing Dependency Check"],
    workMode: "OPERATOR",
    isPassiveFirst: false,
    timeBoxCeilingMins: 30,
    exitCriteria: "All NEED items acquired or substituted via Alternate plan",
    completed: false,
    thumbnailUrl: cover,
  };

  const n4: MissionWbsNode = {
    id: "mf_n4",
    loe: "LOE 4 · Verification & Lock",
    tier: 2,
    title: "Final Verification, QA & Closeout",
    deliverable: "Verify end-state metric against Commander's Intent & log AAR",
    scopeWeightPct: 20,
    durationMins: 20,
    dependsOn: ["mf_n2", "mf_n3"],
    bomStatus: "BLOCKED",
    bomItems: ["Final QA Checklist"],
    workMode: "BUILD",
    isPassiveFirst: false,
    timeBoxCeilingMins: 20,
    exitCriteria: "100% WBS verified and target metric locked",
    completed: false,
    thumbnailUrl: cover,
  };

  return {
    mode: "dfy",
    oocemr: {
      skipped: false,
      outcome: `Achieve "${cleanTitle}" cleanly within time-box ceiling with zero rework.`,
      options: [
        {
          id: "coa_1",
          label: "COA 1 · Direct Main Effort Blitz (Recommended)",
          upsides: "Fastest path to measurable output; triggers passive tasks first.",
          downsides: "Requires uninterrupted focus block.",
          timeCost: "~80 mins / $0 extra",
          impactScore: 9,
          speedScore: 9,
          riskScore: 8,
          mitigation: "Hard time-box ceiling + phone in another room.",
        },
        {
          id: "coa_2",
          label: "COA 2 · Phased Multi-Day Split",
          upsides: "Lower daily cognitive load.",
          downsides: "Slower convergence and higher context-switching tax.",
          timeCost: "3 days",
          impactScore: 7,
          speedScore: 5,
          riskScore: 8,
          mitigation: "Lock daily 20m calendar blocks.",
        },
        {
          id: "coa_3",
          label: "COA 3 · Minimum Viable Floor (Contingency)",
          upsides: "Guaranteed completion even under severe fatigue.",
          downsides: "Covers only 70% of ideal scope.",
          timeCost: "30 mins",
          impactScore: 6,
          speedScore: 10,
          riskScore: 9,
          mitigation: "Schedule follow-up polish pass tomorrow.",
        },
      ],
      selectedOptionId: "coa_1",
      resolved: true,
    },
    endState: {
      domain,
      title: cleanTitle,
      baselineValue: "0",
      targetValue: "100",
      unit: "% Complete",
      hardDeadline: deadline,
      commandersIntent: `Execute "${cleanTitle}" with disciplined time-boxing, passive-first sequencing, and zero perfectionism drift.`,
      coverImageUrl: cover,
    },
    nodes: [n1, n2, n3, n4],
    frago: {
      situation: `Mission initiated for "${cleanTitle}" under ${domain.toUpperCase()} domain. All dependencies mapped via backward chaining.`,
      mission: `Complete "${cleanTitle}" by ${deadline} hitting 100% WBS scope coverage with zero unmitigated blockers.`,
      execution: `1) Trigger passive/parallel tasks first (15m). 2) Execute Core Main Effort in strict time-box (45m). 3) Close support dependencies (25m). 4) Verify & lock end-state (20m).`,
      sustainment: `Hydration, 5-minute reset between blocks, and pre-staged tools on hand.`,
      command: `PACE active at [P] Primary. Hard stop at time-box ceiling; escalate to [A]/[C] immediately if blocked > 10 minutes.`,
    },
    paceMatrix: [
      {
        tier: "P",
        label: "Primary",
        ifTrigger: "All tools/energy green and calendar window unobstructed",
        thenAction: "Execute full Critical Path in sequence with strict time-box ceilings.",
      },
      {
        tier: "A",
        label: "Alternate",
        ifTrigger: "A NEED item or external dependency is delayed > 10 minutes",
        thenAction: "Substitute with available tool on hand and continue Main Effort without pausing.",
      },
      {
        tier: "C",
        label: "Contingency",
        ifTrigger: "Time window cut in half or unexpected interruption hits",
        thenAction: "Drop secondary LOEs and execute only Slack=0 Critical Path deliverables.",
      },
      {
        tier: "E",
        label: "Emergency",
        ifTrigger: "Severe fatigue, illness, or hard external abort",
        thenAction: "Execute 10-minute stabilization minimum, save state to PMS, and reschedule next morning.",
      },
    ],
    activePace: "P",
  };
}

/**
 * Converts a MissionFlowDraft into a StrategicTree so it syncs seamlessly with both DAG Graph & Execution Pyramid!
 */
export function missionDraftToStrategicTree(draft: MissionFlowDraft): StrategicTree {
  const toDagNode = (n: MissionWbsNode) => ({
    id: n.id,
    tier: n.tier,
    domain: draft.endState.domain,
    icon: n.workMode === "PASSIVE" ? "zap" : n.workMode === "OPERATOR" ? "wrench" : "layers",
    res: {
      have: n.bomStatus === "HAVE" ? (n.bomItems.join(", ") || "Ready on hand") : "—",
      need: n.bomStatus === "NEED" ? (n.bomItems.join(", ") || "Acquisition needed") : "—",
      blocked: n.bomStatus === "BLOCKED" ? (n.bomItems.join(", ") || "Awaiting upstream node") : "—",
    },
    title: n.title,
    sub: `${n.loe} · ${n.durationMins}m (${n.workMode})`,
    status: n.bomStatus === "HAVE" ? ("HAVE" as const) : n.bomStatus === "BLOCKED" ? ("BLOCKED" as const) : ("PROGRESS" as const),
    statusText: n.bomStatus,
    image: n.thumbnailUrl,
    frago: {
      task: `${n.title}: ${n.deliverable}`,
      purpose: draft.endState.commandersIntent || draft.frago.mission,
      window: `${n.workMode} · ${n.timeBoxCeilingMins}m ceiling · Exit: ${n.exitCriteria}`,
    },
    pace: {
      p: draft.paceMatrix.find((r) => r.tier === "P")?.thenAction || "Primary execution",
      a: draft.paceMatrix.find((r) => r.tier === "A")?.thenAction || "Alternate path",
      c: draft.paceMatrix.find((r) => r.tier === "C")?.thenAction || "Contingency floor",
      e: draft.paceMatrix.find((r) => r.tier === "E")?.thenAction || "Emergency recovery",
    },
    checks: [
      { id: `${n.id}_c1`, label: n.deliverable, completed: n.completed },
      { id: `${n.id}_c2`, label: `Exit Criteria: ${n.exitCriteria}`, completed: n.completed },
    ],
  });

  const tier0 = draft.nodes.filter((n) => n.tier === 0).map(toDagNode);
  const tier1 = draft.nodes.filter((n) => n.tier === 1).map(toDagNode);
  const tier2 = draft.nodes.filter((n) => n.tier === 2).map(toDagNode);

  const arrows: StrategicTree["arrows"] = [];
  for (const n of draft.nodes) {
    for (const dep of n.dependsOn) {
      arrows.push({ from: dep, to: n.id, label: "CPM LINK", color: n.tier === 2 ? "amber" : "cyan" });
    }
    if (n.tier === 2) {
      arrows.push({ from: n.id, to: "goal", label: "CONVERGE", color: "gold" });
    }
  }

  const q = computeMissionQuantification(draft);

  return {
    id: draft.id || `mission_${Date.now()}`,
    icon: "rocket",
    domain: draft.endState.domain,
    title: draft.endState.title,
    loeCount: `${draft.nodes.length} Quantified Nodes`,
    audit: { have: q.haveCount, acq: q.needCount, blocked: q.blockedCount },
    tier0,
    tier1,
    tier2,
    tier3: {
      title: draft.endState.title,
      badge: `${draft.endState.domain.toUpperCase()} MISSION LOCK`,
      desc: draft.endState.commandersIntent,
      rate: `${q.scopeCompletionPct}%`,
      metric1: `${draft.endState.baselineValue} → ${draft.endState.targetValue} ${draft.endState.unit}`,
      metric2: `Due ${draft.endState.hardDeadline}`,
      reactionTag: `CPM ${computeCriticalPath(draft.nodes).totalMinDurationMins}m · PACE [${draft.activePace}]`,
    },
    arrows,
  };
}
