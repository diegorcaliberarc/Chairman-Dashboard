"use client";

import React from "react";
import { StrategicDomain, PaceType } from "@/lib/synthesisRoadmapTypes";
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Bolt,
  Layers,
  Heart,
  Dog,
  Coins,
  Home,
  Smile,
  Wrench,
  Globe,
} from "lucide-react";

interface SynthesisHeaderStripProps {
  currentDomain: StrategicDomain;
  onSelectDomain: (domain: StrategicDomain) => void;
  title: string;
  loeCount: string;
  audit: { have: number; acq: number; blocked: number };
  activePace: PaceType;
  onSelectPace: (pace: PaceType) => void;
  zoomScale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onTriggerSynthesize: () => void;
  onTriggerBackwardChain: () => void;
  isSynthesizing?: boolean;
  /** Optional — ONLY passed by /roadmaps to render the DAG Graph | Execution Pyramid toggle */
  roadmapViewMode?: "dag" | "pyramid";
  onChangeRoadmapViewMode?: (mode: "dag" | "pyramid") => void;
}

const DOMAINS: Array<{
  id: StrategicDomain;
  label: string;
  icon: React.ReactNode;
  color: string;
}> = [
  { id: "master", label: "Master (Unified)", icon: <Globe size={14} />, color: "text-amber-400" },
  { id: "dogs", label: "Dogs (Pack)", icon: <Dog size={14} />, color: "text-cyan-400" },
  { id: "health", label: "Health (155 lb)", icon: <Heart size={14} />, color: "text-rose-400" },
  { id: "wealth", label: "Wealth (SaaS & $)", icon: <Coins size={14} />, color: "text-emerald-400" },
  { id: "family", label: "Family & Home", icon: <Home size={14} />, color: "text-indigo-400" },
  { id: "happiness", label: "Happiness & Mind", icon: <Smile size={14} />, color: "text-purple-400" },
  { id: "custom", label: "Custom Projects", icon: <Wrench size={14} />, color: "text-amber-300" },
];

