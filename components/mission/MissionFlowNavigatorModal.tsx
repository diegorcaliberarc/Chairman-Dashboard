"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  X,
  Sparkles,
  HelpCircle,
  Wrench,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Rocket,
  Plus,
  Trash2,
  Shield,
  Target,
  Activity,
  BookOpen,
  Search,
  Send,
  Zap,
  Flag,
} from "lucide-react";
import {
  AarLesson,
  BomBucket,
  ExecutionWorkMode,
  MissionCoPilotMode,
  MissionFlowDraft,
  MissionWbsNode,
  computeCriticalPath,
  computeMissionQuantification,
  missionDraftToStrategicTree,
  pickMissionCoverImage,
  synthesizeMissionFlowDfy,
} from "@/lib/missionFlowTypes";
import { PaceType, StrategicDomain, StrategicTree } from "@/lib/synthesisRoadmapTypes";

interface MissionFlowNavigatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDomain?: StrategicDomain;
  onMissionDeployed?: (tree: StrategicTree, draft: MissionFlowDraft) => void;
}

const STAGES = [
  { idx: 0, short: "0 · OOCEMR", label: "Strategic Crossroads (OOCEMR)" },
  { idx: 1, short: "1 · GOAL!!", label: "Visual End-State Lock" },
  { idx: 2, short: "2 · WBS 100%", label: "Backward-Chained DAG & WBS" },
  { idx: 3, short: "3 · BOM & CPM", label: "BOM Readiness & Critical Path" },
  { idx: 4, short: "4 · FRAGO/PACE", label: "Tactical Sync & Deploy" },
  { idx: 5, short: "5 · HUD & AAR", label: "Live Telemetry & AAR Vault" },
];

const DOMAINS: Array<{ id: StrategicDomain; label: string }> = [
  { id: "master", label: "Master" },
  { id: "health", label: "Health" },
  { id: "wealth", label: "Wealth" },
  { id: "dogs", label: "Dogs" },
  { id: "family", label: "Family" },
  { id: "happiness", label: "Happiness" },
  { id: "custom", label: "Custom Project" },
];

function createBlankDraft(domain: StrategicDomain = "master"): MissionFlowDraft {
  const deadline = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  return {
    mode: "dfy",
    oocemr: {
      skipped: false,
      outcome: "",
      options: [
        {
          id: "coa_1",
          label: "COA 1",
          upsides: "",
          downsides: "",
          timeCost: "",
          impactScore: 8,
          speedScore: 7,
          riskScore: 7,
          mitigation: "",
        },
        {
          id: "coa_2",
          label: "COA 2",
          upsides: "",
          downsides: "",
          timeCost: "",
          impactScore: 6,
          speedScore: 8,
          riskScore: 8,
          mitigation: "",
        },
        {
          id: "coa_3",
          label: "COA 3",
          upsides: "",
          downsides: "",
          timeCost: "",
          impactScore: 7,
          speedScore: 6,
          riskScore: 9,
          mitigation: "",
        },
      ],
      selectedOptionId: "coa_1",
      resolved: false,
    },
    endState: {
      domain,
      title: "",
      baselineValue: "0",
      targetValue: "100",
      unit: "%",
      hardDeadline: deadline,
      commandersIntent: "",
      coverImageUrl: pickMissionCoverImage("", domain),
    },
    nodes: [],
    frago: {
      situation: "",
      mission: "",
      execution: "",
      sustainment: "",
      command: "",
    },
    paceMatrix: [
      { tier: "P", label: "Primary", ifTrigger: "Conditions green", thenAction: "" },
      { tier: "A", label: "Alternate", ifTrigger: "Primary dependency delayed >10m", thenAction: "" },
      { tier: "C", label: "Contingency", ifTrigger: "Window cut in half", thenAction: "" },
      { tier: "E", label: "Emergency", ifTrigger: "Hard abort / severe fatigue", thenAction: "" },
    ],
    activePace: "P",
  };
}

