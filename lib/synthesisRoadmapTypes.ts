export type StrategicDomain =
  | "master"
  | "dogs"
  | "health"
  | "wealth"
  | "family"
  | "happiness"
  | "custom";

export type CoPilotMode = "dfy" | "dwy" | "diy";

export type PaceType = "P" | "A" | "C" | "E";

export type NodeStatus = "HAVE" | "PROGRESS" | "BLOCKED" | "GOAL";

export interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  pmsTaskId?: string;
}

export interface FragoDirective {
  task: string;
  purpose: string;
  window: string;
}

export interface PacePlanMatrix {
  p: string; // Primary
  a: string; // Alternate
  c: string; // Contingency
  e: string; // Emergency
}

export interface ResourceAudit {
  have: string;
  need: string;
  blocked: string;
}

export interface DagNode {
  id: string;
  tier: 0 | 1 | 2 | 3;
  title: string;
  sub: string;
  domain: StrategicDomain;
  status: NodeStatus;
  statusText: string;
  icon: string;
  image?: string;
  frago: FragoDirective;
  pace: PacePlanMatrix;
  res: ResourceAudit;
  checks: ChecklistItem[];
  assignedLoe?: string;
}

export interface DagConnection {
  from: string;
  to: string;
  label: string;
  color: "cyan" | "amber" | "emerald" | "gold" | "rose";
  rx?: number;
}

export interface GoalClimax {
  title: string;
  badge: string;
  desc: string;
  rate: string;
  metric1: string;
  metric2: string;
  reactionTag: string;
  image?: string;
}

export interface StrategicTree {
  id: string;
  title: string;
  domain: StrategicDomain;
  icon: string;
  loeCount: string;
  audit: {
    have: number;
    acq: number;
    blocked: number;
  };
  tier0: DagNode[];
  tier1: DagNode[];
  tier2: DagNode[];
  tier3: GoalClimax;
  arrows: DagConnection[];
}

export interface ClarifyingQuestion {
  id: string;
  question: string;
  description: string;
  placeholder: string;
  suggestedAnswers?: string[];
  userAnswer?: string;
}
