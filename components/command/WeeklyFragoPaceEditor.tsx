"use client";

import React, { useState } from "react";
import { CommandFrago, PaceTier, LifeDomain } from "@/lib/commandTypes";
import { useSafeTimeout } from "@/lib/hooks/useTimers";
import {
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Save,
  Send,
  Sparkles,
  Zap,
  CheckCircle2,
} from "lucide-react";

interface WeeklyFragoPaceEditorProps {
  domain: LifeDomain;
  frago: CommandFrago | null;
  weekStartDate: string;
  onSaveFrago: (fragoData: Partial<CommandFrago>) => void;
  onSwitchPace: (domain: LifeDomain, paceTier: PaceTier) => void;
  onPushToPms: (taskTitles: string[], domain: LifeDomain, sequenceType: string) => void;
}

const PACE_TIERS: Array<{
  id: PaceTier;
  label: string;
  sublabel: string;
  color: string;
  borderClass: string;
  bgClass: string;
}> = [
  {
    id: "primary",
    label: "P",
    sublabel: "Primary Plan",
    color: "#10b981",
    borderClass: "border-emerald-500/40 text-emerald-300",
    bgClass: "bg-emerald-500/20",
  },
  {
    id: "alternate",
    label: "A",
    sublabel: "Alternate Plan",
    color: "#38bdf8",
    borderClass: "border-sky-500/40 text-sky-300",
    bgClass: "bg-sky-500/20",
  },
  {
    id: "contingency",
    label: "C",
    sublabel: "Contingency Plan",
    color: "#f59e0b",
    borderClass: "border-amber-500/40 text-amber-300",
    bgClass: "bg-amber-500/20",
  },
  {
    id: "emergency",
    label: "E",
    sublabel: "Emergency Protocol",
    color: "#f43f5e",
    borderClass: "border-rose-500/40 text-rose-300",
    bgClass: "bg-rose-500/20",
  },
];

