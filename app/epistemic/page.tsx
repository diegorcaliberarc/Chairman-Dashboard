"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  Cpu,
  Plus,
  CheckCircle2,
  ArrowLeftRight,
  Trash2,
  FileText,
  Layers,
  Edit3,
  Save,
  X,
  Zap,
  Radar,
} from "lucide-react";
import { ExecutiveModuleShell } from "@/components/chairman/ExecutiveModuleShell";

type EpistemicCategory = "known_known" | "unknown_known" | "unknown_unknown";
type EpistemicImpact = "tactical" | "operational" | "existential";

interface EpistemicMatrix {
  id: string;
  user_id: string;
  entity_id: string;
  entity_type: string;
  title: string;
  summary: string | null;
  created_at: string;
  updated_at: string;
}

interface EpistemicItem {
  id: string;
  matrix_id: string;
  category: EpistemicCategory;
  impact: EpistemicImpact;
  claim_statement: string;
  validation_protocol: string | null;
  is_mitigated: boolean;
  sort_order: number;
  created_at: string;
}

const SAMPLE_PRD_BRIEF = `PRD: Equipsynx Autonomous Yard Gate & Real-Time Dispatch Engine (Q3 Sprint)
1. System will ingest 50Hz RFID + ALPR camera webhooks across 14 commercial equipment yards into Supabase PostgreSQL with strict tenant RLS isolation and <120ms p95 dispatch latency.
2. Field mechanics already log OBD-II engine-hour and hydraulic pressure readings inside Chairman Living OS Fleet Telemetry, and historical ClickUp dispatch checklists contain 18 months of turnaround benchmarks.
3. External cellular modems at remote rural yards experience intermittent 20-minute LTE blackouts during storms, while enterprise general contractors require immutable audit logs and automated SMS/MCP escalation whenever high-tonnage cranes miss return windows.`;

const IMPACT_META: Record<
  EpistemicImpact,
  { label: string; badgeClass: string; dotColor: string }
> = {
  existential: {
    label: "EXISTENTIAL",
    badgeClass:
      "bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-[0_0_12px_rgba(225,29,72,0.25)]",
    dotColor: "#e11d48",
  },
  operational: {
    label: "OPERATIONAL",
    badgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/40",
    dotColor: "#f59e0b",
  },
  tactical: {
    label: "TACTICAL",
    badgeClass: "bg-cyan-500/15 text-cyan-300 border-cyan-500/35",
    dotColor: "#00b4d8",
  },
};

const COLUMN_CONFIG: Array<{
  category: EpistemicCategory;
  code: string;
  title: string;
  subtitle: string;
  accent: string;
  glowBg: string;
  borderTint: string;
  icon: React.ReactNode;
}> = [
  {
    category: "known_known",
    code: "COL-01 // VERIFIED REALITY",
    title: "The Known Knowns",
    subtitle: "Verified Operational Reality & Proven Invariants",
    accent: "#00b4d8",
    glowBg: "rgba(0, 180, 216, 0.07)",
    borderTint: "rgba(0, 180, 216, 0.34)",
    icon: <ShieldCheck size={17} style={{ color: "#00b4d8" }} />,
  },
  {
    category: "unknown_known",
    code: "COL-02 // DORMANT MOATS",
    title: "The Unknown Knowns",
    subtitle: "Tacit Assets, Reusable Data & Untapped Leverage",
    accent: "#f59e0b",
    glowBg: "rgba(245, 158, 11, 0.07)",
    borderTint: "rgba(245, 158, 11, 0.34)",
    icon: <Zap size={17} style={{ color: "#f59e0b" }} />,
  },
  {
    category: "unknown_unknown",
    code: "COL-03 // THREAT HORIZON",
    title: "The Unknown Unknowns",
    subtitle: "Latent Vulnerabilities & Emergent Tail Hazards",
    accent: "#e11d48",
    glowBg: "rgba(225, 29, 72, 0.07)",
    borderTint: "rgba(225, 29, 72, 0.36)",
    icon: <AlertTriangle size={17} style={{ color: "#e11d48" }} />,
  },
];