export function SynthesisHeaderStrip({
  currentDomain,
  onSelectDomain,
  title,
  loeCount,
  audit,
  activePace,
  onSelectPace,
  zoomScale,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onTriggerSynthesize,
  onTriggerBackwardChain,
  isSynthesizing = false,
  roadmapViewMode,
  onChangeRoadmapViewMode,
}: SynthesisHeaderStripProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [auditOpen, setAuditOpen] = React.useState(false);
  const activeDom = DOMAINS.find((d) => d.id === currentDomain) || DOMAINS[0];

  return (
    <section
      className="w-full px-4 sm:px-6 py-2.5 backdrop-blur-xl border-b flex items-center justify-between gap-3 flex-wrap sticky top-0 z-40 transition-colors"
      style={{
        backgroundColor: "var(--glass-surface)",
        borderColor: "var(--glass-border)",
      }}
    >
      {/* Left: Compact Miro/Lucid-style Domain Menu + Directive Title */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="relative">
          <button
            data-testid="roadmap-domain-selector"
            onClick={() => {
              setMenuOpen((v) => !v);
              setAuditOpen(false);
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-2 border"
            style={{
              backgroundColor: "var(--glass-surface-elevated)",
              borderColor: "var(--glass-border)",
              color: "var(--glass-text-primary)",
            }}
          >
            <span className={activeDom.color}>{activeDom.icon}</span>
            <span>{activeDom.label}</span>
            <span className="text-[10px] opacity-60">▾</span>
          </button>

          {menuOpen && (
            <div
              className="absolute left-0 top-10 w-56 rounded-2xl border shadow-2xl p-1.5 z-50 space-y-0.5"
              style={{
                backgroundColor: "var(--glass-surface)",
                borderColor: "var(--glass-border)",
              }}
            >
              {DOMAINS.map((dom) => {
                const isSelected = currentDomain === dom.id;
                return (
                  <button
                    key={dom.id}
                    data-testid={`roadmap-domain-option-${dom.id}`}
                    onClick={() => {
                      onSelectDomain(dom.id);
                      setMenuOpen(false);
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-xs text-left flex items-center gap-2 transition ${
                      isSelected
                        ? "bg-cyan-500/15 text-cyan-500 font-medium"
                        : "hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                    style={{ color: isSelected ? undefined : "var(--glass-text-primary)" }}
                  >
                    <span className={dom.color}>{dom.icon}</span>
                    <span>{dom.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="hidden md:flex items-center gap-2 min-w-0">
          <span className="text-xs font-medium truncate max-w-[260px]" style={{ color: "var(--glass-text-primary)" }} title={title}>
            {title}
          </span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20">
            {loeCount}
          </span>
        </div>
      </div>

      {/* Right: Compact Audit/PACE Popover + Zoom + Backward Chain + Synthesize */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Compact Audit & PACE Menu */}
        <div className="relative">
          <button
            data-testid="roadmap-audit-pace-trigger"
            onClick={() => {
              setAuditOpen((v) => !v);
              setMenuOpen(false);
            }}
            className="px-2.5 py-1.5 rounded-xl border text-[11px] font-mono flex items-center gap-2 transition"
            style={{
              backgroundColor: "var(--glass-surface-elevated)",
              borderColor: "var(--glass-border)",
              color: "var(--glass-text-primary)",
            }}
          >
            <span className="text-emerald-500">● {audit.have}</span>
            <span className="text-amber-500">● {audit.acq}</span>
            <span className="text-rose-500">● {audit.blocked}</span>
            <span className="opacity-40">|</span>
            <span className="text-cyan-500 font-medium">PACE: {activePace}</span>
          </button>

          {auditOpen && (
            <div
              className="absolute left-0 top-10 w-72 rounded-2xl border shadow-2xl p-3.5 z-50 space-y-3"
              style={{
                backgroundColor: "var(--glass-surface)",
                borderColor: "var(--glass-border)",
              }}
            >
              <div className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "var(--glass-text-muted)" }}>
                Resource Audit
              </div>
              <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-mono">
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-500">HAVE: {audit.have}</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-500">ACQ: {audit.acq}</span>
                <span className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-500">BLOCKED: {audit.blocked}</span>
              </div>
              <div className="pt-2 border-t" style={{ borderColor: "var(--glass-border)" }}>
                <div className="text-[10px] font-mono uppercase tracking-wider mb-2" style={{ color: "var(--glass-text-muted)" }}>
                  PACE Protocol
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {(["P", "A", "C", "E"] as PaceType[]).map((pace) => {
                    const isActive = activePace === pace;
                    return (
                      <button
                        key={pace}
                        data-testid={`roadmap-pace-btn-${pace}`}
                        onClick={() => onSelectPace(pace)}
                        className={`py-1.5 rounded-lg font-mono text-xs transition ${
                          isActive
                            ? "bg-cyan-500 text-zinc-950 font-medium"
                            : "bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10"
                        }`}
                        style={{ color: isActive ? undefined : "var(--glass-text-primary)" }}
                      >
                        {pace}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Zoom Controls */}
        <div
          className="hidden sm:flex items-center border p-0.5 rounded-xl text-xs"
          style={{
            backgroundColor: "var(--glass-surface-elevated)",
            borderColor: "var(--glass-border)",
          }}
        >
          <button
            onClick={onZoomOut}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 transition"
            style={{ color: "var(--glass-text-primary)" }}
            title="Zoom Out"
          >
            <ZoomOut size={13} />
          </button>
          <span className="px-1.5 font-mono text-[11px]" style={{ color: "var(--glass-text-muted)" }}>
            {Math.round(zoomScale * 100)}%
          </span>
          <button
            onClick={onZoomIn}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 transition"
            style={{ color: "var(--glass-text-primary)" }}
            title="Zoom In"
          >
            <ZoomIn size={13} />
          </button>
          <button
            onClick={onZoomReset}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-cyan-500 hover:bg-cyan-500/15 transition"
            title="Reset Zoom"
          >
            <RotateCcw size={12} />
          </button>
        </div>

        {/* Exclusive /roadmaps View Switcher: DAG Graph | Execution Pyramid */}
        {roadmapViewMode && onChangeRoadmapViewMode && (
          <div
            className="flex items-center p-0.5 rounded-xl border text-xs font-mono"
            style={{
              backgroundColor: "var(--glass-surface-elevated)",
              borderColor: "var(--glass-border)",
            }}
          >
            <button
              type="button"
              data-testid="roadmap-view-toggle-dag"
              onClick={() => onChangeRoadmapViewMode("dag")}
              className={`px-2.5 py-1 rounded-lg transition ${
                roadmapViewMode === "dag"
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/35 font-medium"
                  : "opacity-70 hover:opacity-100"
              }`}
            >
              DAG Graph
            </button>
            <button
              type="button"
              data-testid="roadmap-view-toggle-pyramid"
              onClick={() => onChangeRoadmapViewMode("pyramid")}
              className={`px-2.5 py-1 rounded-lg transition ${
                roadmapViewMode === "pyramid"
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/35 font-medium"
                  : "opacity-70 hover:opacity-100"
              }`}
            >
              Execution Pyramid
            </button>
          </div>
        )}

        {/* Backward Chaining Button */}
        <button
          data-testid="roadmap-backward-chain-btn"
          onClick={onTriggerBackwardChain}
          className="px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition hover:border-amber-400/60"
          style={{
            backgroundColor: "var(--glass-surface-elevated)",
            borderColor: "var(--glass-border)",
            color: "var(--glass-text-primary)",
          }}
          title="Trace & Audit Backward Dependency Chain"
        >
          <span className="text-amber-500">↺</span>
          <span>Backward Chain</span>
        </button>

        {/* Synthesize DAG Button */}
        <button
          data-testid="roadmap-synthesize-dag-btn"
          onClick={onTriggerSynthesize}
          disabled={isSynthesizing}
          className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-medium text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition disabled:opacity-50"
        >
          <Bolt size={13} className={isSynthesizing ? "animate-spin" : ""} />
          <span>{isSynthesizing ? "Synthesizing..." : "Synthesize DAG"}</span>
        </button>
      </div>
    </section>
  );
}
