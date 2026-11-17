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
}: SynthesisHeaderStripProps) {
  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-3.5 bg-[#0A0D18]/90 backdrop-blur-xl border-b border-white/10 flex flex-col gap-3 sticky top-0 z-30 shadow-2xl">
      {/* 1. Domain Switcher Tabs */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none max-w-full">
          {DOMAINS.map((dom) => {
            const isSelected = currentDomain === dom.id;
            return (
              <button
                key={dom.id}
                onClick={() => onSelectDomain(dom.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wide transition flex items-center gap-1.5 shrink-0 border ${
                  isSelected
                    ? "bg-cyan-500 text-black border-cyan-400 shadow-lg shadow-cyan-500/25 font-black scale-105"
                    : "bg-white/[0.04] text-zinc-400 border-white/5 hover:text-white hover:bg-white/[0.08]"
                }`}
              >
                <span className={isSelected ? "text-black" : dom.color}>{dom.icon}</span>
                <span>{dom.label}</span>
              </button>
            );
          })}
        </div>

        {/* Action Controls & Zoom Controls */}
        <div className="flex items-center gap-2.5">
          {/* Zoom Controls */}
          <div className="hidden sm:flex items-center bg-white/[0.04] border border-white/10 p-1 rounded-xl text-xs">
            <button
              onClick={onZoomOut}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/10 transition"
              title="Zoom Out"
            >
              <ZoomOut size={13} />
            </button>
            <span className="px-2 font-mono text-[11px] font-bold text-zinc-300">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              onClick={onZoomIn}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/10 transition"
              title="Zoom In"
            >
              <ZoomIn size={13} />
            </button>
            <button
              onClick={onZoomReset}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-cyan-400 hover:bg-cyan-400/20 transition ml-0.5"
              title="Reset Zoom"
            >
              <RotateCcw size={12} />
            </button>
          </div>

          {/* Backward Chaining Button */}
          <button
            onClick={onTriggerBackwardChain}
            className="px-3.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white font-semibold text-xs tracking-wider uppercase flex items-center gap-1.5 transition"
            title="Perform Dr. Stone Backward Chaining Audit"
          >
            <span className="text-amber-400">↺</span>
            <span className="hidden md:inline">Backward Chain</span>
          </button>

          {/* Synthesize DAG Button */}
          <button
            onClick={onTriggerSynthesize}
            disabled={isSynthesizing}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-primary text-black font-extrabold text-xs tracking-wider uppercase flex items-center gap-1.5 shadow-lg shadow-cyan-500/25 hover:brightness-110 active:scale-95 transition disabled:opacity-50"
          >
            <Bolt size={14} className={isSynthesizing ? "animate-spin" : ""} />
            <span>{isSynthesizing ? "Synthesizing..." : "Synthesize DAG"}</span>
          </button>
        </div>
      </div>

      {/* 2. Tactical Telemetry & Resource Audit Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 bg-[#0F1424]/80 border border-white/10 p-2.5 rounded-2xl items-center text-xs">
        {/* Objective Directive */}
        <div className="flex items-center gap-2.5 px-3 py-1 border-r border-white/5 md:col-span-1 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-cyan-400/15 flex items-center justify-center text-cyan-300 shrink-0 font-bold">
            ⚡
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] uppercase font-mono font-bold text-cyan-400 tracking-wider">
              Objective Directive
            </span>
            <span className="text-xs text-white font-extrabold truncate" title={title}>
              {title}
            </span>
          </div>
        </div>

        {/* Converging LOE Lines */}
        <div className="flex items-center gap-2.5 px-3 py-1 border-r border-white/5">
          <div className="w-7 h-7 rounded-xl bg-amber-400/15 flex items-center justify-center text-amber-300 shrink-0 font-bold">
            ⇄
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] uppercase font-mono font-bold text-zinc-400 tracking-wider">
              Converging Lines
            </span>
            <span className="text-xs text-amber-300 font-bold font-mono">{loeCount}</span>
          </div>
        </div>

        {/* Resource Audit Strip */}
        <div className="flex items-center gap-2 px-3 py-1 border-r border-white/5">
          <span className="text-[9px] uppercase font-mono font-bold text-zinc-400 tracking-wider hidden lg:inline">
            Audit:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-[11px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> HAVE: {audit.have}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono font-bold text-[11px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> ACQ: {audit.acq}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/30 text-rose-400 font-mono font-bold text-[11px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> BLOCKED: {audit.blocked}
            </span>
          </div>
        </div>

        {/* Interactive PACE Plan Switcher */}
        <div className="flex items-center justify-between px-3 py-1 gap-2">
          <span className="text-[9px] uppercase font-mono font-bold text-zinc-400 tracking-wider">
            PACE Protocol:
          </span>
          <div className="flex items-center gap-1">
            {(["P", "A", "C", "E"] as PaceType[]).map((pace) => {
              const isActive = activePace === pace;
              const tooltips = {
                P: "Primary Plan Active",
                A: "Alternate Variant",
                C: "Contingency Minimum Floor",
                E: "Emergency Recovery Safeguard",
              };
              return (
                <button
                  key={pace}
                  onClick={() => onSelectPace(pace)}
                  className={`w-7 h-7 rounded-lg font-mono text-xs font-black transition ${
                    isActive
                      ? "bg-cyan-400 text-black shadow-md shadow-cyan-400/40 scale-105"
                      : "bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08] border border-white/5"
                  }`}
                  title={tooltips[pace]}
                >
                  {pace}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