export default function EpistemicMatrixPage() {
  const [matrices, setMatrices] = useState<EpistemicMatrix[]>([]);
  const [items, setItems] = useState<EpistemicItem[]>([]);
  const [selectedMatrixId, setSelectedMatrixId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [impactFilter, setImpactFilter] = useState<"all" | EpistemicImpact>("all");

  // AI Epistemic Audit Gate state
  const [auditOpen, setAuditOpen] = useState(true);
  const [briefText, setBriefText] = useState("");
  const [auditTargetMode, setAuditTargetMode] = useState<"current" | "new">("current");
  const [auditNewMatrixTitle, setAuditNewMatrixTitle] = useState("");
  const [auditing, setAuditing] = useState(false);
  const [lastAuditReport, setLastAuditReport] = useState<{
    summary: string;
    engine: string;
    highlightedIds: string[];
  } | null>(null);

  // New Matrix Modal
  const [showMatrixModal, setShowMatrixModal] = useState(false);
  const [newMatrixTitle, setNewMatrixTitle] = useState("");
  const [newMatrixType, setNewMatrixType] = useState("venture");
  const [newMatrixSummary, setNewMatrixSummary] = useState("");

  // Inline Composer per Column
  const [addingCategory, setAddingCategory] = useState<EpistemicCategory | null>(
    null
  );
  const [draftClaim, setDraftClaim] = useState("");
  const [draftProtocol, setDraftProtocol] = useState("");
  const [draftImpact, setDraftImpact] = useState<EpistemicImpact>("operational");

  // Inline Protocol Editor
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editClaimText, setEditClaimText] = useState("");
  const [editProtocolText, setEditProtocolText] = useState("");
  const [editImpactVal, setEditImpactVal] =
    useState<EpistemicImpact>("operational");

  // Promotion toast / animation state
  const [promotingId, setPromotingId] = useState<string | null>(null);
  const [recentlyPromotedIds, setRecentlyPromotedIds] = useState<Set<string>>(
    new Set()
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/epistemic", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data.matrices)) {
        setMatrices(data.matrices);
        setItems(Array.isArray(data.items) ? data.items : []);
        setSelectedMatrixId((prev) =>
          prev && data.matrices.some((m: EpistemicMatrix) => m.id === prev)
            ? prev
            : data.matrices[0]?.id || ""
        );
      }
    } catch (err) {
      console.error("Failed loading epistemic matrices:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeMatrix = useMemo(
    () => matrices.find((m) => m.id === selectedMatrixId) || null,
    [matrices, selectedMatrixId]
  );

  const matrixItems = useMemo(() => {
    return items.filter(
      (it) =>
        it.matrix_id === selectedMatrixId &&
        (impactFilter === "all" || it.impact === impactFilter)
    );
  }, [items, selectedMatrixId, impactFilter]);

  const telemetry = useMemo(() => {
    const allForMatrix = items.filter((i) => i.matrix_id === selectedMatrixId);
    const known = allForMatrix.filter((i) => i.category === "known_known").length;
    const unknownKnown = allForMatrix.filter(
      (i) => i.category === "unknown_known"
    ).length;
    const unknownUnknown = allForMatrix.filter(
      (i) => i.category === "unknown_unknown"
    ).length;
    const existentialHazards = allForMatrix.filter(
      (i) => i.category === "unknown_unknown" && i.impact === "existential"
    ).length;
    const certaintyPct =
      allForMatrix.length > 0
        ? Math.round((known / allForMatrix.length) * 100)
        : 100;
    return {
      total: allForMatrix.length,
      known,
      unknownKnown,
      unknownUnknown,
      existentialHazards,
      certaintyPct,
    };
  }, [items, selectedMatrixId]);

  const handleCreateMatrix = async () => {
    if (!newMatrixTitle.trim()) return;
    const res = await fetch("/api/epistemic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create_matrix",
        title: newMatrixTitle.trim(),
        entity_type: newMatrixType,
        summary: newMatrixSummary.trim() || null,
      }),
    });
    const data = await res.json();
    if (res.ok && data.matrix) {
      setMatrices(data.matrices || []);
      setItems(data.items || []);
      setSelectedMatrixId(data.matrix.id);
      setShowMatrixModal(false);
      setNewMatrixTitle("");
      setNewMatrixSummary("");
    }
  };

  const handleRunAiAudit = async () => {
    if (!briefText.trim()) return;
    setAuditing(true);
    try {
      const res = await fetch("/api/epistemic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ai_audit",
          matrixId: selectedMatrixId,
          briefText: briefText.trim(),
          createNewMatrixTitle:
            auditTargetMode === "new"
              ? auditNewMatrixTitle.trim() || "AI Audited Sprint Matrix"
              : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.matrices)) {
        setMatrices(data.matrices);
        setItems(data.items || []);
        if (data.matrixId) setSelectedMatrixId(data.matrixId);
        setLastAuditReport({
          summary: data.auditSummary || "Epistemic extraction completed.",
          engine:
            data.engineUsed === "gemini"
              ? "Gemini 2.5 Flash Neural Gate"
              : "Deterministic Heuristic Epistemic Analyzer",
          highlightedIds: Array.isArray(data.insertedIds)
            ? data.insertedIds
            : [],
        });
      }
    } catch (err) {
      console.error("AI Epistemic Audit error:", err);
    } finally {
      setAuditing(false);
    }
  };

  const handlePromoteToKnownKnown = async (item: EpistemicItem) => {
    setPromotingId(item.id);
    try {
      const res = await fetch("/api/epistemic", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "promote_to_known_known",
          itemId: item.id,
        }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.items)) {
        setItems(data.items);
        setMatrices(data.matrices || matrices);
        setRecentlyPromotedIds((prev) => {
          const next = new Set(prev);
          next.add(item.id);
          return next;
        });
      }
    } finally {
      setPromotingId(null);
    }
  };

  const handleAddItem = async (category: EpistemicCategory) => {
    if (!draftClaim.trim() || !selectedMatrixId) return;
    const res = await fetch("/api/epistemic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create_item",
        matrix_id: selectedMatrixId,
        category,
        impact: draftImpact,
        claim_statement: draftClaim.trim(),
        validation_protocol:
          draftProtocol.trim() ||
          "Empirical validation protocol pending Chairman sign-off.",
      }),
    });
    const data = await res.json();
    if (res.ok && Array.isArray(data.items)) {
      setItems(data.items);
      setAddingCategory(null);
      setDraftClaim("");
      setDraftProtocol("");
      setDraftImpact("operational");
    }
  };

  const handleSaveEditedItem = async (itemId: string) => {
    const res = await fetch("/api/epistemic", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_item",
        itemId,
        claim_statement: editClaimText,
        validation_protocol: editProtocolText,
        impact: editImpactVal,
      }),
    });
    const data = await res.json();
    if (res.ok && Array.isArray(data.items)) {
      setItems(data.items);
      setEditingItemId(null);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    const res = await fetch(
      `/api/epistemic?itemId=${encodeURIComponent(itemId)}`,
      { method: "DELETE" }
    );
    const data = await res.json();
    if (res.ok && Array.isArray(data.items)) {
      setItems(data.items);
    }
  };

  return (
    <ExecutiveModuleShell
      moduleId="EPISTEMIC"
      eyebrow="Section 20 · Rumsfeldian Risk & Leverage Architecture"
      title="Strategic Epistemic Planning Matrix"
      subtitle="3-Column Military Triage HUD, 1-Click Hazard Mitigation Promotion & Automated AI Epistemic Audit Gate"
      accentColor="#00b4d8"
      headerActions={
        <>
          <button
            onClick={() => setAuditOpen((v) => !v)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${
              auditOpen
                ? "bg-cyan-500/20 border-cyan-400/50 text-cyan-200"
                : "bg-white/[0.04] border-white/10 text-zinc-300 hover:bg-white/10"
            }`}
          >
            <Cpu size={14} />
            {auditOpen ? "Hide AI Audit Gate" : "Open AI Audit Gate"}
          </button>
          <button
            onClick={() => setShowMatrixModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#00b4d8] hover:bg-[#0096c7] text-[#05080f] text-xs font-extrabold uppercase tracking-wider transition-all shadow-lg shadow-cyan-500/20"
          >
            <Plus size={14} />
            New Matrix
          </button>
        </>
      }
    >
      {/* Matrix Selector & Military Readiness Telemetry Strip */}
      <div className="p-4 rounded-2xl bg-[#0c111d]/95 border border-white/[0.08] flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Matrix Switcher Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-[10.5px] font-mono uppercase tracking-widest text-zinc-400 mr-1">
            <Layers size={13} className="text-cyan-400" />
            Active Matrix:
          </div>
          {matrices.map((m) => {
            const active = m.id === selectedMatrixId;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedMatrixId(m.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border flex items-center gap-2 ${
                  active
                    ? "bg-cyan-500/15 border-cyan-400/50 text-white shadow-md shadow-cyan-950/50"
                    : "bg-white/[0.03] border-white/[0.07] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06]"
                }`}
              >
                <span className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] font-mono uppercase tracking-wider text-cyan-300">
                  {m.entity_type}
                </span>
                <span className="truncate max-w-[230px]">{m.title}</span>
              </button>
            );
          })}
        </div>

        {/* Readiness Telemetry & Impact Filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-black/45 border border-white/[0.08] text-xs font-mono">
            <span className="text-cyan-300 font-bold">
              {telemetry.certaintyPct}% VERIFIED
            </span>
            <span className="text-zinc-600">|</span>
            <span className="text-amber-300">
              {telemetry.unknownKnown} LEVERAGE
            </span>
            <span className="text-zinc-600">|</span>
            <span
              className={`inline-flex items-center gap-1 font-bold ${
                telemetry.existentialHazards > 0
                  ? "text-rose-400"
                  : "text-emerald-400"
              }`}
            >
              {telemetry.existentialHazards > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              )}
              {telemetry.existentialHazards} EXISTENTIAL HAZARDS
            </span>
          </div>

          <div className="flex rounded-xl overflow-hidden border border-white/[0.09] bg-black/45 text-[11px]">
            {(["all", "existential", "operational", "tactical"] as const).map(
              (imp) => (
                <button
                  key={imp}
                  onClick={() => setImpactFilter(imp)}
                  className={`px-2.5 py-1.5 font-bold uppercase tracking-wider transition-colors ${
                    impactFilter === imp
                      ? "bg-white/15 text-white"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {imp}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Active Matrix Executive Summary Banner */}
      {activeMatrix?.summary && (
        <div className="px-4 py-3 rounded-xl bg-white/[0.025] border border-white/[0.06] flex items-center justify-between gap-3 text-xs text-zinc-300">
          <div className="flex items-center gap-2.5">
            <Radar size={15} className="text-cyan-400 shrink-0" />
            <span>{activeMatrix.summary}</span>
          </div>
          <span className="text-[10px] font-mono text-zinc-500 shrink-0 hidden sm:inline">
            ENTITY_ID: {activeMatrix.entity_id}
          </span>
        </div>
      )}

      {/* Automated AI Epistemic Audit Gate */}
      {auditOpen && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0d1526] via-[#0b101b] to-[#130d1c] border border-cyan-500/25 shadow-2xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
                <Sparkles size={16} />
              </div>
              <div>
                <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-white">
                  Automated AI Epistemic Audit Gate
                </h2>
                <p className="text-[11px] text-zinc-400">
                  Paste any PRD, sprint plan, capital thesis, or architecture brief — extracts Known Knowns, Tacit Leverage & Latent Blindspots directly into PostgreSQL.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setBriefText(SAMPLE_PRD_BRIEF)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-[11px] font-semibold text-zinc-200 transition-colors"
              >
                <FileText size={12} className="text-amber-400" />
                Load Sample Sprint PRD
              </button>

              <select
                value={auditTargetMode}
                onChange={(e) =>
                  setAuditTargetMode(e.target.value as "current" | "new")
                }
                className="px-2.5 py-1.5 rounded-lg bg-black/50 border border-white/15 text-[11px] text-zinc-200 focus:outline-none"
              >
                <option value="current" className="bg-[#0d111d]">
                  Append to Active Matrix
                </option>
                <option value="new" className="bg-[#0d111d]">
                  Create Dedicated Matrix
                </option>
              </select>
            </div>
          </div>

          {auditTargetMode === "new" && (
            <input
              type="text"
              value={auditNewMatrixTitle}
              onChange={(e) => setAuditNewMatrixTitle(e.target.value)}
              placeholder="New Matrix Title (e.g. Q3 Autonomous Gate Audit)..."
              className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/15 text-xs text-white focus:outline-none focus:border-cyan-400"
            />
          )}

          <textarea
            value={briefText}
            onChange={(e) => setBriefText(e.target.value)}
            rows={4}
            placeholder="Paste raw PRD, technical architecture brief, trading risk doctrine, or infrastructure plan here..."
            className="w-full p-3.5 rounded-xl bg-[#070a12] border border-white/[0.09] focus:border-cyan-400/60 focus:outline-none text-xs font-mono leading-relaxed text-zinc-200 resize-y"
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-[11px] text-zinc-400 font-mono">
              Engine: <span className="text-cyan-300">@google/generative-ai</span>{" "}
              with deterministic heuristic fallback if offline/unconfigured.
            </div>
            <button
              type="button"
              onClick={handleRunAiAudit}
              disabled={!briefText.trim() || auditing}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00b4d8] to-[#2563eb] hover:brightness-110 disabled:opacity-45 text-white text-xs font-extrabold uppercase tracking-wider shadow-lg shadow-cyan-500/20 transition-all"
            >
              <Cpu size={14} className={auditing ? "animate-spin" : ""} />
              {auditing
                ? "Running Rumsfeldian Audit..."
                : "Run AI Epistemic Audit"}
            </button>
          </div>

          {lastAuditReport && (
            <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-400/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-300 font-bold">
                  Audit Complete · {lastAuditReport.engine} · +
                  {lastAuditReport.highlightedIds.length} Vectors Injected
                </div>
                <p className="text-xs text-zinc-200 leading-relaxed">
                  {lastAuditReport.summary}
                </p>
              </div>
              <button
                onClick={() => setLastAuditReport(null)}
                className="text-zinc-400 hover:text-white self-end sm:self-center"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3-Column Military Triage HUD */}
      {loading ? (
        <div className="p-12 text-center text-zinc-400 text-sm font-mono">
          Calibrating Epistemic Triage HUD from Supabase PostgreSQL...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          {COLUMN_CONFIG.map((col) => {
            const colItems = matrixItems.filter(
              (i) => i.category === col.category
            );

            return (
              <div
                key={col.category}
                className="rounded-2xl bg-[#0b101b]/95 border flex flex-col overflow-hidden shadow-2xl"
                style={{ borderColor: col.borderTint }}
              >
                {/* Column Tactical Header */}
                <div
                  className="p-4 border-b"
                  style={{
                    background: `linear-gradient(180deg, ${col.glowBg} 0%, rgba(11,16,27,0.4) 100%)`,
                    borderColor: col.borderTint,
                  }}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span
                      className="text-[9.5px] font-mono font-bold tracking-[0.18em] uppercase"
                      style={{ color: col.accent }}
                    >
                      {col.code}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold"
                      style={{
                        backgroundColor: `${col.accent}22`,
                        color: col.accent,
                      }}
                    >
                      {colItems.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {col.icon}
                    <h3 className="text-sm font-extrabold tracking-wide uppercase text-white">
                      {col.title}
                    </h3>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">{col.subtitle}</p>
                </div>

                {/* Column Items Stack */}
                <div className="p-3.5 space-y-3 flex-1 min-h-[420px]">
                  {colItems.length === 0 ? (
                    <div className="p-6 rounded-xl border border-dashed border-white/[0.08] text-center text-xs text-zinc-500">
                      No vectors in {col.title} matching active filter.
                    </div>
                  ) : (
                    colItems.map((item) => {
                      const impMeta =
                        IMPACT_META[item.impact] || IMPACT_META.operational;
                      const isEditing = editingItemId === item.id;
                      const isNewlyAudited =
                        lastAuditReport?.highlightedIds.includes(item.id);
                      const wasJustPromoted = recentlyPromotedIds.has(item.id);

                      return (
                        <div
                          key={item.id}
                          className={`p-3.5 rounded-xl bg-[#0f1626]/90 border transition-all space-y-2.5 ${
                            isNewlyAudited
                              ? "border-cyan-400/60 shadow-[0_0_18px_rgba(0,180,216,0.2)]"
                              : wasJustPromoted
                              ? "border-emerald-400/60 shadow-[0_0_18px_rgba(16,185,129,0.2)]"
                              : "border-white/[0.08] hover:border-white/[0.18]"
                          }`}
                        >
                          {/* Top Badges Row */}
                          <div className="flex flex-wrap items-center justify-between gap-1.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[9.5px] font-mono font-bold uppercase tracking-wider border ${impMeta.badgeClass}`}
                              >
                                {impMeta.label}
                              </span>
                              {item.is_mitigated && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-[9.5px] font-mono font-bold uppercase">
                                  <CheckCircle2 size={10} />
                                  MITIGATED
                                </span>
                              )}
                              {isNewlyAudited && (
                                <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-200 text-[9px] font-mono font-bold uppercase">
                                  AI AUDIT
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  if (isEditing) {
                                    setEditingItemId(null);
                                  } else {
                                    setEditingItemId(item.id);
                                    setEditClaimText(item.claim_statement);
                                    setEditProtocolText(
                                      item.validation_protocol || ""
                                    );
                                    setEditImpactVal(item.impact);
                                  }
                                }}
                                className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                                title="Edit Claim & Validation Protocol"
                              >
                                <Edit3 size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-1 rounded hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 transition-colors"
                                title="Delete Item"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>

                          {isEditing ? (
                            <div className="space-y-2 pt-1">
                              <select
                                value={editImpactVal}
                                onChange={(e) =>
                                  setEditImpactVal(
                                    e.target.value as EpistemicImpact
                                  )
                                }
                                className="w-full px-2.5 py-1.5 rounded bg-black/50 border border-white/15 text-xs text-white"
                              >
                                <option value="tactical" className="bg-[#0b101b]">
                                  Tactical Impact
                                </option>
                                <option
                                  value="operational"
                                  className="bg-[#0b101b]"
                                >
                                  Operational Impact
                                </option>
                                <option
                                  value="existential"
                                  className="bg-[#0b101b]"
                                >
                                  Existential Impact
                                </option>
                              </select>
                              <textarea
                                value={editClaimText}
                                onChange={(e) => setEditClaimText(e.target.value)}
                                rows={3}
                                className="w-full p-2 rounded bg-black/50 border border-white/15 text-xs text-white"
                              />
                              <textarea
                                value={editProtocolText}
                                onChange={(e) =>
                                  setEditProtocolText(e.target.value)
                                }
                                rows={2}
                                placeholder="Validation protocol..."
                                className="w-full p-2 rounded bg-black/50 border border-white/15 text-[11px] font-mono text-zinc-300"
                              />
                              <div className="flex justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setEditingItemId(null)}
                                  className="px-2.5 py-1 rounded bg-white/5 text-[11px] text-zinc-300"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditedItem(item.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-600 text-[11px] font-bold text-white"
                                >
                                  <Save size={11} />
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {/* Claim Statement */}
                              <p className="text-xs font-medium text-zinc-100 leading-relaxed">
                                {item.claim_statement}
                              </p>

                              {/* Validation Protocol Box */}
                              {item.validation_protocol && (
                                <div className="p-2.5 rounded-lg bg-black/40 border border-white/[0.05] space-y-1">
                                  <div className="text-[9.5px] font-mono uppercase tracking-wider text-zinc-500">
                                    Validation / Mitigation Protocol
                                  </div>
                                  <p className="text-[11px] text-zinc-300 leading-relaxed font-mono">
                                    {item.validation_protocol}
                                  </p>
                                </div>
                              )}

                              {/* 1-Click Conversion Workflow for Columns 2 & 3 */}
                              {col.category !== "known_known" && (
                                <button
                                  type="button"
                                  onClick={() => handlePromoteToKnownKnown(item)}
                                  disabled={promotingId === item.id}
                                  className="w-full mt-1 py-2 px-3 rounded-lg text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 border transition-all hover:brightness-110"
                                  style={{
                                    backgroundColor:
                                      col.category === "unknown_unknown"
                                        ? "rgba(0, 180, 216, 0.14)"
                                        : "rgba(245, 158, 11, 0.14)",
                                    borderColor:
                                      col.category === "unknown_unknown"
                                        ? "rgba(0, 180, 216, 0.4)"
                                        : "rgba(245, 158, 11, 0.4)",
                                    color:
                                      col.category === "unknown_unknown"
                                        ? "#67e8f9"
                                        : "#fcd34d",
                                  }}
                                >
                                  <ArrowLeftRight size={12} />
                                  {promotingId === item.id
                                    ? "Promoting to Verified Reality..."
                                    : "Mitigate & Promote to Known Known"}
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Column Footer / Inline Vector Composer */}
                <div className="p-3.5 border-t border-white/[0.07] bg-black/25">
                  {addingCategory === col.category ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                          New Vector ({col.title})
                        </span>
                        <select
                          value={draftImpact}
                          onChange={(e) =>
                            setDraftImpact(e.target.value as EpistemicImpact)
                          }
                          className="px-2 py-0.5 rounded bg-black/60 border border-white/15 text-[10.5px] text-white"
                        >
                          <option value="tactical" className="bg-[#0b101b]">
                            Tactical
                          </option>
                          <option value="operational" className="bg-[#0b101b]">
                            Operational
                          </option>
                          <option value="existential" className="bg-[#0b101b]">
                            Existential
                          </option>
                        </select>
                      </div>
                      <textarea
                        value={draftClaim}
                        onChange={(e) => setDraftClaim(e.target.value)}
                        rows={2}
                        placeholder="Claim statement, asset, or risk vector..."
                        className="w-full p-2.5 rounded-lg bg-black/50 border border-white/15 text-xs text-white focus:outline-none"
                        autoFocus
                      />
                      <input
                        type="text"
                        value={draftProtocol}
                        onChange={(e) => setDraftProtocol(e.target.value)}
                        placeholder="Validation or mitigation protocol..."
                        className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-white/15 text-[11px] font-mono text-zinc-300 focus:outline-none"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setAddingCategory(null)}
                          className="px-3 py-1.5 rounded-lg bg-white/5 text-xs text-zinc-400"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddItem(col.category)}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-[#060911]"
                          style={{ backgroundColor: col.accent }}
                        >
                          Log Vector
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setAddingCategory(col.category);
                        setDraftClaim("");
                        setDraftProtocol("");
                        setDraftImpact(
                          col.category === "unknown_unknown"
                            ? "existential"
                            : "operational"
                        );
                      }}
                      className="w-full py-2 rounded-xl border border-dashed border-white/[0.12] hover:border-white/[0.28] text-xs font-semibold text-zinc-400 hover:text-white flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Plus size={13} style={{ color: col.accent }} />
                      Add to {col.title}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Matrix Creator Modal */}
      {showMatrixModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#0d1322] border border-white/15 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-white">
                Initialize Epistemic Planning Matrix
              </h2>
              <button
                onClick={() => setShowMatrixModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10.5px] uppercase tracking-wider text-zinc-400 mb-1">
                  Matrix Title
                </label>
                <input
                  type="text"
                  value={newMatrixTitle}
                  onChange={(e) => setNewMatrixTitle(e.target.value)}
                  placeholder="e.g. Industrial Yard Parcel #2 Acquisition"
                  className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/15 text-xs text-white focus:outline-none focus:border-cyan-400"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[10.5px] uppercase tracking-wider text-zinc-400 mb-1">
                  Entity Classification
                </label>
                <select
                  value={newMatrixType}
                  onChange={(e) => setNewMatrixType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/15 text-xs text-white focus:outline-none"
                >
                  <option value="venture" className="bg-[#0d1322]">
                    Venture / SaaS
                  </option>
                  <option value="capital" className="bg-[#0d1322]">
                    Capital & Futures
                  </option>
                  <option value="infrastructure" className="bg-[#0d1322]">
                    Estate & Infrastructure
                  </option>
                  <option value="sprint" className="bg-[#0d1322]">
                    Engineering Sprint
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-[10.5px] uppercase tracking-wider text-zinc-400 mb-1">
                  Strategic Context Summary
                </label>
                <textarea
                  value={newMatrixSummary}
                  onChange={(e) => setNewMatrixSummary(e.target.value)}
                  rows={3}
                  placeholder="Core mission scope and key operational thresholds..."
                  className="w-full p-3 rounded-lg bg-black/50 border border-white/15 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowMatrixModal(false)}
                className="px-3.5 py-2 rounded-lg bg-white/5 text-xs text-zinc-300"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateMatrix}
                disabled={!newMatrixTitle.trim()}
                className="px-4 py-2 rounded-lg bg-[#00b4d8] hover:bg-[#0096c7] disabled:opacity-45 text-[#05080f] text-xs font-extrabold uppercase tracking-wider"
              >
                Create Matrix
              </button>
            </div>
          </div>
        </div>
      )}
    </ExecutiveModuleShell>
  );
}
