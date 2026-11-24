"use client";

import React, { useState, useEffect } from "react";
import { useInterval } from "@/lib/hooks/useTimers";
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Download,
  Upload,
  Search,
  Grid,
  Clock,
  Layers,
  FileSpreadsheet,
  ChevronDown,
  Timer,
  Check,
} from "lucide-react";
import { TOPOLOGY_TEMPLATES, TopologyTemplate } from "./topologyTemplates";
import { BackgroundVariant } from "@xyflow/react";

interface TopologyTopBarProps {
  onAutoLayout: (direction: "TB" | "LR") => void;
  backgroundVariant: BackgroundVariant;
  setBackgroundVariant: (v: BackgroundVariant) => void;
  onSelectTemplate: (tpl: TopologyTemplate) => void;
  onExportJson: () => void;
  onImportJson: (jsonStr: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  nodeCount: number;
  edgeCount: number;
}

export function TopologyTopBar({
  onAutoLayout,
  backgroundVariant,
  setBackgroundVariant,
  onSelectTemplate,
  onExportJson,
  onImportJson,
  searchQuery,
  setSearchQuery,
  nodeCount,
  edgeCount,
}: TopologyTopBarProps) {
  // ── 1. Sprint Timer State (Miro / Lucidspark Hallmarks) ──────────────────────
  const [timerSeconds, setTimerSeconds] = useState<number>(300); // 5 min default
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [showTimerPopover, setShowTimerPopover] = useState<boolean>(false);
  const [showTemplatesDropdown, setShowTemplatesDropdown] = useState<boolean>(false);

  useInterval(
    () => setTimerSeconds((prev) => Math.max(0, prev - 1)),
    isTimerRunning && timerSeconds > 0 ? 1000 : null
  );

  useEffect(() => {
    if (timerSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
    }
  }, [isTimerRunning, timerSeconds]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handleAddMinutes = (min: number) => {
    setTimerSeconds((prev) => prev + min * 60);
  };

  const handleResetTimer = (defaultSec: number = 300) => {
    setIsTimerRunning(false);
    setTimerSeconds(defaultSec);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) onImportJson(content);
    };
    reader.readAsText(file);
  };

  return (
    <div className="absolute top-4 left-6 right-6 z-40 flex items-center justify-between pointer-events-none">
      {/* Left: Search & Node Telemetry Badge */}
      <div className="pointer-events-auto flex items-center gap-3">
        {/* Search & Filter Bar */}
        <div className="relative flex items-center">
          <Search size={14} className="absolute left-3 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search nodes or tags..."
            className="pl-8 pr-3 py-1.5 w-52 sm:w-64 rounded-xl bg-[#0E1017]/90 backdrop-blur-xl border border-white/10 text-xs font-mono text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-sky-500 focus:w-72 transition-all shadow-lg"
          />
        </div>

        {/* Live System Count Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0E1017]/90 backdrop-blur-xl border border-white/10 text-xs font-mono text-zinc-400 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{nodeCount} Nodes</span>
          <span className="text-zinc-600">·</span>
          <span>{edgeCount} Connectors</span>
        </div>
      </div>

      {/* Right: Facilitation Controls, Sprint Timer, Tidy Layout, Templates & Export */}
      <div className="pointer-events-auto flex items-center gap-2">
        {/* ── Sprint Timer (Lucidspark & Miro Facilitation) ───────────────── */}
        <div className="relative">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0E1017]/90 backdrop-blur-xl border border-white/10 shadow-lg">
            <button
              onClick={() => setIsTimerRunning((prev) => !prev)}
              className={`p-1 rounded-lg transition-colors ${
                isTimerRunning
                  ? "bg-amber-500 text-black shadow-md shadow-amber-500/30"
                  : "bg-white/10 text-zinc-300 hover:text-white"
              }`}
              title={isTimerRunning ? "Pause Sprint Timer" : "Start Sprint Timer"}
            >
              {isTimerRunning ? <Pause size={12} /> : <Play size={12} />}
            </button>

            <span
              onClick={() => setShowTimerPopover((prev) => !prev)}
              className={`font-mono text-xs font-bold cursor-pointer tracking-wider px-1 ${
                isTimerRunning ? "text-amber-400 animate-pulse" : "text-zinc-200"
              }`}
            >
              {formatTimer(timerSeconds)}
            </span>

            <button
              onClick={() => setShowTimerPopover((prev) => !prev)}
              className="p-1 rounded text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <Timer size={13} />
            </button>
          </div>