export function MissionFlowNavigatorModal({
  isOpen,
  onClose,
  initialDomain = "master",
  onMissionDeployed,
}: MissionFlowNavigatorModalProps) {
  const [stage, setStage] = useState<number>(0);
  const [draft, setDraft] = useState<MissionFlowDraft>(() => createBlankDraft(initialDomain));
  const [brainDump, setBrainDump] = useState<string>("");
  const [dwyConstraint, setDwyConstraint] = useState<string>("");
  const [dwyTools, setDwyTools] = useState<string>("");
  const [deploying, setDeploying] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);

  // AAR Closeout & Lesson Vault
  const [lessons, setLessons] = useState<AarLesson[]>([]);
  const [lessonSearch, setLessonSearch] = useState<string>("");
  const [aarWorked, setAarWorked] = useState<string>("");
  const [aarBroke, setAarBroke] = useState<string>("");
  const [aarRule, setAarRule] = useState<string>("");
  const [savingAar, setSavingAar] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/mission-flow")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.lessons) setLessons(d.lessons);
      })
      .catch(() => {});
  }, [isOpen]);

  const cpm = useMemo(() => computeCriticalPath(draft.nodes), [draft.nodes]);
  const quant = useMemo(() => computeMissionQuantification(draft), [draft]);

  const filteredLessons = useMemo(() => {
    const q = lessonSearch.trim().toLowerCase();
    if (!q) return lessons;
    return lessons.filter(
      (l) =>
        l.missionTitle.toLowerCase().includes(q) ||
        l.whatWorked.toLowerCase().includes(q) ||
        l.whatBroke.toLowerCase().includes(q) ||
        l.ruleChange.toLowerCase().includes(q)
    );
  }, [lessons, lessonSearch]);

  if (!isOpen) return null;

  const handleRunDfy = () => {
    if (!brainDump.trim()) return;
    const generated = synthesizeMissionFlowDfy(brainDump.trim(), draft.endState.domain);
    setDraft(generated);
    setStage(1);
    showToast(`Synthesized all 6 quantified stages for "${brainDump.trim()}"!`);
  };

  const handleApplyDwyRefinement = () => {
    const base = draft.endState.title || brainDump.trim() || "Tactical Mission";
    const generated = synthesizeMissionFlowDfy(base, draft.endState.domain);
    generated.mode = "dwy";
    if (dwyConstraint.trim()) {
      generated.frago.situation += ` Hard constraint: ${dwyConstraint.trim()}.`;
    }
    if (dwyTools.trim() && generated.nodes[0]) {
      generated.nodes[0].bomItems = dwyTools.split(",").map((s) => s.trim()).filter(Boolean);
    }
    setDraft(generated);
    showToast("Refined mission graph with your constraints & tools on hand!");
  };

  const handleAddNode = () => {
    const newId = `mf_n_${Date.now()}`;
    const remainingWeight = Math.max(0, 100 - quant.wbsCoveragePct);
    const newNode: MissionWbsNode = {
      id: newId,
      loe: `LOE ${draft.nodes.length + 1}`,
      tier: draft.nodes.length === 0 ? 0 : draft.nodes.length < 3 ? 1 : 2,
      title: "New WBS Deliverable",
      deliverable: "Define concrete measurable output",
      scopeWeightPct: remainingWeight > 0 ? remainingWeight : 15,
      durationMins: 30,
      dependsOn: draft.nodes.length > 0 ? [draft.nodes[draft.nodes.length - 1].id] : [],
      bomStatus: "HAVE",
      bomItems: [],
      workMode: "BUILD",
      isPassiveFirst: false,
      timeBoxCeilingMins: 35,
      exitCriteria: "Deliverable verified complete",
      completed: false,
      thumbnailUrl: draft.endState.coverImageUrl,
    };
    setDraft((prev) => ({ ...prev, nodes: [...prev.nodes, newNode] }));
  };

  const updateNode = (id: string, patch: Partial<MissionWbsNode>) => {
    setDraft((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
    }));
  };

  const handleCreateAcquisitionTask = async (label: string) => {
    await fetch("/api/mission-flow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create_acquisition_task", label }),
    });
    showToast(`Created Acquisition Task in Pristine PMS: "${label}"`);
  };

  const handleDeployMission = async () => {
    if (!draft.endState.title.trim()) {
      showToast("Enter a Mission Goal Title in Stage 1 before deploying.");
      setStage(1);
      return;
    }
    setDeploying(true);
    try {
      const res = await fetch("/api/mission-flow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deploy_mission", draft }),
      });
      const data = await res.json();
      const updatedDraft: MissionFlowDraft = {
        ...draft,
        id: data.id || draft.id,
        deployedAt: data.deployedAt || new Date().toISOString(),
      };
      setDraft(updatedDraft);
      const tree = missionDraftToStrategicTree(updatedDraft);
      if (onMissionDeployed) onMissionDeployed(tree, updatedDraft);
      setStage(5);
      showToast(
        `Mission Deployed! Synced ${data.pmsSynced ?? 0} PMS tasks & ${data.calendarSynced ?? 0} Calendar blocks.`
      );
    } catch {
      showToast("Saved locally — check connection for PMS/Calendar sync.");
    } finally {
      setDeploying(false);
    }
  };

  const handleSaveAar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aarWorked.trim() && !aarBroke.trim() && !aarRule.trim()) return;
    setSavingAar(true);
    try {
      const res = await fetch("/api/mission-flow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_aar_lesson",
          missionTitle: draft.endState.title || "Completed Mission",
          domain: draft.endState.domain,
          whatWorked: aarWorked.trim(),
          whatBroke: aarBroke.trim(),
          ruleChange: aarRule.trim(),
        }),
      });
      const data = await res.json();
      if (data.lesson) {
        setLessons((prev) => [data.lesson, ...prev]);
        setAarWorked("");
        setAarBroke("");
        setAarRule("");
        showToast("AAR saved to your searchable Lesson Vault!");
      }
    } finally {
      setSavingAar(false);
    }
  };

  return (
    <div
      data-testid="mission-flow-modal"
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
    >
      <div className="relative w-full max-w-6xl max-h-[94vh] flex flex-col rounded-3xl border border-white/15 bg-[#080b14] text-zinc-100 shadow-2xl overflow-hidden">
        {toast && (
          <div className="absolute bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-cyan-500 text-zinc-950 font-mono text-xs font-medium shadow-2xl">
            ⚡ {toast}
          </div>
        )}

        {/* TOP BAR: Title + 3-Way AI Co-Pilot Mode Toggle + Close */}
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
            {/* 3-Way Co-Pilot Toggle */}
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
                    onClick={() => setDraft((p) => ({ ...p, mode: m.id }))}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition ${
                      active
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

        {/* CO-PILOT CONTEXT BAR (DFY Brain Dump or DWY Diagnostic Strategist) */}
        {draft.mode === "dfy" && (
          <div className="px-4 sm:px-6 py-2.5 bg-cyan-950/30 border-b border-cyan-500/20 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            <input
              type="text"
              data-testid="mission-dfy-input"
              value={brainDump}
              onChange={(e) => setBrainDump(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRunDfy()}
              placeholder="Brain dump any mission (e.g. 'Reset the kitchen in 60 minutes', 'Get down to 155 lbs', 'Ship EquipSyncs billing by Sunday')..."
              className="flex-1 px-3.5 py-2 rounded-xl bg-black/50 border border-cyan-500/30 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 font-mono"
            />
            <button
              type="button"
              data-testid="mission-dfy-run-btn"
              onClick={handleRunDfy}
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
              value={dwyConstraint}
              onChange={(e) => setDwyConstraint(e.target.value)}
              placeholder="Hard time anchor or constraint? (e.g. 60m ceiling)"
              className="px-3 py-1.5 rounded-xl bg-black/50 border border-amber-500/30 text-white placeholder-zinc-500"
            />
            <input
              type="text"
              value={dwyTools}
              onChange={(e) => setDwyTools(e.target.value)}
              placeholder="Tools / resources on hand (comma-separated)..."
              className="px-3 py-1.5 rounded-xl bg-black/50 border border-amber-500/30 text-white placeholder-zinc-500"
            />
            <button
              type="button"
              onClick={handleApplyDwyRefinement}
              className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-medium uppercase tracking-wider transition"
            >
              Calibrate Flow Side-by-Side
            </button>
          </div>
        )}

        {/* NON-BLOCKING 6-STAGE STEPPER */}
        <div className="px-4 sm:px-6 py-2.5 border-b border-white/10 bg-[#0a0e1a] flex items-center gap-1.5 overflow-x-auto shrink-0">
          {STAGES.map((s) => {
            const active = stage === s.idx;
            return (
              <button
                key={s.idx}
                type="button"
                data-testid={`mission-stage-tab-${s.idx}`}
                onClick={() => setStage(s.idx)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-mono shrink-0 transition border ${
                  active
                    ? "bg-amber-400/20 text-amber-300 border-amber-400/50 font-medium"
                    : "bg-white/[0.03] text-zinc-400 border-white/5 hover:text-white"
                }`}
              >
                {s.short}
              </button>
            );
          })}
        </div>

        {/* STAGE CONTENT BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* STAGE 0: OOCEMR DECISION GATE */}
          {stage === 0 && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-medium text-white">
                    Stage 0: Strategic Crossroads &amp; Decision Filter (OOCEMR Gate)
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Outcome → Options (≥3 COAs) → Consequences → Weighted Score → Mitigate → Resolve.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDraft((p) => ({ ...p, oocemr: { ...p.oocemr, skipped: true } }));
                    setStage(1);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-white/15 text-xs font-mono text-zinc-300 hover:text-white hover:bg-white/5 transition"
                >
                  Decision Already Locked → Skip Stage 0
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-cyan-400 uppercase mb-1">
                  Outcome (Exact Desired Result)
                </label>
                <input
                  type="text"
                  value={draft.oocemr.outcome}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, oocemr: { ...p.oocemr, outcome: e.target.value } }))
                  }
                  placeholder="What exact measurable outcome must exist when this decision succeeds?"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e1424] border border-white/10 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {draft.oocemr.options.map((opt) => {
                  const weightedScore = Math.round(
                    (opt.impactScore * 0.45 + opt.speedScore * 0.3 + opt.riskScore * 0.25) * 10
                  );
                  const isWinner = draft.oocemr.selectedOptionId === opt.id;
                  return (
                    <div
                      key={opt.id}
                      className={`p-4 rounded-2xl border space-y-2.5 transition ${
                        isWinner
                          ? "border-amber-400/70 bg-amber-500/10"
                          : "border-white/10 bg-[#0e1424]/80"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={opt.label}
                          onChange={(e) =>
                            setDraft((p) => ({
                              ...p,
                              oocemr: {
                                ...p.oocemr,
                                options: p.oocemr.options.map((o) =>
                                  o.id === opt.id ? { ...o, label: e.target.value } : o
                                ),
                              },
                            }))
                          }
                          className="bg-transparent text-xs font-mono font-medium text-white w-full focus:outline-none"
                        />
                        <span className="px-2 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-300 font-mono text-[11px] shrink-0">
                          {weightedScore}/100
                        </span>
                      </div>

                      <input
                        type="text"
                        value={opt.upsides}
                        onChange={(e) =>
                          setDraft((p) => ({
                            ...p,
                            oocemr: {
                              ...p.oocemr,
                              options: p.oocemr.options.map((o) =>
                                o.id === opt.id ? { ...o, upsides: e.target.value } : o
                              ),
                            },
                          }))
                        }
                        placeholder="2nd/3rd-order upsides..."
                        className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-[11px] text-zinc-200"
                      />
                      <input
                        type="text"
                        value={opt.downsides}
                        onChange={(e) =>
                          setDraft((p) => ({
                            ...p,
                            oocemr: {
                              ...p.oocemr,
                              options: p.oocemr.options.map((o) =>
                                o.id === opt.id ? { ...o, downsides: e.target.value } : o
                              ),
                            },
                          }))
                        }
                        placeholder="Downsides / time & cost impact..."
                        className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-[11px] text-zinc-200"
                      />
                      <input
                        type="text"
                        value={opt.mitigation}
                        onChange={(e) =>
                          setDraft((p) => ({
                            ...p,
                            oocemr: {
                              ...p.oocemr,
                              options: p.oocemr.options.map((o) =>
                                o.id === opt.id ? { ...o, mitigation: e.target.value } : o
                              ),
                            },
                          }))
                        }
                        placeholder="Pre-built risk mitigation safeguard..."
                        className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-[11px] text-zinc-200"
                      />

                      <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono text-zinc-400">
                        <label>
                          Impact ({opt.impactScore})
                          <input
                            type="range"
                            min={1}
                            max={10}
                            value={opt.impactScore}
                            onChange={(e) =>
                              setDraft((p) => ({
                                ...p,
                                oocemr: {
                                  ...p.oocemr,
                                  options: p.oocemr.options.map((o) =>
                                    o.id === opt.id ? { ...o, impactScore: Number(e.target.value) } : o
                                  ),
                                },
                              }))
                            }
                            className="w-full"
                          />
                        </label>
                        <label>
                          Speed ({opt.speedScore})
                          <input
                            type="range"
                            min={1}
                            max={10}
                            value={opt.speedScore}
                            onChange={(e) =>
                              setDraft((p) => ({
                                ...p,
                                oocemr: {
                                  ...p.oocemr,
                                  options: p.oocemr.options.map((o) =>
                                    o.id === opt.id ? { ...o, speedScore: Number(e.target.value) } : o
                                  ),
                                },
                              }))
                            }
                            className="w-full"
                          />
                        </label>
                        <label>
                          Safety ({opt.riskScore})
                          <input
                            type="range"
                            min={1}
                            max={10}
                            value={opt.riskScore}
                            onChange={(e) =>
                              setDraft((p) => ({
                                ...p,
                                oocemr: {
                                  ...p.oocemr,
                                  options: p.oocemr.options.map((o) =>
                                    o.id === opt.id ? { ...o, riskScore: Number(e.target.value) } : o
                                  ),
                                },
                              }))
                            }
                            className="w-full"
                          />
                        </label>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setDraft((p) => ({
                            ...p,
                            oocemr: { ...p.oocemr, selectedOptionId: opt.id, resolved: true },
                          }))
                        }
                        className={`w-full py-1.5 rounded-xl text-[11px] font-mono uppercase transition ${
                          isWinner
                            ? "bg-amber-400 text-zinc-950 font-medium"
                            : "bg-white/5 hover:bg-white/10 text-zinc-300"
                        }`}
                      >
                        {isWinner ? "✓ Winning COA Locked" : "Lock Winning COA"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STAGE 1: VISUAL END-STATE LOCK (GOAL!! & COMMANDER'S INTENT) */}
          {stage === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-7 space-y-4">
                <h3 className="text-base font-medium text-white">
                  Stage 1: Visual End-State Lock (`GOAL!!` &amp; Commander&apos;s Intent)
                </h3>

                <div className="flex flex-wrap gap-1.5">
                  {DOMAINS.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() =>
                        setDraft((p) => ({
                          ...p,
                          endState: {
                            ...p.endState,
                            domain: d.id,
                            coverImageUrl: pickMissionCoverImage(p.endState.title, d.id),
                          },
                        }))
                      }
                      className={`px-3 py-1 rounded-xl text-xs font-mono border transition ${
                        draft.endState.domain === d.id
                          ? "bg-cyan-500 text-zinc-950 border-cyan-400 font-medium"
                          : "bg-white/5 text-zinc-400 border-white/10 hover:text-white"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1">
                    Mission Goal Title (`GOAL!!`)
                  </label>
                  <input
                    type="text"
                    value={draft.endState.title}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDraft((p) => ({
                        ...p,
                        endState: {
                          ...p.endState,
                          title: val,
                          coverImageUrl: pickMissionCoverImage(val, p.endState.domain),
                        },
                      }));
                    }}
                    placeholder="e.g. Get down to 155 lbs @ 8% BF or Ship EquipSyncs Billing"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e1424] border border-white/10 text-sm text-white"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div>
                    <label className="block text-[10px] text-zinc-400 uppercase mb-1">Baseline</label>
                    <input
                      type="text"
                      value={draft.endState.baselineValue}
                      onChange={(e) =>
                        setDraft((p) => ({ ...p, endState: { ...p.endState, baselineValue: e.target.value } }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-[#0e1424] border border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-400 uppercase mb-1">Target</label>
                    <input
                      type="text"
                      value={draft.endState.targetValue}
                      onChange={(e) =>
                        setDraft((p) => ({ ...p, endState: { ...p.endState, targetValue: e.target.value } }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-[#0e1424] border border-white/10 text-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-400 uppercase mb-1">Unit</label>
                    <input
                      type="text"
                      value={draft.endState.unit}
                      onChange={(e) =>
                        setDraft((p) => ({ ...p, endState: { ...p.endState, unit: e.target.value } }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-[#0e1424] border border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-400 uppercase mb-1">Hard Deadline</label>
                    <input
                      type="date"
                      value={draft.endState.hardDeadline}
                      onChange={(e) =>
                        setDraft((p) => ({ ...p, endState: { ...p.endState, hardDeadline: e.target.value } }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-[#0e1424] border border-white/10 text-amber-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1">
                    Commander&apos;s Intent &amp; Purpose
                  </label>
                  <textarea
                    rows={3}
                    value={draft.endState.commandersIntent}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, endState: { ...p.endState, commandersIntent: e.target.value } }))
                    }
                    placeholder="Why does this matter? What defines victory even if conditions shift?"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e1424] border border-white/10 text-xs text-white"
                  />
                </div>
              </div>

              {/* Visual End-State Cover Preview */}
              <div className="lg:col-span-5">
                <div className="rounded-2xl border border-amber-400/40 overflow-hidden bg-[#0e1424] shadow-2xl">
                  <div className="relative h-48 w-full">
                    <img
                      src={draft.endState.coverImageUrl}
                      alt={draft.endState.title || "Mission Cover"}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#080b14] via-black/30 to-transparent" />
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-amber-400 text-zinc-950 font-mono text-[10px] font-medium uppercase">
                      🏆 GOAL!! · {draft.endState.domain}
                    </div>
                    <div className="absolute bottom-3 left-4 right-4">
                      <h4 className="text-lg font-medium text-white leading-tight">
                        {draft.endState.title || "Untitled Mission End-State"}
                      </h4>
                      <div className="text-xs font-mono text-amber-300 mt-1">
                        {draft.endState.baselineValue} → {draft.endState.targetValue} {draft.endState.unit} · Due{" "}
                        {draft.endState.hardDeadline}
                      </div>
                    </div>
                  </div>
                  <div className="p-4 text-xs text-zinc-300 leading-relaxed">
                    {draft.endState.commandersIntent || "Define Commander's Intent on the left to lock end-state purpose."}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STAGE 2: BACKWARD-CHAINED DAG & WBS 100% RULE */}
          {stage === 2 && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-medium text-white">
                    Stage 2: Backward-Chained DAG &amp; WBS Decomposition (100% Rule)
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Decompose backward from GOAL!! into parallel Lines of Effort (LOEs) down to START!! leaf inputs.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddNode}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500 text-zinc-950 text-xs font-mono font-medium"
                >
                  <Plus size={14} />
                  <span>Add WBS Node</span>
                </button>
              </div>

              {/* Live WBS 100% Rule Scope Coverage Meter */}
              <div className="p-4 rounded-2xl border border-white/10 bg-[#0e1424] space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-300">WBS 100% Rule Scope Coverage Meter</span>
                  <span
                    className={
                      quant.wbsCoveragePct === 100
                        ? "text-emerald-400 font-medium"
                        : "text-amber-400 font-medium"
                    }
                  >
                    {quant.wbsCoveragePct}% / 100%{" "}
                    {quant.wbsCoveragePct === 100 ? "✓ Exact 100% Scope Locked" : "(Adjust weights to total 100%)"}
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-black/60 overflow-hidden border border-white/10">
                  <div
                    className={`h-full transition-all duration-300 ${
                      quant.wbsCoveragePct === 100 ? "bg-emerald-400" : "bg-amber-400"
                    }`}
                    style={{ width: `${Math.min(100, quant.wbsCoveragePct)}%` }}
                  />
                </div>
              </div>

              {draft.nodes.length === 0 ? (
                <div className="py-10 text-center text-xs font-mono text-zinc-400 rounded-2xl border border-dashed border-white/15">
                  No WBS nodes yet. Click &quot;Add WBS Node&quot; above or run Done For You to decompose automatically.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {draft.nodes.map((node) => (
                    <div
                      key={node.id}
                      className="p-3.5 rounded-2xl border border-white/10 bg-[#0e1424]/90 grid grid-cols-1 md:grid-cols-12 gap-3 items-center text-xs"
                    >
                      <div className="md:col-span-3 space-y-1">
                        <input
                          type="text"
                          value={node.loe}
                          onChange={(e) => updateNode(node.id, { loe: e.target.value })}
                          className="w-full bg-transparent text-[10px] font-mono text-cyan-400 uppercase focus:outline-none"
                        />
                        <input
                          type="text"
                          value={node.title}
                          onChange={(e) => updateNode(node.id, { title: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white"
                        />
                      </div>
                      <div className="md:col-span-4">
                        <input
                          type="text"
                          value={node.deliverable}
                          onChange={(e) => updateNode(node.id, { deliverable: e.target.value })}
                          placeholder="Concrete deliverable..."
                          className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-zinc-300"
                        />
                      </div>
                      <div className="md:col-span-2 flex items-center gap-1.5 font-mono">
                        <select
                          value={node.tier}
                          onChange={(e) => updateNode(node.id, { tier: Number(e.target.value) as 0 | 1 | 2 })}
                          className="px-2 py-1.5 rounded-lg bg-black/40 border border-white/10 text-zinc-200"
                        >
                          <option value={0}>Tier 0 (Start)</option>
                          <option value={1}>Tier 1 (Work)</option>
                          <option value={2}>Tier 2 (Verify)</option>
                        </select>
                      </div>
                      <div className="md:col-span-2 flex items-center gap-1.5 font-mono">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={node.scopeWeightPct}
                          onChange={(e) => updateNode(node.id, { scopeWeightPct: Number(e.target.value) || 0 })}
                          className="w-16 px-2 py-1.5 rounded-lg bg-black/40 border border-white/10 text-amber-300"
                        />
                        <span className="text-zinc-400">%</span>
                        <input
                          type="number"
                          min={5}
                          value={node.durationMins}
                          onChange={(e) => updateNode(node.id, { durationMins: Number(e.target.value) || 15 })}
                          className="w-16 px-2 py-1.5 rounded-lg bg-black/40 border border-white/10 text-cyan-300"
                        />
                        <span className="text-zinc-400">m</span>
                      </div>
                      <div className="md:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            setDraft((p) => ({ ...p, nodes: p.nodes.filter((n) => n.id !== node.id) }))
                          }
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STAGE 3: BOM READINESS AUDIT & CRITICAL PATH METHOD (CPM) */}
          {stage === 3 && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-medium text-white">
                    Stage 3: BOM Readiness Audit &amp; Critical Path Isolation (CPM)
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Glowing amber rows mark Slack = 0 Critical Path (Main Effort). Minimum Time-to-Completion:{" "}
                    <span className="text-amber-300 font-mono">{cpm.totalMinDurationMins} mins</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    HAVE: {quant.haveCount}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    NEED: {quant.needCount}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/30">
                    BLOCKED: {quant.blockedCount}
                  </span>
                </div>
              </div>

              <div className="space-y-2.5">
                {draft.nodes.map((node) => {
                  const m = cpm.metrics[node.id];
                  const isCrit = m?.isCritical;
                  return (
                    <div
                      key={node.id}
                      className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 transition ${
                        isCrit
                          ? "border-amber-400/75 bg-amber-500/10 shadow-[0_0_24px_rgba(245,158,11,0.18)]"
                          : "border-white/10 bg-[#0e1424]/80"
                      }`}
                    >
                      <div className="space-y-1 min-w-[220px]">
                        <div className="flex items-center gap-2">
                          {isCrit && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-400 text-zinc-950 font-mono text-[9px] font-medium uppercase">
                              CRITICAL PATH · SLACK 0
                            </span>
                          )}
                          <span className="text-sm font-medium text-white">{node.title}</span>
                        </div>
                        <div className="text-[11px] font-mono text-zinc-400">
                          ES: {m?.es ?? 0}m · EF: {m?.ef ?? 0}m · LS: {m?.ls ?? 0}m · LF: {m?.lf ?? 0}m · Slack:{" "}
                          <span className={isCrit ? "text-amber-300" : "text-cyan-300"}>{m?.slack ?? 0}m</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {(["HAVE", "NEED", "BLOCKED"] as BomBucket[]).map((bucket) => (
                          <button
                            key={bucket}
                            type="button"
                            onClick={() => updateNode(node.id, { bomStatus: bucket })}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition ${
                              node.bomStatus === bucket
                                ? bucket === "HAVE"
                                  ? "bg-emerald-500 text-zinc-950 border-emerald-400"
                                  : bucket === "NEED"
                                  ? "bg-amber-400 text-zinc-950 border-amber-300"
                                  : "bg-rose-500 text-white border-rose-400"
                                : "bg-black/40 text-zinc-400 border-white/10 hover:text-white"
                            }`}
                          >
                            {bucket}
                          </button>
                        ))}

                        {node.bomStatus === "NEED" && (
                          <button
                            type="button"
                            onClick={() => handleCreateAcquisitionTask(node.title)}
                            className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/35 text-[11px] font-mono hover:bg-cyan-500/30 transition"
                          >
                            + Create Acquisition Task
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STAGE 4: TACTICAL SYNC, FRAGO, IF/THEN PACE & DEPLOY MISSION */}
          {stage === 4 && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-medium text-white">
                    Stage 4: Tactical Synchronization, 5-Paragraph FRAGO &amp; IF/THEN PACE Guardrails
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Sequence Passive-First tasks, separate Operator vs Build Mode, and deploy straight to Pristine PMS &amp; Calendar.
                  </p>
                </div>
                <button
                  type="button"
                  data-testid="mission-deploy-btn"
                  onClick={handleDeployMission}
                  disabled={deploying}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-300 to-cyan-400 text-zinc-950 font-mono text-xs font-medium uppercase tracking-wider shadow-xl hover:brightness-110 transition disabled:opacity-50"
                >
                  <Rocket size={14} />
                  <span>{deploying ? "Deploying..." : "Deploy Mission (PMS + Calendar + DAG)"}</span>
                </button>
              </div>

              {/* Execution Mode & Passive-First Sequencing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {draft.nodes.map((n) => (
                  <div
                    key={n.id}
                    className="p-3.5 rounded-2xl border border-white/10 bg-[#0e1424] flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-white truncate">{n.title}</div>
                      <div className="text-[10px] font-mono text-zinc-400">
                        Ceiling: {n.timeBoxCeilingMins}m · Exit: {n.exitCriteria}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 font-mono">
                      <select
                        value={n.workMode}
                        onChange={(e) => updateNode(n.id, { workMode: e.target.value as ExecutionWorkMode })}
                        className="px-2 py-1 rounded-lg bg-black/50 border border-white/10 text-[11px] text-cyan-300"
                      >
                        <option value="PASSIVE">PASSIVE FIRST</option>
                        <option value="OPERATOR">OPERATOR</option>
                        <option value="BUILD">BUILD MODE</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              {/* 5-Paragraph FRAGO */}
              <div className="p-4 rounded-2xl border border-white/10 bg-[#0e1424] space-y-2.5">
                <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
                  5-Paragraph Tactical FRAGO
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                  {(
                    [
                      ["situation", "1. Situation"],
                      ["mission", "2. Mission"],
                      ["execution", "3. Execution"],
                      ["sustainment", "4. Sustainment"],
                      ["command", "5. Command & Signal"],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key} className={key === "execution" ? "md:col-span-2" : ""}>
                      <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">{label}</label>
                      <input
                        type="text"
                        value={draft.frago[key]}
                        onChange={(e) =>
                          setDraft((p) => ({ ...p, frago: { ...p.frago, [key]: e.target.value } }))
                        }
                        className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-zinc-200"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* IF/THEN PACE Decision Support Matrix */}
              <div className="p-4 rounded-2xl border border-white/10 bg-[#0e1424] space-y-2.5">
                <div className="text-xs font-mono text-amber-400 uppercase tracking-wider">
                  Decision Support Matrix · IF [Trigger] → THEN [Action] (PACE)
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {draft.paceMatrix.map((rule) => (
                    <div
                      key={rule.tier}
                      className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1.5 text-xs font-mono"
                    >
                      <div className="text-amber-300 font-medium">
                        [{rule.tier}] {rule.label}
                      </div>
                      <input
                        type="text"
                        value={rule.ifTrigger}
                        onChange={(e) =>
                          setDraft((p) => ({
                            ...p,
                            paceMatrix: p.paceMatrix.map((r) =>
                              r.tier === rule.tier ? { ...r, ifTrigger: e.target.value } : r
                            ),
                          }))
                        }
                        placeholder="IF [Trigger]..."
                        className="w-full px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] text-zinc-300"
                      />
                      <input
                        type="text"
                        value={rule.thenAction}
                        onChange={(e) =>
                          setDraft((p) => ({
                            ...p,
                            paceMatrix: p.paceMatrix.map((r) =>
                              r.tier === rule.tier ? { ...r, thenAction: e.target.value } : r
                            ),
                          }))
                        }
                        placeholder="THEN [Action]..."
                        className="w-full px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] text-emerald-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STAGE 5: LIVE TELEMETRY HUD & 60-SECOND AAR CLOSEOUT / LESSON VAULT */}
          {stage === 5 && (
            <div className="space-y-5">
              {/* Live Mission Quantification HUD */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
                <div className="p-4 rounded-2xl border border-cyan-500/30 bg-cyan-950/20">
                  <div className="text-[10px] text-cyan-400 uppercase">Mission Readiness Score</div>
                  <div className="text-2xl text-white mt-1">{quant.readinessScore}%</div>
                  <div className="text-[10px] text-zinc-400">Weighted BOM HAVE + Unblocked</div>
                </div>
                <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-950/20">
                  <div className="text-[10px] text-amber-400 uppercase">Critical Path Velocity</div>
                  <div className="text-2xl text-amber-300 mt-1">{quant.velocity}</div>
                  <div className="text-[10px] text-zinc-400">CPM Min: {cpm.totalMinDurationMins} mins</div>
                </div>
                <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/20">
                  <div className="text-[10px] text-emerald-400 uppercase">Scope Completion</div>
                  <div className="text-2xl text-emerald-300 mt-1">{quant.scopeCompletionPct}%</div>
                  <div className="text-[10px] text-zinc-400">
                    {quant.completedCount}/{quant.totalNodes} WBS Nodes Done
                  </div>
                </div>
                <div className="p-4 rounded-2xl border border-white/15 bg-[#0e1424]">
                  <div className="text-[10px] text-zinc-400 uppercase mb-2">Active PACE Switcher</div>
                  <div className="grid grid-cols-4 gap-1">
                    {(["P", "A", "C", "E"] as PaceType[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setDraft((p) => ({ ...p, activePace: t }))}
                        className={`py-1.5 rounded-lg text-xs transition ${
                          draft.activePace === t
                            ? "bg-cyan-400 text-zinc-950 font-medium"
                            : "bg-white/5 text-zinc-400 hover:text-white"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live Deliverable Check-off List */}
              {draft.nodes.length > 0 && (
                <div className="p-4 rounded-2xl border border-white/10 bg-[#0e1424] space-y-2">
                  <div className="text-xs font-mono text-zinc-400 uppercase">Live Execution Checklist</div>
                  {draft.nodes.map((n) => (
                    <label
                      key={n.id}
                      className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-black/40 border border-white/5 cursor-pointer hover:border-cyan-400/30"
                    >
                      <span className="flex items-center gap-2.5 text-xs">
                        <input
                          type="checkbox"
                          checked={n.completed}
                          onChange={() => updateNode(n.id, { completed: !n.completed })}
                        />
                        <span className={n.completed ? "line-through text-zinc-500" : "text-white"}>
                          {n.title}
                        </span>
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">{n.durationMins}m</span>
                    </label>
                  ))}
                </div>
              )}

              {/* 60-Second AAR Closeout & Searchable Lesson Vault */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <form
                  onSubmit={handleSaveAar}
                  className="p-4 rounded-2xl border border-amber-500/30 bg-[#0e1424] space-y-3"
                >
                  <div className="text-xs font-mono text-amber-300 uppercase flex items-center gap-1.5">
                    <Flag size={13} />
                    <span>60-Second AAR Closeout</span>
                  </div>
                  <input
                    type="text"
                    value={aarWorked}
                    onChange={(e) => setAarWorked(e.target.value)}
                    placeholder="1. What worked?"
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white"
                  />
                  <input
                    type="text"
                    value={aarBroke}
                    onChange={(e) => setAarBroke(e.target.value)}
                    placeholder="2. What broke down?"
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white"
                  />
                  <input
                    type="text"
                    value={aarRule}
                    onChange={(e) => setAarRule(e.target.value)}
                    placeholder="3. What single rule changes next time?"
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white"
                  />
                  <button
                    type="submit"
                    disabled={savingAar}
                    className="w-full py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-mono text-xs font-medium uppercase"
                  >
                    {savingAar ? "Saving to Vault..." : "Save AAR to Lesson Vault"}
                  </button>
                </form>

                <div className="p-4 rounded-2xl border border-white/10 bg-[#0e1424] space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono text-cyan-400 uppercase flex items-center gap-1.5">
                      <BookOpen size={13} />
                      <span>Searchable Lesson Vault ({lessons.length})</span>
                    </span>
                    <div className="relative">
                      <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input
                        type="text"
                        value={lessonSearch}
                        onChange={(e) => setLessonSearch(e.target.value)}
                        placeholder="Search lessons..."
                        className="pl-7 pr-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-[11px] text-white w-40"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {filteredLessons.length === 0 ? (
                      <div className="py-6 text-center text-[11px] font-mono text-zinc-500">
                        No AAR lessons logged yet. Complete your first 60-second closeout on the left.
                      </div>
                    ) : (
                      filteredLessons.map((l) => (
                        <div key={l.id} className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-[11px] space-y-1">
                          <div className="font-mono text-amber-300">{l.missionTitle}</div>
                          {l.ruleChange && <div className="text-emerald-300">Rule: {l.ruleChange}</div>}
                          {l.whatWorked && <div className="text-zinc-400">Worked: {l.whatWorked}</div>}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER STEPPER CONTROLS */}
        <div className="px-4 sm:px-6 py-3 border-t border-white/10 bg-[#0d1220] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => setStage((s) => Math.max(0, s - 1))}
            disabled={stage === 0}
            className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl border border-white/10 text-xs font-mono text-zinc-300 hover:text-white disabled:opacity-30"
          >
            <ChevronLeft size={14} />
            <span>Back</span>
          </button>

          <div className="text-[11px] font-mono text-zinc-400">
            Stage {stage} of 5 · {STAGES[stage].label}
          </div>

          <button
            type="button"
            onClick={() => setStage((s) => Math.min(5, s + 1))}
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