export function WeeklyFragoPaceEditor({
  domain,
  frago,
  weekStartDate,
  onSaveFrago,
  onSwitchPace,
  onPushToPms,
}: WeeklyFragoPaceEditorProps) {
  const activePace = frago?.active_pace_tier || "primary";

  const [activeTab, setActiveTab] = useState<PaceTier>(activePace);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [situation, setSituation] = useState(frago?.situation || "");
  const [mission, setMission] = useState(frago?.mission || "");
  const [execution, setExecution] = useState(frago?.execution || "");
  const [sustainment, setSustainment] = useState(frago?.sustainment || "");
  const [commandSignal, setCommandSignal] = useState(frago?.command_signal || "");
  const [pacePlans, setPacePlans] = useState(
    frago?.pace_plans || { primary: "", alternate: "", contingency: "", emergency: "" }
  );

  const [isSaved, setIsSaved] = useState(false);
  const [pmsPushedToast, setPmsPushedToast] = useState(false);

  const scheduleTimeout = useSafeTimeout();

  const handlePaceSelect = (tier: PaceTier) => {
    setActiveTab(tier);
    onSwitchPace(domain, tier);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveFrago({
      domain,
      week_start_date: weekStartDate,
      situation,
      mission,
      execution,
      sustainment,
      command_signal: commandSignal,
      active_pace_tier: activeTab,
      pace_plans: pacePlans,
    });
    setIsSaved(true);
    scheduleTimeout(() => setIsSaved(false), 2000);
  };

  const handlePushExecutionTasks = () => {
    // Extract bullet points or lines from execution paragraph
    const lines = (execution || "")
      .split("\n")
      .map((l) => l.replace(/^[-*•\d.)\s]+/, "").trim())
      .filter((l) => l.length > 3);

    if (lines.length === 0) {
      alert("No bullet points found in paragraph 3 (Execution). Add action items line by line first.");
      return;
    }

    onPushToPms(lines, domain, "bottleneck");
    setPmsPushedToast(true);
    scheduleTimeout(() => setPmsPushedToast(false), 2400);
  };

  return (
    <div className="w-[360px] shrink-0 rounded-2xl bg-zinc-950/70 border border-white/10 shadow-2xl backdrop-blur-xl flex flex-col justify-between overflow-hidden font-mono text-xs">
      <div>
        {/* Top Header */}
        <div className="p-3.5 border-b border-white/10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                Weekly FRAGO & PACE
              </span>
              <span className="text-[10px] text-zinc-500 font-normal">({weekStartDate})</span>
            </div>
            <div className="text-[10px] text-zinc-400 capitalize">{domain} Theater of Ops</div>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded text-zinc-400 hover:text-white"
          >
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* 4-Tab Interactive PACE Plan Switcher */}
        <div className="p-3 border-b border-white/10 space-y-2 bg-zinc-950/40">
          <div className="flex items-center justify-between text-[10px] text-zinc-400">
            <span className="uppercase tracking-wider font-semibold">PACE Tier Protocol</span>
            <span className="text-zinc-500">Tap to engage mode</span>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {PACE_TIERS.map((tier) => {
              const isCurrent = activeTab === tier.id;
              return (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => handlePaceSelect(tier.id)}
                  className={`py-1.5 px-2 rounded-xl text-center border font-bold transition flex flex-col items-center justify-center ${
                    isCurrent
                      ? `${tier.bgClass} ${tier.borderClass} shadow-md`
                      : "bg-zinc-900/60 border-white/5 text-zinc-500 hover:text-zinc-300 hover:border-white/10"
                  }`}
                  title={tier.sublabel}
                >
                  <span className="text-sm font-black">{tier.label}</span>
                  <span className="text-[9px] uppercase tracking-tighter truncate w-full">
                    {tier.id.slice(0, 4)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active PACE Plan Detail */}
          <div className="pt-1">
            <input
              type="text"
              placeholder={`Active plan for ${activeTab.toUpperCase()} mode...`}
              value={pacePlans[activeTab] || ""}
              onChange={(e) =>
                setPacePlans({ ...pacePlans, [activeTab]: e.target.value })
              }
              className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-white text-xs font-sans placeholder-zinc-600 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Collapsible 5-Paragraph FRAGO Accordion */}
        {isExpanded && (
          <form onSubmit={handleSave} className="p-3.5 space-y-3">
            {/* 1. Situation */}
            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">
                1. Situation (Current Constraints & Environment)
              </label>
              <textarea
                rows={2}
                placeholder="What is our operational reality this week..."
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900/90 border border-white/10 text-white text-xs font-sans placeholder-zinc-600 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* 2. Mission */}
            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">
                2. Mission (Exact Target to Strike)
              </label>
              <textarea
                rows={2}
                placeholder="Sovereign objective for the next 7 days..."
                value={mission}
                onChange={(e) => setMission(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900/90 border border-white/10 text-white text-xs font-sans placeholder-zinc-600 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* 3. Execution (Actionable Tasks to Push to PMS) */}
            <div>
              <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">
                <span>3. Execution (Action Items)</span>
                <span className="text-zinc-500 font-normal">1 bullet per line</span>
              </div>
              <textarea
                rows={3}
                placeholder="• Complete 7-day caloric deficit&#10;• Ship Command Center UI&#10;• Review weekly AAR"
                value={execution}
                onChange={(e) => setExecution(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900/90 border border-white/10 text-white text-xs font-sans placeholder-zinc-600 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* 4. Sustainment */}
            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">
                4. Sustainment (Fuel, Rest, Resources)
              </label>
              <textarea
                rows={1}
                placeholder="165g protein, 120oz water, 7.5h sleep..."
                value={sustainment}
                onChange={(e) => setSustainment(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900/90 border border-white/10 text-white text-xs font-sans placeholder-zinc-600 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* 5. Command & Signal */}
            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">
                5. Command & Signal (Non-Negotiable Rules)
              </label>
              <textarea
                rows={1}
                placeholder="Never skip twice. Zero dummy data."
                value={commandSignal}
                onChange={(e) => setCommandSignal(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900/90 border border-white/10 text-white text-xs font-sans placeholder-zinc-600 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={handlePushExecutionTasks}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 text-[11px] font-bold active:scale-95 transition"
                title="Push bullets from Execution directly to Pristine PMS"
              >
                {pmsPushedToast ? (
                  <>
                    <CheckCircle2 size={12} className="text-emerald-400" />
                    <span>PUSHED TO PMS!</span>
                  </>
                ) : (
                  <>
                    <Send size={12} />
                    <span>PUSH TASKS TO PMS</span>
                  </>
                )}
              </button>

              <button
                type="submit"
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-[11px] active:scale-95 transition"
              >
                <Save size={12} />
                <span>{isSaved ? "SAVED!" : "SAVE FRAGO"}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2.5 bg-zinc-950/60 border-t border-white/10 text-[10px] text-zinc-500 flex items-center justify-between">
        <span>Active PACE: <span className="text-zinc-200 font-bold uppercase">{activeTab}</span></span>
        <span className="text-emerald-400 font-bold">5-Paragraph FRAGO</span>
      </div>
    </div>
  );
}