          {showTimerPopover && (
            <div className="absolute right-0 top-11 p-3 rounded-2xl bg-[#0E1017]/95 backdrop-blur-2xl border border-white/10 shadow-2xl space-y-2.5 w-52 text-xs">
              <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                <span className="font-mono text-[10px] uppercase font-bold text-zinc-400">Sprint Timer</span>
                <button
                  onClick={() => handleResetTimer(300)}
                  className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1"
                >
                  <RotateCcw size={10} /> Reset
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1 font-mono text-[11px]">
                <button
                  onClick={() => handleResetTimer(300)}
                  className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/10 text-zinc-200"
                >
                  5 min
                </button>
                <button
                  onClick={() => handleResetTimer(900)}
                  className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/10 text-zinc-200"
                >
                  15 min
                </button>
                <button
                  onClick={() => handleResetTimer(1500)}
                  className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/10 text-zinc-200"
                >
                  25 min
                </button>
              </div>
              <div className="flex items-center gap-1 font-mono text-[11px] pt-1">
                <button
                  onClick={() => handleAddMinutes(1)}
                  className="flex-1 py-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30"
                >
                  +1m
                </button>
                <button
                  onClick={() => handleAddMinutes(5)}
                  className="flex-1 py-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30"
                >
                  +5m
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Auto-Layout / Tidy Button (Miro Cleanup Engine) ─────────────── */}
        <div className="flex items-center p-0.5 rounded-xl bg-[#0E1017]/90 backdrop-blur-xl border border-white/10 shadow-lg">
          <button
            onClick={() => onAutoLayout("TB")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
            title="Auto-Layout Hierarchical (Top to Bottom)"
          >
            <Sparkles size={13} className="text-amber-400" />
            <span className="hidden sm:inline">Tidy</span>
          </button>
          <button
            onClick={() => onAutoLayout("LR")}
            className="px-2 py-1.5 text-[10px] font-mono text-zinc-500 hover:text-zinc-300 hover:bg-white/5 rounded-md transition-colors"
            title="Auto-Layout Left to Right"
          >
            L→R
          </button>
        </div>

        {/* ── Grid Style Toggle ───────────────────────────────────────────── */}
        <button
          onClick={() => {
            if (backgroundVariant === BackgroundVariant.Dots) {
              setBackgroundVariant(BackgroundVariant.Lines);
            } else if (backgroundVariant === BackgroundVariant.Lines) {
              setBackgroundVariant(BackgroundVariant.Cross);
            } else {
              setBackgroundVariant(BackgroundVariant.Dots);
            }
          }}
          className="p-2 rounded-xl bg-[#0E1017]/90 backdrop-blur-xl border border-white/10 text-zinc-400 hover:text-white shadow-lg transition-colors"
          title={`Canvas Grid Style: ${backgroundVariant}`}
        >
          <Grid size={15} />
        </button>

        {/* ── Template Library Dropdown ───────────────────────────────────── */}
        <div className="relative">
          <button
            onClick={() => setShowTemplatesDropdown((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0E1017]/90 backdrop-blur-xl border border-white/10 text-xs font-mono text-zinc-200 hover:text-white shadow-lg transition-colors"
          >
            <Layers size={13} className="text-[#58A6FF]" />
            <span className="hidden sm:inline">Templates</span>
            <ChevronDown size={12} className="text-zinc-400" />
          </button>

          {showTemplatesDropdown && (
            <div className="absolute right-0 top-11 p-2 rounded-2xl bg-[#0E1017]/95 backdrop-blur-2xl border border-white/10 shadow-2xl space-y-1 w-72 text-xs">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold block px-2 py-1">
                Architecture Topologies
              </span>
              {TOPOLOGY_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => {
                    onSelectTemplate(tpl);
                    setShowTemplatesDropdown(false);
                  }}
                  className="w-full text-left p-2 rounded-xl hover:bg-white/[0.08] transition-colors group"
                >
                  <p className="font-semibold text-zinc-100 group-hover:text-white">
                    {tpl.name}
                  </p>
                  <p className="text-[10px] text-zinc-400 font-mono line-clamp-1">
                    {tpl.description}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Export & Import JSON ────────────────────────────────────────── */}
        <button
          onClick={onExportJson}
          className="p-2 rounded-xl bg-[#0E1017]/90 backdrop-blur-xl border border-white/10 text-zinc-400 hover:text-white shadow-lg transition-colors"
          title="Export Canvas Topology (JSON)"
        >
          <Download size={15} />
        </button>

        <label
          className="p-2 rounded-xl bg-[#0E1017]/90 backdrop-blur-xl border border-white/10 text-zinc-400 hover:text-white shadow-lg transition-colors cursor-pointer"
          title="Import Canvas Topology (JSON)"
        >
          <Upload size={15} />
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
}
